/* Koomzo POS — Form Builder app.
   Drag fields from the palette into the canvas, reorder by dragging,
   edit properties in the inspector, switch Simple ⇄ Multi-step, preview. */
const { useState, useRef, useLayoutEffect } = React;

const FBB_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "canvasWidth": "narrow",
  "showGrid": true
}/*EDITMODE-END*/;

const FBB_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1112, h: 834, label: 'Tablet',  icon: 'tablet-landscape-outline' },
};

/* ---- starter content ---- */
const seedStep = (title, fields) => ({ id: 's' + Math.random().toString(36).slice(2, 7), title, fields });
const SIMPLE_SEED = [seedStep('Form', [
  { ...fbNewField('text'), label: 'Full name', placeholder: 'e.g. Nadège Fotso', required: true, width: 'half' },
  { ...fbNewField('email'), label: 'Email', placeholder: 'name@email.com', required: true, width: 'half' },
  { ...fbNewField('select'), label: 'Customer group', options: [{ label: 'Retail' }, { label: 'Wholesale' }, { label: 'VIP member' }] },
  { ...fbNewField('textarea'), label: 'Notes', placeholder: 'Anything we should know…' },
])];
const MULTI_SEED = [
  seedStep('Details', [
    { ...fbNewField('text'), label: 'Product name', placeholder: 'e.g. Ndolé poisson', required: true },
    { ...fbNewField('select'), label: 'Category', options: [{ label: 'Plats cuisinés' }, { label: 'Boulangerie' }, { label: 'Épicerie' }] },
  ]),
  seedStep('Pricing', [
    { ...fbNewField('number'), label: 'Unit cost', placeholder: '0.00', width: 'half' },
    { ...fbNewField('number'), label: 'Sell price', placeholder: '0.00', width: 'half', required: true },
    { ...fbNewField('range'), label: 'Tax rate' },
  ]),
  seedStep('Review', [
    { ...fbNewField('toggle'), label: 'Publish immediately', help: 'Item goes live when saved' },
  ]),
];

/* =================== STAGE (scaled device) =================== */
function Stage({ w, h, className, children }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 52) / w, (window.innerHeight - 108) / h));
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className={'device ' + className} style={{ width: w, height: h, transform: `scale(${scale})` }}>{children}</div>
      </div>
    </div>
  );
}

/* =================== PALETTE =================== */
function Palette({ onDragStart, onDragEnd, onAdd }) {
  return (
    <div className="fb-pane fb-palette">
      <div className="fb-pane__head"><h3>Fields</h3></div>
      <div className="fb-palette__scroll">
        {FB_GROUPS.map((g) => (
          <div className="fb-palette__group" key={g.key}>
            <div className="fb-palette__label">{g.label}</div>
            <div className="fb-palette__items">
              {Object.keys(FB_TYPES).filter((t) => FB_TYPES[t].group === g.key).map((t) => (
                <button key={t} className={'fb-chip' + (g.key === 'layout' ? ' wide' : '')} draggable
                  onDragStart={(e) => onDragStart(e, t)} onDragEnd={onDragEnd}
                  onDoubleClick={() => onAdd(t)} title="Drag onto the form (or double-click to add)">
                  <ion-icon name={FB_TYPES[t].icon}></ion-icon>
                  <span>{FB_TYPES[t].label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="fb-palette__hint"><ion-icon name="hand-left-outline"></ion-icon>Drag a field onto the canvas, or double-click to add.</div>
      </div>
    </div>
  );
}

/* =================== INSPECTOR =================== */
function Inspector({ field, onPatch, onDelete }) {
  if (!field) return (
    <div className="fb-pane fb-inspector">
      <div className="fb-pane__head"><h3>Properties</h3></div>
      <div className="fb-inspector__empty">
        <ion-icon name="options-outline"></ion-icon>
        <b>No field selected</b>
        <span>Select a field on the canvas to edit its label, options, and rules.</span>
      </div>
    </div>
  );
  const meta = FB_TYPES[field.type];
  const isChoice = ['select', 'radio', 'checkbox'].includes(field.type);
  const isLayout = ['heading', 'divider', 'paragraph'].includes(field.type);
  const hasPlaceholder = ['text', 'email', 'number', 'phone', 'textarea', 'date', 'time'].includes(field.type);

  const setOpt = (i, val) => { const o = [...field.options]; o[i] = { label: val }; onPatch({ options: o }); };
  const addOpt = () => onPatch({ options: [...(field.options || []), { label: 'New option' }] });
  const rmOpt = (i) => onPatch({ options: field.options.filter((_, x) => x !== i) });

  return (
    <div className="fb-pane fb-inspector">
      <div className="fb-pane__head"><h3>Properties</h3></div>
      <div className="fb-inspector__scroll">
        <div className="fb-insp-type">
          <ion-icon name={meta.icon}></ion-icon>
          <div><b>{meta.label}</b><span>{field.id}</span></div>
        </div>

        <div className="fb-prop">
          <label className="fb-prop__label">{isLayout && field.type !== 'paragraph' ? 'Text' : 'Label'}</label>
          <input className="fb-input" value={field.label || ''} onChange={(e) => onPatch({ label: e.target.value })} />
        </div>

        {hasPlaceholder && (
          <div className="fb-prop">
            <label className="fb-prop__label">Placeholder</label>
            <input className="fb-input" value={field.placeholder || ''} onChange={(e) => onPatch({ placeholder: e.target.value })} />
          </div>
        )}

        {!isLayout && (
          <div className="fb-prop">
            <label className="fb-prop__label">Help text</label>
            <input className="fb-input" value={field.help || ''} placeholder="Optional hint shown under the field" onChange={(e) => onPatch({ help: e.target.value })} />
          </div>
        )}

        {field.type === 'paragraph' && (
          <div className="fb-prop">
            <label className="fb-prop__label">Body text</label>
            <textarea className="fb-input" value={field.help || ''} onChange={(e) => onPatch({ help: e.target.value })} />
          </div>
        )}

        {isChoice && (
          <>
            <div className="fb-insp-section">Options</div>
            <div className="fb-opts">
              {(field.options || []).map((o, i) => (
                <div className="fb-opt-edit" key={i}>
                  <ion-icon className="grip" name="reorder-two-outline"></ion-icon>
                  <input className="fb-input" value={o.label} onChange={(e) => setOpt(i, e.target.value)} />
                  <button className="rm" onClick={() => rmOpt(i)}><ion-icon name="close-outline"></ion-icon></button>
                </div>
              ))}
              <button className="fb-addopt" onClick={addOpt}><ion-icon name="add-outline"></ion-icon>Add option</button>
            </div>
          </>
        )}

        {!isLayout && (
          <>
            <div className="fb-insp-section">Layout &amp; rules</div>
            <div className="fb-prop">
              <label className="fb-prop__label">Field width</label>
              <div className="fb-seg2">
                <button className={field.width === 'full' ? 'active' : ''} onClick={() => onPatch({ width: 'full' })}><ion-icon name="square-outline"></ion-icon>Full</button>
                <button className={field.width === 'half' ? 'active' : ''} onClick={() => onPatch({ width: 'half' })}><ion-icon name="contract-outline"></ion-icon>Half</button>
              </div>
            </div>
            <div className="fb-toggle-row">
              <div className="t"><b>Required</b><span>Must be filled to submit</span></div>
              <button className={'fb-switch' + (field.required ? ' on' : '')} onClick={() => onPatch({ required: !field.required })}><i></i></button>
            </div>
          </>
        )}

        <button className="fb-insp-danger" onClick={onDelete}><ion-icon name="trash-outline"></ion-icon>Delete field</button>
      </div>
    </div>
  );
}

/* =================== APP =================== */
function App() {
  const [t, setTweak] = useTweaks(FBB_TWEAKS);
  const [device, setDevice] = useState('desktop');
  const [mode, setMode] = useState('simple');             // 'simple' | 'multi'
  const [steps, setSteps] = useState(SIMPLE_SEED);
  const [stepIdx, setStepIdx] = useState(0);
  const [selId, setSelId] = useState(null);
  const [formName, setFormName] = useState('Untitled form');
  const [preview, setPreview] = useState(false);
  const [pvStep, setPvStep] = useState(0);
  const [dropIdx, setDropIdx] = useState(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);                               // {kind:'new'|'move', type?, id?}

  const dev = FBB_DEVICES[device];
  const step = steps[Math.min(stepIdx, steps.length - 1)] || steps[0];
  const fields = step.fields;
  const selField = fields.find((f) => f.id === selId) || null;

  /* ---- mutations ---- */
  const updateStep = (idx, fn) => setSteps((ss) => ss.map((s, i) => i === idx ? { ...s, fields: fn(s.fields) } : s));
  const patchField = (patch) => updateStep(stepIdx, (fs) => fs.map((f) => f.id === selId ? { ...f, ...patch } : f));
  const deleteField = (id) => { updateStep(stepIdx, (fs) => fs.filter((f) => f.id !== id)); if (selId === id) setSelId(null); };
  const duplicateField = (id) => updateStep(stepIdx, (fs) => {
    const i = fs.findIndex((f) => f.id === id); if (i < 0) return fs;
    const copy = { ...JSON.parse(JSON.stringify(fs[i])), id: 'f' + Math.random().toString(36).slice(2, 7) };
    return [...fs.slice(0, i + 1), copy, ...fs.slice(i + 1)];
  });
  const addField = (type, at) => {
    const nf = fbNewField(type);
    updateStep(stepIdx, (fs) => { const idx = at == null ? fs.length : at; return [...fs.slice(0, idx), nf, ...fs.slice(idx)]; });
    setSelId(nf.id);
  };

  /* ---- switch mode ---- */
  const switchMode = (m) => {
    setMode(m); setSelId(null); setStepIdx(0); setPvStep(0);
    setSteps(m === 'multi' ? MULTI_SEED : SIMPLE_SEED);
  };

  /* ---- steps (multi) ---- */
  const addStep = () => { setSteps((ss) => [...ss, seedStep('Step ' + (ss.length + 1), [])]); setStepIdx(steps.length); setSelId(null); };
  const renameStep = (i, name) => setSteps((ss) => ss.map((s, x) => x === i ? { ...s, title: name } : s));
  const delStep = (i) => { if (steps.length <= 1) return; setSteps((ss) => ss.filter((_, x) => x !== i)); setStepIdx((x) => Math.max(0, x - (i <= x ? 1 : 0))); setSelId(null); };

  /* ---- drag & drop ---- */
  const onPaletteDragStart = (e, type) => { drag.current = { kind: 'new', type }; setDragging(true); e.dataTransfer.effectAllowed = 'copy'; };
  const onRowDragStart = (e, id) => { drag.current = { kind: 'move', id }; setDragging(true); e.dataTransfer.effectAllowed = 'move'; e.stopPropagation(); };
  const onDragEnd = () => { drag.current = null; setDragging(false); setDropIdx(null); };

  const computeIdx = (e, listEl) => {
    const rows = [...listEl.querySelectorAll('[data-fb-row]')];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) return i;
    }
    return rows.length;
  };
  const onListDragOver = (e) => { if (!drag.current) return; e.preventDefault(); setDropIdx(computeIdx(e, e.currentTarget)); };
  const onListDrop = (e) => {
    e.preventDefault();
    const d = drag.current; if (!d) return;
    let idx = dropIdx == null ? fields.length : dropIdx;
    if (d.kind === 'new') { addField(d.type, idx); }
    else if (d.kind === 'move') {
      updateStep(stepIdx, (fs) => {
        const from = fs.findIndex((f) => f.id === d.id); if (from < 0) return fs;
        const arr = [...fs]; const [m] = arr.splice(from, 1);
        if (from < idx) idx -= 1;
        arr.splice(idx, 0, m); return arr;
      });
    }
    onDragEnd();
  };

  /* =================== CANVAS =================== */
  const accentStyle = { '--kz-primary': t.accent };
  const sheetMax = t.canvasWidth === 'wide' ? 760 : t.canvasWidth === 'medium' ? 640 : 580;

  const buildCanvas = (
    <div className="fb-pane fb-canvas">
      <div className="fb-toolbar">
        <ion-icon name="document-text-outline" style={{ fontSize: 20, color: 'var(--kz-primary)' }}></ion-icon>
        <input className="fb-formname" value={formName} onChange={(e) => setFormName(e.target.value)} />
        <div className="fb-toolbar__spacer"></div>
        <div className="fb-modeseg">
          <button className={mode === 'simple' ? 'active' : ''} onClick={() => switchMode('simple')}><ion-icon name="reader-outline"></ion-icon>Simple</button>
          <button className={mode === 'multi' ? 'active' : ''} onClick={() => switchMode('multi')}><ion-icon name="git-branch-outline"></ion-icon>Multi-step</button>
        </div>
        <a className="fb-tbtn" href="Koomzo POS - Forms.html" title="All forms"><ion-icon name="albums-outline"></ion-icon>Forms</a>
        {(!window.KZ || window.KZ.on('forms', 'submissions')) && <a className="fb-tbtn" href="Koomzo POS - Form Submissions.html" title="Responses"><ion-icon name="pulse-outline"></ion-icon>Submissions</a>}
        <button className="fb-tbtn" onClick={() => { setPreview(true); setPvStep(0); }}><ion-icon name="eye-outline"></ion-icon>Preview</button>
        <button className="fb-tbtn primary" onClick={() => alert('Form schema saved')}><ion-icon name="save-outline"></ion-icon>Save</button>
      </div>

      {mode === 'multi' && (
        <div className="fb-steps">
          {steps.map((s, i) => (
            <div key={s.id} className={'fb-steptab' + (i === stepIdx ? ' active' : '')} onClick={() => { setStepIdx(i); setSelId(null); }}>
              <span className="fb-steptab__n">{i + 1}</span>
              <input className="fb-steptab__name" value={s.title} onClick={(e) => e.stopPropagation()} onChange={(e) => renameStep(i, e.target.value)} />
              {steps.length > 1 && <button className="fb-steptab__del" onClick={(e) => { e.stopPropagation(); delStep(i); }}><ion-icon name="close-outline"></ion-icon></button>}
            </div>
          ))}
          <button className="fb-addstep" onClick={addStep} title="Add step"><ion-icon name="add-outline"></ion-icon></button>
        </div>
      )}

      <div className="fb-canvas__scroll">
        <div className="fb-sheet" style={{ maxWidth: sheetMax }}>
          <h1 className="fb-sheet__title">{mode === 'multi' ? step.title : formName}</h1>
          <p className="fb-sheet__sub">{mode === 'multi' ? `Step ${stepIdx + 1} of ${steps.length}` : 'Drag fields from the left to build your form.'}</p>

          <div className={'fb-droplist' + (fields.length === 0 ? ' empty' : '')} onDragOver={onListDragOver} onDrop={onListDrop}>
            {fields.length === 0 && (
              <div className={'fb-dropzone' + (dragging ? ' over' : '')}>
                <ion-icon name="add-circle-outline"></ion-icon>
                <b>Drop fields here</b>
                <span>Drag any field from the palette to begin</span>
              </div>
            )}
            {fields.map((f, i) => (
              <React.Fragment key={f.id}>
                {dragging && dropIdx === i && <div className="fb-dropbar show"></div>}
                <div data-fb-row className={'fb-fieldrow ' + f.width + (selId === f.id ? ' selected' : '')}
                  draggable onDragStart={(e) => onRowDragStart(e, f.id)} onDragEnd={onDragEnd}
                  onClick={() => setSelId(f.id)}>
                  <div className="fb-fieldrow__grip"><ion-icon name="ellipsis-vertical-outline"></ion-icon></div>
                  <div className="fb-fieldrow__bar">
                    <button onClick={(e) => { e.stopPropagation(); duplicateField(f.id); }} title="Duplicate"><ion-icon name="copy-outline"></ion-icon></button>
                    <button className="del" onClick={(e) => { e.stopPropagation(); deleteField(f.id); }} title="Delete"><ion-icon name="trash-outline"></ion-icon></button>
                  </div>
                  <FbPreview f={f} />
                </div>
              </React.Fragment>
            ))}
            {dragging && dropIdx === fields.length && fields.length > 0 && <div className="fb-dropbar show"></div>}
          </div>

          {mode === 'multi' && (
            <div className="fb-sheetnav">
              {stepIdx > 0 && <button className="nav"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>}
              <div className="sp"></div>
              {stepIdx < steps.length - 1
                ? <button className="nav primary">Continue<ion-icon name="chevron-forward-outline"></ion-icon></button>
                : <button className="nav success"><ion-icon name="checkmark-outline"></ion-icon>Submit</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* =================== PREVIEW =================== */
  const pvFields = steps[pvStep].fields;
  const previewView = (
    <div className="fb-pane fb-canvas" style={{ gridColumn: '1 / -1' }}>
      <div className="fb-preview-bar">
        <span className="badge"><ion-icon name="eye-outline"></ion-icon>Preview</span>
        <b>{formName}</b>
        <div className="fb-toolbar__spacer"></div>
        <button className="fb-tbtn" onClick={() => setPreview(false)}><ion-icon name="construct-outline"></ion-icon>Back to editor</button>
      </div>
      <div className="fb-canvas__scroll">
        <div className="fb-sheet" style={{ maxWidth: sheetMax }}>
          {mode === 'multi' && (
            <p className="fb-sheet__sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--kz-border)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: ((pvStep + 1) / steps.length * 100) + '%', background: 'var(--kz-primary)' }}></span>
              </span>
              Step {pvStep + 1} / {steps.length}
            </p>
          )}
          <h1 className="fb-sheet__title">{mode === 'multi' ? steps[pvStep].title : formName}</h1>
          <div className="fb-droplist flow">
            {pvFields.map((f) => (
              <div key={f.id} className={'fb-fieldrow ' + f.width} style={{ cursor: 'default' }}><FbPreview f={f} /></div>
            ))}
          </div>
          <div className="fb-sheetnav">
            {mode === 'multi' && pvStep > 0 && <button className="nav" onClick={() => setPvStep((x) => x - 1)}><ion-icon name="chevron-back-outline"></ion-icon>Back</button>}
            <div className="sp"></div>
            {mode === 'multi' && pvStep < steps.length - 1
              ? <button className="nav primary" onClick={() => setPvStep((x) => x + 1)}>Continue<ion-icon name="chevron-forward-outline"></ion-icon></button>
              : <button className="nav success"><ion-icon name="checkmark-outline"></ion-icon>Submit form</button>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div className={'fb' + (device === 'tablet' ? ' is-tablet' : '') + (preview ? ' preview' : '') + (dragging ? ' drag-active' : '')} style={accentStyle}>
          {preview ? previewView : (
            <>
              <Palette onDragStart={onPaletteDragStart} onDragEnd={onDragEnd} onAdd={addField} />
              {buildCanvas}
              <Inspector field={selField} onPatch={patchField} onDelete={() => deleteField(selId)} />
            </>
          )}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }]} onChange={setDevice} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent color" value={t.accent} options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Canvas" />
        <TweakRadio label="Form width" value={t.canvasWidth}
          options={[{ value: 'narrow', label: 'Narrow' }, { value: 'medium', label: 'Medium' }, { value: 'wide', label: 'Wide' }]}
          onChange={(v) => setTweak('canvasWidth', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
