import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { buildCertificateFromEnrollment, getDefaultSignatoryName } from '@/app/lib/certificate';
import { renderCertificatePdf } from '@/app/lib/certificate-pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const signedBy =
    searchParams.get('signedBy')?.trim() || getDefaultSignatoryName() || 'Directeur de formation';

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: { grades: { orderBy: { gradedAt: 'desc' } } },
  });

  if (!enrollment) {
    return apiError('Inscription introuvable', 404);
  }

  const html = buildCertificateFromEnrollment(enrollment, { signedBy, preview: true });

  try {
    const pdf = await renderCertificatePdf(html);
    const filename = `apercu-certificat-${enrollment.id}.pdf`;

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
