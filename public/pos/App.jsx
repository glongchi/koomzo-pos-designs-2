/* Koomzo POS — app state, live numpad logic, composition */
const { useState, useMemo, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tileStyle": "image",
  "payColor": "#6a61bf",
  "showLoyalty": true
}/*EDITMODE-END*/;

const TAX_RATE = 0.1925;
const LOYALTY_BASE = 3203.0;
let UID = 1;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState([]);          // [{ uid, id, name, price, priceOverride, qty, discPct, unit, icon, tint }]
  const [selectedUid, setSelectedUid] = useState(null);
  const [mode, setMode] = useState('qty');          // 'qty' | 'disc' | 'price'
  const [buffer, setBuffer] = useState(null);       // string while editing, null = show stored value
  const [charging, setCharging] = useState(false);
  const [orderNo, setOrderNo] = useState(1042);
  const [panelOpen, setPanelOpen] = useState(false);

  /* ---- catalog filtering ---- */
  const products = useMemo(() => window.KZ_PRODUCTS.filter((p) => {
    const inCat = cat === 'all' || p.cat === cat;
    const inQuery = !query || (p.name + ' ' + p.desc).toLowerCase().includes(query.toLowerCase());
    return inCat && inQuery;
  }), [cat, query]);

  const category = cat === 'all' ? null : window.KZ_CATEGORIES.find((c) => c.id === cat);
  const qtyFor = (id) => order.filter((o) => o.id === id).reduce((s, o) => s + o.qty, 0);

  /* ---- add / select ---- */
  const addItem = (p) => {
    setOrder((cur) => {
      const ex = cur.find((o) => o.id === p.id);
      if (ex) { setSelectedUid(ex.uid); return cur.map((o) => o.id === p.id ? { ...o, qty: o.qty + 1 } : o); }
      const uid = 'u' + (UID++);
      setSelectedUid(uid);
      return [...cur, { uid, id: p.id, name: p.name, price: p.price, priceOverride: null, qty: 1, discPct: 0, unit: p.unit, icon: p.icon, tint: p.tint }];
    });
    setMode('qty');
    setBuffer(null);
    setPanelOpen(true);
  };

  const selectLine = (uid) => { setSelectedUid(uid); setBuffer(null); };
  const changeMode = (m) => { setMode(m); setBuffer(null); };

  /* ---- live numpad: edits the SELECTED line in the current mode ---- */
  const onKey = (k) => {
    if (!selectedUid) return;
    const line = order.find((o) => o.uid === selectedUid);
    if (!line) return;
    const stored = mode === 'qty' ? qtyStr(line.qty)
      : mode === 'disc' ? String(line.discPct)
      : String(line.priceOverride != null ? line.priceOverride : line.price);

    let buf;
    if (k === 'back') {
      buf = (buffer === null ? stored : buffer).slice(0, -1);
    } else if (k === '+/-') {
      const b = buffer === null ? stored : buffer;
      buf = b.startsWith('-') ? b.slice(1) : '-' + b;
    } else if (k === '.') {
      const b = buffer === null ? '0' : buffer;
      buf = b.includes('.') ? b : b + '.';
    } else { // digit — fresh edit replaces stored value
      buf = (buffer === null ? '' : buffer) + k;
    }
    setBuffer(buf);

    const num = parseFloat(buf);
    const safe = isNaN(num) ? 0 : num;
    setOrder((cur) => cur.map((o) => {
      if (o.uid !== selectedUid) return o;
      if (mode === 'qty') return { ...o, qty: safe };
      if (mode === 'disc') return { ...o, discPct: Math.max(0, Math.min(100, safe)) };
      return { ...o, priceOverride: safe };
    }));
  };

  /* ---- physical keyboard support ---- */
  useEffect(() => {
    const h = (e) => {
      if (charging) return;
      if (/^[0-9]$/.test(e.key)) onKey(e.key);
      else if (e.key === '.') onKey('.');
      else if (e.key === 'Backspace') { if (selectedUid) { e.preventDefault(); onKey('back'); } }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  /* ---- totals ---- */
  const totals = useMemo(() => {
    const net = order.reduce((s, o) => {
      const unit = o.priceOverride != null ? o.priceOverride : o.price;
      return s + unit * o.qty * (1 - o.discPct / 100);
    }, 0);
    const tax = Math.round(net * TAX_RATE);
    const total = net + tax;
    return { net, tax, total };
  }, [order]);

  const itemCount = order.reduce((s, o) => s + o.qty, 0);
  const won = totals.total;
  const finishOrder = () => { setCharging(false); setOrder([]); setSelectedUid(null); setBuffer(null); setOrderNo((n) => n + 1); setPanelOpen(false); };

  return (
    <div className="pos">
      <div className="pos__head"><TopBar orderNo={orderNo} cashier="Anita Ndongo" /></div>

      <div className={'pos__order' + (panelOpen ? ' open' : '')}>
        <div className="order">
          <button className="order__back" onClick={() => setPanelOpen(false)}>
            <ion-icon name="chevron-down-outline"></ion-icon>Back to products
          </button>
          <Ticket items={order} selectedUid={selectedUid} buffer={buffer} mode={mode} onSelect={selectLine} />
          <Totals total={totals.total} tax={totals.tax} />
          {t.showLoyalty && <Loyalty won={won} newTotal={LOYALTY_BASE + won} />}
          <Actions
            onReward={() => alert('Rewards — apply a loyalty reward to this order.')}
            onDiscount={() => { if (selectedUid) changeMode('disc'); else alert('Select an order line first, then enter a % discount on the numpad.'); }}
            onRefund={() => alert('Refund mode — scan or select items to return.')}
          />
          <Cashpad
            customer="Anita Ndongo"
            mode={mode}
            onMode={changeMode}
            onKey={onKey}
            total={totals.total}
            canPay={order.length > 0}
            onPay={() => setCharging(true)}
            payColor={t.payColor}
          />
        </div>
      </div>

      <div className="pos__catalog">
        <Catalog
          products={products}
          category={category}
          categories={window.KZ_CATEGORIES}
          activeCat={cat}
          query={query}
          onQuery={setQuery}
          onCat={setCat}
          qtyFor={qtyFor}
          onAdd={addItem}
          listMode={t.tileStyle === 'list'}
        />
      </div>

      {itemCount > 0 && (
        <button className="cart-fab" onClick={() => setPanelOpen(true)}>
          <ion-icon name="cart-outline"></ion-icon>
          <span>{money(totals.total)}</span>
          <span className="badge">{itemCount}</span>
        </button>
      )}

      {charging && <ChargeSheet total={totals.total} onDone={finishOrder} onClose={() => setCharging(false)} />}

      <TweaksPanel>
        <TweakSection label="Product browser" />
        <TweakRadio label="Tile style" value={t.tileStyle}
          options={[{ value: 'image', label: 'Image-led' }, { value: 'list', label: 'Compact list' }]}
          onChange={(v) => setTweak('tileStyle', v)} />
        <TweakSection label="Order panel" />
        <TweakColor label="Payment button" value={t.payColor}
          options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
          onChange={(v) => setTweak('payColor', v)} />
        <TweakToggle label="Loyalty points band" value={t.showLoyalty}
          onChange={(v) => setTweak('showLoyalty', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
