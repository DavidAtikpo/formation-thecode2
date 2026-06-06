'use client';

import {
  Award,
  CreditCard,
  GraduationCap,
  Laptop,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export type EspaceTabId =
  | 'parcours'
  | 'identite'
  | 'paiements'
  | 'cours'
  | 'notes'
  | 'certificat';

export const ESPACE_TABS: {
  id: EspaceTabId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { id: 'parcours', label: 'Mon parcours', shortLabel: 'Parcours', icon: GraduationCap },
  { id: 'identite', label: 'Vérification identité', shortLabel: 'Identité', icon: ShieldCheck },
  { id: 'paiements', label: 'Paiements', shortLabel: 'Paiements', icon: CreditCard },
  { id: 'cours', label: 'Cours & tutoriels', shortLabel: 'Cours', icon: Laptop },
  { id: 'notes', label: 'Mes notes', shortLabel: 'Notes', icon: ScrollText },
  { id: 'certificat', label: 'Certificat', shortLabel: 'Certificat', icon: Award },
];

export function isEspaceTabId(value: string | null): value is EspaceTabId {
  return ESPACE_TABS.some((tab) => tab.id === value);
}

type EspaceNavProps = {
  active: EspaceTabId;
  onChange: (tab: EspaceTabId) => void;
  badges?: Partial<Record<EspaceTabId, boolean>>;
};

function NavButton({
  active,
  label,
  shortLabel,
  icon: Icon,
  showBadge,
  onClick,
  layout,
}: {
  active: boolean;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  showBadge?: boolean;
  onClick: () => void;
  layout: 'tab' | 'bottom';
}) {
  const isTab = layout === 'tab';

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isTab
          ? `relative flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active
                ? 'border-brand-400 text-white'
                : 'border-transparent text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`
          : `relative flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition ${
              active ? 'text-brand-300' : 'text-slate-500'
            }`
      }
    >
      <Icon className={isTab ? 'h-4 w-4 shrink-0' : 'h-5 w-5'} strokeWidth={active ? 2.25 : 1.75} />
      <span className={isTab ? undefined : 'truncate'}>{isTab ? label : shortLabel}</span>
      {showBadge && (
        <span
          className={`absolute rounded-full bg-brand-400 ${
            isTab ? 'right-1 top-2 h-2 w-2' : 'right-2 top-1.5 h-1.5 w-1.5'
          }`}
        />
      )}
    </button>
  );
}

export default function EspaceNav({ active, onChange, badges }: EspaceNavProps) {
  return (
    <>
      {/* Desktop — onglets */}
      <nav className="mx-auto hidden max-w-3xl border-b border-white/10 md:block">
        <div className="flex gap-1 overflow-x-auto">
          {ESPACE_TABS.map((tab) => (
            <NavButton
              key={tab.id}
              active={active === tab.id}
              label={tab.label}
              shortLabel={tab.shortLabel}
              icon={tab.icon}
              showBadge={badges?.[tab.id]}
              onClick={() => onChange(tab.id)}
              layout="tab"
            />
          ))}
        </div>
      </nav>

      {/* Mobile — bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0b1e]/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {ESPACE_TABS.map((tab) => (
            <NavButton
              key={tab.id}
              active={active === tab.id}
              label={tab.label}
              shortLabel={tab.shortLabel}
              icon={tab.icon}
              showBadge={badges?.[tab.id]}
              onClick={() => onChange(tab.id)}
              layout="bottom"
            />
          ))}
        </div>
      </nav>
    </>
  );
}
