/* Koomzo Inventory — shell. Mode (lite/full) seeds the capability map; the rail
   only ever renders screens whose capability is on. Same shell language as Retail Flex. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "pro",
  "device": "desktop"
}/*EDITMODE-END*/;

/* Tiering is a capability flag, never a removed route: every screen asks the same
   question of the same map, so nothing goes unverified because it was never rendered.

   One authority at runtime. When the shared service is present it OWNS the answer — the
   rail already trusted it — so setting a tier must write through to it rather than only
   to local state. Two maps that disagree is how Lite stopped being Lite: the screens
   degraded off `caps` while the rail still read KZ and kept every entry. `IV_TIERS` is
   the recipe for a tier; KZ is where the answer lives. */
const capsFor = (tier) => IV_CAPS.reduce((a, c) => ({ ...a, [c.key]: (IV_TIERS[tier] || IV_TIERS.pro).indexOf(c.key) > -1 }), {});
/* our three tiers against the shared service's four */
const KZ_TIER = { lite: 'lite', standard: 'mid', pro: 'full' };
const OUR_TIER = { off: 'lite', lite: 'lite', mid: 'standard', full: 'pro' };
/* on load the shared service wins, because the user may have set the plan in Control
   Centre and this module must not quietly overwrite it. The tweak follows it so the
   chip, the rail and the screens all say the same thing. */
function adopt(tier) {
  const base = capsFor(tier);
  if (window.KZ) window.KZ.mod('inventory').caps.forEach((c) => { base[c.key] = window.KZ.on('inventory', c.key); });
  base.items = true; base.movements = true;
  return base;
}

/* Five entries. The four verbs an operator uses are buttons on Stock, beside the ledger
   they write into — not four separate addresses. Counts, transfers, suppliers and the
   valuation summary all kept their capability; they changed address, not existence. */
const NAV = [
  { id: 'items',   label: 'Items',   icon: 'cube-outline' },
  { id: 'stock',   label: 'Stock',   icon: 'layers-outline' },
  { id: 'orders',  label: 'Orders',  icon: 'receipt-outline',     cap: 'purchase' },
  { id: 'reports', label: 'Reports', icon: 'stats-chart-outline', cap: 'valuation' },
];

/* one router for every action sheet in the module. Views ask for a sheet by name and
   pass only what they know (the order, the supplier); location and capabilities come
   from the shell so no sheet has to guess which location it is acting on. */
function SheetHost({ sheet, loc, caps, onClose, onItem, onPO, onCount }) {
  const k = sheet.kind;
  if (k === 'move') return <MovementSheet kind={sheet.mkind} itemId={sheet.itemId} loc={loc} caps={caps} onClose={onClose} onPosted={sheet.onPosted} />;
  if (k === 'adjust') return <MovementSheet kind="adjust" itemId={sheet.itemId} loc={loc} caps={caps} onClose={onClose} onPosted={sheet.onPosted} />;
  if (k === 'newItem') return <NewItemSheet kind={sheet.itemKind} loc={loc} caps={caps} onClose={onClose} onCreated={onItem} />;
  if (k === 'import') return <ImportSheet loc={loc} caps={caps} onClose={onClose} />;
  if (k === 'receive') return <ReceiveSheet loc={loc} caps={caps} poId={sheet.poId} onClose={onClose} />;
  if (k === 'newOrder') return <NewOrderSheet supplierId={sheet.supplierId} onClose={onClose} onCreated={onPO} />;
  if (k === 'print') return <PrintSheet po={sheet.po} onClose={onClose} />;
  if (k === 'newCount') return <NewCountSheet loc={loc} caps={caps} onClose={onClose} onCreated={onCount} />;
  if (k === 'schedule') return <ScheduleCycleSheet loc={loc} caps={caps} onClose={onClose} />;
  if (k === 'newSupplier') return <NewSupplierSheet onClose={onClose} />;
  if (k === 'newTransfer') return <NewTransferSheet loc={loc} onClose={onClose} onCreated={sheet.onCreated} />;
  if (k === 'printTransfer') return <TransferPrintSheet tr={sheet.tr} onClose={onClose} />;
  if (k === 'email') return <EmailSheet supplier={sheet.supplier} onClose={onClose} />;
  return null;
}

function App() {
  const boot = window.IV_BOOT || {};
  const [t, setTweak] = useTweaks(Object.assign({}, TWEAK_DEFAULTS, boot.tweaks || {}));
  const [caps, setCaps] = useState(() => adopt(t.mode));
  const [view, setView] = useState(boot.view || 'items');
  const [loc, setLoc] = useState('all');
  const [selId, setSelId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [locOpen, setLocOpen] = useState(false);
  /* one subscription: every posted document, receipt, count and adjustment re-renders
     the whole module, so rail badges and overview KPIs can never disagree with the ledger */
  const rev = useIVRev();
  const items = window.IV_ITEMS;
  const open = (kind, extra) => setSheet(Object.assign({ kind: kind }, extra || {}));

  /* write the tier through to the shared service so the rail and the screens cannot
     disagree. KZ's own tier composition differs from ours, so we set the tier for the
     audit trail and then push each capability explicitly — IV_TIERS stays the recipe. */
  const setMode = (m) => {
    const want = capsFor(m);
    setTweak('mode', m);
    setCaps(want);
    setView('items');
    if (window.KZ) {
      window.KZ.setTier('inventory', KZ_TIER[m] || 'full');
      window.KZ.mod('inventory').caps.forEach((c) => window.KZ.setCap('inventory', c.key, !!want[c.key]));
    }
  };
  useEffect(() => {
    if (!window.KZ) return;
    const kz = ((window.KZ.state().modules || {}).inventory || {}).tier;
    const ours = OUR_TIER[kz];
    if (ours && ours !== t.mode) setTweak('mode', ours);
  }, []);
  useEffect(() => { setCaps(adopt(t.mode)); }, [t.mode]);

  /* the rail reads the same map the screens do — a capability KZ does not know about
     falls back to local state instead of hiding an entry the screens still render */
  const nav = NAV.filter((n) => !n.cap || (window.KZ && window.KZ.mod('inventory').caps.some((c) => c.key === n.cap)
    ? window.KZ.on('inventory', n.cap) : caps[n.cap]));
  useEffect(() => { if (view !== 'setup' && !nav.some((n) => n.id === view)) setView(nav[0].id); }, [caps]);
  useEffect(() => { if (!caps.locations && loc === 'all') setLoc('dt'); }, [caps.locations]);

  /* the shared service is the authority for the keys it knows; keys it has never heard
     of keep their local value rather than being silently zeroed — a capability the
     registry does not carry must not vanish the route that depends on it. */
  useEffect(() => window.KZ && window.KZ.subscribe(() => setCaps((prev) => {
    const next = Object.assign({}, prev, { items: true, movements: true });
    window.KZ.mod('inventory').caps.forEach((c) => { next[c.key] = window.KZ.on('inventory', c.key); });
    return next;
  })), []);

  /* rail badges: work waiting today, never a total. Low stock, counts and arrivals all
     surface on Stock now, because that is where the operator goes to clear them. */
  const badges = {
    stock: items.filter((i) => i.stock && ['low', 'out'].indexOf(IV.status(i, loc)) > -1).length +
      (caps.transfers ? (window.IV_TRANSFERS || []).filter((x) => x.status === 'in-transit').length : 0) +
      (caps.counts ? (window.IV_COUNTS || []).filter((c) => c.status === 'open' || c.status === 'review').length : 0),
    orders: (window.IV_POS || []).filter((p) => p.status === 'sent' || p.status === 'partial').length,
  };

  const patch = (id, fn) => window.IVS.tx(() => { const it = window.IV.item(id); Object.assign(it, fn(it)); });
  const openItem = (id) => { setView('items'); setSelId(id); };

  /* the chip reads the effective capability map, not the tweak — anything else lets the
     label disagree with the rail when the plan is changed from Control Centre */
  const effTier = (!caps.purchase && !caps.locations) ? 'lite'
    : (caps.counts || caps.lots || caps.serials || caps.composite) ? 'pro' : 'standard';
  const locName = loc === 'all' ? 'All locations' : IV.loc(loc).name;
  const titles = {
    items: ['Items', items.length + ' in catalogue'],
    stock: ['Stock', locName], orders: ['Orders', 'Purchasing & partners'],
    reports: ['Reports', 'Valuation, margin, loss'],
    setup: ['Setup', 'Plan & capabilities'],
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
              <span className={'modechip' + (effTier === 'pro' ? ' full' : '')}>{effTier}</span>
              <div className="avatar">MR</div>
            </header>

            {view === 'items' && <ItemsView loc={loc} caps={caps} items={items} rev={rev} selId={selId} onSelect={setSelId} onOpen={open} onPatch={patch} />}
            {view === 'stock' && <StockView loc={loc} caps={caps} onOpen={open} />}
            {view === 'orders' && <OrdersView caps={caps} loc={loc} onOpen={open} />}
            {view === 'reports' && <ReportsView loc={loc} caps={caps} onGo={setView} onOpenItem={openItem} />}
            {view === 'setup' && <><ModuleSetup mid="inventory" />
              <div style={{ height: 14 }}></div></>}
            {view === 'setup' && <SetupView caps={caps} mode={effTier} loc={loc}
              onMode={setMode} onCap={(k) => setCaps((c) => ({ ...c, [k]: !c[k] }))} />}
          </div>

          {sheet && <SheetHost sheet={sheet} loc={loc} caps={caps}
            onClose={() => setSheet(null)}
            onItem={(id) => { setView('items'); setSelId(id); }}
            onPO={(id) => { setView('orders'); setSheet(null); }}
            onCount={() => setView('stock')} />}
          <Toasts />

          <TweaksPanel>
            <TweakSection label="Plan" />
            <TweakRadio label="Tier" value={t.mode}
              options={[{ value: 'lite', label: 'Lite' }, { value: 'standard', label: 'Standard' }, { value: 'pro', label: 'Pro' }]}
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
