import { readFileSync } from 'fs';
import { join } from 'path';
import type { PaymentPhase } from '@/app/lib/enrollment-payments';
import {
  getInstallmentPaymentFields,
  getPhaseAmountUsd,
  getPhasePaidAt,
  installmentNumberFromPhase,
  INSTALLMENT_LABELS,
} from '@/app/lib/installment-payments';
import {
  createPaymentReceipt,
  findEnrollmentForReceipt,
  findReceiptByEnrollmentPhase,
  findReceiptForUser,
  findReceiptWithEnrollment,
  markReceiptEmailSent,
  type PaymentReceiptWithEnrollment,
  type ReceiptEnrollmentRow,
  type ReceiptPaymentMethod,
} from '@/app/lib/payment-receipt-db';
import { sendPaymentReceiptEmail } from '@/app/lib/email';
import { getAppBaseUrl } from '@/app/lib/email-verification';
import { getStripeCardLast4 } from '@/app/lib/stripe';
import {
  formatUsd,
  getDomain,
  getDuration,
  getFormationSession,
  usdToXof,
  type DomainId,
  type DurationId,
  type SessionId,
} from '@/app/lib/formation-config';

const PHASE_LABELS: Record<PaymentPhase, string> = {
  registration: "Frais d'inscription",
  formation: 'Frais de formation',
  installment_1: INSTALLMENT_LABELS.installment_1,
  installment_2: INSTALLMENT_LABELS.installment_2,
  installment_3: INSTALLMENT_LABELS.installment_3,
};

const METHOD_LABELS: Record<ReceiptPaymentMethod, string> = {
  stripe: 'Stripe (carte bancaire)',
  fedapay: 'FedaPay (Mobile Money / FCFA)',
  crypto: 'Crypto (NOWPayments)',
};

const COMPANY = {
  name: 'The Code²',
  tagline: 'Formation pratique en technologies numériques',
  phone: '+228 92 59 12 28',
  phoneRaw: '+22892591228',
  address: 'Aného — Togo',
  email: 'thecode2@qrthecode2.com',
  brand: '#241bff',
  brandDark: '#1d15cc',
  brandLight: '#7d75ff',
} as const;

/** Dent de scie en haut du reçu (effet ticket déchirable) */
const SAWTOOTH_TOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16" preserveAspectRatio="none">
  <path d="M0 16 L12 0 L24 16 Z" fill="#ffffff"/>
</svg>`;

let cachedLogoDataUri: string | null = null;

function getReceiptLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;

  try {
    const logoPath = join(process.cwd(), 'public', 'logo.png');
    const buffer = readFileSync(logoPath);
    cachedLogoDataUri = `data:image/png;base64,${buffer.toString('base64')}`;
    return cachedLogoDataUri;
  } catch {
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl();
    return `${base.replace(/\/$/, '')}/logo.png`;
  }
}

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TC2-${year}-${suffix}`;
}

function getPaymentReference(enrollment: ReceiptEnrollmentRow, phase: PaymentPhase): string | null {
  const installment = installmentNumberFromPhase(phase);
  if (installment) {
    const fields = getInstallmentPaymentFields(installment);
    return (
      enrollment[fields.stripeSessionId] ??
      enrollment[fields.fedapayTransactionId] ??
      enrollment[fields.cryptoInvoiceId] ??
      null
    );
  }
  if (phase === 'registration') {
    return (
      enrollment.stripeSessionId ??
      enrollment.fedapayTransactionId ??
      enrollment.cryptoInvoiceId ??
      null
    );
  }
  return (
    enrollment.formationStripeSessionId ??
    enrollment.formationFedapayTransactionId ??
    enrollment.formationCryptoInvoiceId ??
    null
  );
}

function getPaymentMethod(
  enrollment: ReceiptEnrollmentRow,
  phase: PaymentPhase,
): ReceiptPaymentMethod | null {
  const installment = installmentNumberFromPhase(phase);
  if (installment) {
    const fields = getInstallmentPaymentFields(installment);
    return enrollment[fields.paymentMethod];
  }
  return phase === 'registration' ? enrollment.paymentMethod : enrollment.formationPaymentMethod;
}

const PHONE_COUNTRY_CODES = ['228', '229', '225', '221', '223', '226', '227', '233', '234', '237', '241', '33'];

function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return `···· ${digits}`;

  const last4 = digits.slice(-4);
  const before = digits.slice(0, -4);
  const lastFormatted = `${last4.slice(0, 2)} ${last4.slice(2)}`;

  for (const code of PHONE_COUNTRY_CODES) {
    if (!before.startsWith(code)) continue;
    const hidden = before.slice(code.length);
    const mask = hidden.length > 0 ? ' ····' : '';
    return `+${code}${mask} ${lastFormatted}`;
  }

  return `···· ···· ${lastFormatted}`;
}

async function resolvePaymentDisplayDetails(
  enrollment: ReceiptEnrollmentRow,
  phase: PaymentPhase,
  paymentMethod: ReceiptPaymentMethod,
) {
  if (paymentMethod === 'fedapay' && enrollment.phone.trim()) {
    return { payerPhone: maskPhoneNumber(enrollment.phone.trim()), cardLast4: null as string | null };
  }

  if (paymentMethod === 'stripe') {
    const installment = installmentNumberFromPhase(phase);
    let sessionId: string | null = null;
    if (installment) {
      const fields = getInstallmentPaymentFields(installment);
      sessionId = enrollment[fields.stripeSessionId];
    } else {
      sessionId =
        phase === 'registration'
          ? enrollment.stripeSessionId
          : enrollment.formationStripeSessionId;
    }
    const cardLast4 = sessionId ? await getStripeCardLast4(sessionId) : null;
    return { payerPhone: null as string | null, cardLast4 };
  }

  return { payerPhone: null as string | null, cardLast4: null as string | null };
}

export function buildReceiptHtml(params: {
  receiptNumber: string;
  phase: PaymentPhase;
  firstName: string;
  lastName: string;
  email: string;
  domain: string;
  duration: string;
  session: string;
  amountUsd: number;
  amountXof: number;
  paymentMethod: ReceiptPaymentMethod;
  reference: string | null;
  paidAt: Date;
  payerPhone?: string | null;
  cardLast4?: string | null;
}) {
  const paidLabel = params.paidAt.toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const amountUsdLabel = `${formatUsd(params.amountUsd)} $ USD`;
  const amountXofLabel = `${params.amountXof.toLocaleString('fr-FR')} FCFA`;
  const logoSrc = getReceiptLogoDataUri();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Reçu ${params.receiptNumber} — ${COMPANY.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #eef1f8;
      color: #1e293b;
      padding: 32px 16px 48px;
      line-height: 1.5;
    }
    .receipt-wrap {
      max-width: 720px;
      margin: 0 auto;
      padding-top: 16px;
    }
    .receipt {
      background: #fff;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 8px 32px rgba(36, 27, 255, 0.08), 0 2px 8px rgba(15, 23, 42, 0.06);
      overflow: hidden;
    }
    .sawtooth-top {
      display: block;
      width: 100%;
      height: 16px;
      line-height: 0;
      margin-bottom: -1px;
    }
    .sawtooth-top svg {
      display: block;
      width: 100%;
      height: 16px;
    }
    .header {
      background: linear-gradient(135deg, ${COMPANY.brand} 0%, ${COMPANY.brandDark} 55%, #312e81 100%);
      color: #fff;
      padding: 28px 32px 20px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.35);
      background: #fff;
      flex-shrink: 0;
    }
    .brand-name {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .brand-tagline {
      margin-top: 6px;
      font-size: 12px;
      opacity: 0.85;
      font-weight: 500;
    }
    .company-info {
      text-align: right;
      font-size: 12px;
      line-height: 1.7;
      opacity: 0.95;
    }
    .company-info a { color: #fff; text-decoration: none; }
    .body { padding: 28px 32px 32px; }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f1f5f9;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 700;
      color: ${COMPANY.brand};
      letter-spacing: -0.01em;
    }
    .doc-badge {
      background: #f0efff;
      color: ${COMPANY.brand};
      font-size: 13px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #d4d0ff;
      letter-spacing: 0.02em;
    }
    .columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    @media (max-width: 560px) {
      .columns { grid-template-columns: 1fr; }
      .company-info { text-align: left; }
    }
    .block-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .block-content { font-size: 14px; color: #334155; }
    .block-content strong { color: #0f172a; font-size: 15px; }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .details-table thead th {
      background: #f8fafc;
      color: #64748b;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 10px 14px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }
    .details-table tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
      color: #334155;
    }
    .details-table tbody tr:last-child td { border-bottom: none; }
    .details-table .label { color: #64748b; width: 38%; }
    .total-box {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .total-inner {
      background: linear-gradient(135deg, #f0efff 0%, #faf9ff 100%);
      border: 2px solid ${COMPANY.brandLight};
      border-radius: 10px;
      padding: 18px 24px;
      min-width: 260px;
      text-align: right;
    }
    .total-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      margin-bottom: 4px;
    }
    .total-usd {
      font-size: 26px;
      font-weight: 800;
      color: ${COMPANY.brand};
      letter-spacing: -0.02em;
    }
    .total-xof {
      font-size: 14px;
      color: #64748b;
      margin-top: 2px;
    }
    .paid-stamp {
      display: inline-block;
      margin-top: 28px;
      padding: 6px 18px;
      border: 2px solid #22c55e;
      color: #16a34a;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      border-radius: 6px;
      transform: rotate(-2deg);
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.7;
    }
    .footer strong { color: #64748b; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt-wrap">
  <div class="receipt">
    <div class="sawtooth-top">${SAWTOOTH_TOP_SVG}</div>
    <div class="header">
      <div class="header-top">
        <div class="brand-block">
          <img src="${logoSrc}" alt="${COMPANY.name}" class="brand-logo" />
          <div>
            <div class="brand-name">${COMPANY.name}</div>
            <div class="brand-tagline">${COMPANY.tagline}</div>
          </div>
        </div>
        <div class="company-info">
          <div>${escapeHtml(COMPANY.address)}</div>
          <div>Tél. <a href="tel:${COMPANY.phoneRaw}">${COMPANY.phone}</a></div>
          <div><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></div>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="title-row">
        <div class="doc-title">Reçu de paiement</div>
        <div class="doc-badge">${escapeHtml(params.receiptNumber)}</div>
      </div>

      <div class="columns">
        <div>
          <div class="block-title">Client</div>
          <div class="block-content">
            <strong>${escapeHtml(params.firstName)} ${escapeHtml(params.lastName)}</strong><br/>
            ${escapeHtml(params.email)}
          </div>
        </div>
        <div>
          <div class="block-title">Détails du paiement</div>
          <div class="block-content">
            <strong>${PHASE_LABELS[params.phase]}</strong><br/>
            ${paidLabel}
          </div>
        </div>
      </div>

      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2">Détail de la formation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label">Domaine</td>
            <td>${escapeHtml(params.domain)}</td>
          </tr>
          <tr>
            <td class="label">Durée</td>
            <td>${escapeHtml(params.duration)}</td>
          </tr>
          <tr>
            <td class="label">Session</td>
            <td>${escapeHtml(params.session)}</td>
          </tr>
          <tr>
            <td class="label">Moyen de paiement</td>
            <td>${METHOD_LABELS[params.paymentMethod]}</td>
          </tr>
          ${
            params.payerPhone
              ? `<tr><td class="label">Téléphone Mobile Money</td><td>${escapeHtml(params.payerPhone)}</td></tr>`
              : ''
          }
          ${
            params.cardLast4
              ? `<tr><td class="label">Carte bancaire</td><td>···· ${escapeHtml(params.cardLast4)}</td></tr>`
              : ''
          }
          ${
            params.reference
              ? `<tr><td class="label">Référence transaction</td><td style="font-family:monospace;font-size:13px">${escapeHtml(params.reference)}</td></tr>`
              : ''
          }
        </tbody>
      </table>

      <div class="total-box">
        <div class="total-inner">
          <div class="total-label">Montant payé</div>
          <div class="total-usd">${amountUsdLabel}</div>
          <div class="total-xof">${amountXofLabel}</div>
        </div>
      </div>

      <div style="text-align:center">
        <span class="paid-stamp">Payé</span>
      </div>

      <div class="footer">
        <strong>${COMPANY.name}</strong> — ${escapeHtml(COMPANY.address)}<br/>
        Tél. ${COMPANY.phone} · ${COMPANY.email}<br/>
        Ce document atteste du paiement effectué. Conservez-le pour vos archives.
      </div>
    </div>
  </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function issuePaymentReceipt(enrollmentId: string, phase: PaymentPhase) {
  const existing = await findReceiptByEnrollmentPhase(enrollmentId, phase);

  if (existing) {
    if (!existing.emailSentAt) {
      await sendReceiptEmailForRecord(existing.id);
    }
    return existing;
  }

  const enrollment = await findEnrollmentForReceipt(enrollmentId);
  if (!enrollment) return null;

  const method = getPaymentMethod(enrollment, phase);
  const paidAt = getPhasePaidAt(enrollment, phase);

  if (!method || !paidAt) return null;

  const amountUsd = getPhaseAmountUsd(enrollment, phase);

  if (amountUsd <= 0) return null;

  const receipt = await createPaymentReceipt({
    enrollmentId,
    phase,
    receiptNumber: generateReceiptNumber(),
    amountUsd,
    amountXof: usdToXof(amountUsd),
    paymentMethod: method,
    reference: getPaymentReference(enrollment, phase),
    paidAt,
  });

  await sendReceiptEmailForRecord(receipt.id);
  return receipt;
}

async function sendReceiptEmailForRecord(receiptId: string) {
  const receipt = await findReceiptWithEnrollment(receiptId);
  if (!receipt?.enrollment?.user) return;

  const enrollment = receipt.enrollment;
  const domain = getDomain(enrollment.domain as DomainId).label;
  const duration = getDuration(enrollment.duration as DurationId).label;
  const session = getFormationSession(enrollment.formationSession as SessionId).period;
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl();
  const downloadUrl = `${base.replace(/\/$/, '')}/api/espace/receipts/${receipt.id}`;

  const { payerPhone, cardLast4 } = await resolvePaymentDisplayDetails(
    enrollment,
    receipt.phase,
    receipt.paymentMethod,
  );

  const html = buildReceiptHtml({
    receiptNumber: receipt.receiptNumber,
    phase: receipt.phase,
    firstName: enrollment.firstName,
    lastName: enrollment.lastName,
    email: enrollment.user.email,
    domain,
    duration,
    session,
    amountUsd: receipt.amountUsd,
    amountXof: receipt.amountXof,
    paymentMethod: receipt.paymentMethod,
    reference: receipt.reference,
    paidAt: receipt.paidAt,
    payerPhone,
    cardLast4,
  });

  const sent = await sendPaymentReceiptEmail({
    to: enrollment.user.email,
    receiptNumber: receipt.receiptNumber,
    phaseLabel: PHASE_LABELS[receipt.phase as PaymentPhase],
    amountUsd: receipt.amountUsd,
    downloadUrl,
    receiptHtml: html,
  });

  if (sent) {
    await markReceiptEmailSent(receipt.id);
  }
}

export async function getReceiptForUser(receiptId: string, userId: string) {
  return findReceiptForUser(receiptId, userId);
}

export async function receiptToDownloadHtml(receipt: PaymentReceiptWithEnrollment) {
  const enrollment = receipt.enrollment;
  const { payerPhone, cardLast4 } = await resolvePaymentDisplayDetails(
    enrollment,
    receipt.phase,
    receipt.paymentMethod,
  );

  return buildReceiptHtml({
    receiptNumber: receipt.receiptNumber,
    phase: receipt.phase,
    firstName: enrollment.firstName,
    lastName: enrollment.lastName,
    email: enrollment.user.email,
    domain: getDomain(enrollment.domain as DomainId).label,
    duration: getDuration(enrollment.duration as DurationId).label,
    session: getFormationSession(enrollment.formationSession as SessionId).period,
    amountUsd: receipt.amountUsd,
    amountXof: receipt.amountXof,
    paymentMethod: receipt.paymentMethod,
    reference: receipt.reference,
    paidAt: receipt.paidAt,
    payerPhone,
    cardLast4,
  });
}

export { PHASE_LABELS, METHOD_LABELS };
