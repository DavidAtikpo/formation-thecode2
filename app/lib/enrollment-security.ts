import { prisma } from '@/app/lib/prisma';
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

/** @deprecated Utiliser markRegistrationPaidIfPending ou markFormationPaidIfActive */
export async function markEnrollmentPaidIfPending(enrollmentId: string) {
  return markRegistrationPaidIfPending(enrollmentId);
}

