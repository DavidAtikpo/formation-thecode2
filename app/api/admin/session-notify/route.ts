import { NextResponse } from 'next/server';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import { sendSessionBroadcastEmail } from '@/app/lib/email';
import { getAppBaseUrl } from '@/app/lib/email-verification';
import {
  DOMAINS,
  DURATIONS,
  FORMATION_SESSIONS,
  type DomainId,
  type DurationId,
  type SessionId,
} from '@/app/lib/formation-config';
import { findMatchingEnrollments } from '@/app/lib/learning-resources';

export async function POST(request: Request) {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  try {
    const body = await request.json();
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const formationSession =
      typeof body.formationSession === 'string' ? body.formationSession.trim() : '';

    const validSessions = FORMATION_SESSIONS.map((s) => s.id);
    const validDomains = DOMAINS.map((d) => d.id);
    const validDurations = DURATIONS.map((d) => d.id);

    if (!formationSession || !validSessions.includes(formationSession as SessionId)) {
      return apiError('Session requise', 400);
    }
    if (!subject || subject.length < 3) {
      return apiError('Sujet requis (3 caractères minimum)', 400);
    }
    if (!message || message.length < 10) {
      return apiError('Message requis (10 caractères minimum)', 400);
    }
    if (subject.length > 120) {
      return apiError('Sujet trop long (max. 120 caractères)', 400);
    }
    if (message.length > 4000) {
      return apiError('Message trop long (max. 4000 caractères)', 400);
    }

    const domain =
      typeof body.domain === 'string' && validDomains.includes(body.domain as DomainId)
        ? body.domain
        : null;
    const duration =
      typeof body.duration === 'string' && validDurations.includes(body.duration as DurationId)
        ? body.duration
        : null;

    const enrollments = await findMatchingEnrollments({
      formationSession: formationSession as SessionId,
      domain: domain as DomainId | null,
      duration: duration as DurationId | null,
    });

    if (enrollments.length === 0) {
      return apiError('Aucun candidat actif pour cette session', 400);
    }

    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl(request);
    const espaceUrl = `${base.replace(/\/$/, '')}/espace/parcours`;

    let emailsSent = 0;
    for (const enrollment of enrollments) {
      const sent = await sendSessionBroadcastEmail({
        to: enrollment.user.email,
        firstName: enrollment.firstName,
        subject,
        message,
        espaceUrl,
      });
      if (sent) emailsSent += 1;
    }

    return NextResponse.json({
      stats: {
        matched: enrollments.length,
        emailsSent,
      },
    });
  } catch {
    return apiServerError();
  }
}
