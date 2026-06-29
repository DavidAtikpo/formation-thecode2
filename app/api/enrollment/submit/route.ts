import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiError, apiForbidden, apiUnauthorized } from '@/app/lib/api-security';
import {
  assertUserCanEnroll,
  cancelStalePendingEnrollments,
} from '@/app/lib/enrollment-security';
import { notifyAdminsOfEnrollment } from '@/app/lib/payment-admin-notify';
import { parseEnrollmentSubmitBody } from '@/app/lib/enrollment-checkout';
import { getDuration, usdToXof } from '@/app/lib/formation-config';

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

  return NextResponse.json({ ok: true, enrollmentId: enrollment.id });
}
