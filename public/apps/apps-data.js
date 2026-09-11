/* Koomzo POS — Apps & Modules catalogue
   The "Choose your apps" marketplace: a POS admin turns store modules on/off.
   Each app carries iconographic art (tinted tile + Ionicon) so the board
   renders with zero image dependency, exactly like the POS catalogue tiles.
   Apps belong to one category; `installed` apps seed the active baseline. */

// shared tint vocabulary (same washes as POS tiles / role chips)
const AT = {
  purple: { bg: '#eeecf8', fg: '#6a61bf' },
  indigo: { bg: '#ececfb', fg: '#4b4ad9' },
  blue:   { bg: '#e8f0fd', fg: '#3f78c9' },
  green:  { bg: '#e4f4ea', fg: '#23824a' },
  amber:  { bg: '#fbf2dd', fg: '#a9781b' },
  oak:    { bg: '#f1ece2', fg: '#9a7647' },
  coral:  { bg: '#fdeae4', fg: '#cc4b27' },
  slate:  { bg: '#eceef2', fg: '#5d6573' },
};

window.KZ_APP_CATEGORIES = [
  { id: 'pos',     label: 'Point of Sale',       icon: 'storefront-outline',    blurb: 'How you ring up and serve customers' },
  { id: 'catalog', label: 'Catalog & Pricing',   icon: 'pricetags-outline',     blurb: 'Products, discounts, and what they cost' },
  { id: 'stock',   label: 'Inventory',           icon: 'cube-outline',          blurb: 'Stock on hand, suppliers, and movement' },
  { id: 'crm',     label: 'Customers & Marketing', icon: 'people-outline',      blurb: 'Loyalty, outreach, and bookings' },
  { id: 'finance', label: 'Payments & Finance',  icon: 'card-outline',          blurb: 'Tendering, receipts, and the books' },
  { id: 'team',    label: 'Team & Insights',     icon: 'bar-chart-outline',     blurb: 'Staff, shifts, and reporting' },
];

// app rows. status: 'installed' = on by default. flag: 'popular' | 'new' | null.
// price: null = included in plan; number = monthly add-on per register.
window.KZ_APPS = [
  /* ---- Point of Sale ---- */
  { id: 'register',  cat: 'pos', name: 'Register',          tag: 'Checkout',     desc: 'The core cashier board — cart, tender, and receipts.', icon: 'cart-outline',            tint: AT.purple, status: 'installed', flag: null,      price: null, core: true,
    long: 'The heart of Koomzo — a fast two-pane register with a product catalogue and a live order ticket. Always on.',
    feats: ['Two-pane catalogue + order ticket', 'Split, hold, and merge tickets', 'Cash, card, and split tender', 'Printed & emailed receipts'] },
  { id: 'restaurant',cat: 'pos', name: 'Restaurant & Bar',  tag: 'Hospitality',  desc: 'Floor plan, courses, and a kitchen display.', icon: 'restaurant-outline',     tint: AT.coral,  status: 'installed', flag: null,      price: 5000,
    long: 'Turn the register into a table-service board: assign seats, fire courses, and route tickets to the kitchen.',
    feats: ['Drag-and-drop floor plan', 'Course firing & seat numbers', 'Kitchen display screens', 'Tab transfers between staff'] },
  { id: 'selfcheck', cat: 'pos', name: 'Self-Checkout',     tag: 'Kiosk',        desc: 'Let customers scan and pay on a kiosk.', icon: 'scan-outline',           tint: AT.blue,   status: 'available', flag: 'new',     price: 7500,
    long: 'A locked-down kiosk mode for unattended lanes — customers scan, bag, and pay without a cashier.',
    feats: ['Guided scan & bag flow', 'Attendant approval prompts', 'Idle-screen branding', 'Receipt or no-receipt option'] },
  { id: 'loyalty',   cat: 'pos', name: 'Loyalty & Rewards', tag: 'Retention',    desc: 'Points, tiers, and member pricing.', icon: 'ribbon-outline',         tint: AT.amber,  status: 'available', flag: 'popular', price: 3500,
    long: 'Reward repeat customers with points, tiers, and member-only pricing applied right at the register.',
    feats: ['Points per dollar or per visit', 'Tiered member pricing', 'Birthday & welcome rewards', 'Balance shown on the ticket'] },

  /* ---- Catalog & Pricing ---- */
  { id: 'products',  cat: 'catalog', name: 'Products',      tag: 'Catalog',      desc: 'Items, variants, units, and barcodes.', icon: 'pricetags-outline',   tint: AT.indigo, status: 'installed', flag: null,      price: null, core: true,
    long: 'The product catalogue behind every sale — variants, units of measure, and per-item tax.',
    feats: ['Variants & modifiers', 'Weight & volume units', 'Per-item tax rules', 'Bulk CSV import'] },
  { id: 'discounts', cat: 'catalog', name: 'Discounts & Promos', tag: 'Pricing', desc: 'Coupons, happy hours, and bundle deals.', icon: 'pricetag-outline',    tint: AT.coral,  status: 'installed', flag: null,      price: null,
    long: 'Build pricing rules that fire automatically — percentage off, BOGO, time-boxed happy hours, and coupon codes.',
    feats: ['Automatic & coded discounts', 'Happy-hour scheduling', 'Buy-one-get-one rules', 'Stacking limits'] },
  { id: 'giftcards', cat: 'catalog', name: 'Gift Cards',    tag: 'Stored value', desc: 'Issue, reload, and redeem gift cards.', icon: 'card-outline',         tint: AT.green,  status: 'available', flag: null,      price: 2500,
    long: 'Sell physical or digital gift cards, track balances, and redeem them as tender at the register.',
    feats: ['Physical & e-gift cards', 'Reload & partial redeem', 'Balance lookup at till', 'Expiry & breakage reports'] },
  { id: 'combos',    cat: 'catalog', name: 'Combos & Menus', tag: 'Bundles',     desc: 'Group items into set menus and meal deals.', icon: 'layers-outline',     tint: AT.oak,    status: 'available', flag: null,      price: null,
    long: 'Bundle products into combos and set menus with choices, so staff add a whole meal in one tap.',
    feats: ['Choice groups & swaps', 'Set-menu pricing', 'Upsell prompts', 'Per-component reporting'] },

  /* ---- Inventory ---- */
  { id: 'stock',     cat: 'stock', name: 'Stock',           tag: 'Inventory',    desc: 'On-hand counts, reorder points, alerts.', icon: 'cube-outline',         tint: AT.indigo, status: 'installed', flag: null,      price: null,
    long: 'Track on-hand quantity per location with reorder points and low-stock alerts on the catalogue.',
    feats: ['Per-location on-hand', 'Reorder-point alerts', 'Stock counts & adjustments', 'Sell-through reporting'] },
  { id: 'purchasing',cat: 'stock', name: 'Purchasing',      tag: 'Suppliers',    desc: 'Suppliers and purchase orders.', icon: 'document-text-outline',     tint: AT.amber,  status: 'available', flag: null,      price: 3000,
    long: 'Manage suppliers, raise purchase orders, and receive stock straight into inventory.',
    feats: ['Supplier directory', 'Purchase orders & receiving', 'Cost & lead-time tracking', 'Auto-PO from reorder points'] },
  { id: 'barcode',   cat: 'stock', name: 'Barcode',         tag: 'Scanning',     desc: 'Scan to sell, receive, and count.', icon: 'barcode-outline',          tint: AT.slate,  status: 'available', flag: 'popular', price: null,
    long: 'Use any USB or Bluetooth scanner to ring up, receive, and count stock by barcode.',
    feats: ['USB & Bluetooth scanners', 'Scan-to-sell & scan-to-receive', 'Label printing', 'Inventory count mode'] },
  { id: 'transfers', cat: 'stock', name: 'Transfers',       tag: 'Multi-store',  desc: 'Move stock between your locations.', icon: 'swap-horizontal-outline', tint: AT.blue,   status: 'available', flag: null,      price: 3000,
    long: 'Request and ship stock between stores and warehouses with full transfer history.',
    feats: ['Store-to-store requests', 'In-transit tracking', 'Receive with discrepancies', 'Transfer history'] },

  /* ---- Customers & Marketing ---- */
  { id: 'customers', cat: 'crm', name: 'Customers',         tag: 'CRM',          desc: 'Profiles, purchase history, and notes.', icon: 'people-outline',        tint: AT.purple, status: 'installed', flag: null,      price: null,
    long: 'Build customer profiles with purchase history, contact details, and staff notes attached to every ticket.',
    feats: ['Profiles & purchase history', 'Tags & staff notes', 'House accounts', 'Marketing consent'] },
  { id: 'appointments', cat: 'crm', name: 'Appointments',   tag: 'Booking',      desc: 'Bookings calendar tied to the register.', icon: 'calendar-outline',     tint: AT.indigo, status: 'available', flag: null,      price: 3500,
    long: 'Take bookings for services and tables, then check guests in and ring them up from the same calendar.',
    feats: ['Online & in-store booking', 'Staff & resource calendars', 'Reminders & no-show tracking', 'Check-in to ticket'] },
  { id: 'email',     cat: 'crm', name: 'Email Marketing',   tag: 'Outreach',     desc: 'Campaigns from your customer list.', icon: 'mail-outline',            tint: AT.blue,   status: 'available', flag: null,      price: 5500,
    long: 'Design and send email campaigns to customer segments built from real purchase behaviour.',
    feats: ['Drag-and-drop builder', 'Behaviour-based segments', 'Automated flows', 'Open & click reporting'] },
  { id: 'sms',       cat: 'crm', name: 'SMS Marketing',     tag: 'Outreach',     desc: 'Text promos and order updates.', icon: 'chatbubble-outline',         tint: AT.green,  status: 'available', flag: 'new',     price: 5500,
    long: 'Reach customers by text — promos, loyalty nudges, and order-ready alerts.',
    feats: ['Bulk & triggered texts', 'Order-ready alerts', 'Opt-in management', 'Delivery reporting'] },

  /* ---- Payments & Finance ---- */
  { id: 'payments',  cat: 'finance', name: 'Payments',      tag: 'Tender',       desc: 'Card terminals and integrated tap-to-pay.', icon: 'card-outline',       tint: AT.green,  status: 'installed', flag: null,      price: null,
    long: 'Connect card terminals or tap-to-pay so payments reconcile against every ticket automatically.',
    feats: ['Integrated card terminals', 'Tap-to-pay on device', 'Split & partial payments', 'Auto-reconciliation'] },
  { id: 'invoicing', cat: 'finance', name: 'Invoicing',     tag: 'Billing',      desc: 'Convert tickets into invoices.', icon: 'receipt-outline',           tint: AT.indigo, status: 'available', flag: null,      price: null,
    long: 'Turn any ticket into a branded invoice with due dates, then track what is paid and outstanding.',
    feats: ['Ticket-to-invoice', 'Due dates & terms', 'Partial payments', 'Aging reports'] },
  { id: 'tips',      cat: 'finance', name: 'Tips & Gratuity', tag: 'Service',    desc: 'Collect, pool, and report tips.', icon: 'cash-outline',             tint: AT.amber,  status: 'available', flag: null,      price: null,
    long: 'Prompt for tips at payment, pool them across staff, and report totals for payroll.',
    feats: ['Tip prompts & presets', 'Pooling & distribution', 'Per-staff totals', 'Payroll export'] },
  { id: 'tax',       cat: 'finance', name: 'Tax & Accounting', tag: 'Books',     desc: 'Tax rates and accounting exports.', icon: 'calculator-outline',      tint: AT.slate,  status: 'available', flag: null,      price: 4000,
    long: 'Define tax rates by location and export clean journals to your accounting software.',
    feats: ['Multi-jurisdiction tax', 'Tax-inclusive pricing', 'Journal exports', 'End-of-day Z reports'] },

  /* ---- Team & Insights ---- */
  { id: 'users',     cat: 'team', name: 'Users & Roles',    tag: 'Access',       desc: 'Staff accounts and role permissions.', icon: 'shield-checkmark-outline', tint: AT.purple, status: 'installed', flag: null,    price: null,
    long: 'Invite staff, assign roles, and control exactly what each person can do at the register.',
    feats: ['Role-based permissions', 'PIN & badge sign-in', 'Per-action approvals', 'Sign-in activity log'] },
  { id: 'shifts',    cat: 'team', name: 'Shifts',           tag: 'Time',         desc: 'Clock in/out and timesheets.', icon: 'time-outline',                tint: AT.oak,    status: 'available', flag: null,      price: 2500,
    long: 'Let staff clock in and out at the till and export timesheets for payroll.',
    feats: ['Clock in/out at the till', 'Break tracking', 'Scheduled shifts', 'Timesheet export'] },
  { id: 'reports',   cat: 'team', name: 'Reports',          tag: 'Analytics',    desc: 'Sales, products, and staff analytics.', icon: 'bar-chart-outline',     tint: AT.blue,   status: 'installed', flag: null,      price: null,
    long: 'See what sells, when, and by whom — live dashboards plus scheduled email summaries.',
    feats: ['Live sales dashboards', 'Product & category trends', 'Staff performance', 'Scheduled email digests'] },
  { id: 'multistore',cat: 'team', name: 'Multi-Store',      tag: 'Scale',        desc: 'Manage many locations as one.', icon: 'business-outline',           tint: AT.indigo, status: 'available', flag: 'popular', price: 6000,
    long: 'Run several stores from one back office with shared catalogue and consolidated reporting.',
    feats: ['Shared catalogue & pricing', 'Per-store overrides', 'Consolidated reporting', 'Central user management'] },
];

window.kz_appsByCat = function (catId) {
  return window.KZ_APPS.filter((a) => a.cat === catId);
};
window.kz_installedIds = function () {
  return window.KZ_APPS.filter((a) => a.status === 'installed').map((a) => a.id);
};
