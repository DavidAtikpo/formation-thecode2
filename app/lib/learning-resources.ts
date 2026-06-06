import type {
  FormationDomain,
  FormationDuration,
  FormationSession,
  LearningResourceType,
} from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import {
  DOMAINS,
  DURATIONS,
  FORMATION_SESSIONS,
  type DomainId,
  type DurationId,
  type SessionId,
} from '@/app/lib/formation-config';

export type ResourceAudience = {
  domain?: FormationDomain | null;
  formationSession?: FormationSession | null;
  duration?: FormationDuration | null;
};

export function labelResourceType(type: LearningResourceType) {
  if (type === 'course_pdf') return 'Cours PDF';
  return 'Tutoriel';
}

export function matchesAudience(
  enrollment: {
    domain: FormationDomain;
    formationSession: FormationSession;
    duration: FormationDuration;
    status: string;
  },
  audience: ResourceAudience,
) {
  if (!['active', 'paid'].includes(enrollment.status)) return false;
  if (audience.domain && enrollment.domain !== audience.domain) return false;
  if (audience.formationSession && enrollment.formationSession !== audience.formationSession) {
    return false;
  }
  if (audience.duration && enrollment.duration !== audience.duration) return false;
  return true;
}

export async function findMatchingEnrollments(audience: ResourceAudience) {
  const enrollments = await prisma.enrollment.findMany({
    where: { status: { in: ['active', 'paid'] } },
    include: { user: { select: { email: true } } },
  });

  return enrollments.filter((enrollment) => matchesAudience(enrollment, audience));
}

export function serializeResource(resource: {
  id: string;
  title: string;
  description: string | null;
  type: LearningResourceType;
  fileUrl: string | null;
  externalUrl: string | null;
  domain: FormationDomain | null;
  formationSession: FormationSession | null;
  duration: FormationDuration | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { deliveries: number };
}) {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    typeLabel: labelResourceType(resource.type),
    fileUrl: resource.fileUrl,
    externalUrl: resource.externalUrl,
    domain: resource.domain,
    domainLabel: resource.domain
      ? (DOMAINS.find((d) => d.id === resource.domain)?.label ?? resource.domain)
      : 'Tous les domaines',
    formationSession: resource.formationSession,
    sessionLabel: resource.formationSession
      ? (FORMATION_SESSIONS.find((s) => s.id === resource.formationSession)?.label ??
        resource.formationSession)
      : 'Toutes les sessions',
    duration: resource.duration,
    durationLabel: resource.duration
      ? (DURATIONS.find((d) => d.id === resource.duration)?.label ?? resource.duration)
      : 'Toutes les durées',
    published: resource.published,
    publishedAt: resource.publishedAt?.toISOString() ?? null,
    deliveryCount: resource._count?.deliveries ?? 0,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  };
}

export function parseResourceAudience(body: Record<string, unknown>): ResourceAudience {
  const validDomains = DOMAINS.map((d) => d.id);
  const validSessions = FORMATION_SESSIONS.map((s) => s.id);
  const validDurations = DURATIONS.map((d) => d.id);

  const domain =
    typeof body.domain === 'string' && validDomains.includes(body.domain as DomainId)
      ? (body.domain as FormationDomain)
      : null;
  const formationSession =
    typeof body.formationSession === 'string' &&
    validSessions.includes(body.formationSession as SessionId)
      ? (body.formationSession as FormationSession)
      : null;
  const duration =
    typeof body.duration === 'string' && validDurations.includes(body.duration as DurationId)
      ? (body.duration as FormationDuration)
      : null;

  return { domain, formationSession, duration };
}

export function validateResourcePayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() || null : null;
  const type = body.type;
  const fileUrl = typeof body.fileUrl === 'string' ? body.fileUrl.trim() || null : null;
  const filePublicId =
    typeof body.filePublicId === 'string' ? body.filePublicId.trim() || null : null;
  const externalUrl =
    typeof body.externalUrl === 'string' ? body.externalUrl.trim() || null : null;

  if (!title || title.length < 3) {
    return { ok: false as const, error: 'Titre requis (3 caractères minimum)' };
  }

  if (type !== 'course_pdf' && type !== 'tutorial') {
    return { ok: false as const, error: 'Type invalide' };
  }

  if (type === 'course_pdf' && !fileUrl) {
    return { ok: false as const, error: 'Un fichier PDF est requis pour un cours' };
  }

  if (type === 'tutorial' && !fileUrl && !externalUrl) {
    return { ok: false as const, error: 'Ajoutez un PDF ou un lien pour le tutoriel' };
  }

  if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
    return { ok: false as const, error: 'Lien externe invalide' };
  }

  return {
    ok: true as const,
    data: {
      title,
      description,
      type: type as LearningResourceType,
      fileUrl,
      filePublicId,
      externalUrl,
      audience: parseResourceAudience(body),
    },
  };
}
