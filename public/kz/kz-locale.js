/* Koomzo — locale. Every Koomzo tenant is Cameroonian or West African, so the
   platform has one money format, one tax vocabulary and one phone shape.

   XAF has no minor unit: there are no centimes in circulation, the smallest coin
   is 5 F, and a price with a decimal point is a bug. Everything below rounds to
   a whole franc and groups thousands with a space, the way a local receipt does. */

const KZ_XAF = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

window.KZ_LOCALE = {
  /* 12 500 FCFA — the full form, for totals, invoices and anything printed */
  money: (n) => KZ_XAF(n) + ' FCFA',
  /* 12 500 F — the short form, for dense tables, tiles and signage */
  short: (n) => KZ_XAF(n) + ' F',
  /* bare grouped number, when a column header already says FCFA */
  num: KZ_XAF,
  /* signed, for variances and refunds */
  signed: (n) => (n < 0 ? '−' : '') + KZ_XAF(Math.abs(n)) + ' FCFA',
  int: (n) => KZ_XAF(n),

  /* TVA is national and single-rated; there is no per-city sales tax */
  vat: 19.25,
  vatLabel: 'TVA (19,25 %)',
  /* the tax number a business quotes on an invoice */
  taxIdLabel: 'NIU',

  currency: { code: 'XAF', label: 'Franc CFA (XAF)', symbol: 'FCFA' },
  /* the coins that actually exist, so cash rounding options mean something */
  coins: [5, 10, 25, 50, 100, 500],
  notes: [500, 1000, 2000, 5000, 10000],

  date: 'DD / MM / YYYY',
  /* day before month — never month-first. English short months match the app
     chrome and the Hotel/MRP fixtures; ordering is what actually matters. */
  fmtDate: (iso) => {
    if (!iso) return '—';
    const d = iso instanceof Date ? iso : new Date(String(iso).length <= 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  /* numeric form for dense columns: 18/06/2026 */
  fmtDateNum: (iso) => {
    if (!iso) return '—';
    const d = iso instanceof Date ? iso : new Date(String(iso).length <= 10 ? iso + 'T00:00:00' : iso);
    return isNaN(d) ? '—' : d.toLocaleDateString('en-GB');
  },
  /* 24-hour, the only way a time is written locally */
  fmtTime: (d) => (d instanceof Date ? d : new Date(d)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  fmtDateTime: (iso) => {
    const d = iso instanceof Date ? iso : new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  },
  firstDay: 'Monday',
  timezone: '(GMT+01:00) Afrique de l’Ouest — Douala',
  phonePrefix: '+237',
  phone: (local) => '+237 ' + local,

  /* tenders a Cameroonian counter really takes, in the order it takes them.
     Every register reads this list — none restates it. */
  tenderList: [
    { id: 'momo', label: 'MTN MoMo', icon: 'phone-portrait-outline' },
    { id: 'om', label: 'Orange Money', icon: 'phone-portrait-outline' },
    { id: 'cash', label: 'Espèces', icon: 'cash-outline' },
    { id: 'card', label: 'Carte bancaire', icon: 'card-outline' },
  ],
  tenders: ['MTN MoMo', 'Orange Money', 'Espèces', 'Carte bancaire', 'Compte client'],
  banks: ['Afriland First Bank', 'BICEC', 'Société Générale Cameroun', 'UBA Cameroun', 'Ecobank Cameroun', 'CCA Bank'],
  momo: ['MTN Mobile Money', 'Orange Money'],
};

/* the shared formatter every module used to define for itself */
window.money = window.KZ_LOCALE.short;
window.moneyFull = window.KZ_LOCALE.money;
