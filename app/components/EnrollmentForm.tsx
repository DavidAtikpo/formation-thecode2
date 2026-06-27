'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SectionIcon from '@/app/components/SectionIcon';
import {
  DOMAINS,
  DURATIONS,
  FORMATION_SESSIONS,
  WEEK_DAYS,
  HOUR_SLOTS,
  formatUsd,
  getDuration,
  getDomain,
  getFormationSession,
  formatFormationDeadlineDays,
  type DomainId,
  type DurationId,
  type SessionId,
} from '@/app/lib/formation-config';

type FormData = {
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  address: string;
  domain: DomainId | '';
  formationSession: SessionId | '';
  duration: DurationId | '';
  scheduleDays: string[];
  scheduleHours: string;
  acceptedPrivacy: boolean;
};

const STEPS = [
  'Informations',
  'Domaine',
  'Session',
  'Planning',
  'Confirmation',
];

export default function EnrollmentForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    country: '',
    phone: '',
    address: '',
    domain: '',
    formationSession: '',
    duration: '',
    scheduleDays: [],
    scheduleHours: '',
    acceptedPrivacy: false,
  });

  const update = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }));

  const selectedSession = form.formationSession
    ? getFormationSession(form.formationSession)
    : null;

  const toggleDay = (dayId: string) => {
    setForm((f) => {
      const days = f.scheduleDays.includes(dayId)
        ? f.scheduleDays.filter((d) => d !== dayId)
        : f.scheduleDays.length < 3
          ? [...f.scheduleDays, dayId]
          : f.scheduleDays;
      return { ...f, scheduleDays: days };
    });
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.firstName || !form.lastName) return 'Nom et prénom requis';
      if (!form.country || !form.phone || !form.address) return 'Coordonnées incomplètes';
    }
    if (step === 1 && !form.domain) return 'Sélectionnez un domaine';
    if (step === 2) {
      if (!form.duration) return 'Choisissez une durée de formation';
      if (!form.formationSession) return 'Choisissez votre date de début';
    }
    if (step === 3) {
      if (form.scheduleDays.length !== 3) return 'Choisissez exactement 3 jours';
      if (!form.scheduleHours) return 'Choisissez un créneau horaire';
    }
    if (step === 4 && !form.acceptedPrivacy) return 'Acceptez la politique de confidentialité';
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/enrollment/submit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Inscription impossible');
      router.push('/espace/paiements');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  };

  const price = form.duration ? getDuration(form.duration) : null;

  return (
    <div className="mx-auto max-w-2xl px-1 sm:px-0">
      {/* Progress */}
      <div className="mb-5 flex gap-1 sm:mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1 rounded-full transition ${i <= step ? 'bg-gradient-to-r from-brand-400 to-violet-500' : 'bg-white/10'}`}
            />
            <p className={`mt-1 hidden text-center text-xs sm:block ${i === step ? 'text-brand-300' : 'text-slate-500'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:rounded-2xl sm:p-5">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Step 0: Personal info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white sm:text-xl">Vos informations</h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              La vérification d&apos;identité (carte d&apos;identité ou passeport) se fera dans votre espace
              candidat après l&apos;inscription.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prénom" value={form.firstName} onChange={(v) => update({ firstName: v })} />
              <Field label="Nom" value={form.lastName} onChange={(v) => update({ lastName: v })} />
            </div>
            <Field label="Pays" value={form.country} onChange={(v) => update({ country: v })} />
            <Field label="Téléphone" value={form.phone} onChange={(v) => update({ phone: v })} type="tel" />
            <Field label="Adresse" value={form.address} onChange={(v) => update({ address: v })} />
          </div>
        )}

        {/* Step 1: Domain */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white sm:text-xl">Choisissez votre domaine</h2>
            <div className="grid gap-2 sm:gap-3">
              {DOMAINS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => update({ domain: d.id })}
                  className={`rounded-lg border p-3 text-left transition sm:rounded-xl sm:p-3.5 ${
                    form.domain === d.id
                      ? 'border-brand-400 bg-brand-400/10 ring-1 ring-brand-400'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <SectionIcon name={d.icon} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-white">{d.label}</p>
                      <p className="text-xs text-slate-400 sm:text-sm">{d.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Durée (onglets) puis date de début */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">Choisissez votre session</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
                Sélectionnez d&apos;abord la durée, puis la date à laquelle vous souhaitez commencer.
                Deux rencontres de préparation (Design Thinking et Scrum) auront lieu avant chaque début.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-slate-300 sm:text-sm">Durée de formation</p>
              <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => update({ duration: d.id })}
                    className={`flex-1 rounded-md px-1.5 py-2 text-center text-[11px] font-semibold transition sm:px-3 sm:py-2.5 sm:text-sm ${
                      form.duration === d.id
                        ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {form.duration && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-300 sm:text-sm">
                  Date de début — {getDuration(form.duration).label}
                </p>
                <div className="grid gap-2 sm:gap-3">
                  {FORMATION_SESSIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => update({ formationSession: s.id })}
                      className={`rounded-lg border p-3 text-left transition sm:rounded-xl sm:p-3.5 ${
                        form.formationSession === s.id
                          ? 'border-brand-400 bg-brand-400/10 ring-1 ring-brand-400'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{s.tabLabel} 2026</p>
                      <p className="mt-0.5 text-xs text-brand-300 sm:text-sm">{s.period}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSession && price && (
              <div className="rounded-lg border border-brand-400/30 bg-brand-400/5 p-3 sm:rounded-xl sm:p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <SectionIcon name="calendar" size="sm" className="bg-brand-400/10 text-brand-300" />
                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    {selectedSession.period} · {price.label}
                  </h3>
                  <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] text-violet-300">
                    {price.highlight}
                  </span>
                  {'personal' in price && price.personal && (
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-300">
                      Personnelle
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{price.subtitle}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {price.description}
                </p>
                <div className="mt-3 space-y-0.5 border-t border-white/10 pt-3 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Frais d&apos;inscription</span>
                    <span>{price.registrationFeeUsd} $</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Frais de formation</span>
                    <span>{formatUsd(price.formationFeeUsd)} $</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5 font-semibold text-brand-300">
                    <span>Total</span>
                    <span>{formatUsd(price.registrationFeeUsd + price.formationFeeUsd)} $</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-4 sm:space-y-5">
            <h2 className="text-lg font-bold text-white sm:text-xl">Planning — 3 jours par semaine</h2>
            <div>
              <p className="mb-2 text-xs text-slate-400 sm:text-sm">
                Sélectionnez 3 jours ({form.scheduleDays.length}/3)
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition sm:rounded-lg sm:px-3.5 sm:py-2 sm:text-sm ${
                      form.scheduleDays.includes(d.id)
                        ? 'bg-brand-500 text-white'
                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-slate-400 sm:text-sm">Créneau horaire</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
                {HOUR_SLOTS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => update({ scheduleHours: h.id })}
                    className={`rounded-md border px-3 py-2 text-xs transition sm:rounded-lg sm:px-3.5 sm:py-2.5 sm:text-sm ${
                      form.scheduleHours === h.id
                        ? 'border-violet-400 bg-violet-400/10 text-white'
                        : 'border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white sm:text-xl">Récapitulatif</h2>
            <div className="space-y-1.5 rounded-lg bg-white/5 p-3 text-xs sm:rounded-xl sm:p-3.5 sm:text-sm">
              <Row label="Nom" value={`${form.firstName} ${form.lastName}`} />
              <Row label="Pays" value={form.country} />
              <Row label="Téléphone" value={form.phone} />
              <Row label="Adresse" value={form.address} />
              {form.domain && <Row label="Domaine" value={getDomain(form.domain).label} />}
              {selectedSession && (
                <Row label="Date de début" value={selectedSession.period} />
              )}
              {price && <Row label="Durée" value={price.label} />}
              <Row label="Jours" value={form.scheduleDays.map((d) => WEEK_DAYS.find((w) => w.id === d)?.label).join(', ')} />
              <Row label="Horaire" value={HOUR_SLOTS.find((h) => h.id === form.scheduleHours)?.label ?? ''} />
              {price && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div className="space-y-1 text-xs sm:text-sm">
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Frais d&apos;inscription</span>
                        <span>{price.registrationFeeUsd} $</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Frais de formation</span>
                        <span>{formatUsd(price.formationFeeUsd)} $</span>
                      </div>
                    </>
                    <p className="border-t border-white/10 pt-2 text-sm text-slate-400">
                      Les frais d&apos;inscription et de formation se règlent ensuite dans votre
                      espace candidat.
                    </p>
                    <p className="text-base font-bold text-brand-300 sm:text-lg">
                      Inscription : {formatUsd(price.registrationFeeUsd)} $
                      {price.formationFeeUsd > 0 &&
                        ` · Formation : ${formatUsd(price.formationFeeUsd)} $`}
                    </p>
                    {price.formationFeeUsd > 0 && (
                      <p className="text-[11px] text-slate-500">
                        Frais de formation à régler sous{' '}
                        {formatFormationDeadlineDays(price.formationFeeDeadlineDays)} après le début
                        de session.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 p-3 sm:p-3.5">
              <input
                type="checkbox"
                checked={form.acceptedPrivacy}
                onChange={(e) => update({ acceptedPrivacy: e.target.checked })}
                className="mt-1 h-4 w-4 accent-brand-400"
              />
              <span className="text-xs text-slate-300 sm:text-sm">
                J&apos;ai lu et j&apos;accepte la{' '}
                <a href="/confidentialite" target="_blank" className="text-brand-400 underline">
                  politique de confidentialité
                </a>{' '}
                de The Code².
              </span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-5 flex justify-between sm:mt-6">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || busy}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white disabled:invisible"
          >
            ← Retour
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={busy}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Continuer →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Enregistrement…' : 'Terminer l\'inscription →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-300 sm:text-sm">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-400/50 focus:ring-1 focus:ring-brand-400/30 sm:px-3.5 sm:py-2.5"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}
