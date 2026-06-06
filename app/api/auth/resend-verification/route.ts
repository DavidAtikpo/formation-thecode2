import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { apiError, apiServerError, apiUnauthorized } from '@/app/lib/api-security';
import {
  createAndSendEmailVerification,
  getResendVerificationStatus,
} from '@/app/lib/email-verification';

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return apiUnauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, emailVerificationExpiresAt: true },
  });

  if (!user) {
    return apiUnauthorized();
  }

  if (user.emailVerified) {
    return apiError('Email déjà vérifié', 400);
  }

  const resendStatus = getResendVerificationStatus(user.emailVerificationExpiresAt);
  if (!resendStatus.canResend) {
    return NextResponse.json(
      {
        error: `Veuillez patienter ${resendStatus.retryAfterSeconds} s avant de renvoyer l'email`,
        retryAfterSeconds: resendStatus.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  try {
    const { sent } = await createAndSendEmailVerification(userId, user.email, request);
    return NextResponse.json({
      ok: true,
      sent,
      message: sent
        ? 'Un nouvel email de vérification a été envoyé.'
        : 'Envoi temporairement indisponible. Réessayez plus tard.',
    });
  } catch {
    return apiServerError();
  }
}
