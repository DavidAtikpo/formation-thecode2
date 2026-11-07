import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiError, apiForbidden, apiUnauthorized } from '@/app/lib/api-security';
import {
  assertUserCanEnroll,
  cancelStalePendingEnrollments,
} from '@/app/lib/enrollment-security';
import { notifyEnrollmentCreated } from '@/app/lib/payment-admin-notify';
import { parseEnrollmentSubmitBody } from '@/app/lib/enrollment-checkout';
import { getPublicEnrollmentOffer } from '@/app/lib/formation-config';

export const runtime = 'nodejs';

/** Enregistre l'inscription sans paiement — le règlement se fait dans l'espace candidat. */
export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const body = await request.json();
  const parsed = parseEnrollmentSubmitBody(body);
  if ('error' in parsed) {
    return apiError(parsed.error, 400);
  }

  const data = parsed.data;

  const canEnroll = await assertUserCanEnroll(userId);
  if (!canEnroll.ok) {
    return apiError(canEnroll.error, 409);
  }

  if (data.domain !== 'mobile' && data.domain !== 'fullstack') {
    return apiError('Choisissez Développement mobile ou Fullstack', 400);
  }

  const offer = getPublicEnrollmentOffer(data.domain);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return apiUnauthorized();
  }

  await cancelStalePendingEnrollments(userId);

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
      duration: offer.durationId,
      daysPerWeek: 3,
      scheduleDays: data.scheduleDays,
      scheduleHours: data.scheduleHours,
      acceptedPrivacy: data.acceptedPrivacy,
      registrationFeeUsd: 0,
      formationFeeUsd: offer.totalUsd,
      installment1FeeUsd: offer.installments[0].amountUsd,
      installment2FeeUsd: offer.installments[1].amountUsd,
      installment3FeeUsd: offer.installments[2].amountUsd,
      amountXof: offer.totalXof,
      amountUsd: Math.round(offer.totalUsd),
      status: 'active',
      registrationPaidAt: new Date(),
    },
  });

  void notifyEnrollmentCreated(enrollment.id);

  return NextResponse.json({ ok: true, enrollmentId: enrollment.id });
}
