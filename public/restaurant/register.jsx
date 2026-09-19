/* ============================================================
   Koomzo POS Suite — REGISTER (configurable per vertical)
   ============================================================ */
let RUID = 1;

function Register() {
  const S = useSuite();
  const { vertical, verticalCfg, menu, tweaks, sendTicket, activeTable, setActiveTable, tableState, setScreen, clearTable } = S;
  const flags = verticalCfg.flags;

  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('grid');
  const [order, setOrder] = useState([]);
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

  /* reset coursing when vertical changes; clear order */
  useEffect(() => { setOrder([]); setSelectedUid(null); setEditing(false); setActiveCourse(1); }, [vertical]);

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
    setOrder((cur) => {
      const ex = cur.find((o) => o.id === p.id && !o.fired && (!flags.courses || o.course === activeCourse));
      if (ex) { setSelectedUid(ex.uid); return cur.map((o) => o === ex ? { ...o, qty: o.qty + 1 } : o); }
      const uid = 'r' + (RUID++);
      setSelectedUid(uid);
      return [...cur, { uid, id: p.id, name: p.name, price: p.price, priceOverride: null, qty: 1, discPct: 0, station: p.station, tags: p.tags || [], notes: '', unit: p.unit, icon: p.icon, tint: p.tint, course: activeCourse, fired: false }];
    });
    setMode('qty'); setBuffer(null);
  };
  const selectLine = (uid) => { setSelectedUid(uid); setBuffer(null); setEditing(true); setMode('qty'); };
  const stepQty = (uid, d) => setOrder((cur) => cur.flatMap((o) => o.uid !== uid ? [o] : (o.qty + d <= 0 ? [] : [{ ...o, qty: o.qty + d }])));
  const removeLine = (uid) => { setOrder((cur) => cur.filter((o) => o.uid !== uid)); if (selectedUid === uid) { setSelectedUid(null); setEditing(false); } };
  const changeMode = (m) => { setMode(m); setBuffer(null); };

  const onKey = (k) => {
    if (!selectedUid) return;
    const line = order.find((o) => o.uid === selectedUid);
    if (!line) return;
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
      if (charging || splitting || noteFor || !editing || !selectedUid) return;
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
  const unfired = order.filter((o) => !o.fired && (!flags.kitchen || o.station !== 'bar'));

  /* ---- coursing ---- */
  const courseNums = useMemo(() => {
    const set = new Set(order.map((o) => o.course || 1));
    set.add(activeCourse);
    return [...set].sort((a, b) => a - b);
  }, [order, activeCourse]);
  const courseName = (n) => ['1st Course', '2nd Course', '3rd Course', '4th Course', '5th Course'][n - 1] || `Course ${n}`;

  const fireCourse = (n) => {
    const toFire = order.filter((o) => o.course === n && !o.fired && o.station !== 'bar');
    if (!toFire.length) return;
    const no = sendTicket({ table: activeTable, floor: floorOf(activeTable), server: 'Anita O.', guests, items: toFire.map((o) => ({ name: o.name, qty: o.qty, station: o.station, notes: o.notes, tags: o.tags })) });
    setOrder((cur) => cur.map((o) => o.course === n && o.station !== 'bar' ? { ...o, fired: true } : o));
  };
  const sendAll = () => {
    if (flags.tables && !activeTable) { setScreen('floor'); return; }
    if (!unfired.length) return;
    sendTicket({ table: flags.tables ? activeTable : (flags.tabs ? tabName : null), floor: floorOf(activeTable), server: 'Anita O.', guests: flags.guests ? guests : 2, items: unfired.map((o) => ({ name: o.name, qty: o.qty, station: o.station, notes: o.notes, tags: o.tags })) });
    setOrder((cur) => cur.map((o) => (o.station !== 'bar' ? { ...o, fired: true } : o)));
  };

  const finishOrder = () => {
    setCharging(false);
    if (flags.tables && activeTable) clearTable(activeTable);
    setOrder([]); setSelectedUid(null); setEditing(false); setActiveCourse(1); setActiveTable(null);
    setOrderNo((n) => window.KZ_TICKET.next(n));
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
          <div className="avatar"><ion-icon name="person"></ion-icon></div>
        </div>
      </div>

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
            onSelect={selectLine} onStep={stepQty} onRemove={removeLine} onFire={fireCourse} />

          <OrderTotals totals={totals} svcRate={svcRate} />
          {flags.loyalty && order.length > 0 && (
            <div className="oloyal">
              <div className="oloyal__card"><div className="lbl">Points won</div><div className="val up">+{totals.total.toFixed(1)}</div></div>
              <div className="oloyal__card"><div className="lbl">New balance</div><div className="val tot">{(3203 + totals.total).toFixed(1)}</div></div>
            </div>
          )}

          <div className="oactions">
            <button className="accent" disabled={!selLine} onClick={() => setNoteFor(selLine)}><ion-icon name="chatbubble-ellipses-outline"></ion-icon>Note</button>
            <button disabled={order.length < 2} onClick={() => setSplitting(true)}><ion-icon name="git-branch-outline"></ion-icon>Split</button>
            <button disabled={!selLine} onClick={() => { if (selLine) changeMode('disc'); }}><ion-icon name="pricetag-outline"></ion-icon>Discount</button>
            <button onClick={() => alert('Refund mode — scan or select items to return.')}><ion-icon name="arrow-undo-outline"></ion-icon>Refund</button>
          </div>

          <div className="ofoot">
            {flags.kitchen && (
              <button className="ofoot__send" disabled={!unfired.length && !(flags.tables && !activeTable)} onClick={sendAll}>
                <ion-icon name="send-outline"></ion-icon>{flags.tables && !activeTable ? 'Pick table' : 'Send'}
                {unfired.length > 0 && <span className="ct">{unfired.reduce((s, o) => s + o.qty, 0)}</span>}
              </button>
            )}
            <button className="ofoot__pay" disabled={!order.length} onClick={() => setCharging(true)}>
              <ion-icon name="card-outline"></ion-icon>Pay<span className="amt">{money(totals.total)}</span>
            </button>
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

      {charging && <ChargeSheet total={totals.total} orderNo={orderNo} onDone={finishOrder} onClose={() => setCharging(false)} />}
      {splitting && <SplitSheet order={order} guests={guests} onClose={() => setSplitting(false)} />}
      {noteFor && <NoteSheet line={noteFor} onSave={(patch) => { setOrder((cur) => cur.map((o) => o.uid === noteFor.uid ? { ...o, ...patch } : o)); setNoteFor(null); }} onClose={() => setNoteFor(null)} />}
    </div>
  );
}

function floorOf(tableId) {
  if (!tableId) return 'main';
  const f = window.RK_FLOORS.find((fl) => fl.tables.some((t) => t.id === tableId));
  return f ? f.id : 'main';
}
function tableLabel(tableId) {
  for (const f of window.RK_FLOORS) { const t = f.tables.find((x) => x.id === tableId); if (t) return t.label; }
  return tableId;
}

Object.assign(window, { Register, floorOf, tableLabel });
