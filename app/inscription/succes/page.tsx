'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MotionCard } from '@/app/components/Motion';
import { getDomain, getFormationSession } from '@/app/lib/formation-config';

type Enrollment = {
  firstName: string;
  lastName: string;
  domain: string;
  formationSession: string;
  duration: string;
  status: string;
};

function SuccessContent() {
  const searchParams = useSearchParams();
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
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'error'>('loading');

  useEffect(() => {
    const hasStripeRef = provider === 'stripe' && sessionId;
    const hasFedapayRef = provider === 'fedapay' && transactionId;
    const hasCryptoRef = provider === 'crypto' && enrollmentId;

    if (!hasStripeRef && !hasFedapayRef && !hasCryptoRef) {
      setStatus('error');
      return;
    }

    const query =
      provider === 'stripe'
        ? `provider=stripe&session_id=${encodeURIComponent(sessionId!)}`
        : provider === 'crypto'
          ? `provider=crypto&enrollment_id=${encodeURIComponent(enrollmentId!)}`
          : `provider=fedapay&transaction_id=${encodeURIComponent(transactionId!)}`;

    fetch(`/api/enrollment/verify?${query}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'paid') {
          setEnrollment(data.enrollment);
          setStatus('paid');
        } else {
          setStatus('pending');
        }
      })
      .catch(() => setStatus('error'));
  }, [provider, sessionId, transactionId, enrollmentId]);

  if (status === 'loading') {
    return <p className="text-slate-400">Vérification du paiement…</p>;
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

  if (status === 'error' || !enrollment) {
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

  const domainLabel = getDomain(enrollment.domain as Parameters<typeof getDomain>[0]).label;
  const session = getFormationSession(enrollment.formationSession as Parameters<typeof getFormationSession>[0]);

  return (
    <MotionCard className="text-center">
      <div className="mb-4 text-6xl">🎉</div>
      <h1 className="text-3xl font-bold text-brand-300">Inscription confirmée !</h1>
      <p className="mt-4 text-lg text-slate-300">
        Bienvenue {enrollment.firstName} {enrollment.lastName}
      </p>
      <div className="mx-auto mt-6 max-w-md rounded-xl border border-white/10 bg-white/5 p-6 text-left text-sm">
        <p><span className="text-slate-500">Domaine :</span> {domainLabel}</p>
        <p className="mt-1"><span className="text-slate-500">Session :</span> {session.period}</p>
        <p className="mt-1"><span className="text-slate-500">Statut :</span> <span className="text-green-400">Payé ✓</span></p>
      </div>
      <p className="mt-6 text-slate-400">
        Deux rencontres de préparation auront lieu avant le début de votre session.
        Nous vous contacterons pour les dates. Votre certificat sera généré à la fin de la formation.
      </p>
      <a
        href="https://wa.me/22892591228"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block rounded-xl bg-green-600 px-8 py-3 font-semibold text-white hover:bg-green-500"
      >
        Nous contacter sur WhatsApp
      </a>
    </MotionCard>
  );
}

export default function SuccesPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <Suspense fallback={<p className="text-slate-400">Chargement…</p>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
