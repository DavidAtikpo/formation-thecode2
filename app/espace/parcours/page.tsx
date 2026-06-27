'use client';

import SectionIcon from '@/app/components/SectionIcon';
import { useEspace } from '@/app/components/espace/EspaceProvider';
import { EspaceCard, InfoRow } from '@/app/components/espace/EspaceUi';
import { enrollmentStatusLabel } from '@/app/lib/espace-types';

export default function ParcoursPage() {
  const { data, openSkillModal } = useEspace();

  return (
    <EspaceCard>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <SectionIcon name="graduation" size="sm" />
        Mon parcours
      </h2>
      <dl className="grid gap-2 text-xs sm:grid-cols-2 sm:text-sm">
        <InfoRow label="Domaine" value={data.domain} />
        <InfoRow label="Durée" value={data.duration} />
        <InfoRow label="Session" value={data.session} />
        <InfoRow label="Planning" value={data.schedule} />
        <InfoRow label="Statut" value={enrollmentStatusLabel(data.status)} />
      </dl>
      {data.skillProfile.completed ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Profil technique
          </p>
          <dl className="grid gap-2 text-xs sm:text-sm">
            <InfoRow
              label="Niveau"
              value={
                data.skillProfile.skillLevel === 'experienced'
                  ? 'Développeur avec expérience'
                  : 'Débutant'
              }
            />
            {data.skillProfile.skillLevel === 'experienced' && (
              <>
                <InfoRow
                  label="Expérience"
                  value={`${data.skillProfile.yearsExperience ?? 0} an${(data.skillProfile.yearsExperience ?? 0) > 1 ? 's' : ''}`}
                />
                <div>
                  <dt className="text-slate-500">Technologies</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {data.skillProfile.masteredTechnologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-brand-400/30 bg-brand-400/10 px-2 py-0.5 text-[11px] text-brand-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      ) : (
        <button
          type="button"
          onClick={openSkillModal}
          className="mt-4 w-full rounded-lg border border-dashed border-brand-400/40 px-3 py-2 text-xs text-brand-300 hover:bg-brand-400/10 sm:text-sm"
        >
          Compléter votre profil technique
        </button>
      )}
    </EspaceCard>
  );
}
