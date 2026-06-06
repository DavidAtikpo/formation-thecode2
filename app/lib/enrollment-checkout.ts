import type { DomainId, DurationId, SessionId } from '@/app/lib/formation-config';

export type PaymentMethodId = 'stripe' | 'fedapay' | 'crypto';

export type EnrollmentCheckoutBody = {
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  address: string;
  passportPhotoUrl: string;
  passportPublicId: string;
  domain: DomainId;
  formationSession: SessionId;
  duration: DurationId;
  scheduleDays: string[];
  scheduleHours: string;
  acceptedPrivacy: boolean;
  paymentMethod: PaymentMethodId;
};

const VALID_DOMAINS = ['frontend', 'backend', 'mobile', 'fullstack', 'seo_social'] as const;
const VALID_DURATIONS = ['two_weeks', 'three_months', 'four_months'] as const;
const VALID_SESSIONS = ['july_2026', 'august_2026', 'late_august_2026'] as const;
const VALID_PAYMENT_METHODS = ['stripe', 'fedapay', 'crypto'] as const;

export function parseEnrollmentCheckoutBody(
  body: unknown,
): { data: EnrollmentCheckoutBody } | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Corps de requête invalide' };
  }

  const raw = body as Record<string, unknown>;
  const firstName = typeof raw.firstName === 'string' ? raw.firstName.trim() : '';
  const lastName = typeof raw.lastName === 'string' ? raw.lastName.trim() : '';
  const country = typeof raw.country === 'string' ? raw.country.trim() : '';
  const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const address = typeof raw.address === 'string' ? raw.address.trim() : '';
  const passportPhotoUrl = typeof raw.passportPhotoUrl === 'string' ? raw.passportPhotoUrl : '';
  const passportPublicId = typeof raw.passportPublicId === 'string' ? raw.passportPublicId : '';
  const domain = raw.domain as DomainId;
  const formationSession = raw.formationSession as SessionId;
  const duration = raw.duration as DurationId;
  const scheduleDays = Array.isArray(raw.scheduleDays)
    ? raw.scheduleDays.filter((d): d is string => typeof d === 'string')
    : [];
  const scheduleHours = typeof raw.scheduleHours === 'string' ? raw.scheduleHours : '';
  const acceptedPrivacy = raw.acceptedPrivacy === true;
  const paymentMethod = raw.paymentMethod as PaymentMethodId;

  if (!firstName || !lastName || !country || !phone || !address) {
    return { error: 'Informations personnelles incomplètes' };
  }
  if (!passportPhotoUrl || !passportPublicId) {
    return { error: 'Photo passeport requise' };
  }
  if (!VALID_DOMAINS.includes(domain)) {
    return { error: 'Domaine invalide' };
  }
  if (!VALID_SESSIONS.includes(formationSession)) {
    return { error: 'Session de formation invalide' };
  }
  if (!VALID_DURATIONS.includes(duration)) {
    return { error: 'Durée invalide' };
  }
  if (scheduleDays.length !== 3) {
    return { error: 'Sélectionnez exactement 3 jours par semaine' };
  }
  if (!scheduleHours) {
    return { error: 'Créneau horaire requis' };
  }
  if (!acceptedPrivacy) {
    return { error: 'Vous devez accepter la politique de confidentialité' };
  }
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return { error: 'Moyen de paiement invalide' };
  }

  return {
    data: {
      firstName,
      lastName,
      country,
      phone,
      address,
      passportPhotoUrl,
      passportPublicId,
      domain,
      formationSession,
      duration,
      scheduleDays,
      scheduleHours,
      acceptedPrivacy,
      paymentMethod,
    },
  };
}

export function getBaseUrl(request: Request) {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  const host = request.headers.get('host') ?? 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}
