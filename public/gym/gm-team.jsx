/* Koomzo Gym — TRAINERS & PAY. What a trainer earned, computed from signed
   sessions and class attendance, never typed. A trainer signing in sees only
   their own row: pay is private. */

function TeamView({ api }) {
  const st = api.st;
  const me = api.me;
  const mine = /trainer|therapist/i.test(me.role);
  const people = mine ? GM.staff.filter((s) => s.id === me.id) : GM.staff.filter((s) => s.split > 0);
  const [tab, setTab] = useState('pay');

  /* every figure below is derived from the day's work — the ledger is a view, not a form */
  const earn = (s) => {
    const done = st.pt.filter((p) => p.trainer === s.id && p.state === 'done');
    const shows = st.pt.filter((p) => p.trainer === s.id && p.state === 'noshow' && p.charged);
    const classes = st.classes.filter((c) => c.trainer === s.id && c.state === 'done');
    const fees = done.reduce((a, p) => a + p.fee, 0);
    const noshowFees = shows.reduce((a, p) => a + p.fee, 0);
    const bonusClasses = classes.filter((c) => c.in >= 15);
    return {
      done: done.length, shows: shows.length, classes: classes.length,
      fees, noshowFees,
      commission: Math.round((fees + noshowFees) * s.split),
      bonus: bonusClasses.length * 10000,
      bonusClasses: bonusClasses.length,
      total: s.base + Math.round((fees + noshowFees) * s.split) + bonusClasses.length * 10000,
    };
  };
  const grand = people.reduce((a, s) => a + earn(s).total, 0);

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>{mine ? 'My pay' : 'Trainers & pay'}</h2><p>{GM.month} to date · base plus a share of every signed session</p></div>
        <div className="sp"></div>
        {!mine && <button className="btn" onClick={() => api.exportPayout(grand)}><ion-icon name="download-outline"></ion-icon>Export payout · SYSCOHADA</button>}
      </div>

      {!mine && (
        <div className="kpis">
          <div className="kpi"><div className="k">Sessions signed today</div><div className="v">{st.pt.filter((p) => p.state === 'done').length}</div></div>
          <div className="kpi"><div className="k">Classes taught</div><div className="v">{st.classes.filter((c) => c.state === 'done').length}</div></div>
          <div className="kpi"><div className="k">Session revenue</div><div className="v">{xaf(st.pt.filter((p) => p.state === 'done').reduce((a, p) => a + p.fee, 0))}</div></div>
          <div className="kpi"><div className="k">Payout this month</div><div className="v" style={{ color:'var(--kz-success)' }}>{xaf(grand)}</div></div>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <GmSeg value={tab} onChange={setTab} options={[
          { v:'pay', label:'Payout', n:people.length },
          { v:'ledger', label:'Session ledger', n:st.pt.filter((p) => p.state !== 'cancelled').length },
        ]} />
      </div>

      {tab === 'pay' && (
        <>
          <div className="gmnote"><ion-icon name="shield-checkmark-outline"></ion-icon>
            A commission exists only against a session the member's check-in signed off. A no-show charged
            under the {GM.cancelWindow}-hour rule pays the trainer too — the hour was held.
          </div>
          {people.map((s) => {
            const e = earn(s);
            return (
              <div className="gmpay" key={s.id}>
                <div className="gmpay__h">
                  <span className="gmhit__ph" style={{ width: 34, height: 34, fontSize: 12 }}>{s.init}</span>
                  <b>{s.name}<span style={{ display:'block', font:'500 11.5px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>{s.role} · {Math.round(s.split * 100)}% split</span></b>
                  <span className="badge pri">{e.done} signed</span>
                  {!mine && <button className="btn" onClick={() => api.openTrainer(s.id)}><ion-icon name="calendar-outline"></ion-icon>Roster</button>}
                </div>
                <div className="gmpay__g">
                  <div className="gmpay__c"><span>Base</span><b>{xaf(s.base)}</b></div>
                  <div className="gmpay__c"><span>Sessions</span><b>{e.done}{e.shows ? ' + ' + e.shows + ' no-show' : ''}</b></div>
                  <div className="gmpay__c"><span>Session revenue</span><b>{xaf(e.fees + e.noshowFees)}</b></div>
                  <div className="gmpay__c"><span>Commission {Math.round(s.split * 100)}%</span><b>{xaf(e.commission)}</b></div>
                  <div className="gmpay__c"><span>Class bonus</span><b>{e.bonusClasses ? xaf(e.bonus) : '—'}</b></div>
                  <div className="gmpay__c"><span>To pay</span><b className="pay">{xaf(e.total)}</b></div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === 'ledger' && (
        <div className="table">
          {st.pt.filter((p) => p.state !== 'cancelled' && (!mine || p.trainer === me.id)).map((p) => {
            const m = memberOf(p.mid);
            const s = staffOf(p.trainer);
            const paid = p.state === 'done' || (p.state === 'noshow' && p.charged);
            return (
              <div className="trw" key={p.id}>
                <span className="gmnum" style={{ width: 92 }}>{p.from}–{p.to}</span>
                <span style={{ flex: 1, font:'700 13px var(--kz-font-sans)' }}>{m ? m.name : '—'}</span>
                <span style={{ flex: 1, font:'500 12.5px var(--kz-font-sans)', color:'var(--kz-muted)' }}>{s.name}</span>
                <span style={{ width: 96, font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>{roomOf(p.room).name}</span>
                <span className={'gmstate ' + (p.state === 'done' ? 'active' : p.state === 'noshow' ? 'expired' : 'frozen')}><i></i>
                  {p.state === 'done' ? (p.signed ? 'Signed' : 'Done') : p.state === 'noshow' ? 'No-show' : 'Booked'}
                </span>
                <span className="gmnum" style={{ width: 88, textAlign:'right' }}>{xaf(p.fee)}</span>
                <span className="gmnum" style={{ width: 88, textAlign:'right', color: paid ? 'var(--kz-success)' : 'var(--kz-muted-3)' }}>
                  {paid ? xaf(Math.round(p.fee * s.split)) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- a trainer's day, and their availability ---------- */
function TrainerSheet({ sid, api, onClose }) {
  const st = api.st;
  const s = staffOf(sid);
  const day = [...st.pt.filter((p) => p.trainer === sid && p.state !== 'cancelled').map((p) => ({ at:p.from, to:p.to, what: (memberOf(p.mid) || {}).name || '—', kind:'1-on-1', state:p.state })),
    ...st.classes.filter((c) => c.trainer === sid).map((c) => ({ at:c.from, to:c.to, what:c.name, kind:'class', state:c.state }))]
    .sort((a, b) => mins(a.at) - mins(b.at));
  return (
    <GmSheet wide title={s.name} sub={s.role + ' · ' + Math.round(s.split * 100) + '% of every signed session'} onClose={onClose}>
      <div className="gmtt">
        {day.map((d, i) => (
          <div className={'gmslot ' + (d.state === 'done' ? 'done' : d.state === 'running' ? 'running' : '')} key={i}>
            <div className="gmslot__t">{d.at}<span>{d.to}</span></div>
            <div className="gmslot__b">
              <div className="gmslot__n">{d.what}</div>
              <div className="gmslot__m"><span>{d.kind === 'class' ? 'Class' : 'One-to-one'}</span></div>
            </div>
            <span className={'gmstate ' + (d.state === 'done' ? 'active' : d.state === 'noshow' ? 'expired' : 'frozen')}><i></i>{d.state === 'noshow' ? 'No-show' : d.state}</span>
          </div>
        ))}
        {!day.length && <div className="gmnote"><ion-icon name="moon-outline"></ion-icon>Nothing booked today.</div>}
      </div>
    </GmSheet>
  );
}

Object.assign(window, { TeamView, TrainerSheet });
