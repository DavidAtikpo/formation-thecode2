import { readFileSync } from 'fs';
import { join } from 'path';
import type { Enrollment, EnrollmentGrade, FormationDomain, FormationDuration, FormationSession } from '@prisma/client';
import {
  getDomain,
  getDuration,
  getFormationSession,
  type DomainId,
  type DurationId,
  type SessionId,
} from '@/app/lib/formation-config';
import { getAppBaseUrl } from '@/app/lib/email-verification';

const COMPANY = {
  name: 'The Code²',
  tagline: 'Formation pratique en technologies numériques',
  address: 'Aného — Togo',
  email: 'thecode2@qrthecode2.com',
  brand: '#241bff',
  brandDark: '#1d15cc',
  brandLight: '#7d75ff',
} as const;

let cachedLogoDataUri: string | null = null;

function getCertificateLogoDataUri() {
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

export function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TC2-CERT-${year}-${suffix}`;
}

export function getDefaultSignatoryName() {
  return process.env.CERTIFICATE_SIGNATORY_NAME?.trim() || '';
}

export type CertificateEnrollment = Pick<
  Enrollment,
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'domain'
  | 'duration'
  | 'formationSession'
  | 'identityExtractedName'
  | 'identityDocumentUrl'
  | 'passportPhotoUrl'
  | 'identityVerificationStatus'
  | 'identityVerifiedAt'
  | 'certificateNumber'
  | 'certificateSignedBy'
  | 'certificateIssuedAt'
> & {
  grades?: Pick<EnrollmentGrade, 'title' | 'score' | 'maxScore'>[];
};

export function resolveCertificateName(enrollment: CertificateEnrollment) {
  return (
    enrollment.identityExtractedName?.trim() ||
    `${enrollment.firstName.trim()} ${enrollment.lastName.trim()}`
  );
}

export function resolveCertificatePhoto(enrollment: CertificateEnrollment) {
  return enrollment.identityDocumentUrl ?? enrollment.passportPhotoUrl ?? null;
}

function computeAverageGrade(grades: Pick<EnrollmentGrade, 'score' | 'maxScore'>[]) {
  if (grades.length === 0) return null;
  const avg =
    grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20, 0) / grades.length;
  return Math.round(avg * 10) / 10;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildCertificateHtml(params: {
  certificateNumber: string;
  fullName: string;
  domain: string;
  duration: string;
  session: string;
  sessionPeriod: string;
  averageGrade: number | null;
  grades: { title: string; score: number; maxScore: number }[];
  identityVerifiedAt: Date | null;
  issuedAt: Date;
  signedBy: string;
  photoUrl: string | null;
  preview?: boolean;
}) {
  const logoSrc = getCertificateLogoDataUri();
  const issuedLabel = params.issuedAt.toLocaleDateString('fr-FR', { dateStyle: 'long' });
  const verifiedLabel = params.identityVerifiedAt
    ? params.identityVerifiedAt.toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : null;

  const gradesRows =
    params.grades.length > 0
      ? params.grades
          .map(
            (g) =>
              `<tr><td>${escapeHtml(g.title)}</td><td>${g.score}/${g.maxScore}</td></tr>`,
          )
          .join('')
      : '';

  const averageBlock =
    params.averageGrade != null
      ? `<p class="grade-avg">Moyenne générale : <strong>${params.averageGrade}/20</strong></p>`
      : '';

  const photoBlock = params.photoUrl
    ? `<img src="${escapeHtml(params.photoUrl)}" alt="" class="candidate-photo" />`
    : '';

  const previewOverlay = params.preview
    ? `<div class="preview-watermark">${COMPANY.name}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Certificat ${escapeHtml(params.certificateNumber)} — ${COMPANY.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 landscape; margin: 12mm; }
    body {
      font-family: 'Segoe UI', Georgia, 'Times New Roman', serif;
      background: #eef1f8;
      color: #1e293b;
      padding: 24px 16px 40px;
      line-height: 1.5;
    }
    .cert-wrap {
      max-width: 960px;
      margin: 0 auto;
      position: relative;
    }
    .preview-watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 56px;
      font-weight: 900;
      color: rgba(36, 27, 255, 0.08);
      letter-spacing: 0.06em;
      pointer-events: none;
      z-index: 2;
      transform: rotate(-18deg);
    }
    .certificate {
      background: #fff;
      border: 3px solid ${COMPANY.brand};
      border-radius: 4px;
      box-shadow: 0 12px 40px rgba(36, 27, 255, 0.1);
      overflow: hidden;
      position: relative;
    }
    .inner-border {
      margin: 10px;
      border: 1px solid ${COMPANY.brandLight};
      padding: 32px 40px 36px;
      min-height: 520px;
      display: flex;
      flex-direction: column;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 28px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid ${COMPANY.brandLight};
    }
    .brand-name {
      font-size: 26px;
      font-weight: 800;
      color: ${COMPANY.brand};
      letter-spacing: -0.02em;
    }
    .brand-tagline {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .cert-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
      line-height: 1.7;
    }
    .cert-meta strong { color: ${COMPANY.brand}; }
    .title-block {
      text-align: center;
      margin-bottom: 28px;
    }
    .cert-title {
      font-size: 32px;
      font-weight: 700;
      color: ${COMPANY.brandDark};
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .cert-subtitle {
      margin-top: 8px;
      font-size: 14px;
      color: #64748b;
      font-style: italic;
    }
    .body-content {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 28px;
      align-items: start;
      flex: 1;
    }
    .main-text {
      font-size: 15px;
      color: #334155;
      line-height: 1.8;
    }
    .main-text p { margin-bottom: 14px; }
    .recipient-name {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 16px 0;
      letter-spacing: -0.01em;
    }
    .formation-details {
      margin: 18px 0;
      padding: 14px 18px;
      background: #f8fafc;
      border-left: 3px solid ${COMPANY.brand};
      font-size: 14px;
    }
    .formation-details dt {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-top: 8px;
    }
    .formation-details dt:first-child { margin-top: 0; }
    .formation-details dd {
      color: #1e293b;
      font-weight: 600;
      margin-top: 2px;
    }
    .candidate-photo {
      width: 100px;
      height: 120px;
      object-fit: cover;
      border-radius: 6px;
      border: 2px solid ${COMPANY.brandLight};
      background: #f1f5f9;
    }
    .grades-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 12px;
    }
    .grades-table th, .grades-table td {
      padding: 6px 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .grades-table th {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
    }
    .grade-avg {
      margin-top: 10px;
      font-size: 13px;
      color: #475569;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      gap: 24px;
    }
    .signature-block {
      text-align: center;
      min-width: 200px;
    }
    .signature-line {
      width: 180px;
      border-top: 2px solid ${COMPANY.brand};
      margin: 0 auto 8px;
      padding-top: 8px;
    }
    .signature-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .signature-role {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .stamp {
      font-size: 11px;
      color: #94a3b8;
      text-align: right;
      line-height: 1.6;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .certificate { box-shadow: none; }
    }
    @media (max-width: 700px) {
      .body-content { grid-template-columns: 1fr; }
      .candidate-photo { width: 80px; height: 96px; }
    }
  </style>
</head>
<body>
  <div class="cert-wrap">
    ${previewOverlay}
    <div class="certificate">
      <div class="inner-border">
        <header class="header">
          <div class="brand-block">
            <img src="${logoSrc}" alt="${COMPANY.name}" class="brand-logo" />
            <div>
              <div class="brand-name">${COMPANY.name}</div>
              <div class="brand-tagline">${COMPANY.tagline}</div>
            </div>
          </div>
          <div class="cert-meta">
            <div>N° <strong>${escapeHtml(params.certificateNumber)}</strong></div>
            <div>Émis le ${issuedLabel}</div>
            ${verifiedLabel ? `<div>Identité vérifiée le ${verifiedLabel}</div>` : ''}
          </div>
        </header>

        <div class="title-block">
          <h1 class="cert-title">Certificat de fin de formation</h1>
          <p class="cert-subtitle">Ce document atteste la réussite du parcours de formation</p>
        </div>

        <div class="body-content">
          <div class="main-text">
            <p>Le centre de formation <strong>${COMPANY.name}</strong> certifie que :</p>
            <div class="recipient-name">${escapeHtml(params.fullName)}</div>
            <p>
              a suivi avec assiduité et a validé le parcours de formation pratique en technologies
              numériques, conformément aux exigences du programme.
            </p>
            <dl class="formation-details">
              <dt>Domaine</dt>
              <dd>${escapeHtml(params.domain)}</dd>
              <dt>Durée</dt>
              <dd>${escapeHtml(params.duration)}</dd>
              <dt>Session</dt>
              <dd>${escapeHtml(params.session)} — ${escapeHtml(params.sessionPeriod)}</dd>
            </dl>
            ${
              gradesRows
                ? `<table class="grades-table"><thead><tr><th>Évaluation</th><th>Note</th></tr></thead><tbody>${gradesRows}</tbody></table>${averageBlock}`
                : ''
            }
          </div>
          ${photoBlock ? `<div>${photoBlock}</div>` : ''}
        </div>

        <footer class="footer">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-name">${escapeHtml(params.signedBy)}</div>
            <div class="signature-role">Directeur de formation — ${COMPANY.name}</div>
          </div>
          <div class="stamp">
            ${COMPANY.address}<br />
            ${COMPANY.email}<br />
            Document officiel — ${COMPANY.name}
          </div>
        </footer>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function enrollmentToCertificateParams(
  enrollment: CertificateEnrollment,
  options: { signedBy: string; preview?: boolean },
) {
  const domain = getDomain(enrollment.domain as FormationDomain as DomainId);
  const duration = getDuration(enrollment.duration as FormationDuration as DurationId);
  const session = getFormationSession(enrollment.formationSession as FormationSession as SessionId);
  const grades = enrollment.grades ?? [];
  const certificateNumber =
    enrollment.certificateNumber ?? generateCertificateNumber();
  const issuedAt = enrollment.certificateIssuedAt ?? new Date();

  return {
    certificateNumber,
    fullName: resolveCertificateName(enrollment),
    domain: domain.label,
    duration: duration.label,
    session: session.label,
    sessionPeriod: session.period,
    averageGrade: computeAverageGrade(grades),
    grades: grades.map((g) => ({
      title: g.title,
      score: g.score,
      maxScore: g.maxScore,
    })),
    identityVerifiedAt: enrollment.identityVerifiedAt,
    issuedAt,
    signedBy: options.signedBy,
    photoUrl: resolveCertificatePhoto(enrollment),
    preview: options.preview,
  };
}

export function buildCertificateFromEnrollment(
  enrollment: CertificateEnrollment,
  options: { signedBy: string; preview?: boolean },
) {
  return buildCertificateHtml(enrollmentToCertificateParams(enrollment, options));
}

export function canPublishCertificate(enrollment: CertificateEnrollment) {
  return enrollment.identityVerificationStatus === 'verified';
}
