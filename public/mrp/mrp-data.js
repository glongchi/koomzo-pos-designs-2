/* Koomzo MRP — Central African build. Sanaga Cocoa Works (Douala), a cocoa
   transformation plant: beans -> nibs -> liquor -> {butter, cake} -> powder,
   plus a packed consumer line. Demonstrates the parts an MRP must model:

   MODEL
   - Part      : anything with a quantity. kind = raw | wip | finished | packaging
                 source = local | import (import carries a port buffer on lead time)
   - BOM       : one output (+ optional co-products) from lines of parts, with a
                 yield % — process plants lose mass, so plan quantity != output.
   - Routing   : ordered operations, each on a work centre, setup + run rate,
                 optional quality checkpoint.
   - Work order: an instance of a BOM. Carries lot, qty done/scrap, and the
                 actual material/energy/labour picked up on the floor.
   - Plan run  : demand (contracts + forecast) netted against on-hand, allocated
                 and incoming -> suggested purchases and work orders.
   Capabilities in MRP_CAPS gate whole screens; Lite keeps BOMs + work orders. */

const MT = window.IV_TINTS || {
  oak:{bg:'#f1ece2',fg:'#a07d4f'}, slate:{bg:'#eceef2',fg:'#5d6573'}, ink:{bg:'#e7e8ec',fg:'#3a3f4d'},
  purple:{bg:'#eeecf8',fg:'#6a61bf'}, green:{bg:'#e4f4ea',fg:'#2e9e5b'}, blue:{bg:'#e8f0fd',fg:'#528cef'},
  amber:{bg:'#fbf2dd',fg:'#c98a20'}, coral:{bg:'#fdeae4',fg:'#ec603a'}, rose:{bg:'#fbe9f0',fg:'#c2497e'},
};
window.MT = MT;

/* ---------- money & numbers: XAF has no minor unit ---------- */
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
window.xaf = (n) => (n < 0 ? '−' : '') + nf0.format(Math.abs(Math.round(n))).replace(/\s/g, '\u202f') + '\u00a0F';
window.xafBig = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return (n < 0 ? '−' : '') + nf1.format(a / 1e6) + '\u00a0M\u00a0F';
  if (a >= 1e3) return (n < 0 ? '−' : '') + nf0.format(a / 1e3) + '\u00a0k\u00a0F';
  return window.xaf(n);
};
window.q = (n, u) => (Number.isInteger(n) ? nf0.format(n) : nf1.format(n)).replace(/\s/g, '\u202f') + (u ? '\u00a0' + u : '');
window.pct = (n) => Math.round(n * 100) + '%';

/* ---------- bilingual: operators on the floor read French ---------- */
window.MR_LANG = 'en';
const FR = {
  Plan:'Plan', Orders:'Ordres', BOMs:'Nomencl.', Floor:'Atelier', Materials:'Matières', Capacity:'Capacité',
  Quality:'Qualité', Costs:'Coûts', Setup:'Réglages',
  'Planning board':'Tableau de planification', 'Work orders':'Ordres de fabrication', 'Bills of material':'Nomenclatures',
  'Shop floor':'Atelier', 'Materials & coverage':'Matières & couverture', 'Work centres':'Postes de charge',
  'Quality & traceability':'Qualité & traçabilité', 'Job costing':'Coût de revient', 'Mode & capabilities':'Mode & fonctions',
  'Run plan':'Lancer le calcul', 'Last run':'Dernier calcul', Shortages:'Ruptures', Suggestions:'Suggestions',
  'Suggested purchases':'Achats suggérés', 'Suggested work orders':'OF suggérés', 'Approve all':'Tout approuver',
  Approve:'Approuver', 'On hand':'En stock', Allocated:'Réservé', Incoming:'Attendu', Available:'Disponible',
  Gap:'Écart', 'Need by':'Requis le', Buy:'Acheter', Make:'Produire', 'Lead time':'Délai',
  Start:'Démarrer', Pause:'Pause', Resume:'Reprendre', Finish:'Terminer', 'Log output':'Saisir production',
  Yield:'Rendement', Scrap:'Rebut', Output:'Production', Operator:'Opérateur', Machine:'Machine',
  Released:'Lancé', 'In progress':'En cours', Paused:'En pause', Done:'Terminé', Planned:'Planifié', Draft:'Brouillon',
  Blocked:'Bloqué', 'Due today':'Pour aujourd’hui', Late:'En retard', 'Material short':'Manque matière',
  Lot:'Lot', Batch:'Lot', 'Pass':'Conforme', Fail:'Non conforme', Check:'Contrôle', 'Sync pending':'Sync en attente',
  Offline:'Hors ligne', Online:'En ligne', 'Queued':'En file', 'All synced':'Tout synchronisé',
  Local:'Local', Import:'Import', Supplier:'Fournisseur', 'Port buffer':'Marge portuaire',
  Material:'Matière', Labour:'Main d’œuvre', Energy:'Énergie', Overhead:'Frais généraux', Variance:'Écart',
  Standard:'Standard', Actual:'Réel', Load:'Charge', Shift:'Poste', 'Generator':'Groupe électrogène',
  Today:'Aujourd’hui', Tomorrow:'Demain', 'This week':'Cette semaine', Search:'Rechercher',
  'Firm demand only':'Commandes fermes', critical:'critiques', lines:'lignes', jobs:'OF', flags:'alertes',
  'approved this run':'approuvés ce calcul', 'Demand at risk':'Demande à risque', 'firm, ≤ 14 d':'fermes, ≤ 14 j',
  Part:'Article', Action:'Action', Sent:'Envoyé', 'Order qty':'Quantité', horizon:'horizon', Forecast:'Prévision',
  Components:'Composants', Routing:'Gamme', 'Co-products':'Co-produits', Operations:'Opérations',
  Traceability:'Traçabilité', 'Where used':'Où utilisé', Genealogy:'Généalogie', Contracts:'Contrats',
};
window.L = (s) => (window.MR_LANG === 'fr' ? (FR[s] || s) : s);

/* ---------- capabilities ---------- */
window.MRP_CAPS = [
  { key:'bom',        name:'Bills of material',      desc:'Recipes with a yield, components and co-products.', icon:'git-network-outline', always:true },
  { key:'workorders', name:'Work orders',            desc:'Issue a job, log output and scrap against it.', icon:'construct-outline', always:true },
  { key:'lots',       name:'Lot & batch numbers',    desc:'Every receipt and output carries a lot.', icon:'pricetags-outline' },
  { key:'planning',   name:'Planning run (MRP)',     desc:'Net demand against stock; suggest buys and jobs.', icon:'git-commit-outline' },
  { key:'routing',    name:'Routings & operations',  desc:'Ordered steps on named work centres.', icon:'options-outline' },
  { key:'capacity',   name:'Work centres & capacity',desc:'Hours per shift, load, changeovers.', icon:'speedometer-outline' },
  { key:'floor',      name:'Shop floor logging',     desc:'Operators start, pause and log on a phone.', icon:'phone-portrait-outline' },
  { key:'quality',    name:'Quality checkpoints',    desc:'In-line checks that gate the next step.', icon:'checkmark-done-outline' },
  { key:'trace',      name:'Traceability',           desc:'Forward and backward lot genealogy.', icon:'git-branch-outline' },
  { key:'costing',    name:'Job costing & variance', desc:'Standard vs actual material, labour, energy.', icon:'calculator-outline' },
  { key:'import',     name:'Import lead times',      desc:'Port buffer added to imported material planning.', icon:'boat-outline' },
  { key:'power',      name:'Power-aware scheduling', desc:'Grid and generator windows shape the day.', icon:'flash-outline' },
  { key:'forecast',   name:'Demand & forecast',      desc:'Contracts plus a monthly forecast feed the plan.', icon:'trending-up-outline' },
  { key:'subcontract',name:'Subcontracting',         desc:'Send an operation out and receive it back.', icon:'swap-horizontal-outline' },
];
window.MRP_LITE = ['bom','workorders','lots'];

window.MRP_PLANT = { name:'Sanaga Cocoa Works', site:'Bonabéri, Douala', shifts:2, hoursPerShift:8, gridHours:'06:00–14:00', genHours:'14:00–22:00', currency:'XAF' };

/* ---------- suppliers: the import/local split drives the whole plan ---------- */
window.MRP_SUPPLIERS = [
  { id:'s1', name:'Coopérative Mbam-et-Kim', kind:'local',  goods:'Cocoa beans, grade A/B', lead:6,  buffer:0,  terms:'Cash 7 j', onTime:0.91, moq:'5 t',  spend:184500000, contact:'Awono Prosper', phone:'+237 6 77 20 44 10' },
  { id:'s2', name:'Sucrerie de la Sanaga',   kind:'local',  goods:'Refined sugar',          lead:9,  buffer:0,  terms:'Net 30',   onTime:0.86, moq:'2 t',  spend:41200000,  contact:'Ngo Bassong Estelle', phone:'+237 6 99 11 08 32' },
  { id:'s3', name:'Emballages du Wouri',     kind:'local',  goods:'Jars, tins, cartons',    lead:12, buffer:0,  terms:'Net 30',   onTime:0.78, moq:'20 k', spend:63800000,  contact:'Etoundi Rachel', phone:'+237 6 55 44 91 07' },
  { id:'s4', name:'Barentz Rotterdam',       kind:'import', goods:'Lecithin, antioxidant',  lead:34, buffer:18, terms:'LC 60 j',  onTime:0.72, moq:'1 t',  spend:29400000,  contact:'J. Verhoeven', phone:'+31 10 286 21 00' },
  { id:'s5', name:'Nordmilk GmbH',           kind:'import', goods:'Skimmed milk powder',    lead:41, buffer:21, terms:'LC 60 j',  onTime:0.66, moq:'5 t',  spend:98600000,  contact:'K. Reimann', phone:'+49 40 3609 118' },
  { id:'s6', name:'Atelier Mécanique Deïdo', kind:'local',  goods:'Press spares, blades',   lead:14, buffer:0,  terms:'Cash',     onTime:0.69, moq:'—',    spend:12900000,  contact:'Sadi Bertrand', phone:'+237 6 90 33 12 76' },
];

/* ---------- parts ---------- */
const P = (o) => o;
window.MRP_PARTS = [
  /* raw */
  P({ id:'p1', name:'Cocoa beans — grade A', code:'RM-CB-A', kind:'raw', unit:'kg', cost:1450, onHand:82000, alloc:46000, incoming:60000, reorder:40000, par:120000, src:'local', sup:'s1', icon:'nutrition-outline', tint:MT.oak, lot:true, note:'Main crop, Mbam-et-Kim. Moisture ≤ 7.5%.' }),
  P({ id:'p2', name:'Cocoa beans — grade B', code:'RM-CB-B', kind:'raw', unit:'kg', cost:1180, onHand:26500, alloc:9000, incoming:0, reorder:20000, par:60000, src:'local', sup:'s1', icon:'nutrition-outline', tint:MT.oak, lot:true }),
  P({ id:'p3', name:'Refined sugar', code:'RM-SUG', kind:'raw', unit:'kg', cost:690, onHand:14200, alloc:11800, incoming:8000, reorder:9000, par:30000, src:'local', sup:'s2', icon:'cube-outline', tint:MT.slate, lot:true }),
  P({ id:'p4', name:'Skimmed milk powder', code:'RM-SMP', kind:'raw', unit:'kg', cost:3250, onHand:1850, alloc:2400, incoming:0, reorder:2500, par:9000, src:'import', sup:'s5', icon:'water-outline', tint:MT.blue, lot:true, note:'Rotterdam → Douala. Demurrage risk in Q3.' }),
  P({ id:'p5', name:'Soy lecithin', code:'RM-LEC', kind:'raw', unit:'kg', cost:2900, onHand:410, alloc:120, incoming:1000, reorder:300, par:1200, src:'import', sup:'s4', icon:'flask-outline', tint:MT.amber, lot:true }),
  /* packaging */
  P({ id:'p6', name:'Glass jar 500 g', code:'PK-JAR5', kind:'packaging', unit:'pc', cost:210, onHand:18400, alloc:24000, incoming:30000, reorder:15000, par:60000, src:'local', sup:'s3', icon:'beaker-outline', tint:MT.green }),
  P({ id:'p7', name:'Twist lid 63 mm', code:'PK-LID63', kind:'packaging', unit:'pc', cost:45, onHand:41000, alloc:24000, incoming:0, reorder:20000, par:60000, src:'local', sup:'s3', icon:'ellipse-outline', tint:MT.green }),
  P({ id:'p8', name:'Label — spread 500 g', code:'PK-LBL5', kind:'packaging', unit:'pc', cost:28, onHand:9600, alloc:24000, incoming:0, reorder:20000, par:60000, src:'local', sup:'s3', icon:'pricetag-outline', tint:MT.rose }),
  P({ id:'p9', name:'Tin 250 g', code:'PK-TIN25', kind:'packaging', unit:'pc', cost:165, onHand:22000, alloc:12000, incoming:0, reorder:12000, par:40000, src:'local', sup:'s3', icon:'cube-outline', tint:MT.slate }),
  P({ id:'p10', name:'Export carton 25 kg', code:'PK-CTN25', kind:'packaging', unit:'pc', cost:1250, onHand:1400, alloc:900, incoming:600, reorder:600, par:2000, src:'local', sup:'s3', icon:'file-tray-outline', tint:MT.oak }),
  /* wip — every one of these is made, not bought */
  P({ id:'w1', name:'Roasted nibs', code:'WP-NIB', kind:'wip', unit:'kg', cost:2010, onHand:9400, alloc:8000, incoming:0, reorder:6000, par:20000, bom:'b1', icon:'ellipse-outline', tint:MT.ink, lot:true }),
  P({ id:'w2', name:'Cocoa liquor', code:'WP-LIQ', kind:'wip', unit:'kg', cost:2180, onHand:6200, alloc:7400, incoming:0, reorder:5000, par:16000, bom:'b2', icon:'water-outline', tint:MT.ink, lot:true }),
  P({ id:'w3', name:'Cocoa butter', code:'WP-BUT', kind:'wip', unit:'kg', cost:4260, onHand:11800, alloc:19000, incoming:0, reorder:8000, par:26000, bom:'b3', icon:'sunny-outline', tint:MT.amber, lot:true }),
  P({ id:'w4', name:'Press cake', code:'WP-CAK', kind:'wip', unit:'kg', cost:980, onHand:7300, alloc:4800, incoming:0, reorder:3000, par:12000, bom:'b3', icon:'layers-outline', tint:MT.oak, lot:true }),
  P({ id:'w5', name:'Cocoa powder — bulk', code:'WP-POW', kind:'wip', unit:'kg', cost:1420, onHand:4100, alloc:3600, incoming:0, reorder:3000, par:10000, bom:'b4', icon:'apps-outline', tint:MT.ink, lot:true }),
  /* finished */
  P({ id:'f1', name:'Cocoa butter — 25 kg export block', code:'FG-BUT25', kind:'finished', unit:'ctn', cost:108500, price:139000, onHand:212, alloc:800, incoming:0, reorder:120, par:900, bom:'b5', icon:'cube-outline', tint:MT.amber, lot:true }),
  P({ id:'f2', name:'Chocolate spread 500 g', code:'FG-SPR5', kind:'finished', unit:'pc', cost:1690, price:2900, onHand:6800, alloc:24000, incoming:0, reorder:6000, par:30000, bom:'b6', icon:'nutrition-outline', tint:MT.rose, lot:true, pos:true }),
  P({ id:'f3', name:'Cocoa powder 250 g tin', code:'FG-POW25', kind:'finished', unit:'pc', cost:660, price:1250, onHand:9100, alloc:12000, incoming:0, reorder:4000, par:24000, bom:'b7', icon:'cube-outline', tint:MT.ink, lot:true, pos:true }),
];

/* ---------- work centres ---------- */
window.MRP_WC = [
  { id:'c1', name:'Roaster R1',      code:'ROAST', rate:420, unit:'kg/h', setup:35, hours:16, load:0.86, power:'grid+gen', staff:2, icon:'flame-outline', note:'Gas fired. Ramp 25 min from cold.' },
  { id:'c2', name:'Winnower W1',     code:'WINN',  rate:500, unit:'kg/h', setup:15, hours:16, load:0.61, power:'grid',     staff:1, icon:'funnel-outline' },
  { id:'c3', name:'Mill M1',         code:'MILL',  rate:380, unit:'kg/h', setup:20, hours:16, load:0.94, power:'grid+gen', staff:1, icon:'cog-outline', note:'Bottleneck. Screen change every 3rd batch.' },
  { id:'c4', name:'Press P1',        code:'PRES1', rate:260, unit:'kg/h', setup:45, hours:16, load:0.78, power:'grid',     staff:2, icon:'contract-outline' },
  { id:'c5', name:'Press P2',        code:'PRES2', rate:260, unit:'kg/h', setup:45, hours:8,  load:0.32, power:'gen',      staff:2, icon:'contract-outline', note:'Down for seal kit until Tue.' , down:true },
  { id:'c6', name:'Pulveriser U1',   code:'PULV',  rate:300, unit:'kg/h', setup:25, hours:8,  load:0.44, power:'grid',     staff:1, icon:'apps-outline' },
  { id:'c7', name:'Conche / blender', code:'CONCH', rate:180, unit:'kg/h', setup:60, hours:16, load:0.71, power:'grid+gen', staff:2, icon:'sync-outline' },
  { id:'c8', name:'Filling line F1', code:'FILL',  rate:2400, unit:'pc/h', setup:40, hours:16, load:0.66, power:'grid',    staff:5, icon:'water-outline' },
  { id:'c9', name:'Packing & palletise', code:'PACK', rate:3000, unit:'pc/h', setup:10, hours:16, load:0.52, power:'grid', staff:4, icon:'file-tray-stacked-outline' },
];

/* ---------- BOMs. yield < 100% is the norm in a process plant ---------- */
const B = (o) => o;
window.MRP_BOMS = [
  B({ id:'b1', out:'w1', qty:800, name:'Roasted nibs', rev:'C', yield:0.80, batch:'1 000 kg beans', kind:'process',
    lines:[{ p:'p1', qty:1000, unit:'kg' }],
    co:[{ p:null, name:'Shell (sold as fuel)', qty:180, unit:'kg', value:40 }],
    ops:[{ n:1, wc:'c1', name:'Roast', min:145, note:'135 °C, 22 min residence', check:'Moisture ≤ 3%' },
         { n:2, wc:'c2', name:'Winnow & de-shell', min:120, check:'Shell in nib ≤ 1.5%' }] }),
  B({ id:'b2', out:'w2', qty:990, name:'Cocoa liquor', rev:'B', yield:0.99, batch:'1 000 kg nibs', kind:'process',
    lines:[{ p:'w1', qty:1000, unit:'kg' }],
    ops:[{ n:1, wc:'c3', name:'Grind to liquor', min:160, check:'Fineness ≥ 99% < 75 µm' }] }),
  B({ id:'b3', out:'w3', qty:470, name:'Press — butter & cake', rev:'D', yield:0.99, batch:'1 000 kg liquor', kind:'process',
    lines:[{ p:'w2', qty:1000, unit:'kg' }],
    co:[{ p:'w4', name:'Press cake', qty:520, unit:'kg', value:980 }],
    ops:[{ n:1, wc:'c4', name:'Hydraulic press', min:230, check:'Residual fat in cake 10–12%' },
         { n:2, wc:'c9', name:'Filter & tote', min:45 }] }),
  B({ id:'b4', out:'w5', qty:960, name:'Cocoa powder — bulk', rev:'B', yield:0.96, batch:'1 000 kg cake', kind:'process',
    lines:[{ p:'w4', qty:1000, unit:'kg' }],
    ops:[{ n:1, wc:'c6', name:'Pulverise & sieve', min:200, check:'Fineness 99.5% < 75 µm' }] }),
  B({ id:'b5', out:'f1', qty:1, name:'Butter 25 kg export block', rev:'A', yield:1, batch:'1 carton', kind:'pack',
    lines:[{ p:'w3', qty:25, unit:'kg' }, { p:'p10', qty:1, unit:'pc' }],
    ops:[{ n:1, wc:'c9', name:'Mould, cool & carton', min:6, check:'Weight 25 kg ± 40 g' }] }),
  B({ id:'b6', out:'f2', qty:1000, name:'Chocolate spread 500 g', rev:'E', yield:0.985, batch:'1 000 jars', kind:'pack',
    lines:[{ p:'w2', qty:180, unit:'kg' }, { p:'w3', qty:60, unit:'kg' }, { p:'p3', qty:210, unit:'kg' },
           { p:'p4', qty:40, unit:'kg' }, { p:'p5', qty:2, unit:'kg' }, { p:'p6', qty:1000, unit:'pc' },
           { p:'p7', qty:1000, unit:'pc' }, { p:'p8', qty:1000, unit:'pc' }],
    ops:[{ n:1, wc:'c7', name:'Blend & conche', min:300, check:'Fineness ≤ 25 µm, viscosity' },
         { n:2, wc:'c8', name:'Fill & cap', min:28, check:'Net weight 500 g ± 4 g' },
         { n:3, wc:'c9', name:'Label & case', min:22, check:'Lot code legible' }] }),
  B({ id:'b7', out:'f3', qty:1000, name:'Cocoa powder 250 g tin', rev:'B', yield:0.99, batch:'1 000 tins', kind:'pack',
    lines:[{ p:'w5', qty:250, unit:'kg' }, { p:'p9', qty:1000, unit:'pc' }],
    ops:[{ n:1, wc:'c8', name:'Fill tins', min:26, check:'Net weight 250 g ± 3 g' },
         { n:2, wc:'c9', name:'Case & palletise', min:18 }] }),
];

/* ---------- demand: export contracts + local orders + forecast ---------- */
window.MRP_DEMAND = [
  { id:'d1', ref:'EX-114', cust:'Puratos Belgium', kind:'Export contract', p:'f1', qty:800, unit:'ctn', due:'Sep 04', days:20, value:111200000, firm:true },
  { id:'d2', ref:'SO-2291', cust:'Santa Lucia Supermarchés', kind:'Local order', p:'f2', qty:18000, unit:'pc', due:'Aug 26', days:11, value:52200000, firm:true },
  { id:'d3', ref:'SO-2298', cust:'Koomzo retail network', kind:'POS replenishment', p:'f2', qty:6000, unit:'pc', due:'Aug 22', days:7, value:17400000, firm:true },
  { id:'d4', ref:'SO-2301', cust:'Boulangeries Yaoundé', kind:'Local order', p:'f3', qty:12000, unit:'pc', due:'Aug 29', days:14, value:15000000, firm:true },
  { id:'d5', ref:'FC-09', cust:'Forecast — September', kind:'Forecast', p:'f2', qty:22000, unit:'pc', due:'Sep 30', days:46, value:63800000, firm:false },
  { id:'d6', ref:'FC-09B', cust:'Forecast — September', kind:'Forecast', p:'f3', qty:15000, unit:'pc', due:'Sep 30', days:46, value:18750000, firm:false },
];

/* ---------- work orders ---------- */
window.MRP_WOS = [
  { id:'o1', no:'OF-2418', bom:'b6', qty:12000, done:7400, scrap:180, status:'progress', wc:'c8', op:'Ekani Josué', due:'Aug 18', start:'08:12', lot:'SPR-2408-11', prio:'high', pctOps:0.62,
    steps:[{ n:1, name:'Blend & conche', wc:'c7', state:'done', out:7580 }, { n:2, name:'Fill & cap', wc:'c8', state:'run', out:7400 }, { n:3, name:'Label & case', wc:'c9', state:'wait', out:0 }] },
  { id:'o2', no:'OF-2419', bom:'b3', qty:4000, done:0, scrap:0, status:'blocked', wc:'c4', op:'Mbarga Félix', due:'Aug 17', lot:'BUT-2408-06', prio:'high', block:'Liquor short — 1 200 kg',
    steps:[{ n:1, name:'Hydraulic press', wc:'c4', state:'wait', out:0 }, { n:2, name:'Filter & tote', wc:'c9', state:'wait', out:0 }] },
  { id:'o3', no:'OF-2420', bom:'b1', qty:6400, done:6400, scrap:95, status:'done', wc:'c1', op:'Nkoulou Ariane', due:'Aug 15', lot:'NIB-2408-22', prio:'normal', pctOps:1,
    steps:[{ n:1, name:'Roast', wc:'c1', state:'done', out:6495 }, { n:2, name:'Winnow & de-shell', wc:'c2', state:'done', out:6400 }] },
  { id:'o4', no:'OF-2421', bom:'b2', qty:5940, done:2100, scrap:0, status:'progress', wc:'c3', op:'Tchoumi Danielle', due:'Aug 16', start:'06:40', lot:'LIQ-2408-14', prio:'high', pctOps:0.35,
    steps:[{ n:1, name:'Grind to liquor', wc:'c3', state:'run', out:2100 }] },
  { id:'o5', no:'OF-2422', bom:'b7', qty:10000, done:0, scrap:0, status:'released', wc:'c8', op:'—', due:'Aug 19', lot:'POW-2408-09', prio:'normal',
    steps:[{ n:1, name:'Fill tins', wc:'c8', state:'wait', out:0 }, { n:2, name:'Case & palletise', wc:'c9', state:'wait', out:0 }] },
  { id:'o6', no:'OF-2423', bom:'b5', qty:800, done:0, scrap:0, status:'planned', wc:'c9', op:'—', due:'Aug 28', lot:'—', prio:'high' },
  { id:'o7', no:'OF-2424', bom:'b4', qty:2880, done:0, scrap:0, status:'planned', wc:'c6', op:'—', due:'Aug 21', lot:'—', prio:'normal' },
  { id:'o8', no:'OF-2417', bom:'b6', qty:8000, done:8000, scrap:310, status:'done', wc:'c8', op:'Ekani Josué', due:'Aug 12', lot:'SPR-2408-08', prio:'normal', pctOps:1 },
];

/* ---------- what the last planning run produced ---------- */
window.MRP_RUN = {
  at: 'Today 05:40', horizon: 60, firmOnly: false,
  short: [
    { p:'p8', need:24000, by:'Aug 20', days:5,  act:'buy',  sup:'s3', qty:40000, cost:1120000, risk:'high', why:'Spread OF-2418 and OF-2425 both label 500 g' },
    { p:'p6', need:24000, by:'Aug 20', days:5,  act:'buy',  sup:'s3', qty:20000, cost:4200000, risk:'watch', why:'30 000 already inbound, arrives Aug 23 — 3 days late' },
    { p:'p4', need:2400,  by:'Aug 19', days:4,  act:'buy',  sup:'s5', qty:5000,  cost:16250000, risk:'high', why:'Import: 41 d + 21 d port buffer. Substitute or air-freight' },
    { p:'w2', need:7400,  by:'Aug 17', days:2,  act:'make', bom:'b2', qty:6000,  cost:13080000, risk:'high', why:'Blocks OF-2419 press run' },
    { p:'w3', need:19000, by:'Aug 26', days:11, act:'make', bom:'b3', qty:8000,  cost:34080000, risk:'watch', why:'Export EX-114 needs 20 t butter' },
    { p:'w5', need:3600,  by:'Aug 20', days:5,  act:'make', bom:'b4', qty:2880,  cost:2822400, risk:'low', why:'Powder tins OF-2422' },
    { p:'p1', need:46000, by:'Aug 24', days:9,  act:'buy',  sup:'s1', qty:60000,  cost:87000000, risk:'watch', why:'Roast programme through week 35' },
  ],
  capacity: [{ wc:'c3', over:0.94, note:'Mill M1 at 94% — liquor top-up will not fit before Aug 17' },
             { wc:'c5', over:0, note:'Press P2 down: seal kit, ETA Tue. Press capacity halved.' }],
};

/* ---------- quality checks ---------- */
window.MRP_QC = [
  { id:'q1', wo:'OF-2418', lot:'SPR-2408-11', check:'Net weight 500 g ± 4 g', spec:'496–504 g', val:'501.2 g', state:'pass', at:'09:40', by:'Ekani J.' },
  { id:'q2', wo:'OF-2418', lot:'SPR-2408-11', check:'Fineness ≤ 25 µm', spec:'≤ 25 µm', val:'23 µm', state:'pass', at:'08:55', by:'Labo' },
  { id:'q3', wo:'OF-2421', lot:'LIQ-2408-14', check:'Fineness ≥ 99% < 75 µm', spec:'≥ 99%', val:'98.2%', state:'fail', at:'07:30', by:'Labo', act:'Re-mill 1 pass. Screen replaced.' },
  { id:'q4', wo:'OF-2420', lot:'NIB-2408-22', check:'Moisture ≤ 3%', spec:'≤ 3.0%', val:'2.6%', state:'pass', at:'Aug 15', by:'Nkoulou A.' },
  { id:'q5', wo:'OF-2420', lot:'NIB-2408-22', check:'Shell in nib ≤ 1.5%', spec:'≤ 1.5%', val:'1.8%', state:'fail', at:'Aug 15', by:'Labo', act:'Winnower air setting raised. Re-winnowed.' },
  { id:'q6', wo:'OF-2417', lot:'SPR-2408-08', check:'Lot code legible', spec:'Visual', val:'OK', state:'pass', at:'Aug 12', by:'Packing' },
];

/* ---------- lot genealogy: one chain, both directions ---------- */
window.MRP_LOTS = [
  { id:'l1', lot:'CB-2408-03', p:'p1', qty:60000, unit:'kg', from:'Coopérative Mbam-et-Kim', at:'Aug 09', into:['NIB-2408-22'], cert:'Bon de livraison 4471' },
  { id:'l2', lot:'NIB-2408-22', p:'w1', qty:6400, unit:'kg', from:'OF-2420', at:'Aug 15', src:['CB-2408-03'], into:['LIQ-2408-14'] },
  { id:'l3', lot:'LIQ-2408-14', p:'w2', qty:2100, unit:'kg', from:'OF-2421', at:'Aug 16', src:['NIB-2408-22'], into:['SPR-2408-11'] },
  { id:'l4', lot:'SPR-2408-11', p:'f2', qty:7400, unit:'pc', from:'OF-2418', at:'Aug 16', src:['LIQ-2408-14','BUT-2408-04','SUG-2407-31'], into:['SO-2291','SO-2298'] },
  { id:'l5', lot:'BUT-2408-04', p:'w3', qty:3200, unit:'kg', from:'OF-2414', at:'Aug 11', src:['LIQ-2408-09'], into:['SPR-2408-11','BUT25-2408-02'] },
];

/* ---------- costing: standard vs what the floor actually consumed ---------- */
window.MRP_COST = [
  { wo:'OF-2418', p:'f2', qty:7400, std:{ mat:1418, lab:112, eng:96, ovh:64 }, act:{ mat:1503, lab:121, eng:148, ovh:64 }, yieldStd:0.985, yieldAct:0.976, note:'Generator ran 4 h on grid outage; sugar over-dosed 3%.' },
  { wo:'OF-2420', p:'w1', qty:6400, std:{ mat:1812, lab:38, eng:52, ovh:26 }, act:{ mat:1841, lab:36, eng:61, ovh:26 }, yieldStd:0.80, yieldAct:0.786, note:'Bean moisture 7.9% on intake — heavier roast loss.' },
  { wo:'OF-2417', p:'f2', qty:8000, std:{ mat:1418, lab:112, eng:96, ovh:64 }, act:{ mat:1441, lab:108, eng:101, ovh:64 }, yieldStd:0.985, yieldAct:0.981 },
  { wo:'OF-2414', p:'w3', qty:3200, std:{ mat:4180, lab:74, eng:118, ovh:44 }, act:{ mat:4102, lab:71, eng:110, ovh:44 }, yieldStd:0.99, yieldAct:0.994, note:'Best press run this month.' },
];

/* ---------- floor queue for the operator phone ---------- */
window.MRP_FLOOR_QUEUE = [
  { wo:'OF-2418', step:'Fill & cap', wc:'c8', target:12000, done:7400, state:'run', since:'08:12' },
  { wo:'OF-2421', step:'Grind to liquor', wc:'c3', target:5940, done:2100, state:'run', since:'06:40' },
  { wo:'OF-2422', step:'Fill tins', wc:'c8', target:10000, done:0, state:'ready' },
  { wo:'OF-2419', step:'Hydraulic press', wc:'c4', target:4000, done:0, state:'blocked', block:'Liquor short — 1 200 kg' },
  { wo:'OF-2424', step:'Pulverise & sieve', wc:'c6', target:2880, done:0, state:'ready' },
];

/* ---------- helpers ---------- */
window.MR = {
  part: (id) => MRP_PARTS.find((p) => p.id === id) || { name:'—', unit:'', cost:0, tint:MT.slate, icon:'help-outline' },
  bom: (id) => MRP_BOMS.find((b) => b.id === id),
  bomFor: (pid) => MRP_BOMS.find((b) => b.out === pid),
  wc: (id) => MRP_WC.find((c) => c.id === id) || { name:'—', code:'', icon:'cog-outline' },
  wo: (no) => MRP_WOS.find((o) => o.no === no),
  sup: (id) => MRP_SUPPLIERS.find((s) => s.id === id) || { name:'—', kind:'local', lead:0, buffer:0 },
  avail: (p) => (p.onHand || 0) - (p.alloc || 0),
  status: (p) => { const a = MR.avail(p); if (a <= 0) return 'out'; if (p.reorder != null && a <= p.reorder) return 'low'; return 'ok'; },
  /* total lead time an imported part really carries */
  lead: (p) => { const s = MR.sup(p.sup); return (s.lead || 0) + (s.buffer || 0); },
  /* multi-level explosion. Returns flat rows with a depth so the UI can indent. */
  explode: (bomId, qty, depth = 0, out = []) => {
    const b = MR.bom(bomId); if (!b || depth > 4) return out;
    const mult = qty / b.qty;
    b.lines.forEach((ln) => {
      const p = MR.part(ln.p), need = ln.qty * mult;
      out.push({ p:ln.p, name:p.name, unit:ln.unit || p.unit, need, depth, made:!!p.bom, avail:MR.avail(p), cost:need * p.cost });
      if (p.bom && depth < 3) MR.explode(p.bom, need, depth + 1, out);
    });
    return out;
  },
  bomCost: (bomId) => { const b = MR.bom(bomId); if (!b) return 0;
    const gross = b.lines.reduce((s, ln) => s + ln.qty * MR.part(ln.p).cost, 0);
    const credit = (b.co || []).reduce((s, c) => s + (c.qty * (c.value || 0)), 0);
    return (gross - credit) / b.qty; },
  opMinutes: (bomId) => (MR.bom(bomId)?.ops || []).reduce((s, o) => s + o.min, 0),
  woPct: (o) => (o.qty ? Math.min(1, o.done / o.qty) : 0),
  cost: (wo) => MRP_COST.find((c) => c.wo === wo),
  lot: (code) => MRP_LOTS.find((l) => l.lot === code),
  sum: (o) => (o.mat || 0) + (o.lab || 0) + (o.eng || 0) + (o.ovh || 0),
};

window.WO_TONE = { draft:'mute', planned:'mute', released:'info', progress:'pri', paused:'warn', blocked:'bad', done:'good' };
window.WO_LABEL = { draft:'Draft', planned:'Planned', released:'Released', progress:'In progress', paused:'Paused', blocked:'Blocked', done:'Done' };
