'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SectionIcon from '@/app/components/SectionIcon';
import { useEspace } from '@/app/components/espace/EspaceProvider';
import { EspaceCard, PaymentRow } from '@/app/components/espace/EspaceUi';
import type { PaymentMethodId } from '@/app/lib/enrollment-checkout';
import { formatUsd } from '@/app/lib/formation-config';

function PaiementsContent() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');
  const { data } = useEspace();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('fedapay');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deadlineDate = new Date(data.formationDeadline).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const registrationReceipt = data.receipts.find((r) => r.phase === 'registration');
  const formationReceipt = data.receipts.find((r) => r.phase === 'formation');

  const payRegistration = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/enrollment/registration-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Paiement impossible');
      window.location.href = json.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  };

  const payFormation = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/enrollment/formation-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Paiement impossible');
      window.location.href = json.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  };

  return (
    <>
      {cancelled && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 sm:text-sm">
          Paiement annulé. Vous pouvez réessayer ci-dessous.
        </div>
      )}

      <EspaceCard>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
          <SectionIcon name="credit" size="sm" />
          Paiements
        </h2>

        <div className="space-y-3">
          <PaymentRow
            label="Frais d'inscription"
            amount={data.registrationFeeUsd}
            paid={data.registrationPaid}
            paidAt={data.registrationPaidAt}
            receipt={registrationReceipt}
          />
          <PaymentRow
            label="Frais de formation"
            amount={data.formationFeeUsd}
            paid={data.formationPaid}
            paidAt={data.formationPaidAt}
            deadline={!data.formationPaid ? deadlineDate : undefined}
            overdue={data.formationOverdue}
            receipt={formationReceipt}
          />
        </div>

        {!data.registrationPaid && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs text-slate-400 sm:text-sm">
              Finalisez votre inscription en réglant les frais d&apos;inscription (
              <strong className="text-slate-200">{formatUsd(data.registrationFeeUsd)} $</strong>
              ).
            </p>
            {error && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
            <button
              type="button"
              onClick={payRegistration}
              disabled={busy}
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy
                ? 'Redirection…'
                : `Payer les frais d'inscription — ${formatUsd(data.registrationFeeUsd)} $`}
            </button>
          </div>
        )}

        {!data.formationPaid && data.registrationPaid && data.formationFeeUsd > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs text-slate-400 sm:text-sm">
              Les frais de formation doivent être réglés au plus tard le{' '}
              <strong className="text-slate-200">{deadlineDate}</strong> (
              {data.formationDeadlineLabel} après le début de votre session).
            </p>
            {data.formationOverdue && (
              <p className="mb-3 text-xs font-medium text-red-300 sm:text-sm">
                Délai dépassé — merci de régler dès que possible.
              </p>
            )}
            {error && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
            <button
              type="button"
              onClick={payFormation}
              disabled={busy}
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy
                ? 'Redirection…'
                : `Payer les frais de formation — ${formatUsd(data.formationFeeUsd)} $`}
            </button>
          </div>
        )}

        {data.registrationPaid && data.formationPaid && (
          <p className="mt-3 text-xs text-green-300 sm:text-sm">
            Tous les frais sont réglés. Votre place est confirmée.
          </p>
        )}

        {data.registrationPaid && !data.formationPaid && data.formationFeeUsd <= 0 && (
          <p className="mt-3 text-xs text-green-300 sm:text-sm">
            Frais d&apos;inscription réglés. Votre place est confirmée.
          </p>
        )}

        {!data.registrationPaid && (
          <p className="mt-3 text-xs text-amber-300 sm:text-sm">
            Votre inscription est enregistrée. Réglez les frais d&apos;inscription pour confirmer
            votre place.
          </p>
        )}

        {data.receipts.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs text-slate-400 sm:text-sm">
              Un reçu vous a été envoyé par email à chaque paiement. Vous pouvez aussi le
              télécharger ici :
            </p>
            <div className="space-y-2">
              {data.receipts.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{r.phaseLabel}</p>
                    <p className="text-[11px] text-slate-500">
                      {r.receiptNumber} — {new Date(r.paidAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <a
                    href={r.downloadUrl}
                    className="rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-400/20"
                  >
                    Télécharger
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </EspaceCard>

      <p className="mt-4 text-center text-xs text-slate-500">
        Une question ?{' '}
        <Link href="/contact" className="text-brand-400 hover:underline">
          Contactez-nous
        </Link>
      </p>
    </>
  );
}

export default function PaiementsPage() {
  return (
    <Suspense fallback={null}>
      <PaiementsContent />
    </Suspense>
  );
}

function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethodId;
  onChange: (m: PaymentMethodId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {(['fedapay', 'stripe', 'crypto'] as PaymentMethodId[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition sm:text-sm ${
            value === m
              ? 'border-brand-400 bg-brand-400/10 text-white'
              : 'border-white/10 text-slate-300 hover:bg-white/5'
          }`}
        >
          {m === 'fedapay' ? 'FedaPay' : m === 'stripe' ? 'Stripe' : 'Crypto'}
        </button>
      ))}
    </div>
  );
}
