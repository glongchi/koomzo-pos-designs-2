/* Koomzo Hotel — the room rack. The module core: never hidden, at any tier. */

function RackView({ api }) {
  const st = api.st;
  const [filter, setFilter] = useState('all');
  const [mode, setMode] = useState('tiles');
  const counts = useMemo(() => {
    const c = { arr:0, due:0, vac:0, dirty:0, occ:0, stay:0, ooo:0 };
    HT.rooms.forEach((r) => { c[rackState(r.no, st)]++; });
    return c;
  }, [st]);
  const sold = counts.occ + counts.due + counts.stay;
  const occPc = Math.round((sold / HT.rooms.length) * 100);
  const onBooks = st.stays.filter((s) => s.status !== 'out')
    .reduce((sum, s) => sum + (gate('folio') ? Math.max(0, folioSum(st.folio[s.id] || []).balance) : 0), 0);

  const floors = ['Ground', 'First', 'Annex'];
  const match = (r) => {
    const s = rackState(r.no, st);
    if (filter === 'all') return true;
    if (filter === 'clean') return s === 'dirty';
    if (filter === 'free') return s === 'vac';
    return s === filter;
  };
  const chips = [
    ['all', 'Everything', HT.rooms.length],
    ['arr', 'Arrivals', counts.arr],
    ['due', 'Departures', counts.due],
    ['free', 'Vacant ready', counts.vac],
    ['clean', 'To clean', counts.dirty],
    ['stay', 'Long stay', counts.stay],
  ].filter((c) => c[0] === 'all' || c[2] > 0)
   .filter((c) => (c[0] !== 'clean' || gate('housekeeping')) && (c[0] !== 'stay' || gate('longstay')) && (c[0] !== 'arr' || gate('bookings')));

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Rooms</h2><p>{HT.today} · {sold} of {HT.rooms.length} sold · {counts.arr} in, {counts.due} out</p></div>
        <div className="sp"></div>
        {gate('housekeeping') && st.house.filter((h) => h.state !== 'clean').length > 0 &&
          <button className="btn" onClick={() => api.setView('house')}><ion-icon name="sparkles-outline"></ion-icon>{st.house.filter((h) => h.state !== 'clean').length} to clean</button>}
        <button className="btn primary" onClick={() => api.openBook({})}><ion-icon name="add-circle-outline"></ion-icon>{gate('bookings') ? 'New booking' : 'Check in a guest'}</button>
      </div>

      {gate('maintenance') && counts.ooo > 0 && (
        <div className="htbanner">
          <ion-icon name="construct-outline"></ion-icon>
          <span><b>{counts.ooo} room off sale.</b> {st.maint.filter((m) => m.ooo && m.state !== 'fixed').map((m) => m.no + ' — ' + m.issue).join(' · ')}</span>
          <div className="sp"></div>
          <button className="sbtn" onClick={() => api.setView('house')}>Maintenance</button>
        </div>
      )}

      <div className="htkpi">
        <div className="htk"><div className="k">Occupancy tonight</div><div className="v">{occPc}%<small> · {sold}/{HT.rooms.length}</small></div>
          <div className="pbar" style={{ marginTop: 8 }}><i style={{ width: occPc + '%' }}></i></div></div>
        {gate('bookings') && <div className="htk"><div className="k">Arrivals</div><div className="v">{counts.arr}</div><div className="s">From {HT.checkin}</div></div>}
        <div className="htk"><div className="k">Departures</div><div className="v">{counts.due}</div><div className="s">Out by {HT.checkout}</div></div>
        <div className="htk"><div className="k">Vacant ready</div><div className="v">{counts.vac}</div>
          <div className="s">{gate('housekeeping') ? counts.dirty + ' waiting on housekeeping' : 'Sellable now'}</div></div>
        {gate('folio') && <div className="htk"><div className="k">On the rooms</div><div className="v" style={{ fontSize: 19 }}>{xaf(onBooks)}</div><div className="s">Unsettled folio balances</div></div>}
      </div>

      <div className="htchips" style={{ marginBottom: 10, alignItems: 'center' }}>
        {chips.map(([id, label, n]) => (
          <button key={id} className={'htchip' + (filter === id ? ' on' : '')} onClick={() => setFilter(id)}>{label}<b style={{ opacity: .7 }}>{n}</b></button>
        ))}
        <div className="sp" style={{ flex: 1 }}></div>
        <HtSeg value={mode} onChange={setMode} options={[{ v:'tiles', label:'Tiles' }, { v:'floors', label:'All floors' }]} />
      </div>

      <div className="htlegend">
        <span><i className="htdot vac"></i>Vacant</span>
        {gate('housekeeping') && <span><i className="htdot dirty"></i>To clean</span>}
        <span><i className="htdot occ"></i>Occupied</span>
        {gate('bookings') && <span><i className="htdot arr"></i>Arriving</span>}
        <span><i className="htdot due"></i>Departing</span>
        {gate('longstay') && <span><i className="htdot stay"></i>Long stay</span>}
        {gate('maintenance') && <span><i className="htdot ooo"></i>Off sale</span>}
      </div>

      {mode === 'floors' ? (
        <div className="htfbwrap">
          <div>
            {floors.map((f) => {
              const rooms = HT.rooms.filter((r) => r.floor === f && match(r));
              if (!rooms.length) return null;
              return <FloorBoard key={f} label={f === 'Annex' ? 'Annex · furnished apartments' : f + ' floor'}
                rooms={rooms} st={st} api={api} />;
            })}
          </div>
        </div>
      ) : floors.map((f) => {
        const rooms = HT.rooms.filter((r) => r.floor === f && match(r));
        if (!rooms.length) return null;
        const label = f === 'Annex' ? 'Annex · furnished apartments' : f + ' floor';
        return (
          <div key={f}>
            <div className="htfloor">{label}<b>{rooms.length}</b></div>
            <div className="htrack">{rooms.map((r) => <RoomTile key={r.no} r={r} st={st} api={api} />)}</div>
          </div>
        );
      })}
      {!HT.rooms.filter(match).length && <div className="emptybox">Nothing matches that filter.</div>}
    </div>
  );
}

/* every floor, every room, one status column — the scannable read of the whole house */
function FloorBoard({ label, rooms, st, api }) {
  const sold = rooms.filter((r) => ['occ', 'due', 'stay'].indexOf(rackState(r.no, st)) > -1).length;
  return (
    <div className="htfb">
      <div className="htfb__hd">
        <h4>{label}</h4>
        <div className="sp"></div>
        <small>{sold} of {rooms.length} sold</small>
      </div>
      <table className="httable">
        <thead><tr>
          <th className="rn">Room</th><th className="ty">Type</th><th className="stt">Status</th>
          <th className="gst">Guest</th><th className="sty">Stay</th>
          {gate('housekeeping') && <th className="hk">Housekeeping</th>}
          <th className="nte">Note</th>
          {gate('folio') && <th className="n bal">Balance</th>}
          <th className="act">Next action</th>
        </tr></thead>
        <tbody>
          {rooms.map((r) => {
            const state = rackState(r.no, st), meta = RACK[state];
            const s = stayIn(r.no, st);
            const hk = st.house.find((h) => h.no === r.no);
            const fault = st.maint.find((m) => m.no === r.no && m.state !== 'fixed');
            const bal = s && gate('folio') ? folioSum(st.folio[s.id] || []).balance : 0;
            const hkTxt = !hk || hk.state === 'clean' ? 'Clean'
              : hk.state === 'cleaning' ? 'Being cleaned' + (hk.to ? ' · ' + userOf(hk.to).first : '')
              : hk.state === 'inspect' ? 'Awaiting inspection' : 'To clean' + (hk.to ? ' · ' + userOf(hk.to).first : '');
            const act = nextAction(r.no, st, api);
            const stayTxt = !s ? '—'
              : state === 'arr' ? 'Arrives ' + HT.checkin
              : state === 'due' ? 'Out by ' + HT.checkout
              : s.plan === 'nightly' ? nights(s.nights - Math.max(0, -s.from)) + ' left'
              : s.plan === 'monthly' ? 'Monthly · to ' + (s.renew || '—') : 'Weekly';
            return (
              <tr key={r.no} onClick={() => api.openRoom(r.no)} style={{ cursor: 'pointer' }}>
                <td className="rn">{r.no}</td>
                <td className="ty" style={{ color: 'var(--kz-muted-2)' }}>{typeOf(r.type).name}</td>
                <td className="stt"><span className="htst"><i className={'htdot ' + meta.cls}></i>{meta.label}</span></td>
                <td className="gst">{s ? s.guest : <span style={{ color: 'var(--kz-muted-3)' }}>—</span>}</td>
                <td className="sty" style={{ color: 'var(--kz-muted-2)' }}>{stayTxt}</td>
                {gate('housekeeping') && <td className="hk" style={{ color: 'var(--kz-muted-2)' }}>{hkTxt}</td>}
                <td className="nte">{fault ? fault.issue : <span style={{ color: 'var(--kz-muted-3)' }}>—</span>}</td>
                {gate('folio') && <td className="n bal">{bal > 0 ? xaf(bal) : <span style={{ color: 'var(--kz-muted-3)', fontWeight: 500 }}>—</span>}</td>}
                <td className="act">
                  <button className={'htroom__a' + (act.hero ? ' hero' : '')} onClick={(e) => { e.stopPropagation(); act.run(); }}>
                    <ion-icon name={act.icon}></ion-icon>{act.label}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- one room, and everything you can do to it ---------------- */
function RoomSheet({ no, api, onClose }) {
  const st = api.st, r = roomOf(no), t = typeOf(r.type);
  const state = rackState(no, st), s = stayIn(no, st);
  const hk = st.house.find((h) => h.no === no);
  const faults = st.maint.filter((m) => m.no === no && m.state !== 'fixed');
  const f = s && gate('folio') ? folioSum(st.folio[s.id] || []) : null;
  const g = s && guestOf(s.gid);
  const needsId = g && gate('register') && !g.idNo;

  /* the footer is the tile's action, promoted — same resolver, so the two agree */
  const act = nextAction(no, st, api);
  const foot = [<button key="c" className="btn" onClick={onClose}>Close</button>];
  if (act.id === 'settle' || act.id === 'post') foot.push(
    <button key="a" className="btn primary" onClick={() => { onClose(); act.run(); }}><ion-icon name={act.icon}></ion-icon>{act.label}</button>);
  else foot.push(
    <button key="a" className="btn primary" onClick={() => { act.run(); onClose(); }}><ion-icon name={act.icon}></ion-icon>{act.label}</button>);
  if (act.id === 'post' && s) foot.splice(1, 0,
    <button key="o" className="btn" onClick={() => { onClose(); api.openSettle(s.id); }}><ion-icon name="log-out-outline"></ion-icon>Check out</button>);

  return (
    <HtSheet title={'Room ' + r.no} sub={t.name + ' · ' + r.beds + ' · ' + RACK[state].label} onClose={onClose} foot={foot}>
      {needsId && <div className="note" style={{ marginBottom: 12 }}><ion-icon name="alert-circle-outline"></ion-icon>
        No ID captured. The statutory guest register needs a CNI or passport number before the night is posted.</div>}

      {s && <>
        <div className="htrow" style={{ padding: '0 0 12px' }}>
          <div className="av lg t1">{s.guest.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
          <div className="htrow__b">
            <div className="htrow__n">{s.guest}</div>
            <div className="htrow__s">
              <SrcTag id={s.source} />
              {s.company && <span className="tag"><ion-icon name="business-outline" style={{ fontSize: 11, marginRight: 4 }}></ion-icon>{s.company}</span>}
              {s.ref && <span className="tag">{s.ref}</span>}
            </div>
          </div>
        </div>
        <div className="htfacts">
          <div><div className="k">Rate</div><div className="v">{xaf(s.rate)}</div><div className="s">{s.plan === 'nightly' ? 'per night' : 'per ' + s.plan.replace('ly', '')}</div></div>
          <div><div className="k">Stay</div><div className="v">{s.nights}</div><div className="s">nights booked</div></div>
          {f && <div><div className="k">Balance</div><div className="v">{xaf(f.balance)}</div><div className="s">{xaf(f.paid)} paid</div></div>}
        </div>
        {g && g.notes && <div className="note2" style={{ marginBottom: 12 }}><div className="txt">{g.notes}</div></div>}
        <div className="htchips" style={{ marginBottom: 12 }}>
          {gate('folio') && <button className="htchip" onClick={() => { onClose(); api.openPost(s.id); }}><ion-icon name="add-outline"></ion-icon>Post a charge</button>}
          {gate('folio') && <button className="htchip" onClick={() => { onClose(); api.openFolio(s.id); }}><ion-icon name="reader-outline"></ion-icon>Open folio</button>}
          {gate('housekeeping') && <button className="htchip" onClick={() => api.hkSet(no, 'dirty', 'stay')}><ion-icon name="sparkles-outline"></ion-icon>Ask for cleaning</button>}
          {gate('maintenance') && <button className="htchip" onClick={() => { onClose(); api.openFault(no); }}><ion-icon name="construct-outline"></ion-icon>Report a fault</button>}
        </div>
      </>}

      {!s && <>
        <div className="htchips" style={{ marginBottom: 12 }}>
          {gate('housekeeping') && hk && hk.state !== 'clean' &&
            <button className="htchip on" onClick={() => { api.hkSet(no, 'clean'); }}><ion-icon name="checkmark-outline"></ion-icon>Mark clean & ready</button>}
          {gate('housekeeping') && (!hk || hk.state === 'clean') &&
            <button className="htchip" onClick={() => api.hkSet(no, 'dirty', 'deep')}><ion-icon name="sparkles-outline"></ion-icon>Needs cleaning</button>}
          {gate('maintenance') && <button className="htchip" onClick={() => { onClose(); api.openFault(no); }}><ion-icon name="construct-outline"></ion-icon>Report a fault</button>}
          {gate('maintenance') && <button className="htchip" onClick={() => api.toggleOoo(no)}>
            <ion-icon name={state === 'ooo' ? 'checkmark-circle-outline' : 'close-circle-outline'}></ion-icon>{state === 'ooo' ? 'Put back on sale' : 'Take off sale'}</button>}
        </div>
        {hk && hk.note && <div className="note2"><div className="txt">{hk.note}{hk.to ? ' · ' + userOf(hk.to).first : ''}</div></div>}
      </>}

      {gate('maintenance') && faults.length > 0 && (
        <div className="panel" style={{ marginTop: 4 }}>
          <div className="panel__hd"><div><h3>Open faults</h3><p>{faults.length} logged against this room</p></div></div>
          <div>{faults.map((m) => (
            <div className="htrow" key={m.id}>
              <div className="htrow__b"><div className="htrow__n">{m.issue}</div>
                <div className="htrow__s"><span>Since {m.since}</span><span>·</span><span>{userOf(m.to).first}</span>{m.ooo && <span className="badge cor">Off sale</span>}</div></div>
              <button className="sbtn" onClick={() => api.fixFault(m.id)}>Fixed</button>
            </div>
          ))}</div>
        </div>
      )}

      {!gate('folio') && s && <div className="note info" style={{ marginTop: 12 }}><ion-icon name="information-circle-outline"></ion-icon>
        Charges are not tracked on the room. Payment is taken once, at check-in.</div>}
    </HtSheet>
  );
}

Object.assign(window, { RackView, FloorBoard, RoomSheet });
