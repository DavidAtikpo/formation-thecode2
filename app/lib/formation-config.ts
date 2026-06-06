import type { IconName } from '@/app/components/SectionIcon';

export const DOMAINS: {
  id: 'frontend' | 'backend' | 'mobile' | 'fullstack' | 'seo_social';
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    description: 'WordPress, HTML, CSS, React, Next.js, Angular, Vue.js',
    icon: 'palette',
  },
  {
    id: 'backend',
    label: 'Backend',
    description: 'Node.js, Java, Python, PHP, Django, Express, .NET, Spring Boot, Go',
    icon: 'cog',
  },
  {
    id: 'mobile',
    label: 'Développement Mobile',
    description: 'Flutter, React Native, Android, iOS',
    icon: 'smartphone',
  },
  {
    id: 'fullstack',
    label: 'Fullstack',
    description: 'Frontend + Backend + projets complets',
    icon: 'rocket',
  },
  {
    id: 'seo_social',
    label: 'Indexation & Réseaux sociaux',
    description: 'Référencement, indexation Google, boost sur les réseaux sociaux',
    icon: 'trending',
  },
];

export const DURATIONS = [
  {
    id: 'two_weeks' as const,
    label: '2 semaines',
    subtitle: '6 heures par semaine',
    pricingMode: 'split' as const,
    registrationFeeUsd: 12,
    formationFeeUsd: 25,
    description:
      'Parcours court et intensif pour découvrir le développement, valider votre motivation et poser des bases techniques solides avec un encadrement direct.',
    highlight: 'Découverte',
    formationFeeDeadlineDays: 7,
  },
  {
    id: 'three_months' as const,
    label: '3 mois',
    subtitle: '3 jours par semaine',
    pricingMode: 'split' as const,
    registrationFeeUsd: 54,
    formationFeeUsd: 213,
    description:
      'Parcours complet pour monter en compétences sur la durée. Vous serez formé et encadré sur des projets concrets, avec des revues régulières pour gagner en autonomie et viser un profil de développeur confirmé.',
    highlight: 'Confirmé',
    formationFeeDeadlineDays: 60,
  },
  {
    id: 'four_months' as const,
    label: '4 mois',
    subtitle: '3 jours par semaine — formation personnelle',
    pricingMode: 'split' as const,
    registrationFeeUsd: 90,
    formationFeeUsd: 264.99,
    personal: true,
    description:
      'Accompagnement individualisé sur 4 mois avec un formateur dédié — formation en tête-à-tête, pas en groupe. Un mois supplémentaire pour viser un niveau senior : maîtrise technique, gestion de projet agile et portfolio de réalisations professionnelles.',
    highlight: 'Senior',
    formationFeeDeadlineDays: 90,
  },
] as const;

export const TECHNOLOGIES: { icon: IconName; title: string; description: string; items: string[] }[] = [
  {
    icon: 'palette',
    title: 'Langages & Frontend',
    description: 'Construire des interfaces modernes, responsives et accessibles.',
    items: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Angular', 'Vue.js', 'WordPress'],
  },
  {
    icon: 'cog',
    title: 'Backend & APIs',
    description: 'Créer la logique serveur, les bases de données et les services web.',
    items: ['Node.js', 'Express', 'Python', 'Django', 'Java', 'Spring Boot', 'PHP', '.NET', 'Go', 'REST API'],
  },
  {
    icon: 'smartphone',
    title: 'Développement mobile',
    description: 'Applications natives et cross-platform pour Android et iOS.',
    items: ['Flutter', 'Dart', 'React Native', 'Android', 'iOS'],
  },
  {
    icon: 'laptop',
    title: 'Outils & environnement',
    description: 'Travailler comme en entreprise avec les bons outils au quotidien.',
    items: ['VS Code', 'Git', 'GitHub', 'Terminal', 'npm', 'Postman', 'Chrome DevTools'],
  },
  {
    icon: 'trending',
    title: 'Digital & visibilité',
    description: 'Référencement, indexation et présence sur les réseaux sociaux.',
    items: ['SEO', 'Google Search Console', 'Indexation', 'Réseaux sociaux', 'Analytics'],
  },
];

export const FORMATION_SESSIONS = [
  {
    id: 'july_2026' as const,
    label: 'Session de juillet',
    period: '1er – 15 juillet 2026',
    shortLabel: '1 – 15 juil. 2026',
    startDate: '2026-07-01',
  },
  {
    id: 'august_2026' as const,
    label: 'Session d\'août',
    period: '1er – 15 août 2026',
    shortLabel: '1 – 15 août 2026',
    startDate: '2026-08-01',
  },
  {
    id: 'late_august_2026' as const,
    label: 'Session fin août',
    period: '24 août – 7 septembre 2026',
    shortLabel: '24 août – 7 sept. 2026',
    startDate: '2026-08-24',
  },
] as const;

export const WEEK_DAYS = [
  { id: 'lundi', label: 'Lundi' },
  { id: 'mardi', label: 'Mardi' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'jeudi', label: 'Jeudi' },
  { id: 'vendredi', label: 'Vendredi' },
  { id: 'samedi', label: 'Samedi' },
];

export const HOUR_SLOTS = [
  { id: '08-10', label: '08h00 – 10h00' },
  { id: '10-12', label: '10h00 – 12h00' },
  { id: '14-16', label: '14h00 – 16h00' },
  { id: '16-18', label: '16h00 – 18h00' },
  { id: '18-20', label: '18h00 – 20h00' },
];

export type DomainId = (typeof DOMAINS)[number]['id'];
export type DurationId = (typeof DURATIONS)[number]['id'];
export type SessionId = (typeof FORMATION_SESSIONS)[number]['id'];

export type Duration = (typeof DURATIONS)[number];

export function formatUsd(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export function getDurationTotalUsd(duration: Duration) {
  return duration.registrationFeeUsd + duration.formationFeeUsd;
}

export function getRegistrationFeeUsd(duration: Duration) {
  return duration.registrationFeeUsd;
}

export function getFormationFeeUsd(duration: Duration) {
  return duration.formationFeeUsd;
}

export function usdToStripeCents(amountUsd: number) {
  return Math.round(amountUsd * 100);
}

export function usdToXof(amountUsd: number) {
  return Math.round(amountUsd * 600);
}

export function getDurationPricing(duration: Duration) {
  const registrationFeeUsd = getRegistrationFeeUsd(duration);
  const formationFeeUsd = getFormationFeeUsd(duration);
  const amountUsd = registrationFeeUsd + formationFeeUsd;

  return {
    pricingMode: 'split' as const,
    personal: 'personal' in duration && Boolean(duration.personal),
    registrationFeeUsd,
    formationFeeUsd,
    amountUsd,
    amountUsdInt: Math.round(amountUsd * 100) / 100,
    registrationStripeCents: usdToStripeCents(registrationFeeUsd),
    formationStripeCents: usdToStripeCents(formationFeeUsd),
    stripeCents: usdToStripeCents(amountUsd),
  };
}

export function getFormationFeeDeadlineDays(durationId: DurationId) {
  return getDuration(durationId).formationFeeDeadlineDays;
}

export function formatFormationDeadlineDays(days: number) {
  if (days === 7) return '7 jours';
  if (days === 60) return '2 mois';
  if (days === 90) return '3 mois';
  if (days === 30) return '30 jours (1 mois)';
  if (days % 30 === 0 && days >= 30) {
    const months = days / 30;
    return `${days} jours (${months} mois)`;
  }
  return `${days} jours`;
}

export function getFormationPaymentDeadline(sessionId: SessionId, durationId: DurationId) {
  const session = getFormationSession(sessionId);
  const days = getFormationFeeDeadlineDays(durationId);
  const start = new Date(`${session.startDate}T00:00:00`);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

export function getDuration(id: DurationId) {
  const duration = DURATIONS.find((d) => d.id === id)!;
  return { ...duration, ...getDurationPricing(duration) };
}

export function getDomain(id: DomainId) {
  return DOMAINS.find((d) => d.id === id)!;
}

export function getFormationSession(id: SessionId) {
  return FORMATION_SESSIONS.find((s) => s.id === id)!;
}

export function getProfileTechnologies() {
  return [...new Set(TECHNOLOGIES.flatMap((group) => group.items))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  );
}

export const SKILL_LEVEL_LABELS: Record<'beginner' | 'experienced', string> = {
  beginner: 'Débutant',
  experienced: 'Je développe déjà',
};
