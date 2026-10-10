# Koomzo — Batch 1 close-out: rulings

Decision record closing D321 and D322, plus sequencing for everything else
flagged at the end of batch 1. Full reasoning and code citations in
`Koomzo - Batch 1 Close-out Rulings.html`.

Standing instruction for anything needing a backend: add a **backend service
with a mock implementation** behind a real interface, JSON-file persistence
under `backend/data/`, so `koomzoapps` swaps one provider and nothing else.

---

## The three waiting on me

### R1 — Void after fire: restore, then write off

**RULED: agreed. Two movements, net one. 30 → 29.**

Precedent already exists: `kz-stock-sales.js:70` `reverseSale()` handles damaged
returns as two events — the customer's refund (`kind:'sale'`) and the business's
write-off (`kind:'adjust', reason:'damaged'`) — with a comment stating that
intent. A dish voided after firing is the same shape. Mirror the method rather
than inventing one.

```
fire   −1  kind:'fire'
void   +1  kind:'fire'    reason:'void-reversal'
       −1  kind:'adjust'  reason:'waste'
```

Three rows, deliberately: the cooking stays on the record, the reversal cancels
it, the waste is the number an owner can act on — and it keeps rung-4 variance
honest later, since waste stays attributable instead of hiding inside a
depletion figure.

**Rider:** a void *before* fire posts nothing. The rule only engages once
`firedAt` is set.

Scope: one adapter method (`reverseFire()`) + one spec paragraph.

---

### R2 — Gym and restaurant stock: each gets its own site

**RULED: agreed. Two new rows in `IV_LOCATIONS`.**

The current state is not a fixture shortcut, it is a reporting falsehood.
`IV_LOCATIONS` holds `dt · Akwa Boutique (Store)` and `up · Bonapriso Salon
(Salon)`. Posting the gym bar to `up` puts energy drinks on the salon's stock
report; posting the restaurant cellar to `dt` puts wine on the boutique's
valuation. A cycle count at Bonapriso would come back short by exactly the gym's
consumption and nobody would know why. Every location-scoped surface inherits
the error — counts, transfers, reorder, valuation, variance.

```js
{ id:'gy', name:'Akwa Fitness Bar',    kind:'Gym',        code:'GF', sells:true, icon:'barbell-outline' }
{ id:'rk', name:'Le Comptoir Cellier', kind:'Restaurant', code:'LC', sells:true, icon:'restaurant-outline' }

// then
GM_LOC = 'gy'   RK_LOC = 'rk'
```

Two extra rows in every location selector is the correct cost — a Douala
operator running a salon, a gym and a restaurant on one account is exactly the
target customer and needs three separate stock positions. Update fixtures in the
same commit.

---

### R3 — Land batch 1 on main

**RULED: merge `rebaseline-p2-5` to main now, before anything else.**

Main at the PR #9 merge means every item below either targets a stale base or
compounds the divergence. Land it, tag it `batch-1`, make that tag the baseline
the batch-2 plan is written against. R1 and R2 go on top as separate commits so
each is independently reviewable and revertible.

---

## R4 — Register persistence (item 9): reprioritised to #1

**RULED: one register-wide rule. Persist the *order*. Never persist the
*tender result*.**

This is the highest-priority item on the whole list, not a shell afterthought.
Power cuts and browser reloads are routine in this market; a register that loses
an open table on reload is not deployable.

It collides with the double-charge defect (a reload re-hydrating a previous
order's succeeded tenders). So the rule is two-sided:

| Persist — survives reload | Never persist |
|---|---|
| open tables, cart lines, qty | succeeded tenders |
| modifiers, seat/course, notes | MoMo pending state |
| customer, unapproved discount | folio post confirmations |
| ticket no (session-scoped seq) | supervisor approval grants |

Mechanics: one `RegisterStateService` → `localStorage` under
`kz:register:<locId>:<registerId>`, debounced, schema-versioned, cleared on
Z-close. On load, restore the order and show a quiet *"Restored your open
orders"*. Any tender bucket found on load is **validated against ticket identity
and total before it is trusted, discarded otherwise**.

**Constraint: that validation ships in the same commit as the persistence.**
Persistence alone makes the money bug easier to hit, not harder.

---

## R5 — Backend phase: mock contract

The rule for the seven hotel buttons and gym WhatsApp is **not** "stay absent
until a real connection exists" — it is "call a real interface whose
implementation happens to be a mock." The component, loading state, error state,
disabled state and success toast all get built and tested now; production
replaces one provider.

```ts
// koomzodesignsystem/src/app/core/backend/
export interface PrintService {
  printFolio(folioId: string): Promise<PrintJob>;   // {id,status,at}
}
// mock/print.mock.ts — realistic delay, writes backend/data/print-jobs.json,
// can be told to fail.
providers: [{ provide: PrintService, useClass: MockPrintService }]
```

Every mock must have three properties, because they are what the UI is built
against:

1. **Latency** — 600–1500 ms, never instant. A button with no spinner state
   ships broken.
2. **A failure path** — a toggle or a seeded always-fails item. **Offline is the
   normal case here, not the edge case.** The retry and queue states are the
   feature and cannot be designed against a mock that always succeeds.
3. **Durable state** — JSON under `backend/data/`, so a sent link is still sent
   after a reload and history views have something real.

### The five services

| Service | Covers | Mock behaviour / market note |
|---|---|---|
| **PrintService** | Print folio, Export register | Assume a **58/80 mm Bluetooth thermal printer, not A4** — the folio needs a receipt-width layout, and the mock unblocks that design now. Export writes real CSV to `backend/data/exports/`. |
| **MessagingService** | Gym WhatsApp, pre-arrival *Send N links* / *Ask again* | `send(channel, to, template, vars)`. **WhatsApp is the default channel, not SMS.** Appends to `messages.json` with `queued → sent → delivered`; holds at `queued` when offline toggle is on. Rate-limit *Ask again* in the mock or the UI never grows the guard. |
| **ChannelService** | Push availability, Push to channels | Lowest real priority — few independent Cameroonian properties run a channel manager. Mock thinly; seed one always-erroring channel so partial-failure UI exists. |
| **PublishService** | New season, Publish week, Send the board | Version + publish against `schedules.json`. *Send the board* composes to MessagingService rather than owning a transport. |
| **ExportService** | Register export, report downloads | Can fold into Print; keep separate only if export is ever scheduled rather than pressed. |

**Build the outbox once.** Print, message, publish and channel-push all need the
same thing on an intermittent connection: queue locally, show pending, retry,
surface failure. One **OutboxService** the four sit on — the highest-value piece
of the backend phase for this market.

---

## R6 — Shell pass (one commit, all modules)

| Item | Call | Note |
|---|---|---|
| Profile chip (salon, gym) | Build | Shell component, fixes both at once |
| Salon contextual subtitle | Build | Same header component |
| Kiosk PIN exit — D70 press-and-hold | Build | Keep the friction; an unattended kiosk with an easy exit is a cash risk |
| Gym front-desk search autofocus | Build, **desktop only** | **Suppress on touch** — autofocus on a tablet throws up the on-screen keyboard and eats half the screen on arrival |

---

## R7 — Module backlog order

| # | Item | Call | Reasoning |
|---|---|---|---|
| 10 | Grocery age-prompt ID chips | **First** | Blocks test coverage of a whole item class; `ion-alert` can't carry the ID-method choice |
| 11 | PLU shortcut chips | High | Loose produce by weight, no barcode, is the norm here |
| 12 | Crates stepper sheet | High | Returnable bottle-crate deposits are a real liability in Cameroon |
| 15 | Salon quick keys | High | Per-stylist attribution drives commission; used every ticket |
| 16 | Salon Now line | Med | Cheap, high glance-value |
| 25 | Restaurant stations setting inert (D62 §4) | **Promote** | Stations gate the fire path and the depletion model keys food-vs-bar off `station` — an inert setting becomes a stock bug in 1b |
| 23 | Gym payout route | Med | Assign it; an unrouted nav item reads as broken |
| 17–22 | Salon reorder badge, task delete, timesheet reopen, agenda row actions, autoClock/mineOnly | Batch | One salon-completion pass, not scattered |
| 13 | Hotel long-stay *New tenancy* | Med | Long-stay/monthly tenancy is common in Douala hotels |
| 24 | Gym company seat list | Low | Thinner segment; leave stubbed |
| 14 | Hotel guest card preview / Hide guest view | Batch 4 | Agreed — a screen, not a fix |

**Deliberately not built — all three calls upheld.** Gym churn without a source
screen would be invention. D143's drawer placement for Rewards is the better
pattern. The 90-second attract-screen idle beats a 20-second countdown — a
countdown pressures a customer still deciding, which in a kiosk loses the order.

---

## R8 — Item 26, the floating pay bar

**RULED: fix it, but scheduled as its own contained change after the shell
pass — not patched inside another task.**

Not cosmetic: the **768 px portrait tablet is a very common register form factor
here**, and Charge is the one control that must be in the same place every time.
Muscle memory is the whole argument for a pinned bar.

Fix: make the bar a sticky footer of the order-panel container with a
`min-height` on the scroll region above it, so a short product list still pushes
it down. One shared container change applied five times, tested at 768 px
portrait specifically. Keep the KNOWN-GAP entry in `FROZEN.md` until it lands.

---

## Sequence

| Step | Work | Why here |
|---|---|---|
| 1 | Land batch 1 on main, tag `batch-1` | Everything needs the base |
| 2 | R1 (fire reversal) + R2 (two locations), separate commits | Small, spec-closing, revertible |
| 3 | R4 register persistence **+ tender validation** | Highest operator impact; closes the money bug. One commit |
| 4 | R6 shell pass | Cheap, visible, one commit across modules |
| 5 | R5 backend interfaces + mocks + OutboxService; wire the 7 hotel buttons and gym WhatsApp | Unblocks 8 dead controls; production swap is one provider each |
| 6 | R7 module backlog, starting grocery 10–12 | Used every transaction |
| 7 | R8 retail pay bar across all five layouts | After the shell pass, so container conventions are settled |
| 8 | Batch 2 planning | Written against the `batch-1` tag |

**Batch 1b (recipes, two-unit model, prep batches, variance) stays parked** —
consistent with the depletion-ladder position that rungs 2–4 wait for a venue to
ask. Steps 2 and R7·25 are the only 1b prerequisites worth doing early, and both
pay for themselves independently.
