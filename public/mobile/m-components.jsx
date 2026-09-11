/* Koomzo POS — Mobile & Tablet presentational components */
const money = (n) => window.KZ_LOCALE.short(n);
const qtyStr = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(3)));

/* ---------------- HEADER ---------------- */
function MHeader({ device, orderNo, cashier, itemCount, total, onOpenOrder }) {
  return (
    <header className="m-head">
      <div className="m-brand">
        <div className="mk"><ion-icon name="storefront"></ion-icon></div>
        <span className="nm">koomzo<span> · POS</span></span>
      </div>
      <span className="m-head__order">Order #{orderNo}</span>
      <div className="m-head__right">
        {device === 'tabp' && (
          <button className="m-orderbtn" onClick={onOpenOrder}>
            <ion-icon name="cart-outline"></ion-icon>
            <span>{money(total)}</span>
            <span className="ct">{itemCount}</span>
          </button>
        )}
        <span className="m-head__sync"><ion-icon name="wifi-outline"></ion-icon><span>Synced</span></span>
        <button className="m-iconbtn" title="Receipts"><ion-icon name="receipt-outline"></ion-icon></button>
        <div className="m-avatar" title={cashier}><ion-icon name="person"></ion-icon></div>
      </div>
    </header>
  );
}

/* ---------------- CATALOG ---------------- */
function MTile({ product, qty, onAdd }) {
  return (
    <button className="m-tile" onClick={() => onAdd(product)}>
      {qty > 0 && <span className="m-tile__badge" key={qty}>{qty}</span>}
      <div className="m-tile__art" style={{ background: product.tint.bg }}>
        <ion-icon name={product.icon} style={{ color: product.tint.fg }}></ion-icon>
        <span className="m-tile__add"><ion-icon name="add"></ion-icon></span>
      </div>
      <div className="m-tile__meta">
        <div className="m-tile__name">{product.name}</div>
        <div className="m-tile__desc">{product.desc}</div>
        <div className="m-tile__price">{money(product.price)}{product.unit && <small> / unit</small>}</div>
      </div>
    </button>
  );
}

function MCatalog({ products, categories, activeCat, query, onQuery, onCat, qtyFor, onAdd }) {
  return (
    <section className="m-catalog">
      <div className="m-searchrow">
        <label className="m-search">
          <ion-icon name="search-outline"></ion-icon>
          <input placeholder="Search products" value={query} onChange={(e) => onQuery(e.target.value)} />
          {query && <button className="clr" onClick={() => onQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
        </label>
        <button className="m-scan" title="Scan barcode"><ion-icon name="barcode-outline"></ion-icon></button>
      </div>

      <div className="m-cats">
        <button className={'m-chip' + (activeCat === 'all' ? ' active' : '')} onClick={() => onCat('all')}>
          <ion-icon name="apps-outline"></ion-icon>All
        </button>
        {categories.map((c) => (
          <button key={c.id} className={'m-chip' + (activeCat === c.id ? ' active' : '')} onClick={() => onCat(c.id)}>
            <ion-icon name={c.icon}></ion-icon>{c.label}
          </button>
        ))}
      </div>

      <div className="m-grid-scroll">
        <div className="m-grid">
          {products.map((p) => <MTile key={p.id} product={p} qty={qtyFor(p.id)} onAdd={onAdd} />)}
        </div>
      </div>
    </section>
  );
}

/* ---------------- ORDER LINE + STEPPER ---------------- */
function MLine({ item, selected, buffer, mode, onSelect, onStep, onRemove }) {
  const unit = item.priceOverride != null ? item.priceOverride : item.price;
  const lineTotal = unit * item.qty * (1 - item.discPct / 100);
  let qtyDisp = qtyStr(item.qty), unitDisp = money(unit), discDisp = item.discPct;
  if (selected && buffer !== null) {
    if (mode === 'qty') qtyDisp = buffer === '' ? '0' : buffer;
    if (mode === 'price') unitDisp = window.KZ_LOCALE.short(buffer === '' ? 0 : buffer);
    if (mode === 'disc') discDisp = buffer === '' ? '0' : buffer;
  }
  return (
    <div className={'m-line' + (selected ? ' sel' : '')} onClick={() => onSelect(item.uid)}>
      <div className="m-line__top">
        <span className="m-line__name">{item.name}</span>
        <span className="m-line__total">{money(lineTotal)}</span>
      </div>
      <div className="m-line__bot">
        <span className="m-line__unit">
          <b>{unitDisp}</b>{item.unit ? ' / unit' : ''}
          {item.discPct > 0 && <span className="m-line__disc">−{discDisp}%</span>}
        </span>
        <div className="m-step" onClick={(e) => e.stopPropagation()}>
          {item.qty <= 1
            ? <button onClick={() => onRemove(item.uid)} title="Remove"><ion-icon name="trash-outline"></ion-icon></button>
            : <button onClick={() => onStep(item.uid, -1)}><ion-icon name="remove"></ion-icon></button>}
          <span className="v">{qtyDisp}</span>
          <button onClick={() => onStep(item.uid, 1)}><ion-icon name="add"></ion-icon></button>
        </div>
      </div>
    </div>
  );
}

function MTicket({ items, selectedUid, buffer, mode, onSelect, onStep, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="m-ticket">
        <div className="m-ticket__empty">
          <ion-icon name="cart-outline"></ion-icon>
          <p>No items yet — tap a product to start the order.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="m-ticket">
      {items.map((it) => (
        <MLine key={it.uid} item={it} selected={it.uid === selectedUid} buffer={buffer} mode={mode}
          onSelect={onSelect} onStep={onStep} onRemove={onRemove} />
      ))}
    </div>
  );
}

/* ---------------- INLINE EDITOR (segmented + numpad) ---------------- */
function MEditor({ line, mode, onMode, onKey, onDone }) {
  return (
    <div className="m-editor">
      <div className="m-editor__head">
        <span className="m-editor__name"><ion-icon name="create-outline" style={{ fontSize: 16, color: 'var(--kz-primary)' }}></ion-icon>Editing <b>{line.name}</b></span>
        <button className="m-editor__done" onClick={onDone}>Done</button>
      </div>
      <div className="m-seg">
        {[['qty', 'Qty'], ['disc', '% Disc'], ['price', 'Price']].map(([id, label]) => (
          <button key={id} className={mode === id ? 'active' : ''} onClick={() => onMode(id)}>{label}</button>
        ))}
      </div>
      <div className="m-numpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
          <button key={k} onClick={() => onKey(k)}>{k}</button>
        ))}
        <button className="fn" onClick={() => onKey('+/-')}>+/−</button>
        <button onClick={() => onKey('0')}>0</button>
        <button className="fn" onClick={() => onKey('.')}>.</button>
        <button className="bksp" onClick={() => onKey('back')}><ion-icon name="backspace-outline"></ion-icon></button>
      </div>
    </div>
  );
}

/* ---------------- TOTALS / LOYALTY / QUICK ACTIONS ---------------- */
function MTotals({ subtotal, tax, total }) {
  return (
    <div className="m-totals">
      <div className="m-totals__row sub"><span className="k">Subtotal</span><span className="v">{money(subtotal)}</span></div>
      <div className="m-totals__row tax"><span className="k">TVA (19,25 %)</span><span className="v">{money(tax)}</span></div>
      <div className="m-totals__row tot"><span className="k">Total</span><span className="v">{money(total)}</span></div>
    </div>
  );
}

function MLoyalty({ won, newTotal }) {
  return (
    <div className="m-loyalty">
      <div className="m-loyalty__card"><div className="lbl">Points won</div><div className="val up">+{won.toFixed(1)}</div></div>
      <div className="m-loyalty__card"><div className="lbl">New balance</div><div className="val tot">{newTotal.toFixed(1)}</div></div>
    </div>
  );
}

function MQuick({ onReward, onDiscount, onRefund }) {
  return (
    <div className="m-quick">
      <button onClick={onRefund}><ion-icon name="arrow-undo-outline"></ion-icon>Refund</button>
      <button className="reward" onClick={onReward}><ion-icon name="star-outline"></ion-icon>Reward</button>
      <button onClick={onDiscount}><ion-icon name="pricetag-outline"></ion-icon>Discount</button>
    </div>
  );
}

/* ---------------- ORDER PANEL (shared body) ---------------- */
function MOrderPanel({
  device, orderNo, items, selectedUid, buffer, mode, editing,
  onSelect, onStep, onRemove, onMode, onKey, onCloseEditor,
  subtotal, tax, total, showLoyalty, won, loyaltyTotal,
  onReward, onDiscount, onRefund, payColor, onPay, onClose, onClear, showClose, showGrab,
}) {
  const selLine = items.find((o) => o.uid === selectedUid);
  return (
    <div className="m-order">
      {showGrab && <div className="m-grab"><i /></div>}
      <div className="m-order__head">
        <div>
          <h2>Current Order</h2>
          <span className="sub">#{orderNo} · {items.reduce((s, o) => s + o.qty, 0)} items</span>
        </div>
        {items.length > 0 && <button className="m-order__clear" onClick={onClear}><ion-icon name="trash-outline"></ion-icon>Clear</button>}
        {showClose && <button className="m-order__close" onClick={onClose}><ion-icon name={device === 'tabp' ? 'arrow-forward-outline' : 'chevron-down-outline'}></ion-icon></button>}
      </div>

      <MTicket items={items} selectedUid={selectedUid} buffer={buffer} mode={mode}
        onSelect={onSelect} onStep={onStep} onRemove={onRemove} />

      {editing && selLine && (
        <MEditor line={selLine} mode={mode} onMode={onMode} onKey={onKey} onDone={onCloseEditor} />
      )}

      <MTotals subtotal={subtotal} tax={tax} total={total} />
      {showLoyalty && items.length > 0 && !editing && <MLoyalty won={won} newTotal={loyaltyTotal} />}
      {!editing && <MQuick onReward={onReward} onDiscount={onDiscount} onRefund={onRefund} />}
      <button className="m-charge" disabled={items.length === 0} onClick={onPay}
        style={items.length ? { background: payColor, boxShadow: `0 6px 14px ${payColor}47` } : undefined}>
        <ion-icon name="card-outline"></ion-icon>Charge<span className="amt">{money(total)}</span>
      </button>
    </div>
  );
}

/* ---------------- BOTTOM ORDER BAR (phone) ---------------- */
function MOrderBar({ itemCount, total, onOpen }) {
  return (
    <div className="m-orderbar">
      <div className="m-orderbar__cart">
        <ion-icon name="cart-outline"></ion-icon>
        <span className="ct">{itemCount}</span>
      </div>
      <div className="m-orderbar__txt">
        <span className="k">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        <span className="v">{money(total)}</span>
      </div>
      <button className="m-orderbar__go" onClick={onOpen}>View order<ion-icon name="chevron-up-outline"></ion-icon></button>
    </div>
  );
}

/* ---------------- CHARGE / TENDER SHEET ---------------- */
function MChargeSheet({ total, onDone, onClose }) {
  const [tender, setTender] = React.useState('card');
  const [paid, setPaid] = React.useState(false);
  const tenders = [
    { id: 'cash', label: 'Cash', icon: 'cash-outline' },
    { id: 'card', label: 'Card', icon: 'card-outline' },
    { id: 'wallet', label: 'Wallet', icon: 'phone-portrait-outline' },
    { id: 'loyalty', label: 'Loyalty', icon: 'star-outline' },
  ];
  if (paid) {
    return (
      <div className="m-csheet-scrim" onClick={onDone}>
        <div className="m-csheet" onClick={(e) => e.stopPropagation()}>
          <div className="m-paid">
            <div className="m-paid__icon"><ion-icon name="checkmark-circle"></ion-icon></div>
            <h3>Payment Successful</h3>
            <p className="sub">{money(total)} · {tenders.find((x) => x.id === tender).label}</p>
          </div>
          <div className="m-csheet__act">
            <button className="m-btn-fill" style={{ flex: 1 }} onClick={onDone}>New Order</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="m-csheet-scrim" onClick={onClose}>
      <div className="m-csheet" onClick={(e) => e.stopPropagation()}>
        <div className="m-csheet__grab" />
        <h3>Charge Order</h3>
        <p className="sub">Select a payment method to tender.</p>
        <div className="m-csheet__amt">{money(total)}</div>
        <div className="m-tenders">
          {tenders.map((t) => (
            <button key={t.id} className={'m-tender' + (tender === t.id ? ' sel' : '')} onClick={() => setTender(t.id)}>
              <ion-icon name={t.icon}></ion-icon>{t.label}
            </button>
          ))}
        </div>
        <div className="m-csheet__act">
          <button className="m-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="m-btn-fill" onClick={() => setPaid(true)}>Validate {money(total)}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  money, qtyStr, MHeader, MCatalog, MTile, MTicket, MLine, MEditor,
  MTotals, MLoyalty, MQuick, MOrderPanel, MOrderBar, MChargeSheet,
});
