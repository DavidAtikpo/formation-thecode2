import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden } from '@/app/lib/api-security';
import { buildCertificateFromEnrollment, getDefaultSignatoryName } from '@/app/lib/certificate';

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

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
