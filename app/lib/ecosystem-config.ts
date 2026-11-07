import type { IconName } from '@/app/components/SectionIcon';

export const ECOSYSTEM_TAGLINE = 'Former. Connecter. Livrer.';

export const ECOSYSTEM_INTRO =
  'THE CODE CODE forme des professionnels du digital, en ligne ou en présentiel, avec un encadrement et un certificat.';

export type EcosystemPillar = {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  desc: string;
  href: string;
  cta: string;
  accent: 'brand' | 'gold';
};

export const ECOSYSTEM_PILLARS: EcosystemPillar[] = [
  {
    id: 'formation',
    icon: 'graduation',
    title: 'Se former',
    subtitle: 'En ligne et en présentiel',
    desc: 'Développement web et mobile, bureautique, design digital et robotique — en ligne ou sur place, avec encadrement et certificat.',
    href: '/compte',
    cta: "S'inscrire à la formation",
    accent: 'brand',
  },
];

export const ECOSYSTEM_LOOP = [
  'Nous formons des professionnels compétents',
  'La formation repose sur des projets concrets',
  'Un certificat atteste le parcours réalisé',
];
