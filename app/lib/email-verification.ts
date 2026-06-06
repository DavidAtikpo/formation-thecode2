import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { sendVerificationEmail } from '@/app/lib/email';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60_000;

export function getResendVerificationStatus(expiresAt: Date | null) {
  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    return { canResend: true, retryAfterSeconds: 0 };
  }

  const sentAt = expiresAt.getTime() - TOKEN_TTL_MS;
  const elapsed = Date.now() - sentAt;

  if (elapsed >= RESEND_COOLDOWN_MS) {
    return { canResend: true, retryAfterSeconds: 0 };
  }

  return {
    canResend: false,
    retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
  };
}

export function generateEmailVerificationToken() {
  return randomBytes(32).toString('hex');
}

export function hashEmailVerificationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getAppBaseUrl(request?: Request) {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  if (request) {
    const host = request.headers.get('host') ?? 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') ?? 'http';
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}

export function buildVerificationUrl(token: string, request?: Request) {
  const base = getAppBaseUrl(request);
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createAndSendEmailVerification(userId: string, email: string, request?: Request) {
  const token = generateEmailVerificationToken();
  const tokenHash = hashEmailVerificationToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const verifyUrl = buildVerificationUrl(token, request);
  const sent = await sendVerificationEmail(email, verifyUrl);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash: tokenHash,
      ...(sent ? { emailVerificationExpiresAt: expiresAt } : {}),
    },
  });

  return { verifyUrl, sent };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashEmailVerificationToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { gt: new Date() },
    },
  });

  if (!user) return null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    },
  });

  return user;
}
