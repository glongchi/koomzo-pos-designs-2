/* Koomzo — Data source authoring screen + the picker the form inspector uses.
   Three tabs per source: Data (the grid), Schema (columns and their roles),
   Rules (plain-language rows). A right-hand aside always shows the source as
   the person filling the form will actually see it, rules applied. */
const { useState: _dsUseState } = React;
const { tx: _dtx, mk: _dmk, isI18n: _dIs, setLangVal: _dSet, langName: _dLang, LANGS: _dLANGS } = window;

const DS_UI = {
  en: {
    title: 'Data sources', sub: 'Reusable option lists and stateful counters', newSrc: 'New data source',
    data: 'Data', schema: 'Schema', rules: 'Rules', settings: 'Settings',
    rows: 'rows', version: 'v', draft: 'Draft', usedBy: 'Used by', usedNone: 'Not used by any form yet',
    addRow: 'Add row', key: 'Key', available: 'Available', capacity: 'Capacity', taken: 'Taken',
    colKey: 'Column', type: 'Type', role: 'Role', multilingual: 'Multilingual', addCol: 'Add column',
    roleValue: 'Value', roleDisplay: 'Display', roleDesc: 'Description', roleCapacity: 'Capacity', roleAlloc: 'Taken',
    noRules: 'No rules yet. A reference list often needs none.', addRule: 'Add a rule',
    preview: 'As the person filling sees it', previewNote: 'Rules applied, in',
    hold: 'Hold a selection', holdHint: 'Reserve the option while a form is open, then release it.',
    minutes: 'min', offline: 'Offline behaviour',
    offAllow: 'Allow and reconcile', offBlock: 'Require network',
    offlineHint: 'A stateful source can oversell offline. Allow it and reconcile, or refuse until the device is online.',
    bindInline: 'Type options', bindSource: 'Data source', chooseSource: 'Choose a data source',
    bindEmptyT: 'Bind to a data source', bindEmptyS: 'Reuse a list you already maintain instead of typing options here.',
    mapValue: 'Value', mapLabel: 'Display', mapDesc: 'Description', showDesc: 'Show description under each option',
    openSource: 'Open in Data sources', optionsFrom: 'options from', publish: 'Publish', saved: 'Data source saved',
    presets: 'Quick rules', searchSrc: 'Search sources', backToForm: 'Back to the form',
  },
  fr: {
    title: 'Sources de données', sub: 'Listes d’options réutilisables et compteurs avec état', newSrc: 'Nouvelle source',
    data: 'Données', schema: 'Schéma', rules: 'Règles', settings: 'Réglages',
    rows: 'lignes', version: 'v', draft: 'Brouillon', usedBy: 'Utilisée par', usedNone: 'Aucun formulaire ne l’utilise encore',
    addRow: 'Ajouter une ligne', key: 'Clé', available: 'Disponible', capacity: 'Capacité', taken: 'Pris',
    colKey: 'Colonne', type: 'Type', role: 'Rôle', multilingual: 'Multilingue', addCol: 'Ajouter une colonne',
    roleValue: 'Valeur', roleDisplay: 'Affichage', roleDesc: 'Description', roleCapacity: 'Capacité', roleAlloc: 'Pris',
    noRules: 'Aucune règle. Une liste de référence n’en a souvent pas besoin.', addRule: 'Ajouter une règle',
    preview: 'Vu par la personne qui remplit', previewNote: 'Règles appliquées, en',
    hold: 'Réserver une sélection', holdHint: 'Bloque l’option pendant que le formulaire est ouvert, puis la libère.',
    minutes: 'min', offline: 'Comportement hors ligne',
    offAllow: 'Autoriser et réconcilier', offBlock: 'Exiger le réseau',
    offlineHint: 'Une source avec état peut survendre hors ligne. Autorisez et réconciliez, ou refusez tant que l’appareil est hors ligne.',
    bindInline: 'Saisir les options', bindSource: 'Source de données', chooseSource: 'Choisir une source',
    bindEmptyT: 'Lier à une source de données', bindEmptyS: 'Réutilisez une liste déjà tenue à jour au lieu de saisir les options ici.',
    mapValue: 'Valeur', mapLabel: 'Affichage', mapDesc: 'Description', showDesc: 'Afficher la description sous chaque option',
    openSource: 'Ouvrir dans les sources', optionsFrom: 'options depuis', publish: 'Publier', saved: 'Source enregistrée',
    presets: 'Règles rapides', searchSrc: 'Rechercher une source', backToForm: 'Retour au formulaire',
  },
};

const dsT = (v, lang, primary) => (_dIs(v) ? (_dtx(v, lang) || _dtx(v, primary)) : (v == null ? '' : String(v)));
const availClass = (n, cap) => (n <= 0 ? 'out' : (cap && n / cap <= 0.25 ? 'low' : 'ok'));

/* ---------- resolved-option preview, shared by the aside and the picker ---------- */
function DsOptionPreview({ ds, binding, lang, primary, limit }) {
  const opts = window.dsResolve(ds, binding || {}, lang, primary).slice(0, limit || 6);
  return (
    <div>
      {opts.map((o, i) => (
        <div className={'ds-opt' + (o.state === 'disabled' ? ' off' : '')} key={i}>
          <span className="rb"></span>
          <span className="ds-opt__b">
            <b>{o.label}</b>
            {(!binding || binding.showDesc !== false) && o.desc ? <span>{o.desc}</span> : null}
          </span>
          {o.badge && <span className={'ds-optbadge' + (o.state === 'disabled' ? ' out' : '')}>{o.badge}</span>}
        </div>
      ))}
      {opts.length === 0 && <div className="ds-opt off"><span className="ds-opt__b"><b>—</b></span></div>}
    </div>
  );
}

/* ---------- rule row, rendered as a sentence ---------- */
function DsRuleRow({ r, ds, lang, primary, onDel }) {
  const cap = window.dsColByRole(ds, 'capacity'), al = window.dsColByRole(ds, 'allocated');
  const subj = r.subject === 'available' ? DS_UI[lang].available
    : r.subject === 'requested' ? (lang === 'fr' ? 'quantité demandée' : 'requested quantity')
    : r.subject;
  const opTxt = { lte: '≤', gte: '≥', gt: '>', is: '=', add: '+=', sub: '−=' }[r.op] || r.op;
  const val = typeof r.value === 'string' ? (r.value === 'available' ? DS_UI[lang].available : r.value)
    : String(r.value);
  const act = window.DS_ACTIONS[r.action];
  return (
    <div className="ds-rule">
      <div className="ds-rule__hd">
        <span className="ds-when"><ion-icon name={window.DS_WHEN[r.when].icon}></ion-icon>{dsT(window.DS_WHEN[r.when].label, lang, primary)}</span>
        <div style={{ flex: 1 }}></div>
        <button className="ds-rowdel" onClick={onDel} aria-label="Delete rule"><ion-icon name="trash-outline"></ion-icon></button>
      </div>
      <div className="ds-sentence">
        {r.when === 'read' ? (lang === 'fr' ? 'si' : 'if') : (lang === 'fr' ? 'quand' : 'when')}
        <span className="ds-tok">{subj}</span>
        <span className="ds-tok">{opTxt}</span>
        <span className="ds-tok">{val}</span>
        <b>→ {dsT(act.label, lang, primary)}</b>
      </div>
      {r.message && <div className="ds-msg"><ion-icon name="chatbox-ellipses-outline"></ion-icon>“{dsT(r.message, lang, primary)}”</div>}
      {r.action === 'decrease' && al && <div className="ds-msg"><ion-icon name="information-circle-outline"></ion-icon>{lang === 'fr' ? 'Écrit dans' : 'Writes to'} <b style={{ marginLeft: 4 }}>{al.key}</b>{cap ? ` · ${DS_UI[lang].available} = ${cap.key} − ${al.key}` : ''}</div>}
    </div>
  );
}

/* ---------- the authoring screen ---------- */
function DsScreen({ list, setList, lang, primary, onBack }) {
  const ui = DS_UI[lang];
  const [selId, setSelId] = _dsUseState(list[0] ? list[0].id : null);
  const [tab, setTab] = _dsUseState('data');
  const ds = list.find((d) => d.id === selId) || null;

  const patch = (fn) => setList((L) => L.map((d) => (d.id === selId ? fn(d) : d)));
  const setCell = (ri, col, v) => patch((d) => ({
    ...d,
    rows: d.rows.map((r, i) => {
      if (i !== ri) return r;
      if (col.type === 'i18n') return { ...r, [col.key]: _dSet(r[col.key] || _dmk('', ''), lang, v) };
      if (col.type === 'int' || col.type === 'decimal') return { ...r, [col.key]: v === '' ? '' : Number(v) };
      return { ...r, [col.key]: v };
    }),
  }));
  const addRow = () => patch((d) => {
    const blank = {};
    d.columns.forEach((c) => { blank[c.key] = c.type === 'i18n' ? _dmk('', '') : (c.type === 'int' || c.type === 'decimal') ? 0 : c.type === 'bool' ? false : ''; });
    return { ...d, rows: [...d.rows, blank] };
  });
  const delRow = (ri) => patch((d) => ({ ...d, rows: d.rows.filter((_, i) => i !== ri) }));
  const addCol = () => patch((d) => {
    const k = 'field_' + (d.columns.length + 1);
    return { ...d, columns: [...d.columns, { key: k, type: 'string' }], rows: d.rows.map((r) => ({ ...r, [k]: '' })) };
  });
  const patchCol = (ci, p) => patch((d) => ({ ...d, columns: d.columns.map((c, i) => (i === ci ? { ...c, ...p } : c)) }));
  const delRule = (id) => patch((d) => ({ ...d, rules: d.rules.filter((r) => r.id !== id) }));
  const addRule = (r) => patch((d) => ({ ...d, rules: [...d.rules, { ...r, id: 'r' + Math.random().toString(36).slice(2, 6) }] }));
  const newSource = () => {
    const id = 'ds_' + Math.random().toString(36).slice(2, 6);
    const src = {
      id, kind: 'list', status: 'draft', version: 1, updated: 'today',
      name: _dmk('New data source', 'Nouvelle source'), note: _dmk('', ''), usedBy: [],
      columns: [
        { key: 'key', type: 'string', role: 'value', required: true },
        { key: 'name', type: 'i18n', role: 'display', required: true },
        { key: 'blurb', type: 'i18n', role: 'description' },
      ],
      rows: [{ key: 'opt1', name: _dmk('Option 1', 'Option 1'), blurb: _dmk('', '') }],
      rules: [], offline: 'allow',
    };
    setList((L) => [...L, src]); setSelId(id); setTab('data');
  };

  const capCol = ds && window.dsColByRole(ds, 'capacity');
  const allocCol = ds && window.dsColByRole(ds, 'allocated');

  return (
    <div className={'ds' + (ds ? ' is-editor' : '')}>
      <div className="ds-rail">
        <div className="ds-rail__hd">
          <h3>{ui.title}</h3>
          <p>{ui.sub}</p>
        </div>
        <div className="ds-rail__scroll">
          {list.map((d) => {
            const k = window.DS_KINDS[d.kind];
            return (
              <button key={d.id} className={'ds-item' + (d.id === selId ? ' on' : '')} onClick={() => { setSelId(d.id); setTab('data'); }}>
                <span className="ds-item__t">
                  <b>{dsT(d.name, lang, primary)}</b>
                  {d.status === 'draft' && <span className="ds-draft">{ui.draft}</span>}
                </span>
                <span className="ds-item__m">
                  <span className={'ds-kind ' + d.kind}><ion-icon name={k.icon}></ion-icon>{dsT(k.label, lang, primary)}</span>
                  <span className="ds-dot">{d.rows.length} {ui.rows}</span>
                  <span className="ds-dot">· {ui.version}{d.version}</span>
                </span>
              </button>
            );
          })}
          <button className="ds-newbtn" onClick={newSource}><ion-icon name="add-outline"></ion-icon>{ui.newSrc}</button>
        </div>
      </div>

      {ds && (
        <div className="ds-main">
          <div className="ds-top">
            <input className="ds-top__n" value={_dtx(ds.name, lang)} placeholder={_dtx(ds.name, primary)}
              onChange={(e) => patch((d) => ({ ...d, name: _dSet(d.name, lang, e.target.value) }))} />
            <div className="ds-tabs">
              {[['data', ui.data, 'grid-outline'], ['schema', ui.schema, 'construct-outline'], ['rules', ui.rules, 'git-network-outline'], ['settings', ui.settings, 'options-outline']].map(([k, l, ic]) => (
                <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><ion-icon name={ic}></ion-icon>{l}</button>
              ))}
            </div>
            <button className="fb-tbtn" onClick={onBack}><ion-icon name="arrow-back-outline"></ion-icon>{ui.backToForm}</button>
            <button className="fb-tbtn primary" onClick={() => alert(ui.saved)}><ion-icon name="cloud-upload-outline"></ion-icon>{ui.publish}</button>
          </div>

          <div className="ds-scroll">
            {tab === 'data' && (
              <>
                {_dtx(ds.note, lang) || _dtx(ds.note, primary) ? (
                  <div className="ds-note"><ion-icon name="information-circle-outline"></ion-icon>{dsT(ds.note, lang, primary)}</div>
                ) : null}
                <table className="ds-grid">
                  <thead>
                    <tr>
                      {ds.columns.map((c) => (
                        <th key={c.key}>{c.key}<span className="ty">{dsT(window.DS_TYPES[c.type].label, lang, primary)}{c.type === 'i18n' ? ' · ' + lang.toUpperCase() : ''}</span></th>
                      ))}
                      {capCol && allocCol && <th>{ui.available}<span className="ty">{capCol.key} − {allocCol.key}</span></th>}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ds.rows.map((r, ri) => {
                      const av = window.dsAvailable(ds, r);
                      return (
                        <tr key={ri}>
                          {ds.columns.map((c) => (
                            <td key={c.key}>
                              {c.type === 'bool' ? (
                                <button className={'fb-switch' + (r[c.key] ? ' on' : '')} onClick={() => setCell(ri, c, !r[c.key])}><i></i></button>
                              ) : (
                                <input
                                  className={'ds-cell' + (c.role === 'value' ? ' key' : '') + (c.type === 'int' || c.type === 'decimal' ? ' num' : '')}
                                  value={c.type === 'i18n' ? _dtx(r[c.key], lang) : (r[c.key] == null ? '' : r[c.key])}
                                  placeholder={c.type === 'i18n' && lang !== primary ? _dtx(r[c.key], primary) : ''}
                                  onChange={(e) => setCell(ri, c, e.target.value)} />
                              )}
                            </td>
                          ))}
                          {capCol && allocCol && (
                            <td><span className={'ds-avail ' + availClass(av, r[capCol.key])}>{av}</span></td>
                          )}
                          <td><button className="ds-rowdel" onClick={() => delRow(ri)}><ion-icon name="close-outline"></ion-icon></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button className="ds-newbtn ds-addrow" onClick={addRow}><ion-icon name="add-outline"></ion-icon>{ui.addRow}</button>
              </>
            )}

            {tab === 'schema' && (
              <>
                <p className="ds-lbl">{ui.schema}</p>
                {ds.columns.map((c, ci) => (
                  <div className="ds-col" key={ci}>
                    <input className="ds-cell key ds-col__k" value={c.key} onChange={(e) => patchCol(ci, { key: e.target.value })} />
                    <select className="ds-col__sel" value={c.type} onChange={(e) => patchCol(ci, { type: e.target.value })}>
                      {Object.keys(window.DS_TYPES).map((t) => <option key={t} value={t}>{dsT(window.DS_TYPES[t].label, lang, primary)}</option>)}
                    </select>
                    <select className="ds-col__sel" value={c.role || ''} onChange={(e) => patchCol(ci, { role: e.target.value || undefined })}>
                      <option value="">—</option>
                      <option value="value">{ui.roleValue}</option>
                      <option value="display">{ui.roleDisplay}</option>
                      <option value="description">{ui.roleDesc}</option>
                      <option value="capacity">{ui.roleCapacity}</option>
                      <option value="allocated">{ui.roleAlloc}</option>
                    </select>
                    {c.type === 'i18n' && <span className="ds-i18nflag"><ion-icon name="language-outline"></ion-icon>{_dLANGS.map((l) => l.short).join(' · ')}</span>}
                    <div style={{ flex: 1 }}></div>
                    {c.role && <span className={'ds-role' + (c.role === 'capacity' || c.role === 'allocated' ? ' cap' : '')}>{c.role}</span>}
                  </div>
                ))}
                <button className="ds-newbtn" onClick={addCol}><ion-icon name="add-outline"></ion-icon>{ui.addCol}</button>
              </>
            )}

            {tab === 'rules' && (
              <>
                {ds.rules.length === 0 && <div className="ds-note"><ion-icon name="information-circle-outline"></ion-icon>{ui.noRules}</div>}
                {ds.rules.map((r) => <DsRuleRow key={r.id} r={r} ds={ds} lang={lang} primary={primary} onDel={() => delRule(r.id)} />)}
                <p className="ds-lbl" style={{ marginTop: 14 }}>{ui.presets}</p>
                <div className="ds-presets">
                  <button className="ds-preset" onClick={() => addRule({ when: 'read', subject: 'available', op: 'lte', value: 0, action: 'disable', message: _dmk('Fully booked', 'Complet') })}>
                    <ion-icon name="eye-off-outline"></ion-icon>{lang === 'fr' ? 'Griser quand c’est épuisé' : 'Grey out when none left'}</button>
                  <button className="ds-preset" onClick={() => addRule({ when: 'read', subject: 'available', op: 'lte', value: 3, action: 'badge', message: _dmk('{available} left', 'Plus que {available}') })}>
                    <ion-icon name="pricetag-outline"></ion-icon>{lang === 'fr' ? 'Badge “plus que N”' : 'Badge “N left”'}</button>
                  <button className="ds-preset" onClick={() => addRule({ when: 'submit', subject: 'requested', op: 'gt', value: 'available', action: 'block', message: _dmk('Only {available} left.', 'Il ne reste que {available}.') })}>
                    <ion-icon name="hand-right-outline"></ion-icon>{lang === 'fr' ? 'Refuser la survente' : 'Refuse oversell'}</button>
                  <button className="ds-preset" onClick={() => addRule({ when: 'submit', subject: allocCol ? allocCol.key : 'taken', op: 'add', value: 'requested', action: 'decrease' })}>
                    <ion-icon name="remove-circle-outline"></ion-icon>{lang === 'fr' ? 'Décrémenter à l’envoi' : 'Decrease on submit'}</button>
                  <button className="ds-preset" onClick={() => addRule({ when: 'cancel', subject: allocCol ? allocCol.key : 'taken', op: 'sub', value: 'requested', action: 'increase' })}>
                    <ion-icon name="arrow-undo-outline"></ion-icon>{lang === 'fr' ? 'Restituer à l’annulation' : 'Restore on cancel'}</button>
                </div>
              </>
            )}

            {tab === 'settings' && (
              <>
                <div className="ds-set">
                  <div className="ds-set__r">
                    <div className="t"><b>{ui.hold}</b><span>{ui.holdHint}</span></div>
                    <input className="ds-cell num" style={{ width: 64, border: '1px solid var(--kz-border-strong)' }} value={(ds.hold && ds.hold.minutes) || 0}
                      onChange={(e) => patch((d) => ({ ...d, hold: { on: Number(e.target.value) > 0, minutes: Number(e.target.value) } }))} />
                    <span style={{ font: '600 12px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>{ui.minutes}</span>
                  </div>
                </div>
                <div className="ds-set">
                  <div className="ds-set__r">
                    <div className="t"><b>{ui.offline}</b><span>{ui.offlineHint}</span></div>
                    <div className="ds-seg">
                      <button className={ds.offline === 'allow' ? 'on' : ''} onClick={() => patch((d) => ({ ...d, offline: 'allow' }))}>{ui.offAllow}</button>
                      <button className={ds.offline === 'block' ? 'on' : ''} onClick={() => patch((d) => ({ ...d, offline: 'block' }))}>{ui.offBlock}</button>
                    </div>
                  </div>
                </div>
                <div className="ds-set">
                  <p className="ds-lbl">{ui.usedBy}</p>
                  {ds.usedBy.length === 0 ? <span style={{ font: '400 12.5px var(--kz-font-sans)', color: 'var(--kz-muted-3)' }}>{ui.usedNone}</span>
                    : ds.usedBy.map((u, i) => <span className="ds-usechip" key={i}><ion-icon name="document-text-outline"></ion-icon>{dsT(u, lang, primary)}</span>)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {ds && (
        <div className="ds-aside">
          <div className="ds-aside__hd"><ion-icon name="phone-portrait-outline" style={{ color: 'var(--kz-primary)', fontSize: 17 }}></ion-icon><h3>{ui.preview}</h3></div>
          <div className="ds-aside__scroll">
            <div className="ds-phone">
              <div className="ds-phone__top">{ui.previewNote} {_dLang(lang, lang)}</div>
              <div className="ds-phone__body"><DsOptionPreview ds={ds} lang={lang} primary={primary} limit={6} /></div>
            </div>
            {capCol && allocCol && (
              <div className="ds-set">
                <p className="ds-lbl">{ui.available}</p>
                {ds.rows.map((r, i) => {
                  const av = window.dsAvailable(ds, r);
                  return (
                    <div className="ds-set__r" key={i} style={{ marginBottom: 6 }}>
                      <div className="t"><b>{dsT(r[(window.dsColByRole(ds, 'display') || {}).key], lang, primary)}</b><span>{r[capCol.key]} {ui.capacity.toLowerCase()} · {r[allocCol.key]} {ui.taken.toLowerCase()}</span></div>
                      <span className={'ds-avail ' + availClass(av, r[capCol.key])}>{av}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- picker sheet, opened from the form inspector ---------- */
function DsPicker({ list, lang, primary, current, onPick, onClose }) {
  const ui = DS_UI[lang];
  return (
    <div className="ds-scrim" onClick={onClose}>
      <div className="ds-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ds-sheet__hd">
          <ion-icon name="server-outline" style={{ color: 'var(--kz-primary)', fontSize: 20 }}></ion-icon>
          <b>{ui.chooseSource}</b>
          <button className="ds-sheet__x" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="ds-sheet__scroll">
          {list.map((d) => {
            const k = window.DS_KINDS[d.kind];
            return (
              <button key={d.id} className={'ds-pick' + (current === d.id ? ' on' : '')} onClick={() => { onPick(d); onClose(); }}>
                <span className="ds-pick__ic"><ion-icon name={k.icon}></ion-icon></span>
                <span className="ds-pick__b">
                  <b>{dsT(d.name, lang, primary)}</b>
                  <p>{dsT(d.note, lang, primary)}</p>
                  <span className="ds-item__m">
                    <span className={'ds-kind ' + d.kind}><ion-icon name={k.icon}></ion-icon>{dsT(k.label, lang, primary)}</span>
                    <span className="ds-dot">{d.rows.length} {ui.rows}</span>
                    {d.status === 'draft' && <span className="ds-draft">{ui.draft}</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- inspector block: inline options vs bound source ---------- */
function DsBinding({ field, list, lang, primary, ui, onPatch, onOpenSources }) {
  const dui = DS_UI[lang];
  const [pick, setPick] = _dsUseState(false);
  const ds = field.source ? window.dsFind(field.source.id) : null;
  const bound = !!field.source;
  const bindTo = (d) => onPatch({
    source: {
      id: d.id,
      valueCol: (window.dsColByRole(d, 'value') || {}).key,
      labelCol: (window.dsColByRole(d, 'display') || {}).key,
      descCol: (window.dsColByRole(d, 'description') || {}).key,
      showDesc: true,
    },
  });
  const setBind = (p) => onPatch({ source: { ...field.source, ...p } });
  const colOpts = (ds ? ds.columns : []).map((c) => <option key={c.key} value={c.key}>{c.key}</option>);

  return (
    <>
      <div className="fb-insp-section">{ui.options}</div>
      <div className="fb-seg2" style={{ marginBottom: 10 }}>
        <button className={!bound ? 'active' : ''} onClick={() => onPatch({ source: null })}><ion-icon name="create-outline"></ion-icon>{dui.bindInline}</button>
        <button className={bound ? 'active' : ''} onClick={() => (bound ? null : setPick(true))}><ion-icon name="server-outline"></ion-icon>{dui.bindSource}</button>
      </div>

      {!bound ? null : ds ? (
        <div className="fb-bindcard">
          <div className="fb-bindcard__t">
            <span className="ds-pick__ic" style={{ width: 26, height: 26 }}><ion-icon name={window.DS_KINDS[ds.kind].icon} style={{ fontSize: 15 }}></ion-icon></span>
            <b>{dsT(ds.name, lang, primary)}</b>
            <button className="ch" onClick={() => setPick(true)} title={dui.chooseSource}><ion-icon name="swap-horizontal-outline"></ion-icon></button>
          </div>
          <div className="ds-item__m">
            <span className={'ds-kind ' + ds.kind}><ion-icon name={window.DS_KINDS[ds.kind].icon}></ion-icon>{dsT(window.DS_KINDS[ds.kind].label, lang, primary)}</span>
            <span className="ds-dot">{window.dsResolve(ds, field.source, lang, primary).length} {dui.optionsFrom} {ds.rows.length}</span>
          </div>
          <div className="fb-map"><span>{dui.mapValue}</span>
            <select value={field.source.valueCol || ''} onChange={(e) => setBind({ valueCol: e.target.value })}>{colOpts}</select></div>
          <div className="fb-map"><span>{dui.mapLabel}</span>
            <select value={field.source.labelCol || ''} onChange={(e) => setBind({ labelCol: e.target.value })}>{colOpts}</select></div>
          <div className="fb-map"><span>{dui.mapDesc}</span>
            <select value={field.source.descCol || ''} onChange={(e) => setBind({ descCol: e.target.value })}><option value="">—</option>{colOpts}</select></div>
          <div className="fb-toggle-row" style={{ margin: 0, border: 'none', padding: 0 }}>
            <div className="t"><b>{dui.showDesc}</b></div>
            <button className={'fb-switch' + (field.source.showDesc ? ' on' : '')} onClick={() => setBind({ showDesc: !field.source.showDesc })}><i></i></button>
          </div>
          <div className="ds-phone" style={{ margin: 0, borderWidth: 5 }}>
            <div className="ds-phone__body" style={{ padding: 8 }}><DsOptionPreview ds={ds} binding={field.source} lang={lang} primary={primary} limit={3} /></div>
          </div>
          <button className="fb-tbtn" onClick={onOpenSources}><ion-icon name="open-outline"></ion-icon>{dui.openSource}</button>
        </div>
      ) : (
        <div className="fb-bindempty">
          <ion-icon name="server-outline"></ion-icon>
          <b>{dui.bindEmptyT}</b>
          <span>{dui.bindEmptyS}</span>
          <button className="fb-bindbtn" onClick={() => setPick(true)}><ion-icon name="link-outline"></ion-icon>{dui.chooseSource}</button>
        </div>
      )}

      {pick && <DsPicker list={list} lang={lang} primary={primary} current={field.source && field.source.id} onPick={bindTo} onClose={() => setPick(false)} />}
    </>
  );
}

Object.assign(window, { DS_UI, DsScreen, DsPicker, DsBinding, DsOptionPreview, dsT });
