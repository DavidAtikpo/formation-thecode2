import { NextResponse } from 'next/server';
import type { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden } from '@/app/lib/api-security';

const VALID_STATUSES: EnrollmentStatus[] = ['pending_payment', 'paid', 'cancelled'];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, emailVerified: true, createdAt: true } },
    },
  });

  if (!enrollment) {
    return apiError('Inscription introuvable', 404);
  }

  return NextResponse.json({ enrollment });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const body = await request.json();
  const status = body.status as EnrollmentStatus | undefined;

  if (!status || !VALID_STATUSES.includes(status)) {
    return apiError('Statut invalide', 400);
  }

  const existing = await prisma.enrollment.findUnique({ where: { id } });
  if (!existing) {
    return apiError('Inscription introuvable', 404);
  }

  const enrollment = await prisma.enrollment.update({
    where: { id },
    data: {
      status,
      paidAt: status === 'paid' ? existing.paidAt ?? new Date() : status === 'pending_payment' ? null : existing.paidAt,
    },
    include: {
      user: { select: { id: true, email: true, emailVerified: true, createdAt: true } },
    },
  });

  return NextResponse.json({ enrollment });
}
