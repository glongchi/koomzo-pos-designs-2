/* Koomzo POS — Workflow Orchestrator app.
   Build a business process as a node graph: drag step nodes, connect ports,
   configure each step (forms, approvals, external tools & URLs), test, go live. */
const { useState, useRef, useLayoutEffect, useEffect } = React;

const WFB_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "showGrid": true
}/*EDITMODE-END*/;

const WFB_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1112, h: 834, label: 'Tablet',  icon: 'tablet-landscape-outline' },
};

const CANVAS_W = 1320, CANVAS_H = 900;

/* palette layout */
const WF_PAL = [
  { label: 'Triggers', items: ['trig.order', 'trig.form', 'trig.schedule', 'trig.webhook'] },
  { label: 'Human steps', items: ['form', 'approval', 'task'] },
  { label: 'Apps & integrations', items: ['http', 'email', 'slack', 'sheets', 'payment', 'crm'] },
  { label: 'Logic', items: ['condition', 'delay', 'end'] },
];

/* seeded sample process — "Wholesale order fulfillment" */
const mk = (id, type, x, y, over = {}) => ({ id, type, x, y, title: WF_TYPES[type].label, sub: WF_TYPES[type].sub, config: defaultConfig(type), ...over });
const SEED_NODES = [
  mk('n1', 'trig.order', 552, 40, { title: 'Order over 180 000 F', sub: 'When a large order is placed' }),
  mk('n2', 'form', 552, 154, { title: 'Collect PO details', sub: 'Purchase-order form', config: { formRef: 'Wholesale PO' } }),
  mk('n3', 'approval', 552, 268, { title: 'Finance approval', sub: 'Manager sign-off', config: { approver: 'Finance manager', sla: '24 hours' } }),
  mk('n4', 'condition', 552, 382, { title: 'Approved?', sub: 'approval.status = approved', config: { field: 'approval.status', op: '=', value: 'approved' } }),
  mk('n5', 'http', 286, 520, { title: 'Sync to ERP', sub: 'POST  /v1/orders', config: { method: 'POST', url: 'https://erp.koomzo.app/v1/orders', auth: 'Bearer token' } }),
  mk('n6', 'slack', 286, 634, { title: 'Notify warehouse', sub: 'WhatsApp Business · #fulfillment', config: { channel: '#fulfillment', account: 'Koomzo Workspace' } }),
  mk('n7', 'end', 286, 748, { title: 'Fulfilled', sub: 'Process complete' }),
  mk('n8', 'email', 824, 520, { title: 'Notify customer', sub: 'Order declined', config: { to: '{{customer.email}}', template: 'Order declined' } }),
  mk('n9', 'end', 824, 634, { title: 'Declined', sub: 'Process complete' }),
];
const SEED_EDGES = [
  { id: 'e1', from: 'n1', to: 'n2', branch: 'out' },
  { id: 'e2', from: 'n2', to: 'n3', branch: 'out' },
  { id: 'e3', from: 'n3', to: 'n4', branch: 'out' },
  { id: 'e4', from: 'n4', to: 'n5', branch: 'yes' },
  { id: 'e5', from: 'n4', to: 'n8', branch: 'no' },
  { id: 'e6', from: 'n5', to: 'n6', branch: 'out' },
  { id: 'e7', from: 'n6', to: 'n7', branch: 'out' },
  { id: 'e8', from: 'n8', to: 'n9', branch: 'out' },
];

/* derive the subtitle shown on a node from its config */
function subFromConfig(n) {
  const c = n.config || {};
  switch (n.type) {
    case 'http': return `${c.method || 'POST'}  ${(c.url || '').replace(/^https?:\/\/[^/]+/, '') || '/endpoint'}`;
    case 'trig.webhook': return `${c.method || 'POST'} · inbound`;
    case 'form': return c.formRef || 'Select a form';
    case 'approval': return c.approver || 'Choose approver';
    case 'task': return `To ${c.assignee || 'team'}`;
    case 'email': return c.template ? `Template · ${c.template}` : 'Compose email';
    case 'slack': return `WhatsApp Business · ${c.channel || '#channel'}`;
    case 'sheets': return c.sheet || 'Append a row';
    case 'payment': return `${c.account || 'MTN MoMo API'} · ${c.amount || ''}`;
    case 'crm': return `${c.account || 'CRM'} · ${c.object || ''}`;
    case 'condition': return `${c.field || 'field'} ${c.op || '='} ${c.value || ''}`;
    case 'delay': return `Wait ${c.amount || '1'} ${c.unit || 'hours'}`;
    case 'trig.schedule': return `${c.freq || 'Daily'} · ${c.at || '09:00'}`;
    default: return n.sub;
  }
}

/* =================== STAGE =================== */
function useFit(w, h) {
  const [s, setS] = useState(1);
  useLayoutEffect(() => {
    const f = () => setS(Math.min(1, (window.innerWidth - 52) / w, (window.innerHeight - 108) / h));
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, [w, h]);
  return s;
}
function Stage({ w, h, scale, className, children }) {
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className={'device ' + className} style={{ width: w, height: h, transform: `scale(${scale})` }}>{children}</div>
      </div>
    </div>
  );
}

/* =================== INSPECTOR =================== */
function Inspector({ node, onPatch, onPatchConfig, onDelete }) {
  if (!node) return (
    <div className="wf-pane wf-inspector">
      <div className="wf-pane__head"><h3>Step settings</h3></div>
      <div className="wf-inspector__empty">
        <ion-icon name="settings-outline"></ion-icon>
        <b>No step selected</b>
        <span>Select a node on the canvas to configure it, or drag a new step from the left.</span>
      </div>
    </div>
  );
  const def = WF_TYPES[node.type];
  const cat = WF_CAT[def.cat];
  const c = node.config || {};
  const P = (k, v) => onPatchConfig({ [k]: v });

  return (
    <div className="wf-pane wf-inspector" style={{ '--nc': cat.color, '--ncw': cat.wash }}>
      <div className="wf-pane__head"><h3>Step settings</h3></div>
      <div className="wf-inspector__scroll">
        <div className="wf-insp-head">
          <div className="ic"><ion-icon name={def.icon}></ion-icon></div>
          <div><b>{node.title}</b><span>{cat.label}</span></div>
        </div>

        <div className="wf-prop">
          <label className="wf-prop__label">Step name</label>
          <input className="wf-input" value={node.title} onChange={(e) => onPatch({ title: e.target.value })} />
        </div>

        {/* ---- type-specific config ---- */}
        {node.type === 'form' && (
          <>
            <div className="wf-prop">
              <label className="wf-prop__label">Form</label>
              <select className="wf-input" value={c.formRef} onChange={(e) => P('formRef', e.target.value)}>
                {['Wholesale PO', 'Customer onboarding', 'Product setup', 'Support request', 'Refund request'].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            {(!window.KZ || window.KZ.on('forms', 'builder')) && <a className="wf-openbuilder" href="Koomzo POS - Form Builder.html">
              <ion-icon name="construct-outline"></ion-icon>Edit this form in Form Builder
              <ion-icon className="arrow" name="open-outline"></ion-icon>
            </a>}
          </>
        )}

        {(node.type === 'http' || node.type === 'trig.webhook') && (
          <>
            <div className="wf-prop">
              <label className="wf-prop__label">Method</label>
              <div className="wf-methods">
                {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                  <button key={m} className={c.method === m ? 'active' : ''} onClick={() => P('method', m)}>{m}</button>
                ))}
              </div>
            </div>
            <div className="wf-prop">
              <label className="wf-prop__label">{node.type === 'http' ? 'Endpoint URL' : 'Inbound URL'}</label>
              <input className="wf-input mono" value={c.url} onChange={(e) => P('url', e.target.value)} />
            </div>
            {node.type === 'http' && (
              <div className="wf-prop">
                <label className="wf-prop__label">Authorization</label>
                <input className="wf-input mono" value={c.auth} onChange={(e) => P('auth', e.target.value)} placeholder="Bearer token / API key" />
              </div>
            )}
          </>
        )}

        {['slack', 'sheets', 'payment', 'crm', 'email'].includes(node.type) && (
          <>
            <div className="wf-conn">
              <div className="ic"><ion-icon name={def.icon}></ion-icon></div>
              <div className="t"><b>{c.account || 'Connected app'}</b><span><ion-icon name="checkmark-circle"></ion-icon>Connected</span></div>
              <button className="chg">Change</button>
            </div>
            {node.type === 'slack' && <div className="wf-prop"><label className="wf-prop__label">Channel</label><input className="wf-input" value={c.channel} onChange={(e) => P('channel', e.target.value)} /></div>}
            {node.type === 'sheets' && <div className="wf-prop"><label className="wf-prop__label">Spreadsheet</label><input className="wf-input" value={c.sheet} onChange={(e) => P('sheet', e.target.value)} /></div>}
            {node.type === 'email' && <>
              <div className="wf-prop"><label className="wf-prop__label">To</label><input className="wf-input mono" value={c.to} onChange={(e) => P('to', e.target.value)} /></div>
              <div className="wf-prop"><label className="wf-prop__label">Template</label><input className="wf-input" value={c.template} onChange={(e) => P('template', e.target.value)} /></div>
            </>}
            {node.type === 'payment' && <div className="wf-prop"><label className="wf-prop__label">Amount</label><input className="wf-input mono" value={c.amount} onChange={(e) => P('amount', e.target.value)} /></div>}
            {node.type === 'crm' && <div className="wf-prop"><label className="wf-prop__label">Record type</label><input className="wf-input" value={c.object} onChange={(e) => P('object', e.target.value)} /></div>}
          </>
        )}

        {node.type === 'approval' && (
          <div className="wf-prop__row">
            <div className="wf-prop"><label className="wf-prop__label">Approver</label><input className="wf-input" value={c.approver} onChange={(e) => P('approver', e.target.value)} /></div>
            <div className="wf-prop grow0"><label className="wf-prop__label">SLA</label><input className="wf-input" value={c.sla} onChange={(e) => P('sla', e.target.value)} /></div>
          </div>
        )}
        {node.type === 'task' && (
          <div className="wf-prop__row">
            <div className="wf-prop"><label className="wf-prop__label">Assignee</label><input className="wf-input" value={c.assignee} onChange={(e) => P('assignee', e.target.value)} /></div>
            <div className="wf-prop grow0"><label className="wf-prop__label">Due in</label><input className="wf-input" value={c.due} onChange={(e) => P('due', e.target.value)} /></div>
          </div>
        )}
        {node.type === 'delay' && (
          <div className="wf-prop__row">
            <div className="wf-prop grow0"><label className="wf-prop__label">Amount</label><input className="wf-input mono" value={c.amount} onChange={(e) => P('amount', e.target.value)} /></div>
            <div className="wf-prop"><label className="wf-prop__label">Unit</label>
              <select className="wf-input" value={c.unit} onChange={(e) => P('unit', e.target.value)}>{['minutes', 'hours', 'days'].map((u) => <option key={u}>{u}</option>)}</select>
            </div>
          </div>
        )}
        {node.type === 'trig.schedule' && (
          <div className="wf-prop__row">
            <div className="wf-prop"><label className="wf-prop__label">Frequency</label>
              <select className="wf-input" value={c.freq} onChange={(e) => P('freq', e.target.value)}>{['Hourly', 'Daily', 'Weekly', 'Monthly'].map((u) => <option key={u}>{u}</option>)}</select>
            </div>
            <div className="wf-prop grow0"><label className="wf-prop__label">At</label><input className="wf-input mono" value={c.at} onChange={(e) => P('at', e.target.value)} /></div>
          </div>
        )}
        {node.type === 'condition' && (
          <>
            <div className="wf-insp-section" style={{ borderTop: 'none', paddingTop: 0 }}>Rule</div>
            <div className="wf-rule">
              <div className="wf-prop" style={{ margin: 0 }}><label className="wf-prop__label">Field</label><input className="wf-input mono" value={c.field} onChange={(e) => P('field', e.target.value)} /></div>
              <div className="wf-prop__row">
                <div className="wf-prop grow0" style={{ margin: 0 }}><label className="wf-prop__label">Operator</label>
                  <select className="wf-input mono" value={c.op} onChange={(e) => P('op', e.target.value)}>{['=', '≠', '>', '<', '≥', '≤'].map((o) => <option key={o}>{o}</option>)}</select>
                </div>
                <div className="wf-prop" style={{ margin: 0 }}><label className="wf-prop__label">Value</label><input className="wf-input mono" value={c.value} onChange={(e) => P('value', e.target.value)} /></div>
              </div>
            </div>
            <p style={{ font: '400 11.5px/1.5 var(--kz-font-sans)', color: 'var(--kz-muted-2)', marginTop: 10 }}>
              Connect the <b style={{ color: 'var(--kz-success)' }}>Yes</b> and <b style={{ color: 'var(--kz-discount)' }}>No</b> ports to the next steps for each outcome.
            </p>
          </>
        )}

        {def.cat === 'trigger' && node.type === 'trig.order' && (
          <p style={{ font: '400 12px/1.5 var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>
            This process starts automatically whenever a matching order is placed at any register.
          </p>
        )}

        <button className="wf-insp-danger" onClick={() => onDelete(node.id)}><ion-icon name="trash-outline"></ion-icon>Delete step</button>
      </div>
    </div>
  );
}

/* =================== APP =================== */
function App() {
  const [t, setTweak] = useTweaks(WFB_TWEAKS);
  const [device, setDevice] = useState('desktop');
  const dev = WFB_DEVICES[device];
  const fit = useFit(dev.w, dev.h);

  const [nodes, setNodes] = useState(SEED_NODES);
  const [edges, setEdges] = useState(SEED_EDGES);
  const [selId, setSelId] = useState(null);
  const [selEdge, setSelEdge] = useState(null);
  const [name, setName] = useState('Wholesale order fulfillment');
  const [status, setStatus] = useState('draft');
  const [zoom, setZoom] = useState(1);
  const [arm, setArm] = useState(null);          // {from, branch}
  const [showJson, setShowJson] = useState(false);
  const [running, setRunning] = useState(null);  // node id currently "running"
  const [toast, setToast] = useState(null);

  const dragRef = useRef(null);
  const vpRef = useRef(null);
  const fitRef = useRef(fit); fitRef.current = fit;
  const zoomRef = useRef(zoom); zoomRef.current = zoom;

  /* Fit the process to whatever the canvas pane actually is. The graph is a fixed
     1320×900 model space with nodes authored around x=550; a narrow pane would
     otherwise open on empty grid with the whole process off to the right. Zoom only
     ever reduces, and the viewport lands on the content's top-left corner. */
  useLayoutEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const NW = 216, NH = 80, pad = 28;
    const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
    if (!xs.length) return;
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const w = Math.max(...xs.map((x) => x + NW)) - minX;
    const z = Math.min(1, (vp.clientWidth - pad * 2) / w);
    setZoom(+z.toFixed(2));
    vp.scrollLeft = Math.max(0, minX * z - pad);
    vp.scrollTop = Math.max(0, minY * z - pad);
  }, [device]);

  const sel = nodes.find((n) => n.id === selId) || null;
  const nodeById = (id) => nodes.find((n) => n.id === id);

  /* ---- mutations ---- */
  const patchNode = (patch) => setNodes((ns) => ns.map((n) => n.id === selId ? { ...n, ...patch } : n));
  const patchConfig = (patch) => setNodes((ns) => ns.map((n) => {
    if (n.id !== selId) return n;
    const nn = { ...n, config: { ...n.config, ...patch } };
    nn.sub = subFromConfig(nn);
    return nn;
  }));
  const deleteNode = (id) => { setNodes((ns) => ns.filter((n) => n.id !== id)); setEdges((es) => es.filter((e) => e.from !== id && e.to !== id)); if (selId === id) setSelId(null); };
  const clearCanvas = () => {
    if (!nodes.length) return;
    if (!window.confirm('Clear the canvas? This removes every step and connection.')) return;
    setNodes([]); setEdges([]); setSelId(null); setSelEdge(null); setArm(null); setShowJson(false);
    setToast('Canvas cleared');
    setTimeout(() => setToast(null), 2200);
  };
  const publish = () => {
    setStatus('live');
    setToast('Workflow published — now live');
    setTimeout(() => setToast(null), 2600);
  };
  const deleteEdge = (id) => { setEdges((es) => es.filter((e) => e.id !== id)); setSelEdge(null); };

  const addEdge = (from, to, branch) => {
    if (from === to) return;
    setEdges((es) => {
      const filtered = es.filter((e) => !(e.from === from && e.branch === branch) && !(e.from === from && e.to === to));
      return [...filtered, { id: 'e' + Math.random().toString(36).slice(2, 7), from, to, branch }];
    });
  };

  const addNode = (type) => {
    const base = sel ? { x: sel.x, y: Math.min(CANVAS_H - 80, sel.y + 120) } : { x: CANVAS_W / 2 - WF_NW / 2, y: 120 };
    const n = wfNewNode(type, base.x, base.y);
    n.sub = subFromConfig(n);
    setNodes((ns) => [...ns, n]);
    if (sel && sel.type !== 'end' && sel.type !== 'condition') addEdge(sel.id, n.id, 'out');
    setSelId(n.id);
  };

  /* ---- node drag ---- */
  const onNodePointerDown = (e, id) => {
    if (arm) { if (arm.from !== id) { addEdge(arm.from, id, arm.branch); } setArm(null); return; }
    setSelId(id); setSelEdge(null);
    const n = nodeById(id); if (!n) return;
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, nx: n.x, ny: n.y, moved: false };
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
  };
  const onDragMove = (e) => {
    const d = dragRef.current; if (!d) return;
    const s = fitRef.current * zoomRef.current;
    const nx = Math.round(d.nx + (e.clientX - d.sx) / s);
    const ny = Math.round(d.ny + (e.clientY - d.sy) / s);
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true;
    setNodes((ns) => ns.map((n) => n.id === d.id ? { ...n, x: Math.max(0, nx), y: Math.max(0, ny) } : n));
  };
  const onDragUp = () => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
  };

  /* ---- connect via ports ---- */
  const onPortDown = (id, branch) => { setArm({ from: id, branch }); setSelId(id); };
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') { setArm(null); setSelEdge(null); } };
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, []);

  /* ---- test run ---- */
  const testRun = () => {
    const order = []; let cur = nodes.find((n) => WF_TYPES[n.type].cat === 'trigger');
    const seen = new Set();
    while (cur && !seen.has(cur.id)) { seen.add(cur.id); order.push(cur.id); const nx = edges.find((e) => e.from === cur.id); cur = nx ? nodeById(nx.to) : null; }
    if (!order.length) return;
    let i = 0;
    const tick = () => {
      if (i >= order.length) { setRunning(null); setToast('Test run completed — all steps passed'); setTimeout(() => setToast(null), 2600); return; }
      setRunning(order[i]); i++; setTimeout(tick, 460);
    };
    tick();
  };

  /* ---- serialized process ---- */
  const processJson = {
    name, status,
    steps: nodes.map((n) => ({
      id: n.id, type: n.type, name: n.title,
      ...(Object.keys(n.config || {}).length ? { config: n.config } : {}),
      next: edges.filter((e) => e.from === n.id).map((e) => (e.branch === 'out' ? e.to : { [e.branch]: e.to })),
    })),
  };

  /* ---- edge midpoint (for delete handle) ---- */
  const edgeMid = (a, b) => {
    const dy = Math.max(34, Math.abs(b.y - a.y) * 0.5);
    const c1 = { x: a.x, y: a.y + dy }, c2 = { x: b.x, y: b.y - dy };
    return { x: 0.125 * a.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * b.x, y: 0.125 * a.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * b.y };
  };

  const accentStyle = { '--kz-primary': t.accent };

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div className={'wf' + (device === 'tablet' ? ' is-tablet' : '')} style={accentStyle}>

          {/* PALETTE */}
          <div className="wf-pane wf-palette">
            <div className="wf-pane__head"><h3>Steps</h3></div>
            <div className="wf-search"><ion-icon name="search-outline"></ion-icon><input placeholder="Search steps & apps" /></div>
            <div className="wf-palette__scroll">
              {WF_PAL.map((g) => (
                <div className="wf-palette__group" key={g.label}>
                  <div className="wf-palette__label">{g.label}</div>
                  {g.items.map((type) => {
                    const def = WF_TYPES[type], cat = WF_CAT[def.cat];
                    return (
                      <button key={type} className="wf-palitem" style={{ '--nc': cat.color, '--ncw': cat.wash }}
                        onClick={() => addNode(type)} title="Click to add to the canvas">
                        <span className="wf-palitem__ic"><ion-icon name={def.icon}></ion-icon></span>
                        <span className="wf-palitem__t"><b>{def.label}</b><span>{def.sub}</span></span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* CANVAS */}
          <div className="wf-pane wf-canvas">
            <div className="wf-toolbar">
              <div className="wf-toolbar__name">
                <span className="crumb">Automations</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="wf-toolbar__spacer"></div>
              <button className={'wf-status ' + status} onClick={() => setStatus((s) => s === 'draft' ? 'live' : 'draft')}>
                <span className="dot"></span>{status === 'draft' ? 'Draft' : 'Live'}
              </button>
              <a className="wf-tbtn" href="Koomzo POS - Automations.html" title="All workflows"><ion-icon name="albums-outline"></ion-icon>Workflows</a>
              {(!window.KZ || window.KZ.on('automations', 'runs')) && <a className="wf-tbtn" href="Koomzo POS - Workflow Runs.html" title="Run history"><ion-icon name="pulse-outline"></ion-icon>Runs</a>}
              <button className="wf-tbtn" onClick={clearCanvas} title="Reset the canvas"><ion-icon name="refresh-outline"></ion-icon>Clear</button>
              <button className="wf-tbtn" onClick={() => setShowJson((s) => !s)} title="View process JSON"><ion-icon name="code-slash-outline"></ion-icon>JSON</button>
              <button className="wf-tbtn" onClick={testRun}><ion-icon name="play-outline"></ion-icon>Test run</button>
              <button className="wf-tbtn" onClick={() => setToast('Workflow saved')}><ion-icon name="save-outline"></ion-icon>Save</button>
              <button className="wf-tbtn primary" onClick={publish}><ion-icon name="rocket-outline"></ion-icon>Publish</button>
            </div>

            <div className="wf-viewport" ref={vpRef} onClick={() => { setSelId(null); setSelEdge(null); setArm(null); }}>
              <div className={'wf-graph' + (t.showGrid ? ' grid' : '')}
                style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${zoom})` }}>

                {/* connectors */}
                <svg className="wf-edges" width={CANVAS_W} height={CANVAS_H}>
                  <defs>
                    <marker id="wf-arrow" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
                      <path d="M1 1 L7 4.5 L1 8" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </marker>
                  </defs>
                  {edges.map((e) => {
                    const a = nodeById(e.from), b = nodeById(e.to); if (!a || !b) return null;
                    const p1 = wfOutPort(a, e.branch), p2 = wfInPort(b);
                    const d = wfPath(p1, p2);
                    const cls = 'wf-edge' + (e.branch === 'yes' ? ' yes' : e.branch === 'no' ? ' no' : '') + (selEdge === e.id ? ' sel' : '');
                    return (
                      <g key={e.id}>
                        <path className={cls} d={d} markerEnd="url(#wf-arrow)" />
                        <path className="wf-edge hit" d={d} onClick={(ev) => { ev.stopPropagation(); setSelEdge(e.id); setSelId(null); }} />
                      </g>
                    );
                  })}
                  {selEdge && (() => {
                    const e = edges.find((x) => x.id === selEdge); if (!e) return null;
                    const a = nodeById(e.from), b = nodeById(e.to); if (!a || !b) return null;
                    const m = edgeMid(wfOutPort(a, e.branch), wfInPort(b));
                    return (
                      <g className="wf-edgedel" onClick={(ev) => { ev.stopPropagation(); deleteEdge(e.id); }}>
                        <circle cx={m.x} cy={m.y} r="11" fill="#fff" stroke="var(--kz-discount)" strokeWidth="1.5" />
                        <path d={`M ${m.x - 4} ${m.y - 4} L ${m.x + 4} ${m.y + 4} M ${m.x + 4} ${m.y - 4} L ${m.x - 4} ${m.y + 4}`} stroke="var(--kz-discount)" strokeWidth="1.6" strokeLinecap="round" />
                      </g>
                    );
                  })()}
                </svg>

                {/* nodes */}
                {nodes.map((n) => (
                  <WfNode key={n.id} n={n} selected={selId === n.id} running={running === n.id}
                    connectTarget={!!arm && arm.from !== n.id}
                    armed={arm && arm.from === n.id ? arm.branch : null}
                    onPointerDown={onNodePointerDown} onSelect={(id) => { setSelId(id); setSelEdge(null); }}
                    onDelete={deleteNode} onPortDown={onPortDown} />
                ))}
              </div>

              {/* connect-mode banner */}
              {arm && (
                <div className="wf-connbar" onClick={(e) => e.stopPropagation()}>
                  <ion-icon name="git-network-outline"></ion-icon>
                  Click a step to connect{arm.branch !== 'out' ? ` the ${arm.branch.toUpperCase()} branch` : ''}
                  <button onClick={() => setArm(null)}>Cancel</button>
                </div>
              )}

              {/* zoom dock */}
              <div className="wf-zoom" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}><ion-icon name="remove-outline"></ion-icon></button>
                <span className="lvl">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}><ion-icon name="add-outline"></ion-icon></button>
                <button onClick={() => setZoom(1)} title="Reset zoom"><ion-icon name="scan-outline"></ion-icon></button>
              </div>

              {/* legend */}
              <div className="wf-legend" onClick={(e) => e.stopPropagation()}>
                <span><i style={{ background: 'var(--kz-success)' }}></i>Trigger</span>
                <span><i style={{ background: 'var(--kz-primary)' }}></i>Form</span>
                <span><i style={{ background: 'var(--kz-info)' }}></i>Integration</span>
                <span><i style={{ background: 'var(--kz-warning)' }}></i>Logic</span>
              </div>
            </div>

            {/* JSON drawer */}
            {showJson && (
              <div className="wf-json" onClick={(e) => e.stopPropagation()}>
                <div className="wf-json__head">
                  <b>Process definition</b><span className="tag">{nodes.length} steps · {edges.length} links</span>
                  <button onClick={() => setShowJson(false)}><ion-icon name="close-outline"></ion-icon></button>
                </div>
                <pre dangerouslySetInnerHTML={{ __html: wfHighlight(processJson) }}></pre>
              </div>
            )}

            {toast && <div className="wf-toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}
          </div>

          {/* INSPECTOR */}
          <Inspector node={sel} onPatch={patchNode} onPatchConfig={patchConfig} onDelete={deleteNode} />
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }]} onChange={setDevice} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent color" value={t.accent} options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Canvas" />
        <TweakToggle label="Show dotted grid" value={t.showGrid} onChange={(v) => setTweak('showGrid', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
