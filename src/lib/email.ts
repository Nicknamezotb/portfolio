// Adresse e-mail masquée : jamais écrite en clair dans le HTML (les robots qui collectent
// les adresses ne la trouvent pas), décodée seulement au clic dans le navigateur.

// Côté build : adresse inversée puis encodée en base64, à placer dans data-e.
export const encodeEmail = (email: string) => Buffer.from([...email].reverse().join('')).toString('base64');

// Côté navigateur.
export const decodeEmail = (code: string) => [...atob(code)].reverse().join('');

// Branche tous les boutons [data-copy-email] : copie l'adresse et affiche « Copiée ✓ ».
export function initCopyEmail() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy-email]').forEach((btn) => {
    const label = btn.querySelector('.ce-label') ?? btn;
    const initial = label.textContent;
    btn.addEventListener('click', async () => {
      const email = decodeEmail(btn.dataset.e!);
      try {
        await navigator.clipboard.writeText(email);
        label.textContent = 'Adresse copiée ✓';
      } catch {
        // Presse-papiers refusé (vieux navigateur) : on affiche l'adresse à la place.
        label.textContent = email;
        return;
      }
      clearTimeout(Number(btn.dataset.t));
      btn.dataset.t = String(setTimeout(() => (label.textContent = initial), 2200));
    });
  });
}
