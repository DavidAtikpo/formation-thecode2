import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiForbidden } from '@/app/lib/api-security';

export async function GET() {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const [byStatus, totalUsers, recentPaid] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.user.count(),
    prisma.enrollment.count({
      where: {
        status: 'paid',
        paidAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const counts = {
    pending_payment: 0,
    paid: 0,
    cancelled: 0,
  };
  for (const row of byStatus) {
    counts[row.status] = row._count._all;
  }

  return NextResponse.json({
    enrollments: counts,
    totalEnrollments: counts.pending_payment + counts.paid + counts.cancelled,
    totalUsers,
    paidLast30Days: recentPaid,
  });
}
