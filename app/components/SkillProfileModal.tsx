'use client';

import { useMemo, useState } from 'react';
import ReloadSpinner from '@/app/components/ReloadSpinner';
import { getProfileTechnologies } from '@/app/lib/formation-config';

type SkillLevel = 'beginner' | 'experienced';

type Props = {
  open: boolean;
  firstName: string;
  onComplete: () => void;
  onSkip?: () => void;
};

type Step = 'level' | 'experience' | 'technologies';

export default function SkillProfileModal({ open, firstName, onComplete, onSkip }: Props) {
  const technologies = useMemo(() => getProfileTechnologies(), []);
  const [step, setStep] = useState<Step>('level');
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [yearsExperience, setYearsExperience] = useState('');
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [customTech, setCustomTech] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );
  };

  const addCustomTech = () => {
    const value = customTech.trim();
    if (!value || selectedTech.includes(value)) return;
    setSelectedTech((prev) => [...prev, value]);
    setCustomTech('');
  };

  const submit = async (level: SkillLevel, years?: number, techs?: string[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/espace/skill-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillLevel: level,
          yearsExperience: years ?? null,
          masteredTechnologies: techs ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Enregistrement impossible');
      onComplete();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const chooseLevel = async (level: SkillLevel) => {
    setSkillLevel(level);
    setError(null);
    if (level === 'beginner') {
      await submit('beginner');
      return;
    }
    setStep('experience');
  };

  const continueToTechnologies = () => {
    const years = Number(yearsExperience);
    if (!Number.isFinite(years) || years < 1 || years > 40) {
      setError("Indiquez vos années d'expérience (1 à 40)");
      return;
    }
    setError(null);
    setStep('technologies');
  };

  const finishExperienced = async () => {
    const years = Number(yearsExperience);
    if (selectedTech.length === 0) {
      setError('Sélectionnez au moins une technologie');
      return;
    }
    await submit('experienced', years, selectedTech);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-profile-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:p-6"
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-brand-400">
          Profil technique
        </p>
        <h2 id="skill-profile-title" className="text-xl font-bold text-white sm:text-2xl">
          {step === 'level' && `Bonjour ${firstName}, quel est votre niveau ?`}
          {step === 'experience' && 'Votre expérience de développement'}
          {step === 'technologies' && 'Technologies maîtrisées'}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {step === 'level' &&
            'Ces informations nous aident à vous encadrer et aller plus vite sur l’essentiel.'}
          {step === 'experience' && 'Depuis combien d’années développez-vous déjà ?'}
          {step === 'technologies' &&
            'Cochez les technologies que vous maîtrisez déjà (au moins une).'}
        </p>

        {step === 'level' && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => chooseLevel('beginner')}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-brand-400/50 hover:bg-brand-400/10 disabled:opacity-50"
            >
              <span className="text-2xl">🌱</span>
              <p className="mt-2 font-semibold text-white">Débutant</p>
              <p className="mt-1 text-xs text-slate-400">
                Je découvre le développement ou je repars de zéro.
              </p>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => chooseLevel('experienced')}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-brand-400/50 hover:bg-brand-400/10 disabled:opacity-50"
            >
              <span className="text-2xl">⚡</span>
              <p className="mt-2 font-semibold text-white">Je développe déjà</p>
              <p className="mt-1 text-xs text-slate-400">
                J’ai déjà codé des projets ou travaillé en développement.
              </p>
            </button>
          </div>
        )}

        {step === 'experience' && (
          <div className="mt-6">
            <label className="block text-xs font-medium text-slate-300">
              Années d&apos;expérience
            </label>
            <input
              type="number"
              min={1}
              max={40}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="Ex. 2"
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStep('level')}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={continueToTechnologies}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 'technologies' && (
          <div className="mt-5">
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] p-3">
              {technologies.map((tech) => {
                const active = selectedTech.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      active
                        ? 'bg-brand-500 text-white'
                        : 'border border-white/15 text-slate-300 hover:border-brand-400/40'
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                placeholder="Autre technologie…"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTech();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomTech}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
              >
                Ajouter
              </button>
            </div>
            {selectedTech.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {selectedTech.length} sélectionnée{selectedTech.length > 1 ? 's' : ''}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStep('experience')}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={finishExperienced}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
              >
                {busy && <ReloadSpinner size="sm" label="Enregistrement" />}
                Terminer
              </button>
            </div>
          </div>
        )}

        {busy && step === 'level' && skillLevel === 'beginner' && (
          <div className="mt-4 flex justify-center">
            <ReloadSpinner size="sm" label="Enregistrement" />
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {onSkip && step === 'level' && !busy && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-5 text-xs text-slate-500 hover:text-slate-300"
          >
            Passer pour l&apos;instant
          </button>
        )}
      </div>
    </div>
  );
}
