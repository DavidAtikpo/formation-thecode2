'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';
import { MotionCard } from '@/app/components/Motion';
import SkillProfileModal from '@/app/components/SkillProfileModal';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifiedRef = useRef(false);
  const provider =
    searchParams.get('provider') ??
    (searchParams.get('session_id')
      ? 'stripe'
      : searchParams.get('enrollment_id')
        ? 'crypto'
        : 'fedapay');
  const sessionId = searchParams.get('session_id');
  const transactionId = searchParams.get('transaction_id') ?? searchParams.get('id');
  const enrollmentId = searchParams.get('enrollment_id');
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'error'>('loading');
  const [firstName, setFirstName] = useState('');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [redirectReady, setRedirectReady] = useState(false);

  useEffect(() => {
    if (verifiedRef.current) return;

    const hasStripeRef = provider === 'stripe' && sessionId;
    const hasFedapayRef = provider === 'fedapay' && transactionId;
    const hasCryptoRef = provider === 'crypto' && enrollmentId;

    if (!hasStripeRef && !hasFedapayRef && !hasCryptoRef) {
      setStatus('error');
      return;
    }

    const cacheKey = `tc2-verify:${provider}:${sessionId ?? transactionId ?? enrollmentId}`;
    if (sessionStorage.getItem(cacheKey) === 'paid') {
      verifiedRef.current = true;
      setStatus('paid');
      return;
    }

    verifiedRef.current = true;

    const query =
      provider === 'stripe'
        ? `provider=stripe&phase=registration&session_id=${encodeURIComponent(sessionId!)}`
        : provider === 'crypto'
          ? `provider=crypto&phase=registration&enrollment_id=${encodeURIComponent(enrollmentId!)}`
          : `provider=fedapay&phase=registration&transaction_id=${encodeURIComponent(transactionId!)}`;

    fetch(`/api/enrollment/verify?${query}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const ok = data.status === 'paid' || data.status === 'active';
        if (ok) sessionStorage.setItem(cacheKey, 'paid');
        setStatus(ok ? 'paid' : 'pending');
      })
      .catch(() => setStatus('error'));
  }, [provider, sessionId, transactionId, enrollmentId]);

  useEffect(() => {
    if (status !== 'paid') return;

    fetch('/api/espace', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.enrollment) return;
        setFirstName(json.enrollment.firstName ?? '');
        if (!json.enrollment.skillProfile?.completed) {
          setShowSkillModal(true);
        } else {
          setRedirectReady(true);
        }
      })
      .catch(() => setRedirectReady(true));
  }, [status]);

  useEffect(() => {
    if (!redirectReady || showSkillModal) return;
    const timer = setTimeout(() => router.replace('/espace/parcours'), 4000);
    return () => clearTimeout(timer);
  }, [redirectReady, showSkillModal, router]);

  const closeSkillModal = () => {
    setShowSkillModal(false);
    setRedirectReady(true);
  };

  if (status === 'loading') {
    return <LoadingState fullScreen message="Vérification du paiement…" />;
  }

  if (status === 'pending') {
    return (
      <div className="text-center">
        <div className="mb-4 text-5xl">⏳</div>
        <h1 className="text-2xl font-bold">Paiement en cours de traitement</h1>
        <p className="mt-2 text-slate-400">Votre inscription sera confirmée sous peu.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Inscription</h1>
        <p className="mt-2 text-slate-400">
          <Link href="/inscription" className="text-brand-400 hover:underline">
            Retour au formulaire
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <SkillProfileModal
        open={showSkillModal}
        firstName={firstName || 'Candidat'}
        onComplete={closeSkillModal}
        onSkip={closeSkillModal}
      />
      <MotionCard className="text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-brand-300">Frais d&apos;inscription payés !</h1>
        <p className="mt-4 text-slate-300">
          Votre place est réservée. Accédez à votre espace candidat pour suivre votre parcours,
          consulter vos notes et régler les frais de formation.
        </p>
        <p className="mt-3 text-xs text-slate-500 sm:text-sm">
          Les frais de formation se règlent dans votre espace candidat. Le délai dépend de la durée
          choisie (7 jours pour 2 semaines, 2 mois pour 3 mois, 3 mois pour 4 mois).
        </p>
        {showSkillModal ? (
          <p className="mt-2 text-xs text-brand-300">
            Complétez votre profil technique pour personnaliser votre accompagnement.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Redirection vers votre espace dans quelques secondes…
          </p>
        )}
        <Link
          href="/espace/parcours"
          className="mt-8 inline-block rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 px-8 py-3 font-semibold text-white hover:opacity-90"
        >
          Accéder à mon espace
        </Link>
      </MotionCard>
    </>
  );
}

export default function SuccesPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <Suspense fallback={<LoadingState fullScreen />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
