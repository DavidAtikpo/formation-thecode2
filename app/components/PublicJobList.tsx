'use client';

import { useCallback, useEffect, useState } from 'react';
import { MotionItem, MotionStagger } from '@/app/components/Motion';
import {
  TALENT_CATEGORIES,
  type PublicJobListing,
} from '@/app/lib/ecosystem-public';

type Props = {
  className?: string;
};

export default function PublicJobList({ className = '' }: Props) {
  const [listings, setListings] = useState<PublicJobListing[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/offres/public${query}`);
      const data = await res.json();
      setListings(data.listings ?? []);
    } catch {
      setListings([]);
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
          Toutes
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
        <p className="text-xs text-slate-500 sm:text-sm">Chargement des offres…</p>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
          <p className="text-sm text-slate-400">Aucune offre publiée pour le moment.</p>
          <p className="mt-1 text-xs text-slate-500">
            Publiez votre besoin via le formulaire ci-dessous — les offres validées apparaîtront ici.
          </p>
        </div>
      ) : (
        <MotionStagger className="grid grid-cols-1 gap-3 sm:gap-4">
          {listings.map((listing) => (
            <MotionItem
              key={listing.id}
              className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-4 sm:p-5"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white sm:text-base">{listing.title}</h3>
                  <p className="text-xs text-brand-300 sm:text-sm">{listing.company}</p>
                </div>
                <span className="rounded-full border border-brand-400/30 bg-brand-400/10 px-2.5 py-0.5 text-[11px] text-brand-200 sm:text-xs">
                  {listing.contractTypeLabel}
                </span>
              </div>
              <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-slate-500 sm:text-xs">
                <span>{listing.categoryLabel}</span>
                {listing.location && <span>· {listing.location}</span>}
                {listing.remote && (
                  <span className="text-green-300">· Remote possible</span>
                )}
              </div>
              <p className="whitespace-pre-line text-xs leading-relaxed text-slate-400 sm:text-sm">
                {listing.description}
              </p>
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
