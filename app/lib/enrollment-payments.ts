import type { PaymentMethod } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { createCryptoInvoice, isCryptoConfigured } from '@/app/lib/crypto-payments';
import { createFedapayPayment, isFedapayConfigured } from '@/app/lib/fedapay';
import { usdToXof } from '@/app/lib/formation-config';
import { getStripe } from '@/app/lib/stripe';
import { getBaseUrl } from '@/app/lib/enrollment-checkout';
import {
  getCryptoOrderId,
  getInstallmentPaymentFields,
  getPaymentLabel,
  getPaymentPurpose,
  installmentNumberFromPhase,
  type PaymentPhase,
} from '@/app/lib/installment-payments';

export type { PaymentPhase } from '@/app/lib/installment-payments';

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

function buildSuccessUrl(base: string, phase: PaymentPhase, provider: string) {
  const successBase = `${base}/espace/succes`;
  if (provider === 'stripe') {
    return `${successBase}?provider=stripe&phase=${phase}&session_id={CHECKOUT_SESSION_ID}`;
  }
  if (provider === 'fedapay') {
    return `${successBase}?provider=fedapay&phase=${phase}`;
  }
  return `${successBase}?provider=crypto&phase=${phase}&enrollment_id={ENROLLMENT_ID}`;
}

async function persistPaymentReference(
  enrollmentId: string,
  phase: PaymentPhase,
  paymentMethod: PaymentMethod,
  reference: { stripeSessionId?: string; fedapayTransactionId?: string; cryptoInvoiceId?: string },
) {
  const installment = installmentNumberFromPhase(phase);
  if (installment) {
    const fields = getInstallmentPaymentFields(installment);
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        [fields.paymentMethod]: paymentMethod,
        ...(reference.stripeSessionId
          ? { [fields.stripeSessionId]: reference.stripeSessionId }
          : {}),
        ...(reference.fedapayTransactionId
          ? { [fields.fedapayTransactionId]: reference.fedapayTransactionId }
          : {}),
        ...(reference.cryptoInvoiceId
          ? { [fields.cryptoInvoiceId]: reference.cryptoInvoiceId }
          : {}),
      },
    });
    return;
  }

  if (phase === 'registration') {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        paymentMethod,
        ...(reference.stripeSessionId ? { stripeSessionId: reference.stripeSessionId } : {}),
        ...(reference.fedapayTransactionId
          ? { fedapayTransactionId: reference.fedapayTransactionId }
          : {}),
        ...(reference.cryptoInvoiceId ? { cryptoInvoiceId: reference.cryptoInvoiceId } : {}),
      },
    });
    return;
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      formationPaymentMethod: paymentMethod,
      ...(reference.stripeSessionId
        ? { formationStripeSessionId: reference.stripeSessionId }
        : {}),
      ...(reference.fedapayTransactionId
        ? { formationFedapayTransactionId: reference.fedapayTransactionId }
        : {}),
      ...(reference.cryptoInvoiceId
        ? { formationCryptoInvoiceId: reference.cryptoInvoiceId }
        : {}),
    },
  });
}

export async function createEnrollmentPayment(params: CreatePaymentParams) {
  const base = getBaseUrl(params.request);
  const amountXof = usdToXof(params.amountUsd);
  const purpose = getPaymentPurpose(params.phase);
  const label = getPaymentLabel(params.phase, params.durationLabel);
  const cancelUrl = `${base}/espace/paiements?cancelled=1`;

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
      success_url: buildSuccessUrl(base, params.phase, 'stripe'),
      cancel_url: cancelUrl,
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

    await persistPaymentReference(params.enrollmentId, params.phase, 'stripe', {
      stripeSessionId: session.id,
    });

    return { url: session.url };
  }

  if (params.paymentMethod === 'fedapay') {
    if (!isFedapayConfigured()) throw new Error('FedaPay non configuré');

    const fedapay = await createFedapayPayment({
      description: `The Code² — ${label} — ${params.firstName} ${params.lastName}`,
      amountXof,
      callbackUrl: buildSuccessUrl(base, params.phase, 'fedapay'),
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.userEmail,
      phone: params.phone,
      country: params.country,
    });

    await persistPaymentReference(params.enrollmentId, params.phase, 'fedapay', {
      fedapayTransactionId: fedapay.transactionId,
    });

    return { url: fedapay.url };
  }

  if (!isCryptoConfigured()) throw new Error('Crypto non configuré');

  const orderId = getCryptoOrderId(params.enrollmentId, params.phase);
  const crypto = await createCryptoInvoice({
    priceAmount: params.amountUsd,
    orderId,
    orderDescription: `The Code² — ${label} — ${params.firstName} ${params.lastName}`,
    ipnCallbackUrl: `${base}/api/webhooks/crypto`,
    successUrl: buildSuccessUrl(base, params.phase, 'crypto').replace(
      '{ENROLLMENT_ID}',
      params.enrollmentId,
    ),
    cancelUrl,
  });

  await persistPaymentReference(params.enrollmentId, params.phase, 'crypto', {
    cryptoInvoiceId: crypto.invoiceId,
  });

  return { url: crypto.url };
}

export { getCryptoOrderId, getPaymentPurpose } from '@/app/lib/installment-payments';
