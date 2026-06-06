'use client';

import { useState } from 'react';
import Link from 'next/link';
import BinaryNeuralAnimation from '@/app/components/BinaryNeuralAnimation';
import { MotionHero, MotionItem, MotionSection, MotionStagger } from '@/app/components/Motion';
import SectionIcon, { type IconName } from '@/app/components/SectionIcon';
import { CONTACT, CONTACT_SUBJECTS } from '@/app/lib/contact-config';

const CHANNELS: { icon: IconName; title: string; desc: string; action: React.ReactNode }[] = [
  {
    icon: 'message',
    title: 'WhatsApp',
    desc: 'Le moyen le plus rapide pour une réponse. Idéal pour les questions urgentes.',
    action: (
      <a
        href={CONTACT.whatsapp.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
      >
        Écrire sur WhatsApp
      </a>
    ),
  },
  {
    icon: 'globe',
    title: 'Email',
    desc: CONTACT.responseTime,
    action: (
      <a
        href={`mailto:${CONTACT.email}`}
        className="text-sm font-medium text-brand-400 hover:underline"
      >
        {CONTACT.email}
      </a>
    ),
  },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<string>(CONTACT_SUBJECTS[0].label);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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
      setSubject(CONTACT_SUBJECTS[0].label);
    } catch (err: unknown) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de l\'envoi',
      });
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50 sm:px-3.5 sm:py-2.5';

  return (
    <>
      <BinaryNeuralAnimation variant="page" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-10 sm:px-5 sm:pb-12">
        <div className="space-y-8 sm:space-y-10">
          <MotionHero className="relative -mx-3 overflow-hidden px-3 pb-6 pt-7 text-center sm:-mx-5 sm:px-5 sm:pb-8 sm:pt-10">
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,_rgba(36,27,255,0.18)_0%,_transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#0a0b1e]/15 via-[#0a0b1e]/35 to-[#0a0b1e]/55" />
            <div className="relative z-10">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
                Une question ?
              </p>
              <h1 className="mb-3 text-2xl font-extrabold sm:text-4xl">Contactez-nous</h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Inscription, tarifs, matériel ou paiement — notre équipe vous répond par WhatsApp
                ou par email.
              </p>
            </div>
          </MotionHero>

          <MotionSection>
            <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {CHANNELS.map((ch) => (
                <MotionItem
                  key={ch.title}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <SectionIcon name={ch.icon} size="md" />
                    <h2 className="text-base font-semibold text-white sm:text-lg">{ch.title}</h2>
                  </div>
                  <p className="mb-4 text-xs text-slate-400 sm:text-sm">{ch.desc}</p>
                  {ch.title === 'WhatsApp' && (
                    <p className="mb-3 text-sm font-medium text-brand-300">{CONTACT.whatsapp.display}</p>
                  )}
                  {ch.action}
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          <MotionSection className="mx-auto max-w-2xl">
            <h2 className="mb-1 text-base font-bold text-white sm:text-lg">Formulaire de contact</h2>
            <p className="mb-4 text-xs text-slate-400 sm:text-sm">
              Préférez l&apos;email ? Remplissez le formulaire ci-dessous.
            </p>

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

              <Field label="Sujet *">
                <select
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                >
                  {CONTACT_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.label} className="bg-[#0a0b1e]">
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Message *">
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputClass} resize-y`}
                  placeholder="Décrivez votre question…"
                />
              </Field>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:py-3"
              >
                {busy ? 'Envoi…' : 'Envoyer le message'}
              </button>
            </form>
          </MotionSection>

          <MotionSection>
            <h2 className="mb-3 text-base font-bold text-white sm:text-lg">Questions fréquentes</h2>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FaqCard
                q="Comment m'inscrire ?"
                a="Créez un compte, vérifiez votre email, puis complétez le formulaire d'inscription."
                href="/compte"
                linkLabel="Créer un compte"
              />
              <FaqCard
                q="Quels sont les tarifs ?"
                a="De 37 $ (2 semaines) à 354,99 $ (4 mois en formation personnelle)."
                href="/"
                linkLabel="Voir les tarifs"
              />
              <FaqCard
                q="Quelles sessions en 2026 ?"
                a="Juillet, août et fin août — avec 2 rencontres de préparation avant chaque session."
                href="/apropos"
                linkLabel="En savoir plus"
              />
              <FaqCard
                q="Quels moyens de paiement ?"
                a="FedaPay (FCFA), Stripe (carte USD) et crypto (BTC, USDT…)."
                href="/inscription"
                linkLabel="S'inscrire"
              />
            </div>
          </MotionSection>
        </div>
      </div>
    </>
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

function FaqCard({
  q,
  a,
  href,
  linkLabel,
}: {
  q: string;
  a: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-3.5">
      <h3 className="text-sm font-semibold text-white">{q}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">{a}</p>
      <Link href={href} className="mt-2 inline-block text-xs text-brand-400 hover:underline sm:text-sm">
        {linkLabel} →
      </Link>
    </div>
  );
}
