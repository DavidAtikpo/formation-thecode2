import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Header from './components/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'The Code² — Formation en ligne',
  description: 'Apprenez, créez, maîtrisez et propulsez votre carrière avec The Code²',
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
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500 sm:py-5 sm:text-sm">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
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
      </body>
    </html>
  );
}
