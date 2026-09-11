/* Koomzo Retail POS — data for the three back-of-house screens:
   Shift (money accountability), Returns (risk), Customers (relationship).
   Money is whole francs; the drawer counts real XAF notes and coins. */

window.RX_SHIFT2 = {
  state: 'Open', lane: 'Caisse 1', cashier: 'Anita Ndongo', opened: 'Today · 08:00', elapsed: '4h 12m',
  zref: 'Z-0912', drawer: 'Closed', tolerance: 500,
  kpis: [
    { k: 'Net sales', v: 1519000 }, { k: 'Transactions', v: 64, plain: true },
    { k: 'Average ticket', v: 23700 }, { k: 'Refunds', v: -38000, tone: 'bad' },
    { k: 'Discounts given', v: -31500, tone: 'bad' }, { k: 'Voided lines', v: 5, plain: true, tone: 'warn' },
  ],
  /* mobile money leads, because it does at the counter */
  tenders: [
    { k: 'Espèces', ic: 'cash-outline', expected: 289000, counted: null, note: 'Counted in drawer' },
    { k: 'MTN Mobile Money', ic: 'phone-portrait-outline', expected: 1125000, counted: 1125000, note: 'Relevé opérateur rapproché' },
    { k: 'Orange Money', ic: 'phone-portrait-outline', expected: 146000, counted: 146000, note: 'Relevé opérateur rapproché' },
    { k: 'Store credit', ic: 'gift-outline', expected: 15000, counted: 15000, note: 'Issued against returns' },
  ],
  /* the notes and coins actually in circulation: 10 000 down to the 5 F piece */
  denoms: [
    { v: 10000, n: 12, kind: 'note' }, { v: 5000, n: 18, kind: 'note' }, { v: 2000, n: 14, kind: 'note' },
    { v: 1000, n: 22, kind: 'note' }, { v: 500, n: 16, kind: 'note' },
    { v: 500, n: 9, kind: 'coin' }, { v: 100, n: 24, kind: 'coin' },
    { v: 50, n: 18, kind: 'coin' }, { v: 25, n: 12, kind: 'coin' }, { v: 5, n: 20, kind: 'coin' },
  ],
  movements: [
    { t: '08:00', k: 'Opening float', v: 100000, who: 'Anita Ndongo', note: 'Counted with duty manager' },
    { t: '10:47', k: 'No-sale drawer open', v: 0, who: 'Anita Ndongo', note: 'Change for customer' },
    { t: '11:20', k: 'Paid out', v: -21000, who: 'Anita Ndongo', note: 'Laveur de vitres · reçu joint' },
    { t: '12:58', k: 'Safe drop', v: -250000, who: 'M. Ekindi', note: 'Sachet 0041 · témoin présent' },
    { t: '13:22', k: 'Refund to cash', v: -6700, who: 'Anita Ndongo', note: 'Order #1029' },
  ],
  hourly: [ ['08', 38000], ['09', 92000], ['10', 131000], ['11', 212000], ['12', 250000], ['13', 184000], ['14', 117000] ],
  exceptions: [
    { k: 'Line voided after subtotal', n: 2, risk: 'watch', note: 'Both by Anita Ndongo · 12:41, 13:06' },
    { k: 'Manual price override', n: 1, risk: 'watch', note: '−4 500 F Chemise en lin · approved by M. Ekindi' },
    { k: 'Refund without receipt', n: 1, risk: 'high', note: '8 500 F to store credit · ID recorded' },
    { k: 'No-sale drawer opens', n: 3, risk: 'low', note: 'Within lane average' },
  ],
};

window.RX_REASONS = ['Faulty', 'Wrong size', 'Changed mind', 'Damaged in transit', 'Not as described', 'Duplicate gift'];

/* TVA 19,25 % where it applies; unprocessed foodstuffs are exempt, so the
   grocery receipt carries a 0 rate rather than a reduced one. */
window.RX_RETURNS = [
  { id: 'r1', no: '1031', at: 'Today · 11:04', days: 0, cashier: 'Anita Ndongo', tender: 'MTN MoMo ···8841',
    customer: 'Amara Diallo', rate: 0.1925, total: 35775, lines: [
      { name: 'Chemise en lin', sub: 'M · Sable', qty: 1, price: 21500, returned: 0 },
      { name: 'Sac en toile', sub: 'Grammage épais', qty: 1, price: 11500, returned: 0 }] },
  { id: 'r2', no: '1029', at: 'Today · 10:22', days: 0, cashier: 'Divine Ayuk', tender: 'Espèces',
    customer: 'Walk-in', rate: 0, total: 12500, lines: [
      { name: 'Lait en poudre', sub: '400 g', qty: 2, price: 2900, returned: 2, blocked: 'Already refunded' },
      { name: 'Pain de mie', sub: '400 g', qty: 1, price: 900, returned: 0, blocked: 'Perishable — not returnable' },
      { name: 'Riz parfumé', sub: '1 kg', qty: 4, price: 1425, returned: 0 }] },
  { id: 'r3', no: '1018', at: 'Yesterday · 17:41', days: 1, cashier: 'Anita Ndongo', tender: 'Orange Money ···9920',
    customer: 'Nadège Fotso', rate: 0.1925, total: 67925, lines: [
      { name: 'Écouteurs sans fil', sub: 'Noir', qty: 1, price: 46500, returned: 0, serial: '88-2210-4' },
      { name: 'Coque téléphone', sub: '6,7 po', qty: 1, price: 7900, returned: 0 },
      { name: 'Huile à lèvres', sub: 'Teinte légère', qty: 1, price: 5800, returned: 0, blocked: 'Hygiene item — final sale' }] },
  { id: 'r4', no: '0977', at: '14 Jul · 15:12', days: 30, cashier: 'M. Ekindi', tender: 'MTN MoMo ···8841',
    customer: 'Thomas Ngwa', rate: 0.1925, total: 63975, lines: [
      { name: 'Veste matelassée', sub: 'L · Olive', qty: 1, price: 53500, returned: 0 }] },
];

window.RX_CUST_DETAIL = {
  c1: { since: 'Mar 2023', credit: 9000, avg: 20300, next: 'Platinum', toNext: 260, birthday: '4 Sep',
    consent: ['SMS', 'WhatsApp'], prefs: ['Taille M · tons sable', 'Reçu par SMS', 'Allergie : lanoline'],
    history: [ { at: 'Today · 11:04', no: '1031', items: '2 items', v: 33000 },
      { at: '2 Aug', no: '0994', items: '5 items', v: 76500 }, { at: '19 Jul', no: '0951', items: '1 item', v: 13500 } ],
    notes: [ { who: 'Anita N.', at: '2 Aug', txt: 'A appelé pour le réassort en lin — garder un M à l’arrivée.' } ] },
  c2: { since: 'Jan 2025', credit: 0, avg: 14500, next: 'Gold', toNext: 690, birthday: '22 Nov',
    consent: ['SMS'], prefs: ['Demande de compte professionnel'], history: [ { at: '14 Jul', no: '0977', items: '1 item', v: 53500 } ],
    notes: [ { who: 'M. Ekindi', at: '14 Jul', txt: 'Veste achetée en cadeau — reçu imprimé sans le prix.' } ] },
  c3: { since: 'Nov 2021', credit: 21500, avg: 29900, next: 'Platinum', toNext: 0, birthday: '11 Feb',
    consent: ['SMS', 'WhatsApp', 'Appel'], prefs: ['Réparations : écouteurs SN 88-2210-4', 'Préfère Divine au comptoir'],
    history: [ { at: 'Yesterday · 17:41', no: '1018', items: '3 items', v: 57000 },
      { at: '28 Jul', no: '0968', items: '2 items', v: 26500 }, { at: '3 Jul', no: '0902', items: '6 items', v: 119000 } ],
    notes: [ { who: 'Divine A.', at: 'Yesterday', txt: 'Garantie enregistrée à la vente. Souhaite un appel au réassort de l’écran QHD.' } ] },
  c4: { since: 'Jun 2026', credit: 0, avg: 11700, next: 'Silver', toNext: 140, birthday: '30 Mar',
    consent: [], prefs: [], history: [ { at: '9 Aug', no: '1002', items: '3 items', v: 15900 } ], notes: [] },
};

window.RX_TIERS = { Member: 0, Silver: 200, Gold: 1000, Platinum: 3000 };
