import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { createAndSendEmailVerification } from '@/app/lib/email-verification';

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: 'Email déjà vérifié' }, { status: 400 });
  }

  try {
    const { verifyUrl, sent } = await createAndSendEmailVerification(userId, user.email, request);
    const payload: { ok: boolean; sent: boolean; message: string; devLink?: string } = {
      ok: true,
      sent,
      message: sent
        ? 'Un nouvel email de vérification a été envoyé.'
        : 'Email non envoyé (service non configuré). Utilisez le lien ci-dessous en développement.',
    };

    if (process.env.NODE_ENV === 'development' && !sent) {
      payload.devLink = verifyUrl;
    }

    return NextResponse.json(payload);
  } catch (err: unknown) {
    console.error('[auth/resend-verification]', err);
    return NextResponse.json({ error: 'Impossible d\'envoyer l\'email' }, { status: 502 });
  }
}
