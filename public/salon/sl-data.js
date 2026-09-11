/* Koomzo Salon — demo data for the Appointments / Tasks / Team / Timesheet modules.
   Times are minutes from midnight. "Today" is Thu 13 Aug 2026, simulated now = 11:20. */
window.SL = (function () {
  const staff = [
    { id: 's1', name: 'Nadia Farouk', first: 'Nadia', role: 'Senior stylist', tone: 'pri', init: 'NF', me: true,
      phone: '+237 6 99 555 0182', email: 'nadia@koomzo.salon', pin: '4417', rate: 1600, since: 'Mar 2023',
      skills: ['Cutting', 'Balayage', 'Bridal'], status: 'in', clockIn: 532,
      access: { register: true, discount: true, refund: true, reports: false, roster: false },
      week: { hours: 31.5, sched: 36, appts: 22, sales: 660000, rebook: 68 },
      shifts: [['Mon', 540, 1020], ['Tue', 540, 1020], ['Wed', 0, 0], ['Thu', 540, 1080], ['Fri', 600, 1140], ['Sat', 540, 1020], ['Sun', 0, 0]] },
    { id: 's2', name: 'Nadège Fotso', first: 'Nadège', role: 'Stylist', tone: 'ind', init: 'NG',
      phone: '+237 6 99 555 0143', email: 'nadege@koomzo.salon', pin: '2290', rate: 1200, since: 'Jan 2025',
      skills: ['Cutting', 'Blow dry'], status: 'in', clockIn: 548,
      access: { register: true, discount: false, refund: false, reports: false, roster: false },
      week: { hours: 28, sched: 32, appts: 19, sales: 400000, rebook: 54 },
      shifts: [['Mon', 540, 1020], ['Tue', 0, 0], ['Wed', 540, 1020], ['Thu', 540, 1020], ['Fri', 540, 1020], ['Sat', 600, 1140], ['Sun', 0, 0]] },
    { id: 's3', name: 'Thomas Nkeng', first: 'Thomas', role: 'Barber', tone: 'inf', init: 'TN',
      phone: '+237 6 99 555 0117', email: 'thomas@koomzo.salon', pin: '7731', rate: 1300, since: 'Aug 2022',
      skills: ['Barbering', 'Beard', 'Kids'], status: 'break', clockIn: 536,
      access: { register: true, discount: true, refund: false, reports: false, roster: false },
      week: { hours: 33, sched: 36, appts: 41, sales: 470000, rebook: 72 },
      shifts: [['Mon', 540, 1020], ['Tue', 540, 1020], ['Wed', 540, 1020], ['Thu', 540, 1020], ['Fri', 540, 1020], ['Sat', 0, 0], ['Sun', 0, 0]] },
    { id: 's4', name: 'Ivy Kamdem', first: 'Ivy', role: 'Colour specialist', tone: 'wrn', init: 'IC',
      phone: '+237 6 99 555 0164', email: 'ivy@koomzo.salon', pin: '5058', rate: 1800, since: 'Sep 2021',
      skills: ['Colour', 'Highlights', 'Correction'], status: 'in', clockIn: 561,
      access: { register: true, discount: true, refund: false, reports: true, roster: false },
      week: { hours: 30, sched: 30, appts: 14, sales: 810000, rebook: 81 },
      shifts: [['Mon', 0, 0], ['Tue', 570, 1050], ['Wed', 570, 1050], ['Thu', 570, 1050], ['Fri', 570, 1050], ['Sat', 570, 1020], ['Sun', 0, 0]] },
    { id: 's5', name: 'Samuel Etoa', first: 'Samuel', role: 'Front desk · manager', tone: 'suc', init: 'SE',
      phone: '+237 6 99 555 0109', email: 'samuel@koomzo.salon', pin: '1002', rate: 1500, since: 'Feb 2020',
      skills: ['Reception', 'Retail', 'Rota'], status: 'in', clockIn: 525,
      access: { register: true, discount: true, refund: true, reports: true, roster: true },
      week: { hours: 34.5, sched: 38, appts: 0, sales: 230000, rebook: 0 },
      shifts: [['Mon', 525, 1020], ['Tue', 525, 1020], ['Wed', 525, 1020], ['Thu', 525, 1020], ['Fri', 525, 1020], ['Sat', 0, 0], ['Sun', 0, 0]] },
    { id: 's6', name: 'Grace Bello', first: 'Grace', role: 'Apprentice', tone: 'mut', init: 'GB',
      phone: '+237 6 99 555 0198', email: 'grace@koomzo.salon', pin: '8846', rate: 800, since: 'Jun 2026',
      skills: ['Shampoo', 'Blow dry'], status: 'off', clockIn: null,
      access: { register: false, discount: false, refund: false, reports: false, roster: false },
      week: { hours: 18, sched: 20, appts: 6, sales: 75000, rebook: 33 },
      shifts: [['Mon', 0, 0], ['Tue', 600, 900], ['Wed', 600, 900], ['Thu', 0, 0], ['Fri', 600, 900], ['Sat', 540, 1020], ['Sun', 0, 0]] },
  ];

  const services = [
    { id: 'v1', name: 'Coupe et finition', dur: 45, price: 5000, cat: 'Hair', icon: 'cut-outline', who: ['s1', 's2'], online: true, book: 22 },
    { id: 'v2', name: 'Coupe à sec', dur: 30, price: 3000, cat: 'Hair', icon: 'cut-outline', who: ['s1', 's2', 's3'], online: true, book: 31 },
    { id: 'v3', name: 'Brushing', dur: 30, price: 3000, cat: 'Hair', icon: 'sparkles-outline', who: ['s1', 's2', 's6'], online: true, book: 18 },
    { id: 'v4', name: 'Retouche racines', dur: 90, price: 12000, cat: 'Colour', icon: 'color-palette-outline', who: ['s1', 's4'], online: true, book: 14 },
    { id: 'v5', name: 'Mèches complètes', dur: 150, price: 25000, cat: 'Colour', icon: 'color-palette-outline', who: ['s4'], online: false, book: 6 },
    { id: 'v6', name: 'Taille de barbe', dur: 20, price: 1500, cat: 'Barber', icon: 'man-outline', who: ['s3'], online: true, book: 27 },
    { id: 'v7', name: 'Coupe enfant', dur: 20, price: 2000, cat: 'Barber', icon: 'happy-outline', who: ['s3', 's2'], online: true, book: 11 },
    { id: 'v8', name: 'Soin réparateur', dur: 30, price: 5000, cat: 'Care', icon: 'water-outline', who: ['s1', 's4', 's6'], online: true, book: 9 },
  ];

  const A = (id, staffId, vid, start, client, status, extra) => {
    const v = services.find((s) => s.id === vid);
    return Object.assign({ id, staff: staffId, service: v.name, sid: vid, start, dur: v.dur, price: v.price,
      client, status, phone: '+237 6 99 555 0' + (100 + (+id.slice(1) * 7) % 90), notes: '' }, extra || {});
  };

  const appts = [
    A('a1', 's1', 'v1', 540, 'Mireille Ebong', 'done', { paid: true }),
    A('a2', 's1', 'v4', 600, 'Grâce Okoye', 'chair', { notes: 'Shade 6N, patch test on file' }),
    A('a3', 's1', 'v1', 705, 'Danielle Mbarga', 'booked', { first: true }),
    A('a4', 's1', 'v3', 780, 'Léa Ngo', 'booked'),
    A('a5', 's2', 'v2', 555, 'Thomas Abena', 'done', { paid: true }),
    A('a6', 's2', 'v1', 660, 'Anne Tchoumi', 'chair'),
    A('a7', 's2', 'v3', 720, 'Kelly Nkomo', 'confirmed'),
    A('a8', 's2', 'v1', 810, 'Ruth Adjei', 'booked'),
    A('a9', 's3', 'v6', 540, 'Jean Pokam', 'done', { paid: true }),
    A('a10', 's3', 'v2', 585, 'Ali Bouba', 'done'),
    A('a11', 's3', 'v6', 675, 'Marc Belinga', 'checkedin'),
    A('a12', 's3', 'v7', 720, 'Noé Belibi', 'booked', { first: true }),
    A('a13', 's3', 'v2', 750, 'Serge Doumbe', 'booked'),
    A('a14', 's4', 'v5', 570, 'Sofia Mbah', 'chair', { notes: 'Toner at 90 min' }),
    A('a15', 's4', 'v4', 750, 'Béatrice Nnomo', 'booked', { notes: 'Confirm patch test' }),
    A('a16', 's2', 'v8', 900, 'Iris Fadel', 'booked'),
    A('a17', 's1', 'v1', 930, 'Omar Djibril', 'booked'),
  ];

  const tasks = [
    { id: 't1', title: 'Restock colour bar', to: 's4', due: 840, day: 'today', pri: 'high', state: 'open', tag: 'Stock', repeat: 'Weekly',
      list: ['6N, 7N, 9N tubes', 'Developer 20 vol', 'Foils'] },
    { id: 't2', title: 'Call Bea Nunes — confirm patch test', to: 's5', due: 720, day: 'today', pri: 'high', state: 'doing', tag: 'Client', list: [] },
    { id: 't3', title: 'Sanitise tools — station 2', to: 's3', due: 1080, day: 'today', pri: 'med', state: 'open', tag: 'Hygiene', repeat: 'Daily',
      list: ['Clippers', 'Scissors', 'Combs'] },
    { id: 't4', title: 'Towel laundry run', to: 's6', due: 960, day: 'today', pri: 'low', state: 'open', tag: 'Floor', repeat: 'Daily', list: [] },
    { id: 't5', title: 'Post today’s colour work to WhatsApp status', to: 's4', due: 1140, day: 'today', pri: 'low', state: 'open', tag: 'Marketing', list: [] },
    { id: 't6', title: 'Deep clean basins', to: 's3', due: 600, day: 'today', pri: 'med', state: 'done', tag: 'Hygiene', list: [] },
    { id: 't7', title: 'Weekly retail shelf count', to: 's5', due: 600, day: 'Fri 14 Aug', pri: 'med', state: 'open', tag: 'Stock', repeat: 'Weekly', list: [] },
    { id: 't8', title: 'Chase colour supplier credit — Marché Congo', to: 's5', due: 780, day: 'Fri 14 Aug', pri: 'med', state: 'open', tag: 'Admin', list: [] },
    { id: 't9', title: 'Induct Grace — shampoo station', to: 's1', due: 660, day: 'Sat 15 Aug', pri: 'high', state: 'open', tag: 'Training', list: [] },
  ];

  /* clock entries — my week (s1) and team weekly totals */
  const days = [
    { d: 'Mon', date: '10 Aug' }, { d: 'Tue', date: '11 Aug' }, { d: 'Wed', date: '12 Aug' },
    { d: 'Thu', date: '13 Aug', today: true }, { d: 'Fri', date: '14 Aug' }, { d: 'Sat', date: '15 Aug' }, { d: 'Sun', date: '16 Aug' },
  ];
  const myWeek = [
    { d: 'Mon', in: 535, out: 1024, brk: 45, note: '' },
    { d: 'Tue', in: 538, out: 1018, brk: 30, note: '' },
    { d: 'Wed', in: null, out: null, brk: 0, note: 'Day off' },
    { d: 'Thu', in: 532, out: null, brk: 0, note: 'On the clock' },
    { d: 'Fri', in: null, out: null, brk: 0, note: 'Scheduled 10:00 – 19:00' },
    { d: 'Sat', in: null, out: null, brk: 0, note: 'Scheduled 9:00 – 17:00' },
    { d: 'Sun', in: null, out: null, brk: 0, note: 'Day off' },
  ];
  const team = [
    { id: 's1', hours: 31.5, ot: 0, state: 'pending', flags: 0 },
    { id: 's2', hours: 28, ot: 0, state: 'approved', flags: 0 },
    { id: 's3', hours: 33, ot: 1.5, state: 'pending', flags: 1 },
    { id: 's4', hours: 30, ot: 0, state: 'approved', flags: 0 },
    { id: 's5', hours: 34.5, ot: 0, state: 'pending', flags: 0 },
    { id: 's6', hours: 18, ot: 0, state: 'pending', flags: 1 },
  ];

  const clients = ['Danielle Mbarga', 'Léa Ngo', 'Kelly Nkomo', 'Ruth Adjei', 'Omar Djibril', 'Iris Fadel', 'Walk-in'];

  const products = [
    { id: 'p1', name: 'Shampooing réparateur 250 ml', cat: 'Retail', price: 9500, stock: 12, icon: 'water-outline' },
    { id: 'p2', name: 'Après-shampooing 250 ml', cat: 'Retail', price: 9500, stock: 9, icon: 'water-outline' },
    { id: 'p3', name: 'Sérum réparateur', cat: 'Retail', price: 14000, stock: 4, icon: 'flask-outline' },
    { id: 'p4', name: 'Shampooing sec', cat: 'Retail', price: 6500, stock: 15, icon: 'sparkles-outline' },
    { id: 'p5', name: 'Huile d’argan', cat: 'Retail', price: 11000, stock: 2, icon: 'leaf-outline' },
    { id: 'p6', name: 'Brosse ronde', cat: 'Retail', price: 6000, stock: 7, icon: 'brush-outline' },
    { id: 'p7', name: 'Carte cadeau', cat: 'Retail', price: 20000, stock: null, icon: 'gift-outline' },
  ];

  return { staff, services, appts, tasks, days, myWeek, team, clients, products, tax: 0.1925,
    now: 680, open: 540, close: 1140, today: 'Thu 13 Aug', me: 's1', shop: 'Salon Lumière · Bonapriso' };
})();
