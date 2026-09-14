# Inventory — action contract

Every action button in the Inventory module now posts. This file is the handoff note:
what each action takes, what it writes, and which rule the **server** must re-resolve
in `koomzoapps` (the design-system copy enforces it client-side only, so the UI can
respond with no network — it is a mirror, not the authority).

All calls live in `inventory/iv-store.js` as `IVS.*`. The argument shapes are the
contract; the array mutation is the mock backend and is not.

## Invariant the whole module rests on

A quantity is never edited — it is **moved**. Every action that changes a number
writes one movement row (`IV_MOVES`) carrying item, location, kind, qty, reason,
reference and cost. If an action cannot name its movement, it is not allowed to run.

| Screen | Button | Call | Writes | SERVER must enforce |
|---|---|---|---|---|
| Items | Add item ▾ | `createItem(draft)` | item; `adjust`/`found` movement if an opening balance is given | SKU uniqueness per tenant; opening balance only via a movement, never a direct quantity |
| Items | Import | `importItems(rows, locId)` | items created/updated; one `found` movement per row with a qty | SKU is the merge key; reject the whole file or none — no partial commit |
| Items | Add to order *(bulk)* | opens `newOrder` prefilled with the first selection's supplier | — | — |
| Stock | Stock in / Stock out / Move / Adjust | `postMovement({kind, loc, from, to, partner, lines, reason, note})` | one document number (`SI`/`SO`/`MV`/`AJ`) and one movement per line — **two** per line for a move | reason mandatory on adjust; a negative result needs an owner PIN **and** a role permitted to authorise it (mock accepts any 4 digits); `qty` on an adjust line is the NEW COUNT, the delta is derived server-side from the on-hand at write time — a client-supplied delta is stale by the time it arrives |
| Stock | Receive | `receive({poId, locId, lines, ref})` | `receipt` movement per line; `recv` on the order; order status; weighted-average cost | cost re-average rounded to whole XAF on write; over-receipt recorded, never silently clamped |
| Stock | Post adjustment *(item pane)* | `postAdjustment({itemId, locId, delta, reason, note})` | one `adjust` movement | as above — kept for the single-item shortcut from the item pane |
| Stock | Export | client-side CSV of the filtered ledger, one row per line with before/change/after | — | — |
| Purchases | New order | `createPO({supplier, to, lines, send})` | order (`draft` or `sent`) | MOQ shortfall is a warning, never a block — it is our rule, not the supplier's |
| Purchases | Send order | `sendPO(id)` | status `sent`; outbox row | idempotent — a retry must not send twice |
| Purchases | Receive *(pane)* | `receive({poId, lines})` | as above | the pane input is **cumulative received-to-date**; the post is the delta |
| Purchases | Print | none — renders `.docpaper`, `window.print()` | — | — |
| Purchases | Raise draft *(suggestion)* | `createPO({send:false})` | draft order per supplier | par/reorder read at raise time, not at suggestion time |
| Counts | New count | `createCount({loc, scope, blind, lines})` | count with expected frozen at open | expected must be captured server-side at open; a client-supplied expected is forgeable |
| Counts | Schedule cycle | `scheduleCycle(cfg)` | rotation (`IV_CYCLES`) | — |
| Counts | Save draft | `saveCount(id, counted)` | line counts; status `open`/`review` | — |
| Counts | Post count | `postCount(id, counted)` | one `count` movement per differing line; variance to shrinkage; status `posted` | posted counts are immutable — a mistake is corrected by a new adjustment |
| Transfers | New transfer | `createTransfer({from, to, lines, send})` | transfer (`draft`, or `in-transit` if sent now) | source ≠ destination; lines capped at on-hand **at source** — a send must not drive a location negative |
| Transfers | Send | `sendTransfer(id)` | outbound `transfer` movement per line; status `in-transit` | decrements source only — the destination is **not** credited until receipt |
| Transfers | Receive | `receiveTransfer(id, lines)` | inbound `transfer` movement per line; `recv` per line; status | a short arrival leaves the balance in transit against the same document — never a second transfer |
| Transfers | Print list | none — renders `.docpaper`, `window.print()` | — | — |
| Vendors | New partner | `createPartner(d)` | partner with one or more roles | name uniqueness per tenant; a partner must keep at least one role |
| Vendors | Email | `queueEmail(m)` | outbox row, `sent` or `queued` | offline queue is per device and must de-duplicate on flush |
| Vendors | New order | opens `newOrder` for that supplier | — | — |

## Decisions worth carrying to koomzoapps

0. **The four verbs are one operation.** Stock in, stock out, move and adjust differ by
   three things: where stock comes from, where it goes, and what the quantity column
   means. They are four presets of `postMovement`, not four code paths — which is the
   only reason four near-identical forms cannot drift apart. Two consequences the UI is
   obliged to honour: the quantity column is **labelled per kind** (“Quantity” vs “New
   count”), and every line shows its result inline (`12 → 9`) as it is typed. An
   absolute figure and a relative one in the same visual position, unlabelled, is what
   makes an adjustment screen dangerous.

0b. **Every posting carries `before`.** `post()` in the store captures the on-hand at
   that location immediately prior, applies the change, then writes the movement with it.
   The ledger therefore never has to recompute history to show what a document did — and
   a recomputed history is a history that drifts.

0c. **The ledger is derived, not stored.** `IV.ledger(loc)` groups `IV_MOVES` by `doc`.
   A document list stored *beside* the movements is a second source of truth that can
   disagree with the postings it describes; a derived one cannot.

0d. **A half-posted move is a state, not missing data.** A sent transfer has written only
   its outbound half — by design, because the destination is not credited until receipt.
   The ledger therefore reads the destination off the transfer record, marks the document
   `inTransit`, renders `From … → … · IN TRANSIT`, and shows the **outbound** lines rather
   than filtering to the (empty) inbound side. Anything else renders a document with a
   header, a total and no lines — and an operator asking "where is my stock right now"
   gets no answer. Every location lookup in the ledger goes through `locName()`, which
   tolerates a missing id: **a ledger row must never be able to take the module down.**
   This was a live crash, and its shape is worth remembering — two functions changed in
   one pass (`sendTransfer` deliberately posting one side, `IV.ledger` assuming two) with
   no screen that rendered both together until a transfer was actually in flight.

1. **Two legitimate ways stock arrives.** Against an order, and without one. Both write
   receipt movements and re-average cost; only the first can close an order. A system
   that models only the first gets direct deliveries entered as adjustments, and
   shrinkage reporting becomes unreadable.
2. **Negative stock is allowed, authorised.** The shelf is the truth. Blocking the
   post makes staff stop recording, which is worse than a negative. So: reason
   required always, PIN required when the result goes below zero.
3. **Blind count is the default.** A visible expected figure gets typed back at you;
   it will not find theft. The expected value is hidden from the counter but frozen
   at open, so the variance is still computable.
4. **Cumulative vs delta on receiving.** The pane's input is what has arrived *in
   total*; the post is the difference. Untouched, the button receives the whole
   outstanding balance — the common case at the door. Transfers differ deliberately:
   the input is *this* arrival (capped at the outstanding balance), because a transfer
   receipt happens once at a loading bay rather than being revised over days.
5. **A transfer is one document with two postings.** Send decrements source; receive   credits destination. Between them the quantity is **in transit** — owned, visible in
   valuation, and not sellable at either end. A system that models this as a decrement
   plus an unrelated increment cannot answer "where is my stock right now", and a short
   arrival becomes an unexplained variance at two locations instead of a balance against
   one document.
6. **Cost rounds to whole francs on every write.** XAF has no minor unit, so an
   unrounded weighted average makes every downstream valuation fractional. Same rule
   as the money gates.
7. **A post says what it wrote.** Toasts are in domain terms — “Posted CC-0033 · 2
   movements · variance −1 250 F”, not “Saved”. An operator who cannot see what a
   button did stops trusting the button.

## Information architecture — five entries, not nine

The rail was Overview, Items, Stock, Buy, Counts, Move, Reports, Vendors + Setup. It is
now **Items, Stock, Orders, Reports + Setup**. Nothing lost a capability; four things
changed address:

| Was a rail entry | Now lives | Why |
|---|---|---|
| Overview | Reports → Summary tab | It is the valuation summary. A KPI wall is a report, not a destination. |
| Counts | Stock → Counts tab, + a Count action button | A count changes a quantity; it belongs with the other four verbs. |
| Move (Transfers) | Stock → In transit tab, + the Move preset | The instant move posts through `postMovement`; the multi-day document workflow (draft → in transit → receive) stays intact on the tab. |
| Vendors | Orders → Suppliers tab | Purchases and the suppliers they are raised against are one job with two faces. |

**Deliberately absent: Sales orders and Returns.** Neither exists in the data model, and
a tab that opens on an empty shell is the pattern this restructure set out to remove. The
Orders screen has two real tabs rather than four, two of them hollow.

**Tiering is a capability flag, never a removed route** (`IV_TIERS` → `capsFor(tier)`).
Lite is Items + Stock + Setup; Standard adds locations, moving stock, purchasing,
suppliers, services and reports; Pro adds counts, bundles, lots and serials. Every screen
asks the same question of the same map, so nothing goes unverified because it was never
rendered during a change — the failure mode that produced the `overlay`→`pushed`
regression one level up.

**One authority at runtime, and it is `window.KZ`.** `IV_TIERS` is the *recipe* for a
tier; the shared capability service is where the answer lives. Three rules fall out, each
of which was a live defect first:

1. **Setting a tier writes through.** `setMode` calls `KZ.setTier` **and** pushes every
   capability with `KZ.setCap`, because KZ's own tier composition differs from ours. For
   one round it only set local state — so the screens degraded to Lite while the rail,
   which already trusted KZ, kept every entry. Lite was not Lite.
2. **On load, KZ wins and the tweak follows it.** The user may have set the plan in
   Control Centre; this module must not quietly overwrite it. The mode chip is derived
   from the effective capability map rather than the tweak, so the label cannot disagree
   with the rail.
3. **A capability KZ has never heard of keeps its local value.** The subscribe reducer
   merges over the previous map instead of rebuilding from KZ's list alone. Rebuilding
   silently zeroed `services` — which is in `IV_CAPS` — and took the only entry point to
   the new-service form with it, on any unrelated shared-capability change. Anything added
   to `IV_CAPS` must also be registered in `kz/kz-caps.js`; the merge is the safety net,
   not the mechanism.

**Nested views.** Counts, Transfers, Purchases and Suppliers still render their own
`.view` + `view__head` (which carries their actions), so the tab wrapper is `.ivsub`,
which strips the duplicated page padding. `.view` is owned by `rx.css` — the rule is
scoped under our own class rather than restyling another module's selector globally,
the same discipline as Catalog scoping `.back-s` under `.catwrap`. Orders hides its own
segmented rail when it has fewer than two tabs, so a Lite shop does not meet a control
with one option in it.

## The item form — six fields, and no Type selector

`Add item ▾`: the button adds a stock item; the caret offers Service, Bundle and
Non-stock, and each appears only when its capability is on — so a Lite shop sees a plain
button with no caret. A Type dropdown forces every user to read four options and choose;
a split button lets 95% tap the main button and never learn the other three exist.

The form itself is photo, name, sell price, cost, opening quantity (+ location when
multi-site) and barcode. SKU is generated and shown quietly under the name, editable
behind **Edit identity** — a shopkeeper naming their first item should not have to learn
what a SKU is in order to save it. Reordering, attributes and lot capture are sections
that **materialise when their capability is on**, never disabled fields: a section that
appears teaches, a greyed one only frustrates.

## Partners — one list, role tags, no supplier table

A supplier and a customer are the same record with the same fields. Two contact books is
an administrative tax on a business where the same wholesaler both sells to you and buys
from you — common in this market, and the seed data carries exactly that case (Baker
Street Salon is `roles:['supplier','customer']`).

`window.IV_PARTNERS` is the entity. **`IV_SUPPLIERS` is a live filtered getter over it**,
not a second array — purchase orders, receiving, the reorder suggestions and the item
form keep reading what they always read, and a partner added anywhere appears everywhere.
A copy would have drifted the moment a partner was created; a getter cannot. Note the
consequence for writes: **`createPartner` pushes to `IV_PARTNERS`**, never to
`IV_SUPPLIERS`, because a push onto a derived array is silently discarded.

**Every id sequence is derived from the data, never a literal.** `supSeq` was `3` — right
when partners were `sup1..sup3`, wrong the moment `pt4`–`pt6` joined the seed list, after
which the first three partners a user created got ids that were already taken. They were
then unreachable by their own id: the Partners list rendered duplicate React keys, tapping
the new partner opened the seed partner's record, and an order raised against it printed
the wrong company. A literal next-id is correct only until someone edits the seed data,
so `seqOf()` reads the highest existing number off the collection at init for partners,
orders, counts, transfers, items and every document prefix. Hard-coding the right number
fixes today and re-breaks on the next seed edit — which is precisely how this one arrived.

Role drives what renders, and absence is the tool rather than disabling:

- The movement sheet has **one Partner control**, filtered to suppliers on Stock in and
  customers on Stock out. Switching the preset clears a partner whose role no longer
  fits, so a stale name cannot be submitted against the wrong kind.
- Lead time, minimum order and on-time % are facts about buying *from* someone. They are
  **absent** on a customer-only record, not zeroed — a 0-day lead time on a customer is a
  number that invites a wrong conclusion.
- The partner pane's primary action follows the role: New order for a supplier, Stock out
  for a customer.
- `createSupplier` survives as the name the purchase screens already call; it is a thin
  wrapper that sets `roles:['supplier']`. There is no supplier table behind it.

**The capability key stays `suppliers`; its display name is "Partner directory".** The key
is load-bearing across `iv-data.js`, `kz/kz-caps.js` and three tier lists, so renaming it
would be the `overlay`→`pushed` mistake again. But the *label* had to change: the switch
gates a list holding three customers, and a merchant turning off "Supplier directory"
would reasonably expect to keep their customers. Key and label answer different questions
— one is a contract, the other is a promise to the person reading it.

## Market context — Douala, not a generic Anglo shop

The seed data is a Douala beauty retailer with a salon, and the vocabulary is load-bearing
rather than decorative: it is what makes the workflows readable to the people who will
review them, and several rules in this module only make sense in that setting.

- **Locations are Douala districts**: Akwa Boutique (AK) on the main commercial strip,
  Bonapriso Salon (BP), Douala Airport Kiosk (AP), Bonabéri Dépôt (BN) across the Wouri.
  Four sites in one city is the realistic shape here, not a national chain.
- **Partners are the three kinds of supply that actually exist**: a local formulator
  (Nyanga Cosmétiques, 5-day lead, free delivery in Akwa and Bonanjo over 180 000 F), a
  Marché Mboppi wholesaler (2-day lead, higher unit cost, no invoice unless asked) and an
  importer (Sud Import Outillage, 12-day lead because customs clearance at Douala port
  adds a week). Those lead times are why par levels and reorder points differ so widely
  per supplier — the reorder engine is modelling a real constraint.
- **Money is XAF throughout**: whole francs, no minor unit, space-grouped. Every cost
  re-average rounds to a whole franc on write for this reason, not for tidiness.
- **Offline is the normal case, not the failure case.** `queueEmail` queues rather than
  errors; the outbox shows "Queued — sends when the device is back online". A purchase
  order that cannot be sent is not a lost purchase order.
- **A partner who both supplies and buys is ordinary here**, not an edge case — Salon
  Bella Deïdo buys colour at trade and sells us their own oil line. That is the concrete
  reason the partner list is one list with role tags.

## Layout — master–detail is a push on mobile, a pane on tablet+

Purchases, Counts, Vendors and Transfers all use `.mdgrid` + `.mdpane`. Stacking the
detail *below* the master list on a phone is the defect this replaces: the user scrolls
past the entire list to reach what they just tapped, and the tap gives no feedback until
they do.

Under 1000px the pane leaves the flow entirely (`.mdgrid>.mdpane:not(.pushed)` is
`display:none`) and a tap sets `pushed`, which turns it into a full-height overlay with
a back chevron — the behaviour `ion-split-pane` gives you natively in `koomzoapps`.
Three rules make it read as navigation rather than a resized pane:

1. **Back clears the navigation state, not the selection.** `pushed` is separate from
   `selId`, so rotating to tablet width shows the pane beside the list with the
   selection intact rather than an empty pane.
2. **The record identifies itself in its own header** (PO-2214 · Nyanga Cosmétiques · into
   Central Warehouse), because the list that supplied that context is off-screen.
3. **The footer actions stay pinned** — Receive/Print, Post count, Email/New order.
   They are why the detail was opened.

Panes assembled from several blocks rather than one `.mdbd` wrap them in `.mdscroll`,
which is `display:contents` at desktop (layout unchanged) and becomes the single scroll
region when pushed.

**Stacking: a pushed pane is app chrome, not a modal layer.** `.mdpane.pushed` sits at
`z-index:10` — enough to clear `.main` content and sticky table cells (2–3), and
deliberately *below* `.scrim` (70). It was 80 for one round, which painted every pane
over the modal scrim and made every `.mdfoot` action (Print, Receive, Email, Post count)
mount-but-unreachable on narrow viewports across all five pushed panes. Note the fix
direction: the pane was lowered rather than the scrim raised, because `.scrim` belongs
to `rx.css` — **fix your own class, never another module's.** Anything that must paint
over a pushed pane belongs above 70, like `.ivtoasts` at 120.

**In `koomzoapps` this is `ion-split-pane` with `when="md"`**, and the push is a real
`ion-nav` route — which gets the hardware back button and the swipe-back gesture for
free. Do not port the class toggle; port the intent.

### Where this pattern lives across the design system

`.mdpane`/`.mdgrid` are defined in **this file** and consumed by MRP, Retail Flex and
Products v2 as well as Inventory, so the mobile contract is cross-module: **a pane must
carry `pushed` to be visible under 1000px.** The class name is load-bearing, not
cosmetic — renaming it silently blanks panes in modules that never get opened during
the change.

| Module · screen | Push state | Notes |
|---|---|---|
| Inventory · Items | selection | pane only mounts when an item is selected |
| Inventory · Stock (ledger) | explicit `pushed` | seeds the newest document, so selection alone can't drive it; a post sets `pushed` so the operator lands on what they just wrote |
| Inventory · Purchases / Counts / Vendors / Transfers | explicit `pushed` | these seed a default selection, so selection alone can't drive it |
| MRP · Planning / Work orders / BOM | selection | shares `.mdpane` from this file |
| Retail Flex · Sales | selection | shares `.mdpane` from this file |
| Hotel · Folio | explicit `pushed` | own grid (`.htf`), seeds first in-house stay |
| Catalog · Categories | `editId` | own grid (`.catwrap`), selection is the state |
| Salon · Team | `showing` | predates this work, same contract, own vocabulary |

**Deliberately not master–detail** — these are two-column *layouts* whose second column
is a peer, not a detail of a selection, and stacking is correct: the POS boards
(`.board`, `.grtill`, `.gmpos`, `.gmdesk` — the order panel is a peer of the
catalogue), Hotel Pre-arrival (`.htpa`, a guest-phone preview; its row tap opens a
modal sheet), Queue serve console (`.qsplit`, a lane side-panel), Home's `.kh-cols`,
Control Centre's `.cc2`, Barcode's `.bc-split`, and `.form2`.

**Two naming hazards to settle before this ports.** `.back-s` is owned by `sl.css`, and
which bundles load it varies: Hotel and Grocery load it *before* `ht.css` (so Hotel's
back button can use `.sbtn gh`, and its `.htf.pushed .back-s` rule at 0-3-0 + `!important`
correctly outranks sl.css's `@container (min-width:641px)` hide), while the Retail Flex
bundle does **not** load it at all — so Catalog builds its back control from `.btn`
(rx.css, always present there) and scopes every `.back-s` rule to `.catwrap`. The rule
that falls out: **never depend on, or restyle, a class another module owns** — check the
bundle's actual stylesheet list, not the class's existence in the tree. That is the same
failure mode as the `overlay`→`pushed` rename, one level down.

And Salon's `showing` is a third name for one concept (`overlay` → `pushed` →
`showing`); in `koomzoapps` all three collapse into `ion-split-pane`, so the vocabulary
should be unified at the port rather than propagated.

## Known gaps, named rather than left silent

- **Late-mounted `ion-icon` elements do not always hydrate.** Every `ion-icon` costs a
  per-icon SVG fetch from the CDN; icons present at initial load resolve, but ones
  mounted later (a pushed pane, an opened sheet) can stay `visibility:hidden` at 0×0 —
  observed as 0 of 76 hydrated in Categories' glyph picker. Two consequences already
  applied: the back affordance is an **inline SVG**, because a navigation control whose
  glyph may not arrive is worse than one without a glyph; and `Koomzo POS - Retail Flex.html`
  was moved from `cdn.jsdelivr` to `unpkg` to match every other bundle (one origin, and
  the glyph picker fires 76 requests at once). **This is a pre-existing condition the
  push work exposed** rather than caused — the editor used to be a stacked block nobody
  scrolled to and is now the whole mobile screen. In `koomzoapps` it does not survive
  the port: `@ionic/angular` bundles Ionicons locally, so there is no per-icon fetch and
  nothing to hydrate late. Any icon that must render **offline** should not depend on a
  network glyph regardless.

- **Transfers** still has unwired buttons (Send / Receive / New transfer). Same action
  shape as receiving — two movements, one document — but out of scope for this pass.
- **Sales orders and Returns** are not built. The Orders screen is Purchases + Suppliers.
- **Photo upload on the item form is a placeholder.** The tile takes a click and does
  nothing; it is there because the layout is wrong without it, and the user's own images
  are the missing input.
- **`postMovement` discards the note when it is not used as the reference.** `label`
  falls back through ref → note → partner → reason, so a note given *alongside* a
  partner is lost. Same defect class as the transfer note below: either persist it on the
  document or drop the field.
- **Transfer notes are collected and discarded.** The New transfer sheet takes a note
  (driver, crate count) but `createTransfer` has nowhere to persist it — the movement's
  `ref` carries only the document number and the far location. Either add it to the
  transfer record or drop the field; a field that silently loses input is worse than no
  field.
- **Lot and serial capture on receipt.** `receive()` accepts a `lot` per line and the
  movement carries it, but no sheet collects it yet; items with `lot:true` should
  require it before the post is allowed.
- **Reports → Export CSV** and **Setup → Add location / Add reason** are not wired.
- **Email is a queue, not a transport.** `queueEmail` records intent and state; there
  is no send. In `koomzoapps` this is a server-side job, and the device queue must
  de-duplicate against it.
