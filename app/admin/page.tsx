'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DOMAINS,
  DURATIONS,
  FORMATION_SESSIONS,
  HOUR_SLOTS,
  WEEK_DAYS,
} from '@/app/lib/formation-config';

type EnrollmentStatus = 'pending_payment' | 'paid' | 'cancelled';
type PaymentMethod = 'stripe' | 'fedapay' | 'crypto';

type EnrollmentRow = {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  address: string;
  passportPhotoUrl: string;
  domain: string;
  formationSession: string;
  duration: string;
  scheduleDays: string[];
  scheduleHours: string;
  amountUsd: number;
  amountXof: number;
  status: EnrollmentStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  createdAt: string;
  user: { email: string; emailVerified: boolean; createdAt: string };
};

type Stats = {
  enrollments: Record<EnrollmentStatus, number>;
  totalEnrollments: number;
  totalUsers: number;
  paidLast30Days: number;
};

const STATUS_FILTERS: { id: 'all' | EnrollmentStatus; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending_payment', label: 'En attente' },
  { id: 'paid', label: 'Payées' },
  { id: 'cancelled', label: 'Annulées' },
];

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending_payment: 'En attente',
  paid: 'Payée',
  cancelled: 'Annulée',
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  stripe: 'Stripe',
  fedapay: 'FedaPay',
  crypto: 'Crypto',
};

function labelForDomain(id: string) {
  return DOMAINS.find((d) => d.id === id)?.label ?? id;
}

function labelForDuration(id: string) {
  return DURATIONS.find((d) => d.id === id)?.label ?? id;
}

function labelForSession(id: string) {
  const session = FORMATION_SESSIONS.find((s) => s.id === id);
  return session ? `${session.label} (${session.period})` : id;
}

function labelForDays(days: string[]) {
  return days
    .map((d) => WEEK_DAYS.find((w) => w.id === d)?.label ?? d)
    .join(', ');
}

function labelForHours(id: string) {
  return HOUR_SLOTS.find((h) => h.id === id)?.label ?? id;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const styles = {
    pending_payment: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    paid: 'bg-green-400/15 text-green-300 border-green-400/30',
    cancelled: 'bg-red-400/15 text-red-300 border-red-400/30',
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium sm:text-xs ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [filter, setFilter] = useState<'all' | EnrollmentStatus>('all');
  const [selected, setSelected] = useState<EnrollmentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusQuery = filter === 'all' ? '' : `?status=${filter}`;
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch(`/api/admin/enrollments${statusQuery}`, { credentials: 'include' }),
      ]);
      if (!statsRes.ok || !listRes.ok) throw new Error('Accès admin refusé');
      setStats(await statsRes.json());
      const listData = await listRes.json();
      setEnrollments(listData.enrollments);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: EnrollmentStatus) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Mise à jour impossible');
      setSelected(data.enrollment);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-5 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
            Administration
          </p>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Espace admin</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Gérez les inscriptions et suivez les paiements.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
        >
          ← Retour au site
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:text-sm">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: 'Inscriptions', value: stats.totalEnrollments },
            { label: 'Payées', value: stats.enrollments.paid },
            { label: 'En attente', value: stats.enrollments.pending_payment },
            { label: 'Comptes', value: stats.totalUsers },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:rounded-xl sm:p-4"
            >
              <p className="text-[11px] text-slate-500 sm:text-xs">{card.label}</p>
              <p className="text-lg font-bold text-white sm:text-2xl">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              filter === f.id
                ? 'bg-brand-500 text-white'
                : 'border border-white/10 text-slate-400 hover:bg-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-white/10">
            {loading ? (
              <p className="p-6 text-sm text-slate-400">Chargement…</p>
            ) : enrollments.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">Aucune inscription.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Candidat</th>
                      <th className="px-3 py-2.5 font-medium">Parcours</th>
                      <th className="px-3 py-2.5 font-medium">Statut</th>
                      <th className="px-3 py-2.5 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelected(row)}
                        className={`cursor-pointer border-b border-white/5 transition hover:bg-white/[0.04] ${
                          selected?.id === row.id ? 'bg-brand-400/10' : ''
                        }`}
                      >
                        <td className="px-3 py-3">
                          <p className="font-medium text-white">
                            {row.firstName} {row.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 sm:text-xs">{row.user.email}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {labelForDomain(row.domain)}
                          <span className="block text-[11px] text-slate-500">
                            {labelForDuration(row.duration)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3 text-slate-400">{formatDate(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white sm:text-lg">
                    {selected.firstName} {selected.lastName}
                  </h2>
                  <p className="text-xs text-slate-400">{selected.user.email}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="mb-4 overflow-hidden rounded-lg border border-white/10">
                <Image
                  src={selected.passportPhotoUrl}
                  alt="Photo passeport"
                  width={400}
                  height={300}
                  className="h-40 w-full object-cover sm:h-48"
                  unoptimized
                />
              </div>

              <dl className="space-y-2 text-xs sm:text-sm">
                <Row label="Téléphone" value={selected.phone} />
                <Row label="Pays" value={selected.country} />
                <Row label="Adresse" value={selected.address} />
                <Row label="Domaine" value={labelForDomain(selected.domain)} />
                <Row label="Session" value={labelForSession(selected.formationSession)} />
                <Row label="Durée" value={labelForDuration(selected.duration)} />
                <Row label="Planning" value={`${labelForDays(selected.scheduleDays)} — ${labelForHours(selected.scheduleHours)}`} />
                <Row
                  label="Paiement"
                  value={
                    selected.paymentMethod
                      ? `${PAYMENT_LABELS[selected.paymentMethod]} — ${selected.amountUsd} $ / ${selected.amountXof.toLocaleString('fr-FR')} FCFA`
                      : '—'
                  }
                />
                <Row label="Inscrit le" value={formatDate(selected.createdAt)} />
                <Row label="Payé le" value={formatDate(selected.paidAt)} />
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                {selected.status !== 'paid' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(selected.id, 'paid')}
                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 sm:text-sm"
                  >
                    Marquer payée
                  </button>
                )}
                {selected.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(selected.id, 'cancelled')}
                    className="rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50 sm:text-sm"
                  >
                    Annuler
                  </button>
                )}
                {selected.status !== 'pending_payment' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(selected.id, 'pending_payment')}
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50 sm:text-sm"
                  >
                    En attente
                  </button>
                )}
              </div>

              <a
                href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-xs text-brand-400 hover:underline sm:text-sm"
              >
                Contacter sur WhatsApp
              </a>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
              Sélectionnez une inscription pour voir le détail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-slate-500">{label}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  );
}
