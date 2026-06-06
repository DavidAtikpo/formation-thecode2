import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionUserId } from '@/app/lib/auth';
import { getStripe } from '@/app/lib/stripe';
import { isCryptoOrderPaid } from '@/app/lib/crypto-payments';
import { retrieveFedapayTransaction } from '@/app/lib/fedapay';

async function markEnrollmentPaid(enrollmentId: string) {
  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: 'paid', paidAt: new Date() },
  });
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') ?? 'stripe';
  const sessionId = searchParams.get('session_id');
  const transactionId = searchParams.get('transaction_id') ?? searchParams.get('id');

  if (provider === 'stripe') {
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id requis' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { stripeSessionId: sessionId, userId },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    if (enrollment.status === 'paid') {
      return NextResponse.json({ status: 'paid', enrollment });
    }

    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
          const updated = await markEnrollmentPaid(enrollment.id);
          return NextResponse.json({ status: 'paid', enrollment: updated });
        }
      } catch {
        /* fallback to pending */
      }
    }

    return NextResponse.json({ status: enrollment.status, enrollment });
  }

  if (provider === 'fedapay') {
    if (!transactionId) {
      return NextResponse.json({ error: 'transaction_id requis' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { fedapayTransactionId: transactionId, userId },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    if (enrollment.status === 'paid') {
      return NextResponse.json({ status: 'paid', enrollment });
    }

    try {
      const transaction = await retrieveFedapayTransaction(transactionId);
      if (transaction?.wasPaid()) {
        const updated = await markEnrollmentPaid(enrollment.id);
        return NextResponse.json({ status: 'paid', enrollment: updated });
      }
    } catch {
      /* fallback to pending */
    }

    return NextResponse.json({ status: enrollment.status, enrollment });
  }

  if (provider === 'crypto') {
    const enrollmentId = searchParams.get('enrollment_id');
    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollment_id requis' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId, paymentMethod: 'crypto' },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    if (enrollment.status === 'paid') {
      return NextResponse.json({ status: 'paid', enrollment });
    }

    try {
      if (await isCryptoOrderPaid(enrollment.id)) {
        const updated = await markEnrollmentPaid(enrollment.id);
        return NextResponse.json({ status: 'paid', enrollment: updated });
      }
    } catch {
      /* fallback to pending */
    }

    return NextResponse.json({ status: enrollment.status, enrollment });
  }

  return NextResponse.json({ error: 'provider invalide' }, { status: 400 });
}
