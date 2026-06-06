import { NextResponse } from 'next/server';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiForbidden } from '@/app/lib/api-security';
import { findReceiptWithEnrollment } from '@/app/lib/payment-receipt-db';
import { receiptToDownloadHtml } from '@/app/lib/payment-receipt';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  const { id } = await context.params;
  const receipt = await findReceiptWithEnrollment(id);

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
