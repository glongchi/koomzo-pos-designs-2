/* Koomzo Gym — BAR & WALLET. The juice bar, the pro shop, and the prepaid wallet
   the club runs on. Nobody carries cash on the workout floor: a member scans and
   the sale settles against a balance the tablet already knows. */

function MoneyView({ api }) {
  const st = api.st;
  const [mid, setMid] = useState('');
  const [lines, setLines] = useState([]);
  const [cat, setCat] = useState('bar');
  const m = mid ? memberOf(mid) : null;

  const add = (it) => setLines((c) => {
    const at = c.findIndex((l) => l.id === it.id);
    if (at > -1) return c.map((l, i) => i === at ? { ...l, qty: l.qty + 1 } : l);
    return [...c, { id: it.id, name: it.name, price: it.price, qty: 1 }];
  });
  const bump = (id, d) => setLines((c) => c.map((l) => l.id === id ? { ...l, qty: Math.max(0, l.qty + d) } : l).filter((l) => l.qty > 0));
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const items = GM.bar.filter((b) => b.cat === cat);

  const walletShort = m && total > m.wallet;
  const tender = !m ? null : (!walletShort && gate('wallet')) ? 'wallet' : gate('tab') ? 'tab' : 'cash';

  return (
    <div className="gmpos">
      <div style={{ display:'flex', flexDirection:'column', minWidth:0, minHeight:0 }}>
        <div className="cats" style={{ paddingBottom: 4 }}>
          <button className={'chip' + (cat === 'bar' ? ' on' : '')} onClick={() => setCat('bar')}><ion-icon name="cafe-outline"></ion-icon>Juice bar</button>
          <button className={'chip' + (cat === 'shop' ? ' on' : '')} onClick={() => setCat('shop')}><ion-icon name="bag-handle-outline"></ion-icon>Pro shop</button>
          <div className="sp" style={{ flex: 1 }}></div>
          {gate('wallet') && <button className="chip" onClick={() => api.openTopup(mid || '')}><ion-icon name="wallet-outline"></ion-icon>Top up a wallet</button>}
        </div>
        <div className="gmpos__grid">
          {items.map((it) => (
            <button className="gmitem" key={it.id} onClick={() => add(it)}>
              <b>{it.name}</b>
              <span>{xaf(it.price)}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="gmtab">
        <div className="gmtab__h">
          <ion-icon name="qr-code-outline" style={{ fontSize: 18, color:'var(--kz-primary)' }}></ion-icon>
          <b>{m ? m.name : 'Scan a member'}</b>
          {m && <button className="icbtn" style={{ width: 30, height: 30 }} onClick={() => setMid('')}><ion-icon name="close-outline" style={{ fontSize: 15 }}></ion-icon></button>}
        </div>
        {!m ? (
          <div style={{ padding: 12 }}>
            <select className="btn wide" style={{ marginBottom: 10 }} value={mid} onChange={(e) => setMid(e.target.value)}>
              <option value="">Choose a member…</option>
              {st.members.map((x) => <option key={x.id} value={x.id}>{x.name} · {planOf(x.plan).short}{x.in ? ' · inside' : ''}</option>)}
            </select>
            <div className="gmnote" style={{ margin: 0 }}>
              <ion-icon name="information-circle-outline"></ion-icon>
              A member scans their app QR or wristband here. Without one, sell for cash — the till still works.
            </div>
          </div>
        ) : (
          <div style={{ padding:'10px 14px 0' }}>
            <div className="gmsum" style={{ marginTop: 0 }}>
              {gate('wallet') && <div><span>Wallet</span><b style={{ color: walletShort ? 'var(--kz-discount)' : 'var(--kz-success)' }}>{xaf(m.wallet)}</b></div>}
              {gate('tab') && <div><span>Account tab</span><b>{m.tab ? xaf(m.tab) : '—'}</b></div>}
              <div><span>Plan</span><b>{planOf(m.plan).short}</b></div>
            </div>
          </div>
        )}
        <div className="gmtab__l">
          {lines.map((l) => (
            <div className="gmline" key={l.id}>
              <b>{l.name}</b>
              <button className="icbtn" style={{ width: 26, height: 26 }} onClick={() => bump(l.id, -1)}><ion-icon name="remove-outline" style={{ fontSize: 14 }}></ion-icon></button>
              <span className="gmnum">{l.qty}</span>
              <button className="icbtn" style={{ width: 26, height: 26 }} onClick={() => bump(l.id, 1)}><ion-icon name="add-outline" style={{ fontSize: 14 }}></ion-icon></button>
              <em>{xaf(l.price * l.qty)}</em>
            </div>
          ))}
          {!lines.length && <div style={{ padding:'16px 4px', font:'500 12.5px var(--kz-font-sans)', color:'var(--kz-muted-2)' }}>Tap an item to start.</div>}
        </div>
        <div className="gmtab__f">
          <div className="gmtot"><span>total</span>{xaf(total)}</div>
          {m && walletShort && gate('tab') && (
            <div style={{ font:'500 11.5px var(--kz-font-sans)', color:'#8a6414' }}>
              Wallet short by {xaf(total - m.wallet)} — this will go on the account tab.
            </div>
          )}
          <button className="gmpaybtn" disabled={!lines.length}
            onClick={() => { api.sell({ mid, lines, total, tender: tender || 'cash' }); setLines([]); }}>
            <ion-icon name={tender === 'wallet' ? 'wallet-outline' : tender === 'tab' ? 'reader-outline' : 'cash-outline'}></ion-icon>
            {!m ? 'Take cash ' + xaf(total) : tender === 'wallet' ? 'Pay from wallet' : tender === 'tab' ? 'Charge to account' : 'Take payment'}
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------- top up a wallet ---------- */
function TopupSheet({ mid, api, onClose }) {
  const st = api.st;
  const [who, setWho] = useState(mid || '');
  const [amt, setAmt] = useState(20000);
  const [tender, setTender] = useState('momo');
  const m = who ? memberOf(who) : null;
  return (
    <GmSheet title="Top up a wallet" sub="Money on the profile · spent at the bar, the spa or the shop" onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" disabled={!who} onClick={() => { api.topup(who, amt, tender); onClose(); }}>
          <ion-icon name="wallet-outline"></ion-icon>Add {xaf(amt)}</button></>}>
      <div className="gmfields">
        <div className="gmf"><label>Member</label>
          <select value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">Choose…</option>
            {st.members.map((x) => <option key={x.id} value={x.id}>{x.name} · wallet {xaf(x.wallet)}</option>)}
          </select>
        </div>
        <div className="gmf"><label>Amount</label>
          <select value={amt} onChange={(e) => setAmt(Number(e.target.value))}>
            {[5000, 10000, 20000, 50000, 100000].map((a) => <option key={a} value={a}>{xaf(a)}</option>)}
          </select>
        </div>
        <div className="gmf gmwide"><label>Paid by</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {GM.tenders.filter((x) => x.id !== 'wallet' && x.id !== 'tab').map((x) => (
              <button key={x.id} className={'chip' + (tender === x.id ? ' on' : '')} onClick={() => setTender(x.id)}>
                <ion-icon name={x.icon}></ion-icon>{x.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      {m && (
        <div className="gmsum">
          <div><span>Wallet now</span><b>{xaf(m.wallet)}</b></div>
          <div><span>After top-up</span><b style={{ color:'var(--kz-success)' }}>{xaf(m.wallet + amt)}</b></div>
          {!api.online && (tender === 'momo' || tender === 'om') && (
            <div><span>No network</span><b>Recorded now · the mobile-money confirmation is matched on sync</b></div>
          )}
        </div>
      )}
    </GmSheet>
  );
}

/* ---------- settle an account tab ---------- */
function SettleTabSheet({ mid, api, onClose }) {
  const m = memberOf(mid);
  const [tender, setTender] = useState('momo');
  return (
    <GmSheet title="Settle the account" sub={m.name + ' · ' + xaf(m.tab) + ' outstanding'} onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><div className="sp" style={{ flex: 1 }}></div>
        <button className="btn primary" onClick={() => { api.settleTab(mid, tender); onClose(); }}>
          <ion-icon name="checkmark-circle-outline"></ion-icon>Settle {xaf(m.tab)}</button></>}>
      <div className="gmnote"><ion-icon name="information-circle-outline"></ion-icon>
        A VIP tab is settled at the end of the cycle. Anything unsettled after that is why the gate asks for a
        word at check-in — access is never cut without one.
      </div>
      <div className="gmfields">
        <div className="gmf gmwide"><label>Paid by</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {GM.tenders.filter((x) => x.id !== 'tab').map((x) => (
              <button key={x.id} className={'chip' + (tender === x.id ? ' on' : '')} onClick={() => setTender(x.id)}>
                <ion-icon name={x.icon}></ion-icon>{x.name}{x.id === 'wallet' ? ' · ' + xaf(m.wallet) : ''}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="gmsum">
        <div><span>Tab</span><b>{xaf(m.tab)}</b></div>
        <div><span>TVA included at {Math.round(GM.vat * 1000) / 10}%</span><b>{xaf(m.tab - m.tab / (1 + GM.vat))}</b></div>
      </div>
    </GmSheet>
  );
}

Object.assign(window, { MoneyView, TopupSheet, SettleTabSheet });
