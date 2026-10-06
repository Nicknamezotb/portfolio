// Accès au repo GitHub depuis le navigateur.
// Le back-office n'a pas de serveur : il lit et écrit directement les fichiers du repo,
// avec un jeton personnel GitHub. Sans ce jeton (que seul le propriétaire possède), rien n'est modifiable.

export const OWNER = 'Nicknamezotb';
export const REPO = 'portfolio';
export const BRANCH = 'main';
export const CONTENT_PATH = 'src/data/content.json';
export const SITE_URL = 'https://nicknamezotb.github.io/portfolio';

const API = 'https://api.github.com';
const TOKEN_KEY = 'qg-admin-token';

export class GitHubError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY),
  set: (t: string, remember: boolean) => (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t),
  clear: () => { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); },
};

async function gh<T = any>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message ?? msg; } catch {}
    throw new GitHubError(msg, res.status);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const repo = `/repos/${OWNER}/${REPO}`;

/** Vérifie que le jeton appartient au propriétaire du site et peut écrire dans le repo. */
export async function verify(token: string) {
  let user;
  try {
    user = await gh(token, '/user');
  } catch (e) {
    throw new GitHubError('Jeton invalide ou expiré.');
  }
  if (user.login.toLowerCase() !== OWNER.toLowerCase()) {
    throw new GitHubError(`Accès refusé : ce jeton appartient à « ${user.login} ».`);
  }
  let r;
  try {
    r = await gh(token, repo);
  } catch {
    throw new GitHubError(`Ce jeton n'a pas accès au repo ${OWNER}/${REPO}.`);
  }
  if (!r.permissions?.push) throw new GitHubError("Ce jeton n'a pas le droit d'écriture (Contents : Read and write).");
  return { login: user.login as string, avatar: user.avatar_url as string };
}

const decodeB64 = (b64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));

/** Lit content.json tel qu'il est sur GitHub (version la plus récente, pas celle du site déployé). */
export async function loadContent(token: string) {
  if (LOCAL) return { data: structuredClone((await import('../data/content.json')).default), sha: 'local' };
  const f = await gh(token, `${repo}/contents/${CONTENT_PATH}?ref=${BRANCH}&t=${Date.now()}`);
  return { data: JSON.parse(decodeB64(f.content)), sha: f.sha as string };
}

const blobToB64 = (b: Blob) =>
  new Promise<string>((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok((r.result as string).split(',')[1]);
    r.onerror = ko;
    r.readAsDataURL(b);
  });

export type PublishInput = {
  json: string;
  loadedSha: string;
  uploads: Map<string, Blob>; // chemin dans le repo -> fichier
  deletes: string[];          // chemins dans le repo
  message: string;
  onProgress?: (done: number, total: number) => void;
};

/** Publie tout en un seul commit (contenu + nouvelles photos + suppressions). */
export async function publish(token: string, { json, loadedSha, uploads, deletes, message, onProgress }: PublishInput) {
  const ref = await gh(token, `${repo}/git/ref/heads/${BRANCH}`);
  const head = ref.object.sha as string;

  // Protection : si content.json a été modifié ailleurs entre-temps, on ne l'écrase pas.
  const current = await gh(token, `${repo}/contents/${CONTENT_PATH}?ref=${head}`);
  if (current.sha !== loadedSha) {
    throw new GitHubError('Le contenu a été modifié ailleurs (autre onglet ?). Recharge la page avant de publier.');
  }

  const commit = await gh(token, `${repo}/git/commits/${head}`);
  const tree: any[] = [{ path: CONTENT_PATH, mode: '100644', type: 'blob', content: json }];

  const total = uploads.size;
  let done = 0;
  onProgress?.(0, total);
  for (const [path, blob] of uploads) {
    const b = await gh(token, `${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: await blobToB64(blob), encoding: 'base64' }),
    });
    tree.push({ path, mode: '100644', type: 'blob', sha: b.sha });
    onProgress?.(++done, total);
  }
  for (const path of deletes) tree.push({ path, mode: '100644', type: 'blob', sha: null });

  const newTree = await gh(token, `${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: commit.tree.sha, tree }),
  });
  const newCommit = await gh(token, `${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
  });
  await gh(token, `${repo}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha }) });

  const after = await gh(token, `${repo}/contents/${CONTENT_PATH}?ref=${newCommit.sha}`);
  return { commit: newCommit.sha as string, contentSha: after.sha as string };
}

export type DeployState = 'pending' | 'running' | 'success' | 'failure' | 'unknown';

/** État du déploiement GitHub Pages déclenché par un commit. */
export async function deployStatus(token: string, sha: string): Promise<DeployState> {
  try {
    const r = await gh(token, `${repo}/actions/runs?head_sha=${sha}&per_page=1`);
    const run = r.workflow_runs?.[0];
    if (!run) return 'pending';
    if (run.status !== 'completed') return 'running';
    return run.conclusion === 'success' ? 'success' : 'failure';
  } catch {
    return 'unknown'; // jeton sans permission « Actions : read »
  }
}

/** Lien de création de jeton prérempli (fine-grained, limité à ce repo). */
export const TOKEN_URL =
  'https://github.com/settings/personal-access-tokens/new?' +
  new URLSearchParams({
    name: 'Back-office portfolio',
    description: 'Accès du back-office au repo portfolio',
    target_name: OWNER,
    expires_in: '366',
    contents: 'write',
    actions: 'read',
  });

/** Mode test local (uniquement avec `npm run dev` et ?local dans l'URL) : aucun accès GitHub. */
export const LOCAL = import.meta.env.DEV && typeof location !== 'undefined' && location.search.includes('local');
