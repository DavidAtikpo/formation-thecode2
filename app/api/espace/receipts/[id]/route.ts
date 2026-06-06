import { NextResponse } from 'next/server';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiForbidden } from '@/app/lib/api-security';
import { getReceiptForUser, receiptToDownloadHtml } from '@/app/lib/payment-receipt';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const receipt = await getReceiptForUser(id, userId);

  if (!receipt) {
    return NextResponse.json({ error: 'Reçu introuvable' }, { status: 404 });
  }

  const html = await receiptToDownloadHtml(receipt);
  const filename = `recu-${receipt.receiptNumber}.html`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
