'use client';

import { MotionSection } from '@/app/components/Motion';

export default function ConfidentialitePage() {
  return (
    <MotionSection className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-10">
      <h1 className="mb-4 text-xl font-bold sm:mb-5 sm:text-2xl">Politique de confidentialité</h1>
      <div className="space-y-3 text-xs leading-relaxed text-slate-300 sm:space-y-4 sm:text-sm">
        <p>
          The Code² collecte vos données personnelles (nom, prénom, coordonnées, photo passeport)
          uniquement dans le cadre de votre inscription à la formation et de la délivrance de votre
          certificat de fin de formation.
        </p>
        <p>
          Vos données sont stockées de manière sécurisée et ne sont pas vendues à des tiers.
          La photo passeport est utilisée exclusivement pour la génération de votre certificat.
        </p>
        <p>
          Vous pouvez demander la suppression de vos données en nous contactant via WhatsApp au
          +228 92 59 12 28.
        </p>
        <p>
          Les paiements sont traités de manière sécurisée par FedaPay, Stripe et NOWPayments
          (crypto). The Code² ne stocke pas vos informations bancaires ni vos portefeuilles crypto.
        </p>
      </div>
    </MotionSection>
  );
}
