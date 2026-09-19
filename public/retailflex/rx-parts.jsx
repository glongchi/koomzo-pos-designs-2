/* Koomzo Retail POS (Flex) — shared board parts */
const RX_NAV = [
  { id:'register', icon:'cart-outline', label:'Register' },
  { id:'tickets', icon:'pause-outline', label:'Tickets' },
  { id:'returns', icon:'refresh-outline', label:'Returns' },
  { id:'customers', icon:'people-outline', label:'Customers' },
  { id:'shift', icon:'cash-outline', label:'Shift' },
  { id:'setup', icon:'options-outline', label:'Setup' },
];

function Rail({ view, onView, held, badges, modules }) {
  /* A badge counts work waiting today on that screen — never a total, gone at zero. */
  const items = RX_NAV.filter((n) => n.id === 'register' || n.id === 'setup' || !modules || modules[n.id] !== false);
  const b = Object.assign({ tickets: held || 0 }, badges || {});
  return (
    <nav className="rail">
      <div className="rail__mark"><ion-icon name="storefront-outline"></ion-icon></div>
      {items.map((n) => (
        <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => onView(n.id)} title={n.label}>
          <ion-icon name={n.icon}></ion-icon><span>{n.label}</span>
          {b[n.id] > 0 && <i className="dot">{b[n.id] > 99 ? '99+' : b[n.id]}</i>}
        </button>
      ))}
      <div className="rail__sp"></div>
    </nav>
  );
}

function TopBar({ profile, title, sub, modified, onProfile }) {
  return (
    <header className="top">
      <div className="top__title">{title}<small>{sub}</small></div>
      <button className="profchip" onClick={onProfile}>
        <ion-icon name={profile.icon}></ion-icon><span className="pname">{profile.name}</span>{modified && <span className="mchip pri"><ion-icon name="create-outline"></ion-icon>Modified</span>}
        <ion-icon name="chevron-down-outline" style={{ fontSize: 14, color: 'var(--kz-muted-3)' }}></ion-icon>
      </button>
      <div className="top__sp"></div>
      <div className="top__meta">
        <span className="ok"><ion-icon name="cloud-done-outline" style={{ fontSize: 16 }}></ion-icon>Synced</span>
        <span>Caisse 1</span>
      </div>
      <div className="avatar">AN</div>
    </header>
  );
}

function EntryBar({ mode, value, onValue, onSubmit, onKeypad, onWeigh, showWeigh }) {
  const scan = mode === 'scan';
  const ref = React.useRef(null);
  React.useEffect(() => { if (scan && ref.current) ref.current.focus(); }, [scan]);
  return (
    <div className="entry">
      <form className={scan ? 'scanbox' : 'scanbox plain'} onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <ion-icon name={scan ? 'barcode-outline' : 'search-outline'}></ion-icon>
        <input ref={ref} value={value} onChange={(e) => onValue(e.target.value)}
          placeholder={scan ? 'Scan barcode or type SKU…' : 'Search products, SKU or brand…'} />
        {scan && <kbd>Scanner ready</kbd>}
      </form>
      {showWeigh && <button className="entry__btn" onClick={onWeigh}><ion-icon name="speedometer-outline"></ion-icon>Weigh</button>}
      <button className="entry__btn" onClick={onKeypad}><ion-icon name="keypad-outline"></ion-icon></button>
    </div>
  );
}

function Cats({ cats, active, onCat }) {
  return (
    <div className="cats">
      <button className={'chip' + (active === 'all' ? ' on' : '')} onClick={() => onCat('all')}>
        <ion-icon name="apps-outline"></ion-icon>All
      </button>
      {cats.map((c) => (
        <button key={c.id} className={'chip' + (active === c.id ? ' on' : '')} onClick={() => onCat(c.id)}>
          <ion-icon name={c.icon}></ion-icon>{c.label}
        </button>
      ))}
    </div>
  );
}

function Tile({ p, qty, style, onAdd }) {
  return (
    <button className="tile" onClick={() => onAdd(p)}>
      {style !== 'text' && (
        <div className="tile__art" style={{ background: p.tint.bg }}>
          <ion-icon name={p.icon} style={{ color: p.tint.fg }}></ion-icon>
          {p.weighed && <span className="tile__flag"><ion-icon name="speedometer-outline"></ion-icon>per {p.unit}</span>}
          {p.age && <span className="tile__flag warn"><ion-icon name="alert-circle-outline"></ion-icon>{p.age}+</span>}
        </div>
      )}
      {qty > 0 && <span className="tile__badge">{qty % 1 ? qty.toFixed(2) : qty}</span>}
      <div className="tile__meta">
        <div className="tile__name">{p.name}</div>
        <div className="tile__sub">{p.sub}</div>
        <div className="tile__price">{money(p.price)}{p.unit ? <small> /{p.unit}</small> : null}</div>
      </div>
    </button>
  );
}

function CatalogGrid({ products, style, qtyFor, onAdd, heading }) {
  if (!products.length) return (
    <div className="empty" style={{ minHeight: 260 }}>
      <ion-icon name="search-outline"></ion-icon><p>No matches. Try another term or scan the barcode.</p>
    </div>
  );
  return (
    <>
      {heading && <div className="sechead"><h3>{heading}</h3><span>{products.length} items</span></div>}
      <div className={'grid ' + style}>
        {products.map((p) => <Tile key={p.id} p={p} qty={qtyFor(p.id)} style={style} onAdd={onAdd} />)}
      </div>
    </>
  );
}

function CartLine({ o, sel, onSelect, onQty }) {
  const amt = o.price * o.qty * (1 - o.disc / 100);
  return (
    <div className={'line' + (sel ? ' sel' : '')} onClick={() => onSelect(o.uid)}>
      <div className="line__body">
        <div className="line__top">
          <span className="line__name">{o.name}</span>
          <span className="line__amt">{money(amt)}</span>
        </div>
        <div className="line__sub">
          <b>{o.weighed ? o.qty.toFixed(3) + ' ' + o.unit : '× ' + o.qty}</b>
          <span>@ {money(o.price)}{o.unit ? '/' + o.unit : ''}</span>
          {o.variant && <span className="pill var">{o.variant}</span>}
          {o.weighed && <span className="pill wt"><ion-icon name="speedometer-outline" style={{ fontSize: 11 }}></ion-icon>weighed</span>}
          {o.serial && <span className="pill sn">SN {o.serial}</span>}
          {o.lot && <span className="pill sn">Lot {o.lot}</span>}
          {o.rx && <span className="pill var"><ion-icon name="document-text-outline" style={{ fontSize: 11 }}></ion-icon>Rx {o.rx}</span>}
          {o.mods && <span className="pill">{o.mods}</span>}
          {o.disc > 0 && <span className="pill disc">−{o.disc}%</span>}
        </div>
      </div>
      {!o.weighed && (
        <div className="stepper" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onQty(o.uid, -1)}><ion-icon name="remove-outline"></ion-icon></button>
          <span className="q">{o.qty}</span>
          <button onClick={() => onQty(o.uid, 1)}><ion-icon name="add-outline"></ion-icon></button>
        </div>
      )}
    </div>
  );
}

function Cart({ cls, orderNo, locked, items, customer, totals, profile, features, modules, selUid, onSelect, onQty, onClear, onHold,
                onCustomer, onQuick, onPay, onClose, onHead }) {
  const M = modules || {};
  const count = items.reduce((s, o) => s + (o.weighed ? 1 : o.qty), 0);
  return (
    <aside className={cls}>
      <div className="cart__head" onClick={onHead ? (e) => { if (e.target.closest('button')) return; onHead(); } : null}>
        <div className="cart__no">Order {window.KZ_TICKET.short(orderNo)}<small>{orderNo} · {count} item{count === 1 ? '' : 's'}</small></div>
        <div className="sp"></div>
        {M.tickets !== false && <button className="icbtn" title="Hold ticket" onClick={onHold}><ion-icon name="pause-outline"></ion-icon></button>}
        <button className="icbtn" title="Void order" onClick={onClear}><ion-icon name="trash-outline"></ion-icon></button>
        {onClose && <button className="icbtn" title="Close" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>}
</div>
      {locked && (
        <div className="note info" style={{ margin: '10px 12px 0' }}>
          <ion-icon name="lock-closed-outline"></ion-icon>Part-tendered — the total is frozen. Finish the payment, or hand it to a supervisor.</div>
      )}
      {features.loyalty && M.customers !== false && customer && items.length > 0 && (
        /* what this ticket earns — only with a customer attached, since for a
           walk-in the number belongs to nobody */
        <div className="loyband">
          <div><span className="k">Points won</span><span className="v up">+{Math.round(totals.total / 100)}</span></div>
          <div><span className="k">New balance</span><span className="v">{(customer.points || 0) + Math.round(totals.total / 100)}</span></div>
        </div>
      )}
      {features.loyalty && M.customers !== false && (
        <button className="custrow" onClick={onCustomer}>
          <ion-icon name={customer ? 'person-circle-outline' : 'person-add-outline'}></ion-icon>
          <span className="nm">{customer ? customer.name : 'Add customer'}</span>
          {customer && <span className="pts">{customer.points} pts</span>}
        </button>
      )}
      <div className="lines">
        {items.length === 0
          ? <div className="empty"><ion-icon name="cart-outline"></ion-icon><p>No items yet — {profile.entry === 'scan' ? 'scan an item to begin.' : 'tap a product to begin.'}</p></div>
          : items.map((o) => <CartLine key={o.uid} o={o} sel={o.uid === selUid} onSelect={onSelect} onQty={onQty} />)}
      </div>
      <div className="quick">
        {profile.quick.map((q) => <button key={q} onClick={() => onQuick(q)}>{q}</button>)}
      </div>
      <div className="totals">
        <div className="trow"><span className="k">Subtotal</span><span className="v">{money(totals.net)}</span></div>
        {totals.discount > 0 && <div className="trow"><span className="k">Discounts</span><span className="v" style={{ color: 'var(--kz-discount)' }}>−{money(totals.discount)}</span></div>}
        <div className="trow"><span className="k">{window.KZ_LOCALE.taxLabel(profile.zeroRated)}</span><span className="v">{money(totals.tax)}</span></div>
        <div className="trow big"><span className="k">Total</span><span className="v">{money(totals.total)}</span></div>
      </div>
      <div className="paybar">
        <button className="pay" disabled={!items.length} onClick={onPay}>
          <ion-icon name="card-outline"></ion-icon>Charge <span className="amt">{money(totals.total)}</span>
        </button>
      </div>
    </aside>
  );
}

function DockBar({ total, count, onOpen }) {
  return (
    <div className="dockbar">
      <div className="cartic">
        <ion-icon name="cart-outline"></ion-icon>
        {count > 0 && <span className="ct">{count}</span>}
      </div>
      <div className="sum">{money(total)}<small>{count === 0 ? 'No items yet' : count + ' item' + (count === 1 ? '' : 's') + ' in ticket'}</small></div>
      <button className="go" disabled={!count} style={!count ? { opacity: .45 } : null} onClick={onOpen}>
        <ion-icon name="receipt-outline"></ion-icon>Review &amp; pay</button>
    </div>
  );
}

/* the ticket as a second view — for one-thumb use where an overlay is in the way */
function TabStrip({ view, onView, count }) {
  return (
    <div className="tabstrip">
      <button className={view === 'catalog' ? 'on' : ''} onClick={() => onView('catalog')}>
        <ion-icon name="grid-outline"></ion-icon>Catalogue</button>
      <button className={view === 'order' ? 'on' : ''} onClick={() => onView('order')}>
        <ion-icon name="receipt-outline"></ion-icon>Ticket{count > 0 && <span className="ct">{count}</span>}</button>
    </div>
  );
}

Object.assign(window, { RX_NAV, Rail, TopBar, EntryBar, Cats, Tile, CatalogGrid, CartLine, Cart, DockBar, TabStrip });
