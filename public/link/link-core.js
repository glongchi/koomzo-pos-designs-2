/* Koomzo Link — core (plan v2 §2.2–2.4).
   MockLocalStore (LocalStorePort), the authority (one function used by both the
   site coordinator and the cloud), MockSyncEngine (SyncEnginePort) and
   MockRemoteStore. Contracts: link/contracts.ts. */
(function () {
  const KZ = (window.KzLink = window.KzLink || {});
  const uid = (p = '') => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const ls = {
    read(k, d) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch (e) { return d; } },
    write(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };
  function signal(v) {
    const subs = new Set();
    return {
      get: () => v,
      set(n) { v = n; subs.forEach((f) => f(v)); },
      update(fn) { this.set(fn(v)); },
      subscribe(f) { subs.add(f); f(v); return () => subs.delete(f); },
    };
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* Collection metadata. critical: stale write is a conflict. audit: never compacted. */
  const COLLECTIONS = {
    rk_order: { critical: true, audit: false },
    rk_ticket: { critical: true, audit: false },
    rk_payment: { critical: true, audit: true },
    rk_void: { critical: true, audit: true },
    stock_move: { critical: true, audit: true },
    approval: { critical: true, audit: true },
    q_ticket: { critical: true, audit: false },
    q_state: { critical: true, audit: false },
    sg_content: { critical: false, audit: false },
    link_counter: { critical: false, audit: false },
  };
  const meta = (c) => COLLECTIONS[c] || { critical: false, audit: false };
  const match = (doc, where) => !where || Object.keys(where).every((k) => doc && doc[k] === where[k]);

  /* Simulation switches, written by the dev harness. */
  const SIM_DEFAULT = { internetDown: false, off: [], away: [], slowMs: 0, rung: 1 };
  const sim = () => ({ ...SIM_DEFAULT, ...ls.read('kzlink:sim', {}) });

  class UpstreamUnavailable extends Error {}

  /* ---------------- LocalStorePort ---------------- */
  class MockLocalStore {
    constructor(name) { this.key = 'kzlink:local:' + name; this.data = ls.read(this.key, {}); this.subs = new Set(); }
    reload() { this.data = ls.read(this.key, {}); }
    get(c, id) { return (this.data[c] || {})[id] || null; }
    all(c) { return Object.values(this.data[c] || {}); }
    query(c, where) { return this.all(c).filter((e) => !e.deleted && match(e.doc, where)); }
    since(ts) { return Object.values(this.data).flatMap((m) => Object.values(m)).filter((e) => e.updatedAt > ts); }
    put(env) { this.putMany([env]); }
    putMany(envs) {
      if (this.dead) return;
      this.reload(); // never write back a stale cache over another writer
      envs.forEach((e) => { (this.data[e.collection] = this.data[e.collection] || {})[e.id] = e; });
      ls.write(this.key, this.data);
      this.lastWriteAt = Date.now();
      this.subs.forEach((f) => f(envs));
    }
    onChange(fn) { this.subs.add(fn); return () => this.subs.delete(fn); }
    observe(c, where) {
      return {
        subscribe: (fn) => {
          const run = () => fn(this.query(c, where));
          const h = (envs) => { if (!envs.length || envs.some((e) => e.collection === c)) run(); };
          this.subs.add(h); run();
          return () => this.subs.delete(h);
        },
      };
    }
  }

  /* ---------------- authority (§2.4) ----------------
     Applies groups in seq order, all-or-nothing per group. Used by the site
     coordinator (runRules: true) and the cloud (runRules: false — the
     coordinator already decided). Returns results plus decisions for S9. */
  const rules = [];
  KZ.registerAuthorityRules = (r) => rules.push(r);

  /* Q3: the coordinator issues numbers. A client offline issues "~<dev>-<seq>";
     the authority replaces it with an official number and keeps both. */
  rules.push({
    transform(o, ctx) {
      if (o.op === 'create' && o.patch && typeof o.patch.number === 'string' && o.patch.number.startsWith('~') && o.patch.numberSeries) {
        o.patch = { ...o.patch, tempNumber: o.patch.number, number: ctx.nextNumber(o.patch.numberSeries) };
      }
    },
  });

  function nextCounter(store, staged, g, series) {
    const k = 'link_counter/' + series;
    const cur = staged[k] || store.get('link_counter', series);
    const n = ((cur && cur.doc.n) || 0) + 1;
    staged[k] = envOf('link_counter', series, { n }, (cur ? cur.version : 0) + 1, g, false);
    return n;
  }
  function envOf(collection, id, doc, version, g, deleted) {
    return { id, collection, tenantId: g.tenantId, locId: g.locId, doc, version, updatedAt: g.at || Date.now(), updatedBy: g.userId, deviceId: g.deviceId, deleted: !!deleted, dirty: 0 };
  }

  function applyGroups(store, groups, opts) {
    const seen = new Set(ls.read(opts.seenKey, []));
    const rejected = new Set();
    const touched = {};
    const results = [];
    const decisions = [];
    for (const g of groups) {
      const keys = g.ops.map((o) => o.idemKey);
      const docsOf = () => g.ops.map((o) => store.get(o.collection, o.docId)).filter(Boolean);
      if (keys.length && keys.every((k) => seen.has(k))) { results.push({ groupId: g.groupId, status: 'accepted', duplicate: true, docs: docsOf(), writes: [] }); continue; }
      const staged = {};
      const ctx = { store, staged, group: g, nextNumber: (s) => nextCounter(store, staged, g, s) };
      let fail = null;
      for (const o0 of g.ops) {
        const o = { ...o0 };
        const k = o.collection + '/' + o.docId;
        if (rejected.has(k)) { fail = { status: 'rejected', cause: 'depends' }; break; }
        const raw = staged[k] || store.get(o.collection, o.docId);
        const cur = raw && !raw.deleted ? raw : null;
        const prev = raw ? raw.version : 0;
        if (o.targetVersion != null && raw && raw.version === o.targetVersion) continue; // already have this decided write
        if (opts.runRules) {
          for (const r of rules) { const c = r.check && r.check(o, cur, ctx); if (c) { fail = { status: 'conflict', ...c }; break; } }
          if (fail) break;
        }
        if (o.op === 'create') {
          if (cur && meta(o.collection).critical) { fail = { status: 'conflict', cause: 'exists' }; break; }
        } else {
          if (!cur) { fail = { status: 'rejected', cause: 'missing' }; break; }
          const t = touched[k];
          const base = staged[k] ? cur.version : t && t.device === g.deviceId && o.baseVersion === t.before ? cur.version : o.baseVersion;
          if (base !== cur.version) {
            if (o.op === 'update' && Object.keys(o.patch || {}).every((f) => same(cur.doc[f], o.patch[f]))) continue; // already true
            if (meta(o.collection).critical) { fail = { status: 'conflict', cause: 'stale' }; break; }
            // non-critical: per-field merge, later change wins (falls through)
          }
        }
        if (opts.runRules) rules.forEach((r) => r.transform && r.transform(o, ctx));
        const doc = o.op === 'create' ? { ...o.patch } : o.op === 'update' ? { ...(cur ? cur.doc : {}), ...o.patch } : cur ? cur.doc : {};
        staged[k] = envOf(o.collection, o.docId, doc, o.targetVersion != null ? o.targetVersion : prev + 1, g, o.op === 'delete');
      }
      if (fail) {
        g.ops.forEach((o) => { if (o.op === 'create') rejected.add(o.collection + '/' + o.docId); });
        results.push({ groupId: g.groupId, status: fail.status, cause: fail.cause, detail: fail.detail || null, docs: docsOf(), writes: [] });
        decisions.push({ group: g, ...fail });
        continue;
      }
      const envs = Object.values(staged);
      const writes = envs.map((e) => ({ env: e, prev: (store.get(e.collection, e.id) || { version: 0 }).version }));
      writes.forEach((w) => { const k = w.env.collection + '/' + w.env.id; if (!touched[k]) touched[k] = { device: g.deviceId, before: w.prev }; });
      const flags = opts.runRules ? rules.flatMap((r) => (r.flags && r.flags(g, ctx)) || []) : [];
      if (envs.length) store.putMany(envs);
      keys.forEach((k) => seen.add(k));
      flags.forEach((f) => decisions.push({ group: g, status: 'flag', ...f }));
      results.push({ groupId: g.groupId, status: 'accepted', docs: envs.length ? envs : docsOf(), writes });
    }
    ls.write(opts.seenKey, [...seen].slice(-5000));
    return { results, decisions };
  }

  /* ---------------- remote (cloud) ---------------- */
  class MockRemoteStore {
    constructor() { this.store = new MockLocalStore('cloud'); }
    async applyGroups(groups, deviceId) {
      const s = sim();
      if (s.internetDown || (deviceId && s.off.includes(deviceId))) throw new UpstreamUnavailable('No internet');
      await new Promise((r) => setTimeout(r, 120));
      this.store.reload();
      return applyGroups(this.store, groups, { seenKey: 'kzlink:cloud:seen', runRules: false }).results;
    }
  }

  /* ---------------- SyncEnginePort ---------------- */
  const RETAIN_MS = 7 * 24 * 3600 * 1000;
  class MockSyncEngine {
    constructor(deviceId, store, getUpstream, applyDocs) {
      this.key = 'kzlink:oplog:' + deviceId;
      this.log = ls.read(this.key, { seq: 0, groups: [], compacted: 0, lastSyncAt: 0 });
      this.store = store; this.getUpstream = getUpstream; this.applyDocs = applyDocs;
      this.paused = false; this.sending = false; this.lastError = null;
      this.status$ = signal(this._status());
      this.notices = signal([]);
    }
    _status() { return { waiting: this.waiting(), sending: this.sending, paused: this.paused, lastSyncAt: this.log.lastSyncAt, lastError: this.lastError, compacted: this.log.compacted }; }
    _save() { ls.write(this.key, this.log); this.status$.set(this._status()); }
    groups() { return this.log.groups; }
    pending() { return this.log.groups.filter((g) => g.status === 'pending'); }
    waiting() { return this.log.groups.filter((g) => g.status === 'pending' || g.status === 'sent').length; }
    get lastSyncAt() { return this.log.lastSyncAt; }
    record(group) {
      const g = { groupId: uid('g_'), label: '', at: Date.now(), ...group, seq: ++this.log.seq, status: 'pending', attempts: 0, error: null,
        ops: group.ops.map((o) => ({ opId: uid('op_'), idemKey: uid('ik_'), ...o })) };
      this.log.groups.push(g); this._save(); this.kick();
      return g;
    }
    pause() { this.paused = true; this._save(); }
    resume() { this.paused = false; this._save(); this.kick(); }
    kick() { clearTimeout(this._t); this._t = setTimeout(() => this.sync(), 60); }

    /* Before sending, never across sent groups: create+updates → one create,
       create+delete → dropped, update+update → merged. Audit collections untouched. */
    compact() {
      const byDoc = {};
      let removed = 0;
      const drop = (g, o) => { g.ops = g.ops.filter((x) => x !== o); removed++; };
      for (const g of this.pending()) {
        for (const o of [...g.ops]) {
          if (meta(o.collection).audit) continue;
          const k = o.collection + '/' + o.docId;
          const f = byDoc[k];
          if (!f) { byDoc[k] = { g, o }; continue; }
          if (f.o.op === 'delete' || o.op === 'create') { byDoc[k] = { g, o }; continue; }
          if (o.op === 'update') { f.o.patch = { ...f.o.patch, ...o.patch }; if (o.targetVersion != null) f.o.targetVersion = o.targetVersion; drop(g, o); }
          else if (f.o.op === 'create') { drop(f.g, f.o); drop(g, o); delete byDoc[k]; }
          else { f.o.op = 'delete'; f.o.patch = null; if (o.targetVersion != null) f.o.targetVersion = o.targetVersion; drop(g, o); }
        }
      }
      if (removed) {
        this.log.groups = this.log.groups.filter((g) => g.status !== 'pending' || g.ops.length);
        this.log.compacted += removed; this._save();
      }
    }

    async sync() {
      if (this.paused || this.sending) return;
      const up = this.getUpstream();
      if (!up) return;
      this.compact();
      const batch = this.pending();
      if (!batch.length) return;
      this.sending = true;
      batch.forEach((g) => { g.status = 'sent'; g.attempts++; });
      this._save();
      try {
        const results = await up.applyGroups(batch.map(({ status, attempts, error, ...g }) => g));
        this._onResults(batch, results);
        this.log.lastSyncAt = Date.now(); this.lastError = null;
      } catch (e) {
        batch.forEach((g) => { if (g.status === 'sent') { g.status = 'pending'; g.error = String(e.message || e); } });
        this.lastError = String(e.message || e);
      } finally {
        this.sending = false; this._save();
      }
    }

    _onResults(batch, results) {
      for (const r of results) {
        const g = batch.find((x) => x.groupId === r.groupId);
        if (!g) continue;
        g.status = r.status; g.cause = r.cause || null; g.doneAt = Date.now(); g.error = null;
        if (r.status !== 'accepted') this.notices.update((n) => [...n, { id: uid('n_'), at: Date.now(), label: g.label, cause: r.cause }].slice(-5));
        if (!this.applyDocs()) continue;
        const byKey = {};
        (r.docs || []).forEach((e) => { byKey[e.collection + '/' + e.id] = e; });
        for (const o of g.ops) {
          const auth = byKey[o.collection + '/' + o.docId];
          const local = this.store.get(o.collection, o.docId);
          const later = this.pending().filter((p) => p.ops.some((x) => x.collection === o.collection && x.docId === o.docId));
          if (r.status === 'accepted' && auth) {
            if (later.length && local) {
              later.forEach((p) => p.ops.forEach((x) => { if (x.collection === o.collection && x.docId === o.docId && x.baseVersion === o.baseVersion) x.baseVersion = auth.version; }));
              this.store.put({ ...local, version: auth.version, dirty: later.length });
            } else this.store.put({ ...auth, dirty: 0 });
          } else if (r.status !== 'accepted') {
            if (auth) this.store.put({ ...auth, dirty: 0 });           // correction from upstream
            else if (local) this.store.put({ ...local, deleted: true, dirty: 0 });
          }
        }
      }
    }

    /* Remove waiting groups (takeover / demotion) and return them for re-routing. */
    drain() {
      const out = this.log.groups.filter((g) => g.status === 'pending' || g.status === 'sent');
      out.forEach((g) => { g.status = 'forwarded'; });
      this._save();
      return out.map((g) => ({ ...g, ops: g.ops.map((o) => ({ ...o })) }));
    }
    prune(now = Date.now()) {
      const before = this.log.groups.length;
      this.log.groups = this.log.groups.filter((g) => !(['accepted', 'forwarded'].includes(g.status) && now - (g.doneAt || g.at) > RETAIN_MS)).slice(-400);
      if (this.log.groups.length !== before) this._save();
    }
  }

  Object.assign(KZ, { uid, ls, signal, sim, same, COLLECTIONS, meta, match, MockLocalStore, MockRemoteStore, MockSyncEngine, applyGroups, UpstreamUnavailable });
})();
