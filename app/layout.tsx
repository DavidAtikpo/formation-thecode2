import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import CookieConsent from './components/CookieConsent';
import PageViewTracker from './components/PageViewTracker';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'The Code² — Formation en ligne',
  description: 'Formation 100 % pratique en développement web et digital — apprenez en codant, pas en théorie. The Code²',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${geistSans.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#0a0b1e] text-white">
        <PageViewTracker />
        <CookieConsent />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500 sm:py-5 sm:text-sm">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
            <nav className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link href="/apropos" className="text-slate-400 transition hover:text-brand-400">
                À propos
              </Link>
              <Link href="/contact" className="text-slate-400 transition hover:text-brand-400">
                Contact
              </Link>
              <Link href="/confidentialite" className="text-slate-400 transition hover:text-brand-400">
                Confidentialité
              </Link>
            </nav>
            <p>© {new Date().getFullYear()} The Code² — Formation en développement web</p>
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
        <Script id="chatagent-boot" strategy="beforeInteractive">
          {`window.ChatAgentBoot = { key: "wk_8551ab6ac96e4be98bc87303", api: "https://chatagentapi.onrender.com/api/v1" };`}
        </Script>
        <Script
          src="https://chatagentcides.qrthecode2.com/widget.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
