// Alignement optique à gauche, au pixel près.
// Chaque lettre d'une police a une petite marge intégrée à gauche (plus visible en très grand,
// ex. le « Q » de Bebas Neue). On mesure le vrai bord de la première lettre de chaque texte
// et on décale le texte d'autant, pour que tous les bords gauches tombent sur la même ligne.

const SEL = '.display, .display > .w, .mono, .lede, .tagline, [data-optical]';
const SIZE = 400;
const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null = null;

/** Marge gauche réelle de la lettre, en em, mesurée en scannant les pixels dessinés. */
function bearing(char: string, font: string): number {
  const key = font + '|' + char;
  if (cache.has(key)) return cache.get(key)!;
  if (!ctx) {
    const c = document.createElement('canvas');
    c.width = SIZE * 2; c.height = SIZE * 2;
    ctx = c.getContext('2d', { willReadFrequently: true })!;
  }
  ctx.clearRect(0, 0, SIZE * 2, SIZE * 2);
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  const x0 = SIZE / 2;
  ctx.fillText(char, x0, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE * 2, SIZE * 2);
  let min = Infinity;
  for (let y = 0; y < SIZE * 2; y++) {
    for (let x = 0; x < min && x < SIZE * 2; x++) {
      if (data[(y * SIZE * 2 + x) * 4 + 3] > 60) { min = x; break; }
    }
  }
  const em = min === Infinity ? 0 : (min - x0) / SIZE;
  cache.set(key, em);
  return em;
}

function firstChar(el: Element): string {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent?.trimStart();
    if (t) return t[0];
  }
  return '';
}

export function alignOptically(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
    const cs = getComputedStyle(el);
    // seulement les blocs alignés à gauche (pas le texte centré ou à droite, pas les éléments en ligne)
    if (cs.display === 'inline' || !['left', 'start'].includes(cs.textAlign)) return;
    // si le texte commence par un sous-bloc (ex. le nom du hero en deux lignes), c'est lui qu'on corrige
    const first = el.firstElementChild as HTMLElement | null;
    if (first && getComputedStyle(first).display === 'block' && !first.previousSibling?.textContent?.trim()) return;
    let ch = firstChar(el);
    if (!ch) return;
    if (cs.textTransform === 'uppercase') ch = ch.toUpperCase();
    const font = `${cs.fontStyle} ${cs.fontWeight} ${SIZE}px ${cs.fontFamily}`;
    const em = bearing(ch, font);
    el.style.textIndent = em > 0.002 ? `${-em.toFixed(4)}em` : '';
  });
}

export function initOpticalAlign() {
  const run = () => alignOptically();
  if (document.fonts?.ready) document.fonts.ready.then(run); else run();
  addEventListener('load', run);
}
