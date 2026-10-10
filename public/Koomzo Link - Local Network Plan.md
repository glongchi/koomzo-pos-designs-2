# Koomzo Link — local network (hub & clients): plan v2

Status: **Phase 1 implemented as mocks (Oct 2026)** — ports, op log and
coordinator ↔ client link; modules get mock services only. See §11. This is a platform feature used
by every module (Restaurant, Retail Flex, Grocery, Salon, Gym, Hotel, Queue,
Signage, Inventory).

v2 adds two sets of notes:
- **Pitch review:** position Koomzo as local-first, call the hub a "site
  coordinator", list the connection types in fallback order, and add the queue
  and display examples.
- **Storage architecture:** a document (NoSQL) model, a split of the storage
  ports, and an operation log with grouping and compaction.

---

## 1 · What it does

> **Offline by design. Devices stay connected locally.**

- One device per site is the **site coordinator** (on screen: *Main device*).
  All other devices are **clients**.
- Every device **saves locally first**, then sends the change on:
  - standalone → cloud
  - coordinator → cloud, and serves its clients
  - client → coordinator
- **Only the coordinator** talks to the internet.
- Nothing in service waits on the network: a sale, a kitchen ticket or a queue
  call is final on the device that made it, then reconciled.
- The same mechanism serves every module. Examples:
  - **Restaurant:** till → servers' phones → kitchen screen → kiosk
  - **Queue:** clerks 1–3 → queue state → *Now serving* display
  - **Signage:** the screen shows the last good update and never goes blank

---

## 2 · Architecture

### 2.1 Ports

Feature services keep calling the port they already use. Offline support is
an **adapter**, not a change to the features.

```
Feature services
      │
EntityStorePort ───────────── (unchanged API for features)
      │
OfflineEntityStoreAdapter
      ├── LocalStorePort    local document store: get · query · observe · write
      ├── SyncEnginePort    op log → upstream: sync · pause · resume · status$
      │       └── upstream = PeerLinkPort (client) or Remote EntityStorePort (coordinator / standalone)
      └── PeerLinkPort      coordinator / client transport: discover · pair · send · push$ · status$

Remote EntityStorePort ── FirebaseEntityStoreAdapter │ future RestEntityStoreAdapter
```

| Port | Owns | Doesn't own |
|---|---|---|
| `EntityStorePort` | The CRUD and query API that features call | Where data lives |
| `LocalStorePort` | Documents on this device; reactive queries (`customers$`, `tickets$`) | Network |
| `SyncEnginePort` | The op log, ordering, retries, compaction, conflict reporting | Transport details |
| `PeerLinkPort` | Discovery, pairing, the local link, and the coordinator's push to clients | Business rules |

**Resolver.** `offlineProviderResolver()` sits next to the existing
`backendProviderResolver()`. It is resolved at startup from: environment →
remote config → tenant settings → device role.

```ts
if (!offline.enabled) return backend === 'rest' ? restStore : firebaseStore;
return offlineStore;   // which wraps local + sync + peer
```

### 2.2 Local store — document model

All Koomzo workloads are **NoSQL**. The local store keeps documents, not a
relational schema:

```json
{ "id": "tk_8f2", "collection": "rk_ticket", "tenantId": "t1", "locId": "rk",
  "doc": { "...": "..." }, "version": 7, "updatedAt": 1791163874, "updatedBy": "u_anita",
  "deviceId": "d_blaise", "deleted": false }
```

- Indexes are on `collection`, `tenantId`, `locId`, `updatedAt`, plus a few
  declared fields per collection (for example `rk_ticket.status`,
  `rk_order.tableId`).
- Collection names match Firestore, so the remote adapter maps one-to-one.

**Engine choice (decision D9):**

| Option | For | Against |
|---|---|---|
| **A · RxDB on SQLite storage** *(recommended if the licence is acceptable)* | Document database with reactive queries, which fits Angular signals and observables. Built-in conflict hooks and replication framework. Same API on iOS, Android, Electron and the web. | The SQLite storage is in RxDB's paid tier — **check current licensing and price**. Adds a dependency. |
| B · Own document store on `@capacitor-community/sqlite` | Free and mature. Full control. One JSON-document table, plus the op log. | We build reactive queries, indexes and migrations ourselves. |
| C · PouchDB | Mature | Built to sync with CouchDB, not Firestore or REST, so we'd maintain a permanent mapping layer. Not recommended. |

Either A or B sits behind `LocalStorePort`, so the choice can be reversed
without touching features. **Firestore's own offline cache is not used.** It
would tie offline behaviour to Firebase, and it can't serve clients over the
local network.

### 2.3 Operation log (not a plain FIFO queue)

```json
{ "opId": "uuid", "groupId": "uuid", "seq": 41, "tenantId": "t1", "locId": "rk",
  "collection": "rk_order", "docId": "o_12", "op": "create|update|delete",
  "patch": { "...": "..." }, "baseVersion": 6, "idemKey": "uuid",
  "deviceId": "d_blaise", "userId": "u_anita", "at": 1791163874,
  "status": "pending|sent|accepted|rejected|conflict", "attempts": 0, "error": null }
```

- **Groups give business-level atomicity.** One user action is one `groupId`,
  for example *create customer + order + payment*. The upstream applies a group
  all-or-nothing. If one op is rejected, the whole group is rejected and shown
  in the conflict list. This avoids the "customer synced, invoice failed,
  payment synced" state.
- **Ordering.** Groups are sent in order (`seq`), and a group whose documents
  depend on an unaccepted group waits.
- **Compaction runs before sending, never across groups that have been sent:**
  - create + updates → one create with the final state
  - create + delete → dropped entirely
  - **Never compact** payments, voids, stock movements or approvals. They are
    audit events, and every one is kept.
- **Idempotency.** The server accepts each `idemKey` once. This also closes
  the folio double-post defect.
- **Retention.** Accepted ops are kept for 7 days on the device for audit and
  support, then pruned.

### 2.4 Authority and conflicts

- **The site coordinator is the authority** for shared site state while the
  site is offline: tables, tickets, queue position, stock reservations and
  ticket numbers. The cloud is the authority above it once connected. The
  chain is **cloud → coordinator → clients**.
- **Versioned documents.** Every op carries a `baseVersion`. On mismatch:
  - **Critical collections** (orders, tickets, payments, stock, queue): reject
    and send to the **conflict list**. No last-write-wins.
  - **Non-critical** (notes, display names, preferences): field-level merge,
    with the later change winning per field.
  - **Money is never overwritten.** Two payments for one bill are both kept
    and flagged for a manager.
- **Clients apply their own change straight away**, so the screen stays fast.
  The coordinator's answer either confirms it or sends a correction, which
  shows as a short notice and never as a silent flip.

### 2.5 Connection ladder — "Koomzo uses the best local connection available"

| Rung | Use | Carries | Platform notes |
|---|---|---|---|
| 1 · Existing Wi-Fi / 4G box (LAN) | Default | Everything | All platforms |
| 2 · Coordinator's own hotspot | No router on site | Everything | Android hotspot; iOS Personal Hotspot is set by hand |
| 3 · Direct device-to-device | No Wi-Fi at all | Everything, shorter range | Android Wi-Fi Direct / Nearby; iOS Multipeer. **No single cross-platform API — a plugin per platform** |
| 4 · Bluetooth LE | Discovery, pairing, a "wake up" signal and small status messages | **Not order traffic** (too slow) | All platforms; background limits on iOS |

- **v1 scope (recommended): rungs 1–2, with BLE for pairing only.** Rung 3
  comes later, once a venue needs it.
- The main flow never names the technology. Details show it once:
  *Connection: Wi-Fi (4G box)*.

### 2.6 Device kinds

| Kind | Writes | Shows | Offline behaviour |
|---|---|---|---|
| Till / Server / Kitchen screen | Yes | Live | Keeps working; queues ops |
| Kiosk | Yes (orders) | Live | Keeps taking orders; *Pay at counter* only without internet |
| **Display** (now serving, menu board, signage) | No (read-only) | The last good update | **Never goes blank**; a small *Last update 14:02* mark |
| Printer bridge | No | — | Print jobs wait in the op log |

---

## 3 · Questions → recommendations

| # | Question | Recommendation |
|---|---|---|
| Q1 | Can a client work without the coordinator? | **Yes, by design.** Only operations that need an answer from upstream are blocked: MoMo/card, stock reservation and the final ticket number. |
| Q2 | Can another device take over if the coordinator dies? | **Yes, manually**, on the named backup or by a manager. Never automatically, because two coordinators is the worst failure. The backup already holds a full copy, so taking over moves no data. |
| Q3 | Who issues ticket numbers? | **The coordinator.** Offline, a client issues a temporary `<device>-<seq>`, and both are kept for traceability. |
| Q4 | How does a device join? | Auto-discovery, with QR or a rotating 6-digit code as fallback. **Coordinator approval on by default.** |
| Q5 | What role does a client have? | Device kind (§2.6) plus the module it opens in. The kind is separate from user permissions; the person still signs in with a PIN. |
| Q6 | One coordinator per site, or one per module? | **One per site, serving every module.** Simpler for staff, one device to keep powered. The pitch's "Queue coordinator" is the same coordinator. |
| Q7 | No router on site? | Rung 2: the coordinator's hotspot or a 4G box. Works with no internet credit. |
| Q8 | Where is it set up? | **Settings → Devices → Local network**, plus one onboarding step. Standalone stays the default. |
| Q9 | Which local engine? | **D9 above:** RxDB on SQLite if the licence fits, otherwise our own document store on Capacitor SQLite. |
| Q10 | Conflicts? | The coordinator decides. Critical collections reject to the conflict list; others merge per field; money is never overwritten. |
| Q11 | Connection ladder scope for v1? | Rungs 1–2, plus BLE for pairing only. |

## 4 · Market assumptions

- **Power cuts are routine.** The coordinator should be the device on a UPS or
  power bank, and the UI says so.
- **Hardware is cheap Android phones and tablets**, and Wi-Fi is weak at the
  edge of a terrace. Show signal per device and tolerate a slow link.
- **Data bundles cost money.** Only the coordinator uses data, and sync is
  batched and compacted.
- **Staff are not technical.** No IP addresses or protocol names in the main
  flow.

## 5 · Screens

| # | Screen | Device | Purpose |
|---|---|---|---|
| S1 | Choose role | any | Main device · Join · Standalone |
| S2 | Main device ready | coordinator | QR, 6-digit code, connection, approval toggle |
| S3 | Join — find | client | Found nearby · scan QR · code · **connect without Wi-Fi** (rung 4 pairing) |
| S4 | Join — device kind | client | Name, kind, module |
| S5 | Waiting → connected | client | Coordinator, signal, waiting count, coordinator's internet status |
| S6 | Coordinator console | coordinator | Approvals, devices, connection, sync (ops and groups waiting), backup, hand over |
| S7 | Coordinator lost | client | Banner, waiting groups, what still works, try again, take over |
| S8 | Status chip | every module header | Online · Via main device · No internet · Main device lost · Syncing |
| **S9** | **Needs a decision** (conflicts) | coordinator, manager | Rejected groups with plain-language cause and 1–2 resolutions |
| **S10** | **Display client** | now-serving / menu screen | Last good update, *Last update hh:mm*, reconnecting mark |

Copy rule: on screen it is **Main device**; in code and specs it is **site
coordinator**. No BLE, LAN or IP in the main flow.

## 6 · Prototype plan (mock)

Following the standing rule: a real interface, a mock implementation and JSON
persistence, so production swaps a provider.

- `MockLocalStore` keeps documents in `backend/data/local/<device>.json`.
- `MockSyncEngine` writes the op log to `oplog.json`, with groups, compaction
  and a rejection toggle.
- `MockPeerLink` runs several "devices" in one browser, one per tab or frame,
  over BroadcastChannel. It has toggles for *coordinator lost*, *internet down*,
  *slow link* and *connection rung*.
- A **dev panel** to force a conflict (two tabs pay the same table) and watch
  S9.

## 7 · Risks

| Risk | Mitigation |
|---|---|
| Two coordinators (split brain) | Manual takeover only. The old coordinator returns as a client and forwards its unsent groups. |
| Partial sync of related records | `groupId`, applied all-or-nothing |
| Queued ops conflict with coordinator state | Version check; critical collections go to S9; nothing is dropped silently |
| Op log grows on a long outage | Compaction; batched upload; storage warning at 80 % |
| Stranger joins | Approval, rotating codes, remove device |
| Coordinator battery dies | Power warning; named backup |
| Duplicate on retry | `idemKey` |
| RxDB licence cost (option A) | Decide D9 first; option B is the fallback behind the same port |
| Direct-connection plugins per platform (rung 3) | Out of v1 |

## 8 · Sequence

| Step | Work | Size |
|---|---|---|
| 1 | Ports and resolver: `LocalStorePort`, `SyncEnginePort`, `PeerLinkPort`, `offlineProviderResolver()` | S |
| 2 | Local document store (D9) and op log with groups, compaction, idempotency | L |
| 3 | Coordinator ↔ client on rungs 1–2; BLE pairing | L |
| 4 | S8 chip, S1–S5 join flow | M |
| 5 | S6 console, S7 coordinator lost, takeover | M |
| 6 | S9 conflicts, S10 display client | M |
| 7 | Restaurant onto the adapter (orders, KDS, floor), then Queue and Signage, then the rest | M per module |

The Restaurant Production Gap Spec G1 and G7 depend on steps 1–3.

## 9 · Decisions needed

1. **D9:** RxDB on SQLite (check the licence), or our own document store on
   Capacitor SQLite?
2. **Q6:** one coordinator per site for all modules?
3. **Q11:** v1 on Wi-Fi/4G box plus hotspot, with BLE for pairing only?
4. **Q2:** manual takeover only?
5. **Q10:** reject-to-list for critical collections, per-field merge for the
   rest, money never overwritten?
6. **On-screen name:** "Main device", or something else?

## 10 · Positioning tie-in (from the pitch review)

- Overview footer: *Mobile first · Offline by design · Devices stay connected
  locally · AI assistance, coming next*.
- Walkthrough slide 8: *Offline doesn't mean disconnected*, using the
  restaurant diagram and the queue diagram, with the footnote *Koomzo uses the
  best local connection available*.
- No technology names on customer slides. S1, S8 and S10 are the screens to
  show as proof.

## 11 · Implementation — phase 1 (mock)

Scope: the platform layer only. Restaurant, Queue and Signage are **not**
migrated; each has a thin mock service that calls `EntityStorePort` and
nothing else.

| File | What it is |
|---|---|
| `link/contracts.ts` | Port interfaces for the Angular port: `EntityStorePort`, `LocalStorePort`, `SyncEnginePort`, `PeerLinkPort`, `UpstreamPort`, `OpGroup`, `DocEnvelope`, `Decision`, resolver input |
| `link/link-core.js` | `MockLocalStore` (document store, reactive `observe`), the **authority** (one function used by both coordinator and cloud), `MockSyncEngine` (groups, seq order, compaction, idempotency, `baseVersion`/`targetVersion`, 7-day retention), `MockRemoteStore` |
| `link/link-peer.js` | `MockPeerLink` over BroadcastChannel (discover, pair, send, push, request/reply, connection rungs), `OfflineEntityStoreAdapter`, `BackendEntityStore` (offline off), `offlineProviderResolver()` |
| `link/link-modules.js` | Mock Restaurant / Queue / Signage services, the module's authority rules (bill already paid, paid twice), S9 resolutions |
| `Koomzo Link - Device.html` | One device: S1–S10 working against the ports |
| `Koomzo Link - Dev Harness.html` | Several devices side by side, plus network switches and scenarios |

Decisions taken as the recommended defaults (reversible): **D9** deferred
behind `LocalStorePort` (mock only, no engine chosen yet) · **Q6** one
coordinator per site · **Q11** rungs 1–2, rung 4 carries pairing only, rung 3
is refused · **Q2** manual takeover only, by the named backup or a manager PIN;
a returning coordinator that sees a higher epoch becomes a client and forwards
its waiting groups · **Q10** critical collections reject to S9, others merge per
field, a second payment is kept and flagged · on-screen name **Main device**.

Two additions the plan didn't spell out, both needed for correctness:
- `targetVersion` on an op: set only when an authority forwards an
  already-decided write upstream, so compaction can't knock the coordinator
  and the cloud out of version lockstep.
- An update whose fields are already true upstream is a no-op, not a
  conflict. This is what lets a second payment be kept: the bill's
  `status: paid` is already true, so only the payment itself is new.

Next (phase 2): pick D9, replace `MockPeerLink` with a real transport on
rungs 1–2, then move Restaurant onto the adapter (§8 step 7).
