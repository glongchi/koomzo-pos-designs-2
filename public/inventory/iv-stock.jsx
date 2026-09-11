/* Koomzo Inventory — Stock (on hand + movements + adjust), Counts, Transfers. */

function StockView({ loc, caps, onAdjust }) {
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
        <button className="btn"><ion-icon name="download-outline"></ion-icon>Receive</button>
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
          <button className="btn"><ion-icon name="download-outline"></ion-icon>Export</button>
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
function AdjustSheet({ loc, onClose }) {
  const [itemId, setItemId] = useState('i4');
  const [reason, setReason] = useState('recount');
  const [delta, setDelta] = useState(-1);
  const [note, setNote] = useState('');
  const item = IV.item(itemId);
  const at = loc === 'all' ? 'dt' : loc;
  const before = item.stock[at] || 0;
  const after = before + delta;
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
            <select className="sel" style={{ width: '100%', maxWidth: 'none', height: 46 }} value={itemId} onChange={(e) => setItemId(e.target.value)}>
              {IV_ITEMS.filter((i) => i.stock).map((i) => <option key={i.id} value={i.id}>{i.name} · {i.sku}</option>)}
            </select>
          </div>
          <div>
            <span className="lbl">Reason</span>
            <div className="opts">
              {IV_REASONS.map((r) => (
                <button key={r.id} className={'opt' + (reason === r.id ? ' on' : '')} style={{ height: 38, fontSize: 12.5 }}
                  onClick={() => { setReason(r.id); if (r.dir === 'out' && delta > 0) setDelta(-delta); if (r.dir === 'in' && delta < 0) setDelta(-delta); }}>
                  {r.label}</button>
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
                <span className="k">{before} →</span>
                <span className="v" style={{ fontSize: 20, color: after < 0 ? 'var(--kz-discount)' : 'var(--kz-ink)' }}>{after}</span>
              </div>
            </div>
          </div>
          <Field label="Note" placeholder="What happened" value={note} onChange={setNote} />
          <div className="hint"><ion-icon name="cash-outline"></ion-icon>
            <span>Cost impact <b>{money(Math.abs(delta) * (item.cost || 0))}</b> — posted to {IV_REASONS.find((r) => r.id === reason).label.toLowerCase()}.</span></div>
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={onClose}><ion-icon name="checkmark-outline"></ion-icon>Post adjustment</button>
        </div>
      </div>
    </div>
  );
}

/* ================= COUNTS ================= */
function CountsView({ loc }) {
  const [selId, setSelId] = useState('c1');
  const [counted, setCounted] = useState({});
  const list = IV_COUNTS;
  const doc = list.find((c) => c.id === selId);
  const val = (l) => counted[doc.id + l.id] !== undefined ? counted[doc.id + l.id] : l.cnt;
  const setVal = (l, v) => setCounted((c) => ({ ...c, [doc.id + l.id]: v === '' ? null : +v }));

  const stats = doc ? doc.lines.reduce((a, l) => {
    const c = val(l);
    if (c === null) return { ...a, pending: a.pending + 1 };
    const d = c - l.exp;
    return { ...a, done: a.done + 1, var: a.var + d * (IV.item(l.id).cost || 0), off: a.off + (d !== 0 ? 1 : 0) };
  }, { done: 0, pending: 0, var: 0, off: 0 }) : null;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Stock counts</h2><p>Cycle counts keep the number honest without closing the shop</p></div>
        <div className="sp"></div>
        <button className="btn"><ion-icon name="repeat-outline"></ion-icon>Schedule cycle</button>
        <button className="btn primary"><ion-icon name="add-outline"></ion-icon>New count</button>
      </div>

      <div className="mdgrid wide">
        <div className="card" style={{ padding: 0 }}>
          {list.map((c) => (
            <button className={'doc' + (selId === c.id ? ' on' : '')} key={c.id} onClick={() => setSelId(c.id)}>
              <div className="op-ic"><ion-icon name="clipboard-outline"></ion-icon></div>
              <div>
                <div className="doc__no">{c.no}</div>
                <div className="doc__m">{IV.loc(c.loc).name} · {c.scope}</div>
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
          <div className="mdpane">
            <div className="mdpane__hd">
              <div className="av" style={{ background: 'var(--kz-primary-wash)', color: 'var(--kz-primary)' }}><ion-icon name="clipboard-outline"></ion-icon></div>
              <div><h3>{doc.no}</h3><p>{IV.loc(doc.loc).name} · {doc.by}</p></div>
            </div>
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
                const it = IV.item(l.id), c = val(l), d = c === null ? null : c - l.exp;
                return (
                  <div className="ln" key={l.id}>
                    <div><div className="ln__n">{it.name}</div><div className="ln__s">{it.sku}</div></div>
                    <div className="r ln-exp" style={{ color: 'var(--kz-muted-2)' }}>{l.exp}</div>
                    <div><input className={'numin' + (d ? (Math.abs(d * it.cost) > 20 ? ' badv' : ' warnv') : '')}
                      value={c === null ? '' : c} placeholder="—" onChange={(e) => setVal(l, e.target.value)} /></div>
                    <div className={'varn ' + (d === null ? 'zero' : d > 0 ? 'pos' : d < 0 ? 'neg' : 'zero')}>
                      {d === null ? '—' : (d > 0 ? '+' : '') + d}
                      <div className="ln__s" style={{ textAlign: 'right' }}>{d ? money(d * it.cost) : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="op-bd">
              <div className="hint"><ion-icon name="alert-circle-outline"></ion-icon>
                <span>Posting writes one <b>count</b> movement per line that differs, and books the value difference to shrinkage.</span></div>
            </div>
            <div className="mdfoot">
              <button className="btn">Save draft</button>
              <button className="btn primary" disabled={stats.pending > 0}>
                <ion-icon name="checkmark-done-outline"></ion-icon>{stats.pending ? stats.pending + ' left' : 'Post count'}</button>
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
            <button className={'doc' + (selId === t.id ? ' on' : '')} key={t.id} onClick={() => setSelId(t.id)}>
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
          <div className="mdpane">
            <div className="mdpane__hd">
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
