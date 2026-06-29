import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiForbidden, apiUnauthorized } from '@/app/lib/api-security';
import {
  isPhaseAlreadyPaid,
  resolvePaymentPhase,
  verifyCryptoPayment,
  verifyFedapayPayment,
  verifyStripePayment,
} from '@/app/lib/enrollment-verify';
import type { PaymentPhase } from '@/app/lib/installment-payments';

async function findEnrollmentByStripeSession(sessionId: string, userId: string) {
  return (
    (await prisma.enrollment.findFirst({ where: { stripeSessionId: sessionId, userId } })) ??
    (await prisma.enrollment.findFirst({
      where: { formationStripeSessionId: sessionId, userId },
    })) ??
    (await prisma.enrollment.findFirst({
      where: { installment3StripeSessionId: sessionId, userId },
    }))
  );
}

async function findEnrollmentByFedapayTransaction(transactionId: string, userId: string) {
  return (
    (await prisma.enrollment.findFirst({
      where: { fedapayTransactionId: transactionId, userId },
    })) ??
    (await prisma.enrollment.findFirst({
      where: { formationFedapayTransactionId: transactionId, userId },
    })) ??
    (await prisma.enrollment.findFirst({
      where: { installment3FedapayTransactionId: transactionId, userId },
    }))
  );
}

function resolveFedapayPhase(
  enrollment: {
    fedapayTransactionId: string | null;
    formationFedapayTransactionId: string | null;
    installment3FedapayTransactionId: string | null;
  },
  transactionId: string,
  phaseParam: string | null,
): PaymentPhase {
  if (enrollment.installment3FedapayTransactionId === transactionId) return 'installment_3';
  if (enrollment.formationFedapayTransactionId === transactionId) return 'installment_2';
  if (enrollment.fedapayTransactionId === transactionId) return 'installment_1';
  return resolvePaymentPhase(enrollment as Parameters<typeof resolvePaymentPhase>[0], phaseParam);
}

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

    const enrollment = await findEnrollmentByStripeSession(sessionId, userId);

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    const phase = resolvePaymentPhase(enrollment, phaseParam);

    if (isPhaseAlreadyPaid(enrollment, phase)) {
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

    const enrollment = await findEnrollmentByFedapayTransaction(transactionId, userId);

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    const phase = resolveFedapayPhase(enrollment, transactionId, phaseParam);

    if (isPhaseAlreadyPaid(enrollment, phase)) {
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

    if (isPhaseAlreadyPaid(enrollment, phase)) {
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
