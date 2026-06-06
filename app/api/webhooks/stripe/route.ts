import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';
import {
  markFormationPaidIfActive,
  markRegistrationPaidIfPending,
} from '@/app/lib/enrollment-security';
import { getExpectedStripeCents } from '@/app/lib/enrollment-verify';
import { getStripe } from '@/app/lib/stripe';

export const runtime = 'nodejs';

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

      if (!enrollmentId || !userId) {
        return NextResponse.json({ received: true });
      }

      if (purpose === 'formation_registration') {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            id: enrollmentId,
            userId,
            status: 'pending_payment',
          },
        });

        if (!enrollment) {
          return NextResponse.json({ received: true });
        }

        if (session.amount_total !== getExpectedStripeCents(enrollment, 'registration')) {
          return NextResponse.json({ received: true });
        }

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

        if (!enrollment) {
          return NextResponse.json({ received: true });
        }

        if (session.amount_total !== getExpectedStripeCents(enrollment, 'formation')) {
          return NextResponse.json({ received: true });
        }

        await markFormationPaidIfActive(enrollment.id);

        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { formationStripeSessionId: session.id, formationPaymentMethod: 'stripe' },
        });
      }
    }
  } catch {
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
