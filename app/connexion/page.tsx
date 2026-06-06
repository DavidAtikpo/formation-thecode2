'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MotionCard } from '@/app/components/Motion';

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Connexion impossible');
      if (data.isAdmin) {
        router.push('/admin');
        return;
      }
      router.push(data.emailVerified ? '/inscription' : '/compte/verifier-email');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-10">
      <MotionCard className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:rounded-2xl sm:p-6">
        <h1 className="mb-1 text-xl font-bold sm:text-2xl">Connexion</h1>
        <p className="mb-4 text-xs text-slate-400 sm:mb-5 sm:text-sm">Accédez à votre formulaire d&apos;inscription.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-300 sm:text-sm">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50 sm:px-3.5 sm:py-2.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-300 sm:text-sm">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50 sm:px-3.5 sm:py-2.5"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:rounded-xl sm:py-3"
          >
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400 sm:mt-5 sm:text-sm">
          Pas encore de compte ?{' '}
          <Link href="/compte" className="text-brand-400 hover:underline">
            Créer un compte
          </Link>
        </p>
      </MotionCard>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-slate-400">Chargement…</p>}>
      <ConnexionContent />
    </Suspense>
  );
}
