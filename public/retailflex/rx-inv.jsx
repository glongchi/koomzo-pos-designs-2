/* Koomzo Retail POS (Flex) — inventory inside the register.
   Loaded after rx-parts / rx-screens, before rx-app: it augments the rail, re-exports a
   stock-aware Tile, and adds the embedded Stock screen.
   Stock control has three states — off, lite (a quantity per item), full (the module). */

/* seed a believable on-hand per profile, deterministic from the SKU */
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return h; };
window.RX_STOCK_SEED = (catalog) => {
  const m = {};
  catalog.items.forEach((p) => {
    const h = hash(p.sku);
    const on = p.weighed ? +(2 + (h % 40) / 3).toFixed(1) : (h % 7 === 0 ? 0 : h % 34);
    m[p.id] = { on, reorder: p.weighed ? 5 : 6, par: p.weighed ? 25 : 30, cost: +(p.price * 0.42).toFixed(2), show: true };
  });
  return m;
};

function StockNote({ s, unit }) {
  if (!s) return null;
  const st = s.on <= 0 ? 'out' : s.on <= s.reorder ? 'low' : 'ok';
  const label = st === 'out' ? 'Out of stock' : st === 'low' ? 'Low · ' + s.on : s.on + ' in stock';
  return <span className={'spill ' + st} style={{ height: 22, fontSize: 11.5 }}><i></i>{label}{unit && unit !== 'each' && st !== 'out' ? ' ' + unit : ''}</span>;
}

/* stock-aware tile: the register never lies about availability */
function Tile({ p, qty, style, onAdd, stock }) {
  const s = stock && stock[p.id];
  const out = s && s.on <= 0;
  const low = s && s.on > 0 && s.on <= s.reorder;
  return (
    <button className="tile" onClick={() => onAdd(p)} style={out ? { opacity: .62 } : null}>
      {style !== 'text' && (
        <div className="tile__art" style={{ background: p.tint.bg }}>
          {p.img
            ? <img src={p.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }} />
            : null}
          <ion-icon name={p.icon} style={{ color: p.tint.fg }}></ion-icon>
          {out ? <span className="tile__flag warn"><ion-icon name="close-circle-outline"></ion-icon>Out</span>
            : low ? <span className="tile__flag warn"><ion-icon name="alert-circle-outline"></ion-icon>{p.weighed ? s.on + ' ' + p.unit : s.on + ' left'}</span>
            : p.weighed ? <span className="tile__flag"><ion-icon name="speedometer-outline"></ion-icon>per {p.unit}</span>
            : p.age ? <span className="tile__flag warn"><ion-icon name="alert-circle-outline"></ion-icon>{p.age}+</span> : null}
        </div>
      )}
      {qty > 0 && <span className="tile__badge">{qty % 1 ? qty.toFixed(2) : qty}</span>}
      <div className="tile__meta">
        <div className="tile__name">{p.name}</div>
        <div className="tile__sub" style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span>{p.sub}</span>
          {style !== 'image' && s && (out || low) && <StockNote s={s} unit={p.unit} />}
        </div>
        <div className="tile__price">{money(p.price)}{p.unit ? <small> /{p.unit}</small> : null}</div>
      </div>
    </button>
  );
}

function CatalogGrid({ products, style, qtyFor, onAdd, heading, stock }) {
  if (!products.length) return (
    <div className="empty" style={{ minHeight: 260 }}>
      <ion-icon name="search-outline"></ion-icon><p>No matches. Try another term or scan the barcode.</p>
    </div>
  );
  return (
    <>
      {heading && <div className="sechead"><h3>{heading}</h3><span>{products.length} items</span></div>}
      <div className={'grid ' + style}>
        {products.map((p) => <Tile key={p.id} p={p} qty={qtyFor(p.id)} style={style} onAdd={onAdd} stock={stock} />)}
      </div>
    </>
  );
}

/* ================= the embedded Stock screen ================= */
function InventoryView({ profile, catalog, stock, onStock, mode, onMode, onCreate, onCats }) {
  const [tab, setTab] = React.useState('items');
  const [q, setQ] = React.useState('');
  const [openId, setOpenId] = React.useState(null);
  const [adding, setAdding] = React.useState(false);

  const rows = catalog.items.filter((p) => !q || (p.name + p.sku).toLowerCase().includes(q.toLowerCase()));
  const low = catalog.items.filter((p) => stock[p.id] && stock[p.id].on <= stock[p.id].reorder);
  const value = catalog.items.reduce((s, p) => s + (stock[p.id] ? stock[p.id].on * stock[p.id].cost : 0), 0);
  const hidden = catalog.items.filter((p) => stock[p.id] && !stock[p.id].show).length;
  const set = (id, patch) => onStock((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  const open = openId && catalog.items.find((p) => p.id === openId);

  if (mode === 'off') return (
    <div className="view">
      <div className="view__head"><div><h2>Stock</h2><p>Not switched on for this business</p></div></div>
      <div className="card" style={{ maxWidth: 620 }}>
        <div className="card__t">This register sells from a fixed product list</div>
        <div className="card__s" style={{ lineHeight: 1.6, marginTop: 8 }}>
          No quantities are held, nothing goes out of stock, and no counts are ever asked for.
          That is the right setting for a market stall, a bar, or any shop that reorders by looking at the shelf.
        </div>
        <div className="card__row">
          <span style={{ font: '600 12.5px var(--kz-font-sans)', color: 'var(--kz-muted)' }}>Turn it on when you need it</span>
          <button className="btn primary" onClick={() => onMode('lite')}><ion-icon name="cube-outline"></ion-icon>Enable Lite</button>
        </div>
      </div>
    </div>
  );

  if (adding) return <NewProductForm catalog={catalog} mode={mode} onCancel={() => setAdding(false)}
    onSave={(p, s) => { onCreate && onCreate(p, s); setAdding(false); }} />;

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Stock</h2><p>{profile.name} · Caisse 1 · {catalog.items.length} products</p></div>
        <div className="sp"></div>
        <span className={'modechip' + (mode === 'full' ? ' full' : '')}>{mode === 'full' ? 'Full module' : 'Lite'}</span>
        {onCats && <button className="btn" onClick={onCats}><ion-icon name="albums-outline"></ion-icon>Categories</button>}
        <a className="btn" href="Koomzo POS - Inventory.html"><ion-icon name="open-outline"></ion-icon>Open inventory</a>
      </div>

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
        <div className="kpi"><div className="k">Stock value</div><div className="v">{money(value)}</div></div>
        <div className="kpi"><div className="k">Low or out</div><div className="v" style={{ color: low.length ? '#a3761c' : 'var(--kz-ink)' }}>{low.length}</div></div>
        <div className="kpi"><div className="k">Hidden from POS</div><div className="v">{hidden}</div></div>
        {mode === 'full' && <div className="kpi"><div className="k">On order</div><div className="v">{money(482.40)}</div></div>}
      </div>

      <Seg value={tab} onChange={setTab} tabs={[['items', 'Products'], ['low', 'Needs ordering', low.length],
        ...(mode === 'full' ? [['recv', 'Receive']] : [])]} />

      {tab !== 'recv' && <>
        <div className="fbar">
          <div className="field"><ion-icon name="search-outline"></ion-icon>
            <input placeholder="Search or scan" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <button className="btn" onClick={() => setAdding(true)}><ion-icon name="add-outline"></ion-icon>New product</button>
        </div>
        <div className="itbl">
          {(tab === 'low' ? low : rows).map((p) => {
            const s = stock[p.id];
            return (
              <div className={'itrow' + (openId === p.id ? ' on' : '')} key={p.id} style={{ gridTemplateColumns: 'minmax(160px,2fr) 132px 96px 96px', cursor: 'default' }}>
                <div className="itcell">
                  <div className="itav" style={{ background: p.tint.bg, color: p.tint.fg }}><ion-icon name={p.icon}></ion-icon></div>
                  <div style={{ minWidth: 0 }}>
                    <div className="itnm">{p.name}</div>
                    <div className="itsub"><span>{p.sku}</span><span className="sep">·</span><span style={{ fontFamily: 'var(--kz-font-sans)' }}>{p.sub}</span></div>
                  </div>
                </div>
                <div className="r c-stock" style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <div className="stepper">
                    <button onClick={() => set(p.id, { on: Math.max(0, +(s.on - 1).toFixed(2)) })}><ion-icon name="remove-outline"></ion-icon></button>
                    <span className="q">{s.on}</span>
                    <button onClick={() => set(p.id, { on: +(s.on + 1).toFixed(2) })}><ion-icon name="add-outline"></ion-icon></button>
                  </div>
                </div>
                <div className="r c-price itnum">{money(p.price)}</div>
                <div className="c-pos" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Toggle on={s.show} onChange={() => set(p.id, { show: !s.show })} />
                </div>
              </div>
            );
          })}
          {tab === 'low' && !low.length && <EmptyState icon="checkmark-circle-outline" title="Nothing to order" sub="Every product is above its reorder point." />}
        </div>
        <div className="hint" style={{ marginTop: 12 }}><ion-icon name="information-circle-outline"></ion-icon>
          <span>{mode === 'lite'
            ? <>Lite is deliberately one screen: <b>quantity</b> and <b>show in POS</b>. Every sale still decrements — you just never meet an order, a count, or a transfer.</>
            : <>Quantities here are the same records the full module edits. The toggle on the right is what puts a product on the register grid.</>}</span></div>
      </>}

      {tab === 'recv' && (
        <div className="card" style={{ padding: 0, maxWidth: 640 }}>
          <div className="op-head"><div><h3>Quick receive</h3><p>Scan the delivery in without leaving the lane</p></div></div>
          <div className="op-bd">
            <div className="scanbox" style={{ marginBottom: 14 }}>
              <ion-icon name="barcode-outline"></ion-icon>
              <input placeholder="Scan a barcode to add a received line" />
              <kbd>ENTER</kbd>
            </div>
            {low.slice(0, 3).map((p) => (
              <div className="op-row" key={p.id}>
                <div className="op-ic"><ion-icon name={p.icon}></ion-icon></div>
                <div><div className="op-k">{p.name}</div><div className="op-d">{p.sku} · on hand {stock[p.id].on}</div></div>
                <div className="sp"></div>
                <input className="numin" style={{ width: 76 }} defaultValue={stock[p.id].par - stock[p.id].on} />
              </div>
            ))}
            <button className="btn primary wide" style={{ marginTop: 14 }}><ion-icon name="download-outline"></ion-icon>Post receipt</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= new product ================= */
const NP_TINTS = ['purple', 'blue', 'green', 'amber', 'coral', 'rose', 'oak', 'slate'];
const NP_ICONS = ['pricetag-outline', 'cube-outline', 'cafe-outline', 'nutrition-outline', 'shirt-outline',
  'hammer-outline', 'water-outline', 'flower-outline', 'headset-outline', 'medical-outline'];

function NewProductForm({ catalog, mode, onCancel, onSave }) {
  const [f, setF] = React.useState({
    name: '', sku: '', barcode: '', sub: '', cat: catalog.cats[0].id, price: '', cost: '',
    on: '', reorder: 6, par: 30, unit: 'each', weighed: false, show: true,
    tint: 'purple', icon: 'pricetag-outline', track: mode !== 'off',
    art: 'glyph', img: '',
  });
  const [touched, setTouched] = React.useState({});
  const set = (k, v) => setF((c) => ({ ...c, [k]: v }));
  const blur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const price = +f.price || 0, cost = +f.cost || 0;
  const margin = price > 0 && cost > 0 ? (1 - cost / price) : null;
  const err = {
    name: !f.name.trim() ? 'A name is what the cashier looks for.' : null,
    price: f.price === '' ? 'Set a price, or 0 for a free line.' : null,
    cost: cost > price && price > 0 ? 'Cost is above the sell price — this line loses money.' : null,
  };
  const dupe = catalog.items.find((p) => f.sku && p.sku.toLowerCase() === f.sku.trim().toLowerCase());
  const valid = !err.name && !err.price && !dupe;

  const preview = {
    id: 'new' + Date.now(), cat: f.cat, name: f.name.trim() || 'New product', sub: f.sub || (f.weighed ? 'Per ' + f.unit : ''),
    price, sku: f.sku.trim() || '—', icon: f.icon, tint: window.RX_TINTS[f.tint],
    unit: f.weighed ? f.unit : undefined, weighed: f.weighed || undefined,
    img: f.art === 'image' && f.img.trim() ? f.img.trim() : undefined,
  };

  const save = () => onSave(preview, {
    on: f.track ? (+f.on || 0) : 0, reorder: +f.reorder || 0, par: +f.par || 0,
    cost: cost, show: f.show,
  });

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>New product</h2><p>One form. It appears on the register the moment you save.</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" disabled={!valid} onClick={save}><ion-icon name="checkmark-outline"></ion-icon>Save product</button>
      </div>

      <div className="form2">
        <div className="panel">
          <div className="panel__bd">
            <div className="fgrid">
              <div className="span">
                <label className="flab">Product name</label>
                <div className={'field' + (touched.name && err.name ? ' bad' : '')}>
                  <input autoFocus placeholder="e.g. Repair Shampoo" value={f.name}
                    onBlur={() => blur('name')} onChange={(e) => set('name', e.target.value)} />
                </div>
                {touched.name && err.name && <div className="fhint err">{err.name}</div>}
              </div>
              <div className="span">
                <label className="flab">Short description <em>optional</em></label>
                <div className="field"><input placeholder="300 ml · sulphate free" value={f.sub} onChange={(e) => set('sub', e.target.value)} /></div>
                <div className="fhint">The second line on the tile and the receipt.</div>
              </div>
              <div>
                <label className="flab">SKU</label>
                <div className={'field' + (dupe ? ' bad' : '')}>
                  <input placeholder="HC-300" value={f.sku} onChange={(e) => set('sku', e.target.value)} />
                </div>
                {dupe && <div className="fhint err">{dupe.name} already uses this SKU.</div>}
              </div>
              <div>
                <label className="flab">Barcode</label>
                <div className="scanbox" style={{ height: 44 }}>
                  <ion-icon name="barcode-outline"></ion-icon>
                  <input placeholder="Scan or type" value={f.barcode} onChange={(e) => set('barcode', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="fsec">
              <div className="fsec__t">Category</div>
              <div className="fsec__s">Which chip on the register grid it lands under.</div>
              <div className="opts" style={{ marginTop: 0 }}>
                {catalog.cats.map((c) => (
                  <button key={c.id} className={'opt' + (f.cat === c.id ? ' on' : '')} style={{ height: 38, fontSize: 13 }}
                    onClick={() => set('cat', c.id)}><ion-icon name={c.icon} style={{ fontSize: 15 }}></ion-icon>{c.label}</button>
                ))}
              </div>
            </div>

            <div className="fsec">
              <div className="fsec__t">Price</div>
              <div className="fsec__s">Cost is optional, but without it there is no margin or stock value.</div>
              <div className="fgrid">
                <div>
                  <label className="flab">Sell price</label>
                  <div className={'field' + (touched.price && err.price ? ' bad' : '')}>
                    <span style={{ font: '600 13.5px var(--kz-font-num)', color: 'var(--kz-muted-2)' }}>F</span>
                    <input inputMode="decimal" placeholder="0.00" value={f.price}
                      onBlur={() => blur('price')} onChange={(e) => set('price', e.target.value)} />
                  </div>
                  {touched.price && err.price && <div className="fhint err">{err.price}</div>}
                </div>
                <div>
                  <label className="flab">Unit cost <em>optional</em></label>
                  <div className={'field' + (err.cost ? ' bad' : '')}>
                    <span style={{ font: '600 13.5px var(--kz-font-num)', color: 'var(--kz-muted-2)' }}>F</span>
                    <input inputMode="decimal" placeholder="0.00" value={f.cost} onChange={(e) => set('cost', e.target.value)} />
                  </div>
                  <div className={'fhint' + (err.cost ? ' err' : '')}>
                    {err.cost || (margin !== null ? 'Margin ' + Math.round(margin * 100) + '% · ' + money(price - cost) + ' per unit' : 'Enter both to see margin.')}
                  </div>
                </div>
              </div>
              <div className="optrow" style={{ marginTop: 4 }}>
                <div><div className="t">Sold by weight</div><div className="d">Price is per unit and the scale decides the quantity.</div></div>
                <div className="sp" style={{ flex: 1 }}></div>
                {f.weighed && (
                  <select className="sel" value={f.unit} onChange={(e) => set('unit', e.target.value)} style={{ height: 34 }}>
                    <option value="kg">kg</option><option value="lb">lb</option><option value="L">L</option><option value="m">m</option>
                  </select>
                )}
                <Toggle on={f.weighed} onChange={() => set('weighed', !f.weighed)} />
              </div>
            </div>

            {mode !== 'off' && (
              <div className="fsec">
                <div className="fsec__t">Stock</div>
                <div className="fsec__s">Opening quantity posts as a receipt so the movement log starts honest.</div>
                <div className="optrow" style={{ paddingTop: 0 }}>
                  <div><div className="t">Track quantity</div><div className="d">Off for services, gift cards and anything uncountable.</div></div>
                  <div className="sp" style={{ flex: 1 }}></div>
                  <Toggle on={f.track} onChange={() => set('track', !f.track)} />
                </div>
                {f.track && (
                  <div className="fgrid" style={{ marginTop: 12 }}>
                    <div>
                      <label className="flab">Opening quantity</label>
                      <div className="field"><input inputMode="decimal" placeholder="0" value={f.on} onChange={(e) => set('on', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="flab">Reorder point</label>
                      <div className="field"><input inputMode="numeric" value={f.reorder} onChange={(e) => set('reorder', e.target.value)} /></div>
                      <div className="fhint">Below this, the product shows in Needs ordering.</div>
                    </div>
                    {mode === 'full' && (
                      <div>
                        <label className="flab">Par level</label>
                        <div className="field"><input inputMode="numeric" value={f.par} onChange={(e) => set('par', e.target.value)} /></div>
                        <div className="fhint">Suggested orders top up to here.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="fsec">
              <div className="fsec__t">Artwork</div>
              <div className="fsec__s">A glyph needs nothing maintained; a photo sells better.</div>
              <div className="opts" style={{ marginTop: 0 }}>
                {window.GLYPH_MODES.map((m) => (
                  <button key={m.value} className={'opt' + (f.art === m.value ? ' on' : '')} style={{ height: 38, fontSize: 13 }}
                    onClick={() => set('art', m.value)}>{m.label}</button>
                ))}
              </div>
              {f.art === 'image' && (
                <div className="imgpick">
                  <div className="imgpick__prev">
                    {f.img.trim()
                      ? <img src={f.img.trim()} alt="" onError={(e) => { e.target.style.visibility = 'hidden'; }} />
                      : <ion-icon name="image-outline"></ion-icon>}
                  </div>
                  <div className="imgpick__b">
                    <label className="flab">Image URL</label>
                    <div className="field">
                      <ion-icon name="link-outline"></ion-icon>
                      <input placeholder="https://…/shampoo.jpg" value={f.img} onChange={(e) => set('img', e.target.value)} />
                    </div>
                    <div className="fhint">Any hosted image. Square or 4:3 crops best. If it fails to load the glyph shows instead.</div>
                  </div>
                </div>
              )}
              <div className="subopts" style={{ marginTop: 12 }}>
                <span className="lb">Colour</span>
                {NP_TINTS.map((k) => (
                  <button key={k} onClick={() => set('tint', k)} aria-label={k}
                    style={{ width: 30, height: 30, padding: 0, borderRadius: 999, background: window.RX_TINTS[k].bg,
                      border: f.tint === k ? '2px solid ' + window.RX_TINTS[k].fg : '1px solid var(--kz-border-strong)' }}></button>
                ))}
              </div>
              <div className="subopts" style={{ display: f.art === 'none' ? 'none' : 'flex' }}>
                <span className="lb">Glyph</span>
                {NP_ICONS.map((k) => (
                  <button key={k} className={f.icon === k ? 'on' : ''} onClick={() => set('icon', k)}
                    style={{ width: 34, padding: 0, justifyContent: 'center' }} aria-label={k}>
                    <ion-icon name={k} style={{ fontSize: 17 }}></ion-icon>
                  </button>
                ))}
              </div>
            </div>

            <div className="fsec">
              <div className="optrow" style={{ paddingTop: 0, borderBottom: 'none' }}>
                <div><div className="t">Show in POS</div><div className="d">Off keeps it stockable but off the register grid.</div></div>
                <div className="sp" style={{ flex: 1 }}></div>
                <Toggle on={f.show} onChange={() => set('show', !f.show)} />
              </div>
            </div>
          </div>
        </div>

        <div className="panel previewcard">
          <div className="panel__hd"><div><h3>Register preview</h3><p>Exactly what the cashier will tap</p></div></div>
          <div className="panel__bd">
            {f.show ? (
              <div className="grid image" style={{ gridTemplateColumns: '1fr', maxWidth: 190 }}>
                <Tile p={preview} qty={0} style="image" onAdd={() => {}}
                  stock={f.track ? { [preview.id]: { on: +f.on || 0, reorder: +f.reorder || 0 } } : null} />
              </div>
            ) : (
              <div className="flagrow info"><ion-icon name="eye-off-outline"></ion-icon>
                <span>Hidden from the register. It still counts, orders and reports.</span></div>
            )}
            <div style={{ marginTop: 14 }}>
              <div className="op-row"><span className="op-d">Category</span><div className="sp" style={{ flex: 1 }}></div>
                <span className="op-k">{catalog.cats.find((c) => c.id === f.cat).label}</span></div>
              <div className="op-row"><span className="op-d">Price</span><div className="sp" style={{ flex: 1 }}></div>
                <span className="op-k">{money(price)}{f.weighed ? ' / ' + f.unit : ''}</span></div>
              {margin !== null && <div className="op-row"><span className="op-d">Margin</span><div className="sp" style={{ flex: 1 }}></div>
                <span className="op-k">{Math.round(margin * 100)}%</span></div>}
              {mode !== 'off' && f.track && <div className="op-row"><span className="op-d">Opening stock</span><div className="sp" style={{ flex: 1 }}></div>
                <span className="op-k">{(+f.on || 0) + (f.weighed ? ' ' + f.unit : '')}</span></div>}
            </div>
            <button className="btn primary wide" style={{ marginTop: 16 }} disabled={!valid} onClick={save}>
              <ion-icon name="checkmark-outline"></ion-icon>Save product</button>
            <div className="fhint" style={{ textAlign: 'center', marginTop: 8 }}>
              {valid ? 'Ready to save.' : 'Name and price are required.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* small reusable pieces borrowed by the embedded screen */
function Seg({ tabs, value, onChange }) {
  return (
    <div className="seg">
      {tabs.map(([id, label, n]) => (
        <button key={id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>{label}{n ? <i>{n}</i> : null}</button>
      ))}
    </div>
  );
}
function Toggle({ on, onChange }) { return <button className={'sw2' + (on ? ' on' : '')} onClick={onChange} aria-pressed={on}></button>; }
function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty" style={{ padding: '48px 24px' }}>
      <ion-icon name={icon}></ion-icon>
      <p><b style={{ display: 'block', color: 'var(--kz-ink-2)', font: '600 14px var(--kz-font-sans)' }}>{title}</b>{sub}</p>
    </div>
  );
}

/* rail: Stock sits between the register and the back office */
window.RX_NAV.splice(1, 0, { id: 'inventory', icon: 'cube-outline', label: 'Stock' });
window.RX_NAV.splice(2, 0, { id: 'categories', icon: 'albums-outline', label: 'Categories' });
Object.assign(window, { Tile, CatalogGrid, InventoryView, NewProductForm, StockNote, Seg: window.Seg || Seg, Toggle, EmptyState });
