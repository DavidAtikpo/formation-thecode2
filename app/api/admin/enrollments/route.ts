import { NextResponse } from 'next/server';
import type { EnrollmentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiForbidden } from '@/app/lib/api-security';
import { serializeAdminEnrollment } from '@/app/lib/admin-enrollment';

const VALID_STATUSES: EnrollmentStatus[] = ['pending_payment', 'active', 'paid', 'cancelled'];

export async function GET(request: Request) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const params = new URL(request.url).searchParams;
  const status = params.get('status') as EnrollmentStatus | null;
  const skillProfile = params.get('skillProfile');

  const where: Prisma.EnrollmentWhereInput = {};

  if (status && VALID_STATUSES.includes(status)) {
    where.status = status;
  }

  if (skillProfile === 'incomplete') {
    where.skillProfileCompletedAt = null;
  } else if (skillProfile === 'complete') {
    where.skillProfileCompletedAt = { not: null };
  } else if (skillProfile === 'beginner') {
    where.skillLevel = 'beginner';
  } else if (skillProfile === 'experienced') {
    where.skillLevel = 'experienced';
  }

  const enrollments = await prisma.enrollment.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, emailVerified: true, createdAt: true } },
    },
  });

  return NextResponse.json({
    enrollments: enrollments.map(serializeAdminEnrollment),
  });
}
