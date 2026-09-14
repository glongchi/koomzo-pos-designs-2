/* Koomzo Inventory — mutation layer.
   Every action in this module lands here, and every action that changes a quantity
   writes a movement row. That is the module's one invariant: stock is never edited,
   it is always *moved*. Views read the window.IV_* collections directly and re-render
   off a revision counter, so a post is visible everywhere at once (rail badges,
   overview KPIs, item history) without prop plumbing.

   Mock backend note: this file IS the backend for the design system. In koomzoapps the
   same call signatures become service methods — the argument shapes are the contract,
   the array mutation is not. Anything marked SERVER below is enforced here for the
   prototype but must be re-resolved server-side on write. */

(function () {
  const ls = new Set();
  let rev = 0;
  const bump = () => { rev++; ls.forEach((f) => f(rev)); };

  const pad = (n) => String(n).padStart(2, '0');
  const clock = () => { const d = new Date(); return 'Today · ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const today = () => { const d = new Date(); return pad(d.getDate()) + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]; };

  /* Sequences are DERIVED from the data, never literals. A hard-coded next-id is correct
     only until someone edits the seed list — which is exactly how `supSeq = 3` started
     handing out ids that collided with the `pt4`–`pt6` partners added later, making the
     first three partners a user created unreachable by their own id. */
  const seqOf = (list, get, re) => (list || []).reduce((m, x) => {
    const hit = re.exec(String(get(x) || ''));
    return hit ? Math.max(m, +hit[1]) : m;
  }, 0);
  const docSeq = (prefix) => seqOf(window.IV_MOVES, (m) => m.doc, new RegExp('^' + prefix + '-(\\d+)$'));

  let mSeq = 100;
  let poSeq  = seqOf(window.IV_POS,       (p) => p.no, /^PO-(\d+)$/);
  let cSeq   = seqOf(window.IV_COUNTS,    (c) => c.no, /-(\d+)$/);
  let trSeq  = seqOf(window.IV_TRANSFERS, (t) => t.no, /^TR-(\d+)$/);
  let supSeq = seqOf(window.IV_PARTNERS,  (p) => p.id, /(\d+)$/);
  let itSeq  = Math.max(100, seqOf(window.IV_ITEMS, (i) => i.id, /^x(\d+)$/));
  let ajSeq = docSeq('AJ'), siSeq = docSeq('SI'), soSeq = docSeq('SO'), mvSeq = docSeq('MV');
  let cySeq = 0, msgSeq = 0;
  const nextNo = (prefix, seq) => prefix + '-' + String(seq).padStart(4, '0');

  /* who is posting — in production this is the session user, immutable for the session */
  const WHO = 'M. Ekindi';

  window.IV_CYCLES = window.IV_CYCLES || [];
  window.IV_OUTBOX = window.IV_OUTBOX || [];

  const toasts = [];

  /* ---------- primitives ---------- */
  function move(m) {
    const row = Object.assign({ id: 'm' + (++mSeq), at: clock(), who: WHO }, m);
    window.IV_MOVES.unshift(row);
    return row;
  }
  function applyStock(itemId, locId, delta) {
    const it = window.IV.item(itemId);
    if (!it || !it.stock) return;
    it.stock[locId] = (it.stock[locId] || 0) + delta;
  }
  /* one posting: capture the on-hand BEFORE, apply, write the movement carrying it.
     Every quantity change in this file goes through here, so `before` is never absent
     and the ledger can always show 12 → 9 rather than a bare −3. */
  function post(itemId, locId, delta, row) {
    const it = window.IV.item(itemId);
    const before = it && it.stock ? (it.stock[locId] || 0) : 0;
    applyStock(itemId, locId, delta);
    return move(Object.assign({ item: itemId, loc: locId, qty: delta, before: before }, row));
  }
  /* weighted average, rounded to whole francs on every write — XAF has no minor unit,
     so an unrounded unit cost would make every downstream valuation fractional. */
  function reaverage(itemId, qty, unitCost) {
    const it = window.IV.item(itemId);
    if (!it || !it.stock || !qty) return it ? it.cost : 0;
    const held = window.IV.onHand(it, 'all');
    const before = it.cost || 0;
    it.cost = Math.round(((held * before) + (qty * unitCost)) / Math.max(1, held + qty));
    return it.cost;
  }

  const IVS = {
    /* ---------- store ---------- */
    sub(fn) { ls.add(fn); return () => ls.delete(fn); },
    rev: () => rev,
    tx(fn) { const r = fn(); bump(); return r; },
    say(msg, tone) { toasts.push({ id: 't' + Date.now() + Math.random(), msg, tone: tone || 'ok' }); bump(); },
    toasts: () => toasts,
    drop(id) { const i = toasts.findIndex((t) => t.id === id); if (i > -1) toasts.splice(i, 1); bump(); },
    who: WHO, clock, today,

    /* ---------- items ---------- */
    createItem(d) {
      return IVS.tx(() => {
        const id = 'x' + (++itSeq);
        const tracks = d.type === 'product';
        const it = {
          id, name: d.name.trim(), sku: (d.sku || '').trim().toUpperCase(), barcode: (d.barcode || '').trim(),
          type: d.type, cat: d.cat, brand: d.brand || '', unit: d.unit || 'each',
          cost: +d.cost || 0, price: +d.price || 0,
          icon: d.icon || (window.IV_CATS.find((c) => c.id === d.cat) || {}).icon || 'cube-outline',
          tint: d.tint || window.IV_TINTS.slate,
          supplier: d.supplier || null,
          pos: { show: !!d.posShow, cat: d.cat, tile: d.type === 'service' ? 'list' : 'image' },
        };
        if (tracks) {
          it.reorder = +d.reorder || 0; it.par = +d.par || 0;
          it.backbar = !!d.backbar;
          it.stock = { dt: 0, up: 0, ap: 0, wh: 0 };
        }
        if (d.type === 'service') {
          it.service = { duration: +d.duration || 30, buffer: 5, staff: ['Any stylist'], room: 'Chair',
            commission: 0.35, consumes: [], online: true, deposit: 0 };
        }
        if (d.type === 'composite') it.recipe = [];
        window.IV_ITEMS.push(it);
        /* opening balance is a movement, not a silent number */
        if (tracks && +d.opening > 0) {
          post(id, d.openingLoc, +d.opening, { kind: 'adjust', reason: 'found',
            doc: nextNo('AJ', ++ajSeq), ref: 'Opening balance', cost: (+d.opening) * (+d.cost || 0) });
        }
        IVS.say(it.name + ' created' + (tracks && +d.opening > 0 ? ' · opening ' + d.opening + ' at ' + window.IV.loc(d.openingLoc).code : ''));
        return it;
      });
    },

    /* rows already validated by the sheet. mode: 'create' | 'update' | 'skip' per row */
    importItems(rows, locId) {
      return IVS.tx(() => {
        let created = 0, updated = 0, opening = 0;
        rows.forEach((r) => {
          if (r.mode === 'skip') return;
          if (r.mode === 'update') {
            const it = window.IV_ITEMS.find((i) => i.sku.toUpperCase() === r.sku.toUpperCase());
            Object.assign(it, { name: r.name || it.name, price: r.price != null ? r.price : it.price,
              cost: r.cost != null ? r.cost : it.cost });
            updated++;
            return;
          }
          const id = 'x' + (++itSeq);
          window.IV_ITEMS.push({
            id, name: r.name, sku: r.sku.toUpperCase(), barcode: r.barcode || '', type: 'product',
            cat: r.cat, unit: 'each', cost: r.cost || 0, price: r.price || 0, reorder: 0, par: 0,
            icon: (window.IV_CATS.find((c) => c.id === r.cat) || {}).icon || 'cube-outline',
            tint: window.IV_TINTS.slate, pos: { show: false, cat: r.cat, tile: 'image' },
            stock: { dt: 0, up: 0, ap: 0, wh: 0 },
          });
          created++;
          if (r.qty > 0) {
            post(id, locId, r.qty, { kind: 'adjust', reason: 'found', doc: nextNo('AJ', ++ajSeq),
              ref: 'Import · opening balance', cost: r.qty * (r.cost || 0) });
            opening++;
          }
        });
        IVS.say(created + ' created · ' + updated + ' updated' + (opening ? ' · ' + opening + ' opening balances posted' : ''));
        return { created, updated, opening };
      });
    },

    /* ---------- adjustments ---------- */
    /* SERVER: a negative result needs a reason and an owner PIN. The sheet collects both;
       production re-checks the PIN and the role that may authorise a negative. */
    postAdjustment({ itemId, locId, delta, reason, note }) {
      return IVS.tx(() => {
        const it = window.IV.item(itemId);
        const r = window.IV_REASONS.find((x) => x.id === reason);
        post(itemId, locId, delta, { kind: 'adjust', reason, doc: nextNo('AJ', ++ajSeq),
          ref: note && note.trim() ? note.trim() : r.label, cost: Math.abs(delta) * (it.cost || 0) });
        IVS.say('Adjusted · ' + it.name + ' ' + (delta > 0 ? '+' : '−') + Math.abs(delta) + ' at ' + window.IV.loc(locId).code);
        return { after: it.stock[locId] };
      });
    },

    /* ---------- the one movement post ----------
       Stock in, stock out, move and adjust are ONE operation differing only in where
       stock comes from, where it goes, and what the quantity column means. Four presets
       of one call rather than four code paths — which is why the four forms can never
       drift apart the way four separate screens do.

       lines: [{ id, qty }] — for 'adjust', qty is the NEW COUNT at that location, not a
       delta; for every other kind it is the quantity that physically moved.
       SERVER: reason mandatory on adjust; a negative result needs an owner PIN and a
       role permitted to authorise it. */
    postMovement({ kind, loc, from, to, partner, lines, reason, note, ref }) {
      return IVS.tx(() => {
        const rows = (lines || []).filter((l) => kind === 'adjust' ? l.qty != null && l.qty !== '' : +l.qty > 0);
        if (!rows.length) return null;
        const seq = kind === 'in' ? nextNo('SI', ++siSeq) : kind === 'out' ? nextNo('SO', ++soSeq)
          : kind === 'move' ? nextNo('MV', ++mvSeq) : nextNo('AJ', ++ajSeq);
        const r = reason && window.IV_REASONS.find((x) => x.id === reason);
        const label = ref && ref.trim() ? ref.trim() : note && note.trim() ? note.trim()
          : partner ? partner : r ? r.label : window.IV_DOC_KIND[kind].label;
        let units = 0, value = 0;

        rows.forEach((l) => {
          const it = window.IV.item(l.id);
          const cost = it.cost || 0;
          if (kind === 'move') {
            /* one document, two postings — out of source, into destination. Never a
               decrement plus an unrelated increment. */
            post(l.id, from, -(+l.qty), { kind: 'transfer', doc: seq, partner: null,
              ref: seq + ' to ' + window.IV.loc(to).name, cost: (+l.qty) * cost });
            post(l.id, to, +l.qty, { kind: 'transfer', doc: seq, partner: null,
              ref: seq + ' from ' + window.IV.loc(from).name, cost: (+l.qty) * cost });
            units += +l.qty; value += (+l.qty) * cost;
            return;
          }
          const at = loc;
          const held = it.stock ? (it.stock[at] || 0) : 0;
          const delta = kind === 'in' ? +l.qty : kind === 'out' ? -(+l.qty) : (+l.qty) - held;
          if (!delta) return;
          if (kind === 'in' && l.cost != null) reaverage(l.id, +l.qty, +l.cost);
          post(l.id, at, delta, {
            kind: kind === 'in' ? 'receipt' : kind === 'out' ? 'issue' : 'adjust',
            doc: seq, partner: partner || null, reason: kind === 'adjust' ? reason : null,
            ref: label, cost: Math.abs(delta) * (kind === 'in' && l.cost != null ? +l.cost : cost),
          });
          units += Math.abs(delta); value += Math.abs(delta) * cost;
        });

        const where = kind === 'move'
          ? window.IV.loc(from).code + ' → ' + window.IV.loc(to).code
          : window.IV.loc(loc).code;
        IVS.say(seq + ' posted · ' + rows.length + ' line' + (rows.length === 1 ? '' : 's') +
          ' · ' + units + ' unit' + (units === 1 ? '' : 's') + ' · ' + where, kind === 'out' ? 'warn' : 'ok');
        return seq;
      });
    },

    /* ---------- receiving ---------- */
    /* lines: [{ id, qty, cost, lot }] — qty is what physically arrived, not what was ordered. */
    receive({ poId, locId, lines, ref }) {
      return IVS.tx(() => {
        const po = poId ? window.IV_POS.find((p) => p.id === poId) : null;
        const at = po ? po.to : locId;
        let value = 0, n = 0;
        const docNo = po ? po.no : nextNo('SI', ++siSeq);
        lines.filter((l) => l.qty > 0).forEach((l) => {
          reaverage(l.id, l.qty, l.cost);
          post(l.id, at, l.qty, { kind: 'receipt', doc: docNo, ref: ref,
            partner: po ? (window.IV_SUPPLIERS.find((s) => s.id === po.supplier) || {}).name : null,
            cost: l.qty * l.cost, lot: l.lot || null });
          if (po) { const pl = po.lines.find((x) => x.id === l.id); if (pl) pl.recv += l.qty; }
          value += l.qty * l.cost; n++;
        });
        if (po) {
          const done = po.lines.every((l) => l.recv >= l.qty);
          const some = po.lines.some((l) => l.recv > 0);
          po.status = done ? 'received' : some ? 'partial' : po.status;
          po.received = window.IVS.today();
        }
        IVS.say('Received ' + n + ' line' + (n === 1 ? '' : 's') + ' · ' + window.money(value) + ' into ' + window.IV.loc(at).code);
        return { value, n, status: po ? po.status : null };
      });
    },

    /* ---------- purchase orders ---------- */
    createPO({ supplier, to, lines, send }) {
      return IVS.tx(() => {
        const po = {
          id: 'po' + (++poSeq), no: nextNo('PO', poSeq), supplier, to,
          status: send ? 'sent' : 'draft', created: clock(),
          expected: IVS.etaFor(supplier),
          lines: lines.map((l) => ({ id: l.id, qty: +l.qty, cost: +l.cost, recv: 0 })),
        };
        window.IV_POS.unshift(po);
        IVS.say(po.no + (send ? ' sent to ' : ' saved as draft · ') + (window.IV_SUPPLIERS.find((s) => s.id === supplier) || {}).name);
        return po;
      });
    },
    sendPO(id) {
      return IVS.tx(() => {
        const po = window.IV_POS.find((p) => p.id === id);
        po.status = 'sent'; po.sent = clock();
        window.IV_OUTBOX.unshift({ id: 'msg' + (++msgSeq), supplier: po.supplier, subject: 'Purchase order ' + po.no,
          at: clock(), state: navigator.onLine === false ? 'queued' : 'sent', kind: 'po', ref: po.no });
        IVS.say(po.no + ' sent · ' + (navigator.onLine === false ? 'queued until back online' : 'emailed to supplier'));
        return po;
      });
    },
    etaFor(supplierId) {
      const s = window.IV_SUPPLIERS.find((x) => x.id === supplierId);
      const d = new Date(); d.setDate(d.getDate() + ((s && s.lead) || 5));
      return pad(d.getDate()) + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    },

    /* ---------- counts ---------- */
    createCount({ loc, scope, blind, lines }) {
      return IVS.tx(() => {
        const c = { id: 'c' + (++cSeq), no: nextNo(scope.indexOf('Full') === 0 ? 'FC' : 'CC', cSeq),
          loc, scope, status: 'open', blind: !!blind, by: WHO, at: clock(), lines };
        window.IV_COUNTS.unshift(c);
        IVS.say(c.no + ' opened · ' + lines.length + ' lines at ' + window.IV.loc(loc).code);
        return c;
      });
    },
    saveCount(id, counted) {
      return IVS.tx(() => {
        const c = window.IV_COUNTS.find((x) => x.id === id);
        c.lines.forEach((l) => { const v = counted[id + l.id]; if (v !== undefined) l.cnt = v; });
        c.status = c.lines.every((l) => l.cnt != null) ? 'review' : 'open';
        IVS.say(c.no + ' saved · ' + c.lines.filter((l) => l.cnt != null).length + '/' + c.lines.length + ' counted');
        return c;
      });
    },
    /* one movement per line that differs; the value difference books to shrinkage */
    postCount(id, counted) {
      return IVS.tx(() => {
        const c = window.IV_COUNTS.find((x) => x.id === id);
        let rows = 0, variance = 0;
        c.lines.forEach((l) => {
          const v = counted[id + l.id] !== undefined ? counted[id + l.id] : l.cnt;
          l.cnt = v;
          const d = v - l.exp;
          if (!d) return;
          const it = window.IV.item(l.id);
          post(l.id, c.loc, d, { kind: 'count', doc: c.no, reason: 'recount',
            ref: 'Count ' + c.no, cost: Math.abs(d) * (it.cost || 0) });
          rows++; variance += d * (it.cost || 0);
        });
        c.status = 'posted'; c.postedAt = clock();
        if (variance < 0) {
          const r = window.IV_SHRINK.find((x) => x.reason === 'Shrinkage / theft');
          if (r) { r.v += Math.abs(variance); r.note = 'Includes ' + c.no; }
        }
        IVS.say('Posted ' + c.no + ' · ' + rows + ' movement' + (rows === 1 ? '' : 's') + ' · variance ' + window.money(variance),
          variance < 0 ? 'warn' : 'ok');
        return { rows, variance };
      });
    },
    scheduleCycle(cfg) {
      return IVS.tx(() => {
        const cy = Object.assign({ id: 'cy' + (++cySeq), by: WHO, created: clock() }, cfg);
        window.IV_CYCLES.unshift(cy);
        IVS.say('Cycle scheduled · ' + cfg.cadenceLabel + ' · next ' + cfg.next[0]);
        return cy;
      });
    },

    /* ---------- transfers ---------- */
    /* A transfer is ONE document with TWO postings, never a decrement plus an unrelated
       increment. Send moves stock out of source and into in-transit; receive brings it
       on hand at destination. Between the two, the quantity is owned, visible, and not
       sellable — which is exactly why the destination is NOT incremented on send. */
    createTransfer({ from, to, lines, send }) {
      return IVS.tx(() => {
        const t = {
          id: 't' + (++trSeq), no: nextNo('TR', trSeq), from, to,
          status: 'draft', by: WHO, sent: '—', eta: IVS.etaLocal(),
          lines: lines.map((l) => ({ id: l.id, qty: +l.qty, recv: 0 })),
        };
        window.IV_TRANSFERS.unshift(t);
        if (send) return IVS.sendTransfer(t.id), t;
        IVS.say(t.no + ' saved as draft · ' + window.IV.loc(from).code + ' → ' + window.IV.loc(to).code);
        return t;
      });
    },
    sendTransfer(id) {
      return IVS.tx(() => {
        const t = window.IV_TRANSFERS.find((x) => x.id === id);
        let n = 0, value = 0;
        t.lines.forEach((l) => {
          const it = window.IV.item(l.id);
          post(l.id, t.from, -l.qty, { kind: 'transfer', doc: t.no,
            ref: t.no + ' to ' + window.IV.loc(t.to).name, cost: l.qty * (it.cost || 0) });
          n++; value += l.qty * (it.cost || 0);
        });
        t.status = 'in-transit'; t.sent = clock();
        IVS.say(t.no + ' sent · ' + n + ' line' + (n === 1 ? '' : 's') + ' · ' + window.money(value) + ' in transit');
        return t;
      });
    },
    /* lines: [{ id, qty }] — what physically arrived. A short arrival is a variance at
       the destination, recorded against the transfer, never silently clamped. */
    receiveTransfer(id, lines) {
      return IVS.tx(() => {
        const t = window.IV_TRANSFERS.find((x) => x.id === id);
        let n = 0, short = 0;
        (lines || t.lines.map((l) => ({ id: l.id, qty: l.qty - l.recv }))).forEach((r) => {
          if (r.qty <= 0) return;
          const it = window.IV.item(r.id);
          post(r.id, t.to, r.qty, { kind: 'transfer', doc: t.no,
            ref: t.no + ' from ' + window.IV.loc(t.from).name, cost: r.qty * (it.cost || 0) });
          const tl = t.lines.find((l) => l.id === r.id);
          if (tl) tl.recv += r.qty;
          n++;
        });
        t.lines.forEach((l) => { if (l.recv < l.qty) short += l.qty - l.recv; });
        t.status = t.lines.every((l) => l.recv >= l.qty) ? 'received' : 'in-transit';
        t.received = clock();
        IVS.say('Received ' + n + ' line' + (n === 1 ? '' : 's') + ' at ' + window.IV.loc(t.to).code +
          (short ? ' · ' + short + ' still in transit' : ''), short ? 'warn' : 'ok');
        return { n, short };
      });
    },
    etaLocal() { const d = new Date(); d.setHours(d.getHours() + 6); return 'Today · ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); },

    /* ---------- partners ---------- */
    /* One record, one or more roles. `createSupplier` is kept as the name the purchase
       screens already call, but it writes a partner \u2014 there is no supplier table. */
    createPartner(d) {
      return IVS.tx(() => {
        const roles = (d.roles && d.roles.length) ? d.roles : ['supplier'];
        const s = { id: 'pt' + (++supSeq), name: d.name.trim(), roles, contact: d.contact || '—',
          email: d.email || '', phone: d.phone || '', terms: d.terms, lead: +d.lead || 7,
          moq: +d.moq || 0, items: 0, spend: 0, onTime: 1,
          note: d.note || 'New partner — no history yet.' };
        window.IV_PARTNERS.push(s);
        IVS.say(s.name + ' added · ' + roles.map((r) => window.IV_ROLE[r].label.toLowerCase()).join(' & ') + ' · ' + s.terms);
        return s;
      });
    },
    createSupplier(d) { return IVS.createPartner(Object.assign({ roles: ['supplier'] }, d)); },
    queueEmail(m) {
      return IVS.tx(() => {
        const online = navigator.onLine !== false;
        const msg = Object.assign({ id: 'msg' + (++msgSeq), at: clock(), state: online ? 'sent' : 'queued' }, m);
        window.IV_OUTBOX.unshift(msg);
        IVS.say(online ? 'Sent to ' + m.to : 'Queued — sends when the device is back online', online ? 'ok' : 'warn');
        return msg;
      });
    },
  };

  window.IVS = IVS;
})();
