import type { Content } from '../lib/types';
import { useStore, slugify } from './store';
import { Panel, Card, Field, Area, Toggle, ColorField, SlugField, YouTubeField, ItemList, PhotoManager, SectionsEditor } from './ui';

const THEMES = {
  Clair: { bg: '#f5f3ee', text: '#17181c', accent: '#3f6a91' },
  Sombre: { bg: '#14151a', text: '#f2efe9', accent: '#6e9fc1' },
  Papier: { bg: '#efeae0', text: '#2a2620', accent: '#9a5b32' },
  Blanc: { bg: '#ffffff', text: '#111111', accent: '#111111' },
};

/* ---------- Général ---------- */

export function General() {
  const { content: c, set } = useStore();
  const s = c.settings;
  return (
    <Panel title="Général" intro="Identité, coordonnées, réseaux et apparence du site.">
      <Card title="Identité">
        <Field label="Nom" value={s.name} onChange={(v) => set((d) => (d.settings.name = v))} />
        <Field label="Métier" value={s.role} onChange={(v) => set((d) => (d.settings.role = v))} placeholder="Photographe · Vidéaste" />
      </Card>

      <Card title="Contact">
        <Field label="E-mail" type="email" value={s.email} onChange={(v) => set((d) => (d.settings.email = v))} />
        <Field
          label="Identifiant Formspree"
          value={s.formspreeId}
          onChange={(v) => set((d) => (d.settings.formspreeId = v.replace(/.*\/f\//, '').trim()))}
          placeholder="ex. xyzabcd"
          hint={<>Optionnel. Crée un formulaire gratuit sur <a href="https://formspree.io" target="_blank">formspree.io</a> et colle son ID. Sans ID, le formulaire ouvre la messagerie du visiteur.</>}
        />
      </Card>

      <Card title="Réseaux sociaux">
        <div class="field wide">
          <ItemList
            items={s.socials}
            onChange={(v) => set((d) => (d.settings.socials = v))}
            title={(x) => x.label || 'Sans nom'}
            meta={(x) => x.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
            create={() => ({ label: 'Nouveau réseau', url: 'https://' })}
            addLabel="Ajouter un réseau"
            render={(x, up) => (
              <div class="grid">
                <Field label="Nom affiché" value={x.label} onChange={(v) => up((y) => (y.label = v))} />
                <Field label="Lien" type="url" value={x.url} onChange={(v) => up((y) => (y.url = v))} />
              </div>
            )}
          />
        </div>
      </Card>

      <Card title="Apparence">
        <div class="field wide">
          <span class="label">Thèmes prêts à l'emploi</span>
          <div class="themes">
            {Object.entries(THEMES).map(([name, t]) => (
              <button
                type="button"
                class={`theme${s.theme.bg === t.bg && s.theme.text === t.text ? ' active' : ''}`}
                style={{ background: t.bg, color: t.text }}
                onClick={() => set((d) => (d.settings.theme = { ...t }))}
              >
                <span style={{ background: t.accent }} />
                {name}
              </button>
            ))}
          </div>
        </div>
        <ColorField label="Fond" value={s.theme.bg} onChange={(v) => set((d) => (d.settings.theme.bg = v))} />
        <ColorField label="Texte" value={s.theme.text} onChange={(v) => set((d) => (d.settings.theme.text = v))} />
        <ColorField label="Accent" value={s.theme.accent} onChange={(v) => set((d) => (d.settings.theme.accent = v))} />
        <div class="field preview" style={{ background: s.theme.bg, color: s.theme.text }}>
          <span class="pv-title">Aperçu</span>
          <span>Texte courant <a style={{ color: s.theme.accent }}>et un lien</a></span>
        </div>
        <Toggle
          label="Photos de démonstration"
          hint="Tant qu'une galerie est vide, afficher des photos d'exemple. À désactiver une fois tes vraies photos ajoutées."
          checked={s.demoPhotos}
          onChange={(v) => set((d) => (d.settings.demoPhotos = v))}
        />
      </Card>
    </Panel>
  );
}

/* ---------- Accueil ---------- */

const CARD_LABELS = {
  photo: ['Carte « Photo »', 'Par défaut : la couverture de ta première galerie.'],
  video: ['Carte « Vidéo »', 'Par défaut : la miniature de ta première vidéo.'],
  creations: ['Carte « Créations »', 'Par défaut : la première image de ta première création.'],
} as const;

function HeroPreview() {
  const { content: c, imgUrl } = useStore();
  const h = c.home;
  const [first, ...rest] = c.settings.name.trim().split(/\s+/);
  const t = c.settings.theme;
  const bg = h.heroPhoto ? imgUrl(h.heroPhoto, false) : 'https://picsum.photos/seed/hero-cover/1200/800';
  return (
    <div class={`hero-preview side-${h.heroSide}`} style={{ '--bg': t.bg, '--text': t.text, '--accent': t.accent, '--veil': `${h.heroOpacity}%` } as any}>
      <img src={bg} alt="" />
      <div class="hp-veil" />
      <div class="hp-text">
        <span class="hp-kicker">{c.settings.role}</span>
        <span class="hp-name">{first}<br /><i>{rest.join(' ')}</i></span>
        <span class="hp-tag">{h.tagline}</span>
      </div>
      {h.heroCaption && <span class="hp-cap">{h.heroCaption}</span>}
    </div>
  );
}

export function Home() {
  const { content: c, set } = useStore();
  const h = c.home;
  return (
    <Panel title="Accueil" intro="La première chose que voient tes visiteurs.">
      <Card title="Écran d'arrivée">
        <div class="field wide">
          <span class="label">Aperçu</span>
          <HeroPreview />
          <span class="hint">Aperçu indicatif. Le rendu exact est visible sur le site après publication.</span>
        </div>
        <PhotoManager
          label="Photo plein écran"
          single
          photos={h.heroPhoto ? [h.heroPhoto] : []}
          onChange={(p) => set((d) => (d.home.heroPhoto = p[0] ?? null))}
          hint="Occupe tout l'écran. Choisis une photo horizontale dont le sujet est du côté opposé au texte. "
        />
        <Area label="Phrase d'accroche" rows={2} value={h.tagline} onChange={(v) => set((d) => (d.home.tagline = v))} />
        <Field label="Légende de la photo (optionnelle)" value={h.heroCaption} onChange={(v) => set((d) => (d.home.heroCaption = v))} placeholder="ex. Cusco, Pérou · 2025" />
        <label class="field">
          <span class="label">Côté du texte</span>
          <div class="seg">
            {(['left', 'right'] as const).map((s) => (
              <button type="button" class={h.heroSide === s ? 'active' : ''} onClick={() => set((d) => (d.home.heroSide = s))}>
                {s === 'left' ? '← Gauche' : 'Droite →'}
              </button>
            ))}
          </div>
        </label>
        <label class="field">
          <span class="label">Opacité du voile : {h.heroOpacity} %</span>
          <input type="range" min="0" max="95" step="5" value={h.heroOpacity} onInput={(e) => set((d) => (d.home.heroOpacity = Number(e.currentTarget.value)))} />
          <span class="hint">Plus c'est élevé, plus le texte est lisible et la photo estompée derrière.</span>
        </label>
      </Card>

      <Card title="Images des rubriques">
        {(Object.keys(CARD_LABELS) as (keyof typeof CARD_LABELS)[]).map((k) => (
          <div class="field">
            <PhotoManager
              label={CARD_LABELS[k][0]}
              single
              photos={h.cards[k] ? [h.cards[k]!] : []}
              onChange={(p) => set((d) => (d.home.cards[k] = p[0] ?? null))}
              hint={`${CARD_LABELS[k][1]} Format vertical conseillé. `}
            />
          </div>
        ))}
      </Card>
      <Card title="À la une">
        <label class="field wide">
          <span class="label">Projet mis en avant</span>
          <select value={c.home.featured} onChange={(e) => set((d) => (d.home.featured = e.currentTarget.value))}>
            {c.projects.map((p) => <option value={p.slug}>{p.title}</option>)}
          </select>
          <span class="hint">Les projets se gèrent dans l'onglet « Projets ».</span>
        </label>
      </Card>
    </Panel>
  );
}

/* ---------- Vidéos ---------- */

export function Videos() {
  const { content: c, set } = useStore();
  return (
    <Panel title="Vidéos" intro="Tes vidéos YouTube, rangées par catégorie. L'ordre ici est l'ordre sur le site.">
      <ItemList
        items={c.videos}
        onChange={(v) => set((d) => (d.videos = v))}
        title={(cat) => cat.category || 'Catégorie sans nom'}
        meta={(cat) => `${cat.items.length} vidéo${cat.items.length > 1 ? 's' : ''}`}
        create={() => ({ category: 'Nouvelle catégorie', items: [] })}
        addLabel="Ajouter une catégorie"
        confirmDelete={(cat) => `Supprimer la catégorie « ${cat.category} » et ses ${cat.items.length} vidéos ?`}
        startOpen={0}
        render={(cat, up) => (
          <div class="grid">
            <Field label="Nom de la catégorie" value={cat.category} onChange={(v) => up((x) => (x.category = v))} wide />
            <div class="field wide">
              <span class="label">Vidéos</span>
              <ItemList
                items={cat.items}
                onChange={(items) => up((x) => (x.items = items))}
                title={(v) => v.title || 'Vidéo sans titre'}
                meta={(v) => v.year}
                thumb={(v) => (v.youtube ? `https://i.ytimg.com/vi/${v.youtube}/default.jpg` : undefined)}
                create={() => ({ title: 'Nouvelle vidéo', subtitle: '', credit: '', year: String(new Date().getFullYear()), youtube: '', link: '' })}
                addLabel="Ajouter une vidéo"
                render={(v, upv) => (
                  <div class="grid">
                    <YouTubeField value={v.youtube} onChange={(val) => upv((x) => (x.youtube = val))} />
                    <Field label="Titre" value={v.title} onChange={(val) => upv((x) => (x.title = val))} wide />
                    <Field label="Sous-titre" value={v.subtitle} onChange={(val) => upv((x) => (x.subtitle = val))} placeholder="Client, lieu, contexte…" wide />
                    <Field label="Ton rôle" value={v.credit} onChange={(val) => upv((x) => (x.credit = val))} placeholder="Tournage & montage" />
                    <Field label="Année" value={v.year} onChange={(val) => upv((x) => (x.year = val))} />
                    <Field label="Lien vers une page (optionnel)" value={v.link} onChange={(val) => upv((x) => (x.link = val))} placeholder="/projets/machu-picchu" wide />
                  </div>
                )}
              />
            </div>
          </div>
        )}
      />
    </Panel>
  );
}

/* ---------- Galeries ---------- */

export function Galleries() {
  const { content: c, set, imgUrl } = useStore();
  return (
    <Panel title="Galeries photo" intro="Chaque galerie a sa propre page. La première photo sert de couverture.">
      <ItemList
        items={c.galleries}
        onChange={(v) => set((d) => (d.galleries = v))}
        title={(g) => g.title || 'Galerie sans titre'}
        meta={(g) => `${g.photos.length} photo${g.photos.length > 1 ? 's' : ''}${g.year ? ' · ' + g.year : ''}`}
        thumb={(g) => (g.photos[0] ? imgUrl(g.photos[0]) : undefined)}
        create={() => ({ slug: `galerie-${Date.now().toString(36).slice(-4)}`, title: 'Nouvelle galerie', context: '', place: '', year: String(new Date().getFullYear()), related: '', photos: [] })}
        addLabel="Ajouter une galerie"
        confirmDelete={(g) => `Supprimer la galerie « ${g.title} » et ses ${g.photos.length} photos ? (définitif après publication)`}
        render={(g, up) => (
          <div class="grid">
            <Field label="Titre" value={g.title} onChange={(v) => up((x) => { if (x.slug.startsWith('galerie-')) x.slug = slugify(v); x.title = v; })} />
            <SlugField value={g.slug} prefix="/photo/" onChange={(v) => up((x) => (x.slug = v))} />
            <Field label="Contexte" value={g.context} onChange={(v) => up((x) => (x.context = v))} placeholder="ex. 26 jours de voyage" />
            <Field label="Lieu" value={g.place} onChange={(v) => up((x) => (x.place = v))} />
            <Field label="Année" value={g.year} onChange={(v) => up((x) => (x.year = v))} />
            <Field label="Lien vers un projet (optionnel)" value={g.related} onChange={(v) => up((x) => (x.related = v))} placeholder="/projets/machu-picchu" />
            <PhotoManager photos={g.photos} onChange={(p) => up((x) => (x.photos = p))} />
          </div>
        )}
      />
    </Panel>
  );
}

/* ---------- Créations ---------- */

export function Creations() {
  const { content: c, set, imgUrl } = useStore();
  return (
    <Panel title="Créations visuelles" intro="Logos, chartes graphiques, visuels… Une page par projet.">
      <ItemList
        items={c.creations}
        onChange={(v) => set((d) => (d.creations = v))}
        title={(x) => x.title || 'Sans titre'}
        meta={(x) => [x.org, x.year].filter(Boolean).join(' · ')}
        thumb={(x) => { const p = x.sections.flatMap((s) => s.photos)[0]; return p ? imgUrl(p) : undefined; }}
        create={() => ({
          slug: `creation-${Date.now().toString(36).slice(-4)}`, title: 'Nouvelle création', org: '', year: String(new Date().getFullYear()),
          work: '', text: '', sections: [{ title: 'Visuels', caption: '', photos: [] }], video: { title: '', credit: '', youtube: '' },
        })}
        addLabel="Ajouter une création"
        confirmDelete={(x) => `Supprimer « ${x.title} » et toutes ses photos ?`}
        render={(x, up) => (
          <div class="grid">
            <Field label="Titre" value={x.title} onChange={(v) => up((y) => { if (y.slug.startsWith('creation-')) y.slug = slugify(v); y.title = v; })} />
            <SlugField value={x.slug} prefix="/creations/" onChange={(v) => up((y) => (y.slug = v))} />
            <Field label="Structure / client" value={x.org} onChange={(v) => up((y) => (y.org = v))} />
            <Field label="Année" value={x.year} onChange={(v) => up((y) => (y.year = v))} />
            <Field label="Réalisations" value={x.work} onChange={(v) => up((y) => (y.work = v))} placeholder="Logo, charte graphique, …" wide />
            <Area label="Description" value={x.text} onChange={(v) => up((y) => (y.text = v))} />
            <SectionsEditor sections={x.sections} onChange={(s) => up((y) => (y.sections = s))} />
            <div class="field wide sub-card">
              <span class="label">Vidéo (optionnelle)</span>
              <div class="grid">
                <YouTubeField value={x.video.youtube} onChange={(v) => up((y) => (y.video.youtube = v))} />
                <Field label="Titre de la vidéo" value={x.video.title} onChange={(v) => up((y) => (y.video.title = v))} />
                <Field label="Ton rôle" value={x.video.credit} onChange={(v) => up((y) => (y.video.credit = v))} />
              </div>
            </div>
          </div>
        )}
      />
    </Panel>
  );
}

/* ---------- Projets ---------- */

export function Projects() {
  const { content: c, set, imgUrl } = useStore();
  return (
    <Panel title="Projets" intro="Pages longues pour tes gros projets (documentaire, voyage…). Un projet peut être mis à la une sur l'accueil.">
      <ItemList
        items={c.projects}
        onChange={(v) => set((d) => (d.projects = v))}
        title={(p) => p.title || 'Sans titre'}
        meta={(p) => [p.place, p.date].filter(Boolean).join(' · ')}
        thumb={(p) => (p.cover ? imgUrl(p.cover) : p.youtube ? `https://i.ytimg.com/vi/${p.youtube}/default.jpg` : undefined)}
        create={() => ({
          slug: `projet-${Date.now().toString(36).slice(-4)}`, title: 'Nouveau projet', kicker: '', date: '', place: '', intro: '',
          youtube: '', cover: null, sections: [], moreLabel: '', moreLink: '',
        })}
        addLabel="Ajouter un projet"
        confirmDelete={(p) => `Supprimer le projet « ${p.title} » et toutes ses photos ?`}
        render={(p, up) => (
          <div class="grid">
            <Field label="Titre" value={p.title} onChange={(v) => up((y) => { if (y.slug.startsWith('projet-')) y.slug = slugify(v); y.title = v; })} />
            <SlugField value={p.slug} prefix="/projets/" onChange={(v) => up((y) => (y.slug = v))} />
            <Field label="Type" value={p.kicker} onChange={(v) => up((y) => (y.kicker = v))} placeholder="Documentaire, Reportage…" />
            <Field label="Lieu" value={p.place} onChange={(v) => up((y) => (y.place = v))} />
            <Field label="Date" value={p.date} onChange={(v) => up((y) => (y.date = v))} placeholder="Juillet 2025" />
            <Area label="Texte de présentation" rows={7} value={p.intro} onChange={(v) => up((y) => (y.intro = v))} hint="Laisse une ligne vide entre deux paragraphes." />
            <YouTubeField label="Vidéo principale (optionnelle)" value={p.youtube} onChange={(v) => up((y) => (y.youtube = v))} />
            <PhotoManager
              label="Image de couverture (pour l'accueil)"
              single
              photos={p.cover ? [p.cover] : []}
              onChange={(ph) => up((y) => (y.cover = ph[0] ?? null))}
              hint="Optionnelle : sinon la miniature de la vidéo est utilisée. "
            />
            <SectionsEditor sections={p.sections} onChange={(s) => up((y) => (y.sections = s))} />
            <Field label="Bouton de fin : texte" value={p.moreLabel} onChange={(v) => up((y) => (y.moreLabel = v))} placeholder="Plus de photos" />
            <Field label="Bouton de fin : lien" value={p.moreLink} onChange={(v) => up((y) => (y.moreLink = v))} placeholder="/photo/perou" />
          </div>
        )}
      />
    </Panel>
  );
}

export const PANELS: { id: string; label: string; icon: string; C: () => any }[] = [
  { id: 'general', label: 'Général', icon: '◎', C: General },
  { id: 'home', label: 'Accueil', icon: '⌂', C: Home },
  { id: 'videos', label: 'Vidéos', icon: '▶', C: Videos },
  { id: 'galleries', label: 'Galeries photo', icon: '▦', C: Galleries },
  { id: 'creations', label: 'Créations', icon: '◆', C: Creations },
  { id: 'projects', label: 'Projets', icon: '★', C: Projects },
];

export type { Content };
