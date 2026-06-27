import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { parseJobListingBody } from '@/app/lib/ecosystem-public';
import { serializeAdminJobListing } from '@/app/lib/ecosystem-admin';

export async function GET() {
  const adminId = await getAdminSessionUserId();
  if (!adminId) return apiForbidden();

  try {
    const listings = await prisma.jobListing.findMany({
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
    return NextResponse.json({
      listings: listings.map(serializeAdminJobListing),
    });
  } catch {
    return apiServerError();
  }
}

export async function POST(request: Request) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) return apiForbidden();

  try {
    const body = await request.json();
    const parsed = parseJobListingBody(body);
    if ('error' in parsed) return apiError(parsed.error, 400);

    const listing = await prisma.jobListing.create({
      data: {
        title: parsed.title,
        company: parsed.company,
        description: parsed.description,
        category: parsed.category,
        location: parsed.location,
        remote: parsed.remote,
        contractType: parsed.contractType,
        expiresAt: parsed.expiresAt,
        status: 'pending',
      },
    });

    return NextResponse.json({ listing: serializeAdminJobListing(listing) });
  } catch {
    return apiServerError();
  }
}
