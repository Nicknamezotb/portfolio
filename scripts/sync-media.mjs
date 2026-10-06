// Synchronise les photos depuis ton Google Drive vers le site.
//
// 1. Installe « Google Drive pour ordinateur » : ton Drive apparaît comme un disque (ex. G:\Mon Drive).
// 2. Crée un dossier « Portfolio » dans ton Drive, avec un sous-dossier par galerie
//    (noms = clés listées dans media.config.json, ex. « paris », « perou », « mp-voyage »).
// 3. Lance : npm run media
//
// Le script convertit chaque photo en WebP (grande taille + vignette), supprime les métadonnées
// (dont la position GPS) et met à jour src/data/media.json. Les originaux ne quittent jamais ton Drive.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const config = JSON.parse(await fs.readFile(path.join(ROOT, 'media.config.json'), 'utf8'));
const SOURCE = process.env.MEDIA_SOURCE || config.source;
const OUT = path.join(ROOT, 'public', 'media');
const MANIFEST = path.join(ROOT, 'src', 'data', 'media.json');
const EXT = /\.(jpe?g|png|webp|tiff?|heic|avif)$/i;

const { full, thumb } = config.sizes;

try {
  await fs.access(SOURCE);
} catch {
  console.error(`\n✗ Dossier source introuvable : ${SOURCE}`);
  console.error('  Modifie "source" dans media.config.json (ou la variable MEDIA_SOURCE).\n');
  process.exit(1);
}

const slugify = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const isNewer = async (src, dst) => {
  try { return (await fs.stat(src)).mtimeMs > (await fs.stat(dst)).mtimeMs; } catch { return true; }
};

const manifest = {};
const folders = (await fs.readdir(SOURCE, { withFileTypes: true })).filter((d) => d.isDirectory());
const unknown = folders.map((d) => d.name).filter((n) => !config.folders.includes(n));
if (unknown.length) console.warn(`⚠ Dossiers ignorés (pas dans media.config.json) : ${unknown.join(', ')}`);

for (const key of config.folders) {
  const dir = path.join(SOURCE, key);
  let files;
  try {
    files = (await fs.readdir(dir)).filter((f) => EXT.test(f)).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  } catch {
    continue; // dossier pas encore créé
  }
  if (!files.length) continue;

  const outDir = path.join(OUT, key);
  await fs.mkdir(outDir, { recursive: true });
  const keep = new Set();
  const photos = [];
  let converted = 0;

  for (const file of files) {
    const name = slugify(path.parse(file).name);
    const src = path.join(dir, file);
    const big = path.join(outDir, `${name}.webp`);
    const small = path.join(outDir, `${name}-sm.webp`);
    keep.add(path.basename(big)).add(path.basename(small));

    if (await isNewer(src, big)) {
      // .rotate() applique l'orientation EXIF ; sharp supprime ensuite toutes les métadonnées
      const img = sharp(src).rotate();
      await img.clone().resize({ width: full, height: full, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(big);
      await img.clone().resize({ width: thumb, withoutEnlargement: true }).webp({ quality: 74 }).toFile(small);
      converted++;
    }
    const { width, height } = await sharp(big).metadata();
    photos.push({ src: `/media/${key}/${name}.webp`, thumb: `/media/${key}/${name}-sm.webp`, w: width, h: height });
  }

  // supprime les fichiers dont l'original a disparu du Drive
  for (const f of await fs.readdir(outDir)) if (!keep.has(f)) await fs.rm(path.join(outDir, f));

  manifest[key] = photos;
  console.log(`✓ ${key.padEnd(24)} ${String(photos.length).padStart(4)} photos (${converted} converties)`);
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nManifest mis à jour : ${Object.keys(manifest).length} dossiers.`);
