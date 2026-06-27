import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiForbidden } from '@/app/lib/api-security';
import {
  getDuration,
  getDomain,
  formatFormationDeadlineDays,
  getFormationFeeDeadlineDays,
  getFormationPaymentDeadline,
  getFormationSession,
  type DurationId,
  type SessionId,
} from '@/app/lib/formation-config';
import { HOUR_SLOTS, WEEK_DAYS } from '@/app/lib/formation-config';
import { PHASE_LABELS } from '@/app/lib/payment-receipt';
import { serializeProjectSubmission } from '@/app/lib/project-submission';

export async function GET() {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: { in: ['pending_payment', 'active', 'paid'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      grades: { orderBy: { gradedAt: 'desc' } },
      receipts: { orderBy: { paidAt: 'desc' } },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ enrollment: null });
  }

  const session = getFormationSession(enrollment.formationSession as SessionId);
  const duration = getDuration(enrollment.duration);
  const domain = getDomain(enrollment.domain);
  const formationDeadline = getFormationPaymentDeadline(
    enrollment.formationSession as SessionId,
    enrollment.duration as DurationId,
  );
  const formationDeadlineDays = getFormationFeeDeadlineDays(enrollment.duration as DurationId);
  const now = new Date();

  const registrationPaid = Boolean(enrollment.registrationPaidAt);
  const formationPaid = Boolean(enrollment.formationPaidAt);
  const formationOverdue = registrationPaid && !formationPaid && now > formationDeadline;

  let identityStatus = enrollment.identityVerificationStatus;
  if (
    identityStatus === 'verified' &&
    enrollment.identityExpiryDate &&
    enrollment.identityExpiryDate <= now
  ) {
    identityStatus = 'expired';
    void prisma.enrollment
      .update({
        where: { id: enrollment.id },
        data: { identityVerificationStatus: 'expired' },
      })
      .catch(() => {});
  }

  const receipts = enrollment.receipts.map((r) => ({
    id: r.id,
    receiptNumber: r.receiptNumber,
    phase: r.phase,
    phaseLabel: PHASE_LABELS[r.phase],
    amountUsd: r.amountUsd,
    paidAt: r.paidAt.toISOString(),
    downloadUrl: `/api/espace/receipts/${r.id}`,
  }));

  const scheduleLabel = enrollment.scheduleDays
    .map((d) => WEEK_DAYS.find((w) => w.id === d)?.label ?? d)
    .join(', ');
  const hoursLabel =
    HOUR_SLOTS.find((h) => h.id === enrollment.scheduleHours)?.label ?? enrollment.scheduleHours;

  const grades = enrollment.grades.map((g) => ({
    id: g.id,
    title: g.title,
    score: g.score,
    maxScore: g.maxScore,
    comment: g.comment,
    gradedAt: g.gradedAt.toISOString(),
  }));

  const averageGrade =
    grades.length > 0
      ? grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20, 0) / grades.length
      : null;

  return NextResponse.json({
    enrollment: {
      id: enrollment.id,
      firstName: enrollment.firstName,
      lastName: enrollment.lastName,
      country: enrollment.country,
      email: (
        await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
      )?.email,
      domain: domain.label,
      duration: duration.label,
      session: session.period,
      sessionLabel: session.label,
      schedule: `${scheduleLabel} — ${hoursLabel}`,
      status: enrollment.status,
      registrationFeeUsd: enrollment.registrationFeeUsd,
      formationFeeUsd: enrollment.formationFeeUsd,
      registrationPaid,
      formationPaid,
      registrationPaidAt: enrollment.registrationPaidAt?.toISOString() ?? null,
      formationPaidAt: enrollment.formationPaidAt?.toISOString() ?? null,
      formationDeadline: formationDeadline.toISOString(),
      formationDeadlineDays,
      formationDeadlineLabel: formatFormationDeadlineDays(formationDeadlineDays),
      formationOverdue,
      certificateIssued: Boolean(enrollment.certificateIssuedAt),
      certificateUrl: enrollment.certificateUrl,
      certificateDownloadUrl: enrollment.certificateIssuedAt
        ? '/api/espace/certificate'
        : null,
      certificateIssuedAt: enrollment.certificateIssuedAt?.toISOString() ?? null,
      certificateNumber: enrollment.certificateNumber,
      grades,
      averageGrade: averageGrade != null ? Math.round(averageGrade * 10) / 10 : null,
      receipts,
      createdAt: enrollment.createdAt.toISOString(),
      identity: {
        documentType: enrollment.identityDocumentType,
        status: identityStatus,
        verifiedAt: enrollment.identityVerifiedAt?.toISOString() ?? null,
        expiryDate: enrollment.identityExpiryDate?.toISOString() ?? null,
        extractedName: enrollment.identityExtractedName,
        error: enrollment.identityVerificationError,
      },
      skillProfile: {
        completed: Boolean(enrollment.skillProfileCompletedAt),
        skillLevel: enrollment.skillLevel,
        yearsExperience: enrollment.yearsExperience,
        masteredTechnologies: enrollment.masteredTechnologies,
        completedAt: enrollment.skillProfileCompletedAt?.toISOString() ?? null,
      },
      project: serializeProjectSubmission(enrollment),
    },
  });
}
