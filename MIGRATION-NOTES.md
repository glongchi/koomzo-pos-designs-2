# Koomzo — code + spec export (for the Ionic 8 / Angular 19 / Capacitor migration)

This export is the React + Node source of the Koomzo application suite plus every
spec, plan and audit document. It maps onto the local repo
`~/repos/koomzo-pos-designs-2` (Express server, `public/` holds the screens).

## Layout after copying

```
koomzo-pos-designs-2/
  package.json, server.js      unchanged (already correct)
  public/
    *.html                     every screen AND every spec/plan doc
    kz/                        shared platform layer (see below)
    pos/                       design tokens: colors_and_type.css, kit.css
    retailflex/ restaurant/ grocery/ salon/ gym/ hotel/   selling modules
    inventory/ mrp/ invoicing/ catalog/ barcode/ queue/ signage/
    apps/ home/ settings/ uadmin/ padmin/ formbuilder/ forms/ forms-admin/
    workflow/ automations/ spec/
  backend/                     Firebase functions + Firestore rules (TypeScript)
```

Removed in this version: `public/mobile/` and `public/retail/` — Mobile folded
into Retail Flex (four phone compositions), Retail converged into Retail Flex.
`Koomzo POS - Retail.html` and `Koomzo POS - Mobile.html` are redirect stubs only.

## Platform layer — port these first

`public/kz/` is the shared truth every selling module reads. In the Angular port
these become injectable services, not `window` globals:

| File | Becomes |
|---|---|
| `kz-tender.js` | `TenderService` — tender list, phases, MoMo pending states |
| `kz-charge.jsx` | `ChargeSheetComponent` — split payment, tenders array |
| `kz-ticket.js` | `TicketService` — `LOC-REG-SESSION-SEQ` numbering |
| `kz-policy.js` | `PolicyService` — discount ceilings, supervisor approval |
| `kz-stock.js` | `StockService` — universal movement ledger core |
| `kz-stock-sales.js` | `StockSalesAdapter` — POS posting on paid |
| `kz-locale.js` | `LocaleService` — whole-franc money, i18n |
| `kz-caps.js` | `CapabilityRegistry` — progressive disclosure / tiering |
| `kz-folio.js` | `FolioService` — hotel folio posting |
| `kz-setup.jsx`, `kz-profile.jsx`, `kz-parail.jsx` | shell components |

## Specs and plans (served at `http://localhost:5173/<file>`)

Register and stock:
- `Koomzo - Register Functional Spec.html`
- `Koomzo - Register Code Change Plan.html`
- `Koomzo - Module Register Audit.html`
- `Koomzo - Phone Compositions.html`
- `Koomzo - Register and Inventory Integration.html`
- `Koomzo - Stock Posting Implementation Plan.html`
- `Koomzo - Mobile Convergence Plan.html`

Inventory and products:
- `Koomzo Inventory - IA & Integration.html`
- `Koomzo Inventory - Simplification Review.html`
- `inventory/ACTIONS.md`

Platform and product:
- `Koomzo - Functional Specification.html` (+ Deck, + standalone)
- `Koomzo - Progressive Disclosure Approach.html` / `... Decisions.html`
- `Koomzo - Introduction Walkthrough.html` (+ Deck)
- `Koomzo MRP - IA & Market Fit.html`, `Koomzo Signage - IA and Capabilities.html`
- `Koomzo Queue - Requirements.md`
- `Retail POS - Brief Answers.html`, `Retail POS - Variants Reference.html`

Backend: `backend/ARCHITECTURE.md`, `backend/README.md`.

Some docs load `kz/kz-locale.js` and `spec/spec-data.js`, so they must stay at
`public/` root — do not move them into a `docs/` subfolder.

## Known open items (not yet in code)

1. Restaurant stock depletion is fire-time, not payment-time — spec written,
   adapter not wired.
2. Three seeded `kind:'sale'` rows in demo data must be dropped before anything
   sums the movement log.
3. `IV.onHand()` duplicates the platform core and should collapse into `kz-stock.js`.
