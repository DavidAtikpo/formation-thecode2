import { NextResponse } from 'next/server';
import { getAdminSessionUserId } from '@/app/lib/admin';
import {
  apiError,
  apiForbidden,
  apiServerError,
  isAllowedCourseAssetUrl,
  isCourseAssetPublicId,
} from '@/app/lib/api-security';
import { prisma } from '@/app/lib/prisma';
import { serializeResource, validateResourcePayload } from '@/app/lib/learning-resources';
import { deliverResourceToCandidates } from '@/app/lib/resource-delivery';

export async function GET() {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const resources = await prisma.learningResource.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { deliveries: true } } },
  });

  return NextResponse.json({
    resources: resources.map(serializeResource),
  });
}

export async function POST(request: Request) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  try {
    const body = await request.json();
    const parsed = validateResourcePayload(body);
    if (!parsed.ok) {
      return apiError(parsed.error, 400);
    }

    const { title, description, type, fileUrl, filePublicId, externalUrl, audience } = parsed.data;

    if (filePublicId && !isCourseAssetPublicId(filePublicId)) {
      return apiError('Fichier invalide', 400);
    }
    if (fileUrl && !isAllowedCourseAssetUrl(fileUrl)) {
      return apiError('URL de fichier invalide', 400);
    }

    const resource = await prisma.learningResource.create({
      data: {
        title,
        description,
        type,
        fileUrl,
        filePublicId,
        externalUrl,
        domain: audience.domain,
        formationSession: audience.formationSession,
        duration: audience.duration,
      },
      include: { _count: { select: { deliveries: true } } },
    });

    const deliveryStats = await deliverResourceToCandidates(resource.id, request).catch(() => null);

    return NextResponse.json(
      {
        resource: serializeResource(resource),
        delivery: deliveryStats,
      },
      { status: 201 },
    );
  } catch {
    return apiServerError();
  }
}
