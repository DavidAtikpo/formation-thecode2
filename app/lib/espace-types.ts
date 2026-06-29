export type Grade = {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  comment: string | null;
  gradedAt: string;
};

export type ReceiptPhase =
  | 'registration'
  | 'formation'
  | 'installment_1'
  | 'installment_2'
  | 'installment_3';

export type Receipt = {
  id: string;
  receiptNumber: string;
  phase: ReceiptPhase;
  phaseLabel: string;
  amountUsd: number;
  paidAt: string;
  downloadUrl: string;
};

export type InstallmentRow = {
  number: 1 | 2 | 3;
  label: string;
  amountUsd: number;
  paid: boolean;
  paidAt: string | null;
};

export type LearningResource = {
  id: string;
  title: string;
  description: string | null;
  type: 'course_pdf' | 'tutorial';
  typeLabel: string;
  fileUrl: string | null;
  externalUrl: string | null;
  deliveredAt: string;
};

export type EnrollmentData = {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  email: string;
  domain: string;
  duration: string;
  session: string;
  sessionLabel: string;
  schedule: string;
  status: string;
  paymentModel: 'installments' | 'legacy';
  registrationFeeUsd: number;
  formationFeeUsd: number;
  totalFeeUsd: number;
  registrationPaid: boolean;
  formationPaid: boolean;
  registrationPaidAt: string | null;
  formationPaidAt: string | null;
  installments: InstallmentRow[];
  nextInstallment: 1 | 2 | 3 | null;
  formationDeadline: string;
  formationDeadlineDays: number;
  formationDeadlineLabel: string;
  formationOverdue: boolean;
  certificateIssued: boolean;
  certificateUrl: string | null;
  certificateDownloadUrl: string | null;
  certificateIssuedAt: string | null;
  certificateNumber: string | null;
  grades: Grade[];
  averageGrade: number | null;
  receipts: Receipt[];
  createdAt: string;
  identity: {
    documentType: 'id_card' | 'passport' | null;
    status: 'pending' | 'verified' | 'failed' | 'expired';
    verifiedAt: string | null;
    expiryDate: string | null;
    extractedName: string | null;
    error: string | null;
  };
  skillProfile: {
    completed: boolean;
    skillLevel: 'beginner' | 'experienced' | null;
    yearsExperience: number | null;
    masteredTechnologies: string[];
    completedAt: string | null;
  };
  project: {
    url: string | null;
    title: string | null;
    submittedAt: string | null;
  };
};

export function enrollmentStatusLabel(status: string, paymentModel: 'installments' | 'legacy' = 'installments') {
  if (status === 'pending_payment') {
    return paymentModel === 'legacy'
      ? 'Inscription enregistrée — paiement en attente'
      : 'Inscription enregistrée';
  }
  if (status === 'active') {
    return paymentModel === 'installments'
      ? 'Inscrit — paiement en tranches'
      : 'Inscrit — formation en cours de paiement';
  }
  if (status === 'paid') return 'Inscription complète';
  return status;
}
