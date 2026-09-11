/* Koomzo — shared Setup surface. Every module renders the SAME panel.
   Phase 2 of the rollout: one pattern, reused, so configuring a fifth module
   feels like configuring the first. */

const { useState: kzUse, useEffect: kzEff } = React;

/* what is currently open per capability — drives the wind-down pre-flight */
const OPEN_WORK = {
  'inventory.purchase': { kind:'docs',  n:3, label:'purchase orders still with suppliers', resolve:'They will be received in the normal way.' },
  'inventory.counts':   { kind:'docs',  n:1, label:'stock count in review',                resolve:'Post it or discard it to finish.' },
  'inventory.transfers':{ kind:'docs',  n:1, label:'transfer in transit',                  resolve:'It disappears once received at the far end.' },
  'retail.shift':       { kind:'money', n:1, label:'unreconciled shift on Lane 1',         resolve:'Count the drawer, or write off the variance with an owner PIN.' },
  'retail.tickets':     { kind:'docs',  n:2, label:'tickets on hold',                      resolve:'Resume or void them to finish.' },
  'retail.returns':     { kind:'docs',  n:0, label:'refunds in progress' },
  'retail.customers':   { kind:'reference', n:214, label:'customer records' },
  'salon.time':         { kind:'money', n:2, label:'staff still clocked in',               resolve:'Clock them out to close the day.' },
  'salon.tasks':        { kind:'docs',  n:4, label:'open checklist items' },
  'invoicing.recurring':{ kind:'docs',  n:6, label:'recurring schedules running',          resolve:'They stop issuing once wound down.' },
  'invoicing.approvals':{ kind:'docs',  n:2, label:'invoices awaiting approval',           resolve:'Approve or reject them to finish.' },
  'queue.supervise':    { kind:'docs',  n:0, label:'lanes under supervision' },
  'forms.approvals':    { kind:'docs',  n:3, label:'submissions awaiting review',        resolve:'Approve or reject them to finish.' },
  'forms.schedule':     { kind:'docs',  n:2, label:'scheduled forms due this shift',     resolve:'They stop being asked for once wound down.' },
  'forms.submissions':  { kind:'reference', n:2425, label:'submissions' },
  'automations.designer':{ kind:'docs', n:5, label:'live recipes authored here',         resolve:'They keep running; only authoring goes away.' },
  'automations.approval':{ kind:'docs', n:1, label:'run waiting on a person',            resolve:'Answer it, or cancel the run.' },
  'automations.runs':   { kind:'reference', n:1840, label:'runs in history' },
  'hotel.folio':        { kind:'money', n:6, label:'folios with a balance on the room',   resolve:'Settle or transfer them; a folio cannot be abandoned mid-stay.' },
  'hotel.bookings':     { kind:'docs',  n:3, label:'reservations not yet arrived',        resolve:'They can still be honoured — no new ones are taken.' },
  'hotel.longstay':     { kind:'docs',  n:3, label:'tenancies running',                   resolve:'They finish at their renewal date and are not renewed.' },
  'hotel.deposits':     { kind:'money', n:2, label:'security deposits held',              resolve:'Return or withhold them with a reason before hiding the screen.' },
  'hotel.register':     { kind:'docs',  n:1, label:'guest register not yet filed',        resolve:'File tonight’s register; the statutory copy cannot be skipped.' },
  'hotel.guests':       { kind:'reference', n:9, label:'guest records' },
  'hotel.maintenance':  { kind:'docs',  n:3, label:'faults open, one room off sale',      resolve:'Rooms return to sale when the fault is closed.' },
  'restaurant.roomcharge':{ kind:'money', n:2, label:'bills sitting on a room folio',     resolve:'They settle at the guest’s checkout.' },
  'grocery.expiry':     { kind:'docs',  n:6, label:'markdown lines live on the shelf',    resolve:'They expire on their own date.' },
  'grocery.deposits':   { kind:'money', n:44, label:'crates and bottles out with customers', resolve:'Refund them at the till or write the float off with an owner PIN.' },
  'grocery.gaps':       { kind:'docs',  n:1, label:'shelf-gap order being walked',        resolve:'Send it or discard it to finish.' },
  'grocery.loyalty':    { kind:'reference', n:1240, label:'card holders' },
};
const workFor = (mid, key) => OPEN_WORK[mid + '.' + key];

/* ---------------- plan bar ---------------- */
function PlanBar({ onChange, compact }) {
  const s = KZ.state(), p = KZ.plan();
  return (
    <div className="kzplan">
      <div className="kzplan__l">
        <div className="k">Plan</div>
        <div className="v">{p.name}{p.price != null ? <small>{p.price ? window.KZ_LOCALE.int(p.price) + ' FCFA / site / month' : 'free · 132 days left'}</small> : <small>custom</small>}</div>
      </div>
      <div className="kzplan__c">
        {KZ.PLANS.map((x) => (
          <button key={x.id} className={x.id === s.plan ? 'on' : ''} onClick={() => { KZ.setPlan(x.id); onChange && onChange(); }}>{x.name}</button>
        ))}
      </div>
      {!compact && (
        <div className="kzplan__r">
          <span><b>{p.seats || '∞'}</b> seats</span>
          <span><b>{p.vol ? window.KZ_LOCALE.int(p.vol) : '∞'}</b> sales / mo</span>
          <span><b>{p.months ? p.months + ' mo' : '∞'}</b> history</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- preview as ---------------- */
function PreviewAs({ onChange }) {
  const s = KZ.state();
  return (
    <div className="kzprev">
      <span className="lb"><ion-icon name="eye-outline"></ion-icon>Preview as</span>
      <div className="kzseg">
        {KZ.ROLES.map((r) => <button key={r.id} className={s.role === r.id ? 'on' : ''} onClick={() => { KZ.setRole(r.id); onChange && onChange(); }}>{r.name}</button>)}
      </div>
      <div className="kzseg">
        {KZ.DEVICES.map((d) => <button key={d.id} className={s.device === d.id ? 'on' : ''} onClick={() => { KZ.setDevice(d.id); onChange && onChange(); }}>{d.name}</button>)}
      </div>
      {s.role !== 'owner' && <span className="kzwarn"><ion-icon name="lock-closed-outline"></ion-icon>{s.role === 'staff' ? 'Staff never see Setup' : 'Manager cannot change plan or billing'}</span>}
      {s.device === 'phone' && <span className="kzwarn"><ion-icon name="phone-portrait-outline"></ion-icon>Setup is read-only on a phone</span>}
    </div>
  );
}

/* ---------------- the wind-down pre-flight ---------------- */
function PreFlight({ mid, capKey, onClose, onDone }) {
  const c = KZ.cap(mid, capKey), w = workFor(mid, capKey);
  const m = KZ.mod(mid);
  const has = w && w.n > 0;
  const money = has && w.kind === 'money';
  const docs = has && w.kind === 'docs';
  const [ack, setAck] = kzUse(false);

  return (
    <div className="kzscrim" onClick={onClose}>
      <div className="kzsheet" onClick={(e) => e.stopPropagation()}>
        <div className="kzsheet__hd">
          <div className={'kzsheet__ic ' + (money ? 'stop' : docs ? 'warn' : 'ok')}>
            <ion-icon name={money ? 'cash-outline' : docs ? 'document-text-outline' : 'checkmark-outline'}></ion-icon>
          </div>
          <div><h3>Turn off {c.name}?</h3><p>{m.name}</p></div>
          <div className="sp"></div>
          <button className="kzx" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>

        <div className="kzsheet__bd">
          {money && <>
            <div className="kzflag stop"><ion-icon name="lock-closed-outline"></ion-icon>
              <span><b>{w.n} {w.label}.</b> Money must land somewhere before its screen can be hidden.</span></div>
            <p className="kzp">{w.resolve}</p>
            <label className="kzcheck">
              <input type="checkbox" checked={ack} onChange={() => setAck(!ack)} />
              <span>I have reconciled, or I am recording a written-off variance with an owner PIN.</span>
            </label>
          </>}

          {docs && <>
            <div className="kzflag warn"><ion-icon name="hourglass-outline"></ion-icon>
              <span><b>{w.n} {w.label}.</b> {c.name} will wind down: hidden from the rail, reachable from one banner, no new records. It disappears on its own when the last one closes.</span></div>
            <p className="kzp">{w.resolve}</p>
            <div className="kzstates">
              <div className="kzstate a"><b>On</b><span>Fully visible</span></div>
              <div className="kzstate b now"><b>Winding down</b><span>{w.n} open</span></div>
              <div className="kzstate c"><b>Off</b><span>Auto, when clear</span></div>
            </div>
          </>}

          {!has && <>
            <div className="kzflag ok"><ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>Nothing is in flight. {c.name} hides immediately.</span></div>
            {w && w.kind === 'reference' && <p className="kzp">{window.KZ_LOCALE.int(w.n)} {w.label} stay in the database, queryable in reports and exports, and return exactly as they were if you switch this back on.</p>}
            {!w && <p className="kzp">Records stay in the database and return exactly as they were if you switch this back on.</p>}
          </>}
        </div>

        <div className="kzsheet__ft">
          <button className="kzbtn" onClick={onClose}>Keep it on</button>
          {docs && <button className="kzbtn" onClick={() => { KZ.setCap(mid, capKey, false); onDone(); }}>Hide now anyway</button>}
          <button className="kzbtn pri" disabled={money && !ack}
            onClick={() => { KZ.setCap(mid, capKey, docs ? 'winding' : false); onDone(); }}>
            <ion-icon name={docs ? 'hourglass-outline' : 'eye-off-outline'}></ion-icon>
            {docs ? 'Wind down' : 'Turn off'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- capability panel — the shared Setup surface ---------------- */
function CapabilityPanel({ mid, onChange }) {
  const [flight, setFlight] = kzUse(null);
  const [, bump] = kzUse(0);
  const refresh = () => { bump((n) => n + 1); onChange && onChange(); };
  const s = KZ.state(), m = KZ.mod(mid), ms = s.modules[mid];
  const readOnly = s.role === 'staff' || s.device === 'phone';
  const planIx = KZ.PLAN_IX[s.plan];

  const flip = (c) => {
    if (readOnly) return;
    const cur = ms.switches[c.key];
    if (cur === true) setFlight(c.key);
    else KZ.setCap(mid, c.key, true), refresh();
  };

  const counts = m.caps.reduce((a, c) => {
    const r = KZ.resolve(mid, c.key);
    a[r] = (a[r] || 0) + 1; return a;
  }, {});

  return (
    <div className="kzmod">
      <div className="kzmod__hd">
        <div className="kzmod__ic" style={{ background: m.tint + '1a', color: m.tint }}><ion-icon name={m.icon}></ion-icon></div>
        <div style={{ minWidth: 0 }}>
          <h3>{m.name}</h3>
          <p>{ms.tier === 'off' ? 'Not part of this business' :
            (counts.on || 0) + ' on' + (counts.winding ? ' · ' + counts.winding + ' winding down' : '') + (counts.locked ? ' · ' + counts.locked + ' above plan' : '')}</p>
        </div>
        <div className="sp"></div>
        <a className="kzbtn" href={m.file}><ion-icon name="open-outline"></ion-icon>Open</a>
      </div>

      <div className="kzmod__tiers">
        {KZ.TIERS.map((t) => {
          const above = KZ.TIER_IX[t.id] > KZ.TIER_IX[KZ.PLANS[planIx].ceiling];
          return (
            <button key={t.id} className={'kztier' + (ms.tier === t.id ? ' on' : '') + (above ? ' locked' : '')}
              disabled={readOnly || above} onClick={() => { KZ.setTier(mid, t.id); refresh(); }}>
              <b>{t.name}</b><span>{above ? 'Needs a higher plan' : t.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="kzmod__core">
        <ion-icon name="shield-checkmark-outline"></ion-icon>
        <div><b>{m.core}</b><span>{m.coreDesc}</span></div>
      </div>

      {ms.tier !== 'off' && (
        <div className="kzmod__caps">
          {m.caps.map((c) => {
            const r = KZ.resolve(mid, c.key);
            const w = workFor(mid, c.key);
            const from = KZ.enabledFrom(mid, c.key);
            return (
              <div className={'kzcap ' + r} key={c.key}>
                <div className="kzcap__ic"><ion-icon name={c.icon}></ion-icon></div>
                <div className="kzcap__b">
                  <div className="t">{c.name}
                    {r === 'winding' && <em className="wind">Winding down</em>}
                    {r === 'locked' && <em className="lock">{KZ.PLANS[KZ.PLAN_IX[c.plan]].name}</em>}
                    {r === 'off' && c.roles && c.roles.indexOf(s.role) === -1 && ms.switches[c.key] && <em className="dev">Not for {s.role}</em>}
                    {r === 'off' && c.devices && c.devices.indexOf(s.device) === -1 && ms.switches[c.key] && <em className="dev">Not on {s.device}</em>}
                  </div>
                  <div className="d">{c.desc}</div>
                  {r === 'winding' && w && <div className="d wd"><ion-icon name="hourglass-outline"></ion-icon>{w.n} {w.label} — retires when clear</div>}
                  {r === 'on' && from && <div className="d fr">Data from {new Date(from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>}
                </div>
                <div className="sp"></div>
                {r === 'locked'
                  ? <span className="kzlock"><ion-icon name="lock-closed-outline"></ion-icon>Upgrade</span>
                  : r === 'winding'
                    ? <button className="kzbtn sm" disabled={readOnly} onClick={() => { KZ.setCap(mid, c.key, true); refresh(); }}>Resume</button>
                    : <button className={'kzsw' + (ms.switches[c.key] ? ' on' : '')} disabled={readOnly}
                        aria-pressed={!!ms.switches[c.key]} onClick={() => flip(c)}></button>}
              </div>
            );
          })}
        </div>
      )}

      {flight && <PreFlight mid={mid} capKey={flight} onClose={() => setFlight(null)}
        onDone={() => { setFlight(null); refresh(); }} />}
    </div>
  );
}

/* ---------------- change log ---------------- */
function ChangeLog() {
  const s = KZ.state();
  if (!s.log.length) return <div className="kzempty">No configuration changes yet.</div>;
  return (
    <div className="kzlog">
      {s.log.slice(0, 12).map((l, i) => (
        <div className="kzlog__r" key={i}>
          <span className="dot"></span>
          <div><div className="t">{l.what}</div><div className="d">{l.who} · {new Date(l.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- ModuleSetup — the drop-in Setup screen for ANY module ----------------
   A manager reconfigures their own capabilities within the plan ceiling. Identical in
   every module, so learning it once is learning it everywhere. */
function ModuleSetup({ mid, embedded }) {
  const [, bump] = kzUse(0);
  const refresh = () => bump((n) => n + 1);
  kzEff(() => KZ.subscribe(refresh), []);
  const s = KZ.state(), m = KZ.mod(mid), p = KZ.plan();
  const readOnly = s.role === 'staff' || s.device === 'phone';

  return (
    <div className="kzsetup">
      {!embedded && (
        <div className="kzsetup__hd">
          <div><h2>Setup</h2><p>{m.name} · what this business sees</p></div>
          <div className="sp"></div>
          <a className="kzbtn" href="Koomzo - Control Centre.html"><ion-icon name="options-outline"></ion-icon>Control Centre</a>
        </div>
      )}

      <div className="kzsetup__plan">
        <div className="kzsetup__planL">
          <span className="k">Plan</span>
          <span className="v">{p.name}</span>
        </div>
        <div className="kzsetup__planD">
          Capabilities above <b>{p.name}</b> are shown but locked. Your plan is changed by the account owner in billing.
        </div>
        <div className="sp"></div>
        {s.role !== 'owner' && <span className="kzwarn"><ion-icon name="person-outline"></ion-icon>{s.role === 'manager' ? 'Manager — no billing access' : 'Staff — read only'}</span>}
        {s.device === 'phone' && <span className="kzwarn"><ion-icon name="phone-portrait-outline"></ion-icon>Read-only on a phone</span>}
      </div>

      {readOnly && (
        <div className="kzflag warn" style={{ marginBottom: 12 }}>
          <ion-icon name="lock-closed-outline"></ion-icon>
          <span>{s.role === 'staff'
            ? 'Staff cannot change configuration. Ask a manager or the owner.'
            : 'Configuration is a considered act — open Koomzo on a tablet or desktop to change it.'}</span>
        </div>
      )}

      <CapabilityPanel mid={mid} onChange={refresh} />

      <div className="kzsetup__log">
        <div className="kzsetup__logT">Recent configuration changes</div>
        <ChangeLog />
      </div>
    </div>
  );
}

Object.assign(window, { PlanBar, PreviewAs, CapabilityPanel, ModuleSetup, PreFlight, ChangeLog, OPEN_WORK });
