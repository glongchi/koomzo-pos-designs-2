/* ============================================================
   Koomzo POS Suite — staff, printing, day close
   D6: who is using the till · table hand-over · kitchen printing
   G3: end-of-day (Z) close with the voids block and close blockers
   ============================================================ */

const RK_TENDER_LABEL = { cash: 'Cash', momo: 'MTN MoMo', om: 'Orange Money', orange: 'Orange Money', card: 'Card', split: 'Split' };
const tenderLabel = (id) => RK_TENDER_LABEL[id] || (id ? String(id).charAt(0).toUpperCase() + String(id).slice(1) : 'Other');
const isToday = (at) => new Date(at).toDateString() === new Date().toDateString();
const fmtT = (at) => window.KZ_LOCALE.fmtTime(new Date(at));

/* prototype: who is signed in on this till (production: PIN sign-in) */
function StaffSwitch() {
  const { me, setMe, staff } = useSuite();
  const [open, setOpen] = useState(false);
  return (
    <div className="rk-me">
      <button className="rk-me__btn" onClick={() => setOpen((v) => !v)} aria-label="Signed-in user">
        <span className={'rk-me__av' + (me.sup ? ' sup' : '')}>{me.init}</span><span className="rk-me__nm">{me.name}</span>
      </button>
      {open && (
        <>
          <div className="rk-me__scrim" onClick={() => setOpen(false)}></div>
          <div className="rk-me__menu">
            <div className="rk-me__k">Signed in on this till</div>
            {staff.map((p) => (
              <button key={p.id} className={p.id === me.id ? 'on' : ''} onClick={() => { setMe(p.id); setOpen(false); }}>
                <span className={'rk-me__av' + (p.sup ? ' sup' : '')}>{p.init}</span>
                <span className="rk-me__t"><b>{p.name}</b><small>{p.role}</small></span>
                {p.id === me.id && <ion-icon name="checkmark"></ion-icon>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* D6 — another server's table: hand it over with supervisor approval */
function TakeoverSheet({ tableId, owner, onClose }) {
  const { takeOver, me } = useSuite();
  const [approved, setApproved] = useState(null);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">Take over Table {tableLabel(tableId)}</h3>
          <p className="sheet__sub">The table moves from {owner} to {me.name}. Voids, moves, the bill and payment are then yours. The hand-over is logged.</p>
          <ApprovalBox approved={approved} onApproved={setApproved} />
          <div className="sheet__actions" style={{ marginTop: 18 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-fill" disabled={!approved} onClick={() => { takeOver(tableId); onClose(); }}>Take over</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* failed prints wait in order; this pill stays until the printer is back */
function PrinterBanner() {
  const { prints, screen, setupTab, setScreen, setSetupTab } = useSuite();
  const waiting = prints.filter((p) => p.status === 'waiting').length;
  if (!waiting || (screen === 'setup' && setupTab === 'printing')) return null;
  return (
    <div className="rk-printbar">
      <ion-icon name="print-outline"></ion-icon>
      <span><b>Printer offline</b> · {waiting} slip{waiting === 1 ? '' : 's'} waiting. They print in order when it is back.</span>
      <button onClick={() => { setSetupTab('printing'); setScreen('setup'); }}>Printing</button>
    </div>
  );
}

const SLIP_KIND = { fire: 'Kitchen ticket', void: 'VOID', changed: 'CHANGED', bill: 'Bill' };
function Slip({ p }) {
  const st = p.station === 'till' ? 'Till' : (window.RK_STATIONS[p.station]?.label || 'Kitchen');
  return (
    <div className={'slip slip--' + p.kind + (p.status === 'waiting' ? ' waiting' : '')}>
      <div className="slip__status">{p.status === 'waiting' ? <><ion-icon name="time-outline"></ion-icon>Waiting</> : <><ion-icon name="checkmark"></ion-icon>Printed {fmtT(p.printedAt || p.at)}</>}</div>
      <div className="slip__paper">
        <div className="slip__kind">{p.kind === 'bill' && p.reprint ? 'Bill · reprint' : SLIP_KIND[p.kind]}</div>
        <div className="slip__meta"><span>{st}</span><span>{p.table ? 'Table ' + p.table : ''}{p.no ? ' · #' + p.no : ''}</span><span>{fmtT(p.at)}</span></div>
        <div className="slip__items">
          {p.items.map((it, i) => (
            <div key={i} className="slip__it">
              <span className="q">{p.kind === 'void' ? '−' : ''}{qtyStr(it.qty)}×</span>
              <span className="n">{it.name}{it.notes ? <small>{it.notes}</small> : null}</span>
              {p.kind === 'bill' && <span className="a">{money(it.amt)}</span>}
            </div>
          ))}
        </div>
        {p.reason && <div className="slip__reason">Reason: {p.reason}</div>}
        {p.kind === 'bill' && (
          <div className="slip__tot">
            {p.svc > 0 && <div><span>Service</span><span>{money(p.svc)}</span></div>}
            <div><span>VAT</span><span>{money(p.tax)}</span></div>
            <div className="big"><span>Total</span><span>{money(p.total)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Setup → Printing: printer status and the slip log */
function PrintFeed() {
  const { prints, rules, setRules, setSetupTab } = useSuite();
  const waiting = prints.filter((p) => p.status === 'waiting').length;
  return (
    <div className="rules" style={{ maxWidth: 1100 }}>
      <div className="rules__card">
        <h3>Printers</h3>
        {!rules.printKitchen && (
          <div className="rules__row"><div><b>Print to the kitchen is off</b><span>Only bills print. Turn it on for kitchens without a screen.</span></div>
            <button className="rk-btn" onClick={() => setSetupTab('rules')}>Service rules</button></div>
        )}
        <div className="rules__row">
          <div><b>Kitchen and till printer</b><span>Bluetooth · 80 mm. {rules.printerOnline ? 'Connected.' : waiting + ' slip' + (waiting === 1 ? '' : 's') + ' waiting.'} Prototype: switch it off to see slips wait.</span></div>
          <span className={'pf-dot' + (rules.printerOnline ? ' on' : '')}>{rules.printerOnline ? 'Online' : 'Offline'}</span>
          <Toggle on={rules.printerOnline} onChange={(v) => setRules({ printerOnline: v })} />
        </div>
      </div>
      <div className="rules__card">
        <h3>Printed today <span className="rules__sum">{prints.filter((p) => isToday(p.at)).length}</span></h3>
        {!prints.length && <p className="rules__none">Nothing printed yet. Send an order or print a bill.</p>}
        <div className="pf-grid">{prints.slice(0, 24).map((p) => <Slip key={p.id} p={p} />)}</div>
      </div>
    </div>
  );
}

function Breakdown({ rows, total, tone }) {
  return (
    <div className="zb">
      {rows.map(([k, v, sub]) => (
        <div key={k} className="zb__row">
          <span className="zb__k">{k}{sub && <small>{sub}</small>}</span>
          <span className="zb__bar"><i className={tone || ''} style={{ width: (total ? Math.max(3, (v / total) * 100) : 0) + '%' }}></i></span>
          <span className="zb__v">{money(v)}</span>
        </div>
      ))}
    </div>
  );
}
const groupSum = (list, key, val) => Object.entries(list.reduce((m, x) => { const k = key(x); m[k] = (m[k] || 0) + val(x); return m; }, {})).sort((a, b) => b[1] - a[1]);

/* G3 — end-of-day close: blockers first, then sales, voids and the owner's digest */
function DayClose() {
  const { tickets, orders, floors, voids, sales, prints, day, closeDay, reopenDay, setScreen, me } = useSuite();
  const [confirm, setConfirm] = useState(false);
  const [approved, setApproved] = useState(null);

  const isTable = (k) => floors.some((f) => f.tables.some((t) => t.id === k));
  const openTables = Object.keys(orders).filter((k) => isTable(k) && orders[k].lines?.length);
  const openTabs = Object.keys(orders).filter((k) => !isTable(k) && !k.startsWith('_') && orders[k].lines?.length);
  const cooking = tickets.filter(tkActive);
  const unseen = tickets.filter((t) => t.cancelled && !t.cancelled.ack);
  const waiting = prints.filter((p) => p.status === 'waiting').length;
  const blockers = [
    openTables.length && { icon: 'grid-outline', t: openTables.length + ' table' + (openTables.length === 1 ? '' : 's') + ' not paid', s: openTables.map((k) => 'Table ' + tableLabel(k)).join(' · '), a: 'Open floor', go: 'floor' },
    openTabs.length && { icon: 'wine-outline', t: openTabs.length + ' tab' + (openTabs.length === 1 ? '' : 's') + ' still open', s: openTabs.map((k) => k.replace(/^tab:/, '')).join(' · '), a: 'Open order', go: 'register' },
    cooking.length && { icon: 'flame-outline', t: cooking.length + ' ticket' + (cooking.length === 1 ? '' : 's') + ' still in the kitchen', s: 'Mark served, hand over as take-away, or cancel each one.', a: 'Resolve in kitchen', go: 'kitchen' },
    unseen.length && { icon: 'ban-outline', t: unseen.length + ' cancelled ticket' + (unseen.length === 1 ? '' : 's') + ' not yet seen', s: 'The kitchen must tap Seen so nothing is cooked by mistake.', a: 'Resolve in kitchen', go: 'kitchen' },
  ].filter(Boolean);

  const ds = sales.filter((s) => isToday(s.at));
  const salesTotal = ds.reduce((s, x) => s + x.total, 0);
  const dv = voids.filter((v) => isToday(v.at));
  const voidVal = dv.reduce((s, v) => s + (v.value || 0), 0);
  const wasteQty = dv.reduce((s, v) => s + (v.qty || 0), 0);
  const appr = (v) => !v.approver ? 'No approval' : /remote/i.test(v.approver) ? 'Owner, by phone' : 'Manager PIN';
  const byServerVoid = groupSum(dv, (v) => v.by || '—', (v) => v.value || 0);
  const cnt = (key) => Object.entries(dv.reduce((m, v) => { const k = key(v); m[k] = (m[k] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);

  const digest = [
    'Koomzo · day close ' + fmtT(day.closedAt || Date.now()),
    'Sales ' + money(salesTotal) + ' · ' + ds.length + ' bill' + (ds.length === 1 ? '' : 's'),
    'Voids ' + dv.length + ' · ' + money(voidVal) + (dv.length ? ' (' + cnt((v) => v.reason).map(([r, n]) => r + ' ' + n).join(', ') + ')' : ''),
    byServerVoid.length && byServerVoid[0][1] > 0 ? 'Most voided: ' + byServerVoid[0][0] + ' · ' + money(byServerVoid[0][1]) : null,
    'Written off: ' + wasteQty + ' item' + (wasteQty === 1 ? '' : 's'),
  ].filter(Boolean);
  const closed = !!day.closedAt;
  const doClose = () => { closeDay(digest); setConfirm(false); setApproved(null); };

  return (
    <div className="screen">
      <div className="sbar">
        <span className="sbar__title">Close the day</span>
        <span className="sbar__sub">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <div className="sbar__right"><StaffSwitch /></div>
      </div>
      <div className="zc">
        {closed ? (
          <div className="zc-done"><ion-icon name="moon"></ion-icon>
            <div><b>Day closed at {fmtT(day.closedAt)} by {day.by}.</b><span>The owner's digest is queued and sends when the hub is online.</span></div>
            <button className="rk-btn" onClick={reopenDay}>Reopen (prototype)</button>
          </div>
        ) : (
          <section className="zc-card">
            <h3>Before you close {blockers.length > 0 && <span className="zc-n bad">{blockers.length}</span>}</h3>
            {!blockers.length ? (
              <div className="zc-clear"><ion-icon name="checkmark-circle"></ion-icon>Nothing is open. Ready to close.</div>
            ) : blockers.map((b) => (
              <div key={b.t} className="zc-block"><ion-icon name={b.icon}></ion-icon>
                <div><b>{b.t}</b><span>{b.s}</span></div>
                <button className="rk-btn" onClick={() => setScreen(b.go)}>{b.a}<ion-icon name="arrow-forward"></ion-icon></button>
              </div>
            ))}
            {waiting > 0 && <div className="zc-warn"><ion-icon name="print-outline"></ion-icon>{waiting} slip{waiting === 1 ? '' : 's'} still waiting for the printer. This does not stop the close.</div>}
          </section>
        )}

        <div className="zc-grid">
          <section className="zc-card">
            <h3>Sales</h3>
            <div className="zc-stats">
              <div><span>Total</span><b>{money(salesTotal)}</b></div>
              <div><span>Bills</span><b>{ds.length}</b></div>
              <div><span>Average</span><b>{money(ds.length ? Math.round(salesTotal / ds.length) : 0)}</b></div>
            </div>
            <div className="zc-k">By payment</div>
            <Breakdown rows={groupSum(ds, (s) => tenderLabel(s.method), (s) => s.total)} total={salesTotal} />
            <div className="zc-k">By server</div>
            <Breakdown rows={groupSum(ds, (s) => s.server || '—', (s) => s.total)} total={salesTotal} />
          </section>

          <section className="zc-card">
            <h3>Voids</h3>
            <div className="zc-stats">
              <div><span>Voids</span><b>{dv.length}</b></div>
              <div><span>Value</span><b className="bad">{voidVal ? '−' + money(voidVal) : money(0)}</b></div>
              <div><span>Written off</span><b>{wasteQty}<small> items</small></b></div>
            </div>
            {!dv.length ? <p className="rules__none">No voids today.</p> : (
              <>
                <div className="zc-k">By reason</div>
                <div className="zc-chips">{cnt((v) => v.reason).map(([r, n]) => <span key={r}>{r}<em>{n}</em></span>)}</div>
                <div className="zc-k">By server</div>
                <Breakdown rows={byServerVoid} total={voidVal} tone="bad" />
                <div className="zc-k">Approved by</div>
                <div className="zc-chips">{cnt(appr).map(([r, n]) => <span key={r} className={r === 'No approval' ? 'warn' : ''}>{r}<em>{n}</em></span>)}</div>
              </>
            )}
          </section>
        </div>

        <section className="zc-card">
          <h3>Owner's digest <span className="rules__sum">WhatsApp · sent at close</span></h3>
          <div className="zc-msg">{digest.map((l, i) => <div key={i} className={i === 0 ? 'h' : ''}>{l}</div>)}</div>
        </section>
      </div>

      {!closed && (
        <div className="zc-foot">
          <span>{blockers.length ? 'Resolve ' + blockers.length + ' item' + (blockers.length === 1 ? '' : 's') + ' above to close.' : 'Closing ends the day for every device on this location.'}</span>
          <button className="ofoot__pay" disabled={blockers.length > 0} onClick={() => setConfirm(true)}><ion-icon name="moon-outline"></ion-icon>Close the day</button>
        </div>
      )}

      {confirm && (
        <div className="scrim" onClick={() => setConfirm(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__pad">
              <h3 className="sheet__title">Close the day?</h3>
              <p className="sheet__sub">Sales {money(salesTotal)} · {ds.length} bills · {dv.length} voids. The owner's digest is sent after closing.</p>
              {!me.sup && <ApprovalBox approved={approved} onApproved={setApproved} />}
              <div className="sheet__actions" style={{ marginTop: 18 }}>
                <button className="btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
                <button className="btn-fill" disabled={!me.sup && !approved} onClick={doClose}>Close the day</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { StaffSwitch, TakeoverSheet, PrinterBanner, PrintFeed, Slip, DayClose, tenderLabel });
