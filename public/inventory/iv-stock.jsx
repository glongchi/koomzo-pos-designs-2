/* Koomzo Inventory — Stock (on hand + movements + adjust), Counts, Transfers. */

function StockView({ loc, caps, onAdjust, onOpen }) {
  const [tab, setTab] = useState('hand');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const stocked = IV_ITEMS.filter((i) => i.stock && (!q || (i.name + i.sku).toLowerCase().includes(q.toLowerCase())));
  const locs = caps.locations ? IV_LOCATIONS : IV_LOCATIONS.filter((l) => l.id === 'dt');
  const moves = IV_MOVES.filter((m) => (kind === 'all' || m.kind === kind) && (loc === 'all' || m.loc === loc));

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Stock</h2><p>{caps.locations ? locs.length + ' locations' : 'Single location'} · {stocked.length} tracked items</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={() => onOpen('receive')}><ion-icon name="download-outline"></ion-icon>Receive</button>
        <button className="btn primary" onClick={onAdjust}><ion-icon name="create-outline"></ion-icon>Adjust stock</button>
      </div>

      <Seg value={tab} onChange={setTab} tabs={[['hand', 'On hand'], ['moves', 'Movements', moves.length]]} />

      {tab === 'hand' && <>
        <div className="fbar">
          <div className="field"><ion-icon name="search-outline"></ion-icon>
            <input placeholder="Filter items" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        <div className="mtx">
          <table>
            <thead><tr>
              <th>Item</th>
              {locs.map((l) => <th key={l.id}>{l.code}</th>)}
              <th>Total</th><th>Value</th>
            </tr></thead>
            <tbody>
              {stocked.map((i) => (
                <tr key={i.id}>
                  <td><div className="nmcell">{i.name}<small>{i.sku}{i.backbar ? ' · back bar' : ''}</small></div></td>
                  {locs.map((l) => {
                    const n = i.stock[l.id] || 0;
                    return <td key={l.id} className={n === 0 ? 'z' : (i.reorder != null && n <= i.reorder ? 'lo' : '')}>{n === 0 ? '—' : qtyFmt(n)}</td>;
                  })}
                  <td className="tot">{qtyFmt(IV.onHand(i, 'all'))}</td>
                  <td className="tot">{money(IV.value(i, 'all'))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hint" style={{ marginTop: 12 }}><ion-icon name="information-circle-outline"></ion-icon>
          <span>Quantities are read-only here. Every change goes through an <b>adjustment, receipt, transfer or count</b> so the movement log stays complete.</span></div>
      </>}

      {tab === 'moves' && <>
        <div className="fbar">
          <select className="sel" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">All movement types</option>
            {Object.keys(IV_MOVE_KIND).map((k) => <option key={k} value={k}>{IV_MOVE_KIND[k].label}</option>)}
          </select>
          <div className="sp" style={{ flex: 1 }}></div>
          <button className="btn" onClick={() => {
            const head = 'when,item,sku,location,type,qty,reason,reference,value\n';
            const body = moves.map((m) => {
              const it = IV.item(m.item);
              return [m.at, it.name, it.sku, IV.loc(m.loc).code, m.kind, m.qty, m.reason || '', '"' + (m.ref || '') + '"', m.cost || 0].join(',');
            }).join('\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([head + body], { type: 'text/csv' }));
            a.download = 'movements-' + (loc === 'all' ? 'all' : IV.loc(loc).code) + '.csv';
            a.click(); URL.revokeObjectURL(a.href);
            window.IVS.say(moves.length + ' movement rows exported');
          }}><ion-icon name="download-outline"></ion-icon>Export</button>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {moves.map((m) => <MoveRow key={m.id} m={m} />)}
          {!moves.length && <EmptyState icon="swap-vertical-outline" title="No movements" sub="Nothing of this type at this location." />}
        </div>
      </>}
    </div>
  );
}

/* ---------- adjust sheet ---------- */
/* The only screen that changes a quantity by hand — so it is also the only one that
   needs a reason on every post and an authorisation when the result goes negative. */
function AdjustSheet({ loc, caps, itemId, onClose }) {
  const [id, setId] = useState(itemId && IV.item(itemId) && IV.item(itemId).stock ? itemId : 'i4');
  const [at, setAt] = useState(loc === 'all' ? 'dt' : loc);
  const [reason, setReason] = useState('recount');
  const [delta, setDelta] = useState(-1);
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const item = IV.item(id);
  const before = item.stock[at] || 0;
  const after = before + delta;
  const r = IV_REASONS.find((x) => x.id === reason);
  const negative = after < 0;
  const blocked = delta === 0 || (negative && pin.length < 4);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>Adjust stock</h3><p>{IV.loc(at).name} · writes one movement row</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          <div>
            <label className="flab">Item</label>
            <select className="sel" style={{ width: '100%', maxWidth: 'none', height: 46 }} value={id} onChange={(e) => setId(e.target.value)}>
              {IV_ITEMS.filter((i) => i.stock).map((i) => <option key={i.id} value={i.id}>{i.name} · {i.sku}</option>)}
            </select>
          </div>
          {caps && caps.locations && (
            <div>
              <label className="flab">Location</label>
              <select className="sel" style={{ width: '100%', maxWidth: 'none', height: 46 }} value={at} onChange={(e) => setAt(e.target.value)}>
                {IV_LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name} · on hand {item.stock[l.id] || 0}</option>)}
              </select>
            </div>
          )}
          <div>
            <span className="lbl">Reason</span>
            <div className="opts">
              {IV_REASONS.map((x) => (
                <button key={x.id} className={'opt' + (reason === x.id ? ' on' : '')} style={{ height: 38, fontSize: 12.5 }}
                  onClick={() => { setReason(x.id); if (x.dir === 'out' && delta > 0) setDelta(-delta); if (x.dir === 'in' && delta < 0) setDelta(-delta); }}>
                  {x.label}</button>
              ))}
            </div>
          </div>
          <div className="fgrid">
            <div>
              <label className="flab">Change</label>
              <div className="stepper" style={{ gap: 8 }}>
                <button onClick={() => setDelta((d) => d - 1)} style={{ width: 44, height: 44 }}><ion-icon name="remove-outline"></ion-icon></button>
                <input className="numin" style={{ height: 44, textAlign: 'center', flex: 1 }} value={delta}
                  onChange={(e) => setDelta(+e.target.value || 0)} />
                <button onClick={() => setDelta((d) => d + 1)} style={{ width: 44, height: 44 }}><ion-icon name="add-outline"></ion-icon></button>
              </div>
            </div>
            <div>
              <label className="flab">Result</label>
              <div className="pricebox" style={{ height: 44, alignItems: 'center' }}>
                <span className="k" style={{ whiteSpace: 'nowrap' }}>{before} →</span>
                <span className="v" style={{ fontSize: 20, color: negative ? 'var(--kz-discount)' : 'var(--kz-ink)' }}>{after}</span>
              </div>
            </div>
          </div>
          <Field label="Note" placeholder="What happened" value={note} onChange={setNote} />
          {negative && <>
            <Warn tone="bad" icon="lock-closed-outline">
              This takes {IV.loc(at).code} to <b>{after}</b>. Negative stock is allowed — the shelf is the truth, not the system — but it needs an owner's authorisation so the variance has a name against it.
            </Warn>
            <Field label="Owner PIN" value={pin} type="text" placeholder="····"
              onChange={(v) => setPin(String(v).replace(/\D/g, '').slice(0, 4))}
              hint="Mock backend accepts any four digits. Production checks it against the owner's PIN and the role allowed to authorise a negative." />
          </>}
          <div className="hint"><ion-icon name="cash-outline"></ion-icon>
            <span>Cost impact <b>{money(Math.abs(delta) * (item.cost || 0))}</b> — posted to {r.label.toLowerCase()}.</span></div>
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={blocked}
            onClick={() => { window.IVS.postAdjustment({ itemId: id, locId: at, delta, reason, note }); onClose(); }}>
            <ion-icon name="checkmark-outline"></ion-icon>Post adjustment</button>
        </div>
      </div>
    </div>
  );
}

/* ================= COUNTS ================= */
function CountsView({ loc, caps, onOpen }) {
  const list = IV_COUNTS;
  const [selId, setSelId] = useState(list[0] ? list[0].id : null);
  const [pushed, setPushed] = useState(false);
  const [counted, setCounted] = useState({});
  /* a newly opened count becomes the one you are looking at — createCount unshifts,
     and on a phone it pushes, because opening a count means wanting to count it */
  useEffect(() => { if (list[0]) { setSelId(list[0].id); setPushed(true); } }, [list.length]);
  const doc = list.find((c) => c.id === selId);
  const posted = doc && doc.status === 'posted';
  const val = (l) => counted[doc.id + l.id] !== undefined ? counted[doc.id + l.id] : l.cnt;
  const setVal = (l, v) => setCounted((c) => ({ ...c, [doc.id + l.id]: v === '' ? null : +v }));

  const stats = doc ? doc.lines.reduce((a, l) => {
    const c = val(l);
    if (c == null) return { ...a, pending: a.pending + 1 };
    const d = c - l.exp;
    return { ...a, done: a.done + 1, var: a.var + d * (IV.item(l.id).cost || 0), off: a.off + (d !== 0 ? 1 : 0) };
  }, { done: 0, pending: 0, var: 0, off: 0 }) : null;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Stock counts</h2><p>Cycle counts keep the number honest without closing the shop</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={() => onOpen('schedule')}><ion-icon name="repeat-outline"></ion-icon>Schedule cycle</button>
        <button className="btn primary" onClick={() => onOpen('newCount')}><ion-icon name="add-outline"></ion-icon>New count</button>
      </div>

      {IV_CYCLES.length > 0 && (
        <div className="card" style={{ padding: 0, marginBottom: 14 }}>
          <div className="op-head">
            <div><h3>Cycle schedule</h3><p>{IV_CYCLES.length} rotation{IV_CYCLES.length > 1 ? 's' : ''} running</p></div>
            <div className="sp"></div>
            <button className="btn" onClick={() => onOpen('schedule')}><ion-icon name="add-outline"></ion-icon>Add</button>
          </div>
          <div className="op-bd" style={{ paddingTop: 4 }}>
            {IV_CYCLES.map((cy) => (
              <div className="op-row" key={cy.id}>
                <div className="op-ic"><ion-icon name="repeat-outline"></ion-icon></div>
                <div>
                  <div className="op-k">{IV.loc(cy.loc).name} · {cy.cadenceLabel}</div>
                  <div className="op-d">{cy.cats.map((c) => (IV_CATS.find((x) => x.id === c) || {}).label).join(', ')} · {cy.per} lines · {cy.who}</div>
                </div>
                <div className="sp"></div>
                <div style={{ textAlign: 'right' }}>
                  <div className="op-v small">{cy.next[0]}</div>
                  <div className="op-d">full pass {cy.coverDays} d</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mdgrid wide">
        <div className="card" style={{ padding: 0 }}>
          {list.map((c) => (
            <button className={'doc' + (selId === c.id ? ' on' : '')} key={c.id} onClick={() => { setSelId(c.id); setPushed(true); }}>
              <div className="op-ic"><ion-icon name="clipboard-outline"></ion-icon></div>
              <div>
                <div className="doc__no">{c.no}</div>
                <div className="doc__m">{IV.loc(c.loc).name} · {c.scope}{c.blind ? ' · blind' : ''}</div>
              </div>
              <div className="sp"></div>
              <div style={{ textAlign: 'right' }}>
                <div className="op-d">{c.by}</div>
                <div className="op-d">{c.at}</div>
              </div>
              <Risk tone={c.status === 'posted' ? 'low' : c.status === 'review' ? 'watch' : 'high'}>
                {c.status === 'open' ? 'Counting' : c.status === 'review' ? 'In review' : 'Posted'}</Risk>
            </button>
          ))}
        </div>

        {doc && (
          <div className={'mdpane' + (pushed ? ' pushed' : '')}>
            <div className="mdpane__hd">
              <button className="icbtn backbtn" onClick={() => setPushed(false)}><ion-icon name="chevron-back-outline"></ion-icon></button>
              <div className="av" style={{ background: 'var(--kz-primary-wash)', color: 'var(--kz-primary)' }}><ion-icon name="clipboard-outline"></ion-icon></div>
              <div><h3>{doc.no}</h3><p>{IV.loc(doc.loc).name} · {doc.by}</p></div>
            </div>
            <div className="mdscroll">
            <div className="op-bd" style={{ paddingBottom: 0 }}>
              <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 12 }}>
                <div className="kpi"><div className="k">Counted</div><div className="v">{stats.done}/{doc.lines.length}</div></div>
                <div className="kpi"><div className="k">Off by</div><div className="v" style={{ color: stats.off ? '#a3761c' : 'var(--kz-ink)' }}>{stats.off}</div></div>
                <div className="kpi"><div className="k">Value</div><div className="v" style={{ color: stats.var < 0 ? 'var(--kz-discount)' : 'var(--kz-success)' }}>{money(stats.var)}</div></div>
              </div>
            </div>
            <div>
              <div className="ln" style={{ background: 'var(--kz-surface-2)', font: '600 10.5px var(--kz-font-sans)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--kz-muted-3)' }}>
                <div>Item</div><div className="r ln-exp">Expected</div><div className="r">Counted</div><div className="r">Variance</div>
              </div>
              {doc.lines.map((l) => {
                const it = IV.item(l.id), c = val(l), d = c === null || c === undefined ? null : c - l.exp;
                const hide = doc.blind && doc.status === 'open';
                return (
                  <div className="ln" key={l.id}>
                    <div><div className="ln__n">{it.name}</div><div className="ln__s">{it.sku}</div></div>
                    <div className="r ln-exp" style={{ color: 'var(--kz-muted-2)' }}>{hide ? '··' : l.exp}</div>
                    <div><input className={'numin' + (d && !hide ? (Math.abs(d * it.cost) > 20 ? ' badv' : ' warnv') : '')} disabled={posted}
                      value={c === null || c === undefined ? '' : c} placeholder="—" onChange={(e) => setVal(l, e.target.value)} /></div>
                    <div className={'varn ' + (d === null ? 'zero' : d > 0 ? 'pos' : d < 0 ? 'neg' : 'zero')}>
                      {d === null || hide ? '—' : (d > 0 ? '+' : '') + d}
                      <div className="ln__s" style={{ textAlign: 'right' }}>{d && !hide ? money(d * it.cost) : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="op-bd">
              {posted
                ? <div className="hint"><ion-icon name="checkmark-done-outline"></ion-icon>
                    <span>Posted {doc.postedAt || doc.at}. The movements are in the ledger — a mistake is corrected with a new adjustment, never by editing this count.</span></div>
                : <div className="hint"><ion-icon name="alert-circle-outline"></ion-icon>
                    <span>Posting writes one <b>count</b> movement per line that differs, and books the value difference to shrinkage.</span></div>}
            </div>
            </div>
            <div className="mdfoot">
              <button className="btn" disabled={posted} onClick={() => window.IVS.saveCount(doc.id, counted)}>Save draft</button>
              <button className="btn primary" disabled={posted || stats.pending > 0}
                onClick={() => window.IVS.postCount(doc.id, counted)}>
                <ion-icon name="checkmark-done-outline"></ion-icon>
                {posted ? 'Posted' : stats.pending ? stats.pending + ' left' : 'Post count'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= TRANSFERS ================= */
function TransfersView() {
  const [selId, setSelId] = useState('t1');
  const [pushed, setPushed] = useState(false);
  const doc = IV_TRANSFERS.find((t) => t.id === selId);
  const tone = { draft: 'low', 'in-transit': 'watch', received: 'ok' };
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Transfers</h2><p>Stock in motion between locations</p></div>
        <div className="sp"></div>
        <button className="btn primary"><ion-icon name="add-outline"></ion-icon>New transfer</button>
      </div>
      <div className="mdgrid wide">
        <div className="card" style={{ padding: 0 }}>
          {IV_TRANSFERS.map((t) => (
            <button className={'doc' + (selId === t.id ? ' on' : '')} key={t.id} onClick={() => { setSelId(t.id); setPushed(true); }}>
              <div className="op-ic"><ion-icon name="git-compare-outline"></ion-icon></div>
              <div>
                <div className="doc__no">{t.no}</div>
                <div className="doc__m">{IV.loc(t.from).name} → {IV.loc(t.to).name} · {t.lines.length} lines</div>
              </div>
              <div className="sp"></div>
              <Risk tone={t.status === 'received' ? 'low' : t.status === 'in-transit' ? 'watch' : 'low'}>
                {t.status === 'in-transit' ? 'In transit' : t.status}</Risk>
            </button>
          ))}
        </div>
        {doc && (
          <div className={'mdpane' + (pushed ? ' pushed' : '')}>
            <div className="mdpane__hd">
              <button className="icbtn backbtn" onClick={() => setPushed(false)}><ion-icon name="chevron-back-outline"></ion-icon></button>
              <div className="av" style={{ background: 'var(--kz-info-wash)', color: '#3b6cbb' }}><ion-icon name="git-compare-outline"></ion-icon></div>
              <div><h3>{doc.no}</h3><p>{IV.loc(doc.from).name} → {IV.loc(doc.to).name}</p></div>
            </div>
            <div className="mdbd">
              <KV k="Sent" v={doc.sent} /><KV k="Expected" v={doc.eta} /><KV k="Raised by" v={doc.by} />
              <div className="grp">
                <span className="grp__t">Lines</span>
                {doc.lines.map((l) => {
                  const it = IV.item(l.id);
                  return (
                    <div className="rcp" key={l.id}>
                      <div className="rcp__ic" style={{ background: it.tint.bg, color: it.tint.fg }}><ion-icon name={it.icon}></ion-icon></div>
                      <div><div className="nm">{it.name}</div><div className="ds">{it.sku}</div></div>
                      <div className="sp"></div><span className="qt">{qtyFmt(l.qty, it.unit)}</span>
                    </div>
                  );
                })}
              </div>
              {doc.status === 'in-transit' && <div className="hint"><ion-icon name="airplane-outline"></ion-icon>
                <span>Quantities have left <b>{IV.loc(doc.from).name}</b> but are not yet on hand at {IV.loc(doc.to).name}. In-transit stock is owned, visible, and not sellable.</span></div>}
            </div>
            <div className="mdfoot">
              <button className="btn">Print list</button>
              <button className="btn primary" disabled={doc.status === 'received'}>
                <ion-icon name="checkmark-outline"></ion-icon>{doc.status === 'draft' ? 'Send' : 'Receive'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { StockView, AdjustSheet, CountsView, TransfersView });
