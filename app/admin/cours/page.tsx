'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';
import {
  DOMAINS,
  DURATIONS,
  FORMATION_SESSIONS,
} from '@/app/lib/formation-config';

type ResourceType = 'course_pdf' | 'tutorial';

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  typeLabel: string;
  fileUrl: string | null;
  externalUrl: string | null;
  domain: string | null;
  domainLabel: string;
  formationSession: string | null;
  sessionLabel: string;
  duration: string | null;
  durationLabel: string;
  published: boolean;
  deliveryCount: number;
  createdAt: string;
};

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'course_pdf' as ResourceType,
  fileUrl: '',
  filePublicId: '',
  externalUrl: '',
  domain: '',
  formationSession: '',
  duration: '',
};

export default function AdminCoursPage() {
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/resources', { credentials: 'include' });
      if (!res.ok) throw new Error('Accès refusé');
      const data = await res.json();
      setResources(data.resources);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const uploadPdf = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload/course', {
        method: 'POST',
        credentials: 'include',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload impossible');
      setForm((prev) => ({ ...prev, fileUrl: data.url, filePublicId: data.publicId }));
      setUploadName(file.name);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setBusy(false);
    }
  };

  const createResource = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          fileUrl: form.fileUrl || null,
          filePublicId: form.filePublicId || null,
          externalUrl: form.externalUrl || null,
          domain: form.domain || null,
          formationSession: form.formationSession || null,
          duration: form.duration || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Création impossible');
      setForm(EMPTY_FORM);
      setUploadName(null);
      const delivery = data.delivery as
        | { matched: number; newDeliveries: number; emailsSent: number }
        | null
        | undefined;
      if (delivery && delivery.matched > 0) {
        setMessage(
          `Contenu créé et distribué à ${delivery.newDeliveries} candidat(s). ${delivery.emailsSent} email(s) envoyé(s).`,
        );
      } else if (delivery && delivery.matched === 0) {
        setMessage('Contenu créé. Aucun candidat actif ne correspond aux filtres sélectionnés.');
      } else {
        setMessage('Contenu créé.');
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const sendResource = async (id: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/resources/${id}/send`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Envoi impossible');
      setMessage(
        `Envoyé à ${data.stats.newDeliveries} participant(s). ${data.stats.emailsSent} email(s) envoyé(s).`,
      );
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const deleteResource = async (id: string) => {
    if (!confirm('Supprimer ce contenu ?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Suppression impossible');
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
          <h1 className="text-xl font-bold text-white sm:text-2xl">Cours & tutoriels</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Créez des PDF et tutoriels — les candidats concernés sont notifiés par email automatiquement.
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
            href="/admin/notifications"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
          >
            Notifications
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 sm:text-sm"
          >
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="mb-4 text-base font-semibold text-white">Nouveau contenu</h2>
          <div className="space-y-3">
            <Field label="Titre">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
                placeholder="Ex. Introduction React — Module 1"
              />
            </Field>
            <Field label="Description (optionnel)">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputClass} min-h-[72px]`}
                placeholder="Résumé du contenu…"
              />
            </Field>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}
                className={inputClass}
              >
                <option value="course_pdf">Cours PDF</option>
                <option value="tutorial">Tutoriel</option>
              </select>
            </Field>
            <Field label="Fichier PDF">
              <input
                type="file"
                accept="application/pdf"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPdf(file);
                }}
                className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
              {uploadName && (
                <p className="mt-1 text-[11px] text-green-300">PDF chargé : {uploadName}</p>
              )}
            </Field>
            {form.type === 'tutorial' && (
              <Field label="Lien tutoriel (optionnel)">
                <input
                  value={form.externalUrl}
                  onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://…"
                />
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Domaine">
                <select
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Tous</option>
                  {DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Session">
                <select
                  value={form.formationSession}
                  onChange={(e) => setForm({ ...form, formationSession: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Toutes</option>
                  {FORMATION_SESSIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shortLabel}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Durée">
                <select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Toutes</option>
                  {DURATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button
              type="button"
              onClick={createResource}
              disabled={busy}
              className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
            >
              {busy ? 'Enregistrement…' : 'Créer le contenu'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="mb-4 text-base font-semibold text-white">Contenus publiés</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingState />
            </div>
          ) : resources.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun contenu pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{resource.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {resource.typeLabel} · {resource.domainLabel} · {resource.sessionLabel}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        resource.published
                          ? 'bg-green-400/15 text-green-300'
                          : 'bg-amber-400/15 text-amber-300'
                      }`}
                    >
                      {resource.published ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  {resource.description && (
                    <p className="mb-2 text-xs text-slate-400">{resource.description}</p>
                  )}
                  <p className="mb-3 text-[11px] text-slate-500">
                    {resource.deliveryCount} envoi(s)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => sendResource(resource.id)}
                      disabled={busy}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
                    >
                      Envoyer aux participants
                    </button>
                    {resource.fileUrl && (
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                      >
                        Voir PDF
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteResource(resource.id)}
                      disabled={busy}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
