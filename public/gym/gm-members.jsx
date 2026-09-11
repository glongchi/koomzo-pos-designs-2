/* Koomzo Gym — MEMBERS. The register of who belongs, on what plan, and what the
   club is owed. Freeze and transfer are club rules, so they are forms with a
   stated consequence, never a silent edit. */

function MembersView({ api }) {
  const st = api.st;
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();

  const rows = st.members.filter((m) => {
    if (term && m.name.toLowerCase().indexOf(term) < 0) return false;
    if (tab === 'due') return m.state === 'due' || m.state === 'expired';
    if (tab === 'frozen') return m.state === 'frozen';
    if (tab === 'co') return !!m.co;
    return true;
  });
  const owed = st.members.reduce((s, m) => s + m.tab, 0);
  const held = st.members.reduce((s, m) => s + m.wallet, 0);

  if (tab === 'accounts') return <CompaniesView api={api} onBack={() => setTab('all')} />;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Members</h2><p>{st.members.length} on the book · {st.members.filter((m) => m.state === 'active').length} active</p></div>
        <div className="sp"></div>
        <input className="gmscan__in" style={{ height: 40, width: 210, paddingLeft: 14 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name" />
        <button className="btn primary" onClick={() => api.openNew('')}><ion-icon name="person-add-outline"></ion-icon>New member</button>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="k">Active</div><div className="v">{st.members.filter((m) => m.state === 'active').length}</div></div>
        <div className="kpi"><div className="k">Renewal due</div><div className="v">{st.members.filter((m) => m.state === 'due' || m.state === 'expired').length}</div></div>
        <div className="kpi"><div className="k">Frozen</div><div className="v">{st.members.filter((m) => m.state === 'frozen').length}</div></div>
        {gate('wallet') && <div className="kpi"><div className="k">Wallets held</div><div className="v">{xaf(held)}</div></div>}
        {gate('tab') && <div className="kpi"><div className="k">On account</div><div className="v" style={{ color: owed ? 'var(--kz-discount)' : undefined }}>{xaf(owed)}</div></div>}
      </div>

      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
        <GmSeg value={tab} onChange={setTab} options={[
          { v:'all', label:'Everyone', n:st.members.length },
          { v:'due', label:'Needs renewal', n:st.members.filter((m) => m.state === 'due' || m.state === 'expired').length },
          { v:'frozen', label:'Frozen', n:st.members.filter((m) => m.state === 'frozen').length },
          ...(gate('corporate') ? [{ v:'co', label:'Corporate seats', n:st.members.filter((m) => m.co).length }] : []),
        ]} />
        <div className="sp" style={{ flex: 1 }}></div>
        {gate('corporate') && <button className="btn" onClick={() => setTab('accounts')}><ion-icon name="business-outline"></ion-icon>Corporate accounts</button>}
      </div>

      <div className="table">
        {rows.map((m) => (
          <button className="trw" key={m.id} onClick={() => api.openMember(m.id)}>
            <span className="gmhit__ph" style={{ width: 34, height: 34, fontSize: 12 }}>{initOf(m.name)}</span>
            <span style={{ flex: 1.4, minWidth: 0 }}>
              <b style={{ display:'block', font:'700 13.5px var(--kz-font-sans)' }}>{m.name}</b>
              <span style={{ font:'500 11.5px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>
                {m.phone} {m.co ? '· ' + coOf(m.co).name : ''} {m.note ? '· ' + m.note : ''}
              </span>
            </span>
            <PlanTag id={m.plan} />
            <StateTag state={m.state} />
            <span style={{ width: 92, font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>to {m.expires}</span>
            {gate('wallet') && <span className="gmnum" style={{ width: 84, textAlign:'right' }}>{xaf(m.wallet)}</span>}
            {gate('tab') && <span className="gmnum" style={{ width: 84, textAlign:'right', color: m.tab ? 'var(--kz-discount)' : 'var(--kz-muted-3)' }}>{m.tab ? xaf(m.tab) : '—'}</span>}
            <span style={{ width: 62, font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>{m.in ? 'inside' : m.visits + ' visits'}</span>
            <ion-icon name="chevron-forward-outline" style={{ color:'var(--kz-muted-3)' }}></ion-icon>
          </button>
        ))}
        {!rows.length && <div style={{ padding: 22, textAlign:'center', font:'500 13px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>Nobody here.</div>}
      </div>
    </div>
  );
}

function CompaniesView({ api, onBack }) {
  const st = api.st;
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Corporate accounts</h2><p>One invoice, many seats · billed on the company's terms</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={onBack}><ion-icon name="arrow-back-outline"></ion-icon>All members</button>
      </div>
      <div className="gmnote">
        <ion-icon name="information-circle-outline"></ion-icon>
        A seat is a membership the company pays for. Adding a person to a seat never charges them; removing
        one leaves their record and history intact, on a personal plan.
      </div>
      <div className="cards">
        {st.companies.map((c) => {
          const seats = st.members.filter((m) => m.co === c.id);
          return (
            <div className="card" key={c.id}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <ion-icon name="business-outline" style={{ fontSize: 19, color:'var(--kz-primary)' }}></ion-icon>
                <b style={{ font:'700 15px var(--kz-font-sans)', flex:1 }}>{c.name}</b>
                <PlanTag id={c.plan} />
              </div>
              <p style={{ margin:'8px 0 0', font:'500 12.5px var(--kz-font-sans)', color:'var(--kz-muted)' }}>
                {c.contact} · {c.billTo} · {c.terms} days
              </p>
              <div className="gmsum">
                <div><span>Seats used</span><b>{c.used} of {c.seats}</b></div>
                <div><span>People on this account</span><b>{seats.length}</b></div>
                <div><span>Outstanding</span><b style={{ color: c.balance ? 'var(--kz-discount)' : 'var(--kz-success)' }}>{c.balance ? xaf(c.balance) : 'settled'}</b></div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
                <button className="btn" onClick={() => api.toast(c.name + ' · seat list opened')}><ion-icon name="people-outline"></ion-icon>Seats</button>
                {c.balance > 0 && gate('corporate') && (
                  <button className="btn primary" onClick={() => api.billCo(c.id)}><ion-icon name="document-text-outline"></ion-icon>Invoice {xaf(c.balance)}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- the member sheet: everything about one person, and the acts ---------- */
function MemberSheet({ mid, api, onClose }) {
  const st = api.st;
  const m = st.members.find((x) => x.id === mid);
  if (!m) return null;
  const plan = planOf(m.plan);
  const v = admit(m, st);
  const packs = st.packs.filter((p) => p.mid === mid);
  const moves = walletOf(mid, st).slice().reverse();
  const pts = st.pt.filter((p) => p.mid === mid);

  return (
    <GmSheet wide title={m.name} sub={plan.name + ' · member since ' + m.since + ' · ' + m.visits + ' visits'} onClose={onClose}
      foot={<>
        <div className="sp" style={{ flex: 1 }}></div>
        {gate('freeze') && m.state !== 'frozen' && <button className="btn" onClick={() => api.openFreeze(mid)}><ion-icon name="pause-circle-outline"></ion-icon>Freeze</button>}
        {m.state === 'frozen' && <button className="btn" onClick={() => api.unfreeze(mid)}><ion-icon name="play-circle-outline"></ion-icon>End freeze</button>}
        {gate('freeze') && <button className="btn" onClick={() => api.openTransfer(mid)}><ion-icon name="swap-horizontal-outline"></ion-icon>Transfer months</button>}
        {gate('wallet') && <button className="btn" onClick={() => api.openTopup(mid)}><ion-icon name="wallet-outline"></ion-icon>Top up</button>}
        {m.in
          ? <button className="btn" onClick={() => { api.checkOut(mid); onClose(); }}><ion-icon name="log-out-outline"></ion-icon>Check out</button>
          : <button className="btn primary" onClick={() => { api.act(mid, v); onClose(); }}><ion-icon name="log-in-outline"></ion-icon>{v.ok && !v.warn ? 'Check in' : v.label}</button>}
      </>}>

      <div className={'gmhit ' + (v.ok ? (v.warn ? 'warn' : '') : 'no')} style={{ marginBottom: 14 }}>
        <ion-icon name={v.ok ? 'checkmark-circle' : 'close-circle'} style={{ fontSize: 26, color: v.ok ? (v.warn ? 'var(--kz-warning)' : 'var(--kz-success)') : 'var(--kz-discount)' }}></ion-icon>
        <div className="gmhit__b">
          <div className="gmhit__n">{v.ok ? (v.warn ? 'Admit with a word' : 'Free to come in') : 'Do not admit'}</div>
          <div className="gmhit__m"><span>{v.why}</span></div>
        </div>
        <StateTag state={m.state} />
      </div>

      <div className="gmfields">
        <div className="gmf"><label>Plan</label><div className="btn" style={{ justifyContent:'flex-start' }}>{plan.name} · {xaf(plan.price)} / {plan.cycle}</div></div>
        <div className="gmf"><label>Access</label><div className="btn" style={{ justifyContent:'flex-start' }}>{plan.zones.map((z) => GM.zoneNames[z]).join(', ')} · {plan.hours === 'any' ? 'any hour' : plan.hours}</div></div>
        <div className="gmf"><label>Phone</label><div className="btn" style={{ justifyContent:'flex-start' }}>{m.phone}</div></div>
        <div className="gmf"><label>Renews</label><div className="btn" style={{ justifyContent:'flex-start' }}>{m.expires}</div></div>
        {m.co && <div className="gmf gmwide"><label>Corporate seat</label><div className="btn" style={{ justifyContent:'flex-start' }}>{coOf(m.co).name} · billed {coOf(m.co).billTo}</div></div>}
        {m.freeze && <div className="gmf gmwide"><label>Freeze</label><div className="btn" style={{ justifyContent:'flex-start' }}>{m.freeze.from} → {m.freeze.to} · {m.freeze.days} days · {m.freeze.reason}</div></div>}
      </div>

      {gate('packages') && packs.length > 0 && (
        <>
          <h4 style={{ margin:'16px 0 8px', font:'700 13px var(--kz-font-sans)' }}>Session packages</h4>
          <div className="table">
            {packs.map((p) => (
              <div className="trw" key={p.id}>
                <span style={{ flex: 1, font:'600 13px var(--kz-font-sans)' }}>{p.kind}</span>
                <span style={{ font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>with {staffOf(p.trainer).first}</span>
                <span className="gmnum" style={{ width: 90, textAlign:'right' }}>{p.left} of {p.bought}</span>
                <span style={{ width: 90, font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>to {p.expires}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {gate('pt') && pts.length > 0 && (
        <>
          <h4 style={{ margin:'16px 0 8px', font:'700 13px var(--kz-font-sans)' }}>Sessions today</h4>
          <div className="table">
            {pts.map((p) => (
              <div className="trw" key={p.id}>
                <span className="gmnum" style={{ width: 92 }}>{p.from}–{p.to}</span>
                <span style={{ flex: 1, font:'600 13px var(--kz-font-sans)' }}>{staffOf(p.trainer).name}</span>
                <span style={{ font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>{roomOf(p.room).name}</span>
                <span className={'gmstate ' + (p.state === 'done' ? 'active' : p.state === 'noshow' ? 'expired' : 'frozen')}><i></i>{p.state === 'noshow' ? 'No-show' : p.state}</span>
                <span className="gmnum" style={{ width: 84, textAlign:'right' }}>{xaf(p.fee)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {gate('wallet') && (
        <>
          <h4 style={{ margin:'16px 0 8px', font:'700 13px var(--kz-font-sans)' }}>Wallet · {xaf(m.wallet)}{m.tab ? ' · account tab ' + xaf(m.tab) : ''}</h4>
          <div className="table">
            {moves.length ? moves.map((w) => (
              <div className="trw" key={w.id}>
                <span className="gmnum" style={{ width: 104, color:'var(--kz-muted-2)' }}>{w.at}</span>
                <span style={{ flex: 1, font:'500 12.5px var(--kz-font-sans)' }}>{w.desc}</span>
                {w.queued && <span className="badge"><ion-icon name="cloud-offline-outline" style={{ fontSize: 11, marginRight: 4 }}></ion-icon>queued</span>}
                <span className="gmnum" style={{ width: 96, textAlign:'right', color: w.amount > 0 ? 'var(--kz-success)' : 'var(--kz-ink)' }}>{xaf(w.amount)}</span>
              </div>
            )) : <div style={{ padding: 16, font:'500 12.5px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>No wallet movement yet.</div>}
          </div>
        </>
      )}
    </GmSheet>
  );
}

/* ---------- freeze: a club rule with a stated consequence ---------- */
function FreezeSheet({ mid, api, onClose }) {
  const m = api.st.members.find((x) => x.id === mid);
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState('Travel');
  return (
    <GmSheet title="Freeze the membership" sub={m.name + ' · ' + planOf(m.plan).name} onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" onClick={() => { api.freeze(mid, days, reason); onClose(); }}>
          <ion-icon name="pause-circle-outline"></ion-icon>Freeze {days} days</button></>}>
      <div className="gmnote"><ion-icon name="information-circle-outline"></ion-icon>
        A freeze pushes the renewal date out by the same number of days. Access is refused while it stands,
        and the wallet balance is untouched.
      </div>
      <div className="gmfields">
        <div className="gmf"><label>Days</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[14, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
          <span className="hint">Club rule: 90 days a year, in blocks of 14 or more.</span>
        </div>
        <div className="gmf"><label>Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {['Travel', 'Injury', 'Medical', 'Posted abroad', 'Other'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="gmsum">
        <div><span>Renewal moves from</span><b>{m.expires}</b></div>
        <div><span>Days added</span><b>+{days}</b></div>
        <div><span>Access while frozen</span><b>Refused at the gate</b></div>
      </div>
    </GmSheet>
  );
}

/* ---------- transfer remaining months to another person ---------- */
function TransferSheet({ mid, api, onClose }) {
  const st = api.st;
  const m = st.members.find((x) => x.id === mid);
  const [to, setTo] = useState('');
  const [months, setMonths] = useState(1);
  return (
    <GmSheet title="Transfer remaining months" sub={m.name + ' · ' + planOf(m.plan).name} onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" disabled={!to} onClick={() => { api.transfer(mid, to, months); onClose(); }}>
          <ion-icon name="swap-horizontal-outline"></ion-icon>{'Transfer ' + months + (months > 1 ? ' months' : ' month')}</button></>}>
      <div className="gmnote"><ion-icon name="shield-checkmark-outline"></ion-icon>
        The club charges a transfer fee and records who authorised it. The wallet, session packages and
        locker stay with the original member — only paid-for time moves.
      </div>
      <div className="gmfields">
        <div className="gmf"><label>Transfer to</label>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Choose a member…</option>
            {st.members.filter((x) => x.id !== mid).map((x) => <option key={x.id} value={x.id}>{x.name} · {planOf(x.plan).short}</option>)}
          </select>
        </div>
        <div className="gmf"><label>Months</label>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {[1, 2, 3, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <div className="gmsum">
        <div><span>Transfer fee</span><b>{xaf(15000)}</b></div>
        <div><span>Authorised by</span><b>{api.me.name}</b></div>
      </div>
    </GmSheet>
  );
}

/* ---------- new member ---------- */
function NewMemberSheet({ seed, api, onClose }) {
  const [name, setName] = useState(seed || '');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('std');
  const [co, setCo] = useState('');
  const [tender, setTender] = useState('momo');
  const p = planOf(plan);
  return (
    <GmSheet wide title="New member" sub="Phone and a plan is enough — the rest can wait" onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" disabled={!name.trim() || !phone.trim()}
          onClick={() => { api.addMember({ name, phone, plan, co, tender }); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>Join {co ? 'on a company seat' : 'and take ' + xaf(p.price)}</button></>}>
      <div className="gmfields">
        <div className="gmf"><label>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nadège Fotso" /></div>
        <div className="gmf"><label>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6 55 19 79 85" /></div>
        <div className="gmf"><label>Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            {GM.plans.map((x) => <option key={x.id} value={x.id}>{x.name} · {xaf(x.price)}/{x.cycle}</option>)}
          </select>
          <span className="hint">{p.zones.map((z) => GM.zoneNames[z]).join(', ')} · {p.hours === 'any' ? 'any hour' : p.hours}</span>
        </div>
        {gate('corporate') && (
          <div className="gmf"><label>Corporate seat</label>
            <select value={co} onChange={(e) => setCo(e.target.value)}>
              <option value="">Paying personally</option>
              {GM.companies.map((c) => <option key={c.id} value={c.id} disabled={c.used >= c.seats}>{c.name} · {c.seats - c.used} seat(s) free</option>)}
            </select>
          </div>
        )}
        {!co && (
          <div className="gmf gmwide"><label>First payment</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {GM.tenders.filter((x) => x.id !== 'wallet' && x.id !== 'tab').map((x) => (
                <button key={x.id} className={'chip' + (tender === x.id ? ' on' : '')} onClick={() => setTender(x.id)}>
                  <ion-icon name={x.icon}></ion-icon>{x.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="gmsum">
        <div><span>{p.name}</span><b>{co ? 'on account' : xaf(p.price)}</b></div>
        <div><span>Access</span><b>{p.zones.length} zone(s) · {p.hours === 'any' ? 'any hour' : p.hours}</b></div>
        {!api.online && <div><span>No network</span><b>Joined on this device, sent when the line returns</b></div>}
      </div>
    </GmSheet>
  );
}

Object.assign(window, { MembersView, CompaniesView, MemberSheet, FreezeSheet, TransferSheet, NewMemberSheet });
