import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAnalyticsConsentFromRequest } from '@/app/lib/cookie-consent';
import { isPublicPagePath, normalizePagePath } from '@/app/lib/page-analytics-public';
import { recordPageVisit } from '@/app/lib/page-analytics';

export async function proxy(request: NextRequest) {
  const path = normalizePagePath(request.nextUrl.pathname);

  if (
    request.method === 'GET' &&
    isPublicPagePath(path) &&
    hasAnalyticsConsentFromRequest(request)
  ) {
    void recordPageVisit({
      path,
      headers: request.headers,
      referrer: request.headers.get('referer'),
    }).catch(() => {});
  }

  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://chatagentcides.qrthecode2.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );

  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
