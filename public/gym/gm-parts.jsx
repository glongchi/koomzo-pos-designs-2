/* Koomzo Gym — helpers, shell chrome, and the one piece of logic the whole club
   turns on: may this person come in, right now, on this device, with no network. */
const { useState, useMemo, useEffect, useRef } = React;

const GM = window.GM;
/* one formatter, defined in kz/kz-locale.js — this module used to restate it */
const xaf = window.money;
const planOf = (id) => GM.plans.find((p) => p.id === id) || GM.plans[0];
const memberOf = (id) => GM.members.find((m) => m.id === id);
const staffOf = (id) => GM.staff.find((s) => s.id === id) || GM.staff[0];
const roomOf = (id) => GM.zones.find((z) => z.id === id) || GM.zones[0];
const coOf = (id) => GM.companies.find((c) => c.id === id);
const gate = (k) => !window.KZ || window.KZ.on('gym', k);
const badgeN = (n) => (n > 99 ? '99+' : n);
const initOf = (name) => name.replace(/^(Dr|Mme|M\.|Ir\.)\s+/, '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const hhmm = (s) => s;
const mins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const NOW = '13:05';   /* the demo clock; every "now" decision reads this one value */

const MSTATE = {
  active:  { label:'Active',   cls:'active' },
  due:     { label:'Renewal due', cls:'due' },
  frozen:  { label:'Frozen',   cls:'frozen' },
  expired: { label:'Expired',  cls:'expired' },
};

/* ---------------------------------------------------------------------------
   ADMISSION
   One resolver, every surface: the desk search, the turnstile reader and the
   member's own app all ask this and get the same answer. It runs on the device
   against cached member state — no network in the path, so a telecom outage
   cannot lock a paying member out. Reasons are written for the person at the
   desk to read aloud, not for a log file.
--------------------------------------------------------------------------- */
function admit(m, st, opts) {
  const o = opts || {};
  const plan = planOf(m.plan);
  const inside = st.members.filter((x) => x.in).length;
  if (m.state === 'expired')
    return { ok:false, why:'Membership ended ' + m.expires, act:'renew', label:'Renew and admit' };
  if (m.state === 'frozen')
    return { ok:false, why:'Frozen ' + (m.freeze ? m.freeze.from + ' → ' + m.freeze.to : ''), act:'unfreeze', label:'End the freeze and admit' };
  if (m.state === 'due')
    return { ok:true, warn:true, why:'Renewal due ' + m.expires + ' · admitted on grace', act:'renew', label:'Take renewal' };
  if (plan.hours !== 'any' && gate('access')) {
    const [a, b] = plan.hours.split('–');
    if (mins(NOW) < mins(a) || mins(NOW) > mins(b))
      return { ok:false, why:plan.name + ' runs ' + plan.hours, act:'upgrade', label:'Upgrade or take a day pass' };
  }
  if (o.zone && plan.zones.indexOf(o.zone) < 0 && gate('access'))
    return { ok:false, why:plan.name + ' does not include ' + GM.zoneNames[o.zone], act:'upgrade', label:'Upgrade the plan' };
  if (inside >= GM.capacity && gate('capacity'))
    return { ok:false, why:'The floor is full · ' + inside + ' inside', act:'wait', label:'Hold at reception' };
  if (m.tab > 0 && m.tab >= 15000 && gate('tab'))
    return { ok:true, warn:true, why:'Account tab ' + xaf(m.tab) + ' outstanding', act:'settle', label:'Settle the tab' };
  return { ok:true, why:'Verified on this device · ' + (o.ms || 120) + 'ms', act:'in', label:'Check in' };
}

/* what a member owes and holds, resolved once */
const packsOf = (mid, st) => st.packs.filter((p) => p.mid === mid && p.left > 0);
const ptToday = (mid, st) => st.pt.filter((p) => p.mid === mid && p.state !== 'cancelled');
const walletOf = (mid, st) => st.wallet.filter((w) => w.mid === mid);

function GmRail({ view, onView, badges, me }) {
  /* a trainer signing in has no business in the money screens; reception has no
     business in payouts. The rail is shaped by the job as well as the capability. */
  const job = /trainer|therapist/i.test(me.role) ? 'pt' : /manager/i.test(me.role) ? 'mgr' : 'desk';
  const items = [
    ['desk',    'log-in-outline',        'Front desk', true, 'desk mgr'],
    ['members', 'people-outline',        'Members', gate('members'), 'desk mgr'],
    ['classes', 'calendar-number-outline', 'Timetable', gate('classes') || gate('pt'), 'desk mgr pt'],
    ['money',   'wallet-outline',        'Bar & wallet', gate('wallet') || gate('barpos'), 'desk mgr'],
    ['team',    'trophy-outline',        job === 'pt' ? 'My pay' : 'Trainers', gate('commissions'), 'mgr pt'],
    ['assets',  'lock-closed-outline',   'Lockers & kit', gate('lockers') || gate('equipment'), 'desk mgr'],
  ].filter((x) => x[3] && x[4].indexOf(job) > -1);
  return (
    <nav className="rail">
      <div className="rail__mark" style={{ background:'#b5453f' }}><ion-icon name="barbell-outline"></ion-icon></div>
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

function GmTop({ title, sub, me, onMe, inside }) {
  const pc = Math.round((inside / GM.capacity) * 100);
  return (
    <header className="top">
      <div className="top__title">{title}<small>{sub}</small></div>
      <div className="top__sp"></div>
      <button className="profchip" onClick={onMe}>
        <ion-icon name={me.access.setup ? 'shield-checkmark-outline' : 'person-outline'}></ion-icon>
        <span className="pname">{me.role.split(' · ')[0]} · {me.first}</span>
      </button>
      <div className="top__meta">
        <span className={pc > 85 ? '' : 'ok'}><ion-icon name="ellipse" style={{ fontSize: 9 }}></ion-icon>{inside} inside · {pc}%</span>
      </div>
      <div className="avatar" title={me.name}>{me.init}</div>
    </header>
  );
}

/* the offline strip. Never an error: an outage is an expected operating mode. */
function GmOffline({ online, queued, onSync }) {
  if (online) return (
    <div className="gmoff on">
      <ion-icon name="cloud-done-outline"></ion-icon>Online · everything sent
      <div className="sp"></div>
      <span>Last sync {GM.lastSync}</span>
    </div>
  );
  return (
    <div className="gmoff">
      <ion-icon name="cloud-offline-outline"></ion-icon>
      No network · the gate is reading members from this device
      <div className="sp"></div>
      <em>{queued}</em> writes waiting
      <button className="btn" style={{ height: 30 }} onClick={onSync}><ion-icon name="sync-outline"></ion-icon>Try now</button>
    </div>
  );
}

function GmSeg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}{o.n != null && <i style={{ marginLeft: 5 }}>{o.n}</i>}</button>)}
    </div>
  );
}

function GmSheet({ title, sub, wide, onClose, children, foot }) {
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

function PlanTag({ id }) {
  const p = planOf(id);
  return <span className={'gmplan ' + p.tone}>{p.short}</span>;
}
function StateTag({ state }) {
  const s = MSTATE[state] || MSTATE.active;
  return <span className={'gmstate ' + s.cls}><i></i>{s.label}</span>;
}
function VIA({ via }) {
  const ic = via === 'qr' ? 'qr-code-outline' : via === 'rfid' ? 'radio-outline' : 'person-outline';
  return <ion-icon name={ic} style={{ fontSize: 13, color: 'var(--kz-muted-3)' }}></ion-icon>;
}

/* a member row at the desk: verdict first, then the single act it waits on.
   The meta line is ONE string, so it truncates instead of stacking into a column
   of orphaned separators on a narrow desk pane. */
function MemberHit({ m, st, api, zone }) {
  const v = admit(m, st, { zone });
  const packs = gate('packages') ? packsOf(m.id, st) : [];
  const pt = gate('pt') ? ptToday(m.id, st).filter((p) => p.state === 'booked') : [];
  const bits = [
    planOf(m.plan).hours === 'any' ? 'All hours' : planOf(m.plan).hours,
    'to ' + m.expires,
    ...(gate('wallet') ? ['wallet ' + xaf(m.wallet)] : []),
    ...(gate('tab') && m.tab > 0 ? ['tab ' + xaf(m.tab)] : []),
    ...(packs.length ? [packs[0].left + ' of ' + packs[0].bought + ' ' + packs[0].kind.split(' · ')[0] + ' left'] : []),
    ...(pt.length ? [pt[0].from + ' with ' + staffOf(pt[0].trainer).first] : []),
  ];
  return (
    <div className="gmhit">
      <div className="gmhit__ph">{initOf(m.name)}</div>
      <div className="gmhit__b">
        <div className="gmhit__n">
          <i className={'gmdot ' + (m.in ? 'info' : v.ok ? (v.warn ? 'warn' : '') : 'no')}></i>
          <span className="gmhit__name">{m.name}</span>
          <PlanTag id={m.plan} /><StateTag state={m.state} />
        </div>
        <div className="gmhit__m">{bits.join(' · ')}</div>
      </div>
      <div className="gmhit__act">
        <div className={'gmhit__v ' + (m.in ? 'warn' : v.ok ? (v.warn ? 'warn' : '') : 'no')}>
          <ion-icon name={m.in ? 'walk-outline' : v.ok ? 'checkmark-circle' : 'close-circle'}></ion-icon>
          {m.in ? 'Inside ' + m.at : v.ok ? 'Admit' : 'Refuse'}
        </div>
        {m.in
          ? <button className="btn" onClick={() => api.checkOut(m.id)}><ion-icon name="log-out-outline"></ion-icon>Check out</button>
          : <button className={'btn' + (v.ok && !v.warn ? ' primary' : '')} onClick={() => api.act(m.id, v)}>
              <ion-icon name={v.ok && !v.warn ? 'log-in-outline' : 'construct-outline'}></ion-icon>{v.ok && !v.warn ? 'Check in' : v.label}
            </button>}
        <button className="icbtn" onClick={() => api.openMember(m.id)}><ion-icon name="chevron-forward-outline"></ion-icon></button>
      </div>
    </div>
  );
}

Object.assign(window, { GM, xaf, planOf, memberOf, staffOf, roomOf, coOf, gate, badgeN, initOf, hhmm, mins, NOW,
  MSTATE, admit, packsOf, ptToday, walletOf, GmRail, GmTop, GmOffline, GmSeg, GmSheet, PlanTag, StateTag, VIA, MemberHit });
