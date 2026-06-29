import { prisma } from '@/app/lib/prisma';
import type { PaymentPhase } from '@/app/lib/enrollment-payments';

export type ReceiptPaymentMethod = 'stripe' | 'fedapay' | 'crypto';

export type PaymentReceiptRow = {
  id: string;
  enrollmentId: string;
  phase: PaymentPhase;
  receiptNumber: string;
  amountUsd: number;
  amountXof: number;
  paymentMethod: ReceiptPaymentMethod;
  reference: string | null;
  paidAt: Date;
  emailSentAt: Date | null;
  createdAt: Date;
};

export type ReceiptEnrollmentRow = {
  firstName: string;
  lastName: string;
  phone: string;
  domain: string;
  duration: string;
  formationSession: string;
  registrationFeeUsd: number;
  formationFeeUsd: number;
  installment1FeeUsd: number;
  installment2FeeUsd: number;
  installment3FeeUsd: number;
  registrationPaidAt: Date | null;
  formationPaidAt: Date | null;
  installment1PaidAt: Date | null;
  installment2PaidAt: Date | null;
  installment3PaidAt: Date | null;
  paymentMethod: ReceiptPaymentMethod | null;
  formationPaymentMethod: ReceiptPaymentMethod | null;
  installment3PaymentMethod: ReceiptPaymentMethod | null;
  stripeSessionId: string | null;
  fedapayTransactionId: string | null;
  cryptoInvoiceId: string | null;
  formationStripeSessionId: string | null;
  formationFedapayTransactionId: string | null;
  formationCryptoInvoiceId: string | null;
  installment3StripeSessionId: string | null;
  installment3FedapayTransactionId: string | null;
  installment3CryptoInvoiceId: string | null;
  user: { email: string };
};

export type PaymentReceiptWithEnrollment = PaymentReceiptRow & {
  enrollment: ReceiptEnrollmentRow;
};

type PaymentReceiptStore = {
  findUnique(args: {
    where: { id: string } | { enrollmentId_phase: { enrollmentId: string; phase: PaymentPhase } };
    include?: { enrollment: { include: { user: { select: { email: true } } } } };
  }): Promise<PaymentReceiptRow | PaymentReceiptWithEnrollment | null>;
  findFirst(args: {
    where: { id: string; enrollment: { userId: string } };
    include: { enrollment: { include: { user: { select: { email: true } } } } };
  }): Promise<PaymentReceiptWithEnrollment | null>;
  create(args: {
    data: {
      enrollmentId: string;
      phase: PaymentPhase;
      receiptNumber: string;
      amountUsd: number;
      amountXof: number;
      paymentMethod: ReceiptPaymentMethod;
      reference: string | null;
      paidAt: Date;
    };
  }): Promise<PaymentReceiptRow>;
  update(args: {
    where: { id: string };
    data: { emailSentAt: Date };
  }): Promise<PaymentReceiptRow>;
};

function receiptStore(): PaymentReceiptStore {
  return (prisma as unknown as { paymentReceipt: PaymentReceiptStore }).paymentReceipt;
}

export function findReceiptByEnrollmentPhase(enrollmentId: string, phase: PaymentPhase) {
  return receiptStore().findUnique({
    where: { enrollmentId_phase: { enrollmentId, phase } },
  });
}

export function findReceiptWithEnrollment(receiptId: string) {
  return receiptStore().findUnique({
    where: { id: receiptId },
    include: {
      enrollment: {
        include: { user: { select: { email: true } } },
      },
    },
  }) as Promise<PaymentReceiptWithEnrollment | null>;
}

export function findReceiptForUser(receiptId: string, userId: string) {
  return receiptStore().findFirst({
    where: { id: receiptId, enrollment: { userId } },
    include: {
      enrollment: {
        include: { user: { select: { email: true } } },
      },
    },
  });
}

export function createPaymentReceipt(data: {
  enrollmentId: string;
  phase: PaymentPhase;
  receiptNumber: string;
  amountUsd: number;
  amountXof: number;
  paymentMethod: ReceiptPaymentMethod;
  reference: string | null;
  paidAt: Date;
}) {
  return receiptStore().create({ data });
}

export function markReceiptEmailSent(receiptId: string) {
  return receiptStore().update({
    where: { id: receiptId },
    data: { emailSentAt: new Date() },
  });
}

export async function findEnrollmentForReceipt(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: { select: { email: true } } },
  });

  if (!enrollment?.user) return null;

  return enrollment as unknown as ReceiptEnrollmentRow & { id: string };
}
