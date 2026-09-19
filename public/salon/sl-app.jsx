/* Koomzo Salon — app shell. One state owner; every module reads the same `api`. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "staff",
  "user": "s5",
  "device": "desktop",
  "density": "comfortable",
  "start": "today"
}/*EDITMODE-END*/;

function SalonCapGate({ view, onView }) {
  const CORE = ['today', 'calendar', 'settings'];
  useEffect(() => {
    if (!window.KZ || CORE.indexOf(view) > -1) return;
    const un = window.KZ.subscribe(() => { if (!window.KZ.on('salon', view)) onView('today'); });
    if (!window.KZ.on('salon', view)) onView('today');
    return un;
  }, [view]);
  return null;
}

function SalonApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState(t.start);
  const [appts, setAppts] = useState(SL.appts);
  const [tasks, setTasks] = useState(SL.tasks);
  const [week, setWeek] = useState(SL.myWeek);
  const [team, setTeam] = useState(SL.team);
  const [access, setAccess] = useState(() => Object.fromEntries(SL.staff.map((s) => [s.id, { ...s.access }])));
  const [clock, setClock] = useState({ in: 532, brk: false, brkMin: 0 });
  const [services, setServices] = useState(SL.services);
  const [ticket, setTicket] = useState({ lines: [], client: null, apptId: null });
  /* the salon's retail shelf, adopted into the one ledger */
  useEffect(() => { window.KZ_SALES.adopt('salon', 'up', SL.products); }, []);
  /* composed at the chair: LOC-REG-SESSION-SEQ, immutable once issued */
  const [ticketNo, setTicketNo] = useState(() => window.KZ_TICKET.compose({ loc: 'DLA1', reg: 'S1', seq: 1082 }));
  const [cartOpen, setCartOpen] = useState(false);
  const [held, setHeld] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const wrapRef = useRef(null);
  let LUID = 1;
  const [tick, setTick] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [staffFocus, setStaffFocus] = useState(null);
  const [rotaTick, setRotaTick] = useState(0);
  const [userId, setUserId] = useState(t.user);
  const [density, setDensity] = useState(t.density);
  const [settings, setSettings] = useState({
    landing: t.start, autoClock: true, mineOnly: false, sound: true,
    nTask: true, nAppt: true, nShift: true, nHours: true, nStock: true,
    walkIns: true, tips: false, reminders: true,
    deviceName: 'Front desk tablet', reader: 'MTN MoMo · connected', printer: 'Star TSP143 · ready',
  });
  const me = staffOf(userId);
  const role = me.access && me.access.roster ? 'manager' : 'staff';

  useEffect(() => { setUserId(t.user); }, [t.user]);
  useEffect(() => { setDensity(t.density); }, [t.density]);
  useEffect(() => { setView(t.start); setSettings((c) => ({ ...c, landing: t.start })); }, [t.start]);
  useEffect(() => {
    const el = wrapRef.current; if (!el || !window.ResizeObserver) return;
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 900));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => { const i = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(null), 2600); return () => clearTimeout(i); }, [toast]);

  const say = (m) => setToast(m);
  const elapsed = clock.in ? (SL.now - clock.in) - clock.brkMin + Math.floor(tick / 60) : 0;

  const totals = useMemo(() => {
    const gross = ticket.lines.reduce((s, l) => s + l.price * l.qty, 0);
    const net = ticket.lines.reduce((s, l) => s + l.price * l.qty * (1 - l.disc / 100), 0);
    const tax = window.KZ_POLICY.taxFor('salon', net);
    return { gross: Math.round(gross), net: Math.round(net), discount: Math.round(gross - net), tax, total: Math.round(net) + tax };
  }, [ticket]);
  const finished = appts.filter((a) => a.status === 'done' && !a.paid);

  const api = {
    role, me, appts, tasks, week, team, elapsed, clock, staffFocus, setView, toast: say,
    settings, density, setDensity,
    setSetting: (k, v) => { setSettings((c) => ({ ...c, [k]: v })); if (k === 'landing') say('You’ll land on ' + v + ' next time you sign in'); },
    signIn: (id) => {
      setUserId(id); setStaffFocus(null);
      setView(settings.landing);
      if (settings.autoClock && !clock.in) setClock({ in: SL.now, brk: false, brkMin: 0 });
      say('Signed in as ' + staffOf(id).name + (settings.autoClock ? ' · clocked in' : ''));
    },
    startKiosk: () => setTweak('mode', 'kiosk'),
    startDisplay: () => setTweak('mode', 'display'),
    services, ticket, totals, ticketNo, cartOpen, setCartOpen, finished,
    addLine: (x) => {
      setTicket((c) => {
        const ex = c.lines.find((l) => l.ref === x.id && !l.staff);
        if (ex && x.kind === 'product') return { ...c, lines: c.lines.map((l) => l.uid === ex.uid ? { ...l, qty: l.qty + 1 } : l) };
        return { ...c, lines: [...c.lines, { uid: 'l' + Date.now() + LUID++, ref: x.id, name: x.name, price: x.price, qty: 1, disc: 0, kind: x.kind, staff: x.kind === 'service' ? me.id : null }] };
      });
      setCartOpen(!narrow);
    },
    setQty: (uid, d) => setTicket((c) => ({ ...c, lines: c.lines.flatMap((l) => l.uid !== uid ? [l] : (l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }])) })),
    removeLine: (uid) => setTicket((c) => ({ ...c, lines: c.lines.filter((l) => l.uid !== uid) })),
    setLineStaff: (uid, s) => setTicket((c) => ({ ...c, lines: c.lines.map((l) => l.uid === uid ? { ...l, staff: s } : l) })),
    setLineDisc: (uid, d) => setTicket((c) => ({ ...c, lines: c.lines.map((l) => l.uid === uid ? { ...l, disc: d } : l) })),
    clearTicket: () => { setTicket({ lines: [], client: null, apptId: null }); say('Ticket cleared'); },
    setClient: () => setSheet({ kind: 'client' }),
    pickClient: (c) => setTicket((x) => ({ ...x, client: c })),
    openTender: () => setSheet({ kind: 'tender' }),
    holdTicket: () => { if (!ticket.lines.length) return; setHeld((h) => h + 1); setTicket({ lines: [], client: null, apptId: null }); say('Ticket held'); },
    finishSale: (grand, tip, method) => {
      if (ticket.apptId) setAppts((c) => c.map((a) => a.id === ticket.apptId ? { ...a, paid: true } : a));
      setTicket({ lines: [], client: null, apptId: null });
      setTicketNo((n) => window.KZ_TICKET.next(n));
      say(money(grand) + ' taken by ' + tenderLabel(method));
    },
    fromAppt: (a) => {
      const v = SL.services.find((x) => x.id === a.sid) || { icon: 'cut-outline' };
      setTicket({ lines: [{ uid: 'l' + Date.now(), ref: a.sid, name: a.service, price: a.price, qty: 1, disc: 0, kind: 'service', staff: a.staff }], client: a.client, apptId: a.id });
      setCartOpen(!narrow);
      say(a.client + '’s visit loaded onto the ticket');
    },
    saveService: (d) => {
      if (d.id) { setServices((c) => c.map((x) => x.id === d.id ? { ...x, ...d } : x)); say(d.name + ' updated'); return; }
      setServices((c) => [...c, { ...d, id: 'v' + Date.now() }]); say(d.name + ' added to the price list');
    },
    setStatus: (id, to) => setAppts((c) => c.map((a) => a.id === id ? { ...a, status: to } : a)),
    charge: (a) => { api.fromAppt(a); setView('register'); },
    book: (d) => {
      const v = SL.services.find((x) => x.id === d.sid);
      setAppts((c) => [...c, { id: 'n' + Date.now(), staff: d.staff, sid: d.sid, service: v.name, dur: v.dur, price: v.price,
        start: d.start, client: d.client, status: 'confirmed', phone: '+237 6 99 555 0100', notes: d.notes }]);
      say(d.client + ' booked ' + fmt(d.start) + ' with ' + staffOf(d.staff).first);
    },
    arrive: (id) => { setAppts((c) => c.map((a) => a.id === id ? { ...a, status: 'checkedin' } : a)); },
    checkIn: (d) => {
      const v = SL.services.find((x) => x.id === d.sid);
      setAppts((c) => [...c, { id: 'k' + Date.now(), staff: d.staff, sid: d.sid, service: v.name, dur: v.dur, price: v.price,
        start: d.start, client: d.client, status: 'checkedin', phone: d.phone || '', notes: 'Self check-in at kiosk', walkIn: true }]);
    },
    openBook: (seed) => setSheet({ kind: 'book', seed: seed || {} }),
    openAppt: (a) => setSheet({ kind: 'appt', a }),
    openTask: (task) => setSheet({ kind: 'task', task }),
    openStaff: (id) => { setStaffFocus(id); setView('team'); },
    toggleTask: (id) => setTasks((c) => c.map((x) => x.id === id ? { ...x, state: x.state === 'done' ? 'open' : 'done' } : x)),
    moveTask: (id, to) => setTasks((c) => c.map((x) => x.id === id ? { ...x, state: to } : x)),
    delTask: (id) => { setTasks((c) => c.filter((x) => x.id !== id)); say('Task removed'); },
    saveTask: (d) => {
      if (d.id) { setTasks((c) => c.map((x) => x.id === d.id ? { ...x, ...d } : x)); say('Task updated'); return; }
      setTasks((c) => [{ ...d, id: 'n' + Date.now(), state: 'open' }, ...c]);
      say('Assigned to ' + staffOf(d.to).first);
    },
    saveShifts: (id, rows, total) => {
      const st = SL.staff.find((x) => x.id === id);
      st.shifts = rows.map(([d, a, b]) => [d, a, b]);
      st.week = { ...st.week, sched: +total.toFixed(1) };
      setRotaTick((n) => n + 1);
      say(st.first + '’s rota saved · ' + total.toFixed(1) + ' h from Monday');
    },
    addStaff: (d) => {
      const id = 'n' + Date.now().toString().slice(-6);
      SL.staff.push({ id, name: (d.first + ' ' + d.last).trim(), first: d.first, role: d.role, tone: d.tone, init: d.init,
        phone: d.phone, email: d.email, pin: d.pin, rate: d.rate, since: d.start === 'Today' ? 'Aug 2026' : d.start,
        skills: [], status: 'off', clockIn: null, access: { ...d.acc },
        week: { hours: 0, sched: d.hours, appts: 0, sales: 0, rebook: 0 }, shifts: d.shifts });
      setAccess((c) => ({ ...c, [id]: { ...d.acc } }));
      setTeam((c) => [...c, { id, hours: 0, ot: 0, state: 'pending', flags: 0 }]);
      if (d.svc.length) setServices((c) => c.map((v) => d.svc.includes(v.id) ? { ...v, who: [...v.who, id] } : v));
      say((d.first + ' ' + d.last).trim() + ' added · rota starts ' + d.start.toLowerCase());
      return id;
    },
    toggleAccess: (id, k) => { setAccess((c) => ({ ...c, [id]: { ...c[id], [k]: !c[id][k] } })); say('Permission updated'); },
    approve: (id) => { setTeam((c) => c.map((r) => r.id === id ? { ...r, state: 'approved' } : r)); say(staffOf(id).first + '’s week approved'); },
    approveAll: () => { setTeam((c) => c.map((r) => ({ ...r, state: 'approved' }))); say('All timesheets approved'); },
    fixDay: (d, patch) => { setWeek((c) => c.map((r) => r.d === d ? { ...r, ...patch, note: 'Correction pending' } : r)); say('Correction sent for approval'); },
    clockIn: () => { setClock({ in: SL.now, brk: false, brkMin: 0 }); say('Clocked in at ' + fmt(SL.now)); },
    clockOut: () => { setClock({ in: null, brk: false, brkMin: 0 }); say('Clocked out · ' + hrs(elapsed) + ' logged'); },
    toggleBreak: () => setClock((c) => ({ ...c, brk: !c.brk, brkMin: c.brk ? c.brkMin + 15 : c.brkMin })),
  };
  // access lives in app state so toggles are live; merge onto staff records for the views
  SL.staff.forEach((s) => { if (access[s.id]) s.access = access[s.id]; });

  const openTasks = tasks.filter((x) => x.state !== 'done' && x.day === 'today').length;
  /* rail badges: only work that needs someone today */
  const railBadges = {
    today: appts.filter((a) => a.status === 'checkedin' || (a.status === 'done' && !a.paid)).length,
    register: held,
    tasks: role === 'manager' ? openTasks : tasks.filter((x) => x.to === me.id && x.state !== 'done' && x.day === 'today').length,
    time: role === 'manager' ? team.filter((r) => r.state !== 'approved').length : 0,
  };
  const titles = {
    today: [SL.shop, SL.today + ' · ' + me.name + ' · ' + me.role],
    register: [SL.shop, 'Register · ticket ' + window.KZ_TICKET.short(ticketNo) + (held ? ' · ' + held + ' held' : '')],
    services: [SL.shop, 'Services · price list'],
    calendar: [SL.shop, 'Appointments · ' + SL.today],
    tasks: [SL.shop, 'Tasks · ' + openTasks + ' open today'],
    team: [SL.shop, 'Team · ' + SL.staff.length + ' employees'],
    time: [SL.shop, 'Timesheet · week 10–16 Aug'],
    settings: [SL.shop, 'Settings · ' + settings.deviceName],
  };

  if (t.mode === 'display') {
    return (
      <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
        <div className="rt-wrap">
          <div className="rt" ref={wrapRef}>
            <DisplayView api={api} />
            <TweaksPanel>
              <TweakSection label="Device mode" />
              <TweakRadio label="Mode" value={t.mode}
                options={[{ value: 'staff', label: 'Staff' }, { value: 'kiosk', label: 'Kiosk' }, { value: 'display', label: 'Queue display' }]}
                onChange={(v) => setTweak('mode', v)} />
              <TweakRadio label="Device" value={t.device}
                options={[{ value: 'desktop', label: 'TV' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Counter' }]}
                onChange={(v) => setTweak('device', v)} />
            </TweaksPanel>
          </div>
        </div>
      </div>
    );
  }

  if (t.mode === 'kiosk') {
    return (
      <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
        <div className="rt-wrap">
          <div className="rt" ref={wrapRef}>
            <KioskView api={api} onExit={(s) => { setTweak('mode', 'staff'); say('Kiosk unlocked by ' + s.first); }} />
            {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}
            <TweaksPanel>
              <TweakSection label="Device mode" />
              <TweakRadio label="Mode" value={t.mode}
                options={[{ value: 'staff', label: 'Staff app' }, { value: 'kiosk', label: 'Kiosk' }, { value: 'display', label: 'Queue display' }]}
                onChange={(v) => setTweak('mode', v)} />
              <TweakRadio label="Device" value={t.device}
                options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]}
                onChange={(v) => setTweak('device', v)} />
            </TweaksPanel>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap">
        <div className={'rt' + (density === 'compact' ? ' compact' : '')} ref={wrapRef}>
          <SalonCapGate view={view} onView={setView} />
          <Rail view={view} onView={setView} badges={railBadges} />
          <div className="main">
            <TopBar title={titles[view][0]} sub={titles[view][1]} me={me} role={role}
              onRole={() => setView('settings')} />
            {view === 'today' && <TodayView api={api} />}
            {view === 'register' && <RegisterView api={api} />}
            {view === 'services' && <ServicesView api={api} />}
            {view === 'calendar' && <CalendarView api={api} />}
            {view === 'tasks' && <TasksView api={api} />}
            {view === 'team' && <TeamView api={api} />}
            {view === 'time' && <TimesheetView api={api} />}
            {view === 'settings' && <SettingsView api={api} />}
          </div>

          {sheet && sheet.kind === 'book' && <BookSheet seed={sheet.seed} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.kind === 'appt' && <ApptSheet a={appts.find((x) => x.id === sheet.a.id) || sheet.a} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.kind === 'task' && <TaskSheet task={sheet.task} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.kind === 'client' && <ClientSheet api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.kind === 'tender' && <TenderSheet api={api} onClose={() => setSheet(null)} />}
          {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}

          <TweaksPanel>
            <TweakSection label="Who is using it" />
            <TweakRadio label="Device mode" value={t.mode}
              options={[{ value: 'staff', label: 'Staff app' }, { value: 'kiosk', label: 'Kiosk' }, { value: 'display', label: 'Queue display' }]}
              onChange={(v) => setTweak('mode', v)} />
            <TweakSelect label="Signed in as" value={t.user}
              options={SL.staff.map((x) => ({ value: x.id, label: x.name + (x.access && x.access.roster ? ' · manager' : '') }))}
              onChange={(v) => setTweak('user', v)} />
            <TweakSelect label="Landing screen" value={t.start}
              options={[{ value: 'today', label: 'Today board' }, { value: 'register', label: 'Register' },
                { value: 'calendar', label: 'Appointments' }, { value: 'services', label: 'Services' },
                { value: 'tasks', label: 'Tasks' }, { value: 'team', label: 'Team' }, { value: 'time', label: 'Timesheet' },
                { value: 'settings', label: 'Settings' }]}
              onChange={(v) => setTweak('start', v)} />
            <TweakSection label="Preview" />
            <TweakRadio label="Device" value={t.device}
              options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]}
              onChange={(v) => setTweak('device', v)} />
            <TweakRadio label="Density" value={t.density}
              options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
              onChange={(v) => setTweak('density', v)} />
          </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SalonApp />);
