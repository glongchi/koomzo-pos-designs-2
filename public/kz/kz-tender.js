/* Koomzo — the tender model every register reads.

   One list, one order, one set of copy. Before this file, Retail, Flex and
   Mobile each restated the tender list locally and each drifted: English
   labels, card as the default, and "Wallet" standing in for two wallets a
   customer names out loud. The tender names themselves live in kz-locale.js —
   this file only composes them and owns the copy around them. */

const KZT_L = () => window.KZ_LOCALE;

window.KZ_TENDER = {
  /* MoMo, not card. A Cameroonian counter reaches for the wallet first. */
  DEFAULT: 'momo',

  /* ---- phases (change 5) --------------------------------------------------
     A boolean cannot describe a push rail. Koomzo posts a payment request and
     then WAITS: the customer authorises on their own handset, and the answer
     arrives by callback or by polling the reference. Every one of these is an
     ordinary outcome the cashier must be able to act on — including 'expired',
     which is a retry, not an error. */
  PHASE: {
    IDLE: 'idle',            /* nothing requested yet */
    REQUESTED: 'requested',  /* request leaving the till */
    PENDING: 'pending',      /* with the customer, amount locked */
    OK: 'succeeded',
    DECLINED: 'declined',    /* refused, or insufficient balance */
    EXPIRED: 'expired',      /* no answer inside the window */
    UNKNOWN: 'unknown',      /* resolve by status query, never by re-requesting */
  },
  /* seconds the customer has to approve before we call it expired */
  WINDOW: 45,

  /* ---- provisioning (change 5) -------------------------------------------
     push   — we request, the customer approves on their handset. The target.
     attest — no integration: the customer pays the merchant code and the
              operator confirms against their own SMS. The only offline mode.
     manual — recorded like cash out of drawer, reconciled from the statement. */
  provisioning: 'push',
  modeFor(id) {
    if (!this.isWallet(id)) return 'direct';
    if (this.provisioning === 'manual') return 'manual';
    /* a push tender requires the network by definition */
    if (this.provisioning === 'attest' || (typeof navigator !== 'undefined' && navigator.onLine === false)) return 'attest';
    return 'push';
  },

  /* ---- the reference is ours, not theirs (change 5) ----------------------
     We generate the idempotency key and externalId before the request leaves
     the till; the provider's own id is stored beside it when it arrives. This
     is why no operator is ever asked to type a transaction number. */
  ref() {
    const r = Math.random().toString(36).slice(2, 8).toUpperCase();
    return 'KZ-' + new Date().toISOString().slice(5, 10).replace('-', '') + '-' + r;
  },

  /* ---- a ticket holds SEVERAL tenders (change 6) -------------------------
     Split payment used to be a label with nothing behind it. Each capture is
     its own record, persisted the moment it happens, so a device that dies
     mid-split resumes with money already taken intact. */
  sum(list) { return (list || []).filter((x) => x.phase === 'succeeded').reduce((s, x) => s + x.amount, 0); },
  balance(total, list) { return Math.max(0, Math.round(total) - this.sum(list)); },
  capture(list, x) {
    return (list || []).concat([{
      id: x.id, mode: x.mode || this.modeFor(x.id), amount: Math.round(x.amount),
      ref: x.ref || this.ref(), providerRef: x.providerRef || null,
      phase: x.phase || 'succeeded', attested: !!x.attested,
      at: new Date().toISOString(), by: x.by || 'Anita Ndongo',
    }]);
  },
  /* decision 20.2: persisted on every capture, not at the end */
  store: {
    key(no) { return 'kz.tender.' + no; },
    save(no, list) { try { localStorage.setItem(this.key(no), JSON.stringify(list || [])); } catch (e) {} },
    load(no) { try { return JSON.parse(localStorage.getItem(this.key(no))) || []; } catch (e) { return []; } },
    clear(no) { try { localStorage.removeItem(this.key(no)); } catch (e) {} },
  },

  /* extras a module bolts on. Loyalty is everywhere; room is hospitality only. */
  LOYALTY: { id: 'loyalty', label: 'Loyalty', icon: 'star-outline' },
  ROOM: { id: 'room', label: 'Charge to room', icon: 'bed-outline' },
  SPLIT: { id: 'split', label: 'Split payment', icon: 'git-branch-outline' },
  /* real instruments other trades take, not variants of cash:
     a prepaid balance, a house account, a gift card. */
  WALLET: { id: 'wallet', label: 'Member wallet', icon: 'wallet-outline' },
  TAB: { id: 'tab', label: 'Charge to account', icon: 'reader-outline' },
  GIFT: { id: 'gift', label: 'Carte cadeau', icon: 'gift-outline' },

  /* opt.lead puts an extra BEFORE the platform four — a gym floor reaches for
     the member's wallet first, and the order of this list is the order the
     counter actually works in. opt.without drops what a trade cannot take. */
  list(opt) {
    const o = opt || {};
    const key = { loyalty: 'LOYALTY', room: 'ROOM', split: 'SPLIT', wallet: 'WALLET', tab: 'TAB', gift: 'GIFT' };
    const lead = (o.lead || []).map((k) => this[key[k]]).filter(Boolean);
    let l = lead.concat(KZT_L().tenderList);
    Object.keys(key).forEach((k) => {
      if (o[k] && (o.lead || []).indexOf(k) < 0) l = l.concat([this[key[k]]]);
    });
    if (o.without) l = l.filter((t) => o.without.indexOf(t.id) < 0);
    return l;
  },
  /* the module shape: some screens want {id,name,icon} rather than {id,label,icon} */
  named(opt) { return this.list(opt).map((t) => ({ id: t.id, name: t.label, icon: t.icon })); },
  find(id) {
    return this.list({ loyalty: true, room: true, split: true, wallet: true, tab: true, gift: true })
      .find((t) => t.id === id) || null;
  },
  label(id) { const t = this.find(id); return t ? t.label : id; },
  /* the two push-rail wallets behave alike and differ from everything else */
  isWallet(id) { return id === 'momo' || id === 'om'; },
  /* instruments that settle against a balance we already hold — no rail, no wait */
  isInternal(id) { return id === 'wallet' || id === 'tab' || id === 'gift' || id === 'loyalty'; },

  /* Quick-cash keys offer notes that circulate: 500 up to 10 000 F.
     Rounding to the next 5 / 10 / 20 was a dollar-till habit. */
  quickCash(total) {
    const t = Math.round(total) || 0;
    const out = [t, Math.ceil(t / 500) * 500].concat(KZT_L().notes.filter((n) => n >= t));
    return out.filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4);
  },
  /* the smallest coin is 5 F, so some change cannot physically be given */
  changeShort(change) { return Math.round(change) % KZT_L().coins[0] !== 0; },

  cta(id, total) {
    const m = KZT_L().short(total);
    if (id === 'cash') return 'Tender cash';
    if (this.isWallet(id)) return (this.modeFor(id) === 'attest' ? 'Confirm ' : 'Request ') + m;
    if (id === 'loyalty' || id === 'wallet') return 'Apply balance';
    if (id === 'tab') return 'Charge to account';
    if (id === 'gift') return 'Redeem card';
    return 'Take payment';
  },
  paidLine(id, o) {
    const x = o || {};
    if (id === 'cash') {
      const c = Math.round(x.change || 0);
      return 'Change due ' + KZT_L().short(c) + (this.changeShort(c) ? ' · round to the nearest 5 F' : '');
    }
    if (this.isWallet(id)) return 'Confirmed · ' + this.label(id);
    if (id === 'card') return 'Approved · ' + this.label(id);
    if (id === 'tab') return 'On the account · settles later';
    return 'Paid by ' + this.label(id);
  },
  /* what a pending push says while the amount is locked */
  pendingCopy(id) {
    return 'Waiting for the customer to approve on ' + this.label(id) + '. The amount is locked.';
  },
  phaseCopy(phase, id) {
    const P = this.PHASE;
    if (phase === P.DECLINED) return 'Refused on ' + this.label(id) + '. Try again or switch tender.';
    if (phase === P.EXPIRED) return 'No answer in time. Request again, or take another tender.';
    if (phase === P.UNKNOWN) return 'Outcome unclear. Check the status — never send a second request.';
    return null;
  },
  hint(id) {
    if (this.isWallet(id)) {
      return this.modeFor(id) === 'attest'
        ? 'Offline: the customer pays the merchant code, then you confirm receipt against your own SMS.'
        : 'The customer approves the request on their own handset. Nothing to type.';
    }
    if (id === 'card') return 'Waiting for the terminal — ask the customer to tap, insert or swipe.';
    if (id === 'split') return 'Take a first amount, then the balance on another tender.';
    if (id === 'loyalty' || id === 'wallet') return 'Applies a balance we already hold — nothing to wait for.';
    if (id === 'tab') return 'Goes on the house account and settles on its own terms.';
    return null;
  },
  hintIcon(id) {
    if (this.isWallet(id)) return 'phone-portrait-outline';
    if (id === 'split') return 'git-branch-outline';
    if (id === 'loyalty') return 'star-outline';
    return 'card-outline';
  },
};
