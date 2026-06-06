import nodemailer from 'nodemailer';

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

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<boolean> {
  const subject = 'Vérifiez votre email — The Code²';
  const html = buildVerificationHtml(verifyUrl);

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
