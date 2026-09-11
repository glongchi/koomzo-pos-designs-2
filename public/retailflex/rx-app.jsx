/* Koomzo Retail POS (Flex) — presets seed an editable feature map.
   The register reads ONLY `cfg`; a preset is just data that writes into it. */
const { useState, useMemo, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "profile": "pharmacy",
  "layout": "right",
  "density": "comfortable",
  "stock": "lite",
  "device": "desktop"
}/*EDITMODE-END*/;

let UID = 1;
const cfgFrom = (p) => ({ entry: p.entry, tiles: p.tiles, picker: p.picker, features: { ...p.features } });

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const preset = window.RX_PROFILES.find((p) => p.id === t.profile) || window.RX_PROFILES[0];
  const [cfg, setCfg] = useState(() => cfgFrom(preset));
  const catalogBase = window.RX_CATALOG[preset.id];

  const [view, setView] = useState('register');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [order, setOrder] = useState([]);
  const [selUid, setSelUid] = useState(null);
  const [flow, setFlow] = useState(null);   // { product, steps, i, data }
  const [sheet, setSheet] = useState(null); // keypad | customer | tender
  const [customer, setCustomer] = useState(null);
  const [held, setHeld] = useState(window.RX_HELD);
  const [orderNo, setOrderNo] = useState(1047);
  const [cartOpen, setCartOpen] = useState(false);
  const kzRead = () => window.KZ
    ? window.KZ.mod('retail').caps.reduce((a, c) => (a[c.key] = window.KZ.on('retail', c.key), a), {})
    : { ...window.RX_FITS.full.mods };
  const [modules, setModulesRaw] = useState(kzRead);
  const setModules = (v) => setModulesRaw(v);
  useEffect(() => window.KZ && window.KZ.subscribe(() => setModulesRaw(kzRead())), []);
  const [extra, setExtra] = useState([]);
  const [biz, setBiz] = useState(preset.id === 'grocery' ? 'grocery' : preset.id === 'fashion' ? 'fashion' : preset.id === 'pharmacy' ? 'pharmacy' : 'general');
  const [bizCats, setBizCats] = useState(null);
  const [glyphMode, setGlyphMode] = useState('glyph');
  const catalog = useMemo(() => extra.length
    ? { cats: catalogBase.cats, items: [...catalogBase.items, ...extra] } : catalogBase, [catalogBase, extra]);
  const [stock, setStock] = useState(() => window.RX_STOCK_SEED(window.RX_CATALOG[preset.id]));
  const stockOn = t.stock !== 'off';

  useEffect(() => { setCfg(cfgFrom(preset)); setCat('all'); setQ(''); setOrder([]); setSelUid(null); setFlow(null); setExtra([]); setBizCats(null); setStock(window.RX_STOCK_SEED(window.RX_CATALOG[preset.id])); }, [preset.id]);
  useEffect(() => { if (modules[view] === false) setView('register'); }, [modules, view]);
  useEffect(() => { if (view === 'inventory' && t.stock === 'off') setView('register'); }, [t.stock, view]);

  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(cfgFrom(preset)), [cfg, preset]);
  const F = cfg.features;

  const products = useMemo(() => catalog.items.filter((p) => {
    const inCat = cat === 'all' || p.cat === cat;
    const inQ = !q || (p.name + ' ' + p.sub + ' ' + p.sku).toLowerCase().includes(q.toLowerCase());
    const visible = !stockOn || !stock[p.id] || stock[p.id].show;
    return inCat && inQ && visible;
  }), [catalog, cat, q, stock, stockOn]);

  const qtyFor = (id) => order.filter((o) => o.id === id).reduce((s, o) => s + o.qty, 0);

  /* ---- the step chain: fixed order, subset enabled by cfg.features ---- */
  const stepsFor = (p, scanned) => STEP_ORDER.filter((k) => {
    if (!F[k]) return false;
    if (k === 'age') return !!p.age;
    if (k === 'rx') return !!p.rx;
    if (k === 'variants') return !!p.axes && cfg.picker !== 'none' && !scanned;
    if (k === 'lot') return !!p.lot;
    if (k === 'serial') return !!p.serial;
    if (k === 'scale') return !!p.weighed;
    if (k === 'modifiers') return !!p.mods;
    return false;
  });

  const commit = (p, d) => {
    const uid = 'u' + UID++;
    const price = (d.price != null ? d.price : p.price) + (d.modAdd || 0);
    setOrder((cur) => {
      const plain = !d.variant && !d.serial && !d.weighed && !d.lot && !(d.mods && d.mods.length);
      const ex = plain && cur.find((o) => o.id === p.id && !o.variant && !o.serial && !o.weighed && !o.lot);
      if (ex) { setSelUid(ex.uid); return cur.map((o) => o.uid === ex.uid ? { ...o, qty: o.qty + 1 } : o); }
      setSelUid(uid);
      return [...cur, { uid, id: p.id, name: p.name, price, qty: d.weighed || 1, disc: 0, unit: p.unit,
        variant: d.variant, serial: d.serial, weighed: !!d.weighed, lot: d.lot, rx: d.rx,
        mods: d.mods && d.mods.length ? d.mods.join(' + ') : null }];
    });
    setFlow(null);
  };

  const advance = (fl, patch) => {
    const data = { ...fl.data, ...patch };
    const i = fl.i + 1;
    if (i >= fl.steps.length) return commit(fl.product, data);
    setFlow({ ...fl, i, data });
  };

  const addItem = (p, scanned) => {
    const steps = stepsFor(p, scanned);
    if (!steps.length) return commit(p, {});
    setFlow({ product: p, steps, i: 0, data: {} });
  };

  const changeQty = (uid, d) => setOrder((cur) => cur.flatMap((o) =>
    o.uid !== uid ? [o] : (o.qty + d <= 0 ? [] : [{ ...o, qty: o.qty + d }])));

  const totals = useMemo(() => {
    const gross = order.reduce((s, o) => s + o.price * o.qty, 0);
    const net = order.reduce((s, o) => s + o.price * o.qty * (1 - o.disc / 100), 0);
    const tax = +(net * preset.tax).toFixed(2);
    return { gross, net, discount: +(gross - net).toFixed(2), tax, total: +(net + tax).toFixed(2) };
  }, [order, preset]);

  const count = order.reduce((s, o) => s + (o.weighed ? 1 : o.qty), 0);
  const reset = () => { setOrder([]); setSelUid(null); setCustomer(null); setCartOpen(false); setOrderNo((n) => n + 1); };

  const holdTicket = () => {
    if (!order.length) return;
    setHeld((h) => [{ id: 'h' + Date.now(), label: 'Ticket #' + orderNo, who: customer ? customer.name : 'Walk-in',
      items: count, total: totals.total, at: 'just now', note: 'On hold' }, ...h]);
    reset(); setView('tickets');
  };

  const onSubmitEntry = () => {
    const hit = catalog.items.find((p) => p.sku.toLowerCase() === q.toLowerCase().trim());
    if (hit) { addItem(hit, true); setQ(''); return; }          // a scan resolves the variant
    if (products.length === 1) { addItem(products[0]); setQ(''); }
  };

  const selLine = order.find((o) => o.uid === selUid);
  const firstWith = (k) => catalog.items.find((p) => p[k]);
  const quickAction = (label) => {
    if (/weigh|tare/i.test(label)) { const w = firstWith('weighed'); if (w) return addItem(w); }
    if (/exchange|return/i.test(label)) return setView('returns');
    if (/hold/i.test(label)) return holdTicket();
    if (/serial/i.test(label)) { const e = firstWith('serial'); if (e) return addItem(e); }
    if (/rx|substitute/i.test(label)) { const r = firstWith('rx'); if (r) return addItem(r); }
    if (/batch/i.test(label)) { const l = firstWith('lot'); if (l) return addItem(l); }
    if (/booking|stylist/i.test(label)) return setView('customers');
    if (selLine) setSheet({ kind: 'keypad' });
  };

  const drawer = t.layout === 'drawer';
  const cartCls = 'cart' + (drawer ? ' aside' : '') + (cartOpen ? ' open' : '');
  const titles = {
    register: ['Register', preset.name + (dirty ? ' · modified' : '')],
    tickets: ['Open tickets', held.length + ' on hold'],
    sales: ['Sales', 'Transaction history'],
    categories: ['Categories', 'Catalogue structure & tiles'],
    inventory: ['Stock', t.stock === 'off' ? 'Not enabled' : 'On hand at Caisse 1'],
    returns: ['Returns & exchange', 'Receipt lookup'], customers: ['Customers', 'Loyalty members'],
    shift: ['Shift & cash drawer', 'Caisse 1 · Anita Ndongo'], setup: ['Setup', 'Profile & capabilities'],
  };
  const stepMeta = flow ? { all: flow.steps.map((k) => STEP_LABEL[k]), now: STEP_LABEL[flow.steps[flow.i]] } : null;
  const cur = flow ? flow.steps[flow.i] : null;

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap">
      <div className={'rt' + (t.density === 'compact' ? ' compact' : '')}>
        <Rail view={view} onView={setView} held={held.length}
          modules={{ ...modules, inventory: t.stock !== 'off' }} />
        <div className="main">
          <TopBar profile={preset} modified={dirty} title={titles[view][0]} sub={titles[view][1]} onProfile={() => setView('setup')} />

          {view === 'register' && (
            <div className={'board' + (drawer ? ' drawer' : '')}>
              <section className="cat">
                {cfg.entry !== 'grid' && (
                  <EntryBar mode={cfg.entry} value={q} onValue={setQ} onSubmit={onSubmitEntry}
                    showWeigh={F.scale}
                    onWeigh={() => { const w = firstWith('weighed'); if (w) addItem(w); }}
                    onKeypad={() => selLine ? setSheet({ kind: 'keypad' }) : null} />
                )}
                <Cats cats={catalog.cats} active={cat} onCat={setCat} />
                <div className="scroll">
                  <CatalogGrid products={products} style={cfg.tiles} qtyFor={qtyFor} onAdd={(p) => addItem(p)}
                    stock={stockOn ? stock : null}
                    heading={cat === 'all' ? (cfg.entry === 'scan' ? 'Quick keys' : 'All products') : catalog.cats.find((c) => c.id === cat).label} />
                </div>
              </section>
              {(!drawer || cartOpen) && <Cart cls={cartCls} orderNo={orderNo} items={order} customer={customer}
                totals={totals} profile={preset} features={F} modules={modules} selUid={selUid}
                onSelect={(uid) => { setSelUid(uid); setSheet({ kind: 'keypad' }); }}
                onQty={changeQty} onClear={reset} onHold={holdTicket}
                onCustomer={() => setSheet({ kind: 'customer' })} onQuick={quickAction}
                onPay={() => setSheet({ kind: 'tender' })}
                onClose={drawer || cartOpen ? () => setCartOpen(false) : null} />}
              {!cartOpen && <DockBar total={totals.total} count={count} onOpen={() => setCartOpen(true)} />}
            </div>
          )}

          {view === 'setup' && <SetupView profileId={preset.id} cfg={cfg} preset={preset} dirty={dirty}
            modules={modules} onModule={(k) => {
              if (window.KZ) { window.KZ.setCap('retail', k, !modules[k]); setModulesRaw(kzRead()); }
              else setModulesRaw((m) => ({ ...m, [k]: !m[k] }));
            }}
            onFit={(k) => {
              const mods = window.RX_FITS[k].mods;
              if (window.KZ) { Object.keys(mods).forEach((x) => window.KZ.setCap('retail', x, mods[x])); setModulesRaw(kzRead()); }
              else setModulesRaw({ ...mods });
            }}
            stockMode={t.stock} onStockMode={(v) => setTweak('stock', v)}
            onPreset={(id) => setTweak('profile', id)}
            onToggle={(k) => setCfg((c) => ({ ...c, features: { ...c.features, [k]: !c.features[k] } }))}
            onSet={(k, v) => setCfg((c) => ({ ...c, [k]: v }))}
            onReset={() => setCfg(cfgFrom(preset))} />}
          {view === 'tickets' && <TicketsView held={held} onResume={(tk) => { setHeld((h) => h.filter((x) => x.id !== tk.id)); setView('register'); }} />}
          {view === 'returns' && <ReturnsView />}
          {view === 'sales' && <SalesView onRefund={() => setView('returns')} onCustomer={() => setView('customers')} />}
          {view === 'customers' && <CustomersView onPick={(c) => { setCustomer(c); setView('register'); }} />}
          {view === 'shift' && <ShiftView />}
          {view === 'inventory' && <InventoryView profile={preset} catalog={catalog} stock={stock} onStock={setStock}
            mode={t.stock} onMode={(v) => setTweak('stock', v)}
            onCreate={(p, s) => { setExtra((x) => [...x, p]); setStock((m) => ({ ...m, [p.id]: s })); }}
            onCats={modules.categories !== false ? () => setView('categories') : null} />}
          {view === 'categories' && <CategoriesView biz={biz} cats={bizCats || window.BIZ(biz).cats}
            tiles={cfg.tiles} glyphMode={glyphMode}
            onBiz={setBiz} onCats={setBizCats} onTiles={(v) => setCfg((c) => ({ ...c, tiles: v }))} onGlyphMode={setGlyphMode} />}
        </div>

        {/* ---- step chain ---- */}
        {cur === 'age' && <AgeSheet product={flow.product} step={stepMeta} onClose={() => setFlow(null)}
          onConfirm={() => advance(flow, { ageOk: true })} />}
        {cur === 'rx' && <RxSheet product={flow.product} step={stepMeta} onClose={() => setFlow(null)}
          onAdd={(rx) => advance(flow, { rx })} />}
        {cur === 'variants' && <VariantSheet product={flow.product} picker={cfg.picker} step={stepMeta} last={flow.i === flow.steps.length - 1}
          onClose={() => setFlow(null)} onAdd={(p, variant, price) => advance(flow, { variant, price })} />}
        {cur === 'lot' && <LotSheet product={flow.product} step={stepMeta} onClose={() => setFlow(null)}
          onAdd={(l) => advance(flow, { lot: l.lot })} />}
        {cur === 'serial' && <SerialSheet product={flow.product} step={stepMeta} onClose={() => setFlow(null)}
          onAdd={(serial) => advance(flow, { serial })} />}
        {cur === 'scale' && <ScaleSheet product={flow.product} step={stepMeta} last={flow.i === flow.steps.length - 1} onClose={() => setFlow(null)}
          onAdd={(kg) => advance(flow, { weighed: kg })} />}
        {cur === 'modifiers' && <ModifierSheet product={flow.product} step={stepMeta} last={flow.i === flow.steps.length - 1} onClose={() => setFlow(null)}
          onAdd={(mods, modAdd) => advance(flow, { mods, modAdd })} />}

        {sheet && sheet.kind === 'keypad' && selLine && <KeypadSheet line={selLine} onClose={() => setSheet(null)}
          onApply={(mode, val) => {
            setOrder((c) => c.map((o) => o.uid !== selUid ? o
              : mode === 'qty' ? { ...o, qty: val } : mode === 'price' ? { ...o, price: val } : { ...o, disc: Math.min(100, val) }));
            setSheet(null);
          }} />}
        {sheet && sheet.kind === 'customer' && <CustomerSheet onClose={() => setSheet(null)}
          onPick={(c) => { setCustomer(c); setSheet(null); }} />}
        {sheet && sheet.kind === 'tender' && <TenderSheet total={totals.total} onClose={() => setSheet(null)}
          onDone={() => { setSheet(null); reset(); }} />}

        <TweaksPanel>
          <TweakSection label="Business profile" />
          <TweakSelect label="Preset" value={t.profile}
            options={window.RX_PROFILES.map((p) => ({ value: p.id, label: p.name }))}
            onChange={(v) => setTweak('profile', v)} />
          <TweakSection label="Register layout" />
          <TweakRadio label="Cart" value={t.layout}
            options={[{ value: 'right', label: 'Cart right' }, { value: 'drawer', label: 'Cart drawer' }]}
            onChange={(v) => setTweak('layout', v)} />
          <TweakRadio label="Density" value={t.density}
            options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
            onChange={(v) => setTweak('density', v)} />
          <TweakSection label="Inventory" />
          <TweakRadio label="Stock control" value={t.stock}
            options={[{ value: 'off', label: 'Off' }, { value: 'lite', label: 'Lite' }, { value: 'full', label: 'Full' }]}
            onChange={(v) => setTweak('stock', v)} />
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
