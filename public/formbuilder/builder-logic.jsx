/* Koomzo — conditional-logic authoring UI + interactive fill preview. */
const { useState: _flState } = React;
const _ftx = window.tx, _fmk = window.mk;
const flLbl = (f, lang, primary) => (f ? (_ftx(f.label, lang) || _ftx(f.label, primary) || '—') : '—');
const flL = (v, lang, primary) => (window.isI18n(v) ? (_ftx(v, lang) || _ftx(v, primary)) : String(v == null ? '' : v));

const FL_UI = {
  en: {
    logic: 'Logic', visibility: 'Visibility', showThis: 'Show this field only when…',
    always: 'Always visible', addCond: 'Add a condition', cond: 'Condition',
    field: 'Field', test: 'Test', value: 'Value', andW: 'AND', orW: 'OR',
    all: 'Match ALL · AND', any: 'Match ANY · OR',
    matchHint: (n, m) => (m === 'any' ? `Shown when any one of the ${n} conditions is true.` : `Shown only when all ${n} conditions are true.`),
    oneCondHint: 'Add a second condition to combine them with AND or OR.',
    otherwise: 'Otherwise this field is hidden and its answer is not saved.',
    onStep: 'Step', noParents: 'Add a field above this one first — a parent must be answered before its child is shown.',
    filter: 'Option filter', filterOn: 'Limit the options by a parent answer',
    filterNone: 'All options are always offered', chooseParent: 'Choose the parent dropdown',
    editMap: 'Edit the option map', mapped: 'mapped', ofParents: 'of', parentsWord: 'parent answers',
    mapTitle: 'Which child options each parent answer allows', selectAll: 'All', selectNone: 'None',
    allowed: 'allowed', done: 'Done', byColumn: 'Match a column in the data source', byMap: 'Map options by hand',
    colHint: 'Keep the rows whose column equals the parent answer.', column: 'Column',
    unmappedT: 'A parent answer with nothing mapped', unmappedAll: 'Offer all options', unmappedNone: 'Offer none',
    emptyParentT: 'Before the parent is answered', emptyAll: 'Offer all options', emptyNone: 'Keep the field locked',
    fillTry: 'Try the form — rules run live', reset: 'Reset answers', hiddenNow: 'hidden by rules',
    lockedByParent: 'Answer the parent field first', noMatch: 'No option matches that answer',
    choose: 'Choose…', shownWhen: 'Shown when', filteredBy: 'Filtered by', condsWord: 'conditions',
    crossStep: 'The parent sits on an earlier step. The rule is evaluated when this step opens.',
    addFilter: 'Add another filter', filterN: 'Filter', combineAll: 'Match ALL · AND', combineAny: 'Match ANY · OR',
    combineHint: (n, m) => (m === 'any'
      ? `An option is offered when any one of the ${n} filters allows it.`
      : `An option is offered only when all ${n} filters allow it.`),
    oneFilterHint: 'Add a second filter to combine them with AND or OR.',
    drives: 'Rules this field drives', drivesNone: 'Nothing depends on this field yet.',
    drivesHint: 'Other fields that read this one. A field can drive as many rules of as many kinds as you need.',
    jump: 'Open', showsWord: 'shows', filtersWord: 'filters', noParentLeft: 'Every eligible parent is already used by a filter.',
    danglingT: 'The parent field was deleted or moved after this field. The rule cannot run.',
  },
  fr: {
    logic: 'Logique', visibility: 'Visibilité', showThis: 'Afficher ce champ seulement si…',
    always: 'Toujours visible', addCond: 'Ajouter une condition', cond: 'Condition',
    field: 'Champ', test: 'Test', value: 'Valeur', andW: 'ET', orW: 'OU',
    all: 'Toutes · ET', any: 'Au moins une · OU',
    matchHint: (n, m) => (m === 'any' ? `Affiché si l'une des ${n} conditions est vraie.` : `Affiché seulement si les ${n} conditions sont vraies.`),
    oneCondHint: 'Ajoutez une deuxième condition pour les combiner avec ET ou OU.',
    otherwise: 'Sinon le champ est masqué et sa réponse n’est pas enregistrée.',
    onStep: 'Étape', noParents: 'Ajoutez d’abord un champ au-dessus — un parent doit être répondu avant son enfant.',
    filter: 'Filtre d’options', filterOn: 'Limiter les options selon une réponse parente',
    filterNone: 'Toutes les options sont toujours proposées', chooseParent: 'Choisir la liste parente',
    editMap: 'Modifier la correspondance', mapped: 'renseignées', ofParents: 'sur', parentsWord: 'réponses parentes',
    mapTitle: 'Options enfants autorisées par chaque réponse parente', selectAll: 'Tout', selectNone: 'Aucune',
    allowed: 'autorisées', done: 'Terminé', byColumn: 'Faire correspondre une colonne de la source', byMap: 'Associer à la main',
    colHint: 'Garder les lignes dont la colonne égale la réponse parente.', column: 'Colonne',
    unmappedT: 'Réponse parente sans correspondance', unmappedAll: 'Proposer toutes les options', unmappedNone: 'N’en proposer aucune',
    emptyParentT: 'Avant que le parent soit répondu', emptyAll: 'Proposer toutes les options', emptyNone: 'Garder le champ verrouillé',
    fillTry: 'Essayez le formulaire — les règles s’appliquent', reset: 'Réinitialiser', hiddenNow: 'masqué(s) par les règles',
    lockedByParent: 'Répondez d’abord au champ parent', noMatch: 'Aucune option ne correspond',
    choose: 'Choisir…', shownWhen: 'Affiché si', filteredBy: 'Filtré par', condsWord: 'conditions',
    crossStep: 'Le parent est sur une étape précédente. La règle est évaluée à l’ouverture de cette étape.',
    addFilter: 'Ajouter un autre filtre', filterN: 'Filtre', combineAll: 'Tous · ET', combineAny: 'Au moins un · OU',
    combineHint: (n, m) => (m === 'any'
      ? `Une option est proposée si l'un des ${n} filtres l'autorise.`
      : `Une option est proposée seulement si les ${n} filtres l'autorisent.`),
    oneFilterHint: 'Ajoutez un deuxième filtre pour les combiner avec ET ou OU.',
    drives: 'Règles pilotées par ce champ', drivesNone: 'Rien ne dépend encore de ce champ.',
    drivesHint: 'Les autres champs qui lisent celui-ci. Un champ peut piloter autant de règles et de types que nécessaire.',
    jump: 'Ouvrir', showsWord: 'affiche', filtersWord: 'filtre', noParentLeft: 'Tous les parents possibles sont déjà utilisés par un filtre.',
    danglingT: 'Le champ parent a été supprimé ou déplacé après ce champ. La règle ne peut pas s’exécuter.',
  },
};

/* ============ inspector · visibility ============ */
function FlVisibility({ field, steps, stepIdx, lang, primary, onPatch }) {
  const ui = FL_UI[lang];
  const parents = window.flParents(steps, stepIdx, field.id);
  const rule = field.visibleIf;
  const conds = (rule && rule.when) || [];
  const setRule = (p) => onPatch({ visibleIf: { match: (rule && rule.match) || 'all', when: conds, ...p } });
  const setCond = (i, p) => setRule({ when: conds.map((c, x) => (x === i ? { ...c, ...p } : c)) });
  const addCond = () => {
    const p = parents[0]; if (!p) return;
    const ops = window.FL_OPS[p.field.type] || ['filled'];
    setRule({ when: [...conds, { parent: p.field.id, op: ops[0], value: '' }] });
  };
  const delCond = (i) => {
    const next = conds.filter((_, x) => x !== i);
    onPatch({ visibleIf: next.length ? { match: (rule && rule.match) || 'all', when: next } : null });
  };

  if (!parents.length) return (
    <>
      <div className="fb-insp-section">{ui.visibility}</div>
      <div className="fl-warn"><ion-icon name="information-circle-outline"></ion-icon>{ui.noParents}</div>
    </>
  );

  return (
    <>
      <div className="fb-insp-section">{ui.visibility}</div>
      {!conds.length ? (
        <div className="fl-empty">
          <ion-icon name="eye-outline"></ion-icon>
          <b>{ui.always}</b>
          <span>{ui.showThis}</span>
          <button className="fl-btn" onClick={addCond}><ion-icon name="git-branch-outline"></ion-icon>{ui.addCond}</button>
        </div>
      ) : (
        <>
          <div className="fl-match">
            <button className={(rule.match || 'all') === 'all' ? 'on' : ''} onClick={() => setRule({ match: 'all' })}>{ui.all}</button>
            <button className={rule.match === 'any' ? 'on' : ''} onClick={() => setRule({ match: 'any' })}>{ui.any}</button>
          </div>
          <div className="fl-sentence" style={{ marginBottom: 8 }}>
            {conds.length > 1 ? ui.matchHint(conds.length, rule.match || 'all') : ui.oneCondHint}
          </div>
          {conds.map((c, i) => {
            const p = window.flFindField(steps, c.parent);
            const pStep = window.flStepOf(steps, c.parent);
            const ops = p ? (window.FL_OPS[p.type] || ['filled', 'empty']) : ['filled'];
            const needsVal = !window.FL_NOVALUE.includes(c.op);
            const two = window.FL_TWOVALUE.includes(c.op);
            const opts = p && window.flIsChoice(p) ? window.flOptions(p, lang, primary) : null;
            const vType = p && ['number', 'range'].includes(p.type) ? 'number' : p && p.type === 'date' ? 'date' : p && p.type === 'time' ? 'time' : 'text';
            return (
              <React.Fragment key={i}>
              {i > 0 && (
                <button className={'fl-conn' + (rule.match === 'any' ? ' or' : '')} onClick={() => setRule({ match: rule.match === 'any' ? 'all' : 'any' })}>
                  <ion-icon name="swap-vertical-outline"></ion-icon>{rule.match === 'any' ? ui.orW : ui.andW}
                </button>
              )}
              <div className="fl-card">
                <div className="fl-card__t">
                  <ion-icon name="git-branch-outline" style={{ color: 'var(--kz-primary)', fontSize: 15 }}></ion-icon>
                  <b>{ui.cond} {i + 1}</b>
                  {pStep >= 0 && pStep !== stepIdx && <span className="fl-stepnote"><ion-icon name="layers-outline"></ion-icon>{ui.onStep} {pStep + 1}</span>}
                  <button className="fl-x" onClick={() => delCond(i)}><ion-icon name="close-outline"></ion-icon></button>
                </div>
                {!p && <div className="fl-warn"><ion-icon name="alert-circle-outline"></ion-icon>{ui.danglingT}</div>}
                <div className="fl-row"><span>{ui.field}</span>
                  <select className="fl-sel" value={c.parent} onChange={(e) => {
                    const np = window.flFindField(steps, e.target.value);
                    const nops = window.FL_OPS[np.type] || ['filled'];
                    setCond(i, { parent: e.target.value, op: nops[0], value: '', value2: '' });
                  }}>
                    {parents.map((x) => (
                      <option key={x.field.id} value={x.field.id}>
                        {steps.length > 1 ? `${ui.onStep} ${x.stepIdx + 1} · ` : ''}{flLbl(x.field, lang, primary)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="fl-row"><span>{ui.test}</span>
                  <select className="fl-sel" value={c.op} onChange={(e) => setCond(i, { op: e.target.value })}>
                    {ops.map((o) => <option key={o} value={o}>{flL(window.FL_OPLBL[o], lang, primary)}</option>)}
                  </select>
                </div>
                {needsVal && (
                  <div className="fl-row"><span>{ui.value}</span>
                    {opts ? (
                      <select className="fl-val" value={c.value} onChange={(e) => setCond(i, { value: e.target.value })}>
                        <option value="">{ui.choose}</option>
                        {opts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    ) : two ? (
                      <div className="fl-two">
                        <input className="fl-val" type={vType} value={c.value || ''} onChange={(e) => setCond(i, { value: e.target.value })} />
                        <i>–</i>
                        <input className="fl-val" type={vType} value={c.value2 || ''} onChange={(e) => setCond(i, { value2: e.target.value })} />
                      </div>
                    ) : (
                      <input className="fl-val" type={vType} value={c.value || ''} onChange={(e) => setCond(i, { value: e.target.value })} />
                    )}
                  </div>
                )}
                <div className="fl-sentence">
                  <b>{flLbl(p, lang, primary)}</b> {flL(window.FL_OPLBL[c.op], lang, primary)}
                  {needsVal ? <> <b>{opts ? ((opts.find((o) => o.v === String(c.value)) || {}).label || '…') : (c.value || '…')}{two ? ` – ${c.value2 || '…'}` : ''}</b></> : null}
                  {' → '}<b>{flLbl(field, lang, primary)}</b>
                </div>
                {pStep >= 0 && pStep !== stepIdx && <div className="fl-warn"><ion-icon name="layers-outline"></ion-icon>{ui.crossStep}</div>}
              </div>
              </React.Fragment>
            );
          })}
          <button className="fl-add" onClick={addCond}><ion-icon name="add-outline"></ion-icon>{ui.addCond}</button>
          <div className="fl-sentence" style={{ marginTop: 8 }}>{ui.otherwise}</div>
        </>
      )}
    </>
  );
}

/* ============ mapping matrix sheet ============ */
function FlMapSheet({ field, parent, fb, onChange, lang, primary, onClose }) {
  const ui = FL_UI[lang];
  const pOpts = window.flOptions(parent, lang, primary);
  const cOpts = window.flOptions(field, lang, primary);
  const map = fb.map || {};
  const onPatch = (p) => onChange({ ...fb, ...(p.filterBy || {}) });
  const setMap = (m) => onChange({ ...fb, map: m });
  const toggle = (pv, cv) => {
    const cur = map[pv] || [];
    const next = cur.includes(cv) ? cur.filter((x) => x !== cv) : [...cur, cv];
    setMap({ ...map, [pv]: next });
  };
  const ds = field.source ? window.dsFind(field.source.id) : null;

  return (
    <div className="ds-scrim" onClick={onClose}>
      <div className="ds-sheet fl-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ds-sheet__hd">
          <ion-icon name="funnel-outline" style={{ color: 'var(--kz-primary)', fontSize: 19 }}></ion-icon>
          <b>{ui.mapTitle}</b>
          <button className="ds-sheet__x" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="ds-sheet__scroll">
          {ds && (
            <div className="fl-colpick">
              <ion-icon name="server-outline" style={{ color: 'var(--kz-primary)', fontSize: 17 }}></ion-icon>
              <span style={{ flex: 1 }}>{ui.byColumn} — {ui.colHint}</span>
              <select className="fl-sel" style={{ width: 150 }} value={fb.mode === 'column' ? (fb.column || '') : ''}
                onChange={(e) => onPatch({ filterBy: { ...fb, mode: e.target.value ? 'column' : 'map', column: e.target.value } })}>
                <option value="">{ui.byMap}</option>
                {ds.columns.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
              </select>
            </div>
          )}
          {fb.mode === 'column' && ds ? (
            <div className="fl-sentence">
              {ui.colHint} <b>{fb.column}</b> = <b>{flLbl(parent, lang, primary)}</b>
            </div>
          ) : (
            <div className="fl-mx">
              {pOpts.map((po) => {
                const sel = map[po.v] || [];
                return (
                  <div className="fl-mxrow" key={po.v}>
                    <div className="fl-mxrow__hd">
                      <ion-icon name="arrow-forward-outline" style={{ color: 'var(--kz-muted-3)', fontSize: 14 }}></ion-icon>
                      <b>{po.label}</b>
                      <span className={'fl-count' + (sel.length === 0 ? ' zero' : '')}>{sel.length} {ui.allowed}</span>
                      <button className="fl-mini" onClick={() => setMap({ ...map, [po.v]: cOpts.map((c) => c.v) })}>{ui.selectAll}</button>
                      <button className="fl-mini" onClick={() => setMap({ ...map, [po.v]: [] })}>{ui.selectNone}</button>
                    </div>
                    <div className="fl-mxopts">
                      {cOpts.map((co) => {
                        const on = sel.includes(co.v);
                        return (
                          <button key={co.v} className={'fl-ochip' + (on ? ' on' : '')} onClick={() => toggle(po.v, co.v)}>
                            <ion-icon name={on ? 'checkmark-circle' : 'ellipse-outline'}></ion-icon>{co.label}
                          </button>
                        );
                      })}
                      {!cOpts.length && <span style={{ font: '400 12px var(--kz-font-sans)', color: 'var(--kz-muted-3)' }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="ds-set" style={{ marginTop: 12 }}>
            <div className="ds-set__r">
              <div className="t"><b>{ui.emptyParentT}</b></div>
              <div className="ds-seg">
                <button className={fb.emptyParent !== 'all' ? 'on' : ''} onClick={() => onPatch({ filterBy: { ...fb, emptyParent: 'none' } })}>{ui.emptyNone}</button>
                <button className={fb.emptyParent === 'all' ? 'on' : ''} onClick={() => onPatch({ filterBy: { ...fb, emptyParent: 'all' } })}>{ui.emptyAll}</button>
              </div>
            </div>
          </div>
          <div className="ds-set">
            <div className="ds-set__r">
              <div className="t"><b>{ui.unmappedT}</b></div>
              <div className="ds-seg">
                <button className={fb.unmapped !== 'all' ? 'on' : ''} onClick={() => onPatch({ filterBy: { ...fb, unmapped: 'none' } })}>{ui.unmappedNone}</button>
                <button className={fb.unmapped === 'all' ? 'on' : ''} onClick={() => onPatch({ filterBy: { ...fb, unmapped: 'all' } })}>{ui.unmappedAll}</button>
              </div>
            </div>
          </div>
        </div>
        <div className="fl-mxfoot">
          <span style={{ font: '400 12px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>
            {Object.keys(map).filter((k) => (map[k] || []).length).length} {ui.ofParents} {pOpts.length} {ui.parentsWord} {ui.mapped}
          </span>
          <div className="sp"></div>
          <button className="fl-btn" onClick={onClose}><ion-icon name="checkmark-outline"></ion-icon>{ui.done}</button>
        </div>
      </div>
    </div>
  );
}

/* ============ inspector · option filters (many per field) ============ */
function FlFilter({ field, steps, stepIdx, lang, primary, onPatch }) {
  const ui = FL_UI[lang];
  const [sheet, setSheet] = _flState(-1);
  const parents = window.flParents(steps, stepIdx, field.id, 'choice');
  const list = window.flFilters(field);
  const setList = (next) => onPatch({ filters: next, filterBy: null, filterCombine: field.filterCombine || 'all' });
  const used = list.map((f) => f.parent);
  const free = parents.filter((p) => !used.includes(p.field.id));
  const addFilter = (pid) => { setList([...list, { parent: pid, mode: 'map', map: {}, emptyParent: 'none', unmapped: 'none' }]); setSheet(list.length); };

  if (!parents.length) return (
    <>
      <div className="fb-insp-section">{ui.filter}</div>
      <div className="fl-warn"><ion-icon name="information-circle-outline"></ion-icon>{ui.noParents}</div>
    </>
  );

  return (
    <>
      <div className="fb-insp-section">{ui.filter}</div>
      {!list.length ? (
        <div className="fl-empty">
          <ion-icon name="funnel-outline"></ion-icon>
          <b>{ui.filterNone}</b>
          <span>{ui.filterOn}</span>
          <button className="fl-btn" onClick={() => addFilter(parents[0].field.id)}><ion-icon name="git-network-outline"></ion-icon>{ui.chooseParent}</button>
        </div>
      ) : (
        <>
          <div className="fl-match">
            <button className={(field.filterCombine || 'all') === 'all' ? 'on' : ''} onClick={() => onPatch({ filterCombine: 'all' })}>{ui.combineAll}</button>
            <button className={field.filterCombine === 'any' ? 'on' : ''} onClick={() => onPatch({ filterCombine: 'any' })}>{ui.combineAny}</button>
          </div>
          <div className="fl-sentence" style={{ marginBottom: 8 }}>
            {list.length > 1 ? ui.combineHint(list.length, field.filterCombine || 'all') : ui.oneFilterHint}
          </div>
          {list.map((fb, fi) => {
            const parent = window.flFindField(steps, fb.parent);
            const pStep = window.flStepOf(steps, fb.parent);
            const pOpts = parent ? window.flOptions(parent, lang, primary) : [];
            const mapped = fb.map ? Object.keys(fb.map).filter((k) => (fb.map[k] || []).length).length : 0;
            const setFb = (next) => setList(list.map((x, i) => (i === fi ? next : x)));
            return (
              <React.Fragment key={fi}>
              {fi > 0 && (
                <button className={'fl-conn' + (field.filterCombine === 'any' ? ' or' : '')} onClick={() => onPatch({ filterCombine: field.filterCombine === 'any' ? 'all' : 'any' })}>
                  <ion-icon name="swap-vertical-outline"></ion-icon>{field.filterCombine === 'any' ? ui.orW : ui.andW}
                </button>
              )}
              <div className="fl-card">
                <div className="fl-card__t">
                  <ion-icon name="funnel-outline" style={{ color: 'var(--kz-indigo)', fontSize: 15 }}></ion-icon>
                  <b>{list.length > 1 ? ui.filterN + ' ' + (fi + 1) + ' · ' : ''}{flLbl(parent, lang, primary)}</b>
                  {pStep >= 0 && pStep !== stepIdx && <span className="fl-stepnote"><ion-icon name="layers-outline"></ion-icon>{ui.onStep} {pStep + 1}</span>}
                  <button className="fl-x" onClick={() => setList(list.filter((_, i) => i !== fi))}><ion-icon name="close-outline"></ion-icon></button>
                </div>
                {!parent && <div className="fl-warn"><ion-icon name="alert-circle-outline"></ion-icon>{ui.danglingT}</div>}
                <div className="fl-row"><span>{ui.field}</span>
                  <select className="fl-sel" value={fb.parent} onChange={(e) => setFb({ ...fb, parent: e.target.value, map: {} })}>
                    {parents.filter((x) => x.field.id === fb.parent || !used.includes(x.field.id)).map((x) => (
                      <option key={x.field.id} value={x.field.id}>{steps.length > 1 ? `${ui.onStep} ${x.stepIdx + 1} · ` : ''}{flLbl(x.field, lang, primary)}</option>
                    ))}
                  </select>
                </div>
                <div className="fl-sentence">
                  {fb.mode === 'column'
                    ? <>{ui.byColumn}: <b>{fb.column}</b> = <b>{flLbl(parent, lang, primary)}</b></>
                    : <><b>{mapped}</b> {ui.ofParents} <b>{pOpts.length}</b> {ui.parentsWord} {ui.mapped}</>}
                </div>
                {fb.mode !== 'column' && mapped < pOpts.length && (
                  <div className="fl-warn"><ion-icon name="alert-circle-outline"></ion-icon>{ui.unmappedT} → {fb.unmapped === 'all' ? ui.unmappedAll : ui.unmappedNone}</div>
                )}
                <button className="fl-add" style={{ marginTop: 0 }} onClick={() => setSheet(fi)}><ion-icon name="grid-outline"></ion-icon>{ui.editMap}</button>
                {sheet === fi && parent && (
                  <FlMapSheet field={field} parent={parent} fb={fb} onChange={setFb} lang={lang} primary={primary} onClose={() => setSheet(-1)} />
                )}
              </div>
              </React.Fragment>
            );
          })}
          {free.length ? (
            <button className="fl-add" onClick={() => addFilter(free[0].field.id)}><ion-icon name="add-outline"></ion-icon>{ui.addFilter}</button>
          ) : (
            <div className="fl-sentence" style={{ marginTop: 8 }}>{ui.noParentLeft}</div>
          )}
        </>
      )}
    </>
  );
}

/* ============ inspector · what this field drives ============ */
function FlDrives({ field, steps, lang, primary, onJump }) {
  const ui = FL_UI[lang];
  const rules = window.flDrives(steps, field.id);
  return (
    <>
      <div className="fb-insp-section">{ui.drives}{rules.length ? <span className="fb-langtag">{rules.length}</span> : null}</div>
      {!rules.length ? (
        <div className="fl-sentence">{ui.drivesNone}</div>
      ) : (
        <>
          <div className="fl-sentence" style={{ marginBottom: 8 }}>{ui.drivesHint}</div>
          {rules.map((r, i) => (
            <div className="fl-card" key={i} style={{ gap: 7 }}>
              <div className="fl-card__t">
                <ion-icon name={r.kind === 'visible' ? 'git-branch-outline' : 'funnel-outline'}
                  style={{ color: r.kind === 'visible' ? 'var(--kz-primary)' : 'var(--kz-indigo)', fontSize: 15 }}></ion-icon>
                <b>{r.kind === 'visible' ? ui.showsWord : ui.filtersWord} · {flLbl(r.child, lang, primary)}</b>
                {steps.length > 1 && <span className="fl-stepnote"><ion-icon name="layers-outline"></ion-icon>{ui.onStep} {r.stepIdx + 1}</span>}
              </div>
              <div className="fl-sentence">
                {r.kind === 'visible'
                  ? <>{flL(window.FL_OPLBL[r.cond.op], lang, primary)}{window.FL_NOVALUE.includes(r.cond.op) ? '' : ' '}
                      {window.FL_NOVALUE.includes(r.cond.op) ? '' : <b>{(() => {
                        const opts = window.flIsChoice(field) ? window.flOptions(field, lang, primary) : null;
                        return opts ? ((opts.find((o) => o.v === String(r.cond.value)) || {}).label || '…') : (r.cond.value || '…');
                      })()}</b>}
                      {' → '}<b>{flLbl(r.child, lang, primary)}</b></>
                  : <>{r.fb.mode === 'column' ? <>{ui.byColumn}: <b>{r.fb.column}</b></> : <><b>{Object.keys(r.fb.map || {}).filter((k) => (r.fb.map[k] || []).length).length}</b> {ui.parentsWord} {ui.mapped}</>}</>}
              </div>
              <button className="fl-add" style={{ marginTop: 0 }} onClick={() => onJump(r.stepIdx, r.child.id)}>
                <ion-icon name="open-outline"></ion-icon>{ui.jump}
              </button>
            </div>
          ))}
        </>
      )}
    </>
  );
}

/* ============ canvas chips ============ */
function FlChips({ f, steps, lang, primary }) {
  const ui = FL_UI[lang];
  const chips = [];
  const conds = f.visibleIf && f.visibleIf.when || [];
  if (conds.length) {
    const c = conds[0];
    const p = window.flFindField(steps, c.parent);
    const opts = p && window.flIsChoice(p) ? window.flOptions(p, lang, primary) : null;
    const vTxt = window.FL_NOVALUE.includes(c.op) ? '' : ' ' + (opts ? ((opts.find((o) => o.v === String(c.value)) || {}).label || '…') : (c.value || '…'));
    const cw = (f.visibleIf.match === 'any' ? ui.orW : ui.andW);
    chips.push({ ic: 'git-branch-outline', cls: '', txt: `${ui.shownWhen} ${flLbl(p, lang, primary)} ${flL(window.FL_OPLBL[c.op], lang, primary)}${vTxt}${conds.length > 1 ? ` ${cw} +${conds.length - 1}` : ''}` });
  }
  const fl = window.flFilters(f);
  if (fl.length) {
    const p = window.flFindField(steps, fl[0].parent);
    const fw = (f.filterCombine === 'any' ? ui.orW : ui.andW);
    chips.push({ ic: 'funnel-outline', cls: ' filter', txt: `${ui.filteredBy} ${flLbl(p, lang, primary)}${fl.length > 1 ? ` ${fw} +${fl.length - 1}` : ''}` });
  }
  if (!chips.length) return null;
  return (
    <div className="fb-logicchips">
      {chips.map((c, i) => <span className={'fb-lchip' + c.cls} key={i}><ion-icon name={c.ic}></ion-icon><span>{c.txt}</span></span>)}
    </div>
  );
}

/* ============ interactive fill preview ============ */
function FlFill({ steps, stepIdx, lang, primary, vals, setVals }) {
  const ui = FL_UI[lang];
  const fields = steps[stepIdx].fields;
  const set = (id, v) => setVals((V) => ({ ...V, [id]: v }));
  let hidden = 0;

  const rows = fields.map((f) => {
    if (window.flIsLayout(f)) {
      if (f.type === 'divider') return <div key={f.id} style={{ height: 1, background: 'var(--kz-border)', margin: '4px 0' }}></div>;
      if (f.type === 'heading') return <h3 key={f.id} style={{ margin: '6px 0 0', font: '700 15px var(--kz-font-sans)', color: 'var(--kz-ink)' }}>{flLbl(f, lang, primary)}</h3>;
      return <p key={f.id} style={{ margin: 0, font: '400 13px/1.6 var(--kz-font-sans)', color: 'var(--kz-muted)' }}>{flL(f.help, lang, primary)}</p>;
    }
    if (!window.flVisible(f, vals, steps)) { hidden++; return null; }

    const label = (
      <label className="fb-flabel">{flLbl(f, lang, primary)}{f.required && <span className="req">*</span>}</label>
    );
    const help = (f.help && flL(f.help, lang, primary)) ? <div className="fb-fhelp">{flL(f.help, lang, primary)}</div> : null;
    const ph = f.placeholder ? flL(f.placeholder, lang, primary) : '';
    let control;

    if (window.flIsChoice(f)) {
      const opts = window.flChildOptions(f, vals, steps, lang, primary);
      const fl = window.flFilters(f);
      const parentUnanswered = window.flChildLocked(f, vals);
      if (f.type === 'select') {
        control = (
          <>
            <select className="fl-in" value={vals[f.id] || ''} disabled={parentUnanswered}
              onChange={(e) => set(f.id, e.target.value)}>
              <option value="">{ui.choose}</option>
              {opts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
            {parentUnanswered
              ? <div className="fl-lock"><ion-icon name="lock-closed-outline"></ion-icon>{ui.lockedByParent}</div>
              : (fl.length && !opts.length ? <div className="fl-lock"><ion-icon name="alert-circle-outline"></ion-icon>{ui.noMatch}</div> : null)}
          </>
        );
      } else {
        const multi = f.type === 'checkbox';
        const cur = vals[f.id] || (multi ? [] : '');
        control = (
          <div className="fl-fopts">
            {opts.map((o) => {
              const on = multi ? cur.includes(o.v) : cur === o.v;
              return (
                <button key={o.v} className={'fl-fopt' + (multi ? ' sq' : '') + (on ? ' on' : '')}
                  onClick={() => set(f.id, multi ? (on ? cur.filter((x) => x !== o.v) : [...cur, o.v]) : o.v)}>
                  <span className="mk">{on && <ion-icon name="checkmark-outline"></ion-icon>}</span>{o.label}
                </button>
              );
            })}
            {!opts.length && <div className="fl-ghost"><ion-icon name="funnel-outline"></ion-icon>{parentUnanswered ? ui.lockedByParent : ui.noMatch}</div>}
          </div>
        );
      }
    } else if (f.type === 'toggle') {
      control = <button className={'fl-fswitch' + (vals[f.id] ? ' on' : '')} onClick={() => set(f.id, !vals[f.id])}><i></i></button>;
    } else if (f.type === 'textarea') {
      control = <input className="fl-in" placeholder={ph} value={vals[f.id] || ''} onChange={(e) => set(f.id, e.target.value)} />;
    } else if (f.type === 'range') {
      control = <input className="fl-in" type="number" placeholder={ph || '0'} value={vals[f.id] == null ? '' : vals[f.id]} onChange={(e) => set(f.id, e.target.value)} />;
    } else {
      const t = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : f.type === 'email' ? 'email' : 'text';
      control = <input className="fl-in" type={t} placeholder={ph} value={vals[f.id] == null ? '' : vals[f.id]} onChange={(e) => set(f.id, e.target.value)} />;
    }

    const isChild = !!(f.visibleIf && f.visibleIf.when && f.visibleIf.when.length);
    return (
      <div key={f.id} className={'fl-frow' + (f.width === 'half' ? ' half' : '') + (isChild ? ' fl-revealed' : '')}>
        {label}{control}{help}
      </div>
    );
  });

  return (
    <>
      <div className="fl-fillbar">
        <ion-icon name="flash-outline"></ion-icon>{ui.fillTry}
        <div className="sp"></div>
        {hidden > 0 && <span className="fl-hidechip"><ion-icon name="eye-off-outline"></ion-icon>{hidden} {ui.hiddenNow}</span>}
        <button className="fl-mini" onClick={() => setVals({})}><ion-icon name="refresh-outline"></ion-icon> {ui.reset}</button>
      </div>
      <div className="fl-fill fb-droplist flow">{rows}</div>
    </>
  );
}

Object.assign(window, { FL_UI, FlVisibility, FlFilter, FlMapSheet, FlChips, FlFill, FlDrives, flLbl });
