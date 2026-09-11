/* Koomzo Retail POS — Flex build.
   Model: a PRESET seeds an editable FEATURE map. The register only ever reads
   `features` — presets are just data. Steps between tap and ticket run in one
   fixed order: age → rx → variant → lot → serial → weight → modifiers. */

const T = {
  oak:{bg:'#f1ece2',fg:'#a07d4f'}, slate:{bg:'#eceef2',fg:'#5d6573'}, ink:{bg:'#e7e8ec',fg:'#3a3f4d'},
  purple:{bg:'#eeecf8',fg:'#6a61bf'}, green:{bg:'#e4f4ea',fg:'#2e9e5b'}, blue:{bg:'#e8f0fd',fg:'#528cef'},
  amber:{bg:'#fbf2dd',fg:'#c98a20'}, coral:{bg:'#fdeae4',fg:'#ec603a'}, rose:{bg:'#fbe9f0',fg:'#c2497e'},
};

/* ---- the toggle vocabulary: every profile is a subset of these ---- */
window.RX_FEATURES = [
  { key:'age',       name:'Age restriction',   desc:'ID check before a restricted line is added',   icon:'alert-circle-outline' },
  { key:'rx',        name:'Prescription',      desc:'Pharmacist sign-off and Rx details on the line', icon:'document-text-outline' },
  { key:'variants',  name:'Variants',          desc:'Pick a stocked version before adding',         icon:'grid-outline' },
  { key:'lot',       name:'Batch & expiry',    desc:'Capture lot number and expiry per line',       icon:'calendar-outline' },
  { key:'serial',    name:'Serial capture',    desc:'Identify the individual unit sold',            icon:'barcode-outline' },
  { key:'scale',     name:'Weighed items',     desc:'Scale entry with tare and per-kg pricing',     icon:'speedometer-outline' },
  { key:'modifiers', name:'Modifiers',         desc:'Priced add-ons that carry no stock',           icon:'add-circle-outline' },
  { key:'loyalty',   name:'Customer & loyalty',desc:'Attach a member and points to the ticket',     icon:'people-outline' },
  { key:'booking',   name:'Bookings',          desc:'Attach the sale to an appointment or staff',   icon:'calendar-number-outline' },
];
window.RX_PICKERS = [
  { value:'none',   label:'None — barcode resolves it' },
  { value:'single', label:'Single axis — chip row' },
  { value:'matrix', label:'Matrix — two-axis grid' },
  { value:'swatch', label:'Swatch — colour chips' },
  { value:'config', label:'Configurator — computed price' },
];
window.RX_PICKER_NAME = { none:'No picker', single:'Single picker', matrix:'Matrix picker', swatch:'Swatch picker', config:'Configurator' };
const F = (o) => Object.assign(
  { age:false, rx:false, variants:false, lot:false, serial:false, scale:false, modifiers:false, loyalty:false, booking:false }, o);

/* ---- presets ---- */
window.RX_PROFILES = [
  { id:'grocery', name:'Grocery & Convenience', icon:'basket-outline', tint:T.green,
    blurb:'Scan-first lanes, weighed produce, fast cash tender.',
    entry:'scan', tiles:'text', picker:'none', tax:0,
    features:F({ age:true, scale:true, loyalty:true, variants:true }),
    quick:['Weigh item','Price check','Bag','Age check'] },
  { id:'fashion', name:'Clothing & Accessories', icon:'shirt-outline', tint:T.blue,
    blurb:'Size × colour matrix, exchanges, cross-store stock.',
    entry:'grid', tiles:'image', picker:'matrix', tax:0.1925,
    features:F({ variants:true, loyalty:true, modifiers:true }),
    quick:['Gift receipt','Exchange','Hold','Gift wrap'] },
  { id:'hardware', name:'Hardware / General store', icon:'construct-outline', tint:T.slate,
    blurb:'Spec search, sold by each, box or metre.',
    entry:'search', tiles:'list', picker:'single', tax:0.1925,
    features:F({ variants:true, scale:true }),
    quick:['SKU lookup','Cut to length','Trade price','Quote'] },
  { id:'electronics', name:'Electronics / Repair', icon:'hardware-chip-outline', tint:T.ink,
    blurb:'Model variant, then serial and warranty per unit.',
    entry:'search', tiles:'list', picker:'single', tax:0.1925,
    features:F({ variants:true, serial:true, loyalty:true }),
    quick:['Serial','Warranty','Repair ticket','Trade-in'] },
  { id:'pharmacy', name:'Pharmacy / Health', icon:'medkit-outline', tint:T.green,
    blurb:'Strength × form × pack, Rx sign-off, batch and expiry.',
    entry:'search', tiles:'list', picker:'config', tax:0.00,
    features:F({ rx:true, variants:true, lot:true, age:true, loyalty:true }),
    quick:['Rx lookup','Substitute','Batch','Advice given'] },
  { id:'salon', name:'Salon retail add-ons', icon:'cut-outline', tint:T.purple,
    blurb:'Size sheet on image tiles, attached to a stylist.',
    entry:'grid', tiles:'image', picker:'single', tax:0.1925,
    features:F({ variants:true, booking:true, loyalty:true }),
    quick:['Attach booking','Stylist','Tip','Rebook'] },
  { id:'bakery', name:'Bakery / Deli', icon:'nutrition-outline', tint:T.oak,
    blurb:'Weighed counter sales with tare; cut style as a modifier.',
    entry:'scan', tiles:'image', picker:'none', tax:0,
    features:F({ scale:true, modifiers:true, lot:true }),
    quick:['Weigh item','Tare','Slice','Label'] },
  { id:'beauty', name:'Beauty & Cosmetics', icon:'flower-outline', tint:T.rose,
    blurb:'Deep shade ranges as swatches, searchable by shade code.',
    entry:'grid', tiles:'image', picker:'swatch', tax:0.1925,
    features:F({ variants:true, loyalty:true, modifiers:true }),
    quick:['Shade match','Tester','Gift set','Hold'] },
];

/* ---- variant axes helper: {n:name, k:'text'|'color'|'add', o:options} ---- */
const ax = (n, k, o) => ({ n, k, o });

window.RX_CATALOG = {
  grocery: { cats:[
      {id:'produce',label:'Produce',icon:'leaf-outline'},{id:'bakery',label:'Bakery',icon:'pizza-outline'},
      {id:'dairy',label:'Dairy',icon:'water-outline'},{id:'drinks',label:'Drinks',icon:'beer-outline'},
      {id:'pantry',label:'Pantry',icon:'file-tray-stacked-outline'}],
    items:[
      {id:'g1',cat:'produce',name:'Bananas',sub:'Loose, per kg',price:700,unit:'kg',weighed:true,sku:'2001',icon:'nutrition-outline',tint:T.amber},
      {id:'g2',cat:'produce',name:'Roma Tomatoes',sub:'Per kg',price:1200,unit:'kg',weighed:true,sku:'2004',icon:'ellipse-outline',tint:T.coral},
      {id:'g3',cat:'produce',name:'Baby Spinach',sub:'200 g bag',price:1000,sku:'2019',icon:'leaf-outline',tint:T.green},
      {id:'g4',cat:'bakery',name:'Pain de mie',sub:'800 g',price:1600,sku:'3110',icon:'pizza-outline',tint:T.oak},
      {id:'g5',cat:'dairy',name:'Lait en poudre',sub:'Per bottle',price:800,sku:'4001',icon:'water-outline',tint:T.blue,
        axes:[ax('Size','text',['1 L','2 L','4 L'])]},
      {id:'g6',cat:'dairy',name:'Free-range Eggs',sub:'Dozen',price:1900,sku:'4022',icon:'egg-outline',tint:T.amber},
      {id:'g7',cat:'drinks',name:'Cola',sub:'Multiple packs',price:400,sku:'5140',icon:'beer-outline',tint:T.coral,
        axes:[ax('Pack','text',['330 ml can','500 ml bottle','6-pack','1.5 L'])]},
      {id:'g8',cat:'drinks',name:'House Lager',sub:'500 ml · 18+',price:1100,age:18,sku:'5201',icon:'beer-outline',tint:T.amber},
      {id:'g9',cat:'pantry',name:'Riz parfumé',sub:'1 kg',price:1400,sku:'6003',icon:'file-tray-outline',tint:T.oak},
      {id:'g10',cat:'pantry',name:'Carrier Bag',sub:'Reusable',price:100,sku:'9999',icon:'bag-handle-outline',tint:T.slate},
    ]},
  fashion: { cats:[
      {id:'tops',label:'Tops',icon:'shirt-outline'},{id:'denim',label:'Denim',icon:'body-outline'},
      {id:'outer',label:'Outerwear',icon:'snow-outline'},{id:'shoes',label:'Shoes',icon:'footsteps-outline'},
      {id:'acc',label:'Accessories',icon:'watch-outline'}],
    items:[
      {id:'f1',cat:'tops',name:'Chemise en lin',sub:'Relaxed fit',price:21000,sku:'LS-101',icon:'shirt-outline',tint:T.blue,
        axes:[ax('Size','text',['XS','S','M','L','XL']),ax('Colour','color',[['Sand','#d8c9ae'],['Sky','#a7c4e6'],['Black','#2b2f3a']])],
        oos:['XS|Sky','XL|Black']},
      {id:'f2',cat:'tops',name:'T-shirt côtelé',sub:'Organic cotton',price:8500,sku:'RT-208',icon:'shirt-outline',tint:T.rose,
        axes:[ax('Size','text',['XS','S','M','L','XL']),ax('Colour','color',[['Ecru','#e8e2d6'],['Rose','#d8899f'],['Navy','#2f3b5c']])],
        oos:['XS|Ecru']},
      {id:'f3',cat:'denim',name:'Jean droit',sub:'Mid rise',price:32000,sku:'DJ-330',icon:'body-outline',tint:T.ink,
        axes:[ax('Waist','text',['26','28','30','32','34']),ax('Wash','color',[['Indigo','#3b4a72'],['Washed','#8fa2c0'],['Black','#22242c']])],
        oos:['26|Black','34|Washed']},
      {id:'f4',cat:'outer',name:'Veste matelassée',sub:'Water repellent',price:53500,sku:'QJ-500',icon:'snow-outline',tint:T.slate,
        axes:[ax('Size','text',['S','M','L','XL']),ax('Colour','color',[['Olive','#6d7a55'],['Black','#22242c']])],oos:['S|Olive']},
      {id:'f5',cat:'shoes',name:'Basket en cuir',sub:'Leather upper',price:39500,sku:'CS-042',icon:'footsteps-outline',tint:T.oak,
        axes:[ax('Size','text',['38','39','40','41','42','43']),ax('Colour','color',[['White','#f2f0eb'],['Bone','#ded4c2']])],
        oos:['43|White','38|Bone']},
      {id:'f6',cat:'acc',name:'Sac en toile',sub:'Heavyweight',price:11500,sku:'CT-011',icon:'bag-handle-outline',tint:T.green},
      {id:'f7',cat:'acc',name:'Ceinture en cuir',sub:'Brass buckle',price:16000,sku:'LB-077',icon:'ellipse-outline',tint:T.oak,
        axes:[ax('Size','text',['S','M','L']),ax('Colour','color',[['Tan','#b98a52'],['Black','#22242c']])]},
      {id:'f8',cat:'acc',name:'Écharpe en laine',sub:'Lambswool',price:13500,sku:'WS-090',icon:'color-filter-outline',tint:T.rose},
    ]},
  hardware: { cats:[
      {id:'tools',label:'Tools',icon:'hammer-outline'},{id:'fix',label:'Fixings',icon:'git-commit-outline'},
      {id:'paint',label:'Paint',icon:'color-palette-outline'},{id:'elec',label:'Electrical',icon:'flash-outline'},
      {id:'garden',label:'Garden',icon:'leaf-outline'}],
    items:[
      {id:'h1',cat:'tools',name:'Claw Hammer',sub:'Fibreglass shaft',price:6500,sku:'TL-1601',icon:'hammer-outline',tint:T.slate,
        axes:[ax('Weight','text',['12 oz','16 oz','20 oz'])]},
      {id:'h2',cat:'tools',name:'Tape Measure',sub:'Magnetic hook',price:4000,sku:'TL-0450',icon:'resize-outline',tint:T.amber,
        axes:[ax('Length','text',['3 m','5 m','8 m'])]},
      {id:'h3',cat:'fix',name:'Wood Screws',sub:'Stainless, boxed',price:2800,unit:'box',sku:'FX-4040',icon:'git-commit-outline',tint:T.ink,
        axes:[ax('Size','text',['3×25','4×40','5×60','6×80'])]},
      {id:'h4',cat:'fix',name:'Wall Plugs',sub:'Pack of 100',price:1200,unit:'pack',sku:'FX-1100',icon:'ellipse-outline',tint:T.slate},
      {id:'h5',cat:'paint',name:'Matt Emulsion',sub:'Brilliant white',price:11000,sku:'PT-5000',icon:'color-palette-outline',tint:T.blue,
        axes:[ax('Tin','text',['2.5 L','5 L','10 L'])]},
      {id:'h6',cat:'elec',name:'Twin & Earth Cable',sub:'Per metre',price:800,unit:'m',weighed:true,sku:'EL-2515',icon:'git-merge-outline',tint:T.coral,
        axes:[ax('Gauge','text',['1.0 mm²','1.5 mm²','2.5 mm²','6.0 mm²'])]},
      {id:'h7',cat:'elec',name:'LED Bulb E27',sub:'Warm white',price:1700,sku:'EL-0827',icon:'bulb-outline',tint:T.amber},
      {id:'h8',cat:'garden',name:'Compost 40 L',sub:'Peat free',price:2400,sku:'GD-4001',icon:'leaf-outline',tint:T.green},
    ]},
  electronics: { cats:[
      {id:'audio',label:'Audio',icon:'headset-outline'},{id:'mobile',label:'Mobile',icon:'phone-portrait-outline'},
      {id:'comp',label:'Computing',icon:'laptop-outline'},{id:'parts',label:'Parts',icon:'hardware-chip-outline'},
      {id:'svc',label:'Services',icon:'build-outline'}],
    items:[
      {id:'e1',cat:'audio',name:'Écouteurs sans fil',sub:'ANC · 24 h',price:46500,serial:true,sku:'AU-220',icon:'headset-outline',tint:T.ink,
        axes:[ax('Colour','color',[['Black','#22242c'],['White','#f0f0f2']])]},
      {id:'e2',cat:'mobile',name:'Coque téléphone',sub:'Shock absorbing',price:8000,sku:'MB-061',icon:'phone-portrait-outline',tint:T.blue,
        axes:[ax('Model','text',['6.1"','6.7"','Tablet'])]},
      {id:'e3',cat:'mobile',name:'Chargeur rapide',sub:'USB-C',price:12500,sku:'MB-330',icon:'flash-outline',tint:T.amber,
        axes:[ax('Output','text',['20 W','30 W','65 W'])]},
      {id:'e4',cat:'comp',name:'Clavier mécanique',sub:'Tactile switch',price:35500,serial:true,sku:'CP-870',icon:'keypad-outline',tint:T.slate},
      {id:'e5',cat:'comp',name:'Écran 27 po',sub:'QHD 165 Hz',price:100500,serial:true,sku:'CP-2700',icon:'tv-outline',tint:T.ink},
      {id:'e6',cat:'parts',name:'SSD',sub:'NVMe internal',price:21000,serial:true,sku:'PT-1000',icon:'hardware-chip-outline',tint:T.purple,
        axes:[ax('Capacity','add',[['512 GB',0],['1 TB',11000],['2 TB',34000]])]},
      {id:'e7',cat:'svc',name:'Réparation écran',sub:'Labour · 1 h',price:23500,sku:'SV-001',icon:'build-outline',tint:T.green},
      {id:'e8',cat:'svc',name:'Transfert de données',sub:'Per device',price:10500,sku:'SV-004',icon:'swap-horizontal-outline',tint:T.green},
    ]},
  pharmacy: { cats:[
      {id:'pain',label:'Pain & fever',icon:'thermometer-outline'},{id:'cold',label:'Cold & allergy',icon:'nutrition-outline'},
      {id:'rx',label:'Prescription',icon:'document-text-outline'},{id:'first',label:'First aid',icon:'bandage-outline'},
      {id:'baby',label:'Baby & child',icon:'happy-outline'},{id:'vit',label:'Vitamins',icon:'fitness-outline'}],
    items:[
      {id:'p1',cat:'pain',name:'Ibuprofène',sub:'Anti-inflammatory',price:1200,sku:'IBU-200',icon:'medkit-outline',tint:T.green,lot:true,
        axes:[ax('Strength','add',[['200 mg',0],['400 mg',400]]),ax('Form','add',[['Tablet',0],['Capsule',200],['Gel 5%',1200]]),
              ax('Pack','add',[['×16',0],['×32',600],['×96',1900]])], limit:2},
      {id:'p2',cat:'pain',name:'Paracétamol',sub:'Analgesic',price:900,sku:'PAR-500',icon:'medkit-outline',tint:T.green,lot:true,
        axes:[ax('Strength','add',[['500 mg',0],['1 g',500]]),ax('Pack','add',[['×16',0],['×32',500]])], limit:2},
      {id:'p3',cat:'cold',name:'Antihistaminique',sub:'Non-drowsy',price:2100,sku:'AHI-010',icon:'nutrition-outline',tint:T.blue,lot:true,
        axes:[ax('Strength','add',[['10 mg',0]]),ax('Pack','add',[['×7',0],['×30',1500]])]},
      {id:'p4',cat:'cold',name:'Spray nasal',sub:'Decongestant',price:2600,sku:'NAS-050',icon:'water-outline',tint:T.blue,lot:true},
      {id:'p5',cat:'rx',name:'Amoxicilline',sub:'Prescription only',price:3500,sku:'AMX-500',icon:'document-text-outline',tint:T.purple,rx:true,lot:true,
        axes:[ax('Strength','add',[['250 mg',0],['500 mg',800]]),ax('Form','add',[['Capsule',0],['Suspension',500]]),
              ax('Pack','add',[['×21',0],['×28',700]])]},
      {id:'p6',cat:'rx',name:'Inhalateur salbutamol',sub:'Prescription only',price:4100,sku:'SAL-100',icon:'medical-outline',tint:T.purple,rx:true,lot:true,serial:true},
      {id:'p7',cat:'first',name:'Assortiment de pansements',sub:'Fabric, ×40',price:1500,sku:'FA-040',icon:'bandage-outline',tint:T.coral},
      {id:'p8',cat:'first',name:'Crème antiseptique',sub:'30 g',price:1900,sku:'FA-030',icon:'flask-outline',tint:T.coral,lot:true},
      {id:'p9',cat:'baby',name:'Suspension nourrisson',sub:'Sugar free · 3 mo+',price:2300,sku:'BB-100',icon:'happy-outline',tint:T.amber,lot:true,
        axes:[ax('Size','add',[['100 ml',0],['200 ml',900]])]},
      {id:'p10',cat:'vit',name:'Vitamine D3',sub:'1000 IU',price:3200,sku:'VD-001',icon:'fitness-outline',tint:T.amber,
        axes:[ax('Pack','add',[['×60',0],['×180',3500]])]},
      {id:'p11',cat:'vit',name:'Multivitamines',sub:'Adult daily',price:4500,sku:'MV-030',icon:'fitness-outline',tint:T.green},
      {id:'p12',cat:'pain',name:'Codéine 8 mg',sub:'Restricted · 18+',price:2400,sku:'COD-008',icon:'alert-circle-outline',tint:T.coral,age:18,lot:true,limit:1},
    ]},
  salon: { cats:[
      {id:'hair',label:'Hair care',icon:'water-outline'},{id:'styling',label:'Styling',icon:'sparkles-outline'},
      {id:'skin',label:'Skin',icon:'flower-outline'},{id:'tools',label:'Tools',icon:'cut-outline'}],
    items:[
      {id:'s1',cat:'hair',name:'Shampooing réparateur',sub:'Bond building',price:9500,sku:'HC-300',icon:'water-outline',tint:T.purple,
        axes:[ax('Volume','add',[['100 ml',-3200],['300 ml',0],['1 L',12000]])]},
      {id:'s2',cat:'hair',name:'Après-shampooing',sub:'250 ml',price:10500,sku:'HC-250',icon:'water-outline',tint:T.rose,
        axes:[ax('Volume','add',[['250 ml',0],['1 L',13500]])]},
      {id:'s3',cat:'styling',name:'Spray texturisant',sub:'200 ml',price:8500,sku:'ST-200',icon:'sparkles-outline',tint:T.amber},
      {id:'s4',cat:'styling',name:'Argile mate',sub:'75 ml',price:7000,sku:'ST-075',icon:'ellipse-outline',tint:T.ink},
      {id:'s5',cat:'skin',name:'Sérum hydratant',sub:'30 ml',price:15000,sku:'SK-030',icon:'flower-outline',tint:T.green},
      {id:'s6',cat:'skin',name:'Baume à lèvres',sub:'SPF 15',price:3100,sku:'SK-008',icon:'ellipse-outline',tint:T.coral},
      {id:'s7',cat:'tools',name:'Brosse ronde',sub:'Ceramic barrel',price:8500,sku:'TL-045',icon:'brush-outline',tint:T.oak,
        axes:[ax('Barrel','text',['25 mm','35 mm','45 mm'])]},
      {id:'s8',cat:'tools',name:'Pinces à mèches',sub:'Set of 6',price:4300,sku:'TL-006',icon:'cut-outline',tint:T.slate},
    ]},
  bakery: { cats:[
      {id:'bread',label:'Bread',icon:'pizza-outline'},{id:'pastry',label:'Pastry',icon:'cafe-outline'},
      {id:'deli',label:'Deli counter',icon:'restaurant-outline'},{id:'cheese',label:'Cheese',icon:'ellipse-outline'}],
    items:[
      {id:'b1',cat:'bread',name:'Pain de campagne',sub:'Per loaf',price:1900,sku:'BR-001',icon:'pizza-outline',tint:T.oak,
        mods:[['Sliced',0],['Half loaf',-900],['Bag',100]]},
      {id:'b2',cat:'bread',name:'Pain complet',sub:'Per kg',price:2800,unit:'kg',weighed:true,sku:'BR-KG2',icon:'nutrition-outline',tint:T.oak},
      {id:'b3',cat:'pastry',name:'Croissant au beurre',sub:'Each',price:1000,sku:'PS-010',icon:'cafe-outline',tint:T.amber,
        mods:[['Warmed',0],['Box of 6',-400]]},
      {id:'b4',cat:'pastry',name:'Chausson aux amandes',sub:'Each',price:1200,sku:'PS-022',icon:'cafe-outline',tint:T.amber},
      {id:'b5',cat:'deli',name:'Jambon rôti',sub:'Sliced, per kg',price:7000,unit:'kg',weighed:true,sku:'DL-KG1',icon:'restaurant-outline',tint:T.coral,lot:true,
        mods:[['Thin sliced',0],['Thick sliced',0],['Vacuum pack',100]]},
      {id:'b6',cat:'deli',name:'Mélange d’olives',sub:'Per kg',price:5000,unit:'kg',weighed:true,sku:'DL-KG4',icon:'ellipse-outline',tint:T.green,lot:true},
      {id:'b7',cat:'cheese',name:'Cheddar affiné',sub:'Per kg',price:8000,unit:'kg',weighed:true,sku:'CH-KG1',icon:'ellipse-outline',tint:T.amber,lot:true},
      {id:'b8',cat:'cheese',name:'Chèvre frais',sub:'Per kg',price:9500,unit:'kg',weighed:true,sku:'CH-KG3',icon:'ellipse-outline',tint:T.slate,lot:true},
    ]},
  beauty: { cats:[
      {id:'face',label:'Face',icon:'happy-outline'},{id:'lips',label:'Lips',icon:'ellipse-outline'},
      {id:'eyes',label:'Eyes',icon:'eye-outline'},{id:'skin',label:'Skincare',icon:'flower-outline'}],
    items:[
      {id:'y1',cat:'face',name:'Fond de teint sérum',sub:'40 shades · 30 ml',price:13500,sku:'FD-030',icon:'water-outline',tint:T.rose,
        axes:[ax('Shade','color',[['120 Cool','#f0d6c2'],['180 Neutral','#e3bd9f'],['240 Warm','#cf9d75'],['320 Deep','#a46c48'],['420 Rich','#6f452c']]),
              ax('Finish','text',['Matte','Natural','Radiant'])]},
      {id:'y2',cat:'face',name:'Blush crème',sub:'Buildable',price:8500,sku:'BL-012',icon:'ellipse-outline',tint:T.rose,
        axes:[ax('Shade','color',[['Peach','#eaa88a'],['Rose','#d8798f'],['Berry','#a8456a']])]},
      {id:'y3',cat:'lips',name:'Rouge à lèvres satiné',sub:'3.5 g',price:8000,sku:'LP-035',icon:'ellipse-outline',tint:T.coral,
        axes:[ax('Shade','color',[['Nude','#c99a86'],['Coral','#e2664b'],['Red','#c0202c'],['Plum','#7a2a48']])]},
      {id:'y4',cat:'lips',name:'Huile à lèvres',sub:'Sheer tint',price:6000,sku:'LO-008',icon:'water-outline',tint:T.coral},
      {id:'y5',cat:'eyes',name:'Crayon à sourcils',sub:'Fine tip',price:6500,sku:'BP-004',icon:'brush-outline',tint:T.oak,
        axes:[ax('Shade','color',[['Blonde','#c9a878'],['Brown','#8a6242'],['Ebony','#3a2c22']])]},
      {id:'y6',cat:'eyes',name:'Mascara volume',sub:'Washable',price:7500,sku:'MS-009',icon:'eye-outline',tint:T.ink},
      {id:'y7',cat:'skin',name:'Sérum niacinamide',sub:'30 ml',price:10500,sku:'SK-030',icon:'flask-outline',tint:T.green},
      {id:'y8',cat:'skin',name:'Fluide SPF 50',sub:'50 ml',price:9500,sku:'SK-050',icon:'sunny-outline',tint:T.amber},
    ]},
};

window.RX_LOTS = [
  { lot:'B24-0871', exp:'03 / 2027', stock:42 },
  { lot:'B24-0902', exp:'11 / 2026', stock:18 },
  { lot:'B23-1140', exp:'06 / 2026', stock:5 },
];
window.RX_CUSTOMERS = [
  { id:'c1', name:'Amara Diallo', phone:'+237 6 99 20 88 41', points:1240, tier:'Gold', visits:38, spend:1285000 },
  { id:'c2', name:'Thomas Ngwa', phone:'+237 6 77 71 00 92', points:310, tier:'Silver', visits:12, spend:292000 },
  { id:'c3', name:'Nadège Fotso', phone:'+237 6 94 00 11 77', points:2890, tier:'Gold', visits:64, spend:3190000 },
  { id:'c4', name:'Joseph Bello', phone:'+237 6 70 90 55 10', points:60, tier:'Member', visits:3, spend:58000 },
];
window.RX_HELD = [
  { id:'t1', label:'Ticket #1043', who:'Amara D.', items:4, total:47000, at:'2 min ago', note:'Attend la confirmation MoMo' },
  { id:'t2', label:'Ticket #1044', who:'Walk-in', items:2, total:7700, at:'9 min ago', note:'Cherche un deuxième article' },
  { id:'t3', label:'Ticket #1046', who:'Nadège F.', items:7, total:128000, at:'21 min ago', note:'Attend la remise du responsable' },
];
window.RX_RECEIPTS = [
  { id:'r1', no:'1031', at:'Today · 11:04', total:33000, tender:'MTN MoMo ···8841', items:[
      { name:'Chemise en lin', sub:'M · Sable', qty:1, price:21500 }, { name:'Sac en toile', sub:'Grammage épais', qty:1, price:11500 }] },
  { id:'r2', no:'1029', at:'Today · 10:22', total:6700, tender:'Espèces', items:[
      { name:'Lait en poudre', sub:'400 g', qty:2, price:2900 }, { name:'Pain de mie', sub:'400 g', qty:1, price:900 }] },
  { id:'r3', no:'1018', at:'Yesterday · 17:41', total:46500, tender:'Orange Money ···9920', items:[
      { name:'Écouteurs sans fil', sub:'SN 88-2210-4', qty:1, price:46500 }] },
];
window.RX_SHIFT = {
  opened:'Today · 08:00', cashier:'Anita Ndongo', register:'Caisse 1', float:100000,
  lines:[ { k:'Espèces', v:248000 }, { k:'MTN Mobile Money', v:1125000 }, { k:'Orange Money', v:146000 },
          { k:'Refunds', v:-38000 }, { k:'Paid out', v:-21000 } ],
  counted:{ notes:285000, coin:4000 }, expectedCash:289000,
};
window.RX_TINTS = T;
/* whole francs, space-grouped — see kz/kz-locale.js */
window.money = (n) => (n < 0 ? '−' : '') + window.KZ_LOCALE.short(Math.abs(n));

/* ---- screens the rail can carry. Register and Setup are never optional. ---- */
window.RX_MODULES = [
  { key:'sales',     name:'Sales history',  desc:'Past transactions, receipts, reprints.', icon:'receipt-outline' },
  { key:'inventory', name:'Stock',          desc:'Follows the Stock control setting above.', icon:'cube-outline', bound:'stock' },
  { key:'tickets',   name:'Open tickets',   desc:'Park a sale and come back to it. Needs a second customer waiting.', icon:'pause-outline' },
  { key:'returns',   name:'Returns',        desc:'Refunds against a receipt. Off where returns are not accepted.', icon:'refresh-outline' },
  { key:'customers', name:'Customers',      desc:'Named accounts, loyalty, notes. Hides the Add customer row on the ticket too.', icon:'people-outline' },
  { key:'categories', name:'Categories',     desc:'Category list, glyphs and tile style. Hide once the range is settled.', icon:'albums-outline' },
  { key:'shift',     name:'Shift & drawer', desc:'Float, count, Z-report. Pointless when one person owns the till.', icon:'cash-outline' },
];
/* three ready-made shapes of the rail */
window.RX_FITS = {
  solo:    { label:'Solo shop',   desc:'One person, one till. Sell, look up a sale, done.',
             mods:{ sales:true, tickets:false, returns:false, customers:false, categories:false, shift:false } },
  counter: { label:'Counter',     desc:'A small team, returns accepted, no shift accounting.',
             mods:{ sales:true, tickets:true, returns:true, customers:true, categories:true, shift:false } },
  full:    { label:'Full',        desc:'Every back-of-house screen switched on.',
             mods:{ sales:true, tickets:true, returns:true, customers:true, categories:true, shift:true } },
};

