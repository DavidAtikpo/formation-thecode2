import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import {
  apiError,
  apiForbidden,
  apiServerError,
  apiUnauthorized,
  isAllowedPassportUrl,
  isPassportOwnedByUser,
} from '@/app/lib/api-security';
import {
  assertUserCanEnroll,
  cancelStalePendingEnrollments,
} from '@/app/lib/enrollment-security';
import { getStripe } from '@/app/lib/stripe';
import { createCryptoInvoice, isCryptoConfigured } from '@/app/lib/crypto-payments';
import { createFedapayPayment, isFedapayConfigured } from '@/app/lib/fedapay';
import { getBaseUrl, parseEnrollmentCheckoutBody } from '@/app/lib/enrollment-checkout';
import { getDuration } from '@/app/lib/formation-config';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const body = await request.json();
  const parsed = parseEnrollmentCheckoutBody(body);
  if ('error' in parsed) {
    return apiError(parsed.error, 400);
  }

  const data = parsed.data;

  if (!isPassportOwnedByUser(data.passportPublicId, userId)) {
    return apiError('Photo passeport invalide', 400);
  }
  if (!isAllowedPassportUrl(data.passportPhotoUrl)) {
    return apiError('Photo passeport invalide', 400);
  }

  const canEnroll = await assertUserCanEnroll(userId);
  if (!canEnroll.ok) {
    return apiError(canEnroll.error, 409);
  }

  if (data.paymentMethod === 'stripe' && !getStripe()) {
    return apiError('Paiement indisponible', 503);
  }
  if (data.paymentMethod === 'fedapay' && !isFedapayConfigured()) {
    return apiError('Paiement indisponible', 503);
  }
  if (data.paymentMethod === 'crypto' && !isCryptoConfigured()) {
    return apiError('Paiement indisponible', 503);
  }

  const price = getDuration(data.duration);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return apiUnauthorized();
  }

  await cancelStalePendingEnrollments(userId);

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
      formationSession: data.formationSession,
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
        await prisma.enrollment.delete({ where: { id: enrollment.id } }).catch(() => {});
        return apiServerError();
      }

      return NextResponse.json({ url: session.url });
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

      return NextResponse.json({ url: fedapay.url });
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

    return NextResponse.json({ url: crypto.url });
  } catch {
    await prisma.enrollment.delete({ where: { id: enrollment.id } }).catch(() => {});
    return apiError('Erreur lors de la création du paiement', 502);
  }
}
