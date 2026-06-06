'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MotionCard } from '@/app/components/Motion';

export default function ComptePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Inscription impossible');
      router.push('/compte/verifier-email');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50 sm:px-3.5 sm:py-2.5';

  return (
    <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-10">
      <MotionCard className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:rounded-2xl sm:p-6">
        <h1 className="mb-1 text-xl font-bold sm:text-2xl">Créer un compte</h1>
        <p className="mb-4 text-xs text-slate-400 sm:mb-5 sm:text-sm">
          Étape 1 — Créez votre compte, puis vérifiez votre email pour accéder au formulaire.
        </p>

        {error && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-300 sm:text-sm">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-300 sm:text-sm">Mot de passe</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-300 sm:text-sm">Confirmer le mot de passe</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:rounded-xl sm:py-3"
          >
            {busy ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400 sm:mt-5 sm:text-sm">
          Déjà inscrit ?{' '}
          <Link href="/connexion" className="text-brand-400 hover:underline">
            Se connecter
          </Link>
        </p>
      </MotionCard>
    </div>
  );
}
