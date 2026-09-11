/* Koomzo POS — Forms admin: list of authored forms with publish status and full
   CRUD (create, edit → builder, duplicate, publish/close, delete). */
const { useState, useMemo, useEffect, useLayoutEffect } = React;

const FA_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#2f8f7d",
  "density": "comfortable",
  "device": "desktop"
}/*EDITMODE-END*/;

const FA_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
};

function useFit(w, h) {
  const [s, setS] = useState(1);
  useLayoutEffect(() => {
    const f = () => setS(Math.min(1, (window.innerWidth - 52) / w, (window.innerHeight - 108) / h));
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, [w, h]);
  return s;
}
function Stage({ w, h, scale, className, children }) {
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className={'device ' + className} style={{ width: w, height: h, transform: `scale(${scale})` }}>{children}</div>
      </div>
    </div>
  );
}
function Rail({ view, onView, subs }) {
  /* the module's own screens, gated by the capability service — not a jump list to other modules */
  const g = (k) => !window.KZ || window.KZ.on('forms', k);
  const items = [
    ['list', 'clipboard-outline', 'Forms', true, 0, null],
    ['subs', 'albums-outline', 'Submissions', g('submissions'), 0, 'Koomzo POS - Form Submissions.html'],
    ['builder', 'construct-outline', 'Builder', g('builder'), subs, 'Koomzo POS - Form Builder.html'],
    ['ml', 'language-outline', 'Languages', g('multilingual'), 0, 'Koomzo POS - Form Builder Multilingual.html'],
  ].filter((x) => x[3]);
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="clipboard"></ion-icon></a>
      {items.map(([id, icon, label, , n, href]) => (
        href
          ? <a key={id} className="pa-rail__item" href={href}><ion-icon name={icon}></ion-icon>{label}{n > 0 && <em className="padot">{n}</em>}</a>
          : <button key={id} className={'pa-rail__item' + (view === id ? ' active' : '')} onClick={() => onView(id)}>
              <ion-icon name={icon}></ion-icon>{label}</button>
      ))}
      <div className="pa-rail__spacer" />
      <button className={'pa-rail__item' + (view === 'setup' ? ' active' : '')} onClick={() => onView('setup')}>
        <ion-icon name="options-outline"></ion-icon>Setup</button>
    </nav>
  );
}
function OldRail() {
  const items = [
    { icon: 'grid-outline', label: 'Home', href: 'Koomzo POS - Home.html' },
    { icon: 'cart-outline', label: 'Register', href: 'Koomzo POS.html' },
    { icon: 'pricetags-outline', label: 'Products', href: 'Koomzo POS - Products.html' },
    { icon: 'document-text-outline', label: 'Forms', active: true },
    { icon: 'people-outline', label: 'Customers', href: 'Koomzo POS - Users.html' },
  ];
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="storefront"></ion-icon></a>
      {items.map((it) => (
        it.href
          ? <a key={it.label} className="pa-rail__item" href={it.href}><ion-icon name={it.icon}></ion-icon>{it.label}</a>
          : <button key={it.label} className={'pa-rail__item' + (it.active ? ' active' : '')}><ion-icon name={it.icon}></ion-icon>{it.label}</button>
      ))}
      <div className="pa-rail__spacer" />
      <a className="pa-rail__item" href="Koomzo POS - Settings.html"><ion-icon name="settings-outline"></ion-icon>Settings</a>
    </nav>
  );
}

function StatusPill({ status }) {
  const m = FORM_STATUS[status];
  return <span className="au-pill" style={{ color: m.color, background: m.bg, borderColor: m.bd }}>
    <i className={status === 'published' ? 'live' : ''} style={{ background: m.dot }}></i>{m.label}
  </span>;
}
function KindCell({ kind }) {
  const k = FORM_KIND[kind];
  return <span className="au-trig">
    <span className="au-trig__ic" style={{ background: k.wash, color: k.color }}><ion-icon name={k.icon}></ion-icon></span>
    <b>{k.label}</b>
  </span>;
}

/* ---- create-form modal ---- */
function CreateModal({ onCreate, onClose }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [kind, setKind] = useState('intake');
  const valid = name.trim().length > 1;
  return (
    <div className="au-modal-scrim" onClick={onClose}>
      <div className="au-modal" onClick={(e) => e.stopPropagation()}>
        <div className="au-modal__head">
          <div className="ic"><ion-icon name="add-circle-outline"></ion-icon></div>
          <div><h2>New form</h2><p>Create a draft, then design its fields in the builder.</p></div>
        </div>
        <div className="au-modal__body">
          <div className="au-field">
            <label>Form name</label>
            <input className="au-input" autoFocus value={name} placeholder="e.g. Event booking request" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="au-field">
            <label>Description</label>
            <textarea className="au-input" value={desc} placeholder="What is this form for?" onChange={(e) => setDesc(e.target.value)}></textarea>
          </div>
          <div className="au-field">
            <label>Type</label>
            <select className="au-input" value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.keys(FORM_KIND).map((k) => <option key={k} value={k}>{FORM_KIND[k].label}</option>)}
            </select>
          </div>
        </div>
        <div className="au-modal__foot">
          <button className="au-mbtn" onClick={onClose}>Cancel</button>
          <div className="spacer"></div>
          <a className="au-mbtn" href="Koomzo POS - Form Builder.html"><ion-icon name="open-outline"></ion-icon>Open builder</a>
          <button className="au-mbtn primary" disabled={!valid} style={!valid ? { opacity: .5 } : null}
            onClick={() => onCreate({ name: name.trim(), desc: desc.trim() || 'No description yet.', kind })}>
            <ion-icon name="checkmark-outline"></ion-icon>Create draft
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ target, count, onConfirm, onClose }) {
  return (
    <div className="au-modal-scrim" onClick={onClose}>
      <div className="au-modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="au-modal__head">
          <div className="ic danger"><ion-icon name="trash-outline"></ion-icon></div>
          <div><h2>Delete {count > 1 ? `${count} forms` : 'form'}?</h2><p>This can't be undone.</p></div>
        </div>
        <div className="au-modal__body">
          <p className="warn">
            {count > 1 ? <>You're about to permanently delete <b>{count} forms</b> and their submissions.</>
              : <>Permanently delete <b>{target}</b> and its submissions? A published form will stop accepting responses immediately.</>}
          </p>
        </div>
        <div className="au-modal__foot">
          <button className="au-mbtn" onClick={onClose}>Cancel</button>
          <div className="spacer"></div>
          <button className="au-mbtn danger" onClick={onConfirm}><ion-icon name="trash-outline"></ion-icon>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ---- template gallery: browse ready-made forms by industry, clone & tweak ---- */
function TemplateGallery({ onClone, onClose }) {
  const [industry, setIndustry] = useState('all');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);       // template being customized
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const counts = useMemo(() => {
    const c = { all: FORM_TEMPLATES.length };
    Object.keys(INDUSTRIES).forEach((k) => { c[k] = FORM_TEMPLATES.filter((t) => t.industry === k).length; });
    return c;
  }, []);

  const list = useMemo(() => FORM_TEMPLATES.filter((t) => {
    if (industry !== 'all' && t.industry !== industry) return false;
    if (query.trim()) { const q = query.toLowerCase(); return (t.name + ' ' + t.desc).toLowerCase().includes(q); }
    return true;
  }), [industry, query]);

  const startClone = (t) => { setPicked(t); setName(t.name + ' (copy)'); setDesc(t.desc); };
  const confirmClone = () => onClone(picked, { name: name.trim() || picked.name, desc: desc.trim() || picked.desc });

  return (
    <div className="au-modal-scrim" onClick={onClose}>
      <div className="au-modal tpl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="au-modal__head">
          <div className="ic"><ion-icon name={picked ? 'copy-outline' : 'albums-outline'}></ion-icon></div>
          <div style={{ flex: 1 }}>
            <h2>{picked ? 'Clone & customize' : 'Start from a template'}</h2>
            <p>{picked ? 'Tweak the name and description — the fields come pre-built.' : 'Ready-made forms across industries. Clone one and make it yours.'}</p>
          </div>
          <button className="pd__close" onClick={onClose} style={{ marginLeft: 'auto' }}><ion-icon name="close-outline"></ion-icon></button>
        </div>

        {picked ? (
          <>
            <div className="tpl-clone">
              <div className="tpl-clone__src">
                <div className="ic" style={{ background: INDUSTRIES[picked.industry].wash, color: INDUSTRIES[picked.industry].color }}>
                  <ion-icon name={INDUSTRIES[picked.industry].icon}></ion-icon>
                </div>
                <div className="tt">
                  <b>{picked.name}</b>
                  <small>{INDUSTRIES[picked.industry].label} · {FORM_KIND[picked.kind].label} · {picked.fields} fields · {picked.steps} {picked.steps > 1 ? 'steps' : 'step'}</small>
                </div>
              </div>
              <div className="au-field">
                <label>Form name</label>
                <input className="au-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="au-field">
                <label>Description</label>
                <textarea className="au-input" value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
              </div>
              <div className="tpl-clone__note">
                <ion-icon name="sparkles-outline"></ion-icon>
                <span>All {picked.fields} fields and {picked.steps} {picked.steps > 1 ? 'steps' : 'step'} are copied in as a <b>draft</b>. Open the builder to adjust fields, then publish when ready.</span>
              </div>
            </div>
            <div className="au-modal__foot">
              <button className="au-mbtn" onClick={() => setPicked(null)}><ion-icon name="arrow-back-outline"></ion-icon>Back to templates</button>
              <div className="spacer"></div>
              <button className="au-mbtn primary" onClick={confirmClone}><ion-icon name="copy-outline"></ion-icon>Clone to draft</button>
            </div>
          </>
        ) : (
          <>
            <div className="tpl-toolbar">
              <div className="tpl-searchrow">
                <div className="tpl-search">
                  <ion-icon name="search-outline"></ion-icon>
                  <input placeholder="Search templates…" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <span className="tpl-count">{list.length} template{list.length === 1 ? '' : 's'}</span>
              </div>
              <div className="tpl-filters">
                <button className={'tpl-chip' + (industry === 'all' ? ' active' : '')} onClick={() => setIndustry('all')}>
                  <ion-icon name="grid-outline"></ion-icon>All<span className="n">{counts.all}</span>
                </button>
                {Object.keys(INDUSTRIES).map((k) => (
                  <button key={k} className={'tpl-chip' + (industry === k ? ' active' : '')} onClick={() => setIndustry(k)}>
                    <ion-icon name={INDUSTRIES[k].icon}></ion-icon>{INDUSTRIES[k].label}<span className="n">{counts[k]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="tpl-scroll">
              <div className="tpl-grid">
                {list.length === 0 ? (
                  <div className="tpl-empty"><ion-icon name="albums-outline"></ion-icon><p>No templates match your search.</p></div>
                ) : list.map((t) => {
                  const ind = INDUSTRIES[t.industry];
                  const k = FORM_KIND[t.kind];
                  return (
                    <div key={t.id} className="tpl-card">
                      <div className="tpl-card__top">
                        <div className="tpl-card__ic" style={{ background: ind.wash, color: ind.color }}><ion-icon name={ind.icon}></ion-icon></div>
                        <div className="tpl-card__tt">
                          <div className="nm">
                            <b>{t.name}</b>
                            {t.popular && <span className="tpl-pop"><ion-icon name="flame"></ion-icon>Popular</span>}
                          </div>
                          <small>{t.desc}</small>
                        </div>
                      </div>
                      <div className="tpl-card__meta">
                        <span className="tpl-tag" style={{ background: ind.wash, color: ind.color }}><ion-icon name={ind.icon}></ion-icon>{ind.label}</span>
                        <span className="tpl-metaitem"><ion-icon name={k.icon}></ion-icon>{k.label}</span>
                        <span className="tpl-metasep"></span>
                        <span className="tpl-metaitem"><ion-icon name="list-outline"></ion-icon>{t.fields} fields</span>
                        <span className="tpl-metasep"></span>
                        <span className="tpl-metaitem"><ion-icon name="layers-outline"></ion-icon>{t.steps} {t.steps > 1 ? 'steps' : 'step'}</span>
                      </div>
                      <div className="tpl-steps">
                        {t.preview.slice(0, 3).map((p, i) => <span key={i} className="tpl-steppill">{p}</span>)}
                        {t.preview.length > 3 && <span className="tpl-steppill more">+{t.preview.length - 3} more</span>}
                      </div>
                      <div className="tpl-card__foot">
                        <button className="tpl-use" onClick={() => startClone(t)}><ion-icon name="copy-outline"></ion-icon>Use template</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =================== APP =================== */
function App() {
  const [t, setTweak] = useTweaks(FA_TWEAKS);
  const device = t.device || 'desktop';
  const [view, setView] = useState(() => (location.hash === '#setup' ? 'setup' : 'list'));
  const [, bumpCaps] = useState(0);
  useEffect(() => { if (window.KZ) return window.KZ.subscribe(() => bumpCaps((n) => n + 1)); }, []);

  const [rows, setRows] = useState(FORMS);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const counts = useMemo(() => ({
    all: rows.length,
    published: rows.filter((r) => r.status === 'published').length,
    draft: rows.filter((r) => r.status === 'draft').length,
    closed: rows.filter((r) => r.status === 'closed').length,
  }), [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (tab !== 'all' && r.status !== tab) return false;
    if (query.trim()) { const q = query.toLowerCase(); return (r.name + ' ' + r.desc).toLowerCase().includes(q); }
    return true;
  }), [rows, tab, query]);

  const createForm = ({ name, desc, kind }) => {
    const id = 'f' + Math.random().toString(36).slice(2, 7);
    setRows((rs) => [{ id, name, desc, status: 'draft', kind, fields: 1, steps: 1, subs30d: 0, completionRate: null, avgTime: '—', lastSub: 'Never', updated: 'Just now', owner: 'You' }, ...rs]);
    setCreateOpen(false); flash('Form created — open the builder to add fields');
  };
  const cloneTemplate = (tpl, { name, desc }) => {
    const id = 'f' + Math.random().toString(36).slice(2, 7);
    setRows((rs) => [{ id, name, desc, status: 'draft', kind: tpl.kind, fields: tpl.fields, steps: tpl.steps, subs30d: 0, completionRate: null, avgTime: '\u2014', lastSub: 'Never', updated: 'Just now', owner: 'You' }, ...rs]);
    setTplOpen(false); setTab('draft'); flash(`\u201C${name}\u201D cloned from template \u2014 open the builder to tweak`);
  };
  const duplicate = (id) => setRows((rs) => {
    const i = rs.findIndex((r) => r.id === id); if (i < 0) return rs;
    const src = rs[i];
    const copy = { ...src, id: 'f' + Math.random().toString(36).slice(2, 7), name: src.name + ' (copy)', status: 'draft', subs30d: 0, completionRate: null, lastSub: 'Never', updated: 'Just now', owner: 'You' };
    const next = rs.slice(); next.splice(i + 1, 0, copy); flash('Form duplicated'); return next;
  });
  const toggleStatus = (id) => setRows((rs) => rs.map((r) => {
    if (r.id !== id) return r;
    const ns = r.status === 'published' ? 'closed' : 'published';
    flash(ns === 'published' ? `“${r.name}” is now published` : `“${r.name}” closed`);
    return { ...r, status: ns };
  }));
  const doDelete = () => {
    const ids = new Set(delTarget.ids);
    setRows((rs) => rs.filter((r) => !ids.has(r.id)));
    setSel(new Set()); flash(delTarget.ids.length > 1 ? `${delTarget.ids.length} forms deleted` : 'Form deleted');
    setDelTarget(null);
  };

  const toggleSel = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => sel.has(r.id));
  const toggleAll = () => setSel((s) => {
    const n = new Set(s);
    if (allVisibleSelected) filtered.forEach((r) => n.delete(r.id));
    else filtered.forEach((r) => n.add(r.id));
    return n;
  });

  /* the builder is a capability: when it is off, nothing may lead to it — not a rail
     item, not a head action, not a row, not a hint. */
  const canEdit = !window.KZ || window.KZ.on('forms', 'builder');
  const canRead = !window.KZ || window.KZ.on('forms', 'submissions');
  const editHref = 'Koomzo POS - Form Builder.html';
  const rowHref = canEdit ? editHref : canRead ? 'Koomzo POS - Form Submissions.html' : null;
  const accentStyle = { '--kz-primary': t.accent };
  const compact = t.density === 'compact';

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
      <div className="rt-wrap">
        <div className={'pa-app' + (device === 'tablet' ? ' is-tablet' : '')} style={accentStyle}>
          <KzPaRail mid="forms" active="list" onView={setView} setupOn={view === 'setup'}
            badges={{ subs: rows.filter((r) => r.status === 'draft').length }} />
          <div className="pa-main">
            <header className="pa-topbar">
              <div className="pa-topbar__crumb">
                <ion-icon name="document-text-outline"></ion-icon>Forms
                <ion-icon name="chevron-forward-outline"></ion-icon><b>All forms</b>
              </div>
              <div className="pa-topbar__right">
                <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
                <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
                <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
              </div>
            </header>

            {view === 'setup' ? <div className="pa-setupwrap"><ModuleSetup mid="forms" embedded /></div> : <>
            <div className="pa-pagehead">
              <div className="pa-pagehead__t">
                <span className="pa-eyebrow">Forms</span>
                <h1>Forms <span className="count">{counts.all}</span></h1>
              </div>
              <div className="pa-pagehead__actions">
                {(!window.KZ || window.KZ.on('forms', 'templates')) && <button className="pa-btn" onClick={() => setTplOpen(true)}><ion-icon name="albums-outline"></ion-icon>Templates</button>}
                {canEdit
                  ? <button className="pa-btn primary" onClick={() => setCreateOpen(true)}><ion-icon name="add-outline"></ion-icon>New form</button>
                  : canRead && <a className="pa-btn primary" href="Koomzo POS - Form Submissions.html"><ion-icon name="albums-outline"></ion-icon>Submissions</a>}
              </div>
            </div>

            <div className="pa-toolbar">
              <div className="pa-search">
                <ion-icon name="search-outline"></ion-icon>
                <input placeholder="Search forms…" value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && <button className="clr" onClick={() => setQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
              </div>
              <div className="au-tabs">
                {[['all', 'All'], ['published', 'Published'], ['draft', 'Draft'], ['closed', 'Closed']].map(([k, label]) => (
                  <button key={k} className={'au-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
                    {label}<span className="n">{counts[k]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pa-tablewrap">
              {filtered.length === 0 ? (
                <div className="pa-empty"><ion-icon name="document-text-outline"></ion-icon><p>No forms match your filters.</p></div>
              ) : (
                <table className={'pa-table' + (compact ? ' pa-rowcompact' : '')} style={{ minWidth: 1040 }}>
                  <thead>
                    <tr>
                      <th className="pa-th-check">
                        <button className={'pa-check' + (allVisibleSelected ? ' on' : '')} onClick={toggleAll}><ion-icon name="checkmark-outline"></ion-icon></button>
                      </th>
                      <th>Form</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th className="num">Fields</th>
                      <th className="num">Subs · 30d</th>
                      <th>Completion</th>
                      <th>Last response</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className={sel.has(r.id) ? 'sel' : ''} onClick={() => { if (rowHref) window.location.href = rowHref; }}>
                        <td onClick={(e) => { e.stopPropagation(); toggleSel(r.id); }}>
                          <button className={'pa-check' + (sel.has(r.id) ? ' on' : '')}><ion-icon name="checkmark-outline"></ion-icon></button>
                        </td>
                        <td>
                          <div className="au-wf"><b>{r.name}</b><small>{r.desc}</small></div>
                        </td>
                        <td><StatusPill status={r.status} /></td>
                        <td><KindCell kind={r.kind} /></td>
                        <td className="num"><span className="au-mono">{r.fields}</span></td>
                        <td className="num"><span className="au-mono">{window.KZ_LOCALE.int(r.subs30d)}</span></td>
                        <td>
                          {r.completionRate == null ? <span className="au-sub">—</span> : (
                            <div className="au-rate">
                              <div className="au-rate__top"><b>{r.completionRate}%</b></div>
                              <div className="au-rate__track"><div className="au-rate__fill" style={{ width: r.completionRate + '%', background: r.completionRate >= 85 ? 'var(--kz-success)' : r.completionRate >= 70 ? 'var(--kz-warning)' : 'var(--kz-discount)' }}></div></div>
                            </div>
                          )}
                        </td>
                        <td><span className="au-sub">{r.lastSub}</span></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="pa-rowact">
                            {canEdit && <a className="pa-rowbtn" href={editHref} title="Edit in builder"><ion-icon name="create-outline"></ion-icon></a>}
                            <button className="pa-rowbtn" title={r.status === 'published' ? 'Close form' : 'Publish'} onClick={() => toggleStatus(r.id)}>
                              <ion-icon name={r.status === 'published' ? 'lock-closed-outline' : 'rocket-outline'}></ion-icon>
                            </button>
                            <button className="pa-rowbtn" title="Duplicate" onClick={() => duplicate(r.id)}><ion-icon name="copy-outline"></ion-icon></button>
                            <button className="pa-rowbtn danger" title="Delete" onClick={() => setDelTarget({ ids: [r.id], name: r.name })}><ion-icon name="trash-outline"></ion-icon></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {sel.size > 0 ? (
              <div className="pa-bulk">
                <b>{sel.size}</b> selected
                <div className="pa-bulk__sep"></div>
                <button onClick={() => { [...sel].forEach((id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: 'published' } : r))); flash(`${sel.size} published`); setSel(new Set()); }}><ion-icon name="rocket-outline"></ion-icon>Publish</button>
                <button onClick={() => { [...sel].forEach((id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: 'closed' } : r))); flash(`${sel.size} closed`); setSel(new Set()); }}><ion-icon name="lock-closed-outline"></ion-icon>Close</button>
                <button onClick={() => { [...sel].forEach(duplicate); setSel(new Set()); }}><ion-icon name="copy-outline"></ion-icon>Duplicate</button>
                <button className="danger" onClick={() => setDelTarget({ ids: [...sel], name: '' })}><ion-icon name="trash-outline"></ion-icon>Delete</button>
                <button className="pa-bulk__x" onClick={() => setSel(new Set())}><ion-icon name="close-outline"></ion-icon></button>
              </div>
            ) : (
              <div className="pa-footer">
                <div className="pa-footer__view"><ion-icon name="information-circle-outline" style={{ fontSize: 16, color: 'var(--kz-muted-2)' }}></ion-icon>{canEdit ? 'Click a row to open it in the builder' : canRead ? 'Click a row to read its submissions' : 'Publish and close from the row actions'}</div>
                <div className="pa-footer__range">{filtered.length} of {rows.length} forms</div>
              </div>
            )}
            </>}
          </div>

          {tplOpen && <TemplateGallery onClone={cloneTemplate} onClose={() => setTplOpen(false)} />}
          {createOpen && <CreateModal onCreate={createForm} onClose={() => setCreateOpen(false)} />}
          {delTarget && <ConfirmModal target={delTarget.name} count={delTarget.ids.length} onConfirm={doDelete} onClose={() => setDelTarget(null)} />}
          {toast && <div className="au-toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device}
          options={[{ value:'desktop', label:'Desktop' }, { value:'tablet', label:'Tablet' }]}
          onChange={(v) => setTweak('device', v)} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent color" value={t.accent} options={['#2f8f7d', '#6a61bf', '#4b4ad9', '#303b57']} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Table" />
        <TweakRadio label="Row density" value={t.density}
          options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
          onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
