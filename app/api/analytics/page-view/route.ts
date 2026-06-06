import { NextResponse } from 'next/server';
import { isPublicPagePath, recordPageVisit } from '@/app/lib/page-analytics';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = typeof body.path === 'string' ? body.path.split('?')[0] : '';
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
