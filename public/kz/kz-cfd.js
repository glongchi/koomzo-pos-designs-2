/* Koomzo — Customer-facing display (CFD) channel.
   Register → display: one full CfdSnapshot on every change + a 2 s heartbeat (D1).
   Display → register: CfdEvent (hello, ping, loyaltyPhone, receipt, tip, bye).
   Prototype transport: BroadcastChannel per register. Production: the same messages over
   Koomzo Link on the shop Wi-Fi. Everything staff-only is stripped by sanitize() (D4). */
(function () {
  const PFX = 'kz:cfd:';
  const get = (k, fb) => { try { const r = localStorage.getItem(PFX + k); return r ? JSON.parse(r) : fb; } catch (e) { return fb; } };
  const put = (k, v) => { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} };
  const chan = (reg) => new BroadcastChannel('kzcfd:' + reg);

  const DEFAULTS = {
    lang: 'fr', welcome: '', slides: [{ title: '', sub: '', img: '' }],
    tableRule: 'bill',          // D6 — 'bill' (Print bill / Pay only) | 'always'
    rxPrivacy: null,            // D7 — null = follow profile (Pharmacy on)
    actions: { loyalty: true, receipt: true, tip: false },   // D5 — each switchable (validated change)
    tipPresets: [5, 10, 15],
    doneSec: 8,
  };
  const settings = (reg) => { const s = get('set:' + reg, {}); return { ...DEFAULTS, ...s, actions: { ...DEFAULTS.actions, ...(s.actions || {}) } }; };
  const saveSettings = (reg, patch) => { const n = { ...settings(reg), ...patch }; put('set:' + reg, n); try { const c = chan(reg); c.postMessage({ kind: 'settings' }); c.close(); } catch (e) {} return n; };

  /* ---- pairing (D2) ---- */
  function code(reg) {
    const codes = get('codes', {});
    const have = Object.keys(codes).find((k) => codes[k] === reg);
    if (have) return have;
    let c; do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (codes[c]);
    codes[c] = reg; put('codes', codes); return c;
  }
  function newCode(reg) {
    const codes = get('codes', {}); Object.keys(codes).forEach((k) => { if (codes[k] === reg) delete codes[k]; }); put('codes', codes);
    try { const c = chan(reg); c.postMessage({ kind: 'unpair' }); c.close(); } catch (e) {}
    return code(reg);
  }
  const lookup = (c) => get('codes', {})[String(c).trim()] || null;

  /* ---- privacy filter (D4): only whitelisted fields ever leave the register ---- */
  const num = (v) => (typeof v === 'number' && isFinite(v) ? Math.round(v) : 0);
  const str = (v, n) => (v == null ? '' : String(v).slice(0, n || 80));
  const maskPhone = (p) => { const d = String(p || '').replace(/\D/g, '').slice(-9); if (d.length < 4) return ''; return d[0] + '•• •• •• ' + d.slice(-2); };
  function sanitize(s) {
    const o = s.order, p = s.pay, d = s.done;
    return {
      v: 1, seq: s.seq, at: Date.now(), registerId: s.registerId, venue: str(s.venue), lang: s.lang, phase: s.phase,
      cfg: { welcome: str(s.cfg.welcome, 120), slides: (s.cfg.slides || []).slice(0, 3).map((x) => ({ title: str(x.title, 60), sub: str(x.sub, 100), img: /^https:\/\//.test(x.img || '') ? x.img : '' })).filter((x) => x.title || x.img),
        actions: { ...s.cfg.actions }, tipPresets: (s.cfg.tipPresets || []).slice(0, 3).map(num), doneSec: num(s.cfg.doneSec) || 8 },
      order: o ? {
        no: str(o.no, 24), context: str(o.context, 40),
        customer: o.customer ? { first: str(o.customer.first, 24), points: num(o.customer.points) } : null,
        lines: (o.lines || []).slice(0, 200).map((l) => ({ id: str(l.id, 40), name: str(l.name), detail: str(l.detail, 80), qty: typeof l.qty === 'number' ? +l.qty.toFixed(3) : 1,
          unitLabel: str(l.unitLabel, 16), unit: num(l.unit), amount: num(l.amount), disc: str(l.disc, 16), img: /^(https:\/\/|data:image\/)/.test(l.img || '') ? l.img : '',
          icon: str(l.icon, 40), tint: l.tint ? { bg: str(l.tint.bg, 12), fg: str(l.tint.fg, 12) } : null })),
        subtotal: num(o.subtotal), discount: num(o.discount), svc: num(o.svc), svcLabel: str(o.svcLabel, 24), tax: num(o.tax), taxLabel: str(o.taxLabel, 24),
        total: num(o.total), items: num(o.items), lastId: str(o.lastId, 40), pointsEarned: num(o.pointsEarned), notice: str(o.notice, 60),
      } : null,
      pay: p ? { due: num(p.due), paid: num(p.paid), remaining: num(p.remaining), method: str(p.method, 20), methodLabel: str(p.methodLabel, 30), state: str(p.state, 16),
        phoneMasked: str(p.phoneMasked, 20), left: num(p.left), tendered: num(p.tendered), change: num(p.change), share: num(p.share) } : null,
      done: d ? { change: num(d.change), points: num(d.points), total: num(d.total) } : null,
    };
  }

  /* ---- register side: one hub per register page ---- */
  function attach({ registerId, venue, module }) {
    if (window.KZ_CFD.hub && window.KZ_CFD.hub.registerId === registerId) return window.KZ_CFD.hub;
    const ch = chan(registerId);
    let seq = 0, order = null, pay = null, done = null, doneTimer = null, test = null;
    let lastSeen = 0, displayId = null, phoneMasked = '';
    const subs = new Set(), evSubs = new Set();
    const st = () => settings(registerId);
    const phase = () => test ? test.phase : done ? 'done' : pay ? 'pay' : (order && order.lines && order.lines.length ? 'order' : 'idle');
    const snap = () => {
      const s = st();
      return sanitize({ seq, registerId, venue, lang: s.lang, phase: phase(), cfg: s, order: test ? test.order : order,
        pay: test ? test.pay : (pay ? { ...pay, phoneMasked: pay.phoneMasked || phoneMasked } : null), done: test ? test.done : done });
    };
    const send = () => { seq++; const s = snap(); hub.last = s; try { ch.postMessage({ kind: 'snap', snap: s }); } catch (e) {} subs.forEach((f) => f(hub.status())); };
    const beat = setInterval(() => { try { ch.postMessage({ kind: 'snap', snap: hub.last || snap() }); } catch (e) {} subs.forEach((f) => f(hub.status())); }, 2000);
    ch.onmessage = ({ data }) => {
      if (!data || data.kind !== 'event') return;
      const ev = data.event; lastSeen = Date.now(); displayId = ev.displayId || displayId;
      if (ev.type === 'hello') send();
      if (ev.type === 'bye') lastSeen = 0;
      if (!['hello', 'ping', 'bye'].includes(ev.type)) evSubs.forEach((f) => f(ev));
      subs.forEach((f) => f(hub.status()));
    };
    const hub = {
      registerId, module, last: null,
      setOrder(o) {
        const had = order && order.lines && order.lines.length;
        order = o;
        phoneMasked = o && o.customerPhone ? maskPhone(o.customerPhone) : '';
        /* a new order ends the thank-you screen at once (A10) */
        if (done && o && o.lines && o.lines.length && !had) { done = null; clearTimeout(doneTimer); }
        send();
      },
      setPay(p) { pay = p; if (p) { done = null; clearTimeout(doneTimer); } send(); },
      done(d) {
        pay = null; done = { change: d.change || 0, points: d.points != null ? d.points : (order && order.pointsEarned) || 0, total: d.total || (order && order.total) || 0 };
        clearTimeout(doneTimer); doneTimer = setTimeout(() => { done = null; send(); }, (st().doneSec || 8) * 1000);
        send();
      },
      test() {
        const s = st();
        test = { phase: 'order', pay: null, done: null, order: { no: 'TEST', context: s.lang === 'en' ? 'Test screen' : 'Écran de test', customer: null,
          lines: [{ id: 't1', name: s.lang === 'en' ? 'Sample item' : 'Article exemple', qty: 2, unit: 1500, amount: 3000, icon: 'restaurant-outline', tint: { bg: '#eeecf8', fg: '#6a61bf' } },
            { id: 't2', name: s.lang === 'en' ? 'Second item' : 'Deuxième article', detail: '−10 %', qty: 1, unit: 2500, amount: 2250, disc: '−10 %', icon: 'cafe-outline', tint: { bg: '#e4f4ea', fg: '#2e9e5b' } }],
          subtotal: 5250, discount: 250, tax: 1011, taxLabel: 'TVA 19,25 %', total: 6261, items: 3, lastId: 't2' } };
        send(); clearTimeout(hub._tt); hub._tt = setTimeout(() => { test = null; send(); }, 8000);
      },
      refresh() { send(); },
      status() { const s = st(); return { connected: Date.now() - lastSeen < 5000, lastSeen, displayId, code: code(registerId), settings: s }; },
      subscribe(f) { subs.add(f); f(hub.status()); return () => subs.delete(f); },
      onEvent(f) { evSubs.add(f); return () => evSubs.delete(f); },
      close() { clearInterval(beat); ch.close(); },
    };
    window.KZ_CFD.hub = hub;
    send();
    return hub;
  }

  /* ---- display side ---- */
  function connect(registerId, onSnap, onCtl) {
    const ch = chan(registerId);
    const displayId = get('displayId', null) || ('D' + Math.random().toString(36).slice(2, 7).toUpperCase());
    put('displayId', displayId);
    const emit = (type, value) => { try { ch.postMessage({ kind: 'event', event: { type, value, displayId, at: Date.now() } }); } catch (e) {} };
    let lastSeq = -1;
    ch.onmessage = ({ data }) => {
      if (!data) return;
      if (data.kind === 'snap') { if (data.snap.seq < lastSeq) return; lastSeq = data.snap.seq; onSnap(data.snap); }
      if (data.kind === 'unpair' || data.kind === 'settings') onCtl && onCtl(data.kind);
    };
    emit('hello');
    const ping = setInterval(() => emit('ping'), 2000);
    const bye = () => emit('bye');
    window.addEventListener('beforeunload', bye);
    return { emit, displayId, close() { bye(); clearInterval(ping); window.removeEventListener('beforeunload', bye); ch.close(); } };
  }

  window.KZ_CFD = { hub: null, attach, connect, settings, saveSettings, code, newCode, lookup, sanitize, maskPhone, DEFAULTS,
    pairing: () => get('pair', null), pair: (reg) => put('pair', { registerId: reg, at: Date.now() }), unpair: () => { try { localStorage.removeItem(PFX + 'pair'); } catch (e) {} } };
})();
