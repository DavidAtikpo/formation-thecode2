import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import {
  apiError,
  apiForbidden,
  apiServerError,
  apiUnauthorized,
} from '@/app/lib/api-security';
import {
  assertUserCanEnroll,
  cancelStalePendingEnrollments,
} from '@/app/lib/enrollment-security';
import { createEnrollmentPayment } from '@/app/lib/enrollment-payments';
import { isCryptoConfigured } from '@/app/lib/crypto-payments';
import { isFedapayConfigured } from '@/app/lib/fedapay';
import { getStripe } from '@/app/lib/stripe';
import { parseEnrollmentCheckoutBody } from '@/app/lib/enrollment-checkout';
import { getDuration, usdToXof } from '@/app/lib/formation-config';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const body = await request.json();
  const parsed = parseEnrollmentCheckoutBody(body);
  if ('error' in parsed) {
    return apiError(parsed.error, 400);
  }

  const data = parsed.data;

  const canEnroll = await assertUserCanEnroll(userId);
  if (!canEnroll.ok) {
    return apiError(canEnroll.error, 409);
  }

  if (data.paymentMethod === 'stripe' && !getStripe()) {
    return apiError('Paiement indisponible', 503);
  }
  if (data.paymentMethod === 'fedapay' && !isFedapayConfigured()) {
    return apiError('Paiement indisponible', 503);
  }
  if (data.paymentMethod === 'crypto' && !isCryptoConfigured()) {
    return apiError('Paiement indisponible', 503);
  }

  const price = getDuration(data.duration);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return apiUnauthorized();
  }

  await cancelStalePendingEnrollments(userId);

  const registrationUsd = price.registrationFeeUsd;
  const formationUsd = price.formationFeeUsd;

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      country: data.country,
      phone: data.phone,
      address: data.address,
      domain: data.domain,
      formationSession: data.formationSession,
      duration: data.duration,
      daysPerWeek: 3,
      scheduleDays: data.scheduleDays,
      scheduleHours: data.scheduleHours,
      acceptedPrivacy: data.acceptedPrivacy,
      registrationFeeUsd: registrationUsd,
      formationFeeUsd: formationUsd,
      amountXof: usdToXof(registrationUsd),
      amountUsd: Math.round(registrationUsd),
      paymentMethod: data.paymentMethod,
      status: 'pending_payment',
    },
  });

  try {
    const payment = await createEnrollmentPayment({
      enrollmentId: enrollment.id,
      userId,
      userEmail: user.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      country: data.country,
      durationLabel: price.label,
      domain: data.domain,
      paymentMethod: data.paymentMethod,
      phase: 'registration',
      amountUsd: registrationUsd,
      stripeCents: price.registrationStripeCents,
      stripeCustomerId: user.stripeCustomerId,
      request,
    });

    return NextResponse.json({ url: payment.url });
  } catch {
    await prisma.enrollment.delete({ where: { id: enrollment.id } }).catch(() => {});
    return apiError('Erreur lors de la création du paiement', 502);
  }
}
