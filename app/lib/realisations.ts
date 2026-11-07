export const REALISATIONS = [
  {
    id: 'boitier-esp32',
    src: '/images/realisations/boitier-esp32.jpg',
    title: 'Boîtier ESP32 à deux relais',
    caption: 'Carte ESP32, deux relais et capteur dans un boîtier prêt à commander deux charges.',
  },
  {
    id: 'buzzers',
    src: '/images/realisations/buzzers.jpg',
    title: 'Pupitres de buzzer',
    caption: 'Postes F, V, 1 et 2 reliés à un boîtier central, branché à l’ordinateur.',
  },
  {
    id: 'panneau-led',
    src: '/images/realisations/panneau-led.jpg',
    title: 'Panneau LED',
    caption: 'Matrice fabriquée à la main, du perçage jusqu’à l’affichage allumé.',
  },
  {
    id: 'atelier-public',
    src: '/images/realisations/atelier-public.jpg',
    title: 'Présentation au public',
    caption: 'Les montages sortent de l’atelier et sont montrés devant les habitants.',
  },
  {
    id: 'montage-video',
    src: '/images/realisations/montage-video.jpg',
    title: 'Montage vidéo',
    caption: 'Montage sur CapCut, avec plusieurs pistes et habillage.',
  },
  {
    id: 'remise-attestations',
    src: '/images/realisations/remise-attestations.jpg',
    title: 'Remise des attestations',
    caption: 'Clôture à UniPod, avec les partenaires D-CLIC, OIF et CUBE.',
  },
] as const;

export type RealisationId = (typeof REALISATIONS)[number]['id'];

const IDS = new Set<string>(REALISATIONS.map((item) => item.id));

export function isRealisationId(value: string): value is RealisationId {
  return IDS.has(value);
}
