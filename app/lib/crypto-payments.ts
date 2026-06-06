import { createHmac } from 'crypto';

const API_BASE = 'https://api.nowpayments.io/v1';

const PAID_STATUSES = new Set(['finished', 'confirmed', 'sending']);

type NowPaymentsPayment = {
  payment_status?: string;
  order_id?: string;
};

type NowPaymentsInvoice = {
  id?: number | string;
  invoice_url?: string;
  order_id?: string;
};

function getApiKey(): string | null {
  return process.env.NOWPAYMENTS_API_KEY?.trim() || null;
}

/** Clé publique dashboard — conservée pour usage futur (widget). Non utilisée côté serveur. */
export function getCryptoPublicKey(): string | null {
  return process.env.NOWPAYMENTS_PUBLIC_KEY?.trim() || null;
}

export function isCryptoConfigured(): boolean {
  return Boolean(getApiKey());
}

export function isCryptoWebhookConfigured(): boolean {
  return Boolean(process.env.NOWPAYMENTS_IPN_SECRET?.trim());
}

async function nowPaymentsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NOWPayments non configuré');

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : `Erreur NOWPayments (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function createCryptoInvoice(params: {
  priceAmount: number;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const invoice = await nowPaymentsFetch<NowPaymentsInvoice>('/invoice', {
    method: 'POST',
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: 'usd',
      order_id: params.orderId,
      order_description: params.orderDescription,
      ipn_callback_url: params.ipnCallbackUrl,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      is_fixed_rate: true,
    }),
  });

  const invoiceUrl = typeof invoice.invoice_url === 'string' ? invoice.invoice_url : null;
  const invoiceId = invoice.id != null ? String(invoice.id) : null;

  if (!invoiceUrl || !invoiceId) {
    throw new Error('Facture crypto invalide');
  }

  return { url: invoiceUrl, invoiceId };
}

export async function isCryptoOrderPaid(orderId: string): Promise<boolean> {
  try {
    const result = await nowPaymentsFetch<{ data?: NowPaymentsPayment[] }>(
      `/payment/?order_id=${encodeURIComponent(orderId)}`,
    );
    const payments = Array.isArray(result.data) ? result.data : [];
    return payments.some((payment) =>
      PAID_STATUSES.has((payment.payment_status ?? '').toLowerCase()),
    );
  } catch {
    return false;
  }
}

export function verifyCryptoWebhookSignature(
  payload: Record<string, unknown>,
  signature: string,
): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
  if (!secret || !signature) return false;

  const sorted = JSON.stringify(payload, Object.keys(payload).sort());
  const expected = createHmac('sha512', secret).update(sorted).digest('hex');
  return expected === signature;
}

export function isCryptoWebhookPaid(payload: Record<string, unknown>): boolean {
  const status = String(payload.payment_status ?? payload.status ?? '').toLowerCase();
  return PAID_STATUSES.has(status);
}
