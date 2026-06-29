import { NextResponse } from 'next/server';
import { Webhook } from 'fedapay';
import { prisma } from '@/app/lib/prisma';
import {
  markFormationPaidIfActive,
  markInstallmentPaid,
  markRegistrationPaidIfPending,
} from '@/app/lib/enrollment-security';
import { getExpectedXof } from '@/app/lib/enrollment-verify';
import { retrieveFedapayTransaction } from '@/app/lib/fedapay';
import { usesInstallmentPlan } from '@/app/lib/installment-payments';
import type { InstallmentNumber } from '@/app/lib/installment-payments';

export const runtime = 'nodejs';

async function handleInstallmentFedapay(
  enrollmentId: string,
  transactionId: string,
  installment: InstallmentNumber,
) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      status: { in: ['active', 'paid'] },
      registrationPaidAt: { not: null },
    },
  });

  if (!enrollment) return;

  const phase = `installment_${installment}` as const;
  const transaction = await retrieveFedapayTransaction(transactionId);
  const amountOk = Number(transaction?.amount) === getExpectedXof(enrollment, phase);
  if (transaction?.wasPaid() && amountOk) {
    await markInstallmentPaid(enrollment.id, installment);
  }
}

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

    const inst1 = await prisma.enrollment.findFirst({
      where: {
        fedapayTransactionId: transactionId,
        status: { in: ['active', 'paid'] },
      },
    });
    if (inst1) {
      await handleInstallmentFedapay(inst1.id, transactionId, 1);
      return NextResponse.json({ received: true });
    }

    const inst2 = await prisma.enrollment.findFirst({
      where: {
        formationFedapayTransactionId: transactionId,
        status: { in: ['active', 'paid'] },
        formationPaidAt: null,
      },
    });
    if (inst2) {
      if (usesInstallmentPlan(inst2)) {
        await handleInstallmentFedapay(inst2.id, transactionId, 2);
      } else {
        const transaction = await retrieveFedapayTransaction(transactionId);
        const amountOk = Number(transaction?.amount) === getExpectedXof(inst2, 'formation');
        if (transaction?.wasPaid() && amountOk) {
          await markFormationPaidIfActive(inst2.id);
        }
      }
      return NextResponse.json({ received: true });
    }

    const inst3 = await prisma.enrollment.findFirst({
      where: {
        installment3FedapayTransactionId: transactionId,
        status: { in: ['active', 'paid'] },
        formationPaidAt: null,
      },
    });
    if (inst3) {
      await handleInstallmentFedapay(inst3.id, transactionId, 3);
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
      const amountOk =
        Number(transaction?.amount) === getExpectedXof(regEnrollment, 'registration');
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

    if (formEnrollment && !usesInstallmentPlan(formEnrollment)) {
      const transaction = await retrieveFedapayTransaction(transactionId);
      const amountOk =
        Number(transaction?.amount) === getExpectedXof(formEnrollment, 'formation');
      if (transaction?.wasPaid() && amountOk) {
        await markFormationPaidIfActive(formEnrollment.id);
      }
    }
  } catch {
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
