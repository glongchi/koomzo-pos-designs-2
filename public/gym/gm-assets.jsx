/* Koomzo Gym — LOCKERS & KIT. Two jobs the floor manager owns: who holds which
   locker, and which machine is due a service. Both work with no network. */

function AssetsView({ api }) {
  const st = api.st;
  const [tab, setTab] = useState(gate('lockers') ? 'lockers' : 'kit');
  const dayFree = st.lockers.filter((l) => l.kind === 'day' && !l.mid && !l.fault).length;
  const faults = st.equipment.filter((e) => e.state !== 'ok').length;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Lockers &amp; kit</h2><p>{st.lockers.filter((l) => l.mid).length} lockers in use · {dayFree} day keys free · {faults} machines needing attention</p></div>
        <div className="sp"></div>
        {tab === 'lockers' && gate('lockers') && <>
          <button className="btn" onClick={() => api.openLockerEdit('')}><ion-icon name="add-outline"></ion-icon>Add lockers</button>
        </>}
        {tab === 'kit' && gate('equipment') && <>
          <button className="btn" onClick={() => api.openKit('')}><ion-icon name="add-outline"></ion-icon>Add equipment</button>
          <button className="btn primary" onClick={() => api.openFault('')}><ion-icon name="construct-outline"></ion-icon>Log a fault</button>
        </>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <GmSeg value={tab} onChange={setTab} options={[
          ...(gate('lockers') ? [{ v:'lockers', label:'Lockers', n:st.lockers.length }] : []),
          ...(gate('equipment') ? [{ v:'kit', label:'Equipment', n:st.equipment.length }] : []),
        ]} />
      </div>

      {tab === 'lockers' && (
        <>
          <div className="gmnote"><ion-icon name="information-circle-outline"></ion-icon>
            A VIP locker is held all year and follows the membership — freezing a member does not release it.
            A day key is issued at check-in and returns to the pool at closing, whether or not anyone remembered.
          </div>
          <h4 style={{ margin:'0 0 8px', font:'700 13px var(--kz-font-sans)' }}>Dedicated · VIP and annual</h4>
          <div className="gmlk" style={{ marginBottom: 18 }}>
            {st.lockers.filter((l) => l.kind === 'vip' && !l.retired).map((l) => {
              const m = l.mid ? memberOf(l.mid) : null;
              return (
                <button className={'gmlkr vip ' + (m ? 'taken' : 'free')} key={l.id} onClick={() => api.openLocker(l.id)}>
                  <span className="gmlkr__t"><i className={'gmdot ' + (l.fault ? 'no' : m ? '' : 'idle')}></i><b>{l.id}</b></span>
                  <span>{l.fault ? l.fault : m ? m.name : 'Free · assign to a member'}</span>
                </button>
              );
            })}
          </div>
          <h4 style={{ margin:'0 0 8px', font:'700 13px var(--kz-font-sans)' }}>Day use</h4>
          <div className="gmlk">
            {st.lockers.filter((l) => l.kind === 'day' && !l.retired).map((l) => {
              const m = l.mid ? memberOf(l.mid) : null;
              return (
                <button className={'gmlkr day ' + (m ? 'taken' : 'free')} key={l.id} onClick={() => api.openLocker(l.id)}>
                  <span className="gmlkr__t"><i className={'gmdot ' + (l.fault ? 'no' : m ? 'info' : 'idle')}></i><b>{l.id}</b></span>
                  <span>{l.fault ? l.fault : m ? m.name + ' · to ' + (l.until || '—') : 'Free'}</span>
                </button>
              );
            })}
          </div>
          {st.lockers.some((l) => l.retired) && <>
            <h4 style={{ margin:'18px 0 8px', font:'700 13px var(--kz-font-sans)' }}>Retired · out of the pool</h4>
            <div className="gmlk">
              {st.lockers.filter((l) => l.retired).map((l) => (
                <button className="gmlkr retired free" key={l.id} onClick={() => api.openLocker(l.id)}>
                  <span className="gmlkr__t"><i className="gmdot idle"></i><b>{l.id}</b></span>
                  <span>{l.note || 'Retired'}</span>
                </button>
              ))}
            </div>
          </>}
        </>
      )}

      {tab === 'kit' && (
        <>
          <div className="kpis">
            <div className="kpi"><div className="k">On the floor</div><div className="v">{st.equipment.length}</div></div>
            <div className="kpi"><div className="k">Faults open</div><div className="v" style={{ color: st.equipment.some((e) => e.state === 'fault') ? 'var(--kz-discount)' : undefined }}>{st.equipment.filter((e) => e.state === 'fault').length}</div></div>
            <div className="kpi"><div className="k">Service overdue</div><div className="v" style={{ color: st.equipment.some((e) => e.state === 'overdue') ? 'var(--kz-warning)' : undefined }}>{st.equipment.filter((e) => e.state === 'overdue').length}</div></div>
          </div>
          <div className="table">
            {st.equipment.map((e) => (
              <div className="trw" key={e.id}>
                <ion-icon name={e.zone === 'pool' ? 'water-outline' : e.zone === 'spa' ? 'thermometer-outline' : 'barbell-outline'}
                  style={{ fontSize: 18, color:'var(--kz-muted-2)' }}></ion-icon>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display:'block', font:'700 13.5px var(--kz-font-sans)' }}>{e.name}</b>
                  <span style={{ font:'500 11.5px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>
                    {GM.zoneNames[e.zone]}{e.issue ? ' · ' + e.issue : ''}{e.logged ? ' · logged ' + e.logged : ''}
                  </span>
                </span>
                <span style={{ width: 108, font:'500 12px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>serviced {e.serviced}</span>
                <span style={{ width: 92, font:'500 12px var(--kz-font-sans)', color: e.state === 'overdue' ? 'var(--kz-warning)' : 'var(--kz-muted-2)' }}>due {e.due}</span>
                <span className={'gmstate ' + (e.state === 'ok' ? 'active' : e.state === 'fault' ? 'expired' : 'due')}><i></i>
                  {e.state === 'ok' ? 'In service' : e.state === 'fault' ? 'Out of use' : 'Service due'}
                </span>
                <button className="icbtn" onClick={() => api.openKit(e.id)} title="Edit"><ion-icon name="create-outline"></ion-icon></button>
                {e.state === 'ok'
                  ? <button className="btn" onClick={() => api.openFault(e.id)}><ion-icon name="alert-circle-outline"></ion-icon>Log a fault</button>
                  : <button className="btn primary" onClick={() => api.fixKit(e.id)}><ion-icon name="checkmark-outline"></ion-icon>Back in service</button>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- assign or release a locker ---------- */
function LockerSheet({ id, api, onClose }) {
  const st = api.st;
  const l = st.lockers.find((x) => x.id === id);
  const m = l.mid ? memberOf(l.mid) : null;
  const [to, setTo] = useState('');
  const [until, setUntil] = useState('18:00');
  return (
    <GmSheet title={'Locker ' + l.id} sub={(l.kind === 'vip' ? 'Dedicated · held all year' : 'Day use · returns to the pool at closing')} onClose={onClose}
      foot={<>
        {m && <button className="btn danger" onClick={() => { api.releaseLocker(id); onClose(); }}><ion-icon name="lock-open-outline"></ion-icon>Release</button>}
        <button className="btn" onClick={() => api.patchLocker(id, { fault: l.fault ? null : 'Lock jammed' })}>
          <ion-icon name={l.fault ? 'checkmark-outline' : 'alert-circle-outline'}></ion-icon>{l.fault ? 'Fault fixed' : 'Mark faulty'}</button>
        {!m && <button className="btn" onClick={() => { api.patchLocker(id, { retired: !l.retired, note: l.retired ? null : 'Retired by ' + api.me.first }); onClose(); }}>
          <ion-icon name={l.retired ? 'refresh-outline' : 'archive-outline'}></ion-icon>{l.retired ? 'Return to pool' : 'Retire'}</button>}
        <div className="sp" style={{ flex: 1 }}></div>
        <button className="btn" onClick={onClose}>Close</button>
        {!m && <button className="btn primary" disabled={!to} onClick={() => { api.assignLocker(id, to, until); onClose(); }}>
          <ion-icon name="lock-closed-outline"></ion-icon>Assign</button>}
      </>}>
      {m ? (
        <>
          <div className="gmhit" style={{ marginBottom: 12 }}>
            <div className="gmhit__ph">{initOf(m.name)}</div>
            <div className="gmhit__b">
              <div className="gmhit__n">{m.name}<PlanTag id={m.plan} /></div>
              <div className="gmhit__m"><span>{l.kind === 'vip' ? 'Dedicated locker' : 'Day key until ' + (l.until || '—')}</span></div>
            </div>
            <button className="btn" onClick={() => { onClose(); api.openMember(m.id); }}>Open member</button>
          </div>
          {l.fault && <div className="gmnote" style={{ background:'var(--kz-discount-wash)', borderColor:'#f3c8ba' }}>
            <ion-icon name="alert-circle-outline" style={{ color:'var(--kz-discount)' }}></ion-icon>{l.fault}</div>}
        </>
      ) : (
        <div className="gmfields">
          <div className="gmf gmwide"><label>Assign to</label>
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Choose a member…</option>
              {st.members.filter((x) => l.kind === 'vip' ? ['vip', 'annual', 'exec'].indexOf(x.plan) > -1 : true).map((x) => (
                <option key={x.id} value={x.id}>{x.name} · {planOf(x.plan).short}{x.locker ? ' · has ' + x.locker : ''}</option>
              ))}
            </select>
            {l.kind === 'vip' && <span className="hint">Dedicated lockers are part of VIP, Annual and Executive plans.</span>}
          </div>
          {l.kind === 'day' && (
            <div className="gmf"><label>Until</label>
              <select value={until} onChange={(e) => setUntil(e.target.value)}>
                {['12:00', '14:00', '16:00', '18:00', '20:00', GM.close].map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
    </GmSheet>
  );
}

/* ---------- log an equipment fault ---------- */
function FaultSheet({ eid, api, onClose }) {
  const st = api.st;
  const [id, setId] = useState(eid || '');
  const [issue, setIssue] = useState('');
  const [off, setOff] = useState(true);
  return (
    <GmSheet title="Log a fault" sub="What is wrong, and whether the machine comes off the floor" onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" disabled={!id || !issue.trim()} onClick={() => { api.logFault(id, issue, off); onClose(); }}>
          <ion-icon name="construct-outline"></ion-icon>Log it</button></>}>
      <div className="gmfields">
        <div className="gmf gmwide"><label>Machine</label>
          <select value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">Choose…</option>
            {st.equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="gmf gmwide"><label>What is wrong</label>
          <textarea value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="e.g. Belt slipping under load above 8 km/h" />
        </div>
        <div className="gmf gmwide">
          <label>Off the floor</label>
          <div style={{ display:'flex', gap:8 }}>
            <button className={'chip' + (off ? ' on' : '')} onClick={() => setOff(true)}><ion-icon name="close-circle-outline"></ion-icon>Take out of use</button>
            <button className={'chip' + (!off ? ' on' : '')} onClick={() => setOff(false)}><ion-icon name="warning-outline"></ion-icon>Usable · watch it</button>
          </div>
          <span className="hint">Out of use hides the machine from class planning and shows a notice on the floor screen.</span>
        </div>
      </div>
      {!api.online && <div className="gmnote"><ion-icon name="cloud-offline-outline"></ion-icon>
        Saved on this tablet and sent when the line returns — a fault is never lost to an outage.</div>}
    </GmSheet>
  );
}

/* ---------- add a bank of lockers ----------
   Lockers arrive as a bank, not one at a time: a club installs eight day lockers
   in a row and numbers them. The form makes the bank, and shows exactly which
   ids it will create before it does. */
function AddLockersSheet({ api, onClose }) {
  const st = api.st;
  const [kind, setKind] = useState('day');
  const [prefix, setPrefix] = useState('D');
  const [start, setStart] = useState(9);
  const [count, setCount] = useState(8);
  const [zone, setZone] = useState('floor');
  const pad = (n) => (n < 10 ? '0' + n : String(n));
  const ids = Array.from({ length: Math.max(0, Math.min(40, count)) }, (_, i) => prefix + '-' + pad(start + i));
  const clash = ids.filter((x) => st.lockers.some((l) => l.id === x));
  return (
    <GmSheet wide title="Add lockers" sub="A bank at a time · the club numbers them, not the software" onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" disabled={!ids.length || clash.length > 0}
          onClick={() => { api.addLockers({ kind, prefix, start, count: ids.length, zone }); onClose(); }}>
          <ion-icon name="add-outline"></ion-icon>{'Create ' + ids.length + (ids.length === 1 ? ' locker' : ' lockers')}</button></>}>
      <div className="gmfields">
        <div className="gmf"><label>Kind</label>
          <div style={{ display:'flex', gap:8 }}>
            <button className={'chip' + (kind === 'day' ? ' on' : '')} onClick={() => { setKind('day'); setPrefix('D'); }}><ion-icon name="time-outline"></ion-icon>Day use</button>
            <button className={'chip' + (kind === 'vip' ? ' on' : '')} onClick={() => { setKind('vip'); setPrefix('V'); }}><ion-icon name="star-outline"></ion-icon>Dedicated</button>
          </div>
          <span className="hint">{kind === 'vip' ? 'Held all year and included in VIP, Annual and Executive plans.' : 'Issued at check-in and returned to the pool at closing.'}</span>
        </div>
        <div className="gmf"><label>Where</label>
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            {Object.keys(GM.zoneNames).map((z) => <option key={z} value={z}>{GM.zoneNames[z]}</option>)}
          </select>
        </div>
        <div className="gmf"><label>Prefix</label><input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 3))} /></div>
        <div className="gmf"><label>Start at</label><input type="number" value={start} onChange={(e) => setStart(Number(e.target.value) || 1)} /></div>
        <div className="gmf"><label>How many</label><input type="number" value={count} onChange={(e) => setCount(Number(e.target.value) || 0)} /><span className="hint">Up to 40 in one bank.</span></div>
      </div>
      <div className="gmsum">
        <div><span>Will create</span><b>{ids.length ? ids[0] + ' → ' + ids[ids.length - 1] : '—'}</b></div>
        <div><span>Pool after this</span><b>{st.lockers.filter((l) => l.kind === kind && !l.retired).length + ids.length} {kind === 'vip' ? 'dedicated' : 'day'} lockers</b></div>
      </div>
      {clash.length > 0 && (
        <div className="gmnote" style={{ background:'var(--kz-discount-wash)', borderColor:'#f3c8ba', marginTop: 12 }}>
          <ion-icon name="alert-circle-outline" style={{ color:'var(--kz-discount)' }}></ion-icon>
          {clash.length} of these already exist ({clash.slice(0, 4).join(', ')}{clash.length > 4 ? '…' : ''}). A locker id is unique — change the prefix or the start number.
        </div>
      )}
    </GmSheet>
  );
}

/* ---------- add or edit a machine, and record a service ----------
   The service interval is what makes "due" a fact instead of a memory: the club
   sets months, the software says the date. */
function KitSheet({ eid, api, onClose }) {
  const st = api.st;
  const ex = eid ? st.equipment.find((e) => e.id === eid) : null;
  const [name, setName] = useState(ex ? ex.name : '');
  const [zone, setZone] = useState(ex ? ex.zone : 'floor');
  const [serial, setSerial] = useState(ex ? (ex.serial || '') : '');
  const [interval, setInterval] = useState(ex ? (ex.interval || 3) : 3);
  const [serviced, setServiced] = useState(ex ? ex.serviced : GM.dayNo + ' ' + GM.month);
  const [note, setNote] = useState('');
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const nextDue = (from, months) => {
    const parts = String(from).trim().split(' ');
    const mi = MONTHS.indexOf(parts[1] || GM.month);
    const m2 = (mi < 0 ? 7 : mi) + Number(months);
    return (parts[0] || GM.dayNo) + ' ' + MONTHS[m2 % 12] + (m2 > 11 ? ' 2027' : '');
  };
  return (
    <GmSheet wide title={ex ? ex.name : 'Add equipment'} sub={ex ? 'Edit, or record a service' : 'What it is, where it lives, and how often it needs a service'} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <div className="sp" style={{ flex: 1 }}></div>
        {ex && <button className="btn" onClick={() => { api.serviceKit(ex.id, nextDue(GM.dayNo + ' ' + GM.month, interval), note); onClose(); }}>
          <ion-icon name="build-outline"></ion-icon>Record a service today</button>}
        <button className="btn primary" disabled={!name.trim()}
          onClick={() => { api.saveKit(eid, { name, zone, serial, interval, serviced, due: nextDue(serviced, interval), note }); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>{ex ? 'Save' : 'Add to the floor'}</button>
      </>}>
      <div className="gmfields">
        <div className="gmf gmwide"><label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Treadmill 5 · Technogym" />
          <span className="hint">Name it the way the floor says it — the number a member reads on the machine.</span>
        </div>
        <div className="gmf"><label>Zone</label>
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            {Object.keys(GM.zoneNames).map((z) => <option key={z} value={z}>{GM.zoneNames[z]}</option>)}
          </select>
        </div>
        <div className="gmf"><label>Serial or asset tag</label><input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Optional" /></div>
        <div className="gmf"><label>Service every</label>
          <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            {[1, 2, 3, 6, 12].map((n) => <option key={n} value={n}>{n === 1 ? '1 month' : n + ' months'}</option>)}
          </select>
        </div>
        <div className="gmf"><label>Last serviced</label><input value={serviced} onChange={(e) => setServiced(e.target.value)} placeholder="e.g. 12 Jun" /></div>
        <div className="gmf gmwide"><label>{ex ? 'Service note' : 'Note'}</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={ex ? 'e.g. Belt tensioned, deck lubricated' : 'Anything the technician should know'} />
        </div>
      </div>
      <div className="gmsum">
        <div><span>Next service due</span><b>{nextDue(serviced, interval)}</b></div>
        {ex && <div><span>Current state</span><b>{ex.state === 'ok' ? 'In service' : ex.state === 'fault' ? 'Out of use · ' + (ex.issue || '') : 'Service overdue'}</b></div>}
        {!api.online && <div><span>No network</span><b>Saved here, sent on sync</b></div>}
      </div>
    </GmSheet>
  );
}

Object.assign(window, { AssetsView, LockerSheet, FaultSheet, AddLockersSheet, KitSheet });
