import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { getStripe } from '@/app/lib/stripe';
import { createCryptoInvoice, isCryptoConfigured } from '@/app/lib/crypto-payments';
import { createFedapayPayment, isFedapayConfigured } from '@/app/lib/fedapay';
import { getBaseUrl, parseEnrollmentCheckoutBody } from '@/app/lib/enrollment-checkout';
import { getDuration } from '@/app/lib/formation-config';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Vérifiez votre adresse email avant de payer' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = parseEnrollmentCheckoutBody(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data = parsed.data;

  if (data.paymentMethod === 'stripe' && !getStripe()) {
    return NextResponse.json({ error: 'Paiement Stripe non configuré' }, { status: 503 });
  }
  if (data.paymentMethod === 'fedapay' && !isFedapayConfigured()) {
    return NextResponse.json({ error: 'Paiement FedaPay non configuré' }, { status: 503 });
  }
  if (data.paymentMethod === 'crypto' && !isCryptoConfigured()) {
    return NextResponse.json({ error: 'Paiement crypto non configuré' }, { status: 503 });
  }

  const price = getDuration(data.duration);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  const amountXof = Math.round(price.amountUsd * 600);

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      country: data.country,
      phone: data.phone,
      address: data.address,
      passportPhotoUrl: data.passportPhotoUrl,
      passportPublicId: data.passportPublicId,
      domain: data.domain,
      duration: data.duration,
      daysPerWeek: 3,
      scheduleDays: data.scheduleDays,
      scheduleHours: data.scheduleHours,
      acceptedPrivacy: data.acceptedPrivacy,
      amountXof,
      amountUsd: price.amountUsdInt,
      paymentMethod: data.paymentMethod,
      status: 'pending_payment',
    },
  });

  const base = getBaseUrl(request);

  try {
    if (data.paymentMethod === 'stripe') {
      const stripe = getStripe()!;
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: price.stripeCents,
              product_data: {
                name: `Formation The Code² — ${data.domain}`,
                description: `${price.label} — ${data.firstName} ${data.lastName}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${base}/inscription/succes?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/inscription?cancelled=1`,
        metadata: {
          enrollmentId: enrollment.id,
          userId,
          purpose: 'formation_enrollment',
        },
        client_reference_id: enrollment.id,
        ...(user.stripeCustomerId
          ? { customer: user.stripeCustomerId }
          : { customer_email: user.email }),
      });

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { stripeSessionId: session.id },
      });

      if (!session.url) {
        return NextResponse.json({ error: 'Session Stripe invalide' }, { status: 500 });
      }

      return NextResponse.json({ url: session.url, enrollmentId: enrollment.id });
    }

    if (data.paymentMethod === 'fedapay') {
      const fedapay = await createFedapayPayment({
        description: `Formation The Code² — ${price.label} — ${data.firstName} ${data.lastName}`,
        amountXof,
        callbackUrl: `${base}/inscription/succes?provider=fedapay`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: user.email,
        phone: data.phone,
        country: data.country,
      });

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { fedapayTransactionId: fedapay.transactionId },
      });

      return NextResponse.json({ url: fedapay.url, enrollmentId: enrollment.id });
    }

    const crypto = await createCryptoInvoice({
      priceAmount: price.amountUsd,
      orderId: enrollment.id,
      orderDescription: `Formation The Code² — ${price.label} — ${data.firstName} ${data.lastName}`,
      ipnCallbackUrl: `${base}/api/webhooks/crypto`,
      successUrl: `${base}/inscription/succes?provider=crypto&enrollment_id=${enrollment.id}`,
      cancelUrl: `${base}/inscription?cancelled=1`,
    });

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { cryptoInvoiceId: crypto.invoiceId },
    });

    return NextResponse.json({ url: crypto.url, enrollmentId: enrollment.id });
  } catch (e: unknown) {
    await prisma.enrollment.delete({ where: { id: enrollment.id } }).catch(() => {});
    console.error('[enrollment/checkout]', e);
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 502 });
  }
}
