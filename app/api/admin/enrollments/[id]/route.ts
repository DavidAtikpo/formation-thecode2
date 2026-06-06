import { NextResponse } from 'next/server';
import type { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, isAllowedHttpsUrl } from '@/app/lib/api-security';
import { sendCertificateReadyEmail } from '@/app/lib/email';
import { getAppBaseUrl } from '@/app/lib/email-verification';
import {
  canPublishCertificate,
  generateCertificateNumber,
  getDefaultSignatoryName,
} from '@/app/lib/certificate';
import { serializeAdminEnrollment } from '@/app/lib/admin-enrollment';

const VALID_STATUSES: EnrollmentStatus[] = ['pending_payment', 'active', 'paid', 'cancelled'];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, emailVerified: true, createdAt: true } },
      grades: { orderBy: { gradedAt: 'desc' } },
      receipts: { orderBy: { paidAt: 'desc' } },
    },
  });

  if (!enrollment) {
    return apiError('Inscription introuvable', 404);
  }

  return NextResponse.json({ enrollment: serializeAdminEnrollment(enrollment) });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const body = await request.json();
  const status = body.status as EnrollmentStatus | undefined;
  const certificateUrl =
    typeof body.certificateUrl === 'string' ? body.certificateUrl.trim() : undefined;
  const issueCertificate = body.issueCertificate === true;
  const publishCertificate = body.publishCertificate === true;
  const unpublishCertificate = body.unpublishCertificate === true;
  const signedBy =
    typeof body.signedBy === 'string' ? body.signedBy.trim() : getDefaultSignatoryName();

  const existing = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      grades: { orderBy: { gradedAt: 'desc' } },
    },
  });
  if (!existing) {
    return apiError('Inscription introuvable', 404);
  }

  const data: Record<string, unknown> = {};

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return apiError('Statut invalide', 400);
    }
    data.status = status;
    if (status === 'paid') {
      data.paidAt = existing.paidAt ?? new Date();
      data.formationPaidAt = existing.formationPaidAt ?? new Date();
    }
    if (status === 'pending_payment') {
      data.paidAt = null;
    }
  }

  if (certificateUrl !== undefined) {
    if (certificateUrl && !isAllowedHttpsUrl(certificateUrl)) {
      return apiError('URL de certificat invalide (HTTPS requis)', 400);
    }
    data.certificateUrl = certificateUrl || null;
    data.certificateIssuedAt = certificateUrl ? new Date() : null;
  }

  if (issueCertificate && certificateUrl === undefined && existing.certificateUrl) {
    data.certificateIssuedAt = new Date();
  }

  if (publishCertificate) {
    if (!canPublishCertificate(existing)) {
      return apiError(
        "L'identité du candidat doit être vérifiée avant de publier le certificat",
        400,
      );
    }
    if (!signedBy) {
      return apiError('Nom du signataire requis', 400);
    }
    data.certificateNumber = existing.certificateNumber ?? generateCertificateNumber();
    data.certificateSignedBy = signedBy;
    data.certificateIssuedAt = new Date();
    data.certificateUrl = null;
  }

  if (unpublishCertificate) {
    data.certificateNumber = null;
    data.certificateSignedBy = null;
    data.certificateIssuedAt = null;
    data.certificateUrl = null;
  }

  if (Object.keys(data).length === 0) {
    return apiError('Aucune modification', 400);
  }

  const enrollment = await prisma.enrollment.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, email: true, emailVerified: true, createdAt: true } },
      grades: { orderBy: { gradedAt: 'desc' } },
      receipts: { orderBy: { paidAt: 'desc' } },
    },
  });

  const newCertificateUrl =
    certificateUrl !== undefined ? certificateUrl || null : undefined;
  const certificateJustPublished =
    (Boolean(newCertificateUrl) && !existing.certificateUrl) ||
    (publishCertificate && !existing.certificateIssuedAt);

  if (certificateJustPublished) {
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl(request);
    const espaceUrl = `${base.replace(/\/$/, '')}/espace?tab=certificat`;

    void sendCertificateReadyEmail({
      to: existing.user.email,
      firstName: existing.firstName,
      espaceUrl,
    }).catch(() => {});
  }

  return NextResponse.json({ enrollment: serializeAdminEnrollment(enrollment) });
}
