export const CONTACT = {
  whatsapp: {
    number: '22892591228',
    display: '+228 92 59 12 28',
    url: 'https://wa.me/22892591228',
  },
  email: 'thecode2@qrthecode2.com',
  responseTime: 'Réponse sous 24 h en semaine',
} as const;

export const CONTACT_SUBJECTS = [
  { id: 'inscription', label: 'Inscription à la formation' },
  { id: 'studio', label: 'Studio — Développement sur mesure' },
  { id: 'entreprises', label: 'Entreprises — Recrutement' },
  { id: 'tarifs', label: 'Tarifs et sessions' },
  { id: 'technique', label: 'Configuration matérielle' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'autre', label: 'Autre question' },
] as const;
