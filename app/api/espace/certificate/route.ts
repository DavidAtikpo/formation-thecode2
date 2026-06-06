import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiForbidden } from '@/app/lib/api-security';
import { buildCertificateFromEnrollment } from '@/app/lib/certificate';

export async function GET() {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: { in: ['active', 'paid'] },
      certificateIssuedAt: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    include: { grades: { orderBy: { gradedAt: 'desc' } } },
  });

  if (!enrollment?.certificateSignedBy || !enrollment.certificateNumber) {
    return NextResponse.json({ error: 'Certificat introuvable' }, { status: 404 });
  }

  const html = buildCertificateFromEnrollment(enrollment, {
    signedBy: enrollment.certificateSignedBy,
    preview: false,
  });

  const filename = `certificat-${enrollment.certificateNumber}.html`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
