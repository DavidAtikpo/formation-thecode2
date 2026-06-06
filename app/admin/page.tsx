'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';
import {
  DOMAINS,
  DURATIONS,
  FORMATION_SESSIONS,
  HOUR_SLOTS,
  WEEK_DAYS,
  formatUsd,
} from '@/app/lib/formation-config';

type EnrollmentStatus = 'pending_payment' | 'active' | 'paid' | 'cancelled';
type PaymentMethod = 'stripe' | 'fedapay' | 'crypto';

type ReceiptRow = {
  id: string;
  receiptNumber: string;
  phase: 'registration' | 'formation';
  amountUsd: number;
  amountXof: number;
  paymentMethod: PaymentMethod;
  reference: string | null;
  paidAt: string;
  emailSentAt: string | null;
};

type EnrollmentRow = {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  address: string;
  passportPhotoUrl: string | null;
  identityDocumentType: 'id_card' | 'passport' | null;
  identityDocumentUrl: string | null;
  identityVerificationStatus: 'pending' | 'verified' | 'failed' | 'expired';
  identityVerifiedAt: string | null;
  identityExpiryDate: string | null;
  identityExtractedName: string | null;
  identityVerificationError: string | null;
  domain: string;
  formationSession: string;
  duration: string;
  scheduleDays: string[];
  scheduleHours: string;
  acceptedPrivacy?: boolean;
  amountUsd: number;
  amountXof: number;
  status: EnrollmentStatus;
  paymentMethod: PaymentMethod | null;
  formationPaymentMethod: PaymentMethod | null;
  registrationFeeUsd?: number;
  formationFeeUsd?: number;
  stripeSessionId: string | null;
  fedapayTransactionId: string | null;
  cryptoInvoiceId: string | null;
  formationStripeSessionId: string | null;
  formationFedapayTransactionId: string | null;
  formationCryptoInvoiceId: string | null;
  registrationPaidAt: string | null;
  formationPaidAt: string | null;
  paidAt: string | null;
  certificateUrl: string | null;
  certificateIssuedAt: string | null;
  certificateNumber: string | null;
  certificateSignedBy: string | null;
  skillLevel: 'beginner' | 'experienced' | null;
  yearsExperience: number | null;
  masteredTechnologies: string[];
  skillProfileCompletedAt: string | null;
  skillProfile: {
    completed: boolean;
    skillLevel: 'beginner' | 'experienced' | null;
    yearsExperience: number | null;
    masteredTechnologies: string[];
    completedAt: string | null;
    summary: string;
  };
  createdAt: string;
  updatedAt?: string;
  user: { email: string; emailVerified: boolean; createdAt: string };
  grades?: { id: string; title: string; score: number; maxScore: number; comment: string | null }[];
  receipts?: ReceiptRow[];
};

type Stats = {
  overview: {
    totalUsers: number;
    totalEnrollments: number;
    paidComplete: number;
    pendingRegistration: number;
    paidLast30Days: number;
    skillProfilesCompleted: number;
    skillProfilesIncomplete: number;
    skillProfilesBeginner: number;
    skillProfilesExperienced: number;
  };
};

type ProfileFilter = 'all' | 'incomplete' | 'complete' | 'beginner' | 'experienced';

const STATUS_FILTERS: { id: 'all' | EnrollmentStatus; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending_payment', label: 'En attente inscription' },
  { id: 'active', label: 'Inscrits (formation due)' },
  { id: 'paid', label: 'Complets' },
  { id: 'cancelled', label: 'Annulées' },
];

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending_payment: 'En attente inscription',
  active: 'Inscrit — formation due',
  paid: 'Complet',
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

function paymentSummary(row: EnrollmentRow) {
  if (row.registrationPaidAt && row.formationPaidAt) return 'Complet';
  if (row.registrationPaidAt) return 'Formation due';
  return 'Inscription due';
}

function paymentReference(
  enrollment: EnrollmentRow,
  phase: 'registration' | 'formation',
): string | null {
  if (phase === 'registration') {
    return (
      enrollment.stripeSessionId ??
      enrollment.fedapayTransactionId ??
      enrollment.cryptoInvoiceId
    );
  }
  return (
    enrollment.formationStripeSessionId ??
    enrollment.formationFedapayTransactionId ??
    enrollment.formationCryptoInvoiceId
  );
}

const PHASE_LABELS: Record<'registration' | 'formation', string> = {
  registration: "Frais d'inscription",
  formation: 'Frais de formation',
};

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const styles = {
    pending_payment: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    active: 'bg-brand-400/15 text-brand-300 border-brand-400/30',
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
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>('all');
  const [selected, setSelected] = useState<EnrollmentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradeTitle, setGradeTitle] = useState('');
  const [gradeScore, setGradeScore] = useState('');
  const [signedBy, setSignedBy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (filter !== 'all') query.set('status', filter);
      if (profileFilter !== 'all') query.set('skillProfile', profileFilter);
      const listQuery = query.toString() ? `?${query}` : '';
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch(`/api/admin/enrollments${listQuery}`, { credentials: 'include' }),
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
  }, [filter, profileFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selected) {
      setSignedBy(selected.certificateSignedBy ?? '');
    }
  }, [selected?.id, selected?.certificateSignedBy]);

  const selectEnrollment = async (row: EnrollmentRow) => {
    setSelected(row);
    try {
      const res = await fetch(`/api/admin/enrollments/${row.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelected(data.enrollment);
      }
    } catch {
      /* garde la ligne liste */
    }
  };

  const addGrade = async (id: string) => {
    const score = Number(gradeScore);
    if (!gradeTitle.trim() || !Number.isFinite(score)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}/grades`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: gradeTitle, score, maxScore: 20 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');
      setGradeTitle('');
      setGradeScore('');
      const detail = await fetch(`/api/admin/enrollments/${id}`, { credentials: 'include' });
      setSelected((await detail.json()).enrollment);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const publishCertificate = async (id: string) => {
    if (!signedBy.trim()) {
      setError('Indiquez le nom du signataire');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishCertificate: true, signedBy: signedBy.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');
      setSelected(data.enrollment);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const unpublishCertificate = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unpublishCertificate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');
      setSelected(data.enrollment);
      setSignedBy('');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

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
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/stats"
            className="rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-2 text-xs font-medium text-brand-200 hover:bg-brand-400/20 sm:text-sm"
          >
            Statistiques
          </Link>
          <Link
            href="/admin/notifications"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
          >
            Notifications
          </Link>
          <Link
            href="/admin/cours"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
          >
            Cours
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
          >
            ← Site
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:text-sm">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
          {[
            { label: 'Inscriptions', value: stats.overview.totalEnrollments },
            { label: 'Complets', value: stats.overview.paidComplete },
            { label: 'Profils OK', value: stats.overview.skillProfilesCompleted },
            { label: 'Profils à faire', value: stats.overview.skillProfilesIncomplete },
            { label: 'Débutants', value: stats.overview.skillProfilesBeginner },
            { label: 'Expérimentés', value: stats.overview.skillProfilesExperienced },
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

      <div className="mb-3 flex flex-wrap gap-2">
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
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'all', label: 'Tous profils' },
            { id: 'incomplete', label: 'Profil incomplet' },
            { id: 'complete', label: 'Profil complété' },
            { id: 'beginner', label: 'Débutants' },
            { id: 'experienced', label: 'Expérimentés' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setProfileFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              profileFilter === f.id
                ? 'bg-violet-600 text-white'
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
              <div className="flex justify-center p-8">
                <LoadingState />
              </div>
            ) : enrollments.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">Aucune inscription.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Candidat</th>
                      <th className="px-3 py-2.5 font-medium">Parcours</th>
                      <th className="px-3 py-2.5 font-medium">Profil technique</th>
                      <th className="px-3 py-2.5 font-medium">Statut</th>
                      <th className="px-3 py-2.5 font-medium">Paiement</th>
                      <th className="px-3 py-2.5 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => selectEnrollment(row)}
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
                          <p
                            className={
                              row.skillProfile?.completed
                                ? 'text-slate-300'
                                : 'text-amber-300'
                            }
                          >
                            {row.skillProfile?.summary ?? 'Profil non complété'}
                          </p>
                          {row.skillProfile?.completed &&
                            row.skillProfile.skillLevel === 'experienced' &&
                            row.skillProfile.masteredTechnologies.length > 0 && (
                              <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">
                                {row.skillProfile.masteredTechnologies.join(', ')}
                              </p>
                            )}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          <span className="block">{paymentSummary(row)}</span>
                          {row.paymentMethod && (
                            <span className="text-[11px] text-slate-500">
                              {PAYMENT_LABELS[row.paymentMethod]}
                            </span>
                          )}
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
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white sm:text-lg">
                    {selected.firstName} {selected.lastName}
                  </h2>
                  <p className="text-xs text-slate-400">{selected.user.email}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-600">{selected.id}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {(selected.identityDocumentUrl || selected.passportPhotoUrl) && (
                <div className="mb-4 overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={selected.identityDocumentUrl ?? selected.passportPhotoUrl!}
                    alt="Document d'identité"
                    width={400}
                    height={300}
                    className="h-40 w-full object-cover sm:h-48"
                    unoptimized
                  />
                </div>
              )}

              <DetailSection title="Identité">
                <dl className="space-y-2 text-xs sm:text-sm">
                  <Row
                    label="Statut"
                    value={
                      selected.identityVerificationStatus === 'verified'
                        ? 'Vérifiée'
                        : selected.identityVerificationStatus === 'failed'
                          ? 'Échec'
                          : selected.identityVerificationStatus === 'expired'
                            ? 'Expirée'
                            : 'En attente'
                    }
                  />
                  <Row
                    label="Document"
                    value={
                      selected.identityDocumentType === 'id_card'
                        ? "Carte d'identité"
                        : selected.identityDocumentType === 'passport'
                          ? 'Passeport'
                          : selected.passportPhotoUrl
                            ? 'Passeport (ancien)'
                            : '—'
                    }
                  />
                  <Row label="Nom détecté" value={selected.identityExtractedName ?? '—'} />
                  <Row label="Expire le" value={formatDate(selected.identityExpiryDate)} />
                  <Row label="Vérifiée le" value={formatDate(selected.identityVerifiedAt)} />
                  {selected.identityVerificationError && (
                    <Row label="Erreur" value={selected.identityVerificationError} />
                  )}
                </dl>
              </DetailSection>

              <DetailSection title="Compte">
                <dl className="space-y-2 text-xs sm:text-sm">
                  <Row label="Email" value={selected.user.email} />
                  <Row
                    label="Email vérifié"
                    value={selected.user.emailVerified ? 'Oui' : 'Non'}
                  />
                  <Row label="Compte créé" value={formatDate(selected.user.createdAt)} />
                  <Row
                    label="Confidentialité"
                    value={
                      selected.acceptedPrivacy === true
                        ? 'Acceptée'
                        : selected.acceptedPrivacy === false
                          ? 'Non'
                          : '—'
                    }
                  />
                </dl>
              </DetailSection>

              <DetailSection title="Coordonnées">
                <dl className="space-y-2 text-xs sm:text-sm">
                  <Row label="Téléphone" value={selected.phone} />
                  <Row label="Pays" value={selected.country} />
                  <Row label="Adresse" value={selected.address} />
                </dl>
              </DetailSection>

              <DetailSection title="Parcours">
                <dl className="space-y-2 text-xs sm:text-sm">
                  <Row label="Domaine" value={labelForDomain(selected.domain)} />
                  <Row label="Session" value={labelForSession(selected.formationSession)} />
                  <Row label="Durée" value={labelForDuration(selected.duration)} />
                  <Row
                    label="Planning"
                    value={`${labelForDays(selected.scheduleDays)} — ${labelForHours(selected.scheduleHours)}`}
                  />
                  <Row label="Inscrit le" value={formatDate(selected.createdAt)} />
                  <Row label="Mis à jour" value={formatDate(selected.updatedAt ?? null)} />
                </dl>
              </DetailSection>

              <DetailSection title="Profil technique">
                {selected.skillProfile?.completed ? (
                  <div className="space-y-3 text-xs sm:text-sm">
                    <p className="rounded-lg border border-brand-400/20 bg-brand-400/5 px-3 py-2 text-brand-200">
                      {selected.skillProfile.summary}
                    </p>
                    <dl className="space-y-2">
                      <Row
                        label="Niveau"
                        value={
                          selected.skillProfile.skillLevel === 'experienced'
                            ? 'Développe déjà'
                            : 'Débutant'
                        }
                      />
                      <Row
                        label="Années d'expérience"
                        value={
                          selected.skillProfile.skillLevel === 'experienced'
                            ? selected.skillProfile.yearsExperience != null
                              ? `${selected.skillProfile.yearsExperience} an${selected.skillProfile.yearsExperience > 1 ? 's' : ''}`
                              : '—'
                            : 'Non applicable (débutant)'
                        }
                      />
                      <Row
                        label="Nombre de technologies"
                        value={
                          selected.skillProfile.skillLevel === 'experienced'
                            ? String(selected.skillProfile.masteredTechnologies.length)
                            : '0'
                        }
                      />
                      <Row
                        label="Complété le"
                        value={formatDate(selected.skillProfile.completedAt)}
                      />
                    </dl>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Technologies maîtrisées
                      </p>
                      {selected.skillProfile.masteredTechnologies.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selected.skillProfile.masteredTechnologies.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-full border border-brand-400/30 bg-brand-400/10 px-2 py-0.5 text-[11px] text-brand-200"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-slate-400">
                          Aucune — parcours débutant, encadrement depuis les bases.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-300">
                    Profil non complété — le candidat n&apos;a pas encore indiqué son niveau, son
                    expérience ni ses technologies.
                  </p>
                )}
              </DetailSection>

              <DetailSection title="Paiements">
                <div className="space-y-3">
                  <PaymentPhaseCard
                    title={PHASE_LABELS.registration}
                    amountUsd={selected.registrationFeeUsd ?? selected.amountUsd}
                    amountXof={selected.amountXof}
                    paid={Boolean(selected.registrationPaidAt)}
                    paidAt={selected.registrationPaidAt}
                    method={selected.paymentMethod}
                    reference={paymentReference(selected, 'registration')}
                  />
                  <PaymentPhaseCard
                    title={PHASE_LABELS.formation}
                    amountUsd={selected.formationFeeUsd ?? 0}
                    paid={Boolean(selected.formationPaidAt)}
                    paidAt={selected.formationPaidAt}
                    method={selected.formationPaymentMethod}
                    reference={paymentReference(selected, 'formation')}
                  />
                  <dl className="space-y-2 border-t border-white/10 pt-3 text-xs sm:text-sm">
                    <Row
                      label="Total parcours"
                      value={`${formatUsd((selected.registrationFeeUsd ?? selected.amountUsd) + (selected.formationFeeUsd ?? 0))} $ USD`}
                    />
                    <Row label="Paiement complet" value={formatDate(selected.paidAt)} />
                  </dl>
                </div>
              </DetailSection>

              {selected.receipts && selected.receipts.length > 0 && (
                <DetailSection title="Reçus">
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {selected.receipts.map((receipt) => (
                      <li
                        key={receipt.id}
                        className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-white">{receipt.receiptNumber}</p>
                            <p className="text-slate-400">
                              {PHASE_LABELS[receipt.phase]} — {formatUsd(receipt.amountUsd)} $ (
                              {receipt.amountXof.toLocaleString('fr-FR')} XOF)
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {PAYMENT_LABELS[receipt.paymentMethod]} — {formatDate(receipt.paidAt)}
                            </p>
                            {receipt.reference && (
                              <p className="mt-1 break-all font-mono text-[10px] text-slate-600">
                                Réf. {receipt.reference}
                              </p>
                            )}
                          </div>
                          <a
                            href={`/api/admin/receipts/${receipt.id}`}
                            className="shrink-0 rounded border border-brand-400/40 px-2 py-1 text-[11px] text-brand-300 hover:bg-brand-400/10"
                          >
                            Télécharger
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              )}

              {selected.grades && selected.grades.length > 0 && (
                <DetailSection title="Notes">
                  <ul className="space-y-1 text-xs text-slate-400">
                    {selected.grades.map((g) => (
                      <li key={g.id}>
                        {g.title} — {g.score}/{g.maxScore}
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              )}

              <DetailSection title="Ajouter une note">
                <div className="flex flex-wrap gap-2">
                  <input
                    value={gradeTitle}
                    onChange={(e) => setGradeTitle(e.target.value)}
                    placeholder="Évaluation"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white"
                  />
                  <input
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    placeholder="/20"
                    className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => addGrade(selected.id)}
                    className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                </div>
              </DetailSection>

              <DetailSection title="Certificat">
                <p className="mb-3 text-[11px] text-slate-500">
                  Les informations vérifiées (nom, identité, parcours, notes) remplissent
                  automatiquement le certificat. Vous signez et publiez uniquement.
                </p>
                <dl className="mb-3 space-y-1.5 text-xs sm:text-sm">
                  <Row
                    label="Nom sur le certificat"
                    value={
                      selected.identityExtractedName ??
                      `${selected.firstName} ${selected.lastName}`
                    }
                  />
                  <Row label="Domaine" value={labelForDomain(selected.domain)} />
                  <Row label="Session" value={labelForSession(selected.formationSession)} />
                  <Row
                    label="Identité"
                    value={
                      selected.identityVerificationStatus === 'verified'
                        ? 'Vérifiée'
                        : selected.identityVerificationStatus
                    }
                  />
                  {selected.certificateNumber && (
                    <Row label="N° certificat" value={selected.certificateNumber} />
                  )}
                </dl>
                {selected.identityVerificationStatus !== 'verified' && (
                  <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
                    Publication bloquée tant que l&apos;identité n&apos;est pas vérifiée. L&apos;aperçu
                    HTML reste disponible à tout moment.
                  </p>
                )}
                {!selected.certificateIssuedAt ? (
                  <>
                    <p className="mb-2 text-[11px] text-slate-500">Signature du directeur</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={signedBy}
                        onChange={(e) => setSignedBy(e.target.value)}
                        placeholder="Nom du signataire"
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white"
                      />
                      <a
                        href={`/api/admin/enrollments/${selected.id}/certificate/preview?signedBy=${encodeURIComponent(signedBy || 'Directeur de formation')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-brand-400/40 px-3 py-1.5 text-xs text-brand-300 hover:bg-brand-400/10"
                      >
                        Aperçu HTML
                      </a>
                      <a
                        href={`/api/admin/enrollments/${selected.id}/certificate/preview/pdf?signedBy=${encodeURIComponent(signedBy || 'Directeur de formation')}`}
                        className="rounded-lg border border-brand-400/40 px-3 py-1.5 text-xs text-brand-300 hover:bg-brand-400/10"
                      >
                        Aperçu PDF
                      </a>
                      <button
                        type="button"
                        disabled={
                          busy ||
                          !signedBy.trim() ||
                          selected.identityVerificationStatus !== 'verified'
                        }
                        onClick={() => publishCertificate(selected.id)}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
                      >
                        Signer et publier
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-green-300">
                      Publié le {formatDate(selected.certificateIssuedAt)}
                      {selected.certificateSignedBy
                        ? ` — signé par ${selected.certificateSignedBy}`
                        : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/api/admin/enrollments/${selected.id}/certificate`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-brand-400/40 px-3 py-1.5 text-xs text-brand-300 hover:bg-brand-400/10"
                      >
                        Voir HTML
                      </a>
                      <a
                        href={`/api/admin/enrollments/${selected.id}/certificate/pdf`}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-400"
                      >
                        Télécharger PDF
                      </a>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => unpublishCertificate(selected.id)}
                        className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                      >
                        Dépublier
                      </button>
                    </div>
                  </div>
                )}
              </DetailSection>

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

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-white/10 pt-4 first:mt-0 first:border-t-0 first:pt-0">
      <p className="mb-2 text-xs font-semibold text-slate-300">{title}</p>
      {children}
    </div>
  );
}

function PaymentPhaseCard({
  title,
  amountUsd,
  amountXof,
  paid,
  paidAt,
  method,
  reference,
}: {
  title: string;
  amountUsd: number;
  amountXof?: number;
  paid: boolean;
  paidAt: string | null;
  method: PaymentMethod | null;
  reference: string | null;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-white sm:text-sm">{title}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            paid
              ? 'bg-green-400/15 text-green-300'
              : 'bg-amber-400/15 text-amber-300'
          }`}
        >
          {paid ? 'Payé' : 'En attente'}
        </span>
      </div>
      <dl className="space-y-1.5 text-xs">
        <Row label="Montant" value={`${formatUsd(amountUsd)} $ USD`} />
        {amountXof != null && amountXof > 0 && (
          <Row label="Montant XOF" value={`${amountXof.toLocaleString('fr-FR')} XOF`} />
        )}
        <Row
          label="Méthode"
          value={method ? PAYMENT_LABELS[method] : '—'}
        />
        <Row label="Date paiement" value={formatDate(paidAt)} />
        {reference && <Row label="Référence" value={reference} mono />}
      </dl>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-slate-500">{label}</dt>
      <dd className={`min-w-0 break-words text-slate-200 ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
