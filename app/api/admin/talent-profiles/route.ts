import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { parseTalentProfileBody } from '@/app/lib/ecosystem-public';
import { serializeAdminTalentProfile } from '@/app/lib/ecosystem-admin';

export async function GET() {
  const adminId = await getAdminSessionUserId();
  if (!adminId) return apiForbidden();

  try {
    const profiles = await prisma.talentProfile.findMany({
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
    return NextResponse.json({
      profiles: profiles.map(serializeAdminTalentProfile),
    });
  } catch {
    return apiServerError();
  }
}

export async function POST(request: Request) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) return apiForbidden();

  try {
    const body = await request.json();
    const parsed = parseTalentProfileBody(body);
    if ('error' in parsed) return apiError(parsed.error, 400);

    const profile = await prisma.talentProfile.create({
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        category: parsed.category,
        headline: parsed.headline,
        bio: parsed.bio,
        country: parsed.country,
        yearsExperience: parsed.yearsExperience,
        skills: parsed.skills,
        portfolioUrl: parsed.portfolioUrl,
        availability: parsed.availability,
        status: 'pending',
      },
    });

    return NextResponse.json({ profile: serializeAdminTalentProfile(profile) });
  } catch {
    return apiServerError();
  }
}
