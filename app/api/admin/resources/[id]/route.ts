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

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.learningResource.findUnique({ where: { id } });
    if (!existing) {
      return apiError('Contenu introuvable', 404);
    }

    const body = await request.json();
    const parsed = validateResourcePayload({ ...existing, ...body });
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

    const resource = await prisma.learningResource.update({
      where: { id },
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

    return NextResponse.json({ resource: serializeResource(resource) });
  } catch {
    return apiServerError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;

  try {
    await prisma.learningResource.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return apiError('Contenu introuvable', 404);
  }
}
