/* Koomzo — category & glyph library, shared by the Inventory module and the
   Retail Flex Stock screen. A BUSINESS TYPE is a starting set, not a cage:
   applying one seeds categories the merchant then renames, reorders or deletes. */

const CT = {
  oak:{bg:'#f1ece2',fg:'#a07d4f'}, slate:{bg:'#eceef2',fg:'#5d6573'}, ink:{bg:'#e7e8ec',fg:'#3a3f4d'},
  purple:{bg:'#eeecf8',fg:'#6a61bf'}, green:{bg:'#e4f4ea',fg:'#2e9e5b'}, blue:{bg:'#e8f0fd',fg:'#528cef'},
  amber:{bg:'#fbf2dd',fg:'#c98a20'}, coral:{bg:'#fdeae4',fg:'#ec603a'}, rose:{bg:'#fbe9f0',fg:'#c2497e'},
  indigo:{bg:'#e9e9fb',fg:'#4b4ad9'},
};
window.CAT_TINTS = CT;
window.CAT_TINT_KEYS = Object.keys(CT);

/* ---------- glyph library, grouped so a baker never scrolls past drill bits ---------- */
window.GLYPH_SETS = [
  { id:'general', label:'General', icons:['pricetag-outline','cube-outline','basket-outline','bag-handle-outline',
      'gift-outline','star-outline','ribbon-outline','sparkles-outline','albums-outline','apps-outline'] },
  { id:'food', label:'Food & drink', icons:['cafe-outline','beer-outline','wine-outline','fast-food-outline',
      'pizza-outline','ice-cream-outline','nutrition-outline','restaurant-outline','egg-outline','fish-outline'] },
  { id:'bakery', label:'Bakery', icons:['cafe-outline','nutrition-outline','pizza-outline','ice-cream-outline',
      'egg-outline','flame-outline','gift-outline','ribbon-outline'] },
  { id:'hardware', label:'Hardware', icons:['hammer-outline','construct-outline','build-outline','cog-outline',
      'flash-outline','water-outline','color-fill-outline','cut-outline','layers-outline','magnet-outline'] },
  { id:'health', label:'Health & beauty', icons:['medical-outline','bandage-outline','flower-outline','water-outline',
      'fitness-outline','eye-outline','body-outline','heart-outline','leaf-outline','thermometer-outline'] },
  { id:'fashion', label:'Fashion', icons:['shirt-outline','glasses-outline','watch-outline','footsteps-outline',
      'bag-outline','diamond-outline','umbrella-outline','sunny-outline'] },
  { id:'tech', label:'Tech & home', icons:['headset-outline','phone-portrait-outline','laptop-outline','battery-full-outline',
      'bulb-outline','tv-outline','game-controller-outline','wifi-outline','home-outline','bed-outline'] },
  { id:'service', label:'Service', icons:['time-outline','calendar-outline','person-outline','cut-outline',
      'car-outline','bicycle-outline','paw-outline','school-outline','briefcase-outline','ticket-outline'] },
];
window.ALL_GLYPHS = [...new Set(window.GLYPH_SETS.flatMap((g) => g.icons))];

const C = (id, label, icon, tint, note) => ({ id, label, icon, tint, note, items: 0 });

/* ---------- business types ---------- */
window.BIZ_TYPES = [
  { id:'grocery', name:'Grocery & convenience', icon:'basket-outline', tint:CT.green, glyphs:'food',
    blurb:'Aisle-shaped. Weighed produce, chilled goods, a tobacco shelf behind the till.',
    tiles:'text', cats:[
      C('produce','Fresh produce','leaf-outline',CT.green,'Weighed at the lane'),
      C('bakery','Bakery','cafe-outline',CT.oak),
      C('dairy','Dairy & chilled','water-outline',CT.blue),
      C('pantry','Pantry','nutrition-outline',CT.amber),
      C('frozen','Frozen','snow-outline',CT.blue),
      C('drinks','Drinks','beer-outline',CT.coral,'Age-restricted lines'),
      C('household','Household','home-outline',CT.slate),
      C('tobacco','Tobacco','flame-outline',CT.ink,'Age check enforced'),
    ] },
  { id:'hardware', name:'Hardware & trade', icon:'hammer-outline', tint:CT.oak, glyphs:'hardware',
    blurb:'Bin-shaped. Loose fixings by weight, trade accounts, cut-to-length timber.',
    tiles:'list', cats:[
      C('tools','Hand tools','hammer-outline',CT.oak),
      C('power','Power tools','flash-outline',CT.amber,'Serial captured'),
      C('fixings','Fixings & fasteners','cog-outline',CT.slate,'Sold loose by weight'),
      C('timber','Timber & sheet','layers-outline',CT.oak,'Cut to length'),
      C('paint','Paint & decorating','color-fill-outline',CT.rose,'Mixed to order'),
      C('plumbing','Plumbing','water-outline',CT.blue),
      C('electrical','Electrical','bulb-outline',CT.amber),
      C('garden','Garden','leaf-outline',CT.green,'Seasonal'),
      C('safety','Safety & workwear','shield-outline',CT.ink),
    ] },
  { id:'bakery', name:'Bakery & café', icon:'cafe-outline', tint:CT.amber, glyphs:'bakery',
    blurb:'Day-shaped. Baked fresh, sold out, gone. Almost everything is perishable.',
    tiles:'image', cats:[
      C('bread','Bread','nutrition-outline',CT.oak,'Baked daily'),
      C('pastry','Pastry','cafe-outline',CT.amber),
      C('cakes','Cakes','gift-outline',CT.rose,'Made to order'),
      C('savoury','Savoury','pizza-outline',CT.coral),
      C('coffee','Coffee','cafe-outline',CT.ink,'Modifiers: milk, shots, syrup'),
      C('cold','Cold drinks','water-outline',CT.blue),
      C('retail','Retail bags','bag-handle-outline',CT.slate,'Beans, flour, jars'),
    ] },
  { id:'restaurant', name:'Restaurant & bar', icon:'restaurant-outline', tint:CT.coral, glyphs:'food',
    blurb:'Course-shaped. Categories are the order the kitchen fires them in.',
    tiles:'image', cats:[
      C('starters','Starters','restaurant-outline',CT.green),
      C('mains','Mains','fast-food-outline',CT.coral),
      C('sides','Sides','egg-outline',CT.amber),
      C('desserts','Desserts','ice-cream-outline',CT.rose),
      C('softs','Soft drinks','water-outline',CT.blue),
      C('beer','Beer & cider','beer-outline',CT.amber,'Age check'),
      C('wine','Wine','wine-outline',CT.purple,'Age check · by glass or bottle'),
      C('spirits','Spirits','wine-outline',CT.ink,'Age check · measures'),
    ] },
  { id:'pharmacy', name:'Pharmacy', icon:'medical-outline', tint:CT.blue, glyphs:'health',
    blurb:'Regulation-shaped. Dispensing sits behind the counter; the rest is retail.',
    tiles:'list', cats:[
      C('rx','Prescription','document-text-outline',CT.blue,'Pharmacist sign-off'),
      C('otc','Over the counter','medical-outline',CT.green),
      C('firstaid','First aid','bandage-outline',CT.coral),
      C('babycare','Baby care','happy-outline',CT.rose),
      C('skincare','Skin & personal','flower-outline',CT.purple),
      C('vitamins','Vitamins','fitness-outline',CT.amber),
      C('equipment','Equipment','thermometer-outline',CT.slate,'Serial captured'),
    ] },
  { id:'fashion', name:'Clothing & accessories', icon:'shirt-outline', tint:CT.indigo, glyphs:'fashion',
    blurb:'Grid-shaped. Every line is a size × colour matrix, so exchanges rule the day.',
    tiles:'image', cats:[
      C('tops','Tops','shirt-outline',CT.blue),
      C('bottoms','Bottoms','body-outline',CT.slate),
      C('outerwear','Outerwear','umbrella-outline',CT.ink),
      C('shoes','Footwear','footsteps-outline',CT.oak),
      C('bags','Bags','bag-outline',CT.oak),
      C('jewellery','Jewellery','diamond-outline',CT.rose),
      C('accessories','Accessories','glasses-outline',CT.amber),
    ] },
  { id:'salon', name:'Salon & spa', icon:'cut-outline', tint:CT.purple, glyphs:'service',
    blurb:'Chair-shaped. Services carry time and staff; retail rides along at the till.',
    tiles:'list', cats:[
      C('cut','Cutting','cut-outline',CT.purple,'Service · duration'),
      C('colour','Colour','color-fill-outline',CT.rose,'Service · consumes back bar'),
      C('treatment','Treatments','flower-outline',CT.green,'Service · room required'),
      C('nails','Nails','hand-left-outline',CT.coral,'Service'),
      C('haircare','Hair care retail','water-outline',CT.blue),
      C('skincare','Skin retail','sparkles-outline',CT.amber),
      C('tools','Tools','brush-outline',CT.oak),
      C('backbar','Back bar','flask-outline',CT.ink,'Stocked, never sold'),
    ] },
  { id:'general', name:'General retail', icon:'pricetag-outline', tint:CT.slate, glyphs:'general',
    blurb:'The neutral start. Four broad shelves you split as the range grows.',
    tiles:'image', cats:[
      C('new','New in','sparkles-outline',CT.purple),
      C('core','Core range','cube-outline',CT.slate),
      C('gifts','Gifts','gift-outline',CT.rose),
      C('sale','Sale','pricetag-outline',CT.coral),
    ] },
];

window.BIZ = (id) => window.BIZ_TYPES.find((b) => b.id === id) || window.BIZ_TYPES[7];
window.TILE_STYLES = [
  { value:'image', label:'Image tile',  desc:'Photo or glyph above the name. Best when staff recognise the pack.', icon:'image-outline' },
  { value:'text',  label:'Text key',    desc:'Name and price only, densest grid. Best for scan-first lanes.',      icon:'text-outline' },
  { value:'list',  label:'List row',    desc:'One line each, long names readable. Best for trade and services.',   icon:'list-outline' },
];
window.GLYPH_MODES = [
  { value:'glyph', label:'Glyph',     desc:'An outline icon on a colour wash. No photography to maintain.' },
  { value:'image', label:'Image URL', desc:'A hosted photo. Falls back to the glyph if it fails to load.' },
  { value:'none',  label:'Plain',     desc:'Colour wash only, name does the work.' },
];
