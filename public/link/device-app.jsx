/* Koomzo Link — device app: setup (S1–S5), console (S6), lost (S7), chip (S8),
   decisions (S9), display client (S10), sync log. One iframe = one device. */
const { useState, useEffect } = React;
const KZ = window.KzLink;
const params = new URLSearchParams(location.search);
const DEVICE = params.get('d') || 'd_' + Math.random().toString(36).slice(2, 7);
const BUSY = KZ.ownedElsewhere(DEVICE);
const store = BUSY ? null : KZ.createEntityStore(DEVICE, { tenantSettings: { localNetwork: true } });
const svc = store && { restaurant: new KZ.RestaurantMockService(store), queue: new KZ.QueueMockService(store), signage: new KZ.SignageMockService(store) };
window.kzStore = store;

const KIND = { till: ['cash-outline', 'Till'], server: ['walk-outline', 'Server'], kitchen: ['restaurant-outline', 'Kitchen screen'], kiosk: ['tablet-portrait-outline', 'Kiosk'], display: ['tv-outline', 'Display'], printer: ['print-outline', 'Printer'] };
const MOD = { restaurant: 'Restaurant', queue: 'Queue', signage: 'Screens' };
const ago = (t) => { if (!t) return 'never'; const s = Math.round((Date.now() - t) / 1000); return s < 5 ? 'just now' : s < 60 ? s + ' s ago' : Math.round(s / 60) + ' min ago'; };
const hhmm = (t) => (t ? new Date(t).toTimeString().slice(0, 5) : '—');

/* ---------- S8 status chip ---------- */
const CHIP = {
  online: ['ok', 'cloud-done-outline', () => 'Online'],
  via: ['ok', 'git-network-outline', (s) => 'Via main device'],
  noInternet: ['warn', 'cloud-upload-outline', (s) => 'No internet' + (s.waiting ? ' · ' + s.waiting + ' waiting' : '')],
  lost: ['bad', 'cloud-offline-outline', (s) => 'Main device lost' + (s.waiting ? ' · ' + s.waiting + ' waiting' : '')],
  syncing: ['pri', 'sync-outline', (s) => 'Syncing · ' + s.waiting],
  pairingOnly: ['warn', 'radio-outline', () => 'Pairing only'],
  setup: ['mut', 'settings-outline', () => 'Not set up'],
  off: ['mut', 'power-outline', () => 'Off'],
};
function Chip({ s, onClick }) {
  const [tone, ic, label] = CHIP[s.state] || CHIP.setup;
  return <button className={'netchip ' + tone} onClick={onClick}><ion-icon name={ic}></ion-icon>{label(s)}</button>;
}

/* ---------- S1 · choose role ---------- */
function ChooseRole({ onJoin }) {
  const [pick, setPick] = useState('coordinator');
  const [site, setSite] = useState('Le Comptoir');
  const opts = [
    ['coordinator', 'server-outline', 'Main device', 'Keeps the data and syncs with the internet. Choose the device that stays on and plugged in.'],
    ['client', 'phone-portrait-outline', 'Join a main device', 'Kitchen screen, server phone, second till, display. Works through the main device.'],
    ['standalone', 'tablet-portrait-outline', 'Standalone', 'One device only. Connects to the internet directly.'],
  ];
  const go = () => (pick === 'coordinator' ? store.becomeCoordinator(site) : pick === 'standalone' ? store.becomeStandalone() : onJoin());
  return (
    <div className="body">
      <div><h2 className="h">How will this device work?</h2><p className="p">Use several devices together. They keep working together when the internet is down.</p></div>
      {opts.map(([id, ic, t, d]) => (
        <button key={id} className={'role' + (pick === id ? ' on' : '')} onClick={() => setPick(id)}><div className="ic"><ion-icon name={ic}></ion-icon></div><div><b>{t}</b><span>{d}</span></div></button>
      ))}
      {pick === 'coordinator' && <div><p className="eb">Business name</p><input className="in" value={site} onChange={(e) => setSite(e.target.value)} /></div>}
      <div className="note"><ion-icon name="information-circle-outline"></ion-icon><span>Uses your Wi-Fi or 4G box. No Wi-Fi? The main device makes its own hotspot. No internet credit needed.</span></div>
      <button className="btn pri" onClick={go}>Continue</button>
    </div>
  );
}

/* ---------- S3 · find, S4 · device kind, S5 · waiting ---------- */
function Join({ onBack }) {
  const found = useSig(store.found);
  const link = useSig(store.link);
  const cfg = useSig(store.cfg);
  const [target, setTarget] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState(cfg.name === 'New device' ? '' : cfg.name);
  const [kind, setKind] = useState(cfg.kind || 'server');
  const [mod, setMod] = useState(cfg.module || 'restaurant');
  const list = Object.values(found).filter((m) => m.type === 'announce');
  const join = link.join;
  if (join && join.state === 'waiting') {
    return (
      <div className="body"><div className="card center" style={{ padding: '26px 16px' }}><div className="spin"></div><h2 className="h" style={{ margin: 0 }}>Waiting for {join.siteName}</h2><p className="p">Ask someone at the main device to approve this device.</p></div>
        <button className="btn gh" onClick={() => store.leave()}>Cancel</button></div>
    );
  }
  if (target) {
    return (
      <div className="body">
        <div><h2 className="h">Joining {target.siteName}</h2><p className="p">Name this device and pick its job.</p></div>
        <div><p className="eb">6-digit code from the main device</p><input className="codein" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></div>
        {join && join.state === 'badcode' && <div className="note bad"><ion-icon name="close-circle-outline"></ion-icon><span>That code didn't match. Codes change every 10 minutes.</span></div>}
        {join && join.state === 'refused' && <div className="note bad"><ion-icon name="close-circle-outline"></ion-icon><span>The main device refused this request.</span></div>}
        <div><p className="eb">Device name</p><input className="in" value={name} placeholder="Phone Blaise" onChange={(e) => setName(e.target.value)} /></div>
        <div><p className="eb">Job</p><div className="seg">{Object.entries(KIND).filter(([k]) => k !== 'printer').map(([k, [ic, l]]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}><ion-icon name={ic}></ion-icon>{l}</button>)}</div></div>
        <div><p className="eb">Opens in</p><div className="seg">{Object.entries(MOD).map(([k, l]) => <button key={k} className={mod === k ? 'on' : ''} onClick={() => setMod(k)}>{l}</button>)}</div></div>
        <button className="btn pri" disabled={code.length !== 6 || !name.trim()} onClick={() => store.requestJoin(target, code, { name: name.trim(), kind, module: mod })}>Send request</button>
        <button className="btn gh" onClick={() => setTarget(null)}>Back</button>
      </div>
    );
  }
  return (
    <div className="body">
      <div><h2 className="h">Find the main device</h2><p className="p">Devices on the same Wi-Fi show up on their own.</p></div>
      <div className="card" style={{ padding: '4px 14px' }}>
        <p className="eb" style={{ margin: '10px 0 2px' }}>Found nearby</p>
        {!list.length && <div className="row"><div className="t"><span>Looking… make sure the main device has Koomzo open.</span></div></div>}
        {list.map((m) => (
          <div className="row" key={m.from}><div className="di" style={{ background: 'var(--kz-primary-wash)' }}><ion-icon name="server-outline" style={{ color: 'var(--kz-primary)' }}></ion-icon></div>
            <div className="t"><b>{m.siteName} · {m.name}</b><span>{m.devices} devices</span></div><button className="btn pri sm" onClick={() => setTarget(m)}>Join</button></div>
        ))}
      </div>
      <button className="btn gh" disabled={!list.length} onClick={() => { setTarget(list[0]); setCode(window.kzScanCode ? window.kzScanCode(list[0]) : ''); }}><ion-icon name="qr-code-outline"></ion-icon>Scan QR code</button>
      <button className="btn gh" disabled={!list.length} onClick={() => setTarget(list[0])}><ion-icon name="radio-outline"></ion-icon>No Wi-Fi? Connect directly</button>
      <button className="btn gh" onClick={onBack}>Back</button>
    </div>
  );
}
/* A scanned QR carries the same code as the 6 digits; the mock reads it from the main device's tab. */
window.kzScanCode = (m) => { try { return localStorage.getItem('kzlink:code:' + m.from) || ''; } catch (e) { return ''; } };

/* ---------- S2 + S6 · main device console ---------- */
function Qr({ seed }) {
  let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const cells = Array.from({ length: 121 }, (_, i) => { h = (h * 1103515245 + 12345) >>> 0; const r = Math.floor(i / 11), c = i % 11; const finder = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3); return finder ? !(r === 1 && (c === 1 || c === 9)) && !(r === 9 && c === 1) : (h >> 16) & 1; });
  return <div className="qr">{cells.map((k, i) => <i key={i} className={k ? 'k' : ''}></i>)}</div>;
}
function Console() {
  const cfg = useSig(store.cfg);
  const st = useSig(store.status);
  const devices = useSig(store.devices);
  const approvals = useSig(store.approvals);
  const code = store.code();
  useEffect(() => { localStorage.setItem('kzlink:code:' + DEVICE, code); }, [code]);
  const now = Date.now();
  return (
    <div className="body">
      <div className="card center">
        <p className="eb" style={{ margin: 0 }}>Invite a device · scan or type</p>
        <Qr seed={code + cfg.siteId} />
        <div className="code">{code.split('').map((d, i) => <span key={i}>{d}</span>)}</div>
        <p className="p" style={{ fontSize: 12 }}>Code changes every 10 min · <a href="#" onClick={(e) => { e.preventDefault(); store.newCode(); }}>New code</a></p>
      </div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}><b style={{ font: '600 13px var(--kz-font-sans)', display: 'block' }}>Approve each new device</b><span className="p" style={{ fontSize: 12 }}>Stops anyone on the Wi-Fi from joining.</span></div>
        <button className={'toggle' + (cfg.approval ? '' : ' off')} aria-label="Approve each new device" onClick={() => store.setCfg({ approval: !cfg.approval })}></button>
      </div>
      <div className="card" style={{ padding: '4px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 2px' }}><p className="eb" style={{ margin: 0 }}>Devices</p>{approvals.length ? <span className="pill warn"><i></i>{approvals.length} waiting for approval</span> : null}</div>
        {approvals.map((a) => (
          <div className="row" key={a.deviceId} style={{ background: 'var(--kz-warning-wash)', margin: '0 -14px', padding: '10px 14px' }}>
            <div className="di" style={{ background: '#fff' }}><ion-icon name={(KIND[a.info.kind] || KIND.server)[0]}></ion-icon></div>
            <div className="t"><b>{a.info.name}</b><span>Asks to join as {(KIND[a.info.kind] || KIND.server)[1]}</span></div>
            <button className="btn bad sm" onClick={() => store.approve(a.deviceId, false)}>Refuse</button><button className="btn ok sm" onClick={() => store.approve(a.deviceId, true)}>Approve</button>
          </div>
        ))}
        {!Object.keys(devices).length && !approvals.length && <div className="row"><div className="t"><span>No devices yet. Invite one with the code above.</span></div></div>}
        {Object.entries(devices).map(([id, d]) => {
          const off = now - d.lastSeen > 4000;
          return (
            <div className="row" key={id}>
              <div className="di"><ion-icon name={(KIND[d.kind] || KIND.server)[0]}></ion-icon></div>
              <div className="t"><b>{d.name}{cfg.backupId === id ? ' · backup' : ''}</b><span>{(KIND[d.kind] || KIND.server)[1]} · {MOD[d.module] || ''}{off ? ' · last seen ' + hhmm(d.lastSeen) : d.pending ? ' · ' + d.pending + ' waiting' : ''}</span></div>
              {off ? <span className="pill mut"><i></i>Off</span> : <span className={'pill ' + (d.signalMs > 150 ? 'warn' : 'ok')}><i></i>{d.signalMs > 150 ? 'Weak' : 'Good'}</span>}
              {cfg.backupId !== id && !off && d.kind !== 'display' && <button className="btn gh sm" onClick={() => store.setBackup(id)}>Backup</button>}
              {!off && d.kind !== 'display' && <button className="btn gh sm" title="Make this the main device" onClick={() => store.handOver(id)}><ion-icon name="swap-horizontal-outline"></ion-icon></button>}
            </div>
          );
        })}
      </div>
      <div className="card"><p className="eb">Internet sync</p>
        <div className="stat"><div><b style={{ color: st.state === 'noInternet' ? '#8a6414' : '#1f7a45' }}>{st.state === 'noInternet' ? 'Off' : 'Online'}</b><span>Internet</span></div><div><b>{ago(st.lastSyncAt)}</b><span>Last sync</span></div><div><b>{st.waiting}</b><span>Waiting</span></div><div><b style={{ color: st.decisions ? '#8a6414' : undefined }}>{st.decisions}</b><span>Need a decision</span></div></div>
      </div>
      <div className="card"><p className="eb">Details</p><dl className="kv"><dt>Connection</dt><dd>{KZ.RUNG_LABEL[st.rung]}</dd><dt>If Wi-Fi drops</dt><dd>Hotspot from this device</dd><dt>Backup</dt><dd>{cfg.backupId ? (devices[cfg.backupId] || {}).name || cfg.backupId : 'None — pick one'}</dd><dt>Site</dt><dd>{cfg.siteName}</dd></dl></div>
      <div className="note"><ion-icon name="battery-charging-outline"></ion-icon><span>Keep this device plugged in or on a power bank. If it goes off, the backup can take over.</span></div>
    </div>
  );
}

/* ---------- S5 connected · S7 main device lost ---------- */
function ClientNetwork() {
  const cfg = useSig(store.cfg);
  const st = useSig(store.status);
  const link = useSig(store.link);
  const [pin, setPin] = useState('');
  const [err, run] = useAction();
  const waiting = store.sync.groups().filter((g) => g.status === 'pending' || g.status === 'sent');
  const co = link.coordinator || {};
  if (st.state === 'lost') {
    const backup = store.canTakeOver();
    return (
      <div className="body">
        <div className="card"><dl className="kv"><dt>Main device</dt><dd>{cfg.siteName} · {co.name || '—'}</dd><dt>Last contact</dt><dd>{ago(link.lastContact)}</dd><dt>Waiting to send</dt><dd>{waiting.length}</dd></dl></div>
        <div className="note warn"><ion-icon name="warning-outline"></ion-icon><span>Keep taking orders and cash. MoMo, card and final ticket numbers wait for the main device.</span></div>
        {!!waiting.length && <div className="card"><p className="eb">Waiting to send</p>{waiting.slice(-6).reverse().map((g) => <div className="row" key={g.groupId}><div className="di"><ion-icon name="receipt-outline"></ion-icon></div><div className="t"><b>{g.label}</b><span>{hhmm(g.at)}</span></div><span className="pill warn">Queued</span></div>)}</div>}
        <button className="btn gh" onClick={() => store.tick()}><ion-icon name="refresh-outline"></ion-icon>Try again</button>
        {!backup && <input className="in" inputMode="numeric" placeholder="Manager PIN" value={pin} onChange={(e) => setPin(e.target.value)} />}
        <button className="btn pri" onClick={run(() => store.takeOver(pin))}><ion-icon name="server-outline"></ion-icon>Make this the main device</button>
        <p className="p" style={{ fontSize: 11.5, textAlign: 'center' }}>{backup ? 'This device is the named backup.' : 'Only the backup device or a manager can do this (mock PIN 1234).'}</p>
        <Err msg={err} />
      </div>
    );
  }
  return (
    <div className="body">
      <div className="card center" style={{ padding: '20px 14px' }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--kz-success-wash)', display: 'grid', placeItems: 'center' }}><ion-icon name="checkmark-circle" style={{ fontSize: 34, color: 'var(--kz-success)' }}></ion-icon></div>
        <h2 className="h" style={{ margin: 0 }}>Connected to {cfg.siteName}</h2>
        <p className="p">{cfg.name} · {(KIND[cfg.kind] || KIND.server)[1]} · {MOD[cfg.module]}</p>
      </div>
      <div className="card"><dl className="kv"><dt>Main device</dt><dd>{co.name}</dd><dt>Connection</dt><dd>{KZ.RUNG_LABEL[st.rung]}</dd><dt>Waiting to send</dt><dd>{waiting.length}</dd><dt>Main device internet</dt><dd style={{ color: co.internet ? '#1f7a45' : '#8a6414' }}>{co.internet ? 'Online' : 'Offline · ' + (co.waiting || 0) + ' waiting'}</dd></dl></div>
      {st.state === 'pairingOnly' && <div className="note warn"><ion-icon name="radio-outline"></ion-icon><span>Connected for pairing only. Orders wait until Wi-Fi or the hotspot is back.</span></div>}
      <div className="note"><ion-icon name="information-circle-outline"></ion-icon><span>If the main device goes off, this device keeps working. Changes are sent when it's back.</span></div>
      <button className="btn bad" onClick={() => store.leave()}>Leave this main device</button>
    </div>
  );
}

/* ---------- S9 · needs a decision ---------- */
function Decisions() {
  const list = useSig(store.decisions);
  const [pin, setPin] = useState('');
  const [err, run] = useAction();
  const open = list.filter((d) => d.open);
  const done = list.filter((d) => !d.open);
  return (
    <div className="body">
      <p className="p">Changes the main device couldn't accept as they were. Nothing is dropped silently.</p>
      {!open.length && <div className="card center"><ion-icon name="checkmark-done-outline" style={{ fontSize: 28, color: 'var(--kz-success)' }}></ion-icon><p className="p">Nothing needs a decision.</p></div>}
      {open.map((d) => {
        const r = KZ.resolverFor(d.cause);
        const money = d.cause === 'paidTwice';
        return (
          <div className="card" key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, borderColor: money ? '#f2c4b4' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className={'pill ' + (money ? 'bad' : 'warn')}>{money ? 'Payment' : d.status === 'flag' ? 'Check' : 'Change'}</span><span className="mono">{hhmm(d.at)} · {d.deviceName}</span></div>
            <b style={{ font: '700 14px var(--kz-font-sans)' }}>{r.title(d)}</b>
            <p className="p" style={{ fontSize: 12.5 }}>{r.body(d)}</p>
            <div className="btns">{r.actions(d).map((a) => <button key={a.id} className={'btn sm ' + (a.money ? 'gh' : 'pri')} onClick={run(() => store.resolveDecision(d.id, a.id, pin))}>{a.label}</button>)}</div>
          </div>
        );
      })}
      {open.some((d) => KZ.resolverFor(d.cause).actions(d).some((a) => a.money)) && <input className="in" inputMode="numeric" placeholder="Manager PIN (mock 1234)" value={pin} onChange={(e) => setPin(e.target.value)} />}
      <Err msg={err} />
      {!!open.length && <div className="note"><ion-icon name="lock-closed-outline"></ion-icon><span>Payment decisions need a manager PIN. Closing the day stays blocked until all are resolved.</span></div>}
      {!!done.length && <div className="card"><p className="eb">Resolved · {done.length}</p>{done.slice(0, 5).map((d) => <div className="row" key={d.id}><div className="t"><b>{KZ.resolverFor(d.cause).title(d)}</b><span>{d.resolution}</span></div></div>)}</div>}
    </div>
  );
}

/* ---------- sync log ---------- */
function SyncLog() {
  const s = useSig(store.sync.status$);
  const groups = store.sync.groups().slice().reverse().slice(0, 40);
  const tone = { pending: 'warn', sent: 'pri', accepted: 'ok', rejected: 'bad', conflict: 'bad', forwarded: 'mut' };
  return (
    <div className="body">
      <div className="card"><div className="stat"><div><b>{s.waiting}</b><span>Waiting</span></div><div><b>{s.compacted}</b><span>Compacted</span></div><div><b>{ago(s.lastSyncAt)}</b><span>Last sync</span></div></div>
        {s.lastError && <p className="p" style={{ fontSize: 12, marginTop: 8 }}>Last attempt: {s.lastError}</p>}
        <div className="btns" style={{ marginTop: 10 }}><button className="btn gh sm" onClick={() => (s.paused ? store.sync.resume() : store.sync.pause())}>{s.paused ? 'Resume' : 'Pause'}</button><button className="btn gh sm" onClick={() => store.sync.sync()}>Sync now</button></div>
      </div>
      <div className="card" style={{ padding: '4px 14px' }}>
        {!groups.length && <div className="row"><div className="t"><span>No changes recorded yet.</span></div></div>}
        {groups.map((g) => (
          <div className="row" key={g.groupId + g.seq}><div className="t"><b>{g.label || 'Change'}</b><span className="mono">#{g.seq} · {g.ops.length} op{g.ops.length === 1 ? '' : 's'} · {hhmm(g.at)}{g.attempts > 1 ? ' · ' + g.attempts + ' tries' : ''}{g.cause ? ' · ' + g.cause : ''}</span></div><span className={'pill ' + tone[g.status]}>{g.status}</span></div>
        ))}
      </div>
    </div>
  );
}

/* ---------- S10 · display client ---------- */
function DisplayClient() {
  const st = useSig(store.status);
  const cfg = useSig(store.cfg);
  const q = useQuery(store, 'q_state')[0];
  const sg = useQuery(store, 'sg_content')[0];
  const live = st.state === 'via' || st.state === 'noInternet' || st.state === 'syncing';
  const last = Math.max(q ? q.updatedAt : 0, sg ? sg.updatedAt : 0);
  return (
    <div className="disp">
      <div className="hd"><ion-icon name="storefront" style={{ fontSize: 20, color: 'var(--kz-primary-tint)' }}></ion-icon><b style={{ font: '700 15px var(--kz-font-sans)', flex: 1 }}>{cfg.siteName || 'Koomzo'}</b>
        {live ? <span className="pill" style={{ background: 'rgba(255,255,255,.1)', color: '#9fe0b8' }}><i></i>Live</span> : <span className="pill" style={{ background: 'rgba(255,255,255,.1)', color: '#f1c76b' }}><i></i>Last update {hhmm(last)} · reconnecting</span>}
      </div>
      {sg && <div className="msg">{sg.doc.message}</div>}
      <div className="now">
        <div className="big"><span style={{ font: '700 12px var(--kz-font-sans)', letterSpacing: '.1em', textTransform: 'uppercase', color: '#a9aec0' }}>Now serving</span><span style={{ font: '700 64px var(--kz-font-num)', letterSpacing: '-.03em', lineHeight: 1 }}>{q ? q.doc.nowServing : '—'}</span><span style={{ font: '600 18px var(--kz-font-sans)', color: 'var(--kz-primary-tint)' }}>{q ? 'Counter ' + q.doc.counter : ''}</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><span style={{ font: '700 11px var(--kz-font-sans)', letterSpacing: '.1em', textTransform: 'uppercase', color: '#a9aec0' }}>Next</span>
          {(q ? q.doc.next : []).map((n) => <div className="nx" key={n}>{n}</div>)}
          {(!q || !q.doc.next.length) && <div className="nx" style={{ color: '#a9aec0', fontSize: 15 }}>—</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- shell ---------- */
function Toasts() {
  const notice = useSig(store.notice);
  const notes = useSig(store.sync.notices);
  const [seen, setSeen] = useState(0);
  const corr = notes.filter((n) => n.at > seen).slice(-1)[0];
  const C = { paid: 'the bill was already paid', stale: 'it changed on another device first', paidTwice: 'a payment was already taken', depends: 'an earlier change was refused', exists: 'it already exists', missing: 'the record is gone' };
  if (notice) return <div className="toast"><ion-icon name="information-circle-outline"></ion-icon><span>{notice.text}</span><button onClick={() => store.notice.set(null)}><ion-icon name="close"></ion-icon></button></div>;
  if (corr && store.role() !== 'coordinator') return <div className="toast"><ion-icon name="arrow-undo-outline"></ion-icon><span>Corrected by the main device: “{corr.label}” — {C[corr.cause] || corr.cause}. A manager will check it.</span><button onClick={() => setSeen(corr.at)}><ion-icon name="close"></ion-icon></button></div>;
  return null;
}

/* ---------- one live instance per device id ---------- */
function Elsewhere() {
  useEffect(() => { const t = setInterval(() => { if (!KZ.ownedElsewhere(DEVICE)) location.reload(); }, 1500); return () => clearInterval(t); }, []);
  return (
    <div className="dv"><div className="body" style={{ justifyContent: 'center' }}>
      <div className="card center" style={{ padding: '24px 16px' }}>
        <ion-icon name="copy-outline" style={{ fontSize: 30, color: 'var(--kz-muted-3)' }}></ion-icon>
        <h2 className="h" style={{ margin: 0 }}>Open in another tab</h2>
        <p className="p">This device ({DEVICE}) is already running somewhere else. Only one copy can work at a time.</p>
      </div>
      <button className="btn pri" onClick={() => { KZ.handOffDevice(DEVICE); location.reload(); }}>Use here</button>
    </div></div>
  );
}

function App() {
  if (!store) return <Elsewhere />;
  return <Device />;
}

function Device() {
  const cfg = useSig(store.cfg);
  const st = useSig(store.status);
  const displaced = useSig(store.displaced);
  const [tab, setTab] = useState('work');
  const [joining, setJoining] = useState(false);
  useEffect(() => { if (cfg.role) setJoining(false); }, [cfg.role]);
  useEffect(() => devBus(), []);
  if (displaced) return <Elsewhere />;
  const off = st.state === 'off' && <div className="offlay"><ion-icon name="power-outline"></ion-icon><b>Device off</b><span>Simulated power cut. Turn it back on in the dev panel.</span></div>;
  if (cfg.role === 'client' && cfg.kind === 'display') return <div className="dv"><DisplayClient />{off}</div>;
  const [ic] = KIND[cfg.kind] || KIND.till;
  const tabs = cfg.role === 'coordinator' ? [['work', 'Work'], ['network', 'Main device'], ['decisions', 'Decisions'], ['log', 'Sync']]
    : cfg.role === 'client' ? [['work', 'Work'], ['network', 'Network'], ['log', 'Sync']]
    : cfg.role === 'standalone' ? [['work', 'Work'], ['log', 'Sync'], ['network', 'Setup']] : [];
  return (
    <div className="dv">
      {cfg.role === 'client' && st.state === 'lost' && <div className="banner bad"><ion-icon name="cloud-offline-outline"></ion-icon><span style={{ flex: 1 }}>Main device not reachable{st.waiting ? ' · ' + st.waiting + ' waiting' : ''}</span></div>}
      <div className="top"><div className="kic"><ion-icon name={cfg.role === 'coordinator' ? 'server-outline' : ic}></ion-icon></div><b>{cfg.name}</b><span className="sp"></span><Chip s={st} onClick={() => cfg.role && setTab('network')} /></div>
      {tabs.length > 0 && <div className="tabs">{tabs.map(([id, l]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}{id === 'decisions' && st.decisions ? <span className="ct">{st.decisions}</span> : null}</button>)}</div>}
      {!cfg.role ? (joining ? <Join onBack={() => setJoining(false)} /> : <ChooseRole onJoin={() => setJoining(true)} />)
        : tab === 'network' ? (cfg.role === 'coordinator' ? <Console /> : cfg.role === 'client' ? <ClientNetwork /> : <div className="body"><div className="card"><p className="p">Standalone: this device syncs straight to the internet.</p></div><button className="btn gh" onClick={() => store.leave()}>Change role</button></div>)
        : tab === 'decisions' ? <Decisions />
        : tab === 'log' ? <SyncLog />
        : <div className="body"><WorkView store={store} svc={svc} cfg={cfg} /></div>}
      <Toasts />
      {off}
    </div>
  );
}

/* Dev harness commands: { to, cmd, args } over the "kzlink:dev" channel. */
function devBus() {
  const ch = new BroadcastChannel('kzlink:dev');
  ch.onmessage = async ({ data: m }) => {
    if (m.to !== DEVICE || !store.alive) return;
    const R = svc.restaurant, a = m.args || {};
    try {
      if (m.cmd === 'openTable') { for (const it of a.items) await R.add(a.table, it); if (a.send) await R.send(a.table); }
      if (m.cmd === 'add') await R.add(a.table, a.item, a.qty || 1);
      if (m.cmd === 'pay') await R.pay(a.table, a.method);
      if (m.cmd === 'issue') for (let i = 0; i < (a.n || 1); i++) await svc.queue.issue(a.series || 'A');
      if (m.cmd === 'callNext') await svc.queue.callNext(a.counter || 1);
      if (m.cmd === 'publish') await svc.signage.publish(a.message);
    } catch (e) { store.notice.set({ tone: 'warn', text: e.message }); }
  };
  return () => ch.close();
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
