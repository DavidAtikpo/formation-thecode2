import { DOMAINS, DURATIONS, FORMATION_SESSIONS } from '@/app/lib/formation-config';
import { prisma } from '@/app/lib/prisma';

function lastNDays(n: number) {
  const days: { date: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    });
  }
  return days;
}

export async function getAdminDashboardStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setHours(0, 0, 0, 0);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [
    byStatus,
    byDomain,
    byDuration,
    bySession,
    receiptsByPhase,
    receiptsByMethod,
    totalUsers,
    verifiedUsers,
    paidLast30Days,
    newEnrollmentsLast30Days,
    certificatesIssued,
    receiptsCount,
    resourcesPublished,
    resourceDeliveries,
    recentEnrollments,
    registrationPaidCount,
    formationPaidCount,
    skillProfilesCompleted,
    skillProfilesIncomplete,
    skillProfilesBeginner,
    skillProfilesExperienced,
  ] = await Promise.all([
    prisma.enrollment.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.enrollment.groupBy({ by: ['domain'], _count: { _all: true } }),
    prisma.enrollment.groupBy({ by: ['duration'], _count: { _all: true } }),
    prisma.enrollment.groupBy({ by: ['formationSession'], _count: { _all: true } }),
    prisma.paymentReceipt.groupBy({
      by: ['phase'],
      _sum: { amountUsd: true },
      _count: { _all: true },
    }),
    prisma.paymentReceipt.groupBy({
      by: ['paymentMethod'],
      _sum: { amountUsd: true },
      _count: { _all: true },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.enrollment.count({
      where: { status: 'paid', paidAt: { gte: thirtyDaysAgo } },
    }),
    prisma.enrollment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.enrollment.count({ where: { certificateIssuedAt: { not: null } } }),
    prisma.paymentReceipt.count(),
    prisma.learningResource.count({ where: { published: true } }),
    prisma.resourceDelivery.count(),
    prisma.enrollment.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.enrollment.count({ where: { registrationPaidAt: { not: null } } }),
    prisma.enrollment.count({ where: { formationPaidAt: { not: null } } }),
    prisma.enrollment.count({ where: { skillProfileCompletedAt: { not: null } } }),
    prisma.enrollment.count({ where: { skillProfileCompletedAt: null } }),
    prisma.enrollment.count({ where: { skillLevel: 'beginner' } }),
    prisma.enrollment.count({ where: { skillLevel: 'experienced' } }),
  ]);

  const statusCounts = {
    pending_payment: 0,
    active: 0,
    paid: 0,
    cancelled: 0,
  };
  for (const row of byStatus) {
    if (row.status in statusCounts) {
      statusCounts[row.status as keyof typeof statusCounts] = row._count._all;
    }
  }

  const totalEnrollments = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const activeCandidates = statusCounts.active + statusCounts.paid;

  const revenueRegistration =
    receiptsByPhase.find((r) => r.phase === 'registration')?._sum.amountUsd ?? 0;
  const revenueFormation =
    receiptsByPhase.find((r) => r.phase === 'formation')?._sum.amountUsd ?? 0;

  const dayBuckets = lastNDays(14);
  const enrollmentsByDay = dayBuckets.map((day) => ({
    ...day,
    count: recentEnrollments.filter((e) => e.createdAt.toISOString().startsWith(day.date)).length,
  }));

  return {
    overview: {
      totalUsers,
      verifiedUsers,
      totalEnrollments,
      activeCandidates,
      paidComplete: statusCounts.paid,
      pendingRegistration: statusCounts.pending_payment,
      awaitingFormation: statusCounts.active,
      cancelled: statusCounts.cancelled,
      paidLast30Days,
      newEnrollmentsLast30Days,
      registrationPaidCount,
      formationPaidCount,
      certificatesIssued,
      receiptsCount,
      resourcesPublished,
      resourceDeliveries,
      skillProfilesCompleted,
      skillProfilesIncomplete,
      skillProfilesBeginner,
      skillProfilesExperienced,
    },
    revenue: {
      registrationUsd: revenueRegistration,
      formationUsd: revenueFormation,
      totalUsd: revenueRegistration + revenueFormation,
    },
    byStatus: Object.entries(statusCounts).map(([id, count]) => ({
      id,
      label:
        id === 'pending_payment'
          ? 'En attente inscription'
          : id === 'active'
            ? 'Formation due'
            : id === 'paid'
              ? 'Complet'
              : 'Annulée',
      count,
    })),
    byDomain: DOMAINS.map((d) => ({
      id: d.id,
      label: d.label,
      count: byDomain.find((r) => r.domain === d.id)?._count._all ?? 0,
    })),
    byDuration: DURATIONS.map((d) => ({
      id: d.id,
      label: d.label,
      count: byDuration.find((r) => r.duration === d.id)?._count._all ?? 0,
    })),
    bySession: FORMATION_SESSIONS.map((s) => ({
      id: s.id,
      label: s.label,
      period: s.period,
      count: bySession.find((r) => r.formationSession === s.id)?._count._all ?? 0,
    })),
    byPaymentMethod: receiptsByMethod.map((r) => ({
      id: r.paymentMethod,
      label:
        r.paymentMethod === 'stripe'
          ? 'Stripe'
          : r.paymentMethod === 'fedapay'
            ? 'FedaPay'
            : 'Crypto',
      count: r._count._all,
      amountUsd: r._sum.amountUsd ?? 0,
    })),
    enrollmentsByDay,
    generatedAt: new Date().toISOString(),
  };
}
