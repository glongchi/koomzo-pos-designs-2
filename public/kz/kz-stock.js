/* Koomzo — the stock ledger. Platform layer.

   Promoted out of inventory/iv-store.js so it is not module-private. Before this,
   the ledger was loaded by exactly one page and no register could see it — so the
   registers kept their own stock and the two numbers drifted.

   This file is deliberately UNIVERSAL. It knows about items, locations, movements,
   on-hand and cost; it knows nothing about tickets, tenders or registers. A tenant
   who runs Inventory alone and never sells through a Koomzo till loads this file and
   nothing else. Sale posting is an ADAPTER over this core — see kz-stock-sales.js.

   The one invariant: stock is never edited, it is always moved. Every quantity
   change is a row carrying what the on-hand was BEFORE, what changed it, under which
   document, and which actor did it. */

(function () {
  const ls = new Set();
  let rev = 0;
  const bump = () => { rev++; ls.forEach((f) => f(rev)); };
  const pad = (n) => String(n).padStart(2, '0');
  const clock = () => { const d = new Date(); return 'Today · ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };

  /* the collections. bind() lets a module hand over the arrays it already owns, so
     the Inventory module's screens keep reading IV_ITEMS / IV_MOVES and see exactly
     the same objects this file posts into. */
  let ITEMS = [], MOVES = [];
  let mSeq = 5000;

  /* ---- who did it -----------------------------------------------------------
     NOT "which register". An Inventory-only tenant's actor is a storekeeper in a
     session; a till's actor is a lane. Both are actors, and a movement with a blank
     or invented `who` defeats the point of keeping a ledger at all. */
  function actor(a) {
    if (!a) return { kind: 'user', label: window.KZ_STOCK.user };
    if (typeof a === 'string') return { kind: 'user', label: a };
    return { kind: a.kind || 'user', label: a.label || window.KZ_STOCK.user };
  }

  const KZ_STOCK = {
    /* session user — in production, immutable for the session */
    user: 'M. Ekindi',

    bind(items, moves) { if (items) ITEMS = items; if (moves) MOVES = moves; return this; },
    items: () => ITEMS,
    moves: () => MOVES,
    item(id) { return ITEMS.find((i) => i.id === id) || null; },

    sub(fn) { ls.add(fn); return () => ls.delete(fn); },
    rev: () => rev,
    tx(fn) { const r = fn(); bump(); return r; },
    bump, clock,

    /* ---- the tier ------------------------------------------------------------
       A TENANT capability, not a register setting. It used to live in Retail Flex's
       tweaks, which left an Inventory-only tenant with no tier at all and made 'off'
       incoherent for a business whose entire module is stock. An owner sets this once
       for the business; every register and every module screen reads it. */
    TIERS: ['off', 'lite', 'full'],
    get tier() {
      try { return localStorage.getItem('kz.stock.tier') || 'lite'; } catch (e) { return 'lite'; }
    },
    set tier(v) {
      try { localStorage.setItem('kz.stock.tier', v); } catch (e) {}
      bump();
    },
    tracks() { return this.tier !== 'off'; },

    /* ---- reads --------------------------------------------------------------- */
    onHand(item, locId) {
      const it = typeof item === 'string' ? this.item(item) : item;
      if (!it || !it.stock) return 0;
      if (!locId || locId === 'all') return Object.keys(it.stock).reduce((s, k) => s + (it.stock[k] || 0), 0);
      return it.stock[locId] || 0;
    },
    isLow(item, locId) {
      const it = typeof item === 'string' ? this.item(item) : item;
      if (!it || !it.stock) return false;
      return this.onHand(it, locId) <= (it.reorder || 0);
    },
    /* every row for one document — the audit handle. You read the ledger by
       document, not by row. */
    byDoc(doc) { return MOVES.filter((m) => m.doc === doc); },
    hasDoc(doc) { return MOVES.some((m) => m.doc === doc); },

    /* ---- the one posting -----------------------------------------------------
       Capture the on-hand BEFORE, apply, write the movement carrying it. Everything
       that changes a quantity — receipt, issue, transfer, count, adjust, sale —
       comes through here, so `before` is never absent and the ledger can always show
       12 → 9 rather than a bare −3. */
    post(itemId, locId, delta, row) {
      const it = this.item(itemId);
      const before = it && it.stock ? (it.stock[locId] || 0) : 0;
      if (it && it.stock) it.stock[locId] = before + delta;
      const m = Object.assign(
        { id: 'm' + (++mSeq), at: clock(), who: (row && row.actor ? row.actor.label : this.user) },
        { item: itemId, loc: locId, qty: delta, before: before }, row || {});
      MOVES.unshift(m);
      return m;
    },

    /* weighted average, rounded to whole francs on every write — XAF has no minor
       unit, so an unrounded unit cost makes every downstream valuation fractional. */
    reaverage(itemId, qty, unitCost) {
      const it = this.item(itemId);
      if (!it || !it.stock || !qty) return it ? it.cost : 0;
      const held = this.onHand(it, 'all');
      it.cost = Math.round(((held * (it.cost || 0)) + (qty * unitCost)) / Math.max(1, held + qty));
      return it.cost;
    },

    /* ---- a count correction, from anywhere ----------------------------------
       The register's Stock tab and the module's count screen post the SAME row. A
       till gets no privileged silent path to a quantity. */
    postCount({ itemId, locId, counted, reason, ref, actor: who }) {
      return this.tx(() => {
        const it = this.item(itemId);
        const delta = Math.round((counted - this.onHand(it, locId)) * 100) / 100;
        if (!delta) return null;
        return this.post(itemId, locId, delta, {
          kind: 'count', reason: reason || 'recount', doc: 'CC-' + Date.now().toString().slice(-6),
          ref: ref || 'Counted at the till', cost: Math.abs(delta) * (it.cost || 0), actor: actor(who),
        });
      });
    },

    /* ---- seeding a catalogue -------------------------------------------------
       Retail Flex carries nine demo trades, each a different product set. A preset
       switch is a DIFFERENT SHOP, so its items are seeded into the ledger as real
       items with a real opening balance rather than the ledger holding nine parallel
       item sets. Idempotent per preset: switching back does not re-open balances. */
    seeded: {},
    seedCatalog(presetId, products, locId, seedQty) {
      if (this.seeded[presetId]) return false;
      this.seeded[presetId] = true;
      return this.tx(() => {
        products.forEach((p) => {
          if (this.item(p.id)) return;
          const it = {
            id: p.id, name: p.name, sku: p.sku || '', barcode: p.barcode || '',
            type: 'product', cat: p.cat, unit: p.unit || 'each',
            cost: Math.round(p.price * 0.42), price: p.price,
            icon: p.icon, tint: p.tint, reorder: p.weighed ? 5 : 6, par: p.weighed ? 25 : 30,
            weighed: !!p.weighed, stock: {}, pos: { show: true, cat: p.cat, tile: 'image' },
            recipe: p.recipe || null,
          };
          ITEMS.push(it);
          const qty = seedQty ? seedQty(p) : 0;
          if (qty > 0) {
            this.post(p.id, locId, qty, { kind: 'adjust', reason: 'found', doc: 'AJ-SEED-' + presetId,
              ref: 'Opening balance', cost: qty * it.cost, actor: actor(null) });
          }
        });
        return true;
      });
    },
  };

  window.KZ_STOCK = KZ_STOCK;
})();
