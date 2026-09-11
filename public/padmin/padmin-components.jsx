/* Koomzo POS — Products admin: presentational components
   Desktop data table + shared product detail + phone card list.
   Photo art reuses the POS icon-on-tint vocabulary (no image deps). */

const paMoney = (n) => window.KZ_LOCALE.short(n);
const paInt = (n) => window.KZ_LOCALE.int(n);

/* ---- shared bits ---- */
function Photo({ product, size, className }) {
  const s = size || 40;
  return (
    <div className={className} style={{ width: s, height: s, background: product.tint.bg }}>
      <ion-icon name={product.icon} style={{ color: product.tint.fg }}></ion-icon>
    </div>
  );
}

function StockCell({ qty, reorder, status, mode }) {
  const st = window.KZ_PA_STATUS[status];
  if (mode === 'bar') {
    const pct = Math.max(4, Math.min(100, Math.round((qty / Math.max(reorder * 3, qty, 1)) * 100)));
    return (
      <div className="pa-stockbar">
        <div className="pa-stockbar__top">
          <b>{paInt(qty)}</b>
          <span style={{ color: st.ink }}>{status === 'ok' ? 'OK' : status === 'low' ? 'Low' : 'Out'}</span>
        </div>
        <div className="pa-stockbar__track"><div className="pa-stockbar__fill" style={{ width: pct + '%', background: st.dot }} /></div>
      </div>
    );
  }
  return (
    <span className="pa-stock" style={{ background: st.wash, color: st.ink }}>
      <i style={{ background: st.dot }} />{paInt(qty)}
    </span>
  );
}

function Check({ on }) {
  return <span className={'pa-check' + (on ? ' on' : '')}><ion-icon name="checkmark-outline"></ion-icon></span>;
}

/* ============================================================
   DESKTOP — chrome
   ============================================================ */
function PaRail() {
  const items = [
    { icon: 'grid-outline', label: 'Home', href: 'Koomzo POS - Home.html' },
    { icon: 'cart-outline', label: 'Register', href: 'Koomzo POS.html' },
    { icon: 'pricetags-outline', label: 'Products', active: true },
    { icon: 'barcode-outline', label: 'Labels', href: 'Koomzo POS - Barcode Labels.html' },
    { icon: 'people-outline', label: 'Customers', href: 'Koomzo POS - Users.html' },
  ];
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="storefront"></ion-icon></a>
      {items.map((it) => (
        it.href
          ? <a key={it.label} className="pa-rail__item" href={it.href}><ion-icon name={it.icon}></ion-icon>{it.label}</a>
          : <button key={it.label} className={'pa-rail__item' + (it.active ? ' active' : '')}><ion-icon name={it.icon}></ion-icon>{it.label}</button>
      ))}
      <div className="pa-rail__spacer" />
      <a className="pa-rail__item" href="Koomzo POS - Settings.html"><ion-icon name="settings-outline"></ion-icon>Settings</a>
    </nav>
  );
}

function PaTopbar() {
  return (
    <header className="pa-topbar">
      <div className="pa-topbar__crumb">
        <ion-icon name="server-outline"></ion-icon>
        Data Center
        <ion-icon name="chevron-forward-outline"></ion-icon>
        <b>Products</b>
      </div>
      <div className="pa-topbar__right">
        <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
        <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
        <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
      </div>
    </header>
  );
}

/* ============================================================
   DESKTOP — table
   ============================================================ */
const PA_COLS = [
  { id: 'name',    label: 'Item',        sort: true },
  { id: 'sku',     label: 'SKU',         min: 'tablet' },
  { id: 'barcode', label: 'Barcode',     min: 'desktop' },
  { id: 'cost',    label: 'Cost',        sort: true, num: true },
  { id: 'price',   label: 'Price',       sort: true, num: true },
  { id: 'brand',   label: 'Brand',       min: 'desktop' },
  { id: 'type',    label: 'Type',        min: 'tablet' },
  { id: 'qty',     label: 'In Stock',    sort: true, num: true },
  { id: 'loc',     label: 'Location',    min: 'desktop' },
];

function PaTable({ rows, selected, sort, onSort, onToggle, onToggleAll, onOpen, stockMode, isTablet }) {
  const allOn = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const cols = PA_COLS.filter((c) => !(isTablet && c.min === 'desktop'));
  return (
    <table className="pa-table">
      <thead>
        <tr>
          <th className="pa-th-check"><button style={{ border: 'none', background: 'transparent', padding: 0 }} onClick={onToggleAll}><Check on={allOn} /></button></th>
          <th style={{ width: 56 }}>Photo</th>
          {cols.map((c) => (
            <th key={c.id} className={(c.num ? 'num' : '') + (sort.key === c.id ? ' sorted' : '')}>
              {c.sort ? (
                <span className="sorth" onClick={() => onSort(c.id)}>
                  {c.label}
                  <ion-icon name={sort.key === c.id ? (sort.dir === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline') : 'swap-vertical-outline'}></ion-icon>
                </span>
              ) : c.label}
            </th>
          ))}
          <th style={{ width: 96, textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => {
          const on = selected.has(p.id);
          return (
            <tr key={p.id} className={on ? 'sel' : ''} onClick={() => onOpen(p.id)}>
              <td onClick={(e) => { e.stopPropagation(); onToggle(p.id); }}><Check on={on} /></td>
              <td><Photo product={p} size={40} className="pa-photo" /></td>
              <td>
                <div className="pa-name"><b>{p.name}</b><small>{p.desc}</small></div>
              </td>
              {cols.find((c) => c.id === 'sku') && <td><span className="pa-mono">{p.sku}</span></td>}
              {cols.find((c) => c.id === 'barcode') && <td><span className="pa-mono">{p.barcode}</span></td>}
              <td className="num"><span className="pa-mono">{paMoney(p.cost)}</span></td>
              <td className="num"><span className="pa-money">{paMoney(p.price)}</span></td>
              {cols.find((c) => c.id === 'brand') && <td>{p.brand ? <span className="pa-tag">{p.brand}</span> : <span style={{ color: 'var(--kz-muted-3)' }}>—</span>}</td>}
              {cols.find((c) => c.id === 'type') && <td><span style={{ color: 'var(--kz-muted)' }}>{p.type}</span></td>}
              <td className="num"><StockCell qty={p.qty} reorder={p.reorder} status={p.status} mode={stockMode} /></td>
              {cols.find((c) => c.id === 'loc') && <td><span style={{ color: 'var(--kz-muted)', fontSize: 13 }}>{p.loc}</span></td>}
              <td>
                <div className="pa-rowact">
                  <button className="pa-rowbtn" title="Print label" onClick={(e) => { e.stopPropagation(); window.location.href = 'Koomzo POS - Barcode Labels.html'; }}><ion-icon name="print-outline"></ion-icon></button>
                  <button className="pa-rowbtn" title="Edit" onClick={(e) => { e.stopPropagation(); onOpen(p.id); }}><ion-icon name="create-outline"></ion-icon></button>
                  <button className="pa-rowbtn danger" title="Delete" onClick={(e) => { e.stopPropagation(); alert('Delete ' + p.name + '?'); }}><ion-icon name="trash-outline"></ion-icon></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ============================================================
   SHARED — product detail (drawer body on desktop, full screen on phone)
   ============================================================ */
function ProductDetail({ draft, isNew, isPhone, onField, onStep, onClose, onSave, onDelete }) {
  const st = window.KZ_PA_STATUS[window.statusOf ? window.statusOf(draft.qty, draft.reorder) : draft.status];
  const status = draft.qty <= 0 ? 'out' : draft.qty <= draft.reorder ? 'low' : 'ok';
  const stt = window.KZ_PA_STATUS[status];
  const margin = +(draft.price - draft.cost).toFixed(2);
  const marginPct = draft.price > 0 ? Math.round((margin / draft.price) * 100) : 0;
  // split total qty across up to two believable bins
  const locs = draft.qty > 0
    ? [{ name: draft.loc, q: Math.ceil(draft.qty * 0.7) }, { name: 'Back Room · R1', q: Math.floor(draft.qty * 0.3) }].filter((l) => l.q > 0)
    : [{ name: draft.loc, q: 0 }];

  return (
    <div className="pd">
      <div className="pd__head">
        {isPhone
          ? <button className="pd__back" onClick={onClose}><ion-icon name="chevron-back-outline"></ion-icon></button>
          : null}
        <div>
          <div className="eyebrow">{isNew ? 'New item' : 'Edit item'}</div>
          <h2>{isNew ? 'Add product' : draft.name}</h2>
        </div>
        {!isPhone && <button className="pd__close" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>}
      </div>

      <div className="pd__body">
        <div className="pd__hero">
          <Photo product={draft} size={76} className="pd__photo" />
          <div className="pd__hero-t">
            <h3>{draft.name || 'Untitled item'}</h3>
            <div className="pd__hero-meta">
              <span className="pa-stock" style={{ background: stt.wash, color: stt.ink }}><i style={{ background: stt.dot }} />{stt.label}</span>
              <span className="pa-tag">{draft.type}</span>
            </div>
          </div>
        </div>

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="cube-outline"></ion-icon>Details</div>
          <div className="pd__field">
            <label>Product name</label>
            <input className="pd__input" value={draft.name} onChange={(e) => onField('name', e.target.value)} placeholder="e.g. Sunflower Oil 5L" />
          </div>
          <div className="pd__field">
            <label>Description</label>
            <input className="pd__input" value={draft.desc} onChange={(e) => onField('desc', e.target.value)} placeholder="Short description" />
          </div>
          <div className="pd__grid2">
            <div className="pd__field"><label>SKU</label><input className="pd__input mono" value={draft.sku} onChange={(e) => onField('sku', e.target.value)} /></div>
            <div className="pd__field"><label>Barcode</label><input className="pd__input mono" value={draft.barcode} onChange={(e) => onField('barcode', e.target.value)} /></div>
          </div>
          <div className="pd__grid2">
            <div className="pd__field">
              <label>Brand</label>
              <select className="pd__input" value={draft.brand} onChange={(e) => onField('brand', e.target.value)}>
                {window.KZ_PA_BRANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="pd__field">
              <label>Type</label>
              <select className="pd__input" value={draft.type} onChange={(e) => onField('type', e.target.value)}>
                {window.KZ_PA_TYPES.map((tp) => <option key={tp}>{tp}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="pricetag-outline"></ion-icon>Pricing</div>
          <div className="pd__grid2">
            <div className="pd__field">
              <label>Unit cost</label>
              <div className="pd__money-in"><span>F</span><input className="pd__input mono" type="number" step="100" value={draft.cost} onChange={(e) => onField('cost', Math.max(0, Number(e.target.value)))} /></div>
            </div>
            <div className="pd__field">
              <label>Selling price</label>
              <div className="pd__money-in"><span>F</span><input className="pd__input mono" type="number" step="100" value={draft.price} onChange={(e) => onField('price', Math.max(0, Number(e.target.value)))} /></div>
            </div>
          </div>
          <div className="pd__margin">
            <span className="k">Margin per unit</span>
            <span><span className="v">{paMoney(margin)}</span><span className="pct">{marginPct}%</span></span>
          </div>
        </div>

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="layers-outline"></ion-icon>Inventory</div>
          <div className="pd__qtyrow">
            <div className="lbl"><b>{paInt(draft.qty)}</b><small>units on hand · reorder at {draft.reorder}</small></div>
            <div className="pd__step">
              <button onClick={() => onStep(-1)}><ion-icon name="remove-outline"></ion-icon></button>
              <span className="v">{paInt(draft.qty)}</span>
              <button onClick={() => onStep(1)}><ion-icon name="add-outline"></ion-icon></button>
            </div>
          </div>
          <div className="pd__field" style={{ marginTop: 14 }}>
            <label>Default location</label>
            <select className="pd__input" value={draft.loc} onChange={(e) => onField('loc', e.target.value)}>
              {window.KZ_PA_LOCS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 6 }}>
            {locs.map((l, i) => (
              <div className="pd__loc" key={i}>
                <div className="pd__loc-ico"><ion-icon name="location-outline"></ion-icon></div>
                <div className="pd__loc-t"><b>{l.name}</b><small>Shelf stock</small></div>
                <div className="pd__loc-q">{paInt(l.q)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pd__foot">
        {!isNew && <button className="ghost" title="Delete item" onClick={onDelete}><ion-icon name="trash-outline"></ion-icon></button>}
        {isPhone ? <button className="pd__cancel" onClick={onClose}>Cancel</button> : null}
        <button className="pd__save" onClick={onSave}><ion-icon name="checkmark-outline"></ion-icon>{isNew ? 'Add item' : 'Save changes'}</button>
      </div>
    </div>
  );
}

/* ============================================================
   PHONE — card list
   ============================================================ */
function MobileList({ rows, counts, cats, activeCat, query, onQuery, onCat, onOpen, onAdd, stockMode }) {
  return (
    <div className="pam">
      <header className="pam__head">
        <div className="mk"><ion-icon name="storefront"></ion-icon></div>
        <div className="ht">
          <h1>Products</h1>
          <span className="sub">{counts.total} items · {counts.low + counts.out} need attention</span>
        </div>
        <button className="pam__iconbtn" title="Scan"><ion-icon name="scan-outline"></ion-icon></button>
      </header>

      <label className="pam__search">
        <ion-icon name="search-outline"></ion-icon>
        <input placeholder="Search name, SKU, barcode" value={query} onChange={(e) => onQuery(e.target.value)} />
        {query && <button style={{ border: 'none', background: 'transparent', color: 'var(--kz-muted-3)' }} onClick={() => onQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
      </label>

      <div className="pam__cats">
        {cats.map((c) => (
          <button key={c.id} className={'pam__chip' + (activeCat === c.id ? ' active' : '')} onClick={() => onCat(c.id)}>
            <ion-icon name={c.icon}></ion-icon>{c.label}
          </button>
        ))}
      </div>

      <div className="pam__sum">
        <div className="pam__stat"><div className="k">Items</div><div className="v">{counts.total}</div></div>
        <div className="pam__stat"><div className="k">Low</div><div className="v low">{counts.low}</div></div>
        <div className="pam__stat"><div className="k">Out</div><div className="v out">{counts.out}</div></div>
      </div>

      <div className="pam__list">
        {rows.length === 0 && (
          <div className="pa-empty" style={{ paddingTop: 60 }}><ion-icon name="search-outline"></ion-icon><p>No items match.</p></div>
        )}
        {rows.map((p) => (
          <button key={p.id} className="pam__card" onClick={() => onOpen(p.id)}>
            <Photo product={p} size={50} className="pam__card-photo" />
            <div className="pam__card-body">
              <div className="nm">{p.name}</div>
              <div className="sku">{p.sku}</div>
              <div className="row2">
                <span className="pam__card-price">{paMoney(p.price)}</span>
                <StockCell qty={p.qty} reorder={p.reorder} status={p.status} mode={stockMode} />
              </div>
            </div>
            <div className="pam__card-right">
              <ion-icon name="chevron-forward-outline" style={{ fontSize: 20, color: 'var(--kz-muted-3)' }}></ion-icon>
            </div>
          </button>
        ))}
      </div>

      <button className="pam__fab" onClick={onAdd}><ion-icon name="add-outline"></ion-icon>Add item</button>
    </div>
  );
}

Object.assign(window, {
  paMoney, paInt, Photo, StockCell, Check,
  PaRail, PaTopbar, PaTable, PA_COLS, ProductDetail, MobileList,
});
