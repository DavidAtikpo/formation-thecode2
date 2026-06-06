'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MotionCard } from '@/app/components/Motion';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const urlError = searchParams.get('error');

  const checkStatus = useCallback(async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const user = res.ok ? await res.json() : null;
    if (!user?.id) {
      router.replace('/compte');
      return null;
    }
    if (user.emailVerified) {
      router.replace('/inscription');
      return user;
    }
    setEmail(user.email);
    return user;
  }, [router]);

  useEffect(() => {
    checkStatus().finally(() => setLoading(false));
  }, [checkStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  useEffect(() => {
    if (urlError === 'expired') {
      setError('Le lien de vérification est invalide ou a expiré. Demandez un nouvel email.');
    } else if (urlError === 'token') {
      setError('Lien de vérification invalide.');
    } else if (urlError === 'server') {
      setError('Une erreur est survenue. Réessayez.');
    }
  }, [urlError]);

  const resend = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Envoi impossible');
      setMessage(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Chargement…</p>;
  }

  return (
    <MotionCard className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:rounded-2xl sm:p-6">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
        Étape 2
      </p>
      <h1 className="mb-1 text-xl font-bold sm:text-2xl">Vérifiez votre email</h1>
      <p className="mb-4 text-xs text-slate-400 sm:mb-5 sm:text-sm">
        Nous avons envoyé un lien de confirmation à{' '}
        <span className="font-medium text-white">{email}</span>. Cliquez sur le lien pour
        poursuivre votre inscription.
      </p>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-3 rounded-lg border border-brand-400/30 bg-brand-400/10 px-3 py-2 text-xs text-brand-200 sm:text-sm">
          {message}
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="w-full rounded-lg border border-white/15 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50 sm:rounded-xl sm:py-3"
        >
          {busy ? 'Envoi…' : 'Renvoyer l\'email'}
        </button>
        <p className="text-center text-[11px] text-slate-500 sm:text-xs">
          Vérifiez aussi vos spams. Cette page se met à jour automatiquement après validation.
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400 sm:mt-5 sm:text-sm">
        Mauvaise adresse ?{' '}
        <Link href="/compte" className="text-brand-400 hover:underline">
          Créer un autre compte
        </Link>
      </p>
    </MotionCard>
  );
}

export default function VerifierEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-10">
      <Suspense fallback={<p className="text-slate-400">Chargement…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
