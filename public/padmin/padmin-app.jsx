/* Koomzo POS — Products admin: app state, device presenter, composition.
   One file drives three surfaces (desktop table + drawer · tablet · phone list
   + full-screen detail), all sharing the same product store + detail form. */
const { useState, useMemo, useEffect, useLayoutEffect } = React;

const PA_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "density": "comfortable",
  "stockStyle": "chip"
}/*EDITMODE-END*/;

const PA_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
  phone:   { w: 390,  h: 844, label: 'Phone',   icon: 'phone-portrait-outline' },
};

let PA_UID = 100;

function PaStage({ w, h, className, children }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const availW = window.innerWidth - 52;
      const availH = window.innerHeight - 56 - 52;
      setScale(Math.min(1, availW / w, availH / h));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className={'device ' + className} style={{ width: w, height: h, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const blankDraft = () => ({
  id: 'new', name: '', desc: '', sku: 'SKU-' + Math.random().toString(36).slice(2, 9).toUpperCase(),
  barcode: String(2000000000000 + Math.floor(Math.random() * 999999999)), cost: 0, price: 0,
  brand: window.KZ_PA_BRANDS[0], type: window.KZ_PA_TYPES[0], qty: 0, reorder: 20,
  loc: window.KZ_PA_LOCS[0], icon: 'cube-outline', tint: { bg: '#eeecf8', fg: '#6a61bf' }, status: 'out',
});

function App() {
  const [t, setTweak] = useTweaks(PA_TWEAKS);
  const [device, setDevice] = useState('desktop');

  const [products, setProducts] = useState(window.KZ_PA_PRODUCTS);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all | low | out
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [selected, setSelected] = useState(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  const [detailId, setDetailId] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState(null);

  const isPhone = device === 'phone';
  const isTablet = device === 'tablet';

  /* reset transient UI on device switch */
  useEffect(() => { setDetailId(null); setIsNew(false); setSelected(new Set()); setMenuOpen(false); }, [device]);

  /* ---- filter + sort ---- */
  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const inCat = cat === 'all' || p.cat === cat;
      const inStock = stockFilter === 'all' || p.status === stockFilter;
      const q = query.trim().toLowerCase();
      const inQ = !q || (p.name + ' ' + p.sku + ' ' + p.barcode + ' ' + p.brand + ' ' + p.type).toLowerCase().includes(q);
      return inCat && inStock && inQ;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (typeof va === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return list;
  }, [products, cat, stockFilter, query, sort]);

  const counts = useMemo(() => ({
    total: products.length,
    low: products.filter((p) => p.status === 'low').length,
    out: products.filter((p) => p.status === 'out').length,
  }), [products]);

  /* ---- selection ---- */
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => s.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id)));
  const clearSel = () => setSelected(new Set());

  /* ---- sort ---- */
  const onSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  /* ---- detail open / edit ---- */
  const openDetail = (id) => { const p = products.find((x) => x.id === id); if (!p) return; setDraft({ ...p }); setDetailId(id); setIsNew(false); };
  const openNew = () => { setDraft(blankDraft()); setDetailId('new'); setIsNew(true); };
  const closeDetail = () => { setDetailId(null); setIsNew(false); setDraft(null); };
  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const stepQty = (delta) => setDraft((d) => ({ ...d, qty: Math.max(0, d.qty + delta) }));

  const saveDraft = () => {
    const status = draft.qty <= 0 ? 'out' : draft.qty <= draft.reorder ? 'low' : 'ok';
    const margin = +(draft.price - draft.cost).toFixed(2);
    const rec = { ...draft, status, margin };
    if (isNew) {
      rec.id = 'p' + (PA_UID++);
      rec.cat = ({ Lotion: 'beauty', Soap: 'beauty', 'Hair care': 'beauty', Electronics: 'electro', Accessories: 'electro', Cleaning: 'home', 'Paper goods': 'home' })[rec.type] || 'grocery';
      setProducts((cur) => [rec, ...cur]);
    } else {
      setProducts((cur) => cur.map((p) => p.id === rec.id ? rec : p));
    }
    closeDetail();
  };
  const deleteDraft = () => { setProducts((cur) => cur.filter((p) => p.id !== draft.id)); closeDetail(); };

  /* ---- accent override (drives --kz-primary live) ---- */
  const accentStyle = { '--kz-primary': t.accent };
  const stockMode = t.stockStyle;

  const dev = PA_DEVICES[device];
  const appClass = `pa-app ${isTablet ? 'is-tablet' : ''} ${t.density === 'compact' ? 'pa-rowcompact' : ''}`;

  const detailProps = draft && {
    draft, isNew, onField: setField, onStep: stepQty,
    onClose: closeDetail, onSave: saveDraft, onDelete: deleteDraft,
  };

  return (
    <div className="present" style={accentStyle}>
      <div className="present__bar">
        <div className="present__brand">
          <div className="mk"><ion-icon name="storefront"></ion-icon></div>
          <b>koomzo<span> · POS</span></b>
        </div>
        <span className="present__tag">Products &amp; inventory admin</span>
        <div className="devseg">
          {Object.keys(PA_DEVICES).map((k) => (
            <button key={k} className={device === k ? 'active' : ''} onClick={() => setDevice(k)}>
              <ion-icon name={PA_DEVICES[k].icon}></ion-icon>{PA_DEVICES[k].label}
            </button>
          ))}
        </div>
        <span className="present__dim">{dev.w} × {dev.h}</span>
      </div>

      <PaStage w={dev.w} h={dev.h} className={device}>
        <div className={appClass} style={accentStyle}>
          {isPhone ? (
            <>
              <MobileList
                rows={filtered} counts={counts} cats={window.KZ_PA_CATEGORIES} activeCat={cat}
                query={query} onQuery={setQuery} onCat={setCat}
                onOpen={openDetail} onAdd={openNew} stockMode={stockMode}
              />
              {draft && (
                <div className="pam__detail">
                  <ProductDetail {...detailProps} isPhone={true} />
                </div>
              )}
            </>
          ) : (
            <>
              <PaRail />
              <div className="pa-main">
                <PaTopbar />

                <div className="pa-pagehead">
                  <div className="pa-pagehead__t">
                    <span className="pa-eyebrow">Data Center</span>
                    <h1>Items <span className="count">{counts.total}</span></h1>
                  </div>
                  <div className="pa-pagehead__actions">
                    <button className="pa-btn primary split" onClick={openNew}>
                      <ion-icon name="add-outline"></ion-icon>Add Item
                      <span className="div" /><span className="caret"><ion-icon name="chevron-down-outline" style={{ fontSize: 15 }}></ion-icon></span>
                    </button>
                    <button className="pa-btn" onClick={() => alert('Import items from an Excel / CSV sheet.')}>
                      <ion-icon name="document-outline"></ion-icon>Import from Excel
                    </button>
                    <div style={{ position: 'relative' }}>
                      <button className="pa-btn icon" onClick={() => setMenuOpen((m) => !m)}><ion-icon name="ellipsis-horizontal"></ion-icon></button>
                      {menuOpen && <PaMenu onClose={() => setMenuOpen(false)} />}
                    </div>
                  </div>
                </div>

                {selected.size > 0 ? (
                  <div className="pa-bulk" style={accentStyle}>
                    <b>{selected.size} selected</b>
                    <div className="pa-bulk__sep" />
                    <button onClick={() => alert('Edit ' + selected.size + ' items')}><ion-icon name="create-outline"></ion-icon>Bulk edit</button>
                    <button onClick={() => { window.location.href = 'Koomzo POS - Barcode Labels.html'; }}><ion-icon name="print-outline"></ion-icon>Print labels</button>
                    <button onClick={() => alert('Export ' + selected.size + ' items')}><ion-icon name="download-outline"></ion-icon>Export</button>
                    <button className="danger" onClick={() => { setProducts((cur) => cur.filter((p) => !selected.has(p.id))); clearSel(); }}><ion-icon name="trash-outline"></ion-icon>Delete</button>
                    <button className="pa-bulk__x" onClick={clearSel}><ion-icon name="close-outline"></ion-icon></button>
                  </div>
                ) : (
                  <div className="pa-toolbar">
                    <label className="pa-search">
                      <ion-icon name="search-outline"></ion-icon>
                      <input placeholder="Search by name, barcode, or SKU" value={query} onChange={(e) => setQuery(e.target.value)} />
                      {query && <button className="clr" onClick={() => setQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
                    </label>
                    <button className="pa-scan" title="Scan barcode"><ion-icon name="barcode-outline"></ion-icon></button>
                    <button className={'pa-filter' + (stockFilter === 'low' ? ' active' : '')} onClick={() => setStockFilter((f) => f === 'low' ? 'all' : 'low')}>
                      <ion-icon name="alert-circle-outline"></ion-icon>Low stock{counts.low > 0 && ` (${counts.low})`}
                    </button>
                    <button className={'pa-filter' + (stockFilter === 'out' ? ' active' : '')} onClick={() => setStockFilter((f) => f === 'out' ? 'all' : 'out')}>
                      <ion-icon name="close-circle-outline"></ion-icon>Out{counts.out > 0 && ` (${counts.out})`}
                    </button>
                    <div className="pa-toolbar__right">
                      <button className="pa-link"><ion-icon name="share-outline"></ion-icon>Export</button>
                    </div>
                  </div>
                )}

                <div className="pa-tablewrap">
                  {filtered.length === 0 ? (
                    <div className="pa-empty"><ion-icon name="cube-outline"></ion-icon><p>No items match your filters.</p></div>
                  ) : (
                    <PaTable
                      rows={filtered} selected={selected} sort={sort} onSort={onSort}
                      onToggle={toggle} onToggleAll={toggleAll} onOpen={openDetail}
                      stockMode={stockMode} isTablet={isTablet}
                    />
                  )}
                </div>

                <div className="pa-footer">
                  <div className="pa-footer__view">
                    View
                    <select className="pa-select" defaultValue="100"><option>25</option><option>50</option><option>100</option></select>
                    per page
                  </div>
                  <div className="pa-footer__range">1–{filtered.length} of {filtered.length}</div>
                  <div className="pa-pager">
                    <button disabled><ion-icon name="chevron-back-outline"></ion-icon></button>
                    <button disabled><ion-icon name="chevron-forward-outline"></ion-icon></button>
                  </div>
                </div>
              </div>

              {draft && (
                <>
                  <div className="pa-scrim" onClick={closeDetail} />
                  <div className="pa-drawer" style={accentStyle}>
                    <ProductDetail {...detailProps} isPhone={false} />
                  </div>
                </>
              )}
            </>
          )}

          <TweaksPanel>
            <TweakSection label="Brand" />
            <TweakColor label="Accent color" value={t.accent}
              options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
              onChange={(v) => setTweak('accent', v)} />
            <TweakSection label="Table" />
            <TweakRadio label="Row density" value={t.density}
              options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
              onChange={(v) => setTweak('density', v)} />
            <TweakRadio label="Stock display" value={t.stockStyle}
              options={[{ value: 'chip', label: 'Chip' }, { value: 'bar', label: 'Bar' }]}
              onChange={(v) => setTweak('stockStyle', v)} />
          </TweaksPanel>
        </div>
      </PaStage>
    </div>
  );
}

/* overflow menu echoing the reference "⋯" */
function PaMenu({ onClose }) {
  const items = [
    { icon: 'time-outline', label: 'Recently Deleted' },
    { icon: 'cloud-upload-outline', label: 'Upload Photos' },
    { icon: 'cloud-download-outline', label: 'Download Photos' },
    { icon: 'code-slash-outline', label: 'Export to HTML' },
  ];
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 44 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: 48, right: 0, zIndex: 45, width: 220, background: '#fff', border: '1px solid var(--kz-border)', borderRadius: 12, boxShadow: 'var(--kz-shadow-lg)', padding: 6 }}>
        {items.map((it) => (
          <button key={it.label} onClick={() => { onClose(); alert(it.label); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 12px', border: 'none', background: 'transparent', borderRadius: 8, font: '500 14px var(--kz-font-sans)', color: 'var(--kz-ink-2)', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--kz-surface-2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <ion-icon name={it.icon} style={{ fontSize: 18, color: 'var(--kz-muted)' }}></ion-icon>{it.label}
          </button>
        ))}
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
