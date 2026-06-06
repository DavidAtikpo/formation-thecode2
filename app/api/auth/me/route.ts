import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionUserId } from '@/app/lib/auth';
import { isAdminUser } from '@/app/lib/admin';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(null);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      enrollments: {
        where: { status: 'paid' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          domain: true,
          duration: true,
          status: true,
          paidAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(null);
  }

  return NextResponse.json({ ...user, isAdmin: isAdminUser(user) });
}
