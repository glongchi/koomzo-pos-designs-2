/* Koomzo Signage — fixture data.
   Deliberately shaped like the manifest the player would receive: a board holds
   a QUERY (category + template), never a copy of a price. Prices live in the
   catalogue below and are resolved at render, exactly as the real engine does. */

const SG_NOW = new Date('2026-08-18T11:42:00');

/* ---- the catalogue signage reads from (owned by Inventory / Restaurant) ---- */
window.KZ_SG_CATALOG = {
  'cat.breakfast': { name: 'Breakfast', items: [
    { id:'i1', name:'Omelette maison', desc:'Trois œufs, tomate, oignon', price:1500, stock:12 },
    { id:'i2', name:'Beignets haricot', desc:'Six pièces, bouillie', price:800, stock:40 },
    { id:'i3', name:'Pain perdu', desc:'Pain de mie, miel', price:1200, stock:0 },
    { id:'i4', name:'Café au lait', desc:'Grand verre', price:600, stock:99 },
  ] },
  'cat.grill': { name: 'Grillades', items: [
    { id:'i5', name:'Poulet DG', desc:'Plantain, légumes sautés', price:5500, stock:8 },
    { id:'i6', name:'Poisson braisé', desc:'Bar entier, piment vert', price:6500, stock:4 },
    { id:'i7', name:'Brochettes bœuf', desc:'Quatre pièces, bâton', price:2500, stock:0 },
    { id:'i8', name:'Côtes de porc', desc:'Sauce tomate, frites', price:4500, stock:15 },
  ] },
  'cat.drinks': { name: 'Boissons', items: [
    { id:'i9',  name:'Castel 65cl', desc:'', price:1000, stock:120 },
    { id:'i10', name:'Top Ananas', desc:'', price:600, stock:64 },
    { id:'i11', name:'Eau minérale 1,5L', desc:'', price:500, stock:200 },
  ] },
  'cat.shelf': { name: 'Épicerie — promotions', items: [
    { id:'i12', name:'Riz parfumé 5kg', desc:'', price:6500, was:7800, stock:34 },
    { id:'i13', name:'Huile végétale 5L', desc:'', price:8200, was:9000, stock:12 },
    { id:'i14', name:'Lait en poudre 400g', desc:'', price:2900, was:3400, stock:0 },
    { id:'i15', name:'Savon de Marseille', desc:'Lot de 3', price:1500, was:1800, stock:88 },
  ] },
  'cat.rooms': { name: 'Chambres — tarifs', unit:'nuit', items: [
    { id:'r1', name:'Chambre standard',  desc:'Lit double · clim · douche',        price:25000, stock:3 },
    { id:'r2', name:'Chambre supérieure', desc:'Lit king · clim · bureau',          price:35000, stock:2 },
    { id:'r3', name:'Suite junior',      desc:'Salon séparé · baignoire',         price:55000, stock:0 },
    { id:'r4', name:'Appartement meublé', desc:'Deux chambres · cuisine · Annexe', price:95000, stock:1, unit:'nuit' },
  ] },
  /* ---- gym & wellness. Same contract: the board holds a QUERY, so a plan price
     or a class filling up reaches the wall without anyone republishing. ---- */
  'cat.gymplans': { name: 'Abonnements — tarifs', unit:'mois', items: [
    { id:'gp1', name:'VIP Accès total',      desc:'Salle · studios · piscine · spa', price:180000, stock:6 },
    { id:'gp2', name:'Cadre entreprise',     desc:'Salle · studios · piscine',        price:150000, stock:4 },
    { id:'gp3', name:'Club standard',        desc:'Salle · studios',                  price:95000,  stock:12 },
    { id:'gp4', name:'Matin hors pointe',    desc:'Salle · 05h30 – 11h00',            price:55000,  stock:0 },
    { id:'gp5', name:'Piscine & spa',        desc:'Piscine · sauna · hammam',         price:75000,  stock:9 },
  ] },
  'cat.gymclasses': { name: 'Cours du jour', unit:'séance', items: [
    { id:'gc1', at:'12:30', name:'Boxe · technique',   desc:'Studio A · Coach Yves',    price:0,    stock:4 },
    { id:'gc2', at:'17:30', name:'Pilates tapis',      desc:'Studio B · Coach Nadège',  price:0,    stock:0 },
    { id:'gc3', at:'18:30', name:'Spinning coucher',   desc:'Studio A · Coach Arnaud',  price:0,    stock:8 },
    { id:'gc4', at:'19:30', name:'Aqua fit',           desc:'Piscine · Estelle',        price:5000, stock:8 },
  ] },
  'cat.gymfloor': { name: 'Fréquentation', unit:'personnes', cap:180, items: [
    { id:'gf1', name:'Salle & cardio', desc:'70 places', price:0, stock:3 },
    { id:'gf2', name:'Studios',        desc:'38 places', price:0, stock:1 },
    { id:'gf3', name:'Piscine',        desc:'24 places', price:0, stock:1 },
    { id:'gf4', name:'Spa & sauna',    desc:'2 cabines', price:0, stock:0 },
  ] },
};

window.KZ_SG_SITES = [
  { id:'s1', name:'Bonapriso' },
  { id:'s2', name:'Akwa' },
  { id:'s3', name:'Bonabéri' },
];

window.KZ_SG_KINDS = {
  tv_stick:          { label:'Android stick',  icon:'hardware-chip-outline' },
  smart_tv:          { label:'Smart TV',       icon:'tv-outline' },
  kiosk_browser:     { label:'Kiosk browser',  icon:'desktop-outline' },
  tablet:            { label:'Tablet',         icon:'tablet-portrait-outline' },
  till_second_screen:{ label:'Till screen',    icon:'card-outline' },
};

window.KZ_SG_STATES = {
  playing:     { label:'Playing',     ink:'#217844', wash:'#2e9e5b14', dot:'#2e9e5b' },
  offline:     { label:'Offline',     ink:'#a8412a', wash:'#ec603a14', dot:'#ec603a' },
  stale_cache: { label:'Stale cache', ink:'#8d5f14', wash:'#e0a32e18', dot:'#e0a32e' },
  unpaired:    { label:'Unpaired',    ink:'#5b6070', wash:'#f4f6f9',   dot:'#a3a8b6' },
  takeover:    { label:'Takeover',    ink:'#743394', wash:'#8d3fb014', dot:'#8d3fb0' },
};

/* ---- assets (media library) ---- */
window.KZ_SG_ASSETS = [
  { id:'a1', name:'Promo rentrée — riz & huile', kind:'image', bytes:1_840_000, w:1920, h:1080, tone:'#8d3fb0', expires:'2026-09-15' },
  { id:'a2', name:'Happy hour 17h–19h',          kind:'image', bytes:1_120_000, w:1920, h:1080, tone:'#ec603a', expires:null },
  { id:'a3', name:'Spot Poulet DG',              kind:'video', bytes:42_600_000, w:1920, h:1080, ms:22_000, tone:'#303b57', expires:null },
  { id:'a4', name:'Mobile money accepté',        kind:'image', bytes:620_000,   w:1080, h:1920, tone:'#2e9e5b', expires:null },
  { id:'a5', name:'Nouveau: livraison Akwa',     kind:'image', bytes:980_000,   w:1920, h:1080, tone:'#4b4ad9', expires:'2026-08-31' },
  { id:'a6', name:'Spot ambiance terrasse',      kind:'video', bytes:88_400_000, w:1920, h:1080, ms:31_000, tone:'#b4791c', expires:null },
];

/* ---- boards: a template + a bound query. No prices stored here. ---- */
window.KZ_SG_BOARDS = [
  { id:'b1', name:'Petit-déjeuner',   kind:'menu',  template:'two-col',  source:'cat.breakfast', soldOut:'grey',   accent:'#8d3fb0' },
  { id:'b2', name:'Grillades du soir', kind:'menu',  template:'hero',     source:'cat.grill',     soldOut:'strike', accent:'#303b57' },
  { id:'b3', name:'Boissons',          kind:'price', template:'list',     source:'cat.drinks',    soldOut:'hide',   accent:'#2e9e5b' },
  { id:'b4', name:'Promos rayon',      kind:'price', template:'grid',     source:'cat.shelf',     soldOut:'grey',   accent:'#ec603a' },
  /* the rates board: reception's wall. Same contract as every other board — it holds
     a query, not a price, so a rate change at the desk reaches the lobby unpublished. */
  { id:'b5', name:'Tarifs chambres',   kind:'rate',  template:'rates',    source:'cat.rooms',     soldOut:'grey',   accent:'#303b57' },
  /* the club's three walls. Availability is read from the rack, so a full class
     cannot be advertised as open. */
  { id:'b6', name:'Tarifs abonnements', kind:'rate',  template:'rates',    source:'cat.gymplans',  soldOut:'grey',   accent:'#b5453f' },
  { id:'b7', name:'Cours du jour',      kind:'rate',  template:'classes',  source:'cat.gymclasses', soldOut:'grey',  accent:'#303b57' },
  { id:'b8', name:'Fréquentation salle', kind:'rate', template:'occupancy', source:'cat.gymfloor',  soldOut:'grey',  accent:'#1f6f4a' },
];

/* ---- playlists (schema: loop) ---- */
window.KZ_SG_PLAYLISTS = [
  { id:'p1', name:'Restaurant — journée', status:'published', version:14, audio:'muted', items:[
    { id:'pi1', kind:'board',  ref:'b1', ms:20000, cond:'Until 11:00' },
    { id:'pi2', kind:'board',  ref:'b2', ms:20000, cond:'From 11:00' },
    { id:'pi3', kind:'media',  ref:'a3', ms:22000 },
    { id:'pi4', kind:'board',  ref:'b3', ms:14000 },
    { id:'pi5', kind:'media',  ref:'a2', ms:10000, cond:'From 17:00' },
  ] },
  { id:'p2', name:'Épicerie — rayon', status:'published', version:6, audio:'muted', items:[
    { id:'pi6', kind:'board',  ref:'b4', ms:18000 },
    { id:'pi7', kind:'media',  ref:'a1', ms:12000 },
    { id:'pi8', kind:'ticker', ref:null, ms:12000 },
    { id:'pi9', kind:'media',  ref:'a4', ms:8000 },
  ] },
  { id:'p3', name:'Salon — file d’attente', status:'published', version:3, audio:'muted', items:[
    { id:'pi10', kind:'nowserving', ref:null, ms:0 },
    { id:'pi11', kind:'media', ref:'a5', ms:10000 },
  ] },
  { id:'p5', name:'Réception — tarifs', status:'published', version:2, audio:'muted', items:[
    { id:'pi15', kind:'board', ref:'b5', ms:22000 },
    { id:'pi16', kind:'media', ref:'a4', ms:8000 },
    { id:'pi17', kind:'media', ref:'a5', ms:10000 },
  ] },
  { id:'p6', name:'Club — accueil', status:'published', version:4, audio:'muted', items:[
    { id:'pi18', kind:'board', ref:'b7', ms:18000 },
    { id:'pi19', kind:'board', ref:'b6', ms:20000 },
    { id:'pi20', kind:'media', ref:'a4', ms:8000 },
  ] },
  { id:'p7', name:'Club — plateau', status:'published', version:2, audio:'muted', items:[
    { id:'pi21', kind:'board', ref:'b8', ms:14000 },
    { id:'pi22', kind:'board', ref:'b7', ms:16000 },
  ] },
];

window.KZ_SG_GROUPS = [
  { id:'g1', name:'Toutes les salles', siteIds:['s1','s2'], playlistId:'p1' },
  { id:'g2', name:'Rayons épicerie',   siteIds:['s1','s3'], playlistId:'p2' },
];

/* ---- the fleet ---- */
window.KZ_SG_PLAYERS = [
  { id:'d1', label:'Salle — mur nord', siteId:'s1', kind:'tv_stick', state:'playing',
    orientation:'landscape', res:'1920×1080', playlistId:'p1', groupId:'g1',
    lastSeenMin:0, cacheMb:2140, cacheCapMb:3800, version:'1.4.2', nowItem:'pi2' },
  { id:'d2', label:'Terrasse', siteId:'s1', kind:'smart_tv', state:'playing',
    orientation:'landscape', res:'3840×2160', playlistId:'p1', groupId:'g1',
    lastSeenMin:1, cacheMb:2140, cacheCapMb:12000, version:'1.4.2', nowItem:'pi3' },
  { id:'d3', label:'Rayon épicerie 1', siteId:'s1', kind:'tv_stick', state:'stale_cache',
    orientation:'landscape', res:'1920×1080', playlistId:'p2', groupId:'g2',
    lastSeenMin:2, cacheMb:3610, cacheCapMb:3800, version:'1.3.9', nowItem:'pi6', staleVersion:5 },
  { id:'d4', label:'Caisse 2 — écran client', siteId:'s1', kind:'till_second_screen', state:'playing',
    orientation:'landscape', res:'1366×768', playlistId:'p2', groupId:null,
    lastSeenMin:0, cacheMb:410, cacheCapMb:2000, version:'1.4.2', nowItem:'pi7', idleHandover:true },
  { id:'d5', label:'Akwa — entrée', siteId:'s2', kind:'kiosk_browser', state:'offline',
    orientation:'landscape', res:'1920×1080', playlistId:'p1', groupId:'g1',
    lastSeenMin:47, cacheMb:1980, cacheCapMb:9000, version:'1.4.2', nowItem:'pi1' },
  { id:'d6', label:'Salon — file', siteId:'s2', kind:'tablet', state:'playing',
    orientation:'portrait', res:'1200×1920', playlistId:'p3', groupId:null,
    lastSeenMin:0, cacheMb:180, cacheCapMb:4000, version:'1.4.2', nowItem:'pi10' },
  { id:'d7', label:'Bonabéri — rayon', siteId:'s3', kind:'tv_stick', state:'unpaired',
    orientation:'landscape', res:'1920×1080', playlistId:null, groupId:null,
    lastSeenMin:0, cacheMb:0, cacheCapMb:3800, version:'1.4.2', pairCode:'4 8 2 1 5 9' },
  { id:'d9', label:'Club — accueil', siteId:'s1', kind:'smart_tv', state:'playing',
    orientation:'landscape', res:'3840×2160', playlistId:'p6', groupId:null,
    lastSeenMin:0, cacheMb:290, cacheCapMb:12000, version:'1.4.2', nowItem:'pi18' },
  { id:'d10', label:'Club — plateau nord', siteId:'s1', kind:'tv_stick', state:'playing',
    orientation:'landscape', res:'1920×1080', playlistId:'p7', groupId:null,
    lastSeenMin:1, cacheMb:180, cacheCapMb:3800, version:'1.4.2', nowItem:'pi21' },
  { id:'d11', label:'Club — vestiaire femmes', siteId:'s1', kind:'tablet', state:'offline',
    orientation:'portrait', res:'1200×1920', playlistId:'p7', groupId:null,
    lastSeenMin:23, cacheMb:120, cacheCapMb:4000, version:'1.4.2', nowItem:'pi22' },
  { id:'d8', label:'Réception — mur tarifs', siteId:'s1', kind:'smart_tv', state:'playing',
    orientation:'landscape', res:'3840×2160', playlistId:'p5', groupId:null,
    lastSeenMin:0, cacheMb:340, cacheCapMb:12000, version:'1.4.2', nowItem:'pi15' },
];

/* ---- schedule rules. Precedence: takeover > dated > daypart > default ---- */
window.KZ_SG_RULES = [
  { id:'r1', scope:'g1', scopeLabel:'Toutes les salles', playlistId:'p1', kind:'daypart', when:'06:00 – 11:00', dow:'Tous les jours', priority:10, detail:'Petit-déjeuner' },
  { id:'r2', scope:'g1', scopeLabel:'Toutes les salles', playlistId:'p1', kind:'daypart', when:'11:00 – 23:00', dow:'Tous les jours', priority:10, detail:'Grillades' },
  { id:'r3', scope:'g2', scopeLabel:'Rayons épicerie',   playlistId:'p2', kind:'default', when:'Toute la journée', dow:'Tous les jours', priority:0, detail:'Playlist par défaut' },
  { id:'r4', scope:'g2', scopeLabel:'Rayons épicerie',   playlistId:'p4', kind:'dated',   when:'25 août – 15 sept', dow:'Tous les jours', priority:20, detail:'Campagne rentrée', conflict:true },
  { id:'r5', scope:'d6', scopeLabel:'Salon — file',      playlistId:'p3', kind:'default', when:'Toute la journée', dow:'Lun – Sam', priority:0, detail:'Now serving' },
  { id:'r6', scope:'d8', scopeLabel:'Réception — mur tarifs', playlistId:'p5', kind:'default', when:'Toute la journée', dow:'Tous les jours', priority:0, detail:'Tarifs chambres' },
  { id:'r7', scope:'d9', scopeLabel:'Club — accueil', playlistId:'p6', kind:'default', when:'05h30 – 22h30', dow:'Tous les jours', priority:0, detail:'Cours et abonnements' },
  { id:'r8', scope:'d10', scopeLabel:'Club — plateau nord', playlistId:'p7', kind:'default', when:'05h30 – 22h30', dow:'Tous les jours', priority:0, detail:'Fréquentation' },
];

/* ---- proof of play: what actually played ---- */
window.KZ_SG_PROOF = [
  { playerId:'d1', label:'Salle — mur nord', plays:412, hours:11.4, gapMin:0,  items:[
    ['Petit-déjeuner', 96, 32], ['Grillades du soir', 148, 49], ['Spot Poulet DG', 121, 44], ['Boissons', 47, 11] ] },
  { playerId:'d2', label:'Terrasse', plays:388, hours:11.2, gapMin:6, items:[
    ['Grillades du soir', 141, 47], ['Spot Poulet DG', 118, 43], ['Happy hour 17h–19h', 62, 10], ['Boissons', 67, 15] ] },
  { playerId:'d3', label:'Rayon épicerie 1', plays:290, hours:9.8, gapMin:22, items:[
    ['Promos rayon', 108, 32], ['Promo rentrée', 96, 19], ['Ticker prix', 86, 17] ] },
  { playerId:'d5', label:'Akwa — entrée', plays:96, hours:2.6, gapMin:47, items:[
    ['Petit-déjeuner', 41, 13], ['Spot Poulet DG', 55, 20] ] },
  { playerId:'d8', label:'Réception — mur tarifs', plays:344, hours:11.6, gapMin:0, items:[
    ['Tarifs chambres', 196, 72], ['Mobile money accepté', 78, 10], ['Livraison Akwa', 70, 12] ] },
];

window.KZ_SG_TAKEOVER = null; /* set by the UI when a manager starts one */

window.KZ_SG_FMT = {
  money: (n) => window.KZ_LOCALE.short(n),
  mb: (n) => n >= 1000 ? (n / 1000).toFixed(1) + ' GB' : n + ' MB',
  bytes: (b) => b >= 1_000_000 ? (b / 1_000_000).toFixed(1) + ' MB' : Math.round(b / 1000) + ' KB',
  secs: (ms) => ms >= 1000 ? Math.round(ms / 1000) + 's' : '—',
  ago: (min) => min === 0 ? 'à l’instant' : min < 60 ? min + ' min' : Math.round(min / 60) + ' h',
};
