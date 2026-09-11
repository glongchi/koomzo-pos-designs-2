/* Koomzo Queue — configurable queue management. Presets rename the model per business. */
window.QD = (function () {
  const presets = {
    salon: {
      label: 'Hair salon', laneTerm: 'Chair', laneTermPl: 'Chairs', itemTerm: 'Client', itemTermPl: 'Clients',
      catTerm: 'Service', venue: 'Salon Lumière · Bonapriso', theme: 'midnight',
      msg: { called: 'Please come forward', free: 'Ready now', foot: 'Check in at the desk · numbers are called in order, priority first' },
      cats: [
        { id: 'c1', code: 'C', name: 'Cut & finish', dur: 45, tone: 'pri' },
        { id: 'c2', code: 'L', name: 'Colour', dur: 90, tone: 'ind' },
        { id: 'c3', code: 'B', name: 'Barber', dur: 20, tone: 'inf' },
        { id: 'c4', code: 'T', name: 'Treatment', dur: 30, tone: 'suc' },
      ],
      lanes: [
        { id: 'l1', name: 'Nadia', short: '1', serves: ['c1', 'c2', 'c4'], state: 'open' },
        { id: 'l2', name: 'Prisca', short: '2', serves: ['c1', 'c3', 'c4'], state: 'paused' },
        { id: 'l3', name: 'Thomas', short: '3', serves: ['c3', 'c1'], state: 'open' },
        { id: 'l4', name: 'Ines', short: '4', serves: ['c2', 'c4'], state: 'open' },
      ],
    },
    bank: {
      label: 'Bank branch', laneTerm: 'Counter', laneTermPl: 'Counters', itemTerm: 'Customer', itemTermPl: 'Customers',
      catTerm: 'Transaction', venue: 'Afriland First Bank · Akwa', theme: 'daylight',
      msg: { called: 'Please come forward', free: 'Ready now', foot: 'Take a ticket at the entrance · numbers are called in order, priority first' },
      cats: [
        { id: 'c1', code: 'W', name: 'Withdrawal', dur: 6, tone: 'pri' },
        { id: 'c2', code: 'D', name: 'Deposit', dur: 5, tone: 'suc' },
        { id: 'c3', code: 'A', name: 'Account services', dur: 12, tone: 'ind' },
        { id: 'c4', code: 'V', name: 'Advisor', dur: 25, tone: 'inf' },
      ],
      lanes: [
        { id: 'l1', name: 'Counter 1', short: '1', serves: ['c1', 'c2'], state: 'open' },
        { id: 'l2', name: 'Counter 2', short: '2', serves: ['c1', 'c2'], state: 'open' },
        { id: 'l3', name: 'Counter 3', short: '3', serves: ['c1', 'c2', 'c3'], state: 'open' },
        { id: 'l4', name: 'Advisor desk', short: 'A', serves: ['c3', 'c4'], state: 'open' },
      ],
    },
    kitchen: {
      label: 'Kitchen line', laneTerm: 'Station', laneTermPl: 'Stations', itemTerm: 'Order', itemTermPl: 'Orders',
      catTerm: 'Channel', venue: 'Chez Bilongue · cuisine', theme: 'contrast',
      msg: { called: 'Plating — collect at pass', free: 'Clear', foot: 'Orders route by channel · oldest ticket first, priority first' },
      cats: [
        { id: 'c1', code: 'T', name: 'Dine-in', dur: 14, tone: 'pri' },
        { id: 'c2', code: 'K', name: 'Takeaway', dur: 10, tone: 'inf' },
        { id: 'c3', code: 'D', name: 'Delivery', dur: 12, tone: 'ind' },
      ],
      lanes: [
        { id: 'l1', name: 'Grill', short: 'G', serves: ['c1', 'c2', 'c3'], state: 'open' },
        { id: 'l2', name: 'Fry', short: 'F', serves: ['c1', 'c2', 'c3'], state: 'open' },
        { id: 'l3', name: 'Cold', short: 'C', serves: ['c1', 'c2'], state: 'open' },
        { id: 'l4', name: 'Pass', short: 'P', serves: ['c1', 'c2', 'c3'], state: 'open' },
      ],
    },
    support: {
      label: 'Service centre', laneTerm: 'Desk', laneTermPl: 'Desks', itemTerm: 'Visitor', itemTermPl: 'Visitors',
      catTerm: 'Enquiry', venue: 'Communauté urbaine de Douala · accueil', theme: 'brand',
      msg: { called: 'Please come forward', free: 'Ready now', foot: 'Take a ticket at intake · numbers are called in order, priority first' },
      cats: [
        { id: 'c1', code: 'N', name: 'New application', dur: 18, tone: 'pri' },
        { id: 'c2', code: 'R', name: 'Renewal', dur: 8, tone: 'suc' },
        { id: 'c3', code: 'T', name: 'Technical help', dur: 20, tone: 'ind' },
        { id: 'c4', code: 'P', name: 'Payments', dur: 6, tone: 'inf' },
      ],
      lanes: [
        { id: 'l1', name: 'Desk 1', short: '1', serves: ['c1', 'c2'], state: 'open' },
        { id: 'l2', name: 'Desk 2', short: '2', serves: ['c2', 'c4'], state: 'open' },
        { id: 'l3', name: 'Desk 3', short: '3', serves: ['c3'], state: 'open' },
        { id: 'l4', name: 'Desk 4', short: '4', serves: ['c1', 'c3', 'c4'], state: 'closed' },
      ],
    },
  };

  /* seeded day — minutes from midnight, now = 11:20 */
  const seeds = {
    salon: [
      ['C', 'c1', 'l1', 'serving', 632, 'Grace O.'], ['L', 'c2', 'l4', 'serving', 601, 'Solange M.'],
      ['B', 'c3', 'l3', 'called', 671, 'Marcel V.'], ['C', 'c1', null, 'waiting', 660, 'Danielle R.'],
      ['T', 'c4', null, 'waiting', 668, ''], ['B', 'c3', null, 'waiting', 673, 'Nourou B.'],
      ['C', 'c1', null, 'waiting', 676, ''], ['L', 'c2', null, 'waiting', 679, 'Béatrice N.'],
    ],
    bank: [
      ['W', 'c1', 'l1', 'serving', 674, ''], ['D', 'c2', 'l2', 'serving', 676, ''],
      ['A', 'c3', 'l3', 'called', 671, ''], ['V', 'c4', 'l4', 'serving', 660, 'Appt · 11:00'],
      ['W', 'c1', null, 'waiting', 670, ''], ['W', 'c1', null, 'waiting', 672, ''],
      ['D', 'c2', null, 'waiting', 675, ''], ['A', 'c3', null, 'waiting', 677, ''],
      ['W', 'c1', null, 'waiting', 678, ''], ['D', 'c2', null, 'waiting', 679, ''],
    ],
    kitchen: [
      ['T', 'c1', 'l1', 'serving', 672, 'Table 4'], ['K', 'c2', 'l2', 'serving', 674, 'Bag 21'],
      ['T', 'c1', 'l4', 'called', 676, 'Table 9'], ['D', 'c3', null, 'waiting', 675, 'Rider 3'],
      ['T', 'c1', null, 'waiting', 677, 'Table 2'], ['K', 'c2', null, 'waiting', 678, 'Bag 22'],
      ['T', 'c1', null, 'waiting', 679, 'Table 7'],
    ],
    support: [
      ['N', 'c1', 'l1', 'serving', 640, ''], ['R', 'c2', 'l2', 'serving', 668, ''],
      ['T', 'c3', 'l3', 'called', 670, ''], ['P', 'c4', null, 'waiting', 666, ''],
      ['N', 'c1', null, 'waiting', 669, ''], ['R', 'c2', null, 'waiting', 672, ''],
      ['T', 'c3', null, 'waiting', 674, ''], ['P', 'c4', null, 'waiting', 678, ''],
    ],
  };

  const build = (key) => {
    const seq = {};
    return seeds[key].map((s, i) => {
      seq[s[0]] = (seq[s[0]] || 40) + 1;
      return { id: key + i, num: s[0] + '-' + String(seq[s[0]]).padStart(3, '0'), cat: s[1], lane: s[2],
        state: s[3], created: s[4], label: s[5], pri: s[5].indexOf('Appt') === 0, called: s[3] !== 'waiting' ? s[4] + 4 : null,
        started: s[3] === 'serving' ? s[4] + 6 : null, seq: seq[s[0]] };
    });
  };

  return { presets, build, now: 680, open: 540, close: 1140, today: 'Thu 14 Aug' };
})();
