/* ============================================================
   Koomzo POS Suite — REGISTER (configurable per vertical)
   ============================================================ */
let RUID = 1;

function Register() {
  const S = useSuite();
  const { vertical, verticalCfg, menu, tweaks, sendTicket, activeTable, setActiveTable, tableState, setScreen, clearTable,
    getOrder, setOrderLines, activeTicketsFor, amendFired, restored, setRestored, me, rules, canAct, ownerOf, printBill, recordSale } = S;
  const flags = verticalCfg.flags;

  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('grid');
  const [selectedUid, setSelectedUid] = useState(null);
  const [mode, setMode] = useState('qty');
  const [buffer, setBuffer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activeCourse, setActiveCourse] = useState(1);
  const [guests, setGuests] = useState(2);
  const [tabName, setTabName] = useState('Bar Tab');
  const [charging, setCharging] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [noteFor, setNoteFor] = useState(null);
  const [orderNo, setOrderNo] = useState(() => window.KZ_TICKET.compose({ loc: 'DLA1', reg: 'R1', seq: 1042 }));
  const [mobilePane, setMobilePane] = useState('menu'); // phone: 'menu' | 'order'
  const [voidFor, setVoidFor] = useState(null);
  const [moving, setMoving] = useState(false);
  const [clearWarn, setClearWarn] = useState(null);
  const [takeover, setTakeover] = useState(false);

  /* C1 — one open order per table / tab / counter, held in the store */
  const orderKey = flags.tables ? (activeTable || '_walkin') : flags.tabs ? 'tab:' + tabName : '_counter:' + vertical;
  const orderMeta = getOrder(orderKey);
  const order = orderMeta.lines;
  /* D6 — table belongs to its server: anyone else sees it read-only */
  const locked = flags.tables && activeTable && !canAct(activeTable);
  const owner = flags.tables && activeTable ? ownerOf(activeTable) : null;
  const setOrder = (fn) => { if (!locked) setOrderLines(orderKey, fn); };

  /* reset selection when the bound order changes */
  useEffect(() => { setSelectedUid(null); setEditing(false); setActiveCourse(1); }, [orderKey]);

  /* bind to a table chosen on the floor */
  useEffect(() => {
    if (activeTable && tableState[activeTable]) setGuests(tableState[activeTable].guests || 2);
  }, [activeTable]);

  /* ---- catalog filtering ---- */
  const products = useMemo(() => menu.filter((p) => {
    const inCat = cat === 'all' || p.cat === cat;
    const inQ = !query || (p.name + ' ' + p.desc).toLowerCase().includes(query.toLowerCase());
    return inCat && inQ;
  }), [menu, cat, query]);
  const qtyFor = (id) => order.filter((o) => o.id === id).reduce((s, o) => s + o.qty, 0);

  /* ---- add / edit ---- */
  const addItem = (p) => {
    if (locked) return;
    /* work out the target line first — never set Register state inside the store updater */
    const ex = order.find((o) => o.id === p.id && !o.fired && (!flags.courses || o.course === activeCourse));
    const uid = ex ? ex.uid : 'r' + Date.now().toString(36) + (RUID++);
    setOrder((cur) => {
      const hit = ex && cur.find((o) => o.uid === ex.uid);
      if (hit) return cur.map((o) => o.uid === hit.uid ? { ...o, qty: o.qty + 1 } : o);
      return [...cur, { uid, id: p.id, name: p.name, price: p.price, priceOverride: null, qty: 1, discPct: 0, station: p.station, tags: p.tags || [], notes: '', unit: p.unit, img: p.img, icon: p.icon, tint: p.tint, course: activeCourse, fired: false }];
    });
    setSelectedUid(uid);
    setMode('qty'); setBuffer(null);
  };
  const selectLine = (uid) => { if (locked) return; setSelectedUid(uid); setBuffer(null); setEditing(true); setMode('qty'); };
  const stepQty = (uid, d) => setOrder((cur) => cur.flatMap((o) => o.uid !== uid ? [o] : (o.qty + d <= 0 ? [] : [{ ...o, qty: o.qty + d }])));
  const removeLine = (uid) => { setOrder((cur) => cur.filter((o) => o.uid !== uid)); if (selectedUid === uid) { setSelectedUid(null); setEditing(false); } };
  const changeMode = (m) => { setMode(m); setBuffer(null); };

  const onKey = (k) => {
    if (!selectedUid) return;
    const line = order.find((o) => o.uid === selectedUid);
    if (!line) return;
    if (line.fired && mode === 'qty') return; // fired qty only changes through Void
    const stored = mode === 'qty' ? qtyStr(line.qty) : mode === 'disc' ? String(line.discPct) : String(line.priceOverride != null ? line.priceOverride : line.price);
    let buf;
    if (k === 'back') buf = (buffer === null ? stored : buffer).slice(0, -1);
    else if (k === '+/-') { const b = buffer === null ? stored : buffer; buf = b.startsWith('-') ? b.slice(1) : '-' + b; }
    else if (k === '.') { const b = buffer === null ? '0' : buffer; buf = b.includes('.') ? b : b + '.'; }
    else buf = (buffer === null ? '' : buffer) + k;
    setBuffer(buf);
    const num = parseFloat(buf); const safe = isNaN(num) ? 0 : num;
    setOrder((cur) => cur.map((o) => {
      if (o.uid !== selectedUid) return o;
      if (mode === 'qty') return { ...o, qty: safe };
      if (mode === 'disc') return { ...o, discPct: Math.max(0, Math.min(100, safe)) };
      return { ...o, priceOverride: safe };
    }));
  };

  useEffect(() => {
    const h = (e) => {
      if (charging || splitting || noteFor || voidFor || moving || !editing || !selectedUid) return;
      if (/^[0-9]$/.test(e.key)) onKey(e.key);
      else if (e.key === '.') onKey('.');
      else if (e.key === 'Backspace') { e.preventDefault(); onKey('back'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  /* ---- totals ---- */
  const svcRate = flags.tables || flags.tabs ? (tweaks.serviceCharge ?? 0) : 0;
  const totals = useMemo(() => {
    const net = order.reduce((s, o) => { const u = o.priceOverride != null ? o.priceOverride : o.price; return s + u * o.qty * (1 - o.discPct / 100); }, 0);
    const svc = +(net * svcRate / 100).toFixed(2);
    const tax = Math.round((net + svc) * window.KZ_LOCALE.vat / 100);
    return { net, svc, tax, total: +(net + svc + tax).toFixed(2) };
  }, [order, svcRate]);
  const itemCount = order.reduce((s, o) => s + o.qty, 0);
  /* D6 — pre-bill: print the addition first; any change after printing needs a reprint before payment */
  const billOn = rules.preBill && ((flags.tables && activeTable) || flags.tabs) && order.length > 0;
  const bill = orderMeta.bill;
  const billState = !billOn ? 'off' : !bill ? 'none' : bill.sig === billSig(order) ? 'ok' : 'changed';
  const orderLabel = flags.tables ? (activeTable ? tableLabel(activeTable) : 'Walk-in') : flags.tabs ? tabName : 'Counter';
  const doPrintBill = () => printBill(orderKey, orderLabel, order, svcRate);
  const unfired = order.filter((o) => !o.fired && (!flags.kitchen || o.station !== 'bar'));

  /* ---- customer display (CFD plan D6): counter / tab orders live; a table's bill only at Print bill or Pay ---- */
  const cfdHub = useMemo(() => (window.cfdAttachFor ? window.cfdAttachFor('restaurant') : null), []);
  const [cfdLoyal, setCfdLoyal] = useState(null);
  useEffect(() => {
    if (!cfdHub) return;
    const set = window.KZ_CFD.settings('rk-R1'), en = set.lang === 'en';
    const isTable = flags.tables && !!activeTable;
    const show = !isTable || set.tableRule === 'always' || charging || billState === 'ok' || billState === 'changed';
    if (!show || !order.length) { cfdHub.setOrder(null); return; }
    const unitOf = (o) => (o.priceOverride != null ? o.priceOverride : o.price);
    const gross = order.reduce((s, o) => s + unitOf(o) * o.qty, 0);
    cfdHub.setOrder({
      no: orderNo, context: isTable ? 'Table ' + orderLabel : flags.tabs ? orderLabel : (en ? 'Counter' : 'Comptoir'),
      customer: cfdLoyal ? { first: en ? 'member' : 'client fidèle', points: cfdLoyal.points } : null, customerPhone: cfdLoyal ? cfdLoyal.phone : '',
      lines: order.map((o) => ({ id: o.uid, name: o.id === 'tip' ? (en ? 'Tip' : 'Pourboire') : o.name, qty: o.qty, unit: unitOf(o), amount: Math.round(unitOf(o) * o.qty * (1 - o.discPct / 100)),
        disc: o.discPct ? '−' + o.discPct + ' %' : '', img: o.img, icon: o.icon, tint: o.tint })),
      subtotal: Math.round(gross), discount: Math.round(gross - totals.net), svc: totals.svc, svcLabel: 'Service ' + svcRate + ' %',
      tax: totals.tax, taxLabel: 'TVA ' + String(window.KZ_LOCALE.vat).replace('.', ',') + ' %', total: totals.total, items: itemCount,
      lastId: selectedUid || order[order.length - 1].uid, pointsEarned: cfdLoyal ? Math.floor(totals.total / 1000) : 0,
    });
  }, [cfdHub, order, totals, activeTable, charging, billState, cfdLoyal, selectedUid, orderLabel]);
  const cfdAccept = (ev) => {
    if (ev.type === 'loyaltyPhone') setCfdLoyal({ phone: ev.value, points: 120 });
    if (ev.type === 'tip') setOrder((cur) => [...cur.filter((o) => o.id !== 'tip'), { uid: 'tip' + Date.now(), id: 'tip', name: 'Tip', price: ev.value, priceOverride: null, qty: 1, discPct: 0,
      station: 'none', tags: [], notes: '', fired: true, icon: 'heart-outline', tint: { bg: '#fdeef0', fg: '#d4607a' } }]);
  };

  /* ---- coursing ---- */
  const courseNums = useMemo(() => {
    const set = new Set(order.map((o) => o.course || 1));
    set.add(activeCourse);
    return [...set].sort((a, b) => a - b);
  }, [order, activeCourse]);
  const courseName = (n) => ['1st Course', '2nd Course', '3rd Course', '4th Course', '5th Course'][n - 1] || `Course ${n}`;

  const fire = (lines, extra) => {
    if (!lines.length) return;
    const ticketId = 'tk' + Date.now() + Math.random().toString(36).slice(2, 5);
    sendTicket({ id: ticketId, table: activeTable, floor: floorOf(activeTable), server: owner || me.name, guests, ...extra,
      items: lines.map((o) => ({ uid: o.uid, name: o.name, qty: o.qty, station: o.station, notes: o.notes, tags: o.tags })) });
    const uids = lines.map((o) => o.uid);
    setOrder((cur) => cur.map((o) => uids.includes(o.uid) ? { ...o, fired: true, ticketId } : o));
  };
  const fireCourse = (n) => fire(order.filter((o) => o.course === n && !o.fired && o.station !== 'bar'));
  const sendAll = () => {
    if (flags.tables && !activeTable) { setScreen('floor'); return; }
    if (!unfired.length) return;
    fire(unfired, { table: flags.tables ? activeTable : (flags.tabs ? tabName : null), guests: flags.guests ? guests : 2 });
  };

  /* payment closes the table; food still in the kitchen is asked about, never deleted */
  const finishOrder = (tender) => {
    setCharging(false);
    const tid = activeTable;
    recordSale({ total: totals.total, table: orderLabel, server: owner || me.name, method: tender || 'cash', items: itemCount });
    setOrder([]); setSelectedUid(null); setEditing(false); setActiveCourse(1); setCfdLoyal(null);
    setOrderNo((n) => window.KZ_TICKET.next(n));
    if (flags.tables && tid) {
      if (activeTicketsFor(tid).length) { setClearWarn(tid); return; }
      clearTable(tid);
    }
    setActiveTable(null);
  };
  const saveNote = (patch) => {
    const line = noteFor;
    setOrder((cur) => cur.map((o) => o.uid === line.uid ? { ...o, ...patch } : o));
    if (line.fired && line.ticketId && (patch.notes || '') !== (line.notes || '')) amendFired(line.ticketId, line.uid, patch.notes);
    setNoteFor(null);
  };

  const selLine = order.find((o) => o.uid === selectedUid);
  const cfgCats = verticalCfg.categories;

  return (
    <div className="screen">
      <div className="sbar">
        <span className="sbar__title">Register</span>
        <span className="sbar__sub" title={orderNo}>Order {window.KZ_TICKET.short(orderNo)}</span>
        <div className="sbar__right">
          <VerticalSwitch />
          <span className="sbar__sync"><ion-icon name="wifi-outline"></ion-icon>Synced</span>
          <StaffSwitch />
        </div>
      </div>

      {restored && (
        <div className="rk-restored"><ion-icon name="refresh-circle-outline"></ion-icon>Restored your open orders after reload.<button onClick={() => setRestored(false)}>OK</button></div>
      )}
      {locked && (
        <div className="rk-lock"><ion-icon name="lock-closed-outline"></ion-icon>
          <span><b>Table {tableLabel(activeTable)} is {owner}'s table.</b> You can view it. To change it, ask {owner} or a supervisor.</span>
          <button onClick={() => setTakeover(true)}>Take over</button>
        </div>
      )}
      <div className={'reg reg--' + mobilePane}>
        {/* phone-only pane switcher (hidden on tablet/desktop) */}
        <div className="reg__mobtabs">
          <button className={mobilePane === 'menu' ? 'active' : ''} onClick={() => setMobilePane('menu')}>
            <ion-icon name="restaurant-outline"></ion-icon>Menu
          </button>
          <button className={mobilePane === 'order' ? 'active' : ''} onClick={() => setMobilePane('order')}>
            <ion-icon name="receipt-outline"></ion-icon>Order{itemCount > 0 && <span className="ct">{itemCount}</span>}
          </button>
        </div>

        {/* LEFT — ORDER */}
        <div className="reg__order">
          <OrderContext vertical={vertical} flags={flags} activeTable={activeTable} tableState={tableState}
            guests={guests} setGuests={setGuests} tabName={tabName} setTabName={setTabName}
            onPickTable={() => setScreen('floor')}
            courseNums={courseNums} activeCourse={activeCourse} setActiveCourse={setActiveCourse}
            onAddCourse={() => setActiveCourse((c) => Math.min(5, Math.max(...courseNums) + 1))} courseName={courseName} />

          <OrderTicket order={order} flags={flags} selectedUid={selectedUid} buffer={buffer} mode={mode}
            unitWord={verticalCfg.unitWord} courseNums={courseNums} courseName={courseName}
            onSelect={selectLine} onStep={stepQty} onRemove={removeLine} onFire={fireCourse} onVoid={(l) => { if (!locked) setVoidFor(l); }} />

          {cfdHub && <div className="cfs-inrow"><CfdDot /></div>}
          <OrderTotals totals={totals} svcRate={svcRate} />
          {billState === 'changed' && (
            <div className="rk-bill chg"><ion-icon name="alert-circle-outline"></ion-icon><span><b>Bill changed</b> since it was printed. Reprint it before taking payment.</span></div>
          )}
          {billState === 'ok' && (
            <div className="rk-bill"><ion-icon name="receipt-outline"></ion-icon><span>Bill printed {window.KZ_LOCALE.fmtTime(new Date(bill.at))}{bill.n > 1 ? ' · copy ' + bill.n : ''}</span><button disabled={locked} onClick={doPrintBill}>Reprint</button></div>
          )}
          {flags.loyalty && order.length > 0 && (
            <div className="oloyal">
              <div className="oloyal__card"><div className="lbl">Points won</div><div className="val up">+{totals.total.toFixed(1)}</div></div>
              <div className="oloyal__card"><div className="lbl">New balance</div><div className="val tot">{(3203 + totals.total).toFixed(1)}</div></div>
            </div>
          )}

          <div className={'oactions' + (flags.tables ? ' five' : '')}>
            <button className="accent" disabled={!selLine || locked} onClick={() => setNoteFor(selLine)}><ion-icon name="chatbubble-ellipses-outline"></ion-icon>Note</button>
            <button disabled={order.length < 2 || locked} onClick={() => setSplitting(true)}><ion-icon name="git-branch-outline"></ion-icon>Split</button>
            <button disabled={!selLine || locked} onClick={() => { if (selLine) changeMode('disc'); }}><ion-icon name="pricetag-outline"></ion-icon>Discount</button>
            {flags.tables && <button disabled={!order.length || !activeTable || locked} onClick={() => setMoving(true)}><ion-icon name="swap-horizontal-outline"></ion-icon>Move</button>}
            <button disabled={locked} onClick={() => alert('Refund mode — scan or select items to return.')}><ion-icon name="arrow-undo-outline"></ion-icon>Refund</button>
          </div>

          <div className="ofoot">
            {flags.kitchen && (
              <button className="ofoot__send" disabled={locked || (!unfired.length && !(flags.tables && !activeTable))} onClick={sendAll}>
                <ion-icon name="send-outline"></ion-icon>{flags.tables && !activeTable ? 'Pick table' : 'Send'}
                {unfired.length > 0 && <span className="ct">{unfired.reduce((s, o) => s + o.qty, 0)}</span>}
              </button>
            )}
            {billState === 'none' || billState === 'changed' ? (
              <button className={'ofoot__pay ofoot__bill' + (billState === 'changed' ? ' chg' : '')} disabled={locked} onClick={doPrintBill}>
                <ion-icon name="print-outline"></ion-icon>{billState === 'changed' ? 'Reprint bill' : 'Print bill'}<span className="amt">{money(totals.total)}</span>
              </button>
            ) : (
              <button className="ofoot__pay" disabled={!order.length || locked} onClick={() => setCharging(true)}>
                <ion-icon name="card-outline"></ion-icon>Pay<span className="amt">{money(totals.total)}</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — CATALOG */}
        <div className="reg__catalog">
          <div className="cbar">
            <label className="csearch">
              <ion-icon name="search-outline"></ion-icon>
              <input placeholder={'Search ' + verticalCfg.label.toLowerCase() + ' menu'} value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <div className="cbar__view">
              <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><ion-icon name="grid-outline"></ion-icon></button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><ion-icon name="list-outline"></ion-icon></button>
            </div>
          </div>
          <div className="ccats">
            <button className={'cchip' + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}><ion-icon name="apps-outline"></ion-icon>All</button>
            {cfgCats.map((c) => (
              <button key={c.id} className={'cchip' + (cat === c.id ? ' active' : '')} onClick={() => setCat(c.id)}><ion-icon name={c.icon}></ion-icon>{c.label}</button>
            ))}
          </div>
          <div className="cscroll">
            <div className={'cgrid' + (view === 'list' ? ' list' : '')}>
              {products.map((p) => <ProductTile key={p.id} p={p} qty={qtyFor(p.id)} onAdd={addItem} unitWord={verticalCfg.unitWord} />)}
            </div>
          </div>

          {editing && selLine && (
            <EditDock line={selLine} mode={mode} onMode={changeMode} onKey={onKey} onClose={() => { setEditing(false); setSelectedUid(null); }} unitWord={verticalCfg.unitWord} />
          )}
        </div>
      </div>

      {cfdHub && <CfdSuggest onAccept={cfdAccept} describe={cfdDescribe(money)} />}
      {charging && <ChargeSheet total={totals.total} orderNo={orderNo} onDone={finishOrder} onClose={() => setCharging(false)} />}
      {splitting && <SplitSheet order={order} guests={guests} onClose={() => setSplitting(false)} />}
      {noteFor && <NoteSheet line={noteFor} onSave={saveNote} onClose={() => setNoteFor(null)} />}
      {voidFor && <VoidSheet line={voidFor} table={activeTable ? tableLabel(activeTable) : (flags.tabs ? tabName : 'Counter')}
        onDone={(qty) => { setOrder((cur) => cur.flatMap((o) => o.uid !== voidFor.uid ? [o] : (o.qty - qty <= 0 ? [] : [{ ...o, qty: o.qty - qty }]))); setVoidFor(null); setSelectedUid(null); setEditing(false); }}
        onClose={() => setVoidFor(null)} />}
      {moving && <MoveLinesSheet from={activeTable} lines={order} onClose={() => setMoving(false)} />}
      {takeover && <TakeoverSheet tableId={activeTable} owner={owner} onClose={() => setTakeover(false)} />}
      {clearWarn && <ClearWarnSheet tableId={clearWarn} onClose={() => { setClearWarn(null); setActiveTable(null); }} />}
    </div>
  );
}

Object.assign(window, { Register });
