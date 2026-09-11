/* ============================================================
   Koomzo POS Suite — shared store (Context)
   Single source of truth: vertical, screen, tickets (flow
   Register/Kiosk → Kitchen → Floor), table state, live clock.
   ============================================================ */
const { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } = React;

const SuiteContext = createContext(null);
const useSuite = () => useContext(SuiteContext);

let TICKET_SEQ = 820;
const nextNo = () => ++TICKET_SEQ;

function buildSeedTickets() {
  const now = Date.now();
  return window.RK_SEED_TICKETS.map((s, i) => ({
    id: 'seed' + i,
    no: s.no,
    table: s.table,
    floor: s.floor,
    server: s.server,
    guests: s.guests,
    status: s.status,                       // cook | ready | done
    firedAt: now - s.firedMin * 60000,
    items: s.items.map((it) => ({ ...it, done: s.status === 'done' })),
    source: 'register',
  }));
}

/* seed table state: a few seated-without-order + bill requests */
const SEED_TABLES = {
  T1:  { status: 'seated', guests: 2, since: Date.now() - 6 * 60000 },
  T3:  { status: 'bill',   guests: 4, since: Date.now() - 52 * 60000 },
  P2:  { status: 'seated', guests: 2, since: Date.now() - 3 * 60000 },
  B8:  { status: 'seated', guests: 5, since: Date.now() - 14 * 60000 },
};

function SuiteProvider({ tweaks, children }) {
  const [screen, setScreen] = useState('register'); // a module lands on its core job
  const [vertical, setVertical] = useState('restaurant');
  const [tickets, setTickets] = useState(buildSeedTickets);
  const [tableState, setTableState] = useState(SEED_TABLES);
  const [activeTable, setActiveTable] = useState(null);     // table id the register is bound to
  const [now, setNow] = useState(Date.now());

  /* live clock — drives SLA timers + floor aging */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ---- ticket flow ---- */
  const sendTicket = useCallback((payload) => {
    const id = 'tk' + Date.now();
    const no = payload.no || nextNo();
    setTickets((cur) => [
      { id, no, status: 'cook', firedAt: Date.now(), ...payload,
        items: payload.items.map((it) => ({ ...it, done: false })) },
      ...cur,
    ]);
    if (payload.table) {
      setTableState((cur) => ({ ...cur, [payload.table]: { ...(cur[payload.table] || {}), status: 'ordered', guests: payload.guests || (cur[payload.table]?.guests ?? 2), since: cur[payload.table]?.since || Date.now() } }));
    }
    return no;
  }, []);

  const bumpTicket = useCallback((id) => {
    setTickets((cur) => cur.map((t) => {
      if (t.id !== id) return t;
      const nextStatus = t.status === 'cook' ? 'ready' : t.status === 'ready' ? 'done' : 'done';
      return { ...t, status: nextStatus, items: t.items.map((it) => ({ ...it, done: nextStatus === 'done' ? true : it.done })) };
    }));
  }, []);

  const recallTicket = useCallback((id) => {
    setTickets((cur) => cur.map((t) => {
      if (t.id !== id) return t;
      const prevStatus = t.status === 'done' ? 'ready' : t.status === 'ready' ? 'cook' : 'cook';
      return { ...t, status: prevStatus };
    }));
  }, []);

  const toggleItemDone = useCallback((ticketId, idx) => {
    setTickets((cur) => cur.map((t) => {
      if (t.id !== ticketId) return t;
      return { ...t, items: t.items.map((it, i) => i === idx ? { ...it, done: !it.done } : it) };
    }));
  }, []);

  /* ---- tables ---- */
  const seatTable = useCallback((tableId, guests) => {
    setTableState((cur) => ({ ...cur, [tableId]: { status: 'seated', guests, since: Date.now() } }));
  }, []);
  const requestBill = useCallback((tableId) => {
    setTableState((cur) => ({ ...cur, [tableId]: { ...(cur[tableId] || { guests: 2 }), status: 'bill' } }));
  }, []);
  const clearTable = useCallback((tableId) => {
    setTableState((cur) => { const n = { ...cur }; delete n[tableId]; return n; });
    setTickets((cur) => cur.filter((t) => t.table !== tableId || t.status === 'done'));
  }, []);

  /* open a table's order on the register */
  const openTableOrder = useCallback((tableId) => {
    setActiveTable(tableId);
    setScreen('register');
  }, []);

  /* ---- derived: table display status (free/seated/ordered/late/bill) ---- */
  const SLA_LATE = (tweaks?.slaLate ?? 10);
  const tableStatusFor = useCallback((tableId) => {
    const active = tickets.find((t) => t.table === tableId && t.status !== 'done');
    if (active) {
      const mins = (now - active.firedAt) / 60000;
      if (mins >= SLA_LATE) return 'late';
      return 'ordered';
    }
    const ts = tableState[tableId];
    if (ts) return ts.status === 'ordered' ? 'seated' : ts.status;  // ordered handled above
    return 'free';
  }, [tickets, tableState, now, SLA_LATE]);

  /* ---- derived counts for launcher / rail badges ---- */
  const counts = useMemo(() => {
    const cook = tickets.filter((t) => t.status === 'cook').length;
    const ready = tickets.filter((t) => t.status === 'ready').length;
    const done = tickets.filter((t) => t.status === 'done').length;
    let seated = 0, occupied = 0, totalTables = 0;
    window.RK_FLOORS.forEach((f) => f.tables.forEach((tb) => {
      totalTables++;
      const st = tableStatusFor(tb.id);
      if (st !== 'free') occupied++;
      if (st === 'seated') seated++;
    }));
    const late = tickets.filter((t) => t.status !== 'done' && (now - t.firedAt) / 60000 >= SLA_LATE).length;
    return { cook, ready, done, seated, occupied, totalTables, late, active: cook + ready };
  }, [tickets, now, tableStatusFor, SLA_LATE]);

  const value = {
    screen, setScreen, vertical, setVertical,
    tickets, sendTicket, bumpTicket, recallTicket, toggleItemDone,
    tableState, seatTable, requestBill, clearTable,
    activeTable, setActiveTable, openTableOrder, tableStatusFor,
    now, counts, tweaks,
    verticalCfg: window.RK_VERTICALS[vertical],
    menu: window.RK_MENU[vertical],
  };
  return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
}

/* ---- small shared helpers ---- */
const money = (n) => window.KZ_LOCALE.short(n);
const qtyStr = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(3)));
const elapsedMin = (firedAt, now) => Math.max(0, Math.floor((now - firedAt) / 60000));
const elapsedLabel = (firedAt, now) => {
  const totalSec = Math.max(0, Math.floor((now - firedAt) / 1000));
  const m = Math.floor(totalSec / 60), s = totalSec % 60;
  return m + "'" + String(s).padStart(2, '0');
};
const slaClass = (mins, warn, late) => (mins >= late ? 'late' : mins >= warn ? 'warn' : 'ok');

/* allergen/diet chip */
function TagChips({ tags, size }) {
  if (!tags || !tags.length) return null;
  return (
    <span className="tagchips">
      {tags.map((id) => {
        const tg = window.RK_TAGS[id];
        if (!tg) return null;
        return <span key={id} className={size === 'k' ? 'kchip' : 'tagchip'} title={tg.label}
          style={{ background: tg.color + '1f', color: tg.color }}>{tg.short}</span>;
      })}
    </span>
  );
}

Object.assign(window, {
  SuiteContext, useSuite, SuiteProvider,
  money, qtyStr, elapsedMin, elapsedLabel, slaClass, TagChips,
});
