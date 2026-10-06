import data from '../data/content.json';
import type { Content, Photo } from './types';

export const content = data as Content;
export type { Photo };

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Préfixe un chemin interne avec la base du site (/portfolio). */
export const url = (path: string) =>
  !path || /^(https?:|mailto:|#)/.test(path) ? path : `${base}${path.startsWith('/') ? path : '/' + path}`;

const resolve = (p: Photo): Photo => ({ ...p, src: url(p.src), thumb: url(p.thumb) });

// Ratios variés pour que les photos de démo ressemblent à une vraie planche
const RATIOS: [number, number][] = [[3, 2], [2, 3], [3, 2], [4, 5], [16, 9], [3, 2], [2, 3], [1, 1]];

/** Photos de démonstration (picsum.photos), stables pour une même graine. */
export function demoPhotos(seed: string, count: number, offset = 0): Photo[] {
  return Array.from({ length: count }, (_, k) => {
    const i = k + offset;
    const [rw, rh] = RATIOS[i % RATIOS.length];
    const w = rw * 600, h = rh * 600;
    const s = encodeURIComponent(`${seed}-${i}`);
    return {
      src: `https://picsum.photos/seed/${s}/${w}/${h}`,
      thumb: `https://picsum.photos/seed/${s}/${Math.round(w / 2)}/${Math.round(h / 2)}`,
      w, h, alt: 'Photo de démonstration',
    };
  });
}

/** Photos réelles d'une liste ; si elle est vide et que la démo est activée, des photos de démo. */
export function photos(list: Photo[] | undefined, seed: string, demoCount = 12): Photo[] {
  if (list?.length) return list.map(resolve);
  return content.settings.demoPhotos ? demoPhotos(seed, demoCount) : [];
}

/** Une seule image de couverture (vignette), éventuellement recadrée en paysage pour la démo. */
export function cover(list: Photo[] | undefined, seed: string): Photo | null {
  if (list?.length) return resolve(list[0]);
  if (!content.settings.demoPhotos) return null;
  const s = encodeURIComponent(`${seed}-cover`);
  return { src: `https://picsum.photos/seed/${s}/1800/1200`, thumb: `https://picsum.photos/seed/${s}/1200/800`, w: 1200, h: 800 };
}

export const single = (p: Photo | null) => (p ? resolve(p) : null);

// maxresdefault : 16/9 sans bandes noires (hqdefault est en 4/3 avec bandes)
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
