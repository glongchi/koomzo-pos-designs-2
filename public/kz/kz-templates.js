/* Koomzo — Template Library store (shared by Control Centre and every venue).
   Platform-owned templates: sample menus and floor plans customers COPY during setup.
   Prototype storage: localStorage 'kz:tpl:v1' (+ copy records). In production this is a
   platform collection, read-only to tenants, write for the Template editor role. */
(function () {
  const KEY = 'kz:tpl:v1', USES = 'kz:tpl:uses:v1';
  const subs = new Set();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let uid = 1;
  const id = (p) => p + Date.now().toString(36) + (uid++).toString(36);

  const VENUES = [
    { id: 'maquis', label: 'Maquis' }, { id: 'restaurant', label: 'Restaurant' }, { id: 'bar', label: 'Bar / lounge' },
    { id: 'snack', label: 'Snack / fast food' }, { id: 'hotel', label: 'Hotel restaurant' }, { id: 'counter', label: 'Counter only' },
  ];
  const TINT = {
    grill: { bg: '#fdeae4', fg: '#ec603a' }, pasta: { bg: '#e4f4ea', fg: '#2e9e5b' }, fry: { bg: '#f9efd8', fg: '#b8902f' },
    cold: { bg: '#e8f0fd', fg: '#528cef' }, bar: { bg: '#eeecf8', fg: '#6a61bf' }, dessert: { bg: '#fdeef0', fg: '#d4607a' },
    pizza: { bg: '#e2f3f1', fg: '#2f9d8f' }, none: { bg: '#eceef2', fg: '#5d6573' },
  };

  /* ---------- seed: menus ---------- */
  function menu(cats, rows) {
    const categories = cats.map(([cid, label, icon]) => ({ id: cid, label, icon }));
    const items = rows.map(([cat, name, desc, price, station, tags, icon], i) => ({
      id: 'd' + i, cat, name, desc, price, station, tags: tags ? tags.split(' ') : [],
      icon: icon || (categories.find((c) => c.id === cat) || {}).icon || 'restaurant-outline', tint: TINT[station] || TINT.none,
    }));
    return { categories, items };
  }
  const M_MAQUIS = menu(
    [['entrees', 'Entrées', 'leaf-outline'], ['plats', 'Plats', 'restaurant-outline'], ['grillades', 'Grillades', 'flame-outline'], ['accomp', 'Accompagnements', 'fast-food-outline'], ['boissons', 'Boissons', 'beer-outline']],
    [['entrees', 'Beignets haricots', 'Puff-puff et haricots', 500, 'fry', 'v'],
     ['entrees', 'Soya brochette', 'Bœuf épicé, 2 pièces', 1000, 'grill', 'spicy'],
     ['entrees', 'Bouillon de poisson', 'Poisson pimenté', 2500, 'pasta', 'spicy', 'fish-outline'],
     ['entrees', 'Koki', 'Haricots, feuille de bananier', 1000, 'pasta', 'v gf'],
     ['entrees', "Salade d'avocat", 'Avocat, tomate, oignon', 1500, 'cold', 'vg gf'],
     ['entrees', 'Gésier grillé', 'Piment, oignon', 2000, 'grill', 'spicy'],
     ['plats', 'Ndolé crevettes', 'Feuilles amères, crevettes, plantain', 3500, 'pasta', 'shellfish nuts'],
     ['plats', 'Poulet DG', 'Poulet, plantain, légumes', 4500, 'grill', ''],
     ['plats', 'Eru & water fufu', 'Eru, waterleaf, garri', 2500, 'pasta', ''],
     ['plats', 'Achu sauce jaune', 'Taro pilé, sauce jaune', 3000, 'pasta', 'spicy'],
     ['plats', 'Okok & bobolo', 'Gnetum, noix de palme, manioc', 2000, 'pasta', 'nuts'],
     ['plats', 'Mets de pistache', 'Pistache, poisson fumé', 2500, 'pasta', 'nuts'],
     ['plats', 'Kondrè de mouton', 'Mouton, plantain vert', 3500, 'pasta', 'spicy'],
     ['plats', 'Taro sauce jaune', 'Taro, sauce jaune au palme', 2500, 'pasta', 'gf'],
     ['plats', 'Riz sauté poulet', 'Riz, poulet, légumes', 2500, 'grill', ''],
     ['grillades', 'Poisson braisé', 'Bar entier, piment', 4000, 'grill', 'spicy', 'fish-outline'],
     ['grillades', 'Porc braisé', 'Côtes, oignon, piment', 3000, 'grill', ''],
     ['grillades', 'Demi-poulet braisé', 'Mariné, grillé au charbon', 3500, 'grill', ''],
     ['grillades', 'Brochettes de bœuf ×3', 'Bœuf, poivron', 1500, 'grill', ''],
     ['grillades', 'Maquereau braisé', 'Entier, sauce piment', 2500, 'grill', 'spicy', 'fish-outline'],
     ['accomp', 'Plantain mûr frit', 'Portion', 500, 'fry', 'vg'],
     ['accomp', 'Miondo', '3 bâtons', 300, 'none', 'vg'],
     ['accomp', 'Bâton de manioc', '1 bâton', 300, 'none', 'vg'],
     ['accomp', 'Frites de plantain', 'Portion', 700, 'fry', 'vg'],
     ['accomp', 'Riz blanc', 'Portion', 500, 'pasta', 'vg'],
     ['boissons', 'Castel 65 cl', 'Bière', 800, 'bar', 'alcohol'],
     ['boissons', '33 Export 65 cl', 'Bière', 800, 'bar', 'alcohol'],
     ['boissons', 'Guinness 65 cl', 'Stout', 1000, 'bar', 'alcohol'],
     ['boissons', 'Top pamplemousse', 'Soda 60 cl', 500, 'bar', '', 'cafe-outline'],
     ['boissons', 'Jus de foléré', 'Hibiscus, gingembre', 500, 'bar', 'vg', 'cafe-outline'],
     ['boissons', 'Eau Supermont 1,5 L', 'Eau minérale', 600, 'bar', '', 'water-outline']]);
  const M_BAR = menu(
    [['bieres', 'Bières', 'beer-outline'], ['vins', 'Vins', 'wine-outline'], ['cocktails', 'Cocktails', 'wine-outline'], ['spiritueux', 'Spiritueux', 'flask-outline'], ['snacks', 'Snacks', 'fast-food-outline']],
    [['bieres', 'Castel 65 cl', 'Blonde', 1000, 'bar', 'alcohol'], ['bieres', 'Mützig 65 cl', 'Blonde forte', 1000, 'bar', 'alcohol'],
     ['bieres', 'Booster', 'Panaché', 800, 'bar', 'alcohol'], ['bieres', 'Guinness Smooth', 'Stout', 1200, 'bar', 'alcohol'],
     ['bieres', 'Heineken 33 cl', 'Blonde importée', 1500, 'bar', 'alcohol'],
     ['vins', 'Verre de rouge', '15 cl', 2500, 'bar', 'alcohol'], ['vins', 'Verre de blanc', '15 cl', 2500, 'bar', 'alcohol'],
     ['vins', 'Bouteille de Bordeaux', '75 cl', 15000, 'bar', 'alcohol'], ['vins', 'Vin de palme', 'Calebasse', 1000, 'bar', 'alcohol'],
     ['cocktails', 'Mojito', 'Rhum, menthe, citron vert', 4000, 'bar', 'alcohol'], ['cocktails', 'Piña colada', 'Rhum, ananas, coco', 4500, 'bar', 'alcohol'],
     ['cocktails', 'Caïpirinha', 'Cachaça, citron vert', 4000, 'bar', 'alcohol'], ['cocktails', 'Ginger fizz', 'Sans alcool, gingembre', 3000, 'bar', 'vg'],
     ['spiritueux', 'Whisky (dose)', '4 cl', 2500, 'bar', 'alcohol'], ['spiritueux', 'Rhum (dose)', '4 cl', 2000, 'bar', 'alcohol'],
     ['spiritueux', 'Vodka (dose)', '4 cl', 2000, 'bar', 'alcohol'],
     ['snacks', 'Soya brochette', 'Bœuf épicé, 2 pièces', 1000, 'grill', 'spicy', 'flame-outline'], ['snacks', 'Arachides grillées', 'Sachet', 500, 'none', 'vg nuts'],
     ['snacks', 'Chips de plantain', 'Portion', 500, 'fry', 'vg'], ['snacks', 'Ailes de poulet ×6', 'Sauce piment', 3000, 'fry', 'spicy']]);
  const M_SNACK = menu(
    [['burgers', 'Burgers', 'fast-food-outline'], ['shawarma', 'Shawarma', 'restaurant-outline'], ['frites', 'Frites', 'fast-food-outline'], ['boissons', 'Boissons', 'cafe-outline']],
    [['burgers', 'Burger classique', 'Bœuf, salade, tomate', 2500, 'grill', ''], ['burgers', 'Cheeseburger', 'Bœuf, cheddar', 3000, 'grill', 'dairy'],
     ['burgers', 'Burger poulet', 'Poulet pané', 2800, 'fry', ''], ['burgers', 'Double burger', 'Deux steaks, cheddar', 4000, 'grill', 'dairy'],
     ['shawarma', 'Shawarma poulet', 'Poulet, crudités, sauce ail', 2000, 'grill', ''], ['shawarma', 'Shawarma bœuf', 'Bœuf, crudités', 2200, 'grill', ''],
     ['shawarma', 'Shawarma mixte', 'Poulet et bœuf', 2500, 'grill', ''], ['shawarma', 'Wrap végétarien', 'Légumes grillés, houmous', 1800, 'cold', 'v'],
     ['frites', 'Frites', 'Portion', 1000, 'fry', 'vg'], ['frites', 'Frites de plantain', 'Portion', 1000, 'fry', 'vg'],
     ['frites', 'Nuggets ×6', 'Poulet pané', 2000, 'fry', ''], ['frites', 'Ailes épicées ×6', 'Sauce piment', 2500, 'fry', 'spicy'],
     ['boissons', 'Coca-Cola 33 cl', 'Canette', 500, 'none', ''], ['boissons', 'Fanta 33 cl', 'Canette', 500, 'none', ''],
     ['boissons', "Jus d'ananas", 'Pressé', 800, 'none', 'vg'], ['boissons', 'Eau 50 cl', 'Eau minérale', 300, 'none', '', 'water-outline']]);
  const M_HOTEL = menu(
    [['breakfast', 'Breakfast', 'cafe-outline'], ['starters', 'Starters', 'leaf-outline'], ['mains', 'Mains', 'restaurant-outline'], ['desserts', 'Desserts', 'ice-cream-outline'], ['drinks', 'Drinks', 'wine-outline']],
    [['breakfast', 'Continental breakfast', 'Bread, butter, jam, juice, coffee', 5000, 'cold', 'v'], ['breakfast', 'Full breakfast', 'Eggs, sausage, beans, toast', 7500, 'grill', ''],
     ['breakfast', 'Omelette', 'Three eggs, choice of filling', 3000, 'grill', 'v'], ['breakfast', 'Fresh fruit plate', 'Pineapple, papaya, mango', 2500, 'cold', 'vg gf'],
     ['starters', 'Avocado salad', 'Avocado, tomato, onion', 3000, 'cold', 'vg gf'], ['starters', 'Pepper soup', 'Fish or goat', 3500, 'pasta', 'spicy'],
     ['starters', 'Spring rolls', 'Vegetable, sweet chilli', 3000, 'fry', 'v'],
     ['mains', 'Grilled sea bass', 'Whole fish, plantain, salad', 9000, 'grill', '', 'fish-outline'], ['mains', 'Chicken DG', 'Chicken, plantain, vegetables', 7500, 'grill', ''],
     ['mains', 'Beef fillet', 'Pepper sauce, fries', 11000, 'grill', ''], ['mains', 'Ndolé with prawns', 'Bitterleaf, prawns, plantain', 7000, 'pasta', 'shellfish nuts'],
     ['mains', 'Vegetable pasta', 'Tomato, basil, parmesan', 6000, 'pasta', 'v dairy'],
     ['desserts', 'Fruit salad', 'Seasonal fruit', 2500, 'cold', 'vg gf'], ['desserts', 'Chocolate fondant', 'Warm, vanilla ice cream', 3500, 'dessert', 'dairy'],
     ['desserts', 'Ice cream', 'Two scoops', 2500, 'dessert', 'dairy'],
     ['drinks', 'Espresso', 'Single', 1500, 'bar', '', 'cafe-outline'], ['drinks', 'Fresh juice', 'Orange, pineapple or mango', 2000, 'bar', 'vg', 'cafe-outline'],
     ['drinks', 'Mineral water 1 L', 'Still or sparkling', 1000, 'bar', '', 'water-outline'], ['drinks', 'Glass of wine', 'Red or white, 15 cl', 4000, 'bar', 'alcohol'],
     ['drinks', 'Local beer 65 cl', 'Castel or 33 Export', 1500, 'bar', 'alcohol', 'beer-outline']]);

  /* ---------- seed: floor plans (the six built-in layouts, unchanged) ---------- */
  function spots(n) {
    if (!n) return [];
    const cols = Math.min(n, Math.max(2, Math.ceil(Math.sqrt(n * 1.7)))), rows = Math.ceil(n / cols);
    return Array.from({ length: n }, (_, i) => { const c = i % cols, r = Math.floor(i / cols);
      return { x: Math.round(10 + (cols === 1 ? 40 : c * (78 / (cols - 1)))), y: Math.round(rows === 1 ? 40 : 16 + r * (64 / Math.max(1, rows - 1))) }; });
  }
  /* lay out one area's tables; numbering continues across areas, stools are S1…, rooms R1… */
  function layArea(a, start) {
    const prefix = a.shape === 'stool' ? 'S' : a.icon === 'bed-outline' ? 'R' : '';
    let num = start;
    const tables = spots(a.count).map((p, i) => ({ id: 't' + (uid++).toString(36) + i, label: prefix ? prefix + (i + 1) : String(num++), seats: a.seats, shape: a.shape, x: p.x, y: p.y }));
    return { tables, next: num };
  }
  function floor(areas, rules, counterOnly) {
    let n = 1;
    return { counterOnly: !!counterOnly, rules, areas: areas.map((a, i) => { const r = layArea(a, n); n = r.next; return { id: 'a' + i, label: a.label, icon: a.icon, tables: r.tables }; }) };
  }
  const F = {
    maquis: floor([{ label: 'Salle', icon: 'home-outline', shape: 'square', seats: 4, count: 8 }, { label: 'Terrasse', icon: 'sunny-outline', shape: 'round', seats: 4, count: 4 }], { voidRule: 'pin-always', printKitchen: true }),
    restaurant: floor([{ label: 'Salle', icon: 'home-outline', shape: 'square', seats: 4, count: 12 }, { label: 'Terrasse', icon: 'sunny-outline', shape: 'round', seats: 4, count: 6 }, { label: 'Bar', icon: 'wine-outline', shape: 'stool', seats: 1, count: 6 }], { voidRule: 'free-until-start', printKitchen: false }),
    bar: floor([{ label: 'Bar', icon: 'wine-outline', shape: 'stool', seats: 1, count: 8 }, { label: 'Lounge', icon: 'star-outline', shape: 'round', seats: 4, count: 6 }], { voidRule: 'pin-always', printKitchen: false }),
    hotel: floor([{ label: 'Restaurant', icon: 'home-outline', shape: 'square', seats: 4, count: 10 }, { label: 'Bar', icon: 'wine-outline', shape: 'stool', seats: 1, count: 6 }, { label: 'Room service', icon: 'bed-outline', shape: 'rect', seats: 2, count: 4 }], { voidRule: 'free-until-start', printKitchen: false }),
    snack: floor([{ label: 'Salle', icon: 'storefront-outline', shape: 'square', seats: 4, count: 4 }], { voidRule: 'pin-always', printKitchen: true }),
    counter: floor([], { voidRule: 'pin-always', printKitchen: false }, true),
  };

  function seed() {
    const at = Date.parse('2026-10-01T09:00:00');
    const T = (tid, kind, name, description, venueTypes, locale, content, pairWith, extra) => ({
      id: tid, kind, name, description, venueTypes, locale, currency: 'XAF', status: 'published', version: 1,
      publishedAt: at, updatedAt: at, updatedBy: 'Koomzo team', pairWith: pairWith || null,
      draft: clone(content), live: clone(content), dirty: false, history: [{ version: 1, at, by: 'Koomzo team' }], ...(extra || {}),
    });
    return [
      T('m-maquis', 'menu', 'Maquis camerounais', 'Entrées, plats en sauce, grillades et boissons — le menu type d\'un maquis de quartier.', ['maquis', 'restaurant'], 'fr', M_MAQUIS, 'f-maquis'),
      T('m-bar', 'menu', 'Bar / lounge', 'Bières, vins, cocktails, spiritueux et quelques snacks.', ['bar'], 'fr', M_BAR, 'f-bar'),
      T('m-snack', 'menu', 'Snack / fast food', 'Burgers, shawarma, frites et boissons fraîches.', ['snack', 'counter'], 'fr', M_SNACK, 'f-snack'),
      T('m-hotel', 'menu', 'Hotel restaurant', 'Breakfast through dinner, with a short drinks list.', ['hotel'], 'en', M_HOTEL, 'f-hotel'),
      T('f-maquis', 'floor', 'Maquis / small restaurant', 'Indoor room and a terrace — the most common layout.', ['maquis'], 'fr', F.maquis, 'm-maquis'),
      T('f-restaurant', 'floor', 'Restaurant', 'Room, terrace and a bar counter.', ['restaurant'], 'fr', F.restaurant, null),
      T('f-bar', 'floor', 'Bar / lounge', 'Stools at the bar and lounge tables.', ['bar'], 'fr', F.bar, 'm-bar'),
      T('f-hotel', 'floor', 'Hotel restaurant', 'Restaurant, bar and room service.', ['hotel'], 'en', F.hotel, 'm-hotel'),
      T('f-snack', 'floor', 'Snack / fast food', 'Order at the counter, a few tables to eat in.', ['snack'], 'fr', F.snack, 'm-snack'),
      T('f-counter', 'floor', 'Counter only', 'No tables — tabs and counter tickets.', ['counter', 'snack', 'bar'], 'fr', F.counter, null),
    ];
  }

  /* ---------- persistence ---------- */
  const read = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb(); } catch (e) { return fb(); } };
  let templates = read(KEY, seed);
  let uses = read(USES, () => []);
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(templates)); localStorage.setItem(USES, JSON.stringify(uses)); } catch (e) {} subs.forEach((f) => f()); };
  if (!localStorage.getItem(KEY)) persist();
  window.addEventListener('storage', (e) => { if (e.key === KEY || e.key === USES) { templates = read(KEY, seed); uses = read(USES, () => []); subs.forEach((f) => f()); } });

  /* ---------- validation (publish gate) ---------- */
  function check(t) {
    const errs = [], c = t.draft || {};
    if (!String(t.name || '').trim()) errs.push('Give the template a name.');
    if (!(t.venueTypes || []).length) errs.push('Pick at least one venue type.');
    if (t.kind === 'menu') {
      if (!(c.categories || []).length) errs.push('Add at least one category.');
      if (!(c.items || []).length) errs.push('Add at least one dish.');
      const noPrice = (c.items || []).filter((i) => !(i.price > 0)); if (noPrice.length) errs.push(noPrice.length + ' dish(es) without a price: ' + noPrice.slice(0, 3).map((i) => i.name).join(', '));
      const noSt = (c.items || []).filter((i) => !i.station); if (noSt.length) errs.push(noSt.length + ' dish(es) without a station.');
      const orphan = (c.items || []).filter((i) => !(c.categories || []).some((k) => k.id === i.cat)); if (orphan.length) errs.push(orphan.length + ' dish(es) in a missing category.');
    } else {
      const live = (c.areas || []).filter((a) => !a.archivedAt);
      const tables = live.reduce((s, a) => s + a.tables.filter((x) => !x.archivedAt).length, 0);
      if (!c.counterOnly && !tables) errs.push('Add at least one area with a table, or mark the template Counter only.');
    }
    return errs;
  }

  /* strip editor-only archive flags so a customer copy starts clean */
  function cleanFloor(c) { return { ...c, areas: (c.areas || []).filter((a) => !a.archivedAt).map((a) => ({ ...a, tables: a.tables.filter((x) => !x.archivedAt) })) }; }

  const api = {
    VENUES, TINT,
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    all() { return templates; },
    get(tid) { return templates.find((t) => t.id === tid) || null; },
    list({ kind, status } = {}) { return templates.filter((t) => (!kind || t.kind === kind) && (!status || t.status === status)); },
    /* customer side: only published, live snapshot */
    published(kind) { return templates.filter((t) => t.kind === kind && t.status === 'published' && t.live).map((t) => ({ ...t, content: t.live })); },
    create({ kind, name, from }) {
      const src = from ? api.get(from) : null;
      const blank = kind === 'menu' ? { categories: [], items: [] } : { counterOnly: false, rules: { voidRule: 'pin-always', printKitchen: false }, areas: [] };
      const t = { id: id(kind === 'menu' ? 'm-' : 'f-'), kind, name: name || (src ? src.name + ' (copy)' : 'Untitled template'),
        description: src ? src.description : '', venueTypes: src ? [...src.venueTypes] : [], locale: src ? src.locale : 'fr', currency: 'XAF',
        status: 'draft', version: 0, publishedAt: null, updatedAt: Date.now(), updatedBy: 'You', pairWith: null,
        draft: clone(src ? src.draft : blank), live: null, dirty: true, history: [] };
      templates = [t, ...templates]; persist(); return t;
    },
    update(tid, patch) {
      templates = templates.map((t) => t.id !== tid ? t : { ...t, ...patch, updatedAt: Date.now(), updatedBy: 'You', dirty: patch.draft ? true : (patch.dirty ?? t.dirty) });
      persist();
    },
    /* details (name, venue types…) are live metadata; content edits stay in draft until publish */
    setMeta(tid, patch) { templates = templates.map((t) => t.id !== tid ? t : { ...t, ...patch, updatedAt: Date.now(), updatedBy: 'You' }); persist(); },
    setDraft(tid, fn) {
      templates = templates.map((t) => t.id !== tid ? t : { ...t, draft: typeof fn === 'function' ? fn(t.draft) : fn, dirty: true, updatedAt: Date.now(), updatedBy: 'You' });
      persist();
    },
    discard(tid) { templates = templates.map((t) => t.id !== tid || !t.live ? t : { ...t, draft: clone(t.live), dirty: false }); persist(); },
    check,
    publish(tid) {
      const t = api.get(tid); const errs = check(t); if (errs.length) return { ok: false, errs };
      const v = (t.version || 0) + 1, at = Date.now();
      const content = t.kind === 'floor' ? cleanFloor(t.draft) : clone(t.draft);
      templates = templates.map((x) => x.id !== tid ? x : { ...x, status: 'published', version: v, live: content, draft: clone(content), dirty: false, publishedAt: at, history: [{ version: v, at, by: 'You' }, ...(x.history || [])] });
      persist(); return { ok: true, version: v };
    },
    archive(tid) { api.setMeta(tid, { status: 'archived' }); },
    restore(tid) { const t = api.get(tid); api.setMeta(tid, { status: t.live ? 'published' : 'draft' }); },
    remove(tid) { const t = api.get(tid); if (t && !t.live) { templates = templates.filter((x) => x.id !== tid); persist(); } },
    pair(tid, other) {
      templates = templates.map((t) => t.id === tid ? { ...t, pairWith: other || null }
        : t.id === other ? { ...t, pairWith: tid } : (t.pairWith === tid && t.id !== other ? { ...t, pairWith: null } : t));
      persist();
    },
    /* copy records (D8) */
    recordUse(rec) { uses = [{ ...rec, at: Date.now() }, ...uses].slice(0, 500); persist(); },
    uses(tid) { return uses.filter((u) => u.templateId === tid); },
    usedBy(tid) { return new Set(api.uses(tid).map((u) => u.tenant)).size; },
    reset() { templates = seed(); uses = []; persist(); },
    layArea, spots, clone,
  };
  window.KZ_TPL = api;
})();
