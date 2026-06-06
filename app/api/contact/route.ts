import { NextResponse } from 'next/server';
import { apiError, apiServerError } from '@/app/lib/api-security';
import { CONTACT_SUBJECTS } from '@/app/lib/contact-config';
import { sendContactEmail } from '@/app/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 2000;
const VALID_SUBJECTS = CONTACT_SUBJECTS.map((s) => s.label);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || name.length < 2) {
      return apiError('Nom requis', 400);
    }
    if (!email || !EMAIL_RE.test(email)) {
      return apiError('Email invalide', 400);
    }
    if (!subject || !VALID_SUBJECTS.includes(subject)) {
      return apiError('Sujet invalide', 400);
    }
    if (!message || message.length < 10) {
      return apiError('Message trop court (min. 10 caractères)', 400);
    }
    if (message.length > MAX_MESSAGE) {
      return apiError('Message trop long', 400);
    }

    const sent = await sendContactEmail({ name, email, subject, message });
    if (!sent) {
      return apiError('Envoi temporairement indisponible. Contactez-nous sur WhatsApp.', 503);
    }

    return NextResponse.json({ ok: true, message: 'Message envoyé. Nous vous répondrons rapidement.' });
  } catch {
    return apiServerError();
  }
}
