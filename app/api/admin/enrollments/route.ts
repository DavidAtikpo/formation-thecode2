import { NextResponse } from 'next/server';
import type { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiForbidden } from '@/app/lib/api-security';

const VALID_STATUSES: EnrollmentStatus[] = ['pending_payment', 'paid', 'cancelled'];

export async function GET(request: Request) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const status = new URL(request.url).searchParams.get('status') as EnrollmentStatus | null;
  const where = status && VALID_STATUSES.includes(status) ? { status } : undefined;

  const enrollments = await prisma.enrollment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, emailVerified: true, createdAt: true } },
    },
  });

  return NextResponse.json({ enrollments });
}
