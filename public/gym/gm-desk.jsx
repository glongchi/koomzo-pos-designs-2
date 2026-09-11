/* Koomzo Gym — FRONT DESK. The core screen: admit a member in one act, and see
   at a glance how full the club is. Works with no network by design. */

function DeskView({ api }) {
  const st = api.st;
  const [q, setQ] = useState('');
  const [zone, setZone] = useState('');
  const boxRef = useRef(null);
  useEffect(() => { if (boxRef.current) boxRef.current.focus(); }, []);

  const term = q.trim().toLowerCase();
  const hits = term
    ? st.members.filter((m) => m.name.toLowerCase().indexOf(term) > -1 || m.phone.replace(/\s/g, '').indexOf(term.replace(/\s/g, '')) > -1)
    : [];
  /* with nothing typed the desk shows the work: today's expected people, in order */
  const expected = useMemo(() => {
    const ids = new Set();
    st.pt.filter((p) => p.state === 'booked').forEach((p) => ids.add(p.mid));
    st.members.filter((m) => m.state === 'due' || m.state === 'expired').forEach((m) => ids.add(m.id));
    st.members.filter((m) => m.tab >= 15000).forEach((m) => ids.add(m.id));
    return [...ids].map((id) => st.members.find((m) => m.id === id)).filter((m) => m && !m.in);
  }, [st.members, st.pt]);

  const inside = st.members.filter((m) => m.in);
  const pc = Math.round((inside.length / GM.capacity) * 100);
  const barCls = pc > 90 ? 'full' : pc > 70 ? 'busy' : '';
  const zoneCount = (z) => inside.filter((m) => planOf(m.plan).zones.indexOf(z) > -1).length;
  const running = st.classes.find((c) => c.state === 'running');

  return (
    <div className="gmdesk">
      <div className="gmdesk__l">
        <div className="gmscan">
          <div className="gmscan__w">
            <ion-icon name="search-outline"></ion-icon>
            <input ref={boxRef} className="gmscan__in" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Name, phone, or scan a QR / wristband" />
          </div>
          {gate('access') && (
            <select className="btn" style={{ paddingRight: 10 }} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Entering the club</option>
              {Object.keys(GM.zoneNames).map((z) => <option key={z} value={z}>{GM.zoneNames[z]}</option>)}
            </select>
          )}
          <button className="btn" onClick={() => api.scan()}><ion-icon name="qr-code-outline"></ion-icon>Scan</button>
        </div>

        <div className="scroll" style={{ paddingTop: 4 }}>
          {term ? (
            hits.length ? hits.map((m) => <MemberHit key={m.id} m={m} st={st} api={api} zone={zone} />)
              : <div className="gmnote"><ion-icon name="person-add-outline"></ion-icon>
                  No member matches “{q}”. Take a day pass at the bar, or add a member.
                  <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => api.openNew(q)}>Add member</button>
                </div>
          ) : (
            <>
              <div className="gmnote">
                <ion-icon name="flash-outline"></ion-icon>
                Type a name, or hold a wristband to the reader. Every check-in is decided on this tablet in
                about 120ms, whether or not the line is up.
              </div>
              {running && gate('classes') && (
                <div className="gmslot running" style={{ marginBottom: 12 }}>
                  <div className="gmslot__t">{running.from}<span>now</span></div>
                  <div className="gmslot__b">
                    <div className="gmslot__n">{running.name}</div>
                    <div className="gmslot__m"><span>{roomOf(running.room).name}</span><i>·</i><span>{staffOf(running.trainer).name}</span></div>
                  </div>
                  <div className="gmfill">
                    <div className="gmfill__n">{running.in} of {running.booked} in</div>
                    <div className="gmfill__b"><i style={{ width: (running.in / running.cap * 100) + '%' }}></i></div>
                  </div>
                  <button className="btn" onClick={() => api.view('classes')}>Open timetable</button>
                </div>
              )}
              <h3 style={{ margin:'6px 0 10px', font:'700 14px var(--kz-font-sans)' }}>Expected, or needing a word</h3>
              {expected.length
                ? expected.map((m) => <MemberHit key={m.id} m={m} st={st} api={api} zone={zone} />)
                : <div className="gmnote"><ion-icon name="checkmark-circle-outline"></ion-icon>Nothing waiting. Everyone booked today is either inside or paid up.</div>}
            </>
          )}

          {gate('access') && (
            <>
              <h3 style={{ margin:'18px 0 10px', font:'700 14px var(--kz-font-sans)' }}>Gate log · last admissions</h3>
              <div className="table">
                {st.gateLog.map((g, i) => {
                  const m = memberOf(g.mid);
                  return (
                    <div className="trw" key={i}>
                      <span className="gmnum" style={{ width: 46 }}>{g.at}</span>
                      <span style={{ flex: 1, minWidth: 0, font:'600 13px var(--kz-font-sans)' }}>{m ? m.name : '—'}</span>
                      <VIA via={g.via} />
                      <span style={{ font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)', width: 74 }}>
                        {g.via === 'qr' ? 'App QR' : g.via === 'rfid' ? 'Wristband' : 'At desk'}
                      </span>
                      <span className="gmnum" style={{ width: 56, color:'var(--kz-muted-2)' }}>{g.ms ? g.ms + 'ms' : '—'}</span>
                      {g.off && <span className="badge"><ion-icon name="cloud-offline-outline" style={{ fontSize: 11, marginRight: 4 }}></ion-icon>offline</span>}
                      <span className={'gmstate ' + (g.ok ? 'active' : 'expired')}><i></i>{g.ok ? 'Admitted' : 'Refused'}</span>
                      {!g.ok && <span style={{ font:'500 12px var(--kz-font-sans)', color:'var(--kz-discount)' }}>{g.why}</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <aside className="gmdesk__r">
        {gate('capacity') && (
          <div className="gmcap">
            <div className="gmcap__t">
              <span className="gmcap__n">{inside.length}</span>
              <span className="gmcap__k">inside now · of {GM.capacity}</span>
            </div>
            <div className="gmcap__bar"><i className={barCls} style={{ width: Math.min(100, pc) + '%' }}></i></div>
            <div className="gmzones">
              {Object.keys(GM.zoneNames).map((z) => (
                <div className="gmzone" key={z}><b>{zoneCount(z)}</b><span>{GM.zoneNames[z]}</span></div>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding:'12px 15px 6px', font:'700 13px var(--kz-font-sans)', display:'flex', alignItems:'center', gap:8 }}>
          On the floor
          <span className="badge pri">{inside.length}</span>
        </div>
        <div className="gminside">
          {inside.map((m) => (
            <div className="gmin" key={m.id}>
              <span className="gmin__i">{initOf(m.name)}</span>
              <span className="gmin__b">
                <b>{m.name}</b>
                <span className="gmin__m">{planOf(m.plan).short + ' · ' + (m.locker ? 'Locker ' + m.locker : 'no locker')}</span>
              </span>
              <span className="gmin__t">{m.at}</span>
              <button className="icbtn" style={{ width: 28, height: 28 }} onClick={() => api.checkOut(m.id)}>
                <ion-icon name="log-out-outline" style={{ fontSize: 15 }}></ion-icon>
              </button>
            </div>
          ))}
          {!inside.length && <div className="gmnote" style={{ margin: 12 }}><ion-icon name="moon-outline"></ion-icon>Nobody on the floor.</div>}
        </div>
      </aside>
    </div>
  );
}

Object.assign(window, { DeskView });
