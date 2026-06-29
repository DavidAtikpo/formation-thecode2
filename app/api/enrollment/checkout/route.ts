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
import { notifyAdminsOfEnrollment } from '@/app/lib/payment-admin-notify';
import { createEnrollmentPayment } from '@/app/lib/enrollment-payments';
import { isCryptoConfigured } from '@/app/lib/crypto-payments';
import { isFedapayConfigured } from '@/app/lib/fedapay';
import { installmentPhase } from '@/app/lib/installment-payments';
import { getStripe } from '@/app/lib/stripe';
import { parseEnrollmentCheckoutBody } from '@/app/lib/enrollment-checkout';
import { getDuration, usdToXof, usdToStripeCents } from '@/app/lib/formation-config';

export const runtime = 'nodejs';

/** Inscription + paiement de la 1re tranche (inscription gratuite). */
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

  const totalUsd = price.amountUsd;

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
      registrationFeeUsd: 0,
      formationFeeUsd: totalUsd,
      installment1FeeUsd: price.installment1Usd,
      installment2FeeUsd: price.installment2Usd,
      installment3FeeUsd: price.installment3Usd,
      amountXof: usdToXof(totalUsd),
      amountUsd: Math.round(totalUsd),
      status: 'active',
      registrationPaidAt: new Date(),
    },
  });

  void notifyAdminsOfEnrollment(enrollment.id);

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
      phase: installmentPhase(1),
      amountUsd: price.installment1Usd,
      stripeCents: usdToStripeCents(price.installment1Usd),
      stripeCustomerId: user.stripeCustomerId,
      request,
    });

    return NextResponse.json({ url: payment.url });
  } catch {
    await prisma.enrollment.delete({ where: { id: enrollment.id } }).catch(() => {});
    return apiServerError();
  }
}
