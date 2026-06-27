'use client';

import SectionIcon from '@/app/components/SectionIcon';
import { useEspace } from '@/app/components/espace/EspaceProvider';
import { EspaceCard } from '@/app/components/espace/EspaceUi';

export default function NotesPage() {
  const { data } = useEspace();

  return (
    <EspaceCard>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <SectionIcon name="award" size="sm" />
        Mes notes
      </h2>
      {data.grades.length === 0 ? (
        <p className="text-xs text-slate-400 sm:text-sm">
          Aucune note publiée pour le moment. Vos évaluations apparaîtront ici au fil de la
          formation.
        </p>
      ) : (
        <>
          {data.averageGrade != null && (
            <p className="mb-3 text-sm text-brand-300">
              Moyenne : <strong>{data.averageGrade}</strong> / 20
            </p>
          )}
          <div className="space-y-2">
            {data.grades.map((g) => (
              <div
                key={g.id}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{g.title}</p>
                  <p className="text-sm font-semibold text-brand-300">
                    {g.score}/{g.maxScore}
                  </p>
                </div>
                {g.comment && <p className="mt-1 text-xs text-slate-400">{g.comment}</p>}
                <p className="mt-1 text-[11px] text-slate-500">
                  {new Date(g.gradedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </EspaceCard>
  );
}
