/* ============================================================
   Koomzo POS Suite — SELF-SERVICE KIOSK
   ============================================================ */
let KUID = 1;
const NOTE_PRESETS = {
  grill: ['No onion', 'Well done', 'No sauce', 'Extra sauce'],
  fry: ['Extra crispy', 'No salt', 'Extra dip'],
  cold: ['No dressing', 'Dressing on the side', 'No coriander'],
  pizza: ['Well baked', 'No basil', 'Extra cheese'],
  pasta: ['Al dente', 'No parmesan', 'Extra chilli'],
  dessert: ['To share', 'No nuts'],
  bar: ['No ice', 'Extra ice', 'Slice of lemon'],
  none: ['No cutlery'],
};

function KioskAttract({ vertical, onStart }) {
  return (
    <div className="kattract">
      <div className="kattract__brand"><div className="mk"><ion-icon name="restaurant"></ion-icon></div>koomzo<span> order</span></div>
      <h1 className="kattract__h">Order here.</h1>
      <p className="kattract__p">Browse the menu, pay with mobile money, and we’ll call your number.</p>
      <div className="kattract__acts">
        {vertical === 'retail' ? (
          <button className="kabtn go" onClick={() => onStart('takeaway')}><ion-icon name="bag-handle-outline"></ion-icon><span>Start order</span></button>
        ) : (
          <>
            <button className="kabtn go" onClick={() => onStart('dinein')}><ion-icon name="restaurant-outline"></ion-icon><span>Eat in<small>We’ll bring it to your table</small></span></button>
            <button className="kabtn" onClick={() => onStart('takeaway')}><ion-icon name="bag-handle-outline"></ion-icon><span>Takeaway<small>Collect at the counter</small></span></button>
          </>
        )}
      </div>
      <div className="kattract__foot"><ion-icon name="phone-portrait-outline"></ion-icon>MTN MoMo &amp; Orange Money · allergen info on every item</div>
    </div>
  );
}

function KioskItemSheet({ p, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState([]);
  const presets = NOTE_PRESETS[p.station] || NOTE_PRESETS.none;
  const toggle = (n) => setNotes((c) => c.includes(n) ? c.filter((x) => x !== n) : [...c, n]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="kitem__art" style={{ background: p.tint.bg }}>
          <ion-icon name={p.icon} style={{ color: p.tint.fg }}></ion-icon>
        </div>
        <div className="sheet__pad">
          <h3 className="sheet__title">{p.name}</h3>
          <p className="sheet__sub">{p.desc}</p>
          {p.tags && p.tags.length > 0 && <div style={{ margin: '0 0 14px' }}><TagChips tags={p.tags} /></div>}
          <div className="knote">
            <span className="knote__k">Anything to change?</span>
            <div className="knote__opts">
              {presets.map((n) => (
                <button key={n} className={notes.includes(n) ? 'on' : ''} onClick={() => toggle(n)}>{n}</button>
              ))}
            </div>
          </div>
          <div className="kqty">
            <span className="knote__k">Quantity</span>
            <div className="kstep big">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}><ion-icon name="remove"></ion-icon></button>
              <span className="v">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))}><ion-icon name="add"></ion-icon></button>
            </div>
          </div>
          <div className="sheet__actions">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-fill accent" onClick={() => onAdd(p, qty, notes.join(', '))}>
              Add {qty > 1 ? qty + ' · ' : ''}{money(p.price * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KioskTile({ p, qty, onAdd }) {
  return (
    <button className="ktile" onClick={() => onAdd(p)}>
      <div className="ktile__art" style={{ background: p.tint.bg }}>
        <ion-icon name={p.icon} style={{ color: p.tint.fg }}></ion-icon>
        {p.tags && p.tags.length > 0 && <span className="ktile__tags"><TagChips tags={p.tags.slice(0, 3)} /></span>}
        {qty > 0 && <span className="ktile__badge" key={qty}>{qty}</span>}
      </div>
      <div className="ktile__meta">
        <div className="ktile__name">{p.name}</div>
        <div className="ktile__desc">{p.desc}</div>
        <div className="ktile__row">
          <span className="ktile__price">{money(p.price)}</span>
          <span className="ktile__plus"><ion-icon name="add"></ion-icon></span>
        </div>
      </div>
    </button>
  );
}

function KioskCheckout({ total, mode, onClose, onDone }) {
  const [step, setStep] = useState('loyalty'); // loyalty | pay | done
  const [orderNo] = useState(() => 1200 + Math.floor(Math.random() * 90));
  const [phone, setPhone] = useState('');
  const [payWith, setPayWith] = useState('momo');
  const [left, setLeft] = useState(20);
  useEffect(() => {
    if (step !== 'done') return;
    if (left <= 0) { onDone(); return; }
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [step, left]);
  if (step === 'done') {
    return (
      <div className="scrim">
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="sheet__pad">
            <div className="paid">
              <div className="paid__icon"><ion-icon name="checkmark-circle"></ion-icon></div>
              <h3 className="sheet__title">Order Confirmed</h3>
              <p className="sheet__sub">{mode === 'dinein' ? 'Dine in' : 'Takeaway'} · {money(total)} paid</p>
              <div className="paid__num"><ion-icon name="receipt-outline"></ion-icon>Pickup <b>#{orderNo}</b></div>
            </div>
            <div className="sheet__actions" style={{ marginTop: 20 }}>
              <button className="btn-fill accent" style={{ flex: 1 }} onClick={onDone}>Done<small style={{ opacity: .7, fontWeight: 500 }}>&nbsp;· {left}s</small></button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (step === 'pay') {
    return (
      <div className="scrim" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="sheet__pad">
            <h3 className="sheet__title">Pay with mobile money</h3>
            <p className="sheet__sub">Enter your number — a request goes to your handset. Confirm it with your PIN.</p>
            <div className="sheet__display">{money(total)}</div>
            <div className="tenders">
              {window.KZ_LOCALE.tenderList.filter((t) => t.id === 'momo' || t.id === 'om').map((t) => (
                <button key={t.id} className={'tender' + (payWith === t.id ? ' sel' : '')} onClick={() => setPayWith(t.id)}>
                  <ion-icon name={t.icon}></ion-icon>{t.label}
                </button>
              ))}
            </div>
            <input className="noteinput" style={{ minHeight: 'auto', height: 54, fontSize: 18, textAlign: 'center', letterSpacing: '.04em' }}
              placeholder="6 XX XX XX XX" inputMode="numeric" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9 ]/g, ''))} />
            <div className="sheet__actions">
              <button className="btn-ghost" onClick={() => setStep('loyalty')}>Back</button>
              <button className="btn-fill" disabled={phone.replace(/\D/g, '').length < 9}
                onClick={() => setStep('done')}>Send request · {money(total)}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">Koomzo Rewards</h3>
          <p className="sheet__sub">Add your number to earn points on this order — or skip.</p>
          <input className="noteinput" style={{ minHeight: 'auto', height: 54, fontSize: 18, textAlign: 'center', letterSpacing: '.04em' }}
            placeholder="6 XX XX XX XX" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9 ]/g, ''))} inputMode="numeric" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 18px', color: 'var(--kz-success)', font: '600 14px var(--kz-font-sans)' }}>
            <ion-icon name="star" style={{ fontSize: 18 }}></ion-icon>Earn {window.KZ_LOCALE.int(total)} points (≈ {money(total * 0.05)} back)
          </div>
          <div className="sheet__actions">
            <button className="btn-ghost" onClick={() => setStep('pay')}>Skip</button>
            <button className="btn-fill accent" onClick={() => setStep('pay')}>Continue to Pay</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kiosk() {
  const { vertical, verticalCfg, menu, sendTicket } = useSuite();
  const [mode, setMode] = useState(vertical === 'retail' ? 'takeaway' : 'dinein');
  const [cat, setCat] = useState(verticalCfg.categories[0].id);
  const [cart, setCart] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [started, setStarted] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => { setCat(verticalCfg.categories[0].id); setCart([]); setStarted(false); setMode(vertical === 'retail' ? 'takeaway' : 'dinein'); }, [vertical]);

  const products = menu.filter((p) => p.cat === cat);
  const qtyFor = (id) => cart.filter((c) => c.id === id).reduce((s, c) => s + c.qty, 0);
  const add = (p, n, notes) => {
    const qty = n || 1;
    setCart((cur) => {
      const ex = cur.find((c) => c.id === p.id && (c.notes || '') === (notes || ''));
      return ex ? cur.map((c) => c === ex ? { ...c, qty: c.qty + qty } : c)
        : [...cur, { uid: 'k' + (KUID++), id: p.id, name: p.name, price: p.price, qty, notes: notes || '', station: p.station, tags: p.tags, icon: p.icon, tint: p.tint }];
    });
    setDetail(null);
  };
  const step = (uid, d) => setCart((cur) => cur.flatMap((c) => c.uid !== uid ? [c] : (c.qty + d <= 0 ? [] : [{ ...c, qty: c.qty + d }])));

  const net = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax = Math.round(net * window.KZ_LOCALE.vat / 100);
  const total = +(net + tax).toFixed(2);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  const doCheckout = () => {
    // fire food items to kitchen
    const food = cart.filter((c) => c.station && c.station !== 'bar' && c.station !== 'none');
    if (food.length) sendTicket({ table: mode === 'dinein' ? 'Kiosk' : 'T/A', floor: 'main', server: 'Kiosk', guests: 1, source: 'kiosk', items: food.map((c) => ({ name: c.name, qty: c.qty, station: c.station, tags: c.tags, notes: c.notes })) });
  };

  const cats = verticalCfg.categories;
  const catLabel = cats.find((c) => c.id === cat)?.label || '';

  return (
    <div className="screen">
      <div className="kiosk">
        {!started ? <KioskAttract vertical={vertical} onStart={(m) => { setMode(m); setStarted(true); }} /> : (
        <>
        <div className="khead">
          <div className="khead__brand">
            <div className="mk"><ion-icon name="restaurant"></ion-icon></div>
            <div className="nm">koomzo<span> order</span></div>
          </div>
          {vertical !== 'retail' && (
            <div className="khead__mode">
              <button className={mode === 'dinein' ? 'active' : ''} onClick={() => setMode('dinein')}><ion-icon name="restaurant-outline"></ion-icon>Dine in</button>
              <button className={mode === 'takeaway' ? 'active' : ''} onClick={() => setMode('takeaway')}><ion-icon name="bag-handle-outline"></ion-icon>Takeaway</button>
            </div>
          )}
          <button className="khead__lang" onClick={() => { setCart([]); setStarted(false); }}>
            <ion-icon name="close-outline"></ion-icon>{count ? 'Start over' : 'Exit'}
          </button>
        </div>

        <div className="kbody">
          <div className="kcats">
            {cats.map((c) => (
              <button key={c.id} className={'kcatbtn' + (cat === c.id ? ' active' : '')} onClick={() => setCat(c.id)}>
                <ion-icon name={c.icon}></ion-icon>{c.label}
              </button>
            ))}
          </div>
          <div className="kgridwrap">
            <h2 className="kgrid__title">{catLabel}</h2>
            <div className="kgrid">
              {products.map((p) => <KioskTile key={p.id} p={p} qty={qtyFor(p.id)} onAdd={() => setDetail(p)} />)}
            </div>
          </div>
        </div>

        <div className="kcartbar">
          <div className="kcartbar__cart"><ion-icon name="cart-outline"></ion-icon><span className="ct">{count}</span></div>
          <div className="kcartbar__txt"><span className="k">{count} {count === 1 ? 'item' : 'items'}</span><span className="v">{money(total)}</span></div>
          <div className="kcartbar__btns">
            <button className="kcartbar__view" onClick={() => setDrawer(true)} disabled={!count}><ion-icon name="list-outline"></ion-icon>Review</button>
            <button className="kcartbar__pay" disabled={!count} onClick={() => { setDrawer(false); setCheckout(true); }}><ion-icon name="card-outline"></ion-icon>Pay {money(total)}</button>
          </div>
        </div>

        {drawer && (
          <>
            <div className="scrim" style={{ background: 'rgba(20,24,38,.4)' }} onClick={() => setDrawer(false)}></div>
            <div className="kdrawer">
              <div className="kdrawer__head">
                <h2>Your Order</h2>
                <span style={{ font: '500 14px var(--kz-font-sans)', color: 'var(--kz-muted)' }}>{mode === 'dinein' ? 'Dine in' : 'Takeaway'}</span>
                <button className="kdrawer__close" onClick={() => setDrawer(false)}><ion-icon name="close"></ion-icon></button>
              </div>
              <div className="kdrawer__list">
                {cart.map((c) => (
                  <div key={c.uid} className="kcartline">
                    <div className="kcartline__art" style={{ background: c.tint.bg }}><ion-icon name={c.icon} style={{ color: c.tint.fg }}></ion-icon></div>
                    <div className="kcartline__body">
                      <div className="kcartline__name">{c.name}</div>
                      <div className="kcartline__price">{money(c.price)} each</div>
                      {c.notes && <div className="kcartline__note"><ion-icon name="chatbubble-ellipses-outline"></ion-icon>{c.notes}</div>}
                    </div>
                    <div className="kstep">
                      <button onClick={() => step(c.uid, -1)}><ion-icon name={c.qty <= 1 ? 'trash-outline' : 'remove'}></ion-icon></button>
                      <span className="v">{c.qty}</span>
                      <button onClick={() => step(c.uid, 1)}><ion-icon name="add"></ion-icon></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="kdrawer__foot">
                <div className="kdrawer__totals">
                  <div className="row"><span className="k">Subtotal</span><span className="v">{money(net)}</span></div>
                  <div className="row"><span className="k">{window.KZ_LOCALE.vatLabel}</span><span className="v">{money(tax)}</span></div>
                  <div className="row tot"><span className="k">Total</span><span className="v">{money(total)}</span></div>
                </div>
                <button className="kdrawer__pay" onClick={() => { setDrawer(false); setCheckout(true); }}><ion-icon name="card-outline"></ion-icon>Checkout · {money(total)}</button>
                <button className="kdrawer__cancel" onClick={() => { setCart([]); setDrawer(false); }}>Cancel order</button>
              </div>
            </div>
          </>
        )}

        {detail && <KioskItemSheet p={detail} onClose={() => setDetail(null)} onAdd={add} />}

        {checkout && <KioskCheckout total={total} mode={mode} onClose={() => setCheckout(false)}
          onDone={() => { doCheckout(); setCart([]); setCheckout(false); setStarted(false); }} />}
        </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Kiosk, KioskTile, KioskCheckout, KioskAttract, KioskItemSheet });
