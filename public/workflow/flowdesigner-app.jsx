/* Koomzo POS — Flow Designer app (Workflow v2 style).
   Faithful recreation of saswat-pramati/workflow-ui: SVG flowchart with
   ellipse/rectangle/diamond shapes, orthogonal arrow connectors, dark
   Actions/Toolbar cards, a Property Inspector, and a live Controls JSON. */
const { useState, useRef, useLayoutEffect, useEffect } = React;

const FDB_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf"
}/*EDITMODE-END*/;

const FDB_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1112, h: 834, label: 'Tablet',  icon: 'tablet-landscape-outline' },
};
const FD_CW = 1200, FD_CH = 1000;

const STEP_TYPES = ['HelloWorldService', 'AddNumbers', 'PrintMessageService', 'SendEmailService', 'ChargeCardService'];

/* ---- seed graph (mirrors the reference screenshot) ---- */
const seedControls = () => ([
  { id: 1, type: 'circle',    cordinate: { x: 300, y: 60 },  nextId: [2], data: { Id: 'Start', StepType: 'Start' } },
  { id: 2, type: 'activity',  cordinate: { x: 225, y: 150 }, nextId: [3], data: { Id: 'Activity1', StepType: 'WorkflowCore.Service.Demo.PrintMessageService, WorkflowCore' } },
  { id: 3, type: 'activity',  cordinate: { x: 450, y: 150 }, nextId: [], data: { Id: 'Activity2', StepType: 'WorkflowCore.Service.Demo.AddNumbers, WorkflowCore' } },
  { id: 4, type: 'condition', cordinate: { x: 300, y: 330 }, nextId: [5, 6], data: { Id: 'Condition1', StepType: 'WorkflowCore.Steps.Primitives.If', Inputs: { Condition: 'data.Value > 3' } } },
  { id: 5, type: 'activity',  cordinate: { x: 540, y: 305 }, nextId: [7], data: { Id: 'Activity3', StepType: 'WorkflowCore.Service.Demo.HelloWorldService, WorkflowCore' } },
  { id: 6, type: 'activity',  cordinate: { x: 225, y: 450 }, nextId: [8], data: { Id: 'Activity4', StepType: 'WorkflowCore.Service.Demo.AddNumbers, WorkflowCore' } },
  { id: 7, type: 'activity',  cordinate: { x: 700, y: 440 }, nextId: [], data: { Id: 'Activity5', StepType: 'WorkflowCore.Service.Demo.PrintMessageService, WorkflowCore' } },
  { id: 8, type: 'condition', cordinate: { x: 540, y: 480 }, nextId: [7], data: { Id: 'Condition2', StepType: 'WorkflowCore.Steps.Primitives.If', Inputs: { Condition: 'data.Result == true' } } },
  { id: 9, type: 'circle',    cordinate: { x: 700, y: 590 }, nextId: [], data: { Id: 'End', StepType: 'Start' } },
]);
const seedLinks = () => ([
  { id: 1, fromId: 1, toId: 2, fromSide: 'bottom', branch: 'out' },
  { id: 2, fromId: 2, toId: 3, fromSide: 'right',  branch: 'out' },
  { id: 3, fromId: 2, toId: 4, fromSide: 'bottom', branch: 'out' },
  { id: 4, fromId: 4, toId: 5, fromSide: 'right',  branch: 'no' },
  { id: 5, fromId: 4, toId: 6, fromSide: 'bottom', branch: 'yes' },
  { id: 6, fromId: 5, toId: 7, fromSide: 'right',  branch: 'out' },
  { id: 7, fromId: 6, toId: 8, fromSide: 'right',  branch: 'out' },
  { id: 8, fromId: 8, toId: 7, fromSide: 'right',  branch: 'no' },
  { id: 9, fromId: 8, toId: 9, fromSide: 'bottom', branch: 'yes' },
]);

const shortType = (st) => (st || '').split('.').pop().replace(/,.*$/, '').replace(/^If$|^While$|^ForEach$/, (m) => m) || st;

/* ---- stage ---- */
function useFit(w, h) {
  const [s, setS] = useState(1);
  useLayoutEffect(() => {
    const f = () => setS(Math.min(1, (window.innerWidth - 52) / w, (window.innerHeight - 108) / h));
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, [w, h]);
  return s;
}

function App() {
  const [t, setTweak] = useTweaks(FDB_TWEAKS);
  const [device, setDevice] = useState('desktop');
  const dev = FDB_DEVICES[device];
  const fit = useFit(dev.w, dev.h);

  const [controls, setControls] = useState(seedControls);
  const [links, setLinks] = useState(seedLinks);
  const [selId, setSelId] = useState(2);
  const [selLink, setSelLink] = useState(null);
  const [arm, setArm] = useState(null);       // {from, side, branch}
  const [running, setRunning] = useState(null);
  const [toast, setToast] = useState(null);
  const [collapsed, setCollapsed] = useState({ prop: false, json: false });
  const [hist, setHist] = useState({ past: [], future: [] });

  const idRef = useRef(100);
  const dragRef = useRef(null);
  const fitRef = useRef(fit); fitRef.current = fit;

  const byId = (id) => controls.find((c) => c.id === id);
  const sel = byId(selId) || null;

  /* ---- history ---- */
  const snapshot = () => ({ controls: JSON.parse(JSON.stringify(controls)), links: JSON.parse(JSON.stringify(links)) });
  const commit = (nextControls, nextLinks) => {
    setHist((h) => ({ past: [...h.past, snapshot()].slice(-40), future: [] }));
    if (nextControls) setControls(nextControls);
    if (nextLinks) setLinks(nextLinks);
  };
  const undo = () => setHist((h) => {
    if (!h.past.length) return h;
    const prev = h.past[h.past.length - 1];
    setControls(prev.controls); setLinks(prev.links);
    return { past: h.past.slice(0, -1), future: [snapshot(), ...h.future].slice(0, 40) };
  });
  const redo = () => setHist((h) => {
    if (!h.future.length) return h;
    const nxt = h.future[0];
    setControls(nxt.controls); setLinks(nxt.links);
    return { past: [...h.past, snapshot()], future: h.future.slice(1) };
  });

  /* ---- mutations ---- */
  const patchData = (patch) => { commit(); setControls((cs) => cs.map((c) => c.id === selId ? { ...c, data: { ...c.data, ...patch } } : c)); };
  const setExpression = (expr) => { commit(); setControls((cs) => cs.map((c) => c.id === selId ? { ...c, data: { ...c.data, Inputs: { ...(c.data.Inputs || {}), Condition: expr } } } : c)); };

  const addControl = (type) => {
    commit();
    const id = ++idRef.current;
    const n = controls.filter((c) => c.type === type).length + 1;
    const labelMap = { circle: 'Start', activity: 'Activity' + n, condition: 'Condition' + n };
    const place = sel ? { x: sel.cordinate.x + 30, y: sel.cordinate.y + 110 } : { x: 300, y: 120 };
    const ctrl = { id, type, cordinate: place, nextId: [], data: { Id: labelMap[type], StepType: type === 'condition' ? 'WorkflowCore.Steps.Primitives.If' : type === 'circle' ? 'Start' : '' } };
    setControls((cs) => [...cs, ctrl]); setSelId(id);
  };

  const deleteControl = (id) => {
    commit();
    setControls((cs) => cs.filter((c) => c.id !== id).map((c) => ({ ...c, nextId: c.nextId.filter((n) => n !== id) })));
    setLinks((ls) => ls.filter((l) => l.fromId !== id && l.toId !== id));
    if (selId === id) setSelId(null);
  };
  const deleteLink = (lid) => {
    commit();
    const lk = links.find((l) => l.id === lid);
    setLinks((ls) => ls.filter((l) => l.id !== lid));
    if (lk) setControls((cs) => cs.map((c) => c.id === lk.fromId ? { ...c, nextId: c.nextId.filter((n) => n !== lk.toId) } : c));
    setSelLink(null);
  };

  const connect = (fromId, toId, side, branch) => {
    if (fromId === toId) return;
    commit();
    const lid = ++idRef.current;
    setLinks((ls) => [...ls.filter((l) => !(l.fromId === fromId && l.branch === branch && branch !== 'out')), { id: lid, fromId, toId, fromSide: side, branch }]);
    setControls((cs) => cs.map((c) => c.id === fromId && !c.nextId.includes(toId) ? { ...c, nextId: [...c.nextId, toId] } : c));
  };

  /* ---- drag ---- */
  const onShapeDown = (e, id) => {
    if (arm) { if (arm.from !== id) connect(arm.from, id, arm.side, arm.branch); setArm(null); return; }
    setSelId(id); setSelLink(null);
    const c = byId(id); if (!c) return;
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: c.cordinate.x, oy: c.cordinate.y, moved: false, committed: false };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  const onMove = (e) => {
    const d = dragRef.current; if (!d) return;
    if (!d.committed && (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy)) > 3) { commit(); d.committed = true; d.moved = true; }
    const s = fitRef.current;
    const nx = Math.round(d.ox + (e.clientX - d.sx) / s);
    const ny = Math.round(d.oy + (e.clientY - d.sy) / s);
    setControls((cs) => cs.map((c) => c.id === d.id ? { ...c, cordinate: { x: Math.max(20, nx), y: Math.max(20, ny) } } : c));
  };
  const onUp = () => { dragRef.current = null; window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };

  const onHandleDown = (id, side) => { setSelId(id); const c = byId(id); const branch = c && c.type === 'condition' ? (side === 'bottom' ? 'yes' : 'no') : 'out'; setArm({ from: id, side, branch }); };

  /* ---- nudge selected via action bar ---- */
  const nudge = (dx, dy) => { if (!sel) return; commit(); setControls((cs) => cs.map((c) => c.id === selId ? { ...c, cordinate: { x: c.cordinate.x + dx, y: c.cordinate.y + dy } } : c)); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setArm(null); setSelLink(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selId && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') { deleteControl(selId); }
      if (selId && document.activeElement.tagName !== 'INPUT') {
        if (e.key === 'ArrowLeft') { nudge(-10, 0); e.preventDefault(); }
        if (e.key === 'ArrowRight') { nudge(10, 0); e.preventDefault(); }
        if (e.key === 'ArrowUp') { nudge(0, -10); e.preventDefault(); }
        if (e.key === 'ArrowDown') { nudge(0, 10); e.preventDefault(); }
      }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });

  /* ---- run ---- */
  const runFlow = () => {
    const order = []; let cur = controls.find((c) => c.data.Id === 'Start'); const seen = new Set();
    while (cur && !seen.has(cur.id)) { seen.add(cur.id); order.push(cur.id); const nx = links.find((l) => l.fromId === cur.id); cur = nx ? byId(nx.toId) : null; }
    if (!order.length) return;
    let i = 0; const tick = () => {
      if (i >= order.length) { setRunning(null); setToast('Workflow run complete'); setTimeout(() => setToast(null), 2400); return; }
      setRunning(order[i]); i++; setTimeout(tick, 440);
    }; tick();
  };

  /* ---- serialized controls (live JSON) ---- */
  const controlsJson = controls.map((c) => ({ id: c.id, type: c.type, cordinate: { x: String(c.cordinate.x), y: String(c.cordinate.y) }, nextId: c.nextId, data: { Id: c.data.Id, StepType: c.data.StepType } }));

  const accentStyle = { '--kz-primary': t.accent };
  const isTarget = (id) => arm && arm.from !== id;

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap"><div className="rt-pass"><div className="rt-pass">
            <div className={'fd' + (device === 'tablet' ? ' is-tablet' : '')} style={accentStyle}>

              {/* NAVBAR */}
              <div className="fd-navbar">
                <div className="fd-navbar__mark"><ion-icon name="git-network-outline"></ion-icon></div>
                <div className="fd-navbar__title">Workflow Designer<span>v2.0</span></div>
                <div className="fd-navbar__spacer"></div>
                <a className="fd-navbtn" href="Koomzo POS - Automations.html" title="All workflows"><ion-icon name="albums-outline"></ion-icon>Workflows</a>
                {(!window.KZ || window.KZ.on('automations', 'runs')) && <a className="fd-navbtn" href="Koomzo POS - Workflow Runs.html" title="Run history"><ion-icon name="pulse-outline"></ion-icon>Runs</a>}
                <button className="fd-navbtn" onClick={() => setToast('Workflow saved')}><ion-icon name="save-outline"></ion-icon>Save</button>
                <button className="fd-navbtn run" onClick={runFlow}><ion-icon name="play-outline"></ion-icon>Run</button>
              </div>

              {/* ACTION BAR */}
              <div className="fd-actionbar">
                <button className="fd-actbtn" disabled={!sel} title="Move left" onClick={() => nudge(-10, 0)}><ion-icon name="arrow-back-outline"></ion-icon></button>
                <button className="fd-actbtn" disabled={!sel} title="Move up" onClick={() => nudge(0, -10)}><ion-icon name="arrow-up-outline"></ion-icon></button>
                <button className="fd-actbtn" disabled={!sel} title="Move down" onClick={() => nudge(0, 10)}><ion-icon name="arrow-down-outline"></ion-icon></button>
                <button className="fd-actbtn" disabled={!sel} title="Move right" onClick={() => nudge(10, 0)}><ion-icon name="arrow-forward-outline"></ion-icon></button>
                <span className="fd-actsep"></span>
                <button className="fd-actbtn" disabled={!hist.past.length} title="Undo" onClick={undo}><ion-icon name="arrow-undo-outline"></ion-icon></button>
                <button className="fd-actbtn" disabled={!hist.future.length} title="Redo" onClick={redo}><ion-icon name="arrow-redo-outline"></ion-icon></button>
                <span className="fd-actsep"></span>
                <button className="fd-actbtn danger" disabled={!sel} title="Delete" onClick={() => deleteControl(selId)}><ion-icon name="trash-outline"></ion-icon></button>
                <span className="fd-actionbar__hint"><ion-icon name="information-circle-outline"></ion-icon>Select a shape, then drag the side arrows to connect</span>
              </div>

              {/* MAIN */}
              <div className="fd-main">
                {/* LEFT */}
                <div className="fd-side left">
                  <div className="fd-card">
                    <div className="fd-card__head">Actions</div>
                    <div className="fd-card__body">
                      <div className="fd-actions-list">
                        <button onClick={() => { commit(); setControls([{ id: 1, type: 'circle', cordinate: { x: 300, y: 80 }, nextId: [], data: { Id: 'Start', StepType: 'Start' } }]); setLinks([]); setSelId(1); }}><ion-icon name="document-outline"></ion-icon>New</button>
                        <button onClick={() => { commit(); setControls(seedControls()); setLinks(seedLinks()); setSelId(2); }}><ion-icon name="folder-open-outline"></ion-icon>Load</button>
                        <button onClick={() => { commit(); setControls([]); setLinks([]); setSelId(null); }}><ion-icon name="trash-bin-outline"></ion-icon>Clear</button>
                      </div>
                    </div>
                  </div>
                  <div className="fd-card">
                    <div className="fd-card__head">Toolbar</div>
                    <div className="fd-card__body">
                      <div className="fd-shapes">
                        <button className="fd-shape" onClick={() => addControl('circle')} title="Add Start / End">
                          <svg width="44" height="30"><ellipse cx="22" cy="15" rx="20" ry="12" fill="#fff" stroke="var(--kz-ink-2)" strokeWidth="1.5" /></svg>
                          <span className="fd-shape__t"><b>Start / End</b><span>Ellipse</span></span>
                        </button>
                        <button className="fd-shape" onClick={() => addControl('activity')} title="Add Activity">
                          <svg width="44" height="30"><rect x="3" y="5" width="38" height="20" rx="3" fill="#fff" stroke="var(--kz-ink-2)" strokeWidth="1.5" /></svg>
                          <span className="fd-shape__t"><b>Activity</b><span>Rectangle</span></span>
                        </button>
                        <button className="fd-shape" onClick={() => addControl('condition')} title="Add Condition">
                          <svg width="44" height="30"><polygon points="22,3 41,15 22,27 3,15" fill="#fff" stroke="var(--kz-ink-2)" strokeWidth="1.5" /></svg>
                          <span className="fd-shape__t"><b>Condition</b><span>Diamond</span></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CANVAS */}
                <div className="fd-canvaswrap" onClick={() => { setSelId(null); setSelLink(null); setArm(null); }}>
                  <svg className="fd-canvas" width={FD_CW} height={FD_CH} onClick={() => { setSelId(null); setSelLink(null); setArm(null); }}>
                    <defs>
                      <marker id="fd-arrow" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto">
                        <path d="M1 1 L8 5 L1 9" fill="none" stroke="var(--kz-muted-3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </marker>
                    </defs>

                    {/* links */}
                    {links.map((l) => {
                      const a = byId(l.fromId), b = byId(l.toId); if (!a || !b) return null;
                      const ba = fdBox(a), bb = fdBox(b);
                      const toSide = fdOpposite[l.fromSide] || 'top';
                      const p1 = fdSide(ba, l.fromSide), p2 = fdSide(bb, toSide);
                      const d = fdLinkPath(p1, p2, l.fromSide);
                      return (
                        <g key={l.id}>
                          <path className={'fd-link' + (selLink === l.id ? ' sel' : '')} d={d} markerEnd="url(#fd-arrow)" />
                          <path className="fd-link-hit" d={d} onClick={(e) => { e.stopPropagation(); setSelLink(l.id); setSelId(null); }} />
                          {selLink === l.id && (() => { const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2; return (
                            <g style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); deleteLink(l.id); }}>
                              <circle cx={mx} cy={my} r="10" fill="#fff" stroke="var(--kz-discount)" strokeWidth="1.4" />
                              <path d={`M ${mx - 4} ${my - 4} L ${mx + 4} ${my + 4} M ${mx + 4} ${my - 4} L ${mx - 4} ${my + 4}`} stroke="var(--kz-discount)" strokeWidth="1.5" strokeLinecap="round" />
                            </g>); })()}
                        </g>
                      );
                    })}

                    {/* shapes */}
                    {controls.map((c) => (
                      <FdShape key={c.id} c={c} selected={selId === c.id} running={running === c.id}
                        connecting={!!arm} isTarget={isTarget(c.id)} armedSide={arm && arm.from === c.id ? arm.side : null}
                        onShapeDown={onShapeDown} onSelect={(id) => { setSelId(id); setSelLink(null); }} onHandleDown={onHandleDown} />
                    ))}
                  </svg>

                  {arm && (
                    <div className="fd-connhint" onClick={(e) => e.stopPropagation()}>
                      <ion-icon name="git-network-outline"></ion-icon>
                      Click a shape to connect{arm.branch !== 'out' ? ` · ${arm.branch.toUpperCase()}` : ''}
                      <button onClick={() => setArm(null)}>Cancel</button>
                    </div>
                  )}
                  {toast && <div className="fd-toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}
                </div>

                {/* RIGHT */}
                <div className="fd-side right">
                  {/* Property Inspector */}
                  <div className="fd-card">
                    <div className="fd-card__head">Property Inspector
                      <button className="collapse-btn" onClick={() => setCollapsed((c) => ({ ...c, prop: !c.prop }))}><ion-icon name={collapsed.prop ? 'add-outline' : 'remove-outline'}></ion-icon></button>
                    </div>
                    {!collapsed.prop && (
                      <div className="fd-card__body">
                        {!sel ? (
                          <div className="fd-prop-empty"><ion-icon name="information-circle-outline"></ion-icon>Select a shape on the canvas to edit its properties.</div>
                        ) : (
                          <>
                            <div className="fd-prop-title">type: {sel.type}
                              <span className="meta">[ no: {sel.id}, {`{ "x": "${sel.cordinate.x}", "y": "${sel.cordinate.y}" }`} ]</span>
                            </div>
                            {sel.type === 'circle' && (
                              <div className="fd-fg">
                                <label>Step Type</label>
                                <select className="fd-control" value={sel.data.Id} onChange={(e) => patchData({ Id: e.target.value })}>
                                  <option>Start</option><option disabled={sel.nextId.length > 0}>End</option>
                                </select>
                              </div>
                            )}
                            {sel.type === 'activity' && (
                              <>
                                <div className="fd-fg"><label>Activity Id</label><input className="fd-control" value={sel.data.Id} onChange={(e) => patchData({ Id: e.target.value })} placeholder="Activity Id" /></div>
                                <div className="fd-fg"><label>Step Type</label>
                                  <select className="fd-control" value={shortType(sel.data.StepType)} onChange={(e) => patchData({ StepType: `WorkflowCore.Service.Demo.${e.target.value}, WorkflowCore` })}>
                                    <option value="">— select —</option>
                                    {STEP_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                                <div className="fd-check-row">
                                  <label className="fd-check"><input type="checkbox" /> input?</label>
                                  <label className="fd-check"><input type="checkbox" /> output?</label>
                                </div>
                              </>
                            )}
                            {sel.type === 'condition' && (
                              <>
                                <div className="fd-fg"><label>Condition Name</label><input className="fd-control" value={sel.data.Id} onChange={(e) => patchData({ Id: e.target.value })} /></div>
                                <div className="fd-fg"><label>Primitive</label>
                                  <select className="fd-control mono" value={sel.data.StepType} onChange={(e) => patchData({ StepType: e.target.value })}>
                                    <option>WorkflowCore.Steps.Primitives.If</option>
                                    <option>WorkflowCore.Steps.Primitives.While</option>
                                    <option>WorkflowCore.Steps.Primitives.ForEach</option>
                                  </select>
                                </div>
                                <div className="fd-fg"><label>Expression to evaluate</label><input className="fd-control mono" value={(sel.data.Inputs && sel.data.Inputs.Condition) || ''} placeholder="Ex: data.Value > 3" onChange={(e) => setExpression(e.target.value)} /></div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Controls JSON */}
                  <div className="fd-card dark">
                    <div className="fd-card__head">Controls
                      <button className="collapse-btn" onClick={() => setCollapsed((c) => ({ ...c, json: !c.json }))}><ion-icon name={collapsed.json ? 'add-outline' : 'remove-outline'}></ion-icon></button>
                    </div>
                    {!collapsed.json && (
                      <div className="fd-json"><pre dangerouslySetInnerHTML={{ __html: fdHighlight(controlsJson) }}></pre></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }]} onChange={setDevice} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent color" value={t.accent} options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']} onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
