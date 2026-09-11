/* Koomzo Inventory — Overview + Items (the two screens Lite mode keeps). */

function Overview({ loc, caps, onGo, onOpenItem }) {
  const items = IV_ITEMS;
  const stocked = items.filter((i) => i.stock);
  const value = stocked.reduce((s, i) => s + IV.value(i, loc), 0);
  const low = stocked.filter((i) => IV.status(i, loc) === 'low');
  const out = stocked.filter((i) => IV.status(i, loc) === 'out');
  const incoming = IV_POS.filter((p) => p.status === 'sent' || p.status === 'partial')
    .reduce((s, p) => s + p.lines.reduce((a, l) => a + (l.qty - l.recv) * l.cost, 0), 0);
  const shrink = IV_SHRINK.reduce((s, r) => s + r.v, 0);
  const services = items.filter((i) => i.type === 'service').length;

  const kpis = [
    { k: 'Stock value', v: money(value), go: 'reports', cap: 'valuation' },
    { k: 'Items tracked', v: stocked.length, sub: services + ' services' },
    { k: 'Low stock', v: low.length, tone: low.length ? 'warn' : null, go: 'items' },
    { k: 'Out of stock', v: out.length, tone: out.length ? 'bad' : null, go: 'items' },
    { k: 'On order', v: money(incoming), go: 'purchase', cap: 'purchase' },
    { k: 'Shrinkage · MTD', v: money(shrink), tone: 'warn', go: 'reports', cap: 'valuation' },
  ].filter((k) => !k.cap || caps[k.cap]);

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Overview</h2><p>{loc === 'all' ? 'All locations' : IV.loc(loc).name} · live position</p></div>
        <div className="sp"></div>
        {caps.purchase && <button className="btn" onClick={() => onGo('purchase')}><ion-icon name="receipt-outline"></ion-icon>New order</button>}
        {caps.counts && <button className="btn primary desk-only" onClick={() => onGo('counts')}><ion-icon name="clipboard-outline"></ion-icon>Start count</button>}
      </div>

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        {kpis.map((k) => (
          <div className="kpi" key={k.k} onClick={k.go ? () => onGo(k.go) : null} style={{ cursor: k.go ? 'pointer' : 'default' }}>
            <div className="k">{k.k}</div>
            <div className="v" style={{ color: k.tone === 'bad' ? 'var(--kz-discount)' : k.tone === 'warn' ? '#a3761c' : 'var(--kz-ink)' }}>{k.v}</div>
            {k.sub && <div className="op-d">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="op2">
        <div className="op-stack">
          <div className="card" style={{ padding: 0 }}>
            <div className="op-head">
              <div><h3>Needs attention</h3><p>Below par at {loc === 'all' ? 'any location' : IV.loc(loc).name}</p></div>
              <div className="sp"></div>
              {caps.reorder && <button className="btn" onClick={() => onGo('purchase')}><ion-icon name="sparkles-outline"></ion-icon>Suggest order</button>}
            </div>
            {[...out, ...low].slice(0, 6).map((i) => (
              <button className="doc" key={i.id} onClick={() => onOpenItem(i.id)}>
                <Av item={i} />
                <div>
                  <div className="doc__no" style={{ fontFamily: 'var(--kz-font-sans)' }}>{i.name}</div>
                  <div className="doc__m">{i.sku} · par {i.par} · reorder at {i.reorder}</div>
                </div>
                <div className="sp"></div>
                <StockPill item={i} loc={loc} />
              </button>
            ))}
            {!out.length && !low.length && <EmptyState icon="checkmark-circle-outline" title="Everything above par" sub="No item is at or below its reorder point." />}
          </div>

          {caps.lots && (
            <div className="card" style={{ padding: 0 }}>
              <div className="op-head"><div><h3>Expiring batches</h3><p>Next 90 days</p></div></div>
              <div className="op-bd" style={{ paddingTop: 4 }}>
                {IV_LOTS.filter((l) => l.soon).map((l) => (
                  <div className="op-row" key={l.lot}>
                    <div className="op-ic"><ion-icon name="calendar-outline"></ion-icon></div>
                    <div><div className="op-k">{IV.item(l.item).name}</div><div className="op-d">Lot {l.lot} · {IV.loc(l.loc).name}</div></div>
                    <div className="sp"></div>
                    <div className="op-v small">{l.qty}</div>
                    <Risk tone="watch">{l.exp}</Risk>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="op-stack">
          <div className="card mvcard" style={{ padding: 0 }}>
            <div className="op-head">
              <div><h3>Recent movements</h3><p>Nothing changes stock without a row here</p></div>
              <div className="sp"></div>
              <button className="btn desk-only" onClick={() => onGo('stock')}>All</button>
            </div>
            {IV_MOVES.slice(0, 7).map((m) => <MoveRow key={m.id} m={m} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveRow({ m }) {
  const k = IV_MOVE_KIND[m.kind], it = IV.item(m.item);
  return (
    <div className="mv">
      <div className={'mv__ic ' + k.tone}><ion-icon name={k.icon}></ion-icon></div>
      <div className="mv__b">
        <div className="mv__n">{it.name}</div>
        <div className="mv__m"><span>{k.label}</span><span>·</span><span>{IV.loc(m.loc).code}</span><span>·</span><span>{m.ref}</span></div>
      </div>
      <div className={'mv__q ' + (m.qty > 0 ? 'pos' : 'neg')}>{m.qty > 0 ? '+' : '−'}{qtyFmt(Math.abs(m.qty), it.unit)}</div>
      <div className="mv__t">{m.at}</div>
    </div>
  );
}

/* ================= ITEMS ================= */
const TYPE_FILTERS = [['all', 'All'], ['product', 'Products'], ['service', 'Services'], ['composite', 'Composites'], ['nonstock', 'Non-stock']];

function ItemsView({ loc, caps, selId, onSelect, items, onPatch }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [cat, setCat] = useState('all');
  const [stockF, setStockF] = useState('all');
  const [sort, setSort] = useState({ k: 'name', d: 1 });
  const [sel, setSel] = useState(new Set());

  const rows = useMemo(() => {
    let list = items.filter((i) => {
      if (type !== 'all' && i.type !== type) return false;
      if (cat !== 'all' && i.cat !== cat) return false;
      if (stockF !== 'all' && IV.status(i, loc) !== stockF) return false;
      const s = q.trim().toLowerCase();
      return !s || (i.name + ' ' + i.sku + ' ' + (i.barcode || '') + ' ' + (i.brand || '')).toLowerCase().includes(s);
    });
    return [...list].sort((a, b) => {
      if (sort.k === 'stock') return ((IV.onHand(a, loc) ?? -1) - (IV.onHand(b, loc) ?? -1)) * sort.d;
      if (sort.k === 'price') return (a.price - b.price) * sort.d;
      if (sort.k === 'value') return (IV.value(a, loc) - IV.value(b, loc)) * sort.d;
      return String(a.name).localeCompare(String(b.name)) * sort.d;
    });
  }, [items, q, type, cat, stockF, sort, loc]);

  const flip = (k) => setSort((s) => s.k === k ? { k, d: -s.d } : { k, d: 1 });
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const item = items.find((i) => i.id === selId);
  const shown = rows.reduce((s, i) => s + IV.value(i, loc), 0);

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Items</h2><p>{rows.length} of {items.length} · {money(shown)} at cost</p></div>
        <div className="sp"></div>
        <button className="btn"><ion-icon name="cloud-upload-outline"></ion-icon>Import</button>
        <button className="btn primary" onClick={() => onSelect('new')}><ion-icon name="add-outline"></ion-icon>New item</button>
      </div>

      <div className="fbar">
        <div className="field">
          <ion-icon name="search-outline"></ion-icon>
          <input placeholder="Name, SKU or barcode" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="sel" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPE_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="sel" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {IV_CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select className="sel" value={stockF} onChange={(e) => setStockF(e.target.value)}>
          <option value="all">Any stock level</option><option value="low">Low</option><option value="out">Out</option><option value="ok">In stock</option>
        </select>
      </div>

      {sel.size > 0 && (
        <div className="selbar">
          <span className="n">{sel.size} selected</span>
          <div className="sp"></div>
          <button className="btn" onClick={() => { sel.forEach((id) => onPatch(id, (i) => ({ pos: { ...i.pos, show: true } }))); setSel(new Set()); }}>
            <ion-icon name="eye-outline"></ion-icon>Show in POS</button>
          <button className="btn" onClick={() => { sel.forEach((id) => onPatch(id, (i) => ({ pos: { ...i.pos, show: false } }))); setSel(new Set()); }}>
            <ion-icon name="eye-off-outline"></ion-icon>Hide</button>
          {caps.purchase && <button className="btn"><ion-icon name="receipt-outline"></ion-icon>Add to order</button>}
          <button className="btn" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}

      <div className={'mdgrid' + (item ? '' : ' solo')} style={item ? null : { gridTemplateColumns: '1fr' }}>
        <div className="itbl">
          <div className="ithead">
            <div><button onClick={() => flip('name')}>Item<ion-icon name="swap-vertical-outline"></ion-icon></button></div>
            <div className="r c-stock"><button onClick={() => flip('stock')}>On hand<ion-icon name="swap-vertical-outline"></ion-icon></button></div>
            <div className="r c-cost">Cost</div>
            <div className="r c-price"><button onClick={() => flip('price')}>Price<ion-icon name="swap-vertical-outline"></ion-icon></button></div>
            <div className="r c-value"><button onClick={() => flip('value')}>Value<ion-icon name="swap-vertical-outline"></ion-icon></button></div>
            <div className="c-pos">In POS</div>
          </div>
          {rows.map((i) => (
            <button className={'itrow' + (selId === i.id ? ' on' : '')} key={i.id} onClick={() => onSelect(i.id)}>
              <div className="itcell">
                <span onClick={(e) => { e.stopPropagation(); toggle(i.id); }}
                  className="rline__box" style={{ marginTop: 0, background: sel.has(i.id) ? 'var(--kz-primary)' : '#fff', borderColor: sel.has(i.id) ? 'var(--kz-primary)' : 'var(--kz-border-strong)' }}>
                  {sel.has(i.id) && <ion-icon name="checkmark" style={{ fontSize: 14 }}></ion-icon>}
                </span>
                <Av item={i} />
                <div style={{ minWidth: 0 }}>
                  <div className="itnm">{i.name}</div>
                  <div className="itsub">
                    <span>{i.sku}</span>
                    {i.brand && <><span className="sep">·</span><span style={{ fontFamily: 'var(--kz-font-sans)' }}>{i.brand}</span></>}
                    <TypeChip item={i} />
                  </div>
                </div>
              </div>
              <div className="r c-stock"><StockPill item={i} loc={loc} /></div>
              <div className="r c-cost itnum mute">{i.cost ? money(i.cost) : '—'}</div>
              <div className="r c-price itnum">{i.price ? money(i.price) : '—'}</div>
              <div className="r c-value itnum mute">{i.stock ? money(IV.value(i, loc)) : '—'}</div>
              <div className="c-pos">
                <span className={'posdot' + (i.pos && i.pos.show ? ' on' : '')}>
                  <ion-icon name={i.pos && i.pos.show ? 'checkmark-circle' : 'ellipse-outline'}></ion-icon>
                  {i.pos && i.pos.show ? 'Yes' : 'No'}
                </span>
              </div>
            </button>
          ))}
          {!rows.length && <EmptyState icon="cube-outline" title="No items match" sub="Clear a filter or search a different SKU." />}
        </div>

        {item && <ItemPane item={item} loc={loc} caps={caps} onPatch={onPatch} onClose={() => onSelect(null)} />}
      </div>
    </div>
  );
}

/* ---------- the item pane: one object, five faces ---------- */
function ItemPane({ item, loc, caps, onPatch, onClose }) {
  const isService = item.type === 'service';
  const tabs = ['details', isService ? 'service' : 'stock', item.type === 'composite' ? 'recipe' : null, 'pos', 'history'].filter(Boolean);
  const [tab, setTab] = useState('details');
  useEffect(() => { setTab('details'); }, [item.id]);
  const set = (patch) => onPatch(item.id, () => patch);
  const setPos = (patch) => onPatch(item.id, (i) => ({ pos: { ...i.pos, ...patch } }));

  return (
    <div className="mdpane overlay">
      <div className="mdpane__hd">
        <Av item={item} />
        <div style={{ minWidth: 0 }}>
          <h3>{item.name}</h3>
          <p>{item.sku}{item.barcode ? ' · ' + item.barcode : ''}</p>
        </div>
        <div className="sp"></div>
        <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
      </div>
      <div className="mdtabs">
        {tabs.map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {{ details: 'Details', stock: 'Stock', service: 'Service', recipe: 'Recipe', pos: 'POS', history: 'History' }[t]}
          </button>
        ))}
      </div>

      <div className="mdbd">
        {tab === 'details' && <>
          <Field label="Name" value={item.name} onChange={(v) => set({ name: v })} />
          <div className="fgrid">
            <Field label="SKU" value={item.sku} onChange={(v) => set({ sku: v })} />
            <Field label="Barcode" value={item.barcode || ''} placeholder="Scan or type" onChange={(v) => set({ barcode: v })} />
          </div>
          <div className="fgrid">
            <Field label="Sell price" prefix="F" type="number" value={item.price} onChange={(v) => set({ price: v })} />
            {item.type !== 'service' && item.type !== 'nonstock' &&
              <Field label="Unit cost" prefix="F" type="number" value={item.cost} onChange={(v) => set({ cost: v })}
                hint={item.price ? 'Margin ' + Math.round((1 - item.cost / item.price) * 100) + '%' : null} />}
          </div>
          <div className="grp">
            <span className="grp__t">Type</span>
            <div className="opts">
              {[['product', 'Product'], ['service', 'Service'], ['composite', 'Composite'], ['nonstock', 'Non-stock']].map(([v, l]) => (
                <button key={v} className={'opt' + (item.type === v ? ' on' : '')} onClick={() => set({ type: v })}>{l}</button>
              ))}
            </div>
          </div>
          {item.type === 'product' && <>
            <div className="fgrid">
              <Field label="Reorder point" type="number" value={item.reorder} onChange={(v) => set({ reorder: v })} />
              <Field label="Par level" type="number" value={item.par} onChange={(v) => set({ par: v })} />
            </div>
            <div className="optrow">
              <div><div className="t">Back-bar item</div><div className="d">Consumed by services, never sold at the register.</div></div>
              <div className="sp"></div><Toggle on={!!item.backbar} onChange={() => set({ backbar: !item.backbar })} />
            </div>
            {caps.lots && <div className="optrow">
              <div><div className="t">Track batch & expiry</div><div className="d">Lot captured on receipt and at sale.</div></div>
              <div className="sp"></div><Toggle on={!!item.lot} onChange={() => set({ lot: !item.lot })} />
            </div>}
            {caps.serials && <div className="optrow">
              <div><div className="t">Track serial numbers</div><div className="d">One row per physical unit.</div></div>
              <div className="sp"></div><Toggle on={!!item.serial} onChange={() => set({ serial: !item.serial })} />
            </div>}
          </>}
          {item.note && <div className="hint"><ion-icon name="information-circle-outline"></ion-icon><span>{item.note}</span></div>}
        </>}

        {tab === 'stock' && <>
          {item.stock ? <>
            <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
              <div className="kpi"><div className="k">On hand</div><div className="v">{qtyFmt(IV.onHand(item, loc), item.unit)}</div></div>
              <div className="kpi"><div className="k">Value at cost</div><div className="v">{money(IV.value(item, loc))}</div></div>
            </div>
            <div className="grp"><span className="grp__t">By location</span><LocBars item={item} cap={caps.locations} /></div>
            <KV k="Reorder point" v={item.reorder} num />
            <KV k="Par level" v={item.par} num />
            <KV k="Supplier" v={item.supplier ? IV_SUPPLIERS.find((s) => s.id === item.supplier).name : '—'} />
            <div className="actbar">
              <button className="btn primary"><ion-icon name="create-outline"></ion-icon>Adjust</button>
              {caps.transfers && <button className="btn"><ion-icon name="git-compare-outline"></ion-icon>Transfer</button>}
            </div>
          </> : <EmptyState icon="infinite-outline" title="No stock to hold"
            sub={item.type === 'service' ? 'A service consumes time, not units — see the Service tab.' : 'Non-stock items are never counted.'} />}
        </>}

        {tab === 'service' && <ServiceTab item={item} onPatch={onPatch} />}

        {tab === 'recipe' && <>
          <div className="hint"><ion-icon name="layers-outline"></ion-icon>
            <span>Selling one <b>{item.name}</b> depletes the components below. The parent holds no stock of its own — availability is the tightest component.</span></div>
          <div>
            {item.recipe.map((r) => {
              const c = IV.item(r.id);
              return (
                <div className="rcp" key={r.id}>
                  <div className="rcp__ic" style={{ background: c.tint.bg, color: c.tint.fg }}><ion-icon name={c.icon}></ion-icon></div>
                  <div><div className="nm">{c.name}</div><div className="ds">{c.sku} · {qtyFmt(IV.onHand(c, loc), c.unit)} on hand</div></div>
                  <div className="sp"></div><span className="qt">× {r.qty}</span>
                </div>
              );
            })}
          </div>
          <KV k="Component cost" v={money(item.recipe.reduce((s, r) => s + IV.item(r.id).cost * r.qty, 0))} num />
          <KV k="Kit price" v={money(item.price)} num />
          <KV k="Buildable now" v={Math.min(...item.recipe.map((r) => Math.floor(IV.onHand(IV.item(r.id), loc) / r.qty)))} num />
        </>}

        {tab === 'pos' && <PosTab item={item} setPos={setPos} />}

        {tab === 'history' && <div style={{ margin: '-14px -16px' }}>
          {IV_MOVES.filter((m) => m.item === item.id).map((m) => <MoveRow key={m.id} m={m} />)}
          {!IV_MOVES.some((m) => m.item === item.id) && <EmptyState icon="time-outline" title="No movement yet" sub="Receipts, sales and adjustments appear here." />}
        </div>}
      </div>

      <div className="mdfoot">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary" onClick={onClose}><ion-icon name="checkmark-outline"></ion-icon>Save</button>
      </div>
    </div>
  );
}

/* ---------- service authoring ---------- */
function ServiceTab({ item, onPatch }) {
  const s = item.service;
  const setS = (patch) => onPatch(item.id, (i) => ({ service: { ...i.service, ...patch } }));
  return (
    <>
      <div className="hint pri"><ion-icon name="time-outline"></ion-icon>
        <span>A service is authored in the same catalogue as products. It carries <b>duration and staff</b> instead of stock — and may still <b>consume</b> back-bar product when performed.</span></div>
      <div className="fgrid">
        <Field label="Duration" suffix="min" type="number" value={s.duration} onChange={(v) => setS({ duration: v })} />
        <Field label="Clean-up buffer" suffix="min" type="number" value={s.buffer} onChange={(v) => setS({ buffer: v })} />
      </div>
      <div className="fgrid">
        <Field label="Price" prefix="F" type="number" value={item.price} onChange={(v) => onPatch(item.id, () => ({ price: v }))} />
        <Field label="Deposit to book" prefix="F" type="number" value={s.deposit} onChange={(v) => setS({ deposit: v })} />
      </div>
      {s.levels && <div className="grp">
        <span className="grp__t">Price by stylist level</span>
        {s.levels.map(([lvl, p]) => <KV key={lvl} k={lvl} v={money(p)} num />)}
      </div>}
      <div className="grp">
        <span className="grp__t">Who can perform it</span>
        <div className="opts">{s.staff.map((n) => <span key={n} className="opt on" style={{ height: 36, fontSize: 13 }}>{n}</span>)}
          <button className="opt" style={{ height: 36 }}><ion-icon name="add-outline"></ion-icon></button></div>
      </div>
      <KV k="Resource" v={s.room} />
      <div className="optrow">
        <div><div className="t">Bookable online</div><div className="d">Shows in the customer booking flow and kiosk.</div></div>
        <div className="sp"></div><Toggle on={s.online} onChange={() => setS({ online: !s.online })} />
      </div>
      <div className="grp">
        <span className="grp__t">Consumes on completion</span>
        {s.consumes.length ? s.consumes.map((c) => {
          const p = IV.item(c.id);
          return (
            <div className="rcp" key={c.id}>
              <div className="rcp__ic" style={{ background: p.tint.bg, color: p.tint.fg }}><ion-icon name={p.icon}></ion-icon></div>
              <div><div className="nm">{p.name}</div><div className="ds">{p.sku} · {money(p.cost)} / {p.unit}</div></div>
              <div className="sp"></div>
              <span className="qt">{c.qty ? c.qty + ' ' + p.unit : 'variable'}</span>
            </div>
          );
        }) : <div className="hint"><ion-icon name="remove-circle-outline"></ion-icon><span>Nothing. Completing this service moves no stock.</span></div>}
        <button className="btn" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}><ion-icon name="add-outline"></ion-icon>Add back-bar item</button>
      </div>
      {s.consumes.length > 0 && <KV k="Product cost per service" v={money(s.consumes.reduce((a, c) => a + IV.item(c.id).cost * c.qty, 0))} num />}
      <KV k="Commission" v={Math.round(s.commission * 100) + '% of service' } />
      {s.note && <div className="hint"><ion-icon name="alert-circle-outline"></ion-icon><span>{s.note}</span></div>}
    </>
  );
}

/* ---------- the POS channel tab: the join between inventory and register ---------- */
function PosTab({ item, setPos }) {
  const p = item.pos || {};
  return (
    <>
      <div className="optrow">
        <div><div className="t">Show in POS catalogue</div><div className="d">Off keeps the item stockable but unsellable at the register.</div></div>
        <div className="sp"></div><Toggle on={!!p.show} onChange={() => setPos({ show: !p.show })} />
      </div>
      {p.show ? <>
        <div className="grp">
          <span className="grp__t">Register category</span>
          <div className="opts">
            {IV_CATS.map((c) => (
              <button key={c.id} className={'opt' + (p.cat === c.id ? ' on' : '')} style={{ height: 38, fontSize: 13 }}
                onClick={() => setPos({ cat: c.id })}><ion-icon name={c.icon} style={{ fontSize: 15 }}></ion-icon>{c.label}</button>
            ))}
          </div>
        </div>
        <div className="grp">
          <span className="grp__t">Tile style</span>
          <div className="opts">
            {[['image', 'Image tile'], ['text', 'Text key'], ['list', 'List row']].map(([v, l]) => (
              <button key={v} className={'opt' + (p.tile === v ? ' on' : '')} style={{ height: 38, fontSize: 13 }} onClick={() => setPos({ tile: v })}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grp">
          <span className="grp__t">Register preview</span>
          <PosTilePreview item={item} />
        </div>
        <div className="hint"><ion-icon name="cart-outline"></ion-icon>
          <span>{item.type === 'service'
            ? 'Selling this line books time and posts commission. No stock moves unless it consumes back-bar product.'
            : item.type === 'composite'
              ? 'Selling this line depletes the recipe components, not the kit.'
              : 'Selling this line moves one unit out of the selling location and writes a movement row.'}</span></div>
      </> : <div className="hint"><ion-icon name="eye-off-outline"></ion-icon>
        <span>Hidden from every register. Still counted, still ordered, still reported — this is how back-bar and warehouse-only stock behaves.</span></div>}
    </>
  );
}

Object.assign(window, { Overview, ItemsView, ItemPane, MoveRow, ServiceTab, PosTab });
