import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashPassword, createSessionToken, getCookieName, sessionCookieOptions } from '@/app/lib/auth';
import { syncAdminRole } from '@/app/lib/admin';
import { apiError, apiServerError } from '@/app/lib/api-security';
import { createAndSendEmailVerification } from '@/app/lib/email-verification';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !EMAIL_RE.test(email)) {
      return apiError('Email invalide', 400);
    }
    if (password.length < 8) {
      return apiError('Le mot de passe doit contenir au moins 8 caractères', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.emailVerified) {
        return apiError(
          'Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.',
          409,
        );
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash },
      });

      await syncAdminRole(user.id, email);
      const { sent } = await createAndSendEmailVerification(user.id, email, request);

      const token = await createSessionToken(user.id);
      const res = NextResponse.json(
        {
          id: user.id,
          email: user.email,
          emailVerified: false,
          verificationEmailSent: sent,
          resumed: true,
        },
        { status: 201 },
      );
      res.cookies.set(getCookieName(), token, sessionCookieOptions());
      return res;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, emailVerified: false },
    });

    await syncAdminRole(user.id, email);
    const { sent } = await createAndSendEmailVerification(user.id, email, request);

    const token = await createSessionToken(user.id);
    const res = NextResponse.json(
      {
        id: user.id,
        email: user.email,
        emailVerified: false,
        verificationEmailSent: sent,
      },
      { status: 201 },
    );
    res.cookies.set(getCookieName(), token, sessionCookieOptions());
    return res;
  } catch {
    return apiServerError();
  }
}
