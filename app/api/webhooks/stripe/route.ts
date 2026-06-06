import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Signature invalide';
    console.error('[stripe webhook]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.purpose === 'formation_enrollment') {
        const enrollmentId = session.metadata.enrollmentId ?? session.client_reference_id;
        const userId = session.metadata.userId;
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id;

        if (enrollmentId) {
          await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
              status: 'paid',
              paidAt: new Date(),
              stripeSessionId: session.id,
            },
          });

          if (userId && customerId) {
            await prisma.user.update({
              where: { id: userId },
              data: { stripeCustomerId: customerId },
            });
          }
        }
      }
    }
  } catch (e: unknown) {
    console.error('[stripe webhook handler]', e);
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
