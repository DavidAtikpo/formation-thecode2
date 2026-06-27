'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';
import {
  JOB_CONTRACT_TYPES,
  TALENT_CATEGORIES,
} from '@/app/lib/ecosystem-public';

type Tab = 'profiles' | 'jobs';

type TalentRow = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  category: string;
  categoryLabel: string;
  headline: string | null;
  bio: string | null;
  country: string | null;
  yearsExperience: number | null;
  skills: string[];
  portfolioUrl: string | null;
  availability: string[];
  status: 'pending' | 'published' | 'archived';
  statusLabel: string;
};

type JobRow = {
  id: string;
  title: string;
  company: string;
  description: string;
  category: string;
  categoryLabel: string;
  location: string | null;
  remote: boolean;
  contractType: string;
  contractTypeLabel: string;
  status: 'pending' | 'published' | 'archived';
  statusLabel: string;
  expiresAt: string | null;
};

const EMPTY_PROFILE = {
  firstName: '',
  lastName: '',
  category: 'developer',
  headline: '',
  bio: '',
  country: '',
  yearsExperience: '',
  skills: '',
  portfolioUrl: '',
  availability: [] as string[],
};

const EMPTY_JOB = {
  title: '',
  company: '',
  description: '',
  category: 'developer',
  location: '',
  remote: false,
  contractType: 'cdi',
  expiresAt: '',
};

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50';

export default function AdminEcosystemPage() {
  const [tab, setTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState<TalentRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profilesRes, jobsRes] = await Promise.all([
        fetch('/api/admin/talent-profiles', { credentials: 'include' }),
        fetch('/api/admin/job-listings', { credentials: 'include' }),
      ]);
      if (!profilesRes.ok || !jobsRes.ok) throw new Error('Accès refusé');
      const profilesData = await profilesRes.json();
      const jobsData = await jobsRes.json();
      setProfiles(profilesData.profiles);
      setJobs(jobsData.listings);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/talent-profiles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm,
          yearsExperience: profileForm.yearsExperience ? Number(profileForm.yearsExperience) : null,
          skills: profileForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Création impossible');
      setProfileForm(EMPTY_PROFILE);
      setMessage('Profil créé — en attente de publication.');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/job-listings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobForm,
          expiresAt: jobForm.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Création impossible');
      setJobForm(EMPTY_JOB);
      setMessage('Offre créée — en attente de publication.');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const updateProfileStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/talent-profiles/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Mise à jour impossible');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const updateJobStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/job-listings/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Mise à jour impossible');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('Supprimer ce profil ?')) return;
    await fetch(`/api/admin/talent-profiles/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return;
    await fetch(`/api/admin/job-listings/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  if (loading) return <LoadingState message="Chargement écosystème…" fullScreen />;

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Écosystème</h1>
          <p className="text-xs text-slate-400 sm:text-sm">Profils & offres d&apos;emploi</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs sm:text-sm">
          <Link href="/admin" className="text-slate-400 hover:text-white">
            Inscriptions
          </Link>
          <Link href="/admin/cours" className="text-slate-400 hover:text-white">
            Cours
          </Link>
          <Link href="/admin/stats" className="text-slate-400 hover:text-white">
            Stats
          </Link>
        </nav>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          {message}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <TabButton active={tab === 'profiles'} onClick={() => setTab('profiles')}>
          Profils ({profiles.length})
        </TabButton>
        <TabButton active={tab === 'jobs'} onClick={() => setTab('jobs')}>
          Offres ({jobs.length})
        </TabButton>
      </div>

      {tab === 'profiles' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <form onSubmit={createProfile} className="space-y-3 rounded-xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-white">Nouveau profil</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prénom *">
                <input required className={inputClass} value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
              </Field>
              <Field label="Nom *">
                <input required className={inputClass} value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
              </Field>
            </div>
            <Field label="Catégorie">
              <select className={inputClass} value={profileForm.category}
                onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}>
                {TALENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0a0b1e]">{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Accroche">
              <input className={inputClass} value={profileForm.headline}
                onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })} />
            </Field>
            <Field label="Bio">
              <textarea className={`${inputClass} resize-y`} rows={3} value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
            </Field>
            <Field label="Compétences (virgules)">
              <input className={inputClass} value={profileForm.skills}
                onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })} />
            </Field>
            <button type="submit" disabled={busy}
              className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Créer le profil
            </button>
          </form>

          <div className="space-y-3">
            {profiles.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 p-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-400">{p.categoryLabel} · {p.statusLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.status !== 'published' && (
                      <ActionBtn onClick={() => updateProfileStatus(p.id, 'published')}>Publier</ActionBtn>
                    )}
                    {p.status === 'published' && (
                      <ActionBtn onClick={() => updateProfileStatus(p.id, 'archived')}>Archiver</ActionBtn>
                    )}
                    <ActionBtn danger onClick={() => deleteProfile(p.id)}>Suppr.</ActionBtn>
                  </div>
                </div>
                {p.headline && <p className="text-sm text-slate-300">{p.headline}</p>}
                {p.skills.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">{p.skills.join(', ')}</p>
                )}
              </div>
            ))}
            {profiles.length === 0 && (
              <p className="text-sm text-slate-500">Aucun profil pour le moment.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'jobs' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <form onSubmit={createJob} className="space-y-3 rounded-xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-white">Nouvelle offre</h2>
            <Field label="Titre *">
              <input required className={inputClass} value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
            </Field>
            <Field label="Entreprise *">
              <input required className={inputClass} value={jobForm.company}
                onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })} />
            </Field>
            <Field label="Description *">
              <textarea required className={`${inputClass} resize-y`} rows={4} value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Catégorie">
                <select className={inputClass} value={jobForm.category}
                  onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}>
                  {TALENT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0a0b1e]">{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Contrat">
                <select className={inputClass} value={jobForm.contractType}
                  onChange={(e) => setJobForm({ ...jobForm, contractType: e.target.value })}>
                  {JOB_CONTRACT_TYPES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0a0b1e]">{c.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Lieu">
              <input className={inputClass} value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={jobForm.remote}
                onChange={(e) => setJobForm({ ...jobForm, remote: e.target.checked })} />
              Remote possible
            </label>
            <button type="submit" disabled={busy}
              className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Créer l&apos;offre
            </button>
          </form>

          <div className="space-y-3">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-xl border border-white/10 p-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{j.title}</p>
                    <p className="text-xs text-slate-400">{j.company} · {j.contractTypeLabel} · {j.statusLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {j.status !== 'published' && (
                      <ActionBtn onClick={() => updateJobStatus(j.id, 'published')}>Publier</ActionBtn>
                    )}
                    {j.status === 'published' && (
                      <ActionBtn onClick={() => updateJobStatus(j.id, 'archived')}>Archiver</ActionBtn>
                    )}
                    <ActionBtn danger onClick={() => deleteJob(j.id)}>Suppr.</ActionBtn>
                  </div>
                </div>
                <p className="line-clamp-3 text-xs text-slate-400">{j.description}</p>
              </div>
            ))}
            {jobs.length === 0 && (
              <p className="text-sm text-slate-500">Aucune offre pour le moment.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold sm:text-sm ${
        active ? 'bg-brand-600 text-white' : 'border border-white/10 text-slate-400'
      }`}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={false}
      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-brand-400 hover:bg-brand-400/10'
      }`}>
      {children}
    </button>
  );
}
