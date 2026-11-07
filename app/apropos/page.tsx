'use client';

import Link from 'next/link';
import { MotionHero, MotionItem, MotionSection, MotionStagger } from '@/app/components/Motion';
import SectionIcon, { type IconName } from '@/app/components/SectionIcon';
import { FORMATION_CATALOG } from '@/app/lib/formation-config';

const COURSE_COUNT = FORMATION_CATALOG.reduce((total, group) => total + group.courses.length, 0);

const VALUES: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'wrench',
    title: 'La pratique avant tout',
    desc: 'Pas de lecture passive, pas de longs discours ni de cours théoriques en tonne — vous apprenez en codant et en livrant des projets.',
  },
  {
    icon: 'users',
    title: 'Encadrement humain',
    desc: 'Un formateur vous suit, répond à vos questions et vous aide à progresser à votre rythme.',
  },
  {
    icon: 'globe',
    title: 'Accessible partout',
    desc: 'En ligne ou en présentiel, pour l\'Afrique et le monde — FedaPay, Stripe ou crypto.',
  },
  {
    icon: 'award',
    title: 'Résultats concrets',
    desc: 'Portfolio, compétences employables et certificat de fin de formation à la clôture.',
  },
];

const APPROACH: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'refresh',
    title: 'Méthode agile',
    desc: 'Organisation en sprints, revues régulières et travail structuré comme en entreprise.',
  },
  {
    icon: 'wrench',
    title: 'Outils professionnels',
    desc: 'VS Code, Git, GitHub, frameworks modernes — les mêmes outils que les équipes tech.',
  },
  {
    icon: 'graduation',
    title: 'Parcours progressif',
    desc: 'De l’initiation à l’informatique jusqu’aux parcours de 4 mois en développement mobile et fullstack.',
  },
  {
    icon: 'message',
    title: 'Support continu',
    desc: 'Sessions en direct, WhatsApp et suivi personnalisé tout au long du parcours.',
  },
];

const STATS: { value: string; label: string }[] = [
  { value: String(COURSE_COUNT), label: 'Formations au catalogue' },
  { value: 'Email', label: 'Date de début communiquée' },
  { value: '2 modes', label: 'En ligne et présentiel' },
  { value: '2', label: 'Rencontres de préparation' },
];

export default function AproposPage() {
  return (
    <>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-10 sm:px-5 sm:pb-12">
        <div className="space-y-8 sm:space-y-10">
          {/* Hero */}
          <MotionHero className="relative -mx-3 overflow-hidden px-3 pb-8 pt-7 text-center sm:-mx-5 sm:px-5 sm:pb-10 sm:pt-10">
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,_rgba(27, 63, 166,0.18)_0%,_transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/40 via-white/80 to-white" />
            <div className="relative z-10">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
                Qui sommes-nous ?
              </p>
              <h1 className="mb-3 text-2xl font-extrabold leading-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-brand-600 to-gold-500 bg-clip-text text-transparent">
                  À propos de
                </span>
                <span className="mt-0.5 block text-slate-900">THE CODE CODE</span>
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                THE CODE CODE est une école de formation en ligne et en présentiel, basée sur la{' '}
                <strong className="font-medium text-slate-900">pratique</strong>. Développement web,
                mobile, bureautique, design digital et robotique — vous apprenez en faisant, avec
                un formateur.
              </p>
            </div>
          </MotionHero>

          {/* Chiffres clés */}
          <MotionSection>
            <MotionStagger className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {STATS.map((stat) => (
                <MotionItem
                  key={stat.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center sm:rounded-xl sm:p-4"
                >
                  <p className="text-xl font-bold text-brand-600 sm:text-2xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-slate-600 sm:text-xs">{stat.label}</p>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          {/* Notre mission */}
          <MotionSection>
            <SectionTitle>Notre mission</SectionTitle>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 sm:space-y-4 sm:text-sm">
              <p>
                Le numérique transforme le monde du travail. Pourtant, beaucoup de personnes motivées
                n&apos;ont pas accès à une formation de qualité, adaptée à leur réalité et à leur
                rythme de vie. THE CODE CODE est né pour combler ce fossé.
              </p>
              <p>
                Nous formons des développeurs, des profils bureautique et design, et des praticiens
                de la robotique, capables de créer et de livrer. Notre pédagogie privilégie
                l&apos;action : vous passez le maximum de temps à coder, tester et livrer — pas
                à écouter des heures de théorie sans mise en pratique immédiate.
              </p>
              <p>
                Que vous débutiez, que vous souhaitiez vous reconvertir ou monter en compétences,
                nous vous accompagnons de la première ligne de code jusqu&apos;à un portfolio
                solide et un certificat reconnu.
              </p>
            </div>
          </MotionSection>

          {/* Philosophie pratique */}
          <MotionSection className="rounded-xl border border-brand-400/25 bg-brand-400/5 p-4 sm:rounded-2xl sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <SectionIcon name="wrench" size="md" />
              <SectionTitle>Apprendre en faisant, pas en écoutant</SectionTitle>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
              <p>
                THE CODE CODE repose sur une conviction simple : on ne devient pas développeur en
                accumulant des PDF ou en regardant des heures de vidéos sans toucher au clavier.
              </p>
              <p>
                Ici, pas de formation « magistrale » remplie de discours et de théorie déconnectée
                du terrain. Chaque séance vous pousse à{' '}
                <strong className="font-medium text-slate-900">pratiquer immédiatement</strong> : écrire
                du code, résoudre des problèmes réels, construire des fonctionnalités et recevoir
                un retour direct de votre formateur.
              </p>
              <p>
                La théorie n&apos;est introduite que lorsqu&apos;elle sert un projet concret — et
                toujours suivie d&apos;une mise en application sur le champ.
              </p>
            </div>
          </MotionSection>

          {/* Notre approche */}
          <MotionSection>
            <SectionTitle>Notre approche pédagogique</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Chaque parcours commence par{' '}
              <strong className="font-medium text-slate-800">deux rencontres de préparation</strong>{' '}
              (Design Thinking et Scrum), puis enchaîne sur la formation technique de votre choix —
              toujours orientée projets et pratique.
            </p>
            <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {APPROACH.map((item) => (
                <MotionItem
                  key={item.title}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 sm:rounded-xl sm:p-3.5"
                >
                  <SectionIcon name={item.icon} size="md" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{item.title}</h3>
                    <p className="text-xs text-slate-600 sm:text-sm">{item.desc}</p>
                  </div>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          {/* Nos valeurs */}
          <MotionSection>
            <SectionTitle>Nos valeurs</SectionTitle>
            <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {VALUES.map((v) => (
                <MotionItem
                  key={v.title}
                  className="flex items-start gap-2.5 rounded-lg border border-brand-400/20 bg-brand-400/5 p-3 sm:rounded-xl sm:p-3.5"
                >
                  <SectionIcon name={v.icon} size="md" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{v.title}</h3>
                    <p className="text-xs text-slate-600 sm:text-sm">{v.desc}</p>
                  </div>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          <MotionSection>
            <SectionTitle>Date de début</SectionTitle>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              La date de début n&apos;est pas choisie lors de l&apos;inscription. Elle vous sera
              communiquée par email. La formation se suit en ligne ou en présentiel.
            </p>
          </MotionSection>

          {/* Pour qui */}
          <MotionSection>
            <SectionTitle>Pour qui ?</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              <AudienceCard
                icon="rocket"
                title="Débutants motivés"
                desc="Vous découvrez le code et souhaitez poser des bases solides avec un encadrement structuré."
              />
              <AudienceCard
                icon="refresh"
                title="En reconversion"
                desc="Vous changez de voie et voulez acquérir des compétences tech employables rapidement."
              />
              <AudienceCard
                icon="trending"
                title="En progression"
                desc="Vous avez déjà des bases et souhaitez monter en niveau avec des projets concrets."
              />
            </div>
          </MotionSection>

          {/* CTA */}
          <MotionSection className="rounded-xl border border-brand-400/20 bg-gradient-to-b from-brand-400/10 to-gold-400/10 p-4 text-center sm:rounded-2xl sm:p-6">
            <h2 className="mb-1.5 text-lg font-bold sm:text-xl">Rejoignez THE CODE CODE</h2>
            <p className="mx-auto mb-4 max-w-md text-xs text-slate-600 sm:mb-5 sm:text-sm">
              Créez votre compte, choisissez votre session et commencez votre parcours vers
              une carrière dans le numérique.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="/compte"
                className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
              >
                S&apos;inscrire maintenant
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
              >
                Voir les tarifs
              </Link>
            </div>
          </MotionSection>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-base font-bold text-slate-900 sm:mb-4 sm:text-lg">{children}</h2>
  );
}

function AudienceCard({
  icon,
  title,
  desc,
}: {
  icon: IconName;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 sm:rounded-xl sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <SectionIcon name={icon} size="sm" />
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
      </div>
      <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{desc}</p>
    </div>
  );
}
