'use client';

import SectionIcon from '@/app/components/SectionIcon';
import { useEspace } from '@/app/components/espace/EspaceProvider';
import { EspaceCard } from '@/app/components/espace/EspaceUi';

export default function CertificatPage() {
  const { data } = useEspace();

  return (
    <EspaceCard>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <SectionIcon name="award" size="sm" />
        Certificat
      </h2>
      {data.certificateIssued && data.certificateDownloadUrl ? (
        <div>
          <p className="mb-2 text-xs text-green-300 sm:text-sm">
            Votre certificat est disponible
            {data.certificateNumber && ` (${data.certificateNumber})`}
            {data.certificateIssuedAt &&
              ` — émis le ${new Date(data.certificateIssuedAt).toLocaleDateString('fr-FR')}`}
            .
          </p>
          <a
            href={data.certificateDownloadUrl}
            className="inline-flex rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
          >
            Télécharger mon certificat
          </a>
        </div>
      ) : (
        <p className="text-xs text-slate-400 sm:text-sm">
          {data.identity?.status === 'verified'
            ? 'Votre identité est vérifiée. Le certificat sera généré automatiquement et publié par l’administration à la fin de la formation.'
            : data.status === 'paid'
              ? 'Vérifiez votre identité dans la section Identité, puis votre certificat sera publié à la fin de la formation.'
              : 'Le certificat sera délivré à la clôture de votre parcours, après paiement complet des frais et vérification d’identité.'}
        </p>
      )}
    </EspaceCard>
  );
}
