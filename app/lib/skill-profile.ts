import type { SkillLevel } from '@prisma/client';
import { getProfileTechnologies } from '@/app/lib/formation-config';

const MAX_TECHNOLOGIES = 30;
const MAX_CUSTOM_TECH_LENGTH = 40;

export type SkillProfileInput = {
  skillLevel: SkillLevel;
  yearsExperience?: number | null;
  masteredTechnologies?: string[];
};

export function parseSkillProfileBody(body: unknown): SkillProfileInput | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Données invalides' };
  }

  const raw = body as Record<string, unknown>;
  const skillLevel = raw.skillLevel;

  if (skillLevel !== 'beginner' && skillLevel !== 'experienced') {
    return { error: 'Niveau invalide' };
  }

  if (skillLevel === 'beginner') {
    return { skillLevel, yearsExperience: null, masteredTechnologies: [] };
  }

  const years = Number(raw.yearsExperience);
  if (!Number.isFinite(years) || years < 1 || years > 40) {
    return { error: "Indiquez vos années d'expérience (1 à 40)" };
  }

  const allowed = new Set(getProfileTechnologies().map((t) => t.toLowerCase()));
  const technologies = Array.isArray(raw.masteredTechnologies)
    ? raw.masteredTechnologies
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const normalized = [
    ...new Set(
      technologies.map((tech) => {
        const match = getProfileTechnologies().find(
          (item) => item.toLowerCase() === tech.toLowerCase(),
        );
        return match ?? tech.slice(0, MAX_CUSTOM_TECH_LENGTH);
      }),
    ),
  ].slice(0, MAX_TECHNOLOGIES);

  if (normalized.length === 0) {
    return { error: 'Sélectionnez au moins une technologie maîtrisée' };
  }

  for (const tech of normalized) {
    if (tech.length > MAX_CUSTOM_TECH_LENGTH) {
      return { error: 'Technologie trop longue' };
    }
    if (!allowed.has(tech.toLowerCase()) && !/^[a-zA-Z0-9.+#\- ]{2,40}$/.test(tech)) {
      return { error: `Technologie invalide : ${tech}` };
    }
  }

  return {
    skillLevel,
    yearsExperience: Math.round(years),
    masteredTechnologies: normalized,
  };
}
