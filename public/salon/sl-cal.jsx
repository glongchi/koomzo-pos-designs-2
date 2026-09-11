/* Koomzo Salon — Appointments: resource day calendar, booking sheet, appointment sheet. */
const PPM = 1.9;                      // px per minute
const DAY_H = (SL.close - SL.open) * PPM;
const TODAY_DOW = 'Thu';
const shiftOf = (s, dow) => { const d = s.shifts.find((x) => x[0] === (dow || TODAY_DOW)); return d && d[2] ? { s: d[1], e: d[2] } : null; };
const chairs = (all) => SL.staff.filter((s) => all || (s.status !== 'off' && !/Front desk/.test(s.role)));

function freeAt(appts, staffId, start, dur) {
  const sh = shiftOf(staffOf(staffId));
  if (!sh || start < sh.s || start + dur > sh.e) return false;
  return !appts.some((a) => a.staff === staffId && a.status !== 'noshow' && start < a.start + a.dur && a.start < start + dur);
}

function CalendarView({ api }) {
  const [mode, setMode] = useState('grid');
  const [narrow, setNarrow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el || !window.ResizeObserver) return;
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 620));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const [all, setAll] = useState(false);
  const [day, setDay] = useState(3);
  const cols = chairs(all);
  const grid = mode === 'grid' && !narrow;
  const hours = [];
  for (let m = SL.open; m <= SL.close; m += 30) hours.push(m);
  const isToday = day === 3;
  const appts = isToday ? api.appts : [];

  return (
    <div className="view" ref={ref} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="view__head">
        <div><h2>Appointments</h2><p>{SL.shop} · {cols.length} chairs · 15 min slots</p></div>
        <div className="sp"></div>
        {!narrow && <Seg value={mode} options={[{ v: 'grid', label: 'Day grid' }, { v: 'list', label: 'Agenda' }]} onChange={setMode} />}
        <button className="btn primary" onClick={() => api.openBook({})}><ion-icon name="add-outline"></ion-icon>New booking</button>
      </div>

      <div className="rowbar">
        <div className="dstrip">
          {SL.days.map((d, i) => (
            <button key={d.d} className={'dbtn' + (i === day ? ' on' : '')} onClick={() => setDay(i)}>
              {d.d}<b>{d.date.split(' ')[0]}</b>{i === 3 && <i></i>}
            </button>
          ))}
        </div>
        <div className="sp"></div>
        <button className={'sbtn' + (all ? ' pri' : '')} onClick={() => setAll(!all)}>
          <ion-icon name="people-outline"></ion-icon><span className="lbl-h">{all ? 'All staff' : 'Working today'}</span>
        </button>
      </div>

      {!isToday && (
        <div className="note info" style={{ marginBottom: 12 }}>
          <ion-icon name="information-circle-outline"></ion-icon>
          {SL.days[day].d} {SL.days[day].date} is open — tap any empty slot to book ahead.
        </div>
      )}

      {mode === 'list' || narrow ? (
        <section className="panel">
          <div className="panel__hd"><div><h3>Agenda</h3><p>{appts.length} appointments · time order</p></div></div>
          <div>
            {[...appts].sort((a, b) => a.start - b.start).map((a) => <ApptRow key={a.id} a={a} api={api} showStaff />)}
            {!appts.length && <div className="emptybox">No bookings on this day yet.</div>}
          </div>
        </section>
      ) : (
        <div className="calwrap">
          <div className="calhead" style={{ gridTemplateColumns: '52px repeat(' + cols.length + ',minmax(148px,1fr))' }}>
            <div></div>
            {cols.map((s) => {
              const sh = shiftOf(s), n = appts.filter((a) => a.staff === s.id).length;
              return (
                <div key={s.id}>
                  <Av s={s} />
                  <div style={{ minWidth: 0 }}>
                    <div className="calhd__n">{s.first}</div>
                    <div className="calhd__s">{sh ? fmtS(sh.s) + '–' + fmtS(sh.e) : 'Off'} · {n}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="calbody" style={{ gridTemplateColumns: '52px repeat(' + cols.length + ',minmax(148px,1fr))', height: DAY_H }}>
            <div className="calgut">
              {hours.filter((m) => m % 60 === 0).map((m) => <i key={m} style={{ top: (m - SL.open) * PPM }}>{fmtS(m)}</i>)}
            </div>
            {cols.map((s) => {
              const sh = shiftOf(s);
              const mine = appts.filter((a) => a.staff === s.id).sort((a, b) => a.start - b.start);
              const gaps = [];
              if (sh) {
                let cursor = Math.max(sh.s, isToday ? Math.ceil(SL.now / 15) * 15 : sh.s);
                mine.forEach((a) => { if (a.start - cursor >= 30) gaps.push([cursor, a.start]); cursor = Math.max(cursor, a.start + a.dur); });
                if (sh.e - cursor >= 30) gaps.push([cursor, sh.e]);
              }
              return (
                <div className="calcol" key={s.id}>
                  {hours.map((m) => <div key={m} className={'hr' + (m % 60 ? ' h2' : '')} style={{ top: (m - SL.open) * PPM }}></div>)}
                  {!sh && <div className="off" style={{ top: 0, height: DAY_H }}></div>}
                  {sh && sh.s > SL.open && <div className="off" style={{ top: 0, height: (sh.s - SL.open) * PPM }}></div>}
                  {sh && sh.e < SL.close && <div className="off" style={{ top: (sh.e - SL.open) * PPM, height: (SL.close - sh.e) * PPM }}></div>}
                  {gaps.map(([a, b]) => (
                    <button key={a} className="gapb" style={{ top: (a - SL.open) * PPM + 2, height: (b - a) * PPM - 4 }}
                      onClick={() => api.openBook({ staff: s.id, start: a })}>
                      <ion-icon name="add-outline"></ion-icon>{fmtS(a)}
                    </button>
                  ))}
                  {mine.map((a) => (
                    <button key={a.id} className={'apb ' + s.tone + (a.dur < 30 ? ' tight' : '') + (a.status === 'done' ? ' isdone' : '') + (a.status === 'chair' ? ' chair' : '')}
                      style={{ top: (a.start - SL.open) * PPM + 1, height: a.dur * PPM - 3 }} onClick={() => api.openAppt(a)}>
                      {a.dur < 30 ? (
                        <div className="one"><b>{a.client}</b><span>{fmtS(a.start)} · {a.service}</span></div>
                      ) : (<>
                        <div className="t">{fmtS(a.start)}–{fmtS(a.start + a.dur)}</div>
                        <div className="n">{a.client}</div>
                        {a.dur >= 45 && <div className="s">{a.service}</div>}
                      </>)}
                    </button>
                  ))}
                  {isToday && <div className="nowbar" style={{ top: (SL.now - SL.open) * PPM }}></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ApptSheet({ a, api, onClose }) {
  const s = staffOf(a.staff), st = ST[a.status];
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div>
            <h3>{a.client}</h3>
            <p>{a.service} · {a.dur} min · {money(a.price)}</p>
          </div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          <div className="chiprow">
            <span className={'badge ' + st.cls}>{st.label}</span>
            {a.paid && <span className="badge ok">Paid</span>}
            {a.first && <span className="badge pri">New client</span>}
          </div>
          <div className="dl">
            <div className="dlr"><span className="k">When</span><span className="v num">{fmt(a.start)} – {fmt(a.start + a.dur)}</span></div>
            <div className="dlr"><span className="k">With</span><span className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Av s={s} size="sm" />{s.name}</span></div>
            <div className="dlr"><span className="k">Mobile</span><span className="v num">{a.phone}</span></div>
            {a.notes && <div className="dlr"><span className="k">Note</span><span className="v" style={{ fontWeight: 500, maxWidth: 220 }}>{a.notes}</span></div>}
          </div>
          {a.status !== 'done' && (
            <div className="chiprow">
              <button className="sbtn" onClick={() => { api.toast('Reminder sent to ' + a.client); onClose(); }}><ion-icon name="chatbubble-outline"></ion-icon>Send reminder</button>
              <button className="sbtn" onClick={() => { api.setStatus(a.id, 'noshow'); onClose(); }}><ion-icon name="close-circle-outline"></ion-icon>No-show</button>
              <button className="sbtn" onClick={() => { api.openTask({ seed: 'Call ' + a.client + ' to reschedule', to: 's5' }); }}><ion-icon name="repeat-outline"></ion-icon>Reschedule</button>
            </div>
          )}
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Close</button>
          {st.next && <button className="btn primary" onClick={() => { api.setStatus(a.id, st.to); onClose(); }}>{st.next}</button>}
          {a.status === 'done' && !a.paid && <button className="btn primary" style={{ background: 'var(--kz-success)', borderColor: 'var(--kz-success)', boxShadow: '0 6px 14px rgba(46,158,91,.28)' }}
            onClick={() => { api.charge(a); onClose(); }}><ion-icon name="card-outline"></ion-icon>Charge {money(a.price)}</button>}
        </div>
      </div>
    </div>
  );
}

function BookSheet({ seed, api, onClose }) {
  const [sid, setSid] = useState(seed.sid || 'v1');
  const [staff, setStaff] = useState(seed.staff || 'any');
  const [start, setStart] = useState(seed.start || null);
  const [client, setClient] = useState(seed.walkIn ? 'Walk-in' : '');
  const [note, setNote] = useState('');
  const v = SL.services.find((x) => x.id === sid);
  const pool = chairs(false);
  const slots = [];
  for (let m = Math.max(SL.open, Math.ceil(SL.now / 15) * 15); m + v.dur <= SL.close; m += 15) slots.push(m);
  const availFor = (m) => staff === 'any' ? pool.filter((s) => freeAt(api.appts, s.id, m, v.dur)) : (freeAt(api.appts, staff, m, v.dur) ? [staffOf(staff)] : []);
  const chosen = start != null ? availFor(start)[0] : null;
  const ok = client.trim() && start != null && chosen;

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>{seed.walkIn ? 'Walk-in booking' : 'New booking'}</h3><p>{SL.today} · service, stylist, then a free slot</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          <div>
            <span className="lbl">Service</span>
            <div className="pickgrid" style={{ marginTop: 8 }}>
              {SL.services.map((x) => (
                <button key={x.id} className={'pk' + (x.id === sid ? ' on' : '')} onClick={() => { setSid(x.id); setStart(null); }}>
                  <div className="pk__n">{x.name}</div>
                  <div className="pk__m">{x.dur} min · {money(x.price)}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="lbl">Stylist</span>
            <div className="pickgrid" style={{ marginTop: 8 }}>
              <button className={'pk' + (staff === 'any' ? ' on' : '')} onClick={() => { setStaff('any'); setStart(null); }}>
                <div className="pk__n">Any available</div><div className="pk__m">First free chair</div>
              </button>
              {pool.map((s) => (
                <button key={s.id} className={'pk' + (staff === s.id ? ' on' : '')} onClick={() => { setStaff(s.id); setStart(null); }}>
                  <div className="pk__n">{s.first}</div><div className="pk__m">{s.role}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="lbl">Time · {SL.today}</span>
            <div className="slots" style={{ marginTop: 8 }}>
              {slots.map((m) => {
                const free = availFor(m).length > 0;
                return <button key={m} className={'slot' + (start === m ? ' on' : '')} disabled={!free} onClick={() => setStart(m)}>{fmtS(m)}</button>;
              })}
            </div>
          </div>
          <div className="fgrid">
            <div>
              <span className="flab">Client</span>
              <input className="inp" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Name or mobile" />
              <div className="chiprow" style={{ marginTop: 8 }}>
                {SL.clients.slice(0, 4).map((c) => <button key={c} className="chip" onClick={() => setClient(c)}>{c}</button>)}
              </div>
            </div>
            <div>
              <span className="flab">Note for the stylist</span>
              <textarea className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shade, allergies, patch test…"></textarea>
            </div>
          </div>
          <div className="sumbox">
            <div className="r"><span>{v.name} · {v.dur} min</span><b>{money(v.price)}</b></div>
            <div className="r"><span>When</span><b>{start != null ? fmt(start) + ' – ' + fmt(start + v.dur) : 'Pick a slot'}</b></div>
            <div className="r"><span>With</span><b>{chosen ? chosen.name : staff === 'any' ? 'First free' : staffOf(staff).name}</b></div>
            <div className="r big"><span>Total</span><b>{money(v.price)}</b></div>
          </div>
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!ok} style={!ok ? { opacity: .45 } : null}
            onClick={() => { api.book({ staff: chosen.id, sid, start, client: client.trim(), notes: note }); onClose(); }}>
            <ion-icon name="checkmark-outline"></ion-icon>Confirm booking
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CalendarView, ApptSheet, BookSheet, PPM, shiftOf, chairs, freeAt });
