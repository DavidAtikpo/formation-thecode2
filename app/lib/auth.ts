import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

const COOKIE_NAME = 'thecode2_token';

function getSecret() {
  const s = process.env.AUTH_SECRET?.trim();
  if (s) {
    if (process.env.NODE_ENV === 'production' && s.length < 32) {
      throw new Error('AUTH_SECRET trop court (minimum 32 caractères en production)');
    }
    return new TextEncoder().encode(s);
  }
  if (process.env.NODE_ENV === 'development') {
    return new TextEncoder().encode('dev-insecure-thecode2-secret');
  }
  throw new Error('AUTH_SECRET manquant dans .env');
}

export async function hashPassword(password: string) {
  return bcryptHash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcryptCompare(password, hash);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const sub = payload.sub;
  if (!sub || typeof sub !== 'string') return null;
  return sub;
}

async function resolveSessionUserIdFromToken(token: string) {
  try {
    const userId = await verifySessionToken(token);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { blockedAt: true },
    });

    if (!user || user.blockedAt) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const cookieToken = store.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    return resolveSessionUserIdFromToken(cookieToken);
  }

  const h = await headers();
  const auth = h.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const bearer = auth.slice(7).trim();
    if (bearer) {
      return resolveSessionUserIdFromToken(bearer);
    }
  }

  return null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getCookieName() {
  return COOKIE_NAME;
}

export async function getVerifiedSessionUserId(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, blockedAt: true },
  });

  if (!user?.emailVerified || user.blockedAt) return null;
  return userId;
}
