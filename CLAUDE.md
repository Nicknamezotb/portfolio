# Portfolio Quentin Girard — notes de travail

Portfolio photo/vidéo de Quentin Girard (remplace quentingirard.myportfolio.com, Adobe Portfolio).
Quentin échange en français, avec un langage familier ; il n'est pas développeur : lui expliquer simplement, sans jargon.

## Où est quoi

| Élément | Emplacement |
|---|---|
| Code source | `C:\Users\qgir2\Desktop\Portfolio` (Windows 11) |
| Repo GitHub | https://github.com/Nicknamezotb/portfolio (public, branche `main`) |
| Site en ligne | https://nicknamezotb.github.io/portfolio/ (GitHub Pages) |
| Back-office | https://nicknamezotb.github.io/portfolio/admin |
| Contenu (textes, listes, réglages) | `src/data/content.json` (fichier unique) |
| Photos publiées | `public/media/<id>.webp` + `<id>-sm.webp` (vignette), dans le repo |
| Vidéos | YouTube (chaîne @qg.production), seulement les ID dans content.json |
| Photos de démo | picsum.photos, générées à la volée tant qu'une liste de photos est vide |
| Formulaire de contact | Formspree si `settings.formspreeId` est rempli (vide pour l'instant), sinon repli mailto |
| Polices | auto-hébergées via @fontsource (Bebas Neue, Inter, JetBrains Mono) |

Pas de domaine perso pour l'instant. Pour en ajouter un : `site` et `base: '/'` dans `astro.config.mjs` + fichier `public/CNAME`.

## Stack

- **Astro 7** (site 100 % statique), `base: '/portfolio'` → **tous les liens internes passent par `url()`** de `src/lib/media.ts`.
- **Preact** (`@astrojs/preact`) uniquement pour le back-office (`client:only`).
- Node 26 / npm 11 en local. npm 11 bloque les scripts d'installation : après un `npm i`, si esbuild ou sharp posent problème → `npm install-scripts approve esbuild sharp`.
- CI : `.github/workflows/deploy.yml` (withastro/action, **`node-version: 24` obligatoire**, Astro 7 refuse Node 20).

## Commandes

```bash
npm run dev      # http://localhost:4321/portfolio  (config preview : .claude/launch.json, nom "portfolio")
npm run build    # vérifier avant de pousser
```

- Admin en local **sans GitHub** : http://localhost:4321/portfolio/admin?local (mode `LOCAL` dans `src/admin/github.ts`, actif seulement en dev ; il charge le content.json local et ne peut pas publier).
- Déployer : `git push` sur `main` → GitHub Actions publie en ~1 min.
- Suivre le déploiement : `"/c/Program Files/GitHub CLI/gh.exe" run list -R Nicknamezotb/portfolio -L 3` puis `gh run watch <id> --exit-status`.
- Commits : `git -c user.name="Quentin Girard" -c user.email="qg.girard@gmail.com" commit ...` (pas d'identité git globale configurée), avec la ligne Co-Authored-By.

## Architecture du site

```
src/
  data/content.json      tout le contenu (voir types)
  lib/types.ts           type Content (partagé site + admin) — À METTRE À JOUR à chaque nouveau champ
  lib/media.ts           content, url(), photos()/cover()/single() (+ repli démo), ytThumb()
  lib/lightbox.ts        visionneuse plein écran (vanilla)
  layouts/Base.astro     <head>, thème injecté en variables CSS, prop bodyClass
  components/            Nav, Footer, PhotoGrid (masonry en colonnes CSS), VideoEmbed (façade YouTube)
  pages/
    index.astro          accueil : hero plein écran + voile, cartes rubriques, projet à la une
    photo/index, photo/[slug]          galeries
    video.astro                         vidéos par catégorie
    creations/index, creations/[slug]   créations visuelles
    projets/[slug]                      projets longs (ex. machu-picchu)
    contact, 404, admin
  admin/                 back-office (voir ci-dessous)
  styles/global.css
```

- **Thème** : seules `--bg`, `--text` et `--accent` viennent de `settings.theme` (injectées en `html:root` dans Base.astro, spécificité plus forte que global.css). Toutes les autres teintes (`--muted`, `--line`, `--raised`…) sont dérivées par `color-mix()`. Thème clair par défaut (#f5f3ee / #17181c / #3f6a91).
- **Accueil** : `home.heroPhoto`, `heroSide` (left/right), `heroOpacity` (0–100, opacité du voile), `heroCaption`, `cards.{photo,video,creations}` (null = image par défaut tirée du contenu), `featured` (slug de projet). Sur l'accueil, le menu desktop est une pastille en verre (`body.home:not(.scrolled)`).
- **Redirections** des anciennes URL Adobe (`/projet-mp`, `/work`, `/copie-de-nevera`…) dans `astro.config.mjs` → `redirects`.
- **Miniatures YouTube** : `maxresdefault` (16/9) ; `hqdefault` a des bandes noires. VideoEmbed retombe sur hqdefault si maxres n'existe pas.

## Back-office (`src/admin/`)

Pas de serveur : l'admin lit et écrit le repo via l'API GitHub, depuis le navigateur.

- **Auth** : jeton GitHub *fine-grained* de Quentin (repo `portfolio`, Contents RW + Actions R). `verify()` exige `login === Nicknamezotb` et `permissions.push`. Jeton stocké en localStorage/sessionStorage (`qg-admin-token`). Ne jamais saisir de jeton réel à sa place : c'est lui qui le crée et le colle.
- **Publication** (`publish()` dans github.ts) : **un seul commit** via l'API Git Data (blobs → tree → commit → PATCH ref) contenant content.json + photos ajoutées + suppressions. Refus si le sha de content.json a changé depuis le chargement (conflit).
- **Photos** : `images.ts` compresse dans le navigateur (OffscreenCanvas → WebP, 2000 px q0.82 + vignette 720 px q0.75, métadonnées/GPS supprimées). Les fichiers restent en attente dans `store.pending` jusqu'à la publication. Suppressions et ajouts sont **calculés au moment de publier** en comparant `photoPaths(original)` et `photoPaths(contenu)` : rien à gérer à chaque action.
- Aperçu des photos déjà publiées dans l'admin : raw.githubusercontent.com (pas le site déployé, qui peut être en retard).
- Après publication : on interroge `actions/runs?head_sha=` toutes les 5 s pour afficher « En ligne ✓ ».
- Fichiers : `Admin.tsx` (connexion, éditeur, barre Publier), `panels.tsx` (Général, Accueil, Vidéos, Galeries, Créations, Projets), `ui.tsx` (Field, Area, Toggle, ColorField, SlugField, YouTubeField, ItemList repliable/réordonnable, PhotoManager glisser-déposer, SectionsEditor), `store.ts` (contexte, slugify, youtubeId, validate), `admin.css`.

### Ajouter un champ configurable (procédure)
1. Ajouter le champ dans `src/lib/types.ts`.
2. L'ajouter dans `src/data/content.json` avec sa valeur par défaut.
3. Ajouter un **défaut de secours** au chargement dans `Admin.tsx` (`reload()`, normalisation de `data.home`…) et avec `??` côté pages, au cas où le content.json en ligne serait plus ancien.
4. L'éditer dans le bon panneau de `panels.tsx`.
5. L'utiliser dans les pages. Puis `npm run build`, tester `/admin?local`, pousser.

⚠️ Quentin peut publier depuis l'admin à tout moment : **faire `git pull` avant de modifier content.json en local**, sinon conflit.

## Pièges de l'environnement

- Bash = Git Bash sous Windows. **Python n'est pas installé** (utiliser `node -e` pour les scripts).
- Les heredocs bash contenant beaucoup de backticks/apostrophes ont cassé une fois → préférer l'outil Write pour les fichiers.
- `gh` n'est pas dans le PATH : `"/c/Program Files/GitHub CLI/gh.exe"`. Il est connecté au compte Nicknamezotb (keyring).
- L'outil `run_in_terminal` échoue (intégration terminal du desktop cassée) → demander à Quentin de lancer lui-même les commandes interactives.
- Avertissements « LF will be replaced by CRLF » au commit : sans conséquence.
- Le serveur de dev doit être relancé après une modification de `astro.config.mjs`.

## Contenu et décisions

- 6 galeries, 10 vidéos (4 catégories), 3 créations (BAIANA, NEVERA, EXALTE), 1 projet (Machu Picchu). Toutes les galeries sont encore vides (photos de démo).
- Les vraies photos de l'ancien site Adobe n'ont pas été récupérées (proposé, pas encore accepté).
- Année de BAIANA incertaine (2026 sur une page de l'ancien site, 2025 sur une autre) : 2026 retenu, à confirmer avec Quentin.
- Préférences de Quentin : pas de jaune ; rendu moderne, épuré, typographie pas trop grosse ; thème clair ; tout doit être modifiable depuis l'admin ; il veut être le seul administrateur.
- État : le bouton Publier de l'admin n'a pas encore été testé avec un vrai jeton (attente du premier essai de Quentin).
