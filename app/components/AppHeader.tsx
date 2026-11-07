'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import EspaceHeaderMenu from '@/app/components/espace/EspaceHeaderMenu';
import type { EspaceNavId } from '@/app/components/espace/EspaceNav';

type User = { id: string; email: string; isAdmin?: boolean };

function appSubtitle(pathname: string) {
  if (pathname.startsWith('/inscription')) return 'Inscription';
  if (pathname.startsWith('/compte')) return 'Mon compte';
  return 'Mon espace';
}

export default function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [espaceBadges, setEspaceBadges] = useState<Partial<Record<EspaceNavId, boolean>>>({});

  const isEspace = pathname.startsWith('/espace');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.id ? data : null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!isEspace || !user) {
      setEspaceBadges({});
      return;
    }

    fetch('/api/espace', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const d = json?.enrollment;
        if (!d) return;
        setEspaceBadges({
          identite: d.identity?.status !== 'verified',
          projet: !d.project?.url,
          certificat: Boolean(d.certificateIssued),
        });
      })
      .catch(() => setEspaceBadges({}));
  }, [isEspace, user, pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    window.location.href = '/';
  };

  const subtitle = appSubtitle(pathname);
  const homeHref = isEspace
    ? '/espace/parcours'
    : pathname.startsWith('/inscription')
      ? '/inscription'
      : '/compte';

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md ${
        isEspace
          ? 'border-b border-white/10 bg-[#081433]/95'
          : 'border-b-2 border-gold-400 bg-white/95'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        <Link href={homeHref} className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Image
            src="/logo.png"
            alt="THE CODE CODE"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-9 sm:w-9"
            priority
          />
          <div className="min-w-0">
            <p className={`whitespace-nowrap text-[11px] font-bold tracking-tight sm:text-sm ${isEspace ? 'text-white' : 'text-slate-900'}`}>
              THE CODE CODE
            </p>
            <p className={`hidden text-[11px] sm:block sm:text-xs ${isEspace ? 'text-brand-300' : 'text-brand-600'}`}>
              {subtitle}
            </p>
          </div>
        </Link>

        <nav className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2.5">
          {user ? (
            isEspace ? (
              <EspaceHeaderMenu
                isAdmin={user.isAdmin}
                onLogout={logout}
                badges={espaceBadges}
              />
            ) : (
              <>
                <Link
                  href="/"
                  className="hidden px-1 text-[11px] text-slate-600 hover:text-brand-600 sm:inline sm:text-sm"
                >
                  Site public
                </Link>
                <Link
                  href="/espace/parcours"
                  className="px-1 text-[11px] text-slate-600 hover:text-brand-600 sm:text-sm"
                >
                  Mon espace
                </Link>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden px-1 text-xs text-slate-600 hover:text-brand-600 sm:inline sm:text-sm"
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 sm:px-3 sm:text-sm"
                >
                  Déconnexion
                </button>
              </>
            )
          ) : (
            <>
              <Link href="/connexion" className="px-1 text-[11px] text-slate-600 hover:text-brand-600 sm:text-sm">
                Connexion
              </Link>
              {!pathname.startsWith('/compte') && (
                <Link
                  href="/compte"
                  className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90 sm:px-3 sm:text-sm"
                >
                  Créer un compte
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
