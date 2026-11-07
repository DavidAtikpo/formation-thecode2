'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SectionIcon from '@/app/components/SectionIcon';
import {
  DOMAINS,
  WEEK_DAYS,
  HOUR_SLOTS,
  START_DATE_NOTICE,
  formatFcfa,
  getDomain,
  getPublicEnrollmentOffer,
  formatFormationDeadlineDays,
  getFormationFeeDeadlineDays,
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

const STEPS = ['Informations', 'Domaine', 'Planning', 'Confirmation'];

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
    formationSession: 'july_2026',
    duration: 'four_months',
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
    if (step === 2) {
      if (form.scheduleDays.length !== 3) return 'Choisissez exactement 3 jours';
      if (!form.scheduleHours) return 'Choisissez un créneau horaire';
    }
    if (step === 3 && !form.acceptedPrivacy) return 'Acceptez la politique de confidentialité';
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

  const offer =
    form.domain === 'mobile' || form.domain === 'fullstack'
      ? getPublicEnrollmentOffer(form.domain)
      : null;

  return (
    <div className="mx-auto max-w-2xl px-1 sm:px-0">
      {/* Progress */}
      <div className="mb-5 flex gap-1 sm:mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1 rounded-full transition ${i <= step ? 'bg-gradient-to-r from-brand-500 to-gold-400' : 'bg-slate-200'}`}
            />
            <p className={`mt-1 hidden text-center text-xs sm:block ${i === step ? 'text-brand-600' : 'text-slate-500'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 backdrop-blur-sm sm:rounded-2xl sm:p-5">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 0: Personal info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Vos informations</h2>
            <p className="text-xs text-slate-600 sm:text-sm">
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
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Choisissez votre domaine</h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Développement web et mobile, en ligne ou en présentiel. Pour la bureautique, le design
              digital ou la robotique,{' '}
              <a href="/contact" className="font-medium text-gold-700 hover:underline">
                demandez une inscription
              </a>
              .
            </p>
            <div className="grid gap-2 sm:gap-3">
              {DOMAINS.filter((d) => d.id === 'mobile' || d.id === 'fullstack').map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => update({ domain: d.id })}
                  className={`rounded-lg border p-3 text-left transition sm:rounded-xl sm:p-3.5 ${
                    form.domain === d.id
                      ? 'border-brand-400 bg-brand-400/10 ring-1 ring-brand-400'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <SectionIcon name={d.icon} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{d.label}</p>
                      <p className="text-xs text-slate-600 sm:text-sm">{d.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {offer && (
              <div className="rounded-lg border border-brand-400/30 bg-brand-400/5 p-3 text-xs text-slate-600 sm:rounded-xl sm:p-4 sm:text-sm">
                <p className="font-semibold text-slate-900">
                  {offer.title} — {offer.label} — {formatFcfa(offer.totalXof)} F CFA
                </p>
                <p className="mt-1">{START_DATE_NOTICE}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="space-y-4 sm:space-y-5">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Planning — 3 jours par semaine</h2>
            <div>
              <p className="mb-2 text-xs text-slate-600 sm:text-sm">
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
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-slate-600 sm:text-sm">Créneau horaire</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
                {HOUR_SLOTS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => update({ scheduleHours: h.id })}
                    className={`rounded-md border px-3 py-2 text-xs transition sm:rounded-lg sm:px-3.5 sm:py-2.5 sm:text-sm ${
                      form.scheduleHours === h.id
                        ? 'border-gold-400 bg-gold-400/15 text-brand-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Récapitulatif</h2>
            <div className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs sm:rounded-xl sm:p-3.5 sm:text-sm">
              <Row label="Nom" value={`${form.firstName} ${form.lastName}`} />
              <Row label="Pays" value={form.country} />
              <Row label="Téléphone" value={form.phone} />
              <Row label="Adresse" value={form.address} />
              {form.domain && <Row label="Domaine" value={getDomain(form.domain).label} />}
              <Row label="Date de début" value="Communiquée par email" />
              {offer && <Row label="Durée" value={offer.label} />}
              <Row label="Jours" value={form.scheduleDays.map((d) => WEEK_DAYS.find((w) => w.id === d)?.label).join(', ')} />
              <Row label="Horaire" value={HOUR_SLOTS.find((h) => h.id === form.scheduleHours)?.label ?? ''} />
              {offer && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Inscription</span>
                      <span className="text-emerald-700">Gratuite</span>
                    </div>
                    <p className="border-t border-slate-200 pt-2 text-sm text-slate-600">
                      Le paiement de la formation se fait en 3 tranches depuis votre espace candidat.
                    </p>
                    <p className="text-base font-bold text-brand-600 sm:text-lg">
                      Formation : {formatFcfa(offer.totalXof)} F CFA
                    </p>
                    <div className="space-y-0.5 text-[11px] text-slate-500">
                      {offer.installments.map((inst) => (
                        <div key={inst.number} className="flex justify-between">
                          <span>{inst.label}</span>
                          <span>{formatFcfa(inst.amountXof)} F CFA</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Échéance finale : sous {formatFormationDeadlineDays(getFormationFeeDeadlineDays(offer.durationId))}{' '}
                      après le début de session.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 p-3 sm:p-3.5">
              <input
                type="checkbox"
                checked={form.acceptedPrivacy}
                onChange={(e) => update({ acceptedPrivacy: e.target.checked })}
                className="mt-1 h-4 w-4 accent-brand-400"
              />
              <span className="text-xs text-slate-600 sm:text-sm">
                J&apos;ai lu et j&apos;accepte la{' '}
                <a href="/confidentialite" target="_blank" className="text-brand-400 underline">
                  politique de confidentialité
                </a>{' '}
                de THE CODE CODE.
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
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:text-brand-600 disabled:invisible"
          >
            ← Retour
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={busy}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Continuer →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
      <label className="mb-1 block text-xs font-medium text-slate-600 sm:text-sm">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none focus:border-brand-400/50 focus:ring-1 focus:ring-brand-400/30 sm:px-3.5 sm:py-2.5"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}
