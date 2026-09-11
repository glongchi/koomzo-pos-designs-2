/* Koomzo Hotel — Team. One rail item, two reads of the same roster:
   the week (who works when, editable) and the day (who covers which shift).
   Cleaning stays its own screen — that is work on rooms, this is work by people. */

const DEPTS = ['Front desk', 'Housekeeping', 'Maintenance', 'Restaurant', 'Security'];
const weekLabel = HT.week[0][1] + '–' + HT.week[6][1] + ' ' + HT.month;
const hoursOf = (roster) => roster.reduce((n, c) => n + shiftOf(c).hours, 0);
const canEdit = (me) => !!(me.access && (me.access.setup || /manager|Reception/i.test(me.role)));

function Who({ s, sub }) {
  return (
    <>
      <div className={'av ' + s.tone}>{s.init}</div>
      <div style={{ minWidth: 0 }}>
        <div className="nm">{s.name}</div>
        <div className="ar">{sub || s.role}</div>
      </div>
    </>
  );
}

function TeamView({ api }) {
  const [tab, setTab] = useState('week');
  const [day, setDay] = useState(HT.todayIdx);
  const team = api.team;
  const edit = canEdit(api.me);
  const late = team.filter((s) => worksShift(s.roster[HT.todayIdx]) && s.clock === 'late');

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Team</h2><p>Week {weekLabel} · {team.length} staff · {hoursOf(team.flatMap((s) => s.roster))} hours planned</p></div>
        <div className="sp"></div>
        {edit && <button className="btn" onClick={() => api.openStaff(null)}><ion-icon name="person-add-outline"></ion-icon>Add staff</button>}
        {edit && (api.published
          ? <button className="btn" disabled><ion-icon name="checkmark-outline"></ion-icon>Published</button>
          : <button className="btn primary" onClick={api.publishWeek}><ion-icon name="paper-plane-outline"></ion-icon>Publish week</button>)}
      </div>

      <div style={{ marginBottom: 12 }}>
        <HtSeg value={tab} onChange={setTab} options={[{ v:'week', label:'Week roster' }, { v:'day', label:'Shift board' }]} />
      </div>

      {late.length > 0 && (
        <div className="htbanner">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <span><b>{late.length} not clocked in.</b> {late.map((s) => s.name + ' — ' + shiftOf(s.roster[HT.todayIdx]).name.toLowerCase() + ' from ' + shiftOf(s.roster[HT.todayIdx]).time.split(' ')[0]).join(' · ')}</span>
          <div className="sp"></div>
          <button className="sbtn" onClick={() => api.toast('Reminder sent')}>Remind</button>
        </div>
      )}

      {tab === 'week' ? <WeekRoster api={api} edit={edit} /> : <ShiftBoard api={api} day={day} setDay={setDay} edit={edit} />}
    </div>
  );
}

/* ---------------- the week: one scannable table, every cell writable ---------------- */
function WeekRoster({ api, edit }) {
  const [dept, setDept] = useState('all');
  const team = api.team, day = HT.todayIdx;
  const staff = team.filter((s) => dept === 'all' || s.dept === dept);
  const onToday = team.filter((s) => worksShift(s.roster[day]));
  const leave = team.filter((s) => s.roster[day] === 'L');
  const chips = [['all', 'Everyone', team.length]].concat(
    DEPTS.map((d) => [d, d, team.filter((s) => s.dept === d).length]).filter((c) => c[2] > 0));

  return (
    <>
      <div className="htkpi">
        <div className="htk"><div className="k">On shift today</div><div className="v">{onToday.length}<small> · of {team.length}</small></div><div className="s">{HT.week[day][0]} {HT.week[day][1]} {HT.month} 2026</div></div>
        <div className="htk"><div className="k">Clocked in</div><div className="v">{team.filter((s) => s.clock && s.clock !== 'late').length}</div><div className="s">{team.filter((s) => s.clock === 'late').length} outstanding</div></div>
        <div className="htk"><div className="k">Off today</div><div className="v">{team.filter((s) => s.roster[day] === 'O').length}</div><div className="s">Rest days</div></div>
        <div className="htk"><div className="k">On leave</div><div className="v">{leave.length}</div><div className="s">{leave.length ? leave.map((s) => s.first).join(', ') : 'None booked'}</div></div>
      </div>

      <div className="htchips" style={{ marginBottom: 10, alignItems: 'center' }}>
        {chips.map(([id, label, n]) => (
          <button key={id} className={'htchip' + (dept === id ? ' on' : '')} onClick={() => setDept(id)}>{label}<b style={{ opacity: .7 }}>{n}</b></button>
        ))}
        {edit && <><div className="sp" style={{ flex: 1 }}></div>
          <span style={{ font: '500 11.5px var(--kz-font-sans)', color: 'var(--kz-muted-3)' }}>Tap any day to change a shift</span></>}
      </div>

      <div className="htros">
        <table className="httable">
          <thead><tr>
            <th>Staff</th><th>Department</th><th>Phone</th>
            {HT.week.map(([d, n], i) => <th key={d} className={'d' + (i === day ? ' now' : '')}>{d}<small>{n}</small></th>)}
            <th className="n">Hours</th><th>Today</th>
          </tr></thead>
          <tbody>
            {staff.map((s) => {
              const code = s.roster[day], def = shiftOf(code);
              const today = s.clock && s.clock !== 'late' ? 'In ' + s.clock.replace('in ', '')
                : s.clock === 'late' ? 'Not clocked in'
                : code === 'O' ? 'Off' : code === 'L' ? 'On leave' : 'Due ' + def.time.split(' ')[0];
              return (
                <tr key={s.id}>
                  <td onClick={() => edit && api.openStaff(s.id)} style={{ cursor: edit ? 'pointer' : 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Who s={s} sub={s.role} /></div>
                  </td>
                  <td style={{ color: 'var(--kz-muted-2)' }}>{s.dept}<div style={{ font: '500 11px var(--kz-font-sans)', color: 'var(--kz-muted-3)' }}>{s.area}</div></td>
                  <td style={{ font: '500 12.5px var(--kz-font-num)', color: 'var(--kz-muted-2)', whiteSpace: 'nowrap' }}>{s.phone}</td>
                  {s.roster.map((c, i) => (
                    <td key={i} className={'d' + (i === day ? ' now' : '')}>
                      <button className={'htsh ' + (c === 'O' ? 'off' : c === 'L' ? 'leave' : 'work') + (edit ? ' can' : '')}
                        disabled={!edit} onClick={() => api.openShift(s.id, i)}
                        title={edit ? 'Change ' + s.first + '\u2019s ' + HT.week[i][0] + ' shift' : shiftOf(c).name + ' · ' + shiftOf(c).time}>
                        {c === 'O' ? '·' : c}
                      </button>
                    </td>
                  ))}
                  <td className="n">{hoursOf(s.roster)}</td>
                  <td><span className="htst"><i className={'htdot ' + (s.clock === 'late' ? 'ooo' : s.clock ? 'vac' : '')}></i>{today}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="htlegend" style={{ marginTop: 10 }}>
        {HT.shiftDefs.map((d) => <span key={d.code}><span className={'htsh ' + (d.code === 'O' ? 'off' : d.code === 'L' ? 'leave' : 'work')}>{d.code === 'O' ? '·' : d.code}</span>{d.name}{d.hours ? ' · ' + d.time : ''}</span>)}
      </div>
    </>
  );
}

/* ---------------- the day: three shifts, coverage against target ---------------- */
function ShiftBoard({ api, day, setDay, edit }) {
  const team = api.team;
  const shifts = HT.shiftDefs.filter((d) => worksShift(d.code));
  const resting = team.filter((s) => !worksShift(s.roster[day]));

  return (
    <>
      <div className="htchips" style={{ marginBottom: 12 }}>
        {HT.week.map(([d, n], i) => (
          <button key={d} className={'htchip' + (day === i ? ' on' : '')} onClick={() => setDay(i)}>
            {d} {n}{i === HT.todayIdx && <b style={{ opacity: .7 }}>today</b>}
          </button>
        ))}
      </div>

      <div className="htsb">
        {shifts.map((sh) => {
          const need = HT.cover[sh.code] || {};
          const people = onShift(team, sh.code, day);
          const groups = DEPTS.filter((d) => need[d] || people.some((p) => p.dept === d));
          const live = sh.code === 'A' && day === HT.todayIdx;
          return (
            <div className="htsb__col" key={sh.code}>
              <div className="htsb__hd">
                <h4>{sh.name}</h4>
                <small>{sh.time}</small>
                <div className="sp"></div>
                {live ? <span className="badge">On now</span> : <small>{people.length} on</small>}
              </div>
              {groups.map((d) => {
                const mine = people.filter((p) => p.dept === d);
                const short = Math.max(0, (need[d] || 0) - mine.length);
                return (
                  <div className="htsb__grp" key={d}>
                    <div className="htsb__gh">{d}<div className="sp"></div>
                      <b className={short ? 'short' : ''}>{mine.length}{need[d] ? '/' + need[d] : ''}</b></div>
                    {mine.map((p) => (
                      <div className="htsb__p" key={p.id} onClick={() => edit && api.openShift(p.id, day)}
                        style={{ cursor: edit ? 'pointer' : 'default' }}>
                        <Who s={p} sub={p.area} />
                        <div className="sp" style={{ flex: 1 }}></div>
                        {p.clock === 'late' && day === HT.todayIdx && <span className="badge cor">Late</span>}
                        {p.clock && p.clock !== 'late' && day === HT.todayIdx && <i className="htdot vac" title={'Clocked ' + p.clock}></i>}
                      </div>
                    ))}
                    {short > 0 && (
                      <div className="htsb__gap"><ion-icon name="alert-circle-outline"></ion-icon>{short} short
                        {edit && <button className="sbtn" style={{ marginLeft: 6 }}
                          onClick={() => api.openShift(null, day, sh.code, d)}>Assign someone</button>}</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel__hd"><div><h3>Not on duty</h3><p>{resting.length} resting or on leave this day</p></div></div>
        <div style={{ padding: '4px 14px 14px' }}>
          <div className="htsb__off">
            {resting.map((s) => (
              <button className="htchip" key={s.id} onClick={() => edit ? api.openShift(s.id, day) : api.toast(s.first + ' is ' + (s.roster[day] === 'L' ? 'on leave' : 'off') + ' this day')}>
                {s.name} · {s.roster[day] === 'L' ? 'leave' : 'off'}
              </button>
            ))}
            {!resting.length && <span style={{ font: '500 12.5px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>Everyone is rostered today.</span>}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- write a single cell ---------------- */
function ShiftSheet({ uid, day, api, onClose }) {
  const [who, setWho] = useState(uid);
  const s = api.team.find((x) => x.id === who);
  const cur = s ? s.roster[day] : 'O';
  return (
    <HtSheet title={s ? s.first + ' · ' + HT.week[day][0] + ' ' + HT.week[day][1] + ' ' + HT.month : 'Assign a shift'}
      sub={s ? s.role + ' · ' + s.dept : 'Pick who works ' + HT.week[day][0]}
      onClose={onClose}
      foot={[<button key="c" className="btn" onClick={onClose}>Close</button>]}>
      {!uid && (
        <div style={{ marginBottom: 14 }}>
          <span className="lbl">Who</span>
          <div className="field" style={{ marginTop: 7 }}><ion-icon name="person-outline"></ion-icon>
            <select value={who || ''} onChange={(e) => setWho(e.target.value)}>
              <option value="">Choose someone…</option>
              {api.team.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.dept} · {shiftOf(p.roster[day]).name}</option>)}
            </select></div>
        </div>
      )}
      {s && (
        <div className="htshpick">
          {HT.shiftDefs.map((d) => (
            <button key={d.code} className={'htshopt' + (cur === d.code ? ' on' : '')}
              onClick={() => { api.setShift(s.id, day, d.code); api.toast(s.first + ' · ' + HT.week[day][0] + ' → ' + d.name); onClose(); }}>
              <span className={'htsh ' + (d.code === 'O' ? 'off' : d.code === 'L' ? 'leave' : 'work')}>{d.code === 'O' ? '·' : d.code}</span>
              <div style={{ minWidth: 0 }}>
                <div className="nm">{d.name}</div>
                <div className="ar">{d.time}</div>
              </div>
              {cur === d.code && <ion-icon name="checkmark-outline" style={{ marginLeft: 'auto', fontSize: 17 }}></ion-icon>}
            </button>
          ))}
        </div>
      )}
      {s && <p className="htnote">Changing a shift unpublishes the week — publish again to notify the team.</p>}
    </HtSheet>
  );
}

/* ---------------- add / edit a person ---------------- */
function StaffSheet({ uid, api, onClose }) {
  const ex = uid ? api.team.find((x) => x.id === uid) : null;
  const [f, setF] = useState(ex || { name:'', role:'', dept:'Front desk', phone:'+237 ', area:'', roster:['O','O','O','O','O','O','O'] });
  const set = (k, v) => setF((c) => ({ ...c, [k]: v }));
  const ok = f.name.trim().length > 2 && f.role.trim().length > 1;
  return (
    <HtSheet title={ex ? ex.name : 'Add staff'} sub={ex ? 'Edit details and this week\u2019s shifts' : 'They appear on the roster straight away'}
      onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="s" className="btn primary" disabled={!ok}
          onClick={() => { if (ex) { api.setWeek(ex.id, f.roster); api.toast(ex.first + ' updated'); } else api.addStaff(f); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>{ex ? 'Save' : 'Add to roster'}</button>,
      ]}>
      {!ex && <>
        <div className="fgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
          <div>
            <span className="lbl">Full name</span>
            <div className="field" style={{ marginTop: 7 }}><ion-icon name="person-outline"></ion-icon>
              <input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Estelle Nguemo" /></div>
          </div>
          <div>
            <span className="lbl">Mobile</span>
            <div className="field" style={{ marginTop: 7 }}><ion-icon name="call-outline"></ion-icon>
              <input value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+237 6 …" /></div>
          </div>
        </div>
        <div className="fgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12, marginTop: 12 }}>
          <div>
            <span className="lbl">Department</span>
            <div className="field" style={{ marginTop: 7 }}><ion-icon name="business-outline"></ion-icon>
              <select value={f.dept} onChange={(e) => set('dept', e.target.value)}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          </div>
          <div>
            <span className="lbl">Role</span>
            <div className="field" style={{ marginTop: 7 }}><ion-icon name="briefcase-outline"></ion-icon>
              <input value={f.role} onChange={(e) => set('role', e.target.value)} placeholder="Receptionist" /></div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <span className="lbl">Area</span>
          <div className="field" style={{ marginTop: 7 }}><ion-icon name="location-outline"></ion-icon>
            <input value={f.area} onChange={(e) => set('area', e.target.value)} placeholder="Reception" /></div>
        </div>
      </>}
      <div style={{ marginTop: 14 }}>
        <span className="lbl">This week</span>
        <div className="htwkedit" style={{ marginTop: 8 }}>
          {HT.week.map(([d, n], i) => (
            <div className="htwkedit__d" key={d}>
              <span>{d}<small>{n}</small></span>
              <div className="htwkedit__r">
                {HT.shiftDefs.map((sd) => (
                  <button key={sd.code} className={'htsh ' + (sd.code === 'O' ? 'off' : sd.code === 'L' ? 'leave' : 'work') + (f.roster[i] === sd.code ? ' on' : '')}
                    onClick={() => set('roster', f.roster.map((x, j) => j === i ? sd.code : x))} title={sd.name}>
                    {sd.code === 'O' ? '·' : sd.code}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="htnote">{hoursOf(f.roster)} hours across the week.</p>
    </HtSheet>
  );
}

Object.assign(window, { TeamView, WeekRoster, ShiftBoard, ShiftSheet, StaffSheet, Who });
