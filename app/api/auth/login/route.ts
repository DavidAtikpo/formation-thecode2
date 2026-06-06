import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyPassword, createSessionToken, getCookieName, sessionCookieOptions } from '@/app/lib/auth';
import { isAdminUser, syncAdminRole } from '@/app/lib/admin';
import { apiError, apiServerError } from '@/app/lib/api-security';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return apiError('Email et mot de passe requis', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiError('Email ou mot de passe incorrect', 401);
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return apiError('Email ou mot de passe incorrect', 401);
    }

    await syncAdminRole(user.id, user.email);
    const current = await prisma.user.findUnique({ where: { id: user.id } }) ?? user;

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({
      id: current.id,
      email: current.email,
      emailVerified: current.emailVerified,
      isAdmin: isAdminUser(current),
    });
    res.cookies.set(getCookieName(), token, sessionCookieOptions());
    return res;
  } catch {
    return apiServerError();
  }
}
