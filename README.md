# Portfolio — Quentin Girard

Site statique (Astro) publié sur GitHub Pages : https://nicknamezotb.github.io/portfolio

## Back-office

**https://nicknamezotb.github.io/portfolio/admin**

Tout le site se gère depuis là : textes, réseaux, couleurs, vidéos, galeries, créations, projets et photos.

- **Connexion** : avec un jeton GitHub personnel du compte `Nicknamezotb` (la marche à suivre s'affiche sur l'écran de connexion). Le back-office vérifie que le jeton appartient bien à ce compte et qu'il peut écrire dans le repo : personne d'autre ne peut modifier le site.
- **Publier** : chaque clic sur « Publier » crée un commit sur `main` (contenu + photos), puis le site se reconstruit tout seul en 1 à 2 minutes. La barre du haut affiche l'état de la mise en ligne.
- **Photos** : glisse-les dans l'admin. Elles sont compressées dans le navigateur (WebP, 2000 px max + vignette 720 px, sans données GPS) et rangées dans `public/media/`. Une photo retirée de toutes les pages est supprimée du repo à la publication suivante.

### Comment ça marche

Il n'y a pas de serveur : le back-office (`src/admin/`) lit et écrit directement `src/data/content.json` et `public/media/` via l'API GitHub. GitHub Actions reconstruit ensuite le site à chaque commit.

## Développement local

```bash
npm install
npm run dev
```

- Site : http://localhost:4321/portfolio
- Back-office en mode test (sans GitHub, rien n'est publié) : http://localhost:4321/portfolio/admin?local

## Structure

| Chemin | Rôle |
|---|---|
| `src/data/content.json` | Tout le contenu du site (modifié par le back-office) |
| `src/lib/types.ts` | Structure du contenu |
| `src/pages/` | Pages du site |
| `src/admin/` | Back-office (Preact) |
| `public/media/` | Photos publiées |
