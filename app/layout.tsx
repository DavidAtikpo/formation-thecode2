import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import './globals.css';
import { SiteBackdrop, SiteFooter, SiteHeader } from './components/SiteChrome';
import CookieConsent from './components/CookieConsent';
import PageViewTracker from './components/PageViewTracker';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'THE CODE CODE — Former. Connecter. Livrer.',
  description:
    'Formations professionnelles en ligne et en présentiel : développement web et mobile, bureautique, design digital et robotique.',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${geistSans.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-white text-slate-900">
        <style>{`
          @keyframes rise-in {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: none; }
          }
          .page-enter {
            animation: rise-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @media (prefers-reduced-motion: reduce) {
            .page-enter { animation: none; }
          }
        `}</style>
        <PageViewTracker />
        <CookieConsent />
        <SiteBackdrop />
        <SiteHeader />
        <main className="relative z-10 flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
