'use client';

import Link from 'next/link';
import BinaryNeuralAnimation from '@/app/components/BinaryNeuralAnimation';
import { MotionHero, MotionItem, MotionSection, MotionStagger } from '@/app/components/Motion';
import SectionIcon, { type IconName } from '@/app/components/SectionIcon';
import { FORMATION_SESSIONS } from '@/app/lib/formation-config';

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
    desc: 'Formation 100 % en ligne, pensée pour l\'Afrique et le monde — FedaPay, Stripe ou crypto.',
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
    desc: 'De la découverte (2 semaines) au niveau senior (4 mois en formation personnelle).',
  },
  {
    icon: 'message',
    title: 'Support continu',
    desc: 'Sessions en direct, WhatsApp et suivi personnalisé tout au long du parcours.',
  },
];

const STATS: { value: string; label: string }[] = [
  { value: '5', label: 'Domaines de formation' },
  { value: '3', label: 'Sessions en 2026' },
  { value: '100 %', label: 'En ligne' },
  { value: '2', label: 'Rencontres de préparation' },
];

export default function AproposPage() {
  return (
    <>
      <BinaryNeuralAnimation variant="page" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-10 sm:px-5 sm:pb-12">
        <div className="space-y-8 sm:space-y-10">
          {/* Hero */}
          <MotionHero className="relative -mx-3 overflow-hidden px-3 pb-8 pt-7 text-center sm:-mx-5 sm:px-5 sm:pb-10 sm:pt-10">
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,_rgba(36,27,255,0.18)_0%,_transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#0a0b1e]/15 via-[#0a0b1e]/35 to-[#0a0b1e]/55" />
            <div className="relative z-10">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
                Qui sommes-nous ?
              </p>
              <h1 className="mb-3 text-2xl font-extrabold leading-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-brand-300 to-violet-400 bg-clip-text text-transparent">
                  À propos de
                </span>
                <span className="mt-0.5 block text-white">The Code²</span>
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                The Code² est une école de formation en ligne basée sur la{' '}
                <strong className="font-medium text-white">pratique</strong> — pas sur la lecture,
                les discours ou des cours théoriques à l&apos;infini. Vous apprenez en codant,
                en construisant et en déployant de vrais projets, où que vous soyez.
              </p>
            </div>
          </MotionHero>

          {/* Chiffres clés */}
          <MotionSection>
            <MotionStagger className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {STATS.map((stat) => (
                <MotionItem
                  key={stat.label}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center sm:rounded-xl sm:p-4"
                >
                  <p className="text-xl font-bold text-brand-300 sm:text-2xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{stat.label}</p>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          {/* Notre mission */}
          <MotionSection>
            <SectionTitle>Notre mission</SectionTitle>
            <div className="space-y-3 text-xs leading-relaxed text-slate-300 sm:space-y-4 sm:text-sm">
              <p>
                Le numérique transforme le monde du travail. Pourtant, beaucoup de personnes motivées
                n&apos;ont pas accès à une formation de qualité, adaptée à leur réalité et à leur
                rythme de vie. The Code² est né pour combler ce fossé.
              </p>
              <p>
                Nous formons des développeurs et des professionnels du digital capables de créer,
                déployer et maintenir des solutions web et mobiles. Notre pédagogie privilégie
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
            <div className="space-y-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
              <p>
                The Code² repose sur une conviction simple : on ne devient pas développeur en
                accumulant des PDF ou en regardant des heures de vidéos sans toucher au clavier.
              </p>
              <p>
                Ici, pas de formation « magistrale » remplie de discours et de théorie déconnectée
                du terrain. Chaque séance vous pousse à{' '}
                <strong className="font-medium text-white">pratiquer immédiatement</strong> : écrire
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
            <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Chaque parcours commence par{' '}
              <strong className="font-medium text-slate-200">deux rencontres de préparation</strong>{' '}
              (Design Thinking et Scrum), puis enchaîne sur la formation technique de votre choix —
              toujours orientée projets et pratique.
            </p>
            <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {APPROACH.map((item) => (
                <MotionItem
                  key={item.title}
                  className="flex items-start gap-2.5 rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-3.5"
                >
                  <SectionIcon name={item.icon} size="md" />
                  <div>
                    <h3 className="text-sm font-semibold text-white sm:text-base">{item.title}</h3>
                    <p className="text-xs text-slate-400 sm:text-sm">{item.desc}</p>
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
                    <h3 className="text-sm font-semibold text-white sm:text-base">{v.title}</h3>
                    <p className="text-xs text-slate-400 sm:text-sm">{v.desc}</p>
                  </div>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          {/* Sessions */}
          <MotionSection>
            <SectionTitle>Sessions de formation 2026</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Trois sessions sont programmées. Lors de votre inscription, vous choisissez celle qui
              correspond à votre calendrier. Deux rencontres de préparation auront lieu avant chaque
              date de début.
            </p>
            <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {FORMATION_SESSIONS.map((session) => (
                <MotionItem
                  key={session.id}
                  className="rounded-lg border border-violet-400/20 bg-violet-400/5 p-3 sm:rounded-xl sm:p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <SectionIcon name="calendar" size="sm" className="bg-violet-400/10 text-violet-300" />
                    <h3 className="text-sm font-semibold text-white">{session.label}</h3>
                  </div>
                  <p className="text-sm font-medium text-brand-300">{session.period}</p>
                </MotionItem>
              ))}
            </MotionStagger>
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
          <MotionSection className="rounded-xl border border-brand-400/20 bg-gradient-to-b from-brand-400/10 to-violet-600/5 p-4 text-center sm:rounded-2xl sm:p-6">
            <h2 className="mb-1.5 text-lg font-bold sm:text-xl">Rejoignez The Code²</h2>
            <p className="mx-auto mb-4 max-w-md text-xs text-slate-400 sm:mb-5 sm:text-sm">
              Créez votre compte, choisissez votre session et commencez votre parcours vers
              une carrière dans le numérique.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="/compte"
                className="rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
              >
                S&apos;inscrire maintenant
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
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
    <h2 className="mb-3 text-base font-bold text-white sm:mb-4 sm:text-lg">{children}</h2>
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
    <div className="rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <SectionIcon name={icon} size="sm" />
        <h3 className="text-sm font-semibold text-white sm:text-base">{title}</h3>
      </div>
      <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{desc}</p>
    </div>
  );
}
