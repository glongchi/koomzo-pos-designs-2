/* ============================================================
   Koomzo POS Suite — shared store (Context)
   Single source of truth: vertical, screen, tickets (flow
   Register/Kiosk → Kitchen → Floor), per-table orders, table
   state, floor plan, service rules, void log, live clock.

   Persistence (prototype stand-in for the device's SQLite):
   orders · tickets · tables · floors · rules · voids · kiosk lock
   are kept in localStorage under kz:rk:*. Tender results are NEVER
   persisted here (ruling R4) — the charge sheet owns those.
   ============================================================ */
const { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } = React;

const SuiteContext = createContext(null);
const useSuite = () => useContext(SuiteContext);

let TICKET_SEQ = 820;
const nextNo = () => ++TICKET_SEQ;

const RK_STORE_V = 2;
const rkKey = (k) => 'kz:rk:v' + RK_STORE_V + ':' + k;
const rkLoad = (k, fallback) => {
  try { const raw = localStorage.getItem(rkKey(k)); return raw ? JSON.parse(raw) : (typeof fallback === 'function' ? fallback() : fallback); }
  catch (e) { return typeof fallback === 'function' ? fallback() : fallback; }
};
const rkSave = (k, v) => { try { localStorage.setItem(rkKey(k), JSON.stringify(v)); } catch (e) {} };

/* venue service rules — every decision in the plan is a policy, not hard-coded */
const RK_RULES_DEFAULT = {
  voidRule: 'free-until-start',   // free-until-start | pin-always | free
  voidPinAbove: 0,                // FCFA — 0 = rule applies to every value
  remoteApproval: true,           // owner approves from their phone (mock)
  clearCancelNeedsPin: false,
  servedAgeMin: 10,               // Served lane safety net; 0 = never
  kioskIdleSec: 90,
  managerPin: '1234',
  printKitchen: false,            // D6 — no KDS: print a slip per station (on for Maquis, Snack)
  printerOnline: true,            // prototype stand-in for the printer's real status
  assignServer: true,             // D6 — a table belongs to the server who opened it
  preBill: true,                  // D6 — print the addition before payment; reprint after any change
};
/* prototype staff — production reads the location's users */
const RK_STAFF = [
  { id: 'anita', name: 'Anita N.', role: 'Server', init: 'AN' },
  { id: 'blaise', name: 'Blaise M.', role: 'Server', init: 'BM' },
  { id: 'sandrine', name: 'Sandrine A.', role: 'Server', init: 'SA' },
  { id: 'eric', name: 'Eric F.', role: 'Bartender', init: 'EF' },
  { id: 'mireille', name: 'Mireille K.', role: 'Supervisor', init: 'MK', sup: true },
];
const lineUnit = (o) => (o.priceOverride != null ? o.priceOverride : o.price) * (1 - (o.discPct || 0) / 100);
const billSig = (lines) => lines.map((l) => l.uid + ':' + l.qty + ':' + lineUnit(l)).join('|');
function rkTotals(lines, svcRate) {
  const net = lines.reduce((s, o) => s + lineUnit(o) * o.qty, 0);
  const svc = +(net * (svcRate || 0) / 100).toFixed(2);
  const tax = Math.round((net + svc) * window.KZ_LOCALE.vat / 100);
  return { net, svc, tax, total: +(net + svc + tax).toFixed(2) };
}
/* earlier sales today, so the day close has something to read (tenders are not persisted — R4) */
function seedSales() {
  const now = Date.now(), m = 60000;
  return [
    [190, 14500, 'T2', 'Sandrine A.', 'cash'], [172, 9000, 'P1', 'Blaise M.', 'momo'], [151, 23500, 'T8', 'Anita N.', 'cash'],
    [128, 6000, 'S3', 'Eric F.', 'om'], [97, 31000, 'T10', 'Sandrine A.', 'momo'], [74, 12500, 'P3', 'Anita N.', 'card'],
    [41, 8500, 'S1', 'Eric F.', 'cash'],
  ].map(([ago, total, table, server, method], i) => ({ id: 'ss' + i, at: now - ago * m, total, table, server, method, seed: true }));
}
const VOID_REASONS = ['Customer changed mind', 'Wrong item keyed', 'Kitchen error', 'Too slow', 'Quality issue'];

function buildSeedTickets() {
  const now = Date.now();
  return window.RK_SEED_TICKETS.map((s, i) => ({
    id: 'seed' + i, no: s.no, table: s.table, floor: s.floor, server: s.server, guests: s.guests,
    status: s.status, firedAt: now - s.firedMin * 60000, servedAt: s.status === 'done' ? now - 2 * 60000 : null,
    items: s.items.map((it, j) => ({ ...it, uid: 'seed' + i + '-' + j, done: s.status === 'done', voidQty: 0 })),
    source: 'register',
  }));
}
const SEED_TABLES = () => ({
  T1: { status: 'seated', guests: 2, since: Date.now() - 6 * 60000 },
  T3: { status: 'bill',   guests: 4, since: Date.now() - 52 * 60000 },
  P2: { status: 'seated', guests: 2, since: Date.now() - 3 * 60000 },
  B8: { status: 'seated', guests: 5, since: Date.now() - 14 * 60000 },
});

/* a ticket is "open" until the table is closed or it is cancelled+acknowledged */
const tkOpen = (t) => !t.closed && !(t.cancelled && t.cancelled.ack);
const tkActive = (t) => tkOpen(t) && !t.cancelled && t.status !== 'done';
const liveQty = (it) => Math.max(0, it.qty - (it.voidQty || 0));

function SuiteProvider({ tweaks, setTweak, children }) {
  const [screen, setScreen] = useState('register');
  const [vertical, setVertical] = useState('restaurant');
  const [tickets, setTickets] = useState(() => {
    const saved = rkLoad('tickets', null);
    /* a new service day: saved work older than 12 h is yesterday's demo state — reseed */
    if (!saved || !saved.some((t) => Date.now() - t.firedAt < 12 * 3600000)) return buildSeedTickets();
    return saved;
  });
  const [tableState, setTableState] = useState(() => {
    const saved = rkLoad('tickets', null);
    if (!saved || !saved.some((t) => Date.now() - t.firedAt < 12 * 3600000)) return SEED_TABLES();
    return rkLoad('tables', SEED_TABLES);
  });
  /* line uids must be unique per order; older saved orders may repeat one (uid counter used to reset on reload) */
  const [orders, setOrders] = useState(() => {
    const saved = rkLoad('orders', {});
    Object.keys(saved).forEach((k) => {
      const lines = saved[k] && saved[k].lines; if (!Array.isArray(lines)) return;
      const seen = new Set();
      saved[k] = { ...saved[k], lines: lines.map((l, i) => { if (!l || !l.uid || !seen.has(l.uid)) { l && seen.add(l.uid); return l; } const nu = l.uid + '-' + i; seen.add(nu); return { ...l, uid: nu }; }) };
    });
    return saved;
  });
  const [floorsAll, setFloorsRaw] = useState(() => rkLoad('floors', () => window.RK_FLOORS));
  /* G5 — archive, don't delete: screens see only live areas and tables; history still resolves labels */
  const floors = useMemo(() => activeFloors(floorsAll), [floorsAll]);
  const [rules, setRulesRaw] = useState(() => ({ ...RK_RULES_DEFAULT, ...rkLoad('rules', {}) }));
  const [voids, setVoids] = useState(() => rkLoad('voids', []));
  const [kioskLocked, setKioskLocked] = useState(() => rkLoad('kiosk', false));
  const [activeTable, setActiveTable] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [restored, setRestored] = useState(() => Object.values(rkLoad('orders', {})).some((o) => o.lines && o.lines.length));

  /* the floor plan is venue config; every screen reads window.RK_FLOORS (live only) */
  window.RK_FLOORS = floors; window.RK_FLOORS_ALL = floorsAll;
  const setFloors = useCallback((f) => { setTplUndo((u) => (u && u.kind === 'floor' ? null : u)); setFloorsRaw((cur) => { const n = typeof f === 'function' ? f(cur) : f; window.RK_FLOORS_ALL = n; window.RK_FLOORS = activeFloors(n); return n; }); }, []);
  const setRules = useCallback((patch) => setRulesRaw((cur) => ({ ...cur, ...patch })), []);

  const [me, setMe] = useState(() => rkLoad('me', RK_STAFF[0].id));
  const meObj = RK_STAFF.find((x) => x.id === me) || RK_STAFF[0];
  const meRef = useRef(meObj); meRef.current = meObj;
  const rulesRef = useRef(rules); rulesRef.current = rules;
  const ticketsRef = useRef(tickets); ticketsRef.current = tickets;
  const ordersRef = useRef(orders); ordersRef.current = orders;
  const [prints, setPrints] = useState(() => rkLoad('prints', []));
  const [sales, setSales] = useState(seedSales);
  const [day, setDay] = useState(() => { const d = rkLoad('day', {}); return d.closedAt && Date.now() - d.closedAt > 12 * 3600000 ? {} : d; });
  const [setupTab, setSetupTab] = useState('menu');
  const [menus, setMenus] = useState(() => rkLoad('menus', () => window.RK_MENU));
  const [cats, setCats] = useState(() => rkLoad('cats', () => Object.fromEntries(Object.entries(window.RK_VERTICALS).map(([k, v]) => [k, v.categories]))));
  useEffect(() => { window.RK_MENU = menus; rkSave('menus', menus); }, [menus]);
  useEffect(() => { rkSave('cats', cats); }, [cats]);
  const [tplUndo, setTplUndo] = useState(null);   // last template applied — one undo, until the next edit
  const [tplOpen, setTplOpen] = useState(null);   // { kind, id } — open the template picker (bundle offer)
  const clearUndo = (k) => setTplUndo((u) => (u && u.kind === k ? null : u));
  const setMenu = useCallback((fn) => { clearUndo('menu'); setMenus((cur) => ({ ...cur, [vertical]: typeof fn === 'function' ? fn(cur[vertical] || []) : fn })); }, [vertical]);
  const setCategories = useCallback((fn) => { clearUndo('menu'); setCats((cur) => ({ ...cur, [vertical]: typeof fn === 'function' ? fn(cur[vertical] || []) : fn })); }, [vertical]);
  useEffect(() => { rkSave('me', me); }, [me]);
  useEffect(() => { rkSave('prints', prints); }, [prints]);
  useEffect(() => { rkSave('day', day); }, [day]);

  /* G6 — print to kitchen. Offline printer: slips wait and print in order when it is back */
  const queuePrint = useCallback((job) => {
    setPrints((cur) => [{ id: 'p' + Date.now() + Math.random().toString(36).slice(2, 6), at: Date.now(), status: rulesRef.current.printerOnline ? 'printed' : 'waiting', ...job }, ...cur].slice(0, 60));
  }, []);
  useEffect(() => {
    if (rules.printerOnline) setPrints((cur) => cur.some((p) => p.status === 'waiting') ? cur.map((p) => p.status === 'waiting' ? { ...p, status: 'printed', printedAt: Date.now() } : p) : cur);
  }, [rules.printerOnline]);
  const printByStation = (kind, no, table, items, extra) => {
    const by = {};
    items.forEach((it) => { const st = it.station || 'none'; (by[st] = by[st] || []).push({ name: it.name, qty: it.qty, notes: it.notes }); });
    Object.entries(by).forEach(([station, list]) => queuePrint({ kind, station, no, table, items: list, ...(extra || {}) }));
  };

  const recordSale = useCallback((s) => setSales((cur) => [{ id: 's' + Date.now(), at: Date.now(), ...s }, ...cur]), []);
  const closeDay = useCallback((digest) => setDay({ closedAt: Date.now(), by: meRef.current.name, digest, digestQueuedAt: Date.now() }), []);
  const reopenDay = useCallback(() => setDay({}), []);

  useEffect(() => { rkSave('tickets', tickets); }, [tickets]);
  useEffect(() => { rkSave('tables', tableState); }, [tableState]);
  useEffect(() => { rkSave('orders', orders); }, [orders]);
  useEffect(() => { rkSave('floors', floors); }, [floors]);
  useEffect(() => { rkSave('rules', rules); }, [rules]);
  useEffect(() => { rkSave('voids', voids); }, [voids]);
  useEffect(() => { rkSave('kiosk', kioskLocked); }, [kioskLocked]);
  useEffect(() => { if (kioskLocked) setScreen('kiosk'); }, []);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  /* ---- per-table orders ---- */
  const getOrder = useCallback((key) => orders[key] || { lines: [] }, [orders]);
  const setOrderLines = useCallback((key, fn) => {
    setOrders((cur) => {
      const prev = cur[key] || { lines: [] };
      const lines = typeof fn === 'function' ? fn(prev.lines) : fn;
      const n = { ...cur };
      if (!lines.length && !prev.keep) delete n[key]; else n[key] = { ...prev, server: prev.server || meRef.current.name, lines };
      return n;
    });
  }, []);

  const setOrderMeta = useCallback((key, patch) => setOrders((cur) => ({ ...cur, [key]: { lines: [], ...(cur[key] || {}), ...(typeof patch === 'function' ? patch(cur[key] || {}) : patch) } })), []);

  /* ---- ticket flow ---- */
  const sendTicket = useCallback((payload) => {
    const id = payload.id || ('tk' + Date.now() + Math.random().toString(36).slice(2, 5));
    const no = payload.no || nextNo();
    setTickets((cur) => [
      { id, no, status: 'cook', firedAt: Date.now(), ...payload, id,
        items: payload.items.map((it, j) => ({ uid: it.uid || id + '-' + j, ...it, done: false, voidQty: 0 })) },
      ...cur,
    ]);
    if (rulesRef.current.printKitchen) printByStation('fire', no, payload.table ? tableLabel(payload.table) : 'Counter', payload.items, { server: payload.server });
    if (payload.table && floors.some((f) => f.tables.some((t) => t.id === payload.table))) {
      setTableState((cur) => ({ ...cur, [payload.table]: { ...(cur[payload.table] || {}), status: 'ordered', guests: payload.guests || (cur[payload.table]?.guests ?? 2), since: cur[payload.table]?.since || Date.now() } }));
    }
    return no;
  }, [floors]);

  const bumpTicket = useCallback((id) => {
    setTickets((cur) => cur.map((t) => {
      if (t.id !== id) return t;
      const nextStatus = t.status === 'cook' ? 'ready' : 'done';
      return { ...t, status: nextStatus, servedAt: nextStatus === 'done' ? Date.now() : t.servedAt,
        items: t.items.map((it) => ({ ...it, done: nextStatus === 'done' ? true : it.done })) };
    }));
  }, []);
  const recallTicket = useCallback((id) => {
    setTickets((cur) => cur.map((t) => t.id !== id ? t : { ...t, status: t.status === 'done' ? 'ready' : 'cook', servedAt: null }));
  }, []);
  const toggleItemDone = useCallback((ticketId, idx) => {
    setTickets((cur) => cur.map((t) => t.id !== ticketId ? t : { ...t, items: t.items.map((it, i) => i === idx ? { ...it, done: !it.done } : it) }));
  }, []);
  const closeServed = useCallback((ids) => {
    setTickets((cur) => cur.map((t) => ids.includes(t.id) ? { ...t, closed: true, closedAt: Date.now() } : t));
  }, []);

  /* ---- void / amend after fire (C2) ---- */
  const voidFired = useCallback(({ ticketId, uid, qty, reason, approver, value, table, name }) => {
    const tk = ticketsRef.current.find((t) => t.id === ticketId); const src = tk?.items.find((it) => it.uid === uid);
    if (rulesRef.current.printKitchen && tk) printByStation('void', tk.no, table, [{ name, qty, station: src?.station }], { reason });
    setTickets((cur) => cur.map((t) => {
      if (t.id !== ticketId) return t;
      const items = t.items.map((it) => it.uid !== uid ? it : { ...it, voidQty: Math.min(it.qty, (it.voidQty || 0) + qty), voidReason: reason, voidAck: false, voidAt: Date.now() });
      const allVoid = items.every((it) => liveQty(it) === 0);
      return { ...t, items, cancelled: allVoid ? { reason, at: Date.now(), ack: false } : t.cancelled };
    }));
    /* ruling R1: fire −1 · reversal +1 · waste −1 → net one unit off stock */
    setVoids((cur) => [{ id: 'v' + Date.now(), at: Date.now(), table, name, qty, value, reason, by: meRef.current.name, approver: approver || null,
      stock: [{ kind: 'fire', d: -qty }, { kind: 'fire', d: +qty, reason: 'void-reversal' }, { kind: 'adjust', d: -qty, reason: 'waste' }] }, ...cur]);
  }, []);
  const amendFired = useCallback((ticketId, uid, notes) => {
    const tk = ticketsRef.current.find((t) => t.id === ticketId); const src = tk?.items.find((it) => it.uid === uid);
    if (rulesRef.current.printKitchen && tk && src) printByStation('changed', tk.no, tableLabel(tk.table), [{ name: src.name, qty: liveQty(src), station: src.station, notes }]);
    setTickets((cur) => cur.map((t) => t.id !== ticketId ? t : { ...t, items: t.items.map((it) => it.uid !== uid ? it : { ...it, notes, amendAck: false, amendAt: Date.now() }) }));
  }, []);
  const ackItem = useCallback((ticketId, uid) => {
    setTickets((cur) => cur.map((t) => t.id !== ticketId ? t : { ...t, items: t.items.map((it) => it.uid !== uid ? it : { ...it, voidAck: true, amendAck: true }) }));
  }, []);
  const ackCancelled = useCallback((ticketId) => {
    setTickets((cur) => cur.map((t) => t.id !== ticketId ? t : { ...t, cancelled: { ...(t.cancelled || {}), ack: true } }));
  }, []);

  /* ---- tables ---- */
  const seatTable = useCallback((tableId, guests) => {
    setTableState((cur) => ({ ...cur, [tableId]: { status: 'seated', guests, since: Date.now() } }));
  }, []);
  const requestBill = useCallback((tableId) => {
    setTableState((cur) => ({ ...cur, [tableId]: { ...(cur[tableId] || { guests: 2 }), status: 'bill' } }));
  }, []);
  const tablesInGroup = useCallback((tableId) => [tableId, ...Object.keys(tableState).filter((k) => tableState[k]?.into === tableId)], [tableState]);
  const activeTicketsFor = useCallback((tableId) => tickets.filter((t) => t.table === tableId && tkActive(t)), [tickets]);

  /* C4 — clear never deletes. outcome for food still in the kitchen:
     'takeaway' keep cooking, hand over at the counter · 'cancel' void it · 'served' cook forgot to bump */
  const clearTable = useCallback((tableId, outcome) => {
    const group = [tableId, ...Object.keys(tableState).filter((k) => tableState[k]?.into === tableId)];
    const label = tableLabel(tableId);
    setTickets((cur) => cur.map((t) => {
      if (!group.includes(t.table) || !tkOpen(t)) return t;
      if (t.status === 'done' || t.cancelled) return { ...t, closed: true, closedAt: Date.now() };
      if (outcome === 'takeaway') return { ...t, table: 'T/A', takeawayFrom: label };
      if (outcome === 'served') return { ...t, status: 'done', servedAt: Date.now(), closed: true, closedAt: Date.now(), items: t.items.map((it) => ({ ...it, done: true })) };
      if (outcome === 'cancel') return { ...t, cancelled: { reason: 'Table cleared', at: Date.now(), ack: false },
        items: t.items.map((it) => ({ ...it, voidQty: it.qty, voidReason: 'Table cleared', voidAck: false })) };
      return t;
    }));
    if (outcome === 'cancel') {
      const lost = tickets.filter((t) => group.includes(t.table) && tkActive(t));
      if (lost.length) setVoids((cur) => [...lost.flatMap((t) => t.items.filter((it) => liveQty(it) > 0).map((it) => ({ id: 'v' + Date.now() + it.uid, at: Date.now(), table: label, name: it.name, qty: liveQty(it), value: 0, reason: 'Table cleared', by: meRef.current.name }))), ...cur]);
      if (lost.length && rulesRef.current.printKitchen) lost.forEach((t) => printByStation('void', t.no, label, t.items.filter((it) => liveQty(it) > 0).map((it) => ({ name: it.name, qty: liveQty(it), station: it.station })), { reason: 'Table cleared' }));
    }
    setTableState((cur) => { const n = { ...cur }; group.forEach((g) => delete n[g]); return n; });
    setOrders((cur) => { const n = { ...cur }; group.forEach((g) => delete n[g]); return n; });
  }, [tableState, tickets]);

  /* C3 — move a party to a free table, or merge into an occupied one */
  const moveParty = useCallback((from, to) => {
    const fromLabel = tableLabel(from);
    const targetBusy = !!tableState[to] || tickets.some((t) => t.table === to && tkOpen(t));
    setTickets((cur) => cur.map((t) => t.table === from && tkOpen(t) ? { ...t, table: to, floor: floorOf(to), movedFrom: fromLabel } : t));
    setOrders((cur) => {
      const n = { ...cur }; const src = n[from]; delete n[from];
      if (src) n[to] = { ...(n[to] || {}), server: n[to]?.server || src.server, lines: [...(n[to]?.lines || []), ...src.lines] };
      return n;
    });
    setTableState((cur) => {
      const n = { ...cur }; const src = n[from] || { status: 'seated', guests: 2, since: Date.now() };
      Object.keys(n).forEach((k) => { if (n[k]?.into === from) n[k] = { ...n[k], into: to }; });
      if (targetBusy) { n[to] = { ...n[to], guests: (n[to]?.guests || 0) + (src.guests || 0) }; n[from] = { status: 'merged', into: to, guests: src.guests, since: src.since }; }
      else { n[to] = { ...src }; delete n[from]; }
      return n;
    });
    if (activeTable === from) setActiveTable(to);
  }, [tableState, tickets, activeTable]);
  const separateTable = useCallback((tableId) => {
    setTableState((cur) => { const n = { ...cur }; delete n[tableId]; return n; });
  }, []);

  /* move bill lines (split by item) — fired lines are flagged on the KDS */
  const moveLines = useCallback((from, to, uids) => {
    let moving = [];
    setOrders((cur) => {
      const n = { ...cur }; const src = n[from] || { lines: [] };
      moving = src.lines.filter((l) => uids.includes(l.uid));
      const rest = src.lines.filter((l) => !uids.includes(l.uid));
      if (rest.length) n[from] = { ...src, lines: rest }; else delete n[from];
      n[to] = { ...(n[to] || {}), lines: [...(n[to]?.lines || []), ...moving] };
      return n;
    });
    const toLabel = tableLabel(to);
    setTickets((cur) => cur.map((t) => ({ ...t, items: t.items.map((it) => uids.includes(it.uid) ? { ...it, movedTo: toLabel } : it) })));
    setTableState((cur) => cur[to] ? cur : { ...cur, [to]: { status: 'seated', guests: 1, since: Date.now() } });
  }, []);

  const openTableOrder = useCallback((tableId) => {
    setOrders((cur) => {
      const walk = cur._walkin;
      if (!walk || !walk.lines.length || (cur[tableId] && cur[tableId].lines.length)) return cur;
      /* never drop my walk-in onto another server's table */
      const owner = cur[tableId]?.server || ticketsRef.current.find((t) => t.table === tableId && tkOpen(t))?.server;
      if (rulesRef.current.assignServer && owner && owner !== meRef.current.name && !meRef.current.sup) return cur;
      const n = { ...cur, [tableId]: walk }; delete n._walkin; return n;
    });
    setActiveTable(tableId);
    setScreen('register');
  }, []);

  /* ---- D6 table assigned to server ---- */
  const ownerOf = useCallback((tid) => {
    if (!tid) return null;
    return orders[tid]?.server || tickets.find((t) => t.table === tid && tkOpen(t))?.server || null;
  }, [orders, tickets]);
  const canAct = useCallback((tid) => {
    if (!rules.assignServer || !tid) return true;
    const o = ownerOf(tid);
    return !o || o === meObj.name || !!meObj.sup;
  }, [rules.assignServer, ownerOf, meObj]);
  const takeOver = useCallback((tid) => {
    setOrderMeta(tid, { server: meRef.current.name });
    setTickets((cur) => cur.map((t) => t.table === tid && tkOpen(t) ? { ...t, server: meRef.current.name } : t));
  }, []);

  /* ---- D6 pre-bill (addition) ---- */
  const printBill = useCallback((key, label, lines, svcRate) => {
    const t = rkTotals(lines, svcRate);
    const n = ((ordersRef.current[key]?.bill?.n) || 0) + 1;
    setOrderMeta(key, { bill: { sig: billSig(lines), at: Date.now(), total: t.total, n } });
    queuePrint({ kind: 'bill', station: 'till', table: label, total: t.total, svc: t.svc, tax: t.tax, reprint: n > 1,
      items: lines.map((l) => ({ name: l.name, qty: l.qty, amt: Math.round(lineUnit(l) * l.qty) })) });
    if (floors.some((f) => f.tables.some((x) => x.id === key))) setTableState((cur) => ({ ...cur, [key]: { ...(cur[key] || { guests: 2, since: Date.now() }), status: 'bill' } }));
  }, [floors]);

  /* ---- derived table status ---- */
  const SLA_LATE = (tweaks?.slaLate ?? 10);
  const tableStatusFor = useCallback((tableId) => {
    const ts = tableState[tableId];
    if (ts && ts.status === 'merged') return 'merged';
    const active = tickets.find((t) => t.table === tableId && tkActive(t));
    if (active) return (now - active.firedAt) / 60000 >= SLA_LATE ? 'late' : 'ordered';
    if (ts) return ts.status === 'ordered' ? 'seated' : ts.status;
    if (orders[tableId] && orders[tableId].lines.length) return 'seated';
    return 'free';
  }, [tickets, tableState, orders, now, SLA_LATE]);

  /* Served lane: closed on payment; age-out safety net per rules */
  const inServedLane = useCallback((t) => t.status === 'done' && tkOpen(t) && !t.cancelled
    && !(rules.servedAgeMin > 0 && t.servedAt && (now - t.servedAt) / 60000 >= rules.servedAgeMin), [rules.servedAgeMin, now]);

  const counts = useMemo(() => {
    const open = tickets.filter((t) => tkOpen(t) && !t.cancelled);
    const cook = open.filter((t) => t.status === 'cook').length;
    const ready = open.filter((t) => t.status === 'ready').length;
    const done = tickets.filter(inServedLane).length;
    let seated = 0, occupied = 0, totalTables = 0;
    floors.forEach((f) => f.tables.forEach((tb) => {
      totalTables++;
      const st = tableStatusFor(tb.id);
      if (st !== 'free') occupied++;
      if (st === 'seated') seated++;
    }));
    const late = open.filter((t) => t.status !== 'done' && (now - t.firedAt) / 60000 >= SLA_LATE).length;
    return { cook, ready, done, seated, occupied, totalTables, late, active: cook + ready };
  }, [tickets, now, tableStatusFor, SLA_LATE, floors, inServedLane]);

  const value = {
    screen, setScreen, vertical, setVertical,
    tickets, sendTicket, bumpTicket, recallTicket, toggleItemDone, closeServed, inServedLane,
    voidFired, amendFired, ackItem, ackCancelled, voids,
    orders, getOrder, setOrderLines, restored, setRestored,
    tableState, seatTable, requestBill, clearTable, moveParty, separateTable, moveLines, tablesInGroup, activeTicketsFor,
    activeTable, setActiveTable, openTableOrder, tableStatusFor,
    floors, floorsAll, setFloors, rules, setRules, kioskLocked, setKioskLocked,
    me: meObj, setMe, staff: RK_STAFF, ownerOf, canAct, takeOver, setOrderMeta, printBill,
    prints, queuePrint, sales, recordSale, day, closeDay, reopenDay, setupTab, setSetupTab,
    now, counts, tweaks, setTweak,
    verticalCfg: { ...window.RK_VERTICALS[vertical], categories: cats[vertical] || window.RK_VERTICALS[vertical].categories },
    menu: menus[vertical] || [], setMenu, setCategories, tplUndo, setTplUndo, tplOpen, setTplOpen,
  };
  return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
}

/* ---- table helpers (read the live floor plan) ---- */
function activeFloors(all) {
  return (all || []).filter((f) => !f.archivedAt).map((f) => ({ ...f, tables: f.tables.filter((t) => !t.archivedAt) }));
}
function floorOf(tableId) {
  if (!tableId) return 'main';
  const f = (window.RK_FLOORS_ALL || window.RK_FLOORS).find((fl) => fl.tables.some((t) => t.id === tableId));
  return f ? f.id : (window.RK_FLOORS[0]?.id || 'main');
}
function tableLabel(tableId) {
  for (const f of (window.RK_FLOORS_ALL || window.RK_FLOORS)) { const t = f.tables.find((x) => x.id === tableId); if (t) return t.label; }
  return tableId;
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
  SuiteContext, useSuite, SuiteProvider, RK_RULES_DEFAULT, RK_STAFF, billSig, rkTotals, lineUnit, activeFloors, VOID_REASONS, tkOpen, tkActive, liveQty,
  money, qtyStr, elapsedMin, elapsedLabel, slaClass, TagChips, floorOf, tableLabel,
});
