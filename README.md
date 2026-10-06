# Portfolio — Quentin Girard

Site statique (Astro) publié sur GitHub Pages : https://nicknamezotb.github.io/portfolio

## Lancer en local

```bash
npm install
npm run dev
```

## Modifier le contenu (sans toucher au code)

Tout est dans `src/data/` :

| Fichier | Contenu |
|---|---|
| `site.json` | nom, e-mail, réseaux, ID Formspree |
| `videos.json` | vidéos YouTube par catégorie |
| `galleries.json` | galeries photo |
| `creations.json` | créations visuelles |
| `machu-picchu.json` | page du projet Machu Picchu |

Pour ajouter une vidéo, il suffit de copier un bloc dans `videos.json` et de changer l'ID YouTube (la partie après `v=` dans l'URL).

## Photos (depuis Google Drive)

1. Installe **Google Drive pour ordinateur** : ton Drive apparaît comme un disque (`G:\Mon Drive`).
2. Dans le Drive, crée `Portfolio/` avec un sous-dossier par galerie, nommé selon la liste de `media.config.json` (`paris`, `perou`, `mp-voyage`, …). Le dossier `hero` contient la grande photo de l'accueil.
3. Dépose tes photos en pleine qualité. L'ordre d'affichage suit l'ordre alphabétique des noms de fichiers.
4. Lance `npm run media` : les photos sont converties en WebP optimisé (sans données GPS) dans `public/media/`.
5. Publie : `git add -A && git commit -m "photos" && git push`.

Si ton Drive n'est pas sur `G:`, modifie `source` dans `media.config.json`.

## Formulaire de contact

Crée un formulaire gratuit sur https://formspree.io, puis colle son ID (ex. `xyzabcd`) dans `formspreeId` de `site.json`. Sans ID, le bouton ouvre la messagerie avec le message prérempli.

## Publication

Chaque `git push` sur `main` reconstruit et publie le site automatiquement (GitHub Actions).
