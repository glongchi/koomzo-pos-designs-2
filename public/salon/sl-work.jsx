/* Koomzo Salon — Tasks, Team (employees) and Timesheet modules. */

function TasksView({ api }) {
  const [mode, setMode] = useState('board');
  const [filter, setFilter] = useState('all');
  const list = api.tasks.filter((t) => filter === 'all' ? true : filter === 'mine' ? t.to === api.me.id
    : filter === 'today' ? t.day === 'today' : t.state !== 'done' && t.day === 'today' && t.due < SL.now);
  const cols = [['open', 'To do', 'ellipse-outline'], ['doing', 'In progress', 'time-outline'], ['done', 'Done', 'checkmark-circle-outline']];
  const nextState = { open: 'doing', doing: 'done', done: 'open' };

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Tasks</h2><p>{api.tasks.filter((t) => t.state !== 'done').length} open · assigned to {new Set(api.tasks.map((t) => t.to)).size} people</p></div>
        <div className="sp"></div>
        <Seg value={mode} options={[{ v: 'board', label: 'Board' }, { v: 'list', label: 'List' }]} onChange={setMode} />
        <button className="btn primary" onClick={() => api.openTask(null)}><ion-icon name="add-outline"></ion-icon>New task</button>
      </div>

      <div className="rowbar">
        <div className="chiprow">
          {[['all', 'All'], ['mine', 'Mine'], ['today', 'Today'], ['late', 'Overdue']].map(([v, l]) => (
            <button key={v} className={'chip' + (filter === v ? ' on' : '')} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {mode === 'board' ? (
        <div className="kan">
          {cols.map(([st, label, ic]) => {
            const items = list.filter((t) => t.state === st);
            return (
              <div className="kan__col" key={st}>
                <div className="kan__hd"><ion-icon name={ic} style={{ fontSize: 15 }}></ion-icon>{label}<b>{items.length}</b></div>
                {items.map((t) => {
                  const s = staffOf(t.to), late = t.state !== 'done' && t.day === 'today' && t.due < SL.now;
                  return (
                    <div className={'tcard' + (t.state === 'done' ? ' done' : '')} key={t.id}>
                      <div className="tcard__n" onClick={() => api.openTask(t)} style={{ cursor: 'pointer' }}>{t.title}</div>
                      {!!t.list.length && <div className="tcard__f"><ion-icon name="list-outline" style={{ fontSize: 14 }}></ion-icon>{t.list.length} steps</div>}
                      <div className="tcard__f">
                        <i className={'pdot ' + t.pri}></i>
                        <span className={late ? 'late' : ''}>{t.day === 'today' ? fmtS(t.due) : t.day}</span>
                        <span className="tag">{t.tag}</span>
                        <span className="sp"></span>
                        <Av s={s} size="sm" title={s.name} />
                        <button className="sbtn gh" style={{ height: 26, padding: '0 6px' }} onClick={() => api.moveTask(t.id, nextState[t.state])}>
                          <ion-icon name={t.state === 'done' ? 'refresh-outline' : 'arrow-forward-outline'}></ion-icon>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!items.length && <div className="emptybox">Empty</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <div className="panel__hd"><div><h3>{list.length} tasks</h3><p>Tick to complete · tap to edit</p></div></div>
          <div>
            {list.map((t) => <TaskRow key={t.id} t={t} api={api} />)}
            {!list.length && <div className="emptybox">Nothing here.</div>}
          </div>
        </section>
      )}
    </div>
  );
}

function TaskSheet({ task, api, onClose }) {
  const seed = task && task.seed ? { title: task.seed, to: task.to } : null;
  const t = task && task.id ? task : null;
  const [title, setTitle] = useState(t ? t.title : seed ? seed.title : '');
  const [to, setTo] = useState(t ? t.to : seed ? seed.to : api.me.id);
  const [day, setDay] = useState(t ? t.day : 'today');
  const [due, setDue] = useState(t ? t.due : 960);
  const [pri, setPri] = useState(t ? t.pri : 'med');
  const [tag, setTag] = useState(t ? t.tag : 'Floor');
  const [rep, setRep] = useState(t ? !!t.repeat : false);
  const [steps, setSteps] = useState(t ? t.list : []);
  const [step, setStep] = useState('');
  const templates = [
    { t: 'Sanitise tools', tag: 'Hygiene', pri: 'med', due: 1080, rep: true, list: ['Clippers', 'Scissors', 'Combs', 'Brushes'] },
    { t: 'Deep clean basins', tag: 'Hygiene', pri: 'med', due: 1080, rep: true, list: ['Bowls & taps', 'Drain trap', 'Neck rests'] },
    { t: 'Towel laundry run', tag: 'Floor', pri: 'low', due: 960, rep: true, list: ['Load & start', 'Fold dry batch', 'Restock stations'] },
    { t: 'Restock colour bar', tag: 'Stock', pri: 'high', due: 840, rep: false, list: ['Tubes 6N / 7N / 9N', 'Developer 20 vol', 'Foils & bowls'] },
    { t: 'Restock retail shelf', tag: 'Stock', pri: 'med', due: 600, rep: false, list: ['Count shampoo & conditioner', 'Front-face bottles', 'Flag anything under 3'] },
    { t: 'Close down station', tag: 'Floor', pri: 'med', due: 1140, rep: true, list: ['Sweep & mirror', 'Tools away', 'Chair wipe-down'] },
    { t: 'Confirm tomorrow’s bookings', tag: 'Client', pri: 'high', due: 1020, rep: true, list: ['Text unconfirmed clients', 'Check patch tests due', 'Note no-show risks'] },
    { t: 'Cash up drawer', tag: 'Admin', pri: 'high', due: 1140, rep: true, list: ['Count float', 'Record takings', 'Bag the drop'] },
  ];
  const [tpl, setTpl] = useState(null);
  const applyTpl = (x) => {
    if (tpl === x.t) { setTpl(null); setTitle(''); setSteps([]); return; }
    setTpl(x.t); setTitle(x.t); setSteps([...x.list]); setTag(x.tag); setPri(x.pri); setDue(x.due); setRep(x.rep);
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>{t ? 'Edit task' : 'Assign task'}</h3><p>{t ? 'Changes save to the shared board' : 'Everyone sees it on Today'}</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          {!t && (
            <div>
              <span className="lbl">Start from a routine</span>
              <div className="chiprow" style={{ marginTop: 8 }}>
                {templates.map((x) => (
                  <button key={x.t} className={'chip' + (tpl === x.t ? ' on' : '')} onClick={() => applyTpl(x)}>
                    {tpl === x.t && <ion-icon name="checkmark-outline"></ion-icon>}{x.t}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="flab">What needs doing</span>
            <input className="inp" value={title} onChange={(e) => { setTitle(e.target.value); setTpl(null); }} placeholder="Pick a routine above, or type a one-off" />
          </div>
          <div>
            <span className="lbl">Assign to</span>
            <div className="pickgrid" style={{ marginTop: 8, gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
              {SL.staff.map((s) => (
                <button key={s.id} className={'pk' + (to === s.id ? ' on' : '')} onClick={() => setTo(s.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Av s={s} size="sm" />
                  <div><div className="pk__n">{s.first}</div><div className="pk__m">{s.status === 'off' ? 'Off today' : 'On shift'}</div></div>
                </button>
              ))}
            </div>
          </div>
          <div className="fgrid">
            <div>
              <span className="flab">Due</span>
              <div className="chiprow">
                {[['today', 'Today'], ['Fri 14 Aug', 'Tomorrow'], ['Sat 15 Aug', 'Sat']].map(([v, l]) => (
                  <button key={v} className={'chip' + (day === v ? ' on' : '')} onClick={() => setDay(v)}>{l}</button>
                ))}
              </div>
              <div className="slots" style={{ marginTop: 8, gridTemplateColumns: 'repeat(4,1fr)' }}>
                {[...new Set([600, 780, 840, 960, 1020, 1080, 1140, due])].sort((a, b) => a - b).map((m) => (
                  <button key={m} className={'slot' + (due === m ? ' on' : '')} onClick={() => setDue(m)}>{fmtS(m)}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="flab">Priority</span>
              <div className="chiprow">
                {[['high', 'High'], ['med', 'Normal'], ['low', 'Low']].map(([v, l]) => (
                  <button key={v} className={'chip' + (pri === v ? ' on' : '')} onClick={() => setPri(v)}><i className={'pdot ' + v}></i>{l}</button>
                ))}
              </div>
              <span className="flab" style={{ marginTop: 12 }}>List</span>
              <div className="chiprow">
                {['Floor', 'Stock', 'Hygiene', 'Client', 'Admin'].map((v) => (
                  <button key={v} className={'chip' + (tag === v ? ' on' : '')} onClick={() => setTag(v)}>{v}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <span className="flab">{'Steps (optional)' + (tpl ? ' · from routine' : '')}</span>
            {steps.map((x, i) => (
              <div className="chk" key={i}><div className="box"><ion-icon name="checkmark"></ion-icon></div>{x}
                <span style={{ flex: 1 }}></span>
                <button className="sbtn gh" onClick={() => setSteps(steps.filter((_, j) => j !== i))}><ion-icon name="close-outline"></ion-icon></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input className="inp" value={step} onChange={(e) => setStep(e.target.value)} placeholder="Add a step" />
              <button className="sbtn" style={{ height: 44 }} onClick={() => { if (step.trim()) { setSteps([...steps, step.trim()]); setStep(''); } }}>Add</button>
            </div>
          </div>
          <div className="trow2">
            <div className="trow2__ic"><ion-icon name="repeat-outline"></ion-icon></div>
            <div style={{ flex: 1 }}><div className="trow2__t">Repeat daily</div><div className="trow2__d">Re-creates itself for the next shift</div></div>
            <button className={'sw2' + (rep ? ' on' : '')} onClick={() => setRep(!rep)}></button>
          </div>
        </div>
        <div className="sheet__foot">
          {t && <button className="btn danger" onClick={() => { api.delTask(t.id); onClose(); }}><ion-icon name="trash-outline"></ion-icon></button>}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!title.trim()} style={!title.trim() ? { opacity: .45 } : null}
            onClick={() => { api.saveTask({ id: t ? t.id : null, title: title.trim(), to, day, due, pri, tag, repeat: rep ? 'Daily' : null, list: steps }); onClose(); }}>
            {t ? 'Save' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Team / employees ---------------- */
function TeamView({ api }) {
  const [sel, setSel] = useState(api.staffFocus || SL.staff[0].id);
  const [add, setAdd] = useState(false);
  const [rota, setRota] = useState(false);
  const [showing, setShowing] = useState(!!api.staffFocus);
  const [q, setQ] = useState('');
  useEffect(() => { if (api.staffFocus) { setSel(api.staffFocus); setShowing(true); } }, [api.staffFocus]);
  const s = staffOf(sel);
  const list = SL.staff.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.role.toLowerCase().includes(q.toLowerCase()));
  const manager = api.role === 'manager';
  const acc = [['register', 'Take payments', 'Open the register and charge tickets'], ['discount', 'Give discounts', 'Up to 20% per ticket'],
    ['refund', 'Refunds', 'Return or void a paid ticket'], ['reports', 'See reports', 'Day totals and own performance'],
    ['roster', 'Manage rota', 'Edit shifts and approve hours']];
  const todayAppts = api.appts.filter((a) => a.staff === s.id).length;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Team</h2><p>{SL.staff.length} people · {SL.staff.filter((x) => x.status !== 'off').length} on shift today</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={() => api.toast('Invite sent — they finish their own profile on their phone')}><ion-icon name="paper-plane-outline"></ion-icon>Send invite</button>
        <button className="btn primary" onClick={() => setAdd(true)}><ion-icon name="person-add-outline"></ion-icon>Add employee</button>
      </div>

      <div className={'split' + (showing ? ' showing' : '')}>
        <section className="panel sp-list">
          <div className="panel__hd" style={{ padding: '10px 12px' }}>
            <div className="field" style={{ height: 38, flex: 1 }}>
              <ion-icon name="search-outline"></ion-icon>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team" />
            </div>
          </div>
          <div>
            {list.map((x) => (
              <button key={x.id} className={'stf' + (x.id === sel ? ' on' : '')} onClick={() => { setSel(x.id); setShowing(true); }}>
                <Av s={x} />
                <div className="stf__b"><div className="stf__n">{x.name}</div><div className="stf__r">{x.role}</div></div>
                <i className={'dotst ' + (x.status === 'in' ? 'in' : x.status === 'break' ? 'break' : '')}></i>
              </button>
            ))}
          </div>
        </section>

        <div className="sp-detail" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <section className="panel">
            <div className="prof2">
              <button className="sbtn gh back-s" onClick={() => setShowing(false)}><ion-icon name="chevron-back-outline"></ion-icon>Team</button>
              <Av s={s} size="xl" />
              <div style={{ minWidth: 0 }}>
                <div className="prof2__n">{s.name}</div>
                <div className="prof2__r">
                  <span>{s.role}</span><span>·</span><span>Since {s.since}</span>
                  <span className={'badge ' + (s.status === 'in' ? 'ok' : s.status === 'break' ? 'wrn' : '')}>
                    {s.status === 'in' ? 'On the clock' : s.status === 'break' ? 'On break' : 'Off today'}
                  </span>
                </div>
              </div>
              <div className="sp" style={{ flex: 1 }}></div>
              <div className="chiprow">
                <button className="sbtn" onClick={() => api.openTask({ seed: '', to: s.id })}><ion-icon name="add-circle-outline"></ion-icon>Assign task</button>
                <button className="sbtn" onClick={() => api.setView('time')}><ion-icon name="time-outline"></ion-icon>Hours</button>
                <button className="sbtn pri" onClick={() => api.toast('Profile editing is a manager-only flow')}><ion-icon name="create-outline"></ion-icon>Edit</button>
              </div>
            </div>
            <div className="panel__bd">
              <div className="g4">
                <div className="stat"><div className="k">Hours this week</div><div className="v">{s.week.hours}<small> / {s.week.sched}</small></div></div>
                <div className="stat"><div className="k">Appointments</div><div className="v">{s.week.appts}<small> · {todayAppts} today</small></div></div>
                <div className="stat"><div className="k">Service sales</div><div className="v">{money(s.week.sales)}</div></div>
                <div className="stat"><div className="k">Rebook rate</div><div className="v">{s.week.rebook}%</div></div>
              </div>
            </div>
          </section>

          <div className="cols2">
            <section className="panel">
              <div className="panel__hd"><div><h3>Details</h3></div></div>
              <div className="panel__bd">
                <div className="dl">
                  <div className="dlr"><span className="k">Mobile</span><span className="v num">{s.phone}</span></div>
                  <div className="dlr"><span className="k">Email</span><span className="v" style={{ fontSize: 12, fontWeight: 500 }}>{s.email}</span></div>
                  <div className="dlr"><span className="k">Register PIN</span><span className="v num">{manager ? s.pin : '••••'}</span></div>
                  <div className="dlr"><span className="k">Pay rate</span><span className="v num">{manager ? window.KZ_LOCALE.short(s.rate) + ' / hr' : 'Hidden'}</span></div>
                </div>
                <span className="lbl" style={{ display: 'block', margin: '14px 0 7px' }}>Skills</span>
                <div className="skills">{s.skills.map((k) => <span className="tag" key={k}>{k}</span>)}</div>
              </div>
            </section>
            <section className="panel">
              <div className="panel__hd"><div><h3>Access</h3><p>{manager ? 'Applies at the register' : 'Manager view can change these'}</p></div></div>
              <div className="panel__bd">
                {acc.map(([k, t2, d]) => (
                  <div className={'trow2' + (s.access[k] ? ' on' : '')} key={k}>
                    <div className="trow2__ic"><ion-icon name={s.access[k] ? 'lock-open-outline' : 'lock-closed-outline'}></ion-icon></div>
                    <div style={{ flex: 1 }}><div className="trow2__t">{t2}</div><div className="trow2__d">{d}</div></div>
                    <button className={'sw2' + (s.access[k] ? ' on' : '')} disabled={!manager}
                      onClick={() => manager && api.toggleAccess(s.id, k)}></button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="panel">
            <div className="panel__hd"><div><h3>Weekly rota</h3><p>{s.week.sched} h scheduled · 10–16 Aug</p></div>
              <div className="sp"></div>
              <button className="sbtn" disabled={!manager} onClick={() => setRota(true)}><ion-icon name="create-outline"></ion-icon><span className="lbl-h">Edit shifts</span></button>
            </div>
            <div className="panel__bd">
              <div className="rota">
                {s.shifts.map(([d, a, b]) => (
                  <div className="rrow" key={d}>
                    <span className="d">{d}</span>
                    <span className="bar">{b ? <i style={{ left: ((a - SL.open) / (SL.close - SL.open) * 100) + '%', width: ((b - a) / (SL.close - SL.open) * 100) + '%' }}></i> : null}</span>
                    <span className="h">{b ? fmtS(a) + '–' + fmtS(b) : 'Off'}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      {add && <EmployeeSheet api={api} onClose={() => setAdd(false)} onSaved={(id) => { setSel(id); setShowing(true); }} />}
      {rota && <RotaSheet s={s} api={api} onClose={() => setRota(false)} />}
    </div>
  );
}

/* ---------------- add employee ---------------- */
const ROLES = [
  { r: 'Stylist', tone: 'ind', rate: 21, acc: { register: true, discount: false, refund: false, reports: false, roster: false } },
  { r: 'Senior stylist', tone: 'pri', rate: 26, acc: { register: true, discount: true, refund: true, reports: false, roster: false } },
  { r: 'Barber', tone: 'inf', rate: 22, acc: { register: true, discount: true, refund: false, reports: false, roster: false } },
  { r: 'Colour specialist', tone: 'wrn', rate: 28, acc: { register: true, discount: true, refund: false, reports: true, roster: false } },
  { r: 'Apprentice', tone: 'mut', rate: 15, acc: { register: false, discount: false, refund: false, reports: false, roster: false } },
  { r: 'Front desk', tone: 'suc', rate: 24, acc: { register: true, discount: true, refund: true, reports: true, roster: true } },
];

const WEEK_PLAN = { 16: { d: 4, h: 4 }, 20: { d: 4, h: 5 }, 30: { d: 5, h: 6 }, 36: { d: 4, h: 9 }, 40: { d: 5, h: 8 } };
const PLAN_DAYS = { 4: ['Wed', 'Thu', 'Fri', 'Sat'], 5: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const planFor = (hours) => {
  const p = WEEK_PLAN[hours] || { d: 5, h: Math.round(hours / 5 * 2) / 2 };
  const on = PLAN_DAYS[p.d], len = p.h * 60;
  return { on, len, shifts: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => on.includes(d) ? [d, 540, 540 + len] : [d, 0, 0]) };
};

function EmployeeSheet({ api, onClose, onSaved }) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Stylist');
  const preset = ROLES.find((r) => r.r === role);
  const [rate, setRate] = useState(preset.rate);
  const [hours, setHours] = useState(36);
  const [start, setStart] = useState('Today');
  const [pin, setPin] = useState('');
  const [acc, setAcc] = useState({ ...preset.acc });
  const [svc, setSvc] = useState([]);
  const accRows = [['register', 'Take payments'], ['discount', 'Give discounts'], ['refund', 'Refunds'], ['reports', 'See reports'], ['roster', 'Manage rota']];

  const pickRole = (r) => { const p = ROLES.find((x) => x.r === r); setRole(r); setRate(p.rate); setAcc({ ...p.acc }); };
  const digits = phone.replace(/\D/g, '');
  const dupe = digits.length >= 7 && SL.staff.find((s) => s.phone.replace(/\D/g, '').slice(-7) === digits.slice(-7));
  const pinTaken = pin.length === 4 && SL.staff.some((s) => s.pin === pin);
  const init = ((first[0] || '') + (last[0] || '')).toUpperCase() || '?';
  const ok = first.trim() && digits.length >= 7 && pin.length === 4 && !pinTaken && !dupe;
  const plan = planFor(hours);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>Add employee</h3><p>Name and mobile is enough to start — the rest can wait</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          <div className="fgrid">
            <div>
              <span className="flab">First name <b style={{ color: 'var(--kz-discount)' }}>*</b></span>
              <input className="inp" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Nadia" />
            </div>
            <div>
              <span className="flab">Last name</span>
              <input className="inp" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Farouk" />
            </div>
            <div>
              <span className="flab">Mobile <b style={{ color: 'var(--kz-discount)' }}>*</b></span>
              <input className="inp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6 99 555 0000" inputMode="tel" />
            </div>
            <div>
              <span className="flab">Email</span>
              <input className="inp" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@koomzo.salon" inputMode="email" />
            </div>
          </div>
          {dupe && (
            <div className="note"><ion-icon name="alert-circle-outline"></ion-icon>
              That mobile already belongs to {dupe.name}. Open their profile instead of creating a second record.
            </div>
          )}

          <div>
            <span className="lbl">Role</span>
            <div className="chiprow" style={{ marginTop: 8 }}>
              {ROLES.map((r) => <button key={r.r} className={'chip' + (role === r.r ? ' on' : '')} onClick={() => pickRole(r.r)}>{r.r}</button>)}
            </div>
          </div>

          <div className="fgrid">
            <div>
              <span className="flab">Pay rate</span>
              <div className="chiprow">
                {[800, 1000, 1200, 1500, 1800, 2000].map((r) => <button key={r} className={'chip' + (rate === r ? ' on' : '')} onClick={() => setRate(r)}>{money(r) + '/hr'}</button>)}
              </div>
            </div>
            <div>
              <span className="flab">Contracted hours</span>
              <div className="chiprow">
                {[16, 20, 30, 36, 40].map((h) => <button key={h} className={'chip' + (hours === h ? ' on' : '')} onClick={() => setHours(h)}>{h + ' h'}</button>)}
              </div>
              <span className="flab" style={{ marginTop: 10 }}>Starts</span>
              <div className="chiprow">
                {['Today', 'Mon 17 Aug', 'Sep 1'].map((d) => <button key={d} className={'chip' + (start === d ? ' on' : '')} onClick={() => setStart(d)}>{d}</button>)}
              </div>
            </div>
          </div>

          <div>
            <span className="flab">Register PIN <b style={{ color: 'var(--kz-discount)' }}>*</b></span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="inp" value={pin} maxLength={4} inputMode="numeric" style={{ width: 120, fontFamily: 'var(--kz-font-num)', letterSpacing: '.2em' }}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" />
              <button className="sbtn" style={{ height: 44 }} onClick={() => {
                let p; do { p = String(Math.floor(1000 + Math.random() * 9000)); } while (SL.staff.some((s) => s.pin === p));
                setPin(p);
              }}><ion-icon name="shuffle-outline"></ion-icon>Suggest</button>
              {pinTaken && <span className="badge cor">Already used</span>}
            </div>
          </div>

          <div>
            <span className="lbl">Register access</span>
            <div style={{ marginTop: 4 }}>
              {accRows.map(([k, label]) => (
                <div className={'trow2' + (acc[k] ? ' on' : '')} key={k}>
                  <div className="trow2__ic"><ion-icon name={acc[k] ? 'lock-open-outline' : 'lock-closed-outline'}></ion-icon></div>
                  <div style={{ flex: 1 }}><div className="trow2__t">{label}</div></div>
                  {acc[k] !== preset.acc[k] && <span className="diff">changed</span>}
                  <button className={'sw2' + (acc[k] ? ' on' : '')} onClick={() => setAcc({ ...acc, [k]: !acc[k] })}></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="lbl">Services they can perform</span>
            <div className="chiprow" style={{ marginTop: 8 }}>
              {api.services.map((v) => (
                <button key={v.id} className={'chip' + (svc.includes(v.id) ? ' on' : '')}
                  onClick={() => setSvc(svc.includes(v.id) ? svc.filter((x) => x !== v.id) : [...svc, v.id])}>{v.name}</button>
              ))}
            </div>
          </div>

          <div className="sumbox">
            <div className="r" style={{ alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span className={'av lg ' + preset.tone}>{init}</span>
                <span>
                  <span style={{ display: 'block', font: '600 14px var(--kz-font-sans)', color: 'var(--kz-ink)' }}>{(first + ' ' + last).trim() || 'New employee'}</span>
                  <span style={{ font: '500 12px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>{role} · starts {start}</span>
                </span>
              </span>
              <b>{window.KZ_LOCALE.short(rate) + '/hr'}</b>
            </div>
            <div className="r"><span>Default week</span><b>{hours + ' h · ' + plan.on[0] + '–' + plan.on[plan.on.length - 1] + ' ' + fmtS(540) + '–' + fmtS(540 + plan.len)}</b></div>
            <div className="r"><span>Can perform</span><b>{svc.length ? svc.length + ' services' : 'None yet'}</b></div>
          </div>
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={() => { api.toast('Invite sent — they finish their own profile on their phone'); onClose(); }}>
            <ion-icon name="paper-plane-outline"></ion-icon>Let them fill it in
          </button>
          <button className="btn primary" disabled={!ok} style={!ok ? { opacity: .45 } : null}
            onClick={() => {
              const id = api.addStaff({ first: first.trim(), last: last.trim(), role, tone: preset.tone, rate, hours, start, pin, acc, svc,
                phone: phone.trim(), email: email.trim() || (first.trim().toLowerCase() + '@koomzo.salon'), init, shifts: plan.shifts });
              onSaved(id); onClose();
            }}>Add to team</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Timesheet ---------------- */
function TimesheetView({ api }) {
  const manager = api.role === 'manager';
  const [tab, setTab] = useState('mine');
  const [edit, setEdit] = useState(null);
  const rows = api.week;
  const worked = (r) => r.in == null ? 0 : ((r.out == null ? SL.now : r.out) - r.in - r.brk);
  const total = rows.reduce((s, r) => s + worked(r), 0);
  const sched = api.me.week.sched;
  const pct = Math.min(100, Math.round((total / 60 / sched) * 100));

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Timesheet</h2><p>Week 10–16 Aug · paid weekly on Tuesday</p></div>
        <div className="sp"></div>
        {manager && <Seg value={tab} options={[{ v: 'mine', label: 'My week' }, { v: 'team', label: 'Team' }]} onChange={setTab} />}
      </div>

      {tab === 'mine' ? (
        <div className="two">
          <section className="panel">
            <div className="panel__hd"><div><h3>My hours</h3><p>Tap a day to fix a mistake — the change goes to {staffOf('s5').first} to approve</p></div></div>
            <div className="tsrow hd"><span>Day</span><span>In</span><span>Out</span><span className="hide-s">Break</span><span style={{ textAlign: 'right' }}>Total</span><span className="hide-s"></span></div>
            {rows.map((r, i) => {
              const w = worked(r);
              return (
                <div className={'tsrow' + (SL.days[i].today ? ' today' : '')} key={r.d}>
                  <div className="d">{r.d}<small>{SL.days[i].date}</small></div>
                  <div className={'t' + (r.in == null ? ' off' : '')}>{r.in == null ? (r.note || '—') : fmt(r.in)}</div>
                  <div className={'t' + (r.out == null ? ' off' : '')}>{r.out == null ? (r.in == null ? '' : 'Running') : fmt(r.out)}</div>
                  <div className="t hide-s" style={{ color: 'var(--kz-muted-2)' }}>{r.brk ? r.brk + 'm' : '—'}</div>
                  <div className="tot">{w ? hrs(w) : '—'}</div>
                  <button className="sbtn gh hide-s" onClick={() => setEdit(i)}><ion-icon name="create-outline"></ion-icon></button>
                </div>
              );
            })}
            <div className="tsfoot">
              <div>
                <div className="lbl">Week to date</div>
                <div className="big">{hrs(total)} <span style={{ font: '500 13px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>of {sched} h</span></div>
                <div className="pbar" style={{ width: 180, marginTop: 7 }}><i style={{ width: pct + '%' }}></i></div>
              </div>
              <div className="sp"></div>
              <button className="btn" onClick={() => api.toast('Correction request sent to Sam')}><ion-icon name="alert-circle-outline"></ion-icon>Report an issue</button>
              <button className="btn primary" onClick={() => api.toast('Week submitted for approval')}><ion-icon name="paper-plane-outline"></ion-icon>Submit week</button>
            </div>
          </section>
          <aside className="sidecol">
            <ClockCard api={api} />
            <section className="panel">
              <div className="panel__hd"><div><h3>This week</h3></div></div>
              <div className="panel__bd">
                <div className="dl">
                  <div className="dlr"><span className="k">Worked</span><span className="v num">{dec(total)} h</span></div>
                  <div className="dlr"><span className="k">Scheduled</span><span className="v num">{sched.toFixed(2)} h</span></div>
                  <div className="dlr"><span className="k">Breaks</span><span className="v num">{rows.reduce((s, r) => s + r.brk, 0)} min</span></div>
                  <div className="dlr"><span className="k">Est. pay</span><span className="v num">{money(Math.round(total / 60 * api.me.rate))}</span></div>
                </div>
                <div className="note info" style={{ marginTop: 12 }}>
                  <ion-icon name="information-circle-outline"></ion-icon>
                  Clock in from any device on the salon wifi. Forgotten clock-outs are capped at your shift end.
                </div>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <section className="panel">
          <div className="panel__hd">
            <div><h3>Team hours</h3><p>{api.team.filter((r) => r.state === 'pending').length} pending approval</p></div>
            <div className="sp"></div>
            <button className="btn primary" onClick={api.approveAll}><ion-icon name="checkmark-done-outline"></ion-icon>Approve all</button>
          </div>
          <div className="tmrow hd"><span>Employee</span><span className="hide-s">Hours</span><span className="hide-s">Overtime</span><span>Status</span><span></span></div>
          {api.team.map((r) => {
            const s = staffOf(r.id);
            return (
              <div className="tmrow" key={r.id}>
                <div className="who"><Av s={s} /><div style={{ minWidth: 0 }}><div className="n">{s.name}</div><div className="r">{s.role}</div></div></div>
                <div className="num hide-s">{r.hours.toFixed(1)} h</div>
                <div className="num hide-s" style={{ color: r.ot ? 'var(--kz-warning)' : 'var(--kz-muted-3)' }}>{r.ot ? '+' + r.ot + ' h' : '—'}</div>
                <div>
                  <span className={'badge ' + (r.state === 'approved' ? 'ok' : r.flags ? 'wrn' : '')}>
                    {r.state === 'approved' ? 'Approved' : r.flags ? 'Check clock-out' : 'Pending'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {r.state === 'pending'
                    ? <button className="sbtn pri" onClick={() => api.approve(r.id)}>Approve</button>
                    : <button className="sbtn gh" onClick={() => api.toast('Approval reopened for ' + s.first)}>Reopen</button>}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {edit != null && <TimeEditSheet row={rows[edit]} day={SL.days[edit]} api={api} onClose={() => setEdit(null)} />}
    </div>
  );
}

function TimeEditSheet({ row, day, api, onClose }) {
  const [inM, setInM] = useState(row.in);
  const [outM, setOutM] = useState(row.out);
  const [brk, setBrk] = useState(row.brk);
  const [why, setWhy] = useState('');
  const opts = (base) => [base - 30, base - 15, base, base + 15, base + 30].filter((m) => m > 0);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>Fix {day.d} {day.date}</h3><p>Corrections need a reason — {staffOf('s5').first} approves them</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          <div>
            <span className="flab">Clock in</span>
            <div className="slots">
              {opts(row.in || 540).map((m) => <button key={m} className={'slot' + (inM === m ? ' on' : '')} onClick={() => setInM(m)}>{fmtS(m)}</button>)}
            </div>
          </div>
          <div>
            <span className="flab">Clock out</span>
            <div className="slots">
              {opts(row.out || 1020).map((m) => <button key={m} className={'slot' + (outM === m ? ' on' : '')} onClick={() => setOutM(m)}>{fmtS(m)}</button>)}
            </div>
          </div>
          <div>
            <span className="flab">Unpaid break</span>
            <div className="chiprow">
              {[0, 15, 30, 45].map((m) => <button key={m} className={'chip' + (brk === m ? ' on' : '')} onClick={() => setBrk(m)}>{m ? m + ' min' : 'None'}</button>)}
            </div>
          </div>
          <div>
            <span className="flab">Reason</span>
            <div className="chiprow">
              {['Forgot to clock out', 'Covered a late client', 'Wrong device', 'Started early'].map((r) => (
                <button key={r} className={'chip' + (why === r ? ' on' : '')} onClick={() => setWhy(r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className="sumbox">
            <div className="r"><span>Corrected total</span><b>{inM && outM ? hrs(outM - inM - brk) : '—'}</b></div>
            <div className="r"><span>Was</span><b>{row.in && row.out ? hrs(row.out - row.in - row.brk) : 'Running'}</b></div>
          </div>
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!why} style={!why ? { opacity: .45 } : null}
            onClick={() => { api.fixDay(day.d, { in: inM, out: outM, brk }); onClose(); }}>Send for approval</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TasksView, TaskSheet, TeamView, TimesheetView, TimeEditSheet, EmployeeSheet, RotaSheet });

/* ---------------- weekly rota editor ---------------- */
const SHIFT_PRESETS = [
  { label: 'Open', s: 540, e: 1020 },
  { label: 'Mid', s: 600, e: 1080 },
  { label: 'Close', s: 660, e: 1140 },
  { label: 'Short', s: 600, e: 900 },
];

function RotaSheet({ s, api, onClose }) {
  const [rows, setRows] = useState(s.shifts.map(([d, a, b]) => [d, a, b]));
  const [open, setOpen] = useState(null);
  const total = rows.reduce((n, [, a, b]) => n + (b ? b - a : 0), 0) / 60;
  const delta = +(total - s.week.sched).toFixed(1);
  const set = (d, a, b) => setRows((c) => c.map((r) => r[0] === d ? [d, a, b] : r));
  const cover = (d) => SL.staff.filter((x) => x.id !== s.id && (x.shifts.find((r) => r[0] === d) || [])[2]).length;

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>{s.first}’s shifts</h3><p>Week 10–16 Aug · changes apply from next Monday</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          <div className="rota">
            {rows.map(([d, a, b]) => (
              <div key={d}>
                <div className="rrow2">
                  <span className="d">{d}</span>
                  <button className={'daytog' + (b ? ' on' : '')} onClick={() => b ? set(d, 0, 0) : set(d, 540, 1020)}>
                    <ion-icon name={b ? 'checkmark-outline' : 'close-outline'}></ion-icon>{b ? 'Working' : 'Off'}
                  </button>
                  <button className="bar edit" onClick={() => b && setOpen(open === d ? null : d)} disabled={!b}>
                    {b ? <i style={{ left: ((a - SL.open) / (SL.close - SL.open) * 100) + '%', width: ((b - a) / (SL.close - SL.open) * 100) + '%' }}></i> : null}
                  </button>
                  <span className="h">{b ? fmtS(a) + '–' + fmtS(b) : '—'}</span>
                  <span className="hh">{b ? ((b - a) / 60).toFixed(1) + ' h' : ''}</span>
                </div>
                {open === d && b && (
                  <div className="shedit">
                    <div className="chiprow">
                      {SHIFT_PRESETS.map((p) => (
                        <button key={p.label} className={'chip' + (a === p.s && b === p.e ? ' on' : '')} onClick={() => set(d, p.s, p.e)}>
                          {p.label + ' · ' + fmtS(p.s) + '–' + fmtS(p.e)}
                        </button>
                      ))}
                    </div>
                    <div className="fgrid" style={{ marginTop: 10 }}>
                      <div>
                        <span className="flab">Starts</span>
                        <div className="slots" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))' }}>
                          {[540, 570, 600, 630, 660].map((m) => (
                            <button key={m} className={'slot' + (a === m ? ' on' : '')} disabled={m >= b} onClick={() => set(d, m, b)}>{fmtS(m)}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="flab">Ends</span>
                        <div className="slots" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))' }}>
                          {[900, 960, 1020, 1080, 1140].map((m) => (
                            <button key={m} className={'slot' + (b === m ? ' on' : '')} disabled={m <= a} onClick={() => set(d, a, m)}>{fmtS(m)}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="cov">
                      <ion-icon name="people-outline"></ion-icon>
                      {cover(d) ? cover(d) + ' other' + (cover(d) > 1 ? 's' : '') + ' on the floor this day' : 'Nobody else is scheduled — ' + s.first + ' would be alone'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="chiprow">
            <button className="sbtn" onClick={() => setRows(s.shifts.map(([d, a, b]) => [d, a, b]))}><ion-icon name="refresh-outline"></ion-icon>Reset</button>
            <button className="sbtn" onClick={() => setRows(rows.map(([d, a, b]) => b ? [d, a, b] : [d, 540, 1020]))}><ion-icon name="copy-outline"></ion-icon>Fill week 9a–5p</button>
          </div>
          <div className="sumbox">
            <div className="r big"><span>Scheduled hours</span><b>{total.toFixed(1)} h</b></div>
            <div className="r"><span>Contracted</span><b>{s.week.sched} h</b></div>
            <div className="r"><span>Difference</span><b style={{ color: delta > 0 ? 'var(--kz-warning)' : delta < 0 ? 'var(--kz-discount)' : 'var(--kz-success)' }}>
              {delta > 0 ? '+' + delta + ' h overtime' : delta < 0 ? delta + ' h under' : 'Exact match'}</b></div>
            <div className="r"><span>Days on</span><b>{rows.filter((r) => r[2]).length} of 7</b></div>
          </div>
          {delta > 0 && (
            <div className="note"><ion-icon name="alert-circle-outline"></ion-icon>
              Over contract by {delta} h — payroll treats the excess as overtime.
            </div>
          )}
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => { api.saveShifts(s.id, rows, total); onClose(); }}>
            <ion-icon name="checkmark-outline"></ion-icon>Save rota
          </button>
        </div>
      </div>
    </div>
  );
}
