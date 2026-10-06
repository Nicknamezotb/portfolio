// Visionneuse plein écran minimaliste : clavier (← → Échap), swipe, préchargement.
let dlg: HTMLDialogElement | null = null;

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'lb';
  dlg.innerHTML = `
    <figure><img alt="" /></figure>
    <button class="lb-btn lb-close" aria-label="Fermer">✕</button>
    <button class="lb-btn lb-prev" aria-label="Photo précédente">←</button>
    <button class="lb-btn lb-next" aria-label="Photo suivante">→</button>
    <span class="lb-count"></span>`;
  const style = document.createElement('style');
  style.textContent = `
    .lb { position: fixed; inset: 0; width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
          background: rgb(12 13 16 / .97); color: #f2efe9; }
    .lb::backdrop { background: transparent; }
    .lb[open] { display: grid; place-items: center; animation: lbIn .3s ease; }
    @keyframes lbIn { from { opacity: 0 } }
    .lb figure { margin: 0; width: 100%; height: 100%; display: grid; place-items: center; padding: 64px clamp(12px, 6vw, 96px); }
    .lb img { max-width: 100%; max-height: 100%; object-fit: contain; transition: opacity .25s; }
    .lb img.loading { opacity: .2; }
    .lb-btn { position: absolute; background: none; border: 0; cursor: pointer; color: #9a9da5;
              font: 400 22px/1 'JetBrains Mono', monospace; padding: 16px; transition: color .2s; }
    .lb-btn:hover { color: #6e9fc1; }
    .lb-close { top: 8px; right: 8px; font-size: 18px; }
    .lb-prev { left: 4px; top: 50%; transform: translateY(-50%); }
    .lb-next { right: 4px; top: 50%; transform: translateY(-50%); }
    .lb-count { position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%);
                font: 12px 'JetBrains Mono', monospace; letter-spacing: .1em; color: #7c7f87; }
    @media (max-width: 720px) { .lb-prev, .lb-next { top: auto; bottom: 4px; transform: none; } }`;
  document.head.append(style);
  document.body.append(dlg);
}

export function initLightbox(grid: HTMLElement) {
  const links = [...grid.querySelectorAll<HTMLAnchorElement>('a.tile')];
  if (!links.length) return;
  let i = 0;

  const show = (n: number) => {
    i = (n + links.length) % links.length;
    const img = dlg!.querySelector('img')!;
    img.classList.add('loading');
    img.onload = () => img.classList.remove('loading');
    img.src = links[i].href;
    img.alt = links[i].querySelector('img')?.alt ?? '';
    dlg!.querySelector('.lb-count')!.textContent = `${i + 1} / ${links.length}`;
    new Image().src = links[(i + 1) % links.length].href; // précharge la suivante
  };

  const open = (n: number) => {
    if (!dlg) build();
    const d = dlg!;
    d.onclick = (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('.lb-prev')) show(i - 1);
      else if (t.closest('.lb-next')) show(i + 1);
      else if (t.closest('.lb-close') || t.tagName === 'FIGURE') d.close();
    };
    d.onkeydown = (e) => {
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    };
    let x0 = 0;
    d.ontouchstart = (e) => (x0 = e.touches[0].clientX);
    d.ontouchend = (e) => {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(dx > 0 ? i - 1 : i + 1);
    };
    show(n);
    d.showModal();
  };

  links.forEach((a, n) => a.addEventListener('click', (e) => { e.preventDefault(); open(n); }));
}
