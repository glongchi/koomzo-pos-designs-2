/* Koomzo — Categories screen. Shared by the Inventory module and Retail Flex.
   Three jobs: pick a business type to seed from, edit the category list,
   and choose how tiles look. Self-contained: no imports from sibling scripts. */

function CatToggle({ on, onChange }) { return <button className={'sw2' + (on ? ' on' : '')} onClick={onChange} aria-pressed={on}></button>; }

function CategoriesView({ biz, cats, tiles, glyphMode, onBiz, onCats, onTiles, onGlyphMode, embedded }) {
  const [editId, setEditId] = React.useState(null);
  const [picking, setPicking] = React.useState(false);
  const b = window.BIZ(biz);
  const set = (id, patch) => onCats(cats.map((c) => c.id === id ? { ...c, ...patch } : c));
  const move = (i, d) => {
    const n = [...cats], j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onCats(n);
  };
  const add = () => {
    const id = 'c' + Date.now();
    onCats([...cats, { id, label: 'New category', icon: 'pricetag-outline', tint: window.CAT_TINTS.slate, items: 0 }]);
    setEditId(id);
  };
  const edit = cats.find((c) => c.id === editId);
  const glyphSet = window.GLYPH_SETS.find((g) => g.id === b.glyphs) || window.GLYPH_SETS[0];

  return (
    <div className="view">
      {!embedded && (
        <div className="view__head">
          <div><h2>Categories</h2><p>{cats.length} categories · {b.name}</p></div>
          <div className="sp"></div>
          <button className="btn" onClick={() => setPicking(true)}><ion-icon name="swap-horizontal-outline"></ion-icon>Change business type</button>
          <button className="btn primary" onClick={add}><ion-icon name="add-outline"></ion-icon>New category</button>
        </div>
      )}

      {picking && (
        <div className="scrim" onClick={() => setPicking(false)}>
          <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__head">
              <div><h3>Business type</h3><p>Seeds a category set and a tile style. Everything stays editable after.</p></div>
              <div className="sp"></div>
              <button className="icbtn" onClick={() => setPicking(false)}><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div className="sheet__body">
              <div className="bizgrid">
                {window.BIZ_TYPES.map((x) => (
                  <button className={'bizcard' + (x.id === biz ? ' on' : '')} key={x.id}
                    onClick={() => { onBiz(x.id); onCats(x.cats.map((c) => ({ ...c }))); onTiles(x.tiles); setPicking(false); }}>
                    <div className="ic" style={{ background: x.tint.bg, color: x.tint.fg }}><ion-icon name={x.icon}></ion-icon></div>
                    <div className="nm">{x.name}</div>
                    <div className="bl">{x.blurb}</div>
                    <div className="ch">
                      {x.cats.slice(0, 5).map((c) => <span key={c.id}>{c.label}</span>)}
                      {x.cats.length > 5 && <span className="more">+{x.cats.length - 5}</span>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flagrow info" style={{ marginTop: 14 }}>
                <ion-icon name="information-circle-outline"></ion-icon>
                <span>Switching type replaces the category list. Products keep their own category field, so any that no longer match land in <b>Uncategorised</b> until reassigned.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="catwrap">
        <div className="panel">
          <div className="panel__hd">
            <div className="ic" style={{ background: b.tint.bg, color: b.tint.fg, width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', flex: 'none' }}>
              <ion-icon name={b.icon} style={{ fontSize: 19 }}></ion-icon>
            </div>
            <div><h3>{b.name}</h3><p>{b.blurb}</p></div>
            <div className="sp" style={{ flex: 1 }}></div>
            <button className="btn" onClick={() => setPicking(true)}>Change</button>
          </div>
          <div className="panel__bd" style={{ paddingTop: 4 }}>
            {cats.map((c, i) => (
              <div className={'catrow' + (editId === c.id ? ' on' : '')} key={c.id}>
                <div className="catrow__ord">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ion-icon name="chevron-up-outline"></ion-icon></button>
                  <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} aria-label="Move down"><ion-icon name="chevron-down-outline"></ion-icon></button>
                </div>
                <div className="catrow__ic" style={{ background: c.tint.bg, color: c.tint.fg }}><ion-icon name={c.icon}></ion-icon></div>
                <button className="catrow__b" onClick={() => setEditId(editId === c.id ? null : c.id)}>
                  <div className="nm">{c.label}</div>
                  <div className="ds">{c.note || (c.items ? c.items + ' products' : 'No products yet')}</div>
                </button>
                <div className="sp" style={{ flex: 1 }}></div>
                <button className="icbtn" onClick={() => setEditId(editId === c.id ? null : c.id)} aria-label="Edit"><ion-icon name="create-outline"></ion-icon></button>
                <button className="icbtn" onClick={() => onCats(cats.filter((x) => x.id !== c.id))} aria-label="Delete"><ion-icon name="trash-outline"></ion-icon></button>
              </div>
            ))}
            <button className="btn wide" style={{ marginTop: 12, justifyContent: 'center' }} onClick={add}>
              <ion-icon name="add-outline"></ion-icon>New category</button>
          </div>
        </div>

        <div className="panel">
          {edit ? (
            <>
              <div className="panel__hd"><div><h3>{edit.label}</h3><p>Name, glyph and colour</p></div>
                <div className="sp" style={{ flex: 1 }}></div>
                <button className="icbtn" onClick={() => setEditId(null)}><ion-icon name="close-outline"></ion-icon></button></div>
              <div className="panel__bd">
                <label className="flab">Name</label>
                <div className="field"><input value={edit.label} onChange={(e) => set(edit.id, { label: e.target.value })} /></div>
                <label className="flab" style={{ marginTop: 14 }}>Hint <em>optional</em></label>
                <div className="field"><input placeholder="What belongs here" value={edit.note || ''} onChange={(e) => set(edit.id, { note: e.target.value })} /></div>

                <div className="fsec">
                  <div className="fsec__t">Colour</div>
                  <div className="subopts">
                    {window.CAT_TINT_KEYS.map((k) => (
                      <button key={k} onClick={() => set(edit.id, { tint: window.CAT_TINTS[k] })} aria-label={k}
                        style={{ width: 30, height: 30, padding: 0, borderRadius: 999, background: window.CAT_TINTS[k].bg,
                          border: edit.tint.fg === window.CAT_TINTS[k].fg ? '2px solid ' + window.CAT_TINTS[k].fg : '1px solid var(--kz-border-strong)' }}></button>
                    ))}
                  </div>
                </div>

                <div className="fsec">
                  <div className="fsec__t">Glyph</div>
                  <div className="fsec__s">{glyphSet.label} set — the one that fits {b.name.toLowerCase()}.</div>
                  <div className="glyphgrid">
                    {glyphSet.icons.map((g) => (
                      <button key={g} className={edit.icon === g ? 'on' : ''} onClick={() => set(edit.id, { icon: g })} aria-label={g}>
                        <ion-icon name={g}></ion-icon></button>
                    ))}
                  </div>
                  <div className="fsec__s" style={{ marginTop: 12 }}>Everything else</div>
                  <div className="glyphgrid">
                    {window.ALL_GLYPHS.filter((g) => !glyphSet.icons.includes(g)).map((g) => (
                      <button key={g} className={edit.icon === g ? 'on' : ''} onClick={() => set(edit.id, { icon: g })} aria-label={g}>
                        <ion-icon name={g}></ion-icon></button>
                    ))}
                  </div>
                </div>

                <div className="fsec">
                  <div className="fsec__t">Preview</div>
                  <div className="catchips">
                    {cats.map((c) => (
                      <span className={'catchip' + (c.id === edit.id ? ' on' : '')} key={c.id}
                        style={c.id === edit.id ? { background: c.tint.bg, color: c.tint.fg, borderColor: c.tint.fg } : null}>
                        <ion-icon name={c.icon}></ion-icon>{c.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="panel__hd"><div><h3>Tile style</h3><p>How every product renders on the register grid</p></div></div>
              <div className="panel__bd">
                {window.TILE_STYLES.map((s) => (
                  <div className={'trow2' + (tiles === s.value ? ' on' : '')} key={s.value} onClick={() => onTiles(s.value)} style={{ cursor: 'pointer' }}>
                    <div className="trow2__ic"><ion-icon name={s.icon}></ion-icon></div>
                    <div style={{ minWidth: 0 }}><div className="trow2__t">{s.label}</div><div className="trow2__d">{s.desc}</div></div>
                    <div className="sp" style={{ flex: 1 }}></div>
                    <span className={'radio' + (tiles === s.value ? ' on' : '')}></span>
                  </div>
                ))}

                <div className="fsec">
                  <div className="fsec__t">Product artwork</div>
                  <div className="fsec__s">The default for new products. Any product can override it.</div>
                  {window.GLYPH_MODES.map((m) => (
                    <div className={'trow2' + (glyphMode === m.value ? ' on' : '')} key={m.value} onClick={() => onGlyphMode(m.value)} style={{ cursor: 'pointer' }}>
                      <div style={{ minWidth: 0 }}><div className="trow2__t">{m.label}</div><div className="trow2__d">{m.desc}</div></div>
                      <div className="sp" style={{ flex: 1 }}></div>
                      <span className={'radio' + (glyphMode === m.value ? ' on' : '')}></span>
                    </div>
                  ))}
                </div>

                <div className="fsec">
                  <div className="fsec__t">Category rail preview</div>
                  <div className="catchips">
                    <span className="catchip on">All</span>
                    {cats.map((c) => <span className="catchip" key={c.id}><ion-icon name={c.icon}></ion-icon>{c.label}</span>)}
                  </div>
                </div>

                <div className="flagrow info" style={{ marginTop: 14 }}>
                  <ion-icon name="information-circle-outline"></ion-icon>
                  <span>Order matters: the rail reads left to right in this order, and the first category is what the register opens on. Put the busiest shelf first.</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CategoriesView, CatToggle });
