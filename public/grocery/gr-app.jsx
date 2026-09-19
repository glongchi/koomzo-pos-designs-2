/* Koomzo Grocery — app shell. The Retail register with grocery behaviours; the
   capability service decides which of them this shop ever meets. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "user": "u2",
  "device": "desktop",
  "start": "till"
}/*EDITMODE-END*/;

const GR_CAP = { dates:'expiry', labels:'shelflabels', gaps:'gaps', promos:'promos' };

function GroceryApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState(t.start);
  const [lines, setLines] = useState([]);
  /* the shop's shelf, adopted into the one ledger */
  useEffect(() => { window.KZ_SALES.adopt('grocery', 'dt', GR.items); }, []);
  /* composed at the till: LOC-REG-SESSION-SEQ, immutable once issued (spec 21.4) */
  const [ticketNo, setTicketNo] = useState(() => window.KZ_TICKET.compose({ loc: 'DLA1', reg: 'G1', seq: 4471 }));
  const [member, setMember] = useState(null);
  const [dated, setDated] = useState(GR.dated);
  const [waste, setWaste] = useState(GR.waste);
  const [labels, setLabels] = useState(GR.labels);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [held, setHeld] = useState(0);
  const [, bump] = useState(0);
  const me = grUser(t.user);
  let UID = 1;

  useEffect(() => { setView(t.start); }, [t.start]);
  useEffect(() => { if (window.KZ) return window.KZ.subscribe(() => bump((n) => n + 1)); }, []);
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(null), 2600); return () => clearTimeout(i); }, [toast]);
  useEffect(() => {
    const need = GR_CAP[view];
    if (need && !gate(need)) setView('till');
  }, [view, gate('expiry'), gate('shelflabels'), gate('gaps'), gate('promos')]);

  const say = (m) => setToast(m);
  const push = (l) => setLines((c) => [...c, { uid: 'l' + Date.now() + (UID++), qty: 1, ...l }]);

  const addPriced = (it) => {
    const price = priceOf(it, dated);
    /* find-or-append inside ONE updater: a scanner fires several events in a tick and
       must land as qty 3 on one line, never three lines. */
    setLines((c) => {
      const ex = c.find((l) => l.ref === it.id && !l.dep && !l.weight);
      const next = ex ? c.map((l) => l.uid === ex.uid ? { ...l, qty: l.qty + 1 } : l)
        : [...c, { uid: 'l' + Date.now() + (UID++), qty: 1, ref: it.id, name: it.name, price,
            markdown: price < it.price, age: gate('age') ? it.age : null }];
      if (!it.deposit || !gate('deposits')) return next;
      const d = next.find((l) => l.dep && l.ref === it.id);
      return d ? next.map((l) => l.uid === d.uid ? { ...l, qty: l.qty + 1 } : l)
        : [...next, { uid: 'd' + Date.now() + (UID++), qty: 1, ref: it.id, name: it.name + ' · crate deposit', price: it.deposit, dep: true }];
    });
  };

  const totals = useMemo(() => {
    const goods = lines.filter((l) => !l.dep).reduce((s, l) => s + l.price * l.qty, 0);
    const deposits = lines.filter((l) => l.dep).reduce((s, l) => s + l.price * l.qty, 0);
    const p = promoSavings(lines);
    const staff = member && member.staff && gate('loyalty') ? Math.round((goods - p.total) * 0.1) : 0;
    const net = goods - p.total - staff;
    return { goods, deposits, promo: p.total, promoNotes: p.notes, staff,
      vat: Math.round(net - net / (1 + GR.vat)), total: net + deposits };
  }, [lines, member, dated]);

  const api = {
    me, userId: t.user, lines, ticketNo, member, totals, dated, waste, labels, toast: say, setView,
    add: (it) => {
      if (it.sold === 'weight' && gate('weigh')) return setSheet({ k:'scale', it });
      if (it.age && gate('age')) return setSheet({ k:'age', it });
      addPriced(it);
    },
    addWeighed: (it, g) => {
      push({ ref: it.id, name: it.name, price: Math.round((g / 1000) * it.perKg), weight: g, perKg: it.perKg });
      say(kg(g) + ' kg ' + it.name.toLowerCase() + ' weighed');
    },
    ageResult: (it, ok) => {
      if (!ok) { say(it.age + '+ sale refused · recorded against ' + me.first); return; }
      addPriced(it);
      say(it.age + '+ check passed · kept with the basket');
    },
    qty: (uid, d) => setLines((c) => c.flatMap((l) => l.uid !== uid ? [l] : (l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }]))),
    clear: () => { setLines([]); setMember(null); say('Basket cleared'); },
    hold: () => { if (!lines.length) return; setHeld((h) => h + 1); setLines([]); setMember(null); say('Basket held'); },
    setMember: (m) => { setMember(m); if (m) say(m.name + ' attached' + (m.staff ? ' · staff discount applies' : '')); },
    refundDeposit: (n) => { push({ ref:'crate', name: n + ' crates returned', price: -200 * n, dep: true }); say(xaf(n * 200) + ' deposit refunded'); },
    finish: () => { setLines([]); setMember(null); setTicketNo((n) => window.KZ_TICKET.next(n)); },
    openPlu: () => setSheet({ k:'plu' }),
    openMember: () => setSheet({ k:'member' }),
    openCrates: () => setSheet({ k:'crate' }),
    openTender: () => setSheet({ k:'tender' }),
    markdown: (l) => {
      const it = itemOf(l.item);
      const to = Math.round((it.price || it.perKg) * 0.5 / 50) * 50;
      setDated((c) => c.map((x) => x.id === l.id ? { ...x, markdown: to } : x));
      setLabels((c) => [{ item: l.item, from: it.price || it.perKg, to, reason:'markdown', at:'Just now' }, ...c]);
      say(it.name + ' reduced to ' + xaf(to) + ' · label queued');
    },
    writeOff: (l) => {
      const it = itemOf(l.item);
      setDated((c) => c.filter((x) => x.id !== l.id));
      setWaste((c) => [{ id:'w' + Date.now(), item: l.item, qty: String(l.qty), reason: l.days <= 0 ? 'expired' : 'spoiled',
        cost: Math.round((it.price || it.perKg) * 0.62 * l.qty), at:'Just now', by: me.id }, ...c]);
      say(l.qty + ' × ' + it.name + ' written off · stock movement posted');
    },
    printLabels: (sel) => { setLabels((c) => c.filter((l) => sel.indexOf(l.item) === -1)); say(sel.length + ' labels printed · shelf and till agree'); },
    sendOrder: (n, v) => say(n + ' lines sent · ' + xaf(v) + ' · now a purchase order in Inventory'),
  };

  const rail = [
    ['till', 'cart-outline', 'Till', true],
    ['dates', 'time-outline', 'Dates', gate('expiry')],
    ['labels', 'pricetag-outline', 'Labels', gate('shelflabels')],
    ['gaps', 'basket-outline', 'Gaps', gate('gaps')],
    ['promos', 'pricetags-outline', 'Offers', gate('promos')],
  ].filter((x) => x[3]);
  const badges = {
    dates: dated.filter((l) => l.days <= 2).length,
    labels: labels.length,
    gaps: GR.gaps.filter((g) => g.onHand < g.par).length,
  };
  const titles = {
    till: [GR.shop, GR.today + ' · ' + me.name + ' · ' + me.role],
    dates: [GR.shop, 'Dates · short-dated stock and waste'],
    labels: [GR.shop, 'Shelf labels · ' + labels.length + ' waiting'],
    gaps: [GR.shop, 'Shelf gaps · walked this morning'],
    promos: [GR.shop, 'Offers · live and scheduled'],
    settings: [GR.shop, 'Setup · what this shop sees'],
  };

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap">
        <div className="rt">
          <nav className="rail">
            <div className="rail__mark" style={{ background:'#b4791c' }}><ion-icon name="basket-outline"></ion-icon></div>
            {rail.map(([id, ic, label]) => (
              <button key={id} className={view === id ? 'on' : ''} onClick={() => setView(id)}>
                <ion-icon name={ic}></ion-icon><span>{label}</span>
                {badges[id] > 0 && <em className="dot">{badgeN(badges[id])}</em>}
              </button>
            ))}
            <div className="rail__sp"></div>
            <button className={view === 'settings' ? 'on' : ''} onClick={() => setView('settings')}>
              <ion-icon name="options-outline"></ion-icon><span>Setup</span>
            </button>
          </nav>

          <div className="main">
            <header className="top">
              <div className="top__title">{titles[view][0]}<small>{titles[view][1]}</small></div>
              <div className="top__sp"></div>
              <button className="profchip" onClick={() => setView('settings')}>
                <ion-icon name={me.role === 'Owner' ? 'shield-checkmark-outline' : 'person-outline'}></ion-icon>
                <span className="pname">{me.role} · {me.first}</span>
              </button>
              <div className="top__meta"><span className="ok"><ion-icon name="ellipse" style={{ fontSize: 9 }}></ion-icon>Open · 7–21</span></div>
              <div className="avatar">{me.init}</div>
            </header>

            {view === 'till' && <TillView api={api} />}
            {view === 'dates' && <DatesView api={api} />}
            {view === 'labels' && <LabelsView api={api} />}
            {view === 'gaps' && <GapsView api={api} />}
            {view === 'promos' && <PromosView api={api} />}
            {view === 'settings' && (
              <div className="view">
                <div className="view__head">
                  <div><h2>Setup</h2><p>{GR.shop} · grocery behaviours on the Retail register</p></div>
                  <div className="sp"></div>
                  <a className="btn" href="Koomzo - Control Centre.html"><ion-icon name="options-outline"></ion-icon>Control Centre</a>
                </div>
                <div className="note info" style={{ marginBottom: 12 }}><ion-icon name="information-circle-outline"></ion-icon>
                  Grocery adds behaviours to the Retail register rather than a second till. Turn them all off and this shop is plain retail.</div>
                <ModuleSetup mid="grocery" embedded />
              </div>
            )}
          </div>

          {sheet && sheet.k === 'scale' && <ScaleSheet it={sheet.it} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'plu' && <PluSheet api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'age' && <AgeSheet it={sheet.it} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'member' && <MemberSheet api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'crate' && <CrateSheet api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'tender' && <GrTenderSheet api={api} onClose={() => setSheet(null)} />}
          {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}

          <TweaksPanel>
            <TweakSection label="Who is on the till" />
            <TweakSelect label="Signed in as" value={t.user}
              options={GR.staff.map((s) => ({ value: s.id, label: s.name + ' · ' + s.role }))}
              onChange={(v) => setTweak('user', v)} />
            <TweakSelect label="Landing screen" value={t.start}
              options={[{ value:'till', label:'Till' }, { value:'dates', label:'Dates' }, { value:'labels', label:'Labels' },
                { value:'gaps', label:'Shelf gaps' }, { value:'promos', label:'Offers' }, { value:'settings', label:'Setup' }]}
              onChange={(v) => setTweak('start', v)} />
            <TweakSection label="Preview" />
            <TweakRadio label="Device" value={t.device}
              options={[{ value:'desktop', label:'Desktop' }, { value:'tablet', label:'Tablet' }, { value:'phone', label:'Phone' }]}
              onChange={(v) => setTweak('device', v)} />
          </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<GroceryApp />);
