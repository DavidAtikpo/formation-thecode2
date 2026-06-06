import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

export async function getStripeCardLast4(sessionId: string): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    });

    const paymentIntent = session.payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string') return null;

    const charge = paymentIntent.latest_charge;
    if (charge && typeof charge !== 'string') {
      return charge.payment_method_details?.card?.last4 ?? null;
    }

    const fullIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
      expand: ['latest_charge'],
    });
    const fallbackCharge = fullIntent.latest_charge;
    if (!fallbackCharge || typeof fallbackCharge === 'string') return null;

    return fallbackCharge.payment_method_details?.card?.last4 ?? null;
  } catch {
    return null;
  }
}
