import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon espace — The Code²',
  description: 'Suivez votre formation, vos notes, vos paiements et votre certificat.',
};

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
