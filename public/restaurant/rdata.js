/* ============================================================
   Koomzo POS Suite — shared data model
   Drives Register · Kitchen Display · Floor Plan · Self-Service
   across three verticals: Restaurant · Bar · Retail.
   Iconographic tiles (tinted wash + Ionicon) — no image deps.
   ============================================================ */

/* ---- tint washes (soft, read as photo backdrops) ---- */
const T = {
  oak:    { bg: '#f1ece2', fg: '#a07d4f' },
  slate:  { bg: '#eceef2', fg: '#5d6573' },
  ink:    { bg: '#e7e8ec', fg: '#3a3f4d' },
  purple: { bg: '#eeecf8', fg: '#6a61bf' },
  green:  { bg: '#e4f4ea', fg: '#2e9e5b' },
  blue:   { bg: '#e8f0fd', fg: '#528cef' },
  amber:  { bg: '#fbf2dd', fg: '#c98a20' },
  coral:  { bg: '#fdeae4', fg: '#ec603a' },
  wine:   { bg: '#f7e9ec', fg: '#9c3b50' },
  rose:   { bg: '#fdeef0', fg: '#d4607a' },
  teal:   { bg: '#e2f3f1', fg: '#2f9d8f' },
  gold:   { bg: '#f9efd8', fg: '#b8902f' },
};

/* ---- allergen / diet tag dictionary ---- */
window.RK_TAGS = {
  v:        { label: 'Vegetarian', short: 'V',  icon: 'leaf-outline',        color: '#2e9e5b' },
  vg:       { label: 'Vegan',      short: 'VG', icon: 'flower-outline',      color: '#2f9d8f' },
  gf:       { label: 'Gluten-free',short: 'GF', icon: 'nutrition-outline',   color: '#b8902f' },
  spicy:    { label: 'Spicy',      short: 'S',  icon: 'flame-outline',       color: '#ec603a' },
  nuts:     { label: 'Contains nuts',  short: 'N',  icon: 'alert-circle-outline', color: '#c98a20' },
  shellfish:{ label: 'Shellfish',  short: 'SF', icon: 'fish-outline',        color: '#528cef' },
  dairy:    { label: 'Dairy',      short: 'D',  icon: 'water-outline',       color: '#837bd0' },
  alcohol:  { label: 'Alcohol',    short: '21+',icon: 'wine-outline',        color: '#9c3b50' },
};

/* ---- kitchen stations (color-coded on KDS) ---- */
window.RK_STATIONS = {
  grill:  { label: 'Grill',  color: '#ec603a', wash: '#fdeae4' },
  fry:    { label: 'Fryer',  color: '#c98a20', wash: '#fbf2dd' },
  cold:   { label: 'Cold',   color: '#528cef', wash: '#e8f0fd' },
  pizza:  { label: 'Braise', color: '#2e9e5b', wash: '#e4f4ea' },
  pasta:  { label: 'Sauce Pot', color: '#9c3b50', wash: '#f7e9ec' },
  dessert:{ label: 'Dessert',color: '#d4607a', wash: '#fdeef0' },
  bar:    { label: 'Bar',    color: '#6a61bf', wash: '#eeecf8' },
  none:   { label: 'Counter',color: '#5d6573', wash: '#eceef2' },
};

/* ============================================================
   MENUS — one catalogue per vertical
   item: { id, cat, name, desc, price, icon, tint, station, tags[] }
   ============================================================ */
window.RK_MENU = {
  /* ---------------- RESTAURANT ---------------- */
  restaurant: [
    // Starters
    { id: 'st1', cat: 'starters', name: 'Beignets Haricots', desc: 'Puff-puff, black-eyed beans', price: 500,  icon: 'ellipse-outline',    tint: T.gold,  station: 'fry',   tags: ['v'] },
    { id: 'st2', cat: 'starters', name: 'Soya Brochette',    desc: 'Spiced beef skewer, 2 pc',    price: 1000, icon: 'flame-outline',      tint: T.coral, station: 'grill', tags: ['spicy'] },
    { id: 'st3', cat: 'starters', name: 'Bouillon Poisson',  desc: 'Peppered fish broth',         price: 2500, icon: 'fish-outline',       tint: T.blue,  station: 'pasta', tags: ['spicy'] },
    { id: 'st4', cat: 'starters', name: 'Koki Beans',        desc: 'Steamed in banana leaf',      price: 1000, icon: 'leaf-outline',       tint: T.green, station: 'pasta', tags: ['v','gf'] },
    { id: 'st5', cat: 'starters', name: 'Salade Avocat',     desc: 'Avocado, tomato, onion',      price: 1500, icon: 'nutrition-outline',  tint: T.green, station: 'cold',  tags: ['vg','gf'] },
    { id: 'st6', cat: 'starters', name: 'Gésier Grillé',     desc: 'Grilled gizzard, piment',     price: 2000, icon: 'flame-outline',      tint: T.oak,   station: 'grill', tags: ['spicy'] },
    // Mains
    { id: 'mn1', cat: 'mains', name: 'Ndolé Crevettes',   desc: 'Bitterleaf, prawns, plantain', price: 3500, icon: 'restaurant-outline', tint: T.green, station: 'pasta', tags: ['shellfish','nuts'] },
    { id: 'mn2', cat: 'mains', name: 'Poulet DG',         desc: 'Chicken, plantain, veg',       price: 4500, icon: 'fast-food-outline',  tint: T.gold,  station: 'grill', tags: [] },
    { id: 'mn3', cat: 'mains', name: 'Eru & Water Fufu',  desc: 'Eru leaf, waterleaf, garri',   price: 2500, icon: 'leaf-outline',       tint: T.teal,  station: 'pasta', tags: [] },
    { id: 'mn4', cat: 'mains', name: 'Achu Yellow Soup',  desc: 'Pounded cocoyam, limestone',   price: 3000, icon: 'restaurant-outline', tint: T.amber, station: 'pasta', tags: ['spicy'] },
    { id: 'mn5', cat: 'mains', name: 'Okok & Bobolo',     desc: 'Gnetum, palm nut, cassava',    price: 2000, icon: 'leaf-outline',       tint: T.green, station: 'pasta', tags: ['nuts'] },
    { id: 'mn6', cat: 'mains', name: 'Mets de Pistache',  desc: 'Egusi pudding, smoked fish',    price: 2500, icon: 'restaurant-outline', tint: T.coral, station: 'pasta', tags: ['nuts'] },
    { id: 'mn7', cat: 'mains', name: 'Kondrè Mouton',     desc: 'Ram, unripe plantain, spice',  price: 3500, icon: 'flame-outline',      tint: T.oak,   station: 'pasta', tags: ['spicy'] },
    { id: 'mn8', cat: 'mains', name: 'Taro Sauce Jaune',  desc: 'Taro, yellow palm sauce',      price: 2500, icon: 'restaurant-outline', tint: T.gold,  station: 'pasta', tags: ['gf'] },
    { id: 'mn9', cat: 'mains', name: 'Riz Sauté Poulet',  desc: 'Fried rice, chicken, veg',     price: 2500, icon: 'fast-food-outline',  tint: T.amber, station: 'grill', tags: [] },
    { id: 'mn10',cat: 'mains', name: 'Jollof Poulet',     desc: 'Jollof rice, grilled chicken', price: 2500, icon: 'flame-outline',      tint: T.coral, station: 'grill', tags: ['spicy'] },
    { id: 'mn11',cat: 'mains', name: 'Sanga',             desc: 'Maize, cassava leaf, palm',    price: 1500, icon: 'leaf-outline',       tint: T.green, station: 'pasta', tags: ['vg'] },
    { id: 'mn12',cat: 'mains', name: 'Ekwang',            desc: 'Grated cocoyam rolls',         price: 2500, icon: 'restaurant-outline', tint: T.teal,  station: 'pasta', tags: [] },
    // Grills (braisé)
    { id: 'gr1', cat: 'grills', name: 'Poisson Braisé',   desc: 'Whole bar fish, piment',       price: 5000, icon: 'fish-outline',       tint: T.blue,  station: 'pizza', tags: ['spicy','gf'] },
    { id: 'gr2', cat: 'grills', name: 'Maquereau Braisé', desc: 'Mackerel, onion sauce',        price: 3000, icon: 'fish-outline',       tint: T.teal,  station: 'pizza', tags: ['gf'] },
    { id: 'gr3', cat: 'grills', name: 'Poulet Braisé ½',  desc: 'Half chicken, marinade',       price: 3500, icon: 'flame-outline',      tint: T.coral, station: 'pizza', tags: [] },
    { id: 'gr4', cat: 'grills', name: 'Porc Braisé',      desc: 'Pork ribs, piment vert',       price: 2500, icon: 'flame-outline',      tint: T.oak,   station: 'pizza', tags: ['spicy'] },
    { id: 'gr5', cat: 'grills', name: 'Brochettes Bœuf',  desc: 'Beef skewers, 3 pc',           price: 1500, icon: 'flame-outline',      tint: T.wine,  station: 'grill', tags: [] },
    { id: 'gr6', cat: 'grills', name: 'Escargots Sautés', desc: 'Snails, garlic, piment',       price: 3000, icon: 'ellipse-outline',    tint: T.ink,   station: 'grill', tags: ['spicy'] },
    // Sides
    { id: 'si1', cat: 'sides', name: 'Plantain Frit',    desc: 'Ripe plantain, fried',          price: 1000, icon: 'nutrition-outline',  tint: T.gold,  station: 'fry',  tags: ['vg','gf'] },
    { id: 'si2', cat: 'sides', name: 'Bâton de Manioc',  desc: 'Miondo, 2 sticks',              price: 300,  icon: 'ellipse-outline',    tint: T.oak,   station: 'cold', tags: ['vg','gf'] },
    { id: 'si3', cat: 'sides', name: 'Frites',           desc: 'Hand-cut chips',                price: 1000, icon: 'fast-food-outline',  tint: T.amber, station: 'fry',  tags: ['vg'] },
    { id: 'si4', cat: 'sides', name: 'Riz Blanc',        desc: 'Steamed rice',                  price: 800,  icon: 'ellipse-outline',    tint: T.slate, station: 'pasta',tags: ['vg','gf'] },
    { id: 'si5', cat: 'sides', name: 'Piment Vert',      desc: 'Green pepper sauce',            price: 200,  icon: 'flame-outline',      tint: T.green, station: 'cold', tags: ['vg','spicy'] },
    { id: 'si6', cat: 'sides', name: 'Avocat Tranché',   desc: 'Sliced avocado',                price: 700,  icon: 'leaf-outline',       tint: T.green, station: 'cold', tags: ['vg','gf'] },
    // Desserts
    { id: 'de1', cat: 'desserts', name: 'Salade de Fruits', desc: 'Mango, papaya, pineapple',   price: 1500, icon: 'nutrition-outline',  tint: T.amber, station: 'dessert', tags: ['vg','gf'] },
    { id: 'de2', cat: 'desserts', name: 'Beignets Sucrés',  desc: 'Sugar puff-puff, 4 pc',      price: 500,  icon: 'ellipse-outline',    tint: T.gold,  station: 'dessert', tags: ['v'] },
    { id: 'de3', cat: 'desserts', name: 'Gâteau Ananas',    desc: 'Pineapple sponge',           price: 1500, icon: 'square-outline',     tint: T.rose,  station: 'dessert', tags: ['v'] },
    { id: 'de4', cat: 'desserts', name: 'Safou Grillé',     desc: 'Roasted bush butter',        price: 800,  icon: 'ellipse-outline',    tint: T.teal,  station: 'dessert', tags: ['vg','gf'] },
    // Drinks (soft)
    { id: 'dr1', cat: 'drinks', name: 'Jus de Bissap',    desc: 'Hibiscus, chilled',            price: 700,  icon: 'water-outline',      tint: T.wine,  station: 'bar', tags: ['vg','gf'] },
    { id: 'dr2', cat: 'drinks', name: 'Foléré Glacé',     desc: 'House infusion, mint',         price: 700,  icon: 'leaf-outline',       tint: T.rose,  station: 'bar', tags: ['vg','gf'] },
    { id: 'dr3', cat: 'drinks', name: 'Jus de Gingembre', desc: 'Fresh ginger, lemon',          price: 800,  icon: 'flame-outline',      tint: T.gold,  station: 'bar', tags: ['vg','spicy'] },
    { id: 'dr4', cat: 'drinks', name: 'Top Ananas 65cl',  desc: 'Bottle, pineapple',            price: 700,  icon: 'nutrition-outline',  tint: T.amber, station: 'bar', tags: ['vg'] },
    { id: 'dr5', cat: 'drinks', name: 'Eau Minérale',     desc: '50cl bottle',                  price: 500,  icon: 'water-outline',      tint: T.blue,  station: 'bar', tags: ['vg','gf'] },
    { id: 'dr6', cat: 'drinks', name: 'Café Noir',        desc: 'Local arabica',                price: 500,  icon: 'cafe-outline',       tint: T.oak,   station: 'bar', tags: ['vg'] },
    { id: 'dr7', cat: 'drinks', name: 'Thé Citron',       desc: 'Black tea, lemon',             price: 500,  icon: 'cafe-outline',       tint: T.gold,  station: 'bar', tags: ['vg'] },
  ],

  /* ---------------- BAR ---------------- */
  bar: [
    // Beer
    { id: 'be1', cat: 'beer', name: '33 Export 65cl',  desc: 'Lager, 5.5%',        price: 1000, icon: 'beer-outline', tint: T.gold,  station: 'bar', tags: ['vg','alcohol'] },
    { id: 'be2', cat: 'beer', name: 'Castel 65cl',     desc: 'Lager, 5.2%',        price: 1000, icon: 'beer-outline', tint: T.green, station: 'bar', tags: ['vg','alcohol'] },
    { id: 'be3', cat: 'beer', name: 'Mutzig 65cl',     desc: 'Pilsner, 5.5%',      price: 1000, icon: 'beer-outline', tint: T.amber, station: 'bar', tags: ['vg','alcohol'] },
    { id: 'be4', cat: 'beer', name: 'Beaufort Light',  desc: '65cl, 4.5%',         price: 1000, icon: 'beer-outline', tint: T.slate, station: 'bar', tags: ['vg','alcohol'] },
    { id: 'be5', cat: 'beer', name: 'Guinness Smooth', desc: '33cl stout, 5%',     price: 1200, icon: 'beer-outline', tint: T.ink,   station: 'bar', tags: ['alcohol'] },
    { id: 'be6', cat: 'beer', name: 'Booster 33cl',    desc: 'Shandy, 3%',         price: 800,  icon: 'beer-outline', tint: T.rose,  station: 'bar', tags: ['vg','alcohol'] },
    // Wine
    { id: 'wi1', cat: 'wine', name: 'Vin Rouge',       desc: 'Glass, 175ml',       price: 1500, icon: 'wine-outline', tint: T.wine,  station: 'bar', tags: ['vg','alcohol'] },
    { id: 'wi2', cat: 'wine', name: 'Vin Blanc',       desc: 'Glass, 175ml',       price: 1500, icon: 'wine-outline', tint: T.gold,  station: 'bar', tags: ['vg','alcohol'] },
    { id: 'wi3', cat: 'wine', name: 'Matango 1L',      desc: 'Fresh palm wine',    price: 1000, icon: 'wine-outline', tint: T.oak,   station: 'bar', tags: ['vg','alcohol'] },
    { id: 'wi4', cat: 'wine', name: 'Rosé Pétillant',  desc: 'Sparkling, 125ml',   price: 2000, icon: 'wine-outline', tint: T.rose,  station: 'bar', tags: ['vg','alcohol'] },
    // Cocktails
    { id: 'co1', cat: 'cocktails', name: 'Bissap Rhum',     desc: 'Hibiscus, dark rum',   price: 2500, icon: 'wine-outline',  tint: T.wine,  station: 'bar', tags: ['vg','alcohol'] },
    { id: 'co2', cat: 'cocktails', name: 'Ananas Vodka',    desc: 'Pineapple, vodka',     price: 2500, icon: 'nutrition-outline', tint: T.amber, station: 'bar', tags: ['vg','alcohol'] },
    { id: 'co3', cat: 'cocktails', name: 'Punch Gingembre', desc: 'Ginger, rum, lime',    price: 2700, icon: 'flame-outline', tint: T.gold,  station: 'bar', tags: ['vg','spicy','alcohol'] },
    { id: 'co4', cat: 'cocktails', name: 'Mojito Menthe',   desc: 'Rum, mint, soda',      price: 2800, icon: 'leaf-outline',  tint: T.teal,  station: 'bar', tags: ['vg','alcohol'] },
    { id: 'co5', cat: 'cocktails', name: 'Cocktail Maison', desc: 'Barman selection',     price: 3000, icon: 'wine-outline',  tint: T.purple,station: 'bar', tags: ['vg','alcohol'] },
    { id: 'co6', cat: 'cocktails', name: 'Foléré Mocktail', desc: 'No alcohol, mint',     price: 1500, icon: 'water-outline', tint: T.rose,  station: 'bar', tags: ['vg'] },
    // Spirits
    { id: 'sp1', cat: 'spirits', name: 'Whisky Dose',   desc: 'House whisky, 4cl',  price: 1500, icon: 'wine-outline', tint: T.amber, station: 'bar', tags: ['alcohol'] },
    { id: 'sp2', cat: 'spirits', name: 'Gin Tonic',     desc: 'Gin, tonic, lime',   price: 2000, icon: 'wine-outline', tint: T.blue,  station: 'bar', tags: ['vg','gf','alcohol'] },
    { id: 'sp3', cat: 'spirits', name: 'Vodka Soda',    desc: 'Vodka, soda, 4cl',   price: 1800, icon: 'wine-outline', tint: T.slate, station: 'bar', tags: ['vg','gf','alcohol'] },
    { id: 'sp4', cat: 'spirits', name: 'Rhum Coca',     desc: 'Dark rum, cola',     price: 1800, icon: 'wine-outline', tint: T.oak,   station: 'bar', tags: ['vg','alcohol'] },
    // Shots
    { id: 'sh1', cat: 'shots', name: 'Whisky Shot', desc: 'Ice cold, 2cl',       price: 1000, icon: 'flask-outline', tint: T.amber, station: 'bar', tags: ['alcohol'] },
    { id: 'sh2', cat: 'shots', name: 'Anisette',    desc: 'Aniseed liqueur',     price: 1000, icon: 'flask-outline', tint: T.ink,   station: 'bar', tags: ['alcohol'] },
    { id: 'sh3', cat: 'shots', name: 'Liqueur Café',desc: 'Coffee liqueur',      price: 1200, icon: 'cafe-outline',  tint: T.oak,   station: 'bar', tags: ['alcohol'] },
    // Snacks (go to kitchen)
    { id: 'sn1', cat: 'snacks', name: 'Soya Bœuf',      desc: '4 skewers, piment',  price: 1500, icon: 'flame-outline',     tint: T.coral, station: 'grill', tags: ['spicy'] },
    { id: 'sn2', cat: 'snacks', name: 'Plantain Chips', desc: 'Crisp, salted',      price: 700,  icon: 'nutrition-outline', tint: T.gold,  station: 'fry',   tags: ['vg'] },
    { id: 'sn3', cat: 'snacks', name: 'Arachides',      desc: 'Roasted groundnuts', price: 500,  icon: 'ellipse-outline',   tint: T.oak,   station: 'cold',  tags: ['vg','gf','nuts'] },
    { id: 'sn4', cat: 'snacks', name: 'Gésier Bar',      desc: '6 pc, onion sauce',  price: 2000, icon: 'flame-outline',     tint: T.ink,   station: 'grill', tags: ['spicy'] },
    { id: 'sn5', cat: 'snacks', name: 'Maquereau Bar',   desc: 'Braisé, piment',     price: 3000, icon: 'fish-outline',      tint: T.blue,  station: 'pizza', tags: ['spicy','gf'] },
  ],

  /* ---------------- RETAIL (furniture — original Koomzo catalogue) ---------------- */
  retail: [
    { id: 'd1', cat: 'desks',   name: 'Corner Desk Left Sit',  desc: 'L-shape, oak finish',    price: 35000,   unit: true,  icon: 'desktop-outline',  tint: T.oak,   station: 'none', tags: [] },
    { id: 'd2', cat: 'desks',   name: 'Corner Desk Right Sit', desc: 'L-shape, oak finish',    price: 61000,  unit: true,  icon: 'desktop-outline',  tint: T.oak,   station: 'none', tags: [] },
    { id: 'd3', cat: 'desks',   name: 'Customizable Desk',     desc: 'Steel legs, white top',  price: 310500,  icon: 'browsers-outline', tint: T.slate, station: 'none', tags: [] },
    { id: 'd4', cat: 'desks',   name: 'Four Person Desk',      desc: 'Shared bench, 4 seats',  price: 973000, icon: 'grid-outline',     tint: T.slate, station: 'none', tags: [] },
    { id: 'd5', cat: 'desks',   name: 'Large Desk',            desc: 'Adjustable, walnut top', price: 745000, icon: 'tablet-landscape-outline', tint: T.oak, station: 'none', tags: [] },
    { id: 'd6', cat: 'desks',   name: 'Desk Combination',      desc: 'Modular, two units',     price: 186500,  icon: 'apps-outline',     tint: T.purple,station: 'none', tags: [] },
    { id: 's1', cat: 'storage', name: 'Large Cabinet',         desc: '4 doors, matte black',   price: 132500,  unit: true,  icon: 'file-tray-stacked-outline', tint: T.ink, station: 'none', tags: [] },
    { id: 's2', cat: 'storage', name: 'Cabinet with Doors',    desc: 'Oak, soft-close hinges', price: 58000,  icon: 'file-tray-full-outline',    tint: T.oak, station: 'none', tags: [] },
    { id: 's3', cat: 'storage', name: 'Drawer Black',          desc: '3-drawer pedestal',      price: 10500,   icon: 'albums-outline',            tint: T.ink, station: 'none', tags: [] },
    { id: 's4', cat: 'storage', name: 'Storage Box',           desc: 'Stackable, navy',        price: 6500,   unit: true,  icon: 'cube-outline',         tint: T.blue, station: 'none', tags: [] },
    { id: 's6', cat: 'storage', name: 'Pedal Bin',             desc: '12L, brushed steel',     price: 19500,   icon: 'trash-outline',             tint: T.slate, station: 'none', tags: [] },
    { id: 'l1', cat: 'light',   name: 'LED Lamp',              desc: 'Dimmable, warm white',   price: 7500,   unit: true,  icon: 'bulb-outline',     tint: T.amber, station: 'none', tags: [] },
    { id: 'l2', cat: 'light',   name: 'Office Lamp',           desc: 'Articulated arm, black', price: 16500,   icon: 'flash-outline',    tint: T.amber, station: 'none', tags: [] },
    { id: 'o1', cat: 'office',  name: 'Desk Organizer',        desc: 'Felt-lined, 5 slots',    price: 5500,   unit: true,  icon: 'grid-outline',     tint: T.purple, station: 'none', tags: [] },
    { id: 'o2', cat: 'office',  name: 'Letter Tray',           desc: 'Mesh, stackable',        price: 4500,   unit: true,  icon: 'file-tray-outline',tint: T.purple, station: 'none', tags: [] },
    { id: 'o3', cat: 'office',  name: 'Whiteboard Pen 4pk',    desc: 'Assorted colours',       price: 3000,    unit: true,  icon: 'create-outline',   tint: T.green, station: 'none', tags: [] },
    { id: 'm1', cat: 'misc',    name: 'Acoustic Bloc Screen',  desc: 'Felt divider, grey',     price: 122000,  icon: 'easel-outline',    tint: T.slate, station: 'none', tags: [] },
    { id: 'm4', cat: 'misc',    name: 'Cable Tray',            desc: 'Under-desk, steel',      price: 4500,   unit: true,  icon: 'git-merge-outline',tint: T.slate, station: 'none', tags: [] },
  ],
};

/* ============================================================
   VERTICAL CONFIG
   ============================================================ */
window.RK_VERTICALS = {
  restaurant: {
    id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline',
    categories: [
      { id: 'starters', label: 'Starters', icon: 'leaf-outline' },
      { id: 'mains',    label: 'Mains',    icon: 'restaurant-outline' },
      { id: 'grills',   label: 'Grills',   icon: 'flame-outline' },
      { id: 'sides',    label: 'Sides',    icon: 'fast-food-outline' },
      { id: 'desserts', label: 'Desserts', icon: 'ice-cream-outline' },
      { id: 'drinks',   label: 'Drinks',   icon: 'cafe-outline' },
    ],
    flags: { tables: true, courses: true, kitchen: true, guests: true, tabs: false, loyalty: true },
    unitWord: '', serviceDefault: 'dine-in',
  },
  bar: {
    id: 'bar', label: 'Bar', icon: 'wine-outline',
    categories: [
      { id: 'beer',      label: 'Beer',      icon: 'beer-outline' },
      { id: 'wine',      label: 'Wine',      icon: 'wine-outline' },
      { id: 'cocktails', label: 'Cocktails', icon: 'wine-outline' },
      { id: 'spirits',   label: 'Spirits',   icon: 'flask-outline' },
      { id: 'shots',     label: 'Shots',     icon: 'flask-outline' },
      { id: 'snacks',    label: 'Snacks',    icon: 'fast-food-outline' },
    ],
    flags: { tables: true, courses: false, kitchen: true, guests: false, tabs: true, loyalty: false },
    unitWord: '', serviceDefault: 'tab',
  },
  retail: {
    id: 'retail', label: 'Retail', icon: 'pricetags-outline',
    categories: [
      { id: 'desks',   label: 'Desks',   icon: 'desktop-outline' },
      { id: 'storage', label: 'Storage', icon: 'file-tray-stacked-outline' },
      { id: 'light',   label: 'Lighting',icon: 'bulb-outline' },
      { id: 'office',  label: 'Office',  icon: 'reader-outline' },
      { id: 'misc',    label: 'Misc',    icon: 'cube-outline' },
    ],
    flags: { tables: false, courses: false, kitchen: false, guests: false, tabs: false, loyalty: true },
    unitWord: 'Units', serviceDefault: 'retail',
  },
};

/* ============================================================
   FLOORS & TABLES  (x/y are % positions in the plan canvas)
   shape: square | round | rect | stool ; seats = capacity
   ============================================================ */
window.RK_FLOORS = [
  {
    id: 'main', label: 'Main Floor',
    tables: [
      { id: 'T1',  label: '1',  seats: 2, shape: 'square', x: 12, y: 20 },
      { id: 'T2',  label: '2',  seats: 4, shape: 'square', x: 30, y: 20 },
      { id: 'T3',  label: '3',  seats: 4, shape: 'square', x: 48, y: 20 },
      { id: 'T4',  label: '4',  seats: 2, shape: 'square', x: 66, y: 20 },
      { id: 'T5',  label: '5',  seats: 6, shape: 'rect',   x: 84, y: 22 },
      { id: 'T6',  label: '6',  seats: 4, shape: 'round',  x: 14, y: 58 },
      { id: 'T7',  label: '7',  seats: 4, shape: 'square', x: 32, y: 58 },
      { id: 'T8',  label: '8',  seats: 2, shape: 'square', x: 50, y: 58 },
      { id: 'T11', label: '11', seats: 8, shape: 'round',  x: 72, y: 60 },
    ],
  },
  {
    id: 'patio', label: 'Patio',
    tables: [
      { id: 'P1', label: '21', seats: 2, shape: 'round',  x: 16, y: 26 },
      { id: 'P2', label: '22', seats: 2, shape: 'round',  x: 38, y: 26 },
      { id: 'P3', label: '23', seats: 4, shape: 'square', x: 62, y: 24 },
      { id: 'P4', label: '24', seats: 4, shape: 'square', x: 82, y: 24 },
      { id: 'P5', label: '25', seats: 6, shape: 'rect',   x: 30, y: 64 },
      { id: 'P6', label: '26', seats: 4, shape: 'round',  x: 64, y: 64 },
    ],
  },
  {
    id: 'barfloor', label: 'Bar',
    tables: [
      { id: 'B1', label: 'S1', seats: 1, shape: 'stool', x: 16, y: 22 },
      { id: 'B2', label: 'S2', seats: 1, shape: 'stool', x: 30, y: 22 },
      { id: 'B3', label: 'S3', seats: 1, shape: 'stool', x: 44, y: 22 },
      { id: 'B4', label: 'S4', seats: 1, shape: 'stool', x: 58, y: 22 },
      { id: 'B5', label: 'S5', seats: 1, shape: 'stool', x: 72, y: 22 },
      { id: 'B6', label: 'H1', seats: 4, shape: 'rect',  x: 22, y: 62 },
      { id: 'B7', label: 'H2', seats: 4, shape: 'rect',  x: 56, y: 62 },
      { id: 'B8', label: 'L1', seats: 6, shape: 'round', x: 84, y: 60 },
    ],
  },
];

/* ============================================================
   SEED KITCHEN TICKETS — pre-loaded so the KDS looks live.
   firedMin = minutes ago the ticket was fired (drives SLA color)
   status: cook | ready | done
   ============================================================ */
window.RK_SEED_TICKETS = [
  { table: 'T5',  no: 803, floor: 'main',  server: 'Anita N.',    guests: 2, firedMin: 13, status: 'cook',
    items: [ { name: 'Poisson Braisé', qty: 1, station: 'pizza', tags: ['spicy'] }, { name: 'Plantain Frit', qty: 2, station: 'fry' }, { name: 'Piment Vert', qty: 1, station: 'cold' } ] },
  { table: 'T6',  no: 810, floor: 'main',  server: 'Blaise M.',   guests: 3, firedMin: 12, status: 'cook',
    items: [ { name: 'Ndolé Crevettes', qty: 2, station: 'pasta', tags: ['shellfish'] }, { name: 'Bâton de Manioc', qty: 2, station: 'cold' }, { name: 'Sanga', qty: 1, station: 'pasta', tags: ['vg'] } ] },
  { table: 'T12', no: 802, floor: 'main',  server: 'Anita N.',    guests: 1, firedMin: 4,  status: 'cook',
    items: [ { name: 'Poulet DG', qty: 1, station: 'grill' } ] },
  { table: 'T7',  no: 812, floor: 'main',  server: 'Sandrine A.', guests: 4, firedMin: 2,  status: 'cook',
    items: [ { name: 'Achu Yellow Soup', qty: 2, station: 'pasta', tags: ['spicy'] }, { name: 'Eru & Water Fufu', qty: 1, station: 'pasta' }, { name: 'Gésier Grillé', qty: 1, station: 'grill', tags: ['spicy'] } ] },
  { table: 'P5',  no: 811, floor: 'patio', server: 'Blaise M.',   guests: 4, firedMin: 2,  status: 'cook',
    items: [ { name: 'Poulet Braisé ½', qty: 2, station: 'pizza', notes: 'Extra piment', tags: [] }, { name: 'Frites', qty: 2, station: 'fry' }, { name: 'Okok & Bobolo', qty: 1, station: 'pasta' } ] },
  { table: 'T2',  no: 809, floor: 'main',  server: 'Sandrine A.', guests: 4, firedMin: 6,  status: 'ready',
    items: [ { name: 'Jollof Poulet', qty: 2, station: 'grill', tags: ['spicy'] }, { name: 'Brochettes Bœuf', qty: 3, station: 'grill' } ] },
  { table: 'T13', no: 808, floor: 'patio', server: 'Anita N.',    guests: 1, firedMin: 8,  status: 'ready',
    items: [ { name: 'Riz Sauté Poulet', qty: 1, station: 'grill' }, { name: 'Salade Avocat', qty: 1, station: 'cold', tags: ['vg'] } ] },
  { table: 'B6',  no: 815, floor: 'barfloor', server: 'Eric F.',  guests: 2, firedMin: 3,  status: 'ready',
    items: [ { name: 'Soya Bœuf', qty: 2, station: 'grill', tags: ['spicy'] }, { name: 'Plantain Chips', qty: 2, station: 'fry' } ] },
  { table: 'T4',  no: 806, floor: 'main',  server: 'Blaise M.',   guests: 2, firedMin: 16, status: 'done',
    items: [ { name: 'Salade de Fruits', qty: 2, station: 'dessert', tags: ['vg'] } ] },
];

/* ============================================================
   STAFF (for register cashier + KDS attribution)
   ============================================================ */
window.RK_STAFF = [
  { id: 'anita',    name: 'Anita Ndongo',    short: 'Anita N.' },
  { id: 'blaise',   name: 'Blaise Mbarga',   short: 'Blaise M.' },
  { id: 'sandrine', name: 'Sandrine Ateba',  short: 'Sandrine A.' },
  { id: 'eric',     name: 'Eric Fotso',      short: 'Eric F.' },
];

/* helper: find product across all menus by name (KDS/floor lookups) */
window.RK_findByName = (name) => {
  for (const v of Object.keys(window.RK_MENU)) {
    const hit = window.RK_MENU[v].find((p) => p.name === name);
    if (hit) return hit;
  }
  return null;
};
