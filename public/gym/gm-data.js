/* Koomzo Gym — the demo club. Bonapriso Athletic & Wellness, Douala: a high-end
   members' club with a pool, two studios, a spa and a juice bar. Money is XAF
   integers. Everything a gate reader needs is here on the device: the club is
   designed to keep admitting members through a power cut. */
window.GM = {
  club: 'Bonapriso Athletic & Wellness',
  city: 'Douala · Bonapriso',
  today: 'Thursday 27 August 2026',
  dayNo: 27, month: 'Aug',
  ccy: 'FCFA',
  vat: 0.1925,
  capacity: 180,           /* people the floor can hold at once */
  open: '05:30', close: '22:30',
  syncQueued: 6,           /* writes waiting for the line to come back */
  online: false,           /* the demo starts on a telecom outage, on purpose */
  lastSync: '11:42',

  /* membership plans — access is a set of zones plus an hours window */
  plans: [
    { id:'vip',   name:'VIP All-Access',      short:'VIP',   price:180000, cycle:'month', zones:['floor','studio','pool','spa'], hours:'any',      tone:'t1' },
    { id:'exec',  name:'Corporate Executive', short:'Exec',  price:150000, cycle:'month', zones:['floor','studio','pool'],       hours:'any',      tone:'t2' },
    { id:'std',   name:'Club Standard',       short:'Std',   price:95000,  cycle:'month', zones:['floor','studio'],              hours:'any',      tone:'t3' },
    { id:'morn',  name:'Off-Peak Morning',    short:'Morn',  price:55000,  cycle:'month', zones:['floor'],                       hours:'05:30–11:00', tone:'t4' },
    { id:'spa',   name:'Pool & Spa Only',     short:'Spa',   price:75000,  cycle:'month', zones:['pool','spa'],                  hours:'any',      tone:'t5' },
    { id:'annual',name:'VIP Annual',          short:'VIP·yr',price:1800000,cycle:'year',  zones:['floor','studio','pool','spa'], hours:'any',      tone:'t1' },
  ],
  zoneNames: { floor:'Weights & cardio', studio:'Studios', pool:'Pool', spa:'Spa & sauna' },

  /* corporate accounts — one bill, many seats */
  companies: [
    { id:'c1', name:'Total E&P Cameroun', seats:12, used:11, plan:'exec', billTo:'monthly', contact:'Mme Ngo Bassong', terms:30, balance:1650000 },
    { id:'c2', name:'MTN Cameroon',       seats:8,  used:8,  plan:'exec', billTo:'monthly', contact:'M. Fotso',        terms:30, balance:1200000 },
    { id:'c3', name:'Ambassade de France', seats:5, used:3,  plan:'vip',  billTo:'quarterly', contact:'Mme Laurent',   terms:45, balance:0 },
  ],

  /* members. state: active | frozen | due | expired.
     in = on the floor right now. access carries the last verification. */
  members: [
    { id:'m1',  name:'Dr Fotso Bernard',    plan:'vip',   state:'active', since:'2023', expires:'14 Sep', phone:'6 77 41 20 18', wallet:42000, tab:18500, locker:'V-04', co:null, visits:112, sessions:7, in:true,  at:'06:12', via:'qr',   photo:true, note:'Cardiologist · prefers 6am' },
    { id:'m2',  name:'Mme Ngo Bella Claudine', plan:'spa', state:'active', since:'2024', expires:'02 Sep', phone:'6 99 30 44 71', wallet:8000, tab:0, locker:null, co:null, visits:64, sessions:0, in:true, at:'09:40', via:'rfid', photo:true },
    { id:'m3',  name:'Samuel Ebong',        plan:'exec',  state:'active', since:'2022', expires:'30 Sep', phone:'6 55 19 79 85', wallet:0,     tab:0,     locker:null, co:'c1', visits:203, sessions:2, in:true,  at:'12:04', via:'qr',   photo:true },
    { id:'m4',  name:'Lena Weber',          plan:'vip',   state:'active', since:'2025', expires:'19 Sep', phone:'6 90 11 24 03', wallet:120000, tab:4500, locker:'V-11', co:null, visits:38, sessions:12, in:false, at:null, via:null, photo:true, note:'Expat · English only' },
    { id:'m5',  name:'Ir. Njike Paul',      plan:'exec',  state:'active', since:'2021', expires:'30 Sep', phone:'6 78 62 90 15', wallet:15000, tab:0,     locker:'V-02', co:'c2', visits:288, sessions:4, in:false, at:null, via:null, photo:true },
    { id:'m6',  name:'Adeline Tchoupo',     plan:'morn',  state:'active', since:'2026', expires:'11 Sep', phone:'6 71 05 33 92', wallet:3000,  tab:0,     locker:null, co:null, visits:21, sessions:0, in:false, at:null, via:null, photo:false },
    { id:'m7',  name:'Eric Mbappé Sone',    plan:'std',   state:'due',    since:'2024', expires:'26 Aug', phone:'6 96 44 17 60', wallet:0,     tab:2000,  locker:null, co:null, visits:77, sessions:1, in:false, at:null, via:null, photo:true, note:'Renewal was due yesterday' },
    { id:'m8',  name:'Mme Awono Régine',    plan:'vip',   state:'frozen', since:'2023', expires:'—', phone:'6 74 88 02 31', wallet:36000, tab:0, locker:'V-07', co:null, visits:143, sessions:9, in:false, at:null, via:null, photo:true, freeze:{ from:'10 Aug', to:'20 Sep', reason:'Travel · Paris', days:41 } },
    { id:'m9',  name:'Blaise Nkoulou',      plan:'std',   state:'expired', since:'2022', expires:'31 Jul', phone:'6 50 71 26 44', wallet:0, tab:0, locker:null, co:null, visits:96, sessions:0, in:false, at:null, via:null, photo:true },
    { id:'m10', name:'Sarah Etonde',        plan:'exec',  state:'active', since:'2025', expires:'30 Sep', phone:'6 93 27 60 11', wallet:25000, tab:0, locker:null, co:'c1', visits:54, sessions:6, in:true, at:'12:31', via:'desk', photo:true },
    { id:'m11', name:'M. Kouam Alphonse',   plan:'annual', state:'active', since:'2020', expires:'01 Mar 2027', phone:'6 79 14 55 08', wallet:60000, tab:12000, locker:'V-01', co:null, visits:412, sessions:3, in:false, at:null, via:null, photo:true, note:'Founder member · charge to account' },
    { id:'m12', name:'Aïcha Bakary',        plan:'morn',  state:'active', since:'2026', expires:'08 Sep', phone:'6 62 39 41 77', wallet:5000, tab:0, locker:null, co:null, visits:9, sessions:0, in:false, at:null, via:null, photo:false },
    { id:'m13', name:'Marc Etoundi',        plan:'std',   state:'active', since:'2024', expires:'22 Sep', phone:'6 58 90 12 34', wallet:2000, tab:0, locker:null, co:null, visits:131, sessions:0, in:true, at:'11:55', via:'rfid', photo:true },
    { id:'m14', name:'Mme Laurent Sylvie',  plan:'vip',   state:'active', since:'2025', expires:'17 Sep', phone:'6 84 66 21 09', wallet:90000, tab:0, locker:'V-09', co:'c3', visits:47, sessions:15, in:false, at:null, via:null, photo:true },
  ],

  /* session packages — a punch card. One session comes off at a verified check-in. */
  packs: [
    { id:'p1', mid:'m4',  kind:'PT · 10 sessions', bought:10, left:7,  trainer:'s2', expires:'30 Nov', price:250000 },
    { id:'p2', mid:'m1',  kind:'PT · 10 sessions', bought:10, left:2,  trainer:'s1', expires:'15 Sep', price:250000 },
    { id:'p3', mid:'m14', kind:'Spa · 6 massages', bought:6,  left:5,  trainer:'s4', expires:'31 Dec', price:180000 },
    { id:'p4', mid:'m8',  kind:'PT · 20 sessions', bought:20, left:11, trainer:'s2', expires:'28 Feb 2027', price:460000 },
    { id:'p5', mid:'m10', kind:'PT · 5 sessions',  bought:5,  left:1,  trainer:'s3', expires:'12 Sep', price:140000 },
  ],

  /* staff. split is the trainer's share of a completed session. */
  staff: [
    { id:'s1', name:'Coach Ndip Arnaud', first:'Arnaud', role:'Personal trainer', init:'NA', tone:'t1', split:0.40, base:120000, pin:'1111', access:{ setup:false, money:false } },
    { id:'s2', name:'Coach Bella Nadège', first:'Nadège', role:'Personal trainer · Pilates', init:'BN', tone:'t2', split:0.45, base:120000, pin:'2222', access:{ setup:false, money:false } },
    { id:'s3', name:'Coach Tanto Yves',  first:'Yves', role:'Personal trainer · Boxing', init:'TY', tone:'t3', split:0.40, base:100000, pin:'3333', access:{ setup:false, money:false } },
    { id:'s4', name:'Estelle Mbarga',    first:'Estelle', role:'Spa therapist', init:'EM', tone:'t4', split:0.35, base:110000, pin:'4444', access:{ setup:false, money:false } },
    { id:'s5', name:'Grace Ekindi',      first:'Grace', role:'Reception', init:'GE', tone:'t5', split:0, base:95000, pin:'5555', access:{ setup:false, money:true } },
    { id:'s6', name:'Patrick Owona',     first:'Patrick', role:'Club manager', init:'PO', tone:'t1', split:0, base:280000, pin:'0000', access:{ setup:true, money:true } },
  ],

  zones: [
    { id:'studioA', name:'Studio A', zone:'studio', cap:22 },
    { id:'studioB', name:'Studio B', zone:'studio', cap:16 },
    { id:'pool',    name:'Pool',     zone:'pool',   cap:24 },
    { id:'spa1',    name:'Spa room 1', zone:'spa',  cap:1 },
    { id:'spa2',    name:'Spa room 2', zone:'spa',  cap:1 },
    { id:'floor',   name:'Weights floor', zone:'floor', cap:70 },
  ],

  /* today's timetable. state: upcoming | running | done */
  classes: [
    { id:'cl1', name:'Spinning · Sunrise', room:'studioA', trainer:'s1', from:'06:00', to:'06:45', cap:22, booked:19, in:19, state:'done', fee:0 },
    { id:'cl2', name:'Aqua fit',           room:'pool',    trainer:'s4', from:'07:00', to:'07:45', cap:14, booked:11, in:10, state:'done', fee:5000 },
    { id:'cl3', name:'Pilates reformer',   room:'studioB', trainer:'s2', from:'09:30', to:'10:20', cap:12, booked:12, in:11, state:'done', fee:8000 },
    { id:'cl4', name:'Boxing technique',   room:'studioA', trainer:'s3', from:'12:30', to:'13:20', cap:20, booked:16, in:14, state:'running', fee:0 },
    { id:'cl5', name:'Pilates mat',        room:'studioB', trainer:'s2', from:'17:30', to:'18:20', cap:16, booked:16, in:0,  state:'upcoming', fee:0, wait:3 },
    { id:'cl6', name:'Spinning · Sunset',  room:'studioA', trainer:'s1', from:'18:30', to:'19:15', cap:22, booked:14, in:0,  state:'upcoming', fee:0 },
    { id:'cl7', name:'Aqua fit · evening', room:'pool',    trainer:'s4', from:'19:30', to:'20:15', cap:14, booked:6,  in:0,  state:'upcoming', fee:5000 },
  ],

  /* 1-on-1 bookings for today. state: booked | in | done | noshow | cancelled */
  pt: [
    { id:'pt1', mid:'m1',  trainer:'s1', room:'floor',  from:'06:15', to:'07:00', state:'done', fee:28000, pack:'p2', signed:true },
    { id:'pt2', mid:'m10', trainer:'s3', room:'studioA', from:'12:00', to:'12:45', state:'done', fee:28000, pack:'p5', signed:true },
    { id:'pt3', mid:'m4',  trainer:'s2', room:'studioB', from:'16:00', to:'16:50', state:'booked', fee:32000, pack:'p1' },
    { id:'pt4', mid:'m14', trainer:'s4', room:'spa1',   from:'17:00', to:'18:00', state:'booked', fee:35000, pack:'p3' },
    { id:'pt5', mid:'m5',  trainer:'s1', room:'floor',  from:'18:00', to:'18:45', state:'booked', fee:28000, pack:null },
    { id:'pt6', mid:'m13', trainer:'s3', room:'studioA', from:'09:00', to:'09:45', state:'noshow', fee:28000, pack:null, charged:true },
  ],
  cancelWindow: 4,        /* hours: cancel later than this and it is charged in full */

  /* the juice bar and pro shop — sold against the wallet, a wristband or a tab */
  bar: [
    { id:'b1', name:'Protein shake',        price:4500, cat:'bar' },
    { id:'b2', name:'Cold-pressed juice',   price:3500, cat:'bar' },
    { id:'b3', name:'Bottled water 1L',     price:1000, cat:'bar' },
    { id:'b4', name:'Coconut water',        price:2000, cat:'bar' },
    { id:'b5', name:'Grilled chicken bowl', price:7500, cat:'bar' },
    { id:'b6', name:'Club towel',           price:6000, cat:'shop' },
    { id:'b7', name:'Club vest',            price:18000, cat:'shop' },
    { id:'b8', name:'Whey tub 1kg',         price:38000, cat:'shop' },
    { id:'b9', name:'Day locker key',       price:1500, cat:'shop' },
    { id:'b10', name:'Guest day pass',      price:15000, cat:'shop' },
  ],
  tenders: [
    { id:'wallet', name:'Member wallet', icon:'wallet-outline' },
    { id:'tab',    name:'Charge to account', icon:'reader-outline' },
    { id:'momo',   name:'MTN MoMo',     icon:'phone-portrait-outline' },
    { id:'om',     name:'Orange Money', icon:'phone-portrait-outline' },
    { id:'card',   name:'Card',         icon:'card-outline' },
    { id:'cash',   name:'Cash',         icon:'cash-outline' },
  ],

  /* wallet movements, newest last */
  wallet: [
    { id:'w1', mid:'m4',  at:'26 Aug 18:20', kind:'topup',  desc:'Top-up · MTN MoMo',        amount:100000 },
    { id:'w2', mid:'m4',  at:'27 Aug 07:05', kind:'spend',  desc:'Protein shake · juice bar', amount:-4500 },
    { id:'w3', mid:'m1',  at:'27 Aug 06:58', kind:'spend',  desc:'Coconut water',             amount:-2000 },
    { id:'w4', mid:'m14', at:'25 Aug 10:11', kind:'topup',  desc:'Top-up · Card',             amount:50000 },
    { id:'w5', mid:'m2',  at:'27 Aug 09:52', kind:'spend',  desc:'Cold-pressed juice',        amount:-3500 },
    { id:'w6', mid:'m3',  at:'27 Aug 12:10', kind:'topup',  desc:'Top-up · Orange Money · queued offline', amount:20000, queued:true },
  ],

  lockers: [
    { id:'V-01', kind:'vip',  mid:'m11' }, { id:'V-02', kind:'vip', mid:'m5' },
    { id:'V-04', kind:'vip',  mid:'m1' },  { id:'V-07', kind:'vip', mid:'m8' },
    { id:'V-09', kind:'vip',  mid:'m14' }, { id:'V-11', kind:'vip', mid:'m4' },
    { id:'V-03', kind:'vip',  mid:null }, { id:'V-05', kind:'vip', mid:null },
    { id:'D-01', kind:'day',  mid:'m2', until:'12:00' }, { id:'D-02', kind:'day', mid:'m13', until:'14:00' },
    { id:'D-03', kind:'day',  mid:null }, { id:'D-04', kind:'day', mid:null },
    { id:'D-05', kind:'day',  mid:null }, { id:'D-06', kind:'day', mid:null },
    { id:'D-07', kind:'day',  mid:null }, { id:'D-08', kind:'day', mid:null, fault:'Lock jammed' },
  ],

  equipment: [
    { id:'eq1', name:'Treadmill 3 · Technogym', zone:'floor', serviced:'12 Jun', due:'12 Sep', state:'ok', hours:1840 },
    { id:'eq2', name:'Treadmill 4 · Technogym', zone:'floor', serviced:'12 Jun', due:'12 Sep', state:'fault', hours:2210, issue:'Belt slipping under load', logged:'26 Aug', to:'s6' },
    { id:'eq3', name:'Cable crossover',        zone:'floor', serviced:'02 Mar', due:'02 Sep', state:'ok', hours:0 },
    { id:'eq4', name:'Spin bikes · Studio A ×22', zone:'studio', serviced:'01 Aug', due:'01 Nov', state:'ok', hours:0 },
    { id:'eq5', name:'Pool filtration',        zone:'pool', serviced:'20 Aug', due:'20 Sep', state:'ok', hours:0 },
    { id:'eq6', name:'Sauna heater · Spa 2',   zone:'spa',  serviced:'10 May', due:'10 Aug', state:'overdue', hours:0, issue:'Service overdue 17 days' },
    { id:'eq7', name:'Reformer 2 · Studio B',  zone:'studio', serviced:'15 Jul', due:'15 Oct', state:'ok', hours:0 },
  ],

  /* the gate log — how each admission was verified and how long it took */
  gateLog: [
    { at:'12:31', mid:'m10', via:'desk', ms:0,   ok:true,  off:true },
    { at:'12:04', mid:'m3',  via:'qr',   ms:140, ok:true,  off:true },
    { at:'11:55', mid:'m13', via:'rfid', ms:90,  ok:true,  off:true },
    { at:'11:48', mid:'m7',  via:'qr',   ms:120, ok:false, off:true, why:'Membership expired 26 Aug' },
    { at:'09:40', mid:'m2',  via:'rfid', ms:110, ok:true,  off:false },
    { at:'06:12', mid:'m1',  via:'qr',   ms:130, ok:true,  off:false },
  ],
};
