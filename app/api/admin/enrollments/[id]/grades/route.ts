import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden } from '@/app/lib/api-security';
import { sendGradePublishedEmail } from '@/app/lib/email';
import { getAppBaseUrl } from '@/app/lib/email-verification';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!enrollment) {
    return apiError('Inscription introuvable', 404);
  }

  const body = await request.json();
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const score = typeof body.score === 'number' ? body.score : NaN;
  const maxScore = typeof body.maxScore === 'number' ? body.maxScore : 20;
  const comment = typeof body.comment === 'string' ? body.comment.trim() : null;

  if (!title) {
    return apiError('Titre requis', 400);
  }
  if (!Number.isFinite(score) || score < 0 || score > maxScore) {
    return apiError('Note invalide', 400);
  }

  const grade = await prisma.enrollmentGrade.create({
    data: {
      enrollmentId: id,
      title,
      score,
      maxScore,
      comment: comment || null,
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl(request);
  const espaceUrl = `${base.replace(/\/$/, '')}/espace?tab=notes`;

  void sendGradePublishedEmail({
    to: enrollment.user.email,
    firstName: enrollment.firstName,
    gradeTitle: title,
    score,
    maxScore,
    espaceUrl,
  }).catch(() => {});

  return NextResponse.json({ grade }, { status: 201 });
}
