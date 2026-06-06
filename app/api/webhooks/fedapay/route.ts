import { NextResponse } from 'next/server';
import { Webhook } from 'fedapay';
import { prisma } from '@/app/lib/prisma';
import {
  markFormationPaidIfActive,
  markRegistrationPaidIfPending,
} from '@/app/lib/enrollment-security';
import { getExpectedXof } from '@/app/lib/enrollment-verify';
import { retrieveFedapayTransaction } from '@/app/lib/fedapay';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 503 });
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
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
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

    if (!isPaidEvent) {
      return NextResponse.json({ received: true });
    }

    const regEnrollment = await prisma.enrollment.findFirst({
      where: {
        fedapayTransactionId: transactionId,
        status: 'pending_payment',
      },
    });

    if (regEnrollment) {
      const transaction = await retrieveFedapayTransaction(transactionId);
      const amountOk = Number(transaction?.amount) === getExpectedXof(regEnrollment, 'registration');
      if (transaction?.wasPaid() && amountOk) {
        await markRegistrationPaidIfPending(regEnrollment.id);
      }
      return NextResponse.json({ received: true });
    }

    const formEnrollment = await prisma.enrollment.findFirst({
      where: {
        formationFedapayTransactionId: transactionId,
        status: 'active',
        formationPaidAt: null,
      },
    });

    if (formEnrollment) {
      const transaction = await retrieveFedapayTransaction(transactionId);
      const amountOk = Number(transaction?.amount) === getExpectedXof(formEnrollment, 'formation');
      if (transaction?.wasPaid() && amountOk) {
        await markFormationPaidIfActive(formEnrollment.id);
      }
    }
  } catch {
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
