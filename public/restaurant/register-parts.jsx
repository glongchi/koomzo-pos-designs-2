/* ============================================================
   Koomzo POS Suite — REGISTER sub-components
   ============================================================ */

/* context header: table / tab / guests / courses */
function OrderContext({ vertical, flags, activeTable, tableState, guests, setGuests, tabName, setTabName, onPickTable, courseNums, activeCourse, setActiveCourse, onAddCourse, courseName }) {
  return (
    <div className="octx">
      <div className="octx__row">
        {flags.tables && (
          <button className={'octx__pill lead'} onClick={onPickTable}>
            <ion-icon name="grid-outline"></ion-icon>
            {activeTable ? <span>Table {tableLabel(activeTable)}</span> : <span>Select table<small> · walk-in</small></span>}
          </button>
        )}
        {flags.tabs && (
          <button className="octx__pill lead" onClick={() => { const n = prompt('Tab name', tabName); if (n) setTabName(n); }}>
            <ion-icon name="bookmark-outline"></ion-icon>{tabName}
          </button>
        )}
        {!flags.tables && !flags.tabs && (
          <span className="octx__pill lead"><ion-icon name="bag-handle-outline"></ion-icon>Counter sale</span>
        )}
        {flags.guests && (
          <div className="octx__guests">
            <button className="octx__step" onClick={() => setGuests((g) => Math.max(1, g - 1))}><ion-icon name="remove"></ion-icon></button>
            <span className="octx__gval"><ion-icon name="people-outline"></ion-icon>{guests}</span>
            <button className="octx__step" onClick={() => setGuests((g) => g + 1)}><ion-icon name="add"></ion-icon></button>
          </div>
        )}
      </div>

      {flags.courses && (
        <div className="octx__row" style={{ marginTop: 10, gap: 6 }}>
          {courseNums.map((n) => (
            <button key={n} className={'octx__pill' + (activeCourse === n ? ' lead' : '')} style={{ height: 34, padding: '0 12px', fontSize: 13 }} onClick={() => setActiveCourse(n)}>
              <ion-icon name="restaurant-outline" style={{ fontSize: 15 }}></ion-icon>{courseName(n).replace(' Course', '')}
            </button>
          ))}
          <button className="octx__pill" style={{ height: 34, padding: '0 12px', fontSize: 13, color: 'var(--kz-muted)' }} onClick={onAddCourse}>
            <ion-icon name="add" style={{ fontSize: 16 }}></ion-icon>Course
          </button>
        </div>
      )}
    </div>
  );
}

/* one order line */
function OrderLine({ o, flags, selected, buffer, mode, unitWord, onSelect, onStep, onRemove }) {
  const unit = o.priceOverride != null ? o.priceOverride : o.price;
  const lineTotal = unit * o.qty * (1 - o.discPct / 100);
  let qtyDisp = qtyStr(o.qty), unitDisp = money(unit), discDisp = o.discPct;
  if (selected && buffer !== null) {
    if (mode === 'qty') qtyDisp = buffer === '' ? '0' : buffer;
    if (mode === 'price') unitDisp = window.KZ_LOCALE.short(buffer === '' ? 0 : buffer);
    if (mode === 'disc') discDisp = buffer === '' ? '0' : buffer;
  }
  return (
    <div className={'oline' + (selected ? ' sel' : '') + (o.fired ? ' fired' : '')} onClick={() => onSelect(o.uid)}>
      <div className="oline__top">
        <span className="oline__qty">{qtyDisp}×</span>
        <span className="oline__name">{o.name}</span>
        <span className="oline__price">{money(lineTotal)}</span>
      </div>
      <div className="oline__sub">
        <span className="unit"><b>{unitDisp}</b>{unitWord ? ' / ' + unitWord : ''}</span>
        {o.discPct > 0 && <span className="oline__disc">−{discDisp}%</span>}
        <TagChips tags={o.tags} />
        {o.fired && <span className="oline__fired"><ion-icon name="flame"></ion-icon>Fired</span>}
        {selected && !o.fired && (
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 0 }} onClick={(e) => e.stopPropagation()}>
            <button className="octx__step" style={{ width: 30, height: 30, borderRadius: '8px 0 0 8px' }} onClick={() => o.qty <= 1 ? onRemove(o.uid) : onStep(o.uid, -1)}><ion-icon name={o.qty <= 1 ? 'trash-outline' : 'remove'}></ion-icon></button>
            <button className="octx__step" style={{ width: 30, height: 30, borderRadius: '0 8px 8px 0', borderLeft: 'none' }} onClick={() => onStep(o.uid, 1)}><ion-icon name="add"></ion-icon></button>
          </span>
        )}
      </div>
      {o.notes && <div className="oline__note"><ion-icon name="chatbubble-ellipses-outline"></ion-icon>{o.notes}</div>}
    </div>
  );
}

function OrderTicket({ order, flags, selectedUid, buffer, mode, unitWord, courseNums, courseName, onSelect, onStep, onRemove, onFire }) {
  if (order.length === 0) {
    return (
      <div className="oticket">
        <div className="oticket__empty">
          <ion-icon name="receipt-outline"></ion-icon>
          <p>No items yet — tap a product to start the order.</p>
        </div>
      </div>
    );
  }
  if (!flags.courses) {
    return (
      <div className="oticket">
        {order.map((o) => <OrderLine key={o.uid} o={o} flags={flags} selected={o.uid === selectedUid} buffer={buffer} mode={mode} unitWord={unitWord} onSelect={onSelect} onStep={onStep} onRemove={onRemove} />)}
      </div>
    );
  }
  return (
    <div className="oticket">
      {courseNums.map((n) => {
        const items = order.filter((o) => o.course === n);
        if (!items.length) return null;
        const hasUnfired = items.some((o) => !o.fired && o.station !== 'bar');
        return (
          <div key={n}>
            <div className="course-div">
              <span className="course-div__lbl"><ion-icon name="restaurant-outline"></ion-icon>{courseName(n)}</span>
              <span className="course-div__line"></span>
              {hasUnfired && <button className="oline__fired" style={{ cursor: 'pointer', background: 'var(--kz-ink)', color: '#fff' }} onClick={() => onFire(n)}><ion-icon name="flame"></ion-icon>Fire</button>}
            </div>
            {items.map((o) => <OrderLine key={o.uid} o={o} flags={flags} selected={o.uid === selectedUid} buffer={buffer} mode={mode} unitWord={unitWord} onSelect={onSelect} onStep={onStep} onRemove={onRemove} />)}
          </div>
        );
      })}
    </div>
  );
}

function OrderTotals({ totals, svcRate }) {
  return (
    <div className="ototals">
      <div className="ototals__row sm"><span className="k">Subtotal</span><span className="v">{money(totals.net)}</span></div>
      {svcRate > 0 && <div className="ototals__row sm svc"><span className="k">Service ({svcRate}%)</span><span className="v">{money(totals.svc)}</span></div>}
      <div className="ototals__row sm"><span className="k">{window.KZ_LOCALE.vatLabel}</span><span className="v">{money(totals.tax)}</span></div>
      <div className="ototals__row tot"><span className="k">Total</span><span className="v">{money(totals.total)}</span></div>
    </div>
  );
}

/* product tile */
function ProductTile({ p, qty, onAdd, unitWord }) {
  return (
    <button className="ptile" onClick={() => onAdd(p)}>
      {qty > 0 && <span className="ptile__badge" key={qty}>{qty}</span>}
      <div className="ptile__art" style={{ background: p.tint.bg }}>
        <ion-icon name={p.icon} style={{ color: p.tint.fg }}></ion-icon>
        {p.tags && p.tags.length > 0 && <span className="ptile__tags"><TagChips tags={p.tags.slice(0, 2)} /></span>}
        <span className="ptile__add"><ion-icon name="add"></ion-icon></span>
      </div>
      <div className="ptile__meta">
        <div className="ptile__name">{p.name}</div>
        <div className="ptile__desc">{p.desc}</div>
        <div className="ptile__price">{money(p.price)}{p.unit && unitWord && <small> / {unitWord.toLowerCase()}</small>}</div>
      </div>
    </button>
  );
}

/* edit dock (numpad) */
function EditDock({ line, mode, onMode, onKey, onClose, unitWord }) {
  const unit = line.priceOverride != null ? line.priceOverride : line.price;
  const hint = mode === 'qty' ? 'Quantity' : mode === 'disc' ? 'Line discount %' : 'Unit price';
  return (
    <div className="editdock">
      <div className="editdock__info">
        <div className="editdock__name">{line.name}</div>
        <div className="editdock__hint">{hint} · {qtyStr(line.qty)} × {money(unit)}{line.discPct > 0 ? `  −${line.discPct}%` : ''}</div>
        <div className="editdock__modes">
          {[['qty', 'Qty'], ['disc', '% Disc'], ['price', 'Price']].map(([id, lbl]) => (
            <button key={id} className={mode === id ? 'active' : ''} onClick={() => onMode(id)}>{lbl}</button>
          ))}
        </div>
      </div>
      <div className="editpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => <button key={k} onClick={() => onKey(k)}>{k}</button>)}
        <button className="fn" onClick={() => onKey('+/-')}>+/−</button>
        <button onClick={() => onKey('0')}>0</button>
        <button className="fn" onClick={() => onKey('.')}>.</button>
      </div>
      <button className="editdock__close" onClick={onClose}><ion-icon name="close"></ion-icon></button>
    </div>
  );
}

Object.assign(window, { OrderContext, OrderLine, OrderTicket, OrderTotals, ProductTile, EditDock });
