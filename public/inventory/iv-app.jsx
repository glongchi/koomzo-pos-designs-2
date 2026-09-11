/* Koomzo Inventory — shell. Mode (lite/full) seeds the capability map; the rail
   only ever renders screens whose capability is on. Same shell language as Retail Flex. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "full",
  "device": "desktop"
}/*EDITMODE-END*/;

const CAPS_FULL = IV_CAPS.reduce((a, c) => ({ ...a, [c.key]: true }), {});
const CAPS_LITE = IV_CAPS.reduce((a, c) => ({ ...a, [c.key]: IV_LITE.includes(c.key) }), {});

const NAV = [
  { id: 'overview',  label: 'Overview',  icon: 'speedometer-outline', cap: 'valuation' },
  { id: 'items',     label: 'Items',     icon: 'cube-outline' },
  { id: 'stock',     label: 'Stock',     icon: 'layers-outline' },
  { id: 'purchase',  label: 'Buy',       icon: 'receipt-outline',     cap: 'purchase' },
  { id: 'counts',    label: 'Counts',    icon: 'clipboard-outline',   cap: 'counts' },
  { id: 'transfers', label: 'Move',      icon: 'git-compare-outline', cap: 'transfers' },
  { id: 'reports',   label: 'Reports',   icon: 'stats-chart-outline', cap: 'valuation' },
  { id: 'suppliers', label: 'Vendors',   icon: 'people-circle-outline', cap: 'suppliers' },
];

function App() {
  const boot = window.IV_BOOT || {};
  const [t, setTweak] = useTweaks(Object.assign({}, TWEAK_DEFAULTS, boot.tweaks || {}));
  const [caps, setCaps] = useState(() => ({ ...(t.mode === 'lite' ? CAPS_LITE : CAPS_FULL) }));
  const [view, setView] = useState(boot.view || (t.mode === 'lite' ? 'items' : 'overview'));
  const [loc, setLoc] = useState('all');
  const [items, setItems] = useState(IV_ITEMS);
  const [selId, setSelId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [locOpen, setLocOpen] = useState(false);

  const setMode = (m) => { setTweak('mode', m); setCaps({ ...(m === 'lite' ? CAPS_LITE : CAPS_FULL) }); setView(m === 'lite' ? 'items' : 'overview'); };
  useEffect(() => { setCaps({ ...(t.mode === 'lite' ? CAPS_LITE : CAPS_FULL) }); }, [t.mode]);

  /* shared capability service wins when present; local caps are the fallback */
  const nav = NAV.filter((n) => !n.cap || (window.KZ ? window.KZ.on('inventory', n.cap) : caps[n.cap]));
  useEffect(() => { if (view !== 'setup' && !nav.some((n) => n.id === view)) setView(nav[0].id); }, [caps]);
  useEffect(() => { if (!caps.locations && loc === 'all') setLoc('dt'); }, [caps.locations]);

  useEffect(() => window.KZ && window.KZ.subscribe(() => setCaps(
    window.KZ.mod('inventory').caps.reduce((a, c) => (a[c.key] = window.KZ.on('inventory', c.key), a), { items: true, movements: true })
  )), []);

  /* rail badges: work waiting today, never a total. Low stock to order, orders to
     receive, counts to post, transfers to accept. */
  const badges = {
    stock: items.filter((i) => i.stock && ['low', 'out'].indexOf(IV.status(i, loc)) > -1).length,
    purchase: (window.IV_POS || []).filter((p) => p.status === 'sent' || p.status === 'partial').length,
    counts: (window.IV_COUNTS || []).filter((c) => c.status === 'open' || c.status === 'review').length,
    transfers: (window.IV_TRANSFERS || []).filter((x) => x.status === 'in-transit').length,
  };

  const patch = (id, fn) => setItems((cur) => cur.map((i) => i.id === id ? { ...i, ...fn(i) } : i));
  const openItem = (id) => { setView('items'); setSelId(id); };

  const locName = loc === 'all' ? 'All locations' : IV.loc(loc).name;
  const titles = {
    overview: ['Inventory', locName], items: ['Items', items.length + ' in catalogue'],
    stock: ['Stock', locName], purchase: ['Purchases', 'Orders & receiving'],
    counts: ['Counts', 'Cycle & full'], transfers: ['Transfers', 'Between locations'],
    reports: ['Reports', 'Valuation, margin, loss'], suppliers: ['Suppliers', IV_SUPPLIERS.length + ' vendors'],
    setup: ['Setup', 'Mode & capabilities'],
  };

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap">
        <div className="rt">
          <nav className="rail">
            <div className="rail__mark"><ion-icon name="cube"></ion-icon></div>
            {nav.map((n) => (
              <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => { setView(n.id); setLocOpen(false); }}>
                <ion-icon name={n.icon}></ion-icon><span>{n.label}</span>
                {badges[n.id] > 0 && <em className="dot">{badges[n.id] > 99 ? '99+' : badges[n.id]}</em>}
              </button>
            ))}
            <div className="rail__sp"></div>
            <button className={view === 'setup' ? 'on' : ''} onClick={() => setView('setup')}>
              <ion-icon name="options-outline"></ion-icon><span>Setup</span>
            </button>
          </nav>

          <div className="main">
            <header className="top">
              <div className="top__title">{titles[view][0]}<small>{titles[view][1]}</small></div>
              <div className="top__sp"></div>
              {caps.locations && (
                <div style={{ position: 'relative' }}>
                  <button className="locsw" onClick={() => setLocOpen((o) => !o)}>
                    <ion-icon name="business-outline"></ion-icon>
                    <span className="lname">{loc === 'all' ? 'All locations' : IV.loc(loc).name}</span>
                    <span className="cv">{loc === 'all' ? 'ALL' : IV.loc(loc).code}</span>
                    <ion-icon name="chevron-down-outline" style={{ fontSize: 14, color: 'var(--kz-muted-3)' }}></ion-icon>
                  </button>
                  {locOpen && (
                    <div className="card" style={{ position: 'absolute', top: 40, right: 0, zIndex: 60, padding: 0, width: 232, boxShadow: 'var(--kz-shadow-lg)' }}>
                      {[{ id: 'all', name: 'All locations', kind: 'Roll-up', icon: 'albums-outline' }, ...IV_LOCATIONS].map((l) => (
                        <button className={'doc' + (loc === l.id ? ' on' : '')} key={l.id} style={{ padding: '10px 12px' }}
                          onClick={() => { setLoc(l.id); setLocOpen(false); }}>
                          <div className="op-ic" style={{ width: 28, height: 28 }}><ion-icon name={l.icon}></ion-icon></div>
                          <div><div className="doc__no" style={{ fontFamily: 'var(--kz-font-sans)', fontSize: 13 }}>{l.name}</div>
                            <div className="doc__m">{l.kind}</div></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <span className={'modechip' + (t.mode === 'full' ? ' full' : '')}>{t.mode}</span>
              <div className="avatar">MR</div>
            </header>

            {view === 'overview' && <Overview loc={loc} caps={caps} onGo={setView} onOpenItem={openItem} />}
            {view === 'items' && <ItemsView loc={loc} caps={caps} items={items} selId={selId} onSelect={setSelId} onPatch={patch} />}
            {view === 'stock' && <StockView loc={loc} caps={caps} onAdjust={() => setSheet('adjust')} />}
            {view === 'purchase' && <PurchaseView caps={caps} />}
            {view === 'counts' && <CountsView loc={loc} />}
            {view === 'transfers' && <TransfersView />}
            {view === 'reports' && <ReportsView loc={loc} />}
            {view === 'suppliers' && <SuppliersView />}
            {view === 'setup' && <><ModuleSetup mid="inventory" />
              <div style={{ height: 14 }}></div></>}
            {view === 'setup' && <SetupView caps={caps} mode={t.mode} loc={loc}
              onMode={setMode} onCap={(k) => setCaps((c) => ({ ...c, [k]: !c[k] }))} />}
          </div>

          {sheet === 'adjust' && <AdjustSheet loc={loc} onClose={() => setSheet(null)} />}

          <TweaksPanel>
            <TweakSection label="Module" />
            <TweakRadio label="Mode" value={t.mode}
              options={[{ value: 'lite', label: 'Lite' }, { value: 'full', label: 'Full' }]}
              onChange={setMode} />
            <TweakSection label="Preview" />
            <TweakRadio label="Device" value={t.device}
              options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]}
              onChange={(v) => setTweak('device', v)} />
          </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
