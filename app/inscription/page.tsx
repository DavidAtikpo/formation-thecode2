'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EnrollmentForm from '@/app/components/EnrollmentForm';
import LoadingState from '@/app/components/LoadingState';
import { MotionCard, MotionSection } from '@/app/components/Motion';
import Link from 'next/link';

function InscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const cancelled = searchParams.get('cancelled');
  const verified = searchParams.get('verified');
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (!user?.id) {
          router.replace('/compte');
          return;
        }
        if (!user.emailVerified) {
          router.replace('/compte/verifier-email');
          return;
        }
        const enr = user.enrollments?.[0];
        if (enr?.status === 'active' || enr?.status === 'paid') {
          router.replace('/espace');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <LoadingState fullScreen />;
  }

  return (
    <div className="px-3 py-8 sm:px-4 sm:py-10">
      <MotionSection className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Inscription à la formation</h1>
        <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
          Complétez le formulaire, puis payez les frais d&apos;inscription. Les frais de formation
          se règlent ensuite dans votre espace candidat.
        </p>
        {verified && (
          <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300 sm:text-sm">
            Email vérifié avec succès. Vous pouvez compléter votre inscription.
          </div>
        )}
        {cancelled && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 sm:text-sm">
            Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
          </div>
        )}
      </MotionSection>
      <MotionCard>
        <EnrollmentForm />
      </MotionCard>
      <p className="mx-auto mt-5 max-w-2xl text-center text-xs text-slate-500 sm:mt-6 sm:text-sm">
        Besoin d&apos;aide ?{' '}
        <Link href="https://wa.me/22892591228" className="text-brand-400 hover:underline">
          Contactez-nous sur WhatsApp
        </Link>
      </p>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<LoadingState fullScreen />}>
      <InscriptionContent />
    </Suspense>
  );
}
