import type { ComponentChildren } from 'preact';
import { useState, useRef } from 'preact/hooks';
import type { Photo } from '../lib/types';
import { useStore, youtubeId } from './store';

/* ---------- Champs ---------- */

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: ComponentChildren;
  placeholder?: string;
  type?: string;
  wide?: boolean;
};

export function Field({ label, value, onChange, hint, placeholder, type = 'text', wide }: FieldProps) {
  return (
    <label class={`field${wide ? ' wide' : ''}`}>
      <span class="label">{label}</span>
      <input type={type} value={value ?? ''} placeholder={placeholder} onInput={(e) => onChange(e.currentTarget.value)} />
      {hint && <span class="hint">{hint}</span>}
    </label>
  );
}

export function Area({ label, value, onChange, hint, placeholder, rows = 4 }: FieldProps & { rows?: number }) {
  return (
    <label class="field wide">
      <span class="label">{label}</span>
      <textarea rows={rows} value={value ?? ''} placeholder={placeholder} onInput={(e) => onChange(e.currentTarget.value)} />
      {hint && <span class="hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label class="toggle wide">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
      <span class="switch" />
      <span>
        <span class="label">{label}</span>
        {hint && <span class="hint">{hint}</span>}
      </span>
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label class="field color">
      <span class="label">{label}</span>
      <span class="color-row">
        <input type="color" value={value} onInput={(e) => onChange(e.currentTarget.value)} />
        <input type="text" value={value} onInput={(e) => /^#[0-9a-f]{6}$/i.test(e.currentTarget.value) && onChange(e.currentTarget.value)} />
      </span>
    </label>
  );
}

export function SlugField({ value, onChange, prefix }: { value: string; onChange: (v: string) => void; prefix: string }) {
  return (
    <Field
      label="Adresse de la page"
      value={value}
      onChange={(v) => onChange(v.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
      hint={<>{prefix}<b>{value || '…'}</b> · lettres minuscules, chiffres et tirets</>}
    />
  );
}

export function YouTubeField({ label = 'Vidéo YouTube', value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div class="field wide yt-field">
      <label class="field">
        <span class="label">{label}</span>
        <input
          value={value}
          placeholder="Colle le lien YouTube (ou l'identifiant)"
          onInput={(e) => onChange(youtubeId(e.currentTarget.value))}
        />
        <span class="hint">Identifiant : <b>{value || '—'}</b></span>
      </label>
      {value && <img src={`https://i.ytimg.com/vi/${value}/mqdefault.jpg`} alt="" />}
    </div>
  );
}

/* ---------- Mise en page ---------- */

export function Panel({ title, intro, actions, children }: { title: string; intro?: ComponentChildren; actions?: ComponentChildren; children: ComponentChildren }) {
  return (
    <section class="panel">
      <header class="panel-head">
        <div>
          <h1>{title}</h1>
          {intro && <p class="intro">{intro}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Card({ title, children }: { title?: string; children: ComponentChildren }) {
  return (
    <div class="card">
      {title && <h2>{title}</h2>}
      <div class="grid">{children}</div>
    </div>
  );
}

/* ---------- Listes ---------- */

type ListProps<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  title: (item: T, i: number) => ComponentChildren;
  meta?: (item: T) => ComponentChildren;
  thumb?: (item: T) => string | undefined;
  render: (item: T, update: (fn: (x: T) => void) => void, i: number) => ComponentChildren;
  create: () => T;
  addLabel: string;
  confirmDelete?: (item: T) => string;
  startOpen?: number | null;
};

/** Liste d'éléments repliables, réordonnables (flèches) et supprimables. */
export function ItemList<T>({ items, onChange, title, meta, thumb, render, create, addLabel, confirmDelete, startOpen = null }: ListProps<T>) {
  const [open, setOpen] = useState<number | null>(startOpen);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    if (open === i) setOpen(j); else if (open === j) setOpen(i);
  };
  const remove = (i: number) => {
    const msg = confirmDelete?.(items[i]) ?? 'Supprimer cet élément ?';
    if (!confirm(msg)) return;
    onChange(items.filter((_, k) => k !== i));
    setOpen(null);
  };
  const update = (i: number) => (fn: (x: T) => void) => {
    const next = structuredClone(items);
    fn(next[i]);
    onChange(next);
  };

  return (
    <div class="list">
      {items.map((item, i) => {
        const t = thumb?.(item);
        return (
          <div class={`list-item${open === i ? ' open' : ''}`} key={i}>
            <div class="list-row">
              <button type="button" class="list-toggle" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span class="chev" aria-hidden="true">›</span>
                {thumb && <span class="list-thumb">{t && <img src={t} alt="" />}</span>}
                <span class="list-title">{title(item, i)}</span>
                {meta && <span class="list-meta">{meta(item)}</span>}
              </button>
              <div class="list-actions">
                <button type="button" class="icon" title="Monter" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" class="icon" title="Descendre" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button type="button" class="icon danger" title="Supprimer" onClick={() => remove(i)}>✕</button>
              </div>
            </div>
            {open === i && <div class="list-body">{render(item, update(i), i)}</div>}
          </div>
        );
      })}
      <button type="button" class="btn ghost add" onClick={() => { onChange([...items, create()]); setOpen(items.length); }}>
        + {addLabel}
      </button>
    </div>
  );
}

/* ---------- Photos ---------- */

type PhotosProps = { label?: string; photos: Photo[]; onChange: (p: Photo[]) => void; single?: boolean; hint?: string };

/** Glisser-déposer de photos, réordonnables par glisser, avec compression automatique. */
export function PhotoManager({ label = 'Photos', photos, onChange, single, hint }: PhotosProps) {
  const { addFiles, imgUrl } = useStore();
  const [busy, setBusy] = useState<[number, number] | null>(null);
  const [over, setOver] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, single ? 1 : undefined);
    const added = await addFiles(list, (d, t) => setBusy([d, t]));
    setBusy(null);
    onChange(single ? added.slice(0, 1) : [...photos, ...added]);
  };

  const reorder = (to: number) => {
    if (drag === null || drag === to) return;
    const next = photos.slice();
    const [m] = next.splice(drag, 1);
    next.splice(to, 0, m);
    onChange(next);
    setDrag(to);
  };

  return (
    <div class="field wide photos">
      <span class="label">{label} {!single && <em>{photos.length}</em>}</span>
      {photos.length > 0 && (
        <div class={`photo-grid${single ? ' single' : ''}`}>
          {photos.map((p, i) => (
            <figure
              key={p.src}
              draggable={!single}
              class={drag === i ? 'dragging' : ''}
              onDragStart={(e) => { setDrag(i); e.dataTransfer!.effectAllowed = 'move'; }}
              onDragEnter={() => reorder(i)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => setDrag(null)}
            >
              <img src={imgUrl(p)} alt="" loading="lazy" />
              {i === 0 && !single && <span class="badge">Couverture</span>}
              <button type="button" class="icon danger" title="Retirer" onClick={() => onChange(photos.filter((_, k) => k !== i))}>✕</button>
            </figure>
          ))}
        </div>
      )}
      <div
        class={`drop${over ? ' over' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { if (drag === null) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (drag === null) add(e.dataTransfer?.files ?? null); }}
      >
        {busy
          ? <span>Compression… {busy[0]} / {busy[1]}</span>
          : <span>{single ? (photos.length ? 'Remplacer la photo' : 'Ajouter une photo') : 'Glisse tes photos ici'} <u>ou parcourir</u></span>}
        <input ref={input} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => { add(e.currentTarget.files); e.currentTarget.value = ''; }} />
      </div>
      <span class="hint">
        {hint ?? (single ? '' : 'Glisse les vignettes pour changer l’ordre. La première sert de couverture. ')}
        Les photos sont compressées automatiquement (WebP, 2000 px max, sans données GPS).
      </span>
    </div>
  );
}

/** Sections (titre + légende + photos) : utilisées par les créations et les projets. */
export function SectionsEditor({ sections, onChange }: { sections: { title: string; caption: string; photos: Photo[] }[]; onChange: (s: any[]) => void }) {
  const { imgUrl } = useStore();
  return (
    <div class="field wide">
      <span class="label">Sections de photos</span>
      <ItemList
        items={sections}
        onChange={onChange}
        title={(s) => s.title || 'Section sans titre'}
        meta={(s) => `${s.photos.length} photo${s.photos.length > 1 ? 's' : ''}`}
        thumb={(s) => (s.photos[0] ? imgUrl(s.photos[0]) : undefined)}
        create={() => ({ title: 'Nouvelle section', caption: '', photos: [] })}
        addLabel="Ajouter une section"
        confirmDelete={(s) => `Supprimer la section « ${s.title} » et ses ${s.photos.length} photos ?`}
        render={(s, up) => (
          <div class="grid">
            <Field label="Titre" value={s.title} onChange={(v) => up((x) => (x.title = v))} />
            <Field label="Légende (optionnelle)" value={s.caption} onChange={(v) => up((x) => (x.caption = v))} />
            <PhotoManager photos={s.photos} onChange={(p) => up((x) => (x.photos = p))} />
          </div>
        )}
      />
    </div>
  );
}
