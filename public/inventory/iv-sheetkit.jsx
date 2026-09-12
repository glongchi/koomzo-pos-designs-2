/* Koomzo Inventory — sheet kit. Shared shells and editors every action sheet uses,
   so nine sheets stay consistent and none of them re-invents a line editor.
   `useIVRev` is the one subscription: any IVS.tx re-renders whatever is mounted. */

function useIVRev() {
  const [r, set] = useState(() => window.IVS.rev());
  useEffect(() => window.IVS.sub(set), []);
  return r;
}

/* toast host — a post must say what it wrote, in domain terms, not "Saved" */
function Toasts() {
  useIVRev();
  const list = window.IVS.toasts();
  useEffect(() => {
    if (!list.length) return;
    const t = setTimeout(() => window.IVS.drop(list[0].id), 4200);
    return () => clearTimeout(t);
  }, [list.length && list[0].id]);
  if (!list.length) return null;
  return (
    <div className="ivtoasts">
      {list.slice(-3).map((t) => (
        <div className={'ivtoast ' + t.tone} key={t.id}>
          <ion-icon name={t.tone === 'warn' ? 'alert-circle' : 'checkmark-circle'}></ion-icon>
          <span>{t.msg}</span>
          <button onClick={() => window.IVS.drop(t.id)}><ion-icon name="close-outline"></ion-icon></button>
        </div>
      ))}
    </div>
  );
}

/* one scrim + sheet, size by `w`: undefined | 'wide' | 'xl' */
function Sheet({ title, sub, w, onClose, foot, children }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet' + (w ? ' ' + w : '')} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>{title}</h3><p>{sub}</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">{children}</div>
        <div className="sheet__foot">{foot}</div>
      </div>
    </div>
  );
}

function Sel({ label, value, onChange, children, hint }) {
  return (
    <div>
      {label && <label className="flab">{label}</label>}
      <select className="sel wide" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
      {hint && <div className="fhint">{hint}</div>}
    </div>
  );
}

function Opts({ label, value, onChange, options, small }) {
  return (
    <div>
      {label && <span className="lbl">{label}</span>}
      <div className="opts">
        {options.map(([v, l, ic]) => (
          <button key={v} className={'opt' + (value === v ? ' on' : '')}
            style={small ? { height: 38, fontSize: 12.5 } : null} onClick={() => onChange(v)}>
            {ic && <ion-icon name={ic} style={{ fontSize: 15 }}></ion-icon>}{l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chips({ label, values, onToggle, options }) {
  return (
    <div>
      {label && <span className="lbl">{label}</span>}
      <div className="opts">
        {options.map(([v, l, ic]) => (
          <button key={v} className={'opt' + (values.indexOf(v) > -1 ? ' on' : '')}
            style={{ height: 38, fontSize: 12.5 }} onClick={() => onToggle(v)}>
            {ic && <ion-icon name={ic} style={{ fontSize: 15 }}></ion-icon>}{l}
          </button>
        ))}
      </div>
    </div>
  );
}

/* add-a-line control: search by name/SKU/barcode, click to add. Used by orders,
   counts and order-less receipts — the three places you build a line set by hand. */
function ItemAdd({ filter, exclude, onAdd, placeholder }) {
  const [q, setQ] = useState('');
  const pool = window.IV_ITEMS.filter((i) => (filter ? filter(i) : true) && exclude.indexOf(i.id) === -1);
  const s = q.trim().toLowerCase();
  const hits = s ? pool.filter((i) => (i.name + ' ' + i.sku + ' ' + (i.barcode || '')).toLowerCase().includes(s)).slice(0, 6) : [];
  return (
    <div>
      <div className="field">
        <ion-icon name="search-outline"></ion-icon>
        <input value={q} placeholder={placeholder || 'Add item by name, SKU or barcode'} onChange={(e) => setQ(e.target.value)} />
      </div>
      {s && (
        <div className="addpop">
          {hits.map((i) => (
            <button className="addrow" key={i.id} onClick={() => { onAdd(i); setQ(''); }}>
              <Av item={i} />
              <div><div className="nm">{i.name}</div><div className="ds">{i.sku} · {money(i.cost || 0)} cost</div></div>
              <div className="sp"></div>
              <ion-icon name="add-circle-outline"></ion-icon>
            </button>
          ))}
          {!hits.length && <div className="addnone">Nothing matches “{q}”</div>}
        </div>
      )}
    </div>
  );
}

/* editable order/receipt lines. cols: qty + cost, or qty only */
function LineRows({ lines, onQty, onCost, onDrop, right, head }) {
  return (
    <div className="lned">
      <div className="lnh">{head.map((h, n) => <div key={n} className={n ? 'r' : ''}>{h}</div>)}<div></div></div>
      {lines.map((l) => {
        const it = IV.item(l.id);
        return (
          <div className="lnr" key={l.id}>
            <div><div className="ln__n">{it.name}</div><div className="ln__s">{it.sku}{it.unit !== 'each' ? ' · ' + it.unit : ''}</div></div>
            <div><input className="numin" value={l.qty} onChange={(e) => onQty(l.id, e.target.value)} /></div>
            {onCost && <div><input className="numin" value={l.cost} onChange={(e) => onCost(l.id, e.target.value)} /></div>}
            <div className="r">{right ? right(l, it) : money((+l.qty || 0) * (+l.cost || 0))}</div>
            <div><button className="icbtn sm" onClick={() => onDrop(l.id)}><ion-icon name="trash-outline"></ion-icon></button></div>
          </div>
        );
      })}
      {!lines.length && <div className="addnone" style={{ padding: '18px 14px' }}>No lines yet.</div>}
    </div>
  );
}

function Warn({ tone, icon, children }) {
  return <div className={'hint' + (tone === 'bad' ? ' bad' : tone === 'warn' ? ' warn' : ' pri')}>
    <ion-icon name={icon || 'alert-circle-outline'}></ion-icon><span>{children}</span></div>;
}

Object.assign(window, { useIVRev, Toasts, Sheet, Sel, Opts, Chips, ItemAdd, LineRows, Warn });
