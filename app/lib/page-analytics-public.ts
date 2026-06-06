export const PUBLIC_PAGE_PATHS = [
  '/',
  '/apropos',
  '/contact',
  '/confidentialite',
  '/compte',
  '/connexion',
] as const;

export type PublicPagePath = (typeof PUBLIC_PAGE_PATHS)[number];

export const PUBLIC_PAGE_LABELS: Record<PublicPagePath, string> = {
  '/': 'Accueil',
  '/apropos': 'À propos',
  '/contact': 'Contact',
  '/confidentialite': 'Confidentialité',
  '/compte': 'Créer un compte',
  '/connexion': 'Connexion',
};

export function isPublicPagePath(path: string): path is PublicPagePath {
  return (PUBLIC_PAGE_PATHS as readonly string[]).includes(path);
}

export function getPublicPageLabel(path: string) {
  return isPublicPagePath(path) ? PUBLIC_PAGE_LABELS[path] : path;
}
