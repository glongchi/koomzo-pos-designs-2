/* Koomzo Customer Display — the screen that faces the customer.
   Pair → Idle → Order → Payment → Thank you; Reconnecting overlay. Three layouts (D9). */
const { useState: cdUseState, useEffect: cdUseEffect, useRef: cdUseRef } = React;

const CD_TXT = {
  fr: { welcome: 'Bienvenue', pairT: 'Associer cet écran', pairS: 'Saisissez le code affiché sur la caisse : Configuration → Écran client.', bad: 'Code inconnu. Vérifiez sur la caisse.',
    items: (n) => n + (n > 1 ? ' articles' : ' article'), subtotal: 'Sous-total', discount: 'Remise', total: 'Total', due: 'À payer', paid: 'Déjà payé', remaining: 'Reste à payer',
    tendered: 'Montant remis', change: 'Monnaie à rendre', approve: 'Validez sur votre téléphone', approveS: (m) => 'Une demande de paiement ' + m + ' a été envoyée', secs: 's restantes',
    declined: 'Paiement refusé', expired: 'Pas de réponse à temps', unknown: 'Vérification du paiement…', retry: 'Le caissier va relancer la demande.',
    payWith: 'Paiement', share: 'Votre part', thanks: 'Merci !', thanksS: 'À bientôt', yourChange: 'Votre monnaie', points: (n) => '+' + n + ' points fidélité',
    receipt: 'Votre reçu ?', whatsapp: 'WhatsApp', sms: 'SMS', print: 'Imprimé', none: 'Pas de reçu', sent: 'Transmis au caissier', earn: 'Gagnez des points',
    earnS: 'Entrez votre numéro', phone: 'Votre numéro de téléphone', send: 'Envoyer', cancel: 'Annuler', tipT: 'Ajouter un pourboire ?', noTip: 'Non merci',
    checkingId: 'Vérification de la pièce d’identité par le caissier', reconnect: 'Reconnexion…', reconnectS: 'Le total affiché n’est peut-être plus à jour.', hello: (n) => 'Bonjour ' + n, pointsHave: (n) => n + ' points', removed: 'Retiré',
    unpaired: 'Écran dissocié' },
  en: { welcome: 'Welcome', pairT: 'Pair this screen', pairS: 'Enter the code shown on the register: Setup → Customer display.', bad: 'Unknown code. Check the register.',
    items: (n) => n + (n > 1 ? ' items' : ' item'), subtotal: 'Subtotal', discount: 'Discount', total: 'Total', due: 'To pay', paid: 'Already paid', remaining: 'Left to pay',
    tendered: 'Cash given', change: 'Change due', approve: 'Approve on your phone', approveS: (m) => 'A ' + m + ' payment request has been sent', secs: 's left',
    declined: 'Payment declined', expired: 'No answer in time', unknown: 'Checking the payment…', retry: 'The cashier will send the request again.',
    payWith: 'Payment', share: 'Your share', thanks: 'Thank you!', thanksS: 'See you soon', yourChange: 'Your change', points: (n) => '+' + n + ' loyalty points',
    receipt: 'Your receipt?', whatsapp: 'WhatsApp', sms: 'SMS', print: 'Printed', none: 'No receipt', sent: 'Sent to the cashier', earn: 'Earn points',
    earnS: 'Enter your number', phone: 'Your phone number', send: 'Send', cancel: 'Cancel', tipT: 'Add a tip?', noTip: 'No thanks',
    checkingId: 'The cashier is checking ID', reconnect: 'Reconnecting…', reconnectS: 'The total shown may be out of date.', hello: (n) => 'Hello ' + n, pointsHave: (n) => n + ' points', removed: 'Removed',
    unpaired: 'Screen unpaired' },
};
const cdMoney = (n) => window.KZ_LOCALE.money(n);

function cdLayout(force) {
  if (force && force !== 'auto') return force;
  const w = window.innerWidth, h = window.innerHeight;
  if (w < 600 || h < 420) return 'small';
  return h > w ? 'portrait' : 'landscape';
}

function CdPair({ onPaired }) {
  const [v, setV] = cdUseState(''), [err, setErr] = cdUseState(false);
  const t = CD_TXT.fr, te = CD_TXT.en;
  const vr = cdUseRef('');
  const press = (k) => {
    setErr(false);
    const cur = vr.current;
    const n = k === 'del' ? cur.slice(0, -1) : cur.length >= 4 ? cur : cur + k;
    vr.current = n; setV(n);
    if (n.length === 4 && k !== 'del') {
      const reg = window.KZ_CFD.lookup(n);
      if (reg) { window.KZ_CFD.pair(reg); onPaired(reg); }
      else { setErr(true); setTimeout(() => { vr.current = ''; setV(''); }, 700); }
    }
  };
  return (
    <div className="cd-pair">
      <div className="cd-brand"><span><ion-icon name="storefront"></ion-icon></span>koomzo</div>
      <h1>{t.pairT}</h1><p>{t.pairS}<br /><i>{te.pairS}</i></p>
      <div className={'cd-pin' + (err ? ' bad' : '')}>{[0, 1, 2, 3].map((i) => <span key={i}>{v[i] || ''}</span>)}</div>
      {err && <div className="cd-err">{t.bad} · {te.bad}</div>}
      <div className="cd-keys">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => k === '' ? <span key={i}></span> :
        <button key={i} onClick={() => press(k)}>{k === 'del' ? <ion-icon name="backspace-outline"></ion-icon> : k}</button>)}</div>
    </div>
  );
}

function CdIdle({ s, t }) {
  const slides = (s.cfg.slides || []);
  const [i, setI] = cdUseState(0);
  cdUseEffect(() => { if (slides.length < 2) return; const id = setInterval(() => setI((x) => (x + 1) % slides.length), 8000); return () => clearInterval(id); }, [slides.length]);
  const sl = slides[i % Math.max(1, slides.length)];
  return (
    <div className="cd-idle">
      <div className="cd-idle__w"><div className="cd-brand lg"><span><ion-icon name="storefront"></ion-icon></span>{s.venue}</div>
        <h1>{s.cfg.welcome || t.welcome}</h1></div>
      {sl && <div className={'cd-slide' + (sl.img ? ' img' : '')} key={i} style={sl.img ? { backgroundImage: 'url(' + sl.img + ')' } : null}>
        <div><b>{sl.title}</b>{sl.sub && <span>{sl.sub}</span>}</div></div>}
      {slides.length > 1 && <div className="cd-dots">{slides.map((_, j) => <i key={j} className={j === i ? 'on' : ''}></i>)}</div>}
    </div>
  );
}

function CdLines({ o, ghosts, t, compact }) {
  const ref = cdUseRef(null);
  cdUseEffect(() => { const el = ref.current && ref.current.querySelector('.cd-l.new'); if (el && ref.current) { const r = el.offsetTop - ref.current.clientHeight / 2; ref.current.scrollTo({ top: r, behavior: 'smooth' }); } }, [o.lastId, o.lines.length]);
  const rows = [...o.lines, ...ghosts];
  return (
    <div className="cd-lines" ref={ref}>
      {rows.map((l) => (
        <div key={l.id + (l.ghost ? 'g' : '')} className={'cd-l' + (l.id === o.lastId && !l.ghost ? ' new' : '') + (l.ghost ? ' gone' : '')}>
          {!compact && <span className={'cd-l__art' + (l.img ? ' has-img' : '')} style={l.tint ? { background: l.tint.bg, color: l.tint.fg } : null}>
            {l.img ? <img src={l.img} alt="" /> : <ion-icon name={l.icon || 'pricetag-outline'}></ion-icon>}</span>}
          <span className="cd-l__q">{l.unitLabel ? l.qty + ' ' + l.unitLabel : l.qty + ' ×'}</span>
          <span className="cd-l__n"><b>{l.name}</b>{(l.detail || l.ghost) && <small>{l.ghost ? t.removed : l.detail}</small>}</span>
          <span className="cd-l__a">{l.disc && !l.ghost && <em>{l.disc}</em>}{cdMoney(l.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function CdTotals({ o, t, big }) {
  return (
    <div className="cd-tot">
      {(o.discount > 0 || o.svc > 0 || o.tax > 0) && <div className="cd-tot__r"><span>{t.subtotal}</span><span>{cdMoney(o.subtotal)}</span></div>}
      {o.discount > 0 && <div className="cd-tot__r disc"><span>{t.discount}</span><span>−{cdMoney(o.discount)}</span></div>}
      {o.svc > 0 && <div className="cd-tot__r"><span>{o.svcLabel}</span><span>{cdMoney(o.svc)}</span></div>}
      {o.tax > 0 && <div className="cd-tot__r"><span>{o.taxLabel}</span><span>{cdMoney(o.tax)}</span></div>}
      <div className={'cd-total' + (big ? ' big' : '')}><span>{t.total}<small>{t.items(o.items)}</small></span><b>{cdMoney(o.total)}</b></div>
    </div>
  );
}

function CdPhoneEntry({ t, onSend, onClose }) {
  const [v, setV] = cdUseState('');
  const fmt = v.replace(/(\d{1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})/, (m, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join(' '));
  return (
    <div className="cd-modal"><div className="cd-modal__b">
      <h3>{t.phone}</h3><div className="cd-phone">{fmt || '6__ __ __ __'}</div>
      <div className="cd-keys sm">{['1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', '0', 'del'].map((k) => k === 'x' ? <button key={k} className="txt" onClick={onClose}>{t.cancel}</button> :
        <button key={k} onClick={() => setV((x) => k === 'del' ? x.slice(0, -1) : x.length < 9 ? x + k : x)}>{k === 'del' ? <ion-icon name="backspace-outline"></ion-icon> : k}</button>)}</div>
      <button className="cd-go" disabled={v.length < 9} onClick={() => onSend(v)}>{t.send}</button>
    </div></div>
  );
}

function CdPay({ s, t, emit, sent, setSent }) {
  const p = s.pay, o = s.order;
  const wallet = p.method === 'momo' || p.method === 'om';
  const ring = Math.max(0, Math.min(1, p.left / 60));
  const tipOk = s.cfg.actions.tip && p.paid === 0 && p.state === 'idle' && !sent.tip;
  return (
    <div className="cd-pay">
      <div className="cd-pay__k">{p.share ? t.share : t.due}</div>
      <div className="cd-pay__due">{cdMoney(p.share || p.remaining)}</div>
      {p.paid > 0 && <div className="cd-pay__split"><span>{t.paid} <b>{cdMoney(p.paid)}</b></span><span>{t.remaining} <b>{cdMoney(p.remaining)}</b></span></div>}
      {wallet && p.state === 'pending' && (
        <div className="cd-wallet">
          <div className="cd-ring" style={{ '--p': ring }}><span>{Math.max(0, p.left)}<small>{t.secs}</small></span></div>
          <div><b>{t.approve}</b><span>{t.approveS(p.methodLabel)}{p.phoneMasked ? ' · ' + p.phoneMasked : ''}</span></div>
        </div>
      )}
      {['declined', 'expired', 'unknown'].includes(p.state) && <div className="cd-wallet bad"><ion-icon name={p.state === 'unknown' ? 'sync-outline' : 'close-circle-outline'}></ion-icon><div><b>{t[p.state]}</b><span>{p.state === 'unknown' ? '' : t.retry}</span></div></div>}
      {p.method === 'cash' && p.tendered > 0 && (
        <div className="cd-cash"><div><span>{t.tendered}</span><b>{cdMoney(p.tendered)}</b></div><div className="chg"><span>{t.change}</span><b>{cdMoney(p.change)}</b></div></div>
      )}
      {!wallet && p.method !== 'cash' && p.state === 'idle' && <div className="cd-pay__m"><ion-icon name="card-outline"></ion-icon>{t.payWith} · {p.methodLabel}</div>}
      {wallet && p.state === 'idle' && <div className="cd-pay__m"><ion-icon name="phone-portrait-outline"></ion-icon>{t.payWith} · {p.methodLabel}</div>}
      {tipOk && (
        <div className="cd-tip"><b>{t.tipT}</b><div>
          {s.cfg.tipPresets.map((pc) => { const amt = Math.round((o ? o.total : p.due) * pc / 100 / 50) * 50; return <button key={pc} onClick={() => { emit('tip', amt); setSent((x) => ({ ...x, tip: true })); }}><span>{pc + '\u00a0%'}</span><small>{cdMoney(amt)}</small></button>; })}
          <button className="txt" onClick={() => setSent((x) => ({ ...x, tip: true }))}>{t.noTip}</button></div></div>
      )}
    </div>
  );
}

function CdDone({ s, t, emit, sent, setSent }) {
  const d = s.done;
  return (
    <div className="cd-done">
      <div className="cd-done__ic"><ion-icon name="checkmark"></ion-icon></div>
      <h1>{t.thanks}</h1>
      {d.change > 0 ? <div className="cd-done__chg"><span>{t.yourChange}</span><b>{cdMoney(d.change)}</b></div> : <p>{t.thanksS}</p>}
      {d.points > 0 && <div className="cd-done__pts"><ion-icon name="star"></ion-icon>{t.points(d.points)}</div>}
      {s.cfg.actions.receipt && (sent.receipt ? <div className="cd-sent"><ion-icon name="checkmark-circle-outline"></ion-icon>{t.sent}</div> : (
        <div className="cd-rcpt"><b>{t.receipt}</b><div>{['whatsapp', 'sms', 'print', 'none'].map((k) => <button key={k} onClick={() => { emit('receipt', k); setSent((x) => ({ ...x, receipt: true })); }}>
          <ion-icon name={{ whatsapp: 'logo-whatsapp', sms: 'chatbubble-outline', print: 'print-outline', none: 'close-outline' }[k]}></ion-icon>{t[k]}</button>)}</div></div>))}
    </div>
  );
}

function CustomerDisplay() {
  const q = new URLSearchParams(location.search);
  const builtin = q.get('builtin') === '1' && q.get('reg');
  const [reg, setReg] = cdUseState(() => builtin ? q.get('reg') : (window.KZ_CFD.pairing() || {}).registerId || null);
  const [s, setS] = cdUseState(null);
  const [lastAt, setLastAt] = cdUseState(0);
  const [now, setNow] = cdUseState(Date.now());
  const [layout, setLayout] = cdUseState(() => cdLayout(q.get('layout')));
  const [ghosts, setGhosts] = cdUseState([]);
  const [phoneOpen, setPhoneOpen] = cdUseState(false);
  const [sent, setSent] = cdUseState({});
  const conn = cdUseRef(null), prev = cdUseRef(null);
  cdUseEffect(() => { const f = () => setLayout(cdLayout(q.get('layout'))); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  cdUseEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  cdUseEffect(() => {
    if (!reg) return;
    conn.current = window.KZ_CFD.connect(reg, (snap) => {
      const p = prev.current;
      /* a removed line stays briefly struck through, then goes (D4) */
      if (p && p.order && snap.order && snap.phase === 'order') {
        const gone = p.order.lines.filter((l) => !snap.order.lines.some((x) => x.id === l.id)).map((l) => ({ ...l, ghost: true, at: Date.now() }));
        if (gone.length) setGhosts((g) => [...g, ...gone]);
      }
      if (!p || p.order?.no !== snap.order?.no || (p.phase !== snap.phase && (snap.phase === 'idle' || snap.phase === 'pay'))) { setGhosts([]); }
      if (!p || (p.order?.no !== snap.order?.no) || (snap.phase === 'idle')) { setSent({}); setPhoneOpen(false); }
      prev.current = snap; setS(snap); setLastAt(Date.now());
    }, (kind) => { if (kind === 'unpair' && !builtin) { window.KZ_CFD.unpair(); setReg(null); setS(null); } });
    return () => conn.current && conn.current.close();
  }, [reg]);
  cdUseEffect(() => { if (!ghosts.length) return; const id = setTimeout(() => setGhosts((g) => g.filter((x) => Date.now() - x.at < 1500)), 1600); return () => clearTimeout(id); }, [ghosts]);

  if (!reg) return <CdPair onPaired={setReg} />;
  const stale = !s || now - lastAt > 5000;
  if (!s) return <div className="cd-wait"><div className="cd-brand"><span><ion-icon name="storefront"></ion-icon></span>koomzo</div><p>{CD_TXT.fr.reconnect} · {CD_TXT.en.reconnect}</p></div>;
  const t = CD_TXT[s.lang] || CD_TXT.fr;
  const emit = (type, value) => conn.current && conn.current.emit(type, value);
  const o = s.order;
  const showLoyalty = s.cfg.actions.loyalty && o && !o.customer && s.phase === 'order' && !sent.loyalty;

  let body;
  if (s.phase === 'idle' || (!o && s.phase !== 'done')) body = <CdIdle s={s} t={t} />;
  else if (s.phase === 'done') body = <CdDone s={s} t={t} emit={emit} sent={sent} setSent={setSent} />;
  else if (layout === 'small') body = (
    <div className="cd-small">
      <div className="cd-small__ctx">{o.context}</div>
      {s.phase === 'pay' ? <CdPay s={s} t={t} emit={emit} sent={sent} setSent={setSent} /> : <>
        <div className="cd-small__tot"><span>{t.total}</span><b>{cdMoney(o.total)}</b><small>{t.items(o.items)}</small></div>
        {o.lines.length > 0 && (() => { const l = o.lines.find((x) => x.id === o.lastId) || o.lines[o.lines.length - 1]; return (
          <div className="cd-small__last"><span>{l.unitLabel ? l.qty + ' ' + l.unitLabel : l.qty + ' ×'}</span><b>{l.name}</b><em>{cdMoney(l.amount)}</em></div>); })()}
        {o.notice === 'id' && <div className="cd-notice"><ion-icon name="id-card-outline"></ion-icon>{t.checkingId}</div>}
      </>}
    </div>
  );
  else body = (
    <div className={'cd-bill ' + layout}>
      <div className="cd-bill__l">
        <div className="cd-ctx"><span>{o.context}</span>{o.customer && <span className="cd-cust"><ion-icon name="star"></ion-icon>{t.hello(o.customer.first)} · {t.pointsHave(o.customer.points)}</span>}</div>
        <CdLines o={o} ghosts={ghosts} t={t} compact={false} />
        {o.notice === 'id' && <div className="cd-notice"><ion-icon name="id-card-outline"></ion-icon>{t.checkingId}</div>}
      </div>
      <div className="cd-bill__r">
        {s.phase === 'pay' ? <CdPay s={s} t={t} emit={emit} sent={sent} setSent={setSent} /> : <>
          <CdTotals o={o} t={t} big />
          {showLoyalty && <button className="cd-loy" onClick={() => setPhoneOpen(true)}><ion-icon name="star-outline"></ion-icon><span><b>{t.earn}</b><small>{t.earnS}</small></span></button>}
          {sent.loyalty && !o.customer && <div className="cd-sent"><ion-icon name="checkmark-circle-outline"></ion-icon>{t.sent}</div>}
        </>}
      </div>
    </div>
  );

  return (
    <div className={'cd cd--' + layout + (stale ? ' stale' : '')}>
      {body}
      <div className="cd-foot"><span className="cd-foot__b"><ion-icon name="storefront"></ion-icon>koomzo</span><span>{s.venue}</span></div>
      {stale && <div className="cd-stale"><ion-icon name="sync-outline"></ion-icon><div><b>{t.reconnect}</b><span>{t.reconnectS}</span></div></div>}
      {phoneOpen && <CdPhoneEntry t={t} onClose={() => setPhoneOpen(false)} onSend={(v) => { emit('loyaltyPhone', v); setPhoneOpen(false); setSent((x) => ({ ...x, loyalty: true })); }} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CustomerDisplay />);
