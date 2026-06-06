import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos — The Code²',
  description:
    'The Code² : formation basée sur la pratique, pas la théorie. Découvrez notre mission et notre pédagogie orientée projets.',
};

export default function AproposLayout({ children }: { children: React.ReactNode }) {
  return children;
}
