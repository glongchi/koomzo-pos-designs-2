/* Koomzo Link — device: work views (mock module services). */
const { useState, useEffect } = React;
const KZ = window.KzLink;

function useSig(sig) {
  const [v, setV] = useState(sig.get());
  useEffect(() => sig.subscribe(setV), [sig]);
  return v;
}
function useQuery(store, c, where) {
  const [v, setV] = useState([]);
  const key = JSON.stringify(where || {});
  useEffect(() => store.observe(c, where).subscribe(setV), [store, c, key]);
  return v;
}
function useAction() {
  const [err, setErr] = useState(null);
  const run = (fn) => async (...a) => { setErr(null); try { await fn(...a); } catch (e) { setErr(e.message); } };
  return [err, run, setErr];
}
const Err = ({ msg }) => (msg ? <div className="note warn"><ion-icon name="warning-outline"></ion-icon><span>{msg}</span></div> : null);

function RestaurantWork({ store, svc, kiosk }) {
  const orders = useQuery(store, 'rk_order');
  const status = useSig(store.status);
  const [table, setTable] = useState(kiosk ? 'Kiosk' : 'T1');
  const [err, run] = useAction();
  const R = KZ.RestaurantMockService;
  const open = orders.find((o) => o.doc.table === table && o.doc.status !== 'paid');
  const online = store.internetReachable();
  const stateOf = (t) => { const o = orders.find((x) => x.doc.table === t && x.doc.status !== 'paid'); return o ? o.doc.status : ''; };
  return (
    <>
      {!kiosk && (
        <div className="card">
          <p className="eb">Tables</p>
          <div className="tables">
            {R.TABLES.map((t) => (
              <button key={t} className={[stateOf(t), table === t ? 'sel' : ''].join(' ')} onClick={() => setTable(t)}>
                {t}<small>{stateOf(t) === 'sent' ? 'Sent' : stateOf(t) === 'open' ? 'Open' : 'Free'}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <p className="eb">{kiosk ? 'Order here' : 'Menu · ' + table}</p>
        <div className="menu">
          {R.MENU.map((m) => (
            <button key={m.id} onClick={run(() => svc.add(table, m.id))}><b>{m.name}</b><span>{KZ.formatF(m.price)}</span></button>
          ))}
        </div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <p className="eb" style={{ margin: 0, flex: 1 }}>{open ? 'Order ' + R.orderNo(open.doc) : 'No open order'}</p>
          {open && open.dirty ? <span className="pill warn"><i></i>Waiting to send</span> : open ? <span className="pill ok"><i></i>Saved</span> : null}
        </div>
        {open && open.doc.lines.map((l) => <div className="line" key={l.id}><span>{l.qty} × {l.name}</span><span>{KZ.formatF(l.qty * l.price)}</span></div>)}
        {open && <div className="tot"><span>Total</span><span>{KZ.formatF(open.doc.total)}</span></div>}
      </div>
      <Err msg={err} />
      {kiosk ? (
        <div className="btns">
          <button className="btn ok" disabled={!open || !online} onClick={run(() => svc.pay(table, 'momo'))}><ion-icon name="phone-portrait-outline"></ion-icon>Pay with MoMo</button>
          {!online && <button className="btn gh" disabled={!open} onClick={run(() => svc.send(table))}>Pay at counter</button>}
        </div>
      ) : (
        <div className="btns">
          <button className="btn gh" disabled={!open || open.doc.status === 'sent'} onClick={run(() => svc.send(table))}><ion-icon name="restaurant-outline"></ion-icon>Send</button>
          <button className="btn ok" disabled={!open} onClick={run(() => svc.pay(table, 'cash'))}><ion-icon name="cash-outline"></ion-icon>Cash</button>
          <button className="btn pri" disabled={!open || !online} title={online ? '' : 'Needs the internet'} onClick={run(() => svc.pay(table, 'momo'))}><ion-icon name="phone-portrait-outline"></ion-icon>MoMo</button>
        </div>
      )}
      {!online && status.state !== 'setup' && <div className="note warn"><ion-icon name="cloud-offline-outline"></ion-icon><span>No internet right now. Cash and orders keep working; MoMo waits.</span></div>}
    </>
  );
}

function KitchenWork({ store, svc }) {
  const tickets = useQuery(store, 'rk_ticket', { status: 'new' });
  const orders = useQuery(store, 'rk_order');
  const [err, run] = useAction();
  const num = (t) => { const o = orders.find((x) => x.id === t.doc.orderId) || store.get('rk_order', t.doc.orderId); return o ? KZ.RestaurantMockService.orderNo(o.doc) : ''; };
  return (
    <>
      <Err msg={err} />
      {!tickets.length && <div className="card center"><ion-icon name="restaurant-outline" style={{ fontSize: 28, color: 'var(--kz-muted-3)' }}></ion-icon><p className="p">No tickets waiting.</p></div>}
      {tickets.sort((a, b) => a.doc.at - b.doc.at).map((t) => (
        <div className="card" key={t.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <b style={{ font: '700 15px var(--kz-font-sans)', flex: 1 }}>{t.doc.table} · {num(t)}</b>
            {t.dirty ? <span className="pill warn"><i></i>Waiting</span> : null}
          </div>
          {t.doc.lines.map((l) => <div className="line" key={l.id}><span>{l.qty} × {l.name}</span></div>)}
          <button className="btn ok sm" style={{ marginTop: 8 }} onClick={run(() => svc.bump(t.id))}><ion-icon name="checkmark-outline"></ion-icon>Done</button>
        </div>
      ))}
    </>
  );
}

function QueueWork({ store, svc }) {
  const waiting = useQuery(store, 'q_ticket', { status: 'waiting' });
  const state = useQuery(store, 'q_state');
  const [counter, setCounter] = useState(1);
  const [err, run] = useAction();
  const L = KZ.QueueMockService.label;
  const st = state[0];
  return (
    <>
      <div className="card center">
        <p className="eb" style={{ margin: 0 }}>Now serving</p>
        <b style={{ font: '700 36px var(--kz-font-num)', letterSpacing: '-.02em' }}>{st ? st.doc.nowServing : '—'}</b>
        <span className="p">{st ? 'Counter ' + st.doc.counter : 'Nobody called yet'}</span>
      </div>
      <div className="card">
        <p className="eb">Issue a ticket</p>
        <div className="btns"><button className="btn gh" onClick={run(() => svc.issue('A'))}>Series A</button><button className="btn gh" onClick={run(() => svc.issue('B'))}>Series B</button></div>
      </div>
      <div className="card">
        <p className="eb">Call next</p>
        <div className="seg" style={{ marginBottom: 10 }}>{[1, 2, 3].map((c) => <button key={c} className={counter === c ? 'on' : ''} onClick={() => setCounter(c)}>Counter {c}</button>)}</div>
        <button className="btn pri" disabled={!waiting.length} onClick={run(() => svc.callNext(counter))}><ion-icon name="megaphone-outline"></ion-icon>Call next</button>
      </div>
      <Err msg={err} />
      <div className="card">
        <p className="eb">Waiting · {waiting.length}</p>
        {waiting.sort((a, b) => a.doc.at - b.doc.at).map((t) => <div className="row" key={t.id}><div className="t"><b>{L(t.doc)}</b></div>{t.dirty ? <span className="pill warn">Waiting to send</span> : null}</div>)}
      </div>
    </>
  );
}

function SignageWork({ store, svc }) {
  const cur = useQuery(store, 'sg_content')[0];
  const [msg, setMsg] = useState('');
  const [err, run] = useAction();
  return (
    <>
      <div className="card"><p className="eb">On screen now</p><p className="p" style={{ color: 'var(--kz-ink)' }}>{cur ? cur.doc.message : 'Nothing published yet.'}</p></div>
      <div className="card">
        <p className="eb">New message</p>
        <input className="in" value={msg} placeholder="Happy hour 18:00–20:00" onChange={(e) => setMsg(e.target.value)} />
        <button className="btn pri" style={{ marginTop: 10 }} disabled={!msg.trim()} onClick={run(async () => { await svc.publish(msg.trim()); setMsg(''); })}>Publish to screens</button>
      </div>
      <Err msg={err} />
    </>
  );
}

function WorkView({ store, svc, cfg }) {
  if (cfg.kind === 'kitchen') return <KitchenWork store={store} svc={svc.restaurant} />;
  const switchable = cfg.kind === 'till' || cfg.kind === 'server';
  return (
    <>
      {switchable && (
        <div className="seg">
          {[['restaurant', 'restaurant-outline', 'Restaurant'], ['queue', 'people-outline', 'Queue'], ['signage', 'tv-outline', 'Screens']].map(([m, ic, l]) => (
            <button key={m} className={cfg.module === m ? 'on' : ''} onClick={() => store.setCfg({ module: m })}><ion-icon name={ic}></ion-icon>{l}</button>
          ))}
        </div>
      )}
      {cfg.module === 'queue' ? <QueueWork store={store} svc={svc.queue} /> : cfg.module === 'signage' ? <SignageWork store={store} svc={svc.signage} /> : <RestaurantWork store={store} svc={svc.restaurant} kiosk={cfg.kind === 'kiosk'} />}
    </>
  );
}

Object.assign(window, { useSig, useQuery, useAction, Err, WorkView });
