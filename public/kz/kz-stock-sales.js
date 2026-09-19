/* Koomzo — selling, as seen by the stock ledger.

   The POS's adapter onto kz-stock.js. A sale is a movement kind, so the ledger owns
   the writing; but "ticket", "refund" and "register" are POS vocabulary and do not
   belong in a core that an Inventory-only tenant loads. Split accordingly: this file
   is loaded by registers, never by a stock-only business.

   Closes §14 of the Register ↔ Inventory integration spec. */

(function () {
  const S = () => window.KZ_STOCK;

  window.KZ_SALES = {
    /* ---- one paid ticket, one document ---------------------------------------
       Called at the moment of payment, never on add-to-ticket: an abandoned ticket
       must leave no trace in the ledger, and in a queue where tickets are held,
       cleared and resumed constantly, decrementing on add drifts unrecoverably. */
    postSale({ ticketNo, locId, actor, customer, lines }) {
      const K = S();
      /* the tier is READ from the tenant, never passed in — a register cannot claim
         a tier it does not have, and 'off' posts nothing at all. */
      if (!K.tracks()) return { doc: ticketNo, rows: [], negatives: [], skipped: 'tier-off' };
      /* idempotent on replay, keyed by the document. Two tills syncing the same
         offline ticket must not sell the same units twice — the same reasoning that
         put the ticket number together at the till (decision 21.4). */
      if (K.hasDoc(ticketNo)) {
        const rows = K.byDoc(ticketNo);
        return { doc: ticketNo, rows, negatives: [], replayed: true };
      }
      return K.tx(() => {
        const rows = [], negatives = [];
        (lines || []).forEach((l) => {
          const qty = Math.abs(+l.qty || 0);
          if (!qty) return;
          this.expand(l.id, qty).forEach((c) => {
            const it = K.item(c.id);
            if (!it || !it.stock) return; /* services and non-stock lines move nothing */
            const row = K.post(c.id, locId, -c.qty, {
              kind: 'sale', doc: ticketNo,
              ref: 'Ticket ' + (window.KZ_TICKET ? window.KZ_TICKET.short(ticketNo) : ticketNo),
              partner: customer || 'Walk-in', actor: actor,
              cost: Math.round(c.qty * (it.cost || 0)),
              lot: l.lot || null, serial: l.serial || null,
              via: c.parent || null,
            });
            rows.push(row);
            /* a negative is surfaced, never clamped: it means the shop sold what it
               did not have, which is precisely what the owner needs to see. */
            if (row.before - c.qty < 0) negatives.push({ id: c.id, name: it.name, after: row.before - c.qty });
          });
        });
        return { doc: ticketNo, rows, negatives };
      });
    },

    /* ---- composites ----------------------------------------------------------
       Selling a gift basket or a cocktail depletes its COMPONENTS, not itself. The
       recipe already lives on the item; nothing new is modelled here. */
    expand(itemId, qty) {
      const it = S().item(itemId);
      if (it && it.recipe && it.recipe.length) {
        return it.recipe.map((c) => ({ id: c.id, qty: qty * (c.qty || 1), parent: itemId }));
      }
      return [{ id: itemId, qty: qty, parent: null }];
    },

    /* ---- reversals -----------------------------------------------------------
       A new movement forward in time, referencing the original document. The
       original row is never touched, by any role. */
    reverseSale({ ticketNo, locId, actor, lines, condition }) {
      const K = S();
      if (!K.tracks()) return { doc: null, rows: [] };
      const doc = ticketNo + '-R';
      if (K.hasDoc(doc)) return { doc, rows: K.byDoc(doc), replayed: true };
      return K.tx(() => {
        const rows = [];
        (lines || []).forEach((l) => {
          const qty = Math.abs(+l.qty || 0);
          if (!qty) return;
          this.expand(l.id, qty).forEach((c) => {
            const it = K.item(c.id);
            if (!it || !it.stock) return;
            rows.push(K.post(c.id, locId, +c.qty, {
              kind: 'sale', doc: doc, ref: 'Refund of ' + (window.KZ_TICKET ? window.KZ_TICKET.short(ticketNo) : ticketNo),
              reason: 'customer return', actor: actor, cost: Math.round(c.qty * (it.cost || 0)),
            }));
            /* damaged goods are TWO events: the customer's refund, and the business's
               loss. One row each, because they are not the same fact. */
            if (condition === 'damaged') {
              rows.push(K.post(c.id, locId, -c.qty, {
                kind: 'adjust', doc: doc, reason: 'damaged', ref: 'Returned damaged · ' + doc,
                actor: actor, cost: Math.round(c.qty * (it.cost || 0)),
              }));
            }
          });
        });
        return { doc, rows };
      });
    },

    /* an exchange is ONE document with both movements — the old item in, the new
       out — never a refund plus an unrelated sale. */
    exchange({ ticketNo, locId, actor, back, out }) {
      const K = S();
      if (!K.tracks()) return { doc: null, rows: [] };
      const doc = ticketNo + '-X';
      return K.tx(() => {
        const rows = [];
        (back || []).forEach((l) => this.expand(l.id, Math.abs(+l.qty || 0)).forEach((c) => {
          const it = K.item(c.id); if (!it || !it.stock) return;
          rows.push(K.post(c.id, locId, +c.qty, { kind: 'sale', doc, ref: 'Exchange · returned',
            actor, cost: Math.round(c.qty * (it.cost || 0)) }));
        }));
        (out || []).forEach((l) => this.expand(l.id, Math.abs(+l.qty || 0)).forEach((c) => {
          const it = K.item(c.id); if (!it || !it.stock) return;
          rows.push(K.post(c.id, locId, -c.qty, { kind: 'sale', doc, ref: 'Exchange · replacement',
            actor, cost: Math.round(c.qty * (it.cost || 0)) }));
        }));
        return { doc, rows };
      });
    },

    /* ---- module bootstrap ----------------------------------------------------
       Grocery, Salon and Gym each carry their own catalogue shape. Rather than
       teach the ledger four shapes, each module maps its products once into the
       one item shape and seeds an opening balance. Idempotent per module id. */
    adopt(moduleId, locId, products) {
      return window.KZ_STOCK.seedCatalog(moduleId, products.map((p) => ({
        id: moduleId + ':' + p.id, name: p.name, sku: p.sku || (moduleId + '-' + p.id).toUpperCase(),
        cat: p.cat || moduleId, price: p.price || p.perKg || 0, icon: p.icon || 'cube-outline',
        tint: p.tint || null, unit: p.unit || (p.sold === 'weight' ? 'kg' : 'each'),
        weighed: p.sold === 'weight', recipe: p.recipe || null,
      })), locId, (p) => {
        const src = products.find((x) => moduleId + ':' + x.id === p.id);
        return src && src.stock != null ? src.stock : 20;
      });
    },
    /* one call a module makes at its own commit point */
    sellFrom(moduleId, { ticketNo, locId, actor, customer, lines }) {
      return this.postSale({ ticketNo, locId, actor, customer,
        lines: (lines || []).map((l) => ({ id: moduleId + ':' + l.id, qty: l.qty, lot: l.lot, serial: l.serial })) });
    },

    /* what a register says when a sale drove stock below zero */
    negativeCopy(negatives) {
      if (!negatives || !negatives.length) return null;
      const n = negatives[0];
      return negatives.length === 1
        ? n.name + ' is now ' + n.after + ' — count the shelf when the queue clears.'
        : negatives.length + ' products went below zero — count them when the queue clears.';
    },
  };
})();
