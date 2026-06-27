'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CONTACT } from '@/app/lib/contact-config';

type Props = {
  subject: string;
  messagePlaceholder: string;
  submitLabel?: string;
};

export default function EcosystemContactForm({
  subject,
  messagePlaceholder,
  submitLabel = 'Envoyer ma demande',
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50 sm:px-3.5 sm:py-2.5';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Envoi impossible');
      setFeedback({ type: 'ok', text: data.message });
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: unknown) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de l\'envoi',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:space-y-4 sm:p-5"
    >
      {feedback && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs sm:text-sm ${
            feedback.type === 'ok'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {feedback.text}
          {feedback.type === 'err' && (
            <span>
              {' '}
              <a href={CONTACT.whatsapp.url} className="underline">
                WhatsApp
              </a>
            </span>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom *">
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Message *">
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder={messagePlaceholder}
        />
      </Field>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:py-3"
      >
        {busy ? 'Envoi…' : submitLabel}
      </button>

      <p className="text-center text-[11px] text-slate-500 sm:text-xs">
        Besoin d&apos;une réponse rapide ?{' '}
        <a href={CONTACT.whatsapp.url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
          WhatsApp {CONTACT.whatsapp.display}
        </a>
        {' · '}
        <Link href="/contact" className="text-brand-400 hover:underline">
          Contact général
        </Link>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-300 sm:text-sm">{label}</label>
      {children}
    </div>
  );
}
