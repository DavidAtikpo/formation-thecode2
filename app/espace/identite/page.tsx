'use client';

import IdentityVerificationPanel from '@/app/components/IdentityVerificationPanel';
import SectionIcon from '@/app/components/SectionIcon';
import { useEspace } from '@/app/components/espace/EspaceProvider';
import { EspaceCard } from '@/app/components/espace/EspaceUi';

export default function IdentitePage() {
  const { data, reload } = useEspace();

  return (
    <EspaceCard>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <SectionIcon name="award" size="sm" />
        Vérification d&apos;identité
      </h2>
      <IdentityVerificationPanel
        firstName={data.firstName}
        lastName={data.lastName}
        identity={data.identity}
        onVerified={reload}
      />
    </EspaceCard>
  );
}
