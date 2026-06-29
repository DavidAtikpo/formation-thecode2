import type { Enrollment } from '@prisma/client';
import {
  getNextUnpaidInstallment,
  getPaymentPurpose,
  getPhaseAmountUsd,
  installmentNumberFromPhase,
  isPhasePaid,
  usesInstallmentPlan,
  type PaymentPhase,
} from '@/app/lib/installment-payments';
import {
  markFormationPaidIfActive,
  markInstallmentPaid,
  markRegistrationPaidIfPending,
} from '@/app/lib/enrollment-security';
import { getCryptoOrderId } from '@/app/lib/enrollment-payments';
import { isCryptoOrderPaid } from '@/app/lib/crypto-payments';
import { retrieveFedapayTransaction } from '@/app/lib/fedapay';
import { usdToStripeCents, usdToXof } from '@/app/lib/formation-config';
import { getStripe } from '@/app/lib/stripe';

export type { PaymentPhase } from '@/app/lib/installment-payments';

export function resolvePaymentPhase(
  enrollment: Enrollment,
  explicitPhase?: string | null,
): PaymentPhase {
  if (
    explicitPhase === 'formation' ||
    explicitPhase === 'registration' ||
    explicitPhase === 'installment_1' ||
    explicitPhase === 'installment_2' ||
    explicitPhase === 'installment_3'
  ) {
    return explicitPhase;
  }

  if (usesInstallmentPlan(enrollment)) {
    const next = getNextUnpaidInstallment(enrollment);
    if (next) return `installment_${next}` as PaymentPhase;
    return 'installment_3';
  }

  if (enrollment.status === 'pending_payment') return 'registration';
  if (enrollment.status === 'active' && !enrollment.formationPaidAt) return 'formation';
  return 'registration';
}

export function getExpectedStripeCents(enrollment: Enrollment, phase: PaymentPhase) {
  return usdToStripeCents(getPhaseAmountUsd(enrollment, phase));
}

export function getExpectedXof(enrollment: Enrollment, phase: PaymentPhase) {
  return usdToXof(getPhaseAmountUsd(enrollment, phase));
}

async function markPhasePaid(enrollmentId: string, phase: PaymentPhase) {
  const installment = installmentNumberFromPhase(phase);
  if (installment) {
    return markInstallmentPaid(enrollmentId, installment);
  }
  if (phase === 'registration') {
    return markRegistrationPaidIfPending(enrollmentId);
  }
  return markFormationPaidIfActive(enrollmentId);
}

export async function verifyStripePayment(
  enrollment: Enrollment,
  sessionId: string,
  userId: string,
  phase: PaymentPhase,
) {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const purpose = getPaymentPurpose(phase);
  const amountOk = session.amount_total === getExpectedStripeCents(enrollment, phase);

  if (
    session.payment_status !== 'paid' ||
    session.metadata?.purpose !== purpose ||
    session.metadata?.userId !== userId ||
    (session.metadata?.enrollmentId ?? session.client_reference_id) !== enrollment.id ||
    !amountOk
  ) {
    return null;
  }

  return markPhasePaid(enrollment.id, phase);
}

export async function verifyFedapayPayment(
  enrollment: Enrollment,
  transactionId: string,
  phase: PaymentPhase,
) {
  const transaction = await retrieveFedapayTransaction(transactionId);
  const amountOk = Number(transaction?.amount) === getExpectedXof(enrollment, phase);

  if (!transaction?.wasPaid() || !amountOk) return null;

  return markPhasePaid(enrollment.id, phase);
}

export async function verifyCryptoPayment(enrollment: Enrollment, phase: PaymentPhase) {
  const orderId = getCryptoOrderId(enrollment.id, phase);
  if (!(await isCryptoOrderPaid(orderId))) return null;

  return markPhasePaid(enrollment.id, phase);
}

export function isPhaseAlreadyPaid(enrollment: Enrollment, phase: PaymentPhase) {
  return isPhasePaid(enrollment, phase);
}
