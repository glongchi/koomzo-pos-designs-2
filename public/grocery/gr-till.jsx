/* Koomzo Grocery — the till: weighing, PLU codes, age prompts, promotions, deposits. */
const { useState, useMemo, useEffect } = React;
const GR = window.GR;
/* one formatter, defined in kz/kz-locale.js — this module used to restate it */
const xaf = window.money;
const kg = (g) => (g / 1000).toFixed(3);
const gate = (k) => !window.KZ || window.KZ.on('grocery', k);
const itemOf = (id) => GR.items.find((i) => i.id === id);
const grUser = (id) => GR.staff.find((s) => s.id === id) || GR.staff[0];
const badgeN = (n) => (n > 99 ? '99+' : n);

/* a short-dated lot reduced to clear beats the shelf price */
function priceOf(it, dated) {
  if (it.sold === 'weight') return null;
  const md = gate('expiry') && dated.filter((l) => l.item === it.id && l.markdown).sort((a, b) => a.markdown - b.markdown)[0];
  return md ? md.markdown : it.price;
}

/* promotions are declared here and applied at tender — never priced by the client in the real thing */
function promoSavings(lines) {
  if (!gate('promos')) return { total: 0, notes: [] };
  const notes = [];
  const qtyOf = (id) => lines.filter((l) => l.ref === id && !l.dep).reduce((s, l) => s + l.qty, 0);
  const unit = (id) => { const l = lines.find((x) => x.ref === id); return l ? l.price : 0; };
  GR.promos.forEach((p) => {
    if (p.kind === 'multibuy') {
      const q = qtyOf(p.items[0]), sets = Math.floor(q / p.trigger);
      if (sets) notes.push({ label: p.label, amount: sets * (p.trigger - p.pay) * unit(p.items[0]) });
    }
    if (p.kind === 'mix') {
      const q = p.items.reduce((s, id) => s + qtyOf(id), 0), sets = Math.floor(q / p.trigger);
      if (sets) {
        const units = p.items.flatMap((id) => Array(qtyOf(id)).fill(unit(id))).sort((a, b) => a - b).slice(0, sets * p.trigger);
        notes.push({ label: p.label, amount: Math.round(units.reduce((s, v) => s + v, 0) * (p.off / 100)) });
      }
    }
    if (p.kind === 'timed' && new Date().getHours() >= p.from) {
      const q = qtyOf(p.items[0]);
      if (q) notes.push({ label: p.label, amount: q * Math.max(0, unit(p.items[0]) - p.price) });
    }
  });
  return { total: notes.reduce((s, n) => s + n.amount, 0), notes: notes.filter((n) => n.amount > 0) };
}

function TillView({ api }) {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const items = GR.items.filter((i) => (cat === 'all' || i.cat === cat) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  const promoIds = gate('promos') ? GR.promos.flatMap((p) => p.items) : [];
  return (
    <div className="grtill">
      <div className="grshelf">
        <div className="rowbar">
          <div className="field" style={{ flex: 1, minWidth: 180 }}><ion-icon name="search-outline"></ion-icon>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or scan a barcode" /></div>
          {gate('plu') && <button className="btn" onClick={api.openPlu}><ion-icon name="keypad-outline"></ion-icon>PLU</button>}
          {gate('deposits') && <button className="btn" onClick={api.openCrates}><ion-icon name="repeat-outline"></ion-icon>Crates back</button>}
        </div>
        <div className="grcats">
          {GR.cats.map((c) => (
            <button key={c.id} className={'grcat' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>
              <ion-icon name={c.icon}></ion-icon>{c.name}</button>
          ))}
        </div>
        <div className="grgrid">
          {items.map((it) => {
            const p = priceOf(it, api.dated);
            const cut = p != null && p < it.price;
            return (
              <button key={it.id} className="grtile" onClick={() => api.add(it)}>
                <div className="grtile__ic" style={{ background: it.tint + '1a', color: it.tint }}><ion-icon name={it.icon}></ion-icon></div>
                <div className="grtile__n">{it.name}</div>
                <div className="grtile__f">
                  {it.sold === 'weight' && gate('weigh') && <span className="grflag kg">KG</span>}
                  {it.age && gate('age') && <span className="grflag age">{it.age}+</span>}
                  {it.deposit && gate('deposits') && <span className="grflag dep">+{it.deposit}</span>}
                  {promoIds.indexOf(it.id) > -1 && <span className="grflag promo">OFFER</span>}
                </div>
                <div className="grtile__p">
                  {it.sold === 'weight' ? <>{xaf(it.perKg)}<small> / kg</small></>
                    : cut ? <>{xaf(p)} <small style={{ textDecoration:'line-through' }}>{xaf(it.price)}</small></> : xaf(p)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <Basket api={api} />
    </div>
  );
}

function Basket({ api }) {
  const T = api.totals;
  return (
    <aside className="grbasket">
      <div className="grbasket__hd">
        <div style={{ minWidth: 0 }}>
          <div className="t" title={api.ticketNo}>Basket {window.KZ_TICKET.short(api.ticketNo)}</div>
          <div className="s">{api.lines.filter((l) => !l.dep).length} lines{api.member ? ' · ' + api.member.name : ''}</div>
        </div>
        <div className="sp" style={{ flex: 1 }}></div>
        {api.lines.length > 0 && <button className="icbtn" onClick={api.clear} title="Clear"><ion-icon name="trash-outline"></ion-icon></button>}
      </div>
      <div className="grbasket__b">
        {api.lines.map((l) => (
          <div className={'grline' + (l.dep ? ' sub' : '')} key={l.uid}>
            <div className="grline__b">
              <div className="grline__n">{l.name}</div>
              <div className="grline__m">
                {l.weight ? <span>{kg(l.weight)} kg × {xaf(l.perKg)}/kg</span> : l.dep ? <span>deposit, refunded on return</span> : <span>{xaf(l.price)} each</span>}
                {l.markdown && <span className="tag">reduced</span>}
                {l.age && <span className="tag"><ion-icon name="checkmark-outline" style={{ fontSize: 11 }}></ion-icon>{l.age}+ checked</span>}
              </div>
              {!l.weight && !l.dep && <div className="grqty" style={{ marginTop: 7 }}>
                <button onClick={() => api.qty(l.uid, -1)}><ion-icon name="remove-outline"></ion-icon></button>
                <b>{l.qty}</b>
                <button onClick={() => api.qty(l.uid, 1)}><ion-icon name="add-outline"></ion-icon></button>
              </div>}
            </div>
            <div className="grline__v">{xaf(l.price * l.qty)}</div>
          </div>
        ))}
        {!api.lines.length && <div className="emptybox" style={{ padding: '34px 16px' }}>Nothing scanned yet.<br />Tap a product, or type a PLU for loose goods.</div>}
      </div>
      <div style={{ padding: '8px 0 0' }}>
        <div className="grtot"><span>Goods</span><div className="sp"></div><b>{xaf(T.goods)}</b></div>
        {gate('deposits') && T.deposits > 0 && <div className="grtot"><span>Deposits</span><div className="sp"></div><b>{xaf(T.deposits)}</b></div>}
        {T.promo > 0 && <div className="grtot save"><span>Offers</span><div className="sp"></div><b>−{xaf(T.promo)}</b></div>}
        {T.staff > 0 && <div className="grtot save"><span>Staff discount</span><div className="sp"></div><b>−{xaf(T.staff)}</b></div>}
        <div className="grtot"><span>{window.KZ_POLICY.taxLabelFor('grocery')} included</span><div className="sp"></div><b>{xaf(T.vat)}</b></div>
        <div className="grtot grand"><span>Total</span><div className="sp"></div><b>{xaf(T.total)}</b></div>
      </div>
      <div className="grbasket__ft">
        {gate('loyalty') && <div className="grrow2">
          <button className="grbtn gh" onClick={api.openMember}><ion-icon name="card-outline"></ion-icon>{api.member ? api.member.name.split(' ')[0] : 'Card'}</button>
          <button className="grbtn gh" onClick={api.hold}><ion-icon name="pause-outline"></ion-icon>Hold</button>
        </div>}
        <button className="grbtn" disabled={!api.lines.length} onClick={api.openTender}>
          <ion-icon name="cash-outline"></ion-icon>Charge {api.lines.length ? xaf(T.total) : ''}</button>
      </div>
    </aside>
  );
}

/* ---------------- scale ---------------- */
function ScaleSheet({ it, api, onClose }) {
  const [g, setG] = useState(0);
  const [stable, setStable] = useState(false);
  useEffect(() => {
    /* a real scale streams grams; this settles the way one does */
    const target = 300 + Math.floor(Math.random() * 22) * 100;
    let n = 0;
    const i = setInterval(() => {
      n += 1;
      setG(n < 7 ? Math.round(target * (0.4 + Math.random() * 0.8)) : target);
      if (n >= 7) { setStable(true); clearInterval(i); }
    }, 90);
    return () => clearInterval(i);
  }, []);
  const price = Math.round((g / 1000) * it.perKg);
  return (
    <HtLikeSheet title={it.name} sub={xaf(it.perKg) + ' per kilo · place it on the scale'} onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="a" className="btn primary" disabled={!stable} style={!stable ? { opacity: .45 } : null}
          onClick={() => { api.addWeighed(it, g); onClose(); }}>Add {xaf(price)}</button>,
      ]}>
      <div className="grscale">
        <div className="grscale__v">{kg(g)}<small> kg</small></div>
        <div className={'grscale__s' + (stable ? ' ok' : '')}><i></i>{stable ? 'Stable · reading accepted' : 'Settling…'}</div>
      </div>
      <div className="grtot grand" style={{ padding: '14px 0 0' }}><span>Line</span><div className="sp"></div><b>{xaf(price)}</b></div>
      <div className="note info" style={{ marginTop: 12 }}><ion-icon name="information-circle-outline"></ion-icon>
        The line carries the reading and the scale id. A typed weight is not accepted — trade measurement, not a preference.</div>
    </HtLikeSheet>
  );
}

/* ---------------- PLU keypad ---------------- */
function PluSheet({ api, onClose }) {
  const [code, setCode] = useState('');
  const match = GR.items.find((i) => i.plu === code);
  const keys = ['1','2','3','4','5','6','7','8','9','clr','0','ok'];
  return (
    <HtLikeSheet title="PLU code" sub="Loose produce, typed rather than scanned" onClose={onClose}
      foot={[<button key="c" className="btn" onClick={onClose}>Close</button>]}>
      <div className="grplu">{code || '––'}<small>{match ? match.name + ' · ' + xaf(match.perKg) + '/kg' : code ? 'No product with that code' : 'Two digits'}</small></div>
      <div className="grpad">
        {keys.map((k) => (
          <button key={k} className={k === 'clr' || k === 'ok' ? 'alt' : ''}
            onClick={() => {
              if (k === 'clr') return setCode('');
              if (k === 'ok') { if (match) { onClose(); api.add(match); } return; }
              setCode((c) => (c + k).slice(0, 3));
            }}>{k === 'clr' ? 'Clear' : k === 'ok' ? 'Enter' : k}</button>
        ))}
      </div>
      <div className="htchips" style={{ marginTop: 12 }}>
        {GR.items.filter((i) => i.plu).map((i) => <button key={i.id} className="htchip" onClick={() => setCode(i.plu)}><b>{i.plu}</b>{i.name}</button>)}
      </div>
    </HtLikeSheet>
  );
}

/* ---------------- age check ---------------- */
function AgeSheet({ it, api, onClose }) {
  return (
    <HtLikeSheet title={'Age check · ' + it.age + '+'} sub={it.name} onClose={onClose}
      foot={[
        <button key="r" className="btn danger" onClick={() => { api.ageResult(it, false); onClose(); }}>Refuse sale</button>,
        <button key="o" className="btn primary" onClick={() => { api.ageResult(it, true); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>Age confirmed</button>,
      ]}>
      <div className="note" style={{ marginBottom: 12 }}><ion-icon name="alert-circle-outline"></ion-icon>
        This line cannot be tendered without an answer. A refusal is recorded and kept, exactly like a pass.</div>
      <div className="htchips">
        <span className="htchip">Visual check</span>
        <span className="htchip">CNI shown</span>
        <span className="htchip">Passport shown</span>
      </div>
      <p className="kzp" style={{ marginTop: 12 }}>Recorded against {grUser(api.userId).name} and basket {window.KZ_TICKET.short(api.ticketNo)}.</p>
    </HtLikeSheet>
  );
}

/* ---------------- loyalty ---------------- */
function MemberSheet({ api, onClose }) {
  return (
    <HtLikeSheet title="Loyalty card" sub="Points accrue on goods, never on deposits" onClose={onClose}
      foot={[
        api.member ? <button key="d" className="btn" onClick={() => { api.setMember(null); onClose(); }}>Detach</button> : null,
        <button key="c" className="btn primary" onClick={onClose}>Done</button>,
      ].filter(Boolean)}>
      {GR.members.map((m) => (
        <button key={m.id} className={'stf' + (api.member && api.member.id === m.id ? ' on' : '')} style={{ width: '100%' }}
          onClick={() => { api.setMember(m); onClose(); }}>
          <div className="av t2">{m.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
          <div className="stf__b"><div className="stf__n">{m.name}</div><div className="stf__r">{m.phone}{m.staff ? ' · staff 10%' : ''}</div></div>
          <span className="stf__x">{m.pts} pts</span>
        </button>
      ))}
    </HtLikeSheet>
  );
}

/* ---------------- crates back ---------------- */
function CrateSheet({ api, onClose }) {
  const [n, setN] = useState(0);
  return (
    <HtLikeSheet title="Crates and bottles back" sub={GR.crates.out + ' out with customers · ' + xaf(GR.crates.value) + ' held'} onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="r" className="btn primary" disabled={!n} style={!n ? { opacity: .45 } : null}
          onClick={() => { api.refundDeposit(n); onClose(); }}>Refund {xaf(n * 200)}</button>,
      ]}>
      <div className="grqty" style={{ justifyContent: 'center', gap: 14 }}>
        <button style={{ width: 44, height: 44 }} onClick={() => setN((x) => Math.max(0, x - 1))}><ion-icon name="remove-outline"></ion-icon></button>
        <b style={{ font: '700 34px var(--kz-font-num)', minWidth: 60 }}>{n}</b>
        <button style={{ width: 44, height: 44 }} onClick={() => setN((x) => x + 1)}><ion-icon name="add-outline"></ion-icon></button>
      </div>
      <div className="note info" style={{ marginTop: 14 }}><ion-icon name="information-circle-outline"></ion-icon>
        A refund moves the deposit liability, never sales revenue. The till drawer and the crate float reconcile separately.</div>
    </HtLikeSheet>
  );
}

/* ---------------- tender ---------------- */
function GrTenderSheet({ api, onClose }) {
  const T = api.totals;
  /* the basket is not paid until the customer's wallet says so (spec §20) */
  const [done, setDone] = useState(null);
  const c = window.useSingleCharge(T.total, {
    onDone: (id) => {
      /* money in, stock out — one commit point, and the basket's lines become
         movements in the same ledger the Inventory module reads */
      const res = window.KZ_SALES.sellFrom('grocery', {
        ticketNo: api.ticketNo, locId: 'dt', actor: { kind: 'register', label: 'Caisse 1' },
        customer: 'Walk-in', lines: lines.map((l) => ({ id: l.id, qty: l.qty })),
      });
      setDone({ no: api.ticketNo, total: T.total, tender: id, promo: T.promo + T.staff,
        warn: window.KZ_SALES.negativeCopy(res.negatives) });
    },
  });
  const tender = c.tender, setTender = c.setTender;
  if (done) return (
    <HtLikeSheet title="Paid" sub={'Basket ' + window.KZ_TICKET.short(done.no)} onClose={onClose}
      foot={[<button key="n" className="btn primary" onClick={() => { api.finish(); onClose(); }}>New basket</button>]}>
      <div className="done" style={{ padding: '10px 0 6px' }}>
        <div className="done__ic"><ion-icon name="checkmark-outline"></ion-icon></div>
        <h4>{xaf(done.total)}</h4>
        <p>{window.KZ_TENDER.paidLine(done.tender, {})}{done.promo ? ' · ' + xaf(done.promo) + ' saved' : ''}</p>
        {done.warn && <p style={{ color: 'var(--kz-discount)' }}>{done.warn}</p>}
      </div>
    </HtLikeSheet>
  );
  return (
    <HtLikeSheet title="Take payment" sub={xaf(T.total) + ' · basket ' + window.KZ_TICKET.short(api.ticketNo)} onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={c.busy ? c.cancel : onClose}>{c.busy ? 'Cancel request' : 'Back'}</button>,
        <button key="t" className="btn primary" disabled={c.busy} style={{ background:'var(--kz-success)', borderColor:'var(--kz-success)', opacity: c.busy ? .45 : 1 }}
          onClick={c.request}>
          <ion-icon name="checkmark-outline"></ion-icon>{c.cta()}</button>,
      ]}>
      <PushPending c={c} amount={T.total} />
      <div className="htchips" style={c.busy ? { display: 'none' } : null}>
        {GR.tenders.map((t) => <button key={t.id} className={'htchip' + (tender === t.id ? ' on' : '')} onClick={() => setTender(t.id)}>
          <ion-icon name={t.icon}></ion-icon>{t.name}</button>)}
      </div>
      <div style={{ marginTop: 14 }}>
        <div className="grtot"><span>Goods</span><div className="sp"></div><b>{xaf(T.goods)}</b></div>
        {T.deposits > 0 && <div className="grtot"><span>Deposits</span><div className="sp"></div><b>{xaf(T.deposits)}</b></div>}
        {T.promo > 0 && <div className="grtot save"><span>Offers</span><div className="sp"></div><b>−{xaf(T.promo)}</b></div>}
        {T.staff > 0 && <div className="grtot save"><span>Staff discount</span><div className="sp"></div><b>−{xaf(T.staff)}</b></div>}
        <div className="grtot grand"><span>Total</span><div className="sp"></div><b>{xaf(T.total)}</b></div>
      </div>
      {window.KZ_TENDER.hint(tender) && <div className="note info" style={{ marginTop: 12 }}>
        <ion-icon name={window.KZ_TENDER.hintIcon(tender)}></ion-icon>{window.KZ_TENDER.hint(tender)}</div>}
    </HtLikeSheet>
  );
}

/* a local copy of the sheet shell so Grocery does not depend on the Hotel module */
function HtLikeSheet({ title, sub, wide, onClose, children, foot }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet' + (wide ? ' wide' : '')} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>{title}</h3><p>{sub}</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">{children}</div>
        {foot && <div className="sheet__foot">{foot}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { GR, xaf, kg, gate, itemOf, grUser, badgeN, priceOf, promoSavings,
  TillView, Basket, ScaleSheet, PluSheet, AgeSheet, MemberSheet, CrateSheet, GrTenderSheet, HtLikeSheet });
