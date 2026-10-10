/* Koomzo Link — PeerLinkPort mock and the OfflineEntityStoreAdapter (plan v2 §2.1, §2.5).
   MockPeerLink runs several devices in one browser over BroadcastChannel (one
   device per tab or iframe). The adapter wires LocalStore + SyncEngine + PeerLink
   behind the EntityStorePort features already call. */
(function () {
  const KZ = window.KzLink;
  const { uid, ls, signal, sim } = KZ;
  const PAIRING = ['announce', 'join-request', 'join-decision'];
  const RUNG = { 1: 'Wi-Fi (4G box)', 2: 'Main device hotspot', 3: 'Direct connection — not in this version', 4: 'Nearby pairing only' };
  KZ.RUNG_LABEL = RUNG;

  /* One live instance per device id. The id is created per page load (in
     memory only), so frames that share storage can still tell each other
     apart. The owner refreshes its claim every tick; "Use here" leaves a
     short-lived hand-off that the next load adopts. */
  const INSTANCE = uid('inst_');
  KZ.instanceFor = () => INSTANCE;
  KZ.deviceOwner = (id) => { const o = ls.read('kzlink:owner:' + id, null); return o && Date.now() - o.at < 3000 ? o.instance : null; };
  KZ.claimDevice = (id) => ls.write('kzlink:owner:' + id, { instance: INSTANCE, at: Date.now() });
  KZ.handOffDevice = (id) => ls.write('kzlink:handoff:' + id, { at: Date.now() });
  const freshHandoff = (id) => { const h = ls.read('kzlink:handoff:' + id, null); return !!h && Date.now() - h.at < 3000; };
  /* Startup only: adopt a fresh hand-off, otherwise report whether another copy owns the device. */
  KZ.ownedElsewhere = (id) => {
    if (freshHandoff(id)) { localStorage.removeItem('kzlink:handoff:' + id); KZ.claimDevice(id); return false; }
    const o = KZ.deviceOwner(id);
    return !!o && o !== INSTANCE;
  };
  /* Running owner: yield to a pending hand-off or a newer owner; never consume the hand-off. */
  KZ.shouldYield = (id) => { if (freshHandoff(id)) return true; const o = KZ.deviceOwner(id); return !!o && o !== INSTANCE; };

  /* ---------------- PeerLinkPort ---------------- */
  class MockPeerLink {
    constructor(me) {
      this.me = me; // () => device cfg
      this.ch = new BroadcastChannel('kzlink');
      this.handlers = {}; this.waiting = {};
      this.ch.onmessage = (e) => this._recv(e.data);
    }
    _cut(a, b) {
      const s = sim();
      const cut = (id) => s.off.includes(id) || s.away.includes(id);
      return cut(a) || cut(b) || s.rung === 3;
    }
    send(msg) {
      if (this.closed) return false;
      const c = this.me();
      const m = { siteId: c.siteId, ...msg, from: c.deviceId, at: Date.now() };
      if (this._cut(c.deviceId, m.to === '*' ? null : m.to)) return false;
      if (sim().rung === 4 && !PAIRING.includes(m.type)) return false;
      this.ch.postMessage(m);
      return true;
    }
    _recv(m) {
      const me = this.me().deviceId;
      if (m.from === me || (m.to !== '*' && m.to !== me)) return;
      if (this._cut(me, m.from)) return;
      if (sim().rung === 4 && !PAIRING.includes(m.type)) return;
      setTimeout(() => {
        if (m.type === 'rpc-reply') { const w = this.waiting[m.id]; if (w) { delete this.waiting[m.id]; m.error ? w.reject(new Error(m.error)) : w.resolve(m.result); } return; }
        (this.handlers[m.type] || []).forEach((f) => f(m));
      }, sim().slowMs);
    }
    on(type, fn) { (this.handlers[type] = this.handlers[type] || []).push(fn); return () => { this.handlers[type] = this.handlers[type].filter((f) => f !== fn); }; }
    request(to, method, payload) {
      const id = uid('rq_');
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => { delete this.waiting[id]; reject(new KZ.UpstreamUnavailable('Main device not reachable')); }, 1800 + sim().slowMs * 2);
        this.waiting[id] = { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } };
        if (!this.send({ type: 'rpc', to, method, payload, id })) { clearTimeout(t); delete this.waiting[id]; reject(new KZ.UpstreamUnavailable('Main device not reachable')); }
      });
    }
    reply(m, result, error) { this.send({ type: 'rpc-reply', to: m.from, id: m.id, result, error: error || null }); }
  }

  /* ---------------- OfflineEntityStoreAdapter ---------------- */
  const CFG_DEFAULT = { name: 'New device', kind: 'till', module: 'restaurant', role: null, siteId: null, siteName: null, coordinatorId: null, epoch: 0, backupId: null, approval: true, codeSalt: 0, userId: 'u_staff', lastPullAt: 0 };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const short = (name) => (name || 'DEV').replace(/[^A-Za-z]/g, '').slice(-3).toUpperCase() || 'DEV';

  class OfflineEntityStore {
    constructor(deviceId) {
      this.id = deviceId;
      this.alive = true;
      this.displaced = signal(false);
      KZ.claimDevice(deviceId);
      this.cfgKey = 'kzlink:device:' + deviceId;
      this.cfg = signal({ ...CFG_DEFAULT, deviceId, ...ls.read(this.cfgKey, {}) });
      this.local = new KZ.MockLocalStore(deviceId);
      this.cloud = new KZ.MockRemoteStore();
      this.peer = new MockPeerLink(() => this.cfg.get());
      this.sync = new KZ.MockSyncEngine(deviceId, this.local, () => this._upstream(), () => this.role() !== 'coordinator');
      this.decisions = signal(ls.read('kzlink:decisions:' + deviceId, []));
      this.approvals = signal([]);
      this.devices = signal({});
      this.found = signal({});
      this.link = signal({ lastContact: 0, coordinator: null, join: null });
      this.notice = signal(null);
      this.status = signal(this._computeStatus());
      this._wire();
      this.sync.status$.subscribe(() => this._refresh());
      this.decisions.subscribe(() => this._refresh());
      window.addEventListener('storage', (e) => { if (e.key === 'kzlink:sim') this.tick(); });
      this._timer = setInterval(() => this.tick(), 1000);
      this.tick();
    }
    shutdown() {
      this.alive = false;
      clearInterval(this._timer);
      this.peer.closed = true;
      this.peer.ch.close();
      this.sync.paused = true;
      this.local.dead = true;
      this.displaced.set(true);
    }

    /* ---- config ---- */
    role() { return this.cfg.get().role; }
    setCfg(p) { const n = { ...this.cfg.get(), ...p }; ls.write(this.cfgKey, n); this.cfg.set(n); this._refresh(); }
    code() { const c = this.cfg.get(); return String(hash(c.siteId + ':' + c.epoch + ':' + c.codeSalt + ':' + Math.floor(Date.now() / 600000)) % 1000000).padStart(6, '0'); }

    /* ---- EntityStorePort (what features call) ---- */
    get(c, id) { const e = this.local.get(c, id); return e && !e.deleted ? e : null; }
    query(c, where) { return this.local.query(c, where); }
    observe(c, where) { return this.local.observe(c, where); }

    async commit(label, ops) {
      const c = this.cfg.get();
      if (!this.alive) throw new Error('This device is open in another tab.');
      if (c.kind === 'display') throw new Error('Display devices are read-only.');
      if (sim().off.includes(this.id)) throw new Error('This device is off.');
      const g = { groupId: uid('g_'), label, userId: c.userId, deviceId: this.id, tenantId: 't1', locId: c.siteId || 'standalone', at: Date.now(),
        ops: ops.map((o) => ({ ...o, opId: uid('op_'), idemKey: uid('ik_'), baseVersion: (this.local.get(o.collection, o.docId) || { version: 0 }).version })) };
      if (c.role === 'coordinator') return this._authoritative([g])[0];
      // client / standalone: apply locally first, then the op log carries it upstream
      for (const o of g.ops) {
        const raw = this.local.get(o.collection, o.docId);
        const cur = raw && !raw.deleted ? raw : null;
        const doc = o.op === 'create' ? { ...o.patch } : o.op === 'update' ? { ...(cur ? cur.doc : {}), ...o.patch } : cur ? cur.doc : {};
        this.local.put({ id: o.docId, collection: o.collection, tenantId: g.tenantId, locId: g.locId, doc, version: raw ? raw.version : 0, updatedAt: g.at, updatedBy: g.userId, deviceId: this.id, deleted: o.op === 'delete', dirty: ((raw && raw.dirty) || 0) + 1 });
      }
      this.sync.record(g);
      return { groupId: g.groupId, status: 'pending' };
    }

    async nextNumber(series) {
      const c = this.cfg.get();
      if (c.role === 'coordinator') return this._counter(series);
      if (c.role === 'client' && this.dataConnected()) {
        try { return await this.peer.request(c.coordinatorId, 'nextNumber', { series }); } catch (e) { /* fall through to a temporary number */ }
      }
      const k = 'kzlink:tmpseq:' + this.id;
      const n = ls.read(k, 0) + 1; ls.write(k, n);
      return '~' + short(c.name) + '-' + n;
    }

    internetReachable() {
      const c = this.cfg.get(), s = sim();
      if (s.off.includes(this.id)) return false;
      if (c.role === 'client') return this.dataConnected() && !!(this.link.get().coordinator || {}).internet;
      return !s.internetDown;
    }

    /* ---- link state ---- */
    connected() { return Date.now() - this.link.get().lastContact < 3500; }
    dataConnected() { const r = sim().rung; return this.connected() && (r === 1 || r === 2); }

    _upstream() {
      const c = this.cfg.get(), s = sim();
      if (s.off.includes(this.id)) return null;
      if (c.role === 'coordinator' || c.role === 'standalone') return s.internetDown ? null : { applyGroups: (gs) => this.cloud.applyGroups(gs, this.id) };
      if (c.role === 'client' && this.dataConnected()) return { applyGroups: (gs) => this.peer.request(c.coordinatorId, 'applyGroups', gs) };
      return null;
    }

    /* ---- the coordinator decides ---- */
    _authoritative(groups) {
      const { results, decisions } = KZ.applyGroups(this.local, groups, { seenKey: 'kzlink:seen:' + this.id, runRules: true });
      const pushed = [];
      results.forEach((r) => {
        if (r.status !== 'accepted' || !r.writes.length) return;
        const g = groups.find((x) => x.groupId === r.groupId);
        this.sync.record({ groupId: g.groupId, label: g.label, userId: g.userId, deviceId: g.deviceId, tenantId: g.tenantId, locId: g.locId, at: g.at,
          ops: r.writes.map((w) => ({ collection: w.env.collection, docId: w.env.id, op: w.env.deleted ? 'delete' : w.prev ? 'update' : 'create', patch: w.env.deleted ? null : w.env.doc, baseVersion: w.prev, targetVersion: w.env.version, idemKey: g.groupId + ':' + w.env.collection + '/' + w.env.id })) });
        pushed.push(...r.docs);
      });
      if (pushed.length) this.peer.send({ type: 'push', to: '*', docs: pushed });
      decisions.forEach((d) => this._addDecision(d));
      return results;
    }
    _counter(series) {
      const cur = this.local.get('link_counter', series);
      const n = ((cur && cur.doc.n) || 0) + 1;
      const c = this.cfg.get();
      this._authoritative([{ groupId: uid('g_'), label: 'Number ' + series, userId: c.userId, deviceId: this.id, tenantId: 't1', locId: c.siteId, at: Date.now(),
        ops: [{ opId: uid('op_'), idemKey: uid('ik_'), collection: 'link_counter', docId: series, op: cur ? 'update' : 'create', patch: { n }, baseVersion: cur ? cur.version : 0 }] }]);
      return n;
    }
    _addDecision(d) {
      const g = d.group;
      const dev = this.devices.get()[g.deviceId];
      const entry = { id: uid('dc_'), at: Date.now(), groupId: g.groupId, label: g.label, deviceId: g.deviceId,
        deviceName: dev ? dev.name : g.deviceId === this.id ? this.cfg.get().name : g.deviceId, status: d.status, cause: d.cause, detail: d.detail || null, ops: g.ops, open: true };
      this._saveDecisions([entry, ...this.decisions.get()].slice(0, 60));
    }
    _saveDecisions(list) { ls.write('kzlink:decisions:' + this.id, list); this.decisions.set(list); }
    async resolveDecision(id, actionId, pin) {
      const d = this.decisions.get().find((x) => x.id === id);
      if (!d || !d.open) return;
      const res = KZ.resolverFor(d.cause);
      const action = res.actions(d).find((a) => a.id === actionId);
      if (action.money && pin !== '1234') throw new Error('Manager PIN required.');
      await res.run(this, d, actionId);
      this._saveDecisions(this.decisions.get().map((x) => (x.id === id ? { ...x, open: false, resolution: action.label, resolvedAt: Date.now() } : x)));
    }

    /* ---- setup, pairing, takeover (S1–S7) ---- */
    becomeCoordinator(siteName) {
      const c = this.cfg.get();
      this.setCfg({ role: 'coordinator', siteId: c.siteId || uid('site_'), siteName: siteName || c.siteName || c.name, epoch: Math.max(1, c.epoch), coordinatorId: this.id });
    }
    becomeStandalone() { this.setCfg({ role: 'standalone', siteId: null, coordinatorId: null }); }
    requestJoin(coord, code, info) {
      this.setCfg({ ...info });
      this.link.set({ ...this.link.get(), join: { state: 'waiting', coordinatorId: coord.from, siteId: coord.siteId, siteName: coord.siteName } });
      this.peer.send({ type: 'join-request', to: coord.from, siteId: coord.siteId, code, info });
    }
    leave() { this.setCfg({ role: null, siteId: null, coordinatorId: null, siteName: null }); this.link.set({ lastContact: 0, coordinator: null, join: null }); }
    approve(deviceId, ok) {
      const a = this.approvals.get().find((x) => x.deviceId === deviceId);
      if (!a) return;
      this.approvals.set(this.approvals.get().filter((x) => x !== a));
      this._decideJoin(a, ok);
    }
    _decideJoin(req, ok) {
      const c = this.cfg.get();
      this.peer.send({ type: 'join-decision', to: req.deviceId, accepted: ok, siteName: c.siteName, epoch: c.epoch });
      if (ok) this.devices.update((d) => ({ ...d, [req.deviceId]: { ...req.info, lastSeen: Date.now(), signalMs: 0 } }));
    }
    setBackup(deviceId) { this.setCfg({ backupId: deviceId }); }
    newCode() { this.setCfg({ codeSalt: this.cfg.get().codeSalt + 1 }); }
    canTakeOver() { const co = this.link.get().coordinator; return !!co && co.backupId === this.id; }
    /* Q2: manual only. The backup holds a full copy, so taking over moves no data. */
    takeOver(pin) {
      if (this.role() !== 'client' || this.connected()) throw new Error('The main device is still reachable.');
      if (!this.canTakeOver() && pin !== '1234') throw new Error('Only the backup device or a manager can do this.');
      this._promote(this.cfg.get().epoch + 1);
    }
    handOver(deviceId) {
      const c = this.cfg.get();
      this.peer.send({ type: 'handover', to: deviceId, epoch: c.epoch + 1, backupId: c.backupId === deviceId ? this.id : c.backupId });
      this._demote(deviceId, c.epoch + 1, 'Main device handed over. This device is now a client.');
    }
    _promote(epoch, backupId) {
      const waiting = this.sync.drain();
      this.setCfg({ role: 'coordinator', coordinatorId: this.id, epoch, backupId: backupId !== undefined ? backupId : null });
      this.link.set({ lastContact: 0, coordinator: null, join: null });
      if (waiting.length) this._authoritative(waiting);
      this.notice.set({ tone: 'pri', text: 'This device is now the main device.' + (waiting.length ? ' ' + waiting.length + ' waiting changes applied.' : '') });
    }
    /* An old coordinator returning sees a higher epoch: it becomes a client and
       forwards its unsent groups, never runs as a second main device. */
    _demote(coordinatorId, epoch, text) {
      const waiting = this.sync.drain();
      this.setCfg({ role: 'client', coordinatorId, epoch });
      waiting.forEach((g) => this.sync.record({ ...g }));
      this.notice.set({ tone: 'warn', text: text || 'Another device is now the main device. This device joined it' + (waiting.length ? ' and is forwarding ' + waiting.length + ' waiting changes.' : '.') });
    }
    async _pull() {
      const c = this.cfg.get();
      try {
        const docs = await this.peer.request(c.coordinatorId, 'snapshot', { since: c.lastPullAt || 0 });
        this._acceptDocs(docs);
        this.setCfg({ lastPullAt: Date.now() - 2000 });
      } catch (e) { /* next contact retries */ }
      this.sync.kick();
    }
    _acceptDocs(docs) {
      const keep = (docs || []).filter((e) => { const l = this.local.get(e.collection, e.id); return !l || !l.dirty; }).map((e) => ({ ...e, dirty: 0 }));
      if (keep.length) this.local.putMany(keep);
      this.lastUpdateAt = Date.now();
    }

    _wire() {
      const P = this.peer;
      P.on('announce', (m) => {
        this.found.update((f) => ({ ...f, [m.from]: { ...m, seenAt: Date.now() } }));
        const c = this.cfg.get();
        if (c.role === 'client' && m.siteId === c.siteId) {
          if (m.from !== c.coordinatorId && m.epoch > c.epoch) this.setCfg({ coordinatorId: m.from, epoch: m.epoch });
          if (m.from === this.cfg.get().coordinatorId) {
            const was = this.dataConnected();
            this.link.set({ ...this.link.get(), lastContact: Date.now(), coordinator: m });
            if (!was && this.dataConnected()) this._pull();
          }
        }
        if (c.role === 'coordinator' && m.siteId === c.siteId && m.from !== this.id && m.epoch > c.epoch) this._demote(m.from, m.epoch);
      });
      P.on('heartbeat', (m) => {
        if (this.role() !== 'coordinator' || m.siteId !== this.cfg.get().siteId) return;
        this.devices.update((d) => ({ ...d, [m.from]: { ...m.info, lastSeen: Date.now(), signalMs: m.signalMs, pending: m.pending } }));
      });
      P.on('join-request', (m) => {
        const c = this.cfg.get();
        if (c.role !== 'coordinator' || m.siteId !== c.siteId) return;
        const req = { deviceId: m.from, info: m.info, at: Date.now() };
        if (m.code !== this.code()) { P.send({ type: 'join-decision', to: m.from, accepted: false, reason: 'code' }); return; }
        if (c.approval) this.approvals.update((a) => [...a.filter((x) => x.deviceId !== m.from), req]);
        else this._decideJoin(req, true);
      });
      P.on('join-decision', (m) => {
        const j = this.link.get().join;
        if (!j || j.coordinatorId !== m.from) return;
        if (!m.accepted) { this.link.set({ ...this.link.get(), join: { ...j, state: m.reason === 'code' ? 'badcode' : 'refused' } }); return; }
        this.setCfg({ role: 'client', siteId: j.siteId, siteName: m.siteName, coordinatorId: m.from, epoch: m.epoch, lastPullAt: 0 });
        this.link.set({ lastContact: Date.now(), coordinator: this.found.get()[m.from] || null, join: { ...j, state: 'connected' } });
        this._pull();
      });
      P.on('push', (m) => {
        const c = this.cfg.get();
        if (c.role === 'client' && m.from === c.coordinatorId) this._acceptDocs(m.docs);
      });
      P.on('handover', (m) => { if (this.role() === 'client') this._promote(m.epoch, m.backupId); });
      P.on('rpc', (m) => {
        const c = this.cfg.get();
        if (c.role !== 'coordinator' || m.siteId !== c.siteId) return;
        try {
          if (m.method === 'applyGroups') P.reply(m, this._authoritative(m.payload).map(({ writes, ...r }) => r));
          else if (m.method === 'snapshot') P.reply(m, this.local.since(m.payload.since));
          else if (m.method === 'nextNumber') P.reply(m, this._counter(m.payload.series));
        } catch (e) { P.reply(m, null, e.message); }
      });
    }

    tick() {
      if (!this.alive) return;
      if (KZ.shouldYield(this.id)) { this.shutdown(); return; }
      KZ.claimDevice(this.id);
      const c = this.cfg.get(), s = sim();
      if (!s.off.includes(this.id)) {
        if (c.role === 'coordinator') {
          this.peer.send({ type: 'announce', to: '*', siteId: c.siteId, name: c.name, siteName: c.siteName, epoch: c.epoch, approval: c.approval,
            internet: !s.internetDown, waiting: this.sync.waiting(), backupId: c.backupId, devices: Object.keys(this.devices.get()).length });
        } else if (c.role === 'client') {
          this.peer.send({ type: 'heartbeat', to: c.coordinatorId, info: { name: c.name, kind: c.kind, module: c.module }, signalMs: s.slowMs + 8 + Math.round(Math.random() * 20), pending: this.sync.waiting() });
        }
      }
      const now = Date.now();
      this.found.update((f) => Object.fromEntries(Object.entries(f).filter(([, m]) => now - m.seenAt < 4000)));
      this.sync.kick();
      this.sync.prune(now);
      this._refresh();
    }

    _refresh() { this.status.set(this._computeStatus()); }
    _computeStatus() {
      const c = this.cfg.get(), s = sim();
      const waiting = this.sync ? this.sync.waiting() : 0;
      const sending = this.sync ? this.sync.sending : false;
      let state;
      if (s.off.includes(this.id)) state = 'off';
      else if (!c.role) state = 'setup';
      else if (c.role === 'client') {
        if (!this.connected()) state = 'lost';
        else if (!this.dataConnected()) state = 'pairingOnly';
        else if (sending) state = 'syncing';
        else if (!(this.link.get().coordinator || {}).internet) state = 'noInternet';
        else state = 'via';
      } else if (s.internetDown) state = 'noInternet';
      else if (sending || waiting) state = 'syncing';
      else state = 'online';
      return { state, waiting, sending, rung: s.rung, decisions: this.decisions ? this.decisions.get().filter((d) => d.open).length : 0,
        coordinatorName: (this.link.get().coordinator || {}).name || null, lastContact: this.link.get().lastContact, lastSyncAt: this.sync ? this.sync.lastSyncAt : 0 };
    }
  }

  /* Offline off: features talk to the backend directly (today's behaviour). */
  class BackendEntityStore {
    constructor() { this.cloud = new KZ.MockRemoteStore(); this.local = this.cloud.store; }
    get(c, id) { this.local.reload(); const e = this.local.get(c, id); return e && !e.deleted ? e : null; }
    query(c, w) { this.local.reload(); return this.local.query(c, w); }
    observe(c, w) { return this.local.observe(c, w); }
    async commit(label, ops) {
      const g = { groupId: uid('g_'), seq: 0, label, userId: 'u_staff', deviceId: 'backend', tenantId: 't1', locId: 'site', at: Date.now(),
        ops: ops.map((o) => ({ ...o, opId: uid('op_'), idemKey: uid('ik_'), baseVersion: ((this.get(o.collection, o.docId)) || { version: 0 }).version })) };
      return (await this.cloud.applyGroups([g]))[0];
    }
    async nextNumber() { return Math.floor(Date.now() / 1000) % 10000; }
    internetReachable() { return !sim().internetDown; }
  }

  /* Resolved at startup: environment → remote config → tenant settings → device role. */
  KZ.offlineProviderResolver = ({ env = {}, remoteConfig = {}, tenantSettings = {}, deviceRole = null } = {}) => {
    const v = [env.offline, remoteConfig.offline, tenantSettings.localNetwork].find((x) => x !== undefined);
    return { enabled: v !== undefined ? !!v : true };
  };
  KZ.createEntityStore = (deviceId, input) => (KZ.offlineProviderResolver(input).enabled ? new OfflineEntityStore(deviceId) : new BackendEntityStore());
  Object.assign(KZ, { MockPeerLink, OfflineEntityStore, BackendEntityStore });
})();
