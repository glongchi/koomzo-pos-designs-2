/* Koomzo — what a cashier may do without asking.

   Decision 20.3. Per TENANT, never per role: a hardware shop that negotiates
   every sale and a pharmacy that never discounts cannot share a number, and
   making it per role would turn a role change into a silent pricing change.

   Defaults are deliberately tight. Discount leakage is the most common margin
   loss in small West African retail, and it is far easier to loosen a limit
   than to recover money already given away. */

window.KZ_POLICY = {
  /* a cashier acts freely under these; above them, a supervisor approves */
  lineDiscountPct: 10,
  ticketDiscountPct: 5,
  ticketDiscountAmount: 5000,
  /* a price override is NEVER a cashier action, at any amount */
  overrideAlwaysApproved: true,
  /* whether this trade charges TVA at all. Zero-rated is not "no tax" — it is
     a rate of zero on a taxable supply, which is a different line on a return. */
  taxable: true,

  /* ---- per-module overrides ------------------------------------------------
     The ceiling is per tenant by design, but a trade's margins are real: a
     salon negotiating with a regular is ordinary practice where a pharmacy
     discounting is not. So a module may carry its own number, and everything
     reads it through for(). Anything absent falls back to the base above. */
  modules: {
    salon: { lineDiscountPct: 20 },   /* service margins, and regulars */
    gym:   { taxable: false },        /* memberships — set true when confirmed */
    grocery: { lineDiscountPct: 5 },  /* thin margins, high volume */
  },
  for(moduleId) {
    const base = {
      lineDiscountPct: this.lineDiscountPct, ticketDiscountPct: this.ticketDiscountPct,
      ticketDiscountAmount: this.ticketDiscountAmount,
      overrideAlwaysApproved: this.overrideAlwaysApproved, taxable: this.taxable,
    };
    return Object.assign(base, (moduleId && this.modules[moduleId]) || {});
  },
  /* tax for a module's line total, in whole francs */
  taxFor(moduleId, net) { return window.KZ_LOCALE.tax(net, !this.for(moduleId).taxable); },
  taxLabelFor(moduleId) { return window.KZ_LOCALE.taxLabel(!this.for(moduleId).taxable); },

  reasons: ['Damaged or short-dated', 'Manager goodwill', 'Staff purchase',
            'Price match', 'Trade / bulk price', 'Clearance'],

  /* moduleId is optional — omitted, these answer for the tenant base */
  needsApproval(kind, value, base, moduleId) {
    const p = this.for(moduleId);
    if (kind === 'price') return p.overrideAlwaysApproved;
    if (kind === 'disc') return Number(value) > p.lineDiscountPct;
    if (kind === 'ticket') {
      const v = Number(value) || 0;
      return v > p.ticketDiscountAmount || (base ? v / base * 100 > p.ticketDiscountPct : false);
    }
    return false;
  },
  ceilingCopy(kind, moduleId) {
    const p = this.for(moduleId);
    if (kind === 'price') return 'A price override always needs a supervisor.';
    if (kind === 'disc') return 'Above ' + p.lineDiscountPct + ' % on a line, a supervisor approves.';
    return 'Above ' + p.ticketDiscountPct + ' % or ' +
      window.KZ_LOCALE.short(p.ticketDiscountAmount) + ' on a ticket, a supervisor approves.';
  },
  /* the discount steps a module offers, capped at its own ceiling */
  discountSteps(moduleId) {
    const c = this.for(moduleId).lineDiscountPct;
    return [0, 5, 10, 15, 20, 25, 50].filter((d) => d === 0 || d <= c).concat([c]).
      filter((d, i, a) => a.indexOf(d) === i).sort((a, b) => a - b);
  },
  /* the figure an owner can act on — discount as a share of net sales */
  leakage(discount, net) { return net > 0 ? Math.round(discount / net * 1000) / 10 : 0; },
  supervisors: ['M. Ekindi', 'Divine Ayuk'],
};
