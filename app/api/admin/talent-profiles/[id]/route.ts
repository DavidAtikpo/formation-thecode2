import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { parseTalentProfileBody } from '@/app/lib/ecosystem-public';
import { serializeAdminTalentProfile } from '@/app/lib/ecosystem-admin';
import type { PublicationStatus } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) return apiForbidden();

  const { id } = await context.params;

  try {
    const existing = await prisma.talentProfile.findUnique({ where: { id } });
    if (!existing) return apiError('Profil introuvable', 404);

    const body = await request.json();
    const parsed = parseTalentProfileBody({
      firstName: body.firstName ?? existing.firstName,
      lastName: body.lastName ?? existing.lastName,
      category: body.category ?? existing.category,
      headline: body.headline ?? existing.headline,
      bio: body.bio ?? existing.bio,
      country: body.country ?? existing.country,
      yearsExperience: body.yearsExperience ?? existing.yearsExperience,
      skills: body.skills ?? existing.skills,
      portfolioUrl: body.portfolioUrl ?? existing.portfolioUrl,
      availability: body.availability ?? existing.availability,
    });
    if ('error' in parsed) return apiError(parsed.error, 400);

    let status = existing.status;
    if (body.status === 'pending' || body.status === 'published' || body.status === 'archived') {
      status = body.status as PublicationStatus;
    }

    let publishedAt = existing.publishedAt;
    if (status === 'published' && existing.status !== 'published') {
      publishedAt = new Date();
    }

    const profile = await prisma.talentProfile.update({
      where: { id },
      data: {
        ...parsed,
        status,
        publishedAt,
      },
    });

    return NextResponse.json({ profile: serializeAdminTalentProfile(profile) });
  } catch {
    return apiServerError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) return apiForbidden();

  const { id } = await context.params;

  try {
    await prisma.talentProfile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return apiError('Profil introuvable', 404);
  }
}
