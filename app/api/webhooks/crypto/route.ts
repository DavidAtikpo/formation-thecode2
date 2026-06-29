import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
  markFormationPaidIfActive,
  markInstallmentPaid,
  markRegistrationPaidIfPending,
} from '@/app/lib/enrollment-security';
import { getPhaseAmountUsd } from '@/app/lib/installment-payments';
import type { PaymentPhase } from '@/app/lib/installment-payments';
import {
  isCryptoWebhookConfigured,
  isCryptoWebhookPaid,
  verifyCryptoWebhookSignature,
} from '@/app/lib/crypto-payments';

export const runtime = 'nodejs';

function parseOrderId(orderId: string): { enrollmentId: string; phase: PaymentPhase } {
  const installmentMatch = orderId.match(/^(.+)_i([123])$/);
  if (installmentMatch) {
    return {
      enrollmentId: installmentMatch[1],
      phase: `installment_${installmentMatch[2]}` as PaymentPhase,
    };
  }
  if (orderId.endsWith('_formation')) {
    return { enrollmentId: orderId.slice(0, -'_formation'.length), phase: 'formation' };
  }
  return { enrollmentId: orderId, phase: 'registration' };
}

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

    const { enrollmentId, phase } = parseOrderId(orderId);

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json({ received: true });
    }

    const expectedUsd = getPhaseAmountUsd(enrollment, phase);
    const priceAmount = payload.price_amount;
    if (typeof priceAmount === 'number' && priceAmount !== expectedUsd) {
      return NextResponse.json({ received: true });
    }

    if (phase === 'registration') {
      if (enrollment.status !== 'pending_payment' || enrollment.paymentMethod !== 'crypto') {
        return NextResponse.json({ received: true });
      }
      await markRegistrationPaidIfPending(enrollment.id);
    } else if (phase === 'formation') {
      if (enrollment.status !== 'active' || enrollment.formationPaymentMethod !== 'crypto') {
        return NextResponse.json({ received: true });
      }
      await markFormationPaidIfActive(enrollment.id);
    } else {
      const installment = Number(phase.replace('installment_', '')) as 1 | 2 | 3;
      if (enrollment.status !== 'active' && enrollment.status !== 'paid') {
        return NextResponse.json({ received: true });
      }
      await markInstallmentPaid(enrollment.id, installment);
    }
  } catch {
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
