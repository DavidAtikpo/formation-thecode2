'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type User = { id: string; email: string; isAdmin?: boolean };

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.id ? data : null))
      .catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    window.location.href = '/';
  };

  const btnClass =
    'rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 sm:px-3.5 sm:py-2 sm:text-sm';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0b1e]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <Image
            src="/logo.png"
            alt="The Code²"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-9 sm:w-9"
            priority
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold tracking-wide text-white sm:text-sm">The Code²</p>
            <p className="hidden text-[11px] text-brand-300 sm:block sm:text-xs">Formation en ligne</p>
          </div>
        </Link>

        <nav className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2.5">
          <Link
            href="/apropos"
            className="px-0.5 text-[11px] text-slate-300 hover:text-white sm:px-1 sm:text-sm"
          >
            À propos
          </Link>
          <Link
            href="/contact"
            className="px-0.5 text-[11px] text-slate-300 hover:text-white sm:px-1 sm:text-sm"
          >
            Contact
          </Link>
          {user ? (
            <>
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="hidden px-1 text-xs text-slate-300 hover:text-white sm:inline sm:text-sm"
                >
                  Admin
                </Link>
              )}
              <Link href="/inscription" className={btnClass}>
                <span className="hidden sm:inline">Mon inscription</span>
                <span className="sm:hidden">Inscription</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="px-1 text-xs text-slate-400 hover:text-white sm:text-sm"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/connexion" className="px-1 text-xs text-slate-300 hover:text-white sm:text-sm">
                Connexion
              </Link>
              <Link href="/compte" className={btnClass}>
                <span className="hidden sm:inline">Créer un compte</span>
                <span className="sm:hidden">Compte</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
