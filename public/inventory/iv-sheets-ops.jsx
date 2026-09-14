/* Koomzo Inventory — action sheets: Receive, New order, Print order, New count, Schedule cycle. */

const IV_STAFF = ['M. Ekindi', 'A. Oliver', 'Nadia K.', 'D. Patel'];

/* ============ RECEIVE ============ */
/* Two ways stock legitimately arrives: against an order, or without one (a walk-in
   delivery, a sample box, a market purchase). Both write receipt movements and
   re-average cost; only the first can close an order. */
function ReceiveSheet({ loc, caps, poId, onClose }) {
  const open = window.IV_POS.filter((p) => p.status === 'sent' || p.status === 'partial');
  const [mode, setMode] = useState(poId || open.length ? 'order' : 'direct');
  const [sel, setSel] = useState(poId || (open[0] && open[0].id) || '');
  const [qty, setQty] = useState({});
  const [ref, setRef] = useState('');
  const [locId, setLocId] = useState(loc === 'all' ? 'wh' : loc);
  const [sup, setSup] = useState('sup2');
  const [lines, setLines] = useState([]);

  const po = window.IV_POS.find((p) => p.id === sel);
  const remaining = (l) => l.qty - l.recv;
  const get = (l) => qty[sel + l.id] !== undefined ? qty[sel + l.id] : remaining(l);
  const setQ = (l, v) => setQty((c) => Object.assign({}, c, { [sel + l.id]: Math.max(0, +v || 0) }));

  const poValue = po ? po.lines.reduce((a, l) => a + get(l) * l.cost, 0) : 0;
  const over = po ? po.lines.filter((l) => get(l) > remaining(l)) : [];
  const poCount = po ? po.lines.filter((l) => get(l) > 0).length : 0;
  const dirValue = lines.reduce((a, l) => a + (+l.qty || 0) * (+l.cost || 0), 0);
  const dirCount = lines.filter((l) => +l.qty > 0).length;

  const addLine = (i) => setLines((c) => c.concat([{ id: i.id, qty: 1, cost: i.cost || 0 }]));
  const patchLine = (id, k, v) => setLines((c) => c.map((l) => l.id === id ? Object.assign({}, l, { [k]: v }) : l));

  const blocked = mode === 'order' ? (!po || poCount === 0) : dirCount === 0;

  return (
    <Sheet w="xl" title="Receive stock" onClose={onClose}
      sub={mode === 'order' ? 'Quantities that physically arrived — short receipts leave the order open' : 'A delivery with no order behind it'}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={blocked} onClick={() => {
          if (mode === 'order') {
            window.IVS.receive({ poId: sel, lines: po.lines.map((l) => ({ id: l.id, qty: get(l), cost: l.cost })),
              ref: po.no + ' · ' + window.IV_SUPPLIERS.find((s) => s.id === po.supplier).name + (ref ? ' · ' + ref : '') });
          } else {
            const sname = window.IV_SUPPLIERS.find((s) => s.id === sup).name;
            window.IVS.receive({ poId: null, locId, lines, ref: 'Direct receipt · ' + sname + (ref ? ' · ' + ref : '') });
          }
          onClose();
        }}>
          <ion-icon name="download-outline"></ion-icon>
          {blocked ? 'Nothing to post' : 'Post receipt · ' + money(mode === 'order' ? poValue : dirValue)}</button>
      </>}>
      <Opts value={mode} onChange={setMode} small options={[
        ['order', 'Against an order', 'receipt-outline'], ['direct', 'Without an order', 'cube-outline']]} />

      {mode === 'order' && (open.length ? <>
        <Sel label="Order" value={sel} onChange={(v) => { setSel(v); setQty({}); }}>
          {open.map((p) => <option key={p.id} value={p.id}>
            {p.no} · {window.IV_SUPPLIERS.find((s) => s.id === p.supplier).name} · due {p.expected} · {IV_PO_STATUS[p.status].label}</option>)}
        </Sel>
        {po && <>
          <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 0 }}>
            <div className="kpi"><div className="k">Into</div><div className="v" style={{ fontSize: 15 }}>{IV.loc(po.to).name}</div></div>
            <div className="kpi"><div className="k">Lines arriving</div><div className="v">{poCount}/{po.lines.length}</div></div>
            <div className="kpi"><div className="k">Receipt value</div><div className="v">{money(poValue)}</div></div>
          </div>
          <div className="lned">
            <div className="lnh rcv"><div>Line</div><div className="r">Ordered</div><div className="r">Already in</div><div className="r">Arriving</div><div className="r">Value</div></div>
            {po.lines.map((l) => {
              const it = IV.item(l.id), r = get(l), rem = remaining(l);
              return (
                <div className="lnr rcv" key={l.id}>
                  <div><div className="ln__n">{it.name}</div><div className="ln__s">{it.sku} · {money(l.cost)} / {it.unit}</div></div>
                  <div className="r ln__s">{qtyFmt(l.qty)}</div>
                  <div className="r ln__s">{l.recv || '—'}</div>
                  <div><input className={'numin' + (r > rem ? ' badv' : r < rem ? ' warnv' : '')} value={r} onChange={(e) => setQ(l, e.target.value)} /></div>
                  <div className="r">{money(r * l.cost)}</div>
                </div>
              );
            })}
          </div>
          {over.length > 0 && <Warn tone="bad" icon="warning-outline">
            {over.length} line{over.length > 1 ? 's' : ''} above the ordered quantity. Over-receipt is allowed but recorded — the variance shows on the supplier's on-time and cost history.
          </Warn>}
          {!over.length && poCount < po.lines.length && <Warn tone="warn" icon="information-circle-outline">
            A short receipt leaves <b>{po.no}</b> partially received and the outstanding value on the order. Nothing needs a second document.
          </Warn>}
        </>}
      </> : <Warn icon="checkmark-circle-outline">No order is waiting on a delivery. Use <b>Without an order</b> for a delivery that arrived unannounced.</Warn>)}

      {mode === 'direct' && <>
        <div className="fgrid">
          <Sel label="Supplier" value={sup} onChange={setSup}>
            {window.IV_SUPPLIERS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Sel>
          <Sel label="Into location" value={locId} onChange={setLocId}>
            {(caps.locations ? window.IV_LOCATIONS : window.IV_LOCATIONS.slice(0, 1)).map((l) =>
              <option key={l.id} value={l.id}>{l.name}</option>)}
          </Sel>
        </div>
        <ItemAdd exclude={lines.map((l) => l.id)} filter={(i) => !!i.stock} onAdd={addLine} />
        <LineRows lines={lines} head={['Line', 'Qty', 'Unit cost', 'Value']}
          onQty={(id, v) => patchLine(id, 'qty', Math.max(0, +v || 0))}
          onCost={(id, v) => patchLine(id, 'cost', Math.max(0, +v || 0))}
          onDrop={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
        {dirCount > 0 && <Warn icon="cash-outline">
          Receipt value <b>{money(dirValue)}</b>. Unit cost is re-averaged per item on the way in, so the cost you type here changes valuation — type what the invoice says, not the list price.
        </Warn>}
      </>}

      <Field label="Supplier reference" value={ref} onChange={setRef}
        placeholder="Delivery note or invoice number" hint="Printed on the movement row so the receipt can be traced back to paper" />
    </Sheet>
  );
}

/* ============ NEW ORDER ============ */
function NewOrderSheet({ supplierId, onClose, onCreated }) {
  const [sup, setSup] = useState(supplierId || window.IV_SUPPLIERS[0].id);
  const [to, setTo] = useState('wh');
  const [lines, setLines] = useState([]);
  const s = window.IV_SUPPLIERS.find((x) => x.id === sup);
  const total = lines.reduce((a, l) => a + (+l.qty || 0) * (+l.cost || 0), 0);
  const addLine = (i) => setLines((c) => c.concat([{ id: i.id, qty: Math.max(1, (i.par || 0) - IV.onHand(i, 'all')), cost: i.cost || 0 }]));
  const patchLine = (id, k, v) => setLines((c) => c.map((l) => l.id === id ? Object.assign({}, l, { [k]: v }) : l));
  const fillFromPar = () => {
    const need = window.IV_ITEMS.filter((i) => i.stock && i.supplier === sup && i.par && IV.onHand(i, 'all') <= i.reorder)
      .filter((i) => !lines.some((l) => l.id === i.id))
      .map((i) => ({ id: i.id, qty: Math.max(1, i.par - IV.onHand(i, 'all')), cost: i.cost || 0 }));
    setLines((c) => c.concat(need));
  };
  const belowMoq = total > 0 && total < s.moq;

  return (
    <Sheet w="xl" title="New purchase order" sub={'Expected ' + window.IVS.etaFor(sup) + ' · ' + s.lead + '-day lead time'} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" disabled={!lines.length}
          onClick={() => { const p = window.IVS.createPO({ supplier: sup, to, lines, send: false }); onCreated && onCreated(p.id); onClose(); }}>
          Save draft</button>
        <button className="btn primary" disabled={!lines.length}
          onClick={() => { const p = window.IVS.createPO({ supplier: sup, to, lines, send: true }); window.IVS.sendPO(p.id); onCreated && onCreated(p.id); onClose(); }}>
          <ion-icon name="send-outline"></ion-icon>Send · {money(total)}</button>
      </>}>
      <div className="fgrid">
        <Sel label="Supplier" value={sup} onChange={(v) => { setSup(v); setLines([]); }}
          hint={s.terms + ' · minimum ' + money(s.moq) + ' · ' + Math.round(s.onTime * 100) + '% on time'}>
          {window.IV_SUPPLIERS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Sel>
        <Sel label="Deliver into" value={to} onChange={setTo} hint="Where the receipt will land">
          {window.IV_LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}{l.sells ? '' : ' · holding only'}</option>)}
        </Sel>
      </div>
      <div className="impbar">
        <button className="btn" onClick={fillFromPar}><ion-icon name="sparkles-outline"></ion-icon>Fill from par levels</button>
        <div className="sp" style={{ flex: 1 }}></div>
        {lines.length > 0 && <button className="btn" onClick={() => setLines([])}>Clear lines</button>}
      </div>
      <ItemAdd exclude={lines.map((l) => l.id)} onAdd={addLine}
        filter={(i) => i.type !== 'service' && i.type !== 'composite'}
        placeholder={'Add an item — ' + s.name + ' supplies ' + window.IV_ITEMS.filter((i) => i.supplier === sup).length} />
      <LineRows lines={lines} head={['Line', 'Qty', 'Unit cost', 'Value']}
        onQty={(id, v) => patchLine(id, 'qty', Math.max(0, +v || 0))}
        onCost={(id, v) => patchLine(id, 'cost', Math.max(0, +v || 0))}
        onDrop={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
      {lines.length > 0 && <div className="pricebox"><span className="k">Order total · {lines.length} lines</span><span className="v">{money(total)}</span></div>}
      {belowMoq && <Warn tone="warn" icon="alert-circle-outline">
        Below {s.name}'s {money(s.moq)} minimum by <b>{money(s.moq - total)}</b>. The order can still be sent — most suppliers accept it with a small-order fee, and blocking it would be our rule, not theirs.
      </Warn>}
      {!lines.length && <Warn icon="information-circle-outline">
        <b>Fill from par levels</b> adds everything of {s.name}'s at or below its reorder point, topped up to par. Add anything else by hand.
      </Warn>}
    </Sheet>
  );
}

/* ============ PRINT ORDER ============ */
function PrintSheet({ po, onClose }) {
  const s = window.IV_SUPPLIERS.find((x) => x.id === po.supplier);
  const total = IV.poTotal(po);
  return (
    <Sheet w="xl" title={'Print ' + po.no} sub="One page — the copy that travels with the delivery" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn" onClick={() => window.IVS.queueEmail({ supplier: s.id, to: s.email,
          subject: 'Purchase order ' + po.no, body: 'Please find order ' + po.no + ' attached.', kind: 'po', ref: po.no })}>
          <ion-icon name="mail-outline"></ion-icon>Email instead</button>
        <button className="btn primary" onClick={() => window.print()}><ion-icon name="print-outline"></ion-icon>Print</button>
      </>}>
      <div className="docpaper">
        <div className="dp__top">
          <div>
            <div className="dp__mark"><ion-icon name="cube"></ion-icon></div>
            <div className="dp__org">Koomzo Retail</div>
            <div className="dp__meta">Downtown Store · Yaoundé<br />+237 6 99 000 1122 · buying@koomzo.cm</div>
          </div>
          <div className="dp__no">
            <div className="dp__t">Purchase order</div>
            <div className="dp__n">{po.no}</div>
            <div className="dp__meta">Raised {po.created}<br />Expected {po.expected}<br />Terms {s.terms}</div>
          </div>
        </div>
        <div className="dp__addr">
          <div><span className="dp__lab">Supplier</span>{s.name}<br />{s.contact}<br />{s.email}<br />{s.phone}</div>
          <div><span className="dp__lab">Deliver to</span>{IV.loc(po.to).name}<br />{IV.loc(po.to).kind} · code {IV.loc(po.to).code}<br />Receiving hours 08:00 – 17:00</div>
        </div>
        <table className="dp__tbl">
          <thead><tr><th>#</th><th>Item</th><th>SKU</th><th className="r">Qty</th><th className="r">Unit</th><th className="r">Value</th></tr></thead>
          <tbody>
            {po.lines.map((l, n) => {
              const it = IV.item(l.id);
              return <tr key={l.id}><td>{n + 1}</td><td>{it.name}</td><td>{it.sku}</td>
                <td className="r">{qtyFmt(l.qty, it.unit)}</td><td className="r">{money(l.cost)}</td><td className="r">{money(l.qty * l.cost)}</td></tr>;
            })}
          </tbody>
          <tfoot><tr><td colSpan="5" className="r">Order total</td><td className="r">{money(total)}</td></tr></tfoot>
        </table>
        <div className="dp__note">
          Deliver with this page. Quantities are checked against it on arrival and any difference is recorded against {po.no} — a short delivery does not need a new order.
        </div>
        <div className="dp__sign">
          <div><span className="dp__lab">Raised by</span>{window.IVS.who}</div>
          <div><span className="dp__lab">Received by</span>&nbsp;</div>
          <div><span className="dp__lab">Date</span>&nbsp;</div>
        </div>
      </div>
    </Sheet>
  );
}

/* ============ NEW COUNT ============ */
function NewCountSheet({ loc, caps, onClose, onCreated }) {
  const [at, setAt] = useState(loc === 'all' ? 'dt' : loc);
  const [kind, setKind] = useState('cycle');
  const [cat, setCat] = useState('tools');
  const [blind, setBlind] = useState(true);
  const [picked, setPicked] = useState([]);

  const pool = window.IV_ITEMS.filter((i) => i.stock);
  const lines = kind === 'full' ? pool
    : kind === 'cycle' ? pool.filter((i) => i.cat === cat)
    : pool.filter((i) => picked.indexOf(i.id) > -1);
  const scope = kind === 'full' ? 'Full count · all categories'
    : kind === 'cycle' ? 'Cycle · ' + (window.IV_CATS.find((c) => c.id === cat) || {}).label
    : 'Ad hoc · ' + picked.length + ' items';
  const value = lines.reduce((a, i) => a + IV.onHand(i, at) * (i.cost || 0), 0);

  return (
    <Sheet w="wide" title="New count" sub="Expected quantities are frozen the moment the count opens" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!lines.length} onClick={() => {
          const c = window.IVS.createCount({ loc: at, scope, blind,
            lines: lines.map((i) => ({ id: i.id, exp: IV.onHand(i, at), cnt: null })) });
          onCreated && onCreated(c.id); onClose();
        }}><ion-icon name="clipboard-outline"></ion-icon>Open count · {lines.length} lines</button>
      </>}>
      <Sel label="Location" value={at} onChange={setAt} hint="A count is always at one location — stock in transit is counted by neither end">
        {(caps.locations ? window.IV_LOCATIONS : window.IV_LOCATIONS.slice(0, 1)).map((l) =>
          <option key={l.id} value={l.id}>{l.name} · {l.kind}</option>)}
      </Sel>
      <Opts label="Scope" value={kind} onChange={setKind} small options={[
        ['cycle', 'One category', 'repeat-outline'], ['full', 'Everything', 'albums-outline'], ['adhoc', 'Pick items', 'hand-left-outline']]} />
      {kind === 'cycle' && <Chips label="Category" values={[cat]} onToggle={setCat}
        options={window.IV_CATS.filter((c) => c.id !== 'service').map((c) => [c.id, c.label, c.icon])} />}
      {kind === 'adhoc' && <>
        <ItemAdd exclude={picked} filter={(i) => !!i.stock} onAdd={(i) => setPicked((c) => c.concat([i.id]))} placeholder="Add an item to count" />
        <div className="taglist">
          {picked.map((id) => (
            <button className="tag" key={id} onClick={() => setPicked((c) => c.filter((x) => x !== id))}>
              {IV.item(id).name}<ion-icon name="close-outline" style={{ fontSize: 13 }}></ion-icon></button>
          ))}
          {!picked.length && <span className="ln__s">Nothing picked yet.</span>}
        </div>
      </>}
      <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
        <div className="kpi"><div className="k">Lines</div><div className="v">{lines.length}</div></div>
        <div className="kpi"><div className="k">Value under count</div><div className="v">{money(value)}</div></div>
      </div>
      <div className="optrow">
        <div><div className="t">Blind count</div><div className="d">Hides the expected figure from whoever is counting.</div></div>
        <div className="sp"></div><Toggle on={blind} onChange={() => setBlind(!blind)} />
      </div>
      <Warn icon={blind ? 'eye-off-outline' : 'eye-outline'}>
        {blind
          ? 'The counter sees only the item and an empty box. This is the setting that finds shrinkage — a visible expected number gets typed back at you.'
          : 'The expected figure is visible. Faster, and fine for a recount you already know is wrong, but it will not find theft.'}
      </Warn>
      {kind === 'full' && <Warn tone="warn" icon="alert-circle-outline">
        A full count freezes {lines.length} lines. The shop keeps selling — sales during the count are movements after the freeze, and the variance stays honest.
      </Warn>}
    </Sheet>
  );
}

/* ============ SCHEDULE CYCLE ============ */
const CADENCE = { weekly: { label: 'Weekly', days: 7 }, fortnightly: { label: 'Every two weeks', days: 14 }, monthly: { label: 'Monthly', days: 28 } };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ScheduleCycleSheet({ loc, caps, onClose }) {
  const [at, setAt] = useState(loc === 'all' ? 'dt' : loc);
  const [cad, setCad] = useState('weekly');
  const [dow, setDow] = useState(2);
  const [cats, setCats] = useState(['tools', 'styling', 'hair']);
  const [per, setPer] = useState(12);
  const [who, setWho] = useState(IV_STAFF[1]);

  const next = useMemo(() => {
    const out = []; const d = new Date();
    let guard = 0;
    while (d.getDay() !== dow && guard++ < 8) d.setDate(d.getDate() + 1);
    for (let n = 0; n < 3; n++) {
      out.push(DAYS[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0') + ' ' +
        ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]);
      d.setDate(d.getDate() + CADENCE[cad].days);
    }
    return out;
  }, [cad, dow]);

  const pool = window.IV_ITEMS.filter((i) => i.stock && cats.indexOf(i.cat) > -1);
  const sessions = Math.max(1, Math.ceil(pool.length / Math.max(1, per)));
  const coverDays = sessions * CADENCE[cad].days;

  return (
    <Sheet w="wide" title="Schedule cycle counts" sub="A rotation, not an event — the shop never closes for it" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!cats.length} onClick={() => {
          window.IVS.scheduleCycle({ loc: at, cadence: cad, cadenceLabel: CADENCE[cad].label + ' · ' + DAYS[dow],
            dow, cats: cats.slice(), per, who, next, sessions, coverDays });
          onClose();
        }}><ion-icon name="repeat-outline"></ion-icon>Schedule</button>
      </>}>
      <Sel label="Location" value={at} onChange={setAt}>
        {(caps.locations ? window.IV_LOCATIONS : window.IV_LOCATIONS.slice(0, 1)).map((l) =>
          <option key={l.id} value={l.id}>{l.name}</option>)}
      </Sel>
      <Opts label="Cadence" value={cad} onChange={setCad} small
        options={Object.keys(CADENCE).map((k) => [k, CADENCE[k].label])} />
      <Opts label="Day" value={dow} onChange={setDow} small options={[1, 2, 3, 4, 5, 6].map((d) => [d, DAYS[d]])} />
      <Chips label="Categories in the rotation" values={cats}
        onToggle={(v) => setCats((c) => c.indexOf(v) > -1 ? c.filter((x) => x !== v) : c.concat([v]))}
        options={window.IV_CATS.filter((c) => c.id !== 'service').map((c) => [c.id, c.label, c.icon])} />
      <div className="fgrid">
        <Field label="Lines per session" type="number" value={per} onChange={setPer}
          hint="Keep it to what one person counts in twenty minutes" />
        <Sel label="Assigned to" value={who} onChange={setWho}>
          {IV_STAFF.map((n) => <option key={n} value={n}>{n}</option>)}
        </Sel>
      </div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 0 }}>
        <div className="kpi"><div className="k">Items in rotation</div><div className="v">{pool.length}</div></div>
        <div className="kpi"><div className="k">Sessions per pass</div><div className="v">{sessions}</div></div>
        <div className="kpi"><div className="k">Full coverage</div><div className="v">{coverDays}<span style={{ fontSize: 13 }}> d</span></div></div>
      </div>
      <div className="grp">
        <span className="grp__t">Next three</span>
        {next.map((d, n) => (
          <div className="op-row" key={d}>
            <div className="op-ic"><ion-icon name="calendar-outline"></ion-icon></div>
            <div><div className="op-k">{d}</div><div className="op-d">{who} · {Math.min(per, Math.max(0, pool.length - n * per))} lines</div></div>
            <div className="sp"></div>
            {n === 0 && <span className="badge pri">Next</span>}
          </div>
        ))}
      </div>
      <Warn icon="information-circle-outline">
        Every item in the rotation is counted once per pass — <b>{coverDays} days</b> at this cadence. Raising lines per session shortens the pass; it does not change what gets counted.
      </Warn>
    </Sheet>
  );
}

/* ============ NEW TRANSFER ============ */
/* The only document that posts twice. Source availability is the real constraint here:
   you cannot send what is not on the shelf, so lines are capped at on-hand AT SOURCE
   and the sheet says so rather than letting the send drive a location negative. */
function NewTransferSheet({ loc, onClose, onCreated }) {
  const [from, setFrom] = useState('wh');
  const [to, setTo] = useState(loc === 'all' || loc === 'wh' ? 'dt' : loc);
  const [lines, setLines] = useState([]);
  const [note, setNote] = useState('');

  const onHandAt = (id, at) => { const it = IV.item(id); return (it.stock && it.stock[at]) || 0; };
  const addLine = (i) => setLines((c) => c.concat([{ id: i.id, qty: Math.min(1, onHandAt(i.id, from)) || 1 }]));
  const patch = (id, v) => setLines((c) => c.map((l) => l.id === id ? { ...l, qty: Math.max(0, +v || 0) } : l));
  const over = lines.filter((l) => l.qty > onHandAt(l.id, from));
  const value = lines.reduce((a, l) => a + l.qty * (IV.item(l.id).cost || 0), 0);
  const ok = from !== to && lines.some((l) => l.qty > 0);

  return (
    <Sheet w="xl" title="New transfer" sub="One document, two postings — out of source now, on hand at destination when it arrives" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" disabled={!ok}
          onClick={() => { const t = window.IVS.createTransfer({ from, to, lines, send: false }); onCreated && onCreated(t.id); onClose(); }}>
          Save draft</button>
        <button className="btn primary" disabled={!ok}
          onClick={() => { const t = window.IVS.createTransfer({ from, to, lines, send: true }); onCreated && onCreated(t.id); onClose(); }}>
          <ion-icon name="airplane-outline"></ion-icon>Send now · {money(value)}</button>
      </>}>
      <div className="fgrid">
        <Sel label="From" value={from} onChange={(v) => { setFrom(v); setLines([]); }} hint="Stock leaves here on send">
          {window.IV_LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.kind}</option>)}
        </Sel>
        <Sel label="To" value={to} onChange={setTo} hint="Arrives on hand only when received">
          {window.IV_LOCATIONS.filter((l) => l.id !== from).map((l) => <option key={l.id} value={l.id}>{l.name} · {l.kind}</option>)}
        </Sel>
      </div>
      {from === to && <Warn tone="bad" icon="close-circle-outline">Source and destination are the same location.</Warn>}
      <ItemAdd exclude={lines.map((l) => l.id)} onAdd={addLine}
        filter={(i) => !!i.stock && onHandAt(i.id, from) > 0}
        placeholder={'Add an item held at ' + IV.loc(from).name} />
      <LineRows lines={lines} head={['Line', 'Qty', 'Value']} variant="trf"
        onQty={(id, v) => patch(id, v)}
        onDrop={(id) => setLines((c) => c.filter((l) => l.id !== id))}
        right={(l, it) => <>{money(l.qty * (it.cost || 0))}
          <div className="ln__s" style={{ textAlign: 'right' }}>{onHandAt(l.id, from)} at source</div></>} />
      {lines.length > 0 && <div className="pricebox"><span className="k">In transit · {lines.length} lines</span><span className="v">{money(value)}</span></div>}
      {over.length > 0 && <Warn tone="bad" icon="warning-outline">
        {over.length} line{over.length > 1 ? 's' : ''} above what {IV.loc(from).name} holds — {over.map((l) => IV.item(l.id).name + ' has ' + onHandAt(l.id, from)).join(', ')}.
        Sending anyway drives that location negative, which needs an adjustment with an owner PIN instead.
      </Warn>}
      <Field label="Note" value={note} onChange={setNote} placeholder="Driver, crate count, anything the receiving end should know" />
      <Warn icon="git-compare-outline">
        <b>Save draft</b> reserves nothing — stock stays sellable at {IV.loc(from).name}. <b>Send now</b> posts the outbound movement immediately, and the quantity is owned but not sellable at either end until the destination receives it.
      </Warn>
    </Sheet>
  );
}

/* ============ PRINT TRANSFER LIST ============ */
/* The picking list. Quantity column is deliberately left for a pen — the point of the
   paper is to record what physically went in the crate, which is then typed at the
   far end and becomes the variance if it differs. */
function TransferPrintSheet({ tr, onClose }) {
  const f = IV.loc(tr.from), t = IV.loc(tr.to);
  const value = tr.lines.reduce((a, l) => a + l.qty * (IV.item(l.id).cost || 0), 0);
  const units = tr.lines.reduce((a, l) => a + l.qty, 0);
  return (
    <Sheet w="xl" title={'Print ' + tr.no} sub="Picking list — travels with the crate" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary" onClick={() => window.print()}><ion-icon name="print-outline"></ion-icon>Print</button>
      </>}>
      <div className="docpaper">
        <div className="dp__top">
          <div>
            <div className="dp__mark"><ion-icon name="git-compare"></ion-icon></div>
            <div className="dp__org">Koomzo Retail</div>
            <div className="dp__meta">Internal stock transfer<br />Not a sale · no money changes hands</div>
          </div>
          <div className="dp__no">
            <div className="dp__t">Transfer</div>
            <div className="dp__n">{tr.no}</div>
            <div className="dp__meta">Raised {tr.sent === '—' ? 'not sent' : tr.sent}<br />Expected {tr.eta}<br />{tr.lines.length} lines · {units} units</div>
          </div>
        </div>
        <div className="dp__addr">
          <div><span className="dp__lab">From</span>{f.name}<br />{f.kind} · code {f.code}<br />Picked by {tr.by}</div>
          <div><span className="dp__lab">To</span>{t.name}<br />{t.kind} · code {t.code}<br />Receiving hours 08:00 – 17:00</div>
        </div>
        <table className="dp__tbl">
          <thead><tr><th>#</th><th>Item</th><th>SKU</th><th className="r">Sent</th><th className="r">Received</th><th className="r">Value</th></tr></thead>
          <tbody>
            {tr.lines.map((l, n) => {
              const it = IV.item(l.id);
              return <tr key={l.id}><td>{n + 1}</td><td>{it.name}</td><td>{it.sku}</td>
                <td className="r">{qtyFmt(l.qty, it.unit)}</td><td className="r" style={{ color: 'var(--kz-muted-3)' }}>&nbsp;</td>
                <td className="r">{money(l.qty * (it.cost || 0))}</td></tr>;
            })}
          </tbody>
          <tfoot><tr><td colSpan="5" className="r">Transfer value</td><td className="r">{money(value)}</td></tr></tfoot>
        </table>
        <div className="dp__note">
          Count into the crate against the <b>Sent</b> column and write what actually travelled in <b>Received</b>. Any difference is typed at {t.name} and posts as a variance against {tr.no} — do not raise a second transfer for a short delivery.
        </div>
        <div className="dp__sign">
          <div><span className="dp__lab">Picked by</span>{tr.by}</div>
          <div><span className="dp__lab">Received by</span>&nbsp;</div>
          <div><span className="dp__lab">Date</span>&nbsp;</div>
        </div>
      </div>
    </Sheet>
  );
}

Object.assign(window, { ReceiveSheet, NewOrderSheet, PrintSheet, NewCountSheet, ScheduleCycleSheet, NewTransferSheet, TransferPrintSheet, IV_STAFF });
