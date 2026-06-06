'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DOMAINS,
  DURATIONS,
  FORMATION_SESSIONS,
} from '@/app/lib/formation-config';

const EMPTY_FORM = {
  formationSession: '',
  domain: '',
  duration: '',
  subject: '',
  message: '',
};

export default function AdminNotificationsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const send = async () => {
    if (!form.formationSession || !form.subject.trim() || !form.message.trim()) return;

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/session-notify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationSession: form.formationSession,
          domain: form.domain || null,
          duration: form.duration || null,
          subject: form.subject,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Envoi impossible');

      setMessage(
        `Email envoyé à ${data.stats.emailsSent} candidat(s) sur ${data.stats.matched} (${data.stats.matched - data.stats.emailsSent} échec(s) éventuel(s)).`,
      );
      setForm((prev) => ({ ...prev, subject: '', message: '' }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-8 sm:px-5 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
            Administration
          </p>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Notifications par session</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Envoyez un email à tous les candidats actifs d&apos;une session de formation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
          >
            Inscriptions
          </Link>
          <Link
            href="/admin/stats"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
          >
            Statistiques
          </Link>
          <Link
            href="/admin/cours"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
          >
            Cours
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

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-white">Message groupé</h2>

        <div className="space-y-3">
          <Field label="Session *">
            <select
              value={form.formationSession}
              onChange={(e) => setForm({ ...form, formationSession: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="">Choisir une session</option>
              {FORMATION_SESSIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.period})
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Domaine (optionnel)">
              <select
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Tous les domaines</option>
                {DOMAINS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Durée (optionnel)">
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Toutes les durées</option>
                {DURATIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Sujet *">
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Ex. Rappel — cours de demain"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </Field>

          <Field label="Message *">
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={6}
              placeholder="Votre message aux candidats…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </Field>

          <button
            type="button"
            disabled={busy || !form.formationSession || form.subject.trim().length < 3 || form.message.trim().length < 10}
            onClick={send}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50 sm:w-auto"
          >
            {busy ? 'Envoi en cours…' : 'Envoyer à la session'}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400 sm:text-sm">
        <p className="mb-2 font-semibold text-slate-300">Notifications automatiques</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Cours PDF & tutoriels : email envoyé automatiquement à la création</li>
          <li>Notes : email au candidat concerné à chaque ajout</li>
          <li>Certificat : email au candidat quand l&apos;URL est publiée</li>
          <li>Paiements : email admin à chaque inscription ou formation payée</li>
        </ul>
        <p className="mt-3 text-[11px] text-slate-500">
          Les emails admin sont envoyés aux adresses définies dans{' '}
          <code className="text-slate-400">ADMIN_EMAILS</code> (ou{' '}
          <code className="text-slate-400">CONTACT_EMAIL</code> en secours).
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}
