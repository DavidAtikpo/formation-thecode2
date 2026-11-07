'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';

type Comment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Realisation = {
  id: string;
  title: string;
  caption: string;
  src: string;
  likes: number;
  comments: Comment[];
};

const EMPTY = { title: '', caption: '', authorName: '', body: '' };

export default function AdminRealisationsPage() {
  const [items, setItems] = useState<Realisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, { authorName: string; body: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/realisations', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Accès refusé');
      setItems(data.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publish = async () => {
    if (!file) {
      setError('Ajoutez une photo');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('caption', form.caption);
      body.append('authorName', form.authorName);
      body.append('body', form.body);
      body.append('file', file);
      const res = await fetch('/api/admin/realisations', {
        method: 'POST',
        credentials: 'include',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Publication impossible');
      setForm(EMPTY);
      setFile(null);
      setFileKey((current) => current + 1);
      setMessage('Réalisation publiée sur le site.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const addComment = async (id: string) => {
    const draft = drafts[id] ?? { authorName: '', body: '' };
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/realisations', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, authorName: draft.authorName, body: draft.body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Commentaire impossible');
      setDrafts((current) => ({ ...current, [id]: { authorName: draft.authorName, body: '' } }));
      setMessage('Commentaire ajouté.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: Realisation) => {
    if (!confirm(`Retirer « ${item.title} » du site ?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/realisations?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Suppression impossible');
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
          <h1 className="text-xl font-bold text-white sm:text-2xl">Réalisations</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Ajoutez une photo, sa légende et un commentaire. Elle apparaît dans Nos réalisations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm">
            Inscriptions
          </Link>
          <Link href="/" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm">
            ← Site
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-brand-400/30 bg-brand-400/10 px-3 py-2 text-xs text-brand-200 sm:text-sm">
          {message}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-white">Nouvelle réalisation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Titre">
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className={inputClass}
              placeholder="Ex. Robot suiveur de ligne"
              maxLength={80}
            />
          </Field>
          <Field label="Photo (JPG, PNG ou WebP)">
            <input
              key={fileKey}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
          </Field>
          <Field label="Légende">
            <textarea
              value={form.caption}
              onChange={(event) => setForm({ ...form, caption: event.target.value })}
              className={`${inputClass} min-h-[72px]`}
              placeholder="Ce que montre la photo"
              maxLength={280}
            />
          </Field>
          <div className="space-y-3">
            <Field label="Commentaire — prénom (optionnel)">
              <input
                value={form.authorName}
                onChange={(event) => setForm({ ...form, authorName: event.target.value })}
                className={inputClass}
                placeholder="Ex. Awa"
                maxLength={40}
              />
            </Field>
            <Field label="Commentaire">
              <textarea
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                className={`${inputClass} min-h-[72px]`}
                placeholder="Le commentaire publié avec la photo"
                maxLength={400}
              />
            </Field>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void publish()}
          disabled={busy}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
        >
          Publier sur le site
        </button>
      </div>

      {loading ? (
        <LoadingState message="Chargement des réalisations…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const draft = drafts[item.id] ?? { authorName: '', body: '' };
            return (
              <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="relative aspect-[4/3] bg-slate-900">
                  <Image src={item.src} alt={item.title} fill className="object-cover" sizes="(min-width: 640px) 50vw, 100vw" />
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.caption}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {item.likes} j&apos;aime · {item.comments.length} commentaire{item.comments.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {item.comments.map((comment) => (
                      <li key={comment.id} className="rounded-lg bg-white/5 px-2.5 py-2">
                        <p className="text-[11px] font-semibold text-brand-200">{comment.authorName}</p>
                        <p className="text-xs leading-relaxed text-slate-300">{comment.body}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-2">
                    <input
                      value={draft.authorName}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: { ...draft, authorName: event.target.value },
                        }))
                      }
                      placeholder="Prénom"
                      maxLength={40}
                      className={inputClass}
                    />
                    <textarea
                      value={draft.body}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: { ...draft, body: event.target.value },
                        }))
                      }
                      placeholder="Ajouter un commentaire"
                      maxLength={400}
                      rows={2}
                      className={`${inputClass} resize-none`}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void addComment(item.id)}
                        disabled={busy}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
                      >
                        Ajouter le commentaire
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item)}
                        disabled={busy}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      {children}
    </label>
  );
}
