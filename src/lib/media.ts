import manifest from '../data/media.json';

export type Photo = {
  src: string;      // grande taille (plein écran)
  thumb: string;    // vignette
  w: number;
  h: number;
  alt?: string;
  placeholder?: boolean;
};

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Préfixe un chemin interne avec la base du site (/portfolio). */
export const url = (path: string) =>
  /^https?:/.test(path) ? path : `${base}${path.startsWith('/') ? path : '/' + path}`;

// Ratios variés pour que les placeholders ressemblent à une vraie planche photo
const RATIOS: [number, number][] = [[3, 2], [2, 3], [3, 2], [4, 5], [16, 9], [3, 2], [2, 3]];

/**
 * Photos d'un dossier média (généré par `npm run media`).
 * Tant que le dossier est vide, renvoie des placeholders.
 */
export function getPhotos(key: string, placeholderCount = 0): Photo[] {
  const real = (manifest as Record<string, Photo[]>)[key];
  if (real?.length) {
    return real.map((p) => ({ ...p, src: url(p.src), thumb: url(p.thumb) }));
  }
  return Array.from({ length: placeholderCount }, (_, i) => {
    const [rw, rh] = RATIOS[i % RATIOS.length];
    return { src: '', thumb: '', w: rw * 400, h: rh * 400, placeholder: true };
  });
}

export const hasRealPhotos = (key: string) =>
  !!(manifest as Record<string, Photo[]>)[key]?.length;
