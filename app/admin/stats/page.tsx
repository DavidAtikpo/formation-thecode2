'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';
import { formatUsd } from '@/app/lib/formation-config';

type BreakdownItem = { id: string; label: string; count: number };
type SessionItem = BreakdownItem & { period: string };
type PaymentItem = { id: string; label: string; count: number; amountUsd: number };
type DayItem = { date: string; label: string; count: number };

type DashboardStats = {
  overview: {
    totalUsers: number;
    verifiedUsers: number;
    totalEnrollments: number;
    activeCandidates: number;
    paidComplete: number;
    pendingRegistration: number;
    awaitingFormation: number;
    cancelled: number;
    paidLast30Days: number;
    newEnrollmentsLast30Days: number;
    registrationPaidCount: number;
    formationPaidCount: number;
    certificatesIssued: number;
    receiptsCount: number;
    resourcesPublished: number;
    resourceDeliveries: number;
  };
  revenue: {
    registrationUsd: number;
    formationUsd: number;
    totalUsd: number;
  };
  byStatus: (BreakdownItem & { label: string })[];
  byDomain: BreakdownItem[];
  byDuration: BreakdownItem[];
  bySession: SessionItem[];
  byPaymentMethod: PaymentItem[];
  enrollmentsByDay: DayItem[];
  generatedAt: string;
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Accès refusé');
      setStats(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const maxDayCount = Math.max(1, ...(stats?.enrollmentsByDay.map((d) => d.count) ?? [1]));

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-5 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
            Administration
          </p>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Statistiques</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Vue d&apos;ensemble des inscriptions, paiements et activité.
          </p>
          {stats && (
            <p className="mt-1 text-[10px] text-slate-600">
              Mis à jour le{' '}
              {new Date(stats.generatedAt).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
        <AdminNav active="stats" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <LoadingState message="Chargement des statistiques…" />
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
            <KpiCard label="Comptes" value={stats.overview.totalUsers} sub={`${stats.overview.verifiedUsers} vérifiés`} />
            <KpiCard label="Inscriptions" value={stats.overview.totalEnrollments} sub={`${stats.overview.newEnrollmentsLast30Days} / 30 j`} />
            <KpiCard label="Actifs" value={stats.overview.activeCandidates} sub="inscrits + complets" />
            <KpiCard label="Complets" value={stats.overview.paidComplete} sub={`${stats.overview.paidLast30Days} / 30 j`} />
            <KpiCard label="En attente" value={stats.overview.pendingRegistration} sub="inscription" />
            <KpiCard label="Formation due" value={stats.overview.awaitingFormation} sub="frais formation" />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 lg:col-span-1">
              <h2 className="mb-4 text-sm font-semibold text-white">Revenus encaissés</h2>
              <p className="text-3xl font-bold text-brand-300">
                {formatUsd(stats.revenue.totalUsd)} <span className="text-lg text-slate-400">$</span>
              </p>
              <dl className="mt-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-400">
                  <dt>Inscriptions</dt>
                  <dd className="text-slate-200">{formatUsd(stats.revenue.registrationUsd)} $</dd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <dt>Formations</dt>
                  <dd className="text-slate-200">{formatUsd(stats.revenue.formationUsd)} $</dd>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-slate-400">
                  <dt>Reçus émis</dt>
                  <dd className="text-slate-200">{stats.overview.receiptsCount}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-white">Paiements par méthode</h2>
              {stats.byPaymentMethod.length === 0 ? (
                <p className="text-xs text-slate-500">Aucun paiement enregistré.</p>
              ) : (
                <div className="space-y-3">
                  {stats.byPaymentMethod.map((item) => (
                    <div key={item.id}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="text-slate-400">
                          {item.count} paiement{item.count > 1 ? 's' : ''} — {formatUsd(item.amountUsd)} $
                        </span>
                      </div>
                      <Bar
                        value={item.amountUsd}
                        max={stats.revenue.totalUsd || 1}
                        color="bg-brand-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Inscriptions — 14 derniers jours</h2>
            <div className="flex items-end gap-1 sm:gap-2" style={{ minHeight: 120 }}>
              {stats.enrollmentsByDay.map((day) => (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-slate-400">{day.count || ''}</span>
                  <div
                    className="w-full rounded-t bg-brand-500/80 transition-all"
                    style={{
                      height: `${Math.max(4, (day.count / maxDayCount) * 96)}px`,
                      opacity: day.count > 0 ? 1 : 0.2,
                    }}
                  />
                  <span className="hidden text-[9px] text-slate-600 sm:block">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-600 sm:hidden">
              <span>{stats.enrollmentsByDay[0]?.label}</span>
              <span>{stats.enrollmentsByDay.at(-1)?.label}</span>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <BreakdownCard title="Par statut" items={stats.byStatus} />
            <BreakdownCard title="Par domaine" items={stats.byDomain} />
            <BreakdownCard title="Par durée" items={stats.byDuration} />
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Par session</h2>
              <div className="space-y-3">
                {stats.bySession.map((item) => (
                  <div key={item.id}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="shrink-0 text-slate-400">{item.count}</span>
                    </div>
                    <p className="mb-1 text-[10px] text-slate-600">{item.period}</p>
                    <Bar
                      value={item.count}
                      max={Math.max(1, ...stats.bySession.map((s) => s.count))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <KpiCard
              label="Inscriptions payées"
              value={stats.overview.registrationPaidCount}
              sub="frais d'inscription"
            />
            <KpiCard
              label="Formations payées"
              value={stats.overview.formationPaidCount}
              sub="frais de formation"
            />
            <KpiCard label="Certificats" value={stats.overview.certificatesIssued} sub="publiés" />
            <KpiCard
              label="Contenus envoyés"
              value={stats.overview.resourceDeliveries}
              sub={`${stats.overview.resourcesPublished} publiés`}
            />
          </section>
        </div>
      )}
    </div>
  );
}

function AdminNav({ active }: { active: 'inscriptions' | 'stats' | 'notifications' | 'cours' }) {
  const links = [
    { id: 'inscriptions' as const, href: '/admin', label: 'Inscriptions' },
    { id: 'stats' as const, href: '/admin/stats', label: 'Statistiques' },
    { id: 'notifications' as const, href: '/admin/notifications', label: 'Notifications' },
    { id: 'cours' as const, href: '/admin/cours', label: 'Cours' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={`rounded-lg px-3 py-2 text-xs sm:text-sm ${
            active === link.id
              ? 'border border-brand-400/40 bg-brand-400/10 font-medium text-brand-200'
              : 'border border-white/15 text-slate-300 hover:bg-white/5'
          }`}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/"
        className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
      >
        ← Site
      </Link>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:rounded-xl sm:p-4">
      <p className="text-[10px] text-slate-500 sm:text-xs">{label}</p>
      <p className="text-xl font-bold text-white sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">{sub}</p>}
    </div>
  );
}

function Bar({
  value,
  max,
  color = 'bg-brand-400',
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/5">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function BreakdownCard({ title, items }: { title: string; items: BreakdownItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-300">{item.label}</span>
              <span className="text-slate-400">{item.count}</span>
            </div>
            <Bar value={item.count} max={max} />
          </div>
        ))}
      </div>
    </div>
  );
}
