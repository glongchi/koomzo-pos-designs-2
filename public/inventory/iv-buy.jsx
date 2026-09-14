/* Koomzo Inventory — Purchases (orders + receiving + reorder suggestions), Suppliers, Reports, Setup. */

function PurchaseView({ caps, loc, onOpen }) {
  const [tab, setTab] = useState('orders');
  const [selId, setSelId] = useState(IV_POS[0] ? IV_POS[0].id : null);
  /* `pushed` is the phone's navigation state. On tablet+ the pane is always beside the
     list and this is ignored; narrow, it decides whether the detail is on screen. */
  const [pushed, setPushed] = useState(false);
  const [recv, setRecv] = useState({});
  const [sq, setSq] = useState({});
  useEffect(() => { if (IV_POS[0]) setSelId(IV_POS[0].id); }, [IV_POS.length]);
  const doc = IV_POS.find((p) => p.id === selId);

  const suggestions = IV_ITEMS.filter((i) => i.stock && i.par && IV.onHand(i, 'all') <= i.reorder)
    .map((i) => ({ item: i, need: Math.max(0, i.par - IV.onHand(i, 'all')) }));
  const sneed = (r) => sq[r.item.id] !== undefined ? sq[r.item.id] : r.need;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Purchases</h2><p>Order, receive, and cost the stock in</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={() => onOpen('receive')}><ion-icon name="download-outline"></ion-icon>Receive</button>
        <button className="btn primary" onClick={() => onOpen('newOrder')}><ion-icon name="add-outline"></ion-icon>New order</button>
      </div>

      <Seg value={tab} onChange={setTab} tabs={[['orders', 'Orders', IV_POS.length],
        ...(caps.reorder ? [['suggest', 'Suggestions', suggestions.length]] : [])]} />

      {tab === 'orders' && (
        <div className="mdgrid wide">
          <div className="card" style={{ padding: 0 }}>
            {IV_POS.map((p) => {
              const pct = IV.poRecvPct(p), st = IV_PO_STATUS[p.status];
              return (
                <button className={'doc' + (selId === p.id ? ' on' : '')} key={p.id} onClick={() => { setSelId(p.id); setPushed(true); }}>
                  <div className="op-ic"><ion-icon name="receipt-outline"></ion-icon></div>
                  <div>
                    <div className="doc__no">{p.no}</div>
                    <div className="doc__m">{IV_SUPPLIERS.find((s) => s.id === p.supplier).name} · {p.lines.length} lines · due {p.expected}</div>
                  </div>
                  <div className="sp"></div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="op-v small">{money(IV.poTotal(p))}</div>
                    <span className="prog" style={{ display: 'block', marginTop: 5 }}>
                      <i className={pct === 1 ? 'done' : ''} style={{ width: (pct > 0 ? Math.max(10, pct * 100) : 0) + '%' }}></i></span>
                  </div>
                  <Risk tone={st.tone === 'ok' ? 'low' : st.tone}>{st.label}</Risk>
                </button>
              );
            })}
          </div>

          {doc && <PoPane doc={doc} recv={recv} setRecv={setRecv} onOpen={onOpen}
            pushed={pushed} onBack={() => setPushed(false)} />}
        </div>
      )}

      {tab === 'suggest' && <>
        <div className="hint pri" style={{ marginBottom: 12 }}><ion-icon name="sparkles-outline"></ion-icon>
          <span>Anything at or below its reorder point, topped up to par and grouped by supplier. Edit quantities, then raise one draft order per supplier.</span></div>
        {IV_SUPPLIERS.map((s) => {
          const rows = suggestions.filter((x) => x.item.supplier === s.id);
          if (!rows.length) return null;
          const total = rows.reduce((a, r) => a + sneed(r) * r.item.cost, 0);
          return (
            <div className="card" key={s.id} style={{ padding: 0, marginBottom: 12 }}>
              <div className="op-head">
                <div><h3>{s.name}</h3><p>Lead time {s.lead} days · {s.terms} · minimum {money(s.moq)}</p></div>
                <div className="sp"></div>
                {total < s.moq && <Risk tone="watch">Below minimum</Risk>}
                <button className="btn primary" disabled={!total} onClick={() => {
                  const lines = rows.filter((r) => sneed(r) > 0).map((r) => ({ id: r.item.id, qty: sneed(r), cost: r.item.cost }));
                  const po = window.IVS.createPO({ supplier: s.id, to: 'wh', lines, send: false });
                  setSelId(po.id); setPushed(true); setTab('orders');
                }}><ion-icon name="receipt-outline"></ion-icon>Raise draft · {money(total)}</button>
              </div>
              {rows.map((r) => (
                <div className="ln" key={r.item.id}>
                  <div><div className="ln__n">{r.item.name}</div><div className="ln__s">{r.item.sku} · on hand {IV.onHand(r.item, 'all')} · par {r.item.par}</div></div>
                  <div className="r ln-exp" style={{ color: 'var(--kz-muted-2)' }}>{money(r.item.cost)}</div>
                  <div><input className="numin" value={sneed(r)}
                    onChange={(e) => setSq((c) => ({ ...c, [r.item.id]: Math.max(0, +e.target.value || 0) }))} /></div>
                  <div className="r">{money(sneed(r) * r.item.cost)}</div>
                </div>
              ))}
            </div>
          );
        })}
      </>}
    </div>
  );
}

function PoPane({ doc, recv, setRecv, onOpen, pushed, onBack }) {
  const sup = IV_SUPPLIERS.find((s) => s.id === doc.supplier);
  const get = (l) => recv[doc.id + l.id] !== undefined ? recv[doc.id + l.id] : l.recv;
  const set = (l, v) => setRecv((c) => ({ ...c, [doc.id + l.id]: Math.max(0, +v || 0) }));
  const outstanding = doc.lines.reduce((s, l) => s + (l.qty - get(l)) * l.cost, 0);
  const receivedVal = doc.lines.reduce((s, l) => s + get(l) * l.cost, 0);
  /* the input holds cumulative received-to-date, so a receipt posts the delta. Untouched,
     the button receives the whole outstanding balance — the common case at the door. */
  const typed = doc.lines.some((l) => recv[doc.id + l.id] !== undefined);
  const arriving = doc.lines
    .map((l) => ({ id: l.id, qty: typed ? get(l) - l.recv : l.qty - l.recv, cost: l.cost }))
    .filter((l) => l.qty > 0);
  return (
    <div className={'mdpane' + (pushed ? ' pushed' : '')}>
      <div className="mdpane__hd">
        <button className="icbtn backbtn" onClick={onBack}><ion-icon name="chevron-back-outline"></ion-icon></button>
        <div className="av" style={{ background: 'var(--kz-primary-wash)', color: 'var(--kz-primary)' }}><ion-icon name="receipt-outline"></ion-icon></div>
        <div><h3>{doc.no}</h3><p>{sup.name} · into {IV.loc(doc.to).name}</p></div>
      </div>
      <div className="op-bd" style={{ paddingBottom: 4 }}>
        <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 12 }}>
          <div className="kpi"><div className="k">Received</div><div className="v">{money(receivedVal)}</div></div>
          <div className="kpi"><div className="k">Outstanding</div><div className="v" style={{ color: outstanding ? '#a3761c' : 'var(--kz-success)' }}>{money(outstanding)}</div></div>
        </div>
      </div>
      <div>
        <div className="ln" style={{ background: 'var(--kz-surface-2)', font: '600 10.5px var(--kz-font-sans)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--kz-muted-3)' }}>
          <div>Line</div><div className="r ln-exp">Ordered</div><div className="r">Receive</div><div className="r">Cost</div>
        </div>
        {doc.lines.map((l) => {
          const it = IV.item(l.id), r = get(l), over = r > l.qty;
          return (
            <div className="ln" key={l.id}>
              <div><div className="ln__n">{it.name}</div><div className="ln__s">{it.sku} · {money(l.cost)} / {it.unit}</div></div>
              <div className="r ln-exp" style={{ color: 'var(--kz-muted-2)' }}>{qtyFmt(l.qty)}</div>
              <div><input className={'numin' + (over ? ' badv' : r === l.qty ? '' : ' warnv')} value={r} onChange={(e) => set(l, e.target.value)} /></div>
              <div className="r">{money(r * l.cost)}</div>
            </div>
          );
        })}
      </div>
      <div className="op-bd">
        <KV k="Terms" v={sup.terms} />
        <KV k="Expected" v={doc.expected} />
        <KV k="Order total" v={money(IV.poTotal(doc))} num />
        <div className="hint" style={{ marginTop: 10 }}><ion-icon name="cube-outline"></ion-icon>
          <span>Receiving posts a <b>receipt</b> movement per line into {IV.loc(doc.to).name} and re-averages unit cost. Short receipts leave the order open.</span></div>
      </div>
      <div className="mdfoot">
        <button className="btn" onClick={() => onOpen('print', { po: doc })}><ion-icon name="print-outline"></ion-icon>Print</button>
        {doc.status === 'draft'
          ? <button className="btn primary" onClick={() => window.IVS.sendPO(doc.id)}>
              <ion-icon name="send-outline"></ion-icon>Send order</button>
          : <button className="btn primary" disabled={doc.status === 'received' || !arriving.length}
              onClick={() => { window.IVS.receive({ poId: doc.id, lines: arriving, ref: doc.no + ' · ' + sup.name }); setRecv({}); }}>
              <ion-icon name="download-outline"></ion-icon>
              {doc.status === 'received' ? 'Received' : !arriving.length ? 'Nothing arriving'
                : typed ? 'Receive ' + arriving.length + ' line' + (arriving.length > 1 ? 's' : '')
                : 'Receive all outstanding'}</button>}
      </div>
    </div>
  );
}

/* ================= SUPPLIERS ================= */
/* ================= PARTNERS =================
   One list with role tags, not a supplier book and a customer book. The same record
   answers “who did we buy this from” and “who did we issue it to”, and a partner who
   does both — common here — is one account rather than two that drift. Supply-side
   facts (lead time, minimum, on-time) only render for a partner that supplies. */
function SuppliersView({ onOpen }) {
  const [role, setRole] = useState('all');
  const list = IV_PARTNERS.filter((p) => role === 'all' || p.roles.indexOf(role) > -1);
  const [selId, setSelId] = useState(IV_PARTNERS[0].id);
  const [pushed, setPushed] = useState(false);
  const s = list.find((x) => x.id === selId) || list[0] || IV_PARTNERS[0];
  const supplies = s.roles.indexOf('supplier') > -1;
  const buys = s.roles.indexOf('customer') > -1;
  const items = IV_ITEMS.filter((i) => i.supplier === s.id);
  const sent = (window.IV_OUTBOX || []).filter((m) => m.supplier === s.id);
  const orders = IV_POS.filter((p) => p.supplier === s.id && p.status !== 'received');
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Partners</h2><p>Everyone you buy from or sell to, in one list</p></div>
        <div className="sp"></div>
        <button className="btn primary" onClick={() => onOpen('newSupplier')}><ion-icon name="add-outline"></ion-icon>Add partner</button>
      </div>
      <div className="fbar">
        <div className="opts" style={{ marginTop: 0 }}>
          {[['all', 'All', 'people-outline'], ['supplier', 'Suppliers', 'cube-outline'], ['customer', 'Customers', 'person-outline']].map(([v, l, ic]) => (
            <button key={v} className={'opt' + (role === v ? ' on' : '')} style={{ height: 36, fontSize: 12.5 }} onClick={() => setRole(v)}>
              <ion-icon name={ic} style={{ fontSize: 15 }}></ion-icon>{l}
              <i style={{ fontStyle: 'normal', opacity: .55, marginLeft: 2 }}>{v === 'all' ? IV_PARTNERS.length : IV_PARTNERS.filter((p) => p.roles.indexOf(v) > -1).length}</i>
            </button>
          ))}
        </div>
      </div>
      <div className="mdgrid">
        <div className="card" style={{ padding: 0 }}>
          {list.map((x) => (
            <button className={'doc' + (selId === x.id ? ' on' : '')} key={x.id} onClick={() => { setSelId(x.id); setPushed(true); }}>
              <div className="op-ic"><ion-icon name={x.roles.indexOf('supplier') > -1 ? 'people-circle-outline' : 'person-circle-outline'}></ion-icon></div>
              <div>
                <div className="doc__no" style={{ fontFamily: 'var(--kz-font-sans)' }}>{x.name}</div>
                <div className="doc__m">{x.roles.indexOf('supplier') > -1
                  ? IV_ITEMS.filter((i) => i.supplier === x.id).length + ' items · lead ' + x.lead + ' d · ' + x.terms
                  : x.contact + ' · ' + x.terms}</div>
              </div>
              <div className="sp"></div>
              <div className="roletags">
                {x.roles.map((r) => <span className={'roletag ' + r} key={r}>{IV_ROLE[r].label}</span>)}
              </div>
            </button>
          ))}
        </div>
        <div className={'mdpane' + (pushed ? ' pushed' : '')}>
          <div className="mdpane__hd">
            <button className="icbtn backbtn" onClick={() => setPushed(false)}><ion-icon name="chevron-back-outline"></ion-icon></button>
            <div className="av" style={{ background: 'var(--kz-primary-wash)', color: 'var(--kz-primary)' }}><ion-icon name="business-outline"></ion-icon></div>
            <div><h3>{s.name}</h3><p>{s.contact}</p></div>
            <div className="sp"></div>
            <div className="roletags">{s.roles.map((r) => <span className={'roletag ' + r} key={r}>{IV_ROLE[r].label}</span>)}</div>
          </div>
          <div className="mdbd">
            <KV k="Email" v={s.email || '—'} /><KV k="Phone" v={s.phone || '—'} />
            <KV k="Payment terms" v={s.terms} />
            {supplies && <><KV k="Lead time" v={s.lead + ' days'} />
              <KV k="Minimum order" v={money(s.moq)} num />
              <KV k="On time" v={Math.round(s.onTime * 100) + '%'} /></>}
            <KV k={buys && !supplies ? 'Sold to · 12 mo' : 'Spend · 12 mo'} v={money(s.spend)} num />
            <div className="hint"><ion-icon name="information-circle-outline"></ion-icon><span>{s.note}</span></div>
            {orders.length > 0 && (
              <div className="grp">
                <span className="grp__t">Open orders</span>
                {orders.map((p) => (
                  <div className="op-row" key={p.id}>
                    <div className="op-ic"><ion-icon name="receipt-outline"></ion-icon></div>
                    <div><div className="op-k">{p.no}</div><div className="op-d">{IV_PO_STATUS[p.status].label} · due {p.expected}</div></div>
                    <div className="sp"></div>
                    <div className="op-v small">{money(IV.poTotal(p))}</div>
                  </div>
                ))}
              </div>
            )}
            {sent.length > 0 && (
              <div className="grp">
                <span className="grp__t">Sent from this device</span>
                {sent.slice(0, 4).map((m) => (
                  <div className="op-row" key={m.id}>
                    <div className="op-ic"><ion-icon name={m.state === 'queued' ? 'time-outline' : 'mail-open-outline'}></ion-icon></div>
                    <div><div className="op-k">{m.subject}</div><div className="op-d">{m.at}{m.ref ? ' · ' + m.ref : ''}</div></div>
                    <div className="sp"></div>
                    <Risk tone={m.state === 'queued' ? 'watch' : 'low'}>{m.state === 'queued' ? 'Queued' : 'Sent'}</Risk>
                  </div>
                ))}
              </div>
            )}
            <div className="grp">
              <span className="grp__t">{supplies ? 'Items supplied' : 'Items bought'}</span>
              {items.length ? items.map((i) => (
                <div className="rcp" key={i.id}>
                  <div className="rcp__ic" style={{ background: i.tint.bg, color: i.tint.fg }}><ion-icon name={i.icon}></ion-icon></div>
                  <div><div className="nm">{i.name}</div><div className="ds">{i.sku} · {money(i.cost)}</div></div>
                  <div className="sp"></div><StockPill item={i} loc="all" />
                </div>
              )) : <div className="fhint">Nothing linked yet.</div>}
            </div>
          </div>
          <div className="mdfoot">
            <button className="btn" onClick={() => onOpen('email', { supplier: s })}><ion-icon name="mail-outline"></ion-icon>Email</button>
            {supplies
              ? <button className="btn primary" onClick={() => onOpen('newOrder', { supplierId: s.id })}><ion-icon name="receipt-outline"></ion-icon>New order</button>
              : <button className="btn primary" onClick={() => onOpen('move', { mkind: 'out' })}><ion-icon name="arrow-up-outline"></ion-icon>Stock out</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ORDERS =================
   Purchases and the suppliers they are raised against are one job with two faces, so
   they are one destination with two tabs — not two rail entries a shopkeeper has to
   choose between. Sales orders and returns are deliberately absent: neither exists in
   the data model yet, and a tab that opens on an empty shell is the pattern this
   restructure set out to remove. */
function OrdersView({ caps, loc, onOpen }) {
  const tabs = [['purchases', 'Purchases', (IV_POS || []).filter((p) => p.status === 'sent' || p.status === 'partial').length]]
    .concat(caps.suppliers ? [['suppliers', 'Partners', IV_PARTNERS.length]] : []);
  const [tab, setTab] = useState('purchases');
  return (
    <div className="view">
      {tabs.length > 1 && <Seg value={tab} onChange={setTab} tabs={tabs} />}
      {tab === 'purchases' && <div className="ivsub"><PurchaseView caps={caps} loc={loc} onOpen={onOpen} /></div>}
      {tab === 'suppliers' && <div className="ivsub"><SuppliersView onOpen={onOpen} /></div>}
    </div>
  );
}

/* ================= REPORTS ================= */
function ReportsView({ loc, caps, onGo, onOpenItem }) {
  const [tab, setTab] = useState('summary');
  const stocked = IV_ITEMS.filter((i) => i.stock);
  const byCat = IV_CATS.map((c) => ({
    ...c, v: stocked.filter((i) => i.cat === c.id).reduce((s, i) => s + IV.value(i, loc), 0),
  })).filter((c) => c.v > 0).sort((a, b) => b.v - a.v);
  const total = byCat.reduce((s, c) => s + c.v, 0);
  const colors = ['#6a61bf', '#528cef', '#2e9e5b', '#e0a32e', '#ec603a', '#c2497e'];
  let acc = 0;
  const stops = byCat.map((c, n) => { const a = acc; acc += c.v / total * 360; return `${colors[n % 6]} ${a}deg ${acc}deg`; }).join(',');

  const shrinkTotal = IV_SHRINK.reduce((s, r) => s + r.v, 0);
  const maxSold = Math.max(...IV_TURNOVER.map((t) => t.sold));

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Reports</h2><p>{loc === 'all' ? 'All locations' : IV.loc(loc).name} · month to date</p></div>
        <div className="sp"></div>
        <button className="btn"><ion-icon name="download-outline"></ion-icon>Export CSV</button>
      </div>
      <Seg value={tab} onChange={setTab} tabs={[['summary', 'Summary'], ['value', 'Valuation'], ['margin', 'Margin & COGS'], ['move', 'Turnover'], ['shrink', 'Shrinkage']]} />

      {tab === 'summary' && <Overview loc={loc} caps={caps || {}} onGo={onGo} onOpenItem={onOpenItem} bare />}

      {tab === 'value' && <div className="op2">
        <div className="card">
          <div className="card__t">Stock value by category</div>
          <div className="card__s">At weighted average cost</div>
          <div className="donut" style={{ marginTop: 16 }}>
            <div className="donut__g" style={{ background: `conic-gradient(${stops})`, maskImage: 'radial-gradient(circle, transparent 52%, #000 53%)', WebkitMaskImage: 'radial-gradient(circle, transparent 52%, #000 53%)' }}></div>
            <div className="donut__l">
              {byCat.map((c, n) => (
                <div key={c.id}><i style={{ background: colors[n % 6] }}></i>{c.label}<span className="sp"></span><b>{money(c.v)}</b></div>
              ))}
              <div style={{ borderTop: '1px solid var(--kz-border)', paddingTop: 7 }}><b style={{ font: '700 12px var(--kz-font-sans)' }}>Total</b><span className="sp"></span><b>{money(total)}</b></div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div className="op-head"><div><h3>Value by location</h3><p>Where the money is sitting</p></div></div>
          <div className="op-bd" style={{ paddingTop: 4 }}>
            {IV_LOCATIONS.map((l) => {
              const v = stocked.reduce((s, i) => s + (i.stock[l.id] || 0) * (i.cost || 0), 0);
              return (
                <div className="op-row" key={l.id}>
                  <div className="op-ic"><ion-icon name={l.icon}></ion-icon></div>
                  <div><div className="op-k">{l.name}</div><div className="op-d">{l.kind}{l.sells ? ' · sells' : ' · holding only'}</div></div>
                  <div className="sp"></div><div className="op-v">{money(v)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>}

      {tab === 'margin' && <div className="card" style={{ padding: 0 }}>
        <div className="op-head"><div><h3>Margin by item</h3><p>Retail lines only — services carry product cost separately</p></div></div>
        <div>
          {stocked.filter((i) => i.price > 0).sort((a, b) => (b.price - b.cost) - (a.price - a.cost)).map((i) => {
            const m = (1 - i.cost / i.price);
            return (
              <div className="op-row" key={i.id} style={{ padding: '10px 16px' }}>
                <Av item={i} />
                <div><div className="op-k">{i.name}</div><div className="op-d">{money(i.cost)} cost · {money(i.price)} retail</div></div>
                <div className="sp"></div>
                <div style={{ width: 120 }}><span className="track" style={{ display: 'block', height: 6, borderRadius: 999, background: 'var(--kz-surface-2)', overflow: 'hidden' }}>
                  <i style={{ display: 'block', height: '100%', width: (m * 100) + '%', background: m > 0.55 ? 'var(--kz-success)' : 'var(--kz-primary)', borderRadius: 999 }}></i></span></div>
                <div className="op-v" style={{ minWidth: 56, textAlign: 'right' }}>{Math.round(m * 100)}%</div>
              </div>
            );
          })}
        </div>
        <div className="op-bd"><div className="hint"><ion-icon name="cut-outline"></ion-icon>
          <span>Salon services are not in this table. A colour service costs product from the back bar — its true margin is on the <b>Service</b> tab of the item.</span></div></div>
      </div>}

      {tab === 'move' && <div className="card">
        <div className="card__t">Units sold · 90 days</div>
        <div className="card__s">Turns per year alongside</div>
        <div className="hbars" style={{ marginTop: 14 }}>
          {IV_TURNOVER.map((t) => {
            const i = IV.item(t.id);
            return (
              <div className="hbar" key={t.id}>
                <span className="nm">{i.name}</span>
                <span className="track"><i className={t.turns < 1 ? 'warn' : ''} style={{ width: (t.sold / maxSold * 100) + '%' }}></i></span>
                <span className="v">{t.sold} · {t.turns}×</span>
              </div>
            );
          })}
        </div>
        <div className="hint" style={{ marginTop: 14 }}><ion-icon name="trending-down-outline"></ion-icon>
          <span>Under one turn a year is dead capital. <b>Sectioning Clips</b> and <b>Round Brush</b> are candidates to delist or discount.</span></div>
      </div>}

      {tab === 'shrink' && <div className="op2">
        <div className="card" style={{ padding: 0 }}>
          <div className="op-head"><div><h3>Loss by reason</h3><p>Month to date · {money(shrinkTotal)}</p></div></div>
          <div className="op-bd" style={{ paddingTop: 4 }}>
            {IV_SHRINK.map((r) => (
              <div className="op-row" key={r.reason}>
                <div className="op-ic"><ion-icon name="remove-circle-outline"></ion-icon></div>
                <div><div className="op-k">{r.reason}</div><div className="op-d">{r.note}</div></div>
                <div className="sp"></div>
                <div className="op-v bad">{money(r.v)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card__t">Read it this way</div>
          <div className="card__s" style={{ lineHeight: 1.6, marginTop: 8 }}>
            Back-bar use is not loss — it is the cost of delivering services, and it should track service volume.
            Everything else is leakage. Theft concentrated in one category at one location is an operational problem, not an inventory one.
          </div>
          <div className="card__row"><span className="k" style={{ font: '600 12.5px var(--kz-font-sans)', color: 'var(--kz-muted)' }}>True leakage</span>
            <span className="v">{money(shrinkTotal - IV_SHRINK[0].v)}</span></div>
        </div>
      </div>}
    </div>
  );
}

/* ================= SETUP ================= */
const TIER_COPY = {
  lite:     { name: 'Lite',     chip: 'Lite · one shop',   icon: 'leaf-outline',
    desc: 'Items, stock in / out / adjust, and the ledger. One location.' },
  standard: { name: 'Standard', chip: 'Standard',          icon: 'storefront-outline',
    desc: 'Adds locations, moving stock, purchasing, partners and reports.' },
  pro:      { name: 'Pro',      chip: 'Pro · full',        icon: 'business-outline',
    desc: 'Adds counts and cycle programmes, bundles, lots and serials.' },
};

function SetupView({ caps, onCap, mode, onMode, loc }) {
  const on = (k) => !!caps[k];
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Setup</h2><p>Turn the module into what this business actually needs</p></div>
        <div className="sp"></div>
        <span className={'modechip' + (mode === 'pro' ? ' full' : '')}>{TIER_COPY[mode] ? TIER_COPY[mode].chip : mode}</span>
      </div>

      <div className="setup2">
        <div className="panel">
          <div className="panel__hd"><div><h3>Plan</h3><p>Each tier is a floor, not a cage — every capability below is still switchable</p></div></div>
          <div className="panel__bd">
            <div className="opts" style={{ marginTop: 0 }}>
              {['lite', 'standard', 'pro'].map((m) => (
                <button key={m} className={'opt' + (mode === m ? ' on' : '')} style={{ height: 44 }} onClick={() => onMode(m)}>
                  <ion-icon name={TIER_COPY[m].icon}></ion-icon>{TIER_COPY[m].name}</button>
              ))}
            </div>
            <div className="tierlist">
              {['lite', 'standard', 'pro'].map((m) => (
                <div className={'tierrow' + (mode === m ? ' on' : '')} key={m}>
                  <b>{TIER_COPY[m].name}</b><span>{TIER_COPY[m].desc}</span>
                </div>
              ))}
            </div>
            <div className="hint" style={{ marginTop: 12 }}><ion-icon name="information-circle-outline"></ion-icon>
              <span>The tier sets which capabilities are on; it never removes a route or touches your data. A screen that is not rendered is a screen nobody verifies, so everything reads the same map.</span></div>
          </div>

          <div className="panel__hd" style={{ borderTop: '1px solid var(--kz-border)' }}>
            <div><h3>Capabilities</h3><p>Each one is a screen or a field the staff will meet</p></div>
          </div>
          <div className="panel__bd" style={{ paddingTop: 4 }}>
            {IV_CAPS.map((c) => (
              <div className={'trow2' + (on(c.key) ? ' on' : '')} key={c.key}>
                <div className="trow2__ic"><ion-icon name={c.icon}></ion-icon></div>
                <div><div className="trow2__t">{c.name}</div><div className="trow2__d">{c.desc}</div></div>
                <div className="sp" style={{ flex: 1 }}></div>
                {c.always ? <span className="badge">Always on</span>
                  : <Toggle on={on(c.key)} onChange={() => onCap(c.key)} />}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel__hd"><div><h3>Locations</h3><p>Stock is held per location; a register sells from exactly one</p></div>
            <div className="sp"></div><button className="btn"><ion-icon name="add-outline"></ion-icon>Add</button></div>
          <div className="panel__bd" style={{ paddingTop: 4 }}>
            {IV_LOCATIONS.map((l) => (
              <div className="op-row" key={l.id}>
                <div className="op-ic"><ion-icon name={l.icon}></ion-icon></div>
                <div><div className="op-k">{l.name}</div><div className="op-d">{l.kind} · code {l.code}</div></div>
                <div className="sp"></div>
                <span className="badge">{l.sells ? 'Sells' : 'Holds only'}</span>
              </div>
            ))}
            {!caps.locations && <div className="hint" style={{ marginTop: 12 }}><ion-icon name="lock-closed-outline"></ion-icon>
              <span>Multi-location is off — everything rolls up to <b>{IV_LOCATIONS[0].name}</b>.</span></div>}
          </div>

          <div className="panel__hd" style={{ borderTop: '1px solid var(--kz-border)' }}>
            <div><h3>Costing</h3><p>How unit cost is recalculated on receipt</p></div></div>
          <div className="panel__bd">
            <div className="opts" style={{ marginTop: 0 }}>
              <button className="opt on" style={{ height: 40, fontSize: 13 }}>Weighted average</button>
              <button className="opt" style={{ height: 40, fontSize: 13 }}>FIFO</button>
              <button className="opt" style={{ height: 40, fontSize: 13 }}>Last cost</button>
            </div>
          </div>

          <div className="panel__hd" style={{ borderTop: '1px solid var(--kz-border)' }}>
            <div><h3>Adjustment reasons</h3><p>Staff must pick one — this is what makes shrinkage readable</p></div></div>
          <div className="panel__bd">
            <div className="taglist">
              {IV_REASONS.map((r) => <span className="tag" key={r.id}>{r.label}</span>)}
              <button className="tag" style={{ border: '1px dashed var(--kz-border-strong)', background: '#fff' }}><ion-icon name="add-outline" style={{ fontSize: 13 }}></ion-icon>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OrdersView, PurchaseView, SuppliersView, ReportsView, SetupView, TIER_COPY });
