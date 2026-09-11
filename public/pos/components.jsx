/* Koomzo POS — presentational components (Odoo-arranged) */
const money = (n) => window.KZ_LOCALE.short(n);
const qtyStr = (n) => {
  // integers show as "1", decimals keep up to 3 places trimmed
  return Number.isInteger(n) ? String(n) : String(+n.toFixed(3));
};

/* ---------------- TOP BAR ---------------- */
function TopBar({ orderNo, cashier }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__mark"><ion-icon name="storefront"></ion-icon></div>
        <div className="brand__name">koomzo<span> · POS</span></div>
      </div>
      <span className="topbar__order">Order #{orderNo}</span>
      <div className="topbar__right">
        <button className="iconbtn" title="Receipts"><ion-icon name="receipt-outline"></ion-icon></button>
        <button className="iconbtn" title="Menu"><ion-icon name="grid-outline"></ion-icon></button>
        <span className="topbar__sync"><ion-icon name="wifi-outline"></ion-icon>Synced</span>
        <div className="topbar__user">
          <span className="nm">{cashier}</span>
          <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ion-icon name="person" style={{ color: 'var(--kz-primary)', fontSize: '18px' }}></ion-icon>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   RIGHT — PRODUCT BROWSER
   ============================================================ */
function Breadcrumb({ category, onHome }) {
  return (
    <div className="crumbs">
      <button className="crumb home" onClick={onHome} title="All products"><ion-icon name="home-outline"></ion-icon></button>
      {category && (
        <>
          <span className="crumbs__sep"><ion-icon name="chevron-forward-outline" style={{ fontSize: '14px' }}></ion-icon></span>
          <button className="crumb cur"><ion-icon name={category.icon.replace('-outline', '')}></ion-icon>{category.label}</button>
        </>
      )}
    </div>
  );
}

function ProductTile({ product, qty, onAdd, listMode }) {
  return (
    <button className="tile" onClick={() => onAdd(product)}>
      {qty > 0 && <span className="tile__badge" key={qty}>{qty}</span>}
      <div className="tile__art" style={{ background: product.tint.bg }}>
        <ion-icon name={product.icon} style={{ color: product.tint.fg }}></ion-icon>
        {!listMode && <span className="tile__info"><ion-icon name="information-circle-outline"></ion-icon></span>}
      </div>
      <div className="tile__meta">
        <div className="tile__name">{product.name}</div>
        <div className="tile__desc">{product.desc}</div>
        <div className="tile__price">{money(product.price)}{product.unit && <small> / Units</small>}</div>
      </div>
    </button>
  );
}

function Catalog({ products, category, categories, activeCat, query, onQuery, onCat, qtyFor, onAdd, listMode }) {
  return (
    <section className="catalog">
      <div className="catalog__bar">
        <Breadcrumb category={category} onHome={() => onCat('all')} />
        <label className="catalog__search">
          <ion-icon name="search-outline" style={{ fontSize: '18px' }}></ion-icon>
          <input placeholder="Search products" value={query} onChange={(e) => onQuery(e.target.value)} />
          {query && <button className="iconbtn" style={{ width: 26, height: 26, border: 'none', background: 'transparent' }} onClick={() => onQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
        </label>
      </div>

      <div className="cats">
        <button className={'cats__chip' + (activeCat === 'all' ? ' active' : '')} onClick={() => onCat('all')}>
          <ion-icon name="apps-outline"></ion-icon>All
        </button>
        {categories.map((c) => (
          <button key={c.id} className={'cats__chip' + (activeCat === c.id ? ' active' : '')} onClick={() => onCat(c.id)}>
            <ion-icon name={c.icon}></ion-icon>{c.label}
          </button>
        ))}
      </div>

      <div className="catalog__scroll">
        <div className={'grid' + (listMode ? ' list' : '')}>
          {products.map((p) => (
            <ProductTile key={p.id} product={p} qty={qtyFor(p.id)} onAdd={onAdd} listMode={listMode} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LEFT — ORDER TICKET (selected items)
   ============================================================ */
function OrderLine({ item, selected, buffer, mode, onSelect }) {
  const unit = item.priceOverride != null ? item.priceOverride : item.price;
  const lineTotal = unit * item.qty * (1 - item.discPct / 100);
  // live buffer preview on the selected line
  let qtyDisp = qtyStr(item.qty), unitDisp = money(unit), discDisp = item.discPct;
  if (selected && buffer !== null) {
    if (mode === 'qty') qtyDisp = buffer === '' ? '0' : buffer;
    if (mode === 'price') unitDisp = window.KZ_LOCALE.short(buffer === '' ? 0 : buffer);
    if (mode === 'disc') discDisp = buffer === '' ? '0' : buffer;
  }
  return (
    <button className={'line' + (selected ? ' sel' : '')} onClick={() => onSelect(item.uid)}>
      <div className="line__top">
        <span className="line__name">{item.name}</span>
        <span className="line__price">{money(lineTotal)}</span>
      </div>
      <div className="line__sub">
        <b>{qtyDisp}</b> Units × <b>{unitDisp}</b> / Units
        {item.discPct > 0 && <span className="line__disc">− {discDisp}%</span>}
      </div>
    </button>
  );
}

function Ticket({ items, selectedUid, buffer, mode, onSelect }) {
  if (items.length === 0) {
    return (
      <div className="ticket">
        <div className="ticket__empty">
          <ion-icon name="cart-outline"></ion-icon>
          <p>No items yet — tap a product to start the order.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="ticket">
      {items.map((it) => (
        <OrderLine key={it.uid} item={it} selected={it.uid === selectedUid} buffer={buffer} mode={mode} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ---------------- TOTALS ---------------- */
function Totals({ total, tax }) {
  return (
    <div className="totals">
      <div className="totals__row totals__total"><span className="k">Total:</span><span className="v">{money(total)}</span></div>
      <div className="totals__row totals__tax"><span className="k">Taxes:</span><span className="v">{money(tax)}</span></div>
    </div>
  );
}

/* ---------------- LOYALTY ---------------- */
function Loyalty({ won, newTotal }) {
  return (
    <div className="loyalty">
      <div className="loyalty__title">Loyalty Points</div>
      <div className="loyalty__cards">
        <div className="loyalty__card">
          <div className="lbl">Points Won</div>
          <div className="val up">+{won.toFixed(1)}</div>
        </div>
        <div className="loyalty__card">
          <div className="lbl">New Total</div>
          <div className="val tot">{newTotal.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ACTION ROW ---------------- */
function Actions({ onReward, onDiscount, onRefund }) {
  return (
    <div className="actions">
      <button className="refund" onClick={onRefund}><ion-icon name="arrow-undo-outline"></ion-icon>Refund</button>
      <button className="reward" onClick={onReward}><ion-icon name="star-outline"></ion-icon>Reward</button>
      <button onClick={onDiscount}><ion-icon name="pricetag-outline"></ion-icon>Discount</button>
    </div>
  );
}

/* ---------------- CASHPAD (customer + pay + numpad) ---------------- */
function Cashpad({ customer, mode, onMode, onKey, total, canPay, onPay, payColor }) {
  const Mode = ({ id, label }) => (
    <button className={'mode' + (mode === id ? ' active' : '')} onClick={() => onMode(id)}>{label}</button>
  );
  return (
    <div className="cashpad">
      <div className="cashpad__side">
        <button className="customer">
          <span className="customer__avatar"><ion-icon name="person-outline"></ion-icon></span>
          <span className="customer__name">{customer}<small>Loyalty member</small></span>
        </button>
        <button className="pay" disabled={!canPay} onClick={onPay} style={canPay ? { background: payColor } : undefined}>
          <ion-icon className="pay__chev" name="chevron-forward-outline"></ion-icon>
          Payment
          <span className="pay__amt">{money(total)}</span>
        </button>
      </div>
      <div className="numpad">
        <button onClick={() => onKey('1')}>1</button>
        <button onClick={() => onKey('2')}>2</button>
        <button onClick={() => onKey('3')}>3</button>
        <Mode id="qty" label="Qty" />

        <button onClick={() => onKey('4')}>4</button>
        <button onClick={() => onKey('5')}>5</button>
        <button onClick={() => onKey('6')}>6</button>
        <Mode id="disc" label="% Disc" />

        <button onClick={() => onKey('7')}>7</button>
        <button onClick={() => onKey('8')}>8</button>
        <button onClick={() => onKey('9')}>9</button>
        <Mode id="price" label="Price" />

        <button className="fn" onClick={() => onKey('+/-')}>+/−</button>
        <button onClick={() => onKey('0')}>0</button>
        <button className="fn" onClick={() => onKey('.')}>.</button>
        <button className="bksp" onClick={() => onKey('back')}><ion-icon name="backspace-outline"></ion-icon></button>
      </div>
    </div>
  );
}

Object.assign(window, {
  money, qtyStr, TopBar, Catalog, ProductTile, Breadcrumb,
  Ticket, OrderLine, Totals, Loyalty, Actions, Cashpad,
});
