/* ==========================================================================
   Koomzo — capability service.  ONE registry, ONE resolver, every module reads it.
   Phase 1 of the progressive-disclosure rollout.

   Resolution order, each stage able only to SUBTRACT:
       plan ceiling  →  tier / switch  →  role  →  device
   A capability is three-state: 'on' | 'winding' | 'off'  (plus 'locked' = above plan).
   Every capability carries enabled_from so reporting can annotate its own history.
   State persists under one key so every module page agrees.
   ========================================================================== */
(function () {
'use strict';

const KEY = 'kz.caps.v1';
const NOW = () => new Date().toISOString();

/* ---------- plans: the ceiling ---------- */
const PLANS = [
  { id:'free',     name:'Free',         price:0,   ceiling:'lite', sites:1, seats:1,  vol:500,   months:6,
    note:'6-month onboarding runway. Converts to Starter.' },
  { id:'starter',  name:'Starter',      price:18000,  ceiling:'mid',  sites:1, seats:3,  vol:3000,  months:12,
    note:'One counter, one or two people.' },
  { id:'standard', name:'Standard',     price:42000,  ceiling:'full', sites:1, seats:10, vol:15000, months:24,
    note:'A real team and real stock. All modules.' },
  { id:'pro',      name:'Professional', price:85000, ceiling:'full', sites:99, seats:0, vol:60000, months:0,
    note:'Several sites under one roll-up.' },
  { id:'enterprise', name:'Enterprise', price:null, ceiling:'full', sites:99, seats:0, vol:0,    months:0,
    note:'Volume, MRP, integrations, SLA.' },
];
const PLAN_IX = PLANS.reduce((a, p, i) => (a[p.id] = i, a), {});

/* ---------- tiers: the surface ---------- */
const TIERS = [
  { id:'off',  name:'Off',  desc:'Not part of this business. Absent from navigation.' },
  { id:'lite', name:'Lite', desc:'One screen, the irreducible job.' },
  { id:'mid',  name:'Mid',  desc:'The daily loop, with accountability.' },
  { id:'full', name:'Full', desc:'Documents, multi-site, approvals, analytics.' },
];
const TIER_IX = { off:0, lite:1, mid:2, full:3 };

const ROLES = [
  { id:'owner',   name:'Owner',   desc:'Everything, including plan and billing.' },
  { id:'manager', name:'Manager', desc:'Capability switches within the plan ceiling. No billing.' },
  { id:'staff',   name:'Staff',   desc:'The work surface only. No Setup.' },
];
const DEVICES = [
  { id:'desktop', name:'Desktop' }, { id:'tablet', name:'Tablet' }, { id:'phone', name:'Phone' },
];

/* ---------- the registry ----------
   tier   : lowest tier at which this is on by default
   plan   : lowest plan at which it is available at all
   holds  : what obligation it can hold open — drives wind-down  (docs | money | reference | null)
   roles  : who may ever see it (default: all)
   devices: where it makes sense (default: all)                                             */
const C = (key, name, desc, icon, tier, plan, holds, extra) =>
  Object.assign({ key, name, desc, icon, tier, plan, holds: holds || null }, extra);

const MODULES = [
  { id:'retail', name:'Retail POS', icon:'storefront-outline', tint:'#6a61bf',
    core:'Register', coreDesc:'Ring up a sale. Never hideable.',
    file:'Koomzo POS - Retail Flex.html',
    caps:[
      C('sales','Sales history','Past transactions, receipts, reprints.','receipt-outline','lite','free'),
      C('inventory','Stock','Quantity per product, low-stock list.','cube-outline','lite','free'),
      C('categories','Categories','Category list, glyphs and tile style.','albums-outline','mid','starter'),
      C('tickets','Open tickets','Park a sale and come back to it.','pause-outline','mid','starter','docs'),
      C('returns','Returns','Refunds against a receipt.','refresh-outline','mid','starter','docs'),
      C('customers','Customers','Named accounts, loyalty, notes.','people-outline','mid','starter','reference'),
      C('shift','Shift & drawer','Float, count, Z-report.','cash-outline','full','standard','money',{ roles:['owner','manager'] }),
      C('discounts','Manager discounts','Approval above a threshold.','pricetag-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('multilane','Multi-lane','More than one register on one site.','tablet-landscape-outline','full','standard',null,{ devices:['desktop','tablet'] }),
    ] },

  { id:'inventory', name:'Inventory', icon:'cube-outline', tint:'#528cef',
    core:'Items', coreDesc:'The catalogue. Never hideable.',
    file:'Koomzo POS - Inventory.html',
    caps:[
      C('movements','Movement log','Every in, out, adjust and move.','swap-vertical-outline','lite','free'),
      C('reorder','Reorder points','Par levels and a needs-ordering list.','notifications-outline','mid','starter'),
      C('suppliers','Suppliers','Contacts, terms, lead time.','people-circle-outline','mid','starter','reference'),
      C('purchase','Purchase orders','Order from suppliers, receive against the order.','receipt-outline','full','standard','docs',{ roles:['owner','manager'] }),
      C('counts','Stock counts','Cycle and full counts with variance posting.','clipboard-outline','full','standard','docs'),
      C('locations','Multiple locations','Stock held per site.','business-outline','full','pro'),
      C('transfers','Transfers','Move stock between locations.','git-compare-outline','full','pro','docs'),
      C('composite','Composites & recipes','A sale depletes components.','layers-outline','full','standard'),
      C('valuation','Valuation & COGS','Stock value, margin, shrinkage.','stats-chart-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('lots','Batch & expiry','Lot numbers and expiry per receipt.','calendar-outline','full','standard'),
      C('serials','Serial numbers','Identify each individual unit.','barcode-outline','full','standard'),
    ] },

  { id:'salon', name:'Salon', icon:'cut-outline', tint:'#c2497e',
    core:'Appointment book', coreDesc:'Today and the calendar. Never hideable.',
    file:'Koomzo Salon - Appointments, Tasks, Team.html',
    caps:[
      C('register','Take payment','Sell a service or a product at the chair.','card-outline','lite','free'),
      C('services','Services','Authoring: duration, staff, price.','list-outline','lite','free'),
      C('team','Team','Who works when, and on what.','people-outline','mid','starter','reference'),
      C('tasks','Tasks','Opening and closing checklists.','checkbox-outline','mid','starter','docs'),
      C('time','Timesheet','Clock in, clock out, hours worked.','time-outline','full','standard','money',{ roles:['owner','manager'] }),
      C('commission','Commission','Split of service revenue per stylist.','cash-outline','full','standard','money',{ roles:['owner','manager'] }),
      C('backbar','Back-bar consumption','Colour and developer depleted on completion.','flask-outline','full','standard'),
      C('kiosk','Self check-in kiosk','Customer-facing arrival screen.','tablet-portrait-outline','full','standard',null,{ devices:['tablet'] }),
      C('display','Queue display','Wall screen of who is next.','tv-outline','full','standard',null,{ devices:['desktop','tablet'] }),
    ] },

  { id:'restaurant', name:'Restaurant', icon:'restaurant-outline', tint:'#ec603a',
    core:'Order entry', coreDesc:'Take an order. Never hideable.',
    file:'Koomzo POS - Restaurant & Bar.html',
    caps:[
      C('floor','Floor plan','Tables, covers, who is serving.','grid-outline','lite','free'),
      C('courses','Course firing','Hold and fire by course.','layers-outline','mid','starter'),
      C('kitchen','Kitchen display','Expo board and per-station tickets.','tv-outline','mid','starter',null,{ devices:['desktop','tablet'] }),
      C('stations','Kitchen stations','Split the line into named stations.','git-branch-outline','full','standard'),
      C('allday','All-day view','Aggregated quantities across tickets.','albums-outline','full','standard'),
      C('kiosk','Self-serve kiosk','Customer orders without a server.','tablet-portrait-outline','full','standard',null,{ devices:['tablet'] }),
      C('tabs','Bar tabs','Open a tab against a card.','wine-outline','full','standard','money',{ roles:['owner','manager'] }),
      C('roomcharge','Charge to room','Post a bill to a hotel guest folio instead of taking payment.','bed-outline','mid','starter','money'),
    ] },

  { id:'hotel', name:'Hotel', icon:'bed-outline', tint:'#0f8f9e',
    core:'Room rack', coreDesc:'Every room, its state, and who is in it tonight. Never hideable.',
    file:'Koomzo Hotel - Rooms, Folio & Housekeeping.html',
    caps:[
      C('bookings','Reservations','Forward bookings, arrivals and departures.','calendar-number-outline','lite','free','docs'),
      C('guests','Guest records','Name, ID or passport, contact, stay history.','person-outline','lite','free','reference'),
      C('housekeeping','Housekeeping','Room states, cleaning list, who cleaned what.','sparkles-outline','lite','free'),
      C('folio','Guest folio','Charges accumulate on the room, settled at checkout.','reader-outline','mid','starter','money'),
      C('rates','Rate plans','Season, weekend, weekly and monthly rates.','pricetags-outline','mid','starter'),
      C('availability','Availability grid','Room type by night: what is left to sell, and at what rate.','grid-outline','mid','starter'),
      C('restrictions','Stay restrictions','Minimum nights, closed to arrival or departure, stop sell.','lock-closed-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('maintenance','Maintenance & out of order','Take a room off sale with a reason.','construct-outline','mid','starter','docs'),
      C('roster','Staff roster','The week\'s shifts in one table, with clock-in status.','id-card-outline','lite','free'),
      C('shifts','Shift board & coverage','Who covers each shift, and where the house is short.','time-outline','mid','starter',null,{ roles:['owner','manager'] }),
      C('fnb','Charge to room from F&B','Restaurant and bar post onto the folio.','restaurant-outline','mid','starter','money'),
      C('ota','OTA bookings','Booking.com, Airbnb and agent reservations entered by hand.','globe-outline','mid','starter','docs'),
      C('register','Statutory guest register','Police register and per-night tourist levy.','document-text-outline','mid','starter','docs'),
      C('prearrival','Pre-arrival check-in','The guest fills the registration card on their phone; the register writes itself.','qr-code-outline','mid','starter','docs'),
      C('deposits','Deposits & damage','Security deposit held, deductions at checkout.','shield-outline','full','standard','money'),
      C('longstay','Long stays & apartments','Weekly and monthly tenancies, utilities, renewals.','key-outline','full','standard','docs'),
      C('nightaudit','Night audit','Post the night, close the day, occupancy report.','moon-outline','full','standard','money',{ roles:['owner','manager'] }),
      C('occupancy','Occupancy, ADR & RevPAR','Performance against last year and by source.','stats-chart-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('channelsync','Channel sync','Two-way availability with the OTAs.','sync-outline','full','pro','docs'),
    ] },

  { id:'gym', name:'Gym & Wellness', icon:'barbell-outline', tint:'#b5453f',
    core:'Front desk', coreDesc:'Admit a member: verified on the device in about 120ms, network or no network. Never hideable.',
    file:'Koomzo Gym - Front Desk, Members & Classes.html',
    caps:[
      C('members','Member register','Who belongs, on what plan, and until when.','people-outline','lite','free','reference'),
      C('capacity','Live capacity','How many are on the floor, by zone.','speedometer-outline','lite','free'),
      C('classes','Class timetable','Classes by room and hour, with places left.','calendar-number-outline','lite','free'),
      C('access','Gate & zone access','Turnstiles, wristbands, QR, and which zones a plan opens.','qr-code-outline','mid','starter'),
      C('pt','Personal training','One-to-one bookings, trainer availability, no-show rules.','fitness-outline','mid','starter','docs'),
      C('packages','Session packages','Punch cards: sessions bought, sessions left.','albums-outline','mid','starter','docs'),
      C('wallet','Member wallet','Prepaid balance topped up by mobile money or card.','wallet-outline','mid','starter','money'),
      C('barpos','Juice bar & pro shop','Sell at the bar against a scan instead of cash.','cafe-outline','mid','starter','money'),
      C('freeze','Freeze & transfer','Pause a membership, or move paid months to another person.','pause-circle-outline','mid','starter','docs'),
      C('corporate','Corporate accounts','Multi-seat memberships billed to a company.','business-outline','mid','starter','docs'),
      C('lockers','Lockers','Dedicated VIP lockers and day keys.','lock-closed-outline','mid','starter'),
      C('equipment','Equipment & service log','Machine faults and service dates.','construct-outline','mid','starter','docs'),
      C('tab','Charge to account','A verified member runs a tab settled at cycle end.','reader-outline','full','standard','money',{ roles:['owner','manager'] }),
      C('commissions','Trainer commissions','A share of every signed session, plus class bonuses.','trophy-outline','full','standard','money',{ roles:['owner','manager'] }),
      C('payout','Payout ledger','Month-end payout export in SYSCOHADA columns.','download-outline','full','standard','money',{ roles:['owner','manager'] }),
      C('churn','Retention & churn','Visits per member, lapsed members, occupancy by hour.','stats-chart-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('whatsapp','WhatsApp reminders','Class and renewal reminders where SMS does not land.','logo-whatsapp','mid','starter'),
    ] },

  { id:'grocery', name:'Grocery', icon:'basket-outline', tint:'#b4791c',
    core:'Till', coreDesc:'The Retail register with grocery behaviours bolted on. Never hideable.',
    file:'Koomzo Grocery - Till, Dates & Shelf.html',
    caps:[
      C('weigh','Weighed items','Scale-priced goods, price per kilo.','speedometer-outline','lite','free'),
      C('plu','PLU keypad','Type a short code for loose produce.','keypad-outline','lite','free'),
      C('age','Age-restricted prompts','Beer, spirits and tobacco confirm age before ringing.','warning-outline','lite','free','docs'),
      C('promos','Multibuy & mix-and-match','3 for 2, bundle prices, timed offers.','pricetags-outline','mid','starter'),
      C('expiry','Expiry, markdown & waste','Short-dated list, reduce to clear, log what is thrown.','trash-outline','mid','starter','docs'),
      C('deposits','Bottle & crate deposits','Charged out, refunded on return.','beer-outline','mid','starter','money'),
      C('loyalty','Loyalty & staff discount','Card holders and staff purchases.','card-outline','mid','starter','reference'),
      C('shelflabels','Shelf-edge labels','Print a run after a price change.','pricetag-outline','full','standard'),
      C('gaps','Shelf-gap ordering','Walk the aisle, build the order.','basket-outline','full','standard','docs'),
    ] },

  { id:'queue', name:'Queue', icon:'people-outline', tint:'#2e9e5b',
    core:'Call next', coreDesc:'Serve the next person. Never hideable.',
    file:'Koomzo Queue Management.html',
    caps:[
      C('lanes','Multiple lanes','More than one counter or chair.','git-branch-outline','lite','free'),
      C('categories','Service categories','Different reasons for waiting.','albums-outline','mid','starter'),
      C('display','Wall display','Public now-serving screen.','tv-outline','mid','starter',null,{ devices:['desktop','tablet'] }),
      C('supervise','Supervise','Reassign, prioritise, watch wait times.','eye-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('sla','SLA reporting','Wait and serve times against target.','stats-chart-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('notify','SMS notify','Text the customer when they are next.','chatbubble-outline','full','standard'),
    ] },

  { id:'forms', name:'Forms', icon:'clipboard-outline', tint:'#2f8f7d',
    core:'Fill a form', coreDesc:'Answer the questions and submit. Never hideable.',
    file:'Koomzo POS - Forms.html',
    caps:[
      C('submissions','Submissions','Everything that has been filled in.','albums-outline','lite','free','reference'),
      C('builder','Form builder','Author your own questions and logic.','construct-outline','mid','starter',null,{ roles:['owner','manager'], devices:['desktop','tablet'] }),
      C('templates','Template library','Start from a ready-made form.','duplicate-outline','mid','starter'),
      C('logic','Conditional logic','Show a question only when it matters.','git-branch-outline','full','standard'),
      C('multilingual','Multilingual forms','The same form in several languages.','language-outline','full','standard'),
      C('approvals','Review & sign-off','A submission waits on a manager.','shield-checkmark-outline','full','standard','docs',{ roles:['owner','manager'] }),
      C('attach','Photos & files','Evidence attached to an answer.','camera-outline','mid','starter'),
      C('schedule','Scheduled forms','A form that must be filled every shift.','alarm-outline','full','standard','docs'),
      C('export','Export & reporting','Answers out as a table, per period.','stats-chart-outline','full','standard',null,{ roles:['owner','manager'] }),
    ] },

  { id:'automations', name:'Automations', icon:'git-network-outline', tint:'#8a5cf6',
    core:'Recipes', coreDesc:'The list of what runs by itself. Never hideable.',
    file:'Koomzo POS - Automations.html',
    caps:[
      C('runs','Run history','Every execution, with its outcome.','time-outline','lite','free','reference'),
      C('templates','Recipe library','Ready-made automations to switch on.','duplicate-outline','lite','free'),
      C('designer','Flow designer','Author your own trigger and steps.','git-network-outline','mid','starter',null,{ roles:['owner','manager'], devices:['desktop','tablet'] }),
      C('conditions','Conditions & branching','Different paths from one trigger.','git-branch-outline','full','standard'),
      C('schedule','Scheduled runs','Time-based as well as event-based.','alarm-outline','mid','starter','docs'),
      C('webhooks','Webhooks & HTTP','Talk to something outside Koomzo.','globe-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('approval','Human approval step','A run pauses until somebody answers.','person-circle-outline','full','standard','docs'),
      C('retries','Retries & dead letters','What happens when a step fails.','refresh-outline','full','standard',null,{ roles:['owner','manager'] }),
    ] },

  { id:'signage', name:'Signage', icon:'tv-outline', tint:'#8d3fb0',
    core:'Screens', coreDesc:'Every screen this business runs, whether it is alive, and what is on it right now. Never hideable.',
    file:'Koomzo Signage - IA and Capabilities.html',
    caps:[
      C('loops','Playlists','The ordered content a screen plays round the clock.','albums-outline','lite','free'),
      C('media','Media library','Posters, photos and video held once, used on many screens.','images-outline','lite','free','reference'),
      C('boards','Price & menu boards','Prices and availability read from the catalogue, never retyped.','pricetags-outline','lite','free'),
      C('zones','Zones & templates','Split a screen into regions: board, promo strip, ticker.','grid-outline','mid','starter',null,{ roles:['owner','manager'], devices:['desktop','tablet'] }),
      C('schedule','Schedules & dayparting','Breakfast board until 11:00, happy hour after 17:00.','time-outline','mid','starter','docs'),
      C('groups','Screen groups','Publish to a whole shop or a whole floor at once.','copy-outline','mid','starter'),
      C('nowserving','Now serving','The live ticket from Queue or the salon chair.','megaphone-outline','mid','starter'),
      C('promos','Promo & price ticker','Markdowns and multibuys appear without re-authoring.','pricetag-outline','mid','starter'),
      C('notices','Notice board','Staff notices and one-off posts that expire by themselves.','reader-outline','mid','starter'),
      C('wayfinding','Wayfinding & rate card','Lobby directory, room rates, event of the day.','map-outline','full','standard'),
      C('approvals','Publish approval','Content waits on a manager before it reaches the public.','shield-checkmark-outline','full','standard','docs',{ roles:['owner','manager'] }),
      C('takeover','Screen takeover','An override message pre-empts every loop at once.','warning-outline','full','standard',null,{ roles:['owner','manager'] }),
      C('proofofplay','Proof of play','What actually played, when, and for how long.','stats-chart-outline','full','standard','reference',{ roles:['owner','manager'] }),
      C('interactive','Idle handover','A till or kiosk screen falls back to a playlist when nobody is being served.','swap-horizontal-outline','mid','starter',null,{ devices:['desktop','tablet'] }),
      C('multisite','Multi-site publishing','One loop across every branch, with local overrides.','business-outline','full','pro'),
    ] },

  { id:'invoicing', name:'Invoicing', icon:'document-text-outline', tint:'#4b4ad9',
    core:'Issue invoice', coreDesc:'Raise and send an invoice. Never hideable.',
    file:'Koomzo POS - Invoicing.html',
    caps:[
      C('customers','Customers','Bill-to accounts and contacts.','people-outline','lite','free','reference'),
      C('reminders','Payment reminders','Chase overdue automatically.','notifications-outline','mid','starter'),
      C('recurring','Recurring invoices','Bill the same thing on a schedule.','repeat-outline','mid','starter','docs'),
      C('approvals','Approvals','Second signature above a threshold.','shield-checkmark-outline','full','standard','docs',{ roles:['owner','manager'] }),
      C('credit','Credit notes','Reverse or partially reverse an invoice.','arrow-undo-outline','full','standard','docs'),
      C('statements','Statements & ageing','What each account owes, by age.','stats-chart-outline','full','standard',null,{ roles:['owner','manager'] }),
    ] },
];

/* ---------- default state ---------- */
function seedModule(m, tier) {
  const sw = {}, from = {};
  m.caps.forEach((c) => {
    const on = TIER_IX[c.tier] <= TIER_IX[tier];
    sw[c.key] = on;
    if (on) from[c.key] = '2026-01-01T00:00:00.000Z';
  });
  return { tier, switches: sw, from };
}
const SEED_TIER = { retail:'full', inventory:'full', salon:'mid', restaurant:'mid', queue:'off',
  invoicing:'lite', hotel:'mid', grocery:'mid', forms:'lite', automations:'lite', signage:'full', gym:'mid' };
function defaults() {
  const st = { plan: 'standard', role: 'owner', device: 'desktop', modules: {}, log: [] };
  MODULES.forEach((m) => { st.modules[m.id] = seedModule(m, SEED_TIER[m.id] || 'lite'); });
  return st;
}
/* a module added after a tenant saved its state seeds itself on next load */
function migrate(s) {
  MODULES.forEach((m) => {
    if (!s.modules[m.id]) { s.modules[m.id] = seedModule(m, SEED_TIER[m.id] || 'lite'); return; }
    const ms = s.modules[m.id];
    ms.switches = ms.switches || {}; ms.from = ms.from || {};
    m.caps.forEach((c) => {
      if (ms.switches[c.key] === undefined) {
        const on = ms.tier !== 'off' && TIER_IX[c.tier] <= TIER_IX[ms.tier];
        ms.switches[c.key] = on;
        if (on) ms.from[c.key] = ms.from[c.key] || '2026-01-01T00:00:00.000Z';
      }
    });
  });
  return s;
}

/* ---------- persistence ---------- */
let state = null;
function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); if (p && p.modules) { state = migrate(p); return state; } }
  } catch (e) { /* ignore */ }
  state = defaults();
  return state;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } listeners.forEach((f) => f(state)); }
const listeners = new Set();

/* ---------- the resolver ---------- */
function mod(id) { return MODULES.find((m) => m.id === id); }
function cap(mid, key) { const m = mod(mid); return m && m.caps.find((c) => c.key === key); }

/* Returns 'on' | 'winding' | 'off' | 'locked'.
   'locked' means the plan does not include it — show it, greyed, with an upgrade line. */
function resolve(mid, key, over) {
  const s = load(), o = over || {};
  const m = mod(mid), c = cap(mid, key);
  if (!m || !c) return 'off';
  const ms = s.modules[mid] || seedModule(m, 'lite');
  const plan = o.plan || s.plan, role = o.role || s.role, device = o.device || s.device;

  /* 1 — plan ceiling */
  if (PLAN_IX[plan] < PLAN_IX[c.plan]) return 'locked';
  if (TIER_IX[ms.tier] === 0) return 'off';
  if (TIER_IX[PLANS[PLAN_IX[plan]].ceiling] < TIER_IX[c.tier]) return 'locked';

  /* 2 — tier / switch */
  const v = ms.switches[key];
  if (v === 'winding') return 'winding';
  if (!v) return 'off';

  /* 3 — role */
  if (c.roles && c.roles.indexOf(role) === -1) return 'off';

  /* 4 — device */
  if (c.devices && c.devices.indexOf(device) === -1) return 'off';

  return 'on';
}
const on = (mid, key, over) => { const r = resolve(mid, key, over); return r === 'on' || r === 'winding'; };
const visible = (mid, key, over) => resolve(mid, key, over) === 'on';

/* module itself off? */
function moduleOn(mid) { const s = load(); const ms = s.modules[mid]; return !!ms && ms.tier !== 'off'; }

/* ---------- mutation ---------- */
function setPlan(p) { const s = load(); s.plan = p; logIt('Plan changed to ' + p); save(); }
function setRole(r) { load().role = r; save(); }
function setDevice(d) { load().device = d; save(); }

function setTier(mid, tier) {
  const s = load(), m = mod(mid);
  const ms = s.modules[mid];
  ms.tier = tier;
  if (tier !== 'off') {
    m.caps.forEach((c) => {
      const want = TIER_IX[c.tier] <= TIER_IX[tier];
      if (want && !ms.switches[c.key]) { ms.switches[c.key] = true; ms.from[c.key] = ms.from[c.key] || NOW(); }
      if (!want && ms.switches[c.key] === true) ms.switches[c.key] = false;
    });
  }
  logIt(m.name + ' set to ' + tier);
  save();
}
/* value: true | false | 'winding' */
function setCap(mid, key, value) {
  const s = load(), ms = s.modules[mid];
  ms.switches[key] = value;
  if (value === true && !ms.from[key]) ms.from[key] = NOW();
  const c = cap(mid, key);
  logIt(mod(mid).name + ' · ' + c.name + ' → ' + (value === 'winding' ? 'winding down' : value ? 'on' : 'off'));
  save();
}
function enabledFrom(mid, key) { const ms = load().modules[mid]; return ms && ms.from[key]; }
function logIt(what) {
  const s = load();
  s.log.unshift({ at: NOW(), who: s.role, what });
  s.log = s.log.slice(0, 60);
}
function reset() { state = defaults(); save(); }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/* apply a whole proposal produced by the business profile */
function applyProposal(p) {
  const s = load();
  Object.keys(p.modules || {}).forEach((mid) => {
    const want = p.modules[mid];
    if (want.tier) setTier(mid, want.tier);
    Object.keys(want.caps || {}).forEach((k) => { s.modules[mid].switches[k] = want.caps[k]; if (want.caps[k] && !s.modules[mid].from[k]) s.modules[mid].from[k] = NOW(); });
  });
  logIt('Business profile applied');
  save();
}

/* ---------- what a tier would change (for the diff preview) ---------- */
function tierDiff(mid, tier) {
  const s = load(), m = mod(mid), ms = s.modules[mid];
  const add = [], rm = [];
  m.caps.forEach((c) => {
    const want = tier !== 'off' && TIER_IX[c.tier] <= TIER_IX[tier];
    const nowOn = !!ms.switches[c.key];
    if (want && !nowOn) add.push(c);
    if (!want && nowOn) rm.push(c);
  });
  return { add, rm };
}

window.KZ = {
  PLANS, PLAN_IX, TIERS, TIER_IX, ROLES, DEVICES, MODULES,
  state: load, mod, cap, resolve, on, visible, moduleOn,
  setPlan, setRole, setDevice, setTier, setCap, enabledFrom, applyProposal, tierDiff,
  reset, subscribe, plan: () => PLANS[PLAN_IX[load().plan]],
};
})();
