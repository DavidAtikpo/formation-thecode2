import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — The Code²',
  description:
    'Contactez The Code² par WhatsApp ou email pour vos questions sur la formation, les inscriptions et les paiements.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
