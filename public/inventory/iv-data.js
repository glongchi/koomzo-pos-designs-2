/* Koomzo Inventory — one catalogue, many locations.
   MODEL
   - Item        : the sellable/stockable thing. type = product | variant-parent | composite | service | nonstock
   - Stock       : qty per (item, location). Services and non-stock items have none.
   - Movement    : every change of qty is a row. Nothing edits stock silently.
   - Document    : Purchase order, Transfer, Count — each produces movements when posted.
   - Channel     : `pos` block on the item decides whether the register ever sees it.
   Capabilities in IV_CAPS gate whole screens; Lite mode turns all but the first two off. */

const T = {
  oak:{bg:'#f1ece2',fg:'#a07d4f'}, slate:{bg:'#eceef2',fg:'#5d6573'}, ink:{bg:'#e7e8ec',fg:'#3a3f4d'},
  purple:{bg:'#eeecf8',fg:'#6a61bf'}, green:{bg:'#e4f4ea',fg:'#2e9e5b'}, blue:{bg:'#e8f0fd',fg:'#528cef'},
  amber:{bg:'#fbf2dd',fg:'#c98a20'}, coral:{bg:'#fdeae4',fg:'#ec603a'}, rose:{bg:'#fbe9f0',fg:'#c2497e'},
};
window.IV_TINTS = T;
/* whole francs, space-grouped — see kz/kz-locale.js */
window.money = (n) => (n < 0 ? '−' : '') + window.KZ_LOCALE.short(Math.abs(n));
window.qtyFmt = (n, u) => (Number.isInteger(n) ? n : n.toFixed(2)) + (u && u !== 'each' ? ' ' + u : '');

/* ---------- capabilities: the progressive-disclosure spine ---------- */
window.IV_CAPS = [
  { key:'items',     name:'Items & stock on hand',  desc:'The catalogue and a quantity per item.', icon:'cube-outline', always:true },
  { key:'movements', name:'Movement log',           desc:'Every in, out, adjust and move is recorded.', icon:'swap-vertical-outline', always:true },
  { key:'locations', name:'Multiple locations',     desc:'Stock is held per store, stockroom or van.', icon:'business-outline' },
  { key:'purchase',  name:'Purchase orders',        desc:'Order from suppliers, receive against the order.', icon:'receipt-outline' },
  { key:'counts',    name:'Stock counts',           desc:'Cycle and full counts with variance posting.', icon:'clipboard-outline' },
  { key:'transfers', name:'Transfers',              desc:'Move stock between locations, in-transit tracked.', icon:'git-compare-outline' },
  { key:'composite', name:'Composites & recipes',   desc:'A sale depletes components, not the parent.', icon:'layers-outline' },
  { key:'valuation', name:'Valuation & COGS',       desc:'Stock value, margin and shrinkage reporting.', icon:'stats-chart-outline' },
  { key:'reorder',   name:'Reorder suggestions',    desc:'Par levels turn low stock into a draft order.', icon:'notifications-outline' },
  { key:'suppliers', name:'Supplier directory',     desc:'Contacts, terms and lead time per supplier.', icon:'people-circle-outline' },
  { key:'lots',      name:'Batch & expiry',         desc:'Lot numbers and expiry dates per receipt.', icon:'calendar-outline' },
  { key:'serials',   name:'Serial numbers',         desc:'Identify each individual unit.', icon:'barcode-outline' },
];
window.IV_LITE = ['items','movements'];

window.IV_LOCATIONS = [
  { id:'dt', name:'Downtown Store',  kind:'Store',     code:'DT', sells:true,  staff:6, icon:'storefront-outline' },
  { id:'up', name:'Uptown Salon',    kind:'Salon',     code:'UP', sells:true,  staff:9, icon:'cut-outline' },
  { id:'ap', name:'Airport Kiosk',   kind:'Kiosk',     code:'AP', sells:true,  staff:3, icon:'bag-handle-outline' },
  { id:'wh', name:'Central Warehouse', kind:'Warehouse', code:'WH', sells:false, staff:4, icon:'business-outline' },
];

window.IV_CATS = [
  { id:'hair',    label:'Hair care',   icon:'water-outline' },
  { id:'styling', label:'Styling',     icon:'sparkles-outline' },
  { id:'skin',    label:'Skin',        icon:'flower-outline' },
  { id:'tools',   label:'Tools',       icon:'cut-outline' },
  { id:'service', label:'Services',    icon:'time-outline' },
  { id:'retail',  label:'General retail', icon:'pricetag-outline' },
];

window.IV_SUPPLIERS = [
  { id:'sup1', name:'Aurelia Labs',    contact:'Marta Feld',  email:'orders@aurelialabs.com', phone:'+237 6 99 220 4410',
    terms:'Net 30', lead:5, moq:250, items:9, spend: 6631000, onTime:0.96, note:'Bond-building range. Free freight over 180 000 F.' },
  { id:'sup2', name:'Northline Supply', contact:'Dev Okafor',  email:'dev@northline.co',      phone:'+237 6 94 771 0092',
    terms:'Net 14', lead:2, moq:100, items:14, spend: 3351500, onTime:0.88, note:'Local. Same-week top-ups, higher unit cost.' },
  { id:'sup3', name:'Kessel Tools',     contact:'Ruth Barnes', email:'sales@kesseltools.com', phone:'+237 6 99 903 5510',
    terms:'Prepaid', lead:12, moq:20, items:6, spend: 1505000, onTime:0.74, note:'Slow but the only source for ceramic barrels.' },
];

/* ---------- items ---------- */
const stk = (o) => Object.assign({ dt:0, up:0, ap:0, wh:0 }, o);
const V = (n, k, o) => ({ n, k, o });

window.IV_ITEMS = [
  { id:'i1', name:'Repair Shampoo', sku:'HC-300', barcode:'8412 0031 5', type:'product', cat:'hair', brand:'Aurelia',
    unit:'each', cost: 4100, price: 9500, reorder:12, par:36, supplier:'sup1', icon:'water-outline', tint:T.purple,
    pos:{ show:true, cat:'hair', tile:'image', color:true }, stock:stk({ dt:34, up:18, ap:6, wh:120 }),
    variants:[V('Volume','add',[['100 ml',-9],['300 ml',0],['1 L',34]])], lot:false, serial:false },
  { id:'i2', name:'Bond Conditioner', sku:'HC-250', barcode:'8412 0031 6', type:'product', cat:'hair', brand:'Aurelia',
    unit:'each', cost: 4600, price: 10500, reorder:12, par:36, supplier:'sup1', icon:'water-outline', tint:T.rose,
    pos:{ show:true, cat:'hair', tile:'image' }, stock:stk({ dt:9, up:11, ap:0, wh:64 }) },
  { id:'i3', name:'Texture Spray', sku:'ST-200', barcode:'8412 0044 1', type:'product', cat:'styling', brand:'Aurelia',
    unit:'each', cost: 3300, price: 8500, reorder:10, par:30, supplier:'sup1', icon:'sparkles-outline', tint:T.amber,
    pos:{ show:true, cat:'styling', tile:'image' }, stock:stk({ dt:22, up:26, ap:4, wh:48 }) },
  { id:'i4', name:'Matte Clay', sku:'ST-075', barcode:'8412 0044 9', type:'product', cat:'styling', brand:'Northline',
    unit:'each', cost: 2600, price: 7000, reorder:10, par:24, supplier:'sup2', icon:'ellipse-outline', tint:T.ink,
    pos:{ show:true, cat:'styling', tile:'image' }, stock:stk({ dt:3, up:2, ap:1, wh:8 }) },
  { id:'i5', name:'Hydrating Serum', sku:'SK-030', barcode:'8412 0090 2', type:'product', cat:'skin', brand:'Aurelia',
    unit:'each', cost: 6500, price: 15000, reorder:8, par:20, supplier:'sup1', icon:'flower-outline', tint:T.green,
    pos:{ show:true, cat:'skin', tile:'image' }, stock:stk({ dt:14, up:7, ap:0, wh:30 }), lot:true },
  { id:'i6', name:'Lip Balm SPF15', sku:'SK-008', barcode:'8412 0090 8', type:'product', cat:'skin', brand:'Northline',
    unit:'each', cost: 1000, price: 3100, reorder:20, par:60, supplier:'sup2', icon:'ellipse-outline', tint:T.coral,
    pos:{ show:true, cat:'skin', tile:'image' }, stock:stk({ dt:41, up:33, ap:28, wh:150 }), lot:true },
  { id:'i7', name:'Round Brush', sku:'TL-045', barcode:'8412 0110 4', type:'product', cat:'tools', brand:'Kessel',
    unit:'each', cost: 4000, price: 8500, reorder:6, par:18, supplier:'sup3', icon:'brush-outline', tint:T.oak,
    pos:{ show:true, cat:'tools', tile:'list' }, stock:stk({ dt:7, up:5, ap:0, wh:12 }),
    variants:[V('Barrel','text',['25 mm','35 mm','45 mm'])] },
  { id:'i8', name:'Sectioning Clips', sku:'TL-006', barcode:'8412 0110 9', type:'product', cat:'tools', brand:'Kessel',
    unit:'pack', cost: 1900, price: 4300, reorder:8, par:24, supplier:'sup3', icon:'cut-outline', tint:T.slate,
    pos:{ show:false, cat:'tools', tile:'list' }, stock:stk({ dt:0, up:4, ap:0, wh:0 }) },
  { id:'i9', name:'Developer 20 vol', sku:'BB-020', barcode:'8412 0210 1', type:'product', cat:'hair', brand:'Aurelia',
    unit:'ml', cost: 0, price:0, reorder:2000, par:8000, supplier:'sup1', icon:'flask-outline', tint:T.blue,
    pos:{ show:false }, backbar:true, stock:stk({ dt:0, up:6400, ap:0, wh:20000 }) },
  { id:'i10', name:'Colour Base — Ash', sku:'BB-ASH', barcode:'8412 0210 7', type:'product', cat:'hair', brand:'Aurelia',
    unit:'ml', cost: 25, price:0, reorder:600, par:2400, supplier:'sup1', icon:'color-fill-outline', tint:T.ink,
    pos:{ show:false }, backbar:true, stock:stk({ dt:0, up:1180, ap:0, wh:5000 }) },
  { id:'i11', name:'Foil Sheets', sku:'BB-FOIL', barcode:'8412 0210 9', type:'product', cat:'tools', brand:'Northline',
    unit:'sheet', cost: 25, price:0, reorder:500, par:2000, supplier:'sup2', icon:'documents-outline', tint:T.slate,
    pos:{ show:false }, backbar:true, stock:stk({ dt:0, up:340, ap:0, wh:4000 }) },

  /* ---- services: no stock, but they consume back-bar and book time ---- */
  { id:'v1', name:'Cut & Finish', sku:'SV-CUT', type:'service', cat:'service', unit:'booking',
    cost:0, price: 23500, icon:'cut-outline', tint:T.purple,
    pos:{ show:true, cat:'service', tile:'list' },
    service:{ duration:45, buffer:10, staff:['Any stylist','Nadia','Corin','Ife'], room:'Chair', commission:0.35,
      consumes:[], online:true, deposit:0 } },
  { id:'v2', name:'Full Head Colour', sku:'SV-COL', type:'service', cat:'service', unit:'booking',
    cost:0, price: 52000, icon:'color-fill-outline', tint:T.rose,
    pos:{ show:true, cat:'service', tile:'list' },
    service:{ duration:120, buffer:15, staff:['Nadia','Ife'], room:'Colour bar', commission:0.30,
      consumes:[{ id:'i10', qty:60 }, { id:'i9', qty:60 }, { id:'i11', qty:0 }], online:true, deposit:40,
      levels:[['Stylist',145],['Senior',175],['Director',210]] } },
  { id:'v3', name:'Highlights — Half Head', sku:'SV-HLF', type:'service', cat:'service', unit:'booking',
    cost:0, price: 43000, icon:'sparkles-outline', tint:T.amber,
    pos:{ show:true, cat:'service', tile:'list' },
    service:{ duration:90, buffer:15, staff:['Nadia','Corin'], room:'Colour bar', commission:0.30,
      consumes:[{ id:'i10', qty:35 }, { id:'i9', qty:35 }, { id:'i11', qty:24 }], online:true, deposit:40 } },
  { id:'v4', name:'Blow Dry', sku:'SV-BLW', type:'service', cat:'service', unit:'booking',
    cost:0, price: 13500, icon:'water-outline', tint:T.blue,
    pos:{ show:true, cat:'service', tile:'list' },
    service:{ duration:30, buffer:5, staff:['Any stylist'], room:'Chair', commission:0.35, consumes:[], online:true, deposit:0 } },
  { id:'v5', name:'Patch Test', sku:'SV-PCH', type:'service', cat:'service', unit:'booking',
    cost:0, price:0, icon:'medical-outline', tint:T.green,
    pos:{ show:false, cat:'service' },
    service:{ duration:10, buffer:0, staff:['Any stylist'], room:'Chair', commission:0, consumes:[], online:true, deposit:0,
      note:'Required 48 h before any colour service. Free, not sold at the register.' } },

  /* ---- composite: sold as one line, depletes components ---- */
  { id:'k1', name:'Repair Duo Gift Set', sku:'KIT-DUO', type:'composite', cat:'retail', brand:'Aurelia',
    unit:'each', price: 17500, icon:'gift-outline', tint:T.rose,
    pos:{ show:true, cat:'hair', tile:'image' },
    recipe:[{ id:'i1', qty:1 }, { id:'i2', qty:1 }] },

  /* ---- non-stock ---- */
  { id:'n1', name:'Gift Card', sku:'GC-000', type:'nonstock', cat:'retail', unit:'each',
    cost:0, price:0, icon:'card-outline', tint:T.green, pos:{ show:true, cat:'retail', tile:'list' },
    note:'Value entered at the register. Never counted.' },
];

/* ---------- movements ---------- */
window.IV_REASONS = [
  { id:'recount', label:'Recount correction', dir:'both' },
  { id:'damage',  label:'Damaged', dir:'out' },
  { id:'expired', label:'Expired', dir:'out' },
  { id:'theft',   label:'Shrinkage / theft', dir:'out' },
  { id:'backbar', label:'Back-bar use', dir:'out' },
  { id:'sample',  label:'Sample / tester', dir:'out' },
  { id:'return',  label:'Customer return', dir:'in' },
  { id:'found',   label:'Found stock', dir:'in' },
];

window.IV_MOVES = [
  { id:'m1',  at:'Today · 14:12', item:'i4',  loc:'dt', kind:'sale',     qty:-2,  ref:'Order #1047', who:'Register 1',  cost: 5000 },
  { id:'m2',  at:'Today · 13:48', item:'i10', loc:'up', kind:'adjust',   qty:-60, ref:'Full Head Colour · Nadia', who:'Salon', reason:'backbar', cost: 1900 },
  { id:'m3',  at:'Today · 13:48', item:'i9',  loc:'up', kind:'adjust',   qty:-60, ref:'Full Head Colour · Nadia', who:'Salon', reason:'backbar', cost: 250 },
  { id:'m4',  at:'Today · 12:30', item:'i2',  loc:'dt', kind:'transfer', qty:+12, ref:'TR-0084 from Warehouse', who:'D. Patel' },
  { id:'m5',  at:'Today · 12:30', item:'i2',  loc:'wh', kind:'transfer', qty:-12, ref:'TR-0084 to Downtown', who:'D. Patel' },
  { id:'m6',  at:'Today · 11:02', item:'i6',  loc:'ap', kind:'sale',     qty:-3,  ref:'Order #1041', who:'Register 3', cost: 3100 },
  { id:'m7',  at:'Today · 10:15', item:'i1',  loc:'wh', kind:'receipt',  qty:+48, ref:'PO-2214 · Aurelia Labs', who:'M. Ekindi', cost: 197000 },
  { id:'m8',  at:'Today · 09:40', item:'i5',  loc:'dt', kind:'adjust',   qty:-1,  ref:'Tester opened', who:'A. Oliver', reason:'sample', cost: 6500 },
  { id:'m9',  at:'Yesterday · 17:20', item:'i8', loc:'dt', kind:'count', qty:-2,  ref:'Cycle count CC-0031', who:'A. Oliver', reason:'recount' },
  { id:'m10', at:'Yesterday · 16:05', item:'i3', loc:'up', kind:'sale',  qty:-1,  ref:'Order #1038', who:'Register 2', cost: 3300 },
  { id:'m11', at:'Yesterday · 15:30', item:'i7', loc:'dt', kind:'adjust', qty:-1, ref:'Dropped, barrel cracked', who:'A. Oliver', reason:'damage', cost: 4000 },
  { id:'m12', at:'Yesterday · 09:00', item:'i6', loc:'wh', kind:'receipt', qty:+240, ref:'PO-2209 · Northline Supply', who:'M. Ekindi', cost: 250500 },
];
window.IV_MOVE_KIND = {
  sale:     { label:'Sale',     icon:'cart-outline',        tone:'out' },
  receipt:  { label:'Receipt',  icon:'download-outline',    tone:'in' },
  transfer: { label:'Transfer', icon:'git-compare-outline', tone:'move' },
  adjust:   { label:'Adjust',   icon:'create-outline',      tone:'adj' },
  count:    { label:'Count',    icon:'clipboard-outline',   tone:'adj' },
  return:   { label:'Return',   icon:'arrow-undo-outline',  tone:'in' },
};

/* ---------- purchase orders ---------- */
window.IV_POS = [
  { id:'po1', no:'PO-2216', supplier:'sup1', to:'wh', status:'draft', created:'Today · 08:12', expected:'22 Aug',
    lines:[ { id:'i2', qty:48, cost: 4600, recv:0 }, { id:'i5', qty:24, cost: 6500, recv:0 }, { id:'i1', qty:36, cost: 4100, recv:0 } ] },
  { id:'po2', no:'PO-2214', supplier:'sup1', to:'wh', status:'partial', created:'12 Aug · 10:40', expected:'Today',
    lines:[ { id:'i1', qty:48, cost: 4100, recv:48 }, { id:'i3', qty:36, cost: 3300, recv:12 }, { id:'i10', qty:5000, cost: 25, recv:0 } ] },
  { id:'po3', no:'PO-2213', supplier:'sup3', to:'wh', status:'sent', created:'10 Aug · 15:02', expected:'26 Aug',
    lines:[ { id:'i7', qty:24, cost: 4000, recv:0 }, { id:'i8', qty:36, cost: 1900, recv:0 } ] },
  { id:'po4', no:'PO-2209', supplier:'sup2', to:'wh', status:'received', created:'04 Aug · 09:15', expected:'08 Aug',
    lines:[ { id:'i6', qty:240, cost: 1000, recv:240 }, { id:'i4', qty:60, cost: 2600, recv:60 } ] },
];
window.IV_PO_STATUS = {
  draft:   { label:'Draft',    tone:'low' },
  sent:    { label:'Sent',     tone:'watch' },
  partial: { label:'Partially received', tone:'watch' },
  received:{ label:'Received', tone:'ok' },
};

/* ---------- counts ---------- */
window.IV_COUNTS = [
  { id:'c1', no:'CC-0034', loc:'dt', scope:'Cycle · Tools & Styling', status:'open', by:'A. Oliver', at:'Today · 15:00',
    lines:[ { id:'i4', exp:3, cnt:2 }, { id:'i7', exp:7, cnt:7 }, { id:'i8', exp:0, cnt:1 }, { id:'i3', exp:22, cnt:null } ] },
  { id:'c2', no:'CC-0033', loc:'up', scope:'Cycle · Back bar', status:'review', by:'Nadia K.', at:'Yesterday · 19:30',
    lines:[ { id:'i9', exp:6400, cnt:6180 }, { id:'i10', exp:1180, cnt:1180 }, { id:'i11', exp:340, cnt:290 } ] },
  { id:'c3', no:'FC-0007', loc:'wh', scope:'Full count · all categories', status:'posted', by:'M. Ekindi', at:'01 Aug · 07:00',
    lines:[ { id:'i1', exp:120, cnt:120 }, { id:'i6', exp:152, cnt:150 } ] },
];

/* ---------- transfers ---------- */
window.IV_TRANSFERS = [
  { id:'t1', no:'TR-0086', from:'wh', to:'ap', status:'in-transit', sent:'Today · 09:10', eta:'Today · 17:00', by:'M. Ekindi',
    lines:[ { id:'i6', qty:48 }, { id:'i3', qty:12 } ] },
  { id:'t2', no:'TR-0085', from:'wh', to:'up', status:'draft', sent:'—', eta:'Tomorrow', by:'M. Ekindi',
    lines:[ { id:'i10', qty:2000 }, { id:'i9', qty:5000 }, { id:'i11', qty:1000 } ] },
  { id:'t3', no:'TR-0084', from:'wh', to:'dt', status:'received', sent:'Today · 08:00', eta:'Today · 12:30', by:'D. Patel',
    lines:[ { id:'i2', qty:12 } ] },
];

/* ---------- report seeds ---------- */
window.IV_TURNOVER = [
  { id:'i6', sold:184, turns:7.4 }, { id:'i1', sold:96, turns:4.1 }, { id:'i3', sold:71, turns:3.6 },
  { id:'i2', sold:64, turns:3.2 }, { id:'i5', sold:38, turns:2.1 }, { id:'i7', sold:14, turns:0.8 }, { id:'i8', sold:6, turns:0.4 },
];
window.IV_SHRINK = [
  { reason:'Back-bar use', v: 412.60, note:'Expected — colour and developer' },
  { reason:'Damaged', v: 84.20, note:'2 events this month' },
  { reason:'Sample / tester', v: 61.40, note:'Within allowance' },
  { reason:'Shrinkage / theft', v: 118.90, note:'Downtown, tools category' },
  { reason:'Expired', v: 22.30, note:'Two serum lots' },
];
window.IV_LOTS = [
  { item:'i5', lot:'A24-0871', exp:'03 / 2027', qty:22, loc:'wh' },
  { item:'i5', lot:'A24-0902', exp:'11 / 2026', qty:8,  loc:'dt' },
  { item:'i6', lot:'N24-1140', exp:'09 / 2026', qty:60, loc:'wh', soon:true },
  { item:'i6', lot:'N23-0904', exp:'08 / 2026', qty:12, loc:'dt', soon:true },
];

/* ---------- derived helpers ---------- */
window.IV = {
  item: (id) => window.IV_ITEMS.find((i) => i.id === id),
  loc:  (id) => window.IV_LOCATIONS.find((l) => l.id === id),
  onHand: (it, locId) => !it.stock ? null : (locId === 'all'
    ? Object.values(it.stock).reduce((s, n) => s + n, 0) : (it.stock[locId] || 0)),
  status: (it, locId) => {
    if (!it.stock) return 'na';
    const n = window.IV.onHand(it, locId);
    if (n <= 0) return 'out';
    if (it.reorder != null && n <= it.reorder) return 'low';
    return 'ok';
  },
  value: (it, locId) => !it.stock ? 0 : window.IV.onHand(it, locId) * (it.cost || 0),
  poTotal: (po) => po.lines.reduce((s, l) => s + l.qty * l.cost, 0),
  poRecvPct: (po) => {
    const o = po.lines.reduce((s, l) => s + l.qty * l.cost, 0);
    const r = po.lines.reduce((s, l) => s + l.recv * l.cost, 0);
    return o ? r / o : 0;
  },
};
