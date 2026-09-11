/* Koomzo Hotel — the demo property. Douala, Cameroon: 12 rooms in the main house,
   4 furnished apartments in the annex, a restaurant and bar that post to the folio.
   Money is XAF: integers, no minor units. Rates are per night unless plan says otherwise. */
window.HT = {
  prop: 'Bilongue Suites',
  city: 'Douala · Bonapriso',
  today: 'Sunday 16 August 2026',
  dayNo: 16, month: 'Aug',
  vat: 0.1925,          /* Cameroon standard rate */
  levy: 1000,           /* taxe de séjour, per guest per night */
  ccy: 'FCFA',
  checkout: '12:00', checkin: '14:00',

  types: [
    { id:'std',   name:'Standard double', short:'Std',   rate:32000, cap:2 },
    { id:'sup',   name:'Superior twin',   short:'Sup',   rate:45000, cap:2 },
    { id:'suite', name:'Suite',           short:'Suite', rate:70000, cap:3 },
    { id:'apt',   name:'Furnished apartment', short:'Apt', rate:55000, cap:4, monthly:450000, weekly:290000 },
  ],

  rooms: [
    { no:'101', type:'std',   floor:'Ground', wing:'Main',  beds:'1 double' },
    { no:'102', type:'std',   floor:'Ground', wing:'Main',  beds:'1 double' },
    { no:'103', type:'std',   floor:'Ground', wing:'Main',  beds:'1 double' },
    { no:'104', type:'sup',   floor:'Ground', wing:'Main',  beds:'2 singles' },
    { no:'105', type:'sup',   floor:'Ground', wing:'Main',  beds:'2 singles' },
    { no:'106', type:'std',   floor:'Ground', wing:'Main',  beds:'1 double' },
    { no:'201', type:'sup',   floor:'First',  wing:'Main',  beds:'2 singles' },
    { no:'202', type:'sup',   floor:'First',  wing:'Main',  beds:'1 double' },
    { no:'203', type:'std',   floor:'First',  wing:'Main',  beds:'1 double' },
    { no:'204', type:'std',   floor:'First',  wing:'Main',  beds:'1 double' },
    { no:'205', type:'suite', floor:'First',  wing:'Main',  beds:'1 king + sofa' },
    { no:'206', type:'suite', floor:'First',  wing:'Main',  beds:'1 king + sofa' },
    { no:'A1',  type:'apt',   floor:'Annex',  wing:'Annex', beds:'1 bed + kitchen' },
    { no:'A2',  type:'apt',   floor:'Annex',  wing:'Annex', beds:'2 beds + kitchen' },
    { no:'A3',  type:'apt',   floor:'Annex',  wing:'Annex', beds:'1 bed + kitchen' },
    { no:'A4',  type:'apt',   floor:'Annex',  wing:'Annex', beds:'2 beds + kitchen' },
  ],

  /* from = nights offset from today (0 = tonight). status is explicit so the rack
     never has to guess; the calendar uses from + nights. */
  stays: [
    { id:'st1', no:'101', gid:'g1', guest:'Samuel Ebong',      from:-2, nights:4, status:'inhouse', rate:32000, plan:'nightly', source:'phone',    adults:1, deposit:0 },
    { id:'st2', no:'104', gid:'g2', guest:'Claudine Ngo Bella', from:-1, nights:2, status:'due',     rate:45000, plan:'nightly', source:'walkin',   adults:2, deposit:0 },
    { id:'st3', no:'205', gid:'g3', guest:'Dr Fotso Bernard',  from:-3, nights:6, status:'inhouse', rate:70000, plan:'nightly', source:'corporate',adults:2, deposit:0, company:'Total E&P Cameroun' },
    { id:'st4', no:'202', gid:'g4', guest:'Lena Weber',        from:-1, nights:3, status:'inhouse', rate:48000, plan:'nightly', source:'booking',  adults:2, deposit:0, ref:'BDC-4471902' },
    { id:'st5', no:'A2',  gid:'g5', guest:'Ir. Njike Paul',    from:-24, nights:90, status:'inhouse', rate:450000, plan:'monthly', source:'corporate', adults:2, deposit:450000, company:'MTN Cameroon', renew:'14 Nov 2026' },
    { id:'st6', no:'A3',  gid:'g6', guest:'Mme Awono Régine',  from:-9, nights:30, status:'inhouse', rate:290000, plan:'weekly', source:'phone', adults:1, deposit:150000 },
    { id:'st7', no:'106', gid:'g7', guest:'Eric Mbappé Sone',  from:0,  nights:2, status:'arr', rate:32000, plan:'nightly', source:'walkin',  adults:1, deposit:0 },
    { id:'st8', no:'206', gid:'g8', guest:'Kouam & Sons (2 rooms)', from:0, nights:3, status:'arr', rate:70000, plan:'nightly', source:'agent', adults:3, deposit:0, ref:'AG-2261' },
    { id:'st9', no:'201', gid:'g9', guest:'Adeline Tchoupo',   from:0,  nights:1, status:'arr', rate:45000, plan:'nightly', source:'airbnb', adults:2, deposit:0, ref:'HMABC7X' },
    { id:'st10', no:'103', gid:'g10', guest:'Blaise Nkoulou',  from:2,  nights:2, status:'booked', rate:32000, plan:'nightly', source:'phone', adults:1, deposit:0 },
    { id:'st11', no:'A1',  gid:'g11', guest:'Sarah Etonde',    from:4,  nights:14, status:'booked', rate:290000, plan:'weekly', source:'booking', adults:2, deposit:100000, ref:'BDC-4498120' },
    { id:'st12', no:'205', gid:'g12', guest:'Yaoundé Delegation', from:6, nights:2, status:'booked', rate:70000, plan:'nightly', source:'corporate', adults:2, deposit:0, company:'MINEPAT' },
  ],

  /* pre-arrival: the guest fills the registration card before they travel, over the
     link we send to WhatsApp. Verified submissions become register lines at check-in,
     so nobody retypes a passport at the desk. State machine:
       not_sent -> sent -> opened -> submitted -> verified   (declined is terminal) */
  prearr: [
    { stayId:'st7',  state:'verified',  sentAt:'15 Aug 17:20', doneAt:'15 Aug 19:05', via:'whatsapp',
      idType:'CNI', idNo:'1198 4407 221', country:'Cameroun', dob:'04/07/1991', addr:'Yaoundé · Bastos',
      purpose:'Affaires', plate:'LT 8842 Y', eta:'15:30', idShot:true, sig:true, verifiedBy:'u1' },
    { stayId:'st8',  state:'submitted', sentAt:'15 Aug 09:10', doneAt:'16 Aug 07:40', via:'whatsapp',
      idType:'Passeport', idNo:'CM0921884', country:'Cameroun', dob:'22/11/1978', addr:'Douala · Bonanjo',
      purpose:'Affaires', plate:null, eta:'14:00', idShot:true, sig:true, flag:'ID photo blurred on the second page' },
    { stayId:'st9',  state:'opened',    sentAt:'16 Aug 06:55', doneAt:null, via:'whatsapp', eta:null },
    { stayId:'st11', state:'sent',      sentAt:'16 Aug 08:02', doneAt:null, via:'whatsapp', eta:null },
    { stayId:'st12', state:'not_sent',  sentAt:null, doneAt:null, via:null, eta:null },
    { stayId:'st10', state:'declined',  sentAt:'15 Aug 12:00', doneAt:'15 Aug 12:40', via:'sms',
      note:'Guest prefers to fill the card at the desk' },
  ],

  /* the fields the guest-facing card asks for. required drives the submit guard, and
     register marks the ones the statutory book needs — those can never be optional. */
  prearrFields: [
    { id:'name',    label:'Nom complet',            kind:'text',   required:true,  register:true },
    { id:'phone',   label:'Téléphone',               kind:'tel',    required:true,  register:false },
    { id:'idType',  label:'Pièce d’identité',         kind:'choice', required:true,  register:true, options:['CNI', 'Passeport', 'Permis', 'Carte de séjour'] },
    { id:'idNo',    label:'Numéro de la pièce',       kind:'text',   required:true,  register:true },
    { id:'idShot',  label:'Photo de la pièce',        kind:'photo',  required:true,  register:true },
    { id:'country', label:'Nationalité',              kind:'choice', required:true,  register:true, options:['Cameroun', 'Nigeria', 'Tchad', 'Gabon', 'France', 'Autre'] },
    { id:'dob',     label:'Date de naissance',       kind:'date',   required:true,  register:true },
    { id:'addr',    label:'Domicile habituel',       kind:'text',   required:true,  register:true },
    { id:'purpose', label:'Motif du séjour',          kind:'choice', required:false, register:true, options:['Affaires', 'Tourisme', 'Famille', 'Transit'] },
    { id:'plate',   label:'Immatriculation véhicule', kind:'text',   required:false, register:false },
    { id:'eta',     label:'Heure d’arrivée prévue',    kind:'time',   required:false, register:false },
    { id:'sig',     label:'Signature',               kind:'sign',   required:true,  register:true },
  ],

  /* folio lines per stay. kind drives the icon and whether it is a charge or a payment. */
  folio: {
    st1: [
      { at:'14 Aug 14:20', kind:'room', desc:'Room 101 · standard double', amount:32000, src:'Reception' },
      { at:'14 Aug 21:05', kind:'fnb',  desc:'Dinner · table 6 (2 covers)', amount:14500, src:'Lodge Restaurant' },
      { at:'15 Aug 08:10', kind:'room', desc:'Room 101 · standard double', amount:32000, src:'Night audit' },
      { at:'15 Aug 19:40', kind:'bar',  desc:'Bar tab · 3 × Castel', amount:3000, src:'Lodge Bar' },
      { at:'15 Aug 20:00', kind:'levy', desc:'Tourist levy · 1 guest × 2 nights', amount:2000, src:'Night audit' },
      { at:'14 Aug 14:25', kind:'payment', desc:'Deposit · MTN MoMo ****4417', amount:-40000, src:'Reception' },
    ],
    st2: [
      { at:'15 Aug 15:40', kind:'room', desc:'Room 104 · superior twin', amount:45000, src:'Reception' },
      { at:'15 Aug 22:15', kind:'bar',  desc:'Bar tab · wine + water', amount:9500, src:'Lodge Bar' },
      { at:'16 Aug 07:30', kind:'fnb',  desc:'Breakfast × 2', amount:7000, src:'Lodge Restaurant' },
      { at:'16 Aug 07:35', kind:'levy', desc:'Tourist levy · 2 guests × 1 night', amount:2000, src:'Night audit' },
    ],
    st3: [
      { at:'13 Aug 11:00', kind:'room', desc:'Suite 205 × 3 nights', amount:210000, src:'Reception' },
      { at:'14 Aug 13:20', kind:'laundry', desc:'Laundry · 6 pieces', amount:6500, src:'Housekeeping' },
      { at:'15 Aug 20:30', kind:'fnb', desc:'Dinner · charged to room', amount:26000, src:'Lodge Restaurant' },
      { at:'16 Aug 09:00', kind:'levy', desc:'Tourist levy · 2 guests × 3 nights', amount:6000, src:'Night audit' },
    ],
    st4: [
      { at:'15 Aug 16:10', kind:'room', desc:'Room 202 · Booking.com rate', amount:48000, src:'OTA import' },
      { at:'15 Aug 20:55', kind:'fnb', desc:'Dinner · table 3', amount:11000, src:'Lodge Restaurant' },
      { at:'16 Aug 08:00', kind:'levy', desc:'Tourist levy · 2 guests × 1 night', amount:2000, src:'Night audit' },
    ],
    st5: [
      { at:'01 Aug 09:00', kind:'room', desc:'Apartment A2 · August rent', amount:450000, src:'Long stay' },
      { at:'01 Aug 09:02', kind:'other', desc:'Water & electricity · July meter', amount:38500, src:'Long stay' },
      { at:'04 Aug 10:30', kind:'payment', desc:'August rent · bank transfer', amount:-450000, src:'Accounts' },
    ],
    st6: [
      { at:'12 Aug 12:00', kind:'room', desc:'Apartment A3 · week 2', amount:290000, src:'Long stay' },
      { at:'13 Aug 15:00', kind:'laundry', desc:'Weekly linen change', amount:5000, src:'Housekeeping' },
      { at:'12 Aug 12:05', kind:'payment', desc:'Week 2 · Orange Money ****7781', amount:-290000, src:'Reception' },
    ],
  },

  guests: [
    { id:'g1', name:'Samuel Ebong',       phone:'+237 6 99 41 22 08', idType:'CNI',      idNo:'109884471', country:'Cameroon', stays:4, nights:11, notes:'Prefers ground floor, quiet side.' },
    { id:'g2', name:'Claudine Ngo Bella', phone:'+237 6 77 30 15 62', idType:'CNI',      idNo:'118240097', country:'Cameroon', stays:1, nights:2,  notes:'' },
    { id:'g3', name:'Dr Fotso Bernard',   phone:'+237 6 96 12 44 30', idType:'Passport', idNo:'CM8841203', country:'Cameroon', stays:9, nights:34, notes:'Total E&P account — invoice monthly, never at desk.' },
    { id:'g4', name:'Lena Weber',         phone:'+49 171 2244 881',   idType:'Passport', idNo:'C4XKP9012', country:'Germany',  stays:1, nights:3,  notes:'Booking.com · breakfast included in rate.' },
    { id:'g5', name:'Ir. Njike Paul',     phone:'+237 6 55 80 12 40', idType:'CNI',      idNo:'104472290', country:'Cameroon', stays:1, nights:90, notes:'MTN secondment. Apartment A2 to mid-November.' },
    { id:'g6', name:'Mme Awono Régine',   phone:'+237 6 78 44 90 11', idType:'CNI',      idNo:'112993004', country:'Cameroon', stays:2, nights:37, notes:'Pays weekly by Orange Money.' },
    { id:'g7', name:'Eric Mbappé Sone',   phone:'+237 6 90 22 71 55', idType:'',         idNo:'',          country:'Cameroon', stays:1, nights:0,  notes:'Walk-in — ID still to be captured.' },
    { id:'g8', name:'Kouam & Sons',       phone:'+237 6 74 11 08 32', idType:'CNI',      idNo:'120044817', country:'Cameroon', stays:3, nights:9,  notes:'Agent booking, two rooms usually.' },
    { id:'g9', name:'Adeline Tchoupo',    phone:'+237 6 71 55 39 04', idType:'CNI',      idNo:'117300228', country:'Cameroon', stays:1, nights:1,  notes:'Airbnb · late arrival, after 22:00.' },
  ],

  /* staff carry their week: roster[0..6] = Mon..Sun shift code (see shiftDefs).
     dept drives the shift board columns; clock is today's attendance. */
  staff: [
    { id:'u1', name:'Mireille Ngo Bassong', first:'Mireille', role:'Front desk · manager', init:'MN', tone:'t1', pin:'2210', access:{ setup:true, audit:true, rates:true },
      dept:'Front desk', phone:'+237 6 99 12 40 88', area:'Reception', roster:['M','M','M','M','M','O','A'], clock:'in 13:52' },
    { id:'u2', name:'Alain Tchouta',        first:'Alain',    role:'Receptionist',         init:'AT', tone:'t2', pin:'4417', access:{ setup:false, audit:false, rates:false },
      dept:'Front desk', phone:'+237 6 77 04 51 19', area:'Reception', roster:['A','A','O','M','M','M','M'], clock:'in 05:58' },
    { id:'u3', name:'Régine Mbah',          first:'Régine',   role:'Housekeeping',         init:'RM', tone:'t3', pin:'8802', access:{ setup:false, audit:false, rates:false },
      dept:'Housekeeping', phone:'+237 6 78 22 63 07', area:'Ground floor', roster:['M','M','M','O','M','M','M'], clock:'in 06:05' },
    { id:'u4', name:'Sylvie Etoundi',       first:'Sylvie',   role:'Housekeeping',         init:'SE', tone:'t4', pin:'6690', access:{ setup:false, audit:false, rates:false },
      dept:'Housekeeping', phone:'+237 6 90 71 34 52', area:'First floor · Annex', roster:['A','O','A','A','A','A','M'], clock:'late' },
    { id:'u5', name:'Joseph Kamdem',        first:'Joseph',   role:'Maintenance',          init:'JK', tone:'t5', pin:'3341', access:{ setup:false, audit:false, rates:false },
      dept:'Maintenance', phone:'+237 6 55 19 80 24', area:'Whole property', roster:['M','M','M','M','M','M','O'], clock:null },
    { id:'u6', name:'Bertrand Ekani',       first:'Bertrand', role:'Front desk · night auditor', init:'BE', tone:'t2', pin:'9014', access:{ setup:false, audit:true, rates:false },
      dept:'Front desk', phone:'+237 6 96 55 22 71', area:'Reception', roster:['N','N','N','O','N','N','N'], clock:null },
    { id:'u7', name:'Pauline Meka',         first:'Pauline',  role:'Restaurant · service',  init:'PM', tone:'t3', pin:'5527', access:{ setup:false, audit:false, rates:false },
      dept:'Restaurant', phone:'+237 6 71 90 18 43', area:'Restaurant & bar', roster:['A','A','A','L','L','A','A'], clock:'in 14:10' },
    { id:'u8', name:'Désiré Onana',         first:'Désiré',   role:'Security · guard',      init:'DO', tone:'t5', pin:'7738', access:{ setup:false, audit:false, rates:false },
      dept:'Security', phone:'+237 6 74 60 29 15', area:'Gate & car park', roster:['N','N','O','N','N','N','N'], clock:null },
  ],

  /* the roster week: Monday 10 → Sunday 16 August 2026. todayIdx points at Sunday. */
  week: [['Mon','10'], ['Tue','11'], ['Wed','12'], ['Thu','13'], ['Fri','14'], ['Sat','15'], ['Sun','16']],
  todayIdx: 6,
  shiftDefs: [
    { code:'M', name:'Morning',   time:'06:00 – 14:00', hours:8 },
    { code:'A', name:'Afternoon', time:'14:00 – 22:00', hours:8 },
    { code:'N', name:'Night',     time:'22:00 – 06:00', hours:8 },
    { code:'O', name:'Off',       time:'—',             hours:0 },
    { code:'L', name:'Leave',     time:'Annual leave',  hours:0 },
  ],
  /* minimum bodies per department, per shift — the board flags anything short */
  cover: {
    M: { 'Front desk':2, 'Housekeeping':2, 'Maintenance':1 },
    A: { 'Front desk':1, 'Housekeeping':1, 'Restaurant':1 },
    N: { 'Front desk':1, 'Security':1 },
  },

  /* housekeeping state per room. clean | dirty | cleaning | inspect ; linen = due a change */
  house: [
    { no:'102', state:'dirty',    to:'u3', pri:'depart', linen:true,  note:'Departed 09:40 — deep clean, guest spilled oil' },
    { no:'105', state:'cleaning', to:'u4', pri:'depart', linen:true,  note:'' },
    { no:'203', state:'inspect',  to:'u3', pri:'stay',   linen:false, note:'Ready for inspection' },
    { no:'204', state:'clean',    to:null, pri:'stay',   linen:false, note:'' },
    { no:'101', state:'clean',    to:'u3', pri:'stay',   linen:false, note:'Stayover — towels only' },
    { no:'104', state:'dirty',    to:null, pri:'depart', linen:true,  note:'Departs today 12:00' },
    { no:'A4',  state:'clean',    to:null, pri:'deep',   linen:false, note:'Monthly deep clean done 12 Aug' },
    { no:'A1',  state:'dirty',    to:'u4', pri:'deep',   linen:true,  note:'Prepare for 14-night stay Wednesday' },
  ],

  maint: [
    { id:'m1', no:'203', issue:'Air-conditioner leaking onto the floor', since:'15 Aug', state:'open',  to:'u5', ooo:false },
    { id:'m2', no:'102', issue:'Shower mixer dripping',                  since:'14 Aug', state:'open',  to:'u5', ooo:false },
    { id:'m3', no:'A4',  issue:'Kitchen socket burnt — apartment off sale', since:'11 Aug', state:'ooo', to:'u5', ooo:true },
  ],

  /* meters for long-stay apartments — read monthly, billed on */
  meters: [
    { no:'A2', kind:'Electricity (ENEO)', last:4412, prev:4180, unit:'kWh', price:99 },
    { no:'A2', kind:'Water (CAMWATER)',   last:388,  prev:361,  unit:'m³',  price:365 },
    { no:'A3', kind:'Electricity (ENEO)', last:2210, prev:2094, unit:'kWh', price:99 },
  ],

  sources: [
    { id:'walkin',    name:'Walk-in',        icon:'walk-outline',      ota:false },
    { id:'phone',     name:'Phone / WhatsApp', icon:'logo-whatsapp',   ota:false },
    { id:'corporate', name:'Corporate account', icon:'business-outline', ota:false },
    { id:'booking',   name:'Booking.com',    icon:'globe-outline',     ota:true },
    { id:'airbnb',    name:'Airbnb',         icon:'globe-outline',     ota:true },
    { id:'agent',     name:'Travel agent',   icon:'briefcase-outline', ota:true },
  ],

  tenders: [
    { id:'cash',   name:'Cash',         icon:'cash-outline' },
    { id:'momo',   name:'MTN MoMo',     icon:'phone-portrait-outline' },
    { id:'orange', name:'Orange Money', icon:'phone-portrait-outline' },
    { id:'card',   name:'Card',         icon:'card-outline' },
    { id:'account',name:'To account',   icon:'document-text-outline' },
  ],

  /* last night's numbers, for the audit and the occupancy screens */
  perf: {
    sold: 9, avail: 16, adr: 46800, revpar: 26325, ly: { occ: 49, adr: 41200 },
    week: [ ['Mon',52,44100], ['Tue',56,45200], ['Wed',63,46000], ['Thu',69,47500], ['Fri',75,49800], ['Sat',81,52400], ['Sun',56,46800] ],
    mix: [ ['Walk-in',22], ['Phone / WhatsApp',31], ['Booking.com',24], ['Airbnb',9], ['Corporate',14] ],
  },
};
