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
};
/* list order: what a waiter should deal with first */
const ATTENTION = { late: 0, bill: 1, ordered: 2, seated: 3, free: 4 };

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
          {status === 'free' ? table.seats + ' seats free'
            : (guests || '—') + ' guests · ' + mins + ' min' + (ticket ? ' · #' + ticket.no : ' · no order yet')}
        </span>
      </span>
      {ticket && <span className="frow__n">{ticket.items.reduce((s, i) => s + i.qty, 0)}</span>}
      <ion-icon name="chevron-forward-outline" className="frow__go"></ion-icon>
    </button>
  );
}

function FloorDetail({ table, status, seated, ticket, now, sheet, onClose, onSeat, onOpen, onBill, onClear }) {
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
          ) : (
            <>
              <div className="fdetail__row"><span>Guests</span><b>{seated?.guests || ticket?.guests || '—'}</b></div>
              <div className="fdetail__row"><span>Seated</span><b>{mins} min</b></div>
              {ticket && <div className="fdetail__row"><span>Order</span><b>#{ticket.no} · {ticket.items.reduce((s, i) => s + i.qty, 0)} items</b></div>}
              {ticket && <div className="fdetail__row"><span>Server</span><b style={{ fontFamily: 'var(--kz-font-sans)' }}>{ticket.server}</b></div>}
            </>
          )}
        </div>
        <div className="fdetail__acts">
          {status === 'free' ? (
            <>
              <button className="ghost" onClick={() => onSeat(guests)}><ion-icon name="people-outline"></ion-icon>Seat {guests}</button>
              <button className="fill" onClick={() => onOpen()}><ion-icon name="cart-outline"></ion-icon>New order</button>
            </>
          ) : (
            <>
              {status !== 'bill' && <button className="ghost" onClick={onBill}><ion-icon name="receipt-outline"></ion-icon>Bill</button>}
              <button className="ghost" onClick={onClear}><ion-icon name="checkmark-done-outline"></ion-icon>Clear</button>
              <button className="fill" onClick={() => onOpen()}><ion-icon name="cart-outline"></ion-icon>Open order</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Floor() {
  const { tickets, tableState, tableStatusFor, now, seatTable, requestBill, clearTable, openTableOrder } = useSuite();
  const [floorId, setFloorId] = useState('main');
  const [sel, setSel] = useState(null);
  const narrow = useNarrow(680);
  const [view, setView] = useState(narrow ? 'list' : 'map');
  const [only, setOnly] = useState('attention');
  useEffect(() => { setView(narrow ? 'list' : 'map'); }, [narrow]);
  const floor = window.RK_FLOORS.find((f) => f.id === floorId);

  const ticketFor = (tid) => tickets.find((t) => t.table === tid && t.status !== 'done');
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
            {window.RK_FLOORS.map((f) => (
              <button key={f.id} className={floorId === f.id ? 'active' : ''} onClick={() => { setFloorId(f.id); setSel(null); }}>
                <ion-icon name={f.id === 'patio' ? 'sunny-outline' : f.id === 'barfloor' ? 'wine-outline' : 'home-outline'}></ion-icon>
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
                  <FloorDetail table={tb} status={tableStatusFor(sel)} seated={tableState[sel]} ticket={ticketFor(sel)} now={now}
                    onClose={() => setSel(null)}
                    onSeat={(g) => { seatTable(sel, g); setSel(null); }}
                    onOpen={() => { openTableOrder(sel); }}
                    onBill={() => { requestBill(sel); setSel(null); }}
                    onClear={() => { clearTable(sel); setSel(null); }} />
                );
              })()}
            </div>
          </div>
        )}

        {sel && (view === 'list' || narrow) && (() => {
          const tb = floor.tables.find((x) => x.id === sel);
          if (!tb) return null;
          return (
            <FloorDetail table={tb} status={tableStatusFor(sel)} seated={tableState[sel]} ticket={ticketFor(sel)} now={now} sheet
              onClose={() => setSel(null)}
              onSeat={(g) => { seatTable(sel, g); setSel(null); }}
              onOpen={() => { openTableOrder(sel); }}
              onBill={() => { requestBill(sel); setSel(null); }}
              onClear={() => { clearTable(sel); setSel(null); }} />
          );
        })()}
      </div>
    </div>
  );
}

Object.assign(window, { Floor, FloorTable, FloorRow, FloorDetail, useNarrow });
