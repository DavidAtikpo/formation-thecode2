'use client';

import Link from 'next/link';
import BinaryNeuralAnimation from '@/app/components/BinaryNeuralAnimation';
import EcosystemContactForm from '@/app/components/EcosystemContactForm';
import { MotionHero, MotionItem, MotionSection, MotionStagger } from '@/app/components/Motion';
import SectionIcon from '@/app/components/SectionIcon';
import { CONTACT_SUBJECTS } from '@/app/lib/contact-config';
import { STUDIO_PROCESS, STUDIO_SERVICES } from '@/app/lib/ecosystem-config';

const STUDIO_SUBJECT = CONTACT_SUBJECTS.find((s) => s.id === 'studio')!.label;

export default function StudioPage() {
  return (
    <>
      <BinaryNeuralAnimation variant="page" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-10 sm:px-5 sm:pb-12">
        <div className="space-y-8 sm:space-y-10">
          <MotionHero className="relative -mx-3 overflow-hidden px-3 pb-6 pt-7 text-center sm:-mx-5 sm:px-5 sm:pb-8 sm:pt-10">
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,_rgba(36,27,255,0.18)_0%,_transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#0a0b1e]/15 via-[#0a0b1e]/35 to-[#0a0b1e]/55" />
            <div className="relative z-10">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-400 sm:text-xs">
                The Code² Studio
              </p>
              <h1 className="mb-3 text-2xl font-extrabold sm:text-4xl">
                <span className="bg-gradient-to-r from-violet-300 to-brand-400 bg-clip-text text-transparent">
                  On développe
                </span>
                <span className="mt-0.5 block text-white">votre solution</span>
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Vous avez un projet digital — site, application, outil métier — mais pas d&apos;équipe
                technique ? The Code² conçoit, développe et livre votre solution en méthode agile,
                avec une équipe encadrée et des points réguliers.
              </p>
            </div>
          </MotionHero>

          <MotionSection>
            <SectionTitle>Pour qui ?</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Entrepreneurs, PME, associations, startups ou porteurs de projet qui veulent{' '}
              <strong className="font-medium text-slate-200">passer de l&apos;idée au produit</strong>{' '}
              sans recruter une équipe complète. Nous parlons votre langue, clarifions le besoin
              et livrons étape par étape.
            </p>
            <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {[
                'Lancer un site vitrine ou une boutique en ligne',
                'Créer une application web ou mobile',
                'Automatiser un processus interne',
                'Refondre ou corriger un existant',
              ].map((item) => (
                <MotionItem
                  key={item}
                  className="flex items-start gap-2 rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-3.5"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <p className="text-xs text-slate-300 sm:text-sm">{item}</p>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          <MotionSection>
            <SectionTitle>Ce que nous réalisons</SectionTitle>
            <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {STUDIO_SERVICES.map((service) => (
                <MotionItem
                  key={service.title}
                  className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 sm:p-5"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <SectionIcon name={service.icon} size="md" className="bg-violet-400/10 text-violet-300" />
                    <h3 className="text-sm font-semibold text-white sm:text-base">{service.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{service.desc}</p>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          <MotionSection>
            <SectionTitle>Comment ça se passe</SectionTitle>
            <MotionStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {STUDIO_PROCESS.map((step) => (
                <MotionItem
                  key={step.step}
                  className="flex items-start gap-2.5 rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-3.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-brand-600 text-xs font-bold sm:h-8 sm:w-8 sm:text-sm">
                    {step.step}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                    <p className="text-xs text-slate-400 sm:text-sm">{step.desc}</p>
                  </div>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          <MotionSection>
            <SectionTitle>Pourquoi The Code² ?</SectionTitle>
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
                Notre équipe ne se contente pas de coder : nous{' '}
                <strong className="font-medium text-slate-200">formons des développeurs en conditions réelles</strong>,
                encadrons les projets en sprints et livrons avec les mêmes outils qu&apos;en entreprise
                (Git, revues de code, déploiement). Votre projet bénéficie de cette rigueur — sans
                la lourdeur d&apos;une grande agence.
              </p>
              <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
                Une direction qui supervise, un formateur-directeur qui pilote, et une équipe de
                développeurs qui construit — comme en entreprise, à votre échelle.
              </p>
            </div>
          </MotionSection>

          <MotionSection className="mx-auto max-w-2xl">
            <SectionTitle>Décrivez votre projet</SectionTitle>
            <p className="mb-4 text-xs text-slate-400 sm:text-sm">
              Expliquez votre idée, vos objectifs et votre délai souhaité. Nous revenons vers vous
              avec des questions de cadrage et une proposition adaptée.
            </p>
            <EcosystemContactForm
              subject={STUDIO_SUBJECT}
              messagePlaceholder="Ex. : Je souhaite un site e-commerce pour vendre mes produits artisanaux. J'ai besoin de paiement Mobile Money, d'un catalogue et d'une page contact. Délai souhaité : 2 mois."
              submitLabel="Demander un devis"
            />
          </MotionSection>

          <MotionSection className="text-center">
            <p className="text-xs text-slate-500 sm:text-sm">
              Vous cherchez plutôt à vous former ?{' '}
              <Link href="/compte" className="text-brand-400 hover:underline">
                Inscription à la formation
              </Link>
            </p>
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
