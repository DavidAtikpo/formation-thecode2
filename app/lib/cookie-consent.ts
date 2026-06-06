import type { NextRequest } from 'next/server';
import { ANALYTICS_CONSENT_COOKIE } from '@/app/lib/cookie-consent-public';

export function hasAnalyticsConsentFromRequest(request: NextRequest | Request) {
  if (!('cookies' in request) || typeof request.cookies?.get !== 'function') {
    const cookieHeader = request.headers.get('cookie') ?? '';
    return cookieHeader.includes(`${ANALYTICS_CONSENT_COOKIE}=1`);
  }
  return request.cookies.get(ANALYTICS_CONSENT_COOKIE)?.value === '1';
}
