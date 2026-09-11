/* Koomzo Retail POS — modal sheets + secondary screens */

function Sheet({ title, sub, wide, onClose, children, foot }) {
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={wide ? 'sheet wide' : 'sheet'}>
        <div className="sheet__head">
          <div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">{children}</div>
        {foot && <div className="sheet__foot">{foot}</div>}
      </div>
    </div>
  );
}

/* ---- variant picker (clothing, electronics, salon) ---- */
function VariantSheet({ product, onClose, onAdd }) {
  const v = product.variants || { sizes: [], colors: [] };
  const out = ['XS', '43'];
  const [size, setSize] = React.useState(v.sizes.find((s) => !out.includes(s)) || null);
  const [color, setColor] = React.useState(v.colors && v.colors[0] ? v.colors[0][0] : null);
  const label = [color, size].filter(Boolean).join(' · ');
  return (
    <Sheet title={product.name} sub={`${product.sub} · ${money(product.price)} · SKU ${product.sku}`} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={v.sizes.length > 0 && !size} onClick={() => onAdd(product, label)}>Add to ticket</button>
      </>}>
      {v.sizes && v.sizes.length > 0 && (
        <div>
          <div className="lbl">Size</div>
          <div className="opts">
            {v.sizes.map((s) => (
              <button key={s} className={'opt' + (out.includes(s) ? ' out' : size === s ? ' on' : '')}
                disabled={out.includes(s)} onClick={() => setSize(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}
      {v.colors && v.colors.length > 0 && (
        <div>
          <div className="lbl">Colour</div>
          <div className="opts">
            {v.colors.map(([n, hex]) => (
              <button key={n} className={'opt' + (color === n ? ' on' : '')} onClick={() => setColor(n)}>
                <span className="sw" style={{ background: hex }}></span>{n}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="note info"><ion-icon name="cube-outline"></ion-icon>
        On hand: 6 at this store · 14 at Warehouse. Greyed sizes are out of stock.</div>
    </Sheet>
  );
}

/* ---- weighed item / scale ---- */
function ScaleSheet({ product, onClose, onAdd }) {
  const [w, setW] = React.useState('0.000');
  const [tare, setTare] = React.useState(false);
  const kg = parseFloat(w) || 0;
  const key = (k) => setW((cur) => {
    if (k === 'back') return (cur.replace('.', '').slice(0, -1).padStart(4, '0').replace(/^(\d+)(\d{3})$/, '$1.$2')) || '0.000';
    if (k === 'live') return (Math.random() * 1.4 + 0.2).toFixed(3);
    const digits = (cur.replace('.', '') + k).replace(/^0+(?=\d{4})/, '').slice(-6);
    return (digits.padStart(4, '0')).replace(/^(\d+)(\d{3})$/, '$1.$2');
  });
  return (
    <Sheet title={product.name} sub={`${money(product.price)} per ${product.unit || 'kg'} · SKU ${product.sku}`} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={kg <= 0} onClick={() => onAdd(product, kg)}>Add {money(kg * product.price)}</button>
      </>}>
      <div className="display"><small>Weight on scale</small>{w} <span style={{ fontSize: 20 }}>{product.unit || 'kg'}</span></div>
      <div className="trow"><span className="k">Line total</span><span className="v" style={{ font: '700 18px var(--kz-font-num)', color: 'var(--kz-ink)' }}>{money(kg * product.price)}</span></div>
      <div className="keypad">
        {['1','2','3','4','5','6','7','8','9'].map((k) => <button key={k} onClick={() => key(k)}>{k}</button>)}
        <button onClick={() => setTare(!tare)} style={{ fontSize: 13, fontWeight: 600 }}>{tare ? 'Tare on' : 'Tare'}</button>
        <button onClick={() => key('0')}>0</button>
        <button onClick={() => key('back')}><ion-icon name="backspace-outline"></ion-icon></button>
      </div>
      <button className="btn wide" onClick={() => key('live')}><ion-icon name="speedometer-outline"></ion-icon>Read from scale</button>
    </Sheet>
  );
}

/* ---- serial capture (electronics) ---- */
function SerialSheet({ product, onClose, onAdd }) {
  const [sn, setSn] = React.useState('');
  return (
    <Sheet title="Capture serial" sub={`${product.name} · warranty starts at sale`} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Skip</button>
        <button className="btn primary" onClick={() => onAdd(product, sn || '88-2210-4')}>Add to ticket</button>
      </>}>
      <div className="field"><ion-icon name="barcode-outline"></ion-icon>
        <input autoFocus value={sn} onChange={(e) => setSn(e.target.value)} placeholder="Scan or type serial number" /></div>
      <div className="note info"><ion-icon name="shield-checkmark-outline"></ion-icon>24-month manufacturer warranty is registered against this serial on receipt.</div>
    </Sheet>
  );
}

/* ---- age check ---- */
function AgeSheet({ product, onClose, onConfirm }) {
  return (
    <Sheet title={`Age check — ${product.age}+`} sub={product.name} onClose={onClose}
      foot={<>
        <button className="btn danger" onClick={onClose}>Refuse sale</button>
        <button className="btn primary" onClick={onConfirm}>ID verified</button>
      </>}>
      <div className="note"><ion-icon name="alert-circle-outline"></ion-icon>
        This item is restricted. Check photo ID and confirm the customer is {product.age} or over. The approval is recorded on the receipt.</div>
    </Sheet>
  );
}

/* ---- keypad: qty / price / discount on selected line ---- */
function KeypadSheet({ line, onClose, onApply }) {
  const [mode, setMode] = React.useState('qty');
  const [buf, setBuf] = React.useState('');
  const stored = mode === 'qty' ? String(line.qty) : mode === 'disc' ? String(line.disc) : line.price.toFixed(2);
  const shown = buf === '' ? stored : buf;
  const key = (k) => setBuf((b) => k === 'back' ? (b === '' ? stored : b).slice(0, -1) : k === '.' ? (b.includes('.') ? b : (b || '0') + '.') : b + k);
  return (
    <Sheet title={line.name} sub="Adjust the selected line" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={() => onApply(mode, parseFloat(shown) || 0)}>Apply</button>
      </>}>
      <div className="opts" style={{ marginTop: 0 }}>
        {[['qty', 'Quantity'], ['price', 'Price'], ['disc', 'Discount %']].map(([m, l]) => (
          <button key={m} className={'opt' + (mode === m ? ' on' : '')} onClick={() => { setMode(m); setBuf(''); }}>{l}</button>
        ))}
      </div>
      <div className="display"><small>{mode === 'qty' ? 'Quantity' : mode === 'price' ? 'Unit price' : 'Line discount'}</small>{shown || '0'}</div>
      <div className="keypad">
        {['1','2','3','4','5','6','7','8','9'].map((k) => <button key={k} onClick={() => key(k)}>{k}</button>)}
        <button onClick={() => key('.')}>.</button>
        <button onClick={() => key('0')}>0</button>
        <button onClick={() => key('back')}><ion-icon name="backspace-outline"></ion-icon></button>
      </div>
    </Sheet>
  );
}

/* ---- customer lookup ---- */
function CustomerSheet({ onClose, onPick }) {
  const [q, setQ] = React.useState('');
  const list = window.RT_CUSTOMERS.filter((c) => (c.name + c.phone).toLowerCase().includes(q.toLowerCase()));
  return (
    <Sheet title="Customer" sub="Look up by name, phone or loyalty card" onClose={onClose}
      foot={<>
        <button className="btn" onClick={() => onPick(null)}>Continue as walk-in</button>
        <button className="btn primary"><ion-icon name="person-add-outline"></ion-icon>New customer</button>
      </>}>
      <div className="field"><ion-icon name="search-outline"></ion-icon>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or card…" /></div>
      <div className="table">
        {list.map((c) => (
          <button className="trw" key={c.id} onClick={() => onPick(c)}>
            <div className="avatar">{c.name.split(' ').map((w) => w[0]).join('')}</div>
            <div><div className="nm">{c.name}</div><div className="mt">{c.phone} · {c.visits} visits</div></div>
            <div className="sp"></div>
            <span className={'badge' + (c.tier === 'Gold' ? ' gold' : '')}>{c.tier}</span>
            <span className="amt">{c.points}<small style={{ font: '500 11px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}> pts</small></span>
          </button>
        ))}
        {!list.length && <div className="empty" style={{ minHeight: 120 }}><p>No customer matches “{q}”.</p></div>}
      </div>
    </Sheet>
  );
}

/* ---- tender / checkout ---- */
function TenderSheet({ total, onClose, onDone }) {
  const [tender, setTender] = React.useState('card');
  const [cash, setCash] = React.useState(0);
  const [paid, setPaid] = React.useState(false);
  const change = Math.max(0, cash - total);
  const notes = [total, Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 20) * 20]
    .filter((v, i, a) => a.indexOf(v) === i);
  if (paid) return (
    <Sheet title="" onClose={onDone} foot={<>
      <button className="btn" onClick={onDone}><ion-icon name="print-outline"></ion-icon>Print receipt</button>
      <button className="btn primary" onClick={onDone}>New order</button></>}>
      <div className="done">
        <div className="done__ic"><ion-icon name="checkmark-outline"></ion-icon></div>
        <h4>Paid {money(total)}</h4>
        <p>{tender === 'cash' ? `Change due ${money(change)}` : 'Approved · Card ····4417'}</p>
      </div>
      <button className="btn wide"><ion-icon name="mail-outline"></ion-icon>Email receipt to customer</button>
    </Sheet>
  );
  return (
    <Sheet title={`Charge ${money(total)}`} sub="Choose how the customer is paying" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Back</button>
        <button className="btn primary" style={{ background: 'var(--kz-success)', borderColor: 'var(--kz-success)', boxShadow: '0 6px 14px rgba(46,158,91,.28)' }}
          onClick={() => setPaid(true)}>{tender === 'cash' ? 'Tender cash' : 'Take payment'}</button>
      </>}>
      <div className="tenders">
        {[['card', 'Card', 'card-outline'], ['cash', 'Cash', 'cash-outline'], ['wallet', 'Mobile wallet', 'phone-portrait-outline'], ['split', 'Split payment', 'git-branch-outline']].map(([id, l, ic]) => (
          <button key={id} className={'tender' + (tender === id ? ' on' : '')} onClick={() => setTender(id)}>
            <ion-icon name={ic}></ion-icon>{l}
          </button>
        ))}
      </div>
      {tender === 'cash' && (
        <>
          <div className="display"><small>Cash tendered</small>{money(cash)}</div>
          <div className="quickcash">{notes.map((n) => <button key={n} onClick={() => setCash(n)}>{money(n)}</button>)}</div>
          <div className="trow"><span className="k">Change due</span><span className="v" style={{ font: '700 18px var(--kz-font-num)', color: change ? 'var(--kz-success)' : 'var(--kz-muted)' }}>{money(change)}</span></div>
        </>
      )}
      {tender === 'card' && <div className="note info"><ion-icon name="card-outline"></ion-icon>Waiting for the terminal — ask the customer to tap, insert or swipe.</div>}
      {tender === 'split' && <div className="note info"><ion-icon name="git-branch-outline"></ion-icon>Take a first amount, then the balance on another tender.</div>}
    </Sheet>
  );
}

/* ---- profile setup ---- */
function SetupView({ current, onPick }) {
  return (
    <div className="view">
      <div className="setup">
        <div className="view__head">
          <div><h2>Business profile</h2><p>Pick the shape of the shop. The register presets its entry mode, keys and fields — you can still change anything afterwards.</p></div>
        </div>
        <div className="profgrid">
          {window.RT_PROFILES.map((p) => {
            const mods = [p.entry === 'scan' ? 'Scan-first' : p.entry === 'grid' ? 'Grid-first' : 'Search-first'];
            if (p.mods.scale) mods.push('Weighed items');
            if (p.mods.variants) mods.push('Variants');
            if (p.mods.serial) mods.push('Serials');
            if (p.mods.age) mods.push('Age check');
            if (p.mods.appt) mods.push('Bookings');
            if (p.mods.loyalty) mods.push('Loyalty');
            return (
              <button key={p.id} className={'prof' + (current === p.id ? ' on' : '')} onClick={() => onPick(p.id)}>
                <div className="prof__ic"><ion-icon name={p.icon}></ion-icon></div>
                <div className="prof__n">{p.name}</div>
                <div className="prof__b">{p.blurb}</div>
                <div className="prof__mods">{mods.map((m) => <span className="mod" key={m}>{m}</span>)}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- open tickets / hold list ---- */
function TicketsView({ held, onResume }) {
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Open tickets</h2><p>Parked orders stay on this register until they are resumed or voided.</p></div>
        <div className="sp"></div>
        <button className="btn primary"><ion-icon name="add-outline"></ion-icon>New ticket</button>
      </div>
      {held.length === 0
        ? <div className="empty" style={{ minHeight: 260 }}><ion-icon name="pause-outline"></ion-icon><p>Nothing on hold. Park a ticket from the register to see it here.</p></div>
        : <div className="cards">
            {held.map((t) => (
              <div className="card" key={t.id}>
                <div className="card__t">{t.label}</div>
                <div className="card__s">{t.who} · {t.items} items · {t.at}</div>
                <div className="card__s" style={{ marginTop: 8 }}><span className="badge">{t.note}</span></div>
                <div className="card__row"><span className="v">{money(t.total)}</span>
                  <button className="btn primary" onClick={() => onResume(t)}>Resume</button></div>
              </div>
            ))}
          </div>}
    </div>
  );
}

/* ---- returns & exchange ---- */
function ReturnsView() {
  const [sel, setSel] = React.useState(null);
  const [picked, setPicked] = React.useState({});
  const r = window.RT_RECEIPTS.find((x) => x.id === sel);
  const refund = r ? r.items.reduce((s, it, i) => s + (picked[i] ? it.price * it.qty : 0), 0) : 0;
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Returns & exchange</h2><p>Find the original receipt, choose the lines coming back, then refund or swap.</p></div>
      </div>
      <div className="field" style={{ maxWidth: 420, marginBottom: 16 }}>
        <ion-icon name="receipt-outline"></ion-icon><input placeholder="Scan receipt barcode or type order no…" />
      </div>
      {!r ? (
        <>
          <div className="sechead"><h3>Recent orders</h3><span>this register</span></div>
          <div className="table">
            {window.RT_RECEIPTS.map((x) => (
              <button className="trw" key={x.id} onClick={() => { setSel(x.id); setPicked({}); }}>
                <div><div className="nm">Order #{x.no}</div><div className="mt">{x.at} · {x.tender}</div></div>
                <div className="sp"></div><span className="amt">{money(x.total)}</span>
                <ion-icon name="chevron-forward-outline" style={{ color: 'var(--kz-muted-3)' }}></ion-icon>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gap: 14, maxWidth: 640 }}>
          <button className="btn" style={{ width: 'fit-content' }} onClick={() => setSel(null)}>
            <ion-icon name="chevron-back-outline"></ion-icon>All orders</button>
          <div className="table">
            {r.items.map((it, i) => (
              <button className="trw" key={i} onClick={() => setPicked({ ...picked, [i]: !picked[i] })}>
                <ion-icon name={picked[i] ? 'checkbox-outline' : 'square-outline'} style={{ color: picked[i] ? 'var(--kz-primary)' : 'var(--kz-muted-3)' }}></ion-icon>
                <div><div className="nm">{it.name}</div><div className="mt">{it.sub} · × {it.qty}</div></div>
                <div className="sp"></div><span className="amt">{money(it.price * it.qty)}</span>
              </button>
            ))}
          </div>
          <div className="card">
            <div className="trow big"><span className="k">Refund</span><span className="v">{money(refund)}</span></div>
            <div className="card__s" style={{ marginTop: 6 }}>Back to {r.tender} · restock to shop floor</div>
            <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
              <button className="btn" disabled={!refund}><ion-icon name="swap-horizontal-outline"></ion-icon>Exchange</button>
              <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!refund}>Refund {money(refund)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- customers ---- */
function CustomersView({ onPick }) {
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Customers</h2><p>Loyalty members and their balance at this store.</p></div>
        <div className="sp"></div>
        <button className="btn primary"><ion-icon name="person-add-outline"></ion-icon>Add customer</button>
      </div>
      <div className="field" style={{ maxWidth: 420, marginBottom: 16 }}>
        <ion-icon name="search-outline"></ion-icon><input placeholder="Name, phone or loyalty card…" />
      </div>
      <div className="table">
        {window.RT_CUSTOMERS.map((c) => (
          <button className="trw" key={c.id} onClick={() => onPick(c)}>
            <div className="avatar">{c.name.split(' ').map((w) => w[0]).join('')}</div>
            <div><div className="nm">{c.name}</div><div className="mt">{c.phone} · {c.visits} visits · {money(c.spend)} lifetime</div></div>
            <div className="sp"></div>
            <span className={'badge' + (c.tier === 'Gold' ? ' gold' : '')}>{c.tier}</span>
            <span className="amt">{c.points} pts</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- cash drawer & shift close ---- */
function ShiftView() {
  const s = window.RT_SHIFT;
  const net = s.lines.reduce((a, l) => a + l.v, 0);
  const counted = s.counted.notes + s.counted.coin;
  const diff = counted - s.expectedCash;
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Shift & cash drawer</h2><p>{s.register} · opened {s.opened} · {s.cashier}</p></div>
        <div className="sp"></div>
        <button className="btn"><ion-icon name="print-outline"></ion-icon>X report</button>
        <button className="btn primary"><ion-icon name="lock-closed-outline"></ion-icon>Close shift</button>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="k">Net sales</div><div className="v">{money(net)}</div></div>
        <div className="kpi"><div className="k">Transactions</div><div className="v">64</div></div>
        <div className="kpi"><div className="k">Average ticket</div><div className="v">{money(net / 64)}</div></div>
        <div className="kpi"><div className="k">Opening float</div><div className="v">{money(s.float)}</div></div>
      </div>
      <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
        <div className="card">
          <div className="card__t">Takings by tender</div>
          <div style={{ marginTop: 10 }}>
            {s.lines.map((l) => (
              <div className="trow" key={l.k} style={{ padding: '7px 0', borderBottom: '1px solid var(--kz-border)' }}>
                <span className="k">{l.k}</span><span className="v">{money(l.v)}</span></div>
            ))}
          </div>
          <div className="card__row"><span className="card__t">Net</span><span className="v">{money(net)}</span></div>
        </div>
        <div className="card">
          <div className="card__t">Cash count</div>
          <div className="card__s">Count the drawer before closing.</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <div className="trow"><span className="k">Notes</span><span className="v">{money(s.counted.notes)}</span></div>
            <div className="trow"><span className="k">Coin</span><span className="v">{money(s.counted.coin)}</span></div>
            <div className="trow"><span className="k">Expected in drawer</span><span className="v">{money(s.expectedCash)}</span></div>
          </div>
          <div className="card__row"><span className="card__t">Over / short</span>
            <span className="v" style={{ color: diff === 0 ? 'var(--kz-success)' : 'var(--kz-discount)' }}>{money(diff)}</span></div>
          <button className="btn wide" style={{ marginTop: 12 }}><ion-icon name="cash-outline"></ion-icon>Cash drop / paid out</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sheet, VariantSheet, ScaleSheet, SerialSheet, AgeSheet, KeypadSheet, CustomerSheet, TenderSheet, SetupView, TicketsView, ReturnsView, CustomersView, ShiftView });
