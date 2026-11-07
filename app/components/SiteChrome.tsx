'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppHeader from './AppHeader';
import BinaryNeuralAnimation from './BinaryNeuralAnimation';
import Header from './Header';

const APP_ROUTE_PREFIXES = ['/espace', '/inscription', '/compte'];
const QUIET_BACKDROP_PREFIXES = ['/admin', '/espace'];

function isAppRoute(pathname: string) {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function SiteBackdrop() {
  const pathname = usePathname();
  const quiet = QUIET_BACKDROP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (quiet) return null;
  return <BinaryNeuralAnimation variant="page" />;
}

export function SiteHeader() {
  const pathname = usePathname();
  return isAppRoute(pathname) ? <AppHeader /> : <Header />;
}

export function SiteFooter() {
  const pathname = usePathname();
  const appRoute = isAppRoute(pathname);

  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/80 py-4 text-center text-xs text-slate-500 backdrop-blur-sm sm:py-5 sm:text-sm">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
        {!appRoute && (
          <nav className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/apropos" className="text-slate-600 transition hover:text-brand-400">
              À propos
            </Link>
            <Link href="/contact" className="text-slate-600 transition hover:text-brand-400">
              Contact
            </Link>
            <Link href="/confidentialite" className="text-slate-600 transition hover:text-brand-400">
              Confidentialité
            </Link>
          </nav>
        )}
        <p>© {new Date().getFullYear()} THE CODE CODE — Former. Connecter. Livrer.</p>
        <a
          href="https://wa.me/22892591228"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-brand-400 hover:underline sm:mt-2"
        >
          WhatsApp : +228 92 59 12 28
        </a>
      </div>
    </footer>
  );
}
