// Compression des photos dans le navigateur, avant envoi :
// redimensionnement + WebP. Le passage par un canvas supprime toutes les métadonnées (dont le GPS).

import type { Photo } from '../lib/types';

export const FULL = 2000;
export const THUMB = 720;

const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function encode(bmp: ImageBitmap, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
  return { blob, w, h };
}

export type Processed = { photo: Photo; files: [string, Blob][] };

/** Transforme un fichier image en photo prête à publier (grande taille + vignette). */
export async function processImage(file: File): Promise<Processed> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const name = id();
    const full = await encode(bmp, FULL, 0.82);
    const thumb = await encode(bmp, THUMB, 0.75);
    const src = `/media/${name}.webp`;
    const th = `/media/${name}-sm.webp`;
    return {
      photo: { src, thumb: th, w: full.w, h: full.h, alt: '' },
      files: [[`public${src}`, full.blob], [`public${th}`, thumb.blob]],
    };
  } finally {
    bmp.close();
  }
}
