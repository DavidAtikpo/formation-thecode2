import type { IconName } from '@/app/components/SectionIcon';

export const ECOSYSTEM_TAGLINE = 'Former. Connecter. Livrer.';

export const ECOSYSTEM_INTRO =
  'The Code² ne se limite pas à la formation : nous formons des professionnels du digital, développons des solutions sur mesure et aidons les entreprises à recruter des profils fiables.';

export type EcosystemPillar = {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  desc: string;
  href: string;
  cta: string;
  accent: 'brand' | 'violet';
};

export const ECOSYSTEM_PILLARS: EcosystemPillar[] = [
  {
    id: 'formation',
    icon: 'graduation',
    title: 'Se former',
    subtitle: 'Formation pratique en ligne',
    desc: 'Apprenez le développement web, le mobile et le digital en codant de vrais projets — avec encadrement et certificat.',
    href: '/compte',
    cta: "S'inscrire à la formation",
    accent: 'brand',
  },
  {
    id: 'studio',
    icon: 'rocket',
    title: 'Studio',
    subtitle: 'On développe pour vous',
    desc: 'Site, application, outil métier ou automatisation : décrivez votre besoin, nous livrons en méthode agile.',
    href: '/studio',
    cta: 'Demander un devis',
    accent: 'violet',
  },
  {
    id: 'entreprises',
    icon: 'globe',
    title: 'Entreprises',
    subtitle: 'Recrutez des profils fiables',
    desc: 'Publiez une offre ou confiez-nous votre recherche : accédez à des profils formés et évalués par The Code².',
    href: '/entreprises',
    cta: 'Publier une offre',
    accent: 'brand',
  },
];

export const STUDIO_SERVICES: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'globe',
    title: 'Sites & applications web',
    desc: 'Vitrine, e-commerce, plateforme sur mesure — responsive, rapide et prête pour la production.',
  },
  {
    icon: 'smartphone',
    title: 'Applications mobiles',
    desc: 'Apps iOS et Android, ou solutions cross-platform adaptées à votre audience.',
  },
  {
    icon: 'cog',
    title: 'Outils & automatisation',
    desc: 'CRM léger, tableaux de bord, intégrations API, workflows — pour gagner du temps au quotidien.',
  },
  {
    icon: 'refresh',
    title: 'Maintenance & refonte',
    desc: 'Amélioration d\'un existant, correction de bugs, migration technique ou refonte complète.',
  },
];

export const STUDIO_PROCESS: { step: string; title: string; desc: string }[] = [
  {
    step: '1',
    title: 'Vous décrivez le besoin',
    desc: 'Objectif, public cible, fonctionnalités clés et délais souhaités — via le formulaire ou WhatsApp.',
  },
  {
    step: '2',
    title: 'Nous proposons un plan',
    desc: 'Périmètre, étapes, délai et budget transparents. Pas de surprise en cours de route.',
  },
  {
    step: '3',
    title: 'Développement en sprints',
    desc: 'Comme en entreprise : points réguliers, livraisons intermédiaires, ajustements si besoin.',
  },
  {
    step: '4',
    title: 'Livraison & suivi',
    desc: 'Mise en production, formation à l\'utilisation et option de maintenance continue.',
  },
];

export const ENTREPRISE_OFFERS: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'globe',
    title: 'Publier une offre d\'emploi',
    desc: 'Décrivez le poste : nous diffusons auprès de notre réseau de profils qualifiés.',
  },
  {
    icon: 'users',
    title: 'Parcourir les profils',
    desc: 'Consultez des développeurs, créateurs et experts SEO — formés ou validés par The Code².',
  },
  {
    icon: 'wrench',
    title: 'Recrutement assisté',
    desc: 'Confiez-nous la présélection : nous shortlistons les profils qui correspondent à votre besoin.',
  },
  {
    icon: 'rocket',
    title: 'Mission via le Studio',
    desc: 'Besoin d\'une équipe pour un projet ? Le Studio The Code² peut prendre en charge le développement.',
  },
];

export const ENTREPRISE_WHY: { title: string; desc: string }[] = [
  {
    title: 'Des profils qu\'on connaît',
    desc: 'Nous formons, encadrons ou évaluons les profils — pas des CV anonymes tirés au hasard.',
  },
  {
    title: 'Compétences pratiques',
    desc: 'Nos développeurs apprennent en livrant de vrais projets, en méthode agile, avec les outils du métier.',
  },
  {
    title: 'Écosystème complet',
    desc: 'Formation, développement sur mesure et recrutement — un seul interlocuteur pour vos besoins tech.',
  },
];

export const ECOSYSTEM_LOOP = [
  'Nous formons des professionnels compétents',
  'Le Studio livre des projets concrets',
  'Les entreprises recrutent des profils fiables',
];
