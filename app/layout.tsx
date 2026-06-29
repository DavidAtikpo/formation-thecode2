import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import './globals.css';
import { SiteFooter, SiteHeader } from './components/SiteChrome';
import CookieConsent from './components/CookieConsent';
import PageViewTracker from './components/PageViewTracker';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'The Code² — Former. Connecter. Livrer.',
  description:
    'Formation pratique en développement web, mobile et digital — apprenez en codant de vrais projets, avec encadrement personnalisé et certificat à la clôture.',
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Script id="chatagent-boot" strategy="beforeInteractive">
          {`window.ChatAgentBoot = { key: "wk_05108b58391a42f7813b314e", api: "https://chatagentapi-1.onrender.com/api/v1" };`}
        </Script>
        <Script
          src="https://chatagentcides.qrthecode2.com/widget.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
