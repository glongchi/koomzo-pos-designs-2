/* Koomzo Hotel — housekeeping, guests & register, long stays, rates, night audit, reports. */

const HK_COLS = [
  ['dirty', 'To clean', 'alert-circle-outline'],
  ['cleaning', 'Being cleaned', 'sparkles-outline'],
  ['inspect', 'To inspect', 'eye-outline'],
  ['clean', 'Ready to sell', 'checkmark-circle-outline'],
];
const HK_NEXT = { dirty:'cleaning', cleaning:'inspect', inspect:'clean' };
const PRI = { depart:'Departure clean', stay:'Stayover', deep:'Deep clean' };

function HouseView({ api }) {
  const st = api.st, me = api.me;
  const job = /Housekeeping/.test(me.role) ? 'hk' : /Maintenance/.test(me.role) ? 'mt' : 'desk';
  const [tab, setTab] = useState(job === 'mt' ? 'maint' : job === 'hk' ? 'mine' : 'board');
  const rows = HT.rooms.map((r) => st.house.find((h) => h.no === r.no) || { no:r.no, state:'clean', to:null, pri:'stay', linen:false, note:'' });
  const faults = st.maint.filter((m) => m.state !== 'fixed');
  const mine = rows.filter((h) => h.to === me.id && h.state !== 'clean');
  const tabs = [
    { v:'board', label:'Board', n: rows.filter((h) => h.state !== 'clean').length, on: gate('housekeeping') },
    { v:'mine', label:'Assigned to me', n: mine.length, on: gate('housekeeping') && job !== 'desk' },
    { v:'maint', label:'Maintenance', n: faults.length, on: gate('maintenance') },
  ].filter((x) => x.on);
  const cur = tabs.some((x) => x.v === tab) ? tab : tabs[0].v;

  const card = (h, big) => {
    const rs = rackState(h.no, st);
    return (
      <div className="htcard" key={h.no}>
        <div className="htcard__t">
          <b>{h.no}</b>
          <span className="tag">{PRI[h.pri]}</span>
          <div className="sp" style={{ flex: 1 }}></div>
          {h.linen && <span className="tag"><ion-icon name="bed-outline" style={{ fontSize: 11, marginRight: 3 }}></ion-icon>Linen</span>}
        </div>
        {h.note && <div className="htcard__n">{h.note}</div>}
        <div className="htcard__f">
          {h.to ? <button className="sbtn gh" onClick={() => api.openAssign(h.no)}>
              <div className="av sm t3" style={{ width: 20, height: 20, fontSize: 9, marginRight: 4 }}>{userOf(h.to).init}</div>{userOf(h.to).first}</button>
            : <button className="sbtn" onClick={() => api.openAssign(h.no)}><ion-icon name="person-add-outline"></ion-icon>Assign</button>}
          <div className="sp"></div>
          {(rs === 'occ' || rs === 'stay') && <span className="badge pri">Occupied</span>}
          {HK_NEXT[h.state] && <button className="sbtn pri" style={big ? { height: 44, padding: '0 18px' } : null} onClick={() => api.hkSet(h.no, HK_NEXT[h.state])}>
            {h.state === 'dirty' ? 'Start' : h.state === 'cleaning' ? 'Done' : 'Pass'}</button>}
          {h.state === 'clean' && !big && <button className="sbtn" onClick={() => api.hkSet(h.no, 'dirty', 'deep')}>Reopen</button>}
        </div>
      </div>
    );
  };

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>{job === 'mt' ? 'Faults' : 'Cleaning'}</h2>
          <p>{rows.filter((h) => h.state !== 'clean').length} rooms not ready · {rows.filter((h) => h.linen).length} due a linen change{gate('maintenance') ? ' · ' + faults.length + ' faults open' : ''}</p></div>
        <div className="sp"></div>
        {cur === 'maint'
          ? <button className="btn" onClick={() => api.openFault(HT.rooms[0].no)}><ion-icon name="add-circle-outline"></ion-icon>Log a fault</button>
          : <button className="btn" onClick={() => api.toast('Board sent to Régine and Sylvie on WhatsApp')}><ion-icon name="paper-plane-outline"></ion-icon>Send the board</button>}
      </div>

      {tabs.length > 1 && <HtSeg value={cur} onChange={setTab} options={tabs} />}

      {cur === 'board' && (
        <div className="hthk">
          {HK_COLS.map(([state, label, ic]) => {
            const list = rows.filter((h) => h.state === state);
            return (
              <div className="hthk__col" key={state}>
                <div className="hthk__hd"><ion-icon name={ic}></ion-icon>{label}<b>{list.length}</b></div>
                {list.map((h) => card(h))}
                {!list.length && <div className="emptybox">—</div>}
              </div>
            );
          })}
        </div>
      )}

      {cur === 'mine' && (
        <section className="panel">
          <div className="panel__hd"><div><h3>{me.first}’s rooms</h3><p>In the order the desk wants them back — departures first</p></div></div>
          <div style={{ display: 'grid', gap: 10, padding: 12 }}>
            {mine.sort((a, b) => (a.pri === 'depart' ? -1 : 1) - (b.pri === 'depart' ? -1 : 1)).map((h) => card(h, true))}
            {!mine.length && <div className="emptybox">Nothing assigned to you. Tell the desk you are free.</div>}
          </div>
        </section>
      )}

      {cur === 'maint' && (
        <section className="panel">
          <div className="panel__hd"><div><h3>Maintenance</h3><p>{faults.length} open · {faults.filter((m) => m.ooo).length} taking a room off sale</p></div>
            <div className="sp"></div>
            <button className="sbtn" onClick={() => api.openFault(HT.rooms[0].no)}><ion-icon name="add-outline"></ion-icon>Log a fault</button></div>
          <div>
            {faults.map((m) => (
              <div className="htrow" key={m.id}>
                <div className="htrow__b">
                  <div className="htrow__n">{m.no} · {m.issue}</div>
                  <div className="htrow__s"><span>Since {m.since}</span><span>·</span><span>{userOf(m.to).first}</span>
                    {m.ooo && <span className="badge cor">Off sale</span>}</div>
                </div>
                <button className="sbtn" onClick={() => api.toggleOoo(m.no)}>{m.ooo ? 'Back on sale' : 'Off sale'}</button>
                <button className="sbtn pri" onClick={() => api.fixFault(m.id)}>Fixed</button>
              </div>
            ))}
            {!faults.length && <div className="emptybox">Nothing broken. Enjoy it.</div>}
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------------- assign a room to a housekeeper ---------------- */
function AssignSheet({ no, api, onClose }) {
  const h = api.st.house.find((x) => x.no === no) || { to:null, pri:'stay', linen:false, note:'' };
  const [to, setTo] = useState(h.to || 'u3');
  const [pri, setPri] = useState(h.pri);
  const [linen, setLinen] = useState(!!h.linen);
  const [note, setNote] = useState(h.note || '');
  const crew = HT.staff.filter((s) => /Housekeeping/.test(s.role));
  const load = (id) => api.st.house.filter((x) => x.to === id && x.state !== 'clean').length;
  return (
    <HtSheet title={'Assign room ' + no} sub="Whoever gets it sees it on their own phone" onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="s" className="btn primary" onClick={() => { api.hkAssign(no, to, { pri, linen, note }); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>Assign to {userOf(to).first}</button>,
      ]}>
      <span className="lbl">Housekeeper</span>
      <div style={{ marginTop: 7 }}>
        {crew.map((s) => (
          <button key={s.id} className={'stf' + (to === s.id ? ' on' : '')} onClick={() => setTo(s.id)} style={{ width: '100%' }}>
            <div className={'av ' + s.tone}>{s.init}</div>
            <div className="stf__b"><div className="stf__n">{s.name}</div><div className="stf__r">{s.role}</div></div>
            <span className="stf__x">{load(s.id)} room{load(s.id) === 1 ? '' : 's'}</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <span className="lbl">Kind of clean</span>
        <div className="htchips" style={{ marginTop: 7 }}>
          {Object.keys(PRI).map((k) => <button key={k} className={'htchip' + (pri === k ? ' on' : '')} onClick={() => setPri(k)}>{PRI[k]}</button>)}
        </div>
      </div>
      <label className="kzcheck" style={{ marginTop: 14 }}>
        <input type="checkbox" checked={linen} onChange={() => setLinen(!linen)} />
        <span>Change the linen — counts against the laundry run, so it is asked for rather than assumed.</span>
      </label>
      <div style={{ marginTop: 14 }}>
        <span className="lbl">Note</span>
        <div className="field" style={{ marginTop: 7 }}><ion-icon name="create-outline"></ion-icon>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Guest spilled oil — deep clean" /></div>
      </div>
    </HtSheet>
  );
}

/* ---------------- guests, and the statutory register ---------------- */
function GuestsView({ api }) {
  const st = api.st;
  const [tab, setTab] = useState('list');
  const inhouse = st.stays.filter((s) => s.status === 'inhouse' || s.status === 'due');
  const levy = inhouse.reduce((a, s) => a + s.adults * HT.levy, 0);
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Guests</h2><p>{HT.guests.length} on file · {inhouse.length} in house tonight</p></div>
        <div className="sp"></div>
        {gate('register') && tab === 'reg' && <button className="btn" onClick={() => api.toast('Register exported · PDF for the police post, CSV for the tax office')}>
          <ion-icon name="download-outline"></ion-icon>Export register</button>}
      </div>

      {gate('register') && <HtSeg value={tab} onChange={setTab} options={[{ v:'list', label:'Guest list' }, { v:'reg', label:'Statutory register', n: inhouse.length }]} />}

      {tab === 'list' && (
        <section className="panel">
          <div className="panel__hd"><div><h3>Guest records</h3><p>Kept between stays — a returning guest is recognised at the desk</p></div></div>
          <div>
            {HT.guests.map((g) => {
              const s = st.stays.find((x) => x.gid === g.id && x.status !== 'out' && x.status !== 'booked');
              return (
                <div className="htrow" key={g.id}>
                  <div className="av t2">{g.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
                  <div className="htrow__b">
                    <div className="htrow__n">{g.name}</div>
                    <div className="htrow__s">
                      <span>{g.phone}</span>
                      <span>·</span><span>{g.stays} stays · {g.nights} nights</span>
                      {gate('register') && (g.idNo ? <span className="tag">{g.idType} {g.idNo}</span> : <span className="badge wrn">No ID</span>)}
                    </div>
                    {g.notes && <div className="htrow__s" style={{ color: 'var(--kz-muted-3)' }}>{g.notes}</div>}
                  </div>
                  {s && <button className="sbtn" onClick={() => api.openRoom(s.no)}>Room {s.no}</button>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'reg' && (
        <section className="panel">
          <div className="panel__hd"><div><h3>Guest register · {HT.today}</h3>
            <p>Every occupied room, its guest and their ID. Levy due tonight {xaf(levy)}</p></div></div>
          <table className="httable">
            <thead><tr><th>Room</th><th>Guest</th><th>ID</th><th>Nationality</th><th>In</th>{gate('prearrival') && <th>Source</th>}<th className="n">Levy</th></tr></thead>
            <tbody>
              {inhouse.map((s) => {
                const g = guestOf(s.gid) || {};
                const p = gate('prearrival') ? (st.prearr || []).find((x) => x.stayId === s.id) : null;
                return (
                  <tr key={s.id}>
                    <td><b>{s.no}</b></td>
                    <td>{s.guest}</td>
                    <td>{g.idNo ? g.idType + ' ' + g.idNo : p && p.idNo ? p.idType + ' ' + p.idNo : <span className="badge wrn">Missing</span>}</td>
                    <td>{g.country || (p && p.country) || '—'}</td>
                    <td>{HT.dayNo + s.from} {HT.month}</td>
                    {gate('prearrival') && <td style={{ color: 'var(--kz-muted-2)' }}>
                      {p && p.state === 'verified' ? <span className="tag">Pre-filled card</span> : 'Typed at the desk'}</td>}
                    <td className="n">{xaf(s.adults * HT.levy)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="note info" style={{ margin: 15 }}><ion-icon name="information-circle-outline"></ion-icon>
            The register is appended, never edited. A correction is a new line with a reason, so the printed book always matches the file.</div>
        </section>
      )}
    </div>
  );
}

/* ---------------- long stays and apartments ---------------- */
function LongStayView({ api }) {
  const st = api.st;
  const stays = st.stays.filter((s) => s.plan !== 'nightly' && s.status !== 'out');
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Long stay</h2><p>{stays.length} tenancies · weekly and monthly rates, utilities billed on</p></div>
        <div className="sp"></div>
        <button className="btn primary" onClick={() => api.openBook({})}><ion-icon name="key-outline"></ion-icon>New tenancy</button>
      </div>

      <div className="htgrid2">
        <section className="panel">
          <div className="panel__hd"><div><h3>Tenancies</h3><p>Rent runs on its own clock — nightly rates never touch these rooms</p></div></div>
          <div>
            {stays.map((s) => {
              const f = gate('folio') ? folioSum(st.folio[s.id] || []) : null;
              return (
                <div className="htrow" key={s.id}>
                  <div className="htrow__b">
                    <div className="htrow__n">{s.no} · {s.guest}</div>
                    <div className="htrow__s">
                      <span className="badge pri">{s.plan}</span>
                      <span>{xaf(s.rate)} per {s.plan.replace('ly', '')}</span>
                      {s.status === 'booked' && <span className="badge inf">Arrives {HT.dayNo + s.from} {HT.month}</span>}
                      {s.company && <span className="tag">{s.company}</span>}
                      {s.renew && <span>· renews {s.renew}</span>}
                      {gate('deposits') && s.deposit > 0 && <span>· {xaf(s.deposit)} deposit held</span>}
                    </div>
                  </div>
                  {f && <span className="htrow__v" style={{ color: f.balance > 0 ? 'var(--kz-discount)' : '#1f7a45' }}>{f.balance > 0 ? xaf(f.balance) + ' due' : 'Up to date'}</span>}
                  <button className="sbtn" onClick={() => api.openFolio(s.id)}>Folio</button>
                </div>
              );
            })}
            {!stays.length && <div className="emptybox">No long stays. A booking of a week or more can be turned into one.</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel__hd"><div><h3>Meters</h3><p>Read monthly, billed onto the folio</p></div></div>
          <div>
            {HT.meters.map((m, i) => {
              const used = m.last - m.prev, cost = used * m.price;
              return (
                <div className="htrow" key={i}>
                  <div className="htrow__b">
                    <div className="htrow__n">{m.no} · {m.kind}</div>
                    <div className="htrow__s"><span>{m.prev} → {m.last} {m.unit}</span><span>·</span><span>{used} {m.unit} at {xaf(m.price)}</span></div>
                  </div>
                  <span className="htrow__v">{xaf(cost)}</span>
                  <button className="sbtn pri" onClick={() => api.billMeter(m)}>Bill</button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- rate plans, and the availability grid ---------------- */
function RatesView({ api }) {
  const [tab, setTab] = useState(gate('availability') ? 'grid' : 'plans');
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Rates & availability</h2><p>{tab === 'grid'
          ? 'What is left to sell, and what it costs, night by night. Availability is derived from the rack — never typed.'
          : 'What a room costs, by plan. Snapshotted onto the stay — a rate change never rewrites a folio.'}</p></div>
        <div className="sp"></div>
        {tab === 'plans' && <button className="btn" onClick={() => api.toast('Season copied · high season 15 Dec – 5 Jan created from these rates')}>
          <ion-icon name="copy-outline"></ion-icon>New season</button>}
        {tab === 'grid' && gate('channelsync') && <button className="btn" onClick={() => api.toast('Pushed to Booking.com and Airbnb · availability and restrictions only')}>
          <ion-icon name="cloud-upload-outline"></ion-icon>Push to channels</button>}
      </div>

      {gate('availability') && (
        <div style={{ marginBottom: 12 }}>
          <HtSeg value={tab} onChange={setTab} options={[{ v:'grid', label:'Availability' }, { v:'plans', label:'Rate plans' }]} />
        </div>
      )}

      {tab === 'grid' ? <AriGrid api={api} /> : <>
      <section className="panel">
        <table className="httable">
          <thead><tr><th>Room type</th><th>Sleeps</th><th className="n">Nightly</th><th className="n">Weekend</th>
            {gate('longstay') && <th className="n">Weekly</th>}{gate('longstay') && <th className="n">Monthly</th>}<th></th></tr></thead>
          <tbody>
            {HT.types.map((t) => {
              const rooms = HT.rooms.filter((r) => r.type === t.id).length;
              return (
                <tr key={t.id}>
                  <td><b>{t.name}</b><div style={{ font: '500 11.5px var(--kz-font-sans)', color: 'var(--kz-muted-3)' }}>{rooms} rooms</div></td>
                  <td>{t.cap}</td>
                  <td className="n">{xaf(t.rate)}</td>
                  <td className="n">{xaf(Math.round(t.rate * 1.15))}</td>
                  {gate('longstay') && <td className="n">{t.weekly ? xaf(t.weekly) : xaf(t.rate * 6)}</td>}
                  {gate('longstay') && <td className="n">{t.monthly ? xaf(t.monthly) : xaf(t.rate * 24)}</td>}
                  <td style={{ textAlign: 'right' }}><button className="sbtn" onClick={() => api.toast(t.name + ' rate sheet opened')}>Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {gate('ota') && (
        <div className="ccnote htbanner" style={{ marginTop: 14, background:'var(--kz-primary-wash)', border:'1px solid var(--kz-primary-tint)', color:'var(--kz-ink-2)' }}>
          <ion-icon name="globe-outline"></ion-icon>
          <span>OTA rates arrive with the reservation and are stored as given — {gate('channelsync') ? 'sync pushes your availability, never your price.' : 'entered by hand at the desk, so the commission stays visible.'}</span>
        </div>
      )}
      </>}
    </div>
  );
}

/* ---------------- night audit ---------------- */
function AuditView({ api }) {
  const st = api.st;
  const inhouse = st.stays.filter((s) => s.status === 'inhouse' || s.status === 'due');
  const notIn = st.stays.filter((s) => s.status === 'arr');
  const notOut = st.stays.filter((s) => s.status === 'due');
  const noId = inhouse.filter((s) => { const g = guestOf(s.gid); return gate('register') && g && !g.idNo; });
  const dirty = st.house.filter((h) => h.state !== 'clean').length;
  const roomRev = inhouse.reduce((a, s) => a + (s.plan === 'nightly' ? s.rate : 0), 0);
  const levy = gate('register') ? inhouse.reduce((a, s) => a + s.adults * HT.levy, 0) : 0;
  const blocks = [
    ['Arrivals not checked in', notIn.length, notIn.map((s) => s.no).join(', '), 'warn'],
    ['Departures still open', notOut.length, notOut.map((s) => s.no).join(', '), 'warn'],
    ['Guests without ID', noId.length, noId.map((s) => s.no).join(', '), 'stop'],
    ['Rooms not turned round', dirty, '', 'info'],
  ].filter((b) => b[1] > 0);

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Night audit</h2><p>{HT.today} · posts the night onto every occupied room, then closes the day</p></div>
        <div className="sp"></div>
        <button className="btn primary" disabled={blocks.some((b) => b[3] === 'stop')} onClick={() => api.runAudit(roomRev + levy, inhouse.length)}>
          <ion-icon name="moon-outline"></ion-icon>Post the night</button>
      </div>

      {blocks.map(([label, n, detail, kind], i) => (
        <div className={'htbanner'} key={i} style={kind === 'stop' ? { background:'var(--kz-discount-wash)', borderColor:'#f0c7ba', color:'var(--kz-discount)' } : kind === 'info' ? { background:'var(--kz-info-wash)', borderColor:'#c8d9f3', color:'#2c5da8' } : null}>
          <ion-icon name={kind === 'stop' ? 'lock-closed-outline' : kind === 'info' ? 'information-circle-outline' : 'alert-circle-outline'}></ion-icon>
          <span><b>{n} {label.toLowerCase()}.</b>{detail ? ' ' + detail + '.' : ''} {kind === 'stop' ? 'The register cannot be filed with a blank ID — capture it before posting.' : kind === 'warn' ? 'Post anyway and they roll to tomorrow with a note.' : 'Housekeeping carries over to the morning board.'}</span>
        </div>
      ))}

      <div className="htkpi">
        <div className="htk"><div className="k">Rooms sold</div><div className="v">{inhouse.length}<small> / {HT.rooms.length}</small></div></div>
        <div className="htk"><div className="k">Room revenue tonight</div><div className="v" style={{ fontSize: 19 }}>{xaf(roomRev)}</div></div>
        {gate('register') && <div className="htk"><div className="k">Tourist levy</div><div className="v" style={{ fontSize: 19 }}>{xaf(levy)}</div><div className="s">{xaf(HT.levy)} per guest per night</div></div>}
        <div className="htk"><div className="k">To post</div><div className="v" style={{ fontSize: 19 }}>{xaf(roomRev + levy)}</div><div className="s">{inhouse.length} folios</div></div>
      </div>

      <section className="panel">
        <div className="panel__hd"><div><h3>What will post</h3><p>One line per room, per night. Appended — never an edit to yesterday.</p></div></div>
        <table className="httable">
          <thead><tr><th>Room</th><th>Guest</th><th>Plan</th><th className="n">Room</th>{gate('register') && <th className="n">Levy</th>}</tr></thead>
          <tbody>
            {inhouse.map((s) => (
              <tr key={s.id}>
                <td><b>{s.no}</b></td><td>{s.guest}</td>
                <td>{s.plan === 'nightly' ? 'Nightly' : s.plan + ' — already billed'}</td>
                <td className="n">{s.plan === 'nightly' ? xaf(s.rate) : '—'}</td>
                {gate('register') && <td className="n">{xaf(s.adults * HT.levy)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ---------------- occupancy, ADR, RevPAR ---------------- */
function PerfView({ api }) {
  const p = HT.perf, st = api.st;
  const sold = st.stays.filter((s) => ['inhouse', 'due'].indexOf(s.status) > -1).length;
  const occ = Math.round((sold / HT.rooms.length) * 100);
  const maxAdr = Math.max(...p.week.map((w) => w[2]));
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Reports</h2><p>Week to {HT.today.replace('Sunday ', '')} · against the same week last year</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={() => api.toast('Exported · occupancy, ADR and RevPAR by day, CSV')}><ion-icon name="download-outline"></ion-icon>Export</button>
      </div>
      <div className="htkpi">
        <div className="htk"><div className="k">Occupancy</div><div className="v">{occ}%</div><div className="s">{p.ly.occ}% last year</div>
          <div className="pbar" style={{ marginTop: 8 }}><i style={{ width: occ + '%' }}></i></div></div>
        <div className="htk"><div className="k">ADR</div><div className="v" style={{ fontSize: 19 }}>{xaf(p.adr)}</div><div className="s">{xaf(p.ly.adr)} last year</div></div>
        <div className="htk"><div className="k">RevPAR</div><div className="v" style={{ fontSize: 19 }}>{xaf(p.revpar)}</div><div className="s">Revenue per available room</div></div>
        <div className="htk"><div className="k">Rooms available</div><div className="v">{HT.rooms.length - st.maint.filter((m) => m.ooo && m.state !== 'fixed').length}</div><div className="s">After rooms off sale</div></div>
      </div>
      <div className="two">
        <section className="panel">
          <div className="panel__hd"><div><h3>Occupancy by night</h3><p>Bars are occupancy; the number is ADR</p></div></div>
          <div className="panel__bd">
            <div className="htmini">
              {p.week.map(([d, o, adr], i) => (
                <i key={d} className={i === p.week.length - 1 ? 'on' : ''} style={{ height: o + '%' }}><span>{o}%</span></i>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: 6 }}>
              {p.week.map(([d, , adr]) => (
                <div key={d} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ font: '600 11px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>{d}</div>
                  <div style={{ font: '700 10.5px var(--kz-font-num)', color: adr === maxAdr ? 'var(--kz-primary)' : 'var(--kz-muted-3)' }}>{Math.round(adr / 1000)}k</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel__hd"><div><h3>Where the business comes from</h3><p>Share of nights sold</p></div></div>
          <div className="panel__bd">
            <div className="htbars">
              {p.mix.map(([label, v]) => (
                <div className="r" key={label}><span className="lb">{label}</span><span className="tr"><i style={{ width: v * 3 + '%' }}></i></span><span className="vv">{v}%</span></div>
              ))}
            </div>
            {gate('ota') && <div className="note info" style={{ marginTop: 14 }}><ion-icon name="information-circle-outline"></ion-icon>
              A third of nights arrive through an OTA at 15–18% commission. Direct phone and WhatsApp bookings are the cheapest business in the house.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { HouseView, AssignSheet, GuestsView, LongStayView, RatesView, AuditView, PerfView, HK_COLS, HK_NEXT, PRI });
