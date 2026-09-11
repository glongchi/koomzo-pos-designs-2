/* Koomzo — Form Builder data sources.
   A data source is a named, versioned table the builder can bind a choice
   field to instead of typing options inline. Three kinds:
     list     — static reference data (regions, ID types, payment methods)
     stateful — carries a countable quantity that moves as forms are submitted
                (rooms left, seats sold). Availability is derived, never typed.
     remote   — resolved from an endpoint at fill time (designed, not built)
   Columns are typed. Any column may be marked i18n, in which case its cell
   holds { en, fr, … } exactly like authored form copy. */

window.DS_KINDS = {
  list:     { label: { en: 'Reference list', fr: 'Liste de référence' }, icon: 'list-outline',        tint: 'var(--kz-info)' },
  stateful: { label: { en: 'Stateful',       fr: 'Avec état' },          icon: 'speedometer-outline', tint: 'var(--kz-primary)' },
  remote:   { label: { en: 'Remote',         fr: 'Distante' },           icon: 'cloud-outline',       tint: 'var(--kz-muted)' },
};

window.DS_TYPES = {
  string:  { label: { en: 'Text',    fr: 'Texte' },    icon: 'text-outline' },
  i18n:    { label: { en: 'Text · multilingual', fr: 'Texte · multilingue' }, icon: 'language-outline' },
  int:     { label: { en: 'Integer', fr: 'Entier' },   icon: 'calculator-outline' },
  decimal: { label: { en: 'Decimal', fr: 'Décimal' },  icon: 'calculator-outline' },
  bool:    { label: { en: 'Yes / no', fr: 'Oui / non' }, icon: 'toggle-outline' },
  date:    { label: { en: 'Date',    fr: 'Date' },     icon: 'calendar-outline' },
};

/* rule vocabulary — plain-language rows, not an expression language */
window.DS_WHEN = {
  read:   { label: { en: 'When options are shown', fr: 'À l’affichage des options' }, icon: 'eye-outline' },
  submit: { label: { en: 'When the form is submitted', fr: 'À l’envoi du formulaire' }, icon: 'cloud-upload-outline' },
  cancel: { label: { en: 'When a submission is cancelled', fr: 'À l’annulation d’un envoi' }, icon: 'arrow-undo-outline' },
};
window.DS_ACTIONS = {
  hide:     { label: { en: 'Hide the option',            fr: 'Masquer l’option' },             when: 'read' },
  disable:  { label: { en: 'Show it, not selectable',    fr: 'Afficher, non sélectionnable' }, when: 'read' },
  badge:    { label: { en: 'Show a badge on the option', fr: 'Afficher un badge sur l’option' }, when: 'read' },
  block:    { label: { en: 'Refuse with a message',      fr: 'Refuser avec un message' },      when: 'submit' },
  decrease: { label: { en: 'Decrease the counter',       fr: 'Diminuer le compteur' },         when: 'submit' },
  increase: { label: { en: 'Increase the counter',       fr: 'Augmenter le compteur' },        when: 'cancel' },
};

const _i = (en, fr) => ({ en, fr });
let _dsr = 0; const _rid = () => 'r' + (++_dsr);

window.DS_SEED = [
  {
    id: 'ds_rooms', kind: 'stateful', status: 'published', version: 4, updated: '26 Aug 2026',
    name: _i('Hotel room types', 'Types de chambres'),
    note: _i('Availability falls as bookings are submitted and returns on cancellation.', 'La disponibilité baisse à chaque réservation et revient à l’annulation.'),
    usedBy: [_i('Room booking', 'Réservation de chambre'), _i('Group enquiry', 'Demande groupe')],
    columns: [
      { key: 'key',      type: 'string', role: 'value',       required: true },
      { key: 'name',     type: 'i18n',   role: 'display',     required: true },
      { key: 'blurb',    type: 'i18n',   role: 'description' },
      { key: 'rate',     type: 'int',    unit: 'FCFA' },
      { key: 'capacity', type: 'int',    role: 'capacity' },
      { key: 'booked',   type: 'int',    role: 'allocated' },
    ],
    rows: [
      { key: 'std',    name: _i('Standard', 'Standard'),        blurb: _i('One double bed, fan', 'Un lit double, ventilateur'),      rate: 18000, capacity: 12, booked: 9 },
      { key: 'deluxe', name: _i('Deluxe', 'Deluxe'),            blurb: _i('Queen bed, air conditioning', 'Lit queen, climatisation'), rate: 28000, capacity: 8,  booked: 8 },
      { key: 'suite',  name: _i('Suite', 'Suite'),              blurb: _i('Living room, two bathrooms', 'Salon, deux salles de bain'), rate: 45000, capacity: 3,  booked: 1 },
      { key: 'family', name: _i('Family room', 'Chambre familiale'), blurb: _i('Two doubles, sleeps four', 'Deux lits doubles, quatre personnes'), rate: 34000, capacity: 5, booked: 2 },
    ],
    rules: [
      { id: _rid(), when: 'read',   subject: 'available', op: 'lte', value: 0, action: 'disable', message: _i('Fully booked', 'Complet') },
      { id: _rid(), when: 'submit', subject: 'requested', op: 'gt',  value: 'available', action: 'block', message: _i('Only {available} left in this room type.', 'Il ne reste que {available} chambre(s) de ce type.') },
      { id: _rid(), when: 'submit', subject: 'booked',    op: 'add', value: 'requested', action: 'decrease' },
      { id: _rid(), when: 'cancel', subject: 'booked',    op: 'sub', value: 'requested', action: 'increase' },
    ],
    hold: { on: true, minutes: 15 },
    offline: 'allow',
  },
  {
    id: 'ds_seats', kind: 'stateful', status: 'published', version: 2, updated: '24 Aug 2026',
    name: _i('Bus seats — Douala / Yaoundé', 'Places bus — Douala / Yaoundé'),
    note: _i('One row per class on the 07:00 departure.', 'Une ligne par classe sur le départ de 07h00.'),
    usedBy: [_i('Seat booking', 'Réservation de place')],
    columns: [
      { key: 'key',      type: 'string', role: 'value',   required: true },
      { key: 'name',     type: 'i18n',   role: 'display', required: true },
      { key: 'blurb',    type: 'i18n',   role: 'description' },
      { key: 'fare',     type: 'int',    unit: 'FCFA' },
      { key: 'capacity', type: 'int',    role: 'capacity' },
      { key: 'sold',     type: 'int',    role: 'allocated' },
    ],
    rows: [
      { key: 'vip',   name: _i('VIP', 'VIP'),             blurb: _i('Two seats a row, USB', 'Deux places par rangée, USB'), fare: 12000, capacity: 12, booked: 0, sold: 11 },
      { key: 'class', name: _i('Classic', 'Classique'),   blurb: _i('Four seats a row', 'Quatre places par rangée'),        fare: 6000,  capacity: 45, sold: 31 },
      { key: 'std',   name: _i('Standing', 'Debout'),     blurb: _i('Sold only when seats are gone', 'Vendu quand les places sont épuisées'), fare: 3500, capacity: 6, sold: 6 },
    ],
    rules: [
      { id: _rid(), when: 'read',   subject: 'available', op: 'lte', value: 0, action: 'hide' },
      { id: _rid(), when: 'read',   subject: 'available', op: 'lte', value: 3, action: 'badge', message: _i('{available} left', 'Plus que {available}') },
      { id: _rid(), when: 'submit', subject: 'sold',      op: 'add', value: 'requested', action: 'decrease' },
    ],
    hold: { on: true, minutes: 10 },
    offline: 'block',
  },
  {
    id: 'ds_regions', kind: 'list', status: 'published', version: 1, updated: '12 Aug 2026',
    name: _i('Regions of Cameroon', 'Régions du Cameroun'),
    note: _i('Official ten. Used wherever an address is captured.', 'Les dix officielles. Utilisée partout où une adresse est saisie.'),
    usedBy: [_i('Customer intake', 'Fiche client'), _i('Guest register', 'Registre des clients'), _i('Field survey', 'Enquête terrain')],
    columns: [
      { key: 'key',  type: 'string', role: 'value',   required: true },
      { key: 'name', type: 'i18n',   role: 'display', required: true },
      { key: 'seat', type: 'i18n',   role: 'description' },
    ],
    rows: [
      { key: 'CE', name: _i('Centre', 'Centre'),           seat: _i('Yaoundé', 'Yaoundé') },
      { key: 'LT', name: _i('Littoral', 'Littoral'),       seat: _i('Douala', 'Douala') },
      { key: 'OU', name: _i('West', 'Ouest'),              seat: _i('Bafoussam', 'Bafoussam') },
      { key: 'NW', name: _i('North-West', 'Nord-Ouest'),   seat: _i('Bamenda', 'Bamenda') },
      { key: 'SW', name: _i('South-West', 'Sud-Ouest'),    seat: _i('Buea', 'Buea') },
      { key: 'SU', name: _i('South', 'Sud'),               seat: _i('Ebolowa', 'Ebolowa') },
      { key: 'ES', name: _i('East', 'Est'),                seat: _i('Bertoua', 'Bertoua') },
      { key: 'AD', name: _i('Adamawa', 'Adamaoua'),        seat: _i('Ngaoundéré', 'Ngaoundéré') },
      { key: 'NO', name: _i('North', 'Nord'),              seat: _i('Garoua', 'Garoua') },
      { key: 'EN', name: _i('Far North', 'Extrême-Nord'),  seat: _i('Maroua', 'Maroua') },
    ],
    rules: [],
    offline: 'allow',
  },
  {
    id: 'ds_tender', kind: 'list', status: 'published', version: 3, updated: '19 Aug 2026',
    name: _i('Payment methods', 'Moyens de paiement'),
    note: _i('Mirrors the tenders the till accepts.', 'Reflète les moyens acceptés en caisse.'),
    usedBy: [_i('Room booking', 'Réservation de chambre'), _i('Seat booking', 'Réservation de place')],
    columns: [
      { key: 'key',    type: 'string', role: 'value',   required: true },
      { key: 'name',   type: 'i18n',   role: 'display', required: true },
      { key: 'blurb',  type: 'i18n',   role: 'description' },
      { key: 'active', type: 'bool' },
    ],
    rows: [
      { key: 'momo',   name: _i('MTN MoMo', 'MTN MoMo'),       blurb: _i('Confirmation by SMS', 'Confirmation par SMS'), active: true },
      { key: 'om',     name: _i('Orange Money', 'Orange Money'), blurb: _i('Confirmation by SMS', 'Confirmation par SMS'), active: true },
      { key: 'cash',   name: _i('Cash', 'Espèces'),            blurb: _i('At the desk', 'À la réception'), active: true },
      { key: 'card',   name: _i('Card', 'Carte'),              blurb: _i('Visa, Mastercard', 'Visa, Mastercard'), active: false },
    ],
    rules: [
      { id: _rid(), when: 'read', subject: 'active', op: 'is', value: false, action: 'hide' },
    ],
    offline: 'allow',
  },
  {
    id: 'ds_idtype', kind: 'list', status: 'draft', version: 1, updated: '27 Aug 2026',
    name: _i('ID document types', 'Types de pièce d’identité'),
    note: _i('Accepted for the statutory guest register.', 'Acceptés pour le registre légal des clients.'),
    usedBy: [],
    columns: [
      { key: 'key',  type: 'string', role: 'value',   required: true },
      { key: 'name', type: 'i18n',   role: 'display', required: true },
      { key: 'hint', type: 'i18n',   role: 'description' },
    ],
    rows: [
      { key: 'cni',  name: _i('National ID', 'CNI'),            hint: _i('Cameroon national identity card', 'Carte nationale d’identité') },
      { key: 'pass', name: _i('Passport', 'Passeport'),         hint: _i('Any country', 'Tout pays') },
      { key: 'res',  name: _i('Residence permit', 'Carte de séjour'), hint: _i('Foreign residents', 'Résidents étrangers') },
    ],
    rules: [],
    offline: 'allow',
  },
];

/* ---- helpers shared by the picker, the editor and the field preview ---- */
window.dsFind = (id) => (window.DS_LIST || window.DS_SEED).find((d) => d.id === id) || null;
window.dsColByRole = (ds, role) => (ds ? ds.columns.find((c) => c.role === role) : null);
window.dsAvailable = (ds, row) => {
  const cap = window.dsColByRole(ds, 'capacity'), al = window.dsColByRole(ds, 'allocated');
  if (!cap || !al) return null;
  return Math.max(0, (row[cap.key] || 0) - (row[al.key] || 0));
};
/* resolve the options a bound field would actually show, rules applied */
window.dsResolve = (ds, binding, lang, primary) => {
  if (!ds) return [];
  const tx = window.tx;
  const valCol = binding.valueCol || (window.dsColByRole(ds, 'value') || {}).key;
  const labCol = binding.labelCol || (window.dsColByRole(ds, 'display') || {}).key;
  const desCol = binding.descCol  || (window.dsColByRole(ds, 'description') || {}).key;
  const readRules = (ds.rules || []).filter((r) => r.when === 'read');
  const out = [];
  ds.rows.forEach((row) => {
    const avail = window.dsAvailable(ds, row);
    let state = 'ok', badge = null;
    readRules.forEach((r) => {
      const subj = r.subject === 'available' ? avail : row[r.subject];
      let hit = false;
      if (r.op === 'lte') hit = subj != null && subj <= r.value;
      else if (r.op === 'gte') hit = subj != null && subj >= r.value;
      else if (r.op === 'is') hit = subj === r.value;
      if (!hit) return;
      if (r.action === 'hide') state = 'hidden';
      else if (r.action === 'disable' && state === 'ok') state = 'disabled';
      if (r.message) badge = window.tx(r.message, lang) || window.tx(r.message, primary);
    });
    if (state === 'hidden' && !binding.showHidden) return;
    const lv = row[labCol], dv = row[desCol];
    out.push({
      value: row[valCol],
      label: window.isI18n(lv) ? (tx(lv, lang) || tx(lv, primary)) : String(lv == null ? '' : lv),
      desc:  window.isI18n(dv) ? (tx(dv, lang) || tx(dv, primary)) : (dv == null ? '' : String(dv)),
      available: avail, state,
      badge: badge && avail != null ? badge.replace('{available}', avail) : badge,
      row,
    });
  });
  return out;
};
