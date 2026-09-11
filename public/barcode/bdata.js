/* Koomzo POS — Barcode Labels module dataset
   Drives the label-design + print-items flow. Reuses the Products catalogue
   (KZ_PA_PRODUCTS from ../padmin/pdata.js) as the item source, and adds:
     • symbologies   — barcode formats the editor can emit
     • attributes    — item fields you can drop onto a label
     • presets       — ready-made label layouts (the template strip)
     • paper presets — label-sheet + thermal stock the printer feeds
   No image dependency: barcodes are rendered live with JsBarcode / QR. */

/* ---- barcode symbologies (label → JsBarcode format) ---- */
window.BC_SYMBOLOGIES = [
  { label: 'Code 128', fmt: 'CODE128' },
  { label: 'Code 39',  fmt: 'CODE39' },
  { label: 'EAN-13',   fmt: 'EAN13' },
  { label: 'UPC-A',    fmt: 'UPC' },
  { label: 'ITF-14',   fmt: 'ITF14' },
];

/* ---- droppable item attributes (chips in Label Details) ---- */
window.BC_ATTRS = [
  { key: 'name',  label: 'Name' },
  { key: 'sku',   label: 'SKU' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'cost',  label: 'Unit Cost' },
  { key: 'price', label: 'Selling Price' },
  { key: 'type',  label: 'Type' },
  { key: 'brand', label: 'Brand' },
];

/* ---- layout presets for the thumbnail strip ----
   each preset is a partial template merged onto the editor draft.
   kind: 'barcode' | 'qr'   header/footerL/footerR: attr key or null */
window.BC_PRESETS = {
  barcode: [
    { id: 'bc-num',        kind: 'barcode', header: null,   showNumber: true,  footerL: null,    footerR: null,    label: 'Barcode + number' },
    { id: 'bc-name-num',   kind: 'barcode', header: 'name', showNumber: true,  footerL: null,    footerR: null,    label: 'Name on top' },
    { id: 'bc-price',      kind: 'barcode', header: 'name', showNumber: true,  footerL: 'price', footerR: null,    label: 'Price + barcode' },
    { id: 'bc-price-num',  kind: 'barcode', header: 'name', showNumber: false, footerL: 'price', footerR: 'barcode', label: 'Price · number' },
    { id: 'bc-full',       kind: 'barcode', header: 'name', showNumber: true,  footerL: 'price', footerR: 'sku',   label: 'Full ticket' },
  ],
  qr: [
    { id: 'qr-name',  kind: 'qr', header: 'name', showNumber: true,  footerL: null,    footerR: null, label: 'QR + name' },
    { id: 'qr-price', kind: 'qr', header: 'name', showNumber: false, footerL: 'price', footerR: null, label: 'QR + price' },
    { id: 'qr-sku',   kind: 'qr', header: 'name', showNumber: false, footerL: 'sku',   footerR: null, label: 'QR + SKU' },
  ],
  text: [
    { id: 'tx-name-price', kind: 'text', header: 'name', showNumber: false, footerL: 'price', footerR: 'sku', label: 'Name + price' },
    { id: 'tx-shelf',      kind: 'text', header: 'name', showNumber: false, footerL: 'price', footerR: null,  label: 'Shelf tag' },
  ],
};

/* ---- paper / stock presets ----
   sheet  = full A4/Letter grid of die-cut labels
   thermal = single label fed from a roll  */
window.BC_PAPER_SHEETS = [
  { id: 'formtec-3100', name: 'Formtec 3100', w: 63.5, h: 38.1, cols: 3, rows: 7,  per: 21 },
  { id: 'avery-5160',   name: 'Avery 5160',   w: 66.7, h: 25.4, cols: 3, rows: 10, per: 30 },
  { id: 'avery-5163',   name: 'Avery 5163',   w: 101.6, h: 50.8, cols: 2, rows: 5,  per: 10 },
];
window.BC_PAPER_THERMAL = [
  { id: 'th-50-30', name: 'Thermal 50 × 30', w: 50, h: 30 },
  { id: 'th-40-30', name: 'Thermal 40 × 30', w: 40, h: 30 },
  { id: 'th-60-40', name: 'Thermal 60 × 40', w: 60, h: 40 },
];

/* default paper assigned to a fresh template */
window.BC_DEFAULT_PAPER = { type: 'sheet', name: 'Formtec 3100', w: 63.5, h: 38.1, cols: 3, rows: 7, per: 21, sheetId: 'formtec-3100' };

/* ---- a seeded template so Print Items opens populated ---- */
window.BC_SEED_TEMPLATE = {
  id: 'tpl-1',
  name: 'Shelf price tag',
  kind: 'barcode',
  symbology: 'Code 128',
  header: 'name',
  showNumber: false,
  footerL: 'price',
  footerR: 'barcode',
  fontSize: 11,
  bold: true,
  align: 'center',
  paper: { type: 'sheet', name: 'Formtec 3100', w: 63.5, h: 38.1, cols: 3, rows: 7, per: 21, sheetId: 'formtec-3100' },
};

/* sample item used in editor previews when no real item chosen */
window.BC_SAMPLE_ITEM = {
  id: 'sample', name: 'Body Lotion', desc: 'Moisturising, 400ml',
  sku: 'SKU-NERB96H3', barcode: '2005002205437', cost: 5500, price: 7500,
  brand: 'Velour', type: 'Lotion',
};

window.bcMoney = (n) => window.KZ_LOCALE.short(n);

/* resolve an attribute key → display string for a given item */
window.bcAttrValue = function (item, key) {
  if (!key) return '';
  if (key === 'price' || key === 'cost') return window.bcMoney(item[key]);
  return String(item[key] != null ? item[key] : '');
};
