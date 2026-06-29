import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';
import {
  markFormationPaidIfActive,
  markInstallmentPaid,
  markRegistrationPaidIfPending,
} from '@/app/lib/enrollment-security';
import { getExpectedStripeCents } from '@/app/lib/enrollment-verify';
import { getPaymentPurpose, installmentNumberFromPhase } from '@/app/lib/installment-payments';
import type { PaymentPhase } from '@/app/lib/installment-payments';
import { getStripe } from '@/app/lib/stripe';

export const runtime = 'nodejs';

async function handlePaidCheckout(
  session: Stripe.Checkout.Session,
  enrollmentId: string,
  userId: string,
  purpose: string,
) {
  const phase = session.metadata?.phase as PaymentPhase | undefined;
  if (!phase) return;

  if (purpose === getPaymentPurpose(phase)) {
    const installment = installmentNumberFromPhase(phase);
    if (installment) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          id: enrollmentId,
          userId,
          status: { in: ['active', 'paid'] },
          registrationPaidAt: { not: null },
        },
      });

      if (!enrollment) return;

      if (session.amount_total !== getExpectedStripeCents(enrollment, phase)) return;

      await markInstallmentPaid(enrollment.id, installment);

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          ...(installment === 1
            ? { stripeSessionId: session.id, paymentMethod: 'stripe' }
            : installment === 2
              ? { formationStripeSessionId: session.id, formationPaymentMethod: 'stripe' }
              : { installment3StripeSessionId: session.id, installment3PaymentMethod: 'stripe' }),
        },
      });
      return;
    }
  }

  if (purpose === 'formation_registration') {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        userId,
        status: 'pending_payment',
      },
    });

    if (!enrollment) return;

    if (session.amount_total !== getExpectedStripeCents(enrollment, 'registration')) return;

    await markRegistrationPaidIfPending(enrollment.id);

    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id;

    if (customerId) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { stripeSessionId: session.id, paymentMethod: 'stripe' },
    });
    return;
  }

  if (purpose === 'formation_fee') {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        userId,
        status: 'active',
        formationPaidAt: null,
      },
    });

    if (!enrollment) return;

    if (session.amount_total !== getExpectedStripeCents(enrollment, 'formation')) return;

    await markFormationPaidIfActive(enrollment.id);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { formationStripeSessionId: session.id, formationPaymentMethod: 'stripe' },
    });
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 503 });
  }

  const raw = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') {
        return NextResponse.json({ received: true });
      }

      const enrollmentId = session.metadata?.enrollmentId ?? session.client_reference_id;
      const userId = session.metadata?.userId;
      const purpose = session.metadata?.purpose;

      if (!enrollmentId || !userId || !purpose) {
        return NextResponse.json({ received: true });
      }

      await handlePaidCheckout(session, enrollmentId, userId, purpose);
    }
  } catch {
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
