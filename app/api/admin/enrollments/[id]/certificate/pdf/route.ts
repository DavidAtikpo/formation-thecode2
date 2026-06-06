import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { buildCertificateFromEnrollment } from '@/app/lib/certificate';
import { renderCertificatePdf } from '@/app/lib/certificate-pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: { grades: { orderBy: { gradedAt: 'desc' } } },
  });

  if (!enrollment?.certificateIssuedAt || !enrollment.certificateSignedBy) {
    return apiError('Certificat non publié', 404);
  }

  const html = buildCertificateFromEnrollment(enrollment, {
    signedBy: enrollment.certificateSignedBy,
    preview: false,
  });

  try {
    const pdf = await renderCertificatePdf(html);
    const filename = `certificat-${enrollment.certificateNumber ?? enrollment.id}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return apiServerError();
  }
}
