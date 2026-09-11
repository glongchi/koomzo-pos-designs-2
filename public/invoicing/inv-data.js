/* Koomzo POS — Invoicing dataset
   Invoices, line items, and clients for the invoicing surfaces
   (list management, builder, print-ready display). Money is stored as whole
   francs — XAF has no minor unit — and formatted in the components. */

window.KZ_INV_ORG = {
  name: 'Koomzo Retail SARL',
  tagline: 'Point de vente · Commerce & Hôtellerie',
  email: 'facturation@koomzo.cm',
  phone: '+237 6 55 41 08 22',
  addr: ['Rue Njo-Njo, Bonapriso', 'Douala, Cameroun · BP 4218'],
  taxId: 'NIU M071812345678A',
  bank: { name: 'Afriland First Bank', acct: '•••• 4471', routing: 'CM21 10005 00012' },
  momo: 'MTN Mobile Money · 6 55 41 08 22',
  terms: 'Paiement à 15 jours · pénalité de 1,5 % par mois de retard.',
};

window.KZ_INV_STATUS = {
  draft:   { label: 'Draft',   wash: '#eceef2', ink: '#5d6573', dot: '#858a9b' },
  sent:    { label: 'Sent',    wash: '#e8f0fd', ink: '#2f6fd0', dot: '#528cef' },
  paid:    { label: 'Paid',    wash: '#e4f4ea', ink: '#1f7a44', dot: '#2e9e5b' },
  overdue: { label: 'Overdue', wash: '#fdeae4', ink: '#c23c17', dot: '#ec603a' },
  void:    { label: 'Void',    wash: '#f1ece2', ink: '#8a7a5f', dot: '#c9a25a' },
};

// Tinted avatars for clients (icon-on-wash, no image deps)
const CT = {
  purple: { bg: '#eeecf8', fg: '#6a61bf' },
  blue:   { bg: '#e8f0fd', fg: '#528cef' },
  green:  { bg: '#e4f4ea', fg: '#2e9e5b' },
  coral:  { bg: '#fdeae4', fg: '#ec603a' },
  amber:  { bg: '#fbf2dd', fg: '#c98a20' },
  slate:  { bg: '#eceef2', fg: '#5d6573' },
};

window.KZ_INV_CLIENTS = [
  { id: 'c1', name: 'Café des Palmiers',        contact: 'Danielle Ngassa', email: 'compta@palmiers.example',   phone: '+237 6 99 12 04 51', addr: ['Boulevard de la Liberté', 'Akwa, Douala'],        icon: 'cafe-outline',       tint: CT.blue },
  { id: 'c2', name: 'Sawa Hospitality SARL',    contact: 'Kevin Etoundi',   email: 'achats@sawahg.example',      phone: '+237 6 77 58 19 03', addr: ['Rue Joffre, Bonanjo', 'Douala'],                  icon: 'business-outline',   tint: CT.purple },
  { id: 'c3', name: 'Alimentation Bonapriso',   contact: 'Sofia Mbah',      email: 'gerance@alimbona.example',   phone: '+237 6 94 33 71 42', addr: ['Rue Toyota, Bonapriso', 'Douala'],                icon: 'basket-outline',     tint: CT.green },
  { id: 'c4', name: 'Établissements Kribi Port',contact: 'Owen Ayuk',       email: 'paiement@kribiport.example', phone: '+237 6 70 22 66 14', addr: ['Route du Port', 'Kribi, Sud'],                    icon: 'boat-outline',       tint: CT.slate },
  { id: 'c5', name: 'Bistro Mont Fébé',         contact: 'Ivy Kamdem',      email: 'finance@montfebe.example',   phone: '+237 6 82 45 90 27', addr: ['Avenue du Président, Bastos', 'Yaoundé'],         icon: 'restaurant-outline', tint: CT.amber },
  { id: 'c6', name: 'Provisions Bafoussam',     contact: 'Rachel Fotso',    email: 'compta@provbafou.example',   phone: '+237 6 96 18 47 05', addr: ['Marché A, Route de Bamenda', 'Bafoussam, Ouest'], icon: 'storefront-outline', tint: CT.coral },
];

const clientOf = (id) => window.KZ_INV_CLIENTS.find((c) => c.id === id);

// A believable set of billable lines drawn from the POS vocabulary
const L = (desc, qty, price) => ({ id: 'l' + Math.random().toString(36).slice(2, 8), desc, qty, price });

/* TVA is national and single-rated at 19,25 % — there is no per-city rate to vary */
const RAW = [
  { id: 'i1042', number: 'INV-1042', clientId: 'c2', status: 'overdue', issue: '2026-06-18', due: '2026-07-03', taxRate: 19.25, discount: 0,
    items: [L('Location terminal de caisse — juin', 6, 55000), L('Rouleaux de reçus (carton de 50)', 4, 25000), L('Installation et formation sur site', 1, 210000)],
    notes: 'Merci de rappeler le numéro de facture lors du paiement. Mobile money accepté.' },
  { id: 'i1041', number: 'INV-1041', clientId: 'c1', status: 'sent', issue: '2026-07-01', due: '2026-07-16', taxRate: 19.25, discount: 15000,
    items: [L('Café en grains — 5 kg, prix de gros', 8, 28000), L('Couvercles compostables (1000 u.)', 6, 17000), L('Réimpression du tableau de menu', 1, 72000)] },
  { id: 'i1040', number: 'INV-1040', clientId: 'c3', status: 'paid', issue: '2026-06-24', due: '2026-07-09', taxRate: 19.25, discount: 0,
    items: [L('Rouleaux d’étiquettes code-barres (2000 u.)', 10, 11000), L('Douchette code-barres — Zebra DS2208', 3, 90000), L('Inventaire assisté', 1, 240000)] },
  { id: 'i1039', number: 'INV-1039', clientId: 'c5', status: 'paid', issue: '2026-06-20', due: '2026-07-05', taxRate: 19.25, discount: 30000,
    items: [L('Tablettes de prise de commande en salle', 4, 132000), L('Supports de tablette — acier brossé', 4, 20000), L('Intégration et synchronisation du menu', 1, 165000)] },
  { id: 'i1038', number: 'INV-1038', clientId: 'c4', status: 'sent', issue: '2026-07-05', due: '2026-07-20', taxRate: 19.25, discount: 0,
    items: [L('Tiroir-caisse — 5 billets / 8 pièces', 5, 47000), L('Imprimante thermique de reçus', 5, 99000), L('Extension de garantie (2 ans)', 5, 24000)] },
  { id: 'i1037', number: 'INV-1037', clientId: 'c6', status: 'draft', issue: '2026-07-08', due: '2026-07-23', taxRate: 19.25, discount: 0,
    items: [L('Mise en place du programme de fidélité', 1, 300000), L('Cartes cadeaux personnalisées (500 u.)', 1, 192000)] },
  { id: 'i1036', number: 'INV-1036', clientId: 'c1', status: 'paid', issue: '2026-05-28', due: '2026-06-12', taxRate: 19.25, discount: 0,
    items: [L('Abonnement logiciel de caisse — mai', 1, 78000), L('Poste de caisse supplémentaire', 2, 23500)] },
  { id: 'i1035', number: 'INV-1035', clientId: 'c2', status: 'void', issue: '2026-05-15', due: '2026-05-30', taxRate: 19.25, discount: 0,
    items: [L('Double facturation — annulée', 1, 78000)] },
  { id: 'i1034', number: 'INV-1034', clientId: 'c3', status: 'paid', issue: '2026-05-30', due: '2026-06-14', taxRate: 19.25, discount: 0,
    items: [L('Imprimante d’étiquettes de rayon', 1, 144000), L('Modèles d’étiquettes', 1, 54000)] },
];

window.KZ_INV_CLIENT_OF = clientOf;
window.KZ_INVOICES = RAW;
