'use client';

import { useCallback, useEffect, useState } from 'react';
import SectionIcon from '@/app/components/SectionIcon';
import { MotionItem, MotionStagger } from '@/app/components/Motion';
import {
  TALENT_CATEGORIES,
  type PublicTalentProfile,
} from '@/app/lib/ecosystem-public';

type Props = {
  className?: string;
};

export default function PublicTalentGrid({ className = '' }: Props) {
  const [profiles, setProfiles] = useState<PublicTalentProfile[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/profils/public${query}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>
          Tous
        </FilterChip>
        {TALENT_CATEGORIES.map((cat) => (
          <FilterChip
            key={cat.id}
            active={category === cat.id}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 sm:text-sm">Chargement des profils…</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
          <p className="text-sm text-slate-400">Aucun profil publié pour le moment.</p>
          <p className="mt-1 text-xs text-slate-500">
            Les profils validés par The Code² apparaîtront ici.
          </p>
        </div>
      ) : (
        <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {profiles.map((profile) => (
            <MotionItem
              key={profile.id}
              className="rounded-xl border border-green-400/20 bg-green-400/5 p-4 sm:p-5"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    {profile.displayName}
                  </h3>
                  <p className="text-[11px] text-green-300 sm:text-xs">{profile.categoryLabel}</p>
                </div>
                {profile.country && (
                  <span className="text-[11px] text-slate-500 sm:text-xs">{profile.country}</span>
                )}
              </div>
              {profile.headline && (
                <p className="mb-2 text-xs font-medium text-slate-300 sm:text-sm">
                  {profile.headline}
                </p>
              )}
              {profile.bio && (
                <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {profile.bio}
                </p>
              )}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 8).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 sm:text-xs">
                {profile.yearsExperience != null && profile.yearsExperience > 0 && (
                  <span>
                    {profile.yearsExperience} an{profile.yearsExperience > 1 ? 's' : ''} d&apos;exp.
                  </span>
                )}
                {profile.availabilityLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-green-400/20 px-2 py-0.5 text-green-300"
                  >
                    {label}
                  </span>
                ))}
              </div>
              {profile.portfolioUrl && (
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:underline"
                >
                  <SectionIcon name="globe" size="sm" variant="plain" />
                  Voir le portfolio
                </a>
              )}
            </MotionItem>
          ))}
        </MotionStagger>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] transition sm:px-3 sm:text-xs ${
        active
          ? 'border-brand-400/40 bg-brand-400/10 text-brand-300'
          : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
