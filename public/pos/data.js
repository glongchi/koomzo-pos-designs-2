/* Koomzo POS — furniture / general-retail catalogue
   Tiles use iconographic product art (tinted panel + Ionicon) so the
   board renders reliably with no external image dependency. Each product
   carries: id, cat, name, desc, price, icon (ionicon name), tint (wash). */

window.KZ_CATEGORIES = [
  { id: 'desks',   label: 'Desks',          icon: 'desktop-outline' },
  { id: 'storage', label: 'Storage',        icon: 'file-tray-stacked-outline' },
  { id: 'light',   label: 'Lighting',       icon: 'bulb-outline' },
  { id: 'office',  label: 'Office Supplies', icon: 'reader-outline' },
  { id: 'misc',    label: 'Misc',           icon: 'cube-outline' },
];

// tint palette (soft washes that read as product-photo backdrops)
const T = {
  oak:    { bg: '#f1ece2', fg: '#a07d4f' },
  slate:  { bg: '#eceef2', fg: '#5d6573' },
  ink:    { bg: '#e7e8ec', fg: '#3a3f4d' },
  purple: { bg: '#eeecf8', fg: '#6a61bf' },
  green:  { bg: '#e4f4ea', fg: '#2e9e5b' },
  blue:   { bg: '#e8f0fd', fg: '#528cef' },
  amber:  { bg: '#fbf2dd', fg: '#c98a20' },
  coral:  { bg: '#fdeae4', fg: '#ec603a' },
};

window.KZ_PRODUCTS = [
  // ----- Desks -----
  { id: 'd1',  cat: 'desks',   name: 'Corner Desk Left Sit',  desc: 'L-shape, oak finish',      price: 35000,   unit: true,  icon: 'desktop-outline',  tint: T.oak },
  { id: 'd2',  cat: 'desks',   name: 'Corner Desk Right Sit', desc: 'L-shape, oak finish',      price: 61000,  unit: true,  icon: 'desktop-outline',  tint: T.oak },
  { id: 'd3',  cat: 'desks',   name: 'Customizable Desk',     desc: 'Steel legs, white top',    price: 310500,  unit: false, icon: 'browsers-outline', tint: T.slate },
  { id: 'd4',  cat: 'desks',   name: 'Four Person Desk',      desc: 'Shared bench, 4 seats',    price: 973000, unit: false, icon: 'grid-outline',     tint: T.slate },
  { id: 'd5',  cat: 'desks',   name: 'Large Desk',            desc: 'Adjustable, walnut top',   price: 745000, unit: false, icon: 'tablet-landscape-outline', tint: T.oak },
  { id: 'd6',  cat: 'desks',   name: 'Desk Combination',      desc: 'Modular, two units',       price: 186500,  unit: false, icon: 'apps-outline',     tint: T.purple },

  // ----- Storage -----
  { id: 's1',  cat: 'storage', name: 'Large Cabinet',         desc: '4 doors, matte black',     price: 132500,  unit: true,  icon: 'file-tray-stacked-outline', tint: T.ink },
  { id: 's2',  cat: 'storage', name: 'Cabinet with Doors',    desc: 'Oak, soft-close hinges',   price: 58000,  unit: false, icon: 'file-tray-full-outline',    tint: T.oak },
  { id: 's3',  cat: 'storage', name: 'Drawer Black',          desc: '3-drawer pedestal',        price: 10500,   unit: false, icon: 'albums-outline',            tint: T.ink },
  { id: 's4',  cat: 'storage', name: 'Storage Box',           desc: 'Stackable, navy',          price: 6500,   unit: true,  icon: 'cube-outline',              tint: T.blue },
  { id: 's5',  cat: 'storage', name: 'Small Shelf',           desc: '3-tier, beech',            price: 1000,    unit: true,  icon: 'reorder-four-outline',      tint: T.oak },
  { id: 's6',  cat: 'storage', name: 'Pedal Bin',             desc: '12L, brushed steel',       price: 19500,   unit: false, icon: 'trash-outline',             tint: T.slate },
  { id: 's7',  cat: 'storage', name: 'Newspaper Rack',        desc: 'Wall-mount, chrome',       price: 500,    unit: true,  icon: 'newspaper-outline',         tint: T.slate },

  // ----- Lighting -----
  { id: 'l1',  cat: 'light',   name: 'LED Lamp',              desc: 'Dimmable, warm white',     price: 375,    unit: true,  icon: 'bulb-outline',     tint: T.amber },
  { id: 'l2',  cat: 'light',   name: 'Office Lamp',           desc: 'Articulated arm, black',   price: 16500,   unit: false, icon: 'flash-outline',    tint: T.amber },

  // ----- Office Supplies -----
  { id: 'o1',  cat: 'office',  name: 'Desk Organizer',        desc: 'Felt-lined, 5 slots',      price: 1800,    unit: true,  icon: 'grid-outline',         tint: T.purple },
  { id: 'o2',  cat: 'office',  name: 'Letter Tray',           desc: 'Mesh, stackable',          price: 2000,    unit: true,  icon: 'file-tray-outline',    tint: T.purple },
  { id: 'o3',  cat: 'office',  name: 'Whiteboard Pen',        desc: 'Pack of 4, assorted',      price: 500,    unit: true,  icon: 'create-outline',       tint: T.green },
  { id: 'o4',  cat: 'office',  name: 'Monitor Stand',         desc: 'Riser, bamboo',            price: 1300,    unit: true,  icon: 'tv-outline',           tint: T.oak },

  // ----- Misc -----
  { id: 'm1',  cat: 'misc',    name: 'Acoustic Bloc Screens', desc: 'Felt divider, grey',       price: 122000,  unit: false, icon: 'easel-outline',     tint: T.slate },
  { id: 'm2',  cat: 'misc',    name: 'Flipover',              desc: 'Mobile flip chart',        price: 807500, unit: false, icon: 'easel-outline',     tint: T.ink },
  { id: 'm3',  cat: 'misc',    name: 'Drawer Black Plus',     desc: 'Wide, lockable',           price: 10500,   unit: false, icon: 'albums-outline',    tint: T.ink },
  { id: 'm4',  cat: 'misc',    name: 'Cable Tray',            desc: 'Under-desk, steel',        price: 4500,   unit: true,  icon: 'git-merge-outline', tint: T.slate },
];
