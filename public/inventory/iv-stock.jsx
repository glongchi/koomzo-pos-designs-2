/* Koomzo Inventory — Stock: the ledger, on hand, in transit and counts.

   One screen, because the four verbs an operator uses all post into the same ledger and
   they should see the consequence of the button without navigating. The verbs are still
   four plainly-named buttons — they just live beside the result rather than in four
   separate corners of the app. */

function StockView({ loc, caps, onOpen }) {
  const tabs = [['ledger', 'Ledger'], ['hand', 'On hand']]
    .concat(caps.transfers ? [['transit', 'In transit', (IV_TRANSFERS || []).filter((t) => t.status === 'in-transit').length]] : [])
    .concat(caps.counts ? [['counts', 'Counts', (IV_COUNTS || []).filter((c) => c.status !== 'posted').length]] : []);
  const [tab, setTab] = useState('ledger');
  const [q, setQ] = useState('');
  const [kindF, setKindF] = useState('all');
  const [selNo, setSelNo] = useState(null);
  const [pushed, setPushed] = useState(false);
  useIVRev();

  const stocked = IV_ITEMS.filter((i) => i.stock && (!q || (i.name + i.sku).toLowerCase().includes(q.toLowerCase())));
  const locs = caps.locations ? IV_LOCATIONS : IV_LOCATIONS.filter((l) => l.id === 'dt');
  const docs = IV.ledger(loc).filter((d) => kindF === 'all' || d.kind === kindF);
  const sel = docs.find((d) => d.no === selNo) || docs[0] || null;

  /* a post selects its own document: the operator submits and the thing they just wrote
     is already open, named and at the top. A button whose result you must go looking for
     is a button people stop trusting. */
  const posted = (no) => { setTab('ledger'); setKindF('all'); setSelNo(no); setPushed(true); };
  const act = (kind) => onOpen('move', { mkind: kind, onPosted: posted });

  const verbs = MOVE_KINDS.filter(([id]) => id !== 'move' || caps.transfers);

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Stock</h2><p>{caps.locations ? locs.length + ' locations' : 'Single location'} · {stocked.length} tracked items</p></div>
        <div className="sp"></div>
        <div className="mvacts">
          {verbs.map(([id, label, icon]) => (
            <button key={id} className={'mvact ' + id} onClick={() => act(id)}>
              <ion-icon name={icon}></ion-icon>{label}
            </button>
          ))}
          {caps.counts && <button className="mvact count" onClick={() => onOpen('newCount')}>
            <ion-icon name="clipboard-outline"></ion-icon>Count</button>}
        </div>
      </div>

      <Seg value={tab} onChange={setTab} tabs={tabs} />

      {tab === 'ledger' && <>
        <div className="fbar">
          <select className="sel" value={kindF} onChange={(e) => setKindF(e.target.value)}>
            <option value="all">Everything</option>
            {Object.keys(IV_DOC_KIND).map((x) => <option key={x} value={x}>{IV_DOC_KIND[x].label}</option>)}
          </select>
          <div className="sp" style={{ flex: 1 }}></div>
          <button className="btn" onClick={() => {
            const head = 'document,when,type,item,sku,location,before,change,after,reason,reference,value\n';
            const body = docs.map((d) => d.lines.map((m) => {
              const it = IV.item(m.item);
              return [d.no, m.at, IV_DOC_KIND[d.kind].label, it.name, it.sku, IV.loc(m.loc).code,
                m.before != null ? m.before : '', m.qty, m.before != null ? m.before + m.qty : '',
                m.reason || '', '"' + (m.ref || '') + '"', m.cost || 0].join(',');
            }).join('\n')).join('\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([head + body], { type: 'text/csv' }));
            a.download = 'ledger-' + (loc === 'all' ? 'all' : IV.loc(loc).code) + '.csv';
            a.click(); URL.revokeObjectURL(a.href);
            window.IVS.say(docs.length + ' documents exported');
          }}><ion-icon name="download-outline"></ion-icon>Export</button>
        </div>

        {docs.length ? (
          <div className="mdgrid wide">
            <div className="card lgrlist" style={{ padding: 0 }}>
              {docs.map((d) => (
                <LedgerRow key={d.no} d={d} on={sel && sel.no === d.no}
                  onClick={() => { setSelNo(d.no); setPushed(true); }} />
              ))}
            </div>
            {sel && <LedgerPane d={sel} pushed={pushed} onBack={() => setPushed(false)} />}
          </div>
        ) : <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="swap-vertical-outline" title="Nothing posted yet"
            sub="Stock in, stock out, move or adjust — every posting lands here." />
        </div>}
      </>}

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
          <span>Quantities are read-only here. Every change goes through <b>stock in, stock out, a move, an adjustment or a count</b> so the ledger stays complete.</span></div>
      </>}

      {tab === 'transit' && <div className="ivsub"><TransfersView caps={caps} loc={loc} onOpen={onOpen} /></div>}
      {tab === 'counts' && <div className="ivsub"><CountsView loc={loc} caps={caps} onOpen={onOpen} /></div>}
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
function TransfersView({ caps, loc, onOpen }) {
  const list = IV_TRANSFERS;
  const [selId, setSelId] = useState(list[0] ? list[0].id : null);
  const [pushed, setPushed] = useState(false);
  /* arriving quantities, keyed per transfer+line like PoPane — one concept for "what
     physically turned up" across every receiving surface in the module */
  const [arr, setArr] = useState({});
  const doc = list.find((t) => t.id === selId);
  /* status is field data; the chip is UI copy. Every value gets a label so no chip ever
     renders a raw enum — the defect the removed `in-transit`-only lookup produced. */
  const TR_STATUS = { draft: { label: 'Draft', tone: 'low' }, 'in-transit': { label: 'In transit', tone: 'watch' }, received: { label: 'Received', tone: 'low' } };
  const get = (l) => arr[selId + l.id] !== undefined ? arr[selId + l.id] : l.qty - l.recv;
  const setQ = (l, v) => setArr((c) => ({ ...c, [selId + l.id]: Math.max(0, Math.min(l.qty - l.recv, +v || 0)) }));
  const arriving = doc ? doc.lines.map((l) => ({ id: l.id, qty: get(l) })).filter((l) => l.qty > 0) : [];
  const inTransitValue = doc ? doc.lines.reduce((a, l) => a + (l.qty - l.recv) * (IV.item(l.id).cost || 0), 0) : 0;
  const shortAfter = doc ? doc.lines.reduce((a, l) => a + Math.max(0, (l.qty - l.recv) - get(l)), 0) : 0;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Transfers</h2><p>Stock in motion between locations</p></div>
        <div className="sp"></div>
        <button className="btn primary" onClick={() => onOpen('newTransfer', { onCreated: (id) => { setSelId(id); setPushed(true); } })}>
          <ion-icon name="add-outline"></ion-icon>New transfer</button>
      </div>
      <div className="mdgrid wide">
        <div className="card transflist" style={{ padding: 0 }}>
          {list.map((t) => (
            <button className={'doc' + (selId === t.id ? ' on' : '')} key={t.id} onClick={() => { setSelId(t.id); setPushed(true); }}>
              <div className="op-ic"><ion-icon name="git-compare-outline"></ion-icon></div>
              <div>
                <div className="doc__no">{t.no}</div>
                <div className="doc__m">{IV.loc(t.from).name} → {IV.loc(t.to).name} · {t.lines.length} line{t.lines.length === 1 ? '' : 's'}
                  {t.status === 'in-transit' && t.lines.some((l) => l.recv > 0) ? ' · part received' : ''}</div>
              </div>
              <div className="sp"></div>
              <Risk tone={TR_STATUS[t.status].tone}>{TR_STATUS[t.status].label}</Risk>
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
              {doc.status !== 'draft' && <KV k="Still in transit" v={money(inTransitValue)} />}
              <div className="grp">
                <span className="grp__t">{doc.status === 'in-transit' ? 'Lines · type what arrived' : 'Lines'}</span>
                {doc.status === 'in-transit' ? (
                  <div className="lned">
                    <div className="lnh rcv"><div>Line</div><div className="r">Sent</div><div className="r">In</div><div className="r">Arriving</div><div className="r">Value</div></div>
                    {doc.lines.map((l) => {
                      const it = IV.item(l.id), a = get(l), rem = l.qty - l.recv;
                      return (
                        <div className="lnr rcv" key={l.id}>
                          <div><div className="ln__n">{it.name}</div><div className="ln__s">{it.sku}</div></div>
                          <div className="r ln__s">{qtyFmt(l.qty)}</div>
                          <div className="r ln__s">{l.recv || '—'}</div>
                          <div><input className={'numin' + (a < rem ? ' warnv' : '')} value={a} onChange={(e) => setQ(l, e.target.value)} /></div>
                          <div className="r">{money(a * (it.cost || 0))}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : doc.lines.map((l) => {
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
              {doc.status === 'draft' && <div className="hint"><ion-icon name="document-outline"></ion-icon>
                <span>Nothing is reserved. Stock stays sellable at <b>{IV.loc(doc.from).name}</b> until this is sent.</span></div>}
              {doc.status === 'in-transit' && <div className="hint"><ion-icon name="airplane-outline"></ion-icon>
                <span>Quantities have left <b>{IV.loc(doc.from).name}</b> but are not yet on hand at {IV.loc(doc.to).name}. In-transit stock is owned, visible, and not sellable.</span></div>}
              {doc.status === 'in-transit' && shortAfter > 0 && <div className="hint warn"><ion-icon name="alert-circle-outline"></ion-icon>
                <span>Receiving less than was sent leaves <b>{shortAfter} unit{shortAfter === 1 ? '' : 's'}</b> in transit against {doc.no}. That is the honest state — do not raise a second transfer for a short arrival.</span></div>}
              {doc.status === 'received' && <div className="hint"><ion-icon name="checkmark-done-outline"></ion-icon>
                <span>Complete. Both postings are in the ledger — out of {IV.loc(doc.from).name}, on hand at {IV.loc(doc.to).name}.</span></div>}
            </div>
            <div className="mdfoot">
              <button className="btn" onClick={() => onOpen('printTransfer', { tr: doc })}>
                <ion-icon name="print-outline"></ion-icon>Print list</button>
              {doc.status === 'draft'
                ? <button className="btn primary" onClick={() => window.IVS.sendTransfer(doc.id)}>
                    <ion-icon name="airplane-outline"></ion-icon>Send</button>
                : <button className="btn primary" disabled={doc.status === 'received' || !arriving.length}
                    onClick={() => { window.IVS.receiveTransfer(doc.id, arriving); setArr({}); }}>
                    <ion-icon name="download-outline"></ion-icon>
                    {doc.status === 'received' ? 'Received' : !arriving.length ? 'Nothing arriving' : 'Receive ' + arriving.length + ' line' + (arriving.length > 1 ? 's' : '')}</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { StockView, CountsView, TransfersView });
