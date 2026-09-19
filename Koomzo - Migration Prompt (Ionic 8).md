# Koomzo — React/Node → Ionic 8 + Angular 19 + Capacitor conversion

## Role

Act as a senior UI/UX designer **and** front-end engineer who has shipped
mobile-first ERP SaaS in both React/Node and Ionic 8 / Angular 19 / Capacitor.
You own both the visual parity and the behavioural parity of this conversion.

## The two repos

| | Path | What it is |
|---|---|---|
| **Source** | `~/repos/koomzo-pos-designs-2` | React screens (JSX transpiled in-browser by Babel), Express static server, in-memory fixtures. `npm start` → `http://localhost:5173`. No build step. |
| **Target** | `~/repos/koomzodesignsystem` | Ionic 8 / Angular 19 / Capacitor. Partially migrated already. Ships its own Claude skills and sub-agents from earlier migration batches. |

Both are design/reference implementations. The logic they encode — services and
seed data held as in-memory objects/JSON — is what will eventually move to
production `koomzoapps` with a real backend, so **capture logic as services and
typed fixtures, never as component-local state**.

---

## Phase 1 — Capture the source, by using it

Do not read-only your way through this. Run the source app and drive it.

```bash
cd ~/repos/koomzo-pos-designs-2 && npm install && npm start   # :5173
```

For **every** module, open its screen and exercise it:

- Selling: `retailflex/`, `restaurant/`, `grocery/`, `salon/`, `gym/`, `hotel/`
- Operations: `inventory/`, `mrp/`, `invoicing/`, `catalog/`, `barcode/`, `queue/`, `signage/`
- Platform/admin: `kz/`, `pos/`, `home/`, `apps/`, `settings/`, `uadmin/`, `padmin/`,
  `formbuilder/`, `forms/`, `forms-admin/`, `workflow/`, `automations/`, `spec/`

For each screen record: every button and its result, modal/sheet/popup open and
dismiss paths, form fields with their validation and error states, empty
/ loading / error states, vertical **and** horizontal scroll regions (sticky
rails, sticky totals footers, scroll-snap strips), keyboard and numpad entry,
and transitions in and out.

Do this at **four** device compositions, because the source treats layout as a
composition choice and not a feature reduction — a phone is a complete till:

1. Laptop / desktop (two-pane board)
2. Tablet landscape
3. Tablet portrait
4. Phone — and on Retail Flex specifically, all four phone compositions
   (default, bar, sheet, tabs)

Note every breakpoint where the composition changes, what moves, what collapses
into a sheet or a tab, and what stays pinned.

**Output of this phase:** a per-module *parity sheet* — screenshots at each
composition, an interaction inventory table (trigger → state change → visual
result), and the design-token usage observed (the tokens live in
`public/pos/colors_and_type.css` and `public/pos/kit.css`).

---

## Phase 2 — Read the specs, then read the platform layer

The specs and plans that drove the source are served alongside it at
`http://localhost:5173/<filename>` and live in `public/`:

**Register and stock**
`Koomzo - Register Functional Spec.html` ·
`Koomzo - Register Code Change Plan.html` ·
`Koomzo - Module Register Audit.html` ·
`Koomzo - Phone Compositions.html` ·
`Koomzo - Register and Inventory Integration.html` ·
`Koomzo - Stock Posting Implementation Plan.html` ·
`Koomzo - Recipe and Depletion Model.html` ·
`Koomzo - Mobile Convergence Plan.html`

**Inventory and products**
`Koomzo Inventory - IA & Integration.html` ·
`Koomzo Inventory - Simplification Review.html` · `inventory/ACTIONS.md`

**Platform and product**
`Koomzo - Functional Specification.html` (+ Deck, + standalone) ·
`Koomzo - Progressive Disclosure Approach.html` / `... Decisions.html` ·
`Koomzo - Introduction Walkthrough.html` ·
`Koomzo MRP - IA & Market Fit.html` ·
`Koomzo Signage - IA and Capabilities.html` ·
`Koomzo Queue - Requirements.md` ·
`Retail POS - Brief Answers.html` · `Retail POS - Variants Reference.html` ·
`backend/ARCHITECTURE.md`, `backend/README.md`

Where a spec and the code disagree, **the code is the source of truth for
behaviour** and the spec is the source of truth for intent — record the
divergence in the plan rather than silently picking one.

`public/kz/` is the shared platform layer every selling module reads. It is the
first thing to port and the thing most likely to be wrong if rushed:

| Source | Target shape |
|---|---|
| `kz-tender.js` | `TenderService` — tender list, tender phases, MoMo pending + countdown |
| `kz-charge.jsx` | `ChargeSheetComponent` — split payment via a tenders array |
| `kz-ticket.js` | `TicketService` — `LOC-REG-SESSION-SEQ` numbering |
| `kz-policy.js` | `PolicyService` — discount ceilings per module, supervisor approval |
| `kz-stock.js` | `StockService` — universal movement-ledger core |
| `kz-stock-sales.js` | `StockSalesAdapter` — POS posting, on paid |
| `kz-locale.js` | `LocaleService` — whole-franc money arithmetic, i18n |
| `kz-caps.js` | `CapabilityRegistry` — progressive disclosure / tier gating |
| `kz-folio.js` | `FolioService` — hotel folio posting |
| `kz-setup.jsx`, `kz-profile.jsx`, `kz-parail.jsx` | shell components |

Behaviours that must survive the port verbatim: shared tender list; whole-franc
arithmetic (no sub-unit rounding); `LOC-REG-SESSION-SEQ` tickets; MoMo pending
states with countdown; split payment as a tenders array; supervisor approval on
discounts with per-module ceilings; holds block Z-close; zero stock warns but
never blocks; stock movements post on **paid**.

### Known defects and open decisions — carry as explicit backlog

These are confirmed in the source code. Do **not** replicate them in the port;
fix them as part of the batch that owns the module, and record the decision.

**1. Restaurant posts no stock at all** (`restaurant/` contains zero references
to `KZStockSales`). Not at fire, not at payment. The spec's intent is fire-time
depletion — food leaves inventory when it is cooked, whether or not the guest
pays. Port as a second adapter, `StockFireAdapter`, alongside
`StockSalesAdapter`. Nuance to preserve: `fireCourse()` and `sendAll()` in
`restaurant/register.jsx` both exclude `station === 'bar'`, so bar items never
fire and must deplete at payment through the sales adapter. A void after fire
posts a **waste** movement, never a reversal of the depletion.

**2. Reload can re-charge a room for a previous order's tenders.** Real, and the
mechanism is two bugs compounding:

- `restaurant/register.jsx:25` seeds `orderNo` from a hardcoded `seq: 1042` on
  every mount, so a reload reuses the same ticket number.
- `kz-charge.jsx:12` hydrates `tenders` from `T.store.load(ticketNo)`, and
  `kz-tender.js` only clears that bucket in `finish()` (`kz-charge.jsx:81`) —
  the New Order button. Dismissing the sheet via the scrim leaves the bucket.
- `restaurant/modals.jsx:18-23` posts to `KZFolio` inside `settle()`, *before*
  `ch.request()`, and with no idempotency key.

So: take a tender, dismiss the sheet, reload → the next order loads the old
succeeded tenders and believes it is already part- or fully-paid; on the room
path the folio is posted again. Fixes for the port: session-scoped, persisted
ticket sequence; validate a loaded tender bucket against ticket identity *and*
total before trusting it, and clear on abandon; post the folio **after** a
succeeded tender, keyed idempotently on the tender `ref`.

**3. Paying or clearing a table deletes food still cooking.** `clearTable()`
(`restaurant/store.jsx:97-100`) drops every ticket for the table whose status
is not `done`, and `finishOrder()` (`register.jsx:125`) calls it on payment.
Tickets in `cook` or `ready` vanish with no kitchen-side notice. **This needs a
product decision before porting** — recommended: never delete. Transition the
ticket to `cancelled` with a reason, surface it in the kitchen as a struck card
rather than a silent removal, and post waste stock for anything already fired.
That is consistent with the existing rule that holds block Z-close: outstanding
kitchen work is operational debt to be resolved explicitly, not swept.

**4. Seed data pollution.** Three seeded `kind:'sale'` rows in the demo data
must be dropped before anything sums the movement log.

**5. Duplicate on-hand.** `IV.onHand()` duplicates the platform core and should
collapse into `StockService`.

Items 1–3 are behavioural questions, not port mechanics — raise each as a
decision with the product owner before writing the Restaurant batch plan.

---

## Phase 3 — Audit the target

Before planning anything, establish what already exists in `~/repos/koomzodesignsystem`:

- Its Claude **skills and sub-agents** from prior batches — read them, follow
  them, and reuse them rather than inventing a parallel convention.
- Its architecture: standalone components vs modules, routing, signals vs
  RxJS, state approach, folder conventions, naming.
- Its theming: Ionic CSS variables, how the Koomzo tokens were mapped, what
  shared components already exist.
- Exactly which modules, screens and services are already migrated, and at what
  fidelity — mark each *done / partial / not started*, with the gaps named.

Produce a written **target-state inventory** as the baseline every plan builds on.

---

## Phase 4 — Plan the conversion, in batches

One plan document per batch, not a single monolith. Start with the
register + inventory cluster — **Retail Flex, Restaurant, Salon, Gym, Hotel,
Inventory** — since that is where the recent source work landed; reorder within
or across batches if your audit shows a dependency that makes another order
safer, and say why.

Each batch plan must contain:

1. **Scope** — screens, components, services, fixtures in this batch.
2. **Dependency order** — what in `kz/` must land first.
3. **Component mapping** — source file → target component/service, with the
   Ionic 8 primitive chosen for each pattern (`ion-modal` sheet vs popover vs
   inline, `ion-segment`, `ion-refresher`, virtual scroll, etc.) and the
   reasoning.
4. **Responsive mapping** — how each of the four compositions is expressed in
   Ionic breakpoints, and what the phone composition sacrifices (ideally
   nothing: the phone keeps the full qualifier chain — age, Rx, variant, batch,
   serial, weight).
5. **Data contracts** — typed interfaces for the fixtures, shaped so a real
   backend can drop in behind them later.
6. **Parity checklist** — the Phase 1 interaction inventory, as a test list.
7. **Acceptance criteria** — visual (tokens, spacing, radii, states) and
   behavioural (every rule in the platform list above), plus what "done" means.
8. **Risks and divergences** — anything Ionic does differently from the React
   original, with the recommended resolution.

Cite the specific spec document and source file behind each non-obvious
decision so the conversion is auditable rather than remembered.

---

## Working rules

- Read before writing. No code in the analysis phases.
- Parity is visual **and** behavioural — a screen that looks right but tenders
  wrong is a failed migration.
- Business rules live in services; components stay presentational.
- Follow the target repo's existing skills, sub-agents and conventions; extend
  them rather than replacing them.
- Flag anything ambiguous instead of guessing, and ask before you diverge from
  a documented spec.

## Deliverables

1. Per-module parity sheets (Phase 1).
2. Spec + platform-logic digest, including code/spec divergences (Phase 2).
3. Target-state inventory (Phase 3).
4. Batch plan #1 — register + inventory cluster — then subsequent batch plans
   (Phase 4).
