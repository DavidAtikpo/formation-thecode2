import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionUserId } from '@/app/lib/auth';
import { isAdminUser } from '@/app/lib/admin';
import { getResendVerificationStatus } from '@/app/lib/email-verification';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(null);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      emailVerificationExpiresAt: true,
      enrollments: {
        where: { status: { in: ['active', 'paid'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          domain: true,
          duration: true,
          status: true,
          registrationPaidAt: true,
          formationPaidAt: true,
          paidAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(null);
  }

  const resendStatus = user.emailVerified
    ? { canResendVerification: false, resendCooldownSeconds: 0 }
    : (() => {
        const status = getResendVerificationStatus(user.emailVerificationExpiresAt);
        return {
          canResendVerification: status.canResend,
          resendCooldownSeconds: status.retryAfterSeconds,
        };
      })();

  const { emailVerificationExpiresAt: _expiresAt, ...publicUser } = user;

  return NextResponse.json({
    ...publicUser,
    isAdmin: isAdminUser(user),
    ...resendStatus,
  });
}
