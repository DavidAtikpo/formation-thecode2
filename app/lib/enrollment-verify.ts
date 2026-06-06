import type { Enrollment } from '@prisma/client';
import { markFormationPaidIfActive, markRegistrationPaidIfPending } from '@/app/lib/enrollment-security';
import { getCryptoOrderId } from '@/app/lib/enrollment-payments';
import { isCryptoOrderPaid } from '@/app/lib/crypto-payments';
import { retrieveFedapayTransaction } from '@/app/lib/fedapay';
import { usdToStripeCents, usdToXof } from '@/app/lib/formation-config';
import { getStripe } from '@/app/lib/stripe';

export type PaymentPhase = 'registration' | 'formation';

export function resolvePaymentPhase(
  enrollment: Enrollment,
  explicitPhase?: string | null,
): PaymentPhase {
  if (explicitPhase === 'formation' || explicitPhase === 'registration') {
    return explicitPhase;
  }
  if (enrollment.status === 'pending_payment') return 'registration';
  if (enrollment.status === 'active' && !enrollment.formationPaidAt) return 'formation';
  return 'registration';
}

export function getExpectedStripeCents(enrollment: Enrollment, phase: PaymentPhase) {
  const usd = phase === 'registration' ? enrollment.registrationFeeUsd : enrollment.formationFeeUsd;
  return usdToStripeCents(usd);
}

export function getExpectedXof(enrollment: Enrollment, phase: PaymentPhase) {
  const usd = phase === 'registration' ? enrollment.registrationFeeUsd : enrollment.formationFeeUsd;
  return usdToXof(usd);
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
  const purpose = phase === 'registration' ? 'formation_registration' : 'formation_fee';
  const amountOk = session.amount_total === getExpectedStripeCents(enrollment, phase);

  if (
    session.payment_status !== 'paid'
    || session.metadata?.purpose !== purpose
    || session.metadata?.userId !== userId
    || (session.metadata?.enrollmentId ?? session.client_reference_id) !== enrollment.id
    || !amountOk
  ) {
    return null;
  }

  if (phase === 'registration') {
    return markRegistrationPaidIfPending(enrollment.id);
  }
  return markFormationPaidIfActive(enrollment.id);
}

export async function verifyFedapayPayment(
  enrollment: Enrollment,
  transactionId: string,
  phase: PaymentPhase,
) {
  const transaction = await retrieveFedapayTransaction(transactionId);
  const amountOk = Number(transaction?.amount) === getExpectedXof(enrollment, phase);

  if (!transaction?.wasPaid() || !amountOk) return null;

  if (phase === 'registration') {
    return markRegistrationPaidIfPending(enrollment.id);
  }
  return markFormationPaidIfActive(enrollment.id);
}

export async function verifyCryptoPayment(enrollment: Enrollment, phase: PaymentPhase) {
  const orderId = getCryptoOrderId(enrollment.id, phase);
  if (!(await isCryptoOrderPaid(orderId))) return null;

  if (phase === 'registration') {
    return markRegistrationPaidIfPending(enrollment.id);
  }
  return markFormationPaidIfActive(enrollment.id);
}
