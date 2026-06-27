'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import SkillProfileModal from '@/app/components/SkillProfileModal';
import LoadingState from '@/app/components/LoadingState';
import type { EnrollmentData, LearningResource } from '@/app/lib/espace-types';
import type { EspaceNavId } from './EspaceNav';

type EspaceContextValue = {
  data: EnrollmentData;
  resources: LearningResource[];
  reload: () => Promise<void>;
  openSkillModal: () => void;
  navBadges: Partial<Record<EspaceNavId, boolean>>;
};

const EspaceContext = createContext<EspaceContextValue | null>(null);

export function useEspace() {
  const ctx = useContext(EspaceContext);
  if (!ctx) throw new Error('useEspace must be used within EspaceProvider');
  return ctx;
}

export default function EspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnrollmentData | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const load = useCallback(async () => {
    const me = await fetch('/api/auth/me', { credentials: 'include' }).then((r) =>
      r.ok ? r.json() : null,
    );
    if (!me?.id) {
      router.replace('/connexion');
      return;
    }
    if (!me.emailVerified) {
      router.replace('/compte/verifier-email');
      return;
    }

    const [res, resourcesRes] = await Promise.all([
      fetch('/api/espace', { credentials: 'include' }),
      fetch('/api/espace/resources', { credentials: 'include' }),
    ]);
    const json = await res.json();
    if (!json.enrollment) {
      router.replace('/inscription');
      return;
    }
    setData(json.enrollment);
    if (!json.enrollment.skillProfile?.completed) {
      setShowSkillModal(true);
    }
    if (resourcesRes.ok) {
      const resourcesJson = await resourcesRes.json();
      setResources(resourcesJson.resources ?? []);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const navBadges = useMemo<Partial<Record<EspaceNavId, boolean>>>(() => {
    if (!data) return {};
    return {
      identite: data.identity.status !== 'verified',
      paiements:
        !data.registrationPaid ||
        (data.registrationPaid && !data.formationPaid && data.formationFeeUsd > 0),
      projet: !data.project.url,
      cours: resources.length > 0,
      notes: data.grades.length > 0,
      certificat: data.certificateIssued,
    };
  }, [data, resources]);

  if (loading || !data) {
    return <LoadingState fullScreen message="Chargement de votre espace…" />;
  }

  return (
    <EspaceContext.Provider
      value={{
        data,
        resources,
        reload: load,
        openSkillModal: () => setShowSkillModal(true),
        navBadges,
      }}
    >
      <SkillProfileModal
        open={showSkillModal}
        firstName={data.firstName}
        onComplete={() => {
          setShowSkillModal(false);
          load();
        }}
        onSkip={() => setShowSkillModal(false)}
      />
      {children}
    </EspaceContext.Provider>
  );
}
