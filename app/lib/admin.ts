import { prisma } from '@/app/lib/prisma';
import { getSessionUserId } from '@/app/lib/auth';
import type { UserRole } from '@prisma/client';

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function isAdminUser(user: { role: UserRole; email: string }) {
  return user.role === 'admin' || isAdminEmail(user.email);
}

export async function syncAdminRole(userId: string, email: string) {
  if (!isAdminEmail(email)) return;
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'admin' },
  });
}

export async function getAdminSessionUserId(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, emailVerified: true },
  });

  if (!user || !user.emailVerified || !isAdminUser(user)) return null;
  return user.id;
}
