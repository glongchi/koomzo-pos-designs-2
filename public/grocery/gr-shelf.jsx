/* Koomzo Grocery — the shelf half: dates and waste, labels, gap ordering, promotions. */

function DatesView({ api }) {
  const [tab, setTab] = useState('due');
  const all = api.dated.slice().sort((a, b) => a.days - b.days);
  const due = all.filter((l) => l.days <= 2);
  const short = tab === 'due' ? due : all;
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Dates</h2><p>{due.length} lots to clear today · {all.length - due.length} further out · {api.waste.length} written off this week</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={() => api.toast('Reduction labels queued · 4 to print at the shelf')}>
          <ion-icon name="print-outline"></ion-icon>Print reductions</button>
      </div>
      <HtSegLite value={tab} onChange={setTab} options={[
        { v:'due', label:'Due today', n: due.length },
        { v:'all', label:'All dated', n: all.length },
        { v:'waste', label:'Written off', n: api.waste.length },
      ]} />

      {tab !== 'waste' && (
        <div className="grlist">
          {short.map((l) => {
            const it = itemOf(l.item);
            return (
              <div className={'grrow' + (l.days <= 1 ? ' urgent' : '')} key={l.id}>
                <div className={'grdays' + (l.days === 0 ? ' d0' : l.days === 1 ? ' d1' : '')}>
                  {l.days === 0 ? 'Today' : l.days === 1 ? '1 day' : l.days + ' days'}</div>
                <div className="grrow__ic" style={{ background: it.tint + '1a', color: it.tint }}><ion-icon name={it.icon}></ion-icon></div>
                <div className="grrow__b">
                  <div className="grrow__n">{it.name}</div>
                  <div className="grrow__m"><span>Lot {l.lot}</span><span>·</span><span>{l.qty} on the shelf</span><span>·</span><span>Aisle {it.loc}</span>
                    {l.markdown && <span className="badge wrn">Reduced to {xaf(l.markdown)}</span>}</div>
                </div>
                <div className="grrow__v">{it.sold === 'weight' ? xaf(it.perKg) + '/kg' : xaf(it.price)}</div>
                {!l.markdown && <button className="sbtn pri" onClick={() => api.markdown(l)}>Reduce</button>}
                <button className="sbtn" onClick={() => api.writeOff(l)}>Write off</button>
              </div>
            );
          })}
          {!short.length && <div className="emptybox">{tab === 'due' ? 'Nothing due today. Rare and welcome.' : 'No dated lots on the shelf.'}</div>}
        </div>
      )}

      {tab === 'waste' && (
        <div className="grlist">
          {api.waste.map((w) => {
            const it = itemOf(w.item);
            return (
              <div className="grrow" key={w.id}>
                <div className="grrow__ic" style={{ background: it.tint + '1a', color: it.tint }}><ion-icon name={it.icon}></ion-icon></div>
                <div className="grrow__b">
                  <div className="grrow__n">{it.name} · {w.qty}</div>
                  <div className="grrow__m"><span className="tag">{w.reason}</span><span>{w.at}</span><span>·</span><span>{grUser(w.by).first}</span></div>
                </div>
                <div className="grrow__v">{xaf(w.cost)}</div>
              </div>
            );
          })}
          <div className="grtot grand" style={{ padding: '12px 15px' }}>
            <span>Shrinkage this week</span><div className="sp"></div><b>{xaf(api.waste.reduce((s, w) => s + w.cost, 0))}</b></div>
        </div>
      )}
      <div className="note info" style={{ marginTop: 14 }}><ion-icon name="information-circle-outline"></ion-icon>
        A write-off is a stock movement with a reason and a snapshotted cost, so shrinkage is measured rather than inferred from a count.</div>
    </div>
  );
}

function LabelsView({ api }) {
  const [sel, setSel] = useState(() => api.labels.map((l) => l.item));
  const on = (id) => sel.indexOf(id) > -1;
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Shelf labels</h2><p>{api.labels.length} waiting · an unprinted label is a mispriced shelf</p></div>
        <div className="sp"></div>
        <button className="btn primary" disabled={!sel.length} onClick={() => api.printLabels(sel)}>
          <ion-icon name="print-outline"></ion-icon>Print {sel.length}</button>
      </div>
      <div className="grlabels">
        {api.labels.map((l) => {
          const it = itemOf(l.item);
          return (
            <button key={l.item + l.at} className="grlabel" style={{ opacity: on(l.item) ? 1 : .45, borderStyle: on(l.item) ? 'solid' : 'dashed' }}
              onClick={() => setSel((c) => on(l.item) ? c.filter((x) => x !== l.item) : [...c, l.item])}>
              <div className="m">{l.reason}</div>
              <div className="n">{it.name}</div>
              <div className="p">{xaf(l.to)}{l.from !== l.to && <s>{xaf(l.from)}</s>}</div>
              <div className="m">Aisle {it.loc} · {it.sold === 'weight' ? 'per kg' : 'each'}</div>
            </button>
          );
        })}
        {!api.labels.length && <div className="emptybox">The shelf agrees with the till.</div>}
      </div>
    </div>
  );
}

function GapsView({ api }) {
  const [order, setOrder] = useState(() => Object.fromEntries(GR.gaps.map((g) => [g.item, g.sug])));
  const lines = GR.gaps.filter((g) => order[g.item] > 0);
  const value = lines.reduce((s, g) => { const it = itemOf(g.item); return s + order[g.item] * Math.round((it.price || it.perKg) * 0.72); }, 0);
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Shelf gaps</h2><p>Walk the aisle, set what is missing · {lines.length} lines · about {xaf(value)}</p></div>
        <div className="sp"></div>
        <button className="btn primary" disabled={!lines.length} onClick={() => api.sendOrder(lines.length, value)}>
          <ion-icon name="paper-plane-outline"></ion-icon>Send to suppliers</button>
      </div>
      <div className="grlist">
        {GR.gaps.map((g) => {
          const it = itemOf(g.item);
          return (
            <div className="grrow" key={g.item}>
              <div className="grrow__ic" style={{ background: it.tint + '1a', color: it.tint }}><ion-icon name={it.icon}></ion-icon></div>
              <div className="grrow__b">
                <div className="grrow__n">{it.name}</div>
                <div className="grrow__m"><span>Aisle {g.shelf}</span><span>·</span><span>{g.onHand} of {g.par} par</span><span>·</span><span>{g.sup}</span></div>
                <div className="pbar" style={{ marginTop: 7, maxWidth: 220 }}><i style={{ width: Math.min(100, (g.onHand / g.par) * 100) + '%' }}></i></div>
              </div>
              <div className="grqty">
                <button onClick={() => setOrder((c) => ({ ...c, [g.item]: Math.max(0, c[g.item] - 6) }))}><ion-icon name="remove-outline"></ion-icon></button>
                <b>{order[g.item]}</b>
                <button onClick={() => setOrder((c) => ({ ...c, [g.item]: c[g.item] + 6 }))}><ion-icon name="add-outline"></ion-icon></button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="note info" style={{ marginTop: 14 }}><ion-icon name="information-circle-outline"></ion-icon>
        Sending turns this into an ordinary purchase order in Inventory. There is no second ordering pipeline.</div>
    </div>
  );
}

function PromosView({ api }) {
  const hour = new Date().getHours();
  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Offers</h2><p>{GR.promos.length} live · priced at tender, never typed by the cashier</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={() => api.toast('Offer builder · pick items, trigger and reward')}>
          <ion-icon name="add-circle-outline"></ion-icon>New offer</button>
      </div>
      <div className="grlist">
        {GR.promos.map((p) => {
          const live = p.kind !== 'timed' || hour >= p.from;
          return (
            <div className="grrow" key={p.id}>
              <div className="grrow__ic" style={{ background:'var(--kz-primary-wash)', color:'var(--kz-primary)' }}><ion-icon name="pricetags-outline"></ion-icon></div>
              <div className="grrow__b">
                <div className="grrow__n">{p.label}</div>
                <div className="grrow__m">
                  <span className="tag">{p.kind === 'multibuy' ? 'Multibuy' : p.kind === 'mix' ? 'Mix & match' : 'Timed'}</span>
                  <span>{p.items.map((id) => itemOf(id).name).join(', ')}</span>
                  <span>·</span><span>ends {p.ends}</span>
                </div>
              </div>
              <span className={'badge ' + (live ? 'ok' : '')}>{live ? 'Live' : 'From ' + p.from + ':00'}</span>
            </div>
          );
        })}
      </div>
      <div className="note info" style={{ marginTop: 14 }}><ion-icon name="information-circle-outline"></ion-icon>
        One offer applies per line unless it is marked stackable, and the applied offer is stored on the line — so a receipt can always explain its own price.
      </div>
    </div>
  );
}

function HtSegLite({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}{o.n != null && <i style={{ marginLeft: 5 }}>{o.n}</i>}</button>)}
    </div>
  );
}

Object.assign(window, { DatesView, LabelsView, GapsView, PromosView, HtSegLite });
