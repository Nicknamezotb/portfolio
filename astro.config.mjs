import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// URL finale : https://nicknamezotb.github.io/portfolio
// Avec un domaine perso (ex. quentingirard.fr) : site: 'https://quentingirard.fr' et base: '/'.
export default defineConfig({
  site: 'https://nicknamezotb.github.io',
  base: '/portfolio',
  trailingSlash: 'ignore',
  integrations: [preact()],
  // Anciennes adresses Adobe Portfolio -> nouvelles pages
  redirects: {
    '/projets-video-1': '/video',
    '/work': '/photo',
    '/autres': '/creations',
    '/projet-mp': '/projets/machu-picchu',
    '/machu-picchu': '/projets/machu-picchu',
    '/soirees-afterworks-isep': '/photo/afterworks',
    '/concert-isepband': '/photo/concert-isepband',
    '/conference-macro-landi': '/photo/conference-marco-landi',
    '/paris': '/photo/paris',
    '/galerie-photos': '/photo/perou',
    '/italie': '/photo/italie',
    '/baiana': '/creations/baiana',
    '/nevera': '/creations/nevera',
    '/copie-de-nevera': '/creations/exalte',
  },
});
