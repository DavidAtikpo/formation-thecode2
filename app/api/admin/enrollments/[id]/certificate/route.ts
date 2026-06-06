import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden } from '@/app/lib/api-security';
import { buildCertificateFromEnrollment } from '@/app/lib/certificate';

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

  const filename = `certificat-${enrollment.certificateNumber ?? enrollment.id}.html`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
