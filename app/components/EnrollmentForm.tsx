'use client';

import { useState } from 'react';
import SectionIcon from '@/app/components/SectionIcon';
import type { PaymentMethodId } from '@/app/lib/enrollment-checkout';
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
  getDurationTotalUsd,
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
  'Durée',
  'Planning',
  'Confirmation',
  'Paiement',
];

export default function EnrollmentForm() {
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('fedapay');
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
    if (step === 2 && !form.formationSession) return 'Sélectionnez une session de formation';
    if (step === 3 && !form.duration) return 'Sélectionnez une durée';
    if (step === 4) {
      if (form.scheduleDays.length !== 3) return 'Choisissez exactement 3 jours';
      if (!form.scheduleHours) return 'Choisissez un créneau horaire';
    }
    if (step === 5 && !form.acceptedPrivacy) return 'Acceptez la politique de confidentialité';
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

  const pay = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/enrollment/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Paiement impossible');
      window.location.href = data.url;
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

        {/* Step 2: Formation session */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white sm:text-xl">Session de formation</h2>
            <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
              Choisissez la période qui vous convient.{' '}
              <strong className="font-medium text-slate-200">
                Deux rencontres de préparation
              </strong>{' '}
              (Design Thinking et Scrum) auront lieu avant le début de votre session.
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
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  <p className="mt-1 text-xs text-brand-300 sm:text-sm">{s.period}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Duration */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white sm:text-xl">Durée de la formation</h2>
            <div className="grid gap-2 sm:gap-3">
              {DURATIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => update({ duration: d.id })}
                  className={`rounded-lg border p-3 text-left transition sm:rounded-xl sm:p-3.5 ${
                    form.duration === d.id
                      ? 'border-violet-400 bg-violet-400/10 ring-1 ring-violet-400'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{d.label}</p>
                    <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] text-violet-300">
                      {d.highlight}
                    </span>
                    {'personal' in d && d.personal && (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-300">
                        Personnelle
                      </span>
                    )}
                  </div>
                  <p className="mb-1 text-xs text-slate-400">{d.subtitle}</p>
                  <p className="mb-2 text-xs leading-relaxed text-slate-400">{d.description}</p>
                  <div className="space-y-0.5 border-t border-white/10 pt-2 text-xs">
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Inscription</span>
                        <span>{d.registrationFeeUsd} $</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Formation</span>
                        <span>{formatUsd(d.formationFeeUsd)} $</span>
                      </div>
                    </>
                    <div className="flex justify-between font-semibold text-brand-300">
                      <span>Total</span>
                      <span>{formatUsd(getDurationTotalUsd(d))} $</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
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

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white sm:text-xl">Récapitulatif</h2>
            <div className="space-y-1.5 rounded-lg bg-white/5 p-3 text-xs sm:rounded-xl sm:p-3.5 sm:text-sm">
              <Row label="Nom" value={`${form.firstName} ${form.lastName}`} />
              <Row label="Pays" value={form.country} />
              <Row label="Téléphone" value={form.phone} />
              <Row label="Adresse" value={form.address} />
              {form.domain && <Row label="Domaine" value={getDomain(form.domain).label} />}
              {form.formationSession && (
                <Row
                  label="Session"
                  value={`${getFormationSession(form.formationSession).label} — ${getFormationSession(form.formationSession).period}`}
                />
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
                      À payer maintenant : frais d&apos;inscription
                    </p>
                    <p className="text-base font-bold text-brand-300 sm:text-lg">
                      {formatUsd(price.registrationFeeUsd)} $
                    </p>
                    {price.formationFeeUsd > 0 && (
                      <p className="text-[11px] text-slate-500">
                        Frais de formation ({formatUsd(price.formationFeeUsd)} $) — à régler dans
                        votre espace candidat sous {formatFormationDeadlineDays(price.formationFeeDeadlineDays)} après le début de session.
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

        {/* Step 6: Payment */}
        {step === 6 && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">💳</div>
            <h2 className="text-lg font-bold text-white sm:text-xl">Frais d&apos;inscription</h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              Seuls les frais d&apos;inscription sont dus aujourd&apos;hui. Les frais de formation
              se règlent ensuite dans votre espace candidat.
            </p>
            {price && (
              <div>
                <p className="text-xl font-bold text-brand-300 sm:text-2xl">
                  {formatUsd(price.registrationFeeUsd)} $
                </p>
                {price.formationFeeUsd > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    + {formatUsd(price.formationFeeUsd)} $ de frais de formation (plus tard)
                  </p>
                )}
                {paymentMethod === 'fedapay' && (
                  <p className="mt-1 text-xs text-slate-400">
                    ≈ {Math.round(price.registrationFeeUsd * 600).toLocaleString('fr-FR')} FCFA via FedaPay
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 text-left sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('fedapay')}
                className={`rounded-lg border p-3 transition sm:rounded-xl sm:p-3.5 ${
                  paymentMethod === 'fedapay'
                    ? 'border-brand-400 bg-brand-400/10 ring-1 ring-brand-400'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <p className="text-sm font-semibold text-white">FedaPay</p>
                <p className="mt-1 text-xs text-slate-400">
                  Mobile Money, carte — FCFA
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`rounded-lg border p-3 transition sm:rounded-xl sm:p-3.5 ${
                  paymentMethod === 'stripe'
                    ? 'border-violet-400 bg-violet-400/10 ring-1 ring-violet-400'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <p className="text-sm font-semibold text-white">Stripe</p>
                <p className="mt-1 text-xs text-slate-400">
                  Carte bancaire — dollars
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('crypto')}
                className={`rounded-lg border p-3 transition sm:rounded-xl sm:p-3.5 ${
                  paymentMethod === 'crypto'
                    ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <p className="text-sm font-semibold text-white">Crypto</p>
                <p className="mt-1 text-xs text-slate-400">
                  BTC, USDT, ETH… — dollars
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={pay}
              disabled={busy}
              className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 sm:rounded-xl sm:py-3.5 sm:text-base"
            >
              {busy
                ? 'Redirection…'
                : paymentMethod === 'fedapay'
                  ? 'Payer avec FedaPay'
                  : paymentMethod === 'crypto'
                    ? 'Payer en crypto'
                    : 'Payer avec Stripe'}
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 6 && (
          <div className="mt-5 flex justify-between sm:mt-6">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white disabled:invisible"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={next}
              disabled={busy}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Continuer →
            </button>
          </div>
        )}
        {step === 6 && (
          <button type="button" onClick={back} className="mt-4 text-sm text-slate-400 hover:text-white">
            ← Retour
          </button>
        )}
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
