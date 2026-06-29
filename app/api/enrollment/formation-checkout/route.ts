import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { createEnrollmentPayment } from '@/app/lib/enrollment-payments';
import { isCryptoConfigured } from '@/app/lib/crypto-payments';
import { isFedapayConfigured } from '@/app/lib/fedapay';
import {
  getInstallmentAmount,
  getNextUnpaidInstallment,
  installmentPhase,
  usesInstallmentPlan,
} from '@/app/lib/installment-payments';
import { getDuration, usdToStripeCents } from '@/app/lib/formation-config';
import { getStripe } from '@/app/lib/stripe';
import type { PaymentMethodId } from '@/app/lib/enrollment-checkout';

export const runtime = 'nodejs';

const VALID_METHODS = ['stripe', 'fedapay', 'crypto'] as const;

/** Paiement d'une tranche depuis l'espace candidat. */
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
    where: { userId, status: { in: ['active', 'paid'] }, formationPaidAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!enrollment) {
    return apiError('Aucune inscription éligible au paiement', 404);
  }

  if (usesInstallmentPlan(enrollment)) {
    const next = getNextUnpaidInstallment(enrollment);
    if (!next) {
      return apiError('Toutes les tranches sont déjà réglées', 400);
    }

    const amountUsd = getInstallmentAmount(enrollment, next);
    if (amountUsd <= 0) {
      return apiError('Montant de tranche invalide', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return apiForbidden();
    }

    const price = getDuration(enrollment.duration);
    const phase = installmentPhase(next);

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
        phase,
        amountUsd,
        stripeCents: usdToStripeCents(amountUsd),
        stripeCustomerId: user.stripeCustomerId,
        request,
      });

      return NextResponse.json({ url: payment.url, installment: next });
    } catch {
      return apiServerError();
    }
  }

  if (enrollment.formationFeeUsd <= 0) {
    return apiError('Aucun frais de formation à régler', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return apiForbidden();
  }

  const price = getDuration(enrollment.duration);
  const formationUsd = enrollment.formationFeeUsd;

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
      phase: 'formation',
      amountUsd: formationUsd,
      stripeCents: usdToStripeCents(formationUsd),
      stripeCustomerId: user.stripeCustomerId,
      request,
    });

    return NextResponse.json({ url: payment.url });
  } catch {
    return apiServerError();
  }
}
