/* Koomzo POS Suite — Setup → Menu: categories, dishes, price, station */
const MS_TINTS = [
  { bg: '#f9efd8', fg: '#b8902f' }, { bg: '#fdeae4', fg: '#ec603a' }, { bg: '#e4f4ea', fg: '#2e9e5b' },
  { bg: '#e8f0fd', fg: '#528cef' }, { bg: '#fbf2dd', fg: '#c98a20' }, { bg: '#e2f3f1', fg: '#2f9d8f' },
  { bg: '#eeecf8', fg: '#6a61bf' }, { bg: '#f7e9ec', fg: '#9c3b50' }, { bg: '#f1ece2', fg: '#a07d4f' },
];
const MS_ICONS = ['restaurant-outline', 'flame-outline', 'fish-outline', 'leaf-outline', 'fast-food-outline', 'nutrition-outline', 'ice-cream-outline', 'cafe-outline', 'beer-outline', 'wine-outline', 'pizza-outline', 'egg-outline'];


/* ---- dish artwork: photo (CDN URL or uploaded) with icon + tint fallback ---- */
function DishArt({ p, className, as, children }) {
  const [bad, setBad] = React.useState(false);
  React.useEffect(() => { setBad(false); }, [p.img]);
  const Tag = as || 'div';
  const show = !!p.img && !bad;
  const tint = p.tint || { bg: '#eceef2', fg: '#5d6573' };
  return (
    <Tag className={(className || '') + (show ? ' has-img' : '')} style={{ background: tint.bg, color: tint.fg }}>
      {show ? <img className="dish-img" src={p.img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} /> : <ion-icon name={p.icon || 'restaurant-outline'} style={{ color: tint.fg }}></ion-icon>}
      {children}
    </Tag>
  );
}
const MS_IMG_OK = (u) => /^https:\/\/\S+$/i.test(u) || /^data:image\//.test(u);
/* uploads are resized on the device (max 640 px, JPEG) so the prototype can keep them offline;
   production sends the file to the media CDN and stores the returned URL instead */
function msResize(file, max) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error('Choose an image file (JPG, PNG or WebP).'));
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      const k = Math.min(1, (max || 640) / Math.max(im.width, im.height));
      const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); };
      im.onerror = () => rej(new Error('That file could not be read as an image.')); im.src = r.result; };
    r.readAsDataURL(file);
  });
}
function PhotoField({ d, set }) {
  const [url, setUrl] = React.useState(d.img && !/^data:/.test(d.img) ? d.img : '');
  const [state, setState] = React.useState(d.img ? 'ok' : 'none');
  const [err, setErr] = React.useState('');
  const inp = React.useRef(null);
  const applyUrl = () => {
    const u = url.trim(); setErr('');
    if (!u) { set({ img: '' }); setState('none'); return; }
    if (!MS_IMG_OK(u)) { setErr('Use a full https:// link to the image.'); return; }
    setState('loading');
    const im = new Image();
    im.onload = () => { set({ img: u }); setState('ok'); };
    im.onerror = () => { setState('none'); setErr('No image at that link. Check it opens in a browser.'); };
    im.src = u;
  };
  const upload = async (f) => {
    if (!f) return; setErr(''); setState('loading');
    try { const data = await msResize(f, 640); set({ img: data }); setUrl(''); setState('ok'); }
    catch (e) { setErr(e.message); setState(d.img ? 'ok' : 'none'); }
  };
  return (
    <div className="ms-f"><span>Photo</span>
      <div className="ms-photo">
        <div className="ms-photo__pv" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files[0]); }}>
          {state === 'loading' ? <div className="ms-photo__ld"><ion-icon name="hourglass-outline"></ion-icon></div> : <DishArt p={d} className="ms-photo__art" />}
        </div>
        <div className="ms-photo__c">
          <div className="ms-photo__row">
            <input value={url} onChange={(e) => setUrl(e.target.value)} onBlur={applyUrl} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyUrl(); } }} placeholder="https://cdn.example.com/poulet-dg.jpg" inputMode="url" />
          </div>
          <div className="ms-photo__row">
            <input ref={inp} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} />
            <button className="rk-btn" onClick={() => inp.current.click()}><ion-icon name="camera-outline"></ion-icon>Upload photo</button>
            {d.img && <button className="rk-btn bad" onClick={() => { set({ img: '' }); setUrl(''); setState('none'); }}><ion-icon name="close-outline"></ion-icon>Remove</button>}
          </div>
          {err ? <small className="ms-photo__err">{err}</small> : <small className="ms-hint">Paste a CDN link or upload. Square photos look best. Without a photo the tile uses the icon and colour below.</small>}
        </div>
      </div>
    </div>
  );
}

/* ---- CSV import / template ---- */
const MS_COLS = ['category', 'name', 'description', 'price', 'station', 'tags', 'image'];
function msParseCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
function msDownload(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
const msCell = (v) => /[",;\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
function msTemplate(cats) {
  const st = (k) => (window.RK_STATIONS[k] || {}).label || k;
  const c = (i, d) => (cats[i] || {}).label || d;
  const ex = [
    [c(0, 'Starters'), 'Soya Brochette', 'Spiced beef skewer, 2 pc', 1000, st('grill'), 'spicy', 'https://cdn.example.com/menu/soya.jpg'],
    [c(1, 'Mains'), 'Ndolé Crevettes', 'Bitterleaf, prawns, plantain', 3500, st('pasta'), 'shellfish;nuts', ''],
    ['Drinks', 'Jus de Foléré', 'Hibiscus, ginger', 500, st('bar'), 'vg', ''],
  ];
  return [MS_COLS, ...ex].map((r) => r.map(msCell).join(',')).join('\r\n') + '\r\n';
}
function msExport(menu, cats) {
  const cl = (id) => (cats.find((c) => c.id === id) || {}).label || id;
  const rows = menu.map((p) => [cl(p.cat), p.name, p.desc || '', p.price, (window.RK_STATIONS[p.station] || {}).label || p.station, (p.tags || []).join(';'), p.img && !/^data:/.test(p.img) ? p.img : '']);
  return [MS_COLS, ...rows].map((r) => r.map(msCell).join(',')).join('\r\n') + '\r\n';
}
/* rows → { items, newCats, errors } against the current categories */
function msPlan(rows, cats) {
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (k, alt) => { const i = head.indexOf(k); return i >= 0 ? i : head.indexOf(alt); };
  const ix = { category: idx('category', 'catégorie'), name: idx('name', 'nom'), description: idx('description', 'desc'), price: idx('price', 'prix'), station: idx('station', 'poste'), image: idx('image', 'photo'), tags: idx('tags', 'tag') };
  if (ix.name < 0 || ix.price < 0 || ix.category < 0) return { fatal: 'The first row must name the columns: category, name, price (description, station and tags are optional).' };
  const stationKey = (v) => { const s = (v || '').trim().toLowerCase(); if (!s) return null;
    const hit = Object.entries(window.RK_STATIONS).find(([k, x]) => k === s || x.label.toLowerCase() === s); return hit ? hit[0] : undefined; };
  const tagKeys = (v) => (v || '').split(/[;|/]/).map((t) => t.trim().toLowerCase()).filter(Boolean)
    .map((t) => Object.keys(window.RK_TAGS).find((k) => k === t || window.RK_TAGS[k].label.toLowerCase() === t)).filter(Boolean);
  const catList = [...cats]; const newCats = []; const items = []; const errors = [];
  rows.slice(1).forEach((r, n) => {
    const line = n + 2; const g = (k) => (ix[k] >= 0 ? (r[ix[k]] || '') : '').trim();
    const name = g('name'), cl = g('category'), pr = +g('price').replace(/[^\d.]/g, '');
    if (!name) return errors.push({ line, msg: 'No name' });
    if (!cl) return errors.push({ line, msg: name + ' — no category' });
    if (!(pr > 0)) return errors.push({ line, msg: name + ' — price missing or not a number' });
    const st = stationKey(g('station'));
    if (st === undefined) return errors.push({ line, msg: name + ' — unknown station "' + g('station') + '"' });
    let cat = catList.find((c) => c.label.toLowerCase() === cl.toLowerCase() || c.id === cl.toLowerCase());
    if (!cat) { cat = { id: cl.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + (catList.length + 1), label: cl, icon: 'restaurant-outline' }; catList.push(cat); newCats.push(cat); }
    const img = g('image');
    if (img && !MS_IMG_OK(img)) return errors.push({ line, msg: name + ' — image must be a full https:// link' });
    items.push({ cat: cat.id, name, desc: g('description'), price: Math.round(pr), station: st || 'none', tags: tagKeys(g('tags')), ...(img ? { img } : {}) });
  });
  return { items, newCats, errors };
}

function MenuImport({ menu, cats, onApply, onCancel }) {
  const [plan, setPlan] = React.useState(null);
  const [file, setFile] = React.useState('');
  const [mode, setMode] = React.useState('merge');
  const inp = React.useRef(null);
  const read = (f) => { if (!f) return; setFile(f.name); const r = new FileReader();
    r.onload = () => { const rows = msParseCsv(String(r.result)); setPlan(rows.length < 2 ? { fatal: 'The file has no dish rows.' } : msPlan(rows, cats)); };
    r.readAsText(f, 'utf-8'); };
  const byName = (n) => menu.find((p) => p.name.toLowerCase() === n.toLowerCase());
  const upd = plan && plan.items ? plan.items.filter((i) => byName(i.name)).length : 0;
  const add = plan && plan.items ? plan.items.length - upd : 0;
  return (
    <div className="ms-form">
      <div className="ms-form__hd"><h3>Import menu from CSV</h3>
        <button className="rk-btn" onClick={() => msDownload('koomzo-menu-template.csv', msTemplate(cats))}><ion-icon name="download-outline"></ion-icon>Download template</button></div>
      <p className="ms-hint" style={{ margin: 0 }}>One row per dish. Columns: <b>category, name, description, price, station, tags, image</b>. Image is an optional https:// link to the photo on your CDN. Category, name and price are required. Station is one of {Object.values(window.RK_STATIONS).map((s) => s.label).join(', ')}. Separate several tags with <b>;</b>. Comma- or semicolon-separated both work.</p>
      <input ref={inp} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={(e) => { read(e.target.files[0]); e.target.value = ''; }} />
      <button className="ms-drop" onClick={() => inp.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); read(e.dataTransfer.files[0]); }}>
        <ion-icon name="cloud-upload-outline"></ion-icon><b>{file || 'Choose a CSV file'}</b><span>{file ? 'Tap to pick another' : 'or drop it here'}</span></button>
      {plan && plan.fatal && <div className="ms-err"><ion-icon name="alert-circle-outline"></ion-icon>{plan.fatal}</div>}
      {plan && plan.items && <>
        <div className="ms-sum">
          <div><b>{add}</b><span>new dishes</span></div>
          <div><b>{upd}</b><span>updated (same name)</span></div>
          <div><b>{plan.newCats.length}</b><span>new categories</span></div>
          <div className={plan.errors.length ? 'bad' : ''}><b>{plan.errors.length}</b><span>rows skipped</span></div>
        </div>
        {plan.newCats.length > 0 && <p className="ms-hint" style={{ margin: 0 }}>New categories: {plan.newCats.map((c) => c.label).join(', ')}</p>}
        {plan.errors.length > 0 && <div className="ms-errs">{plan.errors.slice(0, 8).map((e) => <div key={e.line}><span>Row {e.line}</span>{e.msg}</div>)}{plan.errors.length > 8 && <div><span></span>+{plan.errors.length - 8} more</div>}</div>}
        <div className="ms-f"><span>How to apply</span>
          <div className="svc-chips tight">
            <button className={mode === 'merge' ? 'on' : ''} onClick={() => setMode('merge')}>Add and update</button>
            <button className={mode === 'replace' ? 'on' : ''} onClick={() => setMode('replace')}>Replace whole menu</button>
          </div>
          <small className="ms-hint">{mode === 'merge' ? 'Dishes with the same name get the new price and details. Everything else stays.' : 'Dishes not in the file are removed from the menu. Open orders keep their lines.'}</small></div>
      </>}
      <div className="ms-form__ft">
        <button className="rk-btn" onClick={() => msDownload('koomzo-menu.csv', msExport(menu, cats))}><ion-icon name="document-text-outline"></ion-icon>Export current menu</button>
        <div style={{ flex: 1 }}></div>
        <button className="rk-btn" onClick={onCancel}>Cancel</button>
        <button className="rk-btn pri" disabled={!plan || !plan.items || !plan.items.length} onClick={() => onApply(plan, mode)}><ion-icon name="checkmark-outline"></ion-icon>Import {plan && plan.items ? plan.items.length + ' dishes' : ''}</button>
      </div>
    </div>
  );
}

function DishForm({ dish, cats, onSave, onCancel, onDelete }) {
  const [d, setD] = React.useState(dish);
  const set = (p) => setD((c) => ({ ...c, ...p }));
  const ok = d.name.trim() && d.price > 0;
  const stations = Object.entries(window.RK_STATIONS);
  return (
    <div className="ms-form">
      <div className="ms-form__hd">
        <h3>{dish.id ? 'Edit dish' : 'New dish'}</h3>
        <div className="ms-prev"><DishArt as="span" p={d} className="ms-ic" />
          <div><b>{d.name || 'Dish name'}</b><small>{money(d.price || 0)}</small></div></div>
      </div>
      <label className="ms-f"><span>Name</span><input value={d.name} autoFocus onChange={(e) => set({ name: e.target.value })} placeholder="Poulet DG" /></label>
      <label className="ms-f"><span>Short description</span><input value={d.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="Chicken, plantain, veg" /></label>
      <label className="ms-f"><span>Price (FCFA)</span><input inputMode="numeric" value={d.price || ''} onChange={(e) => set({ price: +e.target.value.replace(/\D/g, '') })} placeholder="4500" /></label>
      <div className="ms-f"><span>Category</span>
        <div className="svc-chips tight">{cats.map((c) => <button key={c.id} className={d.cat === c.id ? 'on' : ''} onClick={() => set({ cat: c.id })}><ion-icon name={c.icon}></ion-icon>{c.label}</button>)}</div></div>
      <div className="ms-f"><span>Prepared at</span>
        <div className="svc-chips tight">{stations.map(([k, s]) => <button key={k} className={d.station === k ? 'on' : ''} onClick={() => set({ station: k })}><i className="ms-dot" style={{ background: s.color }}></i>{s.label}</button>)}</div>
        <small className="ms-hint">The kitchen screen and kitchen printer route the dish here. Counter = no kitchen ticket.</small></div>
      <div className="ms-f"><span>Tags</span>
        <div className="svc-chips tight">{Object.entries(window.RK_TAGS).map(([k, t]) => <button key={k} className={d.tags.includes(k) ? 'on' : ''} onClick={() => set({ tags: d.tags.includes(k) ? d.tags.filter((x) => x !== k) : [...d.tags, k] })}>{t.label}</button>)}</div></div>
      <PhotoField d={d} set={set} />
      <div className="ms-f"><span>{d.img ? 'Fallback icon and colour' : 'Tile'}</span>
        <div className="ms-picks">{MS_ICONS.map((ic) => <button key={ic} className={d.icon === ic ? 'on' : ''} onClick={() => set({ icon: ic })}><ion-icon name={ic}></ion-icon></button>)}</div>
        <div className="ms-picks">{MS_TINTS.map((t, i) => <button key={i} className={d.tint.bg === t.bg ? 'on' : ''} style={{ background: t.bg }} onClick={() => set({ tint: t })}><i style={{ background: t.fg }}></i></button>)}</div></div>
      <div className="ms-form__ft">
        {onDelete && <button className="rk-btn bad" onClick={onDelete}><ion-icon name="trash-outline"></ion-icon>Remove</button>}
        <div style={{ flex: 1 }}></div>
        <button className="rk-btn" onClick={onCancel}>Cancel</button>
        <button className="rk-btn pri" disabled={!ok} onClick={() => onSave(d)}><ion-icon name="checkmark-outline"></ion-icon>Save dish</button>
      </div>
    </div>
  );
}

function MenuSetup() {
  const S = useSuite();
  const { menu, setMenu, verticalCfg, setCategories, tplMode } = S;
  const cats = verticalCfg.categories;
  const [cat, setCat] = React.useState(cats[0]?.id);
  const [edit, setEdit] = React.useState(null);
  const [newCat, setNewCat] = React.useState(null);
  const [importing, setImporting] = React.useState(false);
  const [done, setDone] = React.useState(null);
  const [picking, setPicking] = React.useState(null);
  const [onlyCheck, setOnlyCheck] = React.useState(false);
  React.useEffect(() => { if (!cats.some((c) => c.id === cat)) setCat(cats[0]?.id); }, [cats, cat]);
  /* bundle offer from the floor plan (or any deep link) opens the picker here */
  React.useEffect(() => { if (!tplMode && S.tplOpen && S.tplOpen.kind === 'menu') { setPicking({ id: S.tplOpen.id }); S.setTplOpen(null); } }, [S.tplOpen]);
  const toCheck = tplMode ? [] : menu.filter((p) => p.priceCheck);
  React.useEffect(() => { if (!toCheck.length) setOnlyCheck(false); }, [toCheck.length]);
  const rows = onlyCheck ? toCheck : menu.filter((p) => p.cat === cat);
  const blank = () => ({ id: '', cat, name: '', desc: '', price: 0, icon: 'restaurant-outline', tint: MS_TINTS[0], station: verticalCfg.flags.kitchen ? 'grill' : 'none', tags: [] });
  const save = (d) => {
    const rec = { ...d, priceCheck: false };
    setMenu((cur) => d.id ? cur.map((p) => p.id === d.id ? rec : p) : [...cur, { ...rec, id: 'u' + Date.now().toString(36) }]);
    if (!onlyCheck) setCat(d.cat); setEdit(null);
  };
  const confirmAll = () => setMenu((cur) => cur.map((p) => p.priceCheck ? { ...p, priceCheck: false } : p));
  const addCat = () => {
    const label = (newCat || '').trim(); if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36).slice(-3);
    setCategories((cur) => [...cur, { id, label, icon: 'restaurant-outline' }]);
    setCat(id); setNewCat(null);
  };
  const applyImport = (plan, mode) => {
    if (plan.newCats.length) setCategories((cur) => [...cur, ...plan.newCats]);
    const tint = (i) => MS_TINTS[i % MS_TINTS.length];
    setMenu((cur) => {
      const base = mode === 'replace' ? [] : [...cur];
      plan.items.forEach((it, i) => {
        const old = cur.find((p) => p.name.toLowerCase() === it.name.toLowerCase());
        const k = base.findIndex((p) => p.name.toLowerCase() === it.name.toLowerCase());
        const rec = { icon: 'restaurant-outline', tint: tint(i), ...(old || {}), ...it, id: old ? old.id : 'u' + Date.now().toString(36) + i };
        if (k >= 0) base[k] = rec; else base.push(rec);
      });
      return base;
    });
    setCat(plan.items[0].cat); setImporting(false); setDone(plan.items.length + ' dishes imported');
    setTimeout(() => setDone(null), 4000);
  };
  const move = (i, dir) => setCategories((cur) => { const n = [...cur]; const j = i + dir; if (j < 0 || j >= n.length) return cur; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const renameCat = (c) => { const l = prompt('Category name', c.label); if (l && l.trim()) setCategories((cur) => cur.map((x) => x.id === c.id ? { ...x, label: l.trim() } : x)); };
  const count = (id) => menu.filter((p) => p.cat === id).length;
  const removeCat = (c) => { if (count(c.id)) return; setCategories((cur) => cur.filter((x) => x.id !== c.id)); };
  const catLabel = (id) => (cats.find((c) => c.id === id) || {}).label;
  const empty = !menu.length && !edit && !importing;

  return (
    <div className={'ms' + (edit || importing ? ' ms-editing' : '')}>
      <div className="ms-cats">
        <div className="ms-k">Categories</div>
        {cats.map((c, i) => (
          <div key={c.id} className={'ms-cat' + (cat === c.id && !onlyCheck ? ' on' : '')}>
            <button className="ms-cat__b" onClick={() => { setCat(c.id); setEdit(null); setOnlyCheck(false); }}><ion-icon name={c.icon}></ion-icon><span>{c.label}</span><em>{count(c.id)}</em></button>
            {cat === c.id && !onlyCheck && <div className="ms-cat__acts">
              <button title="Move up" onClick={() => move(i, -1)}><ion-icon name="chevron-up-outline"></ion-icon></button>
              <button title="Move down" onClick={() => move(i, 1)}><ion-icon name="chevron-down-outline"></ion-icon></button>
              <button title="Rename" onClick={() => renameCat(c)}><ion-icon name="create-outline"></ion-icon></button>
              {!count(c.id) && <button title="Remove empty category" onClick={() => removeCat(c)}><ion-icon name="trash-outline"></ion-icon></button>}
            </div>}
          </div>
        ))}
        {!cats.length && <p className="ms-hint" style={{ margin: '0 8px 6px' }}>No categories yet.</p>}
        {newCat === null
          ? <button className="rk-btn ms-add" onClick={() => setNewCat('')}><ion-icon name="add-outline"></ion-icon>New category</button>
          : <div className="ms-newcat"><input autoFocus value={newCat} placeholder="Grills" onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCat(); if (e.key === 'Escape') setNewCat(null); }} />
              <button className="rk-btn pri" onClick={addCat}>Add</button></div>}
        <div className="ms-io">
          {!tplMode && <button className="rk-btn ms-io__w" onClick={() => { setEdit(null); setImporting(false); setPicking({}); }}><ion-icon name="albums-outline"></ion-icon>Templates</button>}
          <button className="rk-btn" onClick={() => { setEdit(null); setImporting(true); }}><ion-icon name="cloud-upload-outline"></ion-icon>Import CSV</button>
          <button className="rk-btn" onClick={() => msDownload('koomzo-menu-template.csv', msTemplate(cats))}><ion-icon name="download-outline"></ion-icon>CSV template</button>
        </div>
      </div>
      <div className="ms-main">
        {!tplMode && <TplAppliedBar kind="menu" />}
        {done && <div className="ms-done"><ion-icon name="checkmark-circle"></ion-icon>{done}</div>}
        {toCheck.length > 0 && !edit && !importing && (
          <div className="ms-chkbar">
            <ion-icon name="pricetag-outline"></ion-icon>
            <span><b>{toCheck.length} {toCheck.length === 1 ? 'dish has a sample price' : 'dishes have sample prices'}</b> from a template. Check them before service.</span>
            <button className="rk-btn" onClick={() => setOnlyCheck((v) => !v)}>{onlyCheck ? 'Show all dishes' : 'Show them'}</button>
            <button className="rk-btn" onClick={confirmAll}><ion-icon name="checkmark-done-outline"></ion-icon>Confirm all prices</button>
          </div>
        )}
        {importing ? <MenuImport menu={menu} cats={cats} onApply={applyImport} onCancel={() => setImporting(false)} />
          : edit ? <DishForm key={edit.id || 'new'} dish={edit} cats={cats} onSave={save} onCancel={() => setEdit(null)}
            onDelete={edit.id ? () => { setMenu((cur) => cur.filter((p) => p.id !== edit.id)); setEdit(null); } : null} />
          : empty ? (
            <div className="fs-empty ms-empty">
              <ion-icon name="book-outline"></ion-icon>
              <h3>{tplMode ? 'This template has no dishes yet' : 'No menu yet'}</h3>
              <p>{tplMode ? 'Add categories and dishes, or import a CSV.' : 'Start from a Koomzo sample menu and change what you need — or build it yourself.'}</p>
              <div className="fs-btns">
                {!tplMode && <button className="rk-btn pri" onClick={() => setPicking({})}><ion-icon name="albums-outline"></ion-icon>Start from a template</button>}
                <button className="rk-btn" onClick={() => setImporting(true)}><ion-icon name="cloud-upload-outline"></ion-icon>Import CSV</button>
                {cats.length > 0 && <button className="rk-btn" onClick={() => setEdit(blank())}><ion-icon name="add-outline"></ion-icon>Add a dish</button>}
              </div>
            </div>
          ) : <>
            <div className="ms-main__hd">
              <div><h3>{onlyCheck ? 'Sample prices to check' : catLabel(cat)}</h3><span>{rows.length} dishes · tap one to edit</span></div>
              {!onlyCheck && cat && <span className="ms-cat-m">
                <button className="rk-btn" title="Rename category" onClick={() => renameCat(cats.find((c) => c.id === cat))}><ion-icon name="create-outline"></ion-icon></button>
                <button className="rk-btn" title="Move earlier" onClick={() => move(cats.findIndex((c) => c.id === cat), -1)}><ion-icon name="chevron-back-outline"></ion-icon></button>
                <button className="rk-btn" title="Move later" onClick={() => move(cats.findIndex((c) => c.id === cat), 1)}><ion-icon name="chevron-forward-outline"></ion-icon></button>
              </span>}
              {!onlyCheck && cat && <button className="rk-btn pri ms-new" onClick={() => setEdit(blank())}><ion-icon name="add-outline"></ion-icon>New dish</button>}
            </div>
            <div className="ms-list">
              {rows.map((p) => { const st = window.RK_STATIONS[p.station] || window.RK_STATIONS.none; return (
                <button key={p.id} className="ms-row" onClick={() => setEdit(p)}>
                  <DishArt as="span" p={p} className="ms-ic" />
                  <span className="ms-row__n"><b>{p.name}{p.priceCheck && <em className="ms-chk">Check price</em>}</b><small>{onlyCheck ? catLabel(p.cat) + ' · ' : ''}{p.desc}</small></span>
                  <span className="kstation"><i style={{ background: st.color }}></i>{st.label}</span>
                  <span className="ms-row__p">{money(p.price)}</span>
                </button>); })}
              {!rows.length && <p className="rules__none" style={{ padding: 20 }}>No dishes in this category yet. Add one with New dish.</p>}
            </div>
          </>}
      </div>
      {picking && <TemplatePicker kind="menu" preselect={picking.id} onClose={() => setPicking(null)} />}
    </div>
  );
}

Object.assign(window, { DishArt, PhotoField, msResize, MenuSetup, DishForm, MenuImport, msParseCsv, msPlan });
