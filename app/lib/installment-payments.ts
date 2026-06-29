import type { Enrollment } from '@prisma/client';

/** Parts des 1re et 2e tranches — la 3e reçoit le reste (≈ 20 %). */
export const INSTALLMENT_SHARES = [0.4, 0.4] as const;

export type InstallmentNumber = 1 | 2 | 3;

export type InstallmentPaymentPhase = 'installment_1' | 'installment_2' | 'installment_3';

export type LegacyPaymentPhase = 'registration' | 'formation';

export type PaymentPhase = InstallmentPaymentPhase | LegacyPaymentPhase;

export const INSTALLMENT_PHASES: InstallmentPaymentPhase[] = [
  'installment_1',
  'installment_2',
  'installment_3',
];

export const INSTALLMENT_LABELS: Record<InstallmentPaymentPhase, string> = {
  installment_1: '1re tranche',
  installment_2: '2e tranche',
  installment_3: '3e tranche',
};

export function splitInstallments(totalUsd: number): [number, number, number] {
  const [share1, share2] = INSTALLMENT_SHARES;
  const i1 = Math.round(totalUsd * share1 * 100) / 100;
  const i2 = Math.round(totalUsd * share2 * 100) / 100;
  const i3 = Math.round((totalUsd - i1 - i2) * 100) / 100;
  return [i1, i2, i3];
}

export function installmentPhase(n: InstallmentNumber): InstallmentPaymentPhase {
  return `installment_${n}` as InstallmentPaymentPhase;
}

export function installmentNumberFromPhase(phase: PaymentPhase): InstallmentNumber | null {
  if (phase === 'installment_1') return 1;
  if (phase === 'installment_2') return 2;
  if (phase === 'installment_3') return 3;
  return null;
}

export function usesInstallmentPlan(enrollment: {
  registrationFeeUsd: number;
  installment1FeeUsd: number;
}) {
  return enrollment.registrationFeeUsd === 0 && enrollment.installment1FeeUsd > 0;
}

export function getInstallmentAmount(
  enrollment: Pick<
    Enrollment,
    | 'installment1FeeUsd'
    | 'installment2FeeUsd'
    | 'installment3FeeUsd'
    | 'registrationFeeUsd'
    | 'formationFeeUsd'
  >,
  n: InstallmentNumber,
): number {
  if (n === 1) return enrollment.installment1FeeUsd;
  if (n === 2) return enrollment.installment2FeeUsd;
  return enrollment.installment3FeeUsd;
}

export function isInstallmentPaid(
  enrollment: Pick<
    Enrollment,
    'installment1PaidAt' | 'installment2PaidAt' | 'installment3PaidAt'
  >,
  n: InstallmentNumber,
): boolean {
  if (n === 1) return Boolean(enrollment.installment1PaidAt);
  if (n === 2) return Boolean(enrollment.installment2PaidAt);
  return Boolean(enrollment.installment3PaidAt);
}

export function getInstallmentPaidAt(
  enrollment: Pick<
    Enrollment,
    'installment1PaidAt' | 'installment2PaidAt' | 'installment3PaidAt'
  >,
  n: InstallmentNumber,
) {
  if (n === 1) return enrollment.installment1PaidAt;
  if (n === 2) return enrollment.installment2PaidAt;
  return enrollment.installment3PaidAt;
}

export function getNextUnpaidInstallment(
  enrollment: Pick<
    Enrollment,
    | 'installment1PaidAt'
    | 'installment2PaidAt'
    | 'installment3PaidAt'
    | 'registrationFeeUsd'
    | 'installment1FeeUsd'
  >,
): InstallmentNumber | null {
  if (!usesInstallmentPlan(enrollment)) return null;
  if (!enrollment.installment1PaidAt) return 1;
  if (!enrollment.installment2PaidAt) return 2;
  if (!enrollment.installment3PaidAt) return 3;
  return null;
}

export function allInstallmentsPaid(
  enrollment: Pick<
    Enrollment,
    | 'installment1PaidAt'
    | 'installment2PaidAt'
    | 'installment3PaidAt'
    | 'registrationFeeUsd'
    | 'installment1FeeUsd'
  >,
) {
  return usesInstallmentPlan(enrollment) && getNextUnpaidInstallment(enrollment) === null;
}

export function getCryptoOrderId(enrollmentId: string, phase: PaymentPhase) {
  const n = installmentNumberFromPhase(phase);
  if (n) return `${enrollmentId}_i${n}`;
  return phase === 'registration' ? enrollmentId : `${enrollmentId}_formation`;
}

export function getPaymentPurpose(phase: PaymentPhase) {
  const n = installmentNumberFromPhase(phase);
  if (n) return `formation_installment_${n}`;
  return phase === 'registration' ? 'formation_registration' : 'formation_fee';
}

export function getPaymentLabel(phase: PaymentPhase, durationLabel: string) {
  const n = installmentNumberFromPhase(phase);
  if (n) return `${INSTALLMENT_LABELS[installmentPhase(n)]} — ${durationLabel}`;
  return phase === 'registration'
    ? `Frais d'inscription — ${durationLabel}`
    : `Frais de formation — ${durationLabel}`;
}

type PaymentFieldSet = {
  stripeSessionId: 'stripeSessionId' | 'formationStripeSessionId' | 'installment3StripeSessionId';
  fedapayTransactionId:
    | 'fedapayTransactionId'
    | 'formationFedapayTransactionId'
    | 'installment3FedapayTransactionId';
  cryptoInvoiceId:
    | 'cryptoInvoiceId'
    | 'formationCryptoInvoiceId'
    | 'installment3CryptoInvoiceId';
  paymentMethod: 'paymentMethod' | 'formationPaymentMethod' | 'installment3PaymentMethod';
};

const INSTALLMENT_FIELD_MAP: Record<InstallmentNumber, PaymentFieldSet> = {
  1: {
    stripeSessionId: 'stripeSessionId',
    fedapayTransactionId: 'fedapayTransactionId',
    cryptoInvoiceId: 'cryptoInvoiceId',
    paymentMethod: 'paymentMethod',
  },
  2: {
    stripeSessionId: 'formationStripeSessionId',
    fedapayTransactionId: 'formationFedapayTransactionId',
    cryptoInvoiceId: 'formationCryptoInvoiceId',
    paymentMethod: 'formationPaymentMethod',
  },
  3: {
    stripeSessionId: 'installment3StripeSessionId',
    fedapayTransactionId: 'installment3FedapayTransactionId',
    cryptoInvoiceId: 'installment3CryptoInvoiceId',
    paymentMethod: 'installment3PaymentMethod',
  },
};

export function getInstallmentPaymentFields(n: InstallmentNumber): PaymentFieldSet {
  return INSTALLMENT_FIELD_MAP[n];
}

export function getPhaseAmountUsd(
  enrollment: Pick<
    Enrollment,
    | 'registrationFeeUsd'
    | 'formationFeeUsd'
    | 'installment1FeeUsd'
    | 'installment2FeeUsd'
    | 'installment3FeeUsd'
  >,
  phase: PaymentPhase,
): number {
  const n = installmentNumberFromPhase(phase);
  if (n) return getInstallmentAmount(enrollment, n);
  return phase === 'registration' ? enrollment.registrationFeeUsd : enrollment.formationFeeUsd;
}

export function getPhasePaidAt(
  enrollment: Pick<
    Enrollment,
    | 'registrationPaidAt'
    | 'formationPaidAt'
    | 'installment1PaidAt'
    | 'installment2PaidAt'
    | 'installment3PaidAt'
  >,
  phase: PaymentPhase,
) {
  const n = installmentNumberFromPhase(phase);
  if (n) return getInstallmentPaidAt(enrollment, n);
  return phase === 'registration' ? enrollment.registrationPaidAt : enrollment.formationPaidAt;
}

export function isPhasePaid(
  enrollment: Pick<
    Enrollment,
    | 'registrationPaidAt'
    | 'formationPaidAt'
    | 'installment1PaidAt'
    | 'installment2PaidAt'
    | 'installment3PaidAt'
  >,
  phase: PaymentPhase,
) {
  return Boolean(getPhasePaidAt(enrollment, phase));
}
