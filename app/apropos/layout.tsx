import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos — THE CODE CODE',
  description:
    'THE CODE CODE : formation basée sur la pratique, pas la théorie. Découvrez notre mission et notre pédagogie orientée projets.',
};

export default function AproposLayout({ children }: { children: React.ReactNode }) {
  return children;
}
