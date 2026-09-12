/* Koomzo Hotel — guest folios: what a room owes, what posted onto it, and settlement. */

function FolioView({ api }) {
  const st = api.st;
  const open = st.stays.filter((s) => ['inhouse', 'due', 'arr'].indexOf(s.status) > -1);
  const [sel, setSel] = useState(api.folioFocus || (open[0] && open[0].id));
  /* phone navigation state. Wide, the folio sits beside the room list and this is
     ignored; narrow, the list IS the screen until a room is tapped — a folio is the
     longest pane in the product and must never sit below the list you scrolled past. */
  const [pushed, setPushed] = useState(false);
  useEffect(() => { if (api.folioFocus) { setSel(api.folioFocus); setPushed(true); } }, [api.folioFocus]);
  const s = open.find((x) => x.id === sel) || open[0];
  const lines = s ? (st.folio[s.id] || []) : [];
  const f = folioSum(lines);
  const total = open.reduce((a, x) => a + folioSum(st.folio[x.id] || []).balance, 0);

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Folios</h2><p>{open.length} rooms with a running bill · {xaf(total)} outstanding</p></div>
        <div className="sp"></div>
        {s && <button className="btn" onClick={() => api.openPost(s.id)}><ion-icon name="add-circle-outline"></ion-icon>Post a charge</button>}
        {s && <button className="btn primary" onClick={() => api.openSettle(s.id)}><ion-icon name="log-out-outline"></ion-icon>Check out & settle</button>}
      </div>

      <div className={'htf' + (pushed ? ' pushed' : '')}>
        <div className="htflist">
          {open.map((x) => {
            const fx = folioSum(st.folio[x.id] || []);
            return (
              <button key={x.id} className={'htfrow' + (s && x.id === s.id ? ' on' : '')} onClick={() => { setSel(x.id); setPushed(true); }}>
                <div style={{ minWidth: 0 }}>
                  <div className="htfrow__n">{x.no} · {x.guest}</div>
                  <div className="htfrow__s">{x.status === 'due' ? 'Departing today' : x.status === 'arr' ? 'Arriving' : x.plan !== 'nightly' ? x.plan + ' tenancy' : nights(x.nights)}</div>
                </div>
                <div className="htfrow__v">{xaf(fx.balance)}
                  <div className="htfrow__s" style={{ textAlign: 'right' }}>{fx.paid ? xaf(fx.paid) + ' paid' : 'nothing paid'}</div></div>
              </button>
            );
          })}
          {!open.length && <div className="emptybox">No rooms occupied.</div>}
        </div>

        {s && (
          <section className="panel htfpane">
            <div className="panel__hd">
              <button className="sbtn gh back-s" onClick={() => setPushed(false)}>
                <svg className="chev" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"></path></svg>Rooms</button>
              <div><h3>{s.guest}</h3><p>Room {s.no} · folio F-{s.id.replace('st', '').padStart(4, '0')} · {srcOf(s.source).name}</p></div>
              <div className="sp"></div>
              <button className="sbtn" onClick={() => api.toast('Folio printed · 80 mm and A4 copy for the guest')}><ion-icon name="print-outline"></ion-icon><span className="lbl-h">Print</span></button>
              <button className="sbtn" onClick={() => api.openPost(s.id)}><ion-icon name="add-outline"></ion-icon>Charge</button>
            </div>
            <div>
              {lines.map((l, i) => (
                <div className={'htline' + (l.kind === 'payment' ? ' pay' : '')} key={i}>
                  <div className="htline__ic"><ion-icon name={LINE_IC[l.kind] || 'ellipse-outline'}></ion-icon></div>
                  <div className="htline__b">
                    <div className="htline__d">{l.desc}</div>
                    <div className="htline__m">{l.at} · {l.src}</div>
                  </div>
                  <div className="htline__v">{xaf(l.amount)}</div>
                </div>
              ))}
              {!lines.length && <div className="emptybox">Nothing posted yet.</div>}
            </div>
            <div style={{ padding: '10px 0 4px' }}>
              <div className="httot"><span>Charges</span><div className="sp"></div><b>{xaf(f.charges)}</b></div>
              {gate('register') && <div className="httot"><span>of which tourist levy</span><div className="sp"></div>
                <b>{xaf(lines.filter((l) => l.kind === 'levy').reduce((a, l) => a + l.amount, 0))}</b></div>}
              <div className="httot"><span>VAT {(HT.vat * 100).toFixed(2)}% included</span><div className="sp"></div>
                <b>{xaf(f.charges - f.charges / (1 + HT.vat))}</b></div>
              <div className="httot"><span>Paid</span><div className="sp"></div><b>{xaf(-f.paid)}</b></div>
              {gate('deposits') && s.deposit > 0 && <div className="httot"><span>Deposit held</span><div className="sp"></div><b>{xaf(s.deposit)}</b></div>}
              <div className="httot grand"><span>Balance due</span><div className="sp"></div><b>{xaf(f.balance)}</b></div>
            </div>
            {gate('fnb') && (
              <div className="note info" style={{ margin: '0 15px 16px' }}><ion-icon name="restaurant-outline"></ion-icon>
                The Lodge Restaurant and Bar post straight onto this folio — the server picks the room instead of taking payment.</div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------------- post a charge ---------------- */
function PostSheet({ stayId, api, onClose }) {
  const s = api.st.stays.find((x) => x.id === stayId);
  const kinds = [
    ['fnb', 'Restaurant', 'restaurant-outline', gate('fnb')],
    ['bar', 'Bar', 'wine-outline', gate('fnb')],
    ['laundry', 'Laundry', 'shirt-outline', true],
    ['room', 'Room / late checkout', 'bed-outline', true],
    ['other', 'Other', 'ellipsis-horizontal-outline', true],
  ].filter((k) => k[3]);
  const [kind, setKind] = useState(kinds[0][0]);
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState(0);
  const src = kind === 'fnb' ? 'Lodge Restaurant' : kind === 'bar' ? 'Lodge Bar' : kind === 'laundry' ? 'Housekeeping' : 'Reception';
  return (
    <HtSheet title="Post a charge" sub={'Room ' + s.no + ' · ' + s.guest} onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="s" className="btn primary" disabled={!amt} style={!amt ? { opacity: .45 } : null}
          onClick={() => { api.post(stayId, { kind, desc: desc || kinds.find((k) => k[0] === kind)[1], amount: amt, src }); onClose(); }}>
          Post {amt ? xaf(amt) : ''}</button>,
      ]}>
      <span className="lbl">What for</span>
      <div className="htchips" style={{ marginTop: 7 }}>
        {kinds.map(([id, label, ic]) => <button key={id} className={'htchip' + (kind === id ? ' on' : '')} onClick={() => setKind(id)}>
          <ion-icon name={ic}></ion-icon>{label}</button>)}
      </div>
      <div style={{ marginTop: 14 }}>
        <span className="lbl">Description</span>
        <div className="field" style={{ marginTop: 7 }}><ion-icon name="create-outline"></ion-icon>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={kind === 'fnb' ? 'Dinner · table 4 (2 covers)' : 'Optional'} /></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <span className="lbl">Amount</span>
        <div className="field" style={{ marginTop: 7 }}><ion-icon name="cash-outline"></ion-icon>
          <input value={amt ? amt : ''} inputMode="numeric" onChange={(e) => setAmt(+(e.target.value.replace(/\D/g, '')) || 0)} placeholder="0" />
          <span style={{ font: '600 13px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>{HT.ccy}</span></div>
        <div className="htchips" style={{ marginTop: 8 }}>
          {[1000, 2500, 5000, 10000, 15000, 25000].map((v) => <button key={v} className="htchip" onClick={() => setAmt((a) => a + v)}>+{xaf(v)}</button>)}
          {amt > 0 && <button className="htchip" onClick={() => setAmt(0)}>Clear</button>}
        </div>
      </div>
      <div className="note info" style={{ marginTop: 16 }}><ion-icon name="information-circle-outline"></ion-icon>
        Posts as <b>{src}</b> against {s.guest}. It cannot be edited afterwards — a mistake is reversed with a credit line.</div>
    </HtSheet>
  );
}

/* ---------------- check out and settle ---------------- */
function SettleSheet({ stayId, api, onClose }) {
  const st = api.st, s = st.stays.find((x) => x.id === stayId);
  const lines = st.folio[s.id] || [];
  const f = folioSum(lines);
  const [tender, setTender] = useState('cash');
  const [deduct, setDeduct] = useState(0);
  const [paid, setPaid] = useState(null);
  const held = gate('deposits') ? s.deposit : 0;
  /* the deposit is returned, not netted off the balance */
  const dueNow = Math.max(0, f.balance);
  const refund = Math.max(0, held - deduct);

  if (paid) return (
    <HtSheet title="Checked out" sub={'Room ' + s.no + ' released to housekeeping'} onClose={onClose}
      foot={[<button key="d" className="btn primary" onClick={onClose}>Done</button>]}>
      <div className="done" style={{ padding: '10px 0 6px' }}>
        <div className="done__ic"><ion-icon name="checkmark-outline"></ion-icon></div>
        <h4>{xaf(paid.amount)} settled</h4>
        <p>{HT.tenders.find((t) => t.id === paid.tender).name}{paid.refund ? ' · deposit ' + xaf(paid.refund) + ' returned' : ''}
          {paid.deduct ? ' · ' + xaf(paid.deduct) + ' withheld for damage' : ''}</p>
      </div>
      {gate('housekeeping') && <div className="note info"><ion-icon name="sparkles-outline"></ion-icon>
        Room {s.no} is now on the cleaning list as a departure clean.</div>}
    </HtSheet>
  );

  return (
    <HtSheet title="Check out" sub={s.guest + ' · room ' + s.no} onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Back</button>,
        <button key="s" className="btn primary" style={{ background:'var(--kz-success)', borderColor:'var(--kz-success)' }}
          onClick={() => { api.settle(stayId, { tender, deduct, amount: dueNow }); setPaid({ amount: dueNow, tender, deduct, refund }); }}>
          <ion-icon name="checkmark-outline"></ion-icon>Take {xaf(dueNow)}</button>,
      ]}>
      <div className="httot"><span>Charges</span><div className="sp"></div><b>{xaf(f.charges)}</b></div>
      <div className="httot"><span>Already paid</span><div className="sp"></div><b>{xaf(-f.paid)}</b></div>
      <div className="httot grand"><span>Balance</span><div className="sp"></div><b>{xaf(f.balance)}</b></div>

      {gate('deposits') && held > 0 && (
        <div style={{ marginTop: 14 }}>
          <span className="lbl">Deposit held · {xaf(held)}</span>
          <div className="htchips" style={{ marginTop: 7 }}>
            {[0, 10000, 25000, 50000, held].map((v, i) => (
              <button key={i} className={'htchip' + (deduct === v ? ' on' : '')} onClick={() => setDeduct(v)}>{v ? 'Withhold ' + xaf(v) : 'Return in full'}</button>
            ))}
          </div>
          {deduct > 0 && <div className="note" style={{ marginTop: 10 }}><ion-icon name="alert-circle-outline"></ion-icon>
            A withheld deposit needs a reason and a photograph on the stay record — it is money the guest can dispute.</div>}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <span className="lbl">Settle by</span>
        <div className="htchips" style={{ marginTop: 7 }}>
          {HT.tenders.map((t) => <button key={t.id} className={'htchip' + (tender === t.id ? ' on' : '')} onClick={() => setTender(t.id)}>
            <ion-icon name={t.icon}></ion-icon>{t.name}</button>)}
        </div>
      </div>

      {tender === 'account' && <div className="note info" style={{ marginTop: 14 }}><ion-icon name="document-text-outline"></ion-icon>
        The balance moves to {s.company || 'the company account'} and is invoiced from the Invoicing module. Nothing is taken at the desk.</div>}
      {(tender === 'momo' || tender === 'orange') && <div className="note info" style={{ marginTop: 14 }}><ion-icon name="phone-portrait-outline"></ion-icon>
        A payment request goes to the guest's phone. The folio closes when the operator confirms, not when the desk says so.</div>}
    </HtSheet>
  );
}

Object.assign(window, { FolioView, PostSheet, SettleSheet });
