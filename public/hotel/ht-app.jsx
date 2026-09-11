/* Koomzo Hotel — app shell. One state owner; the capability service decides what exists. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "property": "lodge",
  "user": "u1",
  "device": "desktop",
  "start": "rack"
}/*EDITMODE-END*/;

const CAP_FOR = { book:'bookings', house:'housekeeping', folio:'folio', guests:'guests',
  stays: 'longstay', rates:'rates', audit:'nightaudit', perf:'occupancy', team:'roster', prearr:'prearrival' };

function HotelCapGate({ view, onView }) {
  useEffect(() => {
    if (!window.KZ) return;
    const need = CAP_FOR[view];
    const bad = () => need && !window.KZ.on('hotel', need);
    if (bad()) onView('rack');
    return window.KZ.subscribe(() => { if (bad()) onView('rack'); });
  }, [view]);
  return null;
}

function HotelApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState(t.start);
  const [stays, setStays] = useState(HT.stays);
  const [folio, setFolio] = useState(HT.folio);
  const [house, setHouse] = useState(HT.house);
  const [maint, setMaint] = useState(HT.maint);
  const [team, setTeam] = useState(HT.staff);
  const [prearr, setPrearr] = useState(HT.prearr);
  const [published, setPublished] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [folioFocus, setFolioFocus] = useState(null);
  const [, bump] = useState(0);
  const me = userOf(t.user);

  /* property shape: a 40-room hotel, a block of apartments, or a lodge that is both.
     Derived, not mutated in an effect — HT.rooms stays the read path for the views. */
  const rooms = useMemo(() => {
    if (!HT.all) HT.all = HT.rooms.slice();
    const list = HT.all.filter((r) => t.property === 'lodge' ? true : t.property === 'apts' ? r.wing === 'Annex' : r.wing === 'Main');
    HT.rooms = list;
    return list;
  }, [t.property]);
  useEffect(() => { setView(t.start); }, [t.start]);
  useEffect(() => { if (window.KZ) return window.KZ.subscribe(() => bump((n) => n + 1)); }, []);
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(null), 2800); return () => clearTimeout(i); }, [toast]);

  const has = (no) => rooms.some((r) => r.no === no);
  const st = useMemo(() => ({
    stays: stays.filter((s) => has(s.no)),
    folio, house: house.filter((h) => has(h.no)), maint: maint.filter((m) => has(m.no)),
    prearr,
  }), [stays, folio, house, maint, rooms, prearr]);

  const now = () => HT.dayNo + ' ' + HT.month + ' ' + new Date().toTimeString().slice(0, 5);
  const say = (m) => setToast(m);
  const addLine = (id, line) => setFolio((c) => ({ ...c, [id]: [...(c[id] || []), { at: now(), ...line }] }));

  /* the folio bridge: publish what may be charged, take what other modules posted */
  const chargeable = st.stays.filter((s) => s.status === 'inhouse' || s.status === 'due');
  useEffect(() => {
    if (!window.KZFolio) return;
    KZFolio.publish(window.KZ && KZ.on('hotel', 'fnb')
      ? chargeable.map((s) => ({ stayId: s.id, no: s.no, guest: s.guest, plan: s.plan })) : []);
  }, [stays, t.property]);
  useEffect(() => {
    if (!window.KZFolio) return;
    const take = () => {
      const q = KZFolio.drain();
      if (!q.length) return;
      setFolio((c) => {
        const next = { ...c };
        q.forEach((l) => { next[l.stayId] = [...(next[l.stayId] || []), { at: now(), kind: l.kind, desc: l.desc, amount: l.amount, src: l.src }]; });
        return next;
      });
      const last = q[q.length - 1];
      say(q.length === 1 ? xaf(last.amount) + ' posted to ' + last.no + ' from ' + last.src
        : q.length + ' charges posted from ' + last.src);
    };
    take();
    const un = KZFolio.subscribe(take);
    const i = setInterval(take, 2500);
    return () => { un(); clearInterval(i); };
  }, []);
  const setHk = (no, patch) => setHouse((c) => c.some((h) => h.no === no)
    ? c.map((h) => h.no === no ? { ...h, ...patch } : h)
    : [...c, { no, state:'clean', to:null, pri:'stay', linen:false, note:'', ...patch }]);

  const api = {
    st, me, view, setView, folioFocus, toast: say,
    team, published,
    /* the roster is one value per person per day — a write is a cell, not a form */
    setShift: (uid, day, code) => {
      setTeam((c) => c.map((s) => s.id === uid ? { ...s, roster: s.roster.map((x, i) => i === day ? code : x) } : s));
      setPublished(false);
    },
    setWeek: (uid, codes) => { setTeam((c) => c.map((s) => s.id === uid ? { ...s, roster: codes } : s)); setPublished(false); },
    addStaff: (d) => {
      const init = d.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
      setTeam((c) => [...c, { id:'u' + (c.length + 1), name:d.name, first:d.name.split(' ')[0], role:d.role,
        init, tone:'t' + (1 + c.length % 5), pin:'0000', access:{ setup:false, audit:false, rates:false },
        dept:d.dept, phone:d.phone, area:d.area, roster:d.roster, clock:null }]);
      setPublished(false);
      say(d.name + ' added to the roster');
    },
    publishWeek: () => { setPublished(true); say('Roster published · team notified'); },
    /* pre-arrival: state moves forward only, and verify never writes the register
       itself — check-in does, so the book and the rack agree by construction. */
    paSend: (stayId) => setPrearr((c) => {
      const has = c.some((p) => p.stayId === stayId);
      const row = { stayId, state:'sent', sentAt:'now', doneAt:null, via:'whatsapp', eta:null };
      return has ? c.map((p) => p.stayId === stayId ? { ...p, ...row } : p) : [...c, row];
    }),
    paSendAll: () => setPrearr((c) => {
      const pending = st.stays.filter((s) => (s.status === 'arr' || s.status === 'booked') &&
        !c.some((p) => p.stayId === s.id && p.state !== 'not_sent'));
      const rows = pending.map((s) => ({ stayId:s.id, state:'sent', sentAt:'now', doneAt:null, via:'whatsapp', eta:null }));
      return [...c.filter((p) => !rows.some((r) => r.stayId === p.stayId)), ...rows];
    }),
    paVerify: (stayId) => setPrearr((c) => c.map((p) => p.stayId === stayId ? { ...p, state:'verified', verifiedBy:me.id, flag:null } : p)),
    paReject: (stayId) => setPrearr((c) => c.map((p) => p.stayId === stayId ? { ...p, state:'sent', doneAt:null, flag:null } : p)),
    openPa: (stayId) => setSheet({ k:'pa', stayId }),

    openStaff: (uid) => setSheet({ k:'staff', uid }),
    openRoom: (no) => setSheet({ k:'room', no }),
    openBook: (seed) => setSheet({ k:'book', seed: seed || {} }),
    openPost: (id) => setSheet({ k:'post', id }),
    openSettle: (id) => setSheet({ k:'settle', id }),
    openFault: (no) => setSheet({ k:'fault', no }),
    openAssign: (no) => setSheet({ k:'assign', no }),
    openFolio: (id) => { setFolioFocus(id); setView('folio'); },

    book: (d) => {
      const id = 'n' + Date.now();
      const g = { id:'g' + Date.now(), name:d.name, phone:d.phone, idType:d.idNo ? 'CNI' : '', idNo:d.idNo || '',
        country:'Cameroon', stays:1, nights:0, notes:'' };
      HT.guests.push(g);
      setStays((c) => [...c, { id, no:d.no, gid:g.id, guest:d.name, from:d.day, nights:d.nights,
        status: d.day === 0 ? 'inhouse' : 'booked', rate:d.rate, plan:d.plan, source:d.src, adults:1, deposit:d.dep }]);
      if (window.KZ && KZ.on('hotel', 'folio')) {
        const lines = [{ at: now(), kind:'room', desc:'Room ' + d.no + ' · ' + typeOf(roomOf(d.no).type).name, amount:d.rate, src:'Reception' }];
        if (d.dep) lines.push({ at: now(), kind:'payment', desc:'Security deposit taken', amount:-d.dep, src:'Reception' });
        setFolio((c) => ({ ...c, [id]: lines }));
      }
      say(d.name + (d.day === 0 ? ' checked into ' + d.no : ' booked into ' + d.no + ' for ' + (HT.dayNo + d.day) + ' ' + HT.month));
    },
    checkIn: (id) => {
      setStays((c) => c.map((s) => s.id === id ? { ...s, status:'inhouse' } : s));
      const s = stays.find((x) => x.id === id);
      say(s.guest + ' checked into ' + s.no + ' · key issued');
    },
    checkOut: (id) => {
      const s = stays.find((x) => x.id === id);
      setStays((c) => c.map((x) => x.id === id ? { ...x, status:'out' } : x));
      setHk(s.no, { state:'dirty', pri:'depart', linen:true, note:'Departed ' + now().slice(-5) });
      say(s.no + ' checked out · on the cleaning list');
    },
    settle: (id, d) => {
      const s = stays.find((x) => x.id === id);
      addLine(id, { kind:'payment', desc:'Settlement · ' + HT.tenders.find((x) => x.id === d.tender).name, amount:-d.amount, src:'Reception' });
      if (d.deduct) addLine(id, { kind:'other', desc:'Damage withheld from deposit', amount:d.deduct, src:'Reception' });
      setStays((c) => c.map((x) => x.id === id ? { ...x, status:'out' } : x));
      setHk(s.no, { state:'dirty', pri:'depart', linen:true, note:'Departed ' + now().slice(-5) });
    },
    post: (id, line) => { addLine(id, line); const s = stays.find((x) => x.id === id); say(xaf(line.amount) + ' posted to ' + s.no); },

    hkSet: (no, state, pri) => {
      setHk(no, { state, ...(pri ? { pri } : {}), ...(state === 'clean' ? { linen:false, note:'' } : {}) });
      say('Room ' + no + ' · ' + (state === 'clean' ? 'ready to sell' : state === 'cleaning' ? 'being cleaned' : state === 'inspect' ? 'awaiting inspection' : 'on the cleaning list'));
    },
    hkAssign: (no, to, patch) => {
      setHk(no, { to, ...(patch || {}) });
      say(no + ' assigned to ' + userOf(to).first);
    },
    toggleOoo: (no) => {
      const ex = maint.find((m) => m.no === no && m.state !== 'fixed');
      if (ex) { setMaint((c) => c.map((m) => m.id === ex.id ? { ...m, ooo: !m.ooo, state: !m.ooo ? 'ooo' : 'open' } : m)); say(no + (ex.ooo ? ' back on sale' : ' taken off sale')); return; }
      setMaint((c) => [...c, { id:'m' + Date.now(), no, issue:'Off sale by reception', since: HT.dayNo + ' ' + HT.month, state:'ooo', to:'u5', ooo:true }]);
      say(no + ' taken off sale');
    },
    addFault: (no, issue, to, ooo) => {
      setMaint((c) => [...c, { id:'m' + Date.now(), no, issue, since: HT.dayNo + ' ' + HT.month, state: ooo ? 'ooo' : 'open', to, ooo }]);
      say('Fault logged for ' + no + ' · ' + userOf(to).first + ' notified');
    },
    fixFault: (id) => { setMaint((c) => c.map((m) => m.id === id ? { ...m, state:'fixed', ooo:false } : m)); say('Fault closed'); },
    billMeter: (m) => {
      const s = stays.find((x) => x.no === m.no && x.status === 'inhouse');
      if (!s) { say('No tenant in ' + m.no); return; }
      addLine(s.id, { kind:'other', desc:m.kind + ' · ' + (m.last - m.prev) + ' ' + m.unit, amount:(m.last - m.prev) * m.price, src:'Long stay' });
      say((m.last - m.prev) + ' ' + m.unit + ' billed to ' + m.no);
    },
    runAudit: (total, n) => {
      const inhouse = st.stays.filter((s) => s.status === 'inhouse' || s.status === 'due');
      setFolio((c) => {
        const next = { ...c };
        inhouse.forEach((s) => {
          const lines = [...(next[s.id] || [])];
          if (s.plan === 'nightly') lines.push({ at: now(), kind:'room', desc:'Room ' + s.no + ' · ' + typeOf(roomOf(s.no).type).name, amount:s.rate, src:'Night audit' });
          if (window.KZ && KZ.on('hotel', 'register')) lines.push({ at: now(), kind:'levy', desc:'Tourist levy · ' + s.adults + ' guest × 1 night', amount:s.adults * HT.levy, src:'Night audit' });
          next[s.id] = lines;
        });
        return next;
      });
      say('Night posted · ' + xaf(total) + ' across ' + n + ' folios · day closed');
    },
  };

  const dirty = st.house.filter((h) => h.state !== 'clean').length;
  const soldNow = st.stays.filter((s) => ['inhouse', 'due'].indexOf(s.status) > -1).length;
  /* what the rail badges count: work waiting on a person today, nothing else */
  const badges = {
    house: /Housekeeping/.test(me.role) ? st.house.filter((h) => h.to === me.id && h.state !== 'clean').length
      : /Maintenance/.test(me.role) ? st.maint.filter((m) => m.state !== 'fixed').length : dirty,
    book: st.stays.filter((s) => s.status === 'arr').length,
    folio: st.stays.filter((s) => s.status === 'due' && folioSum(st.folio[s.id] || []).balance > 0).length,
    audit: st.stays.filter((s) => s.status === 'arr' || s.status === 'due').length
      + st.stays.filter((s) => { const g = guestOf(s.gid); return (s.status === 'inhouse' || s.status === 'due') && g && !g.idNo; }).length,
  };
  const occPc = Math.round((soldNow / Math.max(1, HT.rooms.length)) * 100);
  const propName = t.property === 'apts' ? 'Bilongue Apartments' : t.property === 'hotel' ? 'Bilongue Suites' : 'Bilongue Suites & Lodge';
  const titles = {
    rack: [propName, HT.today + ' · ' + HT.city],
    book: [propName, 'Bookings · ' + st.stays.filter((s) => s.status === 'booked').length + ' ahead'],
    house: [propName, (/Maintenance/.test(me.role) ? 'Faults · ' : 'Housekeeping · ') + dirty + ' rooms to turn round'],
    folio: [propName, 'Folios · charges on the room'],
    guests: [propName, 'Guests · ' + HT.guests.length + ' on file'],
    stays: [propName, 'Long stay · apartments and tenancies'],
    rates: [propName, 'Rates · by room type and plan'],
    audit: [propName, 'Night audit · ' + HT.today],
    perf: [propName, 'Reports · occupancy, ADR, RevPAR'],
    team: [propName, 'Team · week ' + HT.week[0][1] + '–' + HT.week[6][1] + ' ' + HT.month + (published ? '' : ' · unpublished changes')],
    prearr: [propName, 'Pre-arrival · registration cards before the desk'],
    settings: [propName, 'Setup · what this property sees'],
  };

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap">
        <div className="rt" ref={null}>
          <HotelCapGate view={view} onView={setView} />
          <HtRail view={view} onView={setView} badges={badges} me={me} />
          <div className="main">
            <HtTop title={titles[view][0]} sub={titles[view][1]} me={me} occ={occPc} onMe={() => setView('settings')} />
            {view === 'rack' && <RackView api={api} />}
            {view === 'book' && <BookingsView api={api} />}
            {view === 'house' && <HouseView api={api} />}
            {view === 'folio' && <FolioView api={api} />}
            {view === 'guests' && <GuestsView api={api} />}
            {view === 'stays' && <LongStayView api={api} />}
            {view === 'rates' && <RatesView api={api} />}
            {view === 'audit' && <AuditView api={api} />}
            {view === 'perf' && <PerfView api={api} />}
            {view === 'team' && <TeamView api={api} />}
            {view === 'prearr' && <PreArrivalView api={api} />}
            {view === 'settings' && (
              <div className="view">
                <div className="view__head">
                  <div><h2>Setup</h2><p>{propName} · {HT.rooms.length} sellable units · the same panel every module uses</p></div>
                  <div className="sp"></div>
                  <a className="btn" href="Koomzo - Control Centre.html"><ion-icon name="options-outline"></ion-icon>Control Centre</a>
                </div>
                <ModuleSetup mid="hotel" embedded />
              </div>
            )}
          </div>

          {sheet && sheet.k === 'room' && <RoomSheet no={sheet.no} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'book' && <BookSheet seed={sheet.seed} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'post' && <PostSheet stayId={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'settle' && <SettleSheet stayId={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'fault' && <FaultSheet no={sheet.no} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'assign' && <AssignSheet no={sheet.no} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'shift' && <ShiftSheet uid={sheet.uid} day={sheet.day} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'pa' && <PaSheet stayId={sheet.stayId} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'staff' && <StaffSheet uid={sheet.uid} api={api} onClose={() => setSheet(null)} />}
          {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}

          <TweaksPanel>
            <TweakSection label="The property" />
            <TweakRadio label="Shape" value={t.property}
              options={[{ value:'hotel', label:'Small hotel' }, { value:'apts', label:'Apartments' }, { value:'lodge', label:'Lodge · both' }]}
              onChange={(v) => setTweak('property', v)} />
            <TweakSelect label="Signed in as" value={t.user}
              options={HT.staff.map((s) => ({ value:s.id, label:s.name + ' · ' + s.role.split(' · ').pop() }))}
              onChange={(v) => setTweak('user', v)} />
            <TweakSelect label="Landing screen" value={t.start}
              options={[{ value:'rack', label:'Room rack' }, { value:'book', label:'Bookings' }, { value:'house', label:'Cleaning' },
                { value:'folio', label:'Folios' }, { value:'guests', label:'Guests' }, { value:'stays', label:'Long stay' },
                { value:'rates', label:'Rates' }, { value:'audit', label:'Night audit' }, { value:'perf', label:'Reports' },
                { value:'team', label:'Team' }, { value:'prearr', label:'Pre-arrival' },
                { value:'settings', label:'Setup' }]}
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

ReactDOM.createRoot(document.getElementById('root')).render(<HotelApp />);
