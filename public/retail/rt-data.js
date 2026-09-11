/* Koomzo Retail POS — business profiles + per-profile catalogues.
   One board, six presets. A profile sets entry mode, tile style, which
   modules appear (scale, variants, serial, age check, appointment), tax
   and the quick-action row. Tiles use tinted iconographic art. */

const T = {
  oak:{bg:'#f1ece2',fg:'#a07d4f'}, slate:{bg:'#eceef2',fg:'#5d6573'}, ink:{bg:'#e7e8ec',fg:'#3a3f4d'},
  purple:{bg:'#eeecf8',fg:'#6a61bf'}, green:{bg:'#e4f4ea',fg:'#2e9e5b'}, blue:{bg:'#e8f0fd',fg:'#528cef'},
  amber:{bg:'#fbf2dd',fg:'#c98a20'}, coral:{bg:'#fdeae4',fg:'#ec603a'}, rose:{bg:'#fbe9f0',fg:'#c2497e'},
};
window.RT_TINTS = T;

/* ---------------- profiles ---------------- */
window.RT_PROFILES = [
  { id:'grocery', name:'Grocery & Convenience', icon:'basket-outline', blurb:'Scan-first lanes, weighed produce, fast cash tender.',
    entry:'scan', tiles:'text', tax:0, mods:{ scale:true, age:true, variants:false, serial:false, appt:false, loyalty:true },
    quick:['Weigh item','Price check','Bag','Age check'] },
  { id:'fashion', name:'Clothing & Accessories', icon:'shirt-outline', blurb:'Size/colour variants, exchanges, styling notes.',
    entry:'grid', tiles:'image', tax:0.1925, mods:{ scale:false, age:false, variants:true, serial:false, appt:false, loyalty:true },
    quick:['Gift receipt','Exchange','Hold','Style note'] },
  { id:'hardware', name:'Hardware / General store', icon:'construct-outline', blurb:'SKU lookup, sold by each, box or metre.',
    entry:'search', tiles:'list', tax:0.1925, mods:{ scale:true, age:false, variants:false, serial:false, appt:false, loyalty:false },
    quick:['SKU lookup','Cut to length','Trade price','Quote'] },
  { id:'electronics', name:'Electronics / Repair', icon:'hardware-chip-outline', blurb:'Serial capture, warranty, repair tickets.',
    entry:'search', tiles:'list', tax:0.1925, mods:{ scale:false, age:false, variants:true, serial:true, appt:false, loyalty:true },
    quick:['Serial','Warranty','Repair ticket','Trade-in'] },
  { id:'salon', name:'Salon retail add-ons', icon:'cut-outline', blurb:'Attach product sales to a stylist and appointment.',
    entry:'grid', tiles:'image', tax:0.1925, mods:{ scale:false, age:false, variants:true, serial:false, appt:true, loyalty:true },
    quick:['Attach booking','Stylist','Tip','Rebook'] },
  { id:'bakery', name:'Bakery / Deli', icon:'nutrition-outline', blurb:'Weighed counter sales with tare and per-kg pricing.',
    entry:'scan', tiles:'image', tax:0, mods:{ scale:true, age:false, variants:false, serial:false, appt:false, loyalty:false },
    quick:['Weigh item','Tare','Slice','Label'] },
];

/* ---------------- catalogues ---------------- */
const SZ = ['XS','S','M','L','XL'];
window.RT_CATALOG = {
  grocery: { cats:[
      {id:'produce',label:'Produce',icon:'leaf-outline'},{id:'bakery',label:'Bakery',icon:'pizza-outline'},
      {id:'dairy',label:'Dairy',icon:'water-outline'},{id:'drinks',label:'Drinks',icon:'beer-outline'},
      {id:'pantry',label:'Pantry',icon:'file-tray-stacked-outline'},{id:'house',label:'Household',icon:'home-outline'}],
    items:[
      {id:'g1',cat:'produce',name:'Bananes plantain',sub:'En vrac, le kg',price:700,unit:'kg',weighed:true,sku:'2001',icon:'nutrition-outline',tint:T.amber},
      {id:'g2',cat:'produce',name:'Tomates',sub:'Le kg',price:900,unit:'kg',weighed:true,sku:'2004',icon:'ellipse-outline',tint:T.coral},
      {id:'g3',cat:'produce',name:'Feuilles de ndolé',sub:'Sachet 250 g',price:500,sku:'2019',icon:'leaf-outline',tint:T.green},
      {id:'g4',cat:'bakery',name:'Pain de mie',sub:'400 g',price:900,sku:'3110',icon:'pizza-outline',tint:T.oak},
      {id:'g5',cat:'dairy',name:'Lait en poudre 400 g',sub:'Boîte',price:2900,sku:'4001',icon:'water-outline',tint:T.blue},
      {id:'g6',cat:'dairy',name:'Œufs de ferme',sub:'Douzaine',price:1800,sku:'4022',icon:'egg-outline',tint:T.amber},
      {id:'g7',cat:'drinks',name:'Coca pack de 6',sub:'Canettes 33 cl',price:2400,sku:'5140',icon:'beer-outline',tint:T.coral},
      {id:'g8',cat:'drinks',name:'Castel 65 cl',sub:'Bière · 18+',price:1000,age:18,sku:'5201',icon:'beer-outline',tint:T.amber},
      {id:'g9',cat:'pantry',name:'Riz parfumé',sub:'1 kg',price:900,sku:'6003',icon:'file-tray-outline',tint:T.oak},
      {id:'g10',cat:'pantry',name:'Huile végétale',sub:'1 L',price:1500,sku:'6011',icon:'flask-outline',tint:T.green},
      {id:'g11',cat:'house',name:'Papier ménage',sub:'2 rouleaux',price:1200,sku:'7005',icon:'reorder-four-outline',tint:T.slate},
      {id:'g12',cat:'house',name:'Sac réutilisable',sub:'Grand format',price:100,sku:'9999',icon:'bag-handle-outline',tint:T.slate},
    ]},
  fashion: { cats:[
      {id:'tops',label:'Tops',icon:'shirt-outline'},{id:'denim',label:'Denim',icon:'body-outline'},
      {id:'outer',label:'Outerwear',icon:'snow-outline'},{id:'shoes',label:'Shoes',icon:'footsteps-outline'},
      {id:'acc',label:'Accessories',icon:'watch-outline'}],
    items:[
      {id:'f1',cat:'tops',name:'Chemise en lin',sub:'Coupe ample',price:22000,sku:'LS-101',icon:'shirt-outline',tint:T.blue,variants:{sizes:SZ,colors:[['Sand','#d8c9ae'],['Sky','#a7c4e6'],['Black','#2b2f3a']]}},
      {id:'f2',cat:'tops',name:'T-shirt côtelé',sub:'Coton bio',price:9000,sku:'RT-208',icon:'shirt-outline',tint:T.rose,variants:{sizes:SZ,colors:[['Ecru','#e8e2d6'],['Rose','#d8899f'],['Navy','#2f3b5c']]}},
      {id:'f3',cat:'denim',name:'Jean droit',sub:'Taille moyenne',price:28000,sku:'DJ-330',icon:'body-outline',tint:T.ink,variants:{sizes:['26','28','30','32','34'],colors:[['Indigo','#3b4a72'],['Washed','#8fa2c0'],['Black','#22242c']]}},
      {id:'f4',cat:'outer',name:'Veste matelassée',sub:'Déperlante',price:45000,sku:'QJ-500',icon:'snow-outline',tint:T.slate,variants:{sizes:['S','M','L','XL'],colors:[['Olive','#6d7a55'],['Black','#22242c']]}},
      {id:'f5',cat:'shoes',name:'Basket en cuir',sub:'Tige cuir',price:35000,sku:'CS-042',icon:'footsteps-outline',tint:T.oak,variants:{sizes:['38','39','40','41','42','43'],colors:[['White','#f2f0eb'],['Bone','#ded4c2']]}},
      {id:'f6',cat:'acc',name:'Sac en toile',sub:'Grammage épais',price:8000,sku:'CT-011',icon:'bag-handle-outline',tint:T.green},
      {id:'f7',cat:'acc',name:'Ceinture en cuir',sub:'Boucle laiton',price:12000,sku:'LB-077',icon:'ellipse-outline',tint:T.oak,variants:{sizes:['S','M','L'],colors:[['Tan','#b98a52'],['Black','#22242c']]}},
      {id:'f8',cat:'acc',name:'Écharpe en laine',sub:'Laine d’agneau',price:9000,sku:'WS-090',icon:'color-filter-outline',tint:T.rose},
    ]},
  hardware: { cats:[
      {id:'tools',label:'Tools',icon:'hammer-outline'},{id:'fix',label:'Fixings',icon:'git-commit-outline'},
      {id:'paint',label:'Paint',icon:'color-palette-outline'},{id:'elec',label:'Electrical',icon:'flash-outline'},
      {id:'garden',label:'Garden',icon:'leaf-outline'}],
    items:[
      {id:'h1',cat:'tools',name:'Marteau 450 g',sub:'Manche fibre',price:8000,sku:'TL-1601',icon:'hammer-outline',tint:T.slate},
      {id:'h2',cat:'tools',name:'Mètre ruban 5 m',sub:'Crochet aimanté',price:3500,sku:'TL-0450',icon:'resize-outline',tint:T.amber},
      {id:'h3',cat:'fix',name:'Vis à bois 4×40',sub:'Boîte de 200',price:4500,unit:'box',sku:'FX-4040',icon:'git-commit-outline',tint:T.ink},
      {id:'h4',cat:'fix',name:'Chevilles',sub:'Sachet de 100',price:1500,unit:'pack',sku:'FX-1100',icon:'ellipse-outline',tint:T.slate},
      {id:'h5',cat:'paint',name:'Peinture mate 5 L',sub:'Blanc brillant',price:18000,sku:'PT-5000',icon:'color-palette-outline',tint:T.blue},
      {id:'h6',cat:'paint',name:'Jeu de pinceaux',sub:'3 pièces',price:4000,sku:'PT-0303',icon:'brush-outline',tint:T.oak},
      {id:'h7',cat:'elec',name:'Câble électrique',sub:'Au mètre',price:900,unit:'m',weighed:true,sku:'EL-2515',icon:'git-merge-outline',tint:T.coral},
      {id:'h8',cat:'elec',name:'Ampoule LED E27',sub:'Blanc chaud',price:1500,sku:'EL-0827',icon:'bulb-outline',tint:T.amber},
      {id:'h9',cat:'garden',name:'Terreau 40 L',sub:'Sans tourbe',price:3500,sku:'GD-4001',icon:'leaf-outline',tint:T.green},
      {id:'h10',cat:'garden',name:'Tuyau 15 m',sub:'Renforcé',price:12000,sku:'GD-1500',icon:'water-outline',tint:T.blue},
    ]},
  electronics: { cats:[
      {id:'audio',label:'Audio',icon:'headset-outline'},{id:'mobile',label:'Mobile',icon:'phone-portrait-outline'},
      {id:'comp',label:'Computing',icon:'laptop-outline'},{id:'parts',label:'Parts',icon:'hardware-chip-outline'},
      {id:'svc',label:'Services',icon:'build-outline'}],
    items:[
      {id:'e1',cat:'audio',name:'Écouteurs sans fil',sub:'ANC · 24 h',price:45000,serial:true,sku:'AU-220',icon:'headset-outline',tint:T.ink,variants:{sizes:[],colors:[['Black','#22242c'],['White','#f0f0f2']]}},
      {id:'e2',cat:'mobile',name:'Coque 6,1 po',sub:'Anti-choc',price:5000,sku:'MB-061',icon:'phone-portrait-outline',tint:T.blue},
      {id:'e3',cat:'mobile',name:'Chargeur rapide 30 W',sub:'USB-C',price:9000,sku:'MB-330',icon:'flash-outline',tint:T.amber},
      {id:'e4',cat:'comp',name:'Clavier mécanique',sub:'Switch tactile',price:38000,serial:true,sku:'CP-870',icon:'keypad-outline',tint:T.slate},
      {id:'e5',cat:'comp',name:'Écran 27 po',sub:'QHD 165 Hz',price:165000,serial:true,sku:'CP-2700',icon:'tv-outline',tint:T.ink},
      {id:'e6',cat:'parts',name:'SSD 1 To',sub:'NVMe',price:52000,serial:true,sku:'PT-1000',icon:'hardware-chip-outline',tint:T.purple},
      {id:'e7',cat:'svc',name:'Réparation écran',sub:'Main d’œuvre · 1 h',price:25000,sku:'SV-001',icon:'build-outline',tint:T.green},
      {id:'e8',cat:'svc',name:'Transfert de données',sub:'Par appareil',price:8000,sku:'SV-004',icon:'swap-horizontal-outline',tint:T.green},
    ]},
  salon: { cats:[
      {id:'hair',label:'Hair care',icon:'water-outline'},{id:'styling',label:'Styling',icon:'sparkles-outline'},
      {id:'skin',label:'Skin',icon:'flower-outline'},{id:'tools',label:'Tools',icon:'cut-outline'}],
    items:[
      {id:'s1',cat:'hair',name:'Shampooing réparateur',sub:'300 ml',price:9500,sku:'HC-300',icon:'water-outline',tint:T.purple,variants:{sizes:['100 ml','300 ml','1 L'],colors:[]}},
      {id:'s2',cat:'hair',name:'Après-shampooing',sub:'250 ml',price:11000,sku:'HC-250',icon:'water-outline',tint:T.rose},
      {id:'s3',cat:'styling',name:'Spray texturisant',sub:'200 ml',price:8500,sku:'ST-200',icon:'sparkles-outline',tint:T.amber},
      {id:'s4',cat:'styling',name:'Argile mate',sub:'75 ml',price:7000,sku:'ST-075',icon:'ellipse-outline',tint:T.ink},
      {id:'s5',cat:'skin',name:'Sérum hydratant',sub:'30 ml',price:16000,sku:'SK-030',icon:'flower-outline',tint:T.green},
      {id:'s6',cat:'skin',name:'Baume à lèvres',sub:'SPF 15',price:2500,sku:'SK-008',icon:'ellipse-outline',tint:T.coral},
      {id:'s7',cat:'tools',name:'Brosse ronde',sub:'45 mm',price:8000,sku:'TL-045',icon:'brush-outline',tint:T.oak},
      {id:'s8',cat:'tools',name:'Pinces à mèches',sub:'Lot de 6',price:3500,sku:'TL-006',icon:'cut-outline',tint:T.slate},
    ]},
  bakery: { cats:[
      {id:'bread',label:'Bread',icon:'pizza-outline'},{id:'pastry',label:'Pastry',icon:'cafe-outline'},
      {id:'deli',label:'Deli counter',icon:'restaurant-outline'},{id:'cheese',label:'Cheese',icon:'ellipse-outline'}],
    items:[
      {id:'b1',cat:'bread',name:'Pain de campagne',sub:'La pièce',price:1000,sku:'BR-001',icon:'pizza-outline',tint:T.oak},
      {id:'b2',cat:'bread',name:'Pain complet',sub:'Le kg',price:2500,unit:'kg',weighed:true,sku:'BR-KG2',icon:'nutrition-outline',tint:T.oak},
      {id:'b3',cat:'pastry',name:'Croissant au beurre',sub:'La pièce',price:500,sku:'PS-010',icon:'cafe-outline',tint:T.amber},
      {id:'b4',cat:'pastry',name:'Chausson aux amandes',sub:'La pièce',price:800,sku:'PS-022',icon:'cafe-outline',tint:T.amber},
      {id:'b5',cat:'deli',name:'Jambon rôti',sub:'Tranché, le kg',price:8500,unit:'kg',weighed:true,sku:'DL-KG1',icon:'restaurant-outline',tint:T.coral},
      {id:'b6',cat:'deli',name:'Mélange d’olives',sub:'Le kg',price:6000,unit:'kg',weighed:true,sku:'DL-KG4',icon:'ellipse-outline',tint:T.green},
      {id:'b7',cat:'cheese',name:'Cheddar affiné',sub:'Le kg',price:12000,unit:'kg',weighed:true,sku:'CH-KG1',icon:'ellipse-outline',tint:T.amber},
      {id:'b8',cat:'cheese',name:'Chèvre frais',sub:'Le kg',price:14000,unit:'kg',weighed:true,sku:'CH-KG3',icon:'ellipse-outline',tint:T.slate},
    ]},
};

/* ---------------- supporting data ---------------- */
window.RT_CUSTOMERS = [
  { id:'c1', name:'Amara Diallo', phone:'+237 6 99 20 88 41', points:1240, tier:'Gold', visits:38, spend:1285000 },
  { id:'c2', name:'Thomas Ngwa', phone:'+237 6 77 71 00 92', points:310, tier:'Silver', visits:12, spend:292000 },
  { id:'c3', name:'Nadège Fotso', phone:'+237 6 94 00 11 77', points:2890, tier:'Gold', visits:64, spend:3190000 },
  { id:'c4', name:'Joseph Bello', phone:'+237 6 70 90 55 10', points:60, tier:'Member', visits:3, spend:58000 },
];
window.RT_HELD = [
  { id:'t1', label:'Ticket #1043', who:'Amara D.', items:4, total:47000, at:'2 min ago', note:'Attend la confirmation MoMo' },
  { id:'t2', label:'Ticket #1044', who:'Walk-in', items:2, total:7700, at:'9 min ago', note:'Cherche un deuxième article' },
  { id:'t3', label:'Ticket #1046', who:'Nadège F.', items:7, total:128000, at:'21 min ago', note:'Attend la remise du responsable' },
];
window.RT_RECEIPTS = [
  { id:'r1', no:'1031', at:'Today · 11:04', total:30000, tender:'MTN MoMo ···8841', items:[
      { name:'Chemise en lin', sub:'M · Sable', qty:1, price:22000 }, { name:'Sac en toile', sub:'Grammage épais', qty:1, price:8000 }] },
  { id:'r2', no:'1029', at:'Today · 10:22', total:6700, tender:'Espèces', items:[
      { name:'Lait en poudre 400 g', sub:'Boîte', qty:2, price:2900 }, { name:'Pain de mie', sub:'400 g', qty:1, price:900 }] },
  { id:'r3', no:'1018', at:'Yesterday · 17:41', total:45000, tender:'Orange Money ···9920', items:[
      { name:'Écouteurs sans fil', sub:'SN 88-2210-4', qty:1, price:45000 }] },
];
window.RT_SHIFT = {
  opened:'Today · 08:00', cashier:'Anita Ndongo', register:'Caisse 1', float:100000,
  lines:[ { k:'Espèces', v:248000 }, { k:'MTN Mobile Money', v:1125000 }, { k:'Orange Money', v:146000 },
          { k:'Refunds', v:-38000 }, { k:'Paid out', v:-21000 } ],
  counted:{ notes:285000, coin:4000 }, expectedCash:289000,
};
/* whole francs, space-grouped — see kz/kz-locale.js */
window.money = (n) => (n < 0 ? '−' : '') + window.KZ_LOCALE.short(Math.abs(n));
