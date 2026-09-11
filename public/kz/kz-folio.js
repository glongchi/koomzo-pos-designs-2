/* ==========================================================================
   Koomzo — the folio bridge. One posting, two modules.

   The Restaurant (or any other module) needs to put a bill somewhere other
   than a drawer. The Hotel owns the folio. Neither should import the other,
   so this is the seam: the hotel PUBLISHES which rooms may be charged, other
   modules POST against them, and the hotel drains the queue.

   Mirrors the server contract in the spec: a cross-module charge is ONE line
   carrying its source module and the id of the document that raised it. The
   originating order stays immutable and closes as settled_to_folio.
   ========================================================================== */
(function () {
'use strict';
const KEY = 'kz.folio.v1';
const RATE = { XAF: 1, USD: 655, EUR: 656 };   /* zero-decimal XAF is the folio currency */

function read() {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {}
  return { rooms: [], queue: [], seq: 1 };
}
function write(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('kzfolio', { detail: s }));
}

/* the hotel says what is chargeable right now */
function publish(rooms) {
  const s = read();
  s.rooms = rooms.map((r) => ({ stayId: r.stayId, no: r.no, guest: r.guest, plan: r.plan }));
  write(s);
}
const rooms = () => read().rooms;
const available = () => !!(window.KZ && KZ.moduleOn('hotel')) && read().rooms.length > 0;

/* another module posts a charge onto a room */
function post(p) {
  const s = read();
  const amount = Math.round((p.amount || 0) * (RATE[p.ccy || 'XAF'] || 1));
  const line = { id: 'p' + (s.seq++), stayId: p.stayId, no: p.no, kind: p.kind || 'fnb',
    desc: p.desc || 'Charge', amount, src: p.src || 'Restaurant', ref: p.ref || null, at: Date.now() };
  s.queue.push(line);
  write(s);
  return line;
}

/* the hotel takes them and clears the queue */
function drain() {
  const s = read();
  const q = s.queue;
  if (!q.length) return [];
  s.queue = [];
  write(s);
  return q;
}
function subscribe(fn) {
  const local = () => fn();
  const cross = (e) => { if (e.key === KEY) fn(); };
  window.addEventListener('kzfolio', local);
  window.addEventListener('storage', cross);
  return () => { window.removeEventListener('kzfolio', local); window.removeEventListener('storage', cross); };
}

window.KZFolio = { publish, rooms, available, post, drain, subscribe, RATE };
})();
