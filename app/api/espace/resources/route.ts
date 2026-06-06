import { NextResponse } from 'next/server';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiForbidden } from '@/app/lib/api-security';
import { labelResourceType } from '@/app/lib/learning-resources';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, status: { in: ['active', 'paid'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (!enrollment) {
    return NextResponse.json({ resources: [] });
  }

  const deliveries = await prisma.resourceDelivery.findMany({
    where: { enrollmentId: enrollment.id },
    orderBy: { deliveredAt: 'desc' },
    include: { resource: true },
  });

  return NextResponse.json({
    resources: deliveries.map((delivery) => ({
      id: delivery.resource.id,
      deliveryId: delivery.id,
      title: delivery.resource.title,
      description: delivery.resource.description,
      type: delivery.resource.type,
      typeLabel: labelResourceType(delivery.resource.type),
      fileUrl: delivery.resource.fileUrl,
      externalUrl: delivery.resource.externalUrl,
      deliveredAt: delivery.deliveredAt.toISOString(),
    })),
  });
}
