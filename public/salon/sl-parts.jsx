/* Koomzo Salon — shared parts: helpers, shell chrome, and the unified Today board. */
const { useState, useMemo, useEffect, useRef } = React;

const SL = window.SL;
const fmt = (m) => { const h = Math.floor(m / 60), mm = m % 60; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
const fmtS = (m) => { const h = Math.floor(m / 60), mm = m % 60; return h + (mm ? 'h' + String(mm).padStart(2, '0') : 'h'); };
const hrs = (m) => { const h = Math.floor(m / 60), mm = Math.round(m % 60); return h + 'h' + (mm ? ' ' + String(mm).padStart(2, '0') + 'm' : ''); };
const dec = (m) => (m / 60).toFixed(2);
const money = (n) => window.KZ_LOCALE.short(n);
const staffOf = (id) => SL.staff.find((s) => s.id === id) || SL.staff[0];

const ST = {
  booked: { label: 'Booked', cls: '', next: 'Check in', to: 'checkedin' },
  confirmed: { label: 'Confirmed', cls: 'inf', next: 'Check in', to: 'checkedin' },
  checkedin: { label: 'Checked in', cls: 'wrn', next: 'Start', to: 'chair' },
  chair: { label: 'In chair', cls: 'ok', next: 'Finish', to: 'done' },
  done: { label: 'Done', cls: 'pri', next: null, to: null },
  noshow: { label: 'No-show', cls: 'cor', next: null, to: null },
};

function Rail({ view, onView, badges }) {
  /* 'today' and 'calendar' are the module core — never hideable.
     Everything else is gated by the shared capability service.
     A badge is work waiting today, never a total; gone at zero, capped at 99+. */
  const gate = (k) => !window.KZ || window.KZ.on('salon', k);
  const n = (v) => (v > 99 ? '99+' : v);
  const items = [
    ['today', 'today-outline', 'Today', true],
    ['register', 'cart-outline', 'Sell', gate('register')],
    ['calendar', 'calendar-number-outline', 'Book', true],
    ['services', 'list-outline', 'Services', gate('services')],
    ['tasks', 'checkbox-outline', 'Tasks', gate('tasks')],
    ['team', 'people-outline', 'Team', gate('team')],
    ['time', 'time-outline', 'Hours', gate('time')],
  ].filter((x) => x[3]);
  return (
    <nav className="rail">
      <div className="rail__mark"><ion-icon name="cut-outline"></ion-icon></div>
      {items.map(([id, ic, label]) => (
        <button key={id} className={view === id ? 'on' : ''} onClick={() => onView(id)}>
          <ion-icon name={ic}></ion-icon><span>{label}</span>
          {badges && badges[id] > 0 && <em className="dot">{n(badges[id])}</em>}
        </button>
      ))}
      <div className="rail__sp"></div>
      <button className={view === 'settings' ? 'on' : ''} onClick={() => onView('settings')}>
        <ion-icon name="settings-outline"></ion-icon><span>Settings</span>
      </button>
    </nav>
  );
}

function TopBar({ title, sub, me, role, onRole }) {
  return (
    <header className="top">
      <div className="top__title">{title}<small>{sub}</small></div>
      <div className="top__sp"></div>
      <button className="profchip" onClick={onRole}>
        <ion-icon name={role === 'manager' ? 'shield-checkmark-outline' : 'person-outline'}></ion-icon>
        <span className="pname">{role === 'manager' ? 'Manager' : 'Stylist'} · {me.first}</span>
      </button>
      <div className="top__meta"><span className="ok"><ion-icon name="ellipse" style={{ fontSize: 9 }}></ion-icon>Open · {fmtS(SL.open)}–{fmtS(SL.close)}</span></div>
      <div className={'avatar'} title={me.name}>{me.init}</div>
    </header>
  );
}

function Av({ s, size, ...rest }) {
  return <div className={'av ' + s.tone + (size ? ' ' + size : '')} {...rest}>{s.init}</div>;
}

function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

function ApptRow({ a, api, showStaff }) {
  const s = staffOf(a.staff), st = ST[a.status];
  const past = a.status === 'done' || a.start + a.dur < SL.now;
  return (
    <div className={'aprow' + (past ? ' past' : '')}>
      <button className="aprow__t" onClick={() => api.openAppt(a)} style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left' }}>
        {fmt(a.start)}<small>{a.dur} min</small>
      </button>
      <div className="aprow__b" onClick={() => api.openAppt(a)} style={{ cursor: 'pointer' }}>
        <div className="aprow__n">{a.client}{a.first && <span className="tag">New</span>}</div>
        <div className="aprow__s">
          <span>{a.service} · {money(a.price)}</span>
          {showStaff && <><span>·</span><Av s={s} size="sm" /><span>{s.first}</span></>}
        </div>
      </div>
      <div className="aprow__a">
        <span className={'badge ' + st.cls}>{st.label}</span>
        {st.next && <button className={'sbtn' + (a.status === 'chair' ? ' pri' : '')} onClick={() => api.setStatus(a.id, st.to)}>{st.next}</button>}
        {a.status === 'done' && !a.paid && <button className="sbtn go" onClick={() => api.charge(a)}>Charge {money(a.price)}</button>}
        {a.status === 'done' && a.paid && <span className="badge ok"><ion-icon name="checkmark-circle" style={{ fontSize: 13 }}></ion-icon>Paid</span>}
      </div>
    </div>
  );
}

function TaskRow({ t, api, compact }) {
  const s = staffOf(t.to);
  const late = t.state !== 'done' && t.day === 'today' && t.due < SL.now;
  return (
    <div className={'tk' + (t.state === 'done' ? ' done' : '')}>
      <button className={'tk__cb' + (t.state === 'done' ? ' on' : '')} onClick={() => api.toggleTask(t.id)} aria-label="Complete task">
        <ion-icon name="checkmark"></ion-icon>
      </button>
      <div className="tk__b" onClick={() => api.openTask(t)} style={{ cursor: 'pointer' }}>
        <div className="tk__n">{t.title}</div>
        <div className="tk__m">
          <i className={'pdot ' + t.pri}></i>
          <span className={late ? 'late' : ''}>{t.day === 'today' ? fmtS(t.due) : t.day}</span>
          <span>·</span>
          {!compact && <><Av s={s} size="sm" /><span>{s.first}</span><span className="tag">{t.tag}</span></>}
          {compact && <span className="tag">{t.tag}</span>}
          {t.repeat && <span className="tag"><ion-icon name="repeat-outline" style={{ fontSize: 11, marginRight: 3 }}></ion-icon>{t.repeat}</span>}
        </div>
      </div>
    </div>
  );
}

function ClockCard({ api }) {
  const c = api.clock;
  return (
    <div className={'clock' + (c.in ? ' on' : '')}>
      <div className="clock__hd">
        <i className={'dotst ' + (c.brk ? 'break' : c.in ? 'in' : '')}></i>
        {c.brk ? 'On break' : c.in ? 'On the clock' : 'Clocked out'}
      </div>
      <div className="clock__el">{c.in ? hrs(api.elapsed) : '—'}</div>
      <div className="clock__sub">
        {c.in ? 'Since ' + fmt(c.in) + (c.brkMin ? ' · ' + c.brkMin + 'm break' : '') : 'Scheduled ' + fmt(SL.open) + ' – ' + fmt(SL.close)}
      </div>
      <div className="clock__act">
        {!c.in && <button className="sbtn go" onClick={api.clockIn}><ion-icon name="log-in-outline"></ion-icon>Clock in</button>}
        {c.in && <button className="sbtn" onClick={api.toggleBreak}><ion-icon name={c.brk ? 'play-outline' : 'pause-outline'}></ion-icon>{c.brk ? 'End break' : 'Break'}</button>}
        {c.in && <button className="sbtn pri" onClick={api.clockOut}><ion-icon name="log-out-outline"></ion-icon>Clock out</button>}
      </div>
    </div>
  );
}

function TodayView({ api }) {
  const [scope, setScope] = useState(api.settings && api.settings.mineOnly ? 'mine' : 'all');
  const list = useMemo(() => api.appts.filter((a) => scope === 'all' || a.staff === api.me.id).sort((x, y) => x.start - y.start), [api.appts, scope, api.me]);
  const myTasks = api.tasks.filter((t) => t.to === api.me.id && t.state !== 'done').slice(0, 4);
  const openTasks = api.tasks.filter((t) => t.state !== 'done' && t.day === 'today');
  const booked = api.appts.length;
  const bookedMin = api.appts.reduce((s, a) => s + a.dur, 0);
  const onShift = SL.staff.filter((s) => s.status !== 'off');
  const capacity = onShift.filter((s) => s.role !== 'Front desk · manager').length * (SL.close - SL.open);
  const util = Math.round((bookedMin / capacity) * 100);
  const expected = api.appts.reduce((s, a) => s + a.price, 0);
  const nextFree = useMemo(() => {
    let best = null;
    SL.staff.forEach((s) => {
      if (s.status === 'off' || /Front desk/.test(s.role)) return;
      const busy = api.appts.find((a) => a.staff === s.id && a.start <= SL.now && a.start + a.dur > SL.now);
      const t = busy ? busy.start + busy.dur : SL.now;
      if (!best || t < best.t) best = { t, s };
    });
    return best;
  }, [api.appts]);

  let drewNow = false;
  return (
    <div className="view">
      <div className="view__head">
        <div>
          <h2>Today</h2>
          <p>{SL.today} · {booked} appointments · {onShift.length} on shift</p>
        </div>
        <div className="sp"></div>
        <button className="btn" onClick={() => api.openTask(null)}><ion-icon name="add-circle-outline"></ion-icon>Assign task</button>
        <button className="btn primary" onClick={() => api.openBook({})}><ion-icon name="calendar-outline"></ion-icon>New booking</button>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="k">Booked</div><div className="v">{booked}<span style={{ font: '500 13px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}> / {hrs(bookedMin)}</span></div></div>
        <div className="kpi"><div className="k">Chair utilisation</div><div className="v">{util}%</div><div className="pbar" style={{ marginTop: 8 }}><i style={{ width: Math.min(100, util) + '%' }}></i></div></div>
        <div className="kpi"><div className="k">Expected takings</div><div className="v">{money(expected)}</div></div>
        <div className="kpi"><div className="k">Next free chair</div><div className="v" style={{ fontSize: 18 }}>{nextFree ? fmt(nextFree.t) : '—'}<small style={{ font: '500 12.5px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>{nextFree ? ' · ' + nextFree.s.first : ''}</small></div></div>
      </div>

      <div className="two">
        <section className="panel">
          <div className="panel__hd">
            <div><h3>Appointments</h3><p>Tap a row to open · actions move it along</p></div>
            <div className="sp"></div>
            <Seg value={scope} options={[{ v: 'all', label: 'All staff' }, { v: 'mine', label: 'Mine' }]} onChange={setScope} />
            <button className="sbtn" onClick={() => api.openBook({ start: Math.ceil(SL.now / 15) * 15, walkIn: true })}><ion-icon name="walk-outline"></ion-icon><span className="lbl-h">Walk-in</span></button>
          </div>
          <div>
            {list.map((a) => {
              const rows = [];
              if (!drewNow && a.start > SL.now) { drewNow = true; rows.push(<div className="nowline" key="now"><span>{fmt(SL.now)} · now</span></div>); }
              rows.push(<ApptRow key={a.id} a={a} api={api} showStaff={scope === 'all'} />);
              return rows;
            })}
            {!list.length && <div className="emptybox">Nothing booked — tap New booking to fill the day.</div>}
          </div>
        </section>

        <aside className="sidecol">
          <ClockCard api={api} />
          <section className="panel">
            <div className="panel__hd">
              <div><h3>My tasks</h3><p>{myTasks.length} open · {openTasks.length} across the salon</p></div>
              <div className="sp"></div>
              <button className="sbtn gh" onClick={() => api.setView('tasks')}>All<ion-icon name="chevron-forward-outline"></ion-icon></button>
            </div>
            <div>
              {myTasks.map((t) => <TaskRow key={t.id} t={t} api={api} compact />)}
              {!myTasks.length && <div className="emptybox">Nothing assigned to you. Nice.</div>}
            </div>
          </section>
          <section className="panel">
            <div className="panel__hd"><div><h3>On shift</h3><p>Clock status · today’s load</p></div></div>
            <div>
              {SL.staff.map((s) => {
                const n = api.appts.filter((a) => a.staff === s.id).length;
                return (
                  <button key={s.id} className="stf" onClick={() => api.openStaff(s.id)}>
                    <Av s={s} />
                    <div className="stf__b"><div className="stf__n">{s.name}</div><div className="stf__r">{s.role}</div></div>
                    <span className="stf__x">{n ? n + ' appt' : '—'}</span>
                    <i className={'dotst ' + (s.status === 'in' ? 'in' : s.status === 'break' ? 'break' : '')}></i>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { SL, fmt, fmtS, hrs, dec, money, staffOf, ST, Rail, TopBar, Av, Seg, ApptRow, TaskRow, ClockCard, TodayView });
