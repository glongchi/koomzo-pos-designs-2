/* Koomzo — Customer display, staff side: Setup panel, status dot, suggestion strip.
   Shared by Restaurant & Bar and Retail Flex; self-styled (kz/kz-cfd.css, prefix cfs-). */

function useCfdStatus() {
  const hub = window.KZ_CFD && window.KZ_CFD.hub;
  const [s, setS] = React.useState(hub ? hub.status() : null);
  React.useEffect(() => (hub ? hub.subscribe(setS) : undefined), [hub]);
  return s;
}

function CfdDot() {
  const s = useCfdStatus();
  if (!s) return null;
  return <span className={'cfs-dot' + (s.connected ? ' on' : '')} title={s.connected ? 'Customer display connected' : 'No customer display connected'}>
    <ion-icon name="tv-outline"></ion-icon><span className="cfs-dot__l">{s.connected ? 'Display' : 'No display'}</span></span>;
}

/* customer taps arrive as suggestions — never applied silently (plan: staff side) */
function CfdSuggest({ onAccept, describe }) {
  const hub = window.KZ_CFD && window.KZ_CFD.hub;
  const [list, setList] = React.useState([]);
  React.useEffect(() => (hub ? hub.onEvent((ev) => setList((l) => [...l.filter((x) => x.type !== ev.type), ev].slice(-3))) : undefined), [hub]);
  if (!list.length) return null;
  const T = (ev) => describe ? describe(ev) : ev.type;
  const drop = (ev) => setList((l) => l.filter((x) => x !== ev));
  return (
    <div className="cfs-sugg">
      {list.map((ev) => (
        <div key={ev.type + ev.at} className="cfs-sugg__r">
          <ion-icon name={ev.type === 'loyaltyPhone' ? 'star-outline' : ev.type === 'tip' ? 'heart-outline' : 'receipt-outline'}></ion-icon>
          <span><small>From the customer display</small>{T(ev)}</span>
          <button className="cfs-b" onClick={() => drop(ev)}>Ignore</button>
          <button className="cfs-b pri" onClick={() => { onAccept(ev); drop(ev); }}>Accept</button>
        </div>
      ))}
    </div>
  );
}
const cfdReceiptLabel = { whatsapp: 'WhatsApp', sms: 'SMS', print: 'Printed', none: 'No receipt' };
const cfdDescribe = (money) => (ev) => ev.type === 'loyaltyPhone' ? 'Loyalty number ' + window.KZ_CFD.maskPhone(ev.value)
  : ev.type === 'receipt' ? 'Receipt: ' + (cfdReceiptLabel[ev.value] || ev.value)
  : ev.type === 'tip' ? 'Add a tip of ' + money(ev.value) : ev.type;

function CfdToggle({ on, onChange, label }) {
  return <button className={'cfs-tg' + (on ? ' on' : '')} aria-pressed={on} aria-label={label} onClick={() => onChange(!on)}></button>;
}

function CfdSetup({ registerId, module, rxDefault }) {
  const C = window.KZ_CFD;
  const s = useCfdStatus() || { settings: C.settings(registerId), code: C.code(registerId) };
  const [set, setSet] = React.useState(() => C.settings(registerId));
  const [code, setCode] = React.useState(() => C.code(registerId));
  const save = (patch) => { const n = C.saveSettings(registerId, patch); setSet(n); C.hub && C.hub.refresh(); };
  const act = (k, v) => save({ actions: { ...set.actions, [k]: v } });
  const slide = (i, patch) => save({ slides: [0, 1, 2].map((j) => j === i ? { ...(set.slides[j] || {}), ...patch } : (set.slides[j] || { title: '', sub: '', img: '' })) });
  const rx = set.rxPrivacy == null ? !!rxDefault : set.rxPrivacy;
  const open = () => window.open('Koomzo Customer Display.html?reg=' + encodeURIComponent(registerId) + '&builtin=1', 'kzcfd-' + registerId, 'popup,width=1280,height=800');
  const seen = s.lastSeen ? Math.max(0, Math.round((Date.now() - s.lastSeen) / 1000)) : null;
  return (
    <div className="cfs">
      <div className="cfs-card">
        <div className="cfs-hd"><ion-icon name="tv-outline"></ion-icon><div><h3>Customer display</h3><p>A screen facing the customer shows each line, the total and how to pay. Staff-only details never reach it.</p></div></div>
        <div className="cfs-pair">
          <div className="cfs-code"><small>Pairing code</small><b>{code.split('').join(' ')}</b><span>Open <i>Koomzo Customer Display</i> on the tablet or terminal and enter this code.</span></div>
          <div className="cfs-stat">
            <span className={'cfs-dot' + (s.connected ? ' on' : '')}><ion-icon name="tv-outline"></ion-icon>{s.connected ? 'Connected' : 'Not connected'}</span>
            <small>{s.connected ? 'Display ' + (s.displayId || '') + ' · seen ' + seen + ' s ago' : s.lastSeen ? 'Last seen ' + window.KZ_LOCALE.fmtDateTime(new Date(s.lastSeen)) : 'No display has connected yet.'}</small>
            <div className="cfs-btns">
              <button className="cfs-b pri" onClick={open}><ion-icon name="open-outline"></ion-icon>Open on second screen</button>
              <button className="cfs-b" onClick={() => C.hub && C.hub.test()}><ion-icon name="eye-outline"></ion-icon>Show test screen</button>
              <button className="cfs-b" onClick={() => setCode(C.newCode(registerId))}><ion-icon name="unlink-outline"></ion-icon>Unpair · new code</button>
            </div>
            <small>Built-in rear screen on an all-in-one POS: use <b>Open on second screen</b> — no code needed.</small>
          </div>
        </div>
      </div>

      <div className="cfs-card">
        <h4>What the customer sees</h4>
        <div className="cfs-row"><div><b>Display language</b><span>Independent of the staff language. Product names stay as entered.</span></div>
          <div className="cfs-seg">{[['fr', 'Français'], ['en', 'English']].map(([k, l]) => <button key={k} className={set.lang === k ? 'on' : ''} onClick={() => save({ lang: k })}>{l}</button>)}</div></div>
        {module === 'restaurant' && <div className="cfs-row"><div><b>Table orders</b><span>A counter till moves between tables — by default a table's bill shows only at Print bill or Pay. Counter, takeaway and tabs always show.</span></div>
          <div className="cfs-seg">{[['bill', 'At bill / Pay'], ['always', 'While ordering']].map(([k, l]) => <button key={k} className={set.tableRule === k ? 'on' : ''} onClick={() => save({ tableRule: k })}>{l}</button>)}</div></div>}
        {module === 'retail' && <div className="cfs-row"><div><b>Hide prescription item names</b><span>Shows “Prescription item” instead of the drug name. On by default for Pharmacy.</span></div>
          <CfdToggle on={rx} onChange={(v) => save({ rxPrivacy: v })} label="Hide prescription names" /></div>}
        <div className="cfs-row"><div><b>Thank-you screen</b><span>Seconds before returning to the welcome screen. A new order ends it at once.</span></div>
          <div className="cfs-seg">{[5, 8, 12].map((n) => <button key={n} className={set.doneSec === n ? 'on' : ''} onClick={() => save({ doneSec: n })}>{n} s</button>)}</div></div>
      </div>

      <div className="cfs-card">
        <h4>Customer touch actions</h4>
        <p className="cfs-p">Choose which buttons customers see on a touch display. Each one reaches the register as a suggestion the cashier accepts.</p>
        <div className="cfs-row"><div><b>Loyalty number</b><span>“Earn points — enter your phone number” while the order is built.</span></div><CfdToggle on={set.actions.loyalty} onChange={(v) => act('loyalty', v)} label="Loyalty number" /></div>
        <div className="cfs-row"><div><b>Receipt choice</b><span>WhatsApp, SMS, printed or none — on the thank-you screen.</span></div><CfdToggle on={set.actions.receipt} onChange={(v) => act('receipt', v)} label="Receipt choice" /></div>
        <div className="cfs-row"><div><b>Tipping</b><span>Offers {set.tipPresets.join(' / ')} % before payment. Off by default.</span></div><CfdToggle on={set.actions.tip} onChange={(v) => act('tip', v)} label="Tipping" /></div>
      </div>

      <div className="cfs-card">
        <h4>Welcome screen</h4>
        <label className="cfs-f"><span>Welcome line</span><input value={set.welcome} placeholder={set.lang === 'en' ? 'Welcome — we’ll be right with you' : 'Bienvenue — on s’occupe de vous'} onChange={(e) => save({ welcome: e.target.value })} /></label>
        <div className="cfs-k">Promo slides · up to 3, shown every 8 s</div>
        {[0, 1, 2].map((i) => { const x = set.slides[i] || {}; return (
          <div key={i} className="cfs-slide">
            <span className="cfs-n">{i + 1}</span>
            <input value={x.title || ''} placeholder={i === 0 ? 'Happy hour 18 h – 20 h' : 'Title'} onChange={(e) => slide(i, { title: e.target.value })} />
            <input value={x.sub || ''} placeholder="Line under the title" onChange={(e) => slide(i, { sub: e.target.value })} />
            <input value={x.img || ''} placeholder="https:// image (optional)" inputMode="url" onChange={(e) => slide(i, { img: e.target.value.trim() })} />
          </div>); })}
      </div>
    </div>
  );
}

/* one register per page in the prototype; gated by the Control Centre capability (D12: all tiers) */
const CFD_REGS = { restaurant: { registerId: 'rk-R1', venue: 'Chez Mama Ngono', module: 'restaurant' }, retail: { registerId: 'rx-C1', venue: 'Boutique Koomzo', module: 'retail' } };
function cfdAttachFor(mid) {
  if (!window.KZ_CFD) return null;
  if (window.KZ && window.KZ.on && !window.KZ.on(mid, 'cfd')) return null;
  return window.KZ_CFD.attach(CFD_REGS[mid]);
}
Object.assign(window, { cfdAttachFor, CFD_REGS, CfdSetup, CfdDot, CfdSuggest, cfdDescribe, useCfdStatus });
