'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  CreditCard,
  Globe,
  GraduationCap,
  Laptop,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export type EspaceNavId =
  | 'parcours'
  | 'identite'
  | 'paiements'
  | 'projet'
  | 'cours'
  | 'notes'
  | 'certificat';

const NAV_ITEMS: {
  id: EspaceNavId;
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { id: 'parcours', href: '/espace/parcours', label: 'Mon parcours', shortLabel: 'Parcours', icon: GraduationCap },
  { id: 'identite', href: '/espace/identite', label: 'Vérification identité', shortLabel: 'Identité', icon: ShieldCheck },
  { id: 'paiements', href: '/espace/paiements', label: 'Paiements', shortLabel: 'Paiement', icon: CreditCard },
  { id: 'projet', href: '/espace/projet', label: 'Projet hébergé', shortLabel: 'Projet', icon: Globe },
  { id: 'cours', href: '/espace/cours', label: 'Cours & tutoriels', shortLabel: 'Cours', icon: Laptop },
  { id: 'notes', href: '/espace/notes', label: 'Mes notes', shortLabel: 'Notes', icon: ScrollText },
  { id: 'certificat', href: '/espace/certificat', label: 'Certificat', shortLabel: 'Certificat', icon: Award },
];

/** Navigation complète (sidebar desktop). */
export const ESPACE_NAV = NAV_ITEMS;

/** Bottom bar mobile — 4 entrées principales. */
export const ESPACE_BOTTOM_NAV = NAV_ITEMS.filter((item) =>
  (['parcours', 'cours', 'notes', 'paiements'] as EspaceNavId[]).includes(item.id),
);

/** Menu hamburger — pages secondaires. */
export const ESPACE_MENU_NAV = NAV_ITEMS.filter((item) =>
  (['identite', 'projet', 'certificat'] as EspaceNavId[]).includes(item.id),
);

type Badges = Partial<Record<EspaceNavId, boolean>>;

function NavLink({
  href,
  active,
  label,
  shortLabel,
  icon: Icon,
  showBadge,
  layout,
}: {
  href: string;
  active: boolean;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  showBadge?: boolean;
  layout: 'sidebar' | 'bottom';
}) {
  const isSidebar = layout === 'sidebar';

  return (
    <Link
      href={href}
      className={
        isSidebar
          ? `relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? 'bg-brand-500/15 text-white ring-1 ring-brand-400/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`
          : `relative flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition ${
              active ? 'text-brand-300' : 'text-slate-500'
            }`
      }
    >
      <Icon className={isSidebar ? 'h-4 w-4 shrink-0' : 'h-5 w-5'} strokeWidth={active ? 2.25 : 1.75} />
      <span className={isSidebar ? undefined : 'truncate'}>{isSidebar ? label : shortLabel}</span>
      {showBadge && (
        <span
          className={`absolute rounded-full bg-brand-400 ${
            isSidebar ? 'right-2 top-2.5 h-2 w-2' : 'right-2 top-1.5 h-1.5 w-1.5'
          }`}
        />
      )}
    </Link>
  );
}

export default function EspaceNav({ badges }: { badges?: Badges }) {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden md:block">
        <ul className="space-y-1">
          {ESPACE_NAV.map((item) => (
            <li key={item.id}>
              <NavLink
                href={item.href}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                label={item.label}
                shortLabel={item.shortLabel}
                icon={item.icon}
                showBadge={badges?.[item.id]}
                layout="sidebar"
              />
            </li>
          ))}
        </ul>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0b1e]/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {ESPACE_BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.id}
              href={item.href}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              label={item.label}
              shortLabel={item.shortLabel}
              icon={item.icon}
              showBadge={badges?.[item.id]}
              layout="bottom"
            />
          ))}
        </div>
      </nav>
    </>
  );
}
