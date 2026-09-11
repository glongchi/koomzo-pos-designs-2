/* Koomzo Inventory — shared primitives. Exported on window for the other babel scripts. */
const { useState, useMemo, useEffect } = React;

function Seg({ tabs, value, onChange }) {
  return (
    <div className="seg">
      {tabs.map(([id, label, n]) => (
        <button key={id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>
          {label}{n ? <i>{n}</i> : null}
        </button>
      ))}
    </div>
  );
}

function StockPill({ item, loc }) {
  if (!item.stock) return <span className="spill na">Not tracked</span>;
  const n = IV.onHand(item, loc), s = IV.status(item, loc);
  return <span className={'spill ' + s}><i></i>{qtyFmt(n, item.unit)}</span>;
}

function TypeChip({ item }) {
  if (item.type === 'service') return <span className="tchip service"><ion-icon name="time-outline"></ion-icon>Service</span>;
  if (item.type === 'composite') return <span className="tchip composite"><ion-icon name="layers-outline"></ion-icon>Composite</span>;
  if (item.type === 'nonstock') return <span className="tchip nonstock">Non-stock</span>;
  if (item.backbar) return <span className="tchip backbar">Back bar</span>;
  return null;
}

function Av({ item, size }) {
  const tint = item.tint || IV_TINTS.slate;
  const st = { background: tint.bg, color: tint.fg };
  if (size) { st.width = size; st.height = size; }
  return <div className="itav" style={st}><ion-icon name={item.icon || 'cube-outline'}></ion-icon></div>;
}

function Toggle({ on, onChange }) {
  return <button className={'sw2' + (on ? ' on' : '')} onClick={onChange} aria-pressed={on}></button>;
}

function Field({ label, value, onChange, hint, prefix, suffix, type, placeholder }) {
  return (
    <div>
      {label && <label className="flab">{label}</label>}
      <div className="field">
        {prefix && <span style={{ font: '600 13.5px var(--kz-font-num)', color: 'var(--kz-muted-2)' }}>{prefix}</span>}
        <input value={value} placeholder={placeholder} type={type || 'text'}
          onChange={(e) => onChange && onChange(type === 'number' ? +e.target.value : e.target.value)} />
        {suffix && <span style={{ font: '600 12.5px var(--kz-font-sans)', color: 'var(--kz-muted-3)' }}>{suffix}</span>}
      </div>
      {hint && <div className="fhint">{hint}</div>}
    </div>
  );
}

function KV({ k, v, num }) {
  return <div className="kv"><span className="k">{k}</span><span className={'v' + (num ? ' num' : '')}>{v}</span></div>;
}

function Risk({ tone, children }) { return <span className={'risk ' + tone}>{children}</span>; }

function LocBars({ item, cap }) {
  const max = Math.max(1, ...IV_LOCATIONS.map((l) => item.stock[l.id] || 0));
  const list = cap ? IV_LOCATIONS : IV_LOCATIONS.filter((l) => l.id === 'dt');
  return (
    <div>
      {list.map((l) => {
        const n = item.stock[l.id] || 0;
        const s = n <= 0 ? 'out' : (item.reorder != null && n <= item.reorder ? 'low' : '');
        return (
          <div className="locbar" key={l.id}>
            <span className="nm">{l.name}</span>
            <span className="track"><i className={s} style={{ width: Math.max(2, (n / max) * 100) + '%' }}></i></span>
            <span className="n">{qtyFmt(n, item.unit)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* a mini POS tile, used in the item's POS tab to show exactly what the register renders */
function PosTilePreview({ item }) {
  const tint = item.tint || IV_TINTS.slate;
  return (
    <div className="postile" style={{ maxWidth: 178 }}>
      <div className="postile__art" style={{ background: tint.bg, color: tint.fg }}>
        <ion-icon name={item.icon || 'cube-outline'}></ion-icon>
      </div>
      <div className="postile__m">
        <div className="n">{item.name}</div>
        <div className="s">{item.type === 'service' ? item.service.duration + ' min' : (item.brand || item.sku)}</div>
        <div className="p">{money(item.price)}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty" style={{ padding: '52px 24px' }}>
      <ion-icon name={icon}></ion-icon>
      <p><b style={{ display: 'block', color: 'var(--kz-ink-2)', font: '600 14px var(--kz-font-sans)' }}>{title}</b>{sub}</p>
    </div>
  );
}

Object.assign(window, { Seg, StockPill, TypeChip, Av, Toggle, Field, KV, Risk, LocBars, PosTilePreview, EmptyState });
