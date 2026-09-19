/* Koomzo Hotel — helpers, shell chrome, room tile. Everything else builds on these. */
const { useState, useMemo, useEffect, useRef } = React;

const HT = window.HT;
/* one formatter, defined in kz/kz-locale.js — this module used to restate it */
const xaf = window.money;
const typeOf = (id) => HT.types.find((t) => t.id === id) || HT.types[0];
const roomOf = (no) => HT.rooms.find((r) => r.no === no);
const userOf = (id) => HT.staff.find((s) => s.id === id) || HT.staff[0];
const guestOf = (id) => HT.guests.find((g) => g.id === id);
const srcOf = (id) => HT.sources.find((s) => s.id === id) || HT.sources[0];
const gate = (k) => !window.KZ || window.KZ.on('hotel', k);
const nights = (n) => n + (n === 1 ? ' night' : ' nights');

/* the rack state of a room, resolved in one place so every screen agrees */
const RACK = {
  vac:   { label:'Vacant · clean',   cls:'vac' },
  dirty: { label:'Needs cleaning',   cls:'dirty' },
  occ:   { label:'Occupied',         cls:'occ' },
  due:   { label:'Departing today',  cls:'due' },
  arr:   { label:'Arriving today',   cls:'arr' },
  stay:  { label:'Long stay',        cls:'stay' },
  ooo:   { label:'Out of order',     cls:'ooo' },
};
function rackState(no, st) {
  const ooo = st.maint.find((m) => m.no === no && m.ooo && m.state !== 'fixed');
  if (ooo && gate('maintenance')) return 'ooo';
  const here = st.stays.find((s) => s.no === no && (s.status === 'inhouse' || s.status === 'due'));
  if (here) return here.status === 'due' ? 'due' : (here.plan !== 'nightly' && gate('longstay') ? 'stay' : 'occ');
  const arr = st.stays.find((s) => s.no === no && s.status === 'arr');
  if (arr && gate('bookings')) return 'arr';
  const hk = st.house.find((h) => h.no === no);
  if (hk && hk.state !== 'clean' && gate('housekeeping')) return 'dirty';
  return 'vac';
}
const stayIn = (no, st) => st.stays.find((s) => s.no === no && (s.status === 'inhouse' || s.status === 'due' || s.status === 'arr'));

/* folio arithmetic — charges positive, payments negative, balance is the sum */
function folioSum(lines) {
  const charges = lines.filter((l) => l.kind !== 'payment').reduce((s, l) => s + l.amount, 0);
  const paid = -lines.filter((l) => l.kind === 'payment').reduce((s, l) => s + l.amount, 0);
  return { charges, paid, balance: charges - paid };
}
const LINE_IC = { room:'bed-outline', fnb:'restaurant-outline', bar:'wine-outline', laundry:'shirt-outline',
  levy:'document-text-outline', other:'flash-outline', payment:'checkmark-circle-outline' };

/* A rail badge is a COUNT OF WORK, not a notification: things a person must act on
   today, on that screen. Never a total, never informational, gone at zero, capped
   at 99+. One per item. The same rule holds in every module. */
const badgeN = (n) => (n > 99 ? '99+' : n);

function HtRail({ view, onView, badges, me }) {
  /* the rail is shaped by the job, not only by the capability: a housekeeper
     signing in on a phone has no business seeing folios or rates. */
  const job = me && /Housekeeping/.test(me.role) ? 'hk' : me && /Maintenance/.test(me.role) ? 'mt' : 'desk';
  const items = [
    ['rack', 'grid-outline', 'Rooms', true, 'desk hk mt'],
    ['book', 'calendar-number-outline', 'Bookings', gate('bookings'), 'desk'],
    ['house', 'sparkles-outline', job === 'mt' ? 'Faults' : 'Cleaning', gate('housekeeping') || gate('maintenance'), 'desk hk mt'],
    ['folio', 'reader-outline', 'Folios', gate('folio'), 'desk'],
    ['guests', 'people-outline', 'Guests', gate('guests'), 'desk'],
    ['stays', 'key-outline', 'Long stay', gate('longstay'), 'desk'],
    ['rates', 'pricetags-outline', 'Rates', gate('rates'), 'desk'],
    ['audit', 'moon-outline', 'Audit', gate('nightaudit'), 'desk'],
    ['perf', 'stats-chart-outline', 'Reports', gate('occupancy'), 'desk'],
    ['team', 'people-circle-outline', 'Team', gate('roster'), 'desk hk mt'],
    ['prearr', 'qr-code-outline', 'Pre-arrival', gate('prearrival'), 'desk'],
  ].filter((x) => x[3] && x[4].indexOf(job) > -1);
  return (
    <nav className="rail">
      <div className="rail__mark" style={{ background:'#0f8f9e' }}><ion-icon name="bed-outline"></ion-icon></div>
      {items.map(([id, ic, label]) => (
        <button key={id} className={view === id ? 'on' : ''} onClick={() => onView(id)}>
          <ion-icon name={ic}></ion-icon><span>{label}</span>
          {badges && badges[id] > 0 && <em className="dot">{badgeN(badges[id])}</em>}
        </button>
      ))}
      <div className="rail__sp"></div>
      <button className={view === 'settings' ? 'on' : ''} onClick={() => onView('settings')}>
        <ion-icon name="settings-outline"></ion-icon><span>Setup</span>
      </button>
    </nav>
  );
}

function HtTop({ title, sub, me, onMe, occ }) {
  return (
    <header className="top">
      <div className="top__title">{title}<small>{sub}</small></div>
      <div className="top__sp"></div>
      <button className="profchip" onClick={onMe}>
        <ion-icon name={me.access.setup ? 'shield-checkmark-outline' : 'person-outline'}></ion-icon>
        <span className="pname">{me.role.split(' · ')[0]} · {me.first}</span>
      </button>
      <div className="top__meta"><span className="ok"><ion-icon name="ellipse" style={{ fontSize: 9 }}></ion-icon>{occ}% tonight</span></div>
      <div className="avatar" title={me.name}>{me.init}</div>
    </header>
  );
}

function HtSeg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}{o.n != null && <i style={{ marginLeft: 5 }}>{o.n}</i>}</button>)}
    </div>
  );
}

function HtSheet({ title, sub, wide, onClose, children, foot }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet' + (wide ? ' wide' : '')} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>{title}</h3><p>{sub}</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">{children}</div>
        {foot && <div className="sheet__foot">{foot}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   THE NEXT ACTION
   One resolver, three surfaces: the tile, the all-floors row and the room sheet
   footer all render from this, so the button a new receptionist sees on the tile
   is exactly the button they get after opening the room. Ordered by urgency, not
   by state name — a guest standing at the desk outranks cleaning. `hero` marks
   the acts that move money or a body; everything else stays quiet.
--------------------------------------------------------------------------- */
function nextAction(no, st, api) {
  const state = rackState(no, st);
  const s = stayIn(no, st);
  const hk = st.house.find((h) => h.no === no);
  const ooo = st.maint.find((m) => m.no === no && m.ooo && m.state !== 'fixed');

  if (ooo && gate('maintenance'))
    return { id:'onsale', label:'Put back on sale', icon:'checkmark-circle-outline', run:() => api.toggleOoo(no) };

  if (state === 'arr' && s)
    return { id:'in', label:'Check in', icon:'log-in-outline', hero:true, run:() => api.checkIn(s.id) };

  if (state === 'due' && s)
    return gate('folio')
      ? { id:'settle', label:'Check out & settle', icon:'log-out-outline', hero:true, run:() => api.openSettle(s.id) }
      : { id:'out', label:'Check out', icon:'log-out-outline', hero:true, run:() => api.checkOut(s.id) };

  if ((state === 'occ' || state === 'stay') && s)
    return gate('folio')
      ? { id:'post', label:'Post a charge', icon:'add-outline', run:() => api.openPost(s.id) }
      : { id:'open', label:'Open stay', icon:'reader-outline', run:() => api.openRoom(no) };

  if (state === 'dirty' && gate('housekeeping'))
    return hk && hk.state === 'inspect'
      ? { id:'pass',  label:'Pass inspection', icon:'checkmark-outline', run:() => api.hkSet(no, 'clean') }
      : hk && hk.state === 'cleaning'
        ? { id:'done',  label:'Mark cleaned', icon:'checkmark-outline', run:() => api.hkSet(no, 'clean') }
        : { id:'clean', label:'Start cleaning', icon:'sparkles-outline', run:() => api.hkSet(no, 'cleaning') };

  return { id:'book', label:gate('bookings') ? 'Book this room' : 'Check a guest in', icon:'person-add-outline', run:() => api.openBook({ no }) };
}

/* one room on the rack — status, who is in it, and the one act it waits on */
function RoomTile({ r, st, api }) {
  const state = rackState(r.no, st);
  const meta = RACK[state];
  const s = stayIn(r.no, st);
  const t = typeOf(r.type);
  const bal = s && gate('folio') ? folioSum(st.folio[s.id] || []).balance : 0;
  const hk = st.house.find((h) => h.no === r.no);
  const ooo = st.maint.find((m) => m.no === r.no && m.ooo && m.state !== 'fixed');
  const act = nextAction(r.no, st, api);
  return (
    <div className={'htroom ' + meta.cls} role="button" tabIndex={0} onClick={() => api.openRoom(r.no)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.openRoom(r.no); } }}>
      <div className="htroom__t">
        <span className="htroom__n">{r.no}</span>
        <span className="htroom__ty">{t.short}</span>
        <div className="sp" style={{ flex: 1 }}></div>
        <ion-icon name="chevron-forward-outline" class="htroom__go"></ion-icon>
      </div>
      <div className="htroom__st"><i className={'htdot ' + meta.cls}></i>{meta.label}</div>
      {s ? <>
        <div className="htroom__g">{s.guest}</div>
        <div className="htroom__m">
          <span>{state === 'arr' ? 'Arrives ' + HT.checkin : state === 'due' ? 'Out by ' + HT.checkout
            : s.plan === 'nightly' ? nights(s.nights - Math.max(0, -s.from)) + ' left' : s.plan === 'monthly' ? 'Monthly · to ' + (s.renew || '—') : 'Weekly'}</span>
          {gate('folio') && bal > 0 && <><span>·</span><span className="htroom__b">{xaf(bal)}</span></>}
        </div>
      </> : <>
        <div className="htroom__m">
          <span>{t.name}</span>
          {ooo && <><span>·</span><span style={{ color:'var(--kz-discount)' }}>{ooo.issue.slice(0, 22)}…</span></>}
          {!ooo && hk && hk.state !== 'clean' && <><span>·</span><span>{hk.state === 'cleaning' ? 'Being cleaned' : hk.state === 'inspect' ? 'Awaiting check' : 'To clean'}</span></>}
        </div>
      </>}
      <button className={'htroom__a' + (act.hero ? ' hero' : '')} onClick={(e) => { e.stopPropagation(); act.run(); }}>
        <ion-icon name={act.icon}></ion-icon>{act.label}
      </button>
    </div>
  );
}

function SrcTag({ id }) {
  const s = srcOf(id);
  return <span className="tag"><ion-icon name={s.icon} style={{ fontSize: 11, marginRight: 4 }}></ion-icon>{s.name}</span>;
}

const shiftOf = (code) => HT.shiftDefs.find((s) => s.code === code) || HT.shiftDefs[3];
const worksShift = (code) => code === 'M' || code === 'A' || code === 'N';
/* who is on a given shift on a given day — always against the live team, never HT */
const onShift = (team, code, day) => team.filter((s) => s.roster[day] === code);

Object.assign(window, { HT, xaf, typeOf, roomOf, userOf, guestOf, srcOf, gate, nights, badgeN,
  RACK, rackState, stayIn, folioSum, LINE_IC, HtRail, HtTop, HtSeg, HtSheet, RoomTile, SrcTag,
  nextAction, shiftOf, worksShift, onShift });
