import type { PaymentMethod } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { createCryptoInvoice, isCryptoConfigured } from '@/app/lib/crypto-payments';
import { createFedapayPayment, isFedapayConfigured } from '@/app/lib/fedapay';
import { usdToXof } from '@/app/lib/formation-config';
import { getStripe } from '@/app/lib/stripe';
import { getBaseUrl } from '@/app/lib/enrollment-checkout';

export type PaymentPhase = 'registration' | 'formation';

export type CreatePaymentParams = {
  enrollmentId: string;
  userId: string;
  userEmail: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  durationLabel: string;
  domain: string;
  paymentMethod: PaymentMethod;
  phase: PaymentPhase;
  amountUsd: number;
  stripeCents: number;
  stripeCustomerId?: string | null;
  request: Request;
};

export function getPaymentPurpose(phase: PaymentPhase) {
  return phase === 'registration' ? 'formation_registration' : 'formation_fee';
}

export function getCryptoOrderId(enrollmentId: string, phase: PaymentPhase) {
  return phase === 'registration' ? enrollmentId : `${enrollmentId}_formation`;
}

export async function createEnrollmentPayment(params: CreatePaymentParams) {
  const base = getBaseUrl(params.request);
  const amountXof = usdToXof(params.amountUsd);
  const purpose = getPaymentPurpose(params.phase);
  const label =
    params.phase === 'registration'
      ? `Frais d'inscription — ${params.durationLabel}`
      : `Frais de formation — ${params.durationLabel}`;

  const successBase =
    params.phase === 'registration'
      ? `${base}/inscription/succes`
      : `${base}/espace/succes`;

  if (params.paymentMethod === 'stripe') {
    const stripe = getStripe();
    if (!stripe) throw new Error('Stripe non configuré');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: params.stripeCents,
            product_data: {
              name: `The Code² — ${label}`,
              description: `${params.firstName} ${params.lastName} — ${params.domain}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url:
        params.phase === 'registration'
          ? `${successBase}?provider=stripe&phase=registration&session_id={CHECKOUT_SESSION_ID}`
          : `${successBase}?provider=stripe&phase=formation&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.phase === 'registration' ? `${base}/inscription?cancelled=1` : `${base}/espace?cancelled=1`,
      metadata: {
        enrollmentId: params.enrollmentId,
        userId: params.userId,
        purpose,
        phase: params.phase,
      },
      client_reference_id: params.enrollmentId,
      ...(params.stripeCustomerId
        ? { customer: params.stripeCustomerId }
        : { customer_email: params.userEmail }),
    });

    if (!session.url) throw new Error('Session Stripe invalide');

    if (params.phase === 'registration') {
      await prisma.enrollment.update({
        where: { id: params.enrollmentId },
        data: { stripeSessionId: session.id, paymentMethod: 'stripe' },
      });
    } else {
      await prisma.enrollment.update({
        where: { id: params.enrollmentId },
        data: { formationStripeSessionId: session.id, formationPaymentMethod: 'stripe' },
      });
    }

    return { url: session.url };
  }

  if (params.paymentMethod === 'fedapay') {
    if (!isFedapayConfigured()) throw new Error('FedaPay non configuré');

    const fedapay = await createFedapayPayment({
      description: `The Code² — ${label} — ${params.firstName} ${params.lastName}`,
      amountXof,
      callbackUrl:
        params.phase === 'registration'
          ? `${successBase}?provider=fedapay&phase=registration`
          : `${successBase}?provider=fedapay&phase=formation`,
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.userEmail,
      phone: params.phone,
      country: params.country,
    });

    if (params.phase === 'registration') {
      await prisma.enrollment.update({
        where: { id: params.enrollmentId },
        data: { fedapayTransactionId: fedapay.transactionId, paymentMethod: 'fedapay' },
      });
    } else {
      await prisma.enrollment.update({
        where: { id: params.enrollmentId },
        data: {
          formationFedapayTransactionId: fedapay.transactionId,
          formationPaymentMethod: 'fedapay',
        },
      });
    }

    return { url: fedapay.url };
  }

  if (!isCryptoConfigured()) throw new Error('Crypto non configuré');

  const orderId = getCryptoOrderId(params.enrollmentId, params.phase);
  const crypto = await createCryptoInvoice({
    priceAmount: params.amountUsd,
    orderId,
    orderDescription: `The Code² — ${label} — ${params.firstName} ${params.lastName}`,
    ipnCallbackUrl: `${base}/api/webhooks/crypto`,
    successUrl:
      params.phase === 'registration'
        ? `${successBase}?provider=crypto&phase=registration&enrollment_id=${params.enrollmentId}`
        : `${successBase}?provider=crypto&phase=formation&enrollment_id=${params.enrollmentId}`,
    cancelUrl: params.phase === 'registration' ? `${base}/inscription?cancelled=1` : `${base}/espace?cancelled=1`,
  });

  if (params.phase === 'registration') {
    await prisma.enrollment.update({
      where: { id: params.enrollmentId },
      data: { cryptoInvoiceId: crypto.invoiceId, paymentMethod: 'crypto' },
    });
  } else {
    await prisma.enrollment.update({
      where: { id: params.enrollmentId },
      data: { formationCryptoInvoiceId: crypto.invoiceId, formationPaymentMethod: 'crypto' },
    });
  }

  return { url: crypto.url };
}
