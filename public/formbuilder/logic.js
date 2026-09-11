/* Koomzo — Form Builder conditional logic.
   Two authored rules, both cross-step:
     visibleIf  — show this field only when a parent field answers a certain way
     filterBy   — a child dropdown offers only the options a parent value allows
   Everything is stored on the child field, so a field carries its own logic and
   can be duplicated or moved between steps without hunting for a rules table. */

/* which comparisons make sense for each parent type */
window.FL_OPS = {
  text:     ['filled', 'empty', 'eq', 'neq', 'contains'],
  textarea: ['filled', 'empty', 'eq', 'neq', 'contains'],
  email:    ['filled', 'empty', 'eq', 'neq', 'contains'],
  phone:    ['filled', 'empty', 'eq', 'neq', 'contains'],
  number:   ['filled', 'empty', 'gt', 'gte', 'lt', 'lte', 'eq', 'between'],
  range:    ['filled', 'empty', 'gt', 'gte', 'lt', 'lte', 'eq', 'between'],
  date:     ['filled', 'empty', 'before', 'after', 'on_date', 'between'],
  time:     ['filled', 'empty', 'before', 'after', 'on_date', 'between'],
  toggle:   ['is_on', 'is_off'],
  select:   ['is', 'isnot', 'filled', 'empty'],
  radio:    ['is', 'isnot', 'filled', 'empty'],
  checkbox: ['includes', 'notincludes', 'filled', 'empty'],
};

window.FL_OPLBL = {
  filled:      { en: 'is filled in',      fr: 'est renseigné' },
  empty:       { en: 'is left empty',     fr: 'est laissé vide' },
  eq:          { en: 'is exactly',        fr: 'est exactement' },
  neq:         { en: 'is not',            fr: "n'est pas" },
  contains:    { en: 'contains',          fr: 'contient' },
  gt:          { en: 'is more than',      fr: 'est supérieur à' },
  gte:         { en: 'is at least',       fr: 'est au moins' },
  lt:          { en: 'is less than',      fr: 'est inférieur à' },
  lte:         { en: 'is at most',        fr: 'est au plus' },
  between:     { en: 'is between',        fr: 'est entre' },
  before:      { en: 'is before',         fr: 'est avant' },
  after:       { en: 'is after',          fr: 'est après' },
  on_date:     { en: 'is on',             fr: 'est le' },
  is_on:       { en: 'is switched on',    fr: 'est activé' },
  is_off:      { en: 'is switched off',   fr: 'est désactivé' },
  is:          { en: 'is',                fr: 'est' },
  isnot:       { en: 'is not',            fr: "n'est pas" },
  includes:    { en: 'includes',          fr: 'comprend' },
  notincludes: { en: 'does not include',  fr: 'ne comprend pas' },
};

window.FL_NOVALUE = ['filled', 'empty', 'is_on', 'is_off'];
window.FL_TWOVALUE = ['between'];

window.flIsChoice = (f) => f && ['select', 'radio', 'checkbox'].includes(f.type);
window.flIsLayout = (f) => f && ['heading', 'divider', 'paragraph'].includes(f.type);

/* option identity: inline options are addressed by index, source rows by key */
window.flOptions = (f, lang, primary) => {
  if (!f) return [];
  if (f.source) {
    const ds = window.dsFind(f.source.id);
    return window.dsResolve(ds, f.source, lang, primary).map((o) => ({ v: String(o.value), label: o.label }));
  }
  return (f.options || []).map((o, i) => ({ v: 'o' + i, label: window.tx(o.label, lang) || window.tx(o.label, primary) || '—' }));
};

/* every field that may act as a parent for `child`: earlier in this step, or any earlier step */
window.flParents = (steps, stepIdx, childId, only) => {
  const out = [];
  steps.forEach((s, si) => {
    if (si > stepIdx) return;
    s.fields.forEach((f) => {
      if (f.id === childId || window.flIsLayout(f)) return;
      if (si === stepIdx) {
        const fi = s.fields.findIndex((x) => x.id === f.id);
        const ci = s.fields.findIndex((x) => x.id === childId);
        if (ci >= 0 && fi > ci) return; /* a parent must be answered first */
      }
      if (only === 'choice' && !window.flIsChoice(f)) return;
      out.push({ field: f, stepIdx: si, step: s });
    });
  });
  return out;
};
window.flFindField = (steps, id) => {
  for (const s of steps) { const f = s.fields.find((x) => x.id === id); if (f) return f; }
  return null;
};
window.flStepOf = (steps, id) => steps.findIndex((s) => s.fields.some((f) => f.id === id));

/* ---- evaluation, the same logic the filling client runs ---- */
const _num = (v) => (v === '' || v == null ? NaN : Number(v));
window.flTest = (cond, parent, val) => {
  const has = !(val == null || val === '' || (Array.isArray(val) && !val.length));
  switch (cond.op) {
    case 'filled': return has;
    case 'empty': return !has;
    case 'is_on': return val === true;
    case 'is_off': return val !== true;
    case 'eq': return String(val) === String(cond.value);
    case 'neq': return String(val) !== String(cond.value);
    case 'contains': return has && String(val).toLowerCase().includes(String(cond.value || '').toLowerCase());
    case 'gt': return _num(val) > _num(cond.value);
    case 'gte': return _num(val) >= _num(cond.value);
    case 'lt': return _num(val) < _num(cond.value);
    case 'lte': return _num(val) <= _num(cond.value);
    case 'between': return _num(val) >= _num(cond.value) && _num(val) <= _num(cond.value2);
    case 'before': return has && String(val) < String(cond.value);
    case 'after': return has && String(val) > String(cond.value);
    case 'on_date': return has && String(val) === String(cond.value);
    case 'is': return String(val) === String(cond.value);
    case 'isnot': return has && String(val) !== String(cond.value);
    case 'includes': return Array.isArray(val) && val.map(String).includes(String(cond.value));
    case 'notincludes': return !(Array.isArray(val) && val.map(String).includes(String(cond.value)));
    default: return true;
  }
};
window.flVisible = (f, vals, steps) => {
  const rule = f.visibleIf;
  if (!rule || !rule.when || !rule.when.length) return true;
  const results = rule.when.map((c) => {
    const p = window.flFindField(steps, c.parent);
    if (!p) return true;
    if (!window.flVisible(p, vals, steps)) return false; /* a hidden parent cannot satisfy a rule */
    const raw = vals[c.parent];
    return window.flTest(c, p, raw);
  });
  return rule.match === 'any' ? results.some(Boolean) : results.every(Boolean);
};
/* a child may carry several filters, each driven by its own parent */
window.flFilters = (f) => (f.filters && f.filters.length ? f.filters : (f.filterBy && f.filterBy.parent ? [f.filterBy] : []));
/* one filter, resolved against the answers so far */
window.flFilterKeep = (f, fb, vals) => {
  const pv = vals[fb.parent];
  if (pv == null || pv === '') return { locked: fb.emptyParent !== 'all', set: null };
  if (fb.mode === 'column' && f.source) {
    const ds = window.dsFind(f.source.id);
    if (!ds) return { locked: false, set: null };
    const keyCol = (window.dsColByRole(ds, 'value') || {}).key;
    return { locked: false, set: new Set(ds.rows.filter((r) => String(r[fb.column]) === String(pv)).map((r) => String(r[keyCol]))) };
  }
  const allowed = (fb.map || {})[String(pv)];
  if (!allowed) return { locked: false, set: fb.unmapped === 'all' ? null : new Set() };
  return { locked: false, set: new Set(allowed.map(String)) };
};
window.flChildOptions = (f, vals, steps, lang, primary) => {
  const all = window.flOptions(f, lang, primary);
  const list = window.flFilters(f);
  if (!list.length) return all;
  const combine = f.filterCombine === 'any' ? 'any' : 'all';
  const sets = [];
  for (const fb of list) {
    const r = window.flFilterKeep(f, fb, vals);
    if (r.locked) { if (combine === 'all') return []; continue; }
    if (r.set) sets.push(r.set);
  }
  if (!sets.length) return combine === 'all' ? all : [];
  return all.filter((o) => (combine === 'any'
    ? sets.some((st) => st.has(String(o.v)))
    : sets.every((st) => st.has(String(o.v)))));
};
/* is the child waiting on a parent nobody has answered yet? */
window.flChildLocked = (f, vals) => {
  const list = window.flFilters(f);
  if (!list.length) return false;
  const pending = list.filter((fb) => {
    const pv = vals[fb.parent];
    return (pv == null || pv === '') && fb.emptyParent !== 'all';
  });
  if (!pending.length) return false;
  return f.filterCombine === 'any' ? pending.length === list.length : true;
};
/* every rule this field drives, downstream — the parent's own view of its rules */
window.flDrives = (steps, parentId) => {
  const out = [];
  steps.forEach((s, si) => s.fields.forEach((c) => {
    ((c.visibleIf && c.visibleIf.when) || []).forEach((cond, ci) => {
      if (cond.parent === parentId) out.push({ kind: 'visible', child: c, stepIdx: si, cond, condIdx: ci });
    });
    window.flFilters(c).forEach((fb, fi) => {
      if (fb.parent === parentId) out.push({ kind: 'filter', child: c, stepIdx: si, fb, filterIdx: fi });
    });
  }));
  return out;
};
