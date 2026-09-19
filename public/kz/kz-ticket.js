/* Koomzo — ticket numbers, composed at the till.

   Decision 20.4. A bare sequence (#1042) collides the moment two tills sell
   offline, and the only fix left is renumbering — which breaks the receipt in
   a customer's pocket and the trail an auditor follows. So the number carries
   its own origin: LOCATION-REGISTER-SESSION-SEQUENCE. Collisions are then
   structurally impossible and the server never has to renumber anything.

   Generated once, immutable thereafter. The server keeps its own internal id. */

window.KZ_TICKET = {
  /* MMDD — a session belongs to one register on one day */
  session(d) {
    const x = d || new Date();
    return String(x.getMonth() + 1).padStart(2, '0') + String(x.getDate()).padStart(2, '0');
  },
  compose(o) {
    const p = o || {};
    return [p.loc || 'DLA1', p.reg || 'C1', p.session || this.session(), String(p.seq || 1).padStart(4, '0')].join('-');
  },
  parse(no) {
    const p = String(no || '').split('-');
    return p.length === 4 ? { loc: p[0], reg: p[1], session: p[2], seq: +p[3] } : null;
  },
  /* the form for tight spaces — tiles, order headers, dense tables */
  short(no) {
    const p = this.parse(no);
    return p ? '#' + String(p.seq).padStart(4, '0') : '#' + no;
  },
  next(no) {
    const p = this.parse(no);
    return p ? this.compose({ ...p, seq: p.seq + 1 }) : no;
  },
};
