/* Koomzo — Template Library (platform owner). Control Centre → Templates.
   Library → editor (reuses the Restaurant Menu + Floor editors via a template-scoped suite) → preview → publish. */

const TL_STATUS = (t) => t.status === 'archived' ? ['Archived', 'arch'] : t.status === 'draft' ? ['Draft', 'draft']
  : t.dirty ? ['v' + t.version + ' · unpublished changes', 'dirty'] : ['Published v' + t.version, 'pub'];
const tlDate = (ms) => ms ? window.KZ_LOCALE.fmtDate(new Date(ms)) : '—';

function useTpl() {
  const [, bump] = React.useState(0);
  React.useEffect(() => window.KZ_TPL.subscribe(() => bump((n) => n + 1)), []);
  return window.KZ_TPL;
}

/* the Restaurant editors read useSuite(); here the "venue" is a template's draft */
function TplSuite({ t, children }) {
  const T = window.KZ_TPL;
  const c = t.draft || {};
  const setPart = (k) => (fn) => T.setDraft(t.id, (d) => ({ ...d, [k]: typeof fn === 'function' ? fn(d[k] || []) : fn }));
  const noop = () => {};
  const value = {
    tplMode: true, vertical: 'restaurant',
    menu: c.items || [], setMenu: setPart('items'),
    verticalCfg: { id: 'tpl', label: 'Template', flags: { kitchen: true }, categories: c.categories || [] }, setCategories: setPart('categories'),
    floorsAll: c.areas || [], floors: activeFloors(c.areas || []), setFloors: setPart('areas'),
    tableStatusFor: () => 'free', rules: { floorSetupDone: true }, setRules: noop, setSetupTab: noop,
    tplUndo: null, setTplUndo: noop, tplOpen: null, setTplOpen: noop, me: { name: 'Koomzo team' },
  };
  return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
}

function TlCard({ t, onOpen }) {
  const T = window.KZ_TPL;
  const [st, cls] = TL_STATUS(t);
  const n = T.usedBy(t.id);
  return (
    <button className={'tl-card' + (t.status === 'archived' ? ' arch' : '')} onClick={onOpen}>
      <div className="tl-card__th">{t.kind === 'menu' ? <MenuThumb content={t.draft} /> : <MiniFloor areas={t.draft.areas} h={84} />}</div>
      <div className="tl-card__b">
        <div className="tl-card__t"><b>{t.name}</b><span className={'tl-st ' + cls}>{st}</span></div>
        <span className="tl-card__d">{t.description || 'No description yet.'}</span>
        <div className="tl-chips"><em className="tpl-lang">{t.locale.toUpperCase()}</em>{t.venueTypes.map((v) => <span key={v}>{tplVenueLabel(v)}</span>)}</div>
        <div className="tl-card__f"><span>{tplCounts(t, t.draft)}</span><span><ion-icon name="people-outline"></ion-icon>Used by {n}</span><span>{tlDate(t.updatedAt)}</span></div>
      </div>
    </button>
  );
}

function TlNewSheet({ kind, onClose, onCreated }) {
  const T = window.KZ_TPL;
  const pool = T.list({ kind });
  const [from, setFrom] = React.useState('');
  const [name, setName] = React.useState('');
  const create = () => { const t = T.create({ kind, name: name.trim() || null, from: from || null }); onCreated(t.id); };
  return (
    <div className="tp-scrim" onClick={onClose}>
      <div className="tl-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>New {TPL_KIND_WORD[kind][0]} template</h3>
        <label className="ms-f"><span>Name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'menu' ? 'Maquis de Yaoundé' : 'Terrasse + salle VIP'} /></label>
        <div className="ms-f"><span>Start from</span>
          <div className="tl-from">
            <button className={!from ? 'on' : ''} onClick={() => setFrom('')}><ion-icon name="document-outline"></ion-icon><b>Blank</b><small>{kind === 'menu' ? 'Add dishes or import a CSV next' : 'Add areas and tables next'}</small></button>
            {pool.map((t) => <button key={t.id} className={from === t.id ? 'on' : ''} onClick={() => setFrom(t.id)}><ion-icon name="copy-outline"></ion-icon><b>Copy of {t.name}</b><small>{tplCounts(t, t.draft)}</small></button>)}
          </div></div>
        <p className="ms-hint" style={{ margin: 0 }}>New templates start as a draft. Customers see them only after you publish.</p>
        <div className="ms-form__ft"><div style={{ flex: 1 }}></div><button className="rk-btn" onClick={onClose}>Cancel</button><button className="rk-btn pri" onClick={create}><ion-icon name="add-outline"></ion-icon>Create draft</button></div>
      </div>
    </div>
  );
}

function TlPublishSheet({ t, onClose }) {
  const T = window.KZ_TPL;
  const errs = T.check(t);
  const n = T.usedBy(t.id);
  const [res, setRes] = React.useState(null);
  return (
    <div className="tp-scrim" onClick={onClose}>
      <div className="tl-sheet" onClick={(e) => e.stopPropagation()}>
        {res ? <>
          <div className="tl-ok"><ion-icon name="checkmark-circle"></ion-icon><div><b>Version {res.version} is live</b><span>New customers starting from {t.name} get it from now on.</span></div></div>
          <div className="ms-form__ft"><div style={{ flex: 1 }}></div><button className="rk-btn pri" onClick={onClose}>Done</button></div>
        </> : errs.length ? <>
          <h3>Not ready to publish</h3>
          <p className="ms-hint" style={{ margin: 0 }}>Fix these first — customers would copy them as they are.</p>
          <div className="ms-errs">{errs.map((e, i) => <div key={i}><span>{i + 1}</span>{e}</div>)}</div>
          <div className="ms-form__ft"><div style={{ flex: 1 }}></div><button className="rk-btn pri" onClick={onClose}>Back to editing</button></div>
        </> : <>
          <h3>{'Publish version ' + ((t.version || 0) + 1) + '?'}</h3>
          <p className="tl-p">Customers who start from <b>{t.name}</b> from now on get this version — {tplCounts(t, t.draft)}.</p>
          {n > 0 && <p className="tl-p">The {n} {n === 1 ? 'customer who' : 'customers who'} already copied it keep their own copy. Nothing changes for them.</p>}
          <div className="ms-form__ft"><div style={{ flex: 1 }}></div><button className="rk-btn" onClick={onClose}>Cancel</button>
            <button className="rk-btn pri" onClick={() => setRes(T.publish(t.id))}><ion-icon name="cloud-upload-outline"></ion-icon>Publish</button></div>
        </>}
      </div>
    </div>
  );
}

function TlPreviewSheet({ t, onClose }) {
  return (
    <div className="tp-scrim" onClick={onClose}>
      <div className="tl-sheet tl-sheet--wide" onClick={(e) => e.stopPropagation()}>
        <div className="tl-prevhd"><div><span className="tp-k">What the customer sees{t.dirty || !t.live ? ' · draft' : ''}</span><h3>{t.name}</h3><span className="ms-hint">{t.description}</span></div>
          <button className="tp-x" onClick={onClose} aria-label="Close"><ion-icon name="close"></ion-icon></button></div>
        <div className="tl-prevbd">{t.kind === 'menu' ? <MenuPreview content={t.draft} /> : <FloorPreview content={t.draft} />}</div>
      </div>
    </div>
  );
}

function TlDetails({ t }) {
  const T = window.KZ_TPL;
  const others = T.list({ kind: t.kind === 'menu' ? 'floor' : 'menu' }).filter((x) => x.status !== 'archived');
  const toggleVenue = (v) => T.setMeta(t.id, { venueTypes: t.venueTypes.includes(v) ? t.venueTypes.filter((x) => x !== v) : [...t.venueTypes, v] });
  const uses = T.uses(t.id);
  const rules = (t.draft && t.draft.rules) || {};
  return (
    <div className="te-det">
      <div className="te-k">Details</div>
      <label className="ms-f"><span>Name</span><input value={t.name} onChange={(e) => T.setMeta(t.id, { name: e.target.value })} /></label>
      <label className="ms-f"><span>Description</span><textarea rows="3" value={t.description} onChange={(e) => T.setMeta(t.id, { description: e.target.value })}></textarea></label>
      <div className="ms-f"><span>Shown to venues</span>
        <div className="svc-chips tight">{T.VENUES.map((v) => <button key={v.id} className={t.venueTypes.includes(v.id) ? 'on' : ''} onClick={() => toggleVenue(v.id)}>{v.label}</button>)}</div></div>
      <div className="ms-f"><span>Language</span>
        <div className="svc-chips tight">{[['fr', 'Français'], ['en', 'English']].map(([k, l]) => <button key={k} className={t.locale === k ? 'on' : ''} onClick={() => T.setMeta(t.id, { locale: k })}>{l}</button>)}</div></div>
      <div className="ms-f"><span>Currency</span><div className="te-ro">{window.KZ_LOCALE.currency.label}</div></div>
      <label className="ms-f"><span>Pairs with</span>
        <select className="te-sel" value={t.pairWith || ''} onChange={(e) => T.pair(t.id, e.target.value || null)}>
          <option value="">No pairing</option>
          {others.map((x) => <option key={x.id} value={x.id}>{x.name} ({TPL_KIND_WORD[x.kind][0]})</option>)}
        </select>
        <small className="ms-hint">After copying this one, the customer is offered the paired {t.kind === 'menu' ? 'floor plan' : 'menu'}.</small></label>
      {t.kind === 'floor' && <>
        <div className="ms-f"><span>Counter only</span>
          <div className="te-row"><small className="ms-hint">No tables — tabs and counter tickets.</small><Toggle on={!!t.draft.counterOnly} onChange={(v) => T.setDraft(t.id, (d) => ({ ...d, counterOnly: v }))} /></div></div>
        <div className="ms-f"><span>Service rules it sets</span>
          <Seg value={rules.voidRule || 'pin-always'} onChange={(v) => T.setDraft(t.id, (d) => ({ ...d, rules: { ...(d.rules || {}), voidRule: v } }))}
            options={[['free-until-start', 'Approve after cooking'], ['pin-always', 'Always approve'], ['free', 'Never']]} />
          <div className="te-row"><small className="ms-hint">Print to the kitchen</small><Toggle on={!!rules.printKitchen} onChange={(v) => T.setDraft(t.id, (d) => ({ ...d, rules: { ...(d.rules || {}), printKitchen: v } }))} /></div></div>
      </>}
      <div className="te-k" style={{ marginTop: 6 }}>Used by {T.usedBy(t.id)}</div>
      {!uses.length && <p className="ms-hint" style={{ margin: 0 }}>No customer has copied it yet.</p>}
      {uses.slice(0, 5).map((u, i) => <div key={i} className="te-use"><b>{u.tenant}</b><span>v{u.version} · {u.mode === 'replace' ? 'Replaced' : 'Added'} · {window.KZ_LOCALE.fmtDateTime(new Date(u.at))}</span></div>)}
      {(t.history || []).length > 0 && <>
        <div className="te-k" style={{ marginTop: 6 }}>Versions</div>
        {(t.history || []).slice(0, 5).map((h) => <div key={h.version} className="te-use"><b>v{h.version}</b><span>{h.by} · {tlDate(h.at)}</span></div>)}
      </>}
    </div>
  );
}

function TlEditor({ id, onBack }) {
  const T = window.KZ_TPL;
  const t = T.get(id);
  const narrow = useNarrow(900);
  const [sheet, setSheet] = React.useState(null);
  const [det, setDet] = React.useState(!narrow);
  React.useEffect(() => { setDet(!narrow); }, [narrow]);
  if (!t) return null;
  const [st, cls] = TL_STATUS(t);
  return (
    <div className="te">
      <div className="te-bar">
        <button className="tp-x" onClick={() => onBack()} aria-label="Back to library"><ion-icon name="chevron-back"></ion-icon></button>
        <div className="te-bar__t"><b>{t.name || 'Untitled'}</b><span className={'tl-st ' + cls}>{st}</span></div>
        <span className="sp"></span>
        <button className="rk-btn" title="Details" onClick={() => setDet((v) => !v)}><ion-icon name="options-outline"></ion-icon><span className="te-lbl">{det ? 'Hide details' : 'Details'}</span></button>
        <button className="rk-btn" title="Preview" onClick={() => setSheet('preview')}><ion-icon name="eye-outline"></ion-icon><span className="te-lbl">Preview</span></button>
        <button className="rk-btn" title="Duplicate" onClick={() => { const c = T.create({ kind: t.kind, from: t.id }); onBack(c.id); }}><ion-icon name="copy-outline"></ion-icon><span className="te-lbl">Duplicate</span></button>
        {t.live && t.dirty && <button className="rk-btn" title="Discard changes" onClick={() => T.discard(t.id)}><ion-icon name="arrow-undo-outline"></ion-icon><span className="te-lbl">Discard changes</span></button>}
        {!t.live ? <button className="rk-btn bad" title="Delete draft" onClick={() => { T.remove(t.id); onBack(); }}><ion-icon name="trash-outline"></ion-icon><span className="te-lbl">Delete draft</span></button>
          : t.status === 'archived' ? <button className="rk-btn" title="Restore" onClick={() => T.restore(t.id)}><ion-icon name="refresh-outline"></ion-icon><span className="te-lbl">Restore</span></button>
          : <button className="rk-btn" title="Archive" onClick={() => T.archive(t.id)}><ion-icon name="archive-outline"></ion-icon><span className="te-lbl">Archive</span></button>}
        {t.status !== 'archived' && <button className="rk-btn pri" disabled={t.live && !t.dirty} onClick={() => setSheet('publish')}><ion-icon name="cloud-upload-outline"></ion-icon>{'Publish v' + ((t.version || 0) + 1)}</button>}
      </div>
      {t.status === 'archived' && <div className="te-note"><ion-icon name="archive-outline"></ion-icon>Archived — hidden from customers. Copies already made are not affected.</div>}
      <div className={'te-body' + (det ? ' det' : '')}>
        {det && <TlDetails t={t} />}
        <div className={'te-ed te-ed--' + t.kind}>
          <TplSuite t={t}>{t.kind === 'menu' ? <MenuSetup key={t.id} /> : <FloorEditor key={t.id} />}</TplSuite>
        </div>
      </div>
      {sheet === 'publish' && <TlPublishSheet t={t} onClose={() => setSheet(null)} />}
      {sheet === 'preview' && <TlPreviewSheet t={t} onClose={() => setSheet(null)} />}
    </div>
  );
}

function TemplateLibrary() {
  const T = useTpl();
  const embed = /embed=1/.test(location.search);
  const [kind, setKind] = React.useState('menu');
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [venue, setVenue] = React.useState('all');
  const [lang, setLang] = React.useState('all');
  const [open, setOpen] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const list = T.list({ kind }).filter((t) => (status === 'all' ? t.status !== 'archived' : t.status === status)
    && (venue === 'all' || t.venueTypes.includes(venue)) && (lang === 'all' || t.locale === lang)
    && (!q || (t.name + ' ' + t.description).toLowerCase().includes(q.toLowerCase())));
  const cnt = (k) => T.list({ kind: k }).filter((t) => t.status !== 'archived').length;

  return (
    <div className="frame tl-frame">
      {open ? <TlEditor id={open} onBack={(next) => setOpen(next || null)} /> : (
        <div className="tl">
          <div className="tl-hd">
            <div className="tl-mark"><ion-icon name="albums-outline"></ion-icon></div>
            <div><h1>Template Library</h1><p>Sample menus and floor plans. Customers copy one during setup and own the copy — later changes here never reach them.</p></div>
            {!embed && <a className="rk-btn" href="Koomzo - Control Centre.html"><ion-icon name="options-outline"></ion-icon>Control Centre</a>}
          </div>
          <div className="tl-bar">
            <div className="tl-seg">
              <button className={kind === 'menu' ? 'on' : ''} onClick={() => setKind('menu')}><ion-icon name="book-outline"></ion-icon>Menus<em>{cnt('menu')}</em></button>
              <button className={kind === 'floor' ? 'on' : ''} onClick={() => setKind('floor')}><ion-icon name="grid-outline"></ion-icon>Floor plans<em>{cnt('floor')}</em></button>
            </div>
            <label className="tl-search"><ion-icon name="search-outline"></ion-icon><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" /></label>
            <button className="rk-btn pri" onClick={() => setCreating(true)}><ion-icon name="add-outline"></ion-icon>New template</button>
          </div>
          <div className="tl-filters">
            <div className="svc-chips tight">{[['all', 'Active'], ['published', 'Published'], ['draft', 'Drafts'], ['archived', 'Archived']].map(([k, l]) => <button key={k} className={status === k ? 'on' : ''} onClick={() => setStatus(k)}>{l}</button>)}</div>
            <select className="te-sel sm" value={venue} onChange={(e) => setVenue(e.target.value)}><option value="all">All venue types</option>{T.VENUES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select>
            <div className="svc-chips tight">{[['all', 'All languages'], ['fr', 'FR'], ['en', 'EN']].map(([k, l]) => <button key={k} className={lang === k ? 'on' : ''} onClick={() => setLang(k)}>{l}</button>)}</div>
          </div>
          <div className="tl-grid">
            {list.map((t) => <TlCard key={t.id} t={t} onOpen={() => setOpen(t.id)} />)}
            {!list.length && <div className="tp-none"><b>No templates match.</b><span>Change the filters, or create one.</span></div>}
          </div>
        </div>
      )}
      {creating && <TlNewSheet kind={kind} onClose={() => setCreating(false)} onCreated={(nid) => { setCreating(false); setOpen(nid); }} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<TemplateLibrary />);
