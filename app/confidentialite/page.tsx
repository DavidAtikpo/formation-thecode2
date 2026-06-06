'use client';

import Link from 'next/link';
import { MotionSection } from '@/app/components/Motion';
import { CONTACT } from '@/app/lib/contact-config';

const LAST_UPDATED = '6 juin 2026';

export default function ConfidentialitePage() {
  return (
    <MotionSection className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-10">
      <p className="mb-2 text-[11px] uppercase tracking-widest text-brand-400 sm:text-xs">
        Dernière mise à jour : {LAST_UPDATED}
      </p>
      <h1 className="mb-4 text-xl font-bold sm:mb-5 sm:text-2xl">Politique de confidentialité</h1>
      <p className="mb-6 text-xs leading-relaxed text-slate-400 sm:mb-8 sm:text-sm">
        The Code² s&apos;engage à protéger vos données personnelles. Cette politique explique
        quelles informations nous collectons, pourquoi nous les utilisons et quels sont vos droits.
      </p>

      <div className="space-y-6 text-xs leading-relaxed text-slate-300 sm:space-y-8 sm:text-sm">
        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données est <strong className="text-white">The Code²</strong>,
            formation en ligne en développement web et digital.
          </p>
          <p className="mt-2">
            Contact :{' '}
            <a href={`mailto:${CONTACT.email}`} className="text-brand-400 hover:underline">
              {CONTACT.email}
            </a>
            {' '}— WhatsApp :{' '}
            <a href={CONTACT.whatsapp.url} className="text-brand-400 hover:underline">
              {CONTACT.whatsapp.display}
            </a>
          </p>
        </Section>

        <Section title="2. Données que nous collectons">
          <p>Nous collectons uniquement les données nécessaires à votre inscription et au suivi de la formation :</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-300">Compte</strong> — adresse email, mot de passe (stocké sous forme
              chiffrée, jamais en clair)
            </li>
            <li>
              <strong className="text-slate-300">Identité</strong> — nom, prénom, photo passeport (pour le
              certificat de fin de formation)
            </li>
            <li>
              <strong className="text-slate-300">Coordonnées</strong> — pays, adresse, numéro de téléphone
            </li>
            <li>
              <strong className="text-slate-300">Parcours</strong> — domaine choisi, session de formation,
              durée, jours et créneaux horaires
            </li>
            <li>
              <strong className="text-slate-300">Paiement</strong> — moyen de paiement choisi, montant,
              statut et références de transaction (identifiants Stripe, FedaPay ou crypto)
            </li>
            <li>
              <strong className="text-slate-300">Contact</strong> — nom, email et message si vous utilisez
              le formulaire de contact
            </li>
          </ul>
          <p className="mt-2 text-slate-400">
            Nous ne collectons pas vos numéros de carte bancaire, codes CVV ni clés de portefeuille crypto.
            Ces informations sont traitées directement par nos prestataires de paiement.
          </p>
        </Section>

        <Section title="3. Finalités du traitement">
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Vérifier votre adresse email avant l&apos;inscription</li>
            <li>Traiter votre inscription à la formation et votre paiement</li>
            <li>Organiser votre parcours (session, planning, domaine)</li>
            <li>Vous contacter pour le suivi pédagogique et administratif</li>
            <li>Générer votre certificat de fin de formation (photo passeport)</li>
            <li>Répondre à vos demandes via le formulaire de contact ou WhatsApp</li>
            <li>Assurer la sécurité du site et prévenir les fraudes</li>
          </ul>
          <p className="mt-2 text-slate-400">
            Vos données ne sont <strong className="text-slate-300">jamais vendues</strong> à des tiers
            à des fins commerciales ou publicitaires.
          </p>
        </Section>

        <Section title="4. Base légale">
          <p>Le traitement de vos données repose sur :</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-300">L&apos;exécution du contrat</strong> — inscription,
              paiement et délivrance de la formation
            </li>
            <li>
              <strong className="text-slate-300">Votre consentement</strong> — acceptation explicite de
              cette politique lors de l&apos;inscription, et envoi volontaire du formulaire de contact
            </li>
            <li>
              <strong className="text-slate-300">Notre intérêt légitime</strong> — sécurité du service
              et prévention des abus
            </li>
          </ul>
        </Section>

        <Section title="5. Cookies et session">
          <p>
            The Code² utilise un cookie de session technique (<code className="text-brand-300">thecode2_token</code>)
            pour vous maintenir connecté après la création de compte ou la connexion.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>Durée : 7 jours</li>
            <li>Propriétés : httpOnly, secure en production, sameSite=lax</li>
            <li>Finalité : authentification uniquement — pas de cookie publicitaire ou de tracking</li>
          </ul>
          <p className="mt-2 text-slate-400">
            Vous pouvez supprimer ce cookie en vous déconnectant ou en effaçant les cookies de votre navigateur.
          </p>
        </Section>

        <Section title="6. Prestataires et sous-traitants">
          <p>
            Pour faire fonctionner la plateforme, nous faisons appel à des prestataires qui peuvent
            traiter certaines de vos données :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-300">Stripe</strong> — paiement par carte bancaire (USD)
            </li>
            <li>
              <strong className="text-slate-300">FedaPay</strong> — Mobile Money et cartes locales (FCFA)
            </li>
            <li>
              <strong className="text-slate-300">NOWPayments</strong> — paiement en cryptomonnaies
            </li>
            <li>
              <strong className="text-slate-300">Cloudinary</strong> — hébergement sécurisé de votre photo passeport
            </li>
            <li>
              <strong className="text-slate-300">Hébergeur base de données</strong> — stockage chiffré des données
              de compte et d&apos;inscription
            </li>
            <li>
              <strong className="text-slate-300">Service email (SMTP)</strong> — envoi des emails de vérification
              et des messages de contact
            </li>
          </ul>
          <p className="mt-2 text-slate-400">
            Ces prestataires ne peuvent utiliser vos données que pour fournir leurs services à The Code²
            et sont soumis à leurs propres politiques de confidentialité.
          </p>
        </Section>

        <Section title="7. Photo passeport">
          <p>
            La photo passeport est demandée uniquement pour la génération de votre certificat de fin
            de formation. Elle est :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>Stockée sur Cloudinary dans un dossier dédié et sécurisé</li>
            <li>Liée à votre compte — un autre utilisateur ne peut pas l&apos;utiliser</li>
            <li>Accessible uniquement par l&apos;équipe The Code² (espace admin) pour le traitement de votre dossier</li>
            <li>Non diffusée publiquement ni utilisée à d&apos;autres fins</li>
          </ul>
        </Section>

        <Section title="8. Durée de conservation">
          <ul className="list-inside list-disc space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-300">Compte et inscription</strong> — conservés pendant la durée
              de la formation et jusqu&apos;à 3 ans après la fin du parcours (obligations administratives
              et certificat)
            </li>
            <li>
              <strong className="text-slate-300">Données de paiement</strong> — références de transaction
              conservées pour la comptabilité et la lutte contre la fraude
            </li>
            <li>
              <strong className="text-slate-300">Tokens de vérification email</strong> — supprimés après
              validation ou expiration (24 h)
            </li>
            <li>
              <strong className="text-slate-300">Messages de contact</strong> — conservés le temps nécessaire
              pour traiter votre demande
            </li>
          </ul>
          <p className="mt-2 text-slate-400">
            À l&apos;issue de ces délais, vos données sont supprimées ou anonymisées, sauf obligation
            légale contraire.
          </p>
        </Section>

        <Section title="9. Sécurité">
          <p>Nous mettons en place des mesures pour protéger vos données :</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>Mots de passe hashés (bcrypt) — jamais stockés en clair</li>
            <li>Connexion chiffrée HTTPS en production</li>
            <li>Cookie de session httpOnly et sécurisé</li>
            <li>Accès admin restreint aux personnes autorisées</li>
            <li>Validation côté serveur des inscriptions, paiements et uploads</li>
            <li>Paiements délégués à des prestataires certifiés (PCI-DSS pour Stripe)</li>
          </ul>
        </Section>

        <Section title="10. Vos droits">
          <p>Conformément aux principes de protection des données, vous pouvez :</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li><strong className="text-slate-300">Accéder</strong> aux données que nous détenons sur vous</li>
            <li><strong className="text-slate-300">Rectifier</strong> des informations inexactes ou incomplètes</li>
            <li><strong className="text-slate-300">Demander la suppression</strong> de vos données (sous réserve des obligations légales)</li>
            <li><strong className="text-slate-300">Retirer votre consentement</strong> pour les traitements qui en dépendent</li>
            <li><strong className="text-slate-300">Vous opposer</strong> à un traitement fondé sur l&apos;intérêt légitime</li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits, contactez-nous via{' '}
            <Link href="/contact" className="text-brand-400 hover:underline">
              la page Contact
            </Link>
            , par email à{' '}
            <a href={`mailto:${CONTACT.email}`} className="text-brand-400 hover:underline">
              {CONTACT.email}
            </a>
            {' '}ou sur WhatsApp au{' '}
            <a href={CONTACT.whatsapp.url} className="text-brand-400 hover:underline">
              {CONTACT.whatsapp.display}
            </a>
            . Nous répondrons dans un délai raisonnable.
          </p>
        </Section>

        <Section title="11. Mineurs">
          <p>
            La formation The Code² s&apos;adresse aux personnes majeures ou aux mineurs ayant
            l&apos;autorisation de leur représentant légal. Si vous pensez qu&apos;un mineur nous a
            transmis des données sans autorisation, contactez-nous pour suppression immédiate.
          </p>
        </Section>

        <Section title="12. Modifications">
          <p>
            Cette politique peut être mise à jour pour refléter l&apos;évolution de nos services
            ou de la réglementation. La date de dernière mise à jour figure en haut de cette page.
            En cas de changement important, nous vous en informerons par email ou via le site.
          </p>
        </Section>

        <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-4 sm:p-5">
          <p className="text-sm font-semibold text-white">Une question sur vos données ?</p>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Notre équipe est disponible pour répondre à toute demande relative à votre vie privée.
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-block text-sm font-medium text-brand-400 hover:underline"
          >
            Nous contacter →
          </Link>
        </div>
      </div>
    </MotionSection>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-white sm:text-base">{title}</h2>
      {children}
    </section>
  );
}
