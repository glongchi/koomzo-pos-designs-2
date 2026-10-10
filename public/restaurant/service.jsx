/* ============================================================
   Koomzo POS Suite — service actions (shared sheets)
   Void after fire · move / merge / split · clear with food
   still in the kitchen. All governed by venue service rules.
   ============================================================ */

/* manager PIN, or remote approval on the owner's phone (mock) */
function ApprovalBox({ onApproved, approved }) {
  const { rules } = useSuite();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const [remote, setRemote] = useState(null); // null | 'pending' | 'denied'
  const [left, setLeft] = useState(60);
  useEffect(() => {
    if (remote !== 'pending') return;
    if (left <= 0) { setRemote('denied'); return; }
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [remote, left]);
  if (approved) return <div className="svc-ok"><ion-icon name="shield-checkmark"></ion-icon>Approved by {approved}</div>;
  const tryPin = (v) => {
    setPin(v); setErr(false);
    if (v.length === rules.managerPin.length) { if (v === rules.managerPin) onApproved('Manager'); else { setErr(true); setPin(''); } }
  };
  return (
    <div className="svc-appr">
      <div className="svc-appr__k"><ion-icon name="lock-closed-outline"></ion-icon>Manager approval needed</div>
      <input className={'svc-pin' + (err ? ' err' : '')} type="password" inputMode="numeric" maxLength={6} placeholder="Manager PIN"
        value={pin} onChange={(e) => tryPin(e.target.value.replace(/\D/g, ''))} />
      {err && <div className="svc-err">Wrong PIN</div>}
      {rules.remoteApproval && (
        remote === 'pending' ? (
          <div className="svc-remote">
            <div className="svc-wait"><span className="svc-spin"></span>Sent to the owner's phone · declines in {left}s</div>
            <div className="svc-remote__sim"><span>Prototype — owner's phone:</span>
              <button onClick={() => { setRemote(null); onApproved('Owner (remote)'); }}>Approve</button>
              <button className="bad" onClick={() => setRemote('denied')}>Decline</button>
            </div>
          </div>
        ) : remote === 'denied' ? (
          <div className="svc-err">The owner declined or didn't answer. <button className="svc-link" onClick={() => { setLeft(60); setRemote('pending'); }}>Ask again</button></div>
        ) : <button className="svc-link" onClick={() => { setLeft(60); setRemote('pending'); }}><ion-icon name="phone-portrait-outline"></ion-icon>No manager here? Ask the owner</button>
      )}
    </div>
  );
}

function ReasonChips({ value, onChange, reasons }) {
  return (
    <div className="svc-chips">
      {(reasons || VOID_REASONS).map((r) => (
        <button key={r} className={value === r ? 'on' : ''} onClick={() => onChange(r)}>{r}</button>
      ))}
    </div>
  );
}

/* C2 — void a line that is already in the kitchen */
function VoidSheet({ line, table, onDone, onClose }) {
  const { tickets, rules, voidFired } = useSuite();
  const ticket = tickets.find((t) => t.id === line.ticketId);
  const item = ticket?.items.find((it) => it.uid === line.uid);
  const started = !ticket || ticket.status !== 'cook' || !!item?.done;
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(null);
  const [approved, setApproved] = useState(null);
  const unit = (line.priceOverride != null ? line.priceOverride : line.price) * (1 - (line.discPct || 0) / 100);
  const value = Math.round(unit * qty);
  const ruleNeeds = rules.voidRule === 'pin-always' || (rules.voidRule === 'free-until-start' && started);
  const needs = ruleNeeds && !(rules.voidPinAbove > 0 && value < rules.voidPinAbove);
  const ok = reason && (!needs || approved);
  const confirm = () => {
    if (ticket) voidFired({ ticketId: ticket.id, uid: line.uid, qty, reason, approver: approved, value, table, name: line.name });
    onDone(qty);
  };
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">Void {line.name}</h3>
          <p className="sheet__sub">{started ? 'The kitchen has started this item.' : 'Sent, but the kitchen has not started it yet.'} The kitchen screen shows the void until the cook taps Seen.</p>
          <div className="svc-row">
            <span className="svc-k">Quantity to void</span>
            <div className="kstep">
              <button onClick={() => setQty((n) => Math.max(1, n - 1))}><ion-icon name="remove"></ion-icon></button>
              <span className="v">{qty}</span>
              <button onClick={() => setQty((n) => Math.min(line.qty, n + 1))}><ion-icon name="add"></ion-icon></button>
            </div>
            <span className="svc-val">−{money(value)}</span>
          </div>
          <div className="svc-k" style={{ margin: '14px 0 8px' }}>Reason</div>
          <ReasonChips value={reason} onChange={setReason} />
          {needs && <ApprovalBox approved={approved} onApproved={setApproved} />}
          <div className="sheet__actions" style={{ marginTop: 18 }}>
            <button className="btn-ghost" onClick={onClose}>Keep it</button>
            <button className="btn-fill svc-danger" disabled={!ok} onClick={confirm}>Void {qty}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* pick a table across all areas — free tables move, busy tables merge */
function TablePicker({ exclude, value, onPick }) {
  const { floors, tableStatusFor } = useSuite();
  const [area, setArea] = useState(floors.find((f) => f.tables.some((t) => t.id === exclude))?.id || floors[0]?.id);
  const f = floors.find((x) => x.id === area) || floors[0];
  if (!f) return null;
  return (
    <div className="svc-tpick">
      <div className="svc-chips">
        {floors.map((x) => <button key={x.id} className={area === x.id ? 'on' : ''} onClick={() => setArea(x.id)}>{x.label}</button>)}
      </div>
      <div className="svc-tgrid">
        {f.tables.filter((t) => t.id !== exclude).map((t) => {
          const st = tableStatusFor(t.id);
          if (st === 'merged') return null;
          return (
            <button key={t.id} className={'svc-t ' + (st === 'free' ? 'free' : 'busy') + (value === t.id ? ' on' : '')} onClick={() => onPick(t.id, st)}>
              <b>{t.label}</b><span>{st === 'free' ? t.seats + ' seats' : 'Join'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* C3 — move the whole party from the floor */
function FloorMoveSheet({ from, onClose }) {
  const { moveParty } = useSuite();
  const [to, setTo] = useState(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet sheet--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">Move Table {tableLabel(from)}</h3>
          <p className="sheet__sub">Pick a free table to move the party, or a busy one to join the two tables into one bill. Kitchen tickets follow the party.</p>
          <TablePicker exclude={from} value={to} onPick={(id, st) => { setTo(id); setBusy(st !== 'free'); }} />
          <div className="sheet__actions" style={{ marginTop: 18 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-fill" disabled={!to} onClick={() => { moveParty(from, to); onClose(); }}>
              {!to ? 'Pick a table' : busy ? 'Join Table ' + tableLabel(to) : 'Move to Table ' + tableLabel(to)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* C3 — move selected bill lines (split by item) or the whole order */
function MoveLinesSheet({ from, lines, onClose }) {
  const { moveParty, moveLines } = useSuite();
  const [pick, setPick] = useState(() => lines.map((l) => l.uid));
  const [to, setTo] = useState(null);
  const [busy, setBusy] = useState(false);
  const all = pick.length === lines.length;
  const toggle = (uid) => setPick((cur) => cur.includes(uid) ? cur.filter((u) => u !== uid) : [...cur, uid]);
  const go = () => { if (all) moveParty(from, to); else moveLines(from, to, pick); onClose(); };
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet sheet--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">Move from Table {tableLabel(from)}</h3>
          <p className="sheet__sub">Keep everything ticked to move the party. Untick items to split the bill — the ticked items go to the other table.</p>
          <div className="svc-lines">
            {lines.map((l) => (
              <label key={l.uid} className={'svc-line' + (pick.includes(l.uid) ? ' on' : '')}>
                <input type="checkbox" checked={pick.includes(l.uid)} onChange={() => toggle(l.uid)} />
                <span className="q">{qtyStr(l.qty)}×</span><span className="n">{l.name}</span>
                {l.fired && <span className="oline__fired"><ion-icon name="flame"></ion-icon>Fired</span>}
                <span className="p">{money((l.priceOverride != null ? l.priceOverride : l.price) * l.qty * (1 - l.discPct / 100))}</span>
              </label>
            ))}
          </div>
          <div className="svc-k" style={{ margin: '14px 0 8px' }}>To table</div>
          <TablePicker exclude={from} value={to} onPick={(id, st) => { setTo(id); setBusy(st !== 'free'); }} />
          <div className="sheet__actions" style={{ marginTop: 18 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-fill" disabled={!to || !pick.length} onClick={go}>
              {!to ? 'Pick a table' : all ? (busy ? 'Join Table ' : 'Move party to ') + tableLabel(to) : 'Move ' + pick.length + ' item' + (pick.length > 1 ? 's' : '') + ' to ' + tableLabel(to)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* C4 / D2 — clearing a table while food is still in the kitchen: warn and ask, never block */
function ClearWarnSheet({ tableId, onClose }) {
  const { activeTicketsFor, tablesInGroup, clearTable, rules } = useSuite();
  const group = tablesInGroup(tableId);
  const active = group.flatMap((g) => activeTicketsFor(g));
  const items = active.flatMap((t) => t.items.filter((it) => liveQty(it) > 0 && !it.done).map((it) => ({ ...it, st: t.status })));
  const [cancelling, setCancelling] = useState(false);
  const [approved, setApproved] = useState(null);
  const done = (outcome) => { clearTable(tableId, outcome); onClose(); };
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">{items.length} item{items.length === 1 ? '' : 's'} still in the kitchen</h3>
          <p className="sheet__sub">Table {tableLabel(tableId)} is being cleared. What should happen to this food?</p>
          <div className="svc-lines" style={{ marginBottom: 14 }}>
            {items.map((it) => (
              <div key={it.uid} className="svc-line"><span className="q">{liveQty(it)}×</span><span className="n">{it.name}</span><span className="svc-st">{it.st === 'ready' ? 'Ready' : 'Cooking'}</span></div>
            ))}
          </div>
          {!cancelling ? (
            <div className="svc-opts">
              <button onClick={() => done('takeaway')}><ion-icon name="bag-handle-outline"></ion-icon><b>Keep cooking — take-away</b><span>The kitchen keeps the ticket and hands it over at the counter.</span></button>
              <button onClick={() => done('served')}><ion-icon name="checkmark-done-outline"></ion-icon><b>Already served</b><span>The cook forgot to tap Served. No stock change.</span></button>
              <button className="bad" onClick={() => rules.clearCancelNeedsPin ? setCancelling(true) : done('cancel')}><ion-icon name="ban-outline"></ion-icon><b>Cancel it</b><span>Shown crossed out on the kitchen screen. Logged as a void and written off as waste.</span></button>
            </div>
          ) : (
            <>
              <ApprovalBox approved={approved} onApproved={setApproved} />
              <div className="sheet__actions" style={{ marginTop: 16 }}>
                <button className="btn-ghost" onClick={() => setCancelling(false)}>Back</button>
                <button className="btn-fill svc-danger" disabled={!approved} onClick={() => done('cancel')}>Cancel {items.length} item{items.length === 1 ? '' : 's'}</button>
              </div>
            </>
          )}
          {!cancelling && <button className="svc-link" style={{ marginTop: 12 }} onClick={onClose}>Not now — keep the table open</button>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ApprovalBox, ReasonChips, VoidSheet, TablePicker, FloorMoveSheet, MoveLinesSheet, ClearWarnSheet });
