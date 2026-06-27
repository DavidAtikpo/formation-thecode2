'use client';

import SectionIcon from '@/app/components/SectionIcon';
import { useEspace } from '@/app/components/espace/EspaceProvider';
import { EspaceCard } from '@/app/components/espace/EspaceUi';

export default function CoursPage() {
  const { resources } = useEspace();

  return (
    <EspaceCard>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <SectionIcon name="laptop" size="sm" />
        Mes cours & tutoriels
      </h2>
      {resources.length === 0 ? (
        <p className="text-xs text-slate-400 sm:text-sm">
          Aucun contenu pour le moment. Vos cours PDF et tutoriels apparaîtront ici dès qu&apos;ils
          seront envoyés par l&apos;équipe.
        </p>
      ) : (
        <div className="space-y-2">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{resource.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {resource.typeLabel} —{' '}
                    {new Date(resource.deliveredAt).toLocaleDateString('fr-FR')}
                  </p>
                  {resource.description && (
                    <p className="mt-1 text-xs text-slate-400">{resource.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {resource.fileUrl && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-400/20"
                    >
                      Télécharger PDF
                    </a>
                  )}
                  {resource.externalUrl && (
                    <a
                      href={resource.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
                    >
                      Ouvrir le tutoriel
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </EspaceCard>
  );
}
