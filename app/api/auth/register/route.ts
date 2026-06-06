import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashPassword, createSessionToken, getCookieName, sessionCookieOptions } from '@/app/lib/auth';
import { createAndSendEmailVerification } from '@/app/lib/email-verification';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, emailVerified: false },
    });

    const { verifyUrl, sent } = await createAndSendEmailVerification(user.id, email, request);

    const token = await createSessionToken(user.id);
    const payload: {
      id: string;
      email: string;
      emailVerified: boolean;
      verificationEmailSent: boolean;
      devLink?: string;
    } = {
      id: user.id,
      email: user.email,
      emailVerified: false,
      verificationEmailSent: sent,
    };

    if (process.env.NODE_ENV === 'development' && !sent) {
      payload.devLink = verifyUrl;
    }

    const res = NextResponse.json(payload, { status: 201 });
    res.cookies.set(getCookieName(), token, sessionCookieOptions());
    return res;
  } catch (err: unknown) {
    console.error('[auth/register]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
