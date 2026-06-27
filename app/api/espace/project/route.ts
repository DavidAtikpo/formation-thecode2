import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { parseProjectSubmissionBody, serializeProjectSubmission } from '@/app/lib/project-submission';

export async function GET() {
  const userId = await getVerifiedSessionUserId();
  if (!userId) return apiForbidden();

  try {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        status: { in: ['pending_payment', 'active', 'paid'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        projectSiteUrl: true,
        projectSiteTitle: true,
        projectSiteSubmittedAt: true,
      },
    });

    if (!enrollment) {
      return apiError('Aucune inscription active', 404);
    }

    return NextResponse.json({
      project: serializeProjectSubmission(enrollment),
    });
  } catch {
    return apiServerError();
  }
}

export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) return apiForbidden();

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: { in: ['pending_payment', 'active', 'paid'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!enrollment) {
    return apiError('Aucune inscription active', 404);
  }

  try {
    const body = await request.json();
    const parsed = parseProjectSubmissionBody(body);
    if ('error' in parsed) return apiError(parsed.error, 400);

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        projectSiteUrl: parsed.url,
        projectSiteTitle: parsed.title,
        projectSiteSubmittedAt: new Date(),
      },
      select: {
        projectSiteUrl: true,
        projectSiteTitle: true,
        projectSiteSubmittedAt: true,
      },
    });

    return NextResponse.json({
      project: serializeProjectSubmission(updated),
      message: 'Lien de votre projet enregistré. L\'équipe pourra consulter votre site pour la notation.',
    });
  } catch {
    return apiServerError();
  }
}
