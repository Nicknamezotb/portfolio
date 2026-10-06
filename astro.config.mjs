import { defineConfig } from 'astro/config';

// URL finale : https://nicknamezotb.github.io/portfolio
// Si tu passes sur un domaine perso (ex. quentingirard.fr), mets site: 'https://quentingirard.fr' et base: '/'.
export default defineConfig({
  site: 'https://nicknamezotb.github.io',
  base: '/portfolio',
  trailingSlash: 'ignore',
  // Anciennes adresses Adobe Portfolio -> nouvelles pages
  redirects: {
    '/projets-video-1': '/video',
    '/work': '/photo',
    '/autres': '/creations',
    '/projet-mp': '/machu-picchu',
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
