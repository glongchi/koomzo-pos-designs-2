# Koomzo User Guide — Edition 2: seven more modules (plan)

Status: **BUILT. All batches done.** See §11 for what was delivered and the cross-check.
Extends: `Koomzo User Guide.html` (EN) · `Koomzo Guide utilisateur.html` (FR) · `guide/` (css, js, img).
Follows: `Koomzo User Guide - Plan.md` (edition 1, Restaurant & Bar) and `guide/README.md` (how to add a module).
New modules: **Hotel · Gym · Salon · Inventory · Queue · Signage · Retail Flex.**

---

## 1 · What edition 1 established, and what is kept unchanged

| Rule from edition 1 | Kept as |
|---|---|
| Written for the **prospect first**; staff task cards come from the same content | Same, for every module |
| **Platform chapters (P1–P6) written once**; each module guide links to them, never repeats them | Same. One new chapter, **P7**, is added (see §4) |
| The same **6-part template** for every module | Same, plus the printable **staff cards** that edition 1 added |
| **Lite · Mid · Full** tier tags on every heading, matching the product | Same. Tiers are taken from `kz/kz-caps.js` (the source of truth), not invented |
| A **"Available soon"** tag on anything the prototype only simulates | Same, with a per-module honesty audit (§6) |
| Real **prototype screenshots** with numbered pins | Same, roughly 5 per module (§7) |
| **EN and FR mirrored section for section**, with the same `id`s | Same. Both languages ship in the same batch |
| **FCFA**, local names, local vocabulary | Same: *taxe de séjour, CNI, abonnement, tontine, ardoise, caisse* |

**Template, per module:** 1 Is this for me? · 2 Set up · 3 Run the day · 4 Screens · 5 When something goes wrong · 6 Go further · Staff cards.

---

## 2 · Architecture: one guide per module, a shared shell

Edition 1 is a single 380-line page. Seven more modules at the same depth would make it about 2 000 lines per language. That is too slow on a phone over 3G, and the page would no longer be maintainable.

**Recommendation: a guide hub plus one page per module, both languages.**

```
Koomzo User Guide.html                  ← hub: Welcome · tiers · Platform P1–P7 · module picker
Koomzo User Guide - Restaurant.html     ← moved out of the hub, otherwise unchanged
Koomzo User Guide - Hotel.html
Koomzo User Guide - Gym.html
Koomzo User Guide - Salon.html
Koomzo User Guide - Inventory.html
Koomzo User Guide - Queue.html
Koomzo User Guide - Signage.html
Koomzo User Guide - Retail Flex.html
(+ the same 9 files in French: Koomzo Guide utilisateur[ - Module].html)
guide/guide.css · guide/guide.js        ← shared (exists)
guide/anim.js                           ← NEW shared animation engine (§5)
guide/img/<module>-*.jpg                ← screenshots
```

- The **top bar module switcher** links between the pages. Today the six "Soon" chips are dead.
- The **sidebar** on a module page shows that module's parts, plus one "Platform" link back to the hub.
- **EN/FR switch:** each page links to its twin.
- **Publish:** `publish/` gets one bundled file per page. The existing `index.html` and `fr.html` become the hub.
- **Old links keep working:** the hub keeps the `#rk…` anchors as redirects to the Restaurant page.

*Alternative:* keep one page and load module sections on demand. That breaks print and offline bundling, and makes the French mirror harder. Not recommended.

---

## 3 · Module guides: content outline

Each module below lists the sample business (taken from the prototype data, so screenshots and text agree), the tier ladder from `kz-caps.js`, the day flow, the screens, the troubleshooting cards, and the **signature animation**.

### 3.1 Hotel: *Bilongue Suites & Lodge, Douala*
- **Is this for me?** Small hotel, auberge or motel · apartments and furnished flats · lodge (both). These match the prototype's property shapes.
- **Lite:** room rack, reservations, guest records, housekeeping, roster.
  **Mid:** folio, rates, availability grid, maintenance and off-sale, charges from the restaurant to the room, OTA bookings entered by hand, statutory guest register and *taxe de séjour*, pre-arrival card over WhatsApp, shift board.
  **Full:** deposits and damage, long stays, night audit, occupancy/ADR/RevPAR, stay restrictions.
  **Pro:** channel sync.
- **Day flow:** morning departures → housekeeping turns rooms round → walk-in at the desk (new booking: calendar, nights, deposit) → arrivals with pre-filled cards → restaurant charges to the room → evening police register → night audit → day closed.
- **Screens (6):** Room rack · New booking (the new calendar, nights counter and deposit field) · Folio · Housekeeping (phone) · Pre-arrival · Night audit.
- **When something goes wrong:** guest without a CNI · double booking from an OTA · power cut during night audit · damage found at checkout · room out of order with a guest arriving.
- **Signature animation: "One room, one day."** A single room tile cycles through its states: *Vacant ready → Arriving → Occupied → Charges post (restaurant, bar, laundry) → Departs → Dirty → Cleaning → Inspected → Ready*. Each state is narrated with who acts and on which device.

### 3.2 Gym & Wellness: *Bonapriso Athletic & Wellness*
- **Is this for me?** Gym, fitness studio, pool and spa club, corporate wellness.
- **Lite:** front desk admit, member register, live capacity, class timetable.
  **Mid:** gate and zone access, personal training, session packages, member wallet (MoMo top-up), juice bar and pro shop, freeze and transfer, corporate accounts, lockers, equipment log, WhatsApp reminders.
  **Full:** charge to account, trainer commissions, payout ledger (SYSCOHADA), retention and churn.
- **Day flow:** 05:30 opening rush → scan to admit (works offline) → plan expired at the gate → renew by MoMo → class fills → PT session signed → juice bar on the wallet → corporate seats checked → evening capacity peak → month-end commissions.
- **Screens (5):** Front desk · Members · Timetable · Bar & wallet · Trainers / My pay.
- **When something goes wrong:** the internet is down at the 06:00 peak · a member says they paid · a corporate seat limit is reached · a trainer disputes their commission · the turnstile is offline.
- **Signature animation: "Admitted in a blink."** A member's QR is scanned. Verification happens on the device in about 120 ms, with a ticking counter. The zone lights up, capacity increments, then the internet is cut (the toggle is reused from P2) and the next scan still admits.

### 3.3 Salon: *Salon Lumière, Bonapriso*
- **Is this for me?** Hair salon, barber, beauty and nails, spa.
- **Lite:** appointment book, take payment, services.
  **Mid:** prepare and send to the stylist, team, opening and closing tasks.
  **Full:** timesheet, commission, back-bar consumption, self check-in kiosk, queue display.
- **Day flow:** open with the checklist → today's book → a walk-in fitted between bookings → the service is sent to the stylist → products sold at the chair → paid by MoMo → rebook → close with tasks and hours.
- **Screens (5):** Today · Book (calendar) · Sell · Tasks · Team / Hours.
- **When something goes wrong:** a client is late and the next one is waiting · a stylist is absent · a colour job overran · a price dispute at payment · stock of a product ran out.
- **Signature animation: "Fitting a walk-in."** The day grid for three stylists. A walk-in arrives, Koomzo finds the gap, the block drops into place, the queue display shows *"Next: Thomas"*, and payment closes the block.

### 3.4 Inventory: shared by every module that sells goods
- **Is this for me?** Anyone with stock: shop, bar drinks, salon products, pharmacy, hardware.
- **Lite:** items (catalogue), movement log.
  **Mid:** reorder points, partner directory, services.
  **Full:** purchase orders, counts, bundles and recipes, valuation and COGS, batch and expiry, serials.
  **Pro:** multiple locations, transfers.
- **Day flow:** delivery arrives → receive against the order → shelf → sales deplete it (from Retail, Restaurant, Salon) → low stock warns → reorder → weekly count → variance posted.
- **Screens (5):** Items · Stock · Orders · Count · Reports.
- **When something goes wrong:** stock went negative · the count doesn't match · a supplier delivered short · an expired batch was found · a sale was made while offline on two devices.
- **Signature animation: "Where a crate goes."** A stock bar for one item (a Castel crate, 24 bottles): *+24 received → −1 per sale, from two tills → reorder line crossed, amber → count finds −2 → variance → PO raised*. The ledger rows appear alongside, one per movement.
- **Links:** the *Recipe and Depletion Model* explains the restaurant side. A plain-language "depletion ladder" box is included.

### 3.5 Queue: *banks, clinics, administration, salons, kitchens*
- **Is this for me?** Any place where people wait. The prototype's presets are used as the four examples: salon, bank branch, kitchen pass and public office.
- **Lite:** call next, multiple lanes.
  **Mid:** service categories, wall display.
  **Full:** supervise, SLA reporting, SMS notify.
- **Day flow:** set up counters and categories → open → tickets taken at intake → wall display → *Call next* on a counter → recall or no-show → priority customer → the supervisor rebalances lanes → end-of-day waiting times.
- **Screens (5):** Intake · Serve · Display · Supervise · Setup.
- **When something goes wrong:** a counter closes with people waiting · a customer missed their number · the display TV is off · a priority customer arrives (elderly, pregnant) · the power went off.
- **Signature animation: "Ticket to counter."** Ticket **W-042** is printed, joins the line, rises up the wall display, gets *"Counter 2 · please come forward"* with a chime pulse, and a waiting-time bar fills against its target.

### 3.6 Signage: *every screen the business runs*
- **Is this for me?** Restaurants (menu boards), shops (price and promo screens), hotels (lobby and rate card), queue display.
- **Lite:** screens, playlists, media library, price and menu boards.
  **Mid:** zones and templates, schedules and dayparting, screen groups, now serving, promo ticker, notice board, idle handover.
  **Full:** wayfinding and rate card, publish approval, screen takeover, proof of play.
  **Pro:** multi-site publishing.
- **Day flow:** pair a TV (Android stick) → assign a playlist → the menu board reads prices from the till → breakfast until 11:00, then lunch → happy hour from 17:00 → an urgent takeover message → proof of play.
- **Screens (5):** Screens · Playlists · Board editor · Schedule · Takeover.
- **When something goes wrong:** the TV shows the wrong menu · a price changed but the board didn't · the TV lost Wi-Fi (it keeps playing its last loop) · a promo is still showing after it ended.
- **Signature animation: "Change once, every screen updates."** The price of *Poulet DG* is edited on the till. The change travels to three mini-TVs in turn (menu board, promo strip, kiosk idle loop). A clock then sweeps 10:59 → 11:00 and the board swaps breakfast for lunch.
- **P6 in the hub** becomes a short teaser linking here.

### 3.7 Retail Flex: *one register, shaped to your shop*
- **Is this for me?** The register presets from the prototype: Grocery and convenience · Clothing · Hardware · Electronics and repair · Pharmacy · Salon retail · Bakery and deli · Beauty.
- **Lite:** register, sales history, stock.
  **Mid:** categories, open tickets, returns, prepare and send, customers.
  **Full:** shift and cash drawer (Z), manager discounts, several registers.
- **Day flow:** open the shift with a float → scan or search → a customer steps away, so park the ticket → return or exchange → MoMo plus cash → discount above the threshold, so ask the manager → close the shift, count the drawer → Z-report.
- **Screens (6):** Register · Open tickets · Returns · Customers · Shift & drawer · Setup (preset picker).
- **When something goes wrong:** the drawer is short at close · the barcode won't scan · a return comes without a receipt · the price on the shelf differs from the till · a customer pays half MoMo, half cash.
- **Signature animation: "Same register, eight shops."** One register frame morphs through the presets: the tiles, the entry mode (scan, grid or search), the variant picker (size × colour, strength × form) and the quick keys change. The caption names the shop each time.

---

## 4 · Platform: one new chapter

**P7 · Modules working together** (Mid), in the hub, with one animated diagram:
- Restaurant → *Charge to room* → Hotel folio
- Retail, Restaurant and Salon sales → Inventory depletion
- Queue and Salon → Signage *Now serving*
- Gym bar → member wallet
- Everything → one day close per location

This is the place a prospect sees that Koomzo is one system. Each module guide links to it instead of re-explaining the links.

---

## 5 · Animated visuals: approach

**Format.** Edition 1 already has one: the P2 devices loop, driven by `guide/guide.js`. All new animations come from **one small shared engine, `guide/anim.js`**: a step sequencer over plain HTML and CSS. Each animation declares its steps, captions (EN and FR) and the CSS classes to switch on.

- Every animation has **controls**: ▶ play / ❚❚ pause · ‹ › step · a step counter "3 / 9". It plays automatically only when on screen (IntersectionObserver), so the page doesn't burn battery.
- **Reduced motion:** shows the steps as a static numbered strip, with no movement.
- **Print and PDF:** prints the final state plus the numbered caption list, so the paper version keeps the story.
- **Performance budget:** CSS transforms and opacity only, no video or GIF. Under about 8 KB per animation, and it runs smoothly on a 2019 Android phone.
- **Look:** Koomzo tokens only (purple primary, green for money, coral for voids and blocks, amber for warnings). Each one is built from simplified real UI parts (room tile, ticket, stock bar) rather than illustration, so it reads as the product.
- **Count:** 7 signature animations (one per module) plus P7. Two optional extras, to be confirmed in decision #5: Hotel's *booking calendar* and Retail's *park and resume ticket*.

These are explainer loops inside a document, so a timeline-video engine isn't used. If you later want **exportable videos** for WhatsApp or social media, the same storyboards can be rebuilt as timed animations. See decision #6.

---

## 6 · Honesty audit: "Available soon"

Before writing each module, every feature mentioned is checked against the prototype. Anything simulated gets the tag. Known so far:

| Module | Tag as "Available soon" |
|---|---|
| Hotel | Channel sync (Pro) · pre-arrival WhatsApp delivery · card payment terminal |
| Gym | Physical turnstile and wristband hardware · WhatsApp reminders delivery |
| Salon | Self check-in kiosk on a separate tablet (if it's only a preview) |
| Inventory | Multi-location transfers sync between sites |
| Queue | SMS notify · printed ticket hardware |
| Signage | Android TV player app pairing · proof of play from real players |
| Retail Flex | Scale and barcode printer hardware · several registers on a local network (P4) |
| All | Local network hub (P4), as in edition 1 |

---

## 7 · Screenshots

About **38 new screenshots**: 5–6 per module, captured from the prototypes at desktop width, plus 1–2 phone captures per module where the job is done on a phone (housekeeping, front desk, serve, register). They're stored as `guide/img/<module>-<screen>.jpg`. Each gets 3–6 numbered pins and a matching callout list, the same as edition 1.

Captures are taken after the prototype fixes in flight. Hotel, for example, is captured with the new booking form.

---

## 8 · Build order

| Batch | Content | Why this order |
|---|---|---|
| **0** | Split the guide into hub + Restaurant (EN and FR), add `anim.js`, port the P2 loop onto it, add P7 | The template has to exist before seven modules use it |
| **1** | **Hotel** and **Retail Flex** | The largest buyer segments. Hotel also links to Restaurant through charge to room |
| **2** | **Inventory** and **Signage** | Shared by every module. They make P7 real |
| **3** | **Salon** and **Gym** | Appointment and member businesses |
| **4** | **Queue** | Stands alone for banks and offices; links to Salon and Signage |
| **5** | Re-bundle `publish/`, cross-link pass, QA | |

Each batch ships **EN and FR together**, as `guide/README.md` requires. You review after each batch.

---

## 9 · Acceptance checks (for cross-validation after each batch)

1. Every module page has the 6 parts plus staff cards, in the same order, with the same sidebar shape as Restaurant.
2. Every heading has a Lite/Mid/Full tag that matches `kz-caps.js`. Every simulated feature has "Available soon".
3. EN and FR pages are section-for-section identical, with the same `id`s. The language switch lands on the twin section.
4. The module switcher links all 8 modules on every page. No dead "Soon" chips remain.
5. Each signature animation plays, pauses and steps, pauses off-screen, shows the static strip under reduced motion, and prints its final state with captions.
6. Screenshots match the text: the same names, amounts and buttons as the prototype.
7. No page is over 1 000 lines. Each page loads in under 2 s on throttled 3G.
8. Platform content is never repeated inside a module; it is linked.
9. The bundled `publish/` files open offline, and the language and module links resolve under the published names.

---

## 10 · Decisions needed

1. **Architecture:** hub + one page per module (recommended), or keep a single long page?
2. **Languages:** EN and FR in the same batch (the current rule), or EN for all seven first and then FR in one pass? That would be faster to review, but the two are out of sync for a while.
3. **Order:** Hotel and Retail Flex first (recommended), or another priority from your sales pipeline?
4. **Depth:** same depth as Restaurant for every module (about 150 lines each), or a **lighter guide** for Queue and Signage (Parts 1, 3, 4 and staff cards only)?
5. **Animations:** one signature animation per module plus P7 (recommended), or also the two optional extras?
6. **Video export:** do you want the animations as MP4 for WhatsApp and social media later? If so, I'll storyboard them so they can be converted.
7. **Sample businesses:** keep the prototype names (Bilongue Suites, Bonapriso Athletic, Salon Lumière…), or rename them to match a real pilot customer?
8. **Retail Flex presets:** cover all 8 shop types, or only the 3–4 you sell most? Grocery, pharmacy and hardware are the likely ones in West Africa.

---

## 11 · Decisions taken and progress

**Decisions:** a hub plus one page per module · EN and FR together in every batch · order: Hotel + Retail Flex → Inventory + Signage → Salon + Gym → Queue · same depth for every module · one animation per module plus P7 · no video export · the prototype's example names · Retail Flex covers 7 shop types (all except Clothing).

| Batch | Status | Delivered |
|---|---|---|
| 0 | Built | Hub + Restaurant page (EN/FR) · `guide/anim.js` + `anim.css` · P7 *Modules working together* with its animation · Module guides cards · page-aware links in `guide.js` · old `#rk` links forward |
| 1 | Built | Hotel (EN/FR, 6 screens, animation *One room, one day*) · Retail Flex (EN/FR, 6 screens, animation *Same register, seven shops*) |
| 2 | Built | Inventory (4 screens, *Where a crate goes*) · Signage (3 screens, *Change once, every screen updates*) |
| 3 | Built | Salon (3 screens, *Fitting a walk-in*) · Gym (2 screens, *Admitted in a blink*) |
| 4 | Built | Queue (1 screen + mode cards, *Ticket to counter*) |
| 5 | Built | Every module live in the top bar, hub sidebar and Module guides cards · 18 bundled pages in `publish/` (`index`, `fr`, `<module>`, `fr-<module>`) |

### Cross-check against §9
1. Six parts plus staff cards on every module page, same sidebar shape — **yes**.
2. Lite/Mid/Full tags taken from `kz-caps.js`; simulated features tagged *Available soon* — **yes**.
3. EN and FR mirrored with identical `id`s; the language switch keeps the section — **yes**.
4. All 8 modules linked on every page; no "Soon" chips remain — **yes**.
5. Animations: play, pause, step, off-screen pause, reduced-motion strip, print captions — **yes**, one engine.
6. Screenshots match the text — **yes**. Fewer than the planned 5–6 on some modules (§12).
7. No page over 1 000 lines (largest 258) — **yes**.
8. Platform content linked, not repeated — **yes**.
9. Published files open offline; links resolve under published names — **yes**, rewritten by `guide.js`.

## 12 · Deviations and follow-ups
- **Fewer screenshots** where the prototype couldn't be driven to the screen: Signage 3 (the *Schedule* view renders blank — a prototype bug to fix), Salon 3, Gym 2, Queue 1 (the Display opens full screen; Intake, Serve and Supervise are described as cards). Recapture once those screens are reachable.
- **Signage screenshots** show French labels, because the prototype's content is in French.
- **Queue** uses the bank-branch preset in its animation; its screenshot is the salon preset.
