/* Koomzo POS Suite — Template Library, customer side.
   Gallery → preview (with impact) → Replace / Add to mine → copy + undo + bundle offer.
   Shared previews (MenuPreview, FloorPreview, MiniFloor) are reused by the Control Centre. */

const TPL_KIND_WORD = { menu: ['menu', 'menus'], floor: ['floor plan', 'floor plans'] };
const tplVenueLabel = (v) => (window.KZ_TPL.VENUES.find((x) => x.id === v) || {}).label || v;
const tplTables = (areas) => (areas || []).filter((a) => !a.archivedAt).reduce((s, a) => s + a.tables.filter((t) => !t.archivedAt).length, 0);
const tplCounts = (t, c) => {
  c = c || t.content || t.draft || {};
  return t.kind === 'menu' ? (c.items || []).length + ' dishes · ' + (c.categories || []).length + ' categories'
    : c.counterOnly && !tplTables(c.areas) ? 'Counter only · no tables' : (c.areas || []).filter((a) => !a.archivedAt).length + ' areas · ' + tplTables(c.areas) + ' tables';
};

function MiniFloor({ areas, h }) {
  const live = (areas || []).filter((a) => !a.archivedAt);
  if (!live.length) return <div className="tpl-mini tpl-mini--none" style={{ height: h || 92 }}><ion-icon name="storefront-outline"></ion-icon><span>Counter only</span></div>;
  return (
    <div className="tpl-mini" style={{ height: h || 92 }}>
      {live.slice(0, 3).map((a) => (
        <div key={a.id} className="tpl-mini__a">
          <div className="tpl-mini__c">{a.tables.filter((t) => !t.archivedAt).map((t) => <i key={t.id} className={'tpl-mini__t ' + t.shape} style={{ left: t.x + '%', top: t.y + '%' }}></i>)}</div>
          <span>{a.label}</span>
        </div>
      ))}
    </div>
  );
}

function MenuThumb({ content }) {
  if (!(content.items || []).length) return <div className="tpl-mini tpl-mini--none" style={{ height: 84 }}><ion-icon name="book-outline"></ion-icon><span>No dishes yet</span></div>;
  return (
    <div className="tpl-thumb">
      {(content.items || []).slice(0, 3).map((p) => (
        <div key={p.id} className="tpl-thumb__r">
          <DishArt as="span" p={p} className="ms-ic sm" />
          <b>{p.name}</b><em>{money(p.price)}</em>
        </div>
      ))}
    </div>
  );
}

function MenuPreview({ content }) {
  const cats = content.categories || [];
  return (
    <div className="tpl-mp">
      {cats.map((c) => {
        const rows = (content.items || []).filter((p) => p.cat === c.id);
        if (!rows.length) return null;
        return (
          <div key={c.id} className="tpl-mp__c">
            <div className="tpl-mp__h"><ion-icon name={c.icon}></ion-icon>{c.label}<em>{rows.length}</em></div>
            {rows.map((p) => {
              const st = window.RK_STATIONS[p.station] || window.RK_STATIONS.none;
              return (
                <div key={p.id} className="tpl-mp__r">
                  <DishArt as="span" p={p} className="ms-ic sm" />
                  <span className="n"><b>{p.name}</b><small>{p.desc}</small></span>
                  <span className="kstation"><i style={{ background: st.color }}></i>{st.label}</span>
                  <span className="p">{money(p.price)}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function FloorPreview({ content, counts, setCounts }) {
  const areas = (content.areas || []).filter((a) => !a.archivedAt);
  if (!areas.length) return <div className="tpl-fp__none"><ion-icon name="storefront-outline"></ion-icon><b>Counter only</b><span>No tables. Orders are tabs and counter tickets.</span></div>;
  return (
    <div className="tpl-fp">
      {areas.map((a) => {
        const n = counts && counts[a.id] != null ? counts[a.id] : a.tables.length;
        const shown = counts && n !== a.tables.length ? tplRelayout(a, n).tables : a.tables;
        return (
          <div key={a.id} className="tpl-fp__a">
            <div className="tpl-fp__h"><ion-icon name={a.icon || 'home-outline'}></ion-icon><b>{a.label}</b>
              <span className="sp"></span>
              {setCounts ? <><span className="fs-k">Tables</span><Stepper value={n} min={0} max={40} onChange={(v) => setCounts((c) => ({ ...c, [a.id]: v }))} /></> : <em>{n} tables</em>}
            </div>
            <div className="tpl-fp__c">{shown.map((t) => <span key={t.id} className={'tpl-fp__t ' + t.shape} style={{ left: t.x + '%', top: t.y + '%' }}>{t.label}</span>)}</div>
          </div>
        );
      })}
    </div>
  );
}

/* re-lay an area to n tables, keeping its shape/seats */
function tplRelayout(a, n) {
  const first = a.tables[0] || { shape: 'square', seats: 4 };
  return { ...a, tables: window.KZ_TPL.layArea({ count: n, shape: first.shape, seats: first.seats, icon: a.icon }, 1).tables };
}

/* ---------- apply plans ---------- */
function tplPlanMenu(content, mode, menu, cats) {
  const base = mode === 'replace' ? [] : cats;
  const catMap = {}, newCats = [];
  const stamp = Date.now().toString(36).slice(-4);
  content.categories.forEach((c) => {
    const hit = base.find((x) => x.label.toLowerCase() === c.label.toLowerCase());
    if (hit) catMap[c.id] = hit.id;
    else { const nid = c.id + '-' + stamp; catMap[c.id] = nid; newCats.push({ ...c, id: nid }); }
  });
  const pool = mode === 'replace' ? [] : menu;
  let add = 0, upd = 0;
  const items = content.items.map((it, i) => {
    const old = pool.find((p) => p.name.toLowerCase() === it.name.toLowerCase());
    old ? upd++ : add++;
    return { ...window.KZ_TPL.clone(it), id: old ? old.id : 'tp' + stamp + i, cat: catMap[it.cat], priceCheck: true };
  });
  return { newCats, items, add, upd, removed: mode === 'replace' ? menu.length : 0, catsAfter: mode === 'replace' ? newCats : [...cats, ...newCats] };
}
function tplPlanFloor(content, mode, counts, floors) {
  const src = (content.areas || []).filter((a) => !a.archivedAt).map((a) => counts[a.id] != null && counts[a.id] !== a.tables.length ? tplRelayout(a, counts[a.id]) : a)
    .filter((a) => a.tables.length > 0);
  /* Add to mine: continue numbering after the venue's own tables so labels never clash */
  const max = {};
  if (mode === 'add') floors.forEach((f) => f.tables.forEach((t) => { const m = /^([A-Z]?)(\d+)$/.exec(String(t.label).trim()); if (m) max[m[1]] = Math.max(max[m[1]] || 0, +m[2]); }));
  const stamp = Date.now().toString(36);
  const areas = src.map((a, ai) => ({
    id: 'ta' + ai + stamp, label: a.label, icon: a.icon,
    tables: a.tables.map((t, ti) => {
      const m = /^([A-Z]?)(\d+)$/.exec(String(t.label).trim());
      return { id: 'tt' + ai + '-' + ti + stamp, label: m ? m[1] + (+m[2] + (max[m[1]] || 0)) : t.label, seats: t.seats, shape: t.shape, x: t.x, y: t.y };
    }),
  }));
  return { areas, tables: areas.reduce((s, a) => s + a.tables.length, 0), replaced: mode === 'replace' ? floors.length : 0 };
}

function TemplatePicker({ kind, preselect, onClose }) {
  const S = useSuite();
  const [, bump] = useState(0);
  useEffect(() => window.KZ_TPL.subscribe(() => bump((n) => n + 1)), []);
  const narrow = useNarrow(760);
  const venue = S.rules.venueType || (S.vertical === 'bar' ? 'bar' : 'maquis');
  const cur = window.KZ_LOCALE.currency.code;
  const pub = window.KZ_TPL.published(kind);
  const pre = preselect && pub.find((x) => x.id === preselect);
  const [all, setAll] = useState(!!pre && !(pre.venueTypes.includes(venue)));
  const list = pub.filter((t) => all || (t.venueTypes.includes(venue) && t.currency === cur));
  const [sel, setSel] = useState(pre ? pre.id : (!narrow && list[0] ? list[0].id : null));
  const t = pub.find((x) => x.id === sel) || null;
  const hasData = kind === 'menu' ? S.menu.length > 0 : S.floors.some((f) => f.tables.length);
  const [mode, setMode] = useState(hasData ? 'add' : 'replace');
  const [counts, setCounts] = useState({});
  useEffect(() => { setCounts({}); }, [sel]);
  const busy = kind === 'floor' && S.floors.some((f) => f.tables.some((x) => S.tableStatusFor(x.id) !== 'free'));
  const blocked = kind === 'floor' && mode === 'replace' && busy;
  const plan = t ? (kind === 'menu' ? tplPlanMenu(t.content, mode, S.menu, S.verticalCfg.categories) : tplPlanFloor(t.content, mode, counts, S.floors)) : null;

  const apply = () => {
    if (!t || blocked) return;
    const tenant = 'Chez Mama Ngono · Douala';
    if (kind === 'menu') {
      const snap = { menu: S.menu, cats: S.verticalCfg.categories };
      S.setCategories(plan.catsAfter);
      S.setMenu((m) => {
        if (mode === 'replace') return plan.items;
        const ids = new Set(plan.items.map((i) => i.id));
        return [...m.filter((p) => !ids.has(p.id)), ...plan.items].sort((a, b) => (m.findIndex((x) => x.id === a.id) + 1 || 1e6) - (m.findIndex((x) => x.id === b.id) + 1 || 1e6));
      });
      S.setTplUndo({ kind, name: t.name, pairWith: t.pairWith, summary: plan.items.length + ' dishes', restore: () => { S.setCategories(snap.cats); S.setMenu(snap.menu); } });
    } else {
      const snap = { floorsAll: S.floorsAll, rules: { voidRule: S.rules.voidRule, printKitchen: S.rules.printKitchen, floorSetupDone: S.rules.floorSetupDone } };
      const at = Date.now();
      S.setFloors((cur) => mode === 'replace' ? [...cur.map((x) => ({ ...x, archivedAt: x.archivedAt || at })), ...plan.areas] : [...cur, ...plan.areas]);
      S.setRules(mode === 'replace' && t.content.rules ? { ...t.content.rules, floorSetupDone: true } : { floorSetupDone: true });
      S.setTplUndo({ kind, name: t.name, pairWith: t.pairWith, summary: plan.tables + ' tables', restore: () => { S.setFloors(snap.floorsAll); S.setRules(snap.rules); } });
    }
    window.KZ_TPL.recordUse({ templateId: t.id, version: t.version, kind, mode, tenant, appliedBy: (S.me && S.me.name) || 'Manager' });
    onClose();
  };

  const impact = !plan ? '' : kind === 'menu'
    ? (mode === 'replace' ? (plan.removed ? 'Replaces your ' + plan.removed + ' dishes with ' : 'Adds ') + plan.items.length + ' dishes in ' + plan.newCats.length + ' categories.'
      : 'Adds ' + plan.add + ' dishes' + (plan.upd ? ', updates ' + plan.upd + ' with the same name' : '') + (plan.newCats.length ? ', ' + plan.newCats.length + ' new categories' : '') + '. Everything else stays.')
    : (mode === 'replace' ? (plan.replaced ? 'Archives your ' + plan.replaced + ' areas (past orders keep their table names) and adds ' : 'Adds ') + plan.areas.length + ' areas, ' + plan.tables + ' tables. Sets matching service rules.'
      : 'Adds ' + plan.areas.length + ' areas, ' + plan.tables + ' tables next to yours. Numbers continue after your tables.');
  const pair = t && t.pairWith && window.KZ_TPL.published(kind === 'menu' ? 'floor' : 'menu').find((x) => x.id === t.pairWith);
  const showList = !narrow || !t;

  return (
    <div className="tp-scrim" onClick={onClose}>
      <div className={'tp' + (narrow ? ' tp--narrow' : '')} onClick={(e) => e.stopPropagation()}>
        <div className="tp-hd">
          {narrow && t ? <button className="tp-x" onClick={() => setSel(null)} aria-label="Back to templates"><ion-icon name="chevron-back"></ion-icon></button> : null}
          <div className="tp-hd__t"><h3>{narrow && t ? t.name : 'Start from a template'}</h3>
            <span>{narrow && t ? tplCounts(t) : 'Sample ' + TPL_KIND_WORD[kind][1] + ' made by Koomzo. You get your own copy to change.'}</span></div>
          <button className="tp-x" onClick={onClose} aria-label="Close"><ion-icon name="close"></ion-icon></button>
        </div>
        {showList && (
          <div className="tp-filters">
            <span className="tp-k">Your venue</span>
            <div className="svc-chips tight">
              {window.KZ_TPL.VENUES.map((v) => <button key={v.id} className={!all && venue === v.id ? 'on' : ''} onClick={() => { S.setRules({ venueType: v.id }); setAll(false); }}>{v.label}</button>)}
              <button className={all ? 'on' : ''} onClick={() => setAll((a) => !a)}><ion-icon name="apps-outline"></ion-icon>Show all</button>
            </div>
          </div>
        )}
        <div className="tp-body">
          {showList && (
            <div className="tp-list">
              {list.map((x) => (
                <button key={x.id} className={'tp-card' + (sel === x.id ? ' on' : '')} onClick={() => setSel(x.id)}>
                  {kind === 'menu' ? <MenuThumb content={x.content} /> : <MiniFloor areas={x.content.areas} h={78} />}
                  <b>{x.name}</b>
                  <span className="tp-card__d">{x.description}</span>
                  <span className="tp-card__m"><em className="tpl-lang">{x.locale.toUpperCase()}</em>{tplCounts(x)}</span>
                </button>
              ))}
              {!list.length && <div className="tp-none"><b>No {TPL_KIND_WORD[kind][0]} for {tplVenueLabel(venue)} yet.</b><span>Try Show all, or start from blank.</span><button className="rk-btn" onClick={() => setAll(true)}>Show all</button></div>}
            </div>
          )}
          {t && (
            <div className="tp-prev">
              {!narrow && <div className="tp-prev__hd"><h4>{t.name}</h4><span>{t.description}</span>
                <div className="tp-prev__m"><em className="tpl-lang">{t.locale.toUpperCase()}</em><span>{tplCounts(t)}</span><span>Version {t.version}</span></div></div>}
              <div className="tp-prev__sc">
                {kind === 'menu' ? <MenuPreview content={t.content} /> : <FloorPreview content={t.content} counts={counts} setCounts={setCounts} />}
              </div>
              <div className="tp-act">
                {pair && <div className="tp-pair"><ion-icon name="link-outline"></ion-icon><span>Pairs with the <b>{pair.name}</b> {TPL_KIND_WORD[pair.kind][0]} — offered after you apply.</span></div>}
                {hasData && (
                  <div className="svc-chips tight">
                    <button className={mode === 'add' ? 'on' : ''} onClick={() => setMode('add')}>Add to mine</button>
                    <button className={mode === 'replace' ? 'on' : ''} onClick={() => setMode('replace')}>Replace</button>
                  </div>
                )}
                <p className="tp-imp">{impact}{kind === 'menu' && ' Sample prices are marked "Check price" until you confirm them.'}</p>
                {blocked && <div className="fs-warn"><ion-icon name="warning-outline"></ion-icon>Tables are in service. Clear them before replacing the floor plan, or choose Add to mine.</div>}
                <div className="tp-act__b">
                  <button className="rk-btn" onClick={onClose}>Cancel</button>
                  <button className="rk-btn pri tp-go" disabled={blocked || (kind === 'floor' && !plan.tables && !t.content.counterOnly)} onClick={apply}><ion-icon name="checkmark-outline"></ion-icon>Use this template</button>
                </div>
              </div>
            </div>
          )}
          {!t && !narrow && <div className="tp-prev tp-prev--empty"><ion-icon name="albums-outline"></ion-icon><span>Pick a template to preview it.</span></div>}
        </div>
      </div>
    </div>
  );
}

/* after applying: confirmation, one undo (until the next edit), and the paired template offer */
function TplAppliedBar({ kind }) {
  const S = useSuite();
  const u = S.tplUndo;
  if (!u || u.kind !== kind) return null;
  const otherKind = kind === 'menu' ? 'floor' : 'menu';
  const pair = u.pairWith && window.KZ_TPL.published(otherKind).find((x) => x.id === u.pairWith);
  return (
    <div className="tpl-done">
      <ion-icon name="checkmark-circle"></ion-icon>
      <span><b>{u.name}</b> copied — {u.summary}. It's yours to change.</span>
      <button className="rk-btn" onClick={() => { u.restore(); S.setTplUndo(null); }}><ion-icon name="arrow-undo-outline"></ion-icon>Undo</button>
      {pair && <button className="rk-btn pri" onClick={() => { S.setTplUndo(null); S.setSetupTab(otherKind === 'floor' ? 'floor' : 'menu'); S.setTplOpen({ kind: otherKind, id: pair.id }); }}>
        <ion-icon name="link-outline"></ion-icon>Set up the {pair.name} {TPL_KIND_WORD[otherKind][0]}</button>}
      <button className="tp-x sm" onClick={() => S.setTplUndo(null)} aria-label="Dismiss"><ion-icon name="close"></ion-icon></button>
    </div>
  );
}

Object.assign(window, { TemplatePicker, TplAppliedBar, MiniFloor, MenuThumb, MenuPreview, FloorPreview, tplCounts, tplVenueLabel, tplTables, TPL_KIND_WORD, tplPlanMenu, tplPlanFloor });
