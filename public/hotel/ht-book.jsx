/* Koomzo Hotel — reservations: today's movements, the tape chart, and the booking sheet. */

function BookingsView({ api }) {
  const st = api.st;
  const [tab, setTab] = useState('today');
  const arr = st.stays.filter((s) => s.status === 'arr');
  const due = st.stays.filter((s) => s.status === 'due');
  const fwd = st.stays.filter((s) => s.status === 'booked');

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Bookings</h2><p>{HT.today} · {arr.length} arriving · {due.length} leaving · {fwd.length} ahead</p></div>
        <div className="sp"></div>
        {gate('channelsync') && <button className="btn" onClick={() => api.toast('Availability pushed to Booking.com and Airbnb · 16 rooms, 14 nights')}><ion-icon name="sync-outline"></ion-icon>Push availability</button>}
        <button className="btn primary" onClick={() => api.openBook({})}><ion-icon name="add-circle-outline"></ion-icon>New booking</button>
      </div>

      <HtSeg value={tab} onChange={setTab} options={[
        { v:'today', label:'Today', n: arr.length + due.length },
        { v:'tape', label:'Next 14 nights' },
        { v:'ahead', label:'Forward book', n: fwd.length },
      ]} />

      {tab === 'today' && (
        <div className="two">
          <section className="panel">
            <div className="panel__hd"><div><h3>Arrivals</h3><p>Expected from {HT.checkin}</p></div></div>
            <div>
              {arr.map((s) => <MoveRow key={s.id} s={s} api={api} kind="in" />)}
              {!arr.length && <div className="emptybox">No arrivals today.</div>}
            </div>
          </section>
          <div className="sidecol">
            <section className="panel">
              <div className="panel__hd"><div><h3>Departures</h3><p>Out by {HT.checkout}</p></div></div>
              <div>
                {due.map((s) => <MoveRow key={s.id} s={s} api={api} kind="out" />)}
                {!due.length && <div className="emptybox">Nobody leaving today.</div>}
              </div>
            </section>
            {gate('ota') && (
              <section className="panel">
                <div className="panel__hd"><div><h3>From the channels</h3><p>{gate('channelsync') ? 'Synced automatically' : 'Entered by hand at the desk'}</p></div></div>
                <div>
                  {st.stays.filter((s) => srcOf(s.source).ota).map((s) => (
                    <div className="htrow" key={s.id}>
                      <div className="htrow__b"><div className="htrow__n">{s.guest}</div>
                        <div className="htrow__s"><SrcTag id={s.source} /><span>{s.ref}</span></div></div>
                      <span className="htrow__v">{s.no}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {tab === 'tape' && <TapeChart api={api} />}

      {tab === 'ahead' && (
        <section className="panel">
          <div className="panel__hd"><div><h3>Forward book</h3><p>Confirmed reservations, nearest first</p></div></div>
          <div>
            {fwd.sort((a, b) => a.from - b.from).map((s) => (
              <div className="htrow" key={s.id}>
                <div className="htrow__b">
                  <div className="htrow__n">{s.guest}</div>
                  <div className="htrow__s">
                    <span>Room {s.no} · {typeOf(roomOf(s.no).type).name}</span>
                    <SrcTag id={s.source} />
                    {s.plan !== 'nightly' && gate('longstay') && <span className="badge pri">{s.plan}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="htrow__v">{HT.dayNo + s.from} {HT.month} · {nights(s.nights)}</div>
                  <div className="htrow__s" style={{ justifyContent: 'flex-end' }}>{xaf(s.rate)}{s.deposit ? ' · ' + xaf(s.deposit) + ' held' : ''}</div>
                </div>
                <button className="sbtn" onClick={() => api.openRoom(s.no)}>Room</button>
              </div>
            ))}
            {!fwd.length && <div className="emptybox">Nothing on the books yet.</div>}
          </div>
        </section>
      )}
    </div>
  );
}

function MoveRow({ s, api, kind }) {
  const f = gate('folio') ? folioSum(api.st.folio[s.id] || []) : null;
  const g = guestOf(s.gid);
  return (
    <div className="htrow">
      <div className="av t2">{s.guest.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
      <div className="htrow__b">
        <div className="htrow__n">{s.guest}</div>
        <div className="htrow__s">
          <span>Room {s.no} · {nights(s.nights)}</span>
          <SrcTag id={s.source} />
          {kind === 'in' && gate('register') && g && !g.idNo && <span className="badge wrn">ID needed</span>}
        </div>
      </div>
      {kind === 'out' && f && <span className="htrow__v">{xaf(f.balance)}</span>}
      {kind === 'in' && <span className="htrow__v">{xaf(s.rate)}</span>}
      {kind === 'in'
        ? <button className="sbtn go" onClick={() => api.checkIn(s.id)}><ion-icon name="log-in-outline"></ion-icon>Check in</button>
        : <button className="sbtn pri" onClick={() => gate('folio') ? api.openSettle(s.id) : api.checkOut(s.id)}><ion-icon name="log-out-outline"></ion-icon>Check out</button>}
    </div>
  );
}

/* ---------------- the tape chart: rooms down, nights across ---------------- */
function TapeChart({ api }) {
  const st = api.st, N = 14;
  const cols = '92px repeat(' + N + ',minmax(52px,1fr))';
  /* today is a Sunday, so the week rolls straight off n */
  const WK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dayLabel = (n) => [WK[n % 7], HT.dayNo + n];
  const isWknd = (n) => n % 7 === 0 || n % 7 === 6;
  return (
    <div className="httape">
      <div style={{ display: 'grid', gridTemplateColumns: cols, minWidth: 760 }}>
        <div className="httape__hd corner">Room</div>
        {Array.from({ length: N }, (_, n) => {
          const [wk, d] = dayLabel(n);
          return <div className={'httape__hd' + (n === 0 ? ' today' : '')} key={n}>{wk}<b>{d}</b></div>;
        })}
        {HT.rooms.map((r) => {
          const ooo = st.maint.find((m) => m.no === r.no && m.ooo && m.state !== 'fixed') && gate('maintenance');
          return (
            <React.Fragment key={r.no}>
              <div className="httape__rn">{r.no}<small>{typeOf(r.type).short}</small></div>
              {Array.from({ length: N }, (_, n) => {
                const wknd = isWknd(n);
                const s = st.stays.find((x) => x.no === r.no && x.status !== 'out' && n >= x.from && n < x.from + x.nights);
                const start = s && n === Math.max(0, s.from);
                const end = s && n === s.from + s.nights - 1;
                const cls = !s ? '' : srcOf(s.source).ota ? 'ota' : s.plan !== 'nightly' ? 'stay' : s.source === 'corporate' ? 'corp' : s.status === 'booked' ? 'pend' : '';
                return (
                  <div className={'httape__c' + (wknd ? ' wk' : '')} key={n}>
                    {ooo && <div className="htbar ooo" style={{ borderRadius: 0 }}>{n === 0 ? 'Off sale' : ''}</div>}
                    {!ooo && s && (
                      <div className={'htbar ' + cls} title={s.guest + ' · ' + nights(s.nights)}
                        style={{ borderRadius: (start ? '7px' : '0') + ' ' + (end ? '7px' : '0') + ' ' + (end ? '7px' : '0') + ' ' + (start ? '7px' : '0'),
                          left: start ? 3 : -1, right: end ? 3 : -1, cursor: 'pointer' }}
                        onClick={() => api.openRoom(r.no)}>
                        {start ? s.guest.split(' ')[0] : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- take a booking ---------------- */
function BookSheet({ seed, api, onClose }) {
  const st = api.st;
  const free = HT.rooms.filter((r) => ['vac', 'dirty'].indexOf(rackState(r.no, st)) > -1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [no, setNo] = useState(seed.no || (free[0] && free[0].no) || HT.rooms[0].no);
  const [src, setSrc] = useState('walkin');
  const [day, setDay] = useState(0);
  const [nts, setNts] = useState(1);
  const [plan, setPlan] = useState('nightly');
  const [idNo, setIdNo] = useState('');
  const [dep, setDep] = useState(0);
  const t = typeOf(roomOf(no).type);
  const rate = plan === 'monthly' ? (t.monthly || t.rate * 26) : plan === 'weekly' ? (t.weekly || t.rate * 6) : t.rate;
  const sources = HT.sources.filter((s) => gate('ota') || !s.ota);
  const ok = name.trim().length > 1;
  const stay = plan === 'monthly' ? 30 : plan === 'weekly' ? 7 * Math.max(1, Math.round(nts / 7)) : nts;

  return (
    <HtSheet wide title={seed.no ? 'Check in · room ' + seed.no : gate('bookings') ? 'New booking' : 'Check a guest in'}
      sub={HT.prop + ' · ' + HT.today} onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="s" className="btn primary" disabled={!ok} style={!ok ? { opacity: .45 } : null}
          onClick={() => { api.book({ name, phone, no, src, day, nights: stay, plan, rate, dep, idNo }); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>{day === 0 ? 'Book & check in' : 'Save booking'}</button>,
      ]}>
      <div className="fgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
        <div>
          <span className="lbl">Guest name</span>
          <div className="field" style={{ marginTop: 7 }}><ion-icon name="person-outline"></ion-icon>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Family name first" /></div>
        </div>
        <div>
          <span className="lbl">Mobile</span>
          <div className="field" style={{ marginTop: 7 }}><ion-icon name="call-outline"></ion-icon>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6 …" /></div>
        </div>
      </div>

      {gate('register') && (
        <div style={{ marginTop: 12 }}>
          <span className="lbl">CNI or passport number</span>
          <div className="field" style={{ marginTop: 7 }}><ion-icon name="card-outline"></ion-icon>
            <input value={idNo} onChange={(e) => setIdNo(e.target.value)} placeholder="Required for the guest register" /></div>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <span className="lbl">Room · {free.length} vacant</span>
        <div className="htchips" style={{ marginTop: 7 }}>
          {HT.rooms.map((r) => {
            const s = rackState(r.no, st), busy = ['occ', 'due', 'arr', 'stay', 'ooo'].indexOf(s) > -1;
            return <button key={r.no} className={'htchip' + (no === r.no ? ' on' : '')} disabled={busy}
              style={busy ? { opacity: .35 } : null} onClick={() => setNo(r.no)}>{r.no}<b style={{ opacity: .65, fontWeight: 600 }}>{typeOf(r.type).short}</b></button>;
          })}
        </div>
      </div>

      {gate('bookings') && (
        <div style={{ marginTop: 14 }}>
          <span className="lbl">Arrives</span>
          <div className="htchips" style={{ marginTop: 7 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <button key={d} className={'htchip' + (day === d ? ' on' : '')} onClick={() => setDay(d)}>
                {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : (HT.dayNo + d) + ' ' + HT.month}</button>
            ))}
          </div>
        </div>
      )}

      <div className="fgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12, marginTop: 14 }}>
        <div>
          <span className="lbl">Nights</span>
          <div className="htchips" style={{ marginTop: 7 }}>
            {[1, 2, 3, 5, 7, 14].map((n) => <button key={n} className={'htchip' + (nts === n ? ' on' : '')} onClick={() => setNts(n)}>{n}</button>)}
          </div>
        </div>
        {gate('rates') && (
          <div>
            <span className="lbl">Rate plan</span>
            <div className="htchips" style={{ marginTop: 7 }}>
              <button className={'htchip' + (plan === 'nightly' ? ' on' : '')} onClick={() => setPlan('nightly')}>Nightly</button>
              {gate('longstay') && <button className={'htchip' + (plan === 'weekly' ? ' on' : '')} onClick={() => setPlan('weekly')}>Weekly</button>}
              {gate('longstay') && <button className={'htchip' + (plan === 'monthly' ? ' on' : '')} onClick={() => setPlan('monthly')}>Monthly</button>}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <span className="lbl">Source</span>
        <div className="htchips" style={{ marginTop: 7 }}>
          {sources.map((s) => <button key={s.id} className={'htchip' + (src === s.id ? ' on' : '')} onClick={() => setSrc(s.id)}>
            <ion-icon name={s.icon}></ion-icon>{s.name}</button>)}
        </div>
      </div>

      {gate('deposits') && (
        <div style={{ marginTop: 14 }}>
          <span className="lbl">Security deposit held</span>
          <div className="htchips" style={{ marginTop: 7 }}>
            {[0, 50000, 100000, 150000, rate].map((v, i) => (
              <button key={i} className={'htchip' + (dep === v ? ' on' : '')} onClick={() => setDep(v)}>{v ? xaf(v) : 'None'}</button>
            ))}
          </div>
        </div>
      )}

      <div className="note info" style={{ marginTop: 16 }}><ion-icon name="information-circle-outline"></ion-icon>
        {t.name} · {xaf(rate)} {plan === 'nightly' ? 'per night' : 'per ' + plan.replace('ly', '')} ·
        {' '}{plan === 'nightly' ? xaf(rate * nts) + ' for ' + nights(nts) : nights(stay) + ' booked'}
        {gate('register') ? ' · levy ' + xaf(HT.levy) + ' per guest per night' : ''}
      </div>
    </HtSheet>
  );
}

/* ---------------- report a fault ---------------- */
function FaultSheet({ no, api, onClose }) {
  const [issue, setIssue] = useState('');
  const [to, setTo] = useState('u5');
  const [ooo, setOoo] = useState(false);
  return (
    <HtSheet title={'Fault · room ' + no} sub="Maintenance sees it on their phone" onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="s" className="btn primary" disabled={!issue.trim()} style={!issue.trim() ? { opacity: .45 } : null}
          onClick={() => { api.addFault(no, issue, to, ooo); onClose(); }}>Log it</button>,
      ]}>
      <span className="lbl">What is wrong</span>
      <div className="field" style={{ marginTop: 7 }}><ion-icon name="construct-outline"></ion-icon>
        <input value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Air-conditioner not cooling" /></div>
      <div style={{ marginTop: 14 }}>
        <span className="lbl">Assign to</span>
        <div className="htchips" style={{ marginTop: 7 }}>
          {HT.staff.map((s) => <button key={s.id} className={'htchip' + (to === s.id ? ' on' : '')} onClick={() => setTo(s.id)}>{s.first}</button>)}
        </div>
      </div>
      <label className="kzcheck" style={{ marginTop: 16 }}>
        <input type="checkbox" checked={ooo} onChange={() => setOoo(!ooo)} />
        <span>Take the room off sale until this is fixed — it disappears from availability and the tape chart.</span>
      </label>
    </HtSheet>
  );
}

Object.assign(window, { BookingsView, TapeChart, BookSheet, FaultSheet, MoveRow });
