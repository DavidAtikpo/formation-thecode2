import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { serializePublicTalentProfile } from '@/app/lib/ecosystem-public';
import type { TalentCategory } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const where: {
    status: 'published';
    category?: TalentCategory;
  } = { status: 'published' };

  if (
    category === 'developer' ||
    category === 'designer' ||
    category === 'content' ||
    category === 'seo' ||
    category === 'other'
  ) {
    where.category = category;
  }

  const profiles = await prisma.talentProfile.findMany({
    where,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  });

  return NextResponse.json({
    profiles: profiles.map(serializePublicTalentProfile),
  });
}
