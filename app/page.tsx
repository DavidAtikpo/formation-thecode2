import Link from 'next/link';
import Image from 'next/image';
import BinaryNeuralAnimation from './components/BinaryNeuralAnimation';
import { MotionHero, MotionItem, MotionSection, MotionStagger } from './components/Motion';
import SectionIcon, { type IconName } from './components/SectionIcon';
import {
  DURATIONS,
  DOMAINS,
  FORMATION_SESSIONS,
  HOUR_SLOTS,
  TECHNOLOGIES,
  WEEK_DAYS,
  formatUsd,
  getDurationPricing,
  getDurationTotalUsd,
  type Duration,
} from './lib/formation-config';
import { ECOSYSTEM_INTRO, ECOSYSTEM_LOOP, ECOSYSTEM_PILLARS, ECOSYSTEM_TAGLINE } from './lib/ecosystem-config';

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'wrench', title: '100 % pratique', desc: 'Vous codez, construisez et déployez — pas de longs discours ni de cours théoriques à l\'infini' },
  { icon: 'laptop', title: '100 % en ligne', desc: 'Formez-vous depuis chez vous, à votre rythme' },
  { icon: 'award', title: 'Certificat', desc: 'Certificat de fin de formation à la clôture' },
  { icon: 'users', title: 'Encadrement', desc: 'Suivi personnalisé tout au long du parcours' },
];

const PREP_SESSIONS: { icon: IconName; title: string; tag: string; intro: string; points: string[] }[] = [
  {
    icon: 'lightbulb',
    title: 'Design Thinking',
    tag: 'Séance 1',
    intro:
      'Avant d\'écrire la moindre ligne de code, apprenez à comprendre les vrais besoins des utilisateurs et à concevoir des solutions utiles.',
    points: [
      'Comprendre le problème : empathie, interviews et observation des usages',
      'Définir le besoin réel et formuler un challenge clair',
      'Idéation : brainstorming, croquis et prototypage rapide',
      'Tester et itérer avant de passer au développement',
    ],
  },
  {
    icon: 'refresh',
    title: 'Méthodologie Agile — Scrum',
    tag: 'Séance 2',
    intro:
      'Travaillez comme en entreprise : organisez vos projets en sprints courts, avec des objectifs clairs et un suivi régulier.',
    points: [
      'Les rôles Scrum : Product Owner, Scrum Master, équipe de développement',
      'Sprint planning, daily stand-up, revue et rétrospective',
      'Backlog produit, user stories et priorisation des tâches',
      'Gestion de projet visuelle avec tableaux Kanban',
    ],
  },
];

const TOOL_CATEGORIES: { icon: IconName; title: string; tools: { name: string; desc: string }[] }[] = [
  {
    icon: 'laptop',
    title: 'Environnement de travail',
    tools: [
      { name: 'VS Code', desc: 'Éditeur de code gratuit, extensions et débogage intégré' },
      { name: 'Terminal', desc: 'Ligne de commande pour naviguer, installer et lancer vos projets' },
      { name: 'Git & GitHub', desc: 'Versionner votre code, collaborer et sauvegarder vos travaux' },
    ],
  },
  {
    icon: 'globe',
    title: 'Développement web',
    tools: [
      { name: 'Node.js & npm', desc: 'Exécuter JavaScript côté serveur et gérer les dépendances' },
      { name: 'Navigateur (Chrome / Firefox)', desc: 'Outils développeur pour inspecter, tester et déboguer' },
      { name: 'Postman', desc: 'Tester vos API et comprendre les échanges client-serveur' },
    ],
  },
  {
    icon: 'message',
    title: 'Communication & suivi',
    tools: [
      { name: 'Google Meet / Zoom', desc: 'Sessions en direct avec votre formateur' },
      { name: 'WhatsApp', desc: 'Support rapide et échanges entre les cours' },
      { name: 'Notion / Trello', desc: 'Organiser vos notes, tâches et avancement de projet' },
    ],
  },
];

const SYSTEM_REQUIREMENTS: { icon: IconName; title: string; specs: { label: string; value: string }[] }[] = [
  {
    icon: 'monitor',
    title: 'Configuration minimale de l\'ordinateur',
    specs: [
      { label: 'Processeur', value: 'Intel Core i5 ou équivalent AMD Ryzen 5' },
      { label: 'Mémoire RAM', value: 'À partir de 8 Go' },
      { label: 'Espace disque', value: '256 Go minimum, de préférence en SSD pour de meilleures performances' },
      { label: 'Système', value: 'Windows 10+, macOS 10.15+ ou Linux (Ubuntu 20.04+)' },
      { label: 'Audio / vidéo', value: 'Micro ou casque + webcam (intégrée ou externe) pour les cours en direct' },
    ],
  },
  {
    icon: 'wifi',
    title: 'Connexion internet',
    specs: [
      { label: 'Minimum', value: '5 Mbit/s en téléchargement et 1 Mbit/s en envoi' },
      { label: 'Recommandé', value: '10 Mbit/s+ en téléchargement et 3 Mbit/s+ en envoi pour plus de fluidité' },
      { label: 'Stabilité', value: 'Connexion fixe (box internet ou fibre) de préférence — évitez une 4G instable' },
      { label: 'Usage', value: 'Sessions vidéo, téléchargement de logiciels, accès à GitHub et aux ressources en ligne' },
    ],
  },
];

const HERO_BADGES: { icon: IconName; label: string }[] = [
  { icon: 'wrench', label: '100 % pratique' },
  { icon: 'calendar', label: '3 sessions en 2026' },
  { icon: 'clock', label: '6 h / semaine' },
  { icon: 'laptop', label: '100 % en ligne' },
  { icon: 'lightbulb', label: '2 rencontres avant la formation' },
  { icon: 'graduation', label: 'Certificat inclus' },
];

const STEPS = [
  { num: '1', title: 'Créez votre compte', desc: 'Inscrivez-vous en quelques minutes' },
  { num: '2', title: 'Vérifiez votre email', desc: 'Confirmez votre adresse via le lien reçu' },
  { num: '3', title: 'Choisissez votre session', desc: 'Durée (2 sem., 3 ou 4 mois) puis date de début (5 juil., 3 août ou 1er sept.)' },
  { num: '4', title: 'Configurez votre planning', desc: 'Domaine et créneaux horaires (3 jours / semaine)' },
  { num: '5', title: 'Finalisez l\'inscription', desc: 'Validez le formulaire complet' },
  { num: '6', title: 'Payez depuis votre espace', desc: 'Frais d\'inscription puis de formation — FedaPay, Stripe ou crypto' },
  { num: '7', title: '2 rencontres de préparation', desc: 'Design Thinking, Scrum et installation des outils — avant le début de votre session' },
  { num: '8', title: 'Commencez la formation', desc: 'Démarrage du parcours technique à la date de votre session' },
];

const PAYMENT_METHODS: { icon: IconName; name: string; desc: string; tag: string }[] = [
  { icon: 'smartphone', name: 'FedaPay', desc: 'Mobile Money, carte bancaire locale', tag: 'FCFA' },
  { icon: 'credit', name: 'Stripe', desc: 'Visa, Mastercard, carte internationale', tag: 'USD' },
  { icon: 'trending', name: 'Crypto', desc: 'BTC, USDT, ETH et autres cryptomonnaies', tag: 'USD' },
];

export default function HomePage() {
  const highlightDuration = DURATIONS[0];

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
              Lancez votre avenir
            </p>
            <h1 className="mb-3 text-2xl font-extrabold leading-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-brand-300 to-violet-400 bg-clip-text text-transparent">
                Formation en ligne
              </span>
              <span className="mt-0.5 block text-white">The Code²</span>
            </h1>
            <p className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:mb-5 sm:text-base">
              Apprenez en <strong className="font-medium text-white">pratiquant</strong>, pas en
              lisant des tonnes de cours théoriques. The Code² vous met les mains dans le code
              dès le départ pour propulser votre carrière dans le web, le mobile et le digital.
            </p>

            <MotionStagger className="mb-5 flex flex-wrap justify-center gap-1.5 sm:mb-6 sm:gap-2">
              {HERO_BADGES.map((badge) => (
                <MotionItem
                  key={badge.label}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300 sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs"
                >
                  <SectionIcon name={badge.icon} size="sm" variant="plain" />
                  {badge.label}
                </MotionItem>
              ))}
            </MotionStagger>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="/compte"
                className="rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 glow-brand sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
              >
                S&apos;inscrire maintenant
              </Link>
              <Link
                href="/connexion"
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
        </MotionHero>

        {/* Pourquoi */}
        <MotionSection>
          <SectionTitle>Pourquoi The Code² ?</SectionTitle>
          <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
            Chez The Code², la formation repose sur la{' '}
            <strong className="font-medium text-slate-200">pratique</strong>, pas sur la lecture
            passive, les longs discours ou des heures de théorie sans application. Vous
            apprenez en construisant de vrais projets, guidé par un formateur.
          </p>
          <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            {FEATURES.map((f) => (
              <MotionItem
                key={f.title}
                className="flex items-start gap-2.5 rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-3.5"
              >
                <SectionIcon name={f.icon} size="md" />
                <div>
                  <h3 className="text-sm font-semibold text-white sm:text-base">{f.title}</h3>
                  <p className="text-xs text-slate-400 sm:text-sm">{f.desc}</p>
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
        </MotionSection>

        {/* Écosystème The Code² */}
        <MotionSection>
          <SectionTitle>Plus qu&apos;une formation</SectionTitle>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-400 sm:text-sm">
            {ECOSYSTEM_TAGLINE}
          </p>
          <p className="mb-5 max-w-2xl text-xs leading-relaxed text-slate-400 sm:mb-6 sm:text-sm">
            {ECOSYSTEM_INTRO}
          </p>
          <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {ECOSYSTEM_PILLARS.map((pillar) => (
              <MotionItem
                key={pillar.id}
                className={`flex flex-col rounded-xl border p-4 sm:p-5 ${
                  pillar.accent === 'violet'
                    ? 'border-violet-400/25 bg-violet-400/5'
                    : 'border-brand-400/25 bg-brand-400/5'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <SectionIcon name={pillar.icon} size="md" />
                  <div>
                    <h3 className="text-sm font-semibold text-white sm:text-base">{pillar.title}</h3>
                    <p className="text-[11px] text-slate-500 sm:text-xs">{pillar.subtitle}</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {pillar.desc}
                </p>
                <Link
                  href={pillar.href}
                  className="inline-flex items-center text-xs font-semibold text-brand-400 hover:underline sm:text-sm"
                >
                  {pillar.cta} →
                </Link>
              </MotionItem>
            ))}
          </MotionStagger>
          <ul className="mt-5 flex flex-col gap-1.5 sm:mt-6">
            {ECOSYSTEM_LOOP.map((line) => (
              <li key={line} className="flex items-start gap-2 text-xs text-slate-500 sm:text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {line}
              </li>
            ))}
          </ul>
        </MotionSection>

        {/* Sessions de formation */}
        <MotionSection>
          <SectionTitle>Sessions de formation 2026</SectionTitle>
          <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
            Choisissez votre durée (2 semaines, 3 mois ou 4 mois), puis la date de début qui vous
            convient : <strong className="font-medium text-slate-200">5 juillet</strong>,{' '}
            <strong className="font-medium text-slate-200">3 août</strong> ou{' '}
            <strong className="font-medium text-slate-200">1er septembre 2026</strong>. Deux rencontres
            de préparation (Design Thinking et Scrum) précèdent chaque session.
          </p>
          <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {FORMATION_SESSIONS.map((session) => (
              <MotionItem
                key={session.id}
                className="rounded-lg border border-brand-400/25 bg-brand-400/5 p-3 sm:rounded-xl sm:p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <SectionIcon name="calendar" size="sm" className="bg-brand-400/10 text-brand-300" />
                  <h3 className="text-sm font-semibold text-white sm:text-base">{session.tabLabel}</h3>
                </div>
                <p className="text-sm font-medium text-brand-300 sm:text-base">{session.period}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400 sm:text-xs">
                  Disponible en 2 sem., 3 mois ou 4 mois.
                </p>
              </MotionItem>
            ))}
          </MotionStagger>
        </MotionSection>

        {/* Préparation avant la formation */}
        <MotionSection>
          <SectionTitle>Avant de commencer la formation</SectionTitle>
          <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
            Avant le début de votre session, vous participerez à{' '}
            <strong className="font-medium text-slate-200">deux rencontres de préparation</strong>{' '}
            obligatoires. Elles posent les bases méthodologiques et techniques pour aborder sereinement
            la formation technique. Vous saurez comment réfléchir un projet, travailler en équipe
            et utiliser les bons outils dès le premier jour de cours.
          </p>

          <MotionStagger className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:gap-4">
            {PREP_SESSIONS.map((session) => (
              <MotionItem
                key={session.title}
                className="rounded-lg border border-violet-400/20 bg-violet-400/5 p-3 sm:rounded-xl sm:p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <SectionIcon name={session.icon} size="sm" className="bg-violet-400/10 text-violet-300" />
                  <h3 className="text-sm font-semibold text-white sm:text-base">{session.title}</h3>
                  <span className="rounded-full bg-violet-400/20 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                    {session.tag}
                  </span>
                </div>
                <p className="mb-2 text-xs leading-relaxed text-slate-300 sm:text-sm">{session.intro}</p>
                <ul className="space-y-1">
                  {session.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs text-slate-400 sm:text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </MotionItem>
            ))}
          </MotionStagger>

          <div className="mt-4 sm:mt-5">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white sm:gap-2 sm:text-base">
              <SectionIcon name="toolbox" size="sm" />
              Outils nécessaires pour la formation
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Pas besoin d&apos;être équipé dès l&apos;inscription : lors de la deuxième séance, nous
              vous guidons pas à pas pour installer et configurer chaque outil. Voici ce que vous
              utiliserez tout au long du parcours :
            </p>
            <MotionStagger className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
              {TOOL_CATEGORIES.map((cat) => (
                <MotionItem key={cat.title} className="rounded-lg border border-white/10 p-2.5 sm:p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <SectionIcon name={cat.icon} size="sm" />
                    <h4 className="text-xs font-semibold text-brand-300 sm:text-sm">{cat.title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {cat.tools.map((tool) => (
                      <li key={tool.name}>
                        <p className="text-xs font-medium text-slate-200 sm:text-sm">{tool.name}</p>
                        <p className="text-[11px] leading-relaxed text-slate-500 sm:text-xs">{tool.desc}</p>
                      </li>
                    ))}
                  </ul>
                </MotionItem>
              ))}
            </MotionStagger>
            <MotionStagger className="mt-3 grid grid-cols-1 gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3">
              {SYSTEM_REQUIREMENTS.map((req) => (
                <MotionItem
                  key={req.title}
                  className="rounded-lg border border-brand-400/20 bg-brand-400/5 p-2.5 sm:p-3"
                >
                  <div className="mb-2 flex items-center gap-1.5 sm:gap-2">
                    <SectionIcon name={req.icon} size="sm" />
                    <h4 className="text-xs font-semibold text-white sm:text-sm">{req.title}</h4>
                  </div>
                  <dl className="space-y-1.5">
                    {req.specs.map((spec) => (
                      <div key={spec.label}>
                        <dt className="text-xs font-medium text-brand-300">{spec.label}</dt>
                        <dd className="text-xs leading-relaxed text-slate-400">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </MotionItem>
              ))}
            </MotionStagger>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
              Vous n&apos;êtes pas sûr que votre matériel soit adapté ? Contactez-nous sur WhatsApp
              avant de vous inscrire, nous vérifierons ensemble.
            </p>
          </div>
        </MotionSection>

        {/* Domaines */}
        <MotionSection>
          <SectionTitle>Domaines de formation</SectionTitle>
          <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            {DOMAINS.map((d) => (
              <MotionItem
                key={d.id}
                className="rounded-lg border border-white/10 p-3 transition hover:border-brand-400/30 sm:rounded-xl"
              >
                <div className="mb-0.5 flex items-center gap-1.5 sm:gap-2">
                  <SectionIcon name={d.icon} size="sm" />
                  <h3 className="text-sm font-semibold text-brand-300">{d.label}</h3>
                </div>
                <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{d.description}</p>
              </MotionItem>
            ))}
          </MotionStagger>
        </MotionSection>

        {/* Technologies */}
        <MotionSection>
          <SectionTitle>Technologies & langages</SectionTitle>
          <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
            Selon le domaine choisi, vous manipulerez les langages et outils utilisés par les
            professionnels du numérique. Le programme s&apos;adapte à votre parcours (frontend,
            backend, mobile, fullstack ou digital).
          </p>
          <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {TECHNOLOGIES.map((group) => (
              <MotionItem
                key={group.title}
                className="rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-3.5"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <SectionIcon name={group.icon} size="sm" />
                  <h3 className="text-sm font-semibold text-brand-300">{group.title}</h3>
                </div>
                <p className="mb-2.5 text-xs leading-relaxed text-slate-500">{group.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-brand-400/20 bg-brand-400/5 px-2 py-0.5 text-[11px] font-medium text-brand-200 sm:text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
        </MotionSection>

        {/* Tarifs + Planning */}
        <MotionSection className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <SectionTitle>Formules & tarifs</SectionTitle>
            <MotionStagger className="space-y-3">
              {DURATIONS.map((d) => (
                <MotionItem key={d.id}>
                  <PriceRow
                    duration={d}
                    popular={d.id === highlightDuration.id}
                  />
                </MotionItem>
              ))}
            </MotionStagger>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
              Les frais d&apos;inscription couvrent l&apos;accès à la plateforme et le suivi
              administratif. Les frais de formation incluent l&apos;encadrement, les cours et les
              projets pratiques. Paiement via FedaPay (FCFA), Stripe (carte) ou crypto (USD).
            </p>
          </div>

          <div>
            <SectionTitle>Planning flexible</SectionTitle>
            <p className="mb-3 text-xs text-slate-400 sm:text-sm">
              Choisissez jusqu&apos;à 3 jours par semaine et un créneau horaire adapté à votre
              emploi du temps.
            </p>
            <div className="mb-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                Jours disponibles
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => (
                  <span
                    key={day.id}
                    className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-slate-300 sm:px-2.5 sm:py-1 sm:text-xs"
                  >
                    {day.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                Créneaux horaires
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {HOUR_SLOTS.map((slot) => (
                  <span
                    key={slot.id}
                    className="rounded-md border border-brand-400/20 bg-brand-400/5 px-2 py-0.5 text-[11px] text-brand-200 sm:px-2.5 sm:py-1 sm:text-xs"
                  >
                    {slot.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 hidden border-t border-white/10 pt-6 lg:block">
              <SectionTitle>Moyens de paiement disponibles</SectionTitle>
              <div className="space-y-2 sm:space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.name}
                    className="flex items-start gap-2.5 rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-3.5"
                  >
                    <SectionIcon name={method.icon} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white sm:text-base">{method.name}</p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300 sm:text-xs">
                          {method.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 sm:text-sm">{method.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionSection>

        {/* Notre équipe */}
        <MotionSection>
          <SectionTitle>Notre équipe</SectionTitle>

          <p className="mb-8 max-w-2xl text-xs leading-relaxed text-slate-400 sm:mb-10 sm:text-sm">
            Une direction qui pilote le programme, un directeur-formateur à vos côtés au quotidien,
            et une équipe de développeurs qui encadre les projets pratiques — comme en entreprise.
          </p>

          <div className="mb-8 flex flex-wrap items-start justify-center gap-4 sm:mb-10 sm:gap-6">
              <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-white/25 bg-white shadow-lg sm:h-32 sm:w-32">
                  <Image
                    src="/images/superieur.png"
                    alt="Nestor Tsala — superviseur The Code²"
                    fill
                    className="object-cover object-top"
                    sizes="128px"
                  />
                </div>
                <p className="mt-2 max-w-[7.5rem] text-xs font-semibold text-white sm:mt-3 sm:max-w-none sm:text-sm">
                  Nestor Tsala
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">Superviseur</p>
              </div>
              <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-brand-400/40 shadow-lg shadow-brand-500/10 ring-2 ring-brand-400/25 sm:h-32 sm:w-32">
                  <Image
                    src="/images/formateur.png"
                    alt="David Atikpo — formateur The Code²"
                    fill
                    className="object-cover object-[center_20%]"
                    sizes="128px"
                  />
                </div>
                <p className="mt-2 max-w-[7.5rem] text-xs font-semibold text-brand-300 sm:mt-3 sm:max-w-none sm:text-sm">
                  David Atikpo
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">Formateur — directeur</p>
              </div>
              <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-violet-400/35 shadow-lg sm:h-32 sm:w-32">
                  <Image
                    src="/images/ben-anitcheou.png"
                    alt="Ben Anitcheou — développeur The Code²"
                    fill
                    className="object-cover object-center"
                    sizes="128px"
                  />
                </div>
                <p className="mt-2 max-w-[7.5rem] text-xs font-semibold text-white sm:mt-3 sm:max-w-none sm:text-sm">
                  Ben Anitcheou
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">Développeur</p>
              </div>
              <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-violet-400/35 shadow-lg sm:h-32 sm:w-32">
                  <Image
                    src="/images/bernardin-nsougan.png"
                    alt="Bernardin N'SOUGAN Gabiev — développeur The Code²"
                    fill
                    className="object-cover object-[center_15%]"
                    sizes="128px"
                  />
                </div>
                <p className="mt-2 max-w-[9rem] text-xs font-semibold leading-snug text-white sm:mt-3 sm:max-w-none sm:text-sm">
                  Bernardin N&apos;SOUGAN Gabiev
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">Développeur</p>
              </div>
          </div>

          <MotionItem className="overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl">
            <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
              <Image
                src="/images/equipe-developpeurs.png"
                alt="Équipe développeur The Code²"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 1152px"
              />
            </div>
          </MotionItem>
        </MotionSection>

        {/* Comment s'inscrire */}
        <MotionSection>
          <SectionTitle>Comment s&apos;inscrire ?</SectionTitle>
          <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {STEPS.map((step) => (
              <MotionItem
                key={step.num}
                className="flex items-start gap-2.5 rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-3.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-xs font-bold sm:h-8 sm:w-8 sm:text-sm">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  <p className="text-xs text-slate-400 sm:text-sm">{step.desc}</p>
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
        </MotionSection>

        {/* CTA final + contact */}
        <MotionSection className="rounded-xl border border-brand-400/20 bg-gradient-to-b from-brand-400/10 to-violet-600/5 p-4 text-center sm:rounded-2xl sm:p-6">
          <h2 className="mb-1.5 text-lg font-bold sm:text-xl">Prêt à commencer ?</h2>
          <p className="mx-auto mb-4 max-w-md text-xs text-slate-400 sm:mb-5 sm:text-sm">
            Rejoignez The Code² et développez les compétences dont vous avez besoin pour réussir
            dans le numérique.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              href="/compte"
              className="rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
            >
              Commencer l&apos;inscription
            </Link>
            <a
              href="https://wa.me/22892591228"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
            >
              Questions ? WhatsApp
            </a>
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

function PriceRow({ duration, popular }: { duration: Duration; popular?: boolean }) {
  const pricing = getDurationPricing(duration);
  const total = getDurationTotalUsd(duration);

  return (
    <div
      className={`rounded-lg border p-3 sm:rounded-xl sm:p-3.5 ${
        popular
          ? 'border-brand-400/40 bg-brand-400/5 ring-1 ring-brand-400/20'
          : 'border-white/10'
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-white sm:text-base">{duration.label}</h3>
        <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-medium text-violet-300 sm:text-xs">
          {duration.highlight}
        </span>
        {pricing.personal && (
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 sm:text-xs">
            Personnelle
          </span>
        )}
        {popular && (
          <span className="rounded-full bg-brand-400/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-300 sm:text-xs">
            Populaire
          </span>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-400">{duration.subtitle}</p>
      <p className="mb-3 text-xs leading-relaxed text-slate-300 sm:text-sm">{duration.description}</p>
      <div className="space-y-1 border-t border-white/10 pt-2 text-xs sm:text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Inscription</span>
          <span className="text-emerald-300">Gratuite</span>
        </div>
        <div className="flex justify-between font-semibold text-brand-300">
          <span>Formation</span>
          <span>{formatUsd(total)} $</span>
        </div>
        <div className="space-y-0.5 border-t border-white/10 pt-1.5 text-[11px] text-slate-500">
          {pricing.installments.map((inst) => (
            <div key={inst.number} className="flex justify-between">
              <span>{inst.label}</span>
              <span>{formatUsd(inst.amountUsd)} $</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
