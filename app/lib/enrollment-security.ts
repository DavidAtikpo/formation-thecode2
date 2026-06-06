import { prisma } from '@/app/lib/prisma';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function assertUserCanEnroll(userId: string) {
  const paid = await prisma.enrollment.findFirst({
    where: { userId, status: 'paid' },
    select: { id: true },
  });
  if (paid) {
    return { ok: false as const, error: 'Vous avez déjà une inscription payée' };
  }
  return { ok: true as const };
}

export async function cancelStalePendingEnrollments(userId: string) {
  await prisma.enrollment.updateMany({
    where: { userId, status: 'pending_payment' },
    data: { status: 'cancelled' },
  });
}

export async function markEnrollmentPaidIfPending(enrollmentId: string) {
  const result = await prisma.enrollment.updateMany({
    where: { id: enrollmentId, status: 'pending_payment' },
    data: { status: 'paid', paidAt: new Date() },
  });
  if (result.count === 0) return null;
  return prisma.enrollment.findUnique({ where: { id: enrollmentId } });
}

export function canResendVerification(expiresAt: Date | null) {
  if (!expiresAt) return true;
  const sentAt = expiresAt.getTime() - TOKEN_TTL_MS;
  return Date.now() - sentAt >= 60_000;
}
