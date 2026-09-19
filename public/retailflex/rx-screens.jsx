/* Koomzo Retail POS (Flex) — step sheets + secondary screens.
   Every sheet is one step in the fixed chain; a profile only enables a subset. */

function Sheet({ title, sub, wide, step, onClose, children, foot }) {
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={wide ? 'sheet wide' : 'sheet'}>
        <div className="sheet__head">
          <div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        {step && <div className="steps">
          {step.all.map((s, i) => <i key={s} className={i <= step.all.indexOf(step.now) ? 'on' : ''}></i>)}
          <span>Step {step.all.indexOf(step.now) + 1} of {step.all.length}</span>
        </div>}
        <div className="sheet__body">{children}</div>
        {foot && <div className="sheet__foot">{foot}</div>}
      </div>
    </div>
  );
}

/* ---------- variant picker: one component, five shapes ---------- */
function VariantSheet({ product, picker, step, last, onClose, onAdd }) {
  const axes = product.axes || [];
  const oos = product.oos || [];
  const firstOk = (a, i) => {
    const opts = a.o.map((o) => (Array.isArray(o) ? o[0] : o));
    if (i === 0 && axes.length === 2 && picker === 'matrix') {
      const ok = opts.find((v) => axes[1].o.some((c) => !oos.includes(v + '|' + (Array.isArray(c) ? c[0] : c))));
      return ok || opts[0];
    }
    return opts[0];
  };
  const [pick, setPick] = React.useState(() => axes.map(firstOk));
  const set = (i, v) => setPick((p) => p.map((x, j) => (j === i ? v : x)));
  const delta = axes.reduce((s, a, i) => {
    if (a.k !== 'add') return s;
    const hit = a.o.find((o) => o[0] === pick[i]);
    return s + (hit ? hit[1] : 0);
  }, 0);
  const price = product.price + delta;
  const label = pick.filter(Boolean).join(' · ');
  const cellOos = (r, c) => oos.includes(r + '|' + c);
  const blocked = picker === 'matrix' && axes.length === 2 && cellOos(pick[0], pick[1]);

  const hexOf = (a, v) => { const h = a.o.find((o) => o[0] === v); return h ? h[1] : '#ddd'; };

  return (
    <Sheet title={product.name} step={step}
      sub={`${product.sub} · SKU ${product.sku} · ${window.RX_PICKER_NAME[picker]}`} onClose={onClose}
      wide={picker === 'matrix' || picker === 'swatch'}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={blocked} onClick={() => onAdd(product, label, price)}>
          {last ? 'Add ' + money(price) : 'Continue'}
        </button>
      </>}>

      {picker === 'matrix' && axes.length === 2 && (
        <div className="matrix">
          <table><thead><tr><th></th>
            {axes[1].o.map((c) => { const n = Array.isArray(c) ? c[0] : c; return (
              <th key={n}>{axes[1].k === 'color' && <span className="sw" style={{ background: c[1] }}></span>}{n}</th>); })}
          </tr></thead><tbody>
            {axes[0].o.map((r) => { const rn = Array.isArray(r) ? r[0] : r; return (
              <tr key={rn}><th className="rowh">{rn}</th>
                {axes[1].o.map((c) => { const cn = Array.isArray(c) ? c[0] : c; const bad = cellOos(rn, cn);
                  const on = pick[0] === rn && pick[1] === cn;
                  const stock = bad ? 0 : 1 + ((rn.length + cn.length + rn.charCodeAt(0)) % 9);
                  return <td key={cn}><button className={'cell' + (bad ? ' oos' : on ? ' on' : '')} disabled={bad}
                    onClick={() => { set(0, rn); set(1, cn); }}>{bad ? '—' : stock}<small>{bad ? 'out' : 'on hand'}</small></button></td>; })}
              </tr>); })}
          </tbody></table>
        </div>
      )}

      {picker === 'swatch' && axes.map((a, i) => (
        <div key={a.n}>
          <div className="lbl">{a.n}</div>
          {a.k === 'color' ? (
            <div className="swatches" style={{ marginTop: 8 }}>
              {a.o.map(([n, hex]) => (
                <button key={n} className={'swb' + (pick[i] === n ? ' on' : '')} onClick={() => set(i, n)}>
                  <span className="dot" style={{ background: hex }}></span><span className="nm">{n}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="opts">
              {a.o.map((o) => { const n = Array.isArray(o) ? o[0] : o; return (
                <button key={n} className={'opt' + (pick[i] === n ? ' on' : '')} onClick={() => set(i, n)}>{n}</button>); })}
            </div>
          )}
        </div>
      ))}

      {(picker === 'single' || picker === 'config') && (
        <div className="cfg">
          {axes.map((a, i) => (
            <div className="cfgrow" key={a.n}>
              <span className="lbl">{a.n}</span>
              <div className="opts" style={{ marginTop: 0 }}>
                {a.o.map((o) => { const n = Array.isArray(o) ? o[0] : o; const d = a.k === 'add' ? o[1] : 0;
                  return (
                    <button key={n} className={'opt' + (pick[i] === n ? ' on' : '')} onClick={() => set(i, n)}>
                      {a.k === 'color' && <span className="sw" style={{ background: hexOf(a, n) }}></span>}{n}
                      {picker === 'config' && d !== 0 && <span className="delta">{d > 0 ? '+' : '−'}{money(Math.abs(d)).slice(1)}</span>}
                    </button>); })}
              </div>
            </div>
          ))}
        </div>
      )}

      {picker === 'config' && (
        <div className="pricebox"><span className="k">{label || 'Configured price'}</span><span className="v">{money(price)}</span></div>
      )}
      {product.limit && <div className="note"><ion-icon name="hand-left-outline"></ion-icon>
        Sales limit: {product.limit} pack{product.limit > 1 ? 's' : ''} per customer per transaction.</div>}
      {picker === 'matrix' && <div className="note info"><ion-icon name="cube-outline"></ion-icon>
        Struck cells are out of stock here — 14 available at Warehouse for transfer.</div>}
    </Sheet>
  );
}

/* ---------- prescription ---------- */
function RxSheet({ product, step, onClose, onAdd }) {
  const [ref, setRef] = React.useState('');
  const [signed, setSigned] = React.useState(false);
  return (
    <Sheet title="Prescription check" step={step} sub={`${product.name} · prescription only`} onClose={onClose}
      foot={<>
        <button className="btn danger" onClick={onClose}>Refuse</button>
        <button className="btn primary" disabled={!signed} onClick={() => onAdd(ref || 'RX-88412')}>Continue</button>
      </>}>
      <div className="field"><ion-icon name="document-text-outline"></ion-icon>
        <input autoFocus value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Scan or type prescription reference" /></div>
      <button className={'modrow' + (signed ? ' on' : '')} onClick={() => setSigned(!signed)}>
        <ion-icon name={signed ? 'checkbox-outline' : 'square-outline'}></ion-icon>
        <span className="nm">Pharmacist checked and signed off</span>
      </button>
      <div className="note"><ion-icon name="alert-circle-outline"></ion-icon>
        The dispensing record, pharmacist ID and batch are written to the sale. Interaction warnings are shown against the patient record.</div>
    </Sheet>
  );
}

/* ---------- batch & expiry ---------- */
function LotSheet({ product, step, onClose, onAdd }) {
  const lots = window.RX_LOTS;
  const [sel, setSel] = React.useState(lots[0].lot);
  const hit = lots.find((l) => l.lot === sel);
  return (
    <Sheet title="Batch & expiry" step={step} sub={`${product.name} · pick the batch leaving the shelf`} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={() => onAdd(hit)}>Continue</button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lots.map((l) => (
          <button key={l.lot} className={'lotrow' + (sel === l.lot ? ' on' : '')} onClick={() => setSel(l.lot)}>
            <ion-icon name={sel === l.lot ? 'radio-button-on' : 'radio-button-off'}
              style={{ color: sel === l.lot ? 'var(--kz-primary)' : 'var(--kz-muted-3)' }}></ion-icon>
            <div><div className="lo">{l.lot}</div><div className="ex">Expires {l.exp}</div></div>
            <div className="sp"></div>
            <span className="st">{l.stock} on hand</span>
          </button>
        ))}
      </div>
      <div className="note info"><ion-icon name="swap-vertical-outline"></ion-icon>First-expiring batch is preselected. Overriding is recorded against the operator.</div>
    </Sheet>
  );
}

/* ---------- modifiers ---------- */
function ModifierSheet({ product, step, last, onClose, onAdd }) {
  const mods = product.mods || [['Gift wrap', 2.50], ['Bag', 0.15], ['Warmed', 0]];
  const [on, setOn] = React.useState([]);
  const add = mods.filter((m) => on.includes(m[0])).reduce((s, m) => s + m[1], 0);
  return (
    <Sheet title="Add-ons" step={step} sub={`${product.name} · priced options, no stock impact`} onClose={onClose}
      foot={<>
        <button className="btn" onClick={() => onAdd([], 0)}>No add-ons</button>
        <button className="btn primary" onClick={() => onAdd(on, add)}>{last ? 'Add ' + money(product.price + add) : 'Continue'}</button>
      </>}>
      <div className="modlist">
        {mods.map(([n, p]) => (
          <button key={n} className={'modrow' + (on.includes(n) ? ' on' : '')}
            onClick={() => setOn((c) => c.includes(n) ? c.filter((x) => x !== n) : [...c, n])}>
            <ion-icon name={on.includes(n) ? 'checkbox-outline' : 'square-outline'}></ion-icon>
            <span className="nm">{n}</span><span className="sp"></span>
            <span className="pr">{p === 0 ? 'Free' : (p > 0 ? '+' : '−') + money(Math.abs(p)).slice(1)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------- scale ---------- */
function ScaleSheet({ product, step, last, onClose, onAdd }) {
  const [w, setW] = React.useState('0.000');
  const [tare, setTare] = React.useState(false);
  const kg = parseFloat(w) || 0;
  const key = (k) => setW((cur) => {
    if (k === 'live') return (Math.random() * 1.4 + 0.2).toFixed(3);
    const digits = k === 'back' ? cur.replace('.', '').slice(0, -1) : (cur.replace('.', '') + k).replace(/^0+(?=\d{4})/, '').slice(-6);
    return (digits.padStart(4, '0')).replace(/^(\d+)(\d{3})$/, '$1.$2');
  });
  return (
    <Sheet title={product.name} step={step} sub={`${money(product.price)} per ${product.unit || 'kg'} · SKU ${product.sku}`} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={kg <= 0} onClick={() => onAdd(kg)}>{last ? 'Add ' + money(kg * product.price) : 'Continue'}</button>
      </>}>
      <div className="display"><small>Weight on scale{tare ? ' · tared' : ''}</small>{w} <span style={{ fontSize: 20 }}>{product.unit || 'kg'}</span></div>
      <div className="trow"><span className="k">Line total</span>
        <span className="v" style={{ font: '700 18px var(--kz-font-num)', color: 'var(--kz-ink)' }}>{money(kg * product.price)}</span></div>
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

/* ---------- serial ---------- */
function SerialSheet({ product, step, onClose, onAdd }) {
  const [sn, setSn] = React.useState('');
  return (
    <Sheet title="Capture serial" step={step} sub={`${product.name} · warranty starts at sale`} onClose={onClose}
      foot={<>
        <button className="btn" onClick={() => onAdd(null)}>Skip</button>
        <button className="btn primary" onClick={() => onAdd(sn || '88-2210-4')}>Continue</button>
      </>}>
      <div className="field"><ion-icon name="barcode-outline"></ion-icon>
        <input autoFocus value={sn} onChange={(e) => setSn(e.target.value)} placeholder="Scan or type serial number" /></div>
      <div className="note info"><ion-icon name="shield-checkmark-outline"></ion-icon>24-month warranty is registered against this serial on receipt.</div>
    </Sheet>
  );
}

/* ---------- age ---------- */
function AgeSheet({ product, step, onClose, onConfirm }) {
  return (
    <Sheet title={`Age check — ${product.age}+`} step={step} sub={product.name} onClose={onClose}
      foot={<>
        <button className="btn danger" onClick={onClose}>Refuse sale</button>
        <button className="btn primary" onClick={onConfirm}>ID verified</button>
      </>}>
      <div className="note"><ion-icon name="alert-circle-outline"></ion-icon>
        Restricted item. Check photo ID and confirm the customer is {product.age} or over. The approval is recorded on the receipt.</div>
    </Sheet>
  );
}

/* ---------- keypad ---------- */
function KeypadSheet({ line, onClose, onApply }) {
  const [mode, setMode] = React.useState('qty');
  const [buf, setBuf] = React.useState('');
  const [ask, setAsk] = React.useState(null);
  const stored = mode === 'qty' ? String(line.qty) : mode === 'disc' ? String(line.disc) : String(Math.round(line.price));
  const shown = buf === '' ? stored : buf;
  const key = (k) => setBuf((b) => k === 'back' ? (b === '' ? stored : b).slice(0, -1) : b + k);
  const val = () => mode === 'qty' ? (parseFloat(shown) || 0) : Math.round(parseFloat(shown) || 0);
  /* change 8 — under the ceiling the cashier acts freely; above it, a supervisor */
  const apply = () => {
    const v = val();
    if (window.KZ_POLICY.needsApproval(mode, v)) return setAsk({ kind: mode, value: v });
    onApply(mode, v);
  };
  if (ask) return (
    <Sheet title="Supervisor approval" sub={line.name + ' · ' + (ask.kind === 'price' ? 'price override ' + money(ask.value) : ask.value + ' % off')} onClose={onClose}>
      <ApprovalStep kind={ask.kind} value={ask.value} onCancel={() => setAsk(null)}
        onApprove={() => onApply(ask.kind, ask.value)} />
    </Sheet>
  );
  return (
    <Sheet title={line.name} sub="Adjust the selected line" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={apply}>Apply</button>
      </>}>
      <div className="opts" style={{ marginTop: 0 }}>
        {[['qty', 'Quantity'], ['price', 'Price'], ['disc', 'Discount %']].map(([m, l]) => (
          <button key={m} className={'opt' + (mode === m ? ' on' : '')} onClick={() => { setMode(m); setBuf(''); }}>{l}</button>
        ))}
      </div>
      <div className="display"><small>{mode === 'qty' ? 'Quantity' : mode === 'price' ? 'Unit price' : 'Line discount'}</small>{shown || '0'}</div>
      {mode !== 'qty' && <div className="note info" style={{ marginBottom: 10 }}>
        <ion-icon name="shield-checkmark-outline"></ion-icon>{window.KZ_POLICY.ceilingCopy(mode)}</div>}
      <div className="keypad">
        {['1','2','3','4','5','6','7','8','9'].map((k) => <button key={k} onClick={() => key(k)}>{k}</button>)}
        <button onClick={() => key('00')}>00</button>
        <button onClick={() => key('0')}>0</button>
        <button onClick={() => key('back')}><ion-icon name="backspace-outline"></ion-icon></button>
      </div>
    </Sheet>
  );
}

/* ---------- customer ---------- */
function CustomerSheet({ onClose, onPick }) {
  const [q, setQ] = React.useState('');
  const list = window.RX_CUSTOMERS.filter((c) => (c.name + c.phone).toLowerCase().includes(q.toLowerCase()));
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
            <span className="amt">{c.points}</span>
          </button>
        ))}
        {!list.length && <div className="empty" style={{ minHeight: 120 }}><p>No customer matches “{q}”.</p></div>}
      </div>
    </Sheet>
  );
}

/* ---------- tender ---------- */
function TenderSheet({ total, ticketNo, onClose, onDone, onPaid }) {
  /* model, persistence and copy all live in kz/kz-charge.jsx + kz/kz-tender.js */
  const ch = window.useCharge(total, { ticketNo: ticketNo, extras: { loyalty: true, split: true }, onDone: onDone, onPaid: onPaid });
  if (ch.paid) return (
    <Sheet title="" onClose={ch.finish} foot={<>
      <button className="btn" onClick={ch.finish}><ion-icon name="print-outline"></ion-icon>Print receipt</button>
      <button className="btn primary" onClick={ch.finish}>New order</button></>}>
      <ChargePaidBody ch={ch} total={total} />
    </Sheet>
  );
  return (
    <Sheet title={`Charge ${money(total)}`}
      sub={ch.tenders.length ? `${money(ch.balance)} still to take` : 'Choose how the customer is paying'}
      onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Back</button>
        <button className="btn primary" disabled={ch.busy}
          style={{ background: 'var(--kz-success)', borderColor: 'var(--kz-success)', boxShadow: '0 6px 14px rgba(46,158,91,.28)', opacity: ch.busy ? .45 : 1 }}
          onClick={ch.request}>{ch.busy ? 'Waiting for the customer…' : window.KZ_TENDER.cta(ch.tender, ch.take)}</button>
      </>}>
      <ChargeBody ch={ch} />
    </Sheet>
  );
}

/* ---------- SETUP: presets seed editable overrides ---------- */
const STEP_ORDER = ['age', 'rx', 'variants', 'lot', 'serial', 'scale', 'modifiers'];
const STEP_LABEL = { age:'Age', rx:'Rx', variants:'Variant', lot:'Batch', serial:'Serial', scale:'Weight', modifiers:'Add-ons' };

function SetupView({ profileId, cfg, preset, dirty, onPreset, onToggle, onSet, onReset, stockMode, onStockMode, modules, onModule, onFit }) {
  const prof = window.RX_PROFILES.find((p) => p.id === profileId);
  return (
    <div className="view">
      <div className="setup2">
        <div className="panel">
          <div className="panel__hd">
            <div><h3>Business profile</h3><p>A preset seeds the settings on the right. Nothing is locked.</p></div>
          </div>
          {window.RX_PROFILES.map((p) => {
            const on = p.id === profileId;
            const feats = window.RX_FEATURES.filter((f) => p.features[f.key]);
            return (
              <button key={p.id} className={'preset' + (on ? ' on' : '')} onClick={() => onPreset(p.id)}>
                <div className="preset__ic" style={{ background: p.tint.bg, color: p.tint.fg }}><ion-icon name={p.icon}></ion-icon></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="preset__n">{p.name}{on && dirty && <span className="mchip"><ion-icon name="create-outline"></ion-icon>Modified</span>}</div>
                  <div className="preset__b">{p.blurb}</div>
                  <div className="preset__f">
                    <span className="mod">{p.entry === 'scan' ? 'Scan-first' : p.entry === 'grid' ? 'Grid-first' : 'Search-first'}</span>
                    <span className="mod">{window.RX_PICKER_NAME[p.picker]}</span>
                    {feats.slice(0, 4).map((f) => <span className="mod" key={f.key}>{f.name}</span>)}
                  </div>
                </div>
                {on && <span className="tick"><ion-icon name="checkmark-circle"></ion-icon></span>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div className="panel">
            <div className="panel__hd">
              <div><h3>Register settings</h3><p>Seeded from {prof.name}{dirty ? ' · edited' : ''}</p></div>
              <div className="sp"></div>
              {dirty && <button className="btn" style={{ height: 34, padding: '0 12px', fontSize: 12.5 }} onClick={onReset}>
                <ion-icon name="refresh-outline"></ion-icon>Reset to preset</button>}
            </div>
            <div className="panel__bd">
              <div className="selrow" style={{ paddingTop: 0 }}>
                <div><div className="trow2__t">Item entry</div><div className="trow2__d">What the cashier reaches for first</div></div>
                <div className="sp"></div>
                <select value={cfg.entry} onChange={(e) => onSet('entry', e.target.value)}>
                  <option value="scan">Scan-first</option><option value="grid">Grid-first</option><option value="search">Search-first</option>
                </select>
              </div>
              <div className="selrow">
                <div><div className="trow2__t">Catalog tiles</div><div className="trow2__d">Image, text keys or list rows</div></div>
                <div className="sp"></div>
                <select value={cfg.tiles} onChange={(e) => onSet('tiles', e.target.value)}>
                  <option value="image">Image tiles</option><option value="text">Text keys</option><option value="list">List rows</option>
                </select>
              </div>
              <div className="selrow">
                <div><div className="trow2__t">Stock control</div><div className="trow2__d">Off for a fixed list · Lite for a quantity · Full opens the module</div></div>
                <div className="sp"></div>
                <select value={stockMode} onChange={(e) => onStockMode(e.target.value)}>
                  <option value="off">Off — product list only</option><option value="lite">Lite — quantity per product</option><option value="full">Full — inventory module</option>
                </select>
              </div>
              <div className="selrow" style={{ borderBottom: 'none' }}>
                <div><div className="trow2__t">Variant picker shape</div><div className="trow2__d">Same data, five presentations</div></div>
                <div className="sp"></div>
                <select value={cfg.picker} disabled={!cfg.features.variants} onChange={(e) => onSet('picker', e.target.value)}>
                  {window.RX_PICKERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel__hd">
              <div><h3>Screens</h3><p>Hide what this shop never opens — the rail shrinks to match</p></div>
            </div>
            <div className="panel__bd">
              <div className="opts" style={{ marginTop: 0, marginBottom: 4 }}>
                {Object.keys(window.RX_FITS).map((k) => {
                  const f = window.RX_FITS[k];
                  const on = Object.keys(f.mods).every((m) => !!modules[m] === f.mods[m]);
                  return <button key={k} className={'opt' + (on ? ' on' : '')} style={{ height: 40 }} onClick={() => onFit(k)}>{f.label}</button>;
                })}
              </div>
              <div className="fhint" style={{ marginBottom: 10 }}>
                {(() => {
                  const k = Object.keys(window.RX_FITS).find((x) =>
                    Object.keys(window.RX_FITS[x].mods).every((m) => !!modules[m] === window.RX_FITS[x].mods[m]));
                  return k ? window.RX_FITS[k].desc : 'Custom — screens picked one by one below.';
                })()}
              </div>
              {window.RX_MODULES.map((m) => {
                const bound = m.bound === 'stock';
                const on = bound ? stockMode !== 'off' : !!modules[m.key];
                return (
                  <div className={'trow2' + (on ? ' on' : '')} key={m.key}>
                    <div className="trow2__ic"><ion-icon name={m.icon}></ion-icon></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="trow2__t">{m.name}</div>
                      <div className="trow2__d">{m.desc}</div>
                    </div>
                    <div className="sp" style={{ flex: 1 }}></div>
                    {bound ? <span className="badge">{stockMode === 'off' ? 'Hidden' : stockMode}</span>
                      : <button className={'sw2' + (on ? ' on' : '')} onClick={() => onModule(m.key)} aria-pressed={on}></button>}
                  </div>
                );
              })}
              <div className="flagrow info" style={{ marginTop: 12 }}>
                <ion-icon name="information-circle-outline"></ion-icon>
                <span>Register and Setup can never be hidden. Turning a screen off hides it everywhere — rail, shortcuts and search — but keeps its data, so switching back loses nothing.</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel__hd"><div><h3>Capabilities</h3><p>Each toggle inserts one step between tap and ticket</p></div></div>
            <div className="panel__bd">
              {window.RX_FEATURES.map((f) => {
                const on = cfg.features[f.key];
                const changed = on !== preset.features[f.key];
                return (
                  <div className={'trow2' + (on ? ' on' : '')} key={f.key}>
                    <div className="trow2__ic"><ion-icon name={f.icon}></ion-icon></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="trow2__t">{f.name}</div>
                      <div className="trow2__d">{f.desc}</div>
                    </div>
                    <div style={{ flex: 1 }}></div>
                    {changed && <span className="diff">{on ? 'added' : 'off'}</span>}
                    <button className={'sw2' + (on ? ' on' : '')} onClick={() => onToggle(f.key)} aria-label={f.name}></button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel__hd"><div><h3>Resulting step chain</h3><p>Fixed order, so cashiers build one muscle memory</p></div></div>
            <div className="panel__bd">
              <div className="chain">
                <span className="st"><ion-icon name="hand-left-outline"></ion-icon>Tap</span>
                {STEP_ORDER.map((k) => (<React.Fragment key={k}>
                  <span className="ar">→</span>
                  <span className={'st' + (cfg.features[k] ? '' : ' off')}>{STEP_LABEL[k]}</span>
                </React.Fragment>))}
                <span className="ar">→</span><span className="st"><ion-icon name="receipt-outline"></ion-icon>Ticket</span>
              </div>
              <div className="note info" style={{ marginTop: 14 }}><ion-icon name="barcode-outline"></ion-icon>
                A scan that resolves to a specific variant skips the variant step — which is how one register serves a scan lane and a boutique.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- secondary views ---------- */
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

function ReturnsView() {
  const [sel, setSel] = React.useState(null);
  const [picked, setPicked] = React.useState({});
  const r = window.RX_RECEIPTS.find((x) => x.id === sel);
  const refund = r ? r.items.reduce((s, it, i) => s + (picked[i] ? it.price * it.qty : 0), 0) : 0;
  return (
    <div className="view">
      <div className="view__head"><div><h2>Returns & exchange</h2><p>Find the original receipt, choose the lines coming back, then refund or swap.</p></div></div>
      <div className="field" style={{ maxWidth: 420, marginBottom: 16 }}>
        <ion-icon name="receipt-outline"></ion-icon><input placeholder="Scan receipt barcode or type order no…" /></div>
      {!r ? (
        <>
          <div className="sechead"><h3>Recent orders</h3><span>this register</span></div>
          <div className="table">
            {window.RX_RECEIPTS.map((x) => (
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
                <ion-icon name={picked[i] ? 'checkbox-outline' : 'square-outline'}
                  style={{ color: picked[i] ? 'var(--kz-primary)' : 'var(--kz-muted-3)' }}></ion-icon>
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

function CustomersView({ onPick }) {
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Customers</h2><p>Loyalty members and their balance at this store.</p></div>
        <div className="sp"></div>
        <button className="btn primary"><ion-icon name="person-add-outline"></ion-icon>Add customer</button>
      </div>
      <div className="field" style={{ maxWidth: 420, marginBottom: 16 }}>
        <ion-icon name="search-outline"></ion-icon><input placeholder="Name, phone or loyalty card…" /></div>
      <div className="table">
        {window.RX_CUSTOMERS.map((c) => (
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

/* ShiftView lives in rx-ops.jsx — Flex has the richer close screen */
Object.assign(window, { Sheet, VariantSheet, RxSheet, LotSheet, ModifierSheet, ScaleSheet, SerialSheet, AgeSheet,
  KeypadSheet, CustomerSheet, TenderSheet, SetupView, TicketsView, ReturnsView, CustomersView,
  STEP_ORDER, STEP_LABEL });
