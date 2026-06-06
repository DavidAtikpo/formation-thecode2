import type { PaymentPhase } from '@prisma/client';
import { sendAdminPaymentNotificationEmail } from '@/app/lib/email';
import { getAppBaseUrl } from '@/app/lib/email-verification';
import {
  getDomain,
  getDuration,
  getFormationSession,
  type DomainId,
  type DurationId,
  type SessionId,
} from '@/app/lib/formation-config';
import { PHASE_LABELS } from '@/app/lib/payment-receipt';
import { prisma } from '@/app/lib/prisma';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  fedapay: 'FedaPay',
  crypto: 'Crypto',
};

export async function notifyAdminsOfPayment(enrollmentId: string, phase: PaymentPhase) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: { select: { email: true } } },
  });

  if (!enrollment) return;

  const method =
    phase === 'registration' ? enrollment.paymentMethod : enrollment.formationPaymentMethod;

  const amountUsd =
    phase === 'registration' ? enrollment.registrationFeeUsd : enrollment.formationFeeUsd;

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl();
  const adminUrl = `${base.replace(/\/$/, '')}/admin`;

  await sendAdminPaymentNotificationEmail({
    phase,
    phaseLabel: PHASE_LABELS[phase],
    amountUsd,
    firstName: enrollment.firstName,
    lastName: enrollment.lastName,
    email: enrollment.user.email,
    domain: getDomain(enrollment.domain as DomainId).label,
    session: getFormationSession(enrollment.formationSession as SessionId).period,
    duration: getDuration(enrollment.duration as DurationId).label,
    paymentMethod: method ? (PAYMENT_METHOD_LABELS[method] ?? method) : '—',
    adminUrl,
  }).catch(() => {});
}
