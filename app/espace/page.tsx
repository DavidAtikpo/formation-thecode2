'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import EspaceNav, { isEspaceTabId, type EspaceTabId } from '@/app/components/EspaceNav';
import IdentityVerificationPanel from '@/app/components/IdentityVerificationPanel';
import SkillProfileModal from '@/app/components/SkillProfileModal';
import LoadingState from '@/app/components/LoadingState';
import { MotionCard, MotionSection } from '@/app/components/Motion';
import SectionIcon from '@/app/components/SectionIcon';
import type { PaymentMethodId } from '@/app/lib/enrollment-checkout';
import { formatUsd } from '@/app/lib/formation-config';

type Grade = {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  comment: string | null;
  gradedAt: string;
};

type Receipt = {
  id: string;
  receiptNumber: string;
  phase: 'registration' | 'formation';
  phaseLabel: string;
  amountUsd: number;
  paidAt: string;
  downloadUrl: string;
};

type LearningResource = {
  id: string;
  title: string;
  description: string | null;
  type: 'course_pdf' | 'tutorial';
  typeLabel: string;
  fileUrl: string | null;
  externalUrl: string | null;
  deliveredAt: string;
};

type EnrollmentData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  domain: string;
  duration: string;
  session: string;
  sessionLabel: string;
  schedule: string;
  status: string;
  registrationFeeUsd: number;
  formationFeeUsd: number;
  registrationPaid: boolean;
  formationPaid: boolean;
  registrationPaidAt: string | null;
  formationPaidAt: string | null;
  formationDeadline: string;
  formationDeadlineDays: number;
  formationDeadlineLabel: string;
  formationOverdue: boolean;
  certificateIssued: boolean;
  certificateUrl: string | null;
  certificateDownloadUrl: string | null;
  certificateIssuedAt: string | null;
  certificateNumber: string | null;
  grades: Grade[];
  averageGrade: number | null;
  receipts: Receipt[];
  createdAt: string;
  identity: {
    documentType: 'id_card' | 'passport' | null;
    status: 'pending' | 'verified' | 'failed' | 'expired';
    verifiedAt: string | null;
    expiryDate: string | null;
    extractedName: string | null;
    error: string | null;
  };
  skillProfile: {
    completed: boolean;
    skillLevel: 'beginner' | 'experienced' | null;
    yearsExperience: number | null;
    masteredTechnologies: string[];
    completedAt: string | null;
  };
};

function EspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');
  const tabParam = searchParams.get('tab');
  const activeTab: EspaceTabId = isEspaceTabId(tabParam) ? tabParam : 'parcours';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnrollmentData | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('fedapay');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const load = useCallback(async () => {
    const me = await fetch('/api/auth/me', { credentials: 'include' }).then((r) =>
      r.ok ? r.json() : null,
    );
    if (!me?.id) {
      router.replace('/connexion');
      return;
    }
    if (!me.emailVerified) {
      router.replace('/compte/verifier-email');
      return;
    }

    const [res, resourcesRes] = await Promise.all([
      fetch('/api/espace', { credentials: 'include' }),
      fetch('/api/espace/resources', { credentials: 'include' }),
    ]);
    const json = await res.json();
    if (!json.enrollment) {
      router.replace('/inscription');
      return;
    }
    setData(json.enrollment);
    if (!json.enrollment.skillProfile?.completed) {
      setShowSkillModal(true);
    }
    if (resourcesRes.ok) {
      const resourcesJson = await resourcesRes.json();
      setResources(resourcesJson.resources ?? []);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (cancelled && activeTab !== 'paiements') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'paiements');
      router.replace(`/espace?${params.toString()}`, { scroll: false });
    }
  }, [cancelled, activeTab, router, searchParams]);

  const setTab = (tab: EspaceTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/espace?${params.toString()}`, { scroll: false });
  };

  const payFormation = async () => {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/enrollment/formation-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Paiement impossible');
      window.location.href = json.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  };

  if (loading || !data) {
    return <LoadingState fullScreen message="Chargement de votre espace…" />;
  }

  const deadlineDate = new Date(data.formationDeadline).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const registrationReceipt = data.receipts.find((r) => r.phase === 'registration');
  const formationReceipt = data.receipts.find((r) => r.phase === 'formation');

  const navBadges: Partial<Record<EspaceTabId, boolean>> = {
    identite: data.identity.status !== 'verified',
    paiements: data.registrationPaid && !data.formationPaid && data.formationFeeUsd > 0,
    cours: resources.length > 0,
    notes: data.grades.length > 0,
    certificat: data.certificateIssued,
  };

  return (
    <div className="px-3 py-8 pb-24 sm:px-4 sm:py-10 md:pb-10">
      <SkillProfileModal
        open={showSkillModal}
        firstName={data.firstName}
        onComplete={() => {
          setShowSkillModal(false);
          load();
        }}
        onSkip={() => setShowSkillModal(false)}
      />
      <MotionSection className="mx-auto mb-4 max-w-3xl md:mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
          Espace candidat
        </p>
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold sm:text-2xl">
          {data.identity.status === 'verified' && (
            <span
              className="inline-flex shrink-0 items-center text-green-400"
              title="Identité vérifiée"
              aria-label="Identité vérifiée"
            >
              <BadgeCheck className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
            </span>
          )}
          <span>
            Bonjour {data.firstName} {data.lastName}
          </span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">{data.email}</p>
      </MotionSection>

      <div className="mx-auto mb-5 max-w-3xl md:mb-6">
        <EspaceNav active={activeTab} onChange={setTab} badges={navBadges} />
      </div>

      {cancelled && activeTab === 'paiements' && (
        <div className="mx-auto mb-4 max-w-3xl rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 sm:text-sm">
          Paiement annulé. Vous pouvez réessayer ci-dessous.
        </div>
      )}

      <div className="mx-auto grid max-w-3xl gap-4 sm:gap-5">
        {activeTab === 'parcours' && (
        <MotionCard className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
            <SectionIcon name="graduation" size="sm" />
            Mon parcours
          </h2>
          <dl className="grid gap-2 text-xs sm:grid-cols-2 sm:text-sm">
            <InfoRow label="Domaine" value={data.domain} />
            <InfoRow label="Durée" value={data.duration} />
            <InfoRow label="Session" value={data.session} />
            <InfoRow label="Planning" value={data.schedule} />
            <InfoRow label="Statut" value={statusLabel(data.status)} />
          </dl>
          {data.skillProfile.completed ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Profil technique
              </p>
              <dl className="grid gap-2 text-xs sm:text-sm">
                <InfoRow
                  label="Niveau"
                  value={
                    data.skillProfile.skillLevel === 'experienced'
                      ? 'Développeur avec expérience'
                      : 'Débutant'
                  }
                />
                {data.skillProfile.skillLevel === 'experienced' && (
                  <>
                    <InfoRow
                      label="Expérience"
                      value={`${data.skillProfile.yearsExperience ?? 0} an${(data.skillProfile.yearsExperience ?? 0) > 1 ? 's' : ''}`}
                    />
                    <div>
                      <dt className="text-slate-500">Technologies</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {data.skillProfile.masteredTechnologies.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full border border-brand-400/30 bg-brand-400/10 px-2 py-0.5 text-[11px] text-brand-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSkillModal(true)}
              className="mt-4 w-full rounded-lg border border-dashed border-brand-400/40 px-3 py-2 text-xs text-brand-300 hover:bg-brand-400/10 sm:text-sm"
            >
              Compléter votre profil technique
            </button>
          )}
        </MotionCard>
        )}

        {activeTab === 'identite' && (
        <MotionCard className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
            <SectionIcon name="award" size="sm" />
            Vérification d&apos;identité
          </h2>
          <IdentityVerificationPanel
            firstName={data.firstName}
            lastName={data.lastName}
            identity={data.identity}
            onVerified={load}
          />
        </MotionCard>
        )}

        {activeTab === 'paiements' && (
        <MotionCard className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
            <SectionIcon name="credit" size="sm" />
            Paiements
          </h2>

          <div className="space-y-3">
            <PaymentRow
              label="Frais d'inscription"
              amount={data.registrationFeeUsd}
              paid={data.registrationPaid}
              paidAt={data.registrationPaidAt}
              receipt={registrationReceipt}
            />
            <PaymentRow
              label="Frais de formation"
              amount={data.formationFeeUsd}
              paid={data.formationPaid}
              paidAt={data.formationPaidAt}
              deadline={!data.formationPaid ? deadlineDate : undefined}
              overdue={data.formationOverdue}
              receipt={formationReceipt}
            />
          </div>

          {!data.formationPaid && data.registrationPaid && data.formationFeeUsd > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs text-slate-400 sm:text-sm">
                Les frais de formation doivent être réglés au plus tard le{' '}
                <strong className="text-slate-200">{deadlineDate}</strong> (
                {data.formationDeadlineLabel} après le début de votre session).
              </p>
              {data.formationOverdue && (
                <p className="mb-3 text-xs font-medium text-red-300 sm:text-sm">
                  Délai dépassé — merci de régler dès que possible.
                </p>
              )}

              {error && (
                <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </div>
              )}

              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(['fedapay', 'stripe', 'crypto'] as PaymentMethodId[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition sm:text-sm ${
                      paymentMethod === m
                        ? 'border-brand-400 bg-brand-400/10 text-white'
                        : 'border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {m === 'fedapay' ? 'FedaPay' : m === 'stripe' ? 'Stripe' : 'Crypto'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={payFormation}
                disabled={busy}
                className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy
                  ? 'Redirection…'
                  : `Payer les frais de formation — ${formatUsd(data.formationFeeUsd)} $`}
              </button>
            </div>
          )}

          {data.formationPaid && (
            <p className="mt-3 text-xs text-green-300 sm:text-sm">
              Tous les frais sont réglés. Votre place est confirmée.
            </p>
          )}

          {data.receipts.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs text-slate-400 sm:text-sm">
                Un reçu vous a été envoyé par email à chaque paiement. Vous pouvez aussi le
                télécharger ici :
              </p>
              <div className="space-y-2">
                {data.receipts.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{r.phaseLabel}</p>
                      <p className="text-[11px] text-slate-500">
                        {r.receiptNumber} — {new Date(r.paidAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <a
                      href={r.downloadUrl}
                      className="rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-400/20"
                    >
                      Télécharger
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </MotionCard>
        )}

        {activeTab === 'cours' && (
        <MotionCard className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
            <SectionIcon name="laptop" size="sm" />
            Mes cours & tutoriels
          </h2>
          {resources.length === 0 ? (
            <p className="text-xs text-slate-400 sm:text-sm">
              Aucun contenu pour le moment. Vos cours PDF et tutoriels apparaîtront ici dès qu&apos;ils
              seront envoyés par l&apos;équipe.
            </p>
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{resource.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {resource.typeLabel} —{' '}
                        {new Date(resource.deliveredAt).toLocaleDateString('fr-FR')}
                      </p>
                      {resource.description && (
                        <p className="mt-1 text-xs text-slate-400">{resource.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resource.fileUrl && (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-400/20"
                        >
                          Télécharger PDF
                        </a>
                      )}
                      {resource.externalUrl && (
                        <a
                          href={resource.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
                        >
                          Ouvrir le tutoriel
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MotionCard>
        )}

        {activeTab === 'notes' && (
        <MotionCard className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
            <SectionIcon name="award" size="sm" />
            Mes notes
          </h2>
          {data.grades.length === 0 ? (
            <p className="text-xs text-slate-400 sm:text-sm">
              Aucune note publiée pour le moment. Vos évaluations apparaîtront ici au fil de la
              formation.
            </p>
          ) : (
            <>
              {data.averageGrade != null && (
                <p className="mb-3 text-sm text-brand-300">
                  Moyenne : <strong>{data.averageGrade}</strong> / 20
                </p>
              )}
              <div className="space-y-2">
                {data.grades.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{g.title}</p>
                      <p className="text-sm font-semibold text-brand-300">
                        {g.score}/{g.maxScore}
                      </p>
                    </div>
                    {g.comment && (
                      <p className="mt-1 text-xs text-slate-400">{g.comment}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(g.gradedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </MotionCard>
        )}

        {activeTab === 'certificat' && (
        <MotionCard className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
            <SectionIcon name="award" size="sm" />
            Certificat
          </h2>
          {data.certificateIssued && data.certificateDownloadUrl ? (
            <div>
              <p className="mb-2 text-xs text-green-300 sm:text-sm">
                Votre certificat est disponible
                {data.certificateNumber && ` (${data.certificateNumber})`}
                {data.certificateIssuedAt &&
                  ` — émis le ${new Date(data.certificateIssuedAt).toLocaleDateString('fr-FR')}`}
                .
              </p>
              <a
                href={data.certificateDownloadUrl}
                className="inline-flex rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
              >
                Télécharger mon certificat
              </a>
            </div>
          ) : (
            <p className="text-xs text-slate-400 sm:text-sm">
              {data.identity?.status === 'verified'
                ? 'Votre identité est vérifiée. Le certificat sera généré automatiquement et publié par l’administration à la fin de la formation.'
                : data.status === 'paid'
                  ? 'Vérifiez votre identité dans l’onglet Identité, puis votre certificat sera publié à la fin de la formation.'
                  : 'Le certificat sera délivré à la clôture de votre parcours, après paiement complet des frais et vérification d’identité.'}
            </p>
          )}
        </MotionCard>
        )}

        <p className="text-center text-xs text-slate-500">
          Une question ?{' '}
          <Link href="/contact" className="text-brand-400 hover:underline">
            Contactez-nous
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function EspacePage() {
  return (
    <Suspense
      fallback={<LoadingState fullScreen />}
    >
      <EspaceContent />
    </Suspense>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}

function PaymentRow({
  label,
  amount,
  paid,
  paidAt,
  deadline,
  overdue,
  receipt,
}: {
  label: string;
  amount: number;
  paid: boolean;
  paidAt: string | null;
  deadline?: string;
  overdue?: boolean;
  receipt?: Receipt;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{formatUsd(amount)} $</p>
        {deadline && !paid && (
          <p className={`mt-0.5 text-[11px] ${overdue ? 'text-red-300' : 'text-slate-500'}`}>
            À régler avant le {deadline}
          </p>
        )}
        {receipt && (
          <a
            href={receipt.downloadUrl}
            className="mt-1 inline-block text-[11px] font-medium text-brand-400 hover:underline"
          >
            Télécharger le reçu
          </a>
        )}
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          paid ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
        }`}
      >
        {paid
          ? `Payé${paidAt ? ` — ${new Date(paidAt).toLocaleDateString('fr-FR')}` : ''}`
          : 'En attente'}
      </span>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === 'active') return 'Inscrit — formation en cours de paiement';
  if (status === 'paid') return 'Inscription complète';
  return status;
}
