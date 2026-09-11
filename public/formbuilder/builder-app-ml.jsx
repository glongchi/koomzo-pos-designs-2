/* Koomzo POS — Form Builder (multilingual).
   A single EN/FR toggle in the top bar switches the whole screen — both the
   builder chrome and the form content. Every authored string is stored per
   language; the inspector edits the active language and shows the source text
   for reference, and fields missing a translation are flagged. Scales to N
   languages via LANGS in builder-i18n.jsx. */
const { useState, useRef, useLayoutEffect } = React;
const { LANGS, langName, isI18n, mk, tx, txf, setLangVal, fieldMissing, UI } = window;

const FBM_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "canvasWidth": "narrow",
  "primaryLang": "en",
  "highlightMissing": true,
  "showBadges": true
}/*EDITMODE-END*/;

const FBM_DEVICES = {
  desktop: { w: 1440, h: 900, uiKey: 'desktop', icon: 'desktop-outline' },
  tablet:  { w: 1112, h: 834, uiKey: 'tablet',  icon: 'tablet-landscape-outline' },
};

/* ---- starter content (bilingual) ---- */
const seedStep = (title, fields) => ({ id: 's' + Math.random().toString(36).slice(2, 7), title, fields });
const SIMPLE_SEED = () => [seedStep(mk('Form', 'Formulaire'), [
  { ...fbNewField('text'),  label: mk('Full name', 'Nom complet'), placeholder: mk('e.g. Nadège Fotso', 'ex. Nadège Fotso'), required: true, width: 'half' },
  { ...fbNewField('email'), label: mk('Email', 'E-mail'), placeholder: mk('name@email.com', 'nom@email.com'), required: true, width: 'half' },
  { ...fbNewField('number'), id: 'f_age', label: mk('Age', 'Âge'), placeholder: mk('e.g. 24', 'ex. 24'), width: 'half' },
  { ...fbNewField('text'), id: 'f_guard', label: mk("Guardian's name", 'Nom du tuteur'), placeholder: mk('Required under 18', 'Obligatoire pour les moins de 18 ans'), width: 'half', required: true,
    visibleIf: { match: 'all', when: [{ parent: 'f_age', op: 'lt', value: '18' }] } },
  { ...fbNewField('select'), id: 'f_grp', label: mk('Customer group', 'Groupe de client'), options: [{ label: mk('Retail', 'Détail') }, { label: mk('Wholesale', 'Grossiste') }, { label: mk('VIP member', 'Membre VIP') }] },
  { ...fbNewField('select'), id: 'f_terms', label: mk('Payment terms', 'Conditions de paiement'),
    options: [{ label: mk('Pay on collection', 'Paiement à l’enlèvement') }, { label: mk('7 days', '7 jours') }, { label: mk('30 days', '30 jours') }, { label: mk('Consignment', 'Consignation') }],
    filterCombine: 'all',
    filters: [{ parent: 'f_grp', mode: 'map', emptyParent: 'none', unmapped: 'none', map: { o0: ['o0'], o1: ['o0', 'o1', 'o2'], o2: ['o0', 'o1', 'o2', 'o3'] } }] },
  { ...fbNewField('select'), label: mk('Region', 'Région'), options: [], source: { id: 'ds_regions', valueCol: 'key', labelCol: 'name', descCol: 'seat', showDesc: true } },
  { ...fbNewField('textarea'), label: mk('Notes', 'Notes'), placeholder: mk('Anything we should know…', 'Quelque chose à signaler…') },
])];
const MULTI_SEED = () => [
  seedStep(mk('Details', 'Détails'), [
    { ...fbNewField('text'), label: mk('Product name', 'Nom du produit'), placeholder: mk('e.g. Ndolé poisson', 'ex. Ndolé poisson'), required: true },
    { ...fbNewField('select'), id: 'm_cat', label: mk('Category', 'Catégorie'), options: [{ label: mk('Cooked dishes', 'Plats cuisinés') }, { label: mk('Bakery', 'Boulangerie') }, { label: mk('Groceries', 'Épicerie') }] },
  ]),
  seedStep(mk('Pricing', 'Tarifs'), [
    { ...fbNewField('number'), label: mk('Unit cost', 'Coût unitaire'), placeholder: mk('0.00', '0,00'), width: 'half' },
    { ...fbNewField('number'), label: mk('Sell price', 'Prix de vente'), placeholder: mk('0.00', '0,00'), width: 'half', required: true },
    { ...fbNewField('range'), label: mk('Tax rate', 'Taux de taxe') },
    { ...fbNewField('select'), id: 'm_sub', label: mk('Sub-category', 'Sous-catégorie'),
      options: [{ label: mk('Braised', 'Braisé') }, { label: mk('Sauces', 'Sauces') }, { label: mk('Bread', 'Pain') }, { label: mk('Pastry', 'Pâtisserie') }, { label: mk('Dry goods', 'Produits secs') }, { label: mk('Drinks', 'Boissons') }],
        filters: [{ parent: 'm_cat', mode: 'map', emptyParent: 'none', unmapped: 'none', map: { o0: ['o0', 'o1'], o1: ['o2', 'o3'], o2: ['o4', 'o5'] } }] },
    { ...fbNewField('number'), id: 'm_batch', label: mk('Batch size', 'Taille du lot'), help: mk('Loaves or pieces baked per batch', 'Pains ou pièces cuits par lot'), width: 'half',
      visibleIf: { match: 'all', when: [{ parent: 'm_cat', op: 'is', value: 'o1' }] } },
  ]),
  seedStep(mk('Review', 'Révision'), [
    { ...fbNewField('toggle'), label: mk('Publish immediately', 'Publier immédiatement'), help: mk('Item goes live when saved', "L'article est mis en ligne à l'enregistrement") },
  ]),
];

/* =================== STAGE =================== */
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
function Palette({ ui, lang, onDragStart, onDragEnd, onAdd }) {
  return (
    <div className="fb-pane fb-palette">
      <div className="fb-pane__head"><h3>{ui.fields}</h3></div>
      <div className="fb-palette__scroll">
        {FB_GROUPS.map((g) => (
          <div className="fb-palette__group" key={g.key}>
            <div className="fb-palette__label">{ui[g.uiKey]}</div>
            <div className="fb-palette__items">
              {Object.keys(FB_TYPES).filter((t) => FB_TYPES[t].group === g.key).map((t) => (
                <button key={t} className={'fb-chip' + (g.key === 'layout' ? ' wide' : '')} draggable
                  onDragStart={(e) => onDragStart(e, t)} onDragEnd={onDragEnd}
                  onDoubleClick={() => onAdd(t)}>
                  <ion-icon name={FB_TYPES[t].icon}></ion-icon>
                  <span>{typeName(t, lang)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="fb-palette__hint"><ion-icon name="hand-left-outline"></ion-icon>{ui.dragHint}</div>
      </div>
    </div>
  );
}

/* a single translatable text input with source reference */
function TxInput({ uiLabel, value, lang, primary, ui, onChange, multiline }) {
  const cur = tx(value, lang);
  const src = tx(value, primary);
  const showSrc = lang !== primary && !!src;
  const missing = showSrc && !cur.trim();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className="fb-prop">
      <label className="fb-prop__label">{uiLabel}<span className="fb-langtag">{lang.toUpperCase()}</span></label>
      <Tag className={'fb-input' + (missing ? ' is-missing' : '')} value={cur}
        placeholder={showSrc ? src : ''}
        onChange={(e) => onChange(setLangVal(value, lang, e.target.value))} />
      {showSrc && (
        <div className="fb-src">
          <span className="fb-src__lbl">{ui.sourceLang} · {primary.toUpperCase()}</span>
          <span className="fb-src__val">{src}</span>
          {missing && <button className="fb-src__use" onClick={() => onChange(setLangVal(value, lang, src))}><ion-icon name="copy-outline"></ion-icon>{ui.useSource}</button>}
        </div>
      )}
    </div>
  );
}

/* =================== INSPECTOR =================== */
function Inspector({ field, lang, primary, ui, onPatch, onDelete, dsList, onOpenSources, steps, stepIdx, onJump }) {
  if (!field) return (
    <div className="fb-pane fb-inspector">
      <div className="fb-pane__head"><h3>{ui.properties}</h3></div>
      <div className="fb-inspector__empty">
        <ion-icon name="options-outline"></ion-icon>
        <b>{ui.noFieldSelected}</b>
        <span>{ui.selectFieldHint}</span>
      </div>
    </div>
  );
  const meta = FB_TYPES[field.type];
  const isChoice = ['select', 'radio', 'checkbox'].includes(field.type);
  const isLayout = ['heading', 'divider', 'paragraph'].includes(field.type);
  const hasPlaceholder = ['text', 'email', 'number', 'phone', 'textarea', 'date', 'time'].includes(field.type);

  const setOpt = (i, val) => { const o = field.options.map((x, k) => k === i ? { ...x, label: val } : x); onPatch({ options: o }); };
  const addOpt = () => onPatch({ options: [...(field.options || []), { label: mk(ui.newOption, '') }] });
  const rmOpt = (i) => onPatch({ options: field.options.filter((_, x) => x !== i) });

  return (
    <div className="fb-pane fb-inspector">
      <div className="fb-pane__head"><h3>{ui.properties}</h3><span className="fb-editing"><ion-icon name="language-outline"></ion-icon>{ui.editingIn} {langName(lang, lang)}</span></div>
      <div className="fb-inspector__scroll">
        <div className="fb-insp-type">
          <ion-icon name={meta.icon}></ion-icon>
          <div><b>{typeName(field.type, lang)}</b><span>{field.id}</span></div>
        </div>

        <TxInput uiLabel={isLayout && field.type !== 'paragraph' ? ui.textLbl : ui.label}
          value={field.label} lang={lang} primary={primary} ui={ui} onChange={(v) => onPatch({ label: v })} />

        {hasPlaceholder && (
          <TxInput uiLabel={ui.placeholder} value={field.placeholder || mk('', '')} lang={lang} primary={primary} ui={ui} onChange={(v) => onPatch({ placeholder: v })} />
        )}

        {!isLayout && field.type !== 'paragraph' && (
          <TxInput uiLabel={ui.helpText} value={field.help || mk('', '')} lang={lang} primary={primary} ui={ui} onChange={(v) => onPatch({ help: v })} />
        )}

        {field.type === 'paragraph' && (
          <TxInput uiLabel={ui.bodyText} value={field.help || mk('', '')} lang={lang} primary={primary} ui={ui} onChange={(v) => onPatch({ help: v })} multiline />
        )}

        {isChoice && (
          <>
            <DsBinding field={field} list={dsList} lang={lang} primary={primary} ui={ui} onPatch={onPatch} onOpenSources={onOpenSources} />
            {!field.source && (
            <div className="fb-opts">
              {(field.options || []).map((o, i) => {
                const cur = tx(o.label, lang); const src = tx(o.label, primary);
                const showSrc = lang !== primary && !!src;
                return (
                  <div className="fb-opt-edit" key={i}>
                    <ion-icon className="grip" name="reorder-two-outline"></ion-icon>
                    <input className={'fb-input' + (showSrc && !cur.trim() ? ' is-missing' : '')} value={cur}
                      placeholder={showSrc ? src : ''}
                      onChange={(e) => setOpt(i, setLangVal(o.label, lang, e.target.value))} />
                    <button className="rm" onClick={() => rmOpt(i)}><ion-icon name="close-outline"></ion-icon></button>
                  </div>
                );
              })}
              <button className="fb-addopt" onClick={addOpt}><ion-icon name="add-outline"></ion-icon>{ui.addOption}</button>
            </div>
            )}
          </>
        )}

        {!isLayout && (
          <>
            <div className="fb-insp-section">{ui.layoutRules}</div>
            <div className="fb-prop">
              <label className="fb-prop__label">{ui.fieldWidth}</label>
              <div className="fb-seg2">
                <button className={field.width === 'full' ? 'active' : ''} onClick={() => onPatch({ width: 'full' })}><ion-icon name="square-outline"></ion-icon>{ui.full}</button>
                <button className={field.width === 'half' ? 'active' : ''} onClick={() => onPatch({ width: 'half' })}><ion-icon name="contract-outline"></ion-icon>{ui.half}</button>
              </div>
            </div>
            <div className="fb-toggle-row">
              <div className="t"><b>{ui.required}</b><span>{ui.requiredHint}</span></div>
              <button className={'fb-switch' + (field.required ? ' on' : '')} onClick={() => onPatch({ required: !field.required })}><i></i></button>
            </div>
          </>
        )}

        {!isLayout && (
          <>
            <FlVisibility field={field} steps={steps} stepIdx={stepIdx} lang={lang} primary={primary} onPatch={onPatch} />
            {isChoice && <FlFilter field={field} steps={steps} stepIdx={stepIdx} lang={lang} primary={primary} onPatch={onPatch} />}
            <FlDrives field={field} steps={steps} lang={lang} primary={primary} onJump={onJump} />
          </>
        )}

        <button className="fb-insp-danger" onClick={onDelete}><ion-icon name="trash-outline"></ion-icon>{ui.deleteField}</button>
      </div>
    </div>
  );
}

/* =================== APP =================== */
function App() {
  const [t, setTweak] = useTweaks(FBM_TWEAKS);
  const primary = t.primaryLang || 'en';
  const [lang, setLang] = useState(primary);
  const [device, setDevice] = useState('desktop');
  const [mode, setMode] = useState('simple');
  const [steps, setSteps] = useState(SIMPLE_SEED);
  const [stepIdx, setStepIdx] = useState(0);
  const [selId, setSelId] = useState(null);
  const [formName, setFormName] = useState(() => mk('Untitled form', 'Formulaire sans titre'));
  const [preview, setPreview] = useState(false);
  const [screen, setScreen] = useState('form');
  const [dsList, setDsList] = useState(() => JSON.parse(JSON.stringify(window.DS_SEED)));
  window.DS_LIST = dsList;
  const [pvStep, setPvStep] = useState(0);
  const [pvVals, setPvVals] = useState({});
  const [dropIdx, setDropIdx] = useState(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);

  const ui = UI[lang];
  const dev = FBM_DEVICES[device];
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

  const switchMode = (m) => {
    setMode(m); setSelId(null); setStepIdx(0); setPvStep(0);
    setSteps(m === 'multi' ? MULTI_SEED() : SIMPLE_SEED());
  };

  /* ---- steps ---- */
  const addStep = () => { const n = steps.length + 1; setSteps((ss) => [...ss, seedStep(mk('Step ' + n, 'Étape ' + n), [])]); setStepIdx(steps.length); setSelId(null); };
  const renameStep = (i, name) => setSteps((ss) => ss.map((s, x) => x === i ? { ...s, title: setLangVal(s.title, lang, name) } : s));
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

  /* ---- translation status ---- */
  const missingCount = (lng) => {
    if (lng === primary) return 0;
    let n = 0;
    steps.forEach((s) => s.fields.forEach((f) => { if (fieldMissing(f, lng, primary)) n++; }));
    return n;
  };
  const totalFields = steps.reduce((a, s) => a + s.fields.length, 0);
  const missNow = missingCount(lang);
  const pct = totalFields ? Math.round((totalFields - missNow) / totalFields * 100) : 100;

  /* =================== CANVAS =================== */
  const accentStyle = { '--kz-primary': t.accent };
  const sheetMax = t.canvasWidth === 'wide' ? 760 : t.canvasWidth === 'medium' ? 640 : 580;
  const hi = t.highlightMissing;

  const transStatus = lang !== primary && (
    <div className={'fb-transtatus' + (missNow === 0 ? ' ok' : '')}>
      <ion-icon name={missNow === 0 ? 'checkmark-circle' : 'alert-circle-outline'}></ion-icon>
      {missNow === 0 ? ui.allTranslated : ui.fieldsNeed(missNow, langName(lang, lang))}
      <span className="fb-transtatus__pct">{pct}% {ui.completion}</span>
    </div>
  );

  const buildCanvas = (
    <div className="fb-pane fb-canvas">
      <div className="fb-toolbar">
        <ion-icon name="document-text-outline" style={{ fontSize: 20, color: 'var(--kz-primary)' }}></ion-icon>
        <input className="fb-formname" value={tx(formName, lang)} placeholder={lang !== primary ? tx(formName, primary) : ui.untitledForm}
          onChange={(e) => setFormName(setLangVal(formName, lang, e.target.value))} />
        <div className="fb-toolbar__spacer"></div>
        <div className="fb-langseg" role="group" aria-label="Language">
          <ion-icon name="globe-outline"></ion-icon>
          {LANGS.map((l) => {
            const m = missingCount(l.code);
            return (
              <button key={l.code} className={lang === l.code ? 'active' : ''} onClick={() => setLang(l.code)} title={langName(l.code, lang)}>
                {l.short}
                {l.code !== primary && m > 0 && <span className="fb-langseg__dot" title={UI[lang].fieldsNeed(m, langName(l.code, lang))}>{m}</span>}
              </button>
            );
          })}
        </div>
        {transStatus}
        <div className="fb-modeseg">
          <button className={mode === 'simple' ? 'active' : ''} onClick={() => switchMode('simple')}><ion-icon name="reader-outline"></ion-icon>{ui.simple}</button>
          <button className={mode === 'multi' ? 'active' : ''} onClick={() => switchMode('multi')}><ion-icon name="git-branch-outline"></ion-icon>{ui.multiStep}</button>
        </div>
        <button className="fb-tbtn" onClick={() => setScreen('data')}><ion-icon name="server-outline"></ion-icon>{DS_UI[lang].title}</button>
        <button className="fb-tbtn" onClick={() => { setPreview(true); setPvStep(0); }}><ion-icon name="eye-outline"></ion-icon>{ui.preview}</button>
        <button className="fb-tbtn primary" onClick={() => alert(ui.saved)}><ion-icon name="save-outline"></ion-icon>{ui.save}</button>
      </div>

      {mode === 'multi' && (
        <div className="fb-steps">
          {steps.map((s, i) => (
            <div key={s.id} className={'fb-steptab' + (i === stepIdx ? ' active' : '')} onClick={() => { setStepIdx(i); setSelId(null); }}>
              <span className="fb-steptab__n">{i + 1}</span>
              <input className="fb-steptab__name" value={tx(s.title, lang)} placeholder={lang !== primary ? tx(s.title, primary) : ''} onClick={(e) => e.stopPropagation()} onChange={(e) => renameStep(i, e.target.value)} />
              {steps.length > 1 && <button className="fb-steptab__del" onClick={(e) => { e.stopPropagation(); delStep(i); }}><ion-icon name="close-outline"></ion-icon></button>}
            </div>
          ))}
          <button className="fb-addstep" onClick={addStep}><ion-icon name="add-outline"></ion-icon></button>
        </div>
      )}

      <div className="fb-canvas__scroll">
        <div className="fb-sheet" style={{ maxWidth: sheetMax }}>
          <h1 className="fb-sheet__title">{mode === 'multi' ? (txf(step.title, lang, primary) || ui.stepWord) : (txf(formName, lang, primary) || ui.untitledForm)}</h1>
          <p className="fb-sheet__sub">{mode === 'multi' ? ui.stepOf(stepIdx + 1, steps.length) : ui.dragToBuild}</p>

          <div className={'fb-droplist' + (fields.length === 0 ? ' empty' : '')} onDragOver={onListDragOver} onDrop={onListDrop}>
            {fields.length === 0 && (
              <div className={'fb-dropzone' + (dragging ? ' over' : '')}>
                <ion-icon name="add-circle-outline"></ion-icon>
                <b>{ui.dropFieldsHere}</b>
                <span>{ui.dragAnyField}</span>
              </div>
            )}
            {fields.map((f, i) => {
              const miss = t.showBadges && fieldMissing(f, lang, primary);
              return (
                <React.Fragment key={f.id}>
                  {dragging && dropIdx === i && <div className="fb-dropbar show"></div>}
                  <div data-fb-row className={'fb-fieldrow ' + f.width + (selId === f.id ? ' selected' : '') + (miss ? ' needs-tx' : '')}
                    draggable onDragStart={(e) => onRowDragStart(e, f.id)} onDragEnd={onDragEnd}
                    onClick={() => setSelId(f.id)}>
                    <div className="fb-fieldrow__grip"><ion-icon name="ellipsis-vertical-outline"></ion-icon></div>
                    <div className="fb-fieldrow__bar">
                      <button onClick={(e) => { e.stopPropagation(); duplicateField(f.id); }}><ion-icon name="copy-outline"></ion-icon></button>
                      <button className="del" onClick={(e) => { e.stopPropagation(); deleteField(f.id); }}><ion-icon name="trash-outline"></ion-icon></button>
                    </div>
                    <FbPreview f={f} lang={lang} primary={primary} hi={hi} />
                    <FlChips f={f} steps={steps} lang={lang} primary={primary} />
                    {miss && <div className="fb-missrow"><ion-icon name="language-outline"></ion-icon>{ui.needs(langName(lang, lang))}</div>}
                  </div>
                </React.Fragment>
              );
            })}
            {dragging && dropIdx === fields.length && fields.length > 0 && <div className="fb-dropbar show"></div>}
          </div>

          {mode === 'multi' && (
            <div className="fb-sheetnav">
              {stepIdx > 0 && <button className="nav"><ion-icon name="chevron-back-outline"></ion-icon>{ui.back}</button>}
              <div className="sp"></div>
              {stepIdx < steps.length - 1
                ? <button className="nav primary">{ui.continueW}<ion-icon name="chevron-forward-outline"></ion-icon></button>
                : <button className="nav success"><ion-icon name="checkmark-outline"></ion-icon>{ui.submit}</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* =================== PREVIEW =================== */
  const pvFields = steps[Math.min(pvStep, steps.length - 1)].fields;
  const previewView = (
    <div className="fb-pane fb-canvas" style={{ gridColumn: '1 / -1' }}>
      <div className="fb-preview-bar">
        <span className="badge"><ion-icon name="eye-outline"></ion-icon>{ui.preview}</span>
        <b>{txf(formName, lang, primary) || ui.untitledForm}</b>
        <span className="fb-pv-lang"><ion-icon name="language-outline"></ion-icon>{langName(lang, lang)}</span>
        <div className="fb-toolbar__spacer"></div>
        <button className="fb-tbtn" onClick={() => setPreview(false)}><ion-icon name="construct-outline"></ion-icon>{ui.backToEditor}</button>
      </div>
      <div className="fb-canvas__scroll">
        <div className="fb-sheet" style={{ maxWidth: sheetMax }}>
          {mode === 'multi' && (
            <p className="fb-sheet__sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--kz-border)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: ((pvStep + 1) / steps.length * 100) + '%', background: 'var(--kz-primary)' }}></span>
              </span>
              {ui.stepOf(pvStep + 1, steps.length)}
            </p>
          )}
          <h1 className="fb-sheet__title">{mode === 'multi' ? (txf(steps[pvStep].title, lang, primary) || ui.stepWord) : (txf(formName, lang, primary) || ui.untitledForm)}</h1>
          <FlFill steps={steps} stepIdx={pvStep} lang={lang} primary={primary} vals={pvVals} setVals={setPvVals} />
          <div className="fb-sheetnav">
            {mode === 'multi' && pvStep > 0 && <button className="nav" onClick={() => setPvStep((x) => x - 1)}><ion-icon name="chevron-back-outline"></ion-icon>{ui.back}</button>}
            <div className="sp"></div>
            {mode === 'multi' && pvStep < steps.length - 1
              ? <button className="nav primary" onClick={() => setPvStep((x) => x + 1)}>{ui.continueW}<ion-icon name="chevron-forward-outline"></ion-icon></button>
              : <button className="nav success"><ion-icon name="checkmark-outline"></ion-icon>{ui.submitForm}</button>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div className={'fb' + (device === 'tablet' ? ' is-tablet' : '') + (preview ? ' preview' : '') + (dragging ? ' drag-active' : '')} style={accentStyle}>
          {screen === 'data' ? (
            <div style={{ gridColumn: '1 / -1', minHeight: 0, display: 'flex' }}>
              <DsScreen list={dsList} setList={setDsList} lang={lang} primary={primary} onBack={() => setScreen('form')} />
            </div>
          ) : preview ? previewView : (
            <>
              <Palette ui={ui} lang={lang} onDragStart={onPaletteDragStart} onDragEnd={onDragEnd} onAdd={addField} />
              {buildCanvas}
              <Inspector field={selField} lang={lang} primary={primary} ui={ui} onPatch={patchField} onDelete={() => deleteField(selId)}
                dsList={dsList} onOpenSources={() => setScreen('data')} steps={steps} stepIdx={stepIdx}
                onJump={(si, fid) => { setStepIdx(si); setSelId(fid); }} />
            </>
          )}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }]} onChange={setDevice} />
        <TweakSection label="Languages" />
        <TweakRadio label="Primary language" value={t.primaryLang}
          options={LANGS.map((l) => ({ value: l.code, label: l.native }))}
          onChange={(v) => setTweak('primaryLang', v)} />
        <TweakToggle label="Flag untranslated fields" value={t.showBadges} onChange={(v) => setTweak('showBadges', v)} />
        <TweakToggle label="Highlight fallback text" value={t.highlightMissing} onChange={(v) => setTweak('highlightMissing', v)} />
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
