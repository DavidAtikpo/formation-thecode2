import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiForbidden, apiUnauthorized } from '@/app/lib/api-security';
import { markEnrollmentPaidIfPending } from '@/app/lib/enrollment-security';
import { getDuration } from '@/app/lib/formation-config';
import { getStripe } from '@/app/lib/stripe';
import { isCryptoOrderPaid } from '@/app/lib/crypto-payments';
import { retrieveFedapayTransaction } from '@/app/lib/fedapay';

const PUBLIC_ENROLLMENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  domain: true,
  formationSession: true,
  duration: true,
  status: true,
  paidAt: true,
} as const;

export async function GET(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiUnauthorized();
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') ?? 'stripe';
  const sessionId = searchParams.get('session_id');
  const transactionId = searchParams.get('transaction_id') ?? searchParams.get('id');

  if (provider === 'stripe') {
    if (!sessionId) {
      return NextResponse.json({ error: 'Référence invalide' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { stripeSessionId: sessionId, userId, paymentMethod: 'stripe' },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    if (enrollment.status === 'paid') {
      return NextResponse.json({
        status: 'paid',
        enrollment: await prisma.enrollment.findUnique({
          where: { id: enrollment.id },
          select: PUBLIC_ENROLLMENT_SELECT,
        }),
      });
    }

    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const metaUserId = session.metadata?.userId;
        const metaEnrollmentId = session.metadata?.enrollmentId ?? session.client_reference_id;
        const price = getDuration(enrollment.duration);
        const amountOk = session.amount_total === price.stripeCents;

        if (
          session.payment_status === 'paid'
          && session.metadata?.purpose === 'formation_enrollment'
          && metaUserId === userId
          && metaEnrollmentId === enrollment.id
          && amountOk
        ) {
          const updated = await markEnrollmentPaidIfPending(enrollment.id);
          if (updated) {
            return NextResponse.json({
              status: 'paid',
              enrollment: await prisma.enrollment.findUnique({
                where: { id: updated.id },
                select: PUBLIC_ENROLLMENT_SELECT,
              }),
            });
          }
        }
      } catch {
        /* vérification provider échouée */
      }
    }

    return NextResponse.json({
      status: enrollment.status,
      enrollment: await prisma.enrollment.findUnique({
        where: { id: enrollment.id },
        select: PUBLIC_ENROLLMENT_SELECT,
      }),
    });
  }

  if (provider === 'fedapay') {
    if (!transactionId) {
      return NextResponse.json({ error: 'Référence invalide' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { fedapayTransactionId: transactionId, userId, paymentMethod: 'fedapay' },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    if (enrollment.status === 'paid') {
      return NextResponse.json({
        status: 'paid',
        enrollment: await prisma.enrollment.findUnique({
          where: { id: enrollment.id },
          select: PUBLIC_ENROLLMENT_SELECT,
        }),
      });
    }

    try {
      const transaction = await retrieveFedapayTransaction(transactionId);
      const amountOk = Number(transaction?.amount) === enrollment.amountXof;
      if (transaction?.wasPaid() && amountOk) {
        const updated = await markEnrollmentPaidIfPending(enrollment.id);
        if (updated) {
          return NextResponse.json({
            status: 'paid',
            enrollment: await prisma.enrollment.findUnique({
              where: { id: updated.id },
              select: PUBLIC_ENROLLMENT_SELECT,
            }),
          });
        }
      }
    } catch {
      /* vérification provider échouée */
    }

    return NextResponse.json({
      status: enrollment.status,
      enrollment: await prisma.enrollment.findUnique({
        where: { id: enrollment.id },
        select: PUBLIC_ENROLLMENT_SELECT,
      }),
    });
  }

  if (provider === 'crypto') {
    const enrollmentId = searchParams.get('enrollment_id');
    if (!enrollmentId) {
      return NextResponse.json({ error: 'Référence invalide' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId, paymentMethod: 'crypto' },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 });
    }

    if (enrollment.status === 'paid') {
      return NextResponse.json({
        status: 'paid',
        enrollment: await prisma.enrollment.findUnique({
          where: { id: enrollment.id },
          select: PUBLIC_ENROLLMENT_SELECT,
        }),
      });
    }

    try {
      if (await isCryptoOrderPaid(enrollment.id)) {
        const updated = await markEnrollmentPaidIfPending(enrollment.id);
        if (updated) {
          return NextResponse.json({
            status: 'paid',
            enrollment: await prisma.enrollment.findUnique({
              where: { id: updated.id },
              select: PUBLIC_ENROLLMENT_SELECT,
            }),
          });
        }
      }
    } catch {
      /* vérification provider échouée */
    }

    return NextResponse.json({
      status: enrollment.status,
      enrollment: await prisma.enrollment.findUnique({
        where: { id: enrollment.id },
        select: PUBLIC_ENROLLMENT_SELECT,
      }),
    });
  }

  return apiForbidden();
}
