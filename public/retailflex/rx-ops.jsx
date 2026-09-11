/* Koomzo Retail POS — deepened Shift / Returns / Customers.
   Loaded after rx-screens.jsx; these definitions replace the sketch versions. */

function Seg({ tabs, value, onChange }) {
  return (
    <div className="seg">
      {tabs.map(([id, label, n]) => (
        <button key={id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>
          {label}{n ? <i>{n}</i> : null}
        </button>
      ))}
    </div>
  );
}

/* ================= SHIFT ================= */
function ShiftView() {
  const S = window.RX_SHIFT2;
  const [tab, setTab] = React.useState('overview');
  const [den, setDen] = React.useState(() => S.denoms.map((d) => d.n));
  const [blind, setBlind] = React.useState(true);
  const counted = S.denoms.reduce((s, d, i) => s + d.v * den[i], 0);
  const expected = S.tenders[0].expected;
  const diff = +(counted - expected).toFixed(2);
  const within = Math.abs(diff) <= S.tolerance;
  const peak = Math.max(...S.hourly.map((h) => h[1]));
  const bump = (i, k) => setDen((c) => c.map((n, j) => (j === i ? Math.max(0, n + k) : n)));

  return (
    <div className="view">
      <div className="view__head">
        <div>
          <h2>Shift & cash drawer</h2>
          <p>{S.lane} · {S.cashier} · opened {S.opened} · running {S.elapsed}</p>
        </div>
        <div className="sp"></div>
        <span className="badge ok"><ion-icon name="ellipse" style={{ fontSize: 8 }}></ion-icon>Shift open</span>
        <button className="btn"><ion-icon name="print-outline"></ion-icon>X report</button>
        <button className="btn primary desk-only"><ion-icon name="lock-closed-outline"></ion-icon>Close shift</button>
      </div>

      <Seg value={tab} onChange={setTab} tabs={[['overview', 'Overview'], ['count', 'Cash count'],
        ['moves', 'Movements', S.movements.length], ['exc', 'Exceptions', S.exceptions.reduce((s, e) => s + e.n, 0)]]} />

      {tab === 'overview' && (<>
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(148px,1fr))' }}>
          {S.kpis.map((k) => (
            <div className="kpi" key={k.k}>
              <div className="k">{k.k}</div>
              <div className="v" style={{ color: k.tone === 'bad' ? 'var(--kz-discount)' : k.tone === 'warn' ? '#a3761c' : 'var(--kz-ink)' }}>
                {k.plain ? k.v : money(k.v)}
              </div>
            </div>
          ))}
        </div>
        <div className="op2">
          <div className="card" style={{ padding: 0 }}>
            <div className="op-head">
              <div><h3>Tender reconciliation</h3><p>What the system took, against what is actually there</p></div>
            </div>
            <div className="op-bd" style={{ paddingTop: 4 }}>
              {S.tenders.map((t) => {
                const c = t.counted === null ? counted : t.counted;
                const d = +(c - t.expected).toFixed(2);
                return (
                  <div className="op-row" key={t.k}>
                    <div className="op-ic"><ion-icon name={t.ic}></ion-icon></div>
                    <div><div className="op-k">{t.k}</div><div className="op-d">{t.note}</div></div>
                    <div className="sp"></div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="op-v">{money(c)}</div>
                      <div className="op-d">expected {money(t.expected)}</div>
                    </div>
                    <span style={{ minWidth: 62, justifyContent: 'center' }}
                      className={'risk ' + (d === 0 ? 'low' : Math.abs(d) <= S.tolerance ? 'watch' : 'high')}>
                      {d === 0 ? 'Match' : (d > 0 ? '+' : '−') + money(Math.abs(d)).slice(1)}
                    </span>
                  </div>
                );
              })}
              <div className="op-row" style={{ borderTop: '1px solid var(--kz-border)', marginTop: 4 }}>
                <div className="op-k">Total banked this shift</div><div className="sp"></div>
                <div className="op-v">{money(S.tenders.reduce((s, t) => s + (t.counted === null ? counted : t.counted), 0))}</div>
              </div>
            </div>
          </div>
          <div className="op-stack">
            <div className="card">
              <div className="card__t">Sales by hour</div>
              <div className="card__s">Peak {money(peak)} at 12:00 — staffing signal for the duty manager.</div>
              <div className="bars">
                {S.hourly.map(([h, v]) => (
                  <div key={h}><span className="b" style={{ height: Math.round((v / peak) * 84) + 'px' }}></span><span className="l">{h}</span></div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card__t">Before you close</div>
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {[['Cash counted', Math.abs(diff) <= S.tolerance, within ? 'Within tolerance' : money(diff) + ' variance'],
                  ['Card batch settled', true, 'Terminal 3391 · 14:02'],
                  ['Safe drop recorded', true, 'Bag 0041'],
                  ['Open tickets cleared', false, '3 tickets still on hold']].map(([k, ok, d]) => (
                  <div className="op-row" key={k} style={{ padding: '7px 0' }}>
                    <ion-icon name={ok ? 'checkmark-circle' : 'alert-circle-outline'}
                      style={{ fontSize: 19, color: ok ? 'var(--kz-success)' : '#c98a20' }}></ion-icon>
                    <div><div className="op-k">{k}</div><div className="op-d">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>)}

      {tab === 'count' && (
        <div className="op2">
          <div className="card" style={{ padding: 0 }}>
            <div className="op-head">
              <div><h3>Count the drawer</h3><p>Blind count — the expected figure stays hidden until you submit</p></div>
              <div className="sp"></div>
              <button className="btn" style={{ height: 32, padding: '0 11px', fontSize: 12.5 }} onClick={() => setBlind(!blind)}>
                <ion-icon name={blind ? 'eye-off-outline' : 'eye-outline'}></ion-icon>{blind ? 'Blind' : 'Visible'}
              </button>
            </div>
            <div className="op-bd">
              <div className="denoms">
                {S.denoms.map((d, i) => (
                  <div className="den" key={d.v}>
                    <span className="den__v">{window.KZ_LOCALE.short(d.v)}</span>
                    <button onClick={() => bump(i, -1)}><ion-icon name="remove-outline"></ion-icon></button>
                    <span className="den__n">{den[i]}</span>
                    <button onClick={() => bump(i, 1)}><ion-icon name="add-outline"></ion-icon></button>
                    <span className="sp" style={{ flex: 1 }}></span>
                    <span className="den__t">{money(d.v * den[i])}</span>
                  </div>
                ))}
              </div>
              <div className="op-row" style={{ marginTop: 12, borderTop: '1px solid var(--kz-border)', borderBottom: 'none', paddingTop: 12 }}>
                <div className="op-k">Counted in drawer</div><div className="sp"></div>
                <div className="op-v" style={{ fontSize: 19 }}>{money(counted)}</div>
              </div>
            </div>
          </div>
          <div className="op-stack">
            <div className={'varbox' + (within ? '' : ' off')}>
              <div className="lab">Over / short</div>
              <div className={'big' + (blind ? ' blind' : '')}>{(diff > 0 ? '+' : diff < 0 ? '−' : '') + money(Math.abs(diff)).slice(1)}</div>
              <div className={'msg' + (blind ? ' blind' : '')}>
                {within ? `Inside the ${money(S.tolerance)} tolerance — close without approval.`
                  : `Outside the ${money(S.tolerance)} tolerance. A manager PIN and a reason are required to close.`}
              </div>
            </div>
            <div className="card">
              <div className="card__t">Drawer actions</div>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <button className="btn wide"><ion-icon name="download-outline"></ion-icon>Cash drop to safe</button>
                <button className="btn wide"><ion-icon name="arrow-up-circle-outline"></ion-icon>Paid out</button>
                <button className="btn wide"><ion-icon name="lock-open-outline"></ion-icon>No-sale (opens drawer)</button>
              </div>
              <div className="flagrow info" style={{ marginTop: 12 }}>
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                Every drawer open is logged with the operator, the time and the reason — that log is what makes shrinkage findable.
              </div>
            </div>
            <button className="btn primary wide desk-only" style={{ height: 46 }}>
              <ion-icon name="lock-closed-outline"></ion-icon>Submit count & close shift
            </button>
            <div className="flagrow warn phone-only"><ion-icon name="phone-portrait-outline"></ion-icon>
              Counting and closing a drawer needs two hands and a counter. Record the count here if you must, but the shift is closed from the lane terminal.</div>
          </div>
        </div>
      )}

      {tab === 'moves' && (
        <div className="table" style={{ maxWidth: 760 }}>
          {S.movements.map((m) => (
            <div className="trw" key={m.t + m.k}>
              <div className="op-ic"><ion-icon name={m.v > 0 ? 'arrow-down-outline' : m.v < 0 ? 'arrow-up-outline' : 'lock-open-outline'}></ion-icon></div>
              <div><div className="nm">{m.k}</div><div className="mt">{m.t} · {m.who} · {m.note}</div></div>
              <div className="sp"></div>
              <span className="amt" style={{ color: m.v < 0 ? 'var(--kz-discount)' : m.v > 0 ? 'var(--kz-success)' : 'var(--kz-muted-3)' }}>
                {m.v === 0 ? '—' : money(m.v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'exc' && (
        <div style={{ maxWidth: 760, display: 'grid', gap: 12 }}>
          <div className="flagrow warn"><ion-icon name="alert-circle-outline"></ion-icon>
            Exceptions are not accusations — they are the four events that explain almost every till discrepancy. Review them with the cashier before the drawer is closed.</div>
          <div className="table">
            {S.exceptions.map((e) => (
              <div className="trw" key={e.k}>
                <div><div className="nm">{e.k}</div><div className="mt">{e.note}</div></div>
                <div className="sp"></div>
                <span className="amt">{e.n}</span>
                <span className={'risk ' + e.risk}>{e.risk === 'high' ? 'Review' : e.risk === 'watch' ? 'Watch' : 'Normal'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= RETURNS ================= */
function ReturnsView() {
  const R = window.RX_RETURNS;
  const [mode, setMode] = React.useState('receipt');
  const [sel, setSel] = React.useState(null);
  const [q, setQ] = React.useState('');
  const [lines, setLines] = React.useState({});
  const [method, setMethod] = React.useState('original');
  const r = R.find((x) => x.id === sel);

  const pick = (i, patch) => setLines((c) => ({ ...c, [i]: { qty: 1, reason: null, cond: 'resalable', ...(c[i] || {}), ...patch } }));
  const drop = (i) => setLines((c) => { const n = { ...c }; delete n[i]; return n; });

  const chosen = r ? Object.entries(lines).map(([i, v]) => ({ ...v, line: r.lines[i] })) : [];
  const goods = chosen.reduce((s, c) => s + c.line.price * c.qty, 0);
  const rate = r ? r.rate : 0;
  const tax = +(goods * rate).toFixed(2);
  const total = +(goods + tax).toFixed(2);
  const missingReason = chosen.some((c) => !c.reason);
  const needsApproval = mode === 'noreceipt' || total > 100 || (r && r.expired);

  const reset = () => { setSel(null); setLines({}); setMethod('original'); };

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Returns & exchange</h2>
          <p>Find the sale, choose what is physically coming back, say why, then decide where the money goes.</p></div>
      </div>

      <Seg value={mode} onChange={(m) => { setMode(m); reset(); }} tabs={[['receipt', 'Receipt or order no'],
        ['card', 'Card last 4'], ['customer', 'Customer'], ['noreceipt', 'No receipt']]} />

      {mode === 'noreceipt' ? (
        <div style={{ maxWidth: 640, display: 'grid', gap: 12 }}>
          <div className="flagrow stop"><ion-icon name="warning-outline"></ion-icon>
            No proof of purchase. Refund is limited to store credit at the lowest price this item sold for in the last 90 days, a manager PIN is required, and the customer's ID is recorded against the credit note.</div>
          <div className="card">
            <div className="card__t">Identify the goods</div>
            <div className="field" style={{ marginTop: 12 }}><ion-icon name="barcode-outline"></ion-icon>
              <input placeholder="Scan the item barcode…" /></div>
            <div className="field" style={{ marginTop: 8 }}><ion-icon name="card-outline"></ion-icon>
              <input placeholder="ID type and number" /></div>
            <div className="flagrow info" style={{ marginTop: 12 }}><ion-icon name="information-circle-outline"></ion-icon>
              This lane has issued 1 no-receipt credit today. Three in a week against the same ID raises a flag for the store manager.</div>
            <button className="btn primary wide" style={{ marginTop: 12 }}>Continue with manager approval</button>
          </div>
        </div>
      ) : !r ? (
        <>
          <div className="field" style={{ maxWidth: 460, marginBottom: 16 }}>
            <ion-icon name={mode === 'card' ? 'card-outline' : mode === 'customer' ? 'person-outline' : 'receipt-outline'}></ion-icon>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={mode === 'card' ? 'Last 4 digits of the card used…' : mode === 'customer' ? 'Customer name, phone or loyalty card…' : 'Scan receipt barcode or type order no…'} />
          </div>
          <div className="sechead"><h3>Recent sales</h3><span>this store · 30 days</span></div>
          <div className="table" style={{ maxWidth: 760 }}>
            {R.map((x) => (
              <button className="trw" key={x.id} onClick={() => { setSel(x.id); setLines({}); }}>
                <div className="op-ic"><ion-icon name="receipt-outline"></ion-icon></div>
                <div><div className="nm">Order #{x.no} · {x.customer}</div>
                  <div className="mt">{x.at} · {x.tender} · served by {x.cashier}</div></div>
                <div className="sp"></div>
                {x.expired && <span className="risk high">Outside 30 days</span>}
                <span className="amt">{money(x.total)}</span>
                <ion-icon name="chevron-forward-outline" style={{ color: 'var(--kz-muted-3)' }}></ion-icon>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="op2">
          <div className="op-stack">
            <div className="card" style={{ padding: 0 }}>
              <div className="op-head">
                <button className="btn" style={{ height: 32, padding: '0 10px', fontSize: 12.5 }} onClick={reset}>
                  <ion-icon name="chevron-back-outline"></ion-icon>Back</button>
                <div><h3>Order #{r.no}</h3><p>{r.at} · {r.tender} · {r.customer} · served by {r.cashier}</p></div>
                <div className="sp"></div>
                <span className={'risk ' + (r.expired ? 'high' : 'low')}>{r.expired ? 'Day 30 of 30' : 'Day ' + r.days + ' of 30'}</span>
              </div>
              {r.lines.map((it, i) => {
                const on = !!lines[i];
                const dead = !!it.blocked;
                const max = it.qty - it.returned;
                return (
                  <div className={'rline' + (on ? ' on' : '') + (dead ? ' dead' : '')} key={i}>
                    <button className="rline__box" disabled={dead} onClick={() => (on ? drop(i) : pick(i, {}))}>
                      {on && <ion-icon name="checkmark-outline" style={{ fontSize: 15 }}></ion-icon>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div className="rline__n">{it.name}</div>
                          <div className="rline__s">
                            <span>{it.sub} · sold × {it.qty} @ {money(it.price)}</span>
                            {it.serial && <span className="pill sn">SN {it.serial}</span>}
                            {it.returned > 0 && <span className="pill disc">{it.returned} returned</span>}
                          </div>
                        </div>
                        <div className="rline__amt">{money(it.price * (on ? lines[i].qty : it.qty))}</div>
                      </div>
                      {dead && <div className="flagrow stop" style={{ marginTop: 9 }}>
                        <ion-icon name="close-circle-outline"></ion-icon>{it.blocked}</div>}
                      {on && (<>
                        <div className="subopts">
                          <span className="lb">Qty back</span>
                          <span className="qtybox">
                            <button onClick={() => pick(i, { qty: Math.max(1, lines[i].qty - 1) })}><ion-icon name="remove-outline"></ion-icon></button>
                            <span>{lines[i].qty} / {max}</span>
                            <button onClick={() => pick(i, { qty: Math.min(max, lines[i].qty + 1) })}><ion-icon name="add-outline"></ion-icon></button>
                          </span>
                        </div>
                        <div className="subopts">
                          <span className="lb">Reason</span>
                          {window.RX_REASONS.map((rs) => (
                            <button key={rs} className={lines[i].reason === rs ? 'on' : ''} onClick={() => pick(i, { reason: rs })}>{rs}</button>
                          ))}
                        </div>
                        <div className="subopts">
                          <span className="lb">Condition</span>
                          {[['resalable', 'Resalable — back to floor'], ['damaged', 'Damaged — quarantine'], ['supplier', 'Return to supplier']].map(([k, l]) => (
                            <button key={k} className={lines[i].cond === k ? 'on' : ''} onClick={() => pick(i, { cond: k })}>{l}</button>
                          ))}
                        </div>
                        {it.serial && <div className="flagrow warn" style={{ marginTop: 9 }}>
                          <ion-icon name="barcode-outline"></ion-icon>Scan the serial on the unit — it must match {it.serial} before the warranty is reversed.</div>}
                      </>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="op-stack">
            <div className="card">
              <div className="card__t">Refund summary</div>
              <div style={{ marginTop: 10 }}>
                <div className="op-row"><span className="op-k">Goods</span><div className="sp"></div><span className="op-v small">{money(goods)}</span></div>
                <div className="op-row"><span className="op-k">Tax reversed{rate ? ' (' + Math.round(rate * 100) + '%)' : ' — zero-rated'}</span><div className="sp"></div><span className="op-v small">{money(tax)}</span></div>
                <div className="op-row"><span className="op-k">Restocking fee</span><div className="sp"></div><span className="op-v small mute">None</span></div>
              </div>
              <div className="card__row"><span className="card__t">Refund due</span><span className="v">{money(total)}</span></div>
            </div>

            <div className="card">
              <div className="card__t">Where the money goes</div>
              <div className="card__s">Original tender is the default — it is the only method that closes the fraud loop.</div>
              <div className="methods">
                {[['original', 'Back to ' + r.tender, 'Settles in 3–5 days'],
                  ['credit', 'Store credit', 'Issued as a scannable credit note'],
                  ['cash', 'Cash from drawer', total > 100 ? 'Over 36 000 F — manager PIN' : 'Drawer has ' + money(577.65)],
                  ['exchange', 'Exchange', 'Carry the value into a new ticket']].map(([k, nm, ds]) => (
                  <button key={k} className={'method' + (method === k ? ' on' : '')} onClick={() => setMethod(k)}>
                    <ion-icon name={method === k ? 'radio-button-on' : 'radio-button-off'}
                      style={{ fontSize: 19, color: method === k ? 'var(--kz-primary)' : 'var(--kz-muted-3)' }}></ion-icon>
                    <div><div className="nm">{nm}</div><div className="ds">{ds}</div></div>
                  </button>
                ))}
              </div>
            </div>

            {missingReason && chosen.length > 0 && <div className="flagrow warn">
              <ion-icon name="help-circle-outline"></ion-icon>Pick a reason on every line. Reason codes are what turn returns into a supplier-quality report instead of noise.</div>}
            {needsApproval && <div className="flagrow stop">
              <ion-icon name="key-outline"></ion-icon>{r.expired ? 'Outside the 30-day window.' : 'Refund over 36 000 F.'} Manager PIN required — the approver is stamped on the credit note.</div>}

            <div className="actbar">
              <button className="btn" disabled={!total} onClick={() => setMethod('exchange')}>
                <ion-icon name="swap-horizontal-outline"></ion-icon>Exchange</button>
              <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!total || missingReason}>
                {needsApproval ? 'Approve & refund ' : 'Refund '}{money(total)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= CUSTOMERS ================= */
function CustomersView({ onPick }) {
  const list = window.RX_CUSTOMERS;
  const [adding, setAdding] = React.useState(false);
  const [selId, setSelId] = React.useState(list[0].id);
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [tab, setTab] = React.useState('purchases');
  const c = list.find((x) => x.id === selId);
  const d = window.RX_CUST_DETAIL[selId];
  const tiers = window.RX_TIERS;
  const pct = d.toNext === 0 ? 100 : Math.round((c.points / (c.points + d.toNext)) * 100);
  const shown = list.filter((x) => {
    if (filter === 'gold' && x.tier !== 'Gold') return false;
    if (filter === 'credit' && !window.RX_CUST_DETAIL[x.id].credit) return false;
    if (filter === 'new' && x.visits > 5) return false;
    return (x.name + x.phone).toLowerCase().includes(q.toLowerCase());
  });

  if (adding) return <NewCustomerView onCancel={() => setAdding(false)} onSave={() => setAdding(false)} />;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Customers</h2><p>Who they are, what they are owed, and what the next cashier needs to know.</p></div>
        <div className="sp"></div>
        <button className="btn desk-only"><ion-icon name="mail-outline"></ion-icon>Export list</button>
        <button className="btn primary" onClick={() => setAdding(true)}><ion-icon name="person-add-outline"></ion-icon>Add customer</button>
      </div>

      <div className={'custgrid' + (open ? ' showing' : '')}>
        <div className="op-stack cpane-list">
          <div className="field"><ion-icon name="search-outline"></ion-icon>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or loyalty card…" /></div>
          <div className="seg" style={{ marginBottom: 0 }}>
            {[['all', 'All'], ['gold', 'Gold'], ['credit', 'Has credit'], ['new', 'New']].map(([k, l]) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <div className="clist">
            {shown.map((x) => (
              <button key={x.id} className={'crow' + (x.id === selId ? ' on' : '')} onClick={() => { setSelId(x.id); setOpen(true); }}>
                <div className="avatar">{x.name.split(' ').map((w) => w[0]).join('')}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="nm">{x.name}</div>
                  <div className="mt">{x.visits} visits · {money(x.spend)} lifetime</div>
                </div>
                <div className="sp"></div>
                <span className={'badge' + (x.tier === 'Gold' ? ' gold' : '')}>{x.tier}</span>
              </button>
            ))}
            {!shown.length && <div className="empty" style={{ minHeight: 120 }}><p>No match.</p></div>}
          </div>
        </div>

        <div className="op-stack cpane-detail">
          <button className="btn phone-only" style={{ width: 'fit-content' }} onClick={() => setOpen(false)}>
            <ion-icon name="chevron-back-outline"></ion-icon>All customers</button>
          <div className="card" style={{ padding: 0 }}>
            <div className="cprof">
              <div className="av">{c.name.split(' ').map((w) => w[0]).join('')}</div>
              <div style={{ minWidth: 0 }}>
                <h3>{c.name}</h3>
                <p>{c.phone} · member since {d.since} · birthday {d.birthday}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <span className={'badge' + (c.tier === 'Gold' ? ' gold' : '')}>{c.tier}</span>
                  <span className="op-d" style={{ margin: 0 }}>
                    {d.toNext === 0 ? 'Top tier reached' : `${d.toNext} pts to ${d.next}`}</span>
                </div>
                <div className="meter" style={{ maxWidth: 260 }}><i style={{ width: pct + '%' }}></i></div>
              </div>
              <div className="sp"></div>
              <button className="btn primary" onClick={() => onPick(c)}>
                <ion-icon name="cart-outline"></ion-icon>Start ticket</button>
            </div>
            <div className="minigrid">
              <div><div className="k">Points</div><div className="v">{c.points}</div></div>
              <div><div className="k">Store credit</div><div className="v" style={{ color: d.credit ? 'var(--kz-success)' : 'var(--kz-muted-3)' }}>{money(d.credit)}</div></div>
              <div><div className="k">Lifetime</div><div className="v">{money(c.spend)}</div></div>
              <div><div className="k">Average basket</div><div className="v">{money(d.avg)}</div></div>
            </div>
            <div className="op-bd">
              <div className="seg" style={{ marginBottom: 12 }}>
                {[['purchases', 'Purchases'], ['prefs', 'Preferences'], ['notes', 'Notes', d.notes.length]].map(([k, l, n]) => (
                  <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{n ? <i>{n}</i> : null}</button>
                ))}
              </div>

              {tab === 'purchases' && (
                <div className="table">
                  {d.history.map((h) => (
                    <div className="trw" key={h.no}>
                      <div className="op-ic"><ion-icon name="receipt-outline"></ion-icon></div>
                      <div><div className="nm">Order #{h.no}</div><div className="mt">{h.at} · {h.items}</div></div>
                      <div className="sp"></div>
                      <span className="amt">{money(h.v)}</span>
                      <button className="btn" style={{ height: 32, padding: '0 11px', fontSize: 12.5 }}>Reorder</button>
                      <button className="btn" style={{ height: 32, padding: '0 11px', fontSize: 12.5 }}>Return</button>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'prefs' && (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <div className="op-d" style={{ marginBottom: 7 }}>KNOWN PREFERENCES</div>
                    <div className="taglist">
                      {d.prefs.length ? d.prefs.map((p) => <span className="tag" key={p}><ion-icon name="bookmark-outline" style={{ fontSize: 13 }}></ion-icon>{p}</span>)
                        : <span className="tag">Nothing recorded yet</span>}
                    </div>
                  </div>
                  <div>
                    <div className="op-d" style={{ marginBottom: 7 }}>MARKETING CONSENT</div>
                    <div className="taglist">
                      {['Email', 'SMS', 'Post'].map((ch) => {
                        const on = d.consent.includes(ch);
                        return <span className="tag" key={ch} style={on ? { background: 'var(--kz-success-wash)', color: 'var(--kz-success)' } : null}>
                          <ion-icon name={on ? 'checkmark-circle' : 'close-circle-outline'} style={{ fontSize: 13 }}></ion-icon>{ch}</span>;
                      })}
                    </div>
                  </div>
                  <div className="flagrow info"><ion-icon name="lock-closed-outline"></ion-icon>
                    Consent is captured at the register and is revocable here. Cashiers see preferences, never payment details.</div>
                </div>
              )}

              {tab === 'notes' && (
                <div>
                  <div className="field"><ion-icon name="create-outline"></ion-icon>
                    <input placeholder="Add a note the next cashier should see…" /></div>
                  {d.notes.length ? d.notes.map((n, i) => (
                    <div className="note2" key={i}><div className="txt">{n.txt}</div><div className="by">{n.who} · {n.at}</div></div>
                  )) : <div className="empty" style={{ minHeight: 100 }}><p>No notes yet.</p></div>}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <button className="btn"><ion-icon name="gift-outline"></ion-icon>Issue store credit</button>
            <button className="btn"><ion-icon name="pricetag-outline"></ion-icon>Redeem {c.points} pts</button>
            <button className="btn"><ion-icon name="calendar-outline"></ion-icon>Book appointment</button>
            <button className="btn"><ion-icon name="print-outline"></ion-icon>Reprint receipt</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewCustomerView({ onCancel, onSave }) {
  const [f, setF] = React.useState({ first: '', last: '', phone: '', email: '', birthday: '', tags: [], consent: ['Email'], note: '', card: '' });
  const [touched, setTouched] = React.useState({});
  const set = (k, v) => setF((c) => ({ ...c, [k]: v }));
  const mark = (k) => setTouched((c) => ({ ...c, [k]: true }));
  const toggleIn = (k, v) => setF((c) => ({ ...c, [k]: c[k].includes(v) ? c[k].filter((x) => x !== v) : [...c[k], v] }));

  const digits = f.phone.replace(/\D/g, '');
  const phoneOk = digits.length >= 10;
  const emailOk = !f.email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email);
  const named = f.first.trim().length > 0;
  const canSave = named && phoneOk && emailOk;
  const dupe = digits.length >= 10 && digits.endsWith('0148');
  const initials = ((f.first[0] || '') + (f.last[0] || '')).toUpperCase() || '—';
  const TAGS = ['Trade account', 'Wholesale', 'Staff', 'VIP', 'Repairs', 'Gift buyer'];

  return (
    <div className="view">
      <div className="view__head">
        <button className="btn" onClick={onCancel}><ion-icon name="chevron-back-outline"></ion-icon>Customers</button>
        <div><h2>New customer</h2>
          <p>Only a name and a phone number are required — everything else can be filled in on a later visit.</p></div>
      </div>

      <div className="form2">
        <div className="card">
          <div className="fsec__t">Who they are</div>
          <div className="fsec__s">Capture this at the counter in under ten seconds. Long forms are why loyalty sign-up rates collapse at the till.</div>
          <div className="fgrid">
            <div>
              <label className="flab">First name</label>
              <div className={'field' + (touched.first && !named ? ' bad' : '')}>
                <ion-icon name="person-outline"></ion-icon>
                <input value={f.first} onBlur={() => mark('first')} onChange={(e) => set('first', e.target.value)} placeholder="Amara" />
              </div>
              {touched.first && !named && <div className="fhint err">A first name is required.</div>}
            </div>
            <div>
              <label className="flab">Last name <em>optional</em></label>
              <div className="field"><ion-icon name="person-outline"></ion-icon>
                <input value={f.last} onChange={(e) => set('last', e.target.value)} placeholder="Diallo" /></div>
            </div>
            <div>
              <label className="flab">Mobile number</label>
              <div className={'field' + (touched.phone && !phoneOk ? ' bad' : '')}>
                <ion-icon name="call-outline"></ion-icon>
                <input inputMode="tel" value={f.phone} onBlur={() => mark('phone')} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 010-0148" />
                {phoneOk && <ion-icon name="checkmark-circle" style={{ color: 'var(--kz-success)' }}></ion-icon>}
              </div>
              <div className={'fhint' + (touched.phone && !phoneOk ? ' err' : '')}>
                {touched.phone && !phoneOk ? 'Enter at least 10 digits.' : 'The phone number is the loyalty lookup key — receipts and returns are found by it.'}</div>
            </div>
            <div>
              <label className="flab">Email <em>optional</em></label>
              <div className={'field' + (touched.email && !emailOk ? ' bad' : '')}>
                <ion-icon name="mail-outline"></ion-icon>
                <input inputMode="email" value={f.email} onBlur={() => mark('email')} onChange={(e) => set('email', e.target.value)} placeholder="amara@example.com" />
              </div>
              {touched.email && !emailOk && <div className="fhint err">That does not look like an email address.</div>}
            </div>
          </div>

          {dupe && (
            <div className="dupe">
              <ion-icon name="git-merge-outline" style={{ color: '#8a6414' }}></ion-icon>
              <div><div className="t">Amara Diallo already uses this number</div>
                <div className="d">Gold · 14 visits · joined Mar 2023</div></div>
              <div className="sp"></div>
              <button className="btn" style={{ height: 34, fontSize: 12.5 }}>Open theirs</button>
            </div>
          )}

          <div className="fsec">
            <div className="fsec__t">Marketing consent</div>
            <div className="fsec__s">Ask out loud, tick what they say. Consent is per channel and revocable at any register.</div>
            {[['Email', 'Receipts, offers and restock alerts'], ['SMS', 'Order-ready texts and flash offers'], ['Post', 'Seasonal catalogue']].map(([ch, ds]) => (
              <div className="optrow" key={ch}>
                <div><div className="t">{ch}</div><div className="d">{ds}</div></div>
                <div className="sp"></div>
                <button className={'sw2' + (f.consent.includes(ch) ? ' on' : '')} onClick={() => toggleIn('consent', ch)}></button>
              </div>
            ))}
            <div className="flagrow info" style={{ marginTop: 12 }}>
              <ion-icon name="lock-closed-outline"></ion-icon>
              Unticked means never contacted on that channel. Transactional receipts are not marketing and are always allowed.
            </div>
          </div>

          <div className="fsec">
            <div className="fsec__t">Useful extras</div>
            <div className="fsec__s">Optional — skip all of this if there is a queue.</div>
            <div className="fgrid">
              <div>
                <label className="flab">Birthday</label>
                <div className="field"><ion-icon name="calendar-outline"></ion-icon>
                  <input value={f.birthday} onChange={(e) => set('birthday', e.target.value)} placeholder="4 Sep" /></div>
                <div className="fhint">Day and month only — no year is stored.</div>
              </div>
              <div>
                <label className="flab">Loyalty card</label>
                <div className="field"><ion-icon name="barcode-outline"></ion-icon>
                  <input value={f.card} onChange={(e) => set('card', e.target.value)} placeholder="Scan a physical card…" /></div>
                <div className="fhint">Leave blank to run cardless on the phone number.</div>
              </div>
              <div className="span">
                <label className="flab">Tags</label>
                <div className="subopts" style={{ marginTop: 0 }}>
                  {TAGS.map((t) => (
                    <button key={t} className={f.tags.includes(t) ? 'on' : ''} onClick={() => toggleIn('tags', t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="span">
                <label className="flab">Note for the next cashier</label>
                <div className="field"><ion-icon name="create-outline"></ion-icon>
                  <input value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Prefers e-receipt · allergy: lanolin" /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="op-stack previewcard">
          <div className="card" style={{ padding: 0 }}>
            <div className="cprof" style={{ paddingBottom: 14 }}>
              <div className="av">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 16 }}>{(f.first + ' ' + f.last).trim() || 'New customer'}</h3>
                <p>{f.phone || 'No number yet'}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span className="badge">Member</span>
                  <span className="badge pri">0 pts</span>
                </div>
              </div>
            </div>
            <div className="op-bd" style={{ borderTop: '1px solid var(--kz-border)' }}>
              <div className="op-d" style={{ marginBottom: 7 }}>WILL BE CONTACTED BY</div>
              <div className="taglist">
                {f.consent.length ? f.consent.map((ch) => (
                  <span className="tag" key={ch} style={{ background: 'var(--kz-success-wash)', color: 'var(--kz-success)' }}>
                    <ion-icon name="checkmark-circle" style={{ fontSize: 13 }}></ion-icon>{ch}</span>
                )) : <span className="tag">No channels — transactional only</span>}
              </div>
              {f.tags.length > 0 && (<>
                <div className="op-d" style={{ margin: '14px 0 7px' }}>TAGS</div>
                <div className="taglist">{f.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
              </>)}
            </div>
          </div>
          <div className="actbar">
            <button className="btn" onClick={onCancel}>Cancel</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!canSave} onClick={onSave}>
              <ion-icon name="person-add-outline"></ion-icon>Save &amp; attach</button>
          </div>
          {!canSave && <div className="fhint">A first name and a valid mobile number are needed before saving.</div>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Seg, ShiftView, ReturnsView, CustomersView, NewCustomerView });
