import Link from 'next/link';
import Image from 'next/image';
import RealisationGrid from './components/RealisationGrid';
import { MotionHero, MotionItem, MotionSection, MotionStagger } from './components/Motion';
import SectionIcon, { type IconName } from './components/SectionIcon';
import {
  FORMATION_CATALOG,
  HOUR_SLOTS,
  TECHNOLOGIES,
  WEEK_DAYS,
  formatFcfa,
  type CatalogGroup,
} from './lib/formation-config';
import { ECOSYSTEM_INTRO, ECOSYSTEM_LOOP, ECOSYSTEM_PILLARS, ECOSYSTEM_TAGLINE } from './lib/ecosystem-config';

const ROBOTICS_KITS = [
  {
    src: '/images/kit-electronique.webp',
    alt: 'Kit électronique inclus : breadboard, afficheurs, fils et composants',
    width: 800,
    height: 800,
  },
  {
    src: '/images/kit-arduino.jpg',
    alt: 'Kit Arduino inclus : carte, breadboard, capteurs, LEDs et modules',
    width: 554,
    height: 554,
  },
  {
    src: '/images/kit-boite.jpg',
    alt: 'Boîte de composants du kit robotique inclus',
    width: 416,
    height: 480,
  },
];

type PromoCopy = {
  src: string;
  alt: string;
  title: string;
  kicker: string;
  groups: { title: string; items: string[] }[];
  notes?: string[];
  footer: string;
};

const SALLE_PROMO: PromoCopy = {
  src: '/images/salle-de-formation.jpg',
  alt: 'Salle de formation THE CODE CODE : cours en présentiel, formateurs et travaux pratiques',
  title: 'Salle de formation',
  kicker: 'Apprendre · Pratiquer · Réussir',
  groups: [
    {
      title: 'Nos formations',
      items: [
        'Informatique et développement web',
        'Robotique et intelligence artificielle',
        'Design graphique et digital',
        'Bureautique',
        'Réseaux et sécurité',
        'Autres formations sur mesure',
      ],
    },
  ],
  notes: ['Formateurs experts', 'Matériel moderne', 'Travaux pratiques', 'Attestation à la fin'],
  footer: 'Développez vos compétences pour un avenir meilleur.',
};

const CATALOG_VISUALS: Partial<Record<CatalogGroup['id'], PromoCopy>> = {
  office_design: {
    src: '/images/bureautique-design-digital.jpg',
    alt: 'Bureautique, design et digital : Office, graphisme, développement web et présence en ligne',
    title: 'Bureautique, design et digital',
    kicker: 'Créez · Innovez · Développez',
    groups: [
      {
        title: 'Bureautique',
        items: ['Traitement de texte', 'Tableur', 'Présentation', 'Impression et scan'],
      },
      {
        title: 'Design',
        items: ['Graphisme', 'Création visuelle', 'Design web', 'Identité visuelle'],
      },
      {
        title: 'Digital',
        items: ['Développement web', 'Applications mobiles', 'Marketing digital', 'Solutions e-commerce'],
      },
    ],
    footer: 'Bureautique, design et digital : ensemble vers le numérique.',
  },
  robotics: {
    src: '/images/robotique.jpg',
    alt: 'Robotique : robots éducatifs, bras industriels, automatisation et innovation',
    title: 'Robotique',
    kicker: 'Innover · Automatiser · Construire l’avenir',
    groups: [
      {
        title: 'Nos solutions',
        items: [
          'Robotique industrielle',
          'Robotique éducative',
          'Robotique mobile',
          'Automatisation intelligente',
        ],
      },
      {
        title: 'Automatisation et innovation',
        items: ['Automatisation', 'Drones', 'Robots mobiles', 'Solutions sur mesure'],
      },
    ],
    notes: ['Apprendre', 'Programmer', 'Innover'],
    footer: 'Des machines plus intelligentes, pour un monde meilleur.',
  },
};

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'wrench', title: '100 % pratique', desc: 'Vous codez, construisez et déployez — pas de longs discours ni de cours théoriques à l\'infini' },
  { icon: 'laptop', title: 'En ligne et en présentiel', desc: 'Suivez les cours à distance ou sur place, selon votre parcours' },
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
  { icon: 'calendar', label: 'Date de début par email' },
  { icon: 'clock', label: '3 jours / semaine' },
  { icon: 'laptop', label: 'En ligne et en présentiel' },
  { icon: 'lightbulb', label: '2 rencontres avant la formation' },
  { icon: 'graduation', label: 'Certificat inclus' },
];

const STEPS = [
  { num: '1', title: 'Créez votre compte', desc: 'Inscrivez-vous en quelques minutes' },
  { num: '2', title: 'Vérifiez votre email', desc: 'Confirmez votre adresse via le lien reçu' },
  { num: '3', title: 'Choisissez votre parcours', desc: 'Développement mobile ou fullstack, 4 mois. La date de début arrive par email' },
  { num: '4', title: 'Configurez votre planning', desc: 'Domaine et créneaux horaires (3 jours / semaine)' },
  { num: '5', title: 'Finalisez l\'inscription', desc: 'Validez le formulaire complet' },
  { num: '6', title: 'Payez depuis votre espace', desc: 'Inscription gratuite. Formation 200 000 F CFA en 3 tranches — FedaPay, Stripe ou crypto' },
  { num: '7', title: '2 rencontres de préparation', desc: 'Design Thinking, Scrum et installation des outils — avant le début de votre session' },
  { num: '8', title: 'Commencez la formation', desc: 'Démarrage à la date communiquée par email' },
];

const WEB_OFFERS = FORMATION_CATALOG.find((group) => group.id === 'web_mobile')?.courses ?? [];

const PAYMENT_METHODS: { icon: IconName; name: string; desc: string; tag: string }[] = [
  { icon: 'smartphone', name: 'FedaPay', desc: 'Mobile Money, carte bancaire locale', tag: 'FCFA' },
  { icon: 'credit', name: 'Stripe', desc: 'Visa, Mastercard, carte internationale', tag: 'USD' },
  { icon: 'trending', name: 'Crypto', desc: 'BTC, USDT, ETH et autres cryptomonnaies', tag: 'USD' },
];

export default function HomePage() {
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
              Lancez votre avenir
            </p>
            <h1 className="mb-3 text-2xl font-extrabold leading-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-brand-600 to-gold-500 bg-clip-text text-transparent">
                Formations professionnelles
              </span>
              <span className="mt-0.5 block text-slate-900">THE CODE CODE</span>
            </h1>
            <p className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:mb-5 sm:text-base">
              Apprenez en <strong className="font-medium text-slate-900">pratiquant</strong>, en ligne
              ou en présentiel. Développement web et mobile, bureautique, design digital et
              robotique — avec un formateur à vos côtés.
            </p>

            <MotionStagger className="mb-5 flex flex-wrap justify-center gap-1.5 sm:mb-6 sm:gap-2">
              {HERO_BADGES.map((badge) => (
                <MotionItem
                  key={badge.label}
                  className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs"
                >
                  <SectionIcon name={badge.icon} size="sm" variant="plain" />
                  {badge.label}
                </MotionItem>
              ))}
            </MotionStagger>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="/compte"
                className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 glow-brand sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
              >
                S&apos;inscrire maintenant
              </Link>
              <Link
                href="/connexion"
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
        </MotionHero>

        <MotionSection>
          <PromoSplit promo={SALLE_PROMO} priority />
        </MotionSection>

        {/* Pourquoi */}
        <MotionSection>
          <SectionTitle>Pourquoi THE CODE CODE ?</SectionTitle>
          <p className="mb-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
            Chez THE CODE CODE, la formation repose sur la{' '}
            <strong className="font-medium text-slate-800">pratique</strong>, pas sur la lecture
            passive, les longs discours ou des heures de théorie sans application. Vous
            apprenez en construisant de vrais projets, guidé par un formateur.
          </p>
          <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            {FEATURES.map((f) => (
              <MotionItem
                key={f.title}
                className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 sm:rounded-xl sm:p-3.5"
              >
                <SectionIcon name={f.icon} size="md" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{f.title}</h3>
                  <p className="text-xs text-slate-600 sm:text-sm">{f.desc}</p>
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
        </MotionSection>

        {/* Écosystème THE CODE CODE */}
        <MotionSection>
          <SectionTitle>Plus qu&apos;une formation</SectionTitle>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-400 sm:text-sm">
            {ECOSYSTEM_TAGLINE}
          </p>
          <p className="mb-5 max-w-2xl text-xs leading-relaxed text-slate-600 sm:mb-6 sm:text-sm">
            {ECOSYSTEM_INTRO}
          </p>
          <MotionStagger className="grid grid-cols-1 gap-3 sm:max-w-xl sm:gap-4">
            {ECOSYSTEM_PILLARS.map((pillar) => (
              <MotionItem
                key={pillar.id}
                className={`flex flex-col rounded-xl border p-4 sm:p-5 ${
                  pillar.accent === 'gold'
                    ? 'border-gold-400/30 bg-gold-400/5'
                    : 'border-brand-400/25 bg-brand-400/5'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <SectionIcon name={pillar.icon} size="md" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{pillar.title}</h3>
                    <p className="text-[11px] text-slate-500 sm:text-xs">{pillar.subtitle}</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
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

        <MotionSection>
          <SectionTitle>Date de début</SectionTitle>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
            Il n&apos;y a pas de date à choisir à l&apos;inscription. La date de début vous sera
            communiquée par email. Deux rencontres de préparation (Design Thinking et Scrum) ont
            lieu avant le démarrage.
          </p>
        </MotionSection>

        {/* Préparation avant la formation */}
        <MotionSection>
          <SectionTitle>Avant de commencer la formation</SectionTitle>
          <p className="mb-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
            Avant le début de votre session, vous participerez à{' '}
            <strong className="font-medium text-slate-800">deux rencontres de préparation</strong>{' '}
            obligatoires. Elles posent les bases méthodologiques et techniques pour aborder sereinement
            la formation technique. Vous saurez comment réfléchir un projet, travailler en équipe
            et utiliser les bons outils dès le premier jour de cours.
          </p>

          <MotionStagger className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:gap-4">
            {PREP_SESSIONS.map((session) => (
              <MotionItem
                key={session.title}
                className="rounded-lg border border-gold-400/20 bg-gold-400/5 p-3 sm:rounded-xl sm:p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <SectionIcon name={session.icon} size="sm" className="bg-gold-400/10 text-gold-700" />
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{session.title}</h3>
                  <span className="rounded-full bg-gold-400/20 px-2.5 py-0.5 text-xs font-medium text-gold-700">
                    {session.tag}
                  </span>
                </div>
                <p className="mb-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{session.intro}</p>
                <ul className="space-y-1">
                  {session.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs text-slate-600 sm:text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </MotionItem>
            ))}
          </MotionStagger>

          <div className="mt-4 sm:mt-5">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900 sm:gap-2 sm:text-base">
              <SectionIcon name="toolbox" size="sm" />
              Outils nécessaires pour la formation
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Pas besoin d&apos;être équipé dès l&apos;inscription : lors de la deuxième séance, nous
              vous guidons pas à pas pour installer et configurer chaque outil. Voici ce que vous
              utiliserez tout au long du parcours :
            </p>
            <MotionStagger className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
              {TOOL_CATEGORIES.map((cat) => (
                <MotionItem key={cat.title} className="rounded-lg border border-slate-200 p-2.5 sm:p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <SectionIcon name={cat.icon} size="sm" />
                    <h4 className="text-xs font-semibold text-brand-600 sm:text-sm">{cat.title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {cat.tools.map((tool) => (
                      <li key={tool.name}>
                        <p className="text-xs font-medium text-slate-800 sm:text-sm">{tool.name}</p>
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
                    <h4 className="text-xs font-semibold text-slate-900 sm:text-sm">{req.title}</h4>
                  </div>
                  <dl className="space-y-1.5">
                    {req.specs.map((spec) => (
                      <div key={spec.label}>
                        <dt className="text-xs font-medium text-brand-600">{spec.label}</dt>
                        <dd className="text-xs leading-relaxed text-slate-600">{spec.value}</dd>
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

        {FORMATION_CATALOG.map((group) => (
          <CatalogBlock key={group.id} group={group} visual={CATALOG_VISUALS[group.id]} />
        ))}

        <MotionSection>
          <SectionTitle>Nos réalisations</SectionTitle>
          <p className="mb-4 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
            Objets, montages et moments de clôture sortis de l’atelier THE CODE CODE.
          </p>
          <RealisationGrid />
        </MotionSection>

        {/* Technologies */}
        <MotionSection>
          <TechStack />
        </MotionSection>

        {/* Tarifs + Planning */}
        <MotionSection className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <SectionTitle>Formules & tarifs</SectionTitle>
            <p className="mb-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Développement mobile ou fullstack, sur 4 mois, en ligne ou en présentiel.
            </p>
            <MotionStagger className="space-y-3">
              {WEB_OFFERS.map((course) => (
                <MotionItem key={course.code}>
                  <div className="rounded-lg border border-slate-200 p-3 sm:rounded-xl sm:p-3.5">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{course.title}</h3>
                      <span className="shrink-0 text-sm font-semibold text-gold-700">
                        {formatFcfa(course.priceFcfa)} F CFA
                      </span>
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-slate-600 sm:text-sm">{course.details}</p>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs sm:text-sm">
                      <span className="font-medium uppercase tracking-wide text-slate-500">{course.duration}</span>
                      <span className="font-medium text-emerald-700">Inscription gratuite</span>
                    </div>
                  </div>
                </MotionItem>
              ))}
            </MotionStagger>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
              Les 200&nbsp;000 F CFA couvrent l&apos;encadrement, les cours et les projets pratiques.
              Paiement via FedaPay (FCFA), Stripe (carte) ou crypto.
            </p>
          </div>

          <div>
            <SectionTitle>Planning flexible</SectionTitle>
            <p className="mb-3 text-xs text-slate-600 sm:text-sm">
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
                    className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 sm:px-2.5 sm:py-1 sm:text-xs"
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
                    className="rounded-md border border-brand-400/20 bg-brand-400/5 px-2 py-0.5 text-[11px] text-brand-700 sm:px-2.5 sm:py-1 sm:text-xs"
                  >
                    {slot.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 hidden border-t border-slate-200 pt-6 lg:block">
              <SectionTitle>Moyens de paiement disponibles</SectionTitle>
              <div className="space-y-2 sm:space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.name}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 sm:rounded-xl sm:p-3.5"
                  >
                    <SectionIcon name={method.icon} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 sm:text-base">{method.name}</p>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 sm:text-xs">
                          {method.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 sm:text-sm">{method.desc}</p>
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

          <p className="mb-8 max-w-2xl text-xs leading-relaxed text-slate-600 sm:mb-10 sm:text-sm">
            Une direction qui pilote le programme, un directeur-formateur à vos côtés au quotidien,
            et une équipe de développeurs qui encadre les projets pratiques — comme en entreprise.
          </p>

          <div className="mb-8 flex flex-wrap items-start justify-center gap-4 sm:mb-10 sm:gap-6">
              <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-slate-200 bg-white shadow-lg sm:h-32 sm:w-32">
                  <Image
                    src="/images/superieur.png"
                    alt="Nestor Tsala — superviseur THE CODE CODE"
                    fill
                    className="object-cover object-top"
                    sizes="128px"
                  />
                </div>
                <p className="mt-2 max-w-[7.5rem] text-xs font-semibold text-slate-900 sm:mt-3 sm:max-w-none sm:text-sm">
                  Nestor Tsala
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">Superviseur</p>
              </div>
              <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-brand-400/40 shadow-lg shadow-brand-500/10 ring-2 ring-brand-400/25 sm:h-32 sm:w-32">
                  <Image
                    src="/images/formateur.png"
                    alt="David Atikpo — formateur THE CODE CODE"
                    fill
                    className="object-cover object-[center_20%]"
                    sizes="128px"
                  />
                </div>
                <p className="mt-2 max-w-[7.5rem] text-xs font-semibold text-brand-600 sm:mt-3 sm:max-w-none sm:text-sm">
                  David Atikpo
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">Formateur — directeur</p>
              </div>
              <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-gold-400/35 shadow-lg sm:h-32 sm:w-32">
                  <Image
                    src="/images/ben-anitcheou.png"
                    alt="Ben Anitcheou — développeur THE CODE CODE"
                    fill
                    className="object-cover object-center"
                    sizes="128px"
                  />
                </div>
                <p className="mt-2 max-w-[7.5rem] text-xs font-semibold text-slate-900 sm:mt-3 sm:max-w-none sm:text-sm">
                  Ben Anitcheou
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">Développeur</p>
              </div>
              <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-gold-400/35 shadow-lg sm:h-32 sm:w-32">
                  <Image
                    src="/images/bernardin-nsougan.png"
                    alt="Bernardin N'SOUGAN Gabiev — développeur THE CODE CODE"
                    fill
                    className="object-cover object-[center_15%]"
                    sizes="128px"
                  />
                </div>
                <p className="mt-2 max-w-[9rem] text-xs font-semibold leading-snug text-slate-900 sm:mt-3 sm:max-w-none sm:text-sm">
                  Bernardin N&apos;SOUGAN Gabiev
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">Développeur</p>
              </div>
          </div>

          <MotionItem className="overflow-hidden rounded-xl border border-slate-200 sm:rounded-2xl">
            <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
              <Image
                src="/images/equipe-developpeurs.png"
                alt="Équipe développeur THE CODE CODE"
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
                className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 sm:rounded-xl sm:p-3.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-600 sm:text-sm">{step.desc}</p>
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
        </MotionSection>

        {/* CTA final + contact */}
        <MotionSection className="rounded-xl border border-brand-400/20 bg-gradient-to-b from-brand-400/10 to-gold-400/10 p-4 text-center sm:rounded-2xl sm:p-6">
          <h2 className="mb-1.5 text-lg font-bold sm:text-xl">Prêt à commencer ?</h2>
          <p className="mx-auto mb-4 max-w-md text-xs text-slate-600 sm:mb-5 sm:text-sm">
            Rejoignez THE CODE CODE et développez les compétences dont vous avez besoin pour réussir
            dans le numérique.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              href="/compte"
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
            >
              Commencer l&apos;inscription
            </Link>
            <a
              href="https://wa.me/22892591228"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
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

function CatalogBlock({
  group,
  visual,
}: {
  group: CatalogGroup;
  visual?: PromoCopy;
}) {
  return (
    <MotionSection>
      <SectionTitle>{group.title}</SectionTitle>
      <p className="mb-4 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">{group.intro}</p>
      {visual && (
        <div className="mb-4">
          <PromoSplit promo={visual} />
        </div>
      )}
      {group.id === 'robotics' && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
            Kits inclus
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ROBOTICS_KITS.map((kit) => (
              <div
                key={kit.src}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <Image
                  src={kit.src}
                  alt={kit.alt}
                  width={kit.width}
                  height={kit.height}
                  className="h-auto w-full bg-white object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <CatalogTable group={group} />
    </MotionSection>
  );
}

function PromoSplit({ promo, priority = false }: { promo: PromoCopy; priority?: boolean }) {
  return (
    <div className="grid items-start gap-3 lg:grid-cols-2 lg:gap-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Image
          src={promo.src}
          alt={promo.alt}
          width={1024}
          height={576}
          className="h-auto w-full"
          priority={priority}
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-brand-400/30 bg-white shadow-sm">
        <div className="bg-brand-500 px-4 py-3 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-400">{promo.kicker}</p>
          <h3 className="mt-1 text-sm font-bold text-white sm:text-base">{promo.title}</h3>
          <div className="mt-2 h-1 w-14 rounded-full bg-gold-400" />
        </div>
        <div className="space-y-3 px-4 py-3 sm:px-5 sm:py-4">
          {promo.groups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-brand-600">{group.title}</p>
              <ul className="mt-1.5 space-y-1">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700 sm:text-sm">
                    <span className="mt-0.5 text-gold-700" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {promo.notes && (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {promo.notes.map((note) => (
                <li
                  key={note}
                  className="rounded-full border border-brand-200 bg-[#eef3fc] px-2.5 py-1 text-[11px] font-semibold text-brand-600"
                >
                  {note}
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-slate-200 pt-3 text-xs font-medium leading-relaxed text-slate-800 sm:text-sm">
            {promo.footer}
          </p>
        </div>
      </div>
    </div>
  );
}

function CatalogTable({ group }: { group: CatalogGroup }) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-400/30">
      <div className="bg-brand-500 px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400">
          THE CODE CODE
        </p>
        <h3 className="text-sm font-bold text-white sm:text-base">{group.title}</h3>
        <div className="mt-2 h-1 w-14 rounded-full bg-gold-400" />
      </div>
      <ul>
        {group.courses.map((course, index) => (
          <li
            key={course.code}
            className={`px-4 py-3 sm:px-5 ${index % 2 === 0 ? 'bg-white' : 'bg-[#eef3fc]'}`}
          >
            <div className="flex gap-3">
              <span className="w-8 shrink-0 pt-0.5 text-sm font-bold text-brand-600">{course.code}</span>
              <div className="min-w-0 flex-1 sm:flex sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                  <p className="text-xs text-slate-600">{course.details}</p>
                </div>
                <ul className="mt-2 shrink-0 space-y-0.5 sm:mt-0 sm:text-right">
                  {(course.tiers ?? [{ duration: course.duration, priceFcfa: course.priceFcfa }]).map((tier) => (
                    <li key={tier.duration} className="flex items-baseline justify-between gap-4 sm:justify-end">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {tier.duration}
                      </span>
                      <span className="text-sm font-semibold text-gold-700">
                        {formatFcfa(tier.priceFcfa)} F CFA
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-slate-600">Disponible en ligne et en présentiel.</p>
        <Link
          href={group.ctaHref}
          className="inline-flex items-center justify-center rounded-lg bg-gold-400 px-3 py-2 text-xs font-bold text-brand-600 transition hover:bg-gold-300 sm:text-sm"
        >
          {group.ctaLabel}
        </Link>
      </div>
    </div>
  );
}

function TechStack() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-400/30 bg-white shadow-sm">
      <div className="bg-brand-500 px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400">
          THE CODE CODE
        </p>
        <h2 className="mt-1 text-base font-bold text-white sm:text-lg">Technologies & langages</h2>
        <div className="mt-2 h-1 w-14 rounded-full bg-gold-400" />
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/80 sm:text-sm">
          Selon le parcours, vous manipulez les langages et outils utilisés en entreprise :
          frontend, backend, mobile, fullstack, digital, bureautique ou robotique.
        </p>
      </div>
      <MotionStagger className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-6">
        {TECHNOLOGIES.map((group, index) => (
          <MotionItem
            key={group.title}
            className={`bg-white p-4 sm:p-5 ${
              index < 3
                ? 'lg:col-span-2'
                : index === TECHNOLOGIES.length - 1
                  ? 'sm:col-span-2 lg:col-span-3'
                  : 'lg:col-span-3'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <SectionIcon name={group.icon} size="md" />
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{group.title}</h3>
              </div>
              <span className="text-[11px] font-bold tracking-wide text-gold-700">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-600 sm:text-sm">{group.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-brand-200 bg-[#eef3fc] px-2.5 py-1 text-[11px] font-semibold text-brand-600 sm:text-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </MotionItem>
        ))}
      </MotionStagger>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-base font-bold text-slate-900 sm:mb-4 sm:text-lg">{children}</h2>
  );
}

