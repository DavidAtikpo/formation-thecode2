import nodemailer from 'nodemailer';
import { getAdminEmails } from '@/app/lib/admin';
import { CONTACT } from '@/app/lib/contact-config';
import { formatFcfa, usdToXof } from '@/app/lib/formation-config';
import type { PaymentPhase } from '@prisma/client';

function buildVerificationHtml(verifyUrl: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#1b3fa6;font-size:22px">THE CODE CODE</h1>
      <p>Bonjour,</p>
      <p>Confirmez votre adresse email pour poursuivre votre inscription à la formation THE CODE CODE.</p>
      <p style="margin:28px 0">
        <a href="${verifyUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
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
  const from = process.env.EMAIL_FROM?.trim() || `THE CODE CODE <${user}>`;

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

  const from = process.env.EMAIL_FROM?.trim() ?? 'THE CODE CODE <onboarding@resend.dev>';
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
  return CONTACT.email;
}

export async function sendContactEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const to = getContactRecipient();
  if (!to) return false;

  const subject = `[Contact THE CODE CODE] ${params.subject} — ${params.name}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#1e293b">
      <h2 style="color:#1b3fa6">Nouveau message de contact</h2>
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
  const subject = `Reçu de paiement ${params.receiptNumber} — THE CODE CODE`;
  const amount =
    Number.isInteger(params.amountUsd) ? String(params.amountUsd) : params.amountUsd.toFixed(2);
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#1b3fa6;font-size:22px">THE CODE CODE</h1>
      <p>Bonjour,</p>
      <p>Votre paiement a bien été enregistré. Voici votre reçu :</p>
      <table style="width:100%;margin:16px 0;font-size:14px">
        <tr><td style="color:#64748b;padding:4px 0">N° reçu</td><td><strong>${escapeHtml(params.receiptNumber)}</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Type</td><td>${escapeHtml(params.phaseLabel)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Montant</td><td><strong>${amount} $ USD</strong></td></tr>
      </table>
      <p style="margin:24px 0">
        <a href="${params.downloadUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Télécharger le reçu
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">
        Vous pouvez aussi retrouver vos reçus à tout moment dans votre
        <a href="${params.downloadUrl.replace(/\/api\/espace\/receipts\/[^/]+$/, '/espace/paiements')}" style="color:#1b3fa6">espace candidat</a>.
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">Merci de votre confiance — THE CODE CODE</p>
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
      <h1 style="color:#1b3fa6;font-size:22px">THE CODE CODE</h1>
      <p>Bonjour,</p>
      <p>Un nouveau contenu de formation est disponible dans votre espace candidat :</p>
      <p style="margin:16px 0;padding:14px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <strong>${escapeHtml(params.title)}</strong><br/>
        <span style="color:#64748b;font-size:14px">${escapeHtml(params.typeLabel)}</span>
      </p>
      <p style="margin:24px 0">
        <a href="${params.espaceUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Accéder à mon espace
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">THE CODE CODE — Formation pratique</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<boolean> {
  const subject = 'Vérifiez votre email — THE CODE CODE';
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
      <h1 style="color:#1b3fa6;font-size:22px">THE CODE CODE</h1>
      <p>Bonjour ${escapeHtml(params.firstName)},</p>
      <p>Une nouvelle évaluation a été publiée dans votre espace candidat :</p>
      <p style="margin:16px 0;padding:14px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <strong>${escapeHtml(params.gradeTitle)}</strong><br/>
        <span style="color:#64748b;font-size:14px">Note : ${params.score} / ${params.maxScore}</span>
      </p>
      <p style="margin:24px 0">
        <a href="${params.espaceUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Voir mes notes
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">THE CODE CODE — Formation pratique</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}

export async function sendCertificateReadyEmail(params: {
  to: string;
  firstName: string;
  espaceUrl: string;
}): Promise<boolean> {
  const subject = 'Votre certificat est disponible — THE CODE CODE';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#1b3fa6;font-size:22px">THE CODE CODE</h1>
      <p>Bonjour ${escapeHtml(params.firstName)},</p>
      <p>Félicitations ! Votre certificat de fin de formation est maintenant disponible dans votre espace candidat.</p>
      <p style="margin:24px 0">
        <a href="${params.espaceUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Télécharger mon certificat
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">THE CODE CODE — Formation pratique</p>
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
  const subject = `${params.subject} — THE CODE CODE`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#1b3fa6;font-size:22px">THE CODE CODE</h1>
      <p>Bonjour ${escapeHtml(params.firstName)},</p>
      <div style="margin:16px 0;padding:14px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;white-space:pre-wrap;font-size:14px;line-height:1.6">
        ${escapeHtml(params.message)}
      </div>
      <p style="margin:24px 0">
        <a href="${params.espaceUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Accéder à mon espace
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">THE CODE CODE — Formation pratique</p>
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
      <h2 style="color:#1b3fa6">Nouveau paiement reçu</h2>
      <table style="width:100%;margin:16px 0;font-size:14px">
        <tr><td style="color:#64748b;padding:4px 0">Candidat</td><td><strong>${escapeHtml(params.firstName)} ${escapeHtml(params.lastName)}</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Email</td><td>${escapeHtml(params.email)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Type</td><td>${escapeHtml(params.phaseLabel)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Montant</td><td><strong>${amount} $ USD</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Méthode</td><td>${escapeHtml(params.paymentMethod)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Parcours</td><td>${escapeHtml(params.domain)} — ${escapeHtml(params.duration)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Date de début</td><td>${escapeHtml(params.session)}</td></tr>
      </table>
      <p style="margin:20px 0">
        <a href="${params.adminUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
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
  const total = `${formatFcfa(usdToXof(params.totalFeeUsd))} F CFA`;
  const subject = `[Inscription] ${params.firstName} ${params.lastName} — ${params.domain}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#1e293b">
      <h2 style="color:#1b3fa6">Nouvelle inscription</h2>
      <p style="font-size:14px;color:#64748b;margin-bottom:12px">Inscription gratuite — paiement en tranches dans l'espace candidat.</p>
      <table style="width:100%;margin:16px 0;font-size:14px">
        <tr><td style="color:#64748b;padding:4px 0">Candidat</td><td><strong>${escapeHtml(params.firstName)} ${escapeHtml(params.lastName)}</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Email</td><td>${escapeHtml(params.email)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Téléphone</td><td>${escapeHtml(params.phone)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Pays</td><td>${escapeHtml(params.country)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Parcours</td><td>${escapeHtml(params.domain)} — ${escapeHtml(params.duration)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Date de début</td><td>${escapeHtml(params.session)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Planning</td><td>${escapeHtml(params.schedule)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Tarif formation</td><td><strong>${total}</strong> (3 tranches)</td></tr>
      </table>
      <p style="margin:20px 0">
        <a href="${params.adminUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Voir dans l'admin
        </a>
      </p>
    </div>
  `;

  return sendEmailsToAdmins(subject, html);
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
  const subject = 'Inscription confirmée — THE CODE CODE';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h1 style="color:#1b3fa6;font-size:22px">THE CODE CODE</h1>
      <p>Bonjour ${escapeHtml(params.firstName)},</p>
      <p>Votre inscription à la formation THE CODE CODE est <strong>confirmée</strong>. L'inscription est gratuite — votre place est réservée.</p>
      <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse">
        <tr><td style="color:#64748b;padding:4px 0">Parcours</td><td>${escapeHtml(params.domain)} — ${escapeHtml(params.duration)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Date de début</td><td>${escapeHtml(params.session)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Planning</td><td>${escapeHtml(params.schedule)}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Tarif formation</td><td><strong>${formatFcfa(usdToXof(params.totalFeeUsd))} F CFA</strong></td></tr>
      </table>
      <p style="font-size:14px;color:#64748b;margin-bottom:8px">Paiement en 3 tranches :</p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#475569">
        <li>1re tranche — ${formatFcfa(usdToXof(params.installment1Usd))} F CFA</li>
        <li>2e tranche — ${formatFcfa(usdToXof(params.installment2Usd))} F CFA</li>
        <li>3e tranche — ${formatFcfa(usdToXof(params.installment3Usd))} F CFA</li>
      </ul>
      <p style="font-size:14px">Réglez la <strong>1re tranche</strong> depuis votre espace candidat pour finaliser votre dossier.</p>
      <p style="margin:24px 0">
        <a href="${params.paiementsUrl}" style="display:inline-block;background:#1b3fa6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Accéder aux paiements
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">
        <a href="${params.espaceUrl}" style="color:#1b3fa6">Mon espace candidat</a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">THE CODE CODE — Formation pratique</p>
    </div>
  `;

  return sendEmail(params.to, subject, html);
}
