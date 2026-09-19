/* Koomzo Gym — app shell. One state owner; the capability service decides what
   exists. The club runs offline first: every act below writes locally and queues,
   and nothing in the check-in path waits on a network call. */
const GM_TWEAKS = /*EDITMODE-BEGIN*/{
  "user": "s5",
  "device": "desktop",
  "start": "desk",
  "online": false
}/*EDITMODE-END*/;

const GM_CAP_FOR = { members:'members', classes:'classes', money:'wallet', team:'commissions', assets:'lockers' };

function GymCapGate({ view, onView }) {
  useEffect(() => {
    if (!window.KZ) return;
    const need = GM_CAP_FOR[view];
    const bad = () => need && !window.KZ.on('gym', need);
    if (bad()) onView('desk');
    return window.KZ.subscribe(() => { if (bad()) onView('desk'); });
  }, [view]);
  return null;
}

function GymApp() {
  /* the juice bar and pro shop, adopted into the one ledger */
  useEffect(() => { window.KZ_SALES.adopt('gym', 'ap', GM.bar); }, []);
  const [t, setTweak] = useTweaks(GM_TWEAKS);
  const [view, setView] = useState(t.start);
  const [members, setMembers] = useState(GM.members);
  const [packs, setPacks] = useState(GM.packs);
  const [pt, setPt] = useState(GM.pt);
  const [classes, setClasses] = useState(GM.classes);
  const [wallet, setWallet] = useState(GM.wallet);
  const [lockers, setLockers] = useState(GM.lockers);
  const [equipment, setEquipment] = useState(GM.equipment);
  const [gateLog, setGateLog] = useState(GM.gateLog);
  const [queued, setQueued] = useState(GM.syncQueued);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [, bump] = useState(0);
  const me = staffOf(t.user);
  const online = !!t.online;

  useEffect(() => { setView(t.start); }, [t.start]);
  useEffect(() => { if (window.KZ) return window.KZ.subscribe(() => bump((n) => n + 1)); }, []);
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(null), 2800); return () => clearTimeout(i); }, [toast]);

  const st = { members, packs, pt, classes, wallet, lockers, equipment, gateLog, companies: GM.companies };
  const say = (m) => setToast(m);
  /* one write path: local first, then a queue count the operator can see. */
  const queue = (n) => { if (!online) setQueued((q) => q + (n || 1)); };
  const patchM = (id, p) => setMembers((c) => c.map((m) => m.id === id ? { ...m, ...p } : m));
  const logGate = (mid, ok, why, via) => setGateLog((c) => [{ at: NOW, mid, via: via || 'desk', ms: via === 'desk' ? 0 : 120, ok, off: !online, why }, ...c].slice(0, 12));

  const api = {
    st, me, online, toast: say,
    view: setView,
    openMember: (id) => setSheet({ k:'member', id }),
    openNew: (seed) => setSheet({ k:'new', seed }),
    openFreeze: (id) => setSheet({ k:'freeze', id }),
    openTransfer: (id) => setSheet({ k:'transfer', id }),
    openTopup: (id) => setSheet({ k:'topup', id }),
    openSettle: (id) => setSheet({ k:'settletab', id }),
    openBookClass: (id) => setSheet({ k:'bookclass', id }),
    openBookPt: () => setSheet({ k:'bookpt' }),
    openTrainer: (id) => setSheet({ k:'trainer', id }),
    openLocker: (id) => setSheet({ k:'locker', id }),
    openLockerEdit: () => setSheet({ k:'addlockers' }),
    openKit: (id) => setSheet({ k:'kit', id }),
    openFault: (id) => setSheet({ k:'fault', id }),

    scan: () => {
      /* a scan is the same decision as a search — it just skips the typing */
      const next = members.find((m) => !m.in && m.state === 'active');
      if (!next) { say('No card read'); return; }
      api.checkIn(next.id, 'qr');
    },
    /* the one act the club exists for */
    checkIn: (id, via) => {
      const m = members.find((x) => x.id === id);
      const v = admit(m, st);
      if (!v.ok) { logGate(id, false, v.why, via); say(m.name + ' refused · ' + v.why); return; }
      patchM(id, { in:true, at: NOW, via: via || 'desk', visits: m.visits + 1 });
      logGate(id, true, null, via);
      queue(1);
      /* a session today is signed by the check-in, which is what pays the trainer */
      const s = pt.find((p) => p.mid === id && p.state === 'booked');
      if (s && gate('pt')) {
        setPt((c) => c.map((p) => p.id === s.id ? { ...p, state:'in' } : p));
        say(m.name + ' in · ' + staffOf(s.trainer).first + ' notified for ' + s.from);
      } else {
        say(m.name + ' admitted' + (online ? '' : ' · verified on this device'));
      }
    },
    checkOut: (id) => {
      const m = members.find((x) => x.id === id);
      patchM(id, { in:false, at:null });
      setLockers((c) => c.map((l) => l.kind === 'day' && l.mid === id ? { ...l, mid:null, until:null } : l));
      queue(1);
      say(m.name + ' checked out' + (m.tab > 0 ? ' · tab ' + xaf(m.tab) + ' still open' : ''));
    },
    /* the desk button follows the verdict, so one press always does the right thing */
    act: (id, v) => {
      if (v.act === 'renew') { api.renew(id); return; }
      if (v.act === 'unfreeze') { api.unfreeze(id); return; }
      if (v.act === 'settle') { setSheet({ k:'settletab', id }); return; }
      if (v.act === 'upgrade') { setSheet({ k:'member', id }); return; }
      if (v.act === 'wait') { say('Held at reception · the floor is full'); return; }
      api.checkIn(id);
    },
    renew: (id) => {
      const m = members.find((x) => x.id === id);
      patchM(id, { state:'active', expires:'30 Sep' });
      queue(1);
      say(m.name + ' renewed · ' + xaf(planOf(m.plan).price) + ' taken · admitted');
      api.checkIn(id);
    },
    freeze: (id, days, reason) => {
      const m = members.find((x) => x.id === id);
      patchM(id, { state:'frozen', freeze:{ from: GM.dayNo + ' ' + GM.month, to:'+' + days + ' days', reason, days } });
      queue(1);
      say(m.name + ' frozen for ' + days + ' days · renewal pushed out the same');
    },
    unfreeze: (id) => {
      const m = members.find((x) => x.id === id);
      patchM(id, { state:'active', freeze:null });
      queue(1);
      say(m.name + ' back in · renewal date extended by the frozen days');
    },
    transfer: (from, to, months) => {
      const a = members.find((x) => x.id === from), b = members.find((x) => x.id === to);
      patchM(from, { expires:'—', state:'expired' });
      patchM(to, { state:'active' });
      queue(2);
      say(months + ' month(s) moved from ' + a.name + ' to ' + b.name + ' · fee ' + xaf(15000) + ' · authorised by ' + me.first);
    },
    addMember: (d) => {
      const id = 'm' + Date.now();
      setMembers((c) => [...c, { id, name:d.name, plan:d.plan, state:'active', since:'2026', expires:'30 Sep',
        phone:d.phone, wallet:0, tab:0, locker:null, co:d.co || null, visits:0, sessions:0, in:false, at:null, via:null, photo:false }]);
      queue(1);
      say(d.name + ' joined on ' + planOf(d.plan).name + (d.co ? ' · company seat' : ' · ' + xaf(planOf(d.plan).price) + ' taken'));
    },

    bookClass: (cid, mid) => {
      const c = classes.find((x) => x.id === cid);
      const full = c.booked >= c.cap;
      setClasses((cs) => cs.map((x) => x.id === cid ? (full ? { ...x, wait:(x.wait || 0) + 1 } : { ...x, booked: x.booked + 1 }) : x));
      queue(1);
      say(memberOf(mid).name + (full ? ' added to the waiting list for ' : ' booked into ') + c.name);
    },
    bookPt: (d) => {
      const id = 'pt' + Date.now();
      setPt((c) => [...c, { id, mid:d.mid, trainer:d.tid, room:d.room, from:d.from,
        to:(Number(d.from.slice(0, 2)) + (d.pack ? 0 : 0)) + ':' + (Number(d.from.slice(3)) + 45 >= 60 ? '45' : '45'),
        state:'booked', fee:28000, pack:d.pack }]);
      queue(1);
      say(memberOf(d.mid).name + ' booked with ' + staffOf(d.tid).first + ' at ' + d.from);
    },
    cancelPt: (id) => {
      const p = pt.find((x) => x.id === id);
      const late = mins(p.from) - mins(NOW) < GM.cancelWindow * 60;
      setPt((c) => c.map((x) => x.id === id ? { ...x, state: late ? 'noshow' : 'cancelled', charged: late } : x));
      queue(1);
      say(late
        ? 'Cancelled inside the ' + GM.cancelWindow + '-hour window · charged in full, trainer still paid'
        : 'Cancelled · nothing charged, the hour goes back on sale');
    },
    /* a session is signed off once, and that is what deducts the package */
    completePt: (id) => {
      const p = pt.find((x) => x.id === id);
      setPt((c) => c.map((x) => x.id === id ? { ...x, state:'done', signed:true } : x));
      if (p.pack && gate('packages')) setPacks((c) => c.map((k) => k.id === p.pack ? { ...k, left: Math.max(0, k.left - 1) } : k));
      queue(1);
      const s = staffOf(p.trainer);
      say('Session signed · ' + xaf(Math.round(p.fee * s.split)) + ' to ' + s.first + (p.pack ? ' · one session off the package' : ''));
    },

    topup: (id, amt, tender) => {
      const m = members.find((x) => x.id === id);
      patchM(id, { wallet: m.wallet + amt });
      setWallet((c) => [...c, { id:'w' + Date.now(), mid:id, at: GM.dayNo + ' ' + GM.month + ' ' + NOW,
        kind:'topup', desc:'Top-up · ' + GM.tenders.find((x) => x.id === tender).name + (online ? '' : ' · queued offline'), amount: amt, queued: !online }]);
      queue(1);
      say(xaf(amt) + ' added to ' + m.name + "'s wallet");
    },
    sell: (d) => {
      const total = d.total;
      if (!d.mid) { queue(1); say(xaf(total) + ' taken in cash'); return; }
      const m = members.find((x) => x.id === d.mid);
      const desc = d.lines.map((l) => l.qty + '× ' + l.name).join(', ');
      if (d.tender === 'wallet') {
        patchM(d.mid, { wallet: m.wallet - total });
        setWallet((c) => [...c, { id:'w' + Date.now(), mid:d.mid, at: GM.dayNo + ' ' + GM.month + ' ' + NOW, kind:'spend', desc, amount:-total, queued: !online }]);
        say(xaf(total) + ' from ' + m.name + "'s wallet · balance " + xaf(m.wallet - total));
      } else if (d.tender === 'tab') {
        patchM(d.mid, { tab: m.tab + total });
        say(xaf(total) + ' on ' + m.name + "'s account · tab now " + xaf(m.tab + total));
      } else {
        say(xaf(total) + ' taken · ' + desc);
      }
      queue(1);
    },
    settleTab: (id, tender) => {
      const m = members.find((x) => x.id === id);
      const paid = m.tab;
      patchM(id, { tab: 0, ...(tender === 'wallet' ? { wallet: Math.max(0, m.wallet - paid) } : {}) });
      queue(1);
      say(m.name + "'s account settled · " + xaf(paid) + ' by ' + GM.tenders.find((x) => x.id === tender).name);
    },
    billCo: (cid) => { const c = coOf(cid); queue(1); say(c.name + ' invoiced ' + xaf(c.balance) + ' · ' + c.terms + ' days'); },
    exportPayout: (total) => say('Payout ledger exported · ' + xaf(total) + ' · SYSCOHADA columns'),

    assignLocker: (id, mid, until) => {
      setLockers((c) => c.map((l) => l.id === id ? { ...l, mid, until: l.kind === 'day' ? until : null } : l));
      patchM(mid, { locker: id });
      queue(1);
      say('Locker ' + id + ' assigned to ' + memberOf(mid).name);
    },
    releaseLocker: (id) => {
      const l = lockers.find((x) => x.id === id);
      if (l.mid) patchM(l.mid, { locker: null });
      setLockers((c) => c.map((x) => x.id === id ? { ...x, mid:null, until:null } : x));
      queue(1);
      say('Locker ' + id + ' back in the pool');
    },
    /* lockers arrive as a bank; ids are unique and never reused while retired */
    addLockers: (d) => {
      const pad = (n) => (n < 10 ? '0' + n : String(n));
      const rows = Array.from({ length: d.count }, (_, i) => ({
        id: d.prefix + '-' + pad(d.start + i), kind: d.kind, zone: d.zone, mid: null, until: null,
      }));
      setLockers((c) => [...c, ...rows]);
      queue(1);
      say(d.count + ' ' + (d.kind === 'vip' ? 'dedicated' : 'day') + ' lockers added · ' + rows[0].id + ' → ' + rows[rows.length - 1].id);
    },
    patchLocker: (id, patch) => {
      setLockers((c) => c.map((l) => l.id === id ? { ...l, ...patch } : l));
      queue(1);
      say('Locker ' + id + (patch.retired === true ? ' retired' : patch.retired === false ? ' back in the pool'
        : patch.fault ? ' marked faulty' : ' fault cleared'));
    },
    /* one save path for a machine, whether it is new or being edited */
    saveKit: (id, d) => {
      if (id) {
        setEquipment((c) => c.map((e) => e.id === id ? { ...e, name:d.name, zone:d.zone, serial:d.serial, interval:d.interval, serviced:d.serviced, due:d.due } : e));
        queue(1); say(d.name + ' saved · next service ' + d.due);
        return;
      }
      setEquipment((c) => [...c, { id:'eq' + Date.now(), name:d.name, zone:d.zone, serial:d.serial,
        interval:d.interval, serviced:d.serviced, due:d.due, state:'ok', hours:0, note:d.note || null }]);
      queue(1);
      say(d.name + ' added to the floor · next service ' + d.due);
    },
    /* a service closes any overdue state by construction — the date is the fact */
    serviceKit: (id, due, note) => {
      const e = equipment.find((x) => x.id === id);
      setEquipment((c) => c.map((x) => x.id === id ? { ...x, serviced: GM.dayNo + ' ' + GM.month, due,
        state: x.state === 'fault' ? 'fault' : 'ok', note: note || x.note } : x));
      queue(1);
      say(e.name + ' serviced today · next due ' + due + (e.state === 'fault' ? ' · still out of use until the fault is closed' : ''));
    },
    logFault: (id, issue, off) => {
      setEquipment((c) => c.map((e) => e.id === id ? { ...e, state: off ? 'fault' : 'ok', issue, logged: GM.dayNo + ' ' + GM.month, to:'s6' } : e));
      queue(1);
      say((st.equipment.find((e) => e.id === id) || {}).name + ' · fault logged' + (off ? ' and taken out of use' : ''));
    },
    fixKit: (id) => {
      setEquipment((c) => c.map((e) => e.id === id ? { ...e, state:'ok', issue:null, serviced: GM.dayNo + ' ' + GM.month } : e));
      queue(1);
      say('Back in service · serviced today');
    },
    sync: () => {
      if (online) { say('Everything already sent'); return; }
      setTweak('online', true);
      setQueued(0);
      say(queued + ' writes sent · the club is back online');
    },
  };

  const inside = members.filter((m) => m.in).length;
  /* rail badges count work waiting on a person today — never a total */
  const badges = {
    members: members.filter((m) => m.state === 'due' || m.state === 'expired').length,
    classes: /trainer|therapist/i.test(me.role)
      ? pt.filter((p) => p.trainer === me.id && p.state === 'booked').length
      : pt.filter((p) => p.state === 'booked').length,
    money: members.filter((m) => m.tab >= 15000).length,
    assets: equipment.filter((e) => e.state !== 'ok').length,
  };
  const titles = {
    desk:    [GM.club, GM.today + ' · ' + GM.city],
    members: [GM.club, 'Members · ' + members.length + ' on the book'],
    classes: [GM.club, 'Timetable · ' + GM.today],
    money:   [GM.club, 'Bar & wallet · juice bar, pro shop and prepaid balances'],
    team:    [GM.club, 'Trainers · pay from signed sessions'],
    assets:  [GM.club, 'Lockers & kit · ' + lockers.filter((l) => l.mid).length + ' lockers out'],
    settings:[GM.club, 'Setup · what this club sees'],
  };

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap">
        <div className="rt">
          <GymCapGate view={view} onView={setView} />
          <GmRail view={view} onView={setView} badges={badges} me={me} />
          <div className="main">
            <GmTop title={titles[view][0]} sub={titles[view][1]} me={me} inside={inside} onMe={() => setView('settings')} />
            <GmOffline online={online} queued={queued} onSync={api.sync} />
            {view === 'desk' && <DeskView api={api} />}
            {view === 'members' && <MembersView api={api} />}
            {view === 'classes' && <ClassesView api={api} />}
            {view === 'money' && <MoneyView api={api} />}
            {view === 'team' && <TeamView api={api} />}
            {view === 'assets' && <AssetsView api={api} />}
            {view === 'settings' && (
              <div className="view">
                <div className="view__head">
                  <div><h2>Setup</h2><p>{GM.club} · {GM.capacity} on the floor · the same panel every module uses</p></div>
                  <div className="sp"></div>
                  <a className="btn" href="Koomzo - Control Centre.html"><ion-icon name="options-outline"></ion-icon>Control Centre</a>
                </div>
                <ModuleSetup mid="gym" embedded />
              </div>
            )}
          </div>

          {sheet && sheet.k === 'member' && <MemberSheet mid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'new' && <NewMemberSheet seed={sheet.seed} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'freeze' && <FreezeSheet mid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'transfer' && <TransferSheet mid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'topup' && <TopupSheet mid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'settletab' && <SettleTabSheet mid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'bookclass' && <BookClassSheet cid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'bookpt' && <BookPtSheet api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'trainer' && <TrainerSheet sid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'locker' && <LockerSheet id={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'addlockers' && <AddLockersSheet api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'kit' && <KitSheet eid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {sheet && sheet.k === 'fault' && <FaultSheet eid={sheet.id} api={api} onClose={() => setSheet(null)} />}
          {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}

          <TweaksPanel>
            <TweakSection label="The club" />
            <TweakToggle label="Network" value={online} onChange={(v) => setTweak('online', v)} />
            <TweakSelect label="Signed in as" value={t.user}
              options={GM.staff.map((s) => ({ value:s.id, label:s.name + ' · ' + s.role.split(' · ')[0] }))}
              onChange={(v) => setTweak('user', v)} />
            <TweakSelect label="Landing screen" value={t.start}
              options={[{ value:'desk', label:'Front desk' }, { value:'members', label:'Members' }, { value:'classes', label:'Timetable' },
                { value:'money', label:'Bar & wallet' }, { value:'team', label:'Trainers' }, { value:'assets', label:'Lockers & kit' },
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

ReactDOM.createRoot(document.getElementById('root')).render(<GymApp />);
