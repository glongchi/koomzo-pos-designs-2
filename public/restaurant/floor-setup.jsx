/* ============================================================
   Koomzo POS Suite — Restaurant setup
   Floor plan (presets + editor) · Service rules · Modules
   The floor plan is venue configuration, persisted by the store.
   ============================================================ */

const RK_AREA_ICONS = ['home-outline', 'sunny-outline', 'wine-outline', 'star-outline', 'bed-outline', 'storefront-outline'];
const RK_FLOOR_PRESETS = [
  { id: 'maquis', voidRule: 'pin-always', print: true, name: 'Maquis / small restaurant', def: true, desc: 'Indoor room and a terrace — the most common layout.',
    areas: [{ label: 'Salle', icon: 'home-outline', shape: 'square', seats: 4, count: 8 }, { label: 'Terrasse', icon: 'sunny-outline', shape: 'round', seats: 4, count: 4 }] },
  { id: 'restaurant', voidRule: 'free-until-start', name: 'Restaurant', desc: 'Room, terrace and a bar counter.',
    areas: [{ label: 'Salle', icon: 'home-outline', shape: 'square', seats: 4, count: 12 }, { label: 'Terrasse', icon: 'sunny-outline', shape: 'round', seats: 4, count: 6 }, { label: 'Bar', icon: 'wine-outline', shape: 'stool', seats: 1, count: 6 }] },
  { id: 'bar', voidRule: 'pin-always', name: 'Bar / lounge', desc: 'Stools at the bar and lounge tables.',
    areas: [{ label: 'Bar', icon: 'wine-outline', shape: 'stool', seats: 1, count: 8 }, { label: 'Lounge', icon: 'star-outline', shape: 'round', seats: 4, count: 6 }] },
  { id: 'hotel', voidRule: 'free-until-start', name: 'Hotel restaurant', desc: 'Restaurant, bar and room service.',
    areas: [{ label: 'Restaurant', icon: 'home-outline', shape: 'square', seats: 4, count: 10 }, { label: 'Bar', icon: 'wine-outline', shape: 'stool', seats: 1, count: 6 }, { label: 'Room service', icon: 'bed-outline', shape: 'rect', seats: 2, count: 4 }] },
  { id: 'snack', voidRule: 'pin-always', print: true, name: 'Snack / fast food', desc: 'Order at the counter, a few tables to eat in.',
    areas: [{ label: 'Salle', icon: 'storefront-outline', shape: 'square', seats: 4, count: 4 }] },
  { id: 'counter', voidRule: 'pin-always', name: 'Counter only', desc: 'No tables — tabs and counter tickets.', areas: [] },
];

let RK_TID = 1;
const newTid = () => 't' + Date.now().toString(36) + (RK_TID++);

/* lay N tables out on an even grid inside the plan canvas (x/y in %) */
function gridSpots(n) {
  if (!n) return [];
  const cols = Math.min(n, Math.max(2, Math.ceil(Math.sqrt(n * 1.7))));
  const rows = Math.ceil(n / cols);
  return Array.from({ length: n }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    return { x: Math.round(10 + (cols === 1 ? 40 : c * (78 / (cols - 1)))), y: Math.round(rows === 1 ? 40 : 16 + r * (64 / Math.max(1, rows - 1))) };
  });
}
function buildFloors(areas) {
  let num = 1;
  return areas.filter((a) => a.count > 0).map((a, ai) => {
    const prefix = a.shape === 'stool' ? 'S' : a.icon === 'bed-outline' ? 'R' : '';
    const spots = gridSpots(a.count);
    return {
      id: 'a' + ai + Date.now().toString(36), label: a.label, icon: a.icon,
      tables: spots.map((p, i) => ({ id: newTid(), label: prefix ? prefix + (i + 1) : String(num++), seats: a.seats, shape: a.shape, x: p.x, y: p.y })),
    };
  });
}

function Stepper({ value, min, max, onChange }) {
  return (
    <div className="kstep">
      <button onClick={() => onChange(Math.max(min ?? 0, value - 1))}><ion-icon name="remove"></ion-icon></button>
      <span className="v">{value}</span>
      <button onClick={() => onChange(Math.min(max ?? 99, value + 1))}><ion-icon name="add"></ion-icon></button>
    </div>
  );
}

/* onboarding: pick a preset, adjust tables per area, apply */
function PresetSheet({ onClose }) {
  const { setFloors, tableStatusFor, floors, setRules } = useSuite();
  const [pid, setPid] = useState('maquis');
  const preset = RK_FLOOR_PRESETS.find((p) => p.id === pid);
  const [areas, setAreas] = useState(preset.areas);
  useEffect(() => { setAreas(preset.areas.map((a) => ({ ...a }))); }, [pid]);
  const busy = floors.some((f) => f.tables.some((t) => tableStatusFor(t.id) !== 'free'));
  /* G5 — the current plan is archived, not deleted, so past tickets keep their area and table names */
  const apply = () => {
    const at = Date.now();
    setFloors((cur) => [...cur.map((x) => ({ ...x, archivedAt: x.archivedAt || at })), ...buildFloors(areas)]);
    setRules({ voidRule: preset.voidRule, printKitchen: !!preset.print, floorSetupDone: true }); onClose();
  };
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet sheet--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">Start from a layout</h3>
          <p className="sheet__sub">Pick the closest match and set the number of tables. You can drag tables into place afterwards. The layout also sets matching service rules — change them any time. Your current plan is archived, so past orders keep their table names.</p>
          <div className="fs-presets">
            {RK_FLOOR_PRESETS.map((p) => (
              <button key={p.id} className={'fs-preset' + (pid === p.id ? ' on' : '')} onClick={() => setPid(p.id)}>
                <b>{p.name}{p.def && <em>Default</em>}</b>
                <span>{p.desc}</span>
              </button>
            ))}
          </div>
          {areas.length > 0 && (
            <div className="fs-areas">
              {areas.map((a, i) => (
                <div key={i} className="fs-arearow">
                  <ion-icon name={a.icon}></ion-icon>
                  <input value={a.label} onChange={(e) => setAreas((cur) => cur.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                  <span className="fs-k">Tables</span>
                  <Stepper value={a.count} min={0} max={40} onChange={(v) => setAreas((cur) => cur.map((x, j) => j === i ? { ...x, count: v } : x))} />
                </div>
              ))}
            </div>
          )}
          {busy && <div className="fs-warn"><ion-icon name="warning-outline"></ion-icon>Tables are in service. Clear them before replacing the floor plan.</div>}
          <div className="sheet__actions" style={{ marginTop: 18 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-fill" disabled={busy} onClick={apply}>Use this layout</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* drag-and-drop editor on tablet/desktop; list editor on phone */
function FloorEditor() {
  const S = useSuite();
  const { floors, floorsAll, setFloors, tableStatusFor, rules, setRules, tplMode } = S;
  const narrow = useNarrow(680);
  const [showArch, setShowArch] = useState(false);
  const [areaId, setAreaId] = useState(floors[0]?.id);
  const [selId, setSelId] = useState(null);
  const [presets, setPresets] = useState(false);
  useEffect(() => { if (!tplMode && S.tplOpen && S.tplOpen.kind === 'floor') { setPresets({ id: S.tplOpen.id }); S.setTplOpen(null); } }, [S.tplOpen]);
  useEffect(() => { if (!floors.some((f) => f.id === areaId) && floors[0]) setAreaId(floors[0].id); }, [floors, areaId]);
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const area = floors.find((f) => f.id === areaId) || floors[0];
  const sel = area?.tables.find((t) => t.id === selId);
  const inUse = (tid) => tableStatusFor(tid) !== 'free';
  /* labels are unique per location among live tables — conflicts shown inline */
  const norm = (l) => String(l || '').trim().toLowerCase();
  const isDup = (t) => floors.some((fl) => fl.tables.some((x) => x.id !== t.id && norm(x.label) === norm(t.label)));
  const archAreas = floorsAll.filter((fl) => fl.archivedAt);
  const archTables = floorsAll.filter((fl) => !fl.archivedAt).flatMap((fl) => fl.tables.filter((t) => t.archivedAt).map((t) => ({ ...t, area: fl })));
  const restoreArea = (id) => setFloors((cur) => cur.map((fl) => fl.id === id ? { ...fl, archivedAt: null } : fl));
  const restoreTable = (aid, tid) => setFloors((cur) => cur.map((fl) => fl.id !== aid ? fl : { ...fl, tables: fl.tables.map((t) => t.id === tid ? { ...t, archivedAt: null } : t) }));

  const patchArea = (patch) => setFloors((cur) => cur.map((f) => f.id === area.id ? { ...f, ...patch } : f));
  const patchTable = (tid, patch) => setFloors((cur) => cur.map((f) => f.id !== area.id ? f : { ...f, tables: f.tables.map((t) => t.id === tid ? { ...t, ...patch } : t) }));
  const nextLabel = (shape) => {
    const all = floors.flatMap((f) => f.tables.map((t) => t.label));
    if (shape === 'stool') { let i = 1; while (all.includes('S' + i)) i++; return 'S' + i; }
    let i = 1; while (all.includes(String(i))) i++; return String(i);
  };
  const addTable = (shape, from) => {
    const t = { id: newTid(), label: nextLabel(shape), seats: from ? from.seats : (shape === 'stool' ? 1 : shape === 'rect' ? 6 : 4), shape,
      x: from ? Math.min(90, from.x + 8) : 46, y: from ? Math.min(86, from.y + 8) : 46 };
    setFloors((cur) => cur.map((f) => f.id === area.id ? { ...f, tables: [...f.tables, t] } : f));
    setSelId(t.id);
  };
  const delTable = (tid) => { patchTable(tid, { archivedAt: Date.now() }); setSelId(null); };
  const addArea = () => {
    const a = { id: 'a' + Date.now().toString(36), label: 'New area', icon: 'star-outline', tables: [] };
    setFloors((cur) => [...cur, a]); setAreaId(a.id); setSelId(null);
  };
  const moveArea = (d) => setFloors((cur) => { const i = cur.findIndex((f) => f.id === area.id), j = i + d; if (j < 0 || j >= cur.length) return cur; const n = [...cur]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const delArea = () => { patchArea({ archivedAt: Date.now() }); setAreaId(floors.find((f) => f.id !== area.id)?.id); setSelId(null); };

  const onDown = (e, t) => { e.preventDefault(); setSelId(t.id); drag.current = { id: t.id }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    if (!drag.current || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const snap = (v) => Math.round(Math.max(4, Math.min(92, v)) / 2) * 2;
    patchTable(drag.current.id, { x: snap(((e.clientX - r.left) / r.width) * 100), y: snap(((e.clientY - r.top) / r.height) * 100) });
  };
  const onUp = () => { drag.current = null; };

  if (!area) {
    return (
      <div className="fs-empty">
        <ion-icon name="grid-outline"></ion-icon>
        {!tplMode && <TplAppliedBar kind="floor" />}
        <h3>{tplMode ? 'This template has no areas yet' : 'No floor plan yet'}</h3>
        <p>{tplMode ? 'Add an area, then add tables and drag them into place.' : 'Start from a Koomzo sample layout, or add your first area.'}</p>
        <div className="fs-btns">{!tplMode && <button className="rk-btn pri" onClick={() => setPresets({})}><ion-icon name="albums-outline"></ion-icon>Start from a template</button>}<button className={'rk-btn' + (tplMode ? ' pri' : '')} onClick={addArea}><ion-icon name="add"></ion-icon>Add area</button></div>
        {presets && <TemplatePicker kind="floor" preselect={presets.id} onClose={() => setPresets(false)} />}
      </div>
    );
  }
  const areaBusy = area.tables.some((t) => inUse(t.id));

  return (
    <div className="fs">
      {!tplMode && <TplAppliedBar kind="floor" />}
      {!tplMode && !rules.floorSetupDone && (
        <div className="fs-onb">
          <ion-icon name="sparkles-outline"></ion-icon>
          <div><b>Setting up a new venue?</b><span>Start from a Koomzo sample layout — Maquis (Salle + Terrasse) is the usual choice — then adjust.</span></div>
          <button className="rk-btn pri" onClick={() => setPresets({})}>Choose a template</button>
          <button className="rk-btn" onClick={() => setRules({ floorSetupDone: true })}>Keep this plan</button>
        </div>
      )}
      <div className="fs-bar">
        <div className="svc-chips">
          {floors.map((f) => <button key={f.id} className={f.id === area.id ? 'on' : ''} onClick={() => { setAreaId(f.id); setSelId(null); }}><ion-icon name={f.icon || AREA_ICON(f)}></ion-icon>{f.label}<em>{f.tables.length}</em></button>)}
          <button onClick={addArea}><ion-icon name="add"></ion-icon>Area</button>
        </div>
        {!tplMode && <button className="rk-btn" onClick={() => setPresets({})}><ion-icon name="albums-outline"></ion-icon>Templates</button>}
      </div>

      <div className={'fs-main' + (narrow ? ' narrow' : '')}>
        {!narrow ? (
          <div className="fs-canvas" ref={canvasRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onClick={(e) => { if (e.target === e.currentTarget) setSelId(null); }}>
            {area.tables.map((t) => (
              <button key={t.id} className={'ftable free ' + SHAPE_CLASS[t.shape] + (t.id === selId ? ' fs-sel' : '') + (inUse(t.id) ? ' fs-inuse' : '') + (isDup(t) ? ' fs-dup' : '')}
                style={{ left: t.x + '%', top: t.y + '%', touchAction: 'none' }} onPointerDown={(e) => onDown(e, t)}>
                <div className="ftable__shape"><span className="ftable__num">{t.label}</span>{t.shape !== 'stool' && <span className="ftable__seats">{t.seats}</span>}</div>
              </button>
            ))}
            {!area.tables.length && <div className="fs-hint">Add a table from the panel, then drag it into place.</div>}
          </div>
        ) : (
          <div className="fs-list">
            {area.tables.map((t) => (
              <div key={t.id} className="fs-lrow">
                <input className={'fs-in sm' + (isDup(t) ? ' err' : '')} value={t.label} onChange={(e) => patchTable(t.id, { label: e.target.value })} />
                <select className="fs-in" value={t.shape} onChange={(e) => patchTable(t.id, { shape: e.target.value })}>
                  {['square', 'round', 'rect', 'stool'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <Stepper value={t.seats} min={1} max={20} onChange={(v) => patchTable(t.id, { seats: v })} />
                <button className="fs-del" disabled={inUse(t.id)} onClick={() => delTable(t.id)} aria-label="Archive table"><ion-icon name="archive-outline"></ion-icon></button>
              </div>
            ))}
          </div>
        )}

        <div className="fs-panel">
          <div className="fs-sec">
            <div className="fs-k">Area</div>
            <div className="fs-field" style={{ gap: 6 }}>
              <input className="fs-in" value={area.label} onChange={(e) => patchArea({ label: e.target.value })} />
              <button className="fs-del" style={{ color: 'var(--kz-ink-2)' }} disabled={floors[0]?.id === area.id} onClick={() => moveArea(-1)} aria-label="Move area left"><ion-icon name="chevron-back"></ion-icon></button>
              <button className="fs-del" style={{ color: 'var(--kz-ink-2)' }} disabled={floors[floors.length - 1]?.id === area.id} onClick={() => moveArea(1)} aria-label="Move area right"><ion-icon name="chevron-forward"></ion-icon></button>
            </div>
            <div className="fs-icons">
              {RK_AREA_ICONS.map((ic) => <button key={ic} className={(area.icon || AREA_ICON(area)) === ic ? 'on' : ''} onClick={() => patchArea({ icon: ic })}><ion-icon name={ic}></ion-icon></button>)}
            </div>
            <button className="fs-textbtn bad" disabled={areaBusy || floors.length < 2} onClick={delArea}><ion-icon name="archive-outline"></ion-icon>Archive area{areaBusy ? ' — tables in service' : ''}</button>
          </div>
          <div className="fs-sec">
            <div className="fs-k">Add table</div>
            <div className="fs-shapes">
              {[['square', 'Square'], ['round', 'Round'], ['rect', 'Long'], ['stool', 'Stool']].map(([s, l]) => (
                <button key={s} onClick={() => addTable(s)}><span className={'fs-sh ' + s}></span>{l}</button>
              ))}
            </div>
          </div>
          {sel && !narrow && (
            <div className="fs-sec">
              <div className="fs-k">Table {sel.label}{inUse(sel.id) && <em className="fs-inuse-tag">In service</em>}</div>
              <div className="fs-field"><span>Label</span><input className={'fs-in sm' + (isDup(sel) ? ' err' : '')} value={sel.label} onChange={(e) => patchTable(sel.id, { label: e.target.value })} /></div>
              {isDup(sel) && <div className="fs-err">Another table is already called {sel.label.trim()}.</div>}
              <div className="fs-field"><span>Seats</span><Stepper value={sel.seats} min={1} max={20} onChange={(v) => patchTable(sel.id, { seats: v })} /></div>
              <div className="fs-field"><span>Shape</span>
                <div className="svc-chips tight">{['square', 'round', 'rect', 'stool'].map((s) => <button key={s} className={sel.shape === s ? 'on' : ''} onClick={() => patchTable(sel.id, { shape: s })}>{s}</button>)}</div>
              </div>
              <div className="fs-btns">
                <button className="rk-btn" onClick={() => addTable(sel.shape, sel)}><ion-icon name="copy-outline"></ion-icon>Duplicate</button>
                <button className="rk-btn bad" disabled={inUse(sel.id)} onClick={() => delTable(sel.id)}><ion-icon name="archive-outline"></ion-icon>Archive</button>
              </div>
            </div>
          )}
          {(archAreas.length > 0 || archTables.length > 0) && (
            <div className="fs-sec">
              <button className="fs-k fs-archk" onClick={() => setShowArch((v) => !v)}><span>Archived · {archAreas.length + archTables.length}</span><ion-icon name={showArch ? 'chevron-up' : 'chevron-down'}></ion-icon></button>
              {showArch && (
                <div className="fs-arch">
                  <p>Hidden from the floor and pickers. Past orders still show these names.</p>
                  {archAreas.map((a) => (
                    <div key={a.id} className="fs-archrow"><ion-icon name={a.icon || AREA_ICON(a)}></ion-icon><span><b>{a.label}</b><small>Area · {a.tables.length} tables</small></span><button onClick={() => restoreArea(a.id)}>Restore</button></div>
                  ))}
                  {archTables.map((t) => (
                    <div key={t.id} className="fs-archrow"><span className="fs-archchip">{t.label}</span><span><b>Table {t.label}</b><small>{t.area.label} · {t.seats} seats</small></span><button onClick={() => restoreTable(t.area.id, t.id)}>Restore</button></div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {presets && <TemplatePicker kind="floor" preselect={presets.id} onClose={() => setPresets(false)} />}
    </div>
  );
}

function Seg({ value, options, onChange }) {
  return <div className="svc-chips tight">{options.map(([v, l]) => <button key={String(v)} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>;
}
function Toggle({ on, onChange }) {
  return <button className={'rk-toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)} aria-pressed={on}></button>;
}

/* D1–D3 policies + the daily void digest */
function ServiceRules() {
  const { rules, setRules, voids, setKioskLocked } = useSuite();
  const today = voids.filter((v) => new Date(v.at).toDateString() === new Date().toDateString());
  const total = today.reduce((s, v) => s + (v.value || 0), 0);
  const byReason = today.reduce((m, v) => { m[v.reason] = (m[v.reason] || 0) + v.qty; return m; }, {});
  return (
    <div className="rules">
      <div className="rules__card">
        <h3>Voids after the kitchen has the order</h3>
        <div className="rules__row"><div><b>When is approval needed?</b><span>A reason is always required.</span></div>
          <Seg value={rules.voidRule} onChange={(v) => setRules({ voidRule: v })}
            options={[['free-until-start', 'After cooking starts'], ['pin-always', 'Always'], ['free', 'Never']]} /></div>
        <div className="rules__row"><div><b>Only above this value</b><span>Small voids go through without approval. 0 = every void.</span></div>
          <Seg value={rules.voidPinAbove} onChange={(v) => setRules({ voidPinAbove: v })} options={[[0, '0'], [1000, '1 000'], [2500, '2 500'], [5000, '5 000']]} /></div>
        <div className="rules__row"><div><b>Owner can approve from their phone</b><span>For when no manager is on site.</span></div>
          <Toggle on={rules.remoteApproval} onChange={(v) => setRules({ remoteApproval: v })} /></div>
        <div className="rules__row"><div><b>Manager PIN</b><span>Prototype default 1234.</span></div>
          <input className="fs-in sm" inputMode="numeric" maxLength={6} value={rules.managerPin} onChange={(e) => setRules({ managerPin: e.target.value.replace(/\D/g, '') || '1234' })} /></div>
      </div>
      <div className="rules__card">
        <h3>Kitchen and tables</h3>
        <div className="rules__row"><div><b>Approval to cancel food when clearing a table</b><span>Take-away and Already served never need it.</span></div>
          <Toggle on={rules.clearCancelNeedsPin} onChange={(v) => setRules({ clearCancelNeedsPin: v })} /></div>
        <div className="rules__row"><div><b>Remove served tickets from the kitchen after</b><span>Paying always removes them. This catches orders with no table.</span></div>
          <Seg value={rules.servedAgeMin} onChange={(v) => setRules({ servedAgeMin: v })} options={[[5, '5 min'], [10, '10 min'], [20, '20 min'], [0, 'Never']]} /></div>
        <div className="rules__row"><div><b>Kiosk returns to the welcome screen after</b><span>No touch for this long clears the cart.</span></div>
          <Seg value={rules.kioskIdleSec} onChange={(v) => setRules({ kioskIdleSec: v })} options={[[60, '60 s'], [90, '90 s'], [120, '2 min']]} /></div>
        <div className="rules__row"><div><b>Kiosk mode</b><span>Locks this device to the customer kiosk. Exit: hold the logo, then the manager PIN.</span></div>
          <button className="rk-btn pri" onClick={() => setKioskLocked(true)}><ion-icon name="lock-closed-outline"></ion-icon>Start kiosk mode</button></div>
      </div>
      <div className="rules__card">
        <h3>Venue policies</h3>
        <div className="rules__row"><div><b>Print to the kitchen</b><span>For kitchens without a screen. Each station's printer gets a ticket; voids and changes print a slip.</span></div>
          <Toggle on={rules.printKitchen} onChange={(v) => setRules({ printKitchen: v })} /></div>
        <div className="rules__row"><div><b>A table belongs to its server</b><span>Only that server or a supervisor can void, move, bill or clear it. Others can view it.</span></div>
          <Toggle on={rules.assignServer} onChange={(v) => setRules({ assignServer: v })} /></div>
        <div className="rules__row"><div><b>Print the bill before payment</b><span>The guest checks the addition first. Any change after printing needs a reprint before payment.</span></div>
          <Toggle on={rules.preBill} onChange={(v) => setRules({ preBill: v })} /></div>
      </div>
      <div className="rules__card">
        <h3>Today's voids <span className="rules__sum">{today.length} · {money(total)}</span></h3>
        {!today.length && <p className="rules__none">No voids today.</p>}
        {today.length > 0 && (
          <>
            <div className="svc-chips tight" style={{ marginBottom: 10 }}>{Object.entries(byReason).map(([r, n]) => <span key={r} className="rules__tag">{r} · {n}</span>)}</div>
            <div className="rules__log">
              {today.slice(0, 12).map((v) => (
                <div key={v.id} className="rules__lrow">
                  <span className="t">{window.KZ_LOCALE.fmtTime(new Date(v.at))}</span>
                  <span className="n">{v.qty}× {v.name}<small>Table {v.table} · {v.reason}{v.approver ? ' · approved by ' + v.approver : ''}</small></span>
                  <span className="by">{v.by}</span>
                  <span className="v">{v.value ? '−' + money(v.value) : '—'}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RestaurantSetup() {
  const { setupTab: tab, setSetupTab: setTab } = useSuite();
  return (
    <div className="screen">
      <div className="sbar">
        <span className="sbar__title">Setup</span>
        <div className="svc-chips" style={{ marginLeft: 8 }}>
          {[['menu', 'Menu', 'book-outline'], ['floor', 'Floor plan', 'grid-outline'], ['rules', 'Service rules', 'shield-checkmark-outline'], ['printing', 'Printing', 'print-outline'], ['modules', 'Modules', 'apps-outline']].concat(window.cfdAttachFor && window.cfdAttachFor('restaurant') ? [['display', 'Customer display', 'tv-outline']] : []).map(([v, l, ic]) => (
            <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}><ion-icon name={ic}></ion-icon>{l}</button>
          ))}
        </div>
      </div>
      <div className="screen__bd" style={{ padding: tab === 'floor' ? 0 : 22, overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {tab === 'menu' && <MenuSetup />}
        {tab === 'floor' && <FloorEditor />}
        {tab === 'rules' && <ServiceRules />}
        {tab === 'printing' && <PrintFeed />}
        {tab === 'modules' && <ModuleSetup mid="restaurant" />}
        {tab === 'display' && <CfdSetup registerId="rk-R1" module="restaurant" />}
      </div>
    </div>
  );
}

Object.assign(window, { RK_FLOOR_PRESETS, buildFloors, PresetSheet, FloorEditor, ServiceRules, RestaurantSetup, Stepper, Toggle, Seg });
