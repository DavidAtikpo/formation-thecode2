import nodemailer from 'nodemailer';
import { getAdminEmails } from '@/app/lib/admin';
import type { PaymentPhase } from '@prisma/client';

function buildVerificationHtml(verifyUrl: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#241bff;font-size:22px">The Code²</h1>
      <p>Bonjour,</p>
      <p>Confirmez votre adresse email pour poursuivre votre inscription à la formation The Code².</p>
      <p style="margin:28px 0">
        <a href="${verifyUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Vérifier mon email
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez ce message.</p>
    </div>
  `;
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim() || 'smtp.hostinger.com';
  const port = Number(process.env.SMTP_PORT?.trim() || '465');
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const from = process.env.EMAIL_FROM?.trim() || `The Code² <${user}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, html });
  return true;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from = process.env.EMAIL_FROM?.trim() ?? 'The Code² <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  return res.ok;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getContactRecipient() {
  return process.env.CONTACT_EMAIL?.trim() || process.env.SMTP_USER?.trim() || null;
}

export async function sendContactEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const to = getContactRecipient();
  if (!to) return false;

  const subject = `[Contact The Code²] ${params.subject} — ${params.name}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#1e293b">
      <h2 style="color:#241bff">Nouveau message de contact</h2>
      <p><strong>Nom :</strong> ${escapeHtml(params.name)}</p>
      <p><strong>Email :</strong> ${escapeHtml(params.email)}</p>
      <p><strong>Sujet :</strong> ${escapeHtml(params.subject)}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
      <p style="white-space:pre-wrap">${escapeHtml(params.message)}</p>
    </div>
  `;

  try {
    if (isSmtpConfigured()) {
      return await sendViaSmtp(to, subject, html);
    }
    if (process.env.RESEND_API_KEY?.trim()) {
      return await sendViaResend(to, subject, html);
    }
    return false;
  } catch {
    return false;
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    if (isSmtpConfigured()) {
      return await sendViaSmtp(to, subject, html);
    }
    if (process.env.RESEND_API_KEY?.trim()) {
      return await sendViaResend(to, subject, html);
    }
    return false;
  } catch {
    return false;
  }
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  receiptNumber: string;
  phaseLabel: string;
  amountUsd: number;
  downloadUrl: string;
  receiptHtml: string;
}): Promise<boolean> {
  const subject = `Reçu de paiement ${params.receiptNumber} — The Code²`;
  const amount =
    Number.isInteger(params.amountUsd) ? String(params.amountUsd) : params.amountUsd.toFixed(2);
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#241bff;font-size:22px">The Code²</h1>
      <p>Bonjour,</p>
      <p>Votre paiement a bien été enregistré. Voici votre reçu :</p>
      <table style="width:100%;margin:16px 0;font-size:14px">
        <tr><td style="color:#64748b;padding:4px 0">N° reçu</td><td><strong>${escapeHtml(params.receiptNumber)}</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Type</td><td>${escapeHtml(params.phaseLabel)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Montant</td><td><strong>${amount} $ USD</strong></td></tr>
      </table>
      <p style="margin:24px 0">
        <a href="${params.downloadUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Télécharger le reçu
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">
        Vous pouvez aussi retrouver vos reçus à tout moment dans votre
        <a href="${params.downloadUrl.replace(/\/api\/espace\/receipts\/[^/]+$/, '/espace/paiements')}" style="color:#241bff">espace candidat</a>.
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">Merci de votre confiance — The Code²</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}

export async function sendLearningResourceEmail(params: {
  to: string;
  title: string;
  typeLabel: string;
  espaceUrl: string;
}): Promise<boolean> {
  const subject = `Nouveau contenu disponible — ${params.title}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#241bff;font-size:22px">The Code²</h1>
      <p>Bonjour,</p>
      <p>Un nouveau contenu de formation est disponible dans votre espace candidat :</p>
      <p style="margin:16px 0;padding:14px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <strong>${escapeHtml(params.title)}</strong><br/>
        <span style="color:#64748b;font-size:14px">${escapeHtml(params.typeLabel)}</span>
      </p>
      <p style="margin:24px 0">
        <a href="${params.espaceUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Accéder à mon espace
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">The Code² — Formation pratique</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<boolean> {
  const subject = 'Vérifiez votre email — The Code²';
  const html = buildVerificationHtml(verifyUrl);
  return sendEmail(to, subject, html);
}

async function sendEmailsToAdmins(subject: string, html: string): Promise<number> {
  const recipients = getAdminEmails();
  const fallback = getContactRecipient();
  const toList = recipients.length > 0 ? recipients : fallback ? [fallback] : [];

  let sent = 0;
  for (const to of toList) {
    if (await sendEmail(to, subject, html)) sent += 1;
  }
  return sent;
}

export async function sendGradePublishedEmail(params: {
  to: string;
  firstName: string;
  gradeTitle: string;
  score: number;
  maxScore: number;
  espaceUrl: string;
}): Promise<boolean> {
  const subject = `Nouvelle note publiée — ${params.gradeTitle}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#241bff;font-size:22px">The Code²</h1>
      <p>Bonjour ${escapeHtml(params.firstName)},</p>
      <p>Une nouvelle évaluation a été publiée dans votre espace candidat :</p>
      <p style="margin:16px 0;padding:14px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <strong>${escapeHtml(params.gradeTitle)}</strong><br/>
        <span style="color:#64748b;font-size:14px">Note : ${params.score} / ${params.maxScore}</span>
      </p>
      <p style="margin:24px 0">
        <a href="${params.espaceUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Voir mes notes
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">The Code² — Formation pratique</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}

export async function sendCertificateReadyEmail(params: {
  to: string;
  firstName: string;
  espaceUrl: string;
}): Promise<boolean> {
  const subject = 'Votre certificat est disponible — The Code²';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#241bff;font-size:22px">The Code²</h1>
      <p>Bonjour ${escapeHtml(params.firstName)},</p>
      <p>Félicitations ! Votre certificat de fin de formation est maintenant disponible dans votre espace candidat.</p>
      <p style="margin:24px 0">
        <a href="${params.espaceUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Télécharger mon certificat
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">The Code² — Formation pratique</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}

export async function sendSessionBroadcastEmail(params: {
  to: string;
  firstName: string;
  subject: string;
  message: string;
  espaceUrl: string;
}): Promise<boolean> {
  const subject = `${params.subject} — The Code²`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#241bff;font-size:22px">The Code²</h1>
      <p>Bonjour ${escapeHtml(params.firstName)},</p>
      <div style="margin:16px 0;padding:14px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;white-space:pre-wrap;font-size:14px;line-height:1.6">
        ${escapeHtml(params.message)}
      </div>
      <p style="margin:24px 0">
        <a href="${params.espaceUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Accéder à mon espace
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">The Code² — Formation pratique</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}

export async function sendAdminPaymentNotificationEmail(params: {
  phase: PaymentPhase;
  phaseLabel: string;
  amountUsd: number;
  firstName: string;
  lastName: string;
  email: string;
  domain: string;
  session: string;
  duration: string;
  paymentMethod: string;
  adminUrl: string;
}): Promise<number> {
  const amount =
    Number.isInteger(params.amountUsd) ? String(params.amountUsd) : params.amountUsd.toFixed(2);
  const subject = `[Paiement] ${params.phaseLabel} — ${params.firstName} ${params.lastName}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#1e293b">
      <h2 style="color:#241bff">Nouveau paiement reçu</h2>
      <table style="width:100%;margin:16px 0;font-size:14px">
        <tr><td style="color:#64748b;padding:4px 0">Candidat</td><td><strong>${escapeHtml(params.firstName)} ${escapeHtml(params.lastName)}</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Email</td><td>${escapeHtml(params.email)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Type</td><td>${escapeHtml(params.phaseLabel)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Montant</td><td><strong>${amount} $ USD</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Méthode</td><td>${escapeHtml(params.paymentMethod)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Parcours</td><td>${escapeHtml(params.domain)} — ${escapeHtml(params.duration)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Session</td><td>${escapeHtml(params.session)}</td></tr>
      </table>
      <p style="margin:20px 0">
        <a href="${params.adminUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Voir dans l'admin
        </a>
      </p>
    </div>
  `;

  return sendEmailsToAdmins(subject, html);
}

export async function sendAdminEnrollmentNotificationEmail(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  domain: string;
  session: string;
  duration: string;
  schedule: string;
  totalFeeUsd: number;
  adminUrl: string;
}): Promise<number> {
  const total =
    Number.isInteger(params.totalFeeUsd)
      ? String(params.totalFeeUsd)
      : params.totalFeeUsd.toFixed(2);
  const subject = `[Inscription] ${params.firstName} ${params.lastName} — ${params.domain}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#1e293b">
      <h2 style="color:#241bff">Nouvelle inscription</h2>
      <p style="font-size:14px;color:#64748b;margin-bottom:12px">Inscription gratuite — paiement en tranches dans l'espace candidat.</p>
      <table style="width:100%;margin:16px 0;font-size:14px">
        <tr><td style="color:#64748b;padding:4px 0">Candidat</td><td><strong>${escapeHtml(params.firstName)} ${escapeHtml(params.lastName)}</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Email</td><td>${escapeHtml(params.email)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Téléphone</td><td>${escapeHtml(params.phone)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Pays</td><td>${escapeHtml(params.country)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Parcours</td><td>${escapeHtml(params.domain)} — ${escapeHtml(params.duration)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Session</td><td>${escapeHtml(params.session)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Planning</td><td>${escapeHtml(params.schedule)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Tarif formation</td><td><strong>${total} $ USD</strong> (3 tranches)</td></tr>
      </table>
      <p style="margin:20px 0">
        <a href="${params.adminUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Voir dans l'admin
        </a>
      </p>
    </div>
  `;

  return sendEmailsToAdmins(subject, html);
}

function formatUsdEmail(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export async function sendEnrollmentConfirmationEmail(params: {
  to: string;
  firstName: string;
  domain: string;
  session: string;
  duration: string;
  schedule: string;
  totalFeeUsd: number;
  installment1Usd: number;
  installment2Usd: number;
  installment3Usd: number;
  espaceUrl: string;
  paiementsUrl: string;
}): Promise<boolean> {
  const subject = 'Inscription confirmée — The Code²';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#241bff;font-size:22px">The Code²</h1>
      <p>Bonjour ${escapeHtml(params.firstName)},</p>
      <p>Votre inscription à la formation The Code² est <strong>confirmée</strong>. L'inscription est gratuite — votre place est réservée.</p>
      <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse">
        <tr><td style="color:#64748b;padding:4px 0">Parcours</td><td>${escapeHtml(params.domain)} — ${escapeHtml(params.duration)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Session</td><td>${escapeHtml(params.session)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Planning</td><td>${escapeHtml(params.schedule)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Tarif formation</td><td><strong>${formatUsdEmail(params.totalFeeUsd)} $ USD</strong></td></tr>
      </table>
      <p style="font-size:14px;color:#64748b;margin-bottom:8px">Paiement en 3 tranches :</p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#475569">
        <li>1re tranche — ${formatUsdEmail(params.installment1Usd)} $</li>
        <li>2e tranche — ${formatUsdEmail(params.installment2Usd)} $</li>
        <li>3e tranche — ${formatUsdEmail(params.installment3Usd)} $</li>
      </ul>
      <p style="font-size:14px">Réglez la <strong>1re tranche</strong> depuis votre espace candidat pour finaliser votre dossier.</p>
      <p style="margin:24px 0">
        <a href="${params.paiementsUrl}" style="display:inline-block;background:#241bff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Accéder aux paiements
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">
        <a href="${params.espaceUrl}" style="color:#241bff">Mon espace candidat</a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">The Code² — Formation pratique</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}
