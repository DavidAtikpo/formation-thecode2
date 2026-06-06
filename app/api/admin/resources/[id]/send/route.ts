import { NextResponse } from 'next/server';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { serializeResource } from '@/app/lib/learning-resources';
import { deliverResourceToCandidates } from '@/app/lib/resource-delivery';
import { prisma } from '@/app/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;

  try {
    const stats = await deliverResourceToCandidates(id, request);

    if (!stats) {
      return apiError('Contenu introuvable', 404);
    }

    if (stats.matched === 0) {
      return apiError('Aucun participant correspondant', 400);
    }

    const updated = await prisma.learningResource.findUnique({
      where: { id },
      include: { _count: { select: { deliveries: true } } },
    });

    return NextResponse.json({
      resource: updated ? serializeResource(updated) : null,
      stats,
    });
  } catch {
    return apiServerError();
  }
}
