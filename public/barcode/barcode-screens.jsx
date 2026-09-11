/* Koomzo POS — Barcode Labels: Print Items + chooser screens */

/* ============================================================
   CHOOSER — "Label Design" entry (Default template vs Custom)
   ============================================================ */
function ChooserScreen({ hasTemplates, onDefault, onCustom, onBack }) {
  const sample = window.BC_SEED_TEMPLATE;
  return (
    <div className="bc-page">
      <div className="pa-pagehead">
        <div className="pa-pagehead__t">
          <span className="pa-eyebrow">Barcode Labels</span>
          <h1>Print Items</h1>
        </div>
        {hasTemplates && (
          <div className="pa-pagehead__actions">
            <button className="pa-btn" onClick={onBack}><ion-icon name="arrow-back-outline"></ion-icon>Back to print</button>
          </div>
        )}
      </div>

      <div className="bc-chooser">
        <div className="bc-sect-h">Label Design</div>
        <p className="bc-sect-sub">Start from a ready-made layout, or design a label from scratch.</p>
        <div className="bc-choose-grid">
          <button className="bc-choose-card" onClick={onDefault}>
            <span className="bc-ribbon">Easy</span>
            <div className="bc-choose-preview">
              <LabelRender tpl={{ ...sample, footerL: null, footerR: null, showNumber: true, header: 'name' }} item={window.BC_SAMPLE_ITEM} pxmm={3.0} outline />
            </div>
            <h3>Use a Default Template</h3>
            <p>Create barcode labels in a few clicks using ready-made templates provided by Koomzo.</p>
          </button>

          <button className="bc-choose-card is-dashed" onClick={onCustom}>
            <div className="bc-choose-plus"><ion-icon name="add-outline"></ion-icon></div>
            <h3>Create a Custom Label</h3>
            <p>Design your own barcode label with the layout and information you need.</p>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE CARD (in the Label Design strip)
   ============================================================ */
function TemplateCard({ tpl, active, onSelect, onEdit }) {
  return (
    <div className={'bc-tplcard' + (active ? ' active' : '')} onClick={onSelect}>
      <div className="bc-tplcard__art">
        <LabelRender tpl={tpl} item={window.BC_SAMPLE_ITEM} pxmm={2.5} />
      </div>
      <div className="bc-tplcard__meta">
        <b>{tpl.name}</b>
        <span>{tpl.paper.name}</span>
      </div>
      <button className="bc-tplcard__edit" title="Edit template" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
        <ion-icon name="create-outline"></ion-icon>
      </button>
    </div>
  );
}

/* ============================================================
   SELECT ITEMS — the print queue
   ============================================================ */
function SelectItems({ rows, products, onCopies, onRemove, onAdd, onAddMultiple, onImport }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const totalLabels = rows.reduce((s, r) => s + (r.copies || 0), 0);
  const matches = useMemo(() => {
    const used = new Set(rows.map((r) => r.id));
    const t = q.trim().toLowerCase();
    return products
      .filter((p) => !used.has(p.id))
      .filter((p) => !t || (p.name + ' ' + p.sku + ' ' + p.barcode).toLowerCase().includes(t))
      .slice(0, 6);
  }, [q, rows, products]);

  return (
    <div className="bc-select">
      <div className="bc-select__head">
        <div className="bc-sect-h">Select Items</div>
        <div className="bc-select__tools">
          <button className="pa-btn sm" onClick={onAddMultiple}><ion-icon name="albums-outline"></ion-icon>Add Multiple</button>
          <button className="pa-btn sm" onClick={onImport}><ion-icon name="document-outline"></ion-icon>Import from Excel</button>
        </div>
      </div>

      <div className="bc-queue">
        <div className="bc-queue__hr">
          <span>Item</span>
          <span className="c">Copies</span>
        </div>
        {rows.length === 0 && (
          <div className="bc-queue__empty"><ion-icon name="cube-outline"></ion-icon>No items added yet — search below to add.</div>
        )}
        {rows.map((r) => (
          <div className="bc-qrow" key={r.id}>
            <div className="bc-qrow__item">
              <div className="bc-qrow__ic" style={{ background: r.tint ? r.tint.bg : 'var(--kz-surface-2)' }}>
                <ion-icon name={r.icon || 'cube-outline'} style={{ color: r.tint ? r.tint.fg : 'var(--kz-muted)' }}></ion-icon>
              </div>
              <div className="bc-qrow__t">
                <b>{r.name}</b>
                <small>{r.sku} · {r.barcode}</small>
              </div>
            </div>
            <div className="bc-qrow__copies">
              <button onClick={() => onCopies(r.id, (r.copies || 0) - 1)}><ion-icon name="remove-outline"></ion-icon></button>
              <input value={r.copies} onChange={(e) => onCopies(r.id, parseInt(e.target.value || '0', 10))} />
              <button onClick={() => onCopies(r.id, (r.copies || 0) + 1)}><ion-icon name="add-outline"></ion-icon></button>
            </div>
            <button className="bc-qrow__x" onClick={() => onRemove(r.id)}><ion-icon name="close-outline"></ion-icon></button>
          </div>
        ))}

        <div className="bc-addrow">
          <label className="bc-addsearch">
            <ion-icon name="add-outline"></ion-icon>
            <input placeholder="Search items to add" value={q}
              onFocus={() => setOpen(true)}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
          </label>
          {open && (
            <>
              <div className="bc-addmenu__scrim" onClick={() => setOpen(false)}></div>
              <div className="bc-addmenu">
                {matches.length === 0 && <div className="bc-addmenu__none">No more items match.</div>}
                {matches.map((p) => (
                  <button key={p.id} className="bc-addmenu__row" onClick={() => { onAdd(p); setQ(''); setOpen(false); }}>
                    <div className="bc-qrow__ic sm" style={{ background: p.tint.bg }}><ion-icon name={p.icon} style={{ color: p.tint.fg }}></ion-icon></div>
                    <div className="bc-qrow__t"><b>{p.name}</b><small>{p.sku}</small></div>
                    <ion-icon name="add-circle" style={{ color: 'var(--kz-primary)', fontSize: 20 }}></ion-icon>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bc-select__foot">
        <span>{rows.length} item{rows.length === 1 ? '' : 's'}</span>
        <span className="tot">Total: <b>{totalLabels}</b> label{totalLabels === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}

/* ============================================================
   PREVIEW PANE — tiled sheet / thermal stack
   ============================================================ */
function PreviewPane({ tpl, rows, outline }) {
  // expand selected items by copies into a flat list (capped for preview)
  const labels = useMemo(() => {
    const out = [];
    rows.forEach((r) => { for (let i = 0; i < (r.copies || 0); i++) out.push(r); });
    return out.slice(0, 60);
  }, [rows]);

  const empty = labels.length === 0;
  const isSheet = tpl.paper.type === 'sheet';

  return (
    <div className="bc-preview">
      <div className="bc-preview__bar">
        <span>Preview</span>
        <span className="bc-preview__meta">{tpl.paper.name} · {tpl.paper.w}×{tpl.paper.h}mm</span>
      </div>
      <div className="bc-preview__stage">
        {empty ? (
          <div className="bc-preview__empty">
            <ion-icon name="eye-outline"></ion-icon>
            <p>Add items to preview your labels.</p>
          </div>
        ) : isSheet ? (
          <div className="bc-sheet" style={{ gridTemplateColumns: `repeat(${tpl.paper.cols}, 1fr)` }}>
            {Array.from({ length: tpl.paper.cols * tpl.paper.rows }).map((_, i) => (
              <div className="bc-sheet__cell" key={i}>
                {labels[i] ? <LabelRender tpl={tpl} item={labels[i]} pxmm={2.6} outline={outline} /> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="bc-roll">
            {labels.map((it, i) => (
              <LabelRender key={i} tpl={tpl} item={it} pxmm={3.6} outline={outline} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PRINT ITEMS — main populated screen
   ============================================================ */
function PrintScreen(props) {
  const { templates, activeId, onSelect, onAddNew, onEditTpl, rows, products,
    onCopies, onRemove, onAdd, outline, onOutline, onPrint, onPaper } = props;
  const tpl = templates.find((t) => t.id === activeId) || templates[0];
  const totalLabels = rows.reduce((s, r) => s + (r.copies || 0), 0);

  return (
    <div className="bc-page">
      <div className="pa-pagehead">
        <div className="pa-pagehead__t">
          <span className="pa-eyebrow">Barcode Labels</span>
          <h1>Print Items <span className="count">{totalLabels} labels</span></h1>
        </div>
        <div className="pa-pagehead__actions">
          <PaperChip paper={tpl.paper} onClick={onPaper} />
        </div>
      </div>

      <div className="bc-split">
        <div className="bc-split__cfg">
          <div className="bc-block">
            <div className="bc-block__head">
              <div className="bc-sect-h">Label Design</div>
              <button className="pa-btn sm split" onClick={onAddNew}>
                <ion-icon name="add-outline"></ion-icon>Add
                <span className="div"></span><span className="caret"><ion-icon name="chevron-down-outline" style={{ fontSize: 14 }}></ion-icon></span>
              </button>
            </div>
            <div className="bc-tplstrip">
              {templates.map((t) => (
                <TemplateCard key={t.id} tpl={t} active={t.id === tpl.id}
                  onSelect={() => onSelect(t.id)} onEdit={() => onEditTpl(t.id)} />
              ))}
              <button className="bc-tplcard is-add" onClick={onAddNew}>
                <ion-icon name="add-outline"></ion-icon><span>New design</span>
              </button>
            </div>
          </div>

          <SelectItems
            rows={rows} products={products}
            onCopies={onCopies} onRemove={onRemove} onAdd={onAdd}
            onAddMultiple={() => onAdd('multi')} onImport={() => onAdd('import')}
          />

          <div className="bc-printbar">
            <label className="bc-outline">
              <span className={'bc-cbx' + (outline ? ' on' : '')} onClick={() => onOutline(!outline)}>
                <ion-icon name="checkmark-outline"></ion-icon>
              </span>
              Print with outlines
            </label>
            <button className="bc-printbtn" disabled={totalLabels === 0} onClick={onPrint}>
              <ion-icon name="print-outline"></ion-icon>Print {totalLabels > 0 ? totalLabels : ''} {totalLabels === 1 ? 'label' : 'labels'}
            </button>
          </div>
        </div>

        <PreviewPane tpl={tpl} rows={rows} outline={outline} />
      </div>
    </div>
  );
}

Object.assign(window, { ChooserScreen, TemplateCard, SelectItems, PreviewPane, PrintScreen });
