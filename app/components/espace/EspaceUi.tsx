'use client';

import { MotionCard } from '@/app/components/Motion';
import { formatUsd } from '@/app/lib/formation-config';
import type { Receipt } from '@/app/lib/espace-types';

export function EspaceCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MotionCard
      className={`rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 ${className}`}
    >
      {children}
    </MotionCard>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}

export function PaymentRow({
  label,
  amount,
  paid,
  paidAt,
  deadline,
  overdue,
  receipt,
  highlight,
}: {
  label: string;
  amount: number;
  paid: boolean;
  paidAt: string | null;
  deadline?: string;
  overdue?: boolean;
  receipt?: Receipt;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 ${
        highlight ? 'border-brand-400/40 bg-brand-400/5' : 'border-white/10'
      }`}
    >
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{formatUsd(amount)} $</p>
        {deadline && !paid && (
          <p className={`mt-0.5 text-[11px] ${overdue ? 'text-red-300' : 'text-slate-500'}`}>
            À régler avant le {deadline}
          </p>
        )}
        {receipt && (
          <a
            href={receipt.downloadUrl}
            className="mt-1 inline-block text-[11px] font-medium text-brand-400 hover:underline"
          >
            Télécharger le reçu
          </a>
        )}
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          paid ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
        }`}
      >
        {paid
          ? `Payé${paidAt ? ` — ${new Date(paidAt).toLocaleDateString('fr-FR')}` : ''}`
          : 'En attente'}
      </span>
    </div>
  );
}
