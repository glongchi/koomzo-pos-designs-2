/* Koomzo Gym — TIMETABLE. Classes by room so nothing double-books, and 1-on-1
   sessions with the package that pays for them. The cancellation window is a
   club rule the screen enforces, not a note on the wall. */

function ClassesView({ api }) {
  const st = api.st;
  const [tab, setTab] = useState(gate('classes') ? 'classes' : 'pt');
  const [room, setRoom] = useState('');

  const classes = st.classes.filter((c) => !room || c.room === room);
  const pts = st.pt.filter((p) => (!room || p.room === room) && p.state !== 'cancelled');
  const booked = st.classes.reduce((s, c) => s + c.booked, 0);
  const noshows = st.pt.filter((p) => p.state === 'noshow').length;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Timetable</h2><p>{GM.today} · {st.classes.length} classes · {pts.length} one-to-one sessions</p></div>
        <div className="sp"></div>
        <select className="btn" value={room} onChange={(e) => setRoom(e.target.value)}>
          <option value="">Every room</option>
          {GM.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        {gate('pt') && <button className="btn primary" onClick={() => api.openBookPt({})}><ion-icon name="add-outline"></ion-icon>Book a session</button>}
      </div>

      <div className="kpis">
        <div className="kpi"><div className="k">Class places booked</div><div className="v">{booked}</div></div>
        <div className="kpi"><div className="k">Sessions today</div><div className="v">{pts.filter((p) => p.state !== 'noshow').length}</div></div>
        {gate('pt') && <div className="kpi"><div className="k">No-shows charged</div><div className="v" style={{ color: noshows ? 'var(--kz-discount)' : undefined }}>{noshows}</div></div>}
        {gate('packages') && <div className="kpi"><div className="k">Sessions on packages</div><div className="v">{st.packs.reduce((s, p) => s + p.left, 0)}</div></div>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <GmSeg value={tab} onChange={setTab} options={[
          ...(gate('classes') ? [{ v:'classes', label:'Classes', n:classes.length }] : []),
          ...(gate('pt') ? [{ v:'pt', label:'One-to-one', n:pts.length }] : []),
          ...(gate('packages') ? [{ v:'packs', label:'Packages', n:st.packs.length }] : []),
        ]} />
      </div>

      {tab === 'classes' && (
        <div className="gmtt">
          {classes.map((c) => {
            const full = c.booked >= c.cap;
            return (
              <div className={'gmslot ' + c.state} key={c.id}>
                <div className="gmslot__t">{c.from}<span>{c.to}</span></div>
                <div className="gmslot__b">
                  <div className="gmslot__n">{c.name}</div>
                  <div className="gmslot__m">
                    <span>{roomOf(c.room).name}</span><i>·</i>
                    <span>{staffOf(c.trainer).name}</span>
                    {c.fee > 0 && <><i>·</i><span className="gmnum">{xaf(c.fee)}</span></>}
                    {c.state === 'done' && <><i>·</i><span>{c.in} attended</span></>}
                  </div>
                  {c.wait > 0 && <div className="gmwait">{c.wait} on the waiting list · first cancellation takes the place</div>}
                </div>
                <div className="gmfill">
                  <div className="gmfill__n">{c.booked} of {c.cap}{full ? ' · full' : ''}</div>
                  <div className="gmfill__b"><i className={full ? 'full' : ''} style={{ width: Math.min(100, c.booked / c.cap * 100) + '%' }}></i></div>
                </div>
                {c.state === 'upcoming'
                  ? <button className="btn" onClick={() => api.openBookClass(c.id)}><ion-icon name="person-add-outline"></ion-icon>{full ? 'Waiting list' : 'Book a member'}</button>
                  : c.state === 'running'
                    ? <button className="btn primary" onClick={() => api.view('desk')}><ion-icon name="log-in-outline"></ion-icon>Check people in</button>
                    : <span className="badge"><ion-icon name="checkmark-circle" style={{ fontSize: 12, marginRight: 4 }}></ion-icon>done</span>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'pt' && (
        <div className="gmtt">
          {pts.map((p) => {
            const m = memberOf(p.mid);
            const pack = p.pack ? st.packs.find((x) => x.id === p.pack) : null;
            return (
              <div className={'gmslot ' + (p.state === 'done' ? 'done' : '')} key={p.id}>
                <div className="gmslot__t">{p.from}<span>{p.to}</span></div>
                <div className="gmslot__b">
                  <div className="gmslot__n">{m ? m.name : '—'}</div>
                  <div className="gmslot__m">
                    <span>{staffOf(p.trainer).name}</span><i>·</i>
                    <span>{roomOf(p.room).name}</span><i>·</i>
                    <span className="gmnum">{xaf(p.fee)}</span>
                    {pack && <><i>·</i><span>{pack.kind} · {pack.left} left</span></>}
                    {!pack && <><i>·</i><span>paid per session</span></>}
                  </div>
                  {p.state === 'noshow' && <div className="gmwait">No-show · charged in full under the {GM.cancelWindow}-hour rule</div>}
                </div>
                <span className={'gmstate ' + (p.state === 'done' ? 'active' : p.state === 'noshow' ? 'expired' : 'frozen')}><i></i>
                  {p.state === 'done' ? (p.signed ? 'Signed off' : 'Done') : p.state === 'noshow' ? 'No-show' : 'Booked'}
                </span>
                {p.state === 'booked' && <>
                  <button className="btn" onClick={() => api.cancelPt(p.id)}><ion-icon name="close-outline"></ion-icon>Cancel</button>
                  <button className="btn primary" onClick={() => api.completePt(p.id)}><ion-icon name="checkmark-outline"></ion-icon>Complete &amp; sign</button>
                </>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'packs' && (
        <>
          <div className="gmnote"><ion-icon name="information-circle-outline"></ion-icon>
            A session comes off a package only when the trainer signs a completed session — never at booking,
            and never twice for the same session.
          </div>
          <div className="table">
            {st.packs.map((p) => {
              const m = memberOf(p.mid);
              return (
                <button className="trw" key={p.id} onClick={() => api.openMember(p.mid)}>
                  <span style={{ flex: 1, font:'700 13.5px var(--kz-font-sans)' }}>{m ? m.name : '—'}</span>
                  <span style={{ flex: 1, font:'500 12.5px var(--kz-font-sans)', color:'var(--kz-muted)' }}>{p.kind}</span>
                  <span style={{ font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>with {staffOf(p.trainer).first}</span>
                  <span className="gmfill" style={{ minWidth: 110 }}>
                    <span className="gmfill__n">{p.left} of {p.bought} left</span>
                    <span className="gmfill__b" style={{ display:'block' }}><i className={p.left <= 2 ? 'full' : ''} style={{ width: (p.left / p.bought * 100) + '%' }}></i></span>
                  </span>
                  <span style={{ width: 96, font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>to {p.expires}</span>
                  <span className="gmnum" style={{ width: 90, textAlign:'right' }}>{xaf(p.price)}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- book a member into a class ---------- */
function BookClassSheet({ cid, api, onClose }) {
  const st = api.st;
  const c = st.classes.find((x) => x.id === cid);
  const [mid, setMid] = useState('');
  const full = c.booked >= c.cap;
  const m = mid ? memberOf(mid) : null;
  const allowed = m ? planOf(m.plan).zones.indexOf(roomOf(c.room).zone) > -1 : true;
  return (
    <GmSheet title={full ? 'Add to the waiting list' : 'Book a member in'} sub={c.name + ' · ' + c.from + ' · ' + roomOf(c.room).name} onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" disabled={!mid || !allowed} onClick={() => { api.bookClass(cid, mid); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>{full ? 'Add to list' : 'Book'}</button></>}>
      <div className="gmfields">
        <div className="gmf gmwide"><label>Member</label>
          <select value={mid} onChange={(e) => setMid(e.target.value)}>
            <option value="">Choose a member…</option>
            {st.members.filter((x) => x.state === 'active' || x.state === 'due').map((x) => <option key={x.id} value={x.id}>{x.name} · {planOf(x.plan).short}</option>)}
          </select>
        </div>
      </div>
      {m && !allowed && (
        <div className="gmnote" style={{ background:'var(--kz-discount-wash)', borderColor:'#f3c8ba' }}>
          <ion-icon name="close-circle-outline" style={{ color:'var(--kz-discount)' }}></ion-icon>
          {planOf(m.plan).name} does not include {GM.zoneNames[roomOf(c.room).zone]}. Upgrade the plan or sell a day pass.
        </div>
      )}
      <div className="gmsum">
        <div><span>Places</span><b>{c.booked} of {c.cap}</b></div>
        {c.fee > 0 && <div><span>Class fee</span><b>{xaf(c.fee)}</b></div>}
        <div><span>Cancellation</span><b>Free until {GM.cancelWindow}h before · then charged in full</b></div>
      </div>
    </GmSheet>
  );
}

/* ---------- book a one-to-one session ---------- */
function BookPtSheet({ api, onClose }) {
  const st = api.st;
  const [mid, setMid] = useState('');
  const [tid, setTid] = useState('s1');
  const [from, setFrom] = useState('16:00');
  const [room, setRoom] = useState('floor');
  const pack = mid ? st.packs.find((p) => p.mid === mid && p.left > 0 && p.trainer === tid) : null;
  const clash = st.pt.some((p) => p.trainer === tid && p.from === from && p.state !== 'cancelled')
    || st.classes.some((c) => c.trainer === tid && mins(c.from) <= mins(from) && mins(c.to) > mins(from));
  const roomClash = st.pt.some((p) => p.room === room && p.from === from && p.state !== 'cancelled');
  return (
    <GmSheet title="Book a one-to-one session" sub="Trainer, room and hour — clashes are refused, not warned about" onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" disabled={!mid || clash || roomClash} onClick={() => { api.bookPt({ mid, tid, from, room, pack: pack ? pack.id : null }); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>Book</button></>}>
      <div className="gmfields">
        <div className="gmf"><label>Member</label>
          <select value={mid} onChange={(e) => setMid(e.target.value)}>
            <option value="">Choose…</option>
            {st.members.filter((x) => x.state !== 'expired').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <div className="gmf"><label>Trainer</label>
          <select value={tid} onChange={(e) => setTid(e.target.value)}>
            {GM.staff.filter((s) => s.split > 0).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="gmf"><label>Starts</label>
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {['06:00','07:00','09:00','10:00','14:00','15:00','16:00','17:00','18:00','19:00'].map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
        <div className="gmf"><label>Room</label>
          <select value={room} onChange={(e) => setRoom(e.target.value)}>
            {GM.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
      </div>
      {(clash || roomClash) && (
        <div className="gmnote" style={{ background:'var(--kz-discount-wash)', borderColor:'#f3c8ba' }}>
          <ion-icon name="alert-circle-outline" style={{ color:'var(--kz-discount)' }}></ion-icon>
          {clash ? staffOf(tid).first + ' is already teaching at ' + from + '.' : roomOf(room).name + ' is taken at ' + from + '.'}
        </div>
      )}
      <div className="gmsum">
        <div><span>Fee</span><b>{pack ? 'from the package' : xaf(28000)}</b></div>
        {pack && <div><span>Package</span><b>{pack.kind} · {pack.left} left</b></div>}
        <div><span>Trainer share</span><b>{Math.round(staffOf(tid).split * 100)}% on completion</b></div>
      </div>
    </GmSheet>
  );
}

Object.assign(window, { ClassesView, BookClassSheet, BookPtSheet });
