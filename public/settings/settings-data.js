/* Koomzo POS — Settings dataset
   Profile, section metadata, option lists, and the default settings state.
   Defaults are Cameroonian: XAF with no minor unit, TVA 19,25 %, DD/MM/YYYY,
   +237 numbers, and mobile money ahead of cards in the tender list. */

window.KZ_SET_PROFILE = {
  name: 'Longchi Kanouo',
  email: 'it@koomzo.cm',
  phone: '+237 6 55 41 08 22',
  role: 'Owner',
  store: 'Koomzo · Bonapriso',
  initials: 'LK',
  tint: { bg: '#eeecf8', fg: '#6a61bf' },
};

window.KZ_SET_SECTIONS = [
  { id: 'profile',  label: 'Profile',          icon: 'person-outline',          desc: 'Your account details and how you sign in.' },
  { id: 'general',  label: 'General',          icon: 'options-outline',         desc: 'Language, region, and how dates and times display.' },
  { id: 'store',    label: 'Store',            icon: 'storefront-outline',      desc: 'Business identity, currency, tax, and receipts.' },
  { id: 'payments', label: 'Payments',         icon: 'card-outline',            desc: 'Accepted tenders, mobile money, and cash rounding.' },
  { id: 'notify',   label: 'Notifications',    icon: 'notifications-outline',   desc: 'Choose what Koomzo alerts you about.' },
  { id: 'security', label: 'Security',         icon: 'lock-closed-outline',     desc: 'Passwords, PIN lock, and active sessions.' },
  { id: 'help',     label: 'Help & Feedback',  icon: 'help-buoy-outline',       desc: 'Guides, support, and app information.' },
];

window.KZ_SET_OPTIONS = {
  language:   ['Français', 'English', 'Pidgin', 'Español', 'Português', '中文'],
  region:     ['Cameroun', 'Côte d’Ivoire', 'Sénégal', 'Gabon', 'Nigeria', 'Ghana'],
  timezone:   ['(GMT+01:00) Douala', '(GMT+00:00) Abidjan · Dakar', '(GMT+01:00) Lagos', '(GMT+01:00) Paris', '(GMT+00:00) London'],
  dateFormat: ['DD / MM / YYYY', 'MM / DD / YYYY', 'YYYY-MM-DD'],
  firstDay:   ['Monday', 'Sunday', 'Saturday'],
  currency:   ['Franc CFA (XAF)', 'Franc CFA (XOF)', 'Naira (NGN)', 'Cedi (GHS)', 'Euro (EUR)', 'US Dollar (USD)'],
  /* TVA is national. 19,25 % is the standard rate; 0 % is for exempt lines. */
  taxRate:    ['0,0 %', '19,25 %'],
  taxMode:    ['Added at checkout', 'Included in price'],
  receipt:    ['80mm thermal roll', '58mm thermal roll', 'A4 / Letter', 'Mobile money SMS only'],
  /* the smallest coin in circulation is 5 F, so rounding options are whole francs */
  rounding:   ['None', 'Nearest 5 F', 'Nearest 25 F', 'Nearest 100 F'],
};

/* labels come from KZ_LOCALE.tenderList so a tender is named once platform-wide */
const PAY_SUB = {
  momo: 'Push-to-pay, reference on receipt',
  om:   'Push-to-pay, reference on receipt',
  cash: 'Drawer with change due',
  card: 'Chip and contactless',
};
const PAY_ON = { momo: true, om: true, cash: true, card: false };
window.KZ_SET_PAYMETHODS = window.KZ_LOCALE.tenderList
  .map((t) => ({ id: t.id, label: t.label, sub: PAY_SUB[t.id], icon: t.icon, on: PAY_ON[t.id] }))
  .concat([{ id: 'invoice', label: 'Compte client', sub: 'Charge to an invoice', icon: 'receipt-outline', on: false }]);

window.KZ_SET_DEFAULTS = {
  // general
  language: 'Français', region: 'Cameroun', timezone: '(GMT+01:00) Douala',
  dateFormat: 'DD / MM / YYYY', firstDay: 'Monday', sounds: true,
  // store
  storeName: 'Koomzo · Bonapriso', currency: 'Franc CFA (XAF)', taxRate: '19,25 %',
  taxMode: 'Included in price', receipt: '80mm thermal roll', receiptFooter: 'Merci de votre visite — à bientôt !',
  showLogo: true,
  // payments
  pay_momo: true, pay_om: true, pay_cash: true, pay_card: false, pay_invoice: false,
  tipping: false, rounding: 'Nearest 5 F',
  // notifications
  notif_orders: true, notif_lowstock: true, notif_refunds: true,
  notif_summary: false, notif_marketing: false, notif_sound: true,
  // security
  twoFactor: true, pinLock: true, autoLock: '5 minutes',
};
