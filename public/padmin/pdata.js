/* Koomzo POS — Products / Inventory admin dataset
   Mirrors the POS catalogue language: each item carries iconographic art
   (tinted panel + Ionicon) so the admin renders with zero image dependency.
   Inventory fields added on top of the POS shape: sku, barcode, cost, brand,
   type, qty, reorder, locations[]. Stock status is derived (ok / low / out). */

window.KZ_PA_CATEGORIES = [
  { id: 'all',     label: 'All items',  icon: 'apps-outline' },
  { id: 'grocery', label: 'Grocery',    icon: 'basket-outline' },
  { id: 'home',    label: 'Home care',  icon: 'home-outline' },
  { id: 'beauty',  label: 'Beauty',     icon: 'sparkles-outline' },
  { id: 'electro', label: 'Electronics', icon: 'hardware-chip-outline' },
];

// soft washes that read as product-photo backdrops (same vocab as POS tiles)
const PT = {
  amber:  { bg: '#fbf2dd', fg: '#c98a20' },
  oak:    { bg: '#f1ece2', fg: '#a07d4f' },
  slate:  { bg: '#eceef2', fg: '#5d6573' },
  blue:   { bg: '#e8f0fd', fg: '#528cef' },
  green:  { bg: '#e4f4ea', fg: '#2e9e5b' },
  purple: { bg: '#eeecf8', fg: '#6a61bf' },
  coral:  { bg: '#fdeae4', fg: '#ec603a' },
  ink:    { bg: '#e7e8ec', fg: '#3a3f4d' },
};

// raw rows — qty + reorder drive the derived stock status
const RAW = [
  { id: 'p01', cat: 'grocery', name: 'Sunflower Oil 5L',    desc: 'Cooking oil, 5 litre jug',  sku: 'SKU-OIL5L01', barcode: '2005002205437', cost: 2900,  price: 4700, brand: 'Goldseed', type: 'Cooking oil', qty: 80,  reorder: 24, loc: 'Aisle 3 · A2', icon: 'water-outline',        tint: PT.amber },
  { id: 'p02', cat: 'grocery', name: 'Rice Bag 25kg',       desc: 'Long grain white rice',     sku: 'SKU-RICE25K', barcode: '2086218163179', cost: 8000, price: 11000, brand: 'Harvest', type: 'Grains',      qty: 100, reorder: 30, loc: 'Back Room · R1', icon: 'leaf-outline',        tint: PT.oak },
  { id: 'p03', cat: 'home',    name: 'Toilet Paper Pack',   desc: '12 rolls, 3-ply',           sku: 'SKU-TP12PK',  barcode: '2079045649350', cost: 1100,  price: 2000,  brand: 'SoftEsy', type: 'Paper goods', qty: 220, reorder: 40, loc: 'Aisle 5 · C4', icon: 'file-tray-stacked-outline', tint: PT.slate },
  { id: 'p04', cat: 'grocery', name: 'Mineral Water Pack',  desc: '24 × 500ml bottles',        sku: 'SKU-WTR24',   barcode: '2009734394445', cost: 700,  price: 1400,  brand: 'AquaPure', type: 'Beverages',  qty: 300, reorder: 60, loc: 'Aisle 1 · A1', icon: 'water-outline',        tint: PT.blue },
  { id: 'p05', cat: 'grocery', name: 'Sugar 5kg',           desc: 'Refined white sugar',       sku: 'SKU-SGR5KG',  barcode: '2003118827640', cost: 1400,  price: 2500,  brand: 'Harvest', type: 'Baking',      qty: 18,  reorder: 25, loc: 'Aisle 3 · A4', icon: 'cube-outline',         tint: PT.oak },
  { id: 'p06', cat: 'grocery', name: 'Flour 10kg',          desc: 'All-purpose wheat flour',   sku: 'SKU-FLR10K',  barcode: '2007451029388', cost: 2200,  price: 3600, brand: 'Harvest', type: 'Baking',      qty: 120, reorder: 30, loc: 'Aisle 3 · A4', icon: 'cube-outline',         tint: PT.amber },
  { id: 'p07', cat: 'beauty',  name: 'Body Lotion',         desc: 'Moisturising, 400ml',       sku: 'SKU-NERB96H3', barcode: '2005002205437', cost: 5500, price: 7500, brand: 'Velour', type: 'Lotion',      qty: 46,  reorder: 20, loc: 'Aisle 6 · D1', icon: 'flask-outline',        tint: PT.purple },
  { id: 'p08', cat: 'beauty',  name: 'Savon Bar Soap',      desc: 'Hand-milled, 200g',         sku: 'SKU-L9G2DEF7', barcode: '2009734394445', cost: 500,  price: 900,  brand: 'Savonerie', type: 'Soap',     qty: 0,   reorder: 30, loc: 'Aisle 6 · D2', icon: 'ellipse-outline',      tint: PT.green },
  { id: 'p09', cat: 'electro', name: 'Earphone',            desc: 'Wired in-ear, 3.5mm',       sku: 'SKU-I83AA0XU', barcode: '2086218163179', cost: 7000, price: 9000, brand: 'Samsung', type: 'Electronics', qty: 34,  reorder: 12, loc: 'Counter · E1', icon: 'headset-outline',      tint: PT.ink },
  { id: 'p10', cat: 'electro', name: 'Smartphone A14',      desc: '128GB, dual SIM',           sku: 'SKU-OHHH2LVP', barcode: '2079045649350', cost: 72000, price: 99000, brand: 'Samsung', type: 'Electronics', qty: 8, reorder: 6, loc: 'Locked Case · E2', icon: 'phone-portrait-outline', tint: PT.ink },
  { id: 'p11', cat: 'home',    name: 'Dish Soap 1L',        desc: 'Lemon, concentrated',       sku: 'SKU-DSH1L01', barcode: '2004556187722', cost: 800,  price: 1400,  brand: 'SoftEsy', type: 'Cleaning',    qty: 64,  reorder: 24, loc: 'Aisle 5 · C2', icon: 'flask-outline',        tint: PT.green },
  { id: 'p12', cat: 'grocery', name: 'Pasta 1kg',           desc: 'Durum wheat penne',         sku: 'SKU-PAS1KG',  barcode: '2002239948165', cost: 400,  price: 800,  brand: 'Bellino', type: 'Grains',      qty: 14,  reorder: 30, loc: 'Aisle 3 · A3', icon: 'restaurant-outline',   tint: PT.amber },
  { id: 'p13', cat: 'grocery', name: 'Coffee Beans 1kg',    desc: 'Medium roast, whole bean',  sku: 'SKU-COF1KG',  barcode: '2008811276394', cost: 4300, price: 6500, brand: 'Dawn', type: 'Beverages',     qty: 52,  reorder: 18, loc: 'Aisle 1 · A2', icon: 'cafe-outline',         tint: PT.oak },
  { id: 'p14', cat: 'home',    name: 'Trash Bags 50ct',     desc: 'Heavy duty, 50 litre',      sku: 'SKU-TRB50C',  barcode: '2006677451209', cost: 1000,  price: 1800,  brand: 'SoftEsy', type: 'Cleaning',    qty: 0,   reorder: 20, loc: 'Aisle 5 · C5', icon: 'trash-outline',        tint: PT.slate },
  { id: 'p15', cat: 'beauty',  name: 'Shampoo 500ml',       desc: 'Argan oil, sulfate-free',   sku: 'SKU-SHP500',  barcode: '2001993844517', cost: 1600,  price: 2800,  brand: 'Velour', type: 'Hair care',   qty: 38,  reorder: 16, loc: 'Aisle 6 · D3', icon: 'flask-outline',        tint: PT.purple },
  { id: 'p16', cat: 'electro', name: 'USB-C Cable 1m',      desc: 'Fast charge, braided',      sku: 'SKU-USBC1M',  barcode: '2003344091862', cost: 1100,  price: 2300,  brand: 'Anvil', type: 'Accessories',  qty: 9,   reorder: 15, loc: 'Counter · E1', icon: 'git-merge-outline',    tint: PT.blue },
];

function statusOf(qty, reorder) {
  if (qty <= 0) return 'out';
  if (qty <= reorder) return 'low';
  return 'ok';
}

window.KZ_PA_PRODUCTS = RAW.map((r) => ({ ...r, margin: +(r.price - r.cost).toFixed(2), status: statusOf(r.qty, r.reorder) }));

window.KZ_PA_STATUS = {
  ok:  { label: 'In stock', dot: '#2e9e5b', wash: '#e4f4ea', ink: '#1f7d46' },
  low: { label: 'Low stock', dot: '#e0a32e', wash: '#fbf2dd', ink: '#a9781b' },
  out: { label: 'Out of stock', dot: '#ec603a', wash: '#fdeae4', ink: '#c5421f' },
};

window.KZ_PA_BRANDS = [...new Set(RAW.map((r) => r.brand))].sort();
window.KZ_PA_TYPES  = [...new Set(RAW.map((r) => r.type))].sort();
window.KZ_PA_LOCS   = ['Aisle 1 · A1', 'Aisle 1 · A2', 'Aisle 3 · A2', 'Aisle 3 · A3', 'Aisle 3 · A4', 'Aisle 5 · C2', 'Aisle 5 · C4', 'Aisle 5 · C5', 'Aisle 6 · D1', 'Aisle 6 · D2', 'Aisle 6 · D3', 'Back Room · R1', 'Counter · E1', 'Locked Case · E2'];
