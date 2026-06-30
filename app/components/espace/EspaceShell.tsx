'use client';

import { BadgeCheck } from 'lucide-react';
import { MotionSection } from '@/app/components/Motion';
import EspaceNav from './EspaceNav';
import EspaceProvider, { useEspace } from './EspaceProvider';
import EspaceBodyClass from './EspaceBodyClass';

function EspaceFrame({ children }: { children: React.ReactNode }) {
  const { data, navBadges } = useEspace();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-8 pb-24 sm:px-4 sm:py-10 md:flex-row md:items-start md:gap-8 md:pb-10">
      <aside className="md:sticky md:top-[3.75rem] md:z-30 md:max-h-[calc(100vh-4rem)] md:w-56 md:shrink-0 md:overflow-y-auto lg:top-16 lg:w-60">
        <MotionSection className="mb-5 md:mb-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-brand-400 sm:text-xs">
            Espace candidat
          </p>
          <h1 className="flex flex-wrap items-center gap-2 text-lg font-bold sm:text-xl">
            {data.identity.status === 'verified' && (
              <span
                className="inline-flex shrink-0 items-center text-green-400"
                title="Identité vérifiée"
                aria-label="Identité vérifiée"
              >
                <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
              </span>
            )}
            <span>
              {data.firstName} {data.lastName}
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">{data.email}</p>
        </MotionSection>
        <EspaceNav badges={navBadges} />
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function EspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <EspaceProvider>
      <EspaceBodyClass />
      <EspaceFrame>{children}</EspaceFrame>
    </EspaceProvider>
  );
}
