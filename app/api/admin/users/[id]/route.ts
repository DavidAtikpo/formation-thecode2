import { NextResponse } from 'next/server';
import { getAdminSessionUserId } from '@/app/lib/admin';
import {
  getManageableUserForAdmin,
  serializeAdminUser,
} from '@/app/lib/admin-user-account';
import { apiError, apiForbidden } from '@/app/lib/api-security';
import { prisma } from '@/app/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const body = await request.json();
  const blocked = body.blocked;

  if (typeof blocked !== 'boolean') {
    return apiError('Paramètre blocked requis (true ou false)', 400);
  }

  const check = await getManageableUserForAdmin(adminId, id);
  if (!check.ok) {
    return apiError(check.error, check.status);
  }

  const targetUserId = check.user.id;

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { blockedAt: blocked ? new Date() : null },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      blockedAt: true,
    },
  });

  return NextResponse.json({ user: serializeAdminUser(user) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) {
    return apiForbidden();
  }

  const { id } = await context.params;

  const check = await getManageableUserForAdmin(adminId, id);
  if (!check.ok) {
    return apiError(check.error, check.status);
  }

  await prisma.user.delete({ where: { id: check.user.id } });

  return NextResponse.json({ ok: true });
}
