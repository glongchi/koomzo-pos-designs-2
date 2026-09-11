/* Koomzo POS — Barcode Labels: editors
   • TemplateEditor — "Add Label Template" (config panel + live preview)
   • CustomEditor   — freeform label canvas with a draggable element board
   • PaperModal     — paper / stock picker */

/* ============================================================
   ADD LABEL TEMPLATE
   ============================================================ */
function TemplateEditor({ draft, isNew, onField, onApplyPreset, onBack, onSave, onPaper }) {
  const tab = draft.kind === 'qr' ? 'qr' : draft.kind === 'text' ? 'text' : 'barcode';
  const presets = window.BC_PRESETS[tab] || window.BC_PRESETS.barcode;

  // active attributes = those bound to a slot
  const slots = [draft.header, draft.footerL, draft.footerR].filter(Boolean);
  const toggleAttr = (key) => {
    if (draft.header === key) return onField('header', null);
    if (draft.footerL === key) return onField('footerL', null);
    if (draft.footerR === key) return onField('footerR', null);
    if (!draft.header) return onField('header', key);
    if (!draft.footerL) return onField('footerL', key);
    if (!draft.footerR) return onField('footerR', key);
    onField('footerR', key);
  };

  const setTab = (k) => {
    onField('kind', k);
  };

  return (
    <div className="bc-editor">
      <div className="bc-editor__cfg">
        <div className="bc-editor__crumb">Barcode Labels / Print Items</div>
        <h1 className="bc-editor__title">{isNew ? 'Add Label Template' : 'Edit Label Template'}</h1>

        <div className="bc-sect-h" style={{ marginTop: 6 }}>Label Design</div>
        <div className="bc-tabs">
          {[{ k: 'barcode', l: 'Barcode' }, { k: 'qr', l: 'QR Code' }, { k: 'text', l: 'Text' }].map((x) => (
            <button key={x.k} className={'bc-tab' + (tab === x.k ? ' active' : '')} onClick={() => setTab(x.k)}>{x.l}</button>
          ))}
        </div>

        <div className="bc-presetstrip">
          {presets.map((p) => {
            const merged = { ...draft, ...p };
            const on = draft._preset === p.id;
            return (
              <button key={p.id} className={'bc-preset' + (on ? ' active' : '')} onClick={() => onApplyPreset(p)}>
                <div className="bc-preset__art"><LabelRender tpl={merged} item={window.BC_SAMPLE_ITEM} pxmm={2.0} /></div>
              </button>
            );
          })}
        </div>

        <div className="bc-sect-h" style={{ marginTop: 22 }}>Label Details</div>
        <ul className="bc-hint">
          <li>Click an attribute to add it to your label.</li>
          <li>Toggle it again to remove it.</li>
        </ul>
        <div className="bc-chips">
          {window.BC_ATTRS.map((a) => (
            <button key={a.key} className={'bc-chip' + (slots.includes(a.key) ? ' active' : '')} onClick={() => toggleAttr(a.key)}>
              {a.label}
            </button>
          ))}
        </div>

        {tab !== 'text' && (
          <div className="bc-field">
            <label>{tab === 'qr' ? 'QR Code data' : 'Barcode'}</label>
            <div className="bc-field__row">
              <div className="bc-tokenbox">{'{{barcode}}'}</div>
              {tab === 'barcode' && (
                <div className="bc-selectwrap">
                  <select value={draft.symbology} onChange={(e) => onField('symbology', e.target.value)}>
                    {window.BC_SYMBOLOGIES.map((s) => <option key={s.label}>{s.label}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bc-field">
          <label>Text</label>
          <div className="bc-field__row">
            <div className="bc-tokenbox tall">
              {draft.header ? `{{${draft.header}}}` : 'No top text'}
              {draft.showNumber ? '\n{{barcode}}' : ''}
            </div>
            <div className="bc-textctrls">
              <div className="bc-numin">
                <input type="number" value={draft.fontSize} min="6" max="24"
                  onChange={(e) => onField('fontSize', Math.max(6, Math.min(24, +e.target.value || 6)))} />
                <span>pt</span>
              </div>
              <div className="bc-btoggle">
                <button className={!draft.bold ? 'active' : ''} onClick={() => onField('bold', false)} style={{ fontWeight: 500 }}>B</button>
                <button className={draft.bold ? 'active' : ''} onClick={() => onField('bold', true)} style={{ fontWeight: 800 }}>B</button>
              </div>
              <div className="bc-aligns">
                {['left', 'center', 'right'].map((al) => (
                  <button key={al} className={draft.align === al ? 'active' : ''} onClick={() => onField('align', al)}>
                    <ion-icon name={'reorder-' + (al === 'center' ? 'four' : al === 'left' ? 'three' : 'two') + '-outline'}></ion-icon>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="bc-inline-toggle">
            <span className={'bc-cbx' + (draft.showNumber ? ' on' : '')} onClick={() => onField('showNumber', !draft.showNumber)}><ion-icon name="checkmark-outline"></ion-icon></span>
            Show barcode number under code
          </label>
        </div>

        <div className="bc-field">
          <label>Paper</label>
          <PaperChip paper={draft.paper} onClick={onPaper} />
        </div>

        <div className="bc-field">
          <label>Name</label>
          <input className="bc-input" placeholder="New Template" value={draft.name} onChange={(e) => onField('name', e.target.value)} />
        </div>

        <div className="bc-editor__foot">
          <button className="pa-btn" onClick={onBack}><ion-icon name="arrow-back-outline"></ion-icon>Back</button>
          <button className="bc-printbtn solid" onClick={onSave}><ion-icon name="checkmark-outline"></ion-icon>Save</button>
        </div>
      </div>

      <div className="bc-editor__preview">
        <div className="bc-editor__previewlabel">
          <LabelRender tpl={draft} item={window.BC_SAMPLE_ITEM} pxmm={7.2} outline />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOM LABEL CANVAS
   ============================================================ */
let BC_EL_UID = 1;
const newEl = (type, art) => {
  const base = { id: 'el' + (BC_EL_UID++), type, x: art.w / 2 - 60, y: art.h / 2 - 20, w: 120, h: 40 };
  if (type === 'text') return { ...base, text: 'Text', w: 90, h: 24, size: 18 };
  if (type === 'line') return { ...base, w: 160, h: 2 };
  if (type === 'rect') return { ...base, w: 110, h: 70 };
  return base;
};

function CanvasEl({ el, selected, onSelect, onMove, scale }) {
  const onDown = (e) => {
    e.stopPropagation();
    onSelect(el.id);
    const startX = e.clientX, startY = e.clientY, ox = el.x, oy = el.y;
    const move = (ev) => {
      onMove(el.id, ox + (ev.clientX - startX) / scale, oy + (ev.clientY - startY) / scale);
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const style = { left: el.x, top: el.y, width: el.w, height: el.h };
  let body = null;
  if (el.type === 'text') body = <div className="bc-cel__text" style={{ fontSize: el.size }}>{el.text}</div>;
  else if (el.type === 'barcode') body = <Barcode value="123456789" symbology="Code 128" />;
  else if (el.type === 'qr') body = <QRCode value="123456789" />;
  else if (el.type === 'line') body = <div className="bc-cel__line"></div>;
  else if (el.type === 'rect') body = <div className="bc-cel__rect"></div>;
  else if (el.type === 'image') body = <div className="bc-cel__img"><ion-icon name="image-outline"></ion-icon></div>;
  return (
    <div className={'bc-cel' + (selected ? ' sel' : '')} style={style} onMouseDown={onDown}>
      {body}
      {selected && <span className="bc-cel__nub"></span>}
    </div>
  );
}

function CustomEditor({ paper, onBack, onSave, onPaper }) {
  const art = { w: 460, h: 280 };
  const [els, setEls] = useState(() => [
    { id: 'el-name', type: 'text', x: 60, y: 36, w: 200, h: 28, text: 'sugar', size: 22, underline: true },
    { id: 'el-bc', type: 'barcode', x: 60, y: 86, w: 340, h: 90 },
    { id: 'el-num', type: 'text', x: 150, y: 188, w: 170, h: 40, text: '123456789', size: 30 },
  ]);
  const [sel, setSel] = useState('el-bc');
  const scale = 1;
  const move = (id, x, y) => setEls((cur) => cur.map((e) => e.id === id ? { ...e, x: Math.round(x), y: Math.round(y) } : e));
  const add = (type) => { const e = newEl(type, art); setEls((cur) => [...cur, e]); setSel(e.id); };
  const delSel = () => { if (sel) { setEls((cur) => cur.filter((e) => e.id !== sel)); setSel(null); } };

  const tools = [
    { t: 'text', icon: 'text-outline' },
    { t: 'barcode', icon: 'barcode-outline' },
    { t: 'qr', icon: 'qr-code-outline' },
    { t: 'line', icon: 'remove-outline' },
    { t: 'rect', icon: 'square-outline' },
    { t: 'image', icon: 'image-outline' },
  ];

  return (
    <div className="bc-custom">
      <div className="bc-custom__bar">
        <button className="pa-btn sm" onClick={onBack}><ion-icon name="arrow-back-outline"></ion-icon>Back</button>
        <div className="bc-custom__title"><ion-icon name="create-outline"></ion-icon>Custom Label</div>
        <div className="bc-custom__baractions">
          <PaperChip paper={paper} onClick={onPaper} />
          <button className="pa-btn sm" disabled={!sel} onClick={delSel}><ion-icon name="trash-outline"></ion-icon></button>
          <button className="bc-printbtn solid sm" onClick={onSave}><ion-icon name="checkmark-outline"></ion-icon>Save</button>
        </div>
      </div>

      <div className="bc-custom__canvas" onMouseDown={() => setSel(null)}>
        <div className="bc-artboard" style={{ width: art.w, height: art.h }}>
          <div className="bc-artboard__bleed"></div>
          {els.map((e) => (
            <CanvasEl key={e.id} el={e} selected={sel === e.id} onSelect={setSel} onMove={move} scale={scale} />
          ))}
        </div>
      </div>

      <div className="bc-toolbar">
        {tools.map((t) => (
          <button key={t.t} className="bc-tool" title={t.t} onClick={() => add(t.t)}>
            <ion-icon name={t.icon}></ion-icon>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PAPER SETTINGS MODAL
   ============================================================ */
function PaperModal({ paper, onCancel, onApply }) {
  const [type, setType] = useState(paper.type || 'sheet');
  const [sheetId, setSheetId] = useState(paper.sheetId || window.BC_PAPER_SHEETS[0].id);
  const [w, setW] = useState(paper.w || 50);
  const [h, setH] = useState(paper.h || 30);

  const sheet = window.BC_PAPER_SHEETS.find((s) => s.id === sheetId) || window.BC_PAPER_SHEETS[0];
  const pv = type === 'sheet' ? sheet : { w, h };
  const aspect = pv.w / pv.h;

  const apply = () => {
    if (type === 'sheet') {
      onApply({ type: 'sheet', name: sheet.name, w: sheet.w, h: sheet.h, cols: sheet.cols, rows: sheet.rows, per: sheet.per, sheetId: sheet.id });
    } else {
      onApply({ type, name: type === 'thermal' ? `Thermal ${w}×${h}` : `Custom ${w}×${h}`, w: +w, h: +h });
    }
  };

  return (
    <div className="bc-modal__scrim" onClick={onCancel}>
      <div className="bc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bc-modal__head">
          <h2>Paper Settings</h2>
          <button className="bc-modal__x" onClick={onCancel}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="bc-modal__body">
          <div className="bc-modal__cfg">
            <label className="bc-mlabel">Choose type</label>
            <div className="bc-typeseg">
              {[{ k: 'sheet', l: 'Label Sheet' }, { k: 'thermal', l: 'Thermal Label' }, { k: 'custom', l: 'Custom Size' }].map((x) => (
                <button key={x.k} className={type === x.k ? 'active' : ''} onClick={() => setType(x.k)}>{x.l}</button>
              ))}
            </div>

            {type === 'sheet' ? (
              <div className="bc-field" style={{ marginTop: 18 }}>
                <label>Label sheet</label>
                <div className="bc-selectwrap full">
                  <select value={sheetId} onChange={(e) => setSheetId(e.target.value)}>
                    {window.BC_PAPER_SHEETS.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.cols}×{s.rows} ({s.per})</option>)}
                  </select>
                </div>
                <p className="bc-modal__note">{sheet.w} × {sheet.h} mm · {sheet.per} labels per sheet</p>
              </div>
            ) : (
              <div className="bc-grid2" style={{ marginTop: 18 }}>
                <div className="bc-field">
                  <label>Width (mm)</label>
                  <input className="bc-input" type="number" value={w} onChange={(e) => setW(e.target.value)} />
                </div>
                <div className="bc-field">
                  <label>Height (mm)</label>
                  <input className="bc-input" type="number" value={h} onChange={(e) => setH(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          <div className="bc-modal__pv">
            <div className="bc-modal__pvbox" style={{ width: Math.min(220, 150 * aspect), height: Math.min(220, 150 * aspect) / aspect }}></div>
            <span className="bc-modal__pvcap">{type === 'sheet' ? sheet.name : `${w} × ${h} mm`}</span>
          </div>
        </div>
        <div className="bc-modal__foot">
          <button className="pa-btn" onClick={onCancel}>Cancel</button>
          <button className="bc-printbtn solid" onClick={apply}><ion-icon name="checkmark-outline"></ion-icon>Apply</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TemplateEditor, CustomEditor, PaperModal });
