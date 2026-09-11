/* Koomzo Retail POS — flexible register: state, profile presets, composition */
const { useState, useMemo, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "profile": "grocery",
  "layout": "right",
  "density": "comfortable",
  "entry": "auto",
  "tiles": "auto",
  "device": "desktop"
}/*EDITMODE-END*/;

let UID = 1;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const profile = window.RT_PROFILES.find((p) => p.id === t.profile) || window.RT_PROFILES[0];
  const catalog = window.RT_CATALOG[profile.id];

  const [view, setView] = useState('register');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [order, setOrder] = useState([]);
  const [selUid, setSelUid] = useState(null);
  const [sheet, setSheet] = useState(null);          // {kind, product}
  const [customer, setCustomer] = useState(null);
  const [held, setHeld] = useState(window.RT_HELD);
  const [orderNo, setOrderNo] = useState(1047);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => { setCat('all'); setQ(''); setOrder([]); setSelUid(null); }, [profile.id]);

  const entry = t.entry === 'auto' ? profile.entry : t.entry;
  const tiles = t.tiles === 'auto' ? profile.tiles : t.tiles;

  const products = useMemo(() => catalog.items.filter((p) => {
    const inCat = cat === 'all' || p.cat === cat;
    const inQ = !q || (p.name + ' ' + p.sub + ' ' + p.sku).toLowerCase().includes(q.toLowerCase());
    return inCat && inQ;
  }), [catalog, cat, q]);

  const qtyFor = (id) => order.filter((o) => o.id === id).reduce((s, o) => s + o.qty, 0);

  /* ---- add flow: profile modules decide which step a product needs ---- */
  const push = (p, extra = {}) => {
    const uid = 'u' + UID++;
    setOrder((cur) => {
      const key = extra.variant || extra.serial || extra.weighed ? null : p.id;
      const ex = key && cur.find((o) => o.id === key && !o.variant && !o.serial && !o.weighed);
      if (ex) { setSelUid(ex.uid); return cur.map((o) => o.uid === ex.uid ? { ...o, qty: o.qty + 1 } : o); }
      setSelUid(uid);
      return [...cur, { uid, id: p.id, name: p.name, price: p.price, qty: 1, disc: 0, unit: p.unit, ...extra }];
    });
    setSheet(null);
  };

  const addItem = (p) => {
    if (p.age && profile.mods.age) return setSheet({ kind: 'age', product: p });
    if (p.weighed && profile.mods.scale) return setSheet({ kind: 'scale', product: p });
    if (p.variants && profile.mods.variants) return setSheet({ kind: 'variant', product: p });
    if (p.serial && profile.mods.serial) return setSheet({ kind: 'serial', product: p });
    push(p);
  };

  const changeQty = (uid, d) => setOrder((cur) => cur.flatMap((o) =>
    o.uid !== uid ? [o] : (o.qty + d <= 0 ? [] : [{ ...o, qty: o.qty + d }])));

  const totals = useMemo(() => {
    const gross = order.reduce((s, o) => s + o.price * o.qty, 0);
    const net = order.reduce((s, o) => s + o.price * o.qty * (1 - o.disc / 100), 0);
    const tax = +(net * profile.tax).toFixed(2);
    return { gross, net, discount: +(gross - net).toFixed(2), tax, total: +(net + tax).toFixed(2) };
  }, [order, profile]);

  const count = order.reduce((s, o) => s + (o.weighed ? 1 : o.qty), 0);
  const reset = () => { setOrder([]); setSelUid(null); setCustomer(null); setCartOpen(false); setOrderNo((n) => n + 1); };

  const holdTicket = () => {
    if (!order.length) return;
    setHeld((h) => [{ id: 'h' + Date.now(), label: 'Ticket #' + orderNo, who: customer ? customer.name : 'Walk-in', items: count, total: totals.total, at: 'just now', note: 'On hold' }, ...h]);
    reset();
    setView('tickets');
  };

  const onSubmitEntry = () => {
    const hit = catalog.items.find((p) => p.sku.toLowerCase() === q.toLowerCase().trim())
      || (products.length === 1 ? products[0] : null);
    if (hit) { addItem(hit); setQ(''); }
  };

  const selLine = order.find((o) => o.uid === selUid);
  const quickAction = (label) => {
    if (/weigh/i.test(label)) { const w = catalog.items.find((p) => p.weighed); if (w) setSheet({ kind: 'scale', product: w }); return; }
    if (/exchange|return/i.test(label)) return setView('returns');
    if (/hold/i.test(label)) return holdTicket();
    if (/serial/i.test(label)) { const e = catalog.items.find((p) => p.serial); if (e) setSheet({ kind: 'serial', product: e }); return; }
    if (selLine) setSheet({ kind: 'keypad' });
  };

  const drawer = t.layout === 'drawer';
  const cartCls = 'cart' + (drawer ? ' aside' : '') + (cartOpen ? ' open' : '');

  const cartEl = (
    <Cart cls={cartCls} orderNo={orderNo} items={order} customer={customer} totals={totals} profile={profile}
      selUid={selUid} onSelect={(uid) => { setSelUid(uid); setSheet({ kind: 'keypad' }); }}
      onQty={changeQty} onClear={reset} onHold={holdTicket}
      onCustomer={() => setSheet({ kind: 'customer' })} onQuick={quickAction}
      onPay={() => setSheet({ kind: 'tender' })}
      onClose={drawer || cartOpen ? () => setCartOpen(false) : null} />
  );

  const titles = {
    register: ['Register', profile.name], tickets: ['Open tickets', held.length + ' on hold'],
    returns: ['Returns & exchange', 'Receipt lookup'], customers: ['Customers', 'Loyalty members'],
    shift: ['Shift & cash drawer', 'Lane 1 · Anita Ndongo'], setup: ['Setup', 'Business profile'],
  };

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap">
      <div className={'rt' + (t.density === 'compact' ? ' compact' : '')}>
        <Rail view={view} onView={setView} held={held.length} />
        <div className="main">
          <TopBar profile={profile} title={titles[view][0]} sub={titles[view][1]} onProfile={() => setView('setup')} />

          {view === 'register' && (
            <div className={'board' + (drawer ? ' drawer' : '')}>
              <section className="cat">
                {entry !== 'grid' && (
                  <EntryBar mode={entry} value={q} onValue={setQ} onSubmit={onSubmitEntry}
                    showWeigh={profile.mods.scale}
                    onWeigh={() => { const w = catalog.items.find((p) => p.weighed); if (w) setSheet({ kind: 'scale', product: w }); }}
                    onKeypad={() => selLine ? setSheet({ kind: 'keypad' }) : null} />
                )}
                <Cats cats={catalog.cats} active={cat} onCat={setCat} />
                <div className="scroll">
                  <CatalogGrid products={products} style={tiles} qtyFor={qtyFor} onAdd={addItem}
                    heading={cat === 'all' ? (entry === 'scan' ? 'Quick keys' : 'All products') : catalog.cats.find((c) => c.id === cat).label} />
                </div>
              </section>
              {(!drawer || cartOpen) && cartEl}
              {!cartOpen && <DockBar total={totals.total} count={count} onOpen={() => setCartOpen(true)} />}
            </div>
          )}

          {view === 'setup' && <SetupView current={profile.id} onPick={(id) => { setTweak('profile', id); setView('register'); }} />}
          {view === 'tickets' && <TicketsView held={held} onResume={(tk) => { setHeld((h) => h.filter((x) => x.id !== tk.id)); setView('register'); }} />}
          {view === 'returns' && <ReturnsView />}
          {view === 'customers' && <CustomersView onPick={(c) => { setCustomer(c); setView('register'); }} />}
          {view === 'shift' && <ShiftView />}
        </div>

        {sheet && sheet.kind === 'variant' && <VariantSheet product={sheet.product} onClose={() => setSheet(null)}
          onAdd={(p, variant) => push(p, { variant })} />}
        {sheet && sheet.kind === 'scale' && <ScaleSheet product={sheet.product} onClose={() => setSheet(null)}
          onAdd={(p, kg) => push(p, { weighed: true, qty: kg, unit: p.unit || 'kg' })} />}
        {sheet && sheet.kind === 'serial' && <SerialSheet product={sheet.product} onClose={() => setSheet(null)}
          onAdd={(p, sn) => push(p, { serial: sn })} />}
        {sheet && sheet.kind === 'age' && <AgeSheet product={sheet.product} onClose={() => setSheet(null)}
          onConfirm={() => push(sheet.product)} />}
        {sheet && sheet.kind === 'keypad' && selLine && <KeypadSheet line={selLine} onClose={() => setSheet(null)}
          onApply={(mode, val) => {
            setOrder((cur) => cur.map((o) => o.uid !== selUid ? o
              : mode === 'qty' ? { ...o, qty: val } : mode === 'price' ? { ...o, price: val } : { ...o, disc: Math.min(100, val) }));
            setSheet(null);
          }} />}
        {sheet && sheet.kind === 'customer' && <CustomerSheet onClose={() => setSheet(null)}
          onPick={(c) => { setCustomer(c); setSheet(null); }} />}
        {sheet && sheet.kind === 'tender' && <TenderSheet total={totals.total} onClose={() => setSheet(null)}
          onDone={() => { setSheet(null); reset(); }} />}

        <TweaksPanel>
          <TweakSection label="Business profile" />
          <TweakSelect label="Profile" value={t.profile}
            options={window.RT_PROFILES.map((p) => ({ value: p.id, label: p.name }))}
            onChange={(v) => setTweak('profile', v)} />
          <TweakSection label="Register layout" />
          <TweakRadio label="Cart" value={t.layout}
            options={[{ value: 'right', label: 'Cart right' }, { value: 'drawer', label: 'Cart drawer' }]}
            onChange={(v) => setTweak('layout', v)} />
          <TweakRadio label="Density" value={t.density}
            options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
            onChange={(v) => setTweak('density', v)} />
          <TweakSection label="Item entry" />
          <TweakSelect label="Entry mode" value={t.entry}
            options={[{ value: 'auto', label: 'Auto (from profile)' }, { value: 'scan', label: 'Scan-first' }, { value: 'grid', label: 'Grid-first' }, { value: 'search', label: 'Search-first' }]}
            onChange={(v) => setTweak('entry', v)} />
          <TweakSelect label="Tile style" value={t.tiles}
            options={[{ value: 'auto', label: 'Auto (from profile)' }, { value: 'image', label: 'Image tiles' }, { value: 'text', label: 'Text keys' }, { value: 'list', label: 'List rows' }]}
            onChange={(v) => setTweak('tiles', v)} />
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
