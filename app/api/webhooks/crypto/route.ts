import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
  isCryptoWebhookConfigured,
  isCryptoWebhookPaid,
  verifyCryptoWebhookSignature,
} from '@/app/lib/crypto-payments';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isCryptoWebhookConfigured()) {
    return NextResponse.json(
      { error: 'IPN Secret non configuré — générez-le dans NOWPayments Store Settings' },
      { status: 503 },
    );
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

    await prisma.enrollment.updateMany({
      where: { id: orderId, status: 'pending_payment', paymentMethod: 'crypto' },
      data: { status: 'paid', paidAt: new Date() },
    });
  } catch (e: unknown) {
    console.error('[crypto webhook handler]', e);
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
