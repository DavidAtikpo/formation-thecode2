import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { createEnrollmentPayment } from '@/app/lib/enrollment-payments';
import { isCryptoConfigured } from '@/app/lib/crypto-payments';
import { isFedapayConfigured } from '@/app/lib/fedapay';
import { getDuration } from '@/app/lib/formation-config';
import { getStripe } from '@/app/lib/stripe';
import type { PaymentMethodId } from '@/app/lib/enrollment-checkout';

export const runtime = 'nodejs';

const VALID_METHODS = ['stripe', 'fedapay', 'crypto'] as const;

/** Paiement des frais d'inscription depuis l'espace candidat. */
export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const body = await request.json();
  const paymentMethod = body.paymentMethod as PaymentMethodId;

  if (!VALID_METHODS.includes(paymentMethod)) {
    return apiError('Moyen de paiement invalide', 400);
  }

  if (paymentMethod === 'stripe' && !getStripe()) {
    return apiError('Paiement indisponible', 503);
  }
  if (paymentMethod === 'fedapay' && !isFedapayConfigured()) {
    return apiError('Paiement indisponible', 503);
  }
  if (paymentMethod === 'crypto' && !isCryptoConfigured()) {
    return apiError('Paiement indisponible', 503);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, status: 'pending_payment' },
    orderBy: { createdAt: 'desc' },
  });

  if (!enrollment) {
    return apiError('Aucune inscription en attente de paiement', 404);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return apiForbidden();
  }

  const price = getDuration(enrollment.duration);
  const registrationUsd = enrollment.registrationFeeUsd;

  try {
    const payment = await createEnrollmentPayment({
      enrollmentId: enrollment.id,
      userId,
      userEmail: user.email,
      firstName: enrollment.firstName,
      lastName: enrollment.lastName,
      phone: enrollment.phone,
      country: enrollment.country,
      durationLabel: price.label,
      domain: enrollment.domain,
      paymentMethod,
      phase: 'registration',
      amountUsd: registrationUsd,
      stripeCents: price.registrationStripeCents,
      stripeCustomerId: user.stripeCustomerId,
      request,
    });

    return NextResponse.json({ url: payment.url });
  } catch {
    return apiServerError();
  }
}
