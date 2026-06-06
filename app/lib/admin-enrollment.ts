import type { Enrollment, EnrollmentGrade, PaymentReceipt, SkillLevel, User } from '@prisma/client';
import { SKILL_LEVEL_LABELS } from '@/app/lib/formation-config';

export type AdminSkillProfile = {
  completed: boolean;
  skillLevel: SkillLevel | null;
  yearsExperience: number | null;
  masteredTechnologies: string[];
  completedAt: string | null;
  summary: string;
};

type EnrollmentWithRelations = Enrollment & {
  user?: Partial<Pick<User, 'email' | 'emailVerified' | 'createdAt' | 'id'>>;
  grades?: EnrollmentGrade[];
  receipts?: PaymentReceipt[];
};

export function buildSkillProfileSummary(
  skillLevel: SkillLevel | null,
  yearsExperience: number | null,
  masteredTechnologies: string[],
  completed: boolean,
): string {
  if (!completed || !skillLevel) return 'Profil non complété';
  if (skillLevel === 'beginner') return SKILL_LEVEL_LABELS.beginner;
  const years =
    yearsExperience != null
      ? `${yearsExperience} an${yearsExperience > 1 ? 's' : ''}`
      : 'expérience non précisée';
  const techCount = masteredTechnologies.length;
  return `${SKILL_LEVEL_LABELS.experienced} — ${years}${techCount > 0 ? ` — ${techCount} techno${techCount > 1 ? 's' : ''}` : ''}`;
}

export function serializeSkillProfile(enrollment: Pick<
  Enrollment,
  'skillLevel' | 'yearsExperience' | 'masteredTechnologies' | 'skillProfileCompletedAt'
>): AdminSkillProfile {
  const completed = Boolean(enrollment.skillProfileCompletedAt);
  const masteredTechnologies = enrollment.masteredTechnologies ?? [];

  return {
    completed,
    skillLevel: enrollment.skillLevel,
    yearsExperience: enrollment.yearsExperience,
    masteredTechnologies,
    completedAt: enrollment.skillProfileCompletedAt?.toISOString() ?? null,
    summary: buildSkillProfileSummary(
      enrollment.skillLevel,
      enrollment.yearsExperience,
      masteredTechnologies,
      completed,
    ),
  };
}

export function serializeAdminEnrollment(enrollment: EnrollmentWithRelations) {
  const { skillProfileCompletedAt, ...rest } = enrollment;

  return {
    ...rest,
    skillProfileCompletedAt: skillProfileCompletedAt?.toISOString() ?? null,
    skillProfile: serializeSkillProfile(enrollment),
  };
}
