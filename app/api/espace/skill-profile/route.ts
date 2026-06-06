import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiError, apiForbidden } from '@/app/lib/api-security';
import { parseSkillProfileBody } from '@/app/lib/skill-profile';

export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: { in: ['active', 'paid'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!enrollment) {
    return apiError('Aucune inscription active', 404);
  }

  const body = await request.json();
  const parsed = parseSkillProfileBody(body);

  if ('error' in parsed) {
    return apiError(parsed.error, 400);
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      skillLevel: parsed.skillLevel,
      yearsExperience: parsed.yearsExperience,
      masteredTechnologies: parsed.masteredTechnologies ?? [],
      skillProfileCompletedAt: new Date(),
    },
    select: {
      skillLevel: true,
      yearsExperience: true,
      masteredTechnologies: true,
      skillProfileCompletedAt: true,
    },
  });

  return NextResponse.json({
    skillProfile: {
      skillLevel: updated.skillLevel,
      yearsExperience: updated.yearsExperience,
      masteredTechnologies: updated.masteredTechnologies,
      completedAt: updated.skillProfileCompletedAt?.toISOString() ?? null,
    },
  });
}
