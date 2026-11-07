import { NextResponse } from 'next/server';
import { apiError, apiServerError } from '@/app/lib/api-security';
import {
  addRealisationComment,
  getRealisationCards,
  getVisitorId,
  toggleRealisationLike,
} from '@/app/lib/realisation-reactions';

export const dynamic = 'force-dynamic';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET() {
  try {
    const visitorId = await getVisitorId();
    const items = await getRealisationCards(visitorId);
    return json({ items });
  } catch {
    return apiServerError();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const action = body.action;

    if (action === 'like') {
      const visitorId = await getVisitorId();
      const result = await toggleRealisationLike(id, visitorId);
      if (!result) return apiError('Réalisation inconnue', 404);
      return json(result);
    }

    if (action === 'comment') {
      const authorName = typeof body.authorName === 'string' ? body.authorName : '';
      const message = typeof body.body === 'string' ? body.body : '';
      const result = await addRealisationComment(id, authorName, message);
      if ('error' in result) return apiError(result.error, 400);
      return json(result);
    }

    return apiError('Action inconnue', 400);
  } catch {
    return apiServerError();
  }
}
