'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';
import { MotionCard } from '@/app/components/Motion';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') ?? 'stripe';
  const phase = searchParams.get('phase') ?? 'formation';
  const sessionId = searchParams.get('session_id');
  const transactionId = searchParams.get('transaction_id') ?? searchParams.get('id');
  const enrollmentId = searchParams.get('enrollment_id');
  const verifiedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'error'>('loading');

  useEffect(() => {
    if (verifiedRef.current) return;

    const hasStripeRef = provider === 'stripe' && sessionId;
    const hasFedapayRef = provider === 'fedapay' && transactionId;
    const hasCryptoRef = provider === 'crypto' && enrollmentId;

    if (!hasStripeRef && !hasFedapayRef && !hasCryptoRef) {
      setStatus('error');
      return;
    }

    verifiedRef.current = true;

    const query =
      provider === 'stripe'
        ? `provider=stripe&phase=${phase}&session_id=${encodeURIComponent(sessionId!)}`
        : provider === 'crypto'
          ? `provider=crypto&phase=${phase}&enrollment_id=${encodeURIComponent(enrollmentId!)}`
          : `provider=fedapay&phase=${phase}&transaction_id=${encodeURIComponent(transactionId!)}`;

    fetch(`/api/enrollment/verify?${query}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const ok = data.status === 'paid' || data.status === 'active';
        setStatus(ok ? 'paid' : 'pending');
      })
      .catch(() => setStatus('error'));
  }, [provider, phase, sessionId, transactionId, enrollmentId]);

  const isRegistration = phase === 'registration';

  if (status === 'loading') {
    return <LoadingState fullScreen message="Vérification du paiement…" />;
  }

  if (status === 'pending') {
    return (
      <div className="text-center">
        <div className="mb-4 text-5xl">⏳</div>
        <h1 className="text-2xl font-bold">Paiement en cours de traitement</h1>
        <p className="mt-2 text-slate-400">Votre espace sera mis à jour sous peu.</p>
        <Link href="/espace/paiements" className="mt-6 inline-block text-brand-400 hover:underline">
          Retour à mon espace
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Paiement</h1>
        <Link href="/espace/paiements" className="mt-4 inline-block text-brand-400 hover:underline">
          Retour à mon espace
        </Link>
      </div>
    );
  }

  return (
    <MotionCard className="text-center">
      <div className="mb-4 text-6xl">✓</div>
      <h1 className="text-2xl font-bold text-brand-300">
        {isRegistration ? 'Frais d\'inscription payés !' : 'Paiement confirmé'}
      </h1>
      <p className="mt-3 text-slate-300">
        {isRegistration
          ? 'Votre place est réservée. Vous pouvez régler les frais de formation depuis votre espace candidat.'
          : 'Les frais de formation ont été réglés. Votre inscription est complète.'}
      </p>
      <Link
        href="/espace/parcours"
        className="mt-8 inline-block rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 px-8 py-3 font-semibold text-white hover:opacity-90"
      >
        Retour à mon espace
      </Link>
    </MotionCard>
  );
}

export default function EspaceSuccesPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <Suspense fallback={<LoadingState fullScreen />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
