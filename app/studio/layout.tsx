import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio — Développement sur mesure | The Code²',
  description:
    'The Code² développe votre site, application ou outil métier en méthode agile. Demandez un devis.',
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
