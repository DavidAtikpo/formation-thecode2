'use client';

import Link from 'next/link';
import BinaryNeuralAnimation from '@/app/components/BinaryNeuralAnimation';
import PublicJobList from '@/app/components/PublicJobList';
import PublicTalentGrid from '@/app/components/PublicTalentGrid';
import EcosystemContactForm from '@/app/components/EcosystemContactForm';
import { MotionHero, MotionItem, MotionSection, MotionStagger } from '@/app/components/Motion';
import SectionIcon from '@/app/components/SectionIcon';
import { CONTACT_SUBJECTS } from '@/app/lib/contact-config';
import { ENTREPRISE_OFFERS, ENTREPRISE_WHY } from '@/app/lib/ecosystem-config';

const ENTREPRISES_SUBJECT = CONTACT_SUBJECTS.find((s) => s.id === 'entreprises')!.label;

export default function EntreprisesPage() {
  return (
    <>
      <BinaryNeuralAnimation variant="page" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-10 sm:px-5 sm:pb-12">
        <div className="space-y-8 sm:space-y-10">
          <MotionHero className="relative -mx-3 overflow-hidden px-3 pb-6 pt-7 text-center sm:-mx-5 sm:px-5 sm:pb-8 sm:pt-10">
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,_rgba(36,27,255,0.18)_0%,_transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#0a0b1e]/15 via-[#0a0b1e]/35 to-[#0a0b1e]/55" />
            <div className="relative z-10">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
                The Code² Entreprises
              </p>
              <h1 className="mb-3 text-2xl font-extrabold sm:text-4xl">
                <span className="bg-gradient-to-r from-brand-300 to-violet-400 bg-clip-text text-transparent">
                  Recrutez des profils
                </span>
                <span className="mt-0.5 block text-white">du numérique</span>
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Vous cherchez un développeur, un créateur de contenu ou un expert SEO ? The Code²
                met à votre disposition des profils formés, encadrés ou validés — pas des CV au hasard.
              </p>
            </div>
          </MotionHero>

          <MotionSection>
            <SectionTitle>Nos services aux entreprises</SectionTitle>
            <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {ENTREPRISE_OFFERS.map((offer) => (
                <MotionItem
                  key={offer.title}
                  className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-4 sm:p-5"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <SectionIcon name={offer.icon} size="md" className="bg-brand-400/10 text-brand-300" />
                    <h3 className="text-sm font-semibold text-white sm:text-base">{offer.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{offer.desc}</p>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionSection>

          <MotionSection>
            <SectionTitle>Pourquoi passer par The Code² ?</SectionTitle>
            <div className="space-y-3">
              {ENTREPRISE_WHY.map((item) => (
                <MotionItem
                  key={item.title}
                  className="rounded-lg border border-white/10 p-3 sm:rounded-xl sm:p-4"
                >
                  <h3 className="mb-1 text-sm font-semibold text-white sm:text-base">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{item.desc}</p>
                </MotionItem>
              ))}
            </div>
          </MotionSection>

          <MotionSection>
            <SectionTitle>Offres publiées</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Consultez les opportunités publiées par les entreprises partenaires du réseau The Code².
            </p>
            <PublicJobList />
          </MotionSection>

          <MotionSection>
            <SectionTitle>Profils disponibles</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Développeurs, créateurs de contenu, experts SEO, designers — consultez les profils
              validés par The Code².
            </p>
            <PublicTalentGrid />
          </MotionSection>

          <MotionSection>
            <SectionTitle>Besoin d&apos;un projet développé ?</SectionTitle>
            <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
              Si vous n&apos;avez pas encore d&apos;équipe et souhaitez externaliser un développement complet,
              notre{' '}
              <Link href="/studio" className="text-brand-400 hover:underline">
                Studio The Code²
              </Link>{' '}
              prend en charge la conception, le développement et la livraison de votre solution.
            </p>
          </MotionSection>

          <MotionSection className="mx-auto max-w-2xl">
            <SectionTitle>Publier une offre ou recruter</SectionTitle>
            <p className="mb-4 text-xs text-slate-400 sm:text-sm">
              Décrivez le poste ou le profil recherché, le type de contrat (CDI, freelance, stage…)
              et vos délais. Nous revenons vers vous avec des profils correspondants.
            </p>
            <EcosystemContactForm
              subject={ENTREPRISES_SUBJECT}
              messagePlaceholder="Ex. : Nous cherchons un développeur React junior en CDI, basé à Yaoundé ou en remote. Missions : maintenance de notre plateforme et nouvelles fonctionnalités. Démarrage souhaité : septembre 2026."
              submitLabel="Envoyer ma demande de recrutement"
            />
          </MotionSection>

          <MotionSection className="text-center">
            <p className="text-xs text-slate-500 sm:text-sm">
              Vous formez vos équipes en interne ?{' '}
              <Link href="/compte" className="text-brand-400 hover:underline">
                Découvrez nos formations
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
