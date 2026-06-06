import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyPassword, createSessionToken, getCookieName, sessionCookieOptions } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    });
    res.cookies.set(getCookieName(), token, sessionCookieOptions());
    return res;
  } catch (err: unknown) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
