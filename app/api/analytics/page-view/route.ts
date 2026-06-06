import { NextResponse } from 'next/server';
import { hasAnalyticsConsentFromRequest } from '@/app/lib/cookie-consent';
import {
  isPublicPagePath,
  normalizePagePath,
  recordPageVisit,
} from '@/app/lib/page-analytics';

export async function POST(request: Request) {
  if (!hasAnalyticsConsentFromRequest(request)) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  try {
    const body = await request.json();
    const path = typeof body.path === 'string' ? normalizePagePath(body.path) : '';
    const referrer = typeof body.referrer === 'string' ? body.referrer : null;

    if (!isPublicPagePath(path)) {
      return NextResponse.json({ ok: true, tracked: false });
    }

    const tracked = await recordPageVisit({
      path,
      headers: request.headers,
      referrer,
    });

    return NextResponse.json({ ok: true, tracked });
  } catch {
    return NextResponse.json({ ok: true, tracked: false });
  }
}
