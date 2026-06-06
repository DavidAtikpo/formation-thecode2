import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { markEnrollmentPaidIfPending } from '@/app/lib/enrollment-security';
import { getDuration } from '@/app/lib/formation-config';
import {
  isCryptoWebhookConfigured,
  isCryptoWebhookPaid,
  verifyCryptoWebhookSignature,
} from '@/app/lib/crypto-payments';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isCryptoWebhookConfigured()) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 503 });
  }

  const signature = request.headers.get('x-nowpayments-sig') ?? '';
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload || !signature) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  if (!verifyCryptoWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    if (!isCryptoWebhookPaid(payload)) {
      return NextResponse.json({ received: true });
    }

    const orderId = typeof payload.order_id === 'string' ? payload.order_id : null;
    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: orderId,
        status: 'pending_payment',
        paymentMethod: 'crypto',
      },
    });

    if (!enrollment) {
      return NextResponse.json({ received: true });
    }

    const expectedUsd = getDuration(enrollment.duration).amountUsd;
    const priceAmount = payload.price_amount;
    if (typeof priceAmount === 'number' && priceAmount !== expectedUsd) {
      return NextResponse.json({ received: true });
    }

    await markEnrollmentPaidIfPending(enrollment.id);
  } catch {
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
