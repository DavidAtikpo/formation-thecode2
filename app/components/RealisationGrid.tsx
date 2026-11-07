'use client';

import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MotionItem, MotionStagger } from '@/app/components/Motion';
import { REALISATIONS } from '@/app/lib/realisations';

type Comment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Card = {
  id: string;
  title: string;
  caption: string;
  src: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
};

const INITIAL: Card[] = REALISATIONS.map((item) => ({
  ...item,
  likes: 0,
  liked: false,
  comments: [],
}));

export default function RealisationGrid() {
  const [items, setItems] = useState<Card[]>(INITIAL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { name: string; body: string }>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/realisations', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.items)) return;
        setItems(data.items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const like = async (id: string) => {
    if (pending) return;
    setPending(id);
    setError('');
    try {
      const res = await fetch('/api/realisations', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible d’enregistrer le j’aime');
        return;
      }
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, likes: data.likes, liked: data.liked } : item)),
      );
    } catch {
      setError('Impossible d’enregistrer le j’aime');
    } finally {
      setPending(null);
    }
  };

  const comment = async (id: string) => {
    const draft = drafts[id] ?? { name: '', body: '' };
    if (pending) return;
    setPending(`${id}-comment`);
    setError('');
    try {
      const res = await fetch('/api/realisations', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          id,
          authorName: draft.name,
          body: draft.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible d’enregistrer le commentaire');
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, comments: [data.comment, ...item.comments] } : item,
        ),
      );
      setDrafts((current) => ({ ...current, [id]: { name: draft.name, body: '' } }));
    } catch {
      setError('Impossible d’enregistrer le commentaire');
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const open = openId === item.id;
          const draft = drafts[item.id] ?? { name: '', body: '' };
          return (
            <MotionItem
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <div className="border-t-2 border-gold-400 p-3 sm:p-3.5">
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.caption}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => like(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      item.liked
                        ? 'border-gold-400 bg-gold-400/15 text-gold-700'
                        : 'border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-600'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${item.liked ? 'fill-gold-500 text-gold-500' : ''}`} />
                    J&apos;aime
                    <span>{item.likes}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      open
                        ? 'border-brand-400 bg-brand-400/10 text-brand-600'
                        : 'border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-600'
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Commenter
                    <span>{item.comments.length}</span>
                  </button>
                </div>
                {open && (
                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                    <form
                      className="space-y-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void comment(item.id);
                      }}
                    >
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, name: event.target.value },
                          }))
                        }
                        placeholder="Votre prénom"
                        maxLength={40}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-400"
                      />
                      <textarea
                        value={draft.body}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, body: event.target.value },
                          }))
                        }
                        placeholder="Votre commentaire"
                        maxLength={400}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-400"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                      >
                        Publier
                      </button>
                    </form>
                    <ul className="space-y-2">
                      {item.comments.map((entry) => (
                        <li key={entry.id} className="rounded-lg bg-[#eef3fc] px-2.5 py-2">
                          <p className="text-[11px] font-semibold text-brand-600">{entry.authorName}</p>
                          <p className="text-xs leading-relaxed text-slate-700">{entry.body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </MotionItem>
          );
        })}
      </MotionStagger>
      {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
    </div>
  );
}
