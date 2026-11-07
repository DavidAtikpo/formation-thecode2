import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — THE CODE CODE',
  description:
    'Comment THE CODE CODE collecte, utilise et protège vos données personnelles lors de votre inscription à la formation.',
};

export default function ConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
