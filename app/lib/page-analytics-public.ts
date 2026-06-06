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

export function normalizePagePath(path: string) {
  const base = path.split('?')[0].split('#')[0];
  if (base.length > 1 && base.endsWith('/')) {
    return base.slice(0, -1);
  }
  return base;
}

export function isPublicPagePath(path: string): path is PublicPagePath {
  return (PUBLIC_PAGE_PATHS as readonly string[]).includes(normalizePagePath(path));
}

export function getPublicPageLabel(path: string) {
  return isPublicPagePath(path) ? PUBLIC_PAGE_LABELS[path] : path;
}
