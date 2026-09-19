/* Koomzo Retail POS — Sales history screen.
   List answers "which transaction", the receipt pane answers "what happened",
   the event log answers "who did what to it since". Refunds hand off to Returns. */

/* local copies of the shared primitives — this file must not depend on script order */
function SegS({ tabs, value, onChange }) {
  return (
    <div className="seg">
      {tabs.map(([id, label, n]) => (
        <button key={id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>{label}{n ? <i>{n}</i> : null}</button>
      ))}
    </div>
  );
}
function RiskS({ tone, children }) { return <span className={'risk ' + tone}>{children}</span>; }
const fmt = (n) => (n < 0 ? '−' : '') + window.KZ_LOCALE.short(Math.abs(n));

const DAYS = [['today', 'Today'], ['yest', 'Yesterday'], ['all', 'All']];

function SalesView({ onRefund, onCustomer }) {
  const S = window.RX_SALES, F = window.RX_SALE;
  const [day, setDay] = React.useState('today');
  const [q, setQ] = React.useState('');
  const [tender, setTender] = React.useState('all');
  const [who, setWho] = React.useState('all');
  const [selId, setSelId] = React.useState(null);
  const [printing, setPrinting] = React.useState(null);

  const cashiers = [...new Set(S.map((s) => s.cashier))];
  const rows = S.filter((s) => {
    if (day === 'today' && !s.at.startsWith('Today')) return false;
    if (day === 'yest' && !s.at.startsWith('Yesterday')) return false;
    if (tender !== 'all' && s.tender !== tender) return false;
    if (who !== 'all' && s.cashier !== who) return false;
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (s.no + ' ' + s.customer + ' ' + s.cashier + ' ' + (s.ref || '') + ' ' +
      String(F.total(s)) + ' ' + s.lines.map((l) => l.name).join(' ')).toLowerCase().includes(t);
  });

  const counted = rows.filter((s) => s.status !== 'voided');
  const gross = counted.reduce((a, s) => a + F.total(s), 0);
  const refunds = rows.reduce((a, s) => a + F.refund(s), 0);
  const sale = S.find((s) => s.id === selId);

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Sales</h2><p>{rows.length} transactions · {fmt(gross - refunds)} net</p></div>
        <div className="sp"></div>
        <button className="btn"><ion-icon name="download-outline"></ion-icon>Export</button>
        <button className="btn"><ion-icon name="funnel-outline"></ion-icon>Report</button>
      </div>

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(136px,1fr))' }}>
        <div className="kpi"><div className="k">Gross sales</div><div className="v">{fmt(gross)}</div></div>
        <div className="kpi"><div className="k">Refunds</div><div className="v" style={{ color: refunds ? 'var(--kz-discount)' : 'var(--kz-ink)' }}>{refunds ? '−' + fmt(refunds) : fmt(0)}</div></div>
        <div className="kpi"><div className="k">Transactions</div><div className="v">{counted.length}</div></div>
        <div className="kpi"><div className="k">Average ticket</div><div className="v">{fmt(counted.length ? gross / counted.length : 0)}</div></div>
        <div className="kpi"><div className="k">Units</div><div className="v">{counted.reduce((a, s) => a + window.RX_SALE.units(s), 0)}</div></div>
      </div>

      <div className="fbar">
        <div className="field"><ion-icon name="search-outline"></ion-icon>
          <input placeholder="Receipt no, customer, amount, MoMo number" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="sel" value={tender} onChange={(e) => setTender(e.target.value)}>
          <option value="all">Any tender</option>
          {Object.keys(window.RX_TENDERS).map((k) => <option key={k} value={k}>{window.RX_TENDERS[k].label}</option>)}
        </select>
        <select className="sel" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="all">All cashiers</option>
          {cashiers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <SegS value={day} onChange={setDay} tabs={DAYS} />

      <div className="mdgrid wide" style={sale ? null : { gridTemplateColumns: '1fr' }}>
        <div className="card" style={{ padding: 0 }}>
          {rows.map((s) => <SaleRow key={s.id} s={s} on={selId === s.id} onClick={() => setSelId(s.id)} />)}
          {!rows.length && (
            <div className="empty" style={{ padding: '48px 24px' }}>
              <ion-icon name="receipt-outline"></ion-icon>
              <p><b style={{ display: 'block', color: 'var(--kz-ink-2)', font: '600 14px var(--kz-font-sans)' }}>No transactions match</b>Widen the day range or clear a filter.</p>
            </div>
          )}
        </div>
        {sale && <SalePane s={sale} onRefund={onRefund} onCustomer={onCustomer} onPrint={() => setPrinting(sale)} onClose={() => setSelId(null)} />}
      </div>
      {printing && <ReceiptPrint s={printing} onClose={() => setPrinting(null)} />}
    </div>
  );
}

function SaleRow({ s, on, onClick }) {
  const F = window.RX_SALE, st = window.RX_SALE_STATUS[s.status], tn = window.RX_TENDERS[s.tender];
  return (
    <button className={'srow' + (on ? ' on' : '')} onClick={onClick}>
      <div className="srow__ic"><ion-icon name={tn.icon}></ion-icon></div>
      <div className="srow__b">
        <div className="srow__n"><span>{'#' + s.no}</span><span className="srow__c">{s.customer}</span></div>
        <div className="srow__m">
          <span>{s.at}</span><span>·</span><span>{s.lane}</span><span>·</span><span>{s.cashier}</span>
          <span>·</span><span>{F.units(s)} {F.units(s) === 1 ? 'item' : 'items'}</span>
        </div>
      </div>
      <div className="srow__r">
        <div className={'srow__t' + (s.status === 'voided' ? ' void' : '')}>{fmt(F.total(s))}</div>
        <div className="srow__td">{tn.label}{s.ref ? ' · ' + s.ref : ''}</div>
      </div>
      {s.status !== 'paid' && <RiskS tone={st.tone}>{st.label}</RiskS>}
    </button>
  );
}

function SalePane({ s, onRefund, onCustomer, onPrint, onClose }) {
  const F = window.RX_SALE;
  const [tab, setTab] = React.useState('receipt');
  React.useEffect(() => { setTab('receipt'); }, [s.id]);
  const st = window.RX_SALE_STATUS[s.status], tn = window.RX_TENDERS[s.tender];
  const refunded = F.refund(s);
  const voided = s.status === 'voided';

  return (
    <div className="mdpane pushed">
      <div className="mdpane__hd">
        <div className="av" style={{ background: 'var(--kz-primary-wash)', color: 'var(--kz-primary)' }}><ion-icon name="receipt-outline"></ion-icon></div>
        <div style={{ minWidth: 0 }}>
          <h3>Order #{s.no}</h3>
          <p>{s.at} · {s.lane} · {s.cashier}</p>
        </div>
        <div className="sp"></div>
        {s.status !== 'paid' && <RiskS tone={st.tone}>{st.label}</RiskS>}
        <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
      </div>
      <div className="mdtabs">
        <button className={tab === 'receipt' ? 'on' : ''} onClick={() => setTab('receipt')}>Receipt</button>
        <button className={tab === 'events' ? 'on' : ''} onClick={() => setTab('events')}>Activity</button>
        <button className={tab === 'tender' ? 'on' : ''} onClick={() => setTab('tender')}>Payment</button>
      </div>

      <div className="mdbd">
        {tab === 'receipt' && (
          <div className={'rcpt' + (voided ? ' voided' : '')}>
            <div className="rcpt__hd">
              <strong>Koomzo</strong>
              <span>{s.lane} · {s.at}</span>
              <span>Order #{s.no} · {s.customer}</span>
            </div>
            {s.lines.map((l, n) => (
              <div className={'rcpt__l' + (l.refunded ? ' back' : '')} key={n}>
                <span className="q">{l.qty}×</span>
                <span className="nm">{l.name}
                  <small>{l.sub}{l.service ? ' · service' : ''}{l.composite ? ' · kit' : ''}{l.refunded ? ' · ' + l.refunded + ' returned' : ''}</small>
                </span>
                <span className="v">{fmt(l.qty * l.price)}</span>
              </div>
            ))}
            <div className="rcpt__tot">
              <div><span>Subtotal</span><b>{fmt(F.gross(s))}</b></div>
              {s.disc ? <div className="neg"><span>Discount</span><b>−{fmt(s.disc)}</b></div> : null}
              <div><span>{window.KZ_LOCALE.taxLabel(!s.rate)}</span><b>{fmt(F.tax(s))}</b></div>
              {s.tip ? <div><span>Tip</span><b>{fmt(s.tip)}</b></div> : null}
              <div className="big"><span>Total</span><b>{fmt(F.total(s))}</b></div>
              {refunded ? <div className="neg"><span>Refunded</span><b>−{fmt(refunded)}</b></div> : null}
              {refunded ? <div className="big"><span>Net</span><b>{fmt(F.total(s) - refunded)}</b></div> : null}
            </div>
            {voided && <div className="rcpt__stamp">Voided</div>}
          </div>
        )}

        {tab === 'events' && (
          <div className="tline">
            {s.events.map(([t, k, d], n) => (
              <div className="tline__i" key={n}>
                <span className="dot"></span>
                <div><div className="t">{k}<em>{t}</em></div><div className="d">{d}</div></div>
              </div>
            ))}
          </div>
        )}

        {tab === 'tender' && <>
          {s.split ? (
            <div className="methods">
              {s.split.map(([k, v, ref], n) => (
                <div className="method" key={n}>
                  <ion-icon name={window.RX_TENDERS[k].icon} style={{ fontSize: 19, color: 'var(--kz-muted-2)' }}></ion-icon>
                  <div><div className="nm">{window.RX_TENDERS[k].label}</div>
                    {ref && <div className="op-d">····{ref.replace(/·/g, '')}</div>}</div>
                  <div className="sp" style={{ flex: 1 }}></div>
                  <div className="op-v small">{fmt(v)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="method on">
              <ion-icon name={tn.icon} style={{ fontSize: 19, color: 'var(--kz-primary)' }}></ion-icon>
              <div><div className="nm">{tn.label}{s.ref ? ' · ' + s.ref : ''}</div>
                <div className="op-d">{s.tendered ? 'Tendered ' + fmt(s.tendered) + ' · change ' + fmt(Math.max(0, s.tendered - F.total(s))) : 'Captured in full'}</div></div>
              <div className="sp" style={{ flex: 1 }}></div>
              <div className="op-v small">{fmt(F.total(s))}</div>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <KVrow k="Customer" v={s.customer} />
            <KVrow k="Cashier" v={s.cashier} />
            <KVrow k="Register" v={s.lane} />
            <KVrow k="TVA" v={String(s.rate * 100).replace('.', ',') + ' %'} />
            <KVrow k="Status" v={st.label} />
          </div>
          {s.status === 'unpaid' && <div className="flagrow warn" style={{ marginTop: 12 }}>
            <ion-icon name="time-outline"></ion-icon><span>Invoiced to a trade account. It counts as a sale today; the cash arrives on terms.</span></div>}
        </>}
      </div>

      <div className="mdfoot">
        <button className="btn" onClick={onPrint}><ion-icon name="print-outline"></ion-icon>Reprint</button>
        <button className="btn"><ion-icon name="mail-outline"></ion-icon>Email</button>
        {s.customer !== 'Walk-in' && <button className="btn" onClick={onCustomer}><ion-icon name="person-outline"></ion-icon>Customer</button>}
        <button className="btn primary" disabled={voided || s.status === 'refunded'} onClick={onRefund}>
          <ion-icon name="arrow-undo-outline"></ion-icon>Refund</button>
      </div>
    </div>
  );
}

function KVrow({ k, v }) {
  return <div className="op-row" style={{ padding: '9px 0' }}><span className="op-k" style={{ fontWeight: 500, color: 'var(--kz-muted-2)', fontSize: 12.5 }}>{k}</span>
    <div className="sp" style={{ flex: 1 }}></div><span className="op-k">{v}</span></div>;
}

/* ---------- print view: an 80 mm thermal receipt, ready for the lane printer ---------- */
function ReceiptPrint({ s, onClose }) {
  const F = window.RX_SALE, tn = window.RX_TENDERS[s.tender];
  const refunded = F.refund(s);
  const voided = s.status === 'voided';
  return (
    <div className="pvscrim" onClick={onClose}>
      <div className="pvwrap" onClick={(e) => e.stopPropagation()}>
        <div className="pvbar">
          <div className="pvbar__hd">
            <div><div className="t">Print receipt</div><div className="d">Order #{s.no} · 80 mm thermal</div></div>
            <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
          </div>
          <div className="pvbar__act">
            <button className="btn"><ion-icon name="mail-outline"></ion-icon>Email</button>
            <button className="btn primary" onClick={() => window.print()}><ion-icon name="print-outline"></ion-icon>Print</button>
          </div>
        </div>
        <div className="pvstage">
          <div className="paper" id="rx-print">
            <div className="paper__brand">
              <div className="mk"><ion-icon name="storefront"></ion-icon></div>
              <strong>Koomzo</strong>
              <span>Rue Njo-Njo · Bonapriso, Douala</span>
              <span>+237 6 55 41 08 22 · koomzo.cm</span>
            </div>
            <div className="paper__meta">
              <div><span>Order</span><b>#{s.no}</b></div>
              <div><span>Date</span><b>{s.at}</b></div>
              <div><span>Register</span><b>{s.lane}</b></div>
              <div><span>Served by</span><b>{s.cashier}</b></div>
              {s.customer !== 'Walk-in' && <div><span>Customer</span><b>{s.customer}</b></div>}
            </div>
            <div className="paper__rule"></div>
            {s.lines.map((l, n) => (
              <div className="paper__l" key={n}>
                <div className="a"><span className="nm">{l.name}</span><span className="v">{fmt(l.qty * l.price)}</span></div>
                <div className="b">{l.qty} × {fmt(l.price)}{l.sub ? ' · ' + l.sub : ''}{l.refunded ? ' · ' + l.refunded + ' returned' : ''}</div>
              </div>
            ))}
            <div className="paper__rule"></div>
            <div className="paper__t">
              <div><span>Subtotal</span><b>{fmt(F.gross(s))}</b></div>
              {s.disc ? <div><span>Discount</span><b>−{fmt(s.disc)}</b></div> : null}
              <div><span>Tax {Math.round(s.rate * 100)}%</span><b>{fmt(F.tax(s))}</b></div>
              {s.tip ? <div><span>Tip</span><b>{fmt(s.tip)}</b></div> : null}
              <div className="big"><span>Total</span><b>{fmt(F.total(s))}</b></div>
              {refunded ? <div><span>Refunded</span><b>−{fmt(refunded)}</b></div> : null}
            </div>
            <div className="paper__rule"></div>
            <div className="paper__t">
              {s.split ? s.split.map(([k, v], n) => (
                <div key={n}><span>{window.RX_TENDERS[k].label}</span><b>{fmt(v)}</b></div>
              )) : <div><span>{tn.label}{s.ref ? ' · ' + s.ref : ''}</span><b>{fmt(F.total(s))}</b></div>}
              {s.tendered ? <div><span>Tendered</span><b>{fmt(s.tendered)}</b></div> : null}
              {s.tendered ? <div><span>Change</span><b>{fmt(Math.max(0, s.tendered - F.total(s)))}</b></div> : null}
            </div>
            {voided && <div className="paper__void">Voided — not a valid receipt</div>}
            <div className="paper__foot">
              <div className="code">*{s.no}*</div>
              <div className="bars" aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <i key={i} style={{ width: (i % 4 ? 1 : 2) + 'px', opacity: i % 3 ? 1 : .55 }}></i>)}</div>
              <p>Returns within 30 days with this receipt.<br />Hygiene and perishable items are final sale.</p>
              <p className="ty">Thank you</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.RX_NAV.splice(1, 0, { id: 'sales', icon: 'receipt-outline', label: 'Sales' });
Object.assign(window, { SalesView, SaleRow, SalePane, ReceiptPrint });
