/* ============================================================
   Koomzo POS Suite — FLOOR PLAN
   Multi-floor table map; status derived from tickets+seating.
   Phone-first: defaults to an urgency-ordered LIST (a waiter needs
   "who needs me next", not a pinch-zoom map); map is one tap away.
   Table detail is a popover on tablet+, a bottom sheet on phone.
   ============================================================ */

const SHAPE_CLASS = { square: 'sq', rect: 'rect', round: 'round', stool: 'stool' };
const STATUS_META = {
  free:    { label: 'Available', color: 'var(--kz-soft-muted)', sw: 'var(--kz-tbl-free)' },
  seated:  { label: 'Seated',    color: 'var(--kz-tbl-seated)', sw: 'var(--kz-tbl-seated)' },
  ordered: { label: 'Order in progress', color: 'var(--kz-tbl-ordered)', sw: 'var(--kz-tbl-ordered)' },
  bill:    { label: 'Bill requested', color: 'var(--kz-tbl-bill)', sw: 'var(--kz-tbl-bill)' },
  late:    { label: 'Needs attention', color: 'var(--kz-tbl-late)', sw: 'var(--kz-tbl-late)' },
  merged:  { label: 'Joined', color: 'var(--kz-tbl-ordered)', sw: 'var(--kz-tbl-ordered)' },
};
const AREA_ICON = (f) => f.icon || (f.id === 'patio' ? 'sunny-outline' : f.id === 'barfloor' ? 'wine-outline' : 'home-outline');
/* list order: what a waiter should deal with first */
const ATTENTION = { late: 0, bill: 1, ordered: 2, seated: 3, merged: 4, free: 5 };

/* width of the app frame (not the viewport) so the device preview reflows too */
function useNarrow(px) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = document.querySelector('.frame') || document.body;
    const read = (w) => setNarrow(w <= px);
    if (!window.ResizeObserver) { read(el.clientWidth); return; }
    const ro = new ResizeObserver(([e]) => read(e.contentRect.width));
    ro.observe(el);
    read(el.clientWidth);
    return () => ro.disconnect();
  }, [px]);
  return narrow;
}

function FloorTable({ table, status, seatedCount, badge, onClick }) {
  return (
    <button className={'ftable ' + status + ' ' + SHAPE_CLASS[table.shape]} style={{ left: table.x + '%', top: table.y + '%' }} onClick={onClick}>
      {badge > 0 && <span className="ftable__badge">{badge}</span>}
      <div className={'ftable__shape'}>
        <span className="ftable__num">{table.label}</span>
        {table.shape !== 'stool' && <span className="ftable__seats">{seatedCount}/{table.seats}</span>}
      </div>
    </button>
  );
}

/* one row of the phone-first list */
function FloorRow({ table, status, seated, ticket, now, onClick }) {
  const m = STATUS_META[status];
  const mins = ticket ? elapsedMin(ticket.firedAt, now) : (seated?.since ? elapsedMin(seated.since, now) : 0);
  const guests = seated?.guests || ticket?.guests;
  return (
    <button className={'frow ' + status} onClick={onClick}>
      <span className="frow__chip">{table.label}</span>
      <span className="frow__b">
        <span className="frow__t">Table {table.label}
          {status === 'late' && <span className="frow__flag"><ion-icon name="alert-circle-outline"></ion-icon>Late</span>}
          {status === 'bill' && <span className="frow__flag bill"><ion-icon name="receipt-outline"></ion-icon>Bill</span>}
        </span>
        <span className="frow__m">
          {status === 'merged' ? 'Joined with Table ' + tableLabel(seated?.into)
            : status === 'free' ? table.seats + ' seats free'
            : (guests || '—') + ' guests · ' + mins + ' min' + (ticket ? ' · #' + ticket.no : ' · no order yet')}
        </span>
      </span>
      {ticket && <span className="frow__n">{ticket.items.reduce((s, i) => s + i.qty, 0)}</span>}
      <ion-icon name="chevron-forward-outline" className="frow__go"></ion-icon>
    </button>
  );
}

function FloorDetail({ table, status, seated, ticket, now, sheet, onClose, onSeat, onOpen, onBill, onClear, onMove, onSeparate, joined, owner, locked }) {
  const m = STATUS_META[status];
  const mins = ticket ? elapsedMin(ticket.firedAt, now) : (seated?.since ? elapsedMin(seated.since, now) : 0);
  const [guests, setGuests] = useState(Math.min(2, table.seats));
  const left = Math.min(table.x, 64);
  const top = Math.min(table.y + 8, 58);
  const pos = sheet ? null : { left: left + '%', top: top + '%' };
  return (
    <>
      <div className="fscrim" onClick={onClose}></div>
      <div className={'fdetail' + (sheet ? ' fdetail--sheet' : '')} style={pos}>
        <button className="fdetail__close" onClick={onClose}><ion-icon name="close"></ion-icon></button>
        <div className="fdetail__head">
          <div className="fdetail__chip" style={{ background: m.sw, color: status === 'free' ? 'var(--kz-soft-muted)' : '#fff', border: status === 'free' ? '2px solid var(--kz-tbl-free-line)' : 'none' }}>
            {table.label}<small>{table.seats} seats</small>
          </div>
          <div className="fdetail__meta">
            <div className="nm">Table {table.label}</div>
            <div className="st" style={{ color: m.color }}>{m.label}</div>
          </div>
        </div>
        <div className="fdetail__body">
          {status === 'free' ? (
            <>
              <div className="fdetail__row"><span>Capacity</span><b>{table.seats} seats</b></div>
              <div className="fseat">
                <span className="fseat__k">Party size</span>
                <div className="fseat__opts">
                  {[1, 2, 3, 4, 6, 8].filter((n) => n <= table.seats).map((n) => (
                    <button key={n} className={guests === n ? 'on' : ''} onClick={() => setGuests(n)}>{n}</button>
                  ))}
                </div>
              </div>
            </>
          ) : status === 'merged' ? (
            <div className="fdetail__row"><span>Joined with</span><b>Table {tableLabel(seated?.into)}</b></div>
          ) : (
            <>
              {joined && joined.length > 0 && <div className="fdetail__row"><span>Joined tables</span><b>{joined.map(tableLabel).join(' + ')}</b></div>}
              <div className="fdetail__row"><span>Guests</span><b>{seated?.guests || ticket?.guests || '—'}</b></div>
              <div className="fdetail__row"><span>Seated</span><b>{mins} min</b></div>
              {ticket && <div className="fdetail__row"><span>Order</span><b>#{ticket.no} · {ticket.items.reduce((s, i) => s + i.qty, 0)} items</b></div>}
              {owner && <div className="fdetail__row"><span>Server</span><b style={{ fontFamily: 'var(--kz-font-sans)' }}>{locked && <ion-icon name="lock-closed" style={{ fontSize: 12, marginRight: 4, color: 'var(--kz-muted-2)' }}></ion-icon>}{owner}</b></div>}
              {locked && <div className="fdetail__lock">Only {owner} or a supervisor can move, bill or clear this table.</div>}
            </>
          )}
        </div>
        <div className="fdetail__acts">
          {status === 'free' ? (
            <>
              <button className="ghost" onClick={() => onSeat(guests)}><ion-icon name="people-outline"></ion-icon>Seat {guests}</button>
              <button className="fill" onClick={() => onOpen()}><ion-icon name="cart-outline"></ion-icon>New order</button>
            </>
          ) : status === 'merged' ? (
            <>
              <button className="ghost" onClick={onSeparate}><ion-icon name="git-compare-outline"></ion-icon>Separate</button>
              <button className="fill" onClick={() => onOpen(seated?.into)}><ion-icon name="cart-outline"></ion-icon>Open joined order</button>
            </>
          ) : (
            <>
              <button className="ghost" disabled={locked} onClick={onMove}><ion-icon name="swap-horizontal-outline"></ion-icon>Move</button>
              {status !== 'bill' && <button className="ghost" disabled={locked} onClick={onBill}><ion-icon name="receipt-outline"></ion-icon>Bill</button>}
              <button className="ghost" disabled={locked} onClick={onClear}><ion-icon name="checkmark-done-outline"></ion-icon>Clear</button>
              <button className="fill" onClick={() => onOpen()}><ion-icon name="cart-outline"></ion-icon>Open order</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Floor() {
  const { tickets, tableState, tableStatusFor, now, seatTable, requestBill, clearTable, openTableOrder, floors, activeTicketsFor, separateTable, setScreen,
    ownerOf, canAct, rules, orders, printBill, tweaks } = useSuite();
  const [floorId, setFloorId] = useState(floors[0]?.id);
  const [moveFrom, setMoveFrom] = useState(null);
  const [clearWarn, setClearWarn] = useState(null);
  const [sel, setSel] = useState(null);
  const narrow = useNarrow(680);
  const [view, setView] = useState(narrow ? 'list' : 'map');
  const [only, setOnly] = useState('attention');
  useEffect(() => { setView(narrow ? 'list' : 'map'); }, [narrow]);
  const floor = floors.find((f) => f.id === floorId) || floors[0];
  if (!floor) {
    return (
      <div className="screen"><div className="floor"><div className="klane__empty" style={{ marginTop: 80 }}>
        <ion-icon name="grid-outline"></ion-icon><p>No tables set up — this venue runs counter service.</p>
        <button className="rk-btn pri" style={{ marginTop: 14 }} onClick={() => setScreen('setup')}><ion-icon name="construct-outline"></ion-icon>Set up floor plan</button>
      </div></div></div>
    );
  }
  const doClear = (tid) => { if (activeTicketsFor(tid).length) setClearWarn(tid); else clearTable(tid); setSel(null); };
  const joinedTo = (tid) => Object.keys(tableState).filter((k) => tableState[k]?.into === tid);
  const detailProps = (tb) => ({
    table: tb, status: tableStatusFor(tb.id), seated: tableState[tb.id], ticket: ticketFor(tb.id), now, joined: joinedTo(tb.id),
    owner: ownerOf(tb.id), locked: !canAct(tb.id),
    onClose: () => setSel(null),
    onSeat: (g) => { seatTable(tb.id, g); setSel(null); },
    onOpen: (into) => { openTableOrder(into || tb.id); },
    onBill: () => {
      const lines = orders[tb.id]?.lines || [];
      if (rules.preBill && lines.length) printBill(tb.id, tb.label, lines, tweaks?.serviceCharge || 0); else requestBill(tb.id);
      setSel(null);
    },
    onClear: () => doClear(tb.id),
    onMove: () => { setMoveFrom(tb.id); setSel(null); },
    onSeparate: () => { separateTable(tb.id); setSel(null); },
  });

  const ticketFor = (tid) => tickets.find((t) => t.table === tid && tkActive(t)) || tickets.find((t) => t.table === tid && tkOpen(t) && !t.cancelled);
  const seatedCountFor = (tid, cap) => {
    const ts = tableState[tid]; const tk = ticketFor(tid);
    const g = (tk?.guests) || (ts?.guests) || 0;
    return Math.min(g, cap);
  };

  const rows = floor.tables
    .map((tb) => ({ tb, status: tableStatusFor(tb.id) }))
    .filter(({ status }) => only === 'all' ? true : only === 'free' ? status === 'free' : status !== 'free')
    .sort((a, b) => (ATTENTION[a.status] - ATTENTION[b.status]) || a.tb.label.localeCompare(b.tb.label, undefined, { numeric: true }));
  const needs = floor.tables.filter((tb) => ['late', 'bill'].includes(tableStatusFor(tb.id))).length;

  return (
    <div className="screen">
      <div className="floor">
        <div className="fbar">
          <div className="fbar__floors">
            {floors.map((f) => (
              <button key={f.id} className={floorId === f.id ? 'active' : ''} onClick={() => { setFloorId(f.id); setSel(null); }}>
                <ion-icon name={AREA_ICON(f)}></ion-icon>
                <span className="flbl">{f.label}</span>
              </button>
            ))}
          </div>
          <div className="fviews">
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List">
              <ion-icon name="list-outline"></ion-icon>{needs > 0 && <em>{needs}</em>}
            </button>
            <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')} aria-label="Map">
              <ion-icon name="map-outline"></ion-icon>
            </button>
          </div>
          <div className="fbar__legend">
            {['seated', 'ordered', 'bill', 'late', 'free'].map((s) => (
              <span key={s} className="flegend"><span className="sw" style={{ background: STATUS_META[s].sw, border: s === 'free' ? '1.5px solid var(--kz-tbl-free-line)' : 'none' }}></span>{STATUS_META[s].label}</span>
            ))}
          </div>
        </div>

        {view === 'list' ? (
          <div className="flist">
            <div className="flist__filter">
              {[['attention', 'In service'], ['free', 'Available'], ['all', 'All tables']].map(([v, l]) => (
                <button key={v} className={only === v ? 'on' : ''} onClick={() => setOnly(v)}>{l}</button>
              ))}
            </div>
            <div className="flist__rows">
              {rows.map(({ tb, status }) => (
                <FloorRow key={tb.id} table={tb} status={status} seated={tableState[tb.id]}
                  ticket={ticketFor(tb.id)} now={now} onClick={() => setSel(tb.id)} />
              ))}
              {!rows.length && (
                <div className="klane__empty" style={{ marginTop: 24 }}><ion-icon name="checkmark-done-outline"></ion-icon>
                  <p>{only === 'free' ? 'Every table is in service' : 'No tables in service'}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="fcanvas">
            <div className="fcanvas__inner">
              {floor.tables.map((tb) => {
                const status = tableStatusFor(tb.id);
                const tk = ticketFor(tb.id);
                return (
                  <FloorTable key={tb.id} table={tb} status={status}
                    seatedCount={seatedCountFor(tb.id, tb.seats)}
                    badge={tk ? tk.items.reduce((s, i) => s + i.qty, 0) : 0}
                    onClick={() => setSel(tb.id)} />
                );
              })}
              {sel && view === 'map' && !narrow && (() => {
                const tb = floor.tables.find((x) => x.id === sel);
                return (
                  <FloorDetail {...detailProps(tb)} />
                );
              })()}
            </div>
          </div>
        )}

        {sel && (view === 'list' || narrow) && (() => {
          const tb = floor.tables.find((x) => x.id === sel);
          if (!tb) return null;
          return (
            <FloorDetail {...detailProps(tb)} sheet />
          );
        })()}
        {moveFrom && <FloorMoveSheet from={moveFrom} onClose={() => setMoveFrom(null)} />}
        {clearWarn && <ClearWarnSheet tableId={clearWarn} onClose={() => setClearWarn(null)} />}
      </div>
    </div>
  );
}

Object.assign(window, { Floor, FloorTable, FloorRow, FloorDetail, useNarrow, SHAPE_CLASS, STATUS_META, AREA_ICON });
