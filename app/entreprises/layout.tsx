import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entreprises — Recrutement digital | The Code²',
  description:
    'Recrutez des développeurs, créateurs et experts SEO formés par The Code². Publiez une offre ou confiez-nous votre recherche.',
};

export default function EntreprisesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
