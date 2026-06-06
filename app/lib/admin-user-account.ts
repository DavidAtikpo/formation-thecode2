import type { User } from '@prisma/client';
import { isAdminUser } from '@/app/lib/admin';
import { prisma } from '@/app/lib/prisma';

type ManageableUserFailure = {
  ok: false;
  error: string;
  status: 400 | 403 | 404;
};

type ManageableUserSuccess = {
  ok: true;
  user: { id: string; email: string; role: User['role']; blockedAt: Date | null };
};

export type ManageableUserResult = ManageableUserFailure | ManageableUserSuccess;

export async function getManageableUserForAdmin(
  adminId: string,
  targetUserId: string,
): Promise<ManageableUserResult> {
  if (adminId === targetUserId) {
    return { ok: false, error: 'Action impossible sur votre propre compte', status: 400 };
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true, blockedAt: true },
  });

  if (!user) {
    return { ok: false, error: 'Compte introuvable', status: 404 };
  }

  if (isAdminUser(user)) {
    return { ok: false, error: 'Impossible de modifier un compte administrateur', status: 403 };
  }

  return { ok: true, user };
}

export function serializeAdminUser(user: Pick<User, 'id' | 'email' | 'role' | 'emailVerified' | 'createdAt' | 'blockedAt'>) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    blockedAt: user.blockedAt?.toISOString() ?? null,
    isBlocked: Boolean(user.blockedAt),
  };
}
