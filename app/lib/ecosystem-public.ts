import type { JobContractType, PublicationStatus, TalentCategory } from '@prisma/client';

export const TALENT_CATEGORIES: { id: TalentCategory; label: string }[] = [
  { id: 'developer', label: 'Développeur' },
  { id: 'designer', label: 'Design & UX' },
  { id: 'content', label: 'Création de contenu' },
  { id: 'seo', label: 'SEO & visibilité' },
  { id: 'other', label: 'Autre' },
];

export const JOB_CONTRACT_TYPES: { id: JobContractType; label: string }[] = [
  { id: 'cdi', label: 'CDI' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'stage', label: 'Stage' },
  { id: 'mission', label: 'Mission' },
];

export const AVAILABILITY_OPTIONS: { id: string; label: string }[] = [
  { id: 'freelance', label: 'Freelance' },
  { id: 'cdi', label: 'CDI' },
  { id: 'stage', label: 'Stage' },
  { id: 'remote', label: 'Remote' },
  { id: 'on_site', label: 'Sur site' },
];

export const PUBLICATION_STATUSES: { id: PublicationStatus; label: string }[] = [
  { id: 'pending', label: 'En attente' },
  { id: 'published', label: 'Publié' },
  { id: 'archived', label: 'Archivé' },
];

const MAX_SKILLS = 30;
const MAX_SKILL_LENGTH = 40;
const MAX_HEADLINE = 120;
const MAX_BIO = 2000;
const MAX_NAME = 80;
const MAX_LOCATION = 120;
const MAX_COMPANY = 120;
const MAX_TITLE = 160;
const MAX_DESCRIPTION = 5000;
const URL_RE = /^https?:\/\/.+/i;

export function categoryLabel(category: TalentCategory) {
  return TALENT_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

export function contractTypeLabel(type: JobContractType) {
  return JOB_CONTRACT_TYPES.find((c) => c.id === type)?.label ?? type;
}

export function availabilityLabel(id: string) {
  return AVAILABILITY_OPTIONS.find((a) => a.id === id)?.label ?? id;
}

export function publicationStatusLabel(status: PublicationStatus) {
  return PUBLICATION_STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function formatPublicName(firstName: string, lastName: string) {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return initial ? `${firstName.trim()} ${initial}.` : firstName.trim();
}

function normalizeSkills(raw: unknown): string[] | { error: string } {
  if (!Array.isArray(raw)) return [];
  const skills = raw
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SKILLS);

  const unique = [...new Set(skills.map((s) => s.slice(0, MAX_SKILL_LENGTH)))];
  for (const skill of unique) {
    if (skill.length < 2) return { error: 'Compétence trop courte' };
  }
  return unique;
}

function normalizeAvailability(raw: unknown): string[] {
  const allowed = new Set(AVAILABILITY_OPTIONS.map((a) => a.id));
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((a): a is string => typeof a === 'string' && allowed.has(a)))];
}

export type TalentProfileInput = {
  firstName: string;
  lastName: string;
  category: TalentCategory;
  headline?: string | null;
  bio?: string | null;
  country?: string | null;
  yearsExperience?: number | null;
  skills: string[];
  portfolioUrl?: string | null;
  availability: string[];
};

export function parseTalentProfileBody(body: unknown): TalentProfileInput | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Données invalides' };
  const raw = body as Record<string, unknown>;

  const firstName = typeof raw.firstName === 'string' ? raw.firstName.trim() : '';
  const lastName = typeof raw.lastName === 'string' ? raw.lastName.trim() : '';
  if (firstName.length < 2 || firstName.length > MAX_NAME) return { error: 'Prénom invalide' };
  if (lastName.length < 2 || lastName.length > MAX_NAME) return { error: 'Nom invalide' };

  const category = raw.category;
  if (
    category !== 'developer' &&
    category !== 'designer' &&
    category !== 'content' &&
    category !== 'seo' &&
    category !== 'other'
  ) {
    return { error: 'Catégorie invalide' };
  }

  const headline =
    typeof raw.headline === 'string' && raw.headline.trim()
      ? raw.headline.trim().slice(0, MAX_HEADLINE)
      : null;
  const bio =
    typeof raw.bio === 'string' && raw.bio.trim() ? raw.bio.trim().slice(0, MAX_BIO) : null;
  const country =
    typeof raw.country === 'string' && raw.country.trim()
      ? raw.country.trim().slice(0, MAX_LOCATION)
      : null;

  let yearsExperience: number | null = null;
  if (raw.yearsExperience != null && raw.yearsExperience !== '') {
    const years = Number(raw.yearsExperience);
    if (!Number.isFinite(years) || years < 0 || years > 40) {
      return { error: "Années d'expérience invalides (0 à 40)" };
    }
    yearsExperience = Math.round(years);
  }

  const skillsResult = normalizeSkills(raw.skills);
  if ('error' in skillsResult) return skillsResult;

  const portfolioUrl =
    typeof raw.portfolioUrl === 'string' && raw.portfolioUrl.trim()
      ? raw.portfolioUrl.trim()
      : null;
  if (portfolioUrl && !URL_RE.test(portfolioUrl)) {
    return { error: 'URL portfolio invalide (http/https)' };
  }

  return {
    firstName,
    lastName,
    category,
    headline,
    bio,
    country,
    yearsExperience,
    skills: skillsResult,
    portfolioUrl,
    availability: normalizeAvailability(raw.availability),
  };
}

export type JobListingInput = {
  title: string;
  company: string;
  description: string;
  category: TalentCategory;
  location?: string | null;
  remote: boolean;
  contractType: JobContractType;
  expiresAt?: Date | null;
};

export function parseJobListingBody(body: unknown): JobListingInput | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Données invalides' };
  const raw = body as Record<string, unknown>;

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const company = typeof raw.company === 'string' ? raw.company.trim() : '';
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';

  if (title.length < 3 || title.length > MAX_TITLE) return { error: 'Titre invalide' };
  if (company.length < 2 || company.length > MAX_COMPANY) return { error: 'Entreprise invalide' };
  if (description.length < 20 || description.length > MAX_DESCRIPTION) {
    return { error: 'Description invalide (20 à 5000 caractères)' };
  }

  const category = raw.category;
  if (
    category !== 'developer' &&
    category !== 'designer' &&
    category !== 'content' &&
    category !== 'seo' &&
    category !== 'other'
  ) {
    return { error: 'Catégorie invalide' };
  }

  const contractType = raw.contractType;
  if (
    contractType !== 'cdi' &&
    contractType !== 'freelance' &&
    contractType !== 'stage' &&
    contractType !== 'mission'
  ) {
    return { error: 'Type de contrat invalide' };
  }

  const location =
    typeof raw.location === 'string' && raw.location.trim()
      ? raw.location.trim().slice(0, MAX_LOCATION)
      : null;
  const remote = raw.remote === true;

  let expiresAt: Date | null = null;
  if (typeof raw.expiresAt === 'string' && raw.expiresAt.trim()) {
    const date = new Date(raw.expiresAt);
    if (Number.isNaN(date.getTime())) return { error: 'Date de fin invalide' };
    expiresAt = date;
  }

  return { title, company, description, category, location, remote, contractType, expiresAt };
}

export type PublicTalentProfile = {
  id: string;
  displayName: string;
  category: TalentCategory;
  categoryLabel: string;
  headline: string | null;
  bio: string | null;
  country: string | null;
  yearsExperience: number | null;
  skills: string[];
  portfolioUrl: string | null;
  availability: string[];
  availabilityLabels: string[];
  publishedAt: string | null;
};

export type PublicJobListing = {
  id: string;
  title: string;
  company: string;
  description: string;
  category: TalentCategory;
  categoryLabel: string;
  location: string | null;
  remote: boolean;
  contractType: JobContractType;
  contractTypeLabel: string;
  publishedAt: string | null;
  expiresAt: string | null;
};

export function serializePublicTalentProfile(profile: {
  id: string;
  firstName: string;
  lastName: string;
  category: TalentCategory;
  headline: string | null;
  bio: string | null;
  country: string | null;
  yearsExperience: number | null;
  skills: string[];
  portfolioUrl: string | null;
  availability: string[];
  publishedAt: Date | null;
}): PublicTalentProfile {
  return {
    id: profile.id,
    displayName: formatPublicName(profile.firstName, profile.lastName),
    category: profile.category,
    categoryLabel: categoryLabel(profile.category),
    headline: profile.headline,
    bio: profile.bio,
    country: profile.country,
    yearsExperience: profile.yearsExperience,
    skills: profile.skills,
    portfolioUrl: profile.portfolioUrl,
    availability: profile.availability,
    availabilityLabels: profile.availability.map(availabilityLabel),
    publishedAt: profile.publishedAt?.toISOString() ?? null,
  };
}

export function serializePublicJobListing(listing: {
  id: string;
  title: string;
  company: string;
  description: string;
  category: TalentCategory;
  location: string | null;
  remote: boolean;
  contractType: JobContractType;
  publishedAt: Date | null;
  expiresAt: Date | null;
}): PublicJobListing {
  return {
    id: listing.id,
    title: listing.title,
    company: listing.company,
    description: listing.description,
    category: listing.category,
    categoryLabel: categoryLabel(listing.category),
    location: listing.location,
    remote: listing.remote,
    contractType: listing.contractType,
    contractTypeLabel: contractTypeLabel(listing.contractType),
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    expiresAt: listing.expiresAt?.toISOString() ?? null,
  };
}

export function isListingActive(expiresAt: Date | null) {
  if (!expiresAt) return true;
  return expiresAt.getTime() >= Date.now();
}
