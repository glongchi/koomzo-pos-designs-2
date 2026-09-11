/* Koomzo POS — Mobile & Tablet app: device switcher, scaled stage,
   adaptive composition (phone sheet/bar/tab · tablet drawer · tablet two-pane) */
const { useState, useMemo, useEffect, useRef, useLayoutEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "phoneOrder": "sheet",
  "payColor": "#6a61bf",
  "showLoyalty": true
}/*EDITMODE-END*/;

const TAX_RATE = 0.1925;
const LOYALTY_BASE = 3203.0;
const DEVICES = {
  phone: { w: 390, h: 844, label: 'Phone', icon: 'phone-portrait-outline' },
  tabp:  { w: 820, h: 1180, label: 'Tablet ⵧ', icon: 'tablet-portrait-outline' },
  tabl:  { w: 1180, h: 820, label: 'Tablet ▭', icon: 'tablet-landscape-outline' },
};
let UID = 1;

/* ---------------- scaled device stage ---------------- */
function Stage({ w, h, className, children }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const availW = window.innerWidth - 56;
      const availH = window.innerHeight - 56 - 56;
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

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [device, setDevice] = useState('phone');

  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState([]);
  const [selectedUid, setSelectedUid] = useState(null);
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState('qty');
  const [buffer, setBuffer] = useState(null);
  const [charging, setCharging] = useState(false);
  const [orderNo, setOrderNo] = useState(1042);
  const [orderOpen, setOrderOpen] = useState(false);
  const [tabView, setTabView] = useState('catalog');

  const phoneOrder = t.phoneOrder;

  /* ---- catalog filtering ---- */
  const products = useMemo(() => window.KZ_PRODUCTS.filter((p) => {
    const inCat = cat === 'all' || p.cat === cat;
    const inQuery = !query || (p.name + ' ' + p.desc).toLowerCase().includes(query.toLowerCase());
    return inCat && inQuery;
  }), [cat, query]);

  const qtyFor = (id) => order.filter((o) => o.id === id).reduce((s, o) => s + o.qty, 0);

  /* ---- add / step / remove ---- */
  const addItem = (p) => {
    setOrder((cur) => {
      const ex = cur.find((o) => o.id === p.id);
      if (ex) return cur.map((o) => o.id === p.id ? { ...o, qty: o.qty + 1 } : o);
      const uid = 'u' + (UID++);
      return [...cur, { uid, id: p.id, name: p.name, price: p.price, priceOverride: null, qty: 1, discPct: 0, unit: p.unit, icon: p.icon, tint: p.tint }];
    });
  };
  const stepItem = (uid, d) => setOrder((cur) => cur.flatMap((o) => {
    if (o.uid !== uid) return [o];
    const q = o.qty + d;
    return q <= 0 ? [] : [{ ...o, qty: q }];
  }));
  const removeItem = (uid) => {
    setOrder((cur) => cur.filter((o) => o.uid !== uid));
    if (selectedUid === uid) { setSelectedUid(null); setEditing(false); }
  };
  const clearOrder = () => { setOrder([]); setSelectedUid(null); setEditing(false); setBuffer(null); };

  const selectLine = (uid) => { setSelectedUid(uid); setEditing(true); setMode('qty'); setBuffer(null); };
  const closeEditor = () => { setEditing(false); setSelectedUid(null); setBuffer(null); };
  const changeMode = (m) => { setMode(m); setBuffer(null); };

  /* ---- live numpad ---- */
  const onKey = (k) => {
    if (!selectedUid) return;
    const line = order.find((o) => o.uid === selectedUid);
    if (!line) return;
    const stored = mode === 'qty' ? qtyStr(line.qty)
      : mode === 'disc' ? String(line.discPct)
      : String(line.priceOverride != null ? line.priceOverride : line.price);
    let buf;
    if (k === 'back') buf = (buffer === null ? stored : buffer).slice(0, -1);
    else if (k === '+/-') { const b = buffer === null ? stored : buffer; buf = b.startsWith('-') ? b.slice(1) : '-' + b; }
    else if (k === '.') { const b = buffer === null ? '0' : buffer; buf = b.includes('.') ? b : b + '.'; }
    else buf = (buffer === null ? '' : buffer) + k;
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

  /* ---- physical keyboard ---- */
  useEffect(() => {
    const h = (e) => {
      if (charging || !editing || !selectedUid) return;
      if (/^[0-9]$/.test(e.key)) onKey(e.key);
      else if (e.key === '.') onKey('.');
      else if (e.key === 'Backspace') { e.preventDefault(); onKey('back'); }
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
    const tax = +(net * TAX_RATE).toFixed(2);
    return { net, tax, total: +(net + tax).toFixed(2) };
  }, [order]);

  const itemCount = order.reduce((s, o) => s + o.qty, 0);
  const finishOrder = () => { setCharging(false); clearOrder(); setOrderNo((n) => n + 1); setOrderOpen(false); setTabView('catalog'); };

  /* reset transient UI when device or pattern changes */
  useEffect(() => { setOrderOpen(false); setTabView('catalog'); setEditing(false); setSelectedUid(null); }, [device, phoneOrder]);

  const dev = DEVICES[device];
  const tabMode = device === 'phone' && phoneOrder === 'tab';

  const panelProps = {
    device, orderNo, items: order, selectedUid, buffer, mode, editing,
    onSelect: selectLine, onStep: stepItem, onRemove: removeItem,
    onMode: changeMode, onKey, onCloseEditor: closeEditor, onClear: clearOrder,
    subtotal: totals.net, tax: totals.tax, total: totals.total,
    showLoyalty: t.showLoyalty, won: totals.total, loyaltyTotal: LOYALTY_BASE + totals.total,
    onReward: () => alert('Rewards — apply a loyalty reward to this order.'),
    onDiscount: () => { if (selectedUid) changeMode('disc'); else alert('Tap an order line, then choose % Disc on the numpad.'); },
    onRefund: () => alert('Refund mode — scan or select items to return.'),
    payColor: t.payColor, onPay: () => setCharging(true),
  };

  const appClass = `m-app m-${device} po-${phoneOrder}`;
  const showScrim = orderOpen && (device === 'tabp' || (device === 'phone' && phoneOrder === 'sheet'));

  return (
    <div className="present">
      <div className="present__bar">
        <div className="present__brand">
          <div className="mk"><ion-icon name="storefront"></ion-icon></div>
          <b>koomzo<span> · POS</span></b>
        </div>
        <span className="present__tag">Mobile &amp; Tablet register</span>
        <div className="devseg">
          {Object.keys(DEVICES).map((k) => (
            <button key={k} className={device === k ? 'active' : ''} onClick={() => setDevice(k)}>
              <ion-icon name={DEVICES[k].icon}></ion-icon>{DEVICES[k].label}
            </button>
          ))}
        </div>
        <span className="present__dim">{dev.w} × {dev.h}</span>
      </div>

      <Stage w={dev.w} h={dev.h} className={device}>
        <div className={appClass}>
          <MHeader device={device} orderNo={orderNo} cashier="Anita Ndongo"
            itemCount={itemCount} total={totals.total} onOpenOrder={() => setOrderOpen(true)} />

          {tabMode && (
            <div className="m-tabs">
              <button className={tabView === 'catalog' ? 'active' : ''} onClick={() => setTabView('catalog')}>
                <ion-icon name="grid-outline"></ion-icon>Catalog
              </button>
              <button className={tabView === 'order' ? 'active' : ''} onClick={() => setTabView('order')}>
                <ion-icon name="cart-outline"></ion-icon>Order{itemCount > 0 && <span className="ct">{itemCount}</span>}
              </button>
            </div>
          )}

          {device === 'tabl' ? (
            <div className="m-main">
              <MCatalog products={products} categories={window.KZ_CATEGORIES} activeCat={cat}
                query={query} onQuery={setQuery} onCat={setCat} qtyFor={qtyFor} onAdd={addItem} />
              <div className="m-orderdock"><MOrderPanel {...panelProps} showClose={false} /></div>
            </div>
          ) : tabMode ? (
            tabView === 'order'
              ? <div className="m-orderfull"><MOrderPanel {...panelProps} showClose={false} /></div>
              : <MCatalog products={products} categories={window.KZ_CATEGORIES} activeCat={cat}
                  query={query} onQuery={setQuery} onCat={setCat} qtyFor={qtyFor} onAdd={addItem} />
          ) : (
            <>
              <MCatalog products={products} categories={window.KZ_CATEGORIES} activeCat={cat}
                query={query} onQuery={setQuery} onCat={setCat} qtyFor={qtyFor} onAdd={addItem} />
              {device === 'phone' && itemCount > 0 && !orderOpen && (
                <MOrderBar itemCount={itemCount} total={totals.total} onOpen={() => setOrderOpen(true)} />
              )}
              {showScrim && <div className="m-scrim" onClick={() => setOrderOpen(false)} />}
              {orderOpen && (
                <div className="m-overlay">
                  <MOrderPanel {...panelProps} showClose={true} showGrab={device === 'phone' && phoneOrder === 'sheet'}
                    onClose={() => setOrderOpen(false)} />
                </div>
              )}
            </>
          )}

          {charging && <MChargeSheet total={totals.total} onDone={finishOrder} onClose={() => setCharging(false)} />}

          <TweaksPanel>
            <TweakSection label="Phone — live order" />
            <TweakRadio label="Order pattern" value={t.phoneOrder}
              options={[{ value: 'sheet', label: 'Sheet' }, { value: 'bar', label: 'Bar' }, { value: 'tab', label: 'Tabs' }]}
              onChange={(v) => setTweak('phoneOrder', v)} />
            <TweakSection label="Order panel" />
            <TweakColor label="Charge button" value={t.payColor}
              options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
              onChange={(v) => setTweak('payColor', v)} />
            <TweakToggle label="Loyalty band" value={t.showLoyalty}
              onChange={(v) => setTweak('showLoyalty', v)} />
          </TweaksPanel>
        </div>
      </Stage>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
