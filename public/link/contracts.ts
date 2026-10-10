/**
 * Koomzo Link — port contracts (plan v2 §2).
 *
 * Reference for the Angular port. The JS mocks in link/*.js implement exactly
 * these shapes; production swaps the provider, never the feature code.
 *
 * Copy rule: "site coordinator" in code, "Main device" on screen.
 */

// ---------- shared ----------
export type DeviceRole = 'standalone' | 'coordinator' | 'client';
export type DeviceKind = 'till' | 'server' | 'kitchen' | 'kiosk' | 'display' | 'printer';
export type ModuleId = 'restaurant' | 'queue' | 'signage';
export interface Unsubscribe { (): void }
export interface Observable<T> { subscribe(fn: (v: T) => void): Unsubscribe }

// ---------- documents (§2.2) ----------
export interface DocEnvelope<T = Record<string, unknown>> {
  id: string;
  collection: string;          // matches the Firestore collection name 1:1
  tenantId: string;
  locId: string;
  doc: T;
  version: number;             // authoritative version last seen by this device
  updatedAt: number;
  updatedBy: string;
  deviceId: string;
  deleted: boolean;
  dirty?: number;              // local only: pending ops touching this doc
}

export interface CollectionMeta {
  critical: boolean;           // stale write → conflict list, never last-write-wins
  audit: boolean;              // never compacted (payments, voids, stock moves, approvals)
}

// ---------- op log (§2.3) ----------
export type OpKind = 'create' | 'update' | 'delete';
export type GroupStatus = 'pending' | 'sent' | 'accepted' | 'rejected' | 'conflict' | 'forwarded';

export interface Op {
  opId: string;
  collection: string;
  docId: string;
  op: OpKind;
  patch: Record<string, unknown> | null;
  baseVersion: number;
  /** Set only by an authority forwarding an already-decided write upstream. */
  targetVersion?: number;
  idemKey: string;             // accepted once by the upstream
}

/** One user action = one group, applied all-or-nothing upstream. */
export interface OpGroup {
  groupId: string;
  seq: number;
  label: string;               // plain language, shown in S7 / S9
  tenantId: string;
  locId: string;
  deviceId: string;
  userId: string;
  at: number;
  ops: Op[];
  status: GroupStatus;
  attempts: number;
  error: string | null;
  cause?: string | null;
}

export interface GroupResult {
  groupId: string;
  status: 'accepted' | 'rejected' | 'conflict';
  cause?: string;              // exists | stale | missing | depends | <module rule>
  detail?: unknown;
  duplicate?: boolean;         // idemKey already accepted
  docs: DocEnvelope[];         // authoritative state after the decision
}

// ---------- ports (§2.1) ----------
/** What features call. Unchanged whether offline is on or off. */
export interface EntityStorePort {
  get<T>(collection: string, id: string): DocEnvelope<T> | null;
  query<T>(collection: string, where?: Partial<T>): DocEnvelope<T>[];
  observe<T>(collection: string, where?: Partial<T>): Observable<DocEnvelope<T>[]>;
  /** One business action. Ops are applied locally first, then synced as one group. */
  commit(label: string, ops: Array<Pick<Op, 'collection' | 'docId' | 'op' | 'patch'>>): Promise<{ groupId: string; status: string }>;
  /** Q3: the coordinator issues numbers; offline a client issues "~<device>-<seq>". */
  nextNumber(series: string): Promise<number | string>;
  /** Whether an upstream that can reach the internet is available (MoMo, card). */
  internetReachable(): boolean;
}

export interface LocalStorePort {
  get(collection: string, id: string): DocEnvelope | null;
  query(collection: string, where?: object): DocEnvelope[];
  observe(collection: string, where?: object): Observable<DocEnvelope[]>;
  put(env: DocEnvelope): void;
  putMany(envs: DocEnvelope[]): void;
  since(ts: number): DocEnvelope[];
}

/** Upstream = PeerLink (client) or the remote store (coordinator / standalone). */
export interface UpstreamPort {
  applyGroups(groups: OpGroup[]): Promise<GroupResult[]>;
}

export interface SyncStatus {
  waiting: number;             // groups not yet accepted
  sending: boolean;
  paused: boolean;
  lastSyncAt: number;
  lastError: string | null;
  compacted: number;
}

export interface SyncEnginePort {
  record(group: Omit<OpGroup, 'seq' | 'status' | 'attempts' | 'error'>): OpGroup;
  sync(): Promise<void>;
  pause(): void;
  resume(): void;
  status$: Observable<SyncStatus>;
  groups(): OpGroup[];
  prune(now: number): void;    // accepted ops kept 7 days
}

export interface PeerMessage {
  type: string;
  from: string;
  to: string | '*';
  siteId: string | null;
  at: number;
  [k: string]: unknown;
}

export interface PeerLinkPort {
  /** Coordinators seen nearby (announce within the last few seconds). */
  discover(): Observable<Record<string, PeerMessage>>;
  pair(req: { coordinatorId: string; siteId: string; code: string; info: DeviceInfo }): void;
  send(msg: Omit<PeerMessage, 'from' | 'at'>): boolean;
  request<T>(to: string, method: string, payload: unknown): Promise<T>;
  on(type: string, fn: (msg: PeerMessage) => void): Unsubscribe;
}

export interface DeviceInfo { name: string; kind: DeviceKind; module: ModuleId }

// ---------- connection ladder (§2.5) ----------
export type Rung = 1 | 2 | 3 | 4;   // v1 = 1–2; 4 = pairing only; 3 out of v1

// ---------- decisions (S9) ----------
export interface Decision {
  id: string;
  at: number;
  groupId: string;
  label: string;
  deviceId: string;
  deviceName: string;
  status: 'conflict' | 'rejected' | 'flag';
  cause: string;
  detail: unknown;
  ops: Op[];
  open: boolean;
  resolution?: string;
}

// ---------- resolver (§2.1) ----------
export interface OfflineResolverInput {
  env?: { offline?: boolean };
  remoteConfig?: { offline?: boolean };
  tenantSettings?: { localNetwork?: boolean };
  deviceRole?: DeviceRole | null;
}
export declare function offlineProviderResolver(i: OfflineResolverInput): { enabled: boolean };
