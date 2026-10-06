import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Content, Photo } from '../lib/types';
import { processImage } from './images';
import { OWNER, REPO, BRANCH } from './github';

export type Store = {
  content: Content;
  /** Modifie le contenu : la fonction reçoit une copie modifiable. */
  set: (fn: (draft: Content) => void) => void;
  /** Compresse des fichiers et renvoie les photos correspondantes (en attente de publication). */
  addFiles: (files: File[], onProgress?: (done: number, total: number) => void) => Promise<Photo[]>;
  /** URL affichable dans l'admin (aperçu local si la photo n'est pas encore publiée). */
  imgUrl: (p: Photo, thumb?: boolean) => string;
};

export const StoreCtx = createContext<Store>(null as any);
export const useStore = () => useContext(StoreCtx);

/** Fichiers en attente : chemin dans le repo -> blob, et chemin public -> URL d'aperçu. */
export const pending = new Map<string, Blob>();
const previews = new Map<string, string>();

export async function addFiles(files: File[], onProgress?: (d: number, t: number) => void) {
  const out: Photo[] = [];
  let done = 0;
  onProgress?.(0, files.length);
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    try {
      const { photo, files: blobs } = await processImage(f);
      for (const [path, blob] of blobs) {
        pending.set(path, blob);
        previews.set(path.replace(/^public/, ''), URL.createObjectURL(blob));
      }
      out.push(photo);
    } catch (e) {
      console.error(e);
      alert(`Impossible de lire « ${f.name} » (format non supporté ?).`);
    }
    onProgress?.(++done, files.length);
  }
  return out;
}

const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/public`;

export function imgUrl(p: Photo, thumb = true) {
  const path = thumb ? p.thumb : p.src;
  if (/^https?:/.test(path)) return path;
  return previews.get(path) ?? `${RAW}${path}`;
}

/** Tous les chemins de photos référencés dans un contenu. */
export function photoPaths(c: Content): Set<string> {
  const set = new Set<string>();
  const walk = (v: any) => {
    if (!v || typeof v !== 'object') return;
    if (typeof v.src === 'string' && typeof v.thumb === 'string' && 'w' in v) {
      set.add(v.src); set.add(v.thumb);
      return;
    }
    Object.values(v).forEach(walk);
  };
  walk(c);
  return set;
}

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Extrait l'identifiant d'une URL YouTube (ou renvoie la saisie si c'est déjà un ID). */
export function youtubeId(input: string) {
  const s = input.trim();
  const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : s;
}

/** Vérifications avant publication. Renvoie la liste des problèmes. */
export function validate(c: Content): string[] {
  const errs: string[] = [];
  const check = (list: { slug: string; title: string }[], label: string) => {
    const seen = new Set<string>();
    for (const x of list) {
      if (!x.slug) errs.push(`${label} « ${x.title || 'sans titre'} » : l'adresse (slug) est vide.`);
      else if (seen.has(x.slug)) errs.push(`${label} : l'adresse « ${x.slug} » est utilisée deux fois.`);
      seen.add(x.slug);
    }
  };
  check(c.galleries, 'Galerie');
  check(c.creations, 'Création');
  check(c.projects, 'Projet');
  if (!c.settings.name.trim()) errs.push('Général : le nom est vide.');
  return errs;
}
