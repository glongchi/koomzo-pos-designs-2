# Koomzo Restaurant — Production Gap Spec

**Target:** `~/repos/koomzoapps` (Ionic 8 · Capacitor 8 · Angular 19, full backend)
**Source of behaviour:** the React prototype `Koomzo POS - Restaurant & Bar.html`.
Its files are `restaurant/store.jsx`, `service.jsx`, `floor-setup.jsx`,
`kitchen.jsx`, `floor.jsx`, `register.jsx` and `kiosk.jsx`.
**Parent plans:**
- `Koomzo Restaurant - Service Scenario Plan.md` (§7 is the implementation review)
- `Koomzo Link - Local Network Plan.md`
- `Koomzo - Recipe and Depletion Model.html`
- `Koomzo - Batch 1 Close-out Rulings.md` (R1–R8)

**See also:** `Koomzo - Templates, Photos & Customer Display - Production Gap Spec.md` — T1–T4 (template library, dish photos) and C1–C11 (customer display) for Restaurant and Retail Flex.

This spec covers only what the prototype **could not** build because it has no real
backend, device APIs or hardware. Anything the prototype already does is the
reference for UI and rules. Port it as it is; don't redesign it.

---

## 0 · Ground rules

1. **Local-first.** Every write goes to the device's **SQLite** first, then a
   forwarder sends it on: standalone → cloud, hub → cloud, client → hub. No
   screen waits on the network to save.
2. **One outbox.** All of these go through one `sync_outbox` table: orders,
   voids, stock movements, prints, messages and approvals. Do not build a
   separate queue per module.
3. **Idempotent.** Every forwarded row carries an `idem_key`. The server accepts
   each key once. This also closes the folio double-post defect.
4. **The hub/cloud is the authority** for ticket numbers, stock and shared
   tables. A client applies its change locally, and the authority then confirms
   or corrects it.
5. **Never persist tender results** on a client (ruling R4). A payment is final
   only when the authority confirms it.
6. **Every rule is a venue policy.** Policies live in `PolicyService`
   (`kz-policy.js` today) and are edited in Setup → Service rules.

---

## G1 · Persistence: from localStorage to SQLite

**Prototype:** localStorage keys `kz:rk:v2:{orders,tickets,tables,floors,rules,voids,kiosk}`.

### Collections (document model)

Koomzo is NoSQL throughout. These are **document collections** in the local
store (see `Koomzo Link - Local Network Plan.md` §2.2), with names matching
Firestore. Columns are document fields, not a relational schema. The op log
uses `groupId` so one user action syncs all-or-nothing (§2.3).

| Collection | Key fields | Notes |
|---|---|---|
| `rk_order` | `id`, `loc_id`, `table_id` or `tab_name` or `counter_key`, `guests`, `server_id`, `opened_at`, `status` (open · billed · paid · void) | One open order per table, tab or counter |
| `rk_order_line` | `id` (= prototype `uid`), `order_id`, `item_id`, `name`, `qty`, `unit_price`, `price_override`, `disc_pct`, `course`, `station`, `notes`, `tags`, `fired_at`, `ticket_id`, `moved_from_table` | Qty on a fired line only goes down through a void |
| `rk_ticket` | `id`, `no` (assigned by the authority), `local_no` (temporary, offline), `order_id`, `table_id`, `floor_id`, `status` (cook · ready · done), `fired_at`, `served_at`, `closed_at`, `cancelled_reason`, `cancelled_ack_at`, `moved_from`, `takeaway_from` | **Never deleted** |
| `rk_ticket_item` | `id`, `ticket_id`, `line_id`, `qty`, `void_qty`, `void_reason`, `void_ack_at`, `amend_at`, `amend_ack_at`, `done`, `moved_to` | |
| `rk_table_state` | `table_id`, `status` (seated · bill · merged), `guests`, `since`, `into_table_id` | No row means the table is free |
| `rk_floor`, `rk_table` | See G5 | |
| `rk_void` | `id`, `at`, `loc_id`, `order_id`, `line_id`, `qty`, `value`, `reason`, `by_user`, `approver`, `approval_mode` (pin · remote · none) | Feeds G2, G3 and G7 |
| `kz_policy` | `loc_id`, `key`, `value` | One row per rule key in `RK_RULES_DEFAULT` |
| `sync_outbox` | `id`, `entity`, `op`, `payload`, `idem_key`, `created_at`, `status` (pending · sent · accepted · rejected), `attempts`, `error` | Shared by every module |

### Rules
- Migrate on first launch: if `kz:rk:v2:*` keys exist, import them once, then clear them.
- The "Restored your open orders" banner shows when open `rk_order` rows exist at startup.
- Ticket numbers: offline, a client issues `local_no` as `<deviceCode>-<seq>`.
  The authority assigns `no` on sync, and the KDS and receipt reprints show
  both until they match.

**Acceptance:** kill the app mid-order on a client, relaunch, and the order and
kitchen state are intact with no tender restored. Pull the network for 10
minutes, take 5 orders and 2 voids, reconnect: all of them reach the cloud
exactly once.

---

## G2 · Restaurant stock posting (fire time)

**Prototype:** the void log records the three stock steps from ruling R1, but
nothing is posted to Inventory.

### Adapter: `StockFireAdapter` (new, next to `StockSalesAdapter`)

| Event | Posts | Kind / reason |
|---|---|---|
| Kitchen item fired (`station ≠ bar`) | −qty | `fire` |
| Bar item paid (`station = bar`) | −qty, through the existing `StockSalesAdapter` | `sale` |
| Void **after** fire | +qty, then −qty | `fire` / `void-reversal`, then `adjust` / `waste` |
| Void **before** fire | nothing | — |
| Clear table → Cancel | Same as a void after fire, for every live item | `waste`, reason `table-cleared` |
| Clear table → Take-away or Already served | nothing extra | — |
| Item moved between tables | nothing | — |

- **Location:** post to the restaurant's own site, `RK_LOC = 'rk'` (ruling R2).
- **Resolution:** the menu line's `stock` field from the Recipe & Depletion
  Model. `direct` gives one item; `recipe` gives several components (batch 1b).
  No `stock` field means no posting (rung 0).
- **Zero stock warns but never blocks service.**
- **Source tag:** every movement carries `source` (sale · fire · make · waste ·
  count) and `ref` (ticket item id), so variance can be computed later.

**Acceptance:** stock 30 → fire 1 → 29 → void after fire → ledger shows three
rows, net 29, one waste row attributed to the reason and the server.

---

## G3 · End-of-day (Z) report: voids section

**Prototype:** a daily void summary in Setup → Service rules only. The
restaurant module has no Z-report.

- Add a **Voids** block to the shift close / Z-report, built from `rk_void` for
  the session: count, value, by reason, by server, and by approver (PIN, remote
  or none).
- **Holds block Z-close** (existing rule). Add: **unacknowledged cancelled
  tickets** and **tickets still cooking** also block Z-close until each is
  resolved as take-away, served or cancelled.
- **Owner digest** (scheduled, through `MessagingService` over WhatsApp): sent
  at Z-close, or at a set time if the shift is never closed. It lists the
  day's voids, the top server by void value and the waste value.

**Acceptance:** Z-close with one cancelled ticket not yet acknowledged is
blocked with a "Resolve in kitchen" link. After it is resolved, the Z-report
lists the void and the digest is queued in `sync_outbox`.

---

## G4 · Remote approval (real)

**Prototype:** the owner's approve/decline is simulated, with a 60-second
timeout.

- `ApprovalService.request({ kind:'void'|'clear-cancel'|'discount', value, reason, table, by })`
  → creates an `approval_request` row and returns `pending`.
- Delivered to the owner by **push** (Capacitor Push Notifications) with
  **WhatsApp** as a fallback (`MessagingService`). The owner approves or
  declines in one tap from the notification or a deep link.
- Times out to **declined** after `policy.remoteApprovalSec` (default 60).
- **Offline:** if the hub has no internet, remote approval is unavailable and
  the screen offers the PIN only. Say so plainly; don't spin.
- Store the approver id, the channel used and the response time on `rk_void`.

**Acceptance:** with no manager present, a void request reaches the owner's
phone, the owner approves, and the till unlocks within 2 seconds of the tap.
With the hub offline, the remote option is hidden.

---

## G5 · Floor plan as backend configuration

**Prototype:** saved to localStorage. Deleting an area removes it outright.

| Table | Columns |
|---|---|
| `rk_floor` | `id`, `loc_id`, `label`, `icon`, `sort`, `archived_at` |
| `rk_table` | `id`, `floor_id`, `label`, `seats`, `shape` (square · round · rect · stool), `x`, `y` (%), `archived_at` |

- **Archive, don't delete.** "Delete area" and "Delete table" set
  `archived_at`. Archived rows are hidden from the floor, pickers and presets.
  They stay joinable for past tickets and reports.
- Applying a preset archives the current plan and creates the new one in one
  transaction. It is blocked while any table is in service (prototype guard).
- Floor plan changes sync hub → clients in real time, so a table added on
  the manager's tablet appears on every server's phone.
- Labels must be unique per location among non-archived tables. Show the
  conflict inline.
- Presets and their void-rule defaults are copied from `RK_FLOOR_PRESETS` in
  `floor-setup.jsx`.

**Acceptance:** archive "Terrasse" with history behind it: past tickets still
show "Terrasse", and it no longer appears on the floor.

---

## G6 · Policies left open in D6

Each is a policy toggle, **off unless the preset turns it on**.

| Policy | Default | Production need |
|---|---|---|
| **Print to kitchen** (no KDS) | On for Maquis and Snack | `PrintService` over Bluetooth or LAN ESC/POS (58/80 mm). One printer per station. Fire prints a ticket; void or amend prints a **VOID** or **CHANGED** slip. Failed prints wait in `sync_outbox` with a "Printer offline" banner. |
| **Table assigned to a server** | On | `rk_order.server_id`. Only that server or a supervisor can void, move, bill or clear the table. Other servers see it as read-only. Handover goes through supervisor PIN. |
| **Pre-bill print** (*addition*) | On | Print the bill before payment. Any change after printing marks it "Bill changed — reprint" and blocks the charge until it is reprinted. |
| **Server banking** | Off | Each server holds their own cash drawer balance. The shift close reconciles per server. Its own batch. |
| **Ardoise** (customer tab) | Off | Named tab across days with a credit limit per customer. Needs a customer record and an ageing report. Its own batch. |
| **Pay before serving** | Off | Snack/bar format: an order can't be fired until it is paid. |
| **Service charge** | Off | Percentage added to the bill, shown as its own line, with a tax setting. |

**Acceptance (print to kitchen):** with the KDS turned off, fire 2 items, then
void 1 after fire. The grill printer prints the ticket and then a VOID slip.
With the printer powered off, both wait in the queue and print in order when
it comes back.

---

## G7 · Local network (hub and clients)

Fully specified in `Koomzo Link - Local Network Plan.md`. The production pieces
are:
- **Discovery:** mDNS/Bonjour (a Capacitor plugin).
- **Transport:** the connection ladder (Local Network Plan §2.5). v1 uses the
  existing Wi-Fi or 4G box, or the coordinator's hotspot, with BLE for
  pairing only. The coordinator runs a local WebSocket/HTTP server (a native
  plugin).
- **Pairing:** QR code or a 6-digit rotating code, with hub approval.
- **Hub tasks:** forwarding outbox rows to the hub; the hub relaying them to
  the cloud and pushing changes to clients.
- **Takeover:** manual, done on the backup hub.
- The restaurant moves onto `LocalStore` writes first (orders, KDS, floor),
  then the other modules.

Restaurant-specific requirements:
- KDS bumps, voids and moves on one device appear on every other device in
  **under 1 second** on the local Wi-Fi.
- MoMo and card payments are blocked when the hub has no internet; cash continues.

---

## G8 · Kiosk device features

**Prototype:** the lock, the hold-and-PIN exit, the idle reset and the
per-layout sizing are all done.

- **Keep the screen awake** in kiosk mode (`@capacitor-community/keep-awake`).
- **Pin the kiosk on Android** (screen pinning / lock task mode) so the
  hardware Home and Back buttons can't leave it. Use iOS Guided Access where
  available.
- **Kiosk device role:** a device joined to the hub as *Kiosk / Customer
  display* opens straight into locked kiosk mode after a reboot.
- **Kiosk payments:** MoMo prompts and the countdown use the shared
  `TenderService`. With no internet, the kiosk offers *Pay at counter* only.

---

## Build order

| # | Gap | Depends on | Size |
|---|---|---|---|
| 1 | G1 SQLite and `sync_outbox` | — | L |
| 2 | G5 floor plan in the backend, with archiving | 1 | S |
| 3 | G2 `StockFireAdapter` | 1, ruling R2 locations | M |
| 4 | G3 Z-report voids and the new Z-close blocks | 1, 2 | S |
| 5 | G6 print to kitchen, server assignment, pre-bill | 1, `PrintService` | M |
| 6 | G4 remote approval | 1, push, `MessagingService` | M |
| 7 | G7 local network | 1 | L |
| 8 | G8 kiosk device features | 7 for the role | S |
| — | G6 server banking, ardoise | Own batch | L |
| — | T1–T4 templates and photos, C1–C11 customer display | 1, 7 | See the companion spec |

## Open decisions

1. G1: once the hub assigns the final ticket number, should receipt reprints
   still show the temporary offline one?
2. G3: should stuck kitchen tickets block Z-close (recommended), or only warn?
3. G4: is 60 seconds the right default for remote approval to time out as
   declined?
4. G6: should server assignment be on by default for every preset, or only for
   Restaurant and Hotel?
