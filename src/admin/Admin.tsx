import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Content } from '../lib/types';
import {
  verify, loadContent, publish, deployStatus, tokenStore, TOKEN_URL, SITE_URL, OWNER, REPO, LOCAL,
  type DeployState,
} from './github';
import { StoreCtx, addFiles, imgUrl, pending, photoPaths, validate } from './store';
import { PANELS } from './panels';
import './admin.css';

type User = { login: string; avatar: string };

/* ---------- Connexion ---------- */

function Login({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: Event) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const t = token.trim();
      const user = await verify(t);
      tokenStore.set(t, remember);
      onLogin(t, user);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="login">
      <form class="login-box" onSubmit={submit}>
        <p class="kicker">Back-office</p>
        <h1>Connexion</h1>
        <p class="muted">
          L'accès est réservé au propriétaire du compte GitHub <b>{OWNER}</b>. La clé d'accès est un jeton GitHub personnel.
        </p>
        <label class="field">
          <span class="label">Jeton GitHub</span>
          <input type="password" value={token} onInput={(e) => setToken(e.currentTarget.value)} placeholder="github_pat_…" autoComplete="current-password" required />
        </label>
        <label class="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.currentTarget.checked)} />
          Rester connecté sur cet appareil
        </label>
        {err && <p class="error">{err}</p>}
        <button class="btn primary" disabled={busy}>{busy ? 'Vérification…' : 'Se connecter'}</button>

        <details class="help">
          <summary>Première connexion : créer mon jeton</summary>
          <ol>
            <li>Ouvre <a href={TOKEN_URL} target="_blank" rel="noopener">la page de création de jeton GitHub</a> (connecté avec <b>{OWNER}</b>).</li>
            <li><b>Repository access</b> : « Only select repositories » → <b>{REPO}</b>.</li>
            <li><b>Permissions</b> : <i>Contents</i> → Read and write, et <i>Actions</i> → Read-only.</li>
            <li>Clique sur <b>Generate token</b>, copie-le et colle-le ci-dessus.</li>
          </ol>
          <p class="muted">Garde ce jeton pour toi : il fonctionne comme un mot de passe. Tu peux le révoquer à tout moment sur GitHub.</p>
        </details>
      </form>
    </div>
  );
}

/* ---------- Application ---------- */

const DEPLOY_LABEL: Record<DeployState, string> = {
  pending: 'Mise en ligne en attente…',
  running: 'Mise en ligne en cours…',
  success: 'En ligne ✓',
  failure: 'Échec de la mise en ligne',
  unknown: 'Publié. En ligne d’ici 1 à 2 minutes.',
};

function Editor({ token, user, onLogout }: { token: string; user: User; onLogout: () => void }) {
  const [content, setContent] = useState<Content | null>(null);
  const [original, setOriginal] = useState<Content | null>(null);
  const [sha, setSha] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState(() => location.hash.slice(1) || 'general');
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deploy, setDeploy] = useState<DeployState | null>(null);
  const [menu, setMenu] = useState(false);
  const poll = useRef<number>();

  const reload = () => {
    setError('');
    loadContent(token)
      .then(({ data, sha }) => {
        // Valeurs par défaut pour les champs ajoutés après coup
        data.home = { heroCaption: '', heroSide: 'left', heroOpacity: 55, ...data.home };
        data.home.cards = { photo: null, video: null, creations: null, ...data.home.cards };
        setContent(data); setOriginal(structuredClone(data)); setSha(sha); setDirty(false); })
      .catch((e) => setError(`Impossible de charger le contenu : ${e.message}`));
  };
  useEffect(reload, [token]);

  useEffect(() => { location.hash = tab; }, [tab]);

  // Avertit avant de quitter avec des modifications non publiées
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    addEventListener('beforeunload', h);
    return () => removeEventListener('beforeunload', h);
  }, [dirty]);

  useEffect(() => () => clearInterval(poll.current), []);

  const store = useMemo(() => content && {
    content,
    set: (fn: (d: Content) => void) => {
      setContent((prev) => { const next = structuredClone(prev!); fn(next); return next; });
      setDirty(true);
      setDeploy(null);
    },
    addFiles,
    imgUrl,
  }, [content]);

  const doPublish = async () => {
    if (!content || !original) return;
    const errs = validate(content);
    if (errs.length) { alert('À corriger avant de publier :\n\n• ' + errs.join('\n• ')); return; }

    const now = photoPaths(content);
    const before = photoPaths(original);
    const uploads = new Map<string, Blob>();
    for (const [path, blob] of pending) if (now.has(path.replace(/^public/, ''))) uploads.set(path, blob);
    const deletes = [...before].filter((p) => !now.has(p)).map((p) => `public${p}`);

    const parts = [];
    if (uploads.size) parts.push(`${uploads.size / 2} photo(s) ajoutée(s)`);
    if (deletes.length) parts.push(`${deletes.length / 2} photo(s) supprimée(s)`);
    const message = `Back-office : mise à jour du contenu${parts.length ? ` (${parts.join(', ')})` : ''}`;

    setPublishing('Préparation…');
    try {
      const res = await publish(token, {
        json: JSON.stringify(content, null, 2) + '\n',
        loadedSha: sha,
        uploads,
        deletes,
        message,
        onProgress: (d, t) => t && setPublishing(`Envoi des photos… ${d} / ${t}`),
      });
      for (const p of uploads.keys()) pending.delete(p);
      setSha(res.contentSha);
      setOriginal(structuredClone(content));
      setDirty(false);
      setDeploy('pending');
      clearInterval(poll.current);
      const started = Date.now();
      poll.current = window.setInterval(async () => {
        const s = await deployStatus(token, res.commit);
        setDeploy(s);
        if (s === 'success' || s === 'failure' || s === 'unknown' || Date.now() - started > 6 * 60_000) clearInterval(poll.current);
      }, 5000);
    } catch (e: any) {
      alert(`La publication a échoué : ${e.message}`);
    } finally {
      setPublishing(null);
    }
  };

  if (error) return <div class="center"><p class="error">{error}</p><button class="btn" onClick={reload}>Réessayer</button> <button class="btn ghost" onClick={onLogout}>Se déconnecter</button></div>;
  if (!content || !store) return <div class="center muted">Chargement du contenu…</div>;

  const Current = (PANELS.find((p) => p.id === tab) ?? PANELS[0]).C;

  return (
    <StoreCtx.Provider value={store}>
      <div class={`app${menu ? ' menu-open' : ''}`}>
        <aside class="side">
          <div class="side-head">
            <span class="logo">QG</span>
            <span><b>Back-office</b><small>{content.settings.name}</small></span>
          </div>
          <nav>
            {PANELS.map((p) => (
              <button type="button" class={tab === p.id ? 'active' : ''} onClick={() => { setTab(p.id); setMenu(false); scrollTo(0, 0); }}>
                <span class="ico" aria-hidden="true">{p.icon}</span>{p.label}
              </button>
            ))}
          </nav>
          <div class="side-foot">
            <a href={SITE_URL} target="_blank" rel="noopener" class="btn ghost small">Voir le site ↗</a>
            <div class="user">
              <img src={user.avatar} alt="" />
              <span>{user.login}</span>
              <button type="button" class="link" onClick={() => { if (!dirty || confirm('Des modifications ne sont pas publiées. Se déconnecter quand même ?')) onLogout(); }}>Déconnexion</button>
            </div>
          </div>
        </aside>

        <div class="main">
          <header class="topbar">
            <button type="button" class="burger" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button>
            <div class="status">
              {publishing
                ? <span class="dot busy" />
                : dirty ? <span class="dot warn" /> : <span class={`dot ${deploy === 'failure' ? 'err' : deploy && deploy !== 'success' && deploy !== 'unknown' ? 'busy' : 'ok'}`} />}
              <span>
                {publishing ?? (dirty ? 'Modifications non publiées' : deploy ? DEPLOY_LABEL[deploy] : 'Tout est publié')}
              </span>
            </div>
            <div class="top-actions">
              {dirty && !publishing && (
                <button type="button" class="btn ghost" onClick={() => { if (confirm('Annuler toutes les modifications non publiées ?')) reload(); }}>Annuler</button>
              )}
              <button type="button" class="btn primary" disabled={!dirty || !!publishing} onClick={doPublish}>
                {publishing ? 'Publication…' : 'Publier'}
              </button>
            </div>
          </header>
          <div class="content">
            <Current />
          </div>
        </div>
      </div>
    </StoreCtx.Provider>
  );
}

export default function Admin() {
  const [session, setSession] = useState<{ token: string; user: User } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (LOCAL) { setSession({ token: 'local', user: { login: 'test-local', avatar: '' } }); setChecking(false); return; }
    const t = tokenStore.get();
    if (!t) { setChecking(false); return; }
    verify(t)
      .then((user) => setSession({ token: t, user }))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <div class="center muted">Chargement…</div>;
  if (!session) return <Login onLogin={(token, user) => setSession({ token, user })} />;
  return <Editor token={session.token} user={session.user} onLogout={() => { tokenStore.clear(); setSession(null); }} />;
}
