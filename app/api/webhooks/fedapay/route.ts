import { NextResponse } from 'next/server';
import { Webhook } from 'fedapay';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'Webhook FedaPay non configuré' }, { status: 503 });
  }

  const raw = await request.text();
  const signature =
    request.headers.get('fedapay-signature') ??
    request.headers.get('x-fedapay-signature') ??
    '';

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: { name?: string; entity?: { id?: number | string; status?: string } };
  try {
    event = Webhook.constructEvent(raw, signature, secret);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Signature invalide';
    console.error('[fedapay webhook]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const transactionId = event.entity?.id != null ? String(event.entity.id) : null;
    if (!transactionId) {
      return NextResponse.json({ received: true });
    }

    const paidStatuses = ['approved', 'transferred'];
    const status = event.entity?.status ?? '';
    const isPaidEvent =
      event.name === 'transaction.approved' ||
      event.name === 'transaction.transferred' ||
      paidStatuses.includes(status);

    if (isPaidEvent) {
      await prisma.enrollment.updateMany({
        where: { fedapayTransactionId: transactionId, status: 'pending_payment' },
        data: { status: 'paid', paidAt: new Date() },
      });
    }
  } catch (e: unknown) {
    console.error('[fedapay webhook handler]', e);
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
