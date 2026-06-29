import { prisma } from '@/app/lib/prisma';
import {
  allInstallmentsPaid,
  installmentPhase,
  type InstallmentNumber,
  usesInstallmentPlan,
} from '@/app/lib/installment-payments';
import { notifyAdminsOfPayment } from '@/app/lib/payment-admin-notify';
import { issuePaymentReceipt } from '@/app/lib/payment-receipt';

export async function assertUserCanEnroll(userId: string) {
  const existing = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: { in: ['active', 'paid'] },
    },
    select: { id: true },
  });
  if (existing) {
    return { ok: false as const, error: 'Vous avez déjà une inscription en cours' };
  }
  return { ok: true as const };
}

export async function cancelStalePendingEnrollments(userId: string) {
  await prisma.enrollment.updateMany({
    where: { userId, status: 'pending_payment' },
    data: { status: 'cancelled' },
  });
}

export async function markRegistrationPaidIfPending(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, status: 'pending_payment' },
  });
  if (!enrollment) return null;

  const now = new Date();
  const fullyPaid = enrollment.formationFeeUsd <= 0;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: fullyPaid
      ? {
          status: 'paid',
          registrationPaidAt: now,
          formationPaidAt: now,
          paidAt: now,
        }
      : {
          status: 'active',
          registrationPaidAt: now,
        },
  });

  const updated = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (updated) {
    await issuePaymentReceipt(enrollmentId, 'registration').catch(() => {});
    await notifyAdminsOfPayment(enrollmentId, 'registration').catch(() => {});
  }
  return updated;
}

export async function markFormationPaidIfActive(enrollmentId: string) {
  const result = await prisma.enrollment.updateMany({
    where: { id: enrollmentId, status: 'active', formationPaidAt: null },
    data: {
      status: 'paid',
      formationPaidAt: new Date(),
      paidAt: new Date(),
    },
  });
  if (result.count === 0) return null;
  const updated = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (updated) {
    await issuePaymentReceipt(enrollmentId, 'formation').catch(() => {});
    await notifyAdminsOfPayment(enrollmentId, 'formation').catch(() => {});
  }
  return updated;
}

export async function markInstallmentPaid(enrollmentId: string, installment: InstallmentNumber) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      status: { in: ['active', 'paid'] },
      registrationPaidAt: { not: null },
    },
  });

  if (!enrollment || !usesInstallmentPlan(enrollment)) return null;

  const paidField =
    installment === 1
      ? 'installment1PaidAt'
      : installment === 2
        ? 'installment2PaidAt'
        : 'installment3PaidAt';

  if (enrollment[paidField]) {
    return enrollment;
  }

  const now = new Date();
  const phase = installmentPhase(installment);
  const complete = installment === 3;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      [paidField]: now,
      ...(complete
        ? {
            status: 'paid',
            formationPaidAt: now,
            paidAt: now,
          }
        : {}),
    },
  });

  const updated = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (updated) {
    await issuePaymentReceipt(enrollmentId, phase).catch(() => {});
    await notifyAdminsOfPayment(enrollmentId, phase).catch(() => {});
  }
  return updated;
}

export function isEnrollmentFullyPaid(enrollment: {
  registrationFeeUsd: number;
  installment1FeeUsd: number;
  formationPaidAt: Date | null;
  installment1PaidAt: Date | null;
  installment2PaidAt: Date | null;
  installment3PaidAt: Date | null;
}) {
  if (usesInstallmentPlan(enrollment)) {
    return allInstallmentsPaid(enrollment);
  }
  return Boolean(enrollment.formationPaidAt);
}

/** @deprecated Utiliser markRegistrationPaidIfPending ou markFormationPaidIfActive */
export async function markEnrollmentPaidIfPending(enrollmentId: string) {
  return markRegistrationPaidIfPending(enrollmentId);
}
