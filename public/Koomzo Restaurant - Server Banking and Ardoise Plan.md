# Koomzo Restaurant — Server Banking & Ardoise: design plan

Status: **PLAN. Not built.** These are the two D6 policies that the Gap Spec (G6)
splits into their own batch. Both change the money model, so they get designed
before anyone ports them.
Parents: `Koomzo Restaurant - Service Scenario Plan.md` (D6),
`Koomzo Restaurant - Production Gap Spec.md` (G3, G6).
Builds on: G3 day close (`restaurant/close.jsx`) and D6 server assignment
(`rk_order.server_id`). Both shipped in the prototype in this batch.

---

## 1 · Server banking

**Job.** Each server carries their own cash all shift (a float plus what they
collect at the table). At the end of the shift, each server's cash is counted
against what the system says they took. This is how most maquis already work.
Today the venue reconciles one till, so any shortfall can't be pinned on anyone.

### Model
| Collection | Fields |
|---|---|
| `rk_bank` | `id`, `loc_id`, `server_id`, `opened_at`, `float`, `closed_at`, `counted`, `expected`, `variance`, `closed_by`, `note` |
| `rk_bank_move` | `id`, `bank_id`, `kind` (float · sale · drop · payout · tip), `amount`, `ref`, `at`, `by` |

- When the policy is on, a **cash** payment posts a `sale` move to the paying
  server's open bank. MoMo, Orange Money and card do not; they go to the venue.
- **Drop:** a server hands excess cash to the supervisor during the shift. This
  needs both people's PINs.
- `expected = float + cash sales − drops − payouts`.

### Screens
1. **Start shift sheet** (the first sale of a shift when the policy is on): it
   asks for the float, with presets of 5 000, 10 000 and 20 000 FCFA. The
   supervisor confirms by PIN.
2. **My bank** (opened from the staff switch): a live expected-cash figure, the
   list of moves, and a **Drop cash** action.
3. **Server close** (a step in Day close): one row per server showing expected
   cash, a counted-cash input with a denomination counter, and the variance
   colour-coded (exact / over / short). Any short amount needs a note. This
   becomes a new blocker in Day close: *"2 servers not counted"*.
4. **Z-report:** a new *Cash by server* block. The owner's digest adds a line
   for the largest shortfall.

### Open questions
1. Does a server take payment for another server's table? (Recommended: no,
   unless a supervisor takes the table over. This reuses D6 takeover.)
2. Tips: are they kept by the server outside the bank, or posted as `tip` moves?
3. Short variance: is it only logged, or is it automatically recorded as a debt
   against the server?

---

## 2 · Ardoise (customer tab)

**Job.** A regular eats and drinks on credit and settles weekly or at
month-end. Today this lives in a paper notebook: no limits, no ageing, and
disputes.

### Model
| Collection | Fields |
|---|---|
| `customer` | Shared with the CRM: `id`, `name`, `phone`, `ardoise_limit`, `ardoise_on` |
| `ardoise_entry` | `id`, `customer_id`, `kind` (charge · payment · adjust), `amount`, `order_id`, `at`, `by`, `approver` |

- `balance = Σ charge − Σ payment ± adjust`. It is computed and never stored,
  so the authority stays the single source.
- **Charge to ardoise** is a tender in the charge sheet. It closes the table
  like any payment, but no money moves.

### Screens
1. **Charge sheet → Ardoise tender:** a customer picker (search by name or
   phone; create inline with name and phone only). It shows the balance, the
   limit and the balance after this bill. Going over the limit needs a
   supervisor PIN or remote approval (reuses `ApprovalBox`).
2. **Ardoise list** (a new rail item, or under Today): customers with a
   balance, sorted by age of the oldest unpaid charge, with ageing chips
   (0–7 / 8–30 / 30+ days).
3. **Customer statement:** the entries over time, a **Take payment** action
   (cash or MoMo against the balance), and **Send statement** over WhatsApp.
4. **Z-report:** an *Ardoise* block showing new credit given today, payments
   received and the total outstanding. Credit isn't counted as sales cash.

### Open questions
1. Is there a default credit limit when one isn't set? (Recommended: 0, meaning
   the owner must set one per customer.)
2. Can a server open a new ardoise, or only a supervisor?
3. Partial bills: can part of a bill go on the ardoise and the rest be paid in
   cash? (This needs split-tender support in the charge sheet.)

---

## 3 · Sequence

| Step | Work | Depends on |
|---|---|---|
| 1 | Server close step in Day close (count + variance) | G3 shipped |
| 2 | Start shift float + My bank + drops | 1 |
| 3 | Customer picker + Ardoise tender in the charge sheet | `customer` collection |
| 4 | Ardoise list + statement + take payment | 3 |
| 5 | Z-report blocks + digest lines for both | 1, 4 |

Design the two flows on the canvas first: the server-close count and the
ardoise tender. Those two are where the money rules live.
