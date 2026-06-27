const URL_RE = /^https?:\/\/.+/i;
const MAX_TITLE = 120;
const MAX_URL = 500;

export type ProjectSubmissionInput = {
  url: string;
  title?: string | null;
};

export function parseProjectSubmissionBody(body: unknown): ProjectSubmissionInput | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Données invalides' };

  const raw = body as Record<string, unknown>;
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim().slice(0, MAX_TITLE)
      : null;

  if (!url || url.length > MAX_URL) {
    return { error: 'URL invalide' };
  }
  if (!URL_RE.test(url)) {
    return { error: "L'URL doit commencer par http:// ou https://" };
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { error: 'Protocole non autorisé' };
    }
  } catch {
    return { error: 'URL invalide' };
  }

  return { url, title };
}

export type ProjectSubmission = {
  url: string | null;
  title: string | null;
  submittedAt: string | null;
};

export function serializeProjectSubmission(enrollment: {
  projectSiteUrl: string | null;
  projectSiteTitle: string | null;
  projectSiteSubmittedAt: Date | null;
}): ProjectSubmission {
  return {
    url: enrollment.projectSiteUrl,
    title: enrollment.projectSiteTitle,
    submittedAt: enrollment.projectSiteSubmittedAt?.toISOString() ?? null,
  };
}

export const DEFAULT_PROJECT_GRADE_TITLE = 'Projet final hébergé';
