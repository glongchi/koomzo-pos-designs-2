/* Koomzo POS — Automations admin: list of authored workflows with publish
   status and full CRUD (create, edit → builder, duplicate, pause/activate, delete). */
const { useState, useMemo, useEffect, useLayoutEffect } = React;

const AU_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#8a5cf6",
  "density": "comfortable",
  "device": "desktop"
}/*EDITMODE-END*/;

const AU_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
};

/* ---- presenter stage (matches padmin) ---- */
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

/* ---- left rail (shared vocabulary) ---- */
function Rail({ view, onView, failing }) {
  /* this module's own screens, gated by the capability service */
  const g = (k) => !window.KZ || window.KZ.on('automations', k);
  const items = [
    ['list', 'git-network-outline', 'Recipes', true, 0, null],
    ['runs', 'pulse-outline', 'Runs', g('runs'), failing, 'Koomzo POS - Workflow Runs.html'],
    ['designer', 'construct-outline', 'Designer', g('designer'), 0, 'Koomzo POS - Flow Designer.html'],
  ].filter((x) => x[3]);
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="git-network"></ion-icon></a>
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
    { icon: 'git-network-outline', label: 'Flows', active: true },
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

/* ---- pills ---- */
function StatusPill({ status }) {
  const m = WF_STATUS[status];
  return <span className="au-pill" style={{ color: m.color, background: m.bg, borderColor: m.bd }}>
    <i className={status === 'live' ? 'live' : ''} style={{ background: m.dot }}></i>{m.label}
  </span>;
}
function TriggerCell({ trigger }) {
  const t = TRIGGERS[trigger];
  return <span className="au-trig">
    <span className="au-trig__ic" style={{ background: t.wash, color: t.color }}><ion-icon name={t.icon}></ion-icon></span>
    <b>{t.label}</b>
  </span>;
}

/* ---- create-workflow modal ---- */
function CreateModal({ onCreate, onClose }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [trigger, setTrigger] = useState('order');
  const valid = name.trim().length > 1;
  return (
    <div className="au-modal-scrim" onClick={onClose}>
      <div className="au-modal" onClick={(e) => e.stopPropagation()}>
        <div className="au-modal__head">
          <div className="ic"><ion-icon name="add-circle-outline"></ion-icon></div>
          <div><h2>New workflow</h2><p>Create a draft, then design its steps in the builder.</p></div>
        </div>
        <div className="au-modal__body">
          <div className="au-field">
            <label>Workflow name</label>
            <input className="au-input" autoFocus value={name} placeholder="e.g. Purchase-order approval" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="au-field">
            <label>Description</label>
            <textarea className="au-input" value={desc} placeholder="What does this automation do?" onChange={(e) => setDesc(e.target.value)}></textarea>
          </div>
          <div className="au-field">
            <label>Trigger</label>
            <select className="au-input" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
              {Object.keys(TRIGGERS).map((k) => <option key={k} value={k}>{TRIGGERS[k].label}</option>)}
            </select>
          </div>
        </div>
        <div className="au-modal__foot">
          <button className="au-mbtn" onClick={onClose}>Cancel</button>
          <div className="spacer"></div>
          <a className="au-mbtn" href="Koomzo POS - Workflow Orchestrator.html"><ion-icon name="open-outline"></ion-icon>Open builder</a>
          <button className="au-mbtn primary" disabled={!valid} style={!valid ? { opacity: .5 } : null}
            onClick={() => onCreate({ name: name.trim(), desc: desc.trim() || 'No description yet.', trigger })}>
            <ion-icon name="checkmark-outline"></ion-icon>Create draft
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- delete confirm modal ---- */
function ConfirmModal({ target, count, onConfirm, onClose }) {
  return (
    <div className="au-modal-scrim" onClick={onClose}>
      <div className="au-modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="au-modal__head">
          <div className="ic danger"><ion-icon name="trash-outline"></ion-icon></div>
          <div><h2>Delete {count > 1 ? `${count} workflows` : 'workflow'}?</h2><p>This can't be undone.</p></div>
        </div>
        <div className="au-modal__body">
          <p className="warn">
            {count > 1 ? <>You're about to permanently delete <b>{count} workflows</b> and their run history.</>
              : <>Permanently delete <b>{target}</b> and its run history? Any live version will stop running immediately.</>}
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

/* ---- template gallery: browse ready-made workflows by industry, clone to a draft ---- */
function TemplateGallery({ onClone, onClose }) {
  const [industry, setIndustry] = useState('all');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const counts = useMemo(() => {
    const c = { all: WF_TEMPLATES.length };
    Object.keys(WF_INDUSTRIES).forEach((k) => { c[k] = WF_TEMPLATES.filter((t) => t.industry === k).length; });
    return c;
  }, []);

  const list = useMemo(() => WF_TEMPLATES.filter((t) => {
    if (industry !== 'all' && t.industry !== industry) return false;
    if (query.trim()) { const q = query.toLowerCase(); return (t.name + ' ' + t.desc).toLowerCase().includes(q); }
    return true;
  }), [industry, query]);

  const startClone = (t) => { setPicked(t); setName(t.name + ' (copy)'); setDesc(t.desc); };
  /* Clone to draft redirects straight to the Workflow Orchestrator (orchestration page). */
  const confirmClone = () => {
    onClone(picked, { name: name.trim() || picked.name, desc: desc.trim() || picked.desc });
    window.location.href = 'Koomzo POS - Workflow Orchestrator.html';
  };

  return (
    <div className="au-modal-scrim" onClick={onClose}>
      <div className="au-modal tpl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="au-modal__head">
          <div className="ic"><ion-icon name={picked ? 'copy-outline' : 'albums-outline'}></ion-icon></div>
          <div style={{ flex: 1 }}>
            <h2>{picked ? 'Clone & customize' : 'Start from a template'}</h2>
            <p>{picked ? 'Tweak the name and description — the steps come pre-built.' : 'Ready-made workflows across industries. Clone one and make it yours.'}</p>
          </div>
          <button className="pd__close" onClick={onClose} style={{ marginLeft: 'auto' }}><ion-icon name="close-outline"></ion-icon></button>
        </div>

        {picked ? (
          <>
            <div className="tpl-clone">
              <div className="tpl-clone__src">
                <div className="ic" style={{ background: WF_INDUSTRIES[picked.industry].wash, color: WF_INDUSTRIES[picked.industry].color }}>
                  <ion-icon name={WF_INDUSTRIES[picked.industry].icon}></ion-icon>
                </div>
                <div className="tt">
                  <b>{picked.name}</b>
                  <small>{WF_INDUSTRIES[picked.industry].label} · {TRIGGERS[picked.trigger].label} · {picked.steps} steps</small>
                </div>
              </div>
              <div className="au-field">
                <label>Workflow name</label>
                <input className="au-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="au-field">
                <label>Description</label>
                <textarea className="au-input" value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
              </div>
              <div className="tpl-clone__note">
                <ion-icon name="git-network-outline"></ion-icon>
                <span>All {picked.steps} steps are copied in as a <b>draft</b> and opened in the Workflow Orchestrator, where you can adjust logic, connect your apps, then set it live.</span>
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
                {Object.keys(WF_INDUSTRIES).map((k) => (
                  <button key={k} className={'tpl-chip' + (industry === k ? ' active' : '')} onClick={() => setIndustry(k)}>
                    <ion-icon name={WF_INDUSTRIES[k].icon}></ion-icon>{WF_INDUSTRIES[k].label}<span className="n">{counts[k]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="tpl-scroll">
              <div className="tpl-grid">
                {list.length === 0 ? (
                  <div className="tpl-empty"><ion-icon name="albums-outline"></ion-icon><p>No templates match your search.</p></div>
                ) : list.map((t) => {
                  const ind = WF_INDUSTRIES[t.industry];
                  const tr = TRIGGERS[t.trigger];
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
                        <span className="tpl-metaitem"><ion-icon name={tr.icon}></ion-icon>{tr.label}</span>
                        <span className="tpl-metasep"></span>
                        <span className="tpl-metaitem"><ion-icon name="git-network-outline"></ion-icon>{t.steps} steps</span>
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
  const [t, setTweak] = useTweaks(AU_TWEAKS);
  const device = t.device || 'desktop';
  const [view, setView] = useState(() => (location.hash === '#setup' ? 'setup' : 'list'));
  const [, bumpCaps] = useState(0);
  useEffect(() => { if (window.KZ) return window.KZ.subscribe(() => bumpCaps((n) => n + 1)); }, []);

  const [rows, setRows] = useState(WORKFLOWS);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [delTarget, setDelTarget] = useState(null);   // {ids:[], name}
  const [toast, setToast] = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const counts = useMemo(() => ({
    all: rows.length,
    live: rows.filter((r) => r.status === 'live').length,
    draft: rows.filter((r) => r.status === 'draft').length,
    paused: rows.filter((r) => r.status === 'paused').length,
  }), [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (tab !== 'all' && r.status !== tab) return false;
    if (query.trim()) { const q = query.toLowerCase(); return (r.name + ' ' + r.desc).toLowerCase().includes(q); }
    return true;
  }), [rows, tab, query]);

  /* ---- CRUD ---- */
  const createWorkflow = ({ name, desc, trigger }) => {
    const id = 'wf' + Math.random().toString(36).slice(2, 7);
    setRows((rs) => [{ id, name, desc, status: 'draft', trigger, steps: 1, runs30d: 0, successRate: null, avgDur: '—', lastRun: 'Never', updated: 'Just now', owner: 'You' }, ...rs]);
    setCreateOpen(false); flash('Workflow created — open the builder to add steps');
  };
  const duplicate = (id) => setRows((rs) => {
    const i = rs.findIndex((r) => r.id === id); if (i < 0) return rs;
    const src = rs[i];
    const copy = { ...src, id: 'wf' + Math.random().toString(36).slice(2, 7), name: src.name + ' (copy)', status: 'draft', runs30d: 0, successRate: null, lastRun: 'Never', updated: 'Just now', owner: 'You' };
    const next = rs.slice(); next.splice(i + 1, 0, copy); flash('Workflow duplicated'); return next;
  });
  const toggleStatus = (id) => setRows((rs) => rs.map((r) => {
    if (r.id !== id) return r;
    const ns = r.status === 'live' ? 'paused' : 'live';
    flash(ns === 'live' ? `“${r.name}” is now live` : `“${r.name}” paused`);
    return { ...r, status: ns };
  }));
  const doDelete = () => {
    const ids = new Set(delTarget.ids);
    setRows((rs) => rs.filter((r) => !ids.has(r.id)));
    setSel(new Set()); flash(delTarget.ids.length > 1 ? `${delTarget.ids.length} workflows deleted` : 'Workflow deleted');
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

  /* the designer is a capability: when it is off, no row, button or hint may reach it */
  const canEdit = !window.KZ || window.KZ.on('automations', 'designer');
  const canRead = !window.KZ || window.KZ.on('automations', 'runs');
  const editHref = 'Koomzo POS - Workflow Orchestrator.html';
  const rowHref = canEdit ? editHref : canRead ? 'Koomzo POS - Workflow Runs.html' : null;
  const accentStyle = { '--kz-primary': t.accent };
  const compact = t.density === 'compact';

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
      <div className="rt-wrap">
        <div className={'pa-app' + (device === 'tablet' ? ' is-tablet' : '')} style={accentStyle}>
          <KzPaRail mid="automations" active="list" onView={setView} setupOn={view === 'setup'}
            badges={{ runs: rows.filter((r) => r.status === 'error' || r.failures > 0).length }} />
          <div className="pa-main">
            <header className="pa-topbar">
              <div className="pa-topbar__crumb">
                <ion-icon name="git-network-outline"></ion-icon>Automations
                <ion-icon name="chevron-forward-outline"></ion-icon><b>Workflows</b>
              </div>
              <div className="pa-topbar__right">
                <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
                <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
                <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
              </div>
            </header>

            {view === 'setup' ? <div className="pa-setupwrap"><ModuleSetup mid="automations" embedded /></div> : <>
            <div className="pa-pagehead">
              <div className="pa-pagehead__t">
                <span className="pa-eyebrow">Automations</span>
                <h1>Workflows <span className="count">{counts.all}</span></h1>
              </div>
              <div className="pa-pagehead__actions">
                {(!window.KZ || window.KZ.on('automations', 'templates')) && <button className="pa-btn" onClick={() => setTplOpen(true)}><ion-icon name="albums-outline"></ion-icon>Use templates</button>}
                {canEdit
                  ? <button className="pa-btn primary" onClick={() => setCreateOpen(true)}><ion-icon name="add-outline"></ion-icon>New workflow</button>
                  : canRead && <a className="pa-btn primary" href="Koomzo POS - Workflow Runs.html"><ion-icon name="pulse-outline"></ion-icon>Run history</a>}
              </div>
            </div>

            <div className="pa-toolbar">
              <div className="pa-search">
                <ion-icon name="search-outline"></ion-icon>
                <input placeholder="Search workflows…" value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && <button className="clr" onClick={() => setQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
              </div>
              <div className="au-tabs">
                {[['all', 'All'], ['live', 'Live'], ['draft', 'Draft'], ['paused', 'Paused']].map(([k, label]) => (
                  <button key={k} className={'au-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
                    {label}<span className="n">{counts[k]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pa-tablewrap">
              {filtered.length === 0 ? (
                <div className="pa-empty"><ion-icon name="git-network-outline"></ion-icon><p>No workflows match your filters.</p></div>
              ) : (
                <table className={'pa-table' + (compact ? ' pa-rowcompact' : '')} style={{ minWidth: 1020 }}>
                  <thead>
                    <tr>
                      <th className="pa-th-check">
                        <button className={'pa-check' + (allVisibleSelected ? ' on' : '')} onClick={toggleAll}><ion-icon name="checkmark-outline"></ion-icon></button>
                      </th>
                      <th>Workflow</th>
                      <th>Status</th>
                      <th>Trigger</th>
                      <th className="num">Steps</th>
                      <th className="num">Runs · 30d</th>
                      <th>Success</th>
                      <th>Last run</th>
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
                        <td><TriggerCell trigger={r.trigger} /></td>
                        <td className="num"><span className="au-mono">{r.steps}</span></td>
                        <td className="num"><span className="au-mono">{window.KZ_LOCALE.int(r.runs30d)}</span></td>
                        <td>
                          {r.successRate == null ? <span className="au-sub">—</span> : (
                            <div className="au-rate">
                              <div className="au-rate__top"><b>{r.successRate}%</b></div>
                              <div className="au-rate__track"><div className="au-rate__fill" style={{ width: r.successRate + '%', background: r.successRate >= 97 ? 'var(--kz-success)' : r.successRate >= 90 ? 'var(--kz-warning)' : 'var(--kz-discount)' }}></div></div>
                            </div>
                          )}
                        </td>
                        <td><span className="au-sub">{r.lastRun}</span></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="pa-rowact">
                            {canEdit && <a className="pa-rowbtn" href={editHref} title="Edit in builder"><ion-icon name="create-outline"></ion-icon></a>}
                            <button className="pa-rowbtn" title={r.status === 'live' ? 'Pause' : 'Activate'} onClick={() => toggleStatus(r.id)}>
                              <ion-icon name={r.status === 'live' ? 'pause-outline' : 'play-outline'}></ion-icon>
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
                <button onClick={() => { [...sel].forEach((id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: 'live' } : r))); flash(`${sel.size} activated`); setSel(new Set()); }}><ion-icon name="play-outline"></ion-icon>Activate</button>
                <button onClick={() => { [...sel].forEach((id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: 'paused' } : r))); flash(`${sel.size} paused`); setSel(new Set()); }}><ion-icon name="pause-outline"></ion-icon>Pause</button>
                <button onClick={() => { [...sel].forEach(duplicate); setSel(new Set()); }}><ion-icon name="copy-outline"></ion-icon>Duplicate</button>
                <button className="danger" onClick={() => setDelTarget({ ids: [...sel], name: '' })}><ion-icon name="trash-outline"></ion-icon>Delete</button>
                <button className="pa-bulk__x" onClick={() => setSel(new Set())}><ion-icon name="close-outline"></ion-icon></button>
              </div>
            ) : (
              <div className="pa-footer">
                <div className="pa-footer__view"><ion-icon name="information-circle-outline" style={{ fontSize: 16, color: 'var(--kz-muted-2)' }}></ion-icon>{canEdit ? 'Click a row to open it in the builder' : canRead ? 'Click a row to see its runs' : 'Pause and activate from the row actions'}</div>
                <div className="pa-footer__range">{filtered.length} of {rows.length} workflows</div>
              </div>
            )}
            </>}
          </div>

          {createOpen && <CreateModal onCreate={createWorkflow} onClose={() => setCreateOpen(false)} />}
          {tplOpen && <TemplateGallery onClone={() => {}} onClose={() => setTplOpen(false)} />}
          {delTarget && <ConfirmModal target={delTarget.name} count={delTarget.ids.length} onConfirm={doDelete} onClose={() => setDelTarget(null)} />}
          {toast && <div className="au-toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device}
          options={[{ value:'desktop', label:'Desktop' }, { value:'tablet', label:'Tablet' }]}
          onChange={(v) => setTweak('device', v)} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent color" value={t.accent} options={['#8a5cf6', '#6a61bf', '#4b4ad9', '#303b57']} onChange={(v) => setTweak('accent', v)} />
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
