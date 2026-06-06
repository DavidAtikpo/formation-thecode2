import { NextResponse } from 'next/server';
import { createSessionToken, getCookieName, sessionCookieOptions } from '@/app/lib/auth';
import { verifyEmailToken } from '@/app/lib/email-verification';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim();
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${base}/compte/verifier-email?error=token`);
  }

  try {
    const user = await verifyEmailToken(token);
    if (!user) {
      return NextResponse.redirect(`${base}/compte/verifier-email?error=expired`);
    }

    const sessionToken = await createSessionToken(user.id);
    const res = NextResponse.redirect(`${base}/inscription?verified=1`);
    res.cookies.set(getCookieName(), sessionToken, sessionCookieOptions());
    return res;
  } catch (err: unknown) {
    console.error('[auth/verify-email]', err);
    return NextResponse.redirect(`${base}/compte/verifier-email?error=server`);
  }
}
