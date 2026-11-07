import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — THE CODE CODE',
  description:
    'Contactez THE CODE CODE par WhatsApp ou email pour vos questions sur la formation, les inscriptions et les paiements.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
