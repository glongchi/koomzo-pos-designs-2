/* Koomzo POS — Users & Roles admin dataset
   Mirrors the Products admin shape so the same list-management shell (table +
   drawer + phone list) renders a different item type with zero rework.
   Each user carries iconographic art (tinted avatar + initials) so the admin
   renders with no image dependency — same vocabulary as the POS catalogue. */

/* soft washes for avatars / role chips — same palette as the POS tiles */
const UT = {
  purple: { bg: '#eeecf8', fg: '#6a61bf' },
  indigo: { bg: '#ececfb', fg: '#4b4ad9' },
  blue:   { bg: '#e8f0fd', fg: '#3f78c9' },
  green:  { bg: '#e4f4ea', fg: '#23824a' },
  amber:  { bg: '#fbf2dd', fg: '#a9781b' },
  oak:    { bg: '#f1ece2', fg: '#9a7647' },
  coral:  { bg: '#fdeae4', fg: '#cc4b27' },
  slate:  { bg: '#eceef2', fg: '#5d6573' },
  teal:   { bg: '#e0f1ef', fg: '#1f8a7e' },
  pink:   { bg: '#fbe9f0', fg: '#c14b80' },
};

/* ---------- ROLES ---------- */
/* Six roles, ramped from full control to read-only. Each carries a tint (for
   chips) and a boolean permission map over the six product areas. */
window.KZ_UA_PERM_AREAS = [
  { id: 'register', label: 'Register & sales',     desc: 'Ring up orders, take payment',     icon: 'cart-outline' },
  { id: 'refunds',  label: 'Refunds & voids',      desc: 'Reverse or void completed sales',  icon: 'arrow-undo-outline' },
  { id: 'products', label: 'Products & inventory', desc: 'Edit catalogue & stock levels',    icon: 'pricetags-outline' },
  { id: 'reports',  label: 'Reports & analytics',  desc: 'View sales, tax & staff reports',   icon: 'bar-chart-outline' },
  { id: 'users',    label: 'Users & roles',        desc: 'Invite staff, assign roles',       icon: 'people-outline' },
  { id: 'settings', label: 'Settings & billing',   desc: 'Store config, taxes, subscription', icon: 'settings-outline' },
];

const PERM = (register, refunds, products, reports, users, settings) =>
  ({ register, refunds, products, reports, users, settings });

const ROLES_RAW = [
  { id: 'owner',   label: 'Owner',       desc: 'Full control of the business',     tint: UT.purple, level: 'Full access', icon: 'ribbon-outline',     system: true,  perms: PERM(true, true, true, true, true, true) },
  { id: 'admin',   label: 'Admin',       desc: 'Manage staff, settings & catalog', tint: UT.indigo, level: 'Full access', icon: 'shield-checkmark-outline', system: true, perms: PERM(true, true, true, true, true, false) },
  { id: 'manager', label: 'Manager',     desc: 'Run shifts, refunds & reports',    tint: UT.blue,   level: 'Elevated',    icon: 'briefcase-outline',  system: false, perms: PERM(true, true, true, true, false, false) },
  { id: 'cashier', label: 'Cashier',     desc: 'Take payments at the register',    tint: UT.green,  level: 'Standard',    icon: 'card-outline',       system: false, perms: PERM(true, false, false, false, false, false) },
  { id: 'stock',   label: 'Stock Clerk', desc: 'Manage products & inventory',      tint: UT.oak,    level: 'Standard',    icon: 'cube-outline',       system: false, perms: PERM(true, false, true, false, false, false) },
  { id: 'viewer',  label: 'Viewer',      desc: 'Read-only reports access',         tint: UT.slate,  level: 'Read-only',   icon: 'eye-outline',        system: false, perms: PERM(false, false, false, true, false, false) },
];

window.KZ_UA_ROLES = ROLES_RAW.reduce((m, r) => { m[r.id] = r; return m; }, {});
window.KZ_UA_ROLE_LIST = ROLES_RAW;

/* ---------- STATUS ---------- */
window.KZ_UA_STATUS = {
  active:    { label: 'Active',    dot: '#2e9e5b', wash: '#e4f4ea', ink: '#1f7d46' },
  invited:   { label: 'Invited',   dot: '#e0a32e', wash: '#fbf2dd', ink: '#a9781b' },
  suspended: { label: 'Suspended', dot: '#ec603a', wash: '#fdeae4', ink: '#c5421f' },
};

/* ---------- USERS ---------- */
const U = (o) => o;
const USERS_RAW = [
  /* echoes the local app's seed row */
  U({ id: 'u00', name: 'default', title: 'Provider account', email: 'default.provider.1@mock.koomzo.local', phone: '—',            roles: ['viewer'],            status: 'invited',  icon: 'person', av: UT.slate, createdAt: 'Jan 02, 2025', createdBy: 'System', lastActive: '—',         signIns: 0  }),
  U({ id: 'u01', name: 'Amara Okonkwo',   title: 'Store Owner',     email: 'amara@koomzo.store',        phone: '+237 6 99 220 8841', roles: ['owner', 'admin'],    status: 'active',    initials: 'AO', av: UT.purple, createdAt: 'Nov 14, 2024', createdBy: 'System', lastActive: '4m ago',    signIns: 612 }),
  U({ id: 'u02', name: 'Daniel Tchoua',   title: 'Floor Manager',   email: 'daniel.tchoua@koomzo.store',   phone: '+237 6 99 661 2093', roles: ['manager'],           status: 'active',    initials: 'DT', av: UT.blue,   createdAt: 'Dec 03, 2024', createdBy: 'Amara Okonkwo', lastActive: '22m ago',   signIns: 388 }),
  U({ id: 'u03', name: 'Prisca Nana',     title: 'Lead Cashier',    email: 'prisca.nana@koomzo.store',   phone: '+237 6 94 770 1145', roles: ['cashier'],           status: 'active',    initials: 'PN', av: UT.green,  createdAt: 'Jan 09, 2025', createdBy: 'Daniel Tchoua',   lastActive: '1h ago',    signIns: 254 }),
  U({ id: 'u04', name: 'Marcus Bell',     title: 'Cashier',         email: 'marcus.bell@koomzo.store',  phone: '+237 6 94 412 5567', roles: ['cashier'],           status: 'active',    initials: 'MB', av: UT.teal,   createdAt: 'Jan 22, 2025', createdBy: 'Daniel Tchoua',   lastActive: '3h ago',    signIns: 176 }),
  U({ id: 'u05', name: 'Solange Manga',   title: 'Stock Clerk',     email: 'solange.manga@koomzo.store', phone: '+237 6 99 902 7731', roles: ['stock'],             status: 'active',    initials: 'SM', av: UT.oak,    createdAt: 'Feb 11, 2025', createdBy: 'Amara Okonkwo', lastActive: 'Yesterday', signIns: 98  }),
  U({ id: 'u06', name: 'Tunde Balogun',   title: 'Assistant Manager', email: 'tunde.b@koomzo.store',    phone: '+237 6 99 338 4420', roles: ['manager', 'stock'],  status: 'active',    initials: 'TB', av: UT.indigo, createdAt: 'Feb 27, 2025', createdBy: 'Amara Okonkwo', lastActive: '2d ago',    signIns: 142 }),
  U({ id: 'u07', name: 'Leila Hassan',    title: 'Cashier',         email: 'leila.hassan@koomzo.store', phone: '+237 6 94 551 8842', roles: ['cashier'],           status: 'invited',   initials: 'LH', av: UT.pink,   createdAt: 'Jun 02, 2026', createdBy: 'Prisca Nana',   lastActive: '—',         signIns: 0   }),
  U({ id: 'u08', name: 'Joseph Wandji',   title: 'Stock Clerk',     email: 'joseph.wandji@koomzo.store',  phone: '+237 6 99 776 0098', roles: ['stock'],             status: 'invited',   initials: 'JW', av: UT.amber,  createdAt: 'Jun 05, 2026', createdBy: 'Solange Manga', lastActive: '—',         signIns: 0   }),
  U({ id: 'u09', name: 'Grace Mensah',    title: 'Auditor',         email: 'grace.mensah@koomzo.store', phone: '+237 6 94 119 5510', roles: ['viewer'],            status: 'active',    initials: 'GM', av: UT.slate,  createdAt: 'Mar 18, 2025', createdBy: 'Amara Okonkwo', lastActive: '5d ago',    signIns: 61  }),
  U({ id: 'u10', name: 'Rodrigue Etoa',   title: 'Former Cashier',  email: 'rodrigue.etoa@koomzo.store', phone: '+237 6 94 224 7789', roles: ['cashier'],           status: 'suspended', initials: 'RE', av: UT.coral,  createdAt: 'Dec 19, 2024', createdBy: 'Daniel Tchoua',   lastActive: '3w ago',    signIns: 203 }),
  U({ id: 'u11', name: 'Adama Sanogo',    title: 'Cashier',         email: 'adama.sanogo@koomzo.store',  phone: '+237 6 99 660 3312', roles: ['cashier'],           status: 'active',    initials: 'AS', av: UT.teal,   createdAt: 'Apr 04, 2025', createdBy: 'Daniel Tchoua',   lastActive: '6h ago',    signIns: 121 }),
  U({ id: 'u12', name: 'Omar Farouk',     title: 'Night Manager',   email: 'omar.farouk@koomzo.store',  phone: '+237 6 94 805 4471', roles: ['manager'],           status: 'active',    initials: 'OF', av: UT.blue,   createdAt: 'May 12, 2025', createdBy: 'Amara Okonkwo', lastActive: '8h ago',    signIns: 89  }),
  U({ id: 'u13', name: 'Béatrice Ndille', title: 'Stock Clerk',     email: 'beatrice.ndille@koomzo.store', phone: '+237 6 99 990 2218', roles: ['stock'],             status: 'suspended', initials: 'BN', av: UT.coral,  createdAt: 'Jan 30, 2025', createdBy: 'Solange Manga', lastActive: '1mo ago',   signIns: 47  }),
];

window.KZ_UA_USERS = USERS_RAW;

/* derived helpers shared by the app */
window.ua_roleCounts = (users) => {
  const m = {};
  window.KZ_UA_ROLE_LIST.forEach((r) => { m[r.id] = 0; });
  users.forEach((u) => u.roles.forEach((r) => { if (m[r] != null) m[r] += 1; }));
  return m;
};
