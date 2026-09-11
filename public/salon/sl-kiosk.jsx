/* Koomzo Salon — kiosk mode. Unattended self check-in for walk-ins.
   Device mode, not a role: set by a manager, exited with a staff PIN. */

const K_STEPS = ['welcome', 'service', 'stylist', 'details', 'done'];

function waitFor(appts, staffId) {
  const busy = appts.filter((a) => a.staff === staffId && a.status !== 'done' && a.status !== 'noshow' && a.start + a.dur > SL.now);
  if (!busy.length) return 0;
  const inChair = busy.find((a) => a.start <= SL.now);
  let free = inChair ? inChair.start + inChair.dur : SL.now;
  busy.filter((a) => a.start > SL.now).sort((x, y) => x.start - y.start).forEach((a) => { if (a.start < free + 15) free = a.start + a.dur; });
  return Math.max(0, free - SL.now);
}

function KioskView({ api, onExit }) {
  const [step, setStep] = useState('welcome');
  const [sid, setSid] = useState(null);
  const [staff, setStaff] = useState('any');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [pin, setPin] = useState(null);
  const [countdown, setCountdown] = useState(20);

  const pool = SL.staff.filter((s) => s.status !== 'off' && !/Front desk/.test(s.role));
  const v = sid ? api.services.find((x) => x.id === sid) : null;
  const able = v ? pool.filter((s) => v.who.includes(s.id)) : pool;
  const waits = useMemo(() => Object.fromEntries(pool.map((s) => [s.id, waitFor(api.appts, s.id)])), [api.appts]);
  const bestWait = able.length ? Math.min(...able.map((s) => waits[s.id])) : null;
  const houseWait = pool.length ? Math.min(...pool.map((s) => waits[s.id])) : 0;

  const reset = () => { setStep('welcome'); setSid(null); setStaff('any'); setName(''); setPhone(''); setResult(null); setCountdown(20); };
  useEffect(() => {
    if (step !== 'done') return;
    if (countdown <= 0) { reset(); return; }
    const i = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(i);
  }, [step, countdown]);

  useEffect(() => {
    if (pin && pin.length === 4) {
      const who = SL.staff.find((s) => s.pin === pin);
      if (who) onExit(who);
    }
  }, [pin]);

  const submit = () => {
    const pick = staff === 'any' ? able.slice().sort((a, b) => waits[a.id] - waits[b.id])[0] : staffOf(staff);
    const wait = waits[pick.id];
    const start = Math.ceil((SL.now + wait) / 5) * 5;
    api.checkIn({ staff: pick.id, sid, start, client: name.trim() || 'Walk-in', phone });
    setResult({ pick, wait, start });
    setStep('done');
  };

  const digits = phone.replace(/\D/g, '');
  const canSubmit = name.trim().length > 1 && digits.length >= 7;
  const stepIdx = K_STEPS.indexOf(step);

  return (
    <div className="kio">
      <header className="kio__top">
        <div className="kio__brand"><span className="kio__mark"><ion-icon name="cut-outline"></ion-icon></span>{SL.shop}</div>
        <div className="sp"></div>
        {step !== 'welcome' && step !== 'done' && (
          <div className="kio__steps">
            {['Service', 'Stylist', 'Details'].map((l, i) => (
              <span key={l} className={'kio__stp' + (stepIdx - 1 === i ? ' on' : stepIdx - 1 > i ? ' ok' : '')}>
                {stepIdx - 1 > i ? <ion-icon name="checkmark-outline"></ion-icon> : i + 1}<b>{l}</b>
              </span>
            ))}
          </div>
        )}
        <button className="kio__exit" onClick={() => setPin('')} aria-label="Staff access"><ion-icon name="lock-closed-outline"></ion-icon></button>
      </header>

      {step === 'welcome' && (
        <div className="kio__body center">
          <div className="kio__hero">
            <div className="kio__wait">
              <span className="k">Walk-in wait right now</span>
              <strong>{houseWait ? '~' + houseWait + ' min' : 'No wait'}</strong>
              <span className="s">{pool.length} stylists on the floor · open until {fmtS(SL.close)}</span>
            </div>
            <h1>Welcome in.</h1>
            <p>Check yourself in and we’ll call your name.</p>
            <div className="kio__cta">
              <button className="kbtn go" onClick={() => setStep('service')}>
                <ion-icon name="walk-outline"></ion-icon>
                <span>I’m a walk-in<small>Pick a service and join the queue</small></span>
              </button>
              <button className="kbtn" onClick={() => setStep('booked')}>
                <ion-icon name="calendar-outline"></ion-icon>
                <span>I have an appointment<small>Let your stylist know you’ve arrived</small></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'booked' && (
        <div className="kio__body">
          <h2 className="kio__h">Find your booking</h2>
          <p className="kio__sub">Tap your name — today’s appointments only.</p>
          <div className="kio__list">
            {api.appts.filter((a) => a.status === 'booked' || a.status === 'confirmed').sort((a, b) => a.start - b.start).map((a) => (
              <button className="kcard" key={a.id} onClick={() => { api.arrive(a.id); setResult({ pick: staffOf(a.staff), wait: Math.max(0, a.start - SL.now), start: a.start, booked: a }); setStep('done'); }}>
                <span className="kcard__t">{fmt(a.start)}</span>
                <span className="kcard__b"><b>{a.client}</b><small>{a.service} · {staffOf(a.staff).first}</small></span>
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </button>
            ))}
          </div>
          <div className="kio__foot">
            <button className="kbtn ghost" onClick={reset}><ion-icon name="arrow-back-outline"></ion-icon>Back</button>
          </div>
        </div>
      )}

      {step === 'service' && (
        <div className="kio__body">
          <h2 className="kio__h">What are you here for?</h2>
          <p className="kio__sub">Prices include everything — no surprises at the desk.</p>
          <div className="kio__grid">
            {api.services.filter((x) => x.online).map((x) => (
              <button key={x.id} className={'ktile' + (sid === x.id ? ' on' : '')} onClick={() => { setSid(x.id); setStaff('any'); setStep('stylist'); }}>
                <span className="ktile__ic"><ion-icon name={x.icon}></ion-icon></span>
                <span className="ktile__n">{x.name}</span>
                <span className="ktile__m">{x.dur} min</span>
                <span className="ktile__p">{money(x.price)}</span>
              </button>
            ))}
          </div>
          <div className="kio__foot">
            <button className="kbtn ghost" onClick={reset}><ion-icon name="arrow-back-outline"></ion-icon>Back</button>
          </div>
        </div>
      )}

      {step === 'stylist' && (
        <div className="kio__body">
          <h2 className="kio__h">Any preference?</h2>
          <p className="kio__sub">{v.name} · {v.dur} min · {money(v.price)}</p>
          <div className="kio__grid people">
            <button className={'ktile wide' + (staff === 'any' ? ' on' : '')} onClick={() => setStaff('any')}>
              <span className="ktile__ic"><ion-icon name="flash-outline"></ion-icon></span>
              <span className="ktile__n">First available</span>
              <span className="ktile__m">{bestWait ? '~' + bestWait + ' min wait' : 'Straight in'}</span>
            </button>
            {able.map((s) => (
              <button key={s.id} className={'ktile' + (staff === s.id ? ' on' : '')} onClick={() => setStaff(s.id)}>
                <span className={'av xl ' + s.tone}>{s.init}</span>
                <span className="ktile__n">{s.first}</span>
                <span className="ktile__m">{waits[s.id] ? '~' + waits[s.id] + ' min wait' : 'Free now'}</span>
              </button>
            ))}
          </div>
          <div className="kio__foot">
            <button className="kbtn ghost" onClick={() => setStep('service')}><ion-icon name="arrow-back-outline"></ion-icon>Back</button>
            <button className="kbtn go" onClick={() => setStep('details')}>Continue<ion-icon name="arrow-forward-outline"></ion-icon></button>
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="kio__body">
          <h2 className="kio__h">Who shall we call?</h2>
          <p className="kio__sub">We’ll text you if the wait changes. Nothing else, ever.</p>
          <div className="kio__form">
            <div className="kfield">
              <label>Your name</label>
              <input className="kinp" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name is fine" autoFocus />
            </div>
            <div className="kfield">
              <label>Mobile</label>
              <div className="kinp show">{phone || <em>Tap the keys below</em>}</div>
              <div className="kpad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '0', 'del'].map((k) => (
                  <button key={k} onClick={() => setPhone((p) => k === 'del' ? p.slice(0, -1) : p + k)}>
                    {k === 'del' ? <ion-icon name="backspace-outline"></ion-icon> : k}
                  </button>
                ))}
              </div>
            </div>
            <div className="ksum">
              <div className="r"><span>{v.name}</span><b>{money(v.price)}</b></div>
              <div className="r"><span>With</span><b>{staff === 'any' ? 'First available' : staffOf(staff).first}</b></div>
              <div className="r"><span>Expected wait</span><b>{(staff === 'any' ? bestWait : waits[staff]) ? '~' + (staff === 'any' ? bestWait : waits[staff]) + ' min' : 'No wait'}</b></div>
            </div>
          </div>
          <div className="kio__foot">
            <button className="kbtn ghost" onClick={() => setStep('stylist')}><ion-icon name="arrow-back-outline"></ion-icon>Back</button>
            <button className="kbtn go" disabled={!canSubmit} onClick={submit}><ion-icon name="checkmark-outline"></ion-icon>Check me in</button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="kio__body center">
          <div className="kio__hero">
            <div className="kdone"><ion-icon name="checkmark-outline"></ion-icon></div>
            <h1>{result.booked ? 'You’re checked in.' : 'You’re in the queue.'}</h1>
            <p>
              {result.wait
                ? <>{result.pick.first} will be ready in about <b>{result.wait} minutes</b> — take a seat, we’ll call you.</>
                : <><b>{result.pick.first}</b> is ready for you now — head on over.</>}
            </p>
            <div className="ksum big">
              <div className="r"><span>Name</span><b>{result.booked ? result.booked.client : (name.trim() || 'Walk-in')}</b></div>
              <div className="r"><span>Service</span><b>{result.booked ? result.booked.service : v.name}</b></div>
              <div className="r"><span>Stylist</span><b>{result.pick.name}</b></div>
              <div className="r"><span>Around</span><b>{fmt(result.start)}</b></div>
            </div>
            <button className="kbtn go" onClick={reset}><span>Done<small>{'Resets in ' + countdown + 's'}</small></span></button>
          </div>
        </div>
      )}

      {pin !== null && (
        <div className="scrim" onClick={() => setPin(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__head">
              <div><h3>Staff access</h3><p>Enter your register PIN to leave kiosk mode</p></div>
              <div className="sp"></div>
              <button className="icbtn" onClick={() => setPin(null)}><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div className="sheet__body">
              <div className="pindots">{[0, 1, 2, 3].map((i) => <i key={i} className={pin.length > i ? 'on' : ''}></i>)}</div>
              {pin.length === 4 && !SL.staff.some((s) => s.pin === pin) && <div className="note"><ion-icon name="alert-circle-outline"></ion-icon>PIN not recognised.</div>}
              <div className="kpad tight">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => (
                  <button key={i} disabled={!k} style={!k ? { visibility: 'hidden' } : null}
                    onClick={() => setPin((p) => k === 'del' ? p.slice(0, -1) : (p + k).slice(0, 4))}>
                    {k === 'del' ? <ion-icon name="backspace-outline"></ion-icon> : k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { KioskView, waitFor });
