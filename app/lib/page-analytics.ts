import { createHash } from 'crypto';
import {
  PUBLIC_PAGE_LABELS,
  PUBLIC_PAGE_PATHS,
  getPublicPageLabel,
  isPublicPagePath,
  normalizePagePath,
  type PublicPagePath,
} from '@/app/lib/page-analytics-public';
import { prisma } from '@/app/lib/prisma';

export {
  PUBLIC_PAGE_LABELS,
  PUBLIC_PAGE_PATHS,
  getPublicPageLabel,
  isPublicPagePath,
  normalizePagePath,
  type PublicPagePath,
};

/** Crawlers only — not in-app browsers (WhatsApp, Facebook, Instagram, etc.) */
const BOT_PATTERN =
  /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|applebot|petalbot|semrush|ahrefsbot|mj12bot|dotbot|rogerbot|headlesschrome|lighthouse|pagespeed|gptbot|claudebot|bytespider/i;

const DEDUP_MINUTES = 10;

function hashIp(ip: string) {
  const salt = process.env.SESSION_SECRET?.trim() || 'thecode2-analytics';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

function getClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || null;
}

export function resolveVisitGeo(headers: Headers) {
  const country =
    headers.get('x-vercel-ip-country')?.trim() ||
    headers.get('cf-ipcountry')?.trim() ||
    null;
  const city =
    headers.get('x-vercel-ip-city')?.trim() || headers.get('cf-ipcity')?.trim() || null;
  const region =
    headers.get('x-vercel-ip-country-region')?.trim() ||
    headers.get('cf-region')?.trim() ||
    null;

  return { country, city, region };
}

function isBot(userAgent: string | null) {
  if (!userAgent) return false;
  return BOT_PATTERN.test(userAgent);
}

export async function recordPageVisit(params: {
  path: string;
  headers: Headers;
  referrer?: string | null;
}) {
  const path = normalizePagePath(params.path);
  if (!isPublicPagePath(path)) return false;
  if (isBot(params.headers.get('user-agent'))) return false;

  const ip = getClientIp(params.headers);
  const ipHash = ip ? hashIp(ip) : null;
  const geo = resolveVisitGeo(params.headers);

  if (ipHash) {
    const since = new Date(Date.now() - DEDUP_MINUTES * 60 * 1000);
    const recent = await prisma.pageVisit.findFirst({
      where: {
        path,
        ipHash,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (recent) return false;
  }

  await prisma.pageVisit.create({
    data: {
      path,
      country: geo.country,
      city: geo.city,
      region: geo.region,
      ipHash,
      referrer: params.referrer?.slice(0, 500) || null,
      userAgent: params.headers.get('user-agent')?.slice(0, 300) || null,
    },
  });

  return true;
}

function lastNDays(n: number) {
  const days: { date: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    });
  }
  return days;
}

const COUNTRY_LABELS: Record<string, string> = {
  TG: 'Togo',
  BJ: 'Bénin',
  CI: "Côte d'Ivoire",
  SN: 'Sénégal',
  FR: 'France',
  US: 'États-Unis',
  GB: 'Royaume-Uni',
  DE: 'Allemagne',
  CA: 'Canada',
  NG: 'Nigeria',
  GH: 'Ghana',
  BF: 'Burkina Faso',
  ML: 'Mali',
  NE: 'Niger',
};

export function formatCountryLabel(code: string | null) {
  if (!code) return 'Inconnu';
  const upper = code.toUpperCase();
  return COUNTRY_LABELS[upper] ? `${COUNTRY_LABELS[upper]} (${upper})` : upper;
}

export async function getPageVisitStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setHours(0, 0, 0, 0);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [totalVisits, visitsLast30Days, byPath, byCountry, byLocation, recentVisits] =
    await Promise.all([
      prisma.pageVisit.count(),
      prisma.pageVisit.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.pageVisit.groupBy({
        by: ['path'],
        _count: { _all: true },
      }),
      prisma.pageVisit.groupBy({
        by: ['country'],
        _count: { _all: true },
        where: { country: { not: null } },
      }),
      prisma.pageVisit.groupBy({
        by: ['country', 'city', 'region'],
        _count: { _all: true },
        where: { OR: [{ city: { not: null } }, { country: { not: null } }] },
      }),
      prisma.pageVisit.findMany({
        where: { createdAt: { gte: fourteenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

  const dayBuckets = lastNDays(14);
  const visitsByDay = dayBuckets.map((day) => ({
    ...day,
    count: recentVisits.filter((v) => v.createdAt.toISOString().startsWith(day.date)).length,
  }));

  const maxPathCount = Math.max(1, ...byPath.map((row) => row._count._all));

  return {
    overview: {
      totalVisits,
      visitsLast30Days,
    },
    byPage: PUBLIC_PAGE_PATHS.map((path) => {
      const row = byPath.find((item) => item.path === path);
      return {
        path,
        label: PUBLIC_PAGE_LABELS[path],
        count: row?._count._all ?? 0,
      };
    }).sort((a, b) => b.count - a.count),
    byCountry: byCountry
      .map((row) => ({
        country: row.country!,
        label: formatCountryLabel(row.country),
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    byLocation: byLocation
      .map((row) => {
        const parts = [row.city, row.region, row.country].filter(Boolean);
        const location = parts.length > 0 ? parts.join(', ') : 'Inconnu';
        return {
          country: row.country,
          city: row.city,
          region: row.region,
          location,
          count: row._count._all,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    visitsByDay,
    maxPathCount,
  };
}
