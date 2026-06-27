'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SectionIcon from '@/app/components/SectionIcon';
import { useEspace } from '@/app/components/espace/EspaceProvider';
import { EspaceCard } from '@/app/components/espace/EspaceUi';

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50';

export default function ProjetPage() {
  const { data, reload } = useEspace();
  const [title, setTitle] = useState(data.project.title ?? '');
  const [url, setUrl] = useState(data.project.url ?? '');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setTitle(data.project.title ?? '');
    setUrl(data.project.url ?? '');
  }, [data.project.title, data.project.url]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/espace/project', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || null, url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Enregistrement impossible');
      setFeedback({ type: 'ok', text: json.message });
      await reload();
    } catch (err: unknown) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <EspaceCard>
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-white">
        <SectionIcon name="globe" size="sm" />
        Projet hébergé
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
        Une fois votre projet en ligne, soumettez l&apos;URL de votre site. L&apos;équipe pédagogique
        consultera votre réalisation pour vous attribuer une note — visible dans{' '}
        <Link href="/espace/notes" className="text-brand-400 hover:underline">
          Mes notes
        </Link>
        .
      </p>

      {data.project.submittedAt && (
        <div className="mb-4 rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-xs text-green-300 sm:text-sm">
          Dernière soumission le{' '}
          {new Date(data.project.submittedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          .
          {data.project.url && (
            <a
              href={data.project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block font-medium text-brand-300 hover:underline"
            >
              Ouvrir mon site →
            </a>
          )}
        </div>
      )}

      {feedback && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-xs sm:text-sm ${
            feedback.type === 'ok'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300 sm:text-sm">
            Nom du projet (optionnel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. : Boutique en ligne — mon portfolio"
            maxLength={120}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300 sm:text-sm">
            URL du site hébergé *
          </label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mon-projet.vercel.app"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Lien public accessible (Vercel, Netlify, GitHub Pages, domaine perso…).
          </p>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Enregistrement…' : data.project.url ? 'Mettre à jour le lien' : 'Soumettre mon projet'}
        </button>
      </form>
    </EspaceCard>
  );
}
