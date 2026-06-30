import type { PaymentPhase } from '@prisma/client';
import {
  sendAdminEnrollmentNotificationEmail,
  sendAdminPaymentNotificationEmail,
  sendEnrollmentConfirmationEmail,
} from '@/app/lib/email';
import { getAppBaseUrl } from '@/app/lib/email-verification';
import {
  getDomain,
  getDuration,
  getFormationSession,
  HOUR_SLOTS,
  WEEK_DAYS,
  type DomainId,
  type DurationId,
  type SessionId,
} from '@/app/lib/formation-config';
import {
  getInstallmentPaymentFields,
  getPhaseAmountUsd,
  installmentNumberFromPhase,
} from '@/app/lib/installment-payments';
import { PHASE_LABELS } from '@/app/lib/payment-receipt';
import { prisma } from '@/app/lib/prisma';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  fedapay: 'FedaPay',
  crypto: 'Crypto',
};

function getPhasePaymentMethod(
  enrollment: {
    paymentMethod: string | null;
    formationPaymentMethod: string | null;
    installment3PaymentMethod: string | null;
  },
  phase: PaymentPhase,
) {
  const installment = installmentNumberFromPhase(phase as Parameters<typeof installmentNumberFromPhase>[0]);
  if (installment) {
    const fields = getInstallmentPaymentFields(installment);
    return enrollment[fields.paymentMethod];
  }
  return phase === 'registration' ? enrollment.paymentMethod : enrollment.formationPaymentMethod;
}

export async function notifyAdminsOfPayment(enrollmentId: string, phase: PaymentPhase) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: { select: { email: true } } },
  });

  if (!enrollment) return;

  const method = getPhasePaymentMethod(enrollment, phase);
  const amountUsd = getPhaseAmountUsd(enrollment, phase as Parameters<typeof getPhaseAmountUsd>[1]);

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl();
  const adminUrl = `${base.replace(/\/$/, '')}/admin`;

  const phaseKey = phase as keyof typeof PHASE_LABELS;

  await sendAdminPaymentNotificationEmail({
    phase,
    phaseLabel: PHASE_LABELS[phaseKey] ?? phase,
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

function formatEnrollmentSchedule(scheduleDays: string[], scheduleHours: string) {
  const days = scheduleDays
    .map((d) => WEEK_DAYS.find((w) => w.id === d)?.label ?? d)
    .join(', ');
  const hours = HOUR_SLOTS.find((h) => h.id === scheduleHours)?.label ?? scheduleHours;
  return `${days} — ${hours}`;
}

/** Notifie l'admin et le candidat après une nouvelle inscription. */
export async function notifyEnrollmentCreated(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: { select: { email: true } } },
  });

  if (!enrollment?.user) return;

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl();
  const baseUrl = base.replace(/\/$/, '');
  const adminUrl = `${baseUrl}/admin`;
  const espaceUrl = `${baseUrl}/espace`;
  const paiementsUrl = `${baseUrl}/espace/paiements`;

  const domain = getDomain(enrollment.domain as DomainId).label;
  const session = getFormationSession(enrollment.formationSession as SessionId).period;
  const duration = getDuration(enrollment.duration as DurationId).label;
  const schedule = formatEnrollmentSchedule(enrollment.scheduleDays, enrollment.scheduleHours);

  await Promise.all([
    sendAdminEnrollmentNotificationEmail({
      firstName: enrollment.firstName,
      lastName: enrollment.lastName,
      email: enrollment.user.email,
      phone: enrollment.phone,
      country: enrollment.country,
      domain,
      session,
      duration,
      schedule,
      totalFeeUsd: enrollment.formationFeeUsd,
      adminUrl,
    }).catch(() => {}),
    sendEnrollmentConfirmationEmail({
      to: enrollment.user.email,
      firstName: enrollment.firstName,
      domain,
      session,
      duration,
      schedule,
      totalFeeUsd: enrollment.formationFeeUsd,
      installment1Usd: enrollment.installment1FeeUsd,
      installment2Usd: enrollment.installment2FeeUsd,
      installment3Usd: enrollment.installment3FeeUsd,
      espaceUrl,
      paiementsUrl,
    }).catch(() => {}),
  ]);
}

/** @deprecated Utiliser notifyEnrollmentCreated */
export async function notifyAdminsOfEnrollment(enrollmentId: string) {
  return notifyEnrollmentCreated(enrollmentId);
}
