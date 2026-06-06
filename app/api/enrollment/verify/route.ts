import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiForbidden, apiUnauthorized } from '@/app/lib/api-security';
import {
  resolvePaymentPhase,
  verifyCryptoPayment,
  verifyFedapayPayment,
  verifyStripePayment,
} from '@/app/lib/enrollment-verify';

export async function GET(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiUnauthorized();
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') ?? 'stripe';
  const phaseParam = searchParams.get('phase');
  const sessionId = searchParams.get('session_id');
  const transactionId = searchParams.get('transaction_id') ?? searchParams.get('id');
  const enrollmentId = searchParams.get('enrollment_id');

  if (provider === 'stripe') {
    if (!sessionId) {
      return NextResponse.json({ error: 'Référence invalide' }, { status: 400 });
    }

    const enrollment =
      (await prisma.enrollment.findFirst({
        where: { stripeSessionId: sessionId, userId },
      })) ??
      (await prisma.enrollment.findFirst({
        where: { formationStripeSessionId: sessionId, userId },
      }));

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    const phase = resolvePaymentPhase(enrollment, phaseParam);

    if (
      (phase === 'registration' && enrollment.registrationPaidAt) ||
      (phase === 'formation' && enrollment.formationPaidAt)
    ) {
      return NextResponse.json({ status: 'paid', phase, enrollmentId: enrollment.id });
    }

    try {
      const updated = await verifyStripePayment(enrollment, sessionId, userId, phase);
      if (updated) {
        return NextResponse.json({ status: 'paid', phase, enrollmentId: updated.id });
      }
    } catch {
      /* vérification provider échouée */
    }

    return NextResponse.json({
      status: 'pending',
      phase,
      enrollmentId: enrollment.id,
    });
  }

  if (provider === 'fedapay') {
    if (!transactionId) {
      return NextResponse.json({ error: 'Référence invalide' }, { status: 400 });
    }

    const enrollment =
      (await prisma.enrollment.findFirst({
        where: { fedapayTransactionId: transactionId, userId },
      })) ??
      (await prisma.enrollment.findFirst({
        where: { formationFedapayTransactionId: transactionId, userId },
      }));

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    const phase =
      enrollment.formationFedapayTransactionId === transactionId
        ? 'formation'
        : resolvePaymentPhase(enrollment, phaseParam);

    if (
      (phase === 'registration' && enrollment.registrationPaidAt) ||
      (phase === 'formation' && enrollment.formationPaidAt)
    ) {
      return NextResponse.json({ status: 'paid', phase, enrollmentId: enrollment.id });
    }

    try {
      const updated = await verifyFedapayPayment(enrollment, transactionId, phase);
      if (updated) {
        return NextResponse.json({ status: 'paid', phase, enrollmentId: updated.id });
      }
    } catch {
      /* vérification provider échouée */
    }

    return NextResponse.json({
      status: 'pending',
      phase,
      enrollmentId: enrollment.id,
    });
  }

  if (provider === 'crypto') {
    if (!enrollmentId) {
      return NextResponse.json({ error: 'Référence invalide' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    const phase = resolvePaymentPhase(enrollment, phaseParam);

    if (
      (phase === 'registration' && enrollment.registrationPaidAt) ||
      (phase === 'formation' && enrollment.formationPaidAt)
    ) {
      return NextResponse.json({ status: 'paid', phase, enrollmentId: enrollment.id });
    }

    try {
      const updated = await verifyCryptoPayment(enrollment, phase);
      if (updated) {
        return NextResponse.json({ status: 'paid', phase, enrollmentId: updated.id });
      }
    } catch {
      /* vérification provider échouée */
    }

    return NextResponse.json({
      status: 'pending',
      phase,
      enrollmentId: enrollment.id,
    });
  }

  return apiForbidden();
}
