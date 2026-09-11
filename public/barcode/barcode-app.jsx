/* Koomzo POS — Barcode Labels: app state, presenter, composition.
   A focused desktop tool (1440×900) in the shared Koomzo admin chrome.
   Views: print · chooser · template editor · custom canvas, with a paper
   settings modal that can target the draft, the active template, or the
   custom canvas. */
const { useState, useMemo, useLayoutEffect } = React;

const BC_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "outline": true,
  "symbology": "Code 128"
}/*EDITMODE-END*/;

function BcStage({ w, h, children }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 52) / w, (window.innerHeight - 56 - 52) / h));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className="device desktop" style={{ width: w, height: h, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const freshDraft = (preset) => ({
  id: 'tpl-' + Math.random().toString(36).slice(2, 7),
  name: '',
  kind: 'barcode',
  symbology: 'Code 128',
  header: 'name', showNumber: true, footerL: null, footerR: null,
  fontSize: 11, bold: true, align: 'center',
  paper: { ...window.BC_DEFAULT_PAPER },
  _preset: 'bc-name-num',
  ...(preset || {}),
});

function App() {
  const [t, setTweak] = useTweaks(BC_TWEAKS);
  const accentStyle = { '--kz-primary': t.accent };

  const products = window.KZ_PA_PRODUCTS;

  const [view, setView] = useState('print');
  const [templates, setTemplates] = useState([window.BC_SEED_TEMPLATE]);
  const [activeId, setActiveId] = useState(window.BC_SEED_TEMPLATE.id);
  const [outline, setOutline] = useState(t.outline);

  // seed the print queue with a few catalogue items
  const [rows, setRows] = useState(() =>
    ['p07', 'p05', 'p13'].map((id, i) => ({ ...products.find((p) => p.id === id), copies: [6, 4, 3][i] }))
  );

  const [draft, setDraft] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [customPaper, setCustomPaper] = useState({ type: 'thermal', name: 'Thermal 50×30', w: 50, h: 30 });
  const [paperTarget, setPaperTarget] = useState(null); // 'draft' | 'active' | 'custom'

  /* keep outline in sync if tweak changes */
  React.useEffect(() => { setOutline(t.outline); }, [t.outline]);

  /* ---- print queue ops ---- */
  const onCopies = (id, val) => setRows((r) => r.map((x) => x.id === id ? { ...x, copies: Math.max(0, val || 0) } : x));
  const onRemove = (id) => setRows((r) => r.filter((x) => x.id !== id));
  const onAdd = (p) => {
    if (p === 'multi') {
      const used = new Set(rows.map((r) => r.id));
      const extra = products.filter((x) => !used.has(x.id)).slice(0, 3).map((x) => ({ ...x, copies: 2 }));
      setRows((r) => [...r, ...extra]);
      return;
    }
    if (p === 'import') { alert('Import a label list from an Excel / CSV sheet.'); return; }
    setRows((r) => r.find((x) => x.id === p.id) ? r : [...r, { ...p, copies: 1 }]);
  };

  /* ---- template ops ---- */
  const goChooser = () => setView('chooser');
  const startDefault = () => { setDraft(freshDraft({ header: 'name', showNumber: true, _preset: 'bc-name-num' })); setIsNew(true); setView('template'); };
  const startCustom = () => setView('custom');
  const editTpl = (id) => { const tp = templates.find((x) => x.id === id); if (tp) { setDraft({ ...tp }); setIsNew(false); setView('template'); } };
  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const applyPreset = (p) => setDraft((d) => ({ ...d, kind: p.kind, header: p.header, showNumber: p.showNumber, footerL: p.footerL, footerR: p.footerR, _preset: p.id }));
  const saveDraft = () => {
    const rec = { ...draft, name: draft.name || 'New Template' };
    setTemplates((cur) => cur.find((x) => x.id === rec.id) ? cur.map((x) => x.id === rec.id ? rec : x) : [...cur, rec]);
    setActiveId(rec.id);
    setDraft(null);
    setView('print');
  };
  const saveCustom = () => {
    const rec = freshDraft({ name: 'Custom label', kind: 'barcode', header: 'name', showNumber: true, footerL: 'price', footerR: null, paper: { ...customPaper } });
    setTemplates((cur) => [...cur, rec]);
    setActiveId(rec.id);
    setView('print');
  };

  /* ---- paper modal ---- */
  const openPaper = (target) => setPaperTarget(target);
  const currentPaper = paperTarget === 'draft' ? (draft && draft.paper)
    : paperTarget === 'custom' ? customPaper
    : (templates.find((x) => x.id === activeId) || templates[0]).paper;
  const applyPaper = (paper) => {
    if (paperTarget === 'draft') setDraft((d) => ({ ...d, paper }));
    else if (paperTarget === 'custom') setCustomPaper(paper);
    else setTemplates((cur) => cur.map((x) => x.id === activeId ? { ...x, paper } : x));
    setPaperTarget(null);
  };

  const onPrint = () => {
    const total = rows.reduce((s, r) => s + (r.copies || 0), 0);
    alert(`Sending ${total} labels to the printer\nTemplate: ${(templates.find((x) => x.id === activeId) || {}).name}`);
  };

  const tag = view === 'template' ? 'Add Label Template' : view === 'custom' ? 'Custom Label' : view === 'chooser' ? 'Label Design' : 'Print Items';

  return (
    <div className="present" style={accentStyle}>
      <div className="present__bar">
        <div className="present__brand">
          <div className="mk"><ion-icon name="storefront"></ion-icon></div>
          <b>koomzo<span> · POS</span></b>
        </div>
        <span className="present__tag">Barcode labels</span>
        <span className="present__dim" style={{ marginLeft: 'auto' }}>1440 × 900</span>
      </div>

      <BcStage w={1440} h={900}>
        <div className="pa-app" style={accentStyle}>
          {(view === 'print' || view === 'chooser') && (
            <>
              <BcRail />
              <div className="pa-main">
                <BcTopbar crumb={view === 'chooser' ? 'Label Design' : 'Print Items'} />
                <div className="bc-scroll">
                  {view === 'chooser' ? (
                    <ChooserScreen hasTemplates={templates.length > 0}
                      onDefault={startDefault} onCustom={startCustom} onBack={() => setView('print')} />
                  ) : (
                    <PrintScreen
                      templates={templates} activeId={activeId} onSelect={setActiveId}
                      onAddNew={goChooser} onEditTpl={editTpl}
                      rows={rows} products={products}
                      onCopies={onCopies} onRemove={onRemove} onAdd={onAdd}
                      outline={outline} onOutline={setOutline} onPrint={onPrint}
                      onPaper={() => openPaper('active')}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {view === 'template' && draft && (
            <TemplateEditor draft={draft} isNew={isNew} onField={setField} onApplyPreset={applyPreset}
              onBack={() => { setDraft(null); setView('print'); }} onSave={saveDraft} onPaper={() => openPaper('draft')} />
          )}

          {view === 'custom' && (
            <CustomEditor paper={customPaper} onBack={() => setView('print')} onSave={saveCustom} onPaper={() => openPaper('custom')} />
          )}

          {paperTarget && currentPaper && (
            <PaperModal paper={currentPaper} onCancel={() => setPaperTarget(null)} onApply={applyPaper} />
          )}

          <TweaksPanel>
            <TweakSection label="Brand" />
            <TweakColor label="Accent color" value={t.accent}
              options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
              onChange={(v) => setTweak('accent', v)} />
            <TweakSection label="Labels" />
            <TweakToggle label="Print with outlines" value={t.outline} onChange={(v) => setTweak('outline', v)} />
            <TweakSelect label="Default symbology" value={t.symbology}
              options={window.BC_SYMBOLOGIES.map((s) => ({ value: s.label, label: s.label }))}
              onChange={(v) => setTweak('symbology', v)} />
          </TweaksPanel>
        </div>
      </BcStage>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
