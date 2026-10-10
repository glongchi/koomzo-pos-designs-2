# Koomzo Restaurant — service-scenario audit & change plan

Status: **IMPLEMENTED in the React prototype** (`Koomzo POS - Restaurant & Bar.html`)
— see §7 for the review against this plan. Originally audited against the React
source (`restaurant/store.jsx`, `register.jsx`, `register-parts.jsx`,
`floor.jsx`, `kitchen.jsx`, `rdata.js`). Re-verify each finding in the Angular
port before building — the port may already differ.

---

## 1 · Your questions, rephrased

**Q1 — Amending a sent order.** After an order has been sent to the kitchen, can
a server (a) cancel one or more fired items, and (b) amend them — change
quantity, add a note, or add new items — with the kitchen display reflecting the
change?

**Q2 — Moving a party.** Can a seated party, with its open order and kitchen
tickets, be moved to a different table (including a table in another area)?

**Q3 — Closing the loop with the kitchen.** When a table's food has been marked
*Served* on the KDS, and the table then requests the bill, pays, and is cleared
from the Floor screen, does the KDS stop showing that table? Today it remains in
the *Served* lane.

**Q4 — Configurable floor plan.** Can an operator configure their own areas
(Main floor, Patio, Bar, Terrace…) and the tables within each — number, label,
capacity, shape and position — and does every new restaurant start from a
sensible default preset during onboarding?

---

## 2 · Findings

| # | Scenario | Exists? | What the code actually does |
|---|---|---|---|
| Q1a | Cancel a fired item | **No** | `OrderLine` hides the −/+ and remove controls once `o.fired` is true (`register-parts.jsx:71`). There is no void action. The kitchen ticket is never touched after `sendTicket()`. |
| Q1b | Amend a fired item | **Partly** | Qty/note can still be changed via the numpad `EditDock` on a fired line, but the change only edits the register's local copy — **the KDS ticket is not updated**, so register and kitchen silently disagree. Adding *new* items works (they fire as a new ticket). |
| — | Order belongs to a table | **No — root cause** | The register holds **one** `order` array (`register.jsx`). `openTableOrder()` only sets `activeTable`; it does not load that table's order. Switching tables keeps the previous table's lines on screen. Every scenario below depends on fixing this. |
| Q2 | Move a party | **No** | No move/transfer action anywhere in `floor.jsx` or `store.jsx`. |
| Q3 | KDS after table cleared | **Bug (both directions)** | `clearTable()` (`store.jsx:97`) keeps tickets where `status === 'done'` and **deletes** the rest. So: served tickets linger in the *Served* lane forever (your observation), and tickets still cooking/ready **vanish** (the defect already logged). |
| Q4 | Configurable floors | **No** | `RK_FLOORS` is a hard-coded constant in `rdata.js` (3 areas, 23 tables, x/y %). No editor, no onboarding step. |

---

## 3 · Proposed changes

### C1 — One open order per table *(prerequisite for C2–C4)*

Move order state from the register component into the suite store, keyed by
table (or tab/counter ticket):

```
orders: { [tableId]: { lines[], guests, server, openedAt, ticketIds[] } }
```

- `openTableOrder(id)` loads that table's order; leaving saves it.
- Persists per the register rule already ruled (R4): **persist the order, never
  tender results.** Survives reload/power cut.

### C2 — Void and amend after fire (Q1)

| Action | Before fire | After fire |
|---|---|---|
| Reduce qty / remove | As today, no trace | **Void** — requires a reason chip (*Customer changed mind · Wrong item · Kitchen error · Too slow*) |
| Change note | As today | Sends an **amendment** to the KDS card |
| Add items | As today | New ticket, as today |

- **Approval:** reuse `kz-policy.js` supervisor approval. Default rule for this
  market: server can void **before** the station starts the item; after that,
  a supervisor PIN. Ceiling configurable per venue.
- **KDS:** the voided line stays on the card **struck through with a VOID
  badge** until the station acknowledges with one tap. Never silently removed —
  the cook must know to stop.
- **Stock:** follows ruling R1 — fire −1, reversal +1, waste −1.
- **Audit:** every post-fire void logged with who, reason, approver, time —
  feeds the Z-report "Voids" line.

### C3 — Move party / table transfer (Q2)

- Floor table sheet gains **Move** → pick a free table (any area) → confirm.
- Moves the order, guests, `since` time, and **re-labels the open KDS tickets**
  with the new table and a small *"moved from T3"* note so runners don't take
  food to the old table.
- Target free → **Move**. Target occupied → offer **Merge** (one order, one
  bill, both tables shown as one group on the floor). **Split table** reverses
  it: pick lines → new table/bill.
- **Move single items** between tables (wrong table keyed) — same picker, line
  level.
- Allowed while a bill is requested; blocked while a payment is in progress.
- Merge is in v1, not deferred: groups pushing tables together (family, office
  outings, funerals/weddings receptions, football nights) is routine in a
  maquis, and without it staff open two tables and settle by hand.

### C4 — Ticket lifecycle tied to the table (Q3)

Replace delete-on-clear with explicit states:

```
cook → ready → served → closed      (+ cancelled)
```

- **Paying / clearing a table** sets `closed` on its `served` tickets → they
  leave the *Served* lane immediately.
- Tickets still `cook`/`ready` when the table is cleared are **not deleted**:
  the clear action warns *"2 items still in the kitchen — Cancel them or keep
  cooking for take-away?"*. Cancelled → struck card on KDS + waste stock.
- *Served* lane additionally ages out after a configurable window (default
  **10 min**) as a safety net for counter/tab orders with no table.
- Closed tickets remain queryable for the day's history and Z-report.

### C5 — Configurable floor plan + onboarding preset (Q4)

**Data:** `RK_FLOORS` becomes venue configuration (JSON file via the mock
backend, per the standing instruction), not a constant.

**Floor editor** (Settings → Floor plan, manager role):
- Areas: add, rename, reorder, archive. Archived areas keep history.
- Tables: add from a palette (square · round · rect · stool), drag to position,
  set label, seats, shape. Snap-to-grid. **Duplicate** and **auto-number** for
  speed.
- Guard: a table with an open order can't be deleted or moved off-plan.
- Works on tablet (drag) and phone (list view with label/seats — no canvas
  editing on phone).

**Onboarding preset** (asked once in Restaurant setup):

| Preset | Areas | Tables |
|---|---|---|
| **Maquis / small restaurant** *(default)* | Salle · Terrasse | 8 + 4 |
| Restaurant | Salle · Terrasse · Bar | 12 + 6 + 6 stools |
| Bar / lounge | Bar · Lounge | 8 stools + 6 |
| Counter only | — | No tables (tabs / counter tickets) |

- One screen: pick a preset, adjust the **table count per area** with steppers,
  done. Layout auto-arranged in a grid; positions refined later in the editor.
- French-first area names for the Cameroon market (Salle, Terrasse, Bar, VIP),
  editable.
- Skippable — "Counter only" keeps the register usable on day one.

### C7 — Local network: hub & clients *(platform, all modules)*

Production behaviour: one device runs as the **hub** on the local Wi-Fi; every
other device is a **client** that sends all requests to the hub. Only the hub
talks to the internet. UI: `Koomzo - Local Network (Hub and Clients).html`.

- **Roles:** Standalone (default) · Hub · Client. Client device job: Till ·
  Server · Kitchen screen · Printer · Customer display, plus which module it
  opens in.
- **Joining:** the hub is discovered automatically on the Wi-Fi; QR code or
  6-digit code as fallback; codes rotate every 10 min; approval required by
  default.
- **Hub loss:** clients keep working and queue requests locally (OutboxService,
  ruling R5). A named **backup hub** (or a manager) can take over. MoMo is
  blocked when there is no internet; cash continues.
- **Header status chip** on every module: Online · Via hub · No internet ·
  Hub lost · Syncing.
- **Prototype:** a `LocalHubService` interface with a mock that simulates
  discovery, approval, latency and hub loss, with JSON persistence. Production
  `koomzoapps` swaps in the real transport.
- **Ordering:** a client's request isn't final until the hub accepts it. Ticket
  numbers are issued by the hub. Work queued offline is renumbered on sync but
  keeps a local reference, so tickets that were already printed can still be
  traced.

### C8 — Kiosk mode on every screen type

**Finding (React source):** the kiosk is already reachable from the nav on
desktop, tablet and phone, and `rkit-kiosk.css` has container rules at 980 px
and 680 px. Two gaps: (1) **kiosk mode is not a mode** — the staff nav rail /
bottom tab bar stays visible, so a customer can walk into the register; (2) the
phone layout reuses the 440 px cart drawer, which is wider than the screen.
**Check the Angular port** for any device gate that hides the kiosk on phone or
portrait tablet.

**Change:**

- **Enter kiosk mode** from the nav or Setup on any device: hides all staff
  navigation, locks to the kiosk, keeps the screen awake (Capacitor
  keep-awake). **Exit** only via the D70 press-and-hold + PIN.
- **Idle:** back to the attract screen after 90 s (D70); the cart is cleared.
- **One kiosk, four compositions** — same flow, layout adapts to the frame
  width (container queries, not device type):

| Composition | Categories | Grid | Cart |
|---|---|---|---|
| Desktop / landscape tablet | Left sidebar | 3–4 cols | Right drawer 440 px |
| Portrait tablet (768–980) | Top chip row | 3 cols | Bottom bar + drawer 380 px |
| Phone (≤ 680) | Top chip row, horizontal scroll | 2 cols | Bottom bar → **full-screen sheet** |
| Small phone (≤ 360) | Top chip row | 1–2 cols | Full-screen sheet |

- **Touch sizes** stay at kiosk scale on every layout: tiles ≥ 120 px tall,
  buttons ≥ 56 px, text ≥ 16 px. A phone kiosk is still used by a stranger.
- **Preview toggle** in Setup (*Test kiosk on: Desktop · Tablet · Phone*) so
  any device can show any composition for testing.
- **Real uses for a phone/small-tablet kiosk in this market:** a waiter hands
  the phone to the table to order ("menu on a phone"); a cheap 8" tablet on the
  counter of a snack; the same flow later serves **QR ordering** on the
  customer's own phone.
- **Device role link:** in the Local network plan, *Customer display / Kiosk*
  is a client role — a device joined in that role opens straight into kiosk
  mode.

---

## 4 · Sequence

| Step | Change | Depends on | Size |
|---|---|---|---|
| 1 | C1 per-table orders + persistence | — | M |
| 2 | C4 ticket lifecycle (`served → closed`, no delete) | 1 | S |
| 3 | C2 void/amend after fire + KDS strike + approval | 1, 2 | M |
| 4 | C3 move / merge / split party + move items | 1, 2 | M |
| 5 | C5a floor plan as config + onboarding presets | — | S |
| 6 | C5b floor editor | 5 | M |
| 7 | C7 local network screens + `LocalHubService` mock | — (platform) | M |
| 8 | C8 kiosk mode on all screen types | — | S |

Steps 1–4 fix live service failures; 5–6 are setup. Step 5 can run in parallel
with 1–4.

---

## 5 · Acceptance scenarios (end-to-end, one customer)

1. Seat T3 (4 guests) → order 2 Ndolé + 1 Poulet DG → Send → KDS shows ticket.
2. Guest changes mind: void 1 Ndolé (reason *Customer changed mind*) → KDS card
   shows it struck → station acknowledges → stock: −1, +1, −1.
3. Add 2 Jus Bissap → bar item, no KDS ticket.
4. Party moves to Terrasse P4 → Floor shows T3 free, P4 occupied; KDS ticket
   reads *P4 (moved from T3)*.
5. KDS: Mark Ready → Served.
6. Request bill → split 2 ways → pay MoMo + cash → Clear table.
7. KDS *Served* lane no longer shows P4. Floor shows P4 free.
8. Reload the page at any step 1–5 → order and table state restored, no tender
   restored.
9. Clear a table with a dish still cooking → warning appears → Cancel → KDS
   shows struck card, waste posted.
10. New venue onboarding → choose *Maquis* → 2 areas, 12 tables appear on the
    Floor screen; open the editor, drag T5, rename *Terrasse* → *VIP*.

---

## 6 · Decisions — recommended defaults, all configurable

Principle: **every decision below is a venue policy, not hard-coded behaviour.**
Ship a sensible default per preset, expose it in *Settings → Restaurant →
Service rules*, and keep the register flow identical whichever option is
chosen. Policies live in `kz-policy.js` alongside discount ceilings so one
screen governs all controls.

### Market context these defaults are built on

- **Owner-operated, owner often absent.** The owner of a maquis or restaurant
  in Douala/Yaoundé/Abidjan is frequently not on site. Voids and cancellations
  are the #1 leakage channel (sold, voided, cash pocketed). Controls must work
  *without* the owner present — remote approval and a daily void report matter
  more than an on-site PIN.
- **Small staff, shared device.** One phone or tablet often serves as till,
  order pad and kitchen screen. Many kitchens have **no KDS** — they work from
  a printed ticket or a shouted order.
- **Servers often carry cash** (server banking) and settle at end of shift.
- **Customers ask to take leftovers away** (*emporter*), and groups join or
  split mid-meal.
- **Regulars run tabs** (*ardoise*), settled weekly or at month-end.
- **Power and connectivity drop.** Nothing in service may depend on the network.

### D1 — Void after fire

| Policy option | When to use |
|---|---|
| **Free until station starts, PIN after** *(default: Restaurant preset)* | Venues with a KDS where "started" is known |
| **PIN for every post-fire void** *(default: Maquis, Bar presets)* | No KDS, so "started" can't be known; owner wants tight control |
| **Free, reason only** | Owner-run venues where the owner is the cashier |

Plus, regardless of option:
- **Reason is always required** after fire.
- **Remote approval:** if no supervisor is on site, the request goes to the
  owner's phone (WhatsApp/push via the mock MessagingService), approve/deny in
  one tap. Times out to *denied* after a configurable window.
- **Daily void digest** to the owner: count, value, by server, by reason. This
  single report does more against leakage than any PIN.
- **Void threshold by value** optional (e.g. PIN only above 5 000 FCFA).

### D2 — Clearing a table with food still in the kitchen

**Recommend: warn and ask, never block.** Blocking stalls service when a KDS
isn't being bumped (common — cooks forget to tap). Options offered in the
warning:

- **Keep cooking → take-away** (*emporter*): ticket moves to a
  counter/take-away lane with the guest's name. Most common real outcome.
- **Cancel** → struck card on KDS, waste stock posted, logged as void (D1
  rules apply).
- **Already served** → marks it served (cook forgot to bump). Fixes the data,
  no stock change.

Policy toggle: *Require supervisor to cancel on clear* (default off).

### D3 — Served tickets on the KDS

**Recommend: close on payment (primary) + age-out safety net (configurable,
default 10 min, 0 = never).** Also add **Bump all served** on the Served lane
for kitchens that run without per-ticket discipline. Venues with no KDS hide
the lane entirely.

### D4 — Merge / split / move

**Recommend: all three in v1** (see C3). Split supports **by item** and **by
guest/seat** — the realistic split here is "I pay for what I ate", rarely an
even split. Even split stays available.

### D5 — Floor presets

**Recommend default: Maquis — Salle 8 + Terrasse 4.** Most venues in the
target segment are maquis/small restaurants with an outdoor area, and the
terrace is often the busier space. Presets are a starting point only; the table
count stepper on the same onboarding screen does the real configuration.

Add two presets beyond the four already listed:

| Preset | Why |
|---|---|
| **Hotel restaurant** — Restaurant · Bar · Room service | Links to the Hotel module's folio posting |
| **Snack / fast food** — Counter + 4 tables | Order-at-counter, name or number called; very common format |

### D6 — Additional policies recommended for real-life coverage

These came up repeatedly in comparable West African deployments; each is a
toggle, off unless the preset turns it on.

| Policy | Default | Note |
|---|---|---|
| **No KDS — print to kitchen** | On for Maquis, Snack | Bluetooth 58/80 mm thermal printer per station; void/amend prints a **VOID** slip. Uses PrintService mock. |
| **Server banking** | Off | Each server holds their own cash; the shift close reconciles per server. |
| **Table assigned to server** | On | Only the assigned server (or a supervisor) can void/move/close it. Prevents one server closing another's table. |
| **Ardoise / customer tab** | Off | Open a named tab across days; settle later. Credit limit per customer. Requires customer record. |
| **Pay before serving** | Off | For snack/bar formats: order must be paid before it fires. |
| **Service charge** | Off | Not customary in maquis; common in hotel restaurants. |
| **Pre-bill print** (*addition*) | On | Guest checks the bill on paper before paying; mandatory reprint after any change. |
| **Offline mode** | Always on | Orders, KDS and floor keep working on the local device; sync when back. Non-negotiable for this market. Delivered by the platform **local hub** — see C7. |

### What I need from you

Confirm or adjust:
1. D1 defaults per preset (PIN-always for Maquis/Bar, PIN-after-start for
   Restaurant), plus remote approval and the daily void digest.
2. D2 *warn and ask* with the three outcomes, including take-away.
3. D3 close-on-payment + 10-minute safety net + *Bump all served*.
4. D4 merge, split and move in v1.
5. D5 Maquis default, plus the Hotel restaurant and Snack presets.
6. D6 — which of these go into this batch. Recommended for now: **print to
   kitchen, table assigned to server, pre-bill print, offline**. Server
   banking and ardoise are bigger; schedule them as their own batch.

---

## 7 · Implementation review (prototype)

New files: `restaurant/service.jsx` (void, move/join/split, clear-with-food
sheets), `restaurant/floor-setup.jsx` (presets, floor editor, service rules,
Setup tabs), `restaurant/rkit-service.css`. Rewritten: `store.jsx`. Edited:
`register.jsx`, `register-parts.jsx`, `kitchen.jsx`, `floor.jsx`, `kiosk.jsx`,
`app.jsx`.

| Item | Status | Where / note |
|---|---|---|
| C1 per-table orders | Done | `orders` keyed by table / `tab:` / `_counter:`; walk-in order moves to the table when one is picked |
| C1 persistence | Done (stand-in) | localStorage `kz:rk:v2:*` for orders, tickets, tables, floors, rules, voids, kiosk lock. Tenders never stored. SQLite in production |
| C1 "restored" notice | Done | Register banner after reload |
| C2 void after fire + reasons | Done | Void button on a selected sent line; reason required |
| C2 approval rules | Done | After cooking starts (default) · Always · Never; value threshold; manager PIN |
| D1 per-preset default | Done | Maquis/Bar/Snack/Counter → Always; Restaurant/Hotel → after cooking starts |
| D1 remote approval | Done (mock) | Owner approve/decline simulated; times out to declined after 60 s |
| C2 KDS strike + acknowledge | Done | VOID badge, CHANGED badge, "Seen" tap; fully voided ticket shows as cancelled until acknowledged |
| C2 note amendment to KDS | Done | Note edit on a sent line updates the kitchen ticket |
| C2 qty on sent line | Done | Only reducible through Void |
| C2 stock R1 | Logged only | Void log records fire −1 / reversal +1 / waste −1; no Inventory posting (restaurant isn't on the ledger yet) |
| C2 Z-report Voids line | Done | Rail → Close: voids by reason / server / approval, close blockers (unpaid tables, open tabs, tickets in kitchen, unseen cancellations), owner digest preview (G3) |
| C3 move / join / separate | Done | Floor → Move; busy target joins; joined table shows dashed; Separate |
| C3 split by item / move items | Done | Register → Move, untick to split; sent items show "Serve to Table Y" on KDS |
| C3 KDS "moved from" | Done | |
| C4 lifecycle, no delete | Done | `closed` / `cancelled` flags; clear never deletes |
| D2 clear with food in kitchen | Done | Take-away · Already served · Cancel (optional PIN) — from Floor and after payment |
| D3 served lane | Done | Closed on payment; age-out 5/10/20/never; Clear all |
| C5 floor plan as config | Done (stand-in) | Persisted locally; JSON-file mock backend still to wire |
| C5 editor | Done | Areas add/rename/reorder/icon/delete; tables add/drag/snap/label/seats/shape/duplicate/delete; in-service guard; phone list view |
| C5 archive areas | Done | Areas and tables are archived, not deleted; Archived list with Restore; presets archive the old plan; duplicate labels flagged inline (G5) |
| C5/D5 presets + onboarding | Done | 6 presets with table-count steppers; first-run prompt in Setup → Floor plan |
| C8 kiosk mode lock | Done | Hides staff nav; enter from Kiosk staff bar or Setup; exit = hold logo + PIN |
| C8 idle reset | Done | Per rule, default 90 s |
| C8 compositions + touch sizes | Done | Phone: 56 px buttons, 16 px text, 120 px tiles; ≤ 360 px one column |
| C8 preview toggle | Done | Desktop / Tablet / Phone in the kiosk staff bar |
| C8 keep screen awake | Not applicable | Capacitor keep-awake in the Angular port |
| D6 print to kitchen | Done | Slip per station on fire; VOID / CHANGED slips; offline printer queues in order; Setup → Printing log; on for Maquis and Snack |
| D6 table assigned to server | Done | Staff switch in the top bar; other servers see the table read-only; supervisor takeover |
| D6 pre-bill print | Done | Print bill → Pay; any change after printing → Reprint bill blocks payment |
| D6 server banking, ardoise | Planned | `Koomzo Restaurant - Server Banking and Ardoise Plan.md` |
| C7 local network | Not in this batch | Separate plan: `Koomzo Link - Local Network Plan.md` |

Every *Not done*, *Partial*, *Logged only* and *stand-in* row above is specified
for production in **`Koomzo Restaurant - Production Gap Spec.md`** (G1–G8).
