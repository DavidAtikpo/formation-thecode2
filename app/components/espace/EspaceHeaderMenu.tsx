'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { ESPACE_MENU_NAV, type EspaceNavId } from './EspaceNav';

type Props = {
  isAdmin?: boolean;
  onLogout: () => void;
  badges?: Partial<Record<EspaceNavId, boolean>>;
};

export default function EspaceHeaderMenu({ isAdmin, onLogout, badges }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const drawer =
    open && mounted ? (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[9998] bg-black/55 backdrop-blur-[2px]"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu espace candidat"
          className="fixed inset-y-0 right-0 z-[9999] flex w-[min(100vw,20rem)] flex-col border-l border-white/10 bg-[#0d0e22] shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Menu</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <ul className="space-y-1">
              {ESPACE_MENU_NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-brand-500/15 text-white ring-1 ring-brand-400/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                      {item.label}
                      {badges?.[item.id] && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-brand-400" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="my-3 border-t border-white/10" />

            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  Site public
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Déconnexion
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/5"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}
