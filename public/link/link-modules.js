/* Koomzo Link — mock module services (Restaurant, Queue, Signage).
   Thin on purpose: they exist to exercise the platform, not to replace the
   real modules. Each calls only EntityStorePort (commit / get / query /
   nextNumber / internetReachable). Business rules the coordinator enforces
   are registered here, never inside the link layer. */
(function () {
  const KZ = window.KzLink;
  const { uid } = KZ;
  const F = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + ' F';
  KZ.formatF = F;

  /* ---------------- Restaurant ---------------- */
  const MENU = [
    { id: 'ndole', name: 'Ndolé Crevettes', price: 3500 },
    { id: 'dg', name: 'Poulet DG', price: 4500 },
    { id: 'plantain', name: 'Plantain Frit', price: 1000 },
    { id: 'bissap', name: 'Jus Bissap', price: 500 },
  ];
  const TABLES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const total = (lines) => lines.reduce((s, l) => s + l.qty * l.price, 0);
  const orderNo = (d) => (typeof d.number === 'number' ? '#' + (1040 + d.number) : String(d.number).replace('~', '') + ' (temp)');

  class RestaurantMockService {
    constructor(store) { this.s = store; }
    static MENU = MENU;
    static TABLES = TABLES;
    openOrderFor(table) { return this.s.query('rk_order').find((e) => e.doc.table === table && e.doc.status !== 'paid') || null; }
    async open(table) {
      const id = uid('o_');
      const number = await this.s.nextNumber('rk');
      await this.s.commit('Open ' + table, [{ collection: 'rk_order', docId: id, op: 'create', patch: { table, number, numberSeries: 'rk', status: 'open', lines: [], total: 0, openedAt: Date.now() } }]);
      return id;
    }
    async add(table, itemId, qty = 1) {
      const o = this.openOrderFor(table) || this.s.get('rk_order', await this.open(table));
      const item = MENU.find((m) => m.id === itemId);
      const lines = o.doc.lines.map((l) => ({ ...l }));
      const l = lines.find((x) => x.id === itemId);
      if (l) l.qty += qty; else lines.push({ id: itemId, name: item.name, price: item.price, qty });
      return this.s.commit(table + ' · add ' + qty + ' × ' + item.name, [{ collection: 'rk_order', docId: o.id, op: 'update', patch: { lines, total: total(lines) } }]);
    }
    async send(table) {
      const o = this.openOrderFor(table);
      if (!o || !o.doc.lines.length) return;
      return this.s.commit(table + ' · send to kitchen', [
        { collection: 'rk_order', docId: o.id, op: 'update', patch: { status: 'sent' } },
        { collection: 'rk_ticket', docId: uid('tk_'), op: 'create', patch: { orderId: o.id, table, lines: o.doc.lines, status: 'new', at: Date.now() } },
      ]);
    }
    /* Q1: MoMo and card need an upstream with internet. Cash never waits. */
    async pay(table, method) {
      const o = this.openOrderFor(table);
      if (!o || !o.doc.total) throw new Error('Nothing to pay on ' + table + '.');
      if (method !== 'cash' && !this.s.internetReachable()) throw new Error('MoMo needs the internet. Take cash, or wait for the main device.');
      return this.s.commit(table + ' · ' + (method === 'cash' ? 'cash' : 'MoMo') + ' ' + F(o.doc.total), [
        { collection: 'rk_payment', docId: uid('pay_'), op: 'create', patch: { orderId: o.id, table, amount: o.doc.total, method, at: Date.now() } },
        { collection: 'rk_order', docId: o.id, op: 'update', patch: { status: 'paid' } },
      ]);
    }
    bump(ticketId) { return this.s.commit('Ticket done', [{ collection: 'rk_ticket', docId: ticketId, op: 'update', patch: { status: 'done' } }]); }
  }
  RestaurantMockService.orderNo = orderNo;

  KZ.registerAuthorityRules({
    // Items added offline to a bill that was paid meanwhile.
    check(o, cur) {
      if (o.collection === 'rk_order' && o.op === 'update' && cur && cur.doc.status === 'paid' && o.patch && o.patch.lines) return { cause: 'paid', detail: { table: cur.doc.table, orderId: cur.id } };
      return null;
    },
    // Money is never overwritten: a second payment is kept and flagged.
    flags(g, ctx) {
      return g.ops.filter((o) => o.collection === 'rk_payment' && o.op === 'create' && o.patch.amount > 0).flatMap((o) => {
        const prior = ctx.store.query('rk_payment', { orderId: o.patch.orderId }).filter((p) => p.id !== o.docId && p.doc.amount > 0);
        return prior.length ? [{ cause: 'paidTwice', detail: { table: o.patch.table, orderId: o.patch.orderId, payments: [...prior.map((p) => ({ id: p.id, ...p.doc, deviceId: p.deviceId })), { id: o.docId, ...o.patch, deviceId: g.deviceId }] } }] : [];
      });
    },
  });

  /* ---------------- Queue ---------------- */
  const qLabel = (d) => (typeof d.number === 'number' ? d.series + '-' + String(d.number).padStart(3, '0') : String(d.number).replace('~', '') + ' (temp)');
  class QueueMockService {
    constructor(store) { this.s = store; }
    static label = qLabel;
    async issue(series = 'A') {
      const number = await this.s.nextNumber('q:' + series);
      return this.s.commit('Queue ticket ' + series, [{ collection: 'q_ticket', docId: uid('q_'), op: 'create', patch: { series, number, numberSeries: 'q:' + series, status: 'waiting', at: Date.now() } }]);
    }
    waiting() { return this.s.query('q_ticket', { status: 'waiting' }).sort((a, b) => a.doc.at - b.doc.at); }
    async callNext(counter) {
      const [next, ...rest] = this.waiting();
      if (!next) throw new Error('Nobody waiting.');
      const st = this.s.get('q_state', 'main');
      const patch = { nowServing: qLabel(next.doc), counter, next: rest.slice(0, 3).map((t) => qLabel(t.doc)), at: Date.now() };
      return this.s.commit('Call ' + qLabel(next.doc) + ' · counter ' + counter, [
        { collection: 'q_ticket', docId: next.id, op: 'update', patch: { status: 'called', counter } },
        { collection: 'q_state', docId: 'main', op: st ? 'update' : 'create', patch },
      ]);
    }
  }

  /* ---------------- Signage ---------------- */
  class SignageMockService {
    constructor(store) { this.s = store; }
    publish(message) {
      const cur = this.s.get('sg_content', 'main');
      return this.s.commit('Screen message', [{ collection: 'sg_content', docId: 'main', op: cur ? 'update' : 'create', patch: { message, at: Date.now() } }]);
    }
  }

  /* ---------------- S9 resolutions ---------------- */
  const RES = {};
  KZ.registerResolver = (cause, r) => { RES[cause] = r; };
  KZ.resolverFor = (cause) => RES[cause] || RES._default;

  KZ.registerResolver('_default', {
    title: () => 'Needs a check', body: (d) => d.label,
    actions: () => [{ id: 'dismiss', label: 'Dismiss' }], run: async () => {},
  });
  KZ.registerResolver('stale', {
    title: () => 'Changed on two devices',
    body: (d) => d.label + ' — ' + d.deviceName + ' changed something the main device had already changed.',
    actions: () => [{ id: 'keep', label: 'Keep main device version' }, { id: 'apply', label: 'Apply this change', money: true }],
    async run(store, d, a) { if (a === 'apply') await store.commit(d.label + ' (manager)', d.ops.map(({ collection, docId, op, patch }) => ({ collection, docId, op, patch }))); },
  });
  KZ.registerResolver('exists', { title: () => 'Already exists', body: (d) => d.label, actions: () => [{ id: 'dismiss', label: 'Dismiss' }], run: async () => {} });
  KZ.registerResolver('depends', { title: () => 'Depended on a refused change', body: (d) => d.label + ' — an earlier change it needed was not accepted.', actions: () => [{ id: 'dismiss', label: 'Dismiss' }], run: async () => {} });
  KZ.registerResolver('missing', { title: () => 'Record no longer exists', body: (d) => d.label, actions: () => [{ id: 'dismiss', label: 'Dismiss' }], run: async () => {} });
  KZ.registerResolver('paid', {
    title: (d) => d.detail.table + ' was already paid',
    body: (d) => d.deviceName + ' added items while offline, but the bill had been paid.',
    actions: () => [{ id: 'newOrder', label: 'Start new order' }, { id: 'discard', label: 'Discard items' }],
    async run(store, d, a) {
      if (a !== 'newOrder') return;
      const sent = (d.ops.find((o) => o.patch && o.patch.lines) || { patch: { lines: [] } }).patch.lines;
      const paid = (store.get('rk_order', d.detail.orderId) || { doc: { lines: [] } }).doc.lines;
      const extra = sent.map((l) => ({ ...l, qty: l.qty - ((paid.find((p) => p.id === l.id) || { qty: 0 }).qty) })).filter((l) => l.qty > 0);
      const svc = new RestaurantMockService(store);
      for (const l of extra) await svc.add(d.detail.table, l.id, l.qty);
    },
  });
  KZ.registerResolver('paidTwice', {
    title: (d) => d.detail.table + ' was paid twice',
    body: (d) => d.detail.payments.map((p) => (p.method === 'cash' ? 'Cash ' : 'MoMo ') + F(p.amount)).join(' and ') + '. Both payments are kept until a manager decides.',
    actions: () => [{ id: 'refund', label: 'Refund the second payment', money: true }, { id: 'credit', label: 'Keep as credit', money: true }],
    async run(store, d, a) {
      const p = d.detail.payments[d.detail.payments.length - 1];
      if (a === 'refund') await store.commit(d.detail.table + ' · refund ' + F(p.amount), [{ collection: 'rk_payment', docId: uid('pay_'), op: 'create', patch: { orderId: p.orderId, table: p.table, amount: -p.amount, method: p.method, refundOf: p.id, at: Date.now() } }]);
      else await store.commit(d.detail.table + ' · credit ' + F(p.amount), [{ collection: 'approval', docId: uid('ap_'), op: 'create', patch: { type: 'credit', table: p.table, amount: p.amount, paymentId: p.id, at: Date.now() } }]);
    },
  });

  Object.assign(KZ, { RestaurantMockService, QueueMockService, SignageMockService });
})();
