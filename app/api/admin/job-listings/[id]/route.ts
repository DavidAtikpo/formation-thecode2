import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { parseJobListingBody } from '@/app/lib/ecosystem-public';
import { serializeAdminJobListing } from '@/app/lib/ecosystem-admin';
import type { PublicationStatus } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) return apiForbidden();

  const { id } = await context.params;

  try {
    const existing = await prisma.jobListing.findUnique({ where: { id } });
    if (!existing) return apiError('Offre introuvable', 404);

    const body = await request.json();
    const parsed = parseJobListingBody({
      title: body.title ?? existing.title,
      company: body.company ?? existing.company,
      description: body.description ?? existing.description,
      category: body.category ?? existing.category,
      location: body.location ?? existing.location,
      remote: body.remote ?? existing.remote,
      contractType: body.contractType ?? existing.contractType,
      expiresAt: body.expiresAt ?? existing.expiresAt?.toISOString() ?? null,
    });
    if ('error' in parsed) return apiError(parsed.error, 400);

    let status = existing.status;
    if (body.status === 'pending' || body.status === 'published' || body.status === 'archived') {
      status = body.status as PublicationStatus;
    }

    let publishedAt = existing.publishedAt;
    if (status === 'published' && existing.status !== 'published') {
      publishedAt = new Date();
    }

    const listing = await prisma.jobListing.update({
      where: { id },
      data: {
        title: parsed.title,
        company: parsed.company,
        description: parsed.description,
        category: parsed.category,
        location: parsed.location,
        remote: parsed.remote,
        contractType: parsed.contractType,
        expiresAt: parsed.expiresAt,
        status,
        publishedAt,
      },
    });

    return NextResponse.json({ listing: serializeAdminJobListing(listing) });
  } catch {
    return apiServerError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) return apiForbidden();

  const { id } = await context.params;

  try {
    await prisma.jobListing.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return apiError('Offre introuvable', 404);
  }
}
