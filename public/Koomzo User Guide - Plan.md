# Koomzo User Guide: plan

Status: **plan for review. Nothing written yet.**
First module: **Restaurant & Bar** (`Koomzo POS - Restaurant & Bar.html`).
Companion to `Koomzo - Functional Specification.html`. That spec is for the team
building Koomzo. This guide is for the people who run a restaurant on it, and
for sales and marketing to show to potential customers.

---

## 1 · Who reads it, and what that changes

| Reader | What they need | So the guide… |
|---|---|---|
| **Prospect** (owner of a maquis, snack, bar or hotel restaurant), shown it by our marketing team | "Can this run *my* place, and is it easy?" | Opens with a day in their restaurant, not a feature list. Plain words, real screens. |
| **Owner or manager**, during setup | "What do I do first?" | Gives a setup checklist they can finish in about an hour. |
| **Server, cashier, cook** | "How do I do my job on this screen?" | Gives one short task card per job, which can be printed and pinned up. |

**Recommendation:** write for the prospect first. If the guide sells clearly, it
will also teach clearly. Staff task cards come from the same content.

---

## 2 · Structure: one guide that grows by module

A shared **Platform** part, written once, plus one **module guide** per
business type. Restaurant & Bar is first. Retail, Grocery, Salon, Gym, Hotel and
Inventory are added later in the same layout, without changing what is
already there.

```
Koomzo User Guide
├── Welcome                       — what Koomzo is, how to read this guide
├── Platform (shared by every module)
│   ├── P1 Getting started        — account, business, location, users & PINs
│   ├── P2 Devices                — phone, tablet, laptop; which device for which job
│   ├── P3 Working offline        — everything saves on the device first
│   ├── P4 Several devices together (local network: hub & clients)
│   ├── P5 Payments               — cash, MoMo / Orange Money, card, split
│   └── P6 Digital signage        — menu boards and screens
└── Module guides
    └── Restaurant & Bar          ← first
        (Retail, Grocery, Salon, Gym, Hotel, Inventory… later)
```

Each module guide follows the same 6-part template, so a reader always knows
where to look:

1. **Is this for me?** Business types covered, and what a day looks like.
2. **Set up**: the checklist.
3. **Run the day**: the business flow, step by step.
4. **Screens**: one page per screen.
5. **When something goes wrong**: real situations and what to do.
6. **Go further**: Plus and Pro features, shown as a ladder.

---

## 3 · Progressive disclosure: Lite first, then more

Same principle as the product. The opening chapters cover **only what you need
to open the doors and take money**. Everything else sits in *Go further*,
marked with a tier tag.

| Tag | Meaning in the guide |
|---|---|
| **Essentials** | Needed to run service. Covered in parts 1–5. |
| **Plus** | Turn it on when you're ready. Covered in part 6. |
| **Pro** | For larger or multi-site venues. Covered in part 6. |

Restaurant & Bar, by tier:

| Essentials | Plus | Pro |
|---|---|---|
| Choose a layout preset; menu & prices; stations | Floor editor (drag tables, areas) | Several locations |
| Register: take an order, send to kitchen, take payment | Move, join & split tables | Variance & waste reports |
| Floor: seat, bill, clear | Courses & fire by course | Owner remote approval |
| Kitchen screen: Ready → Served | Void rules & manager PIN | Recipes, prep batches |
| Cash + MoMo, split bill | Kiosk mode | |
| Works offline on one device | Several devices on Wi-Fi | |
| | Menu board on a TV (signage) | |
| | Stock for drinks (direct) | |

**Recommendation:** keep Essentials to **under 15 minutes of reading**. If a
section needs more than that, it belongs in Plus.

---

## 4 · Restaurant & Bar guide: contents

### Part 1 · Is this for me?
- Four venue types with one sentence each: maquis/small restaurant, restaurant,
  bar/lounge, snack, and hotel restaurant. These match the setup presets.
- **"A day at Chez Mama Ngono"**: one illustrated walk through a single day, from
  opening to closing. This is the page marketing will show first.

### Part 2 · Set up (Essentials)
A numbered checklist, about 1 hour:
1. Create the business and location (Platform P1)
2. Add staff and their PINs
3. **Choose a layout**: Maquis (Salle + Terrasse) is the default. Set the number of tables.
4. Add the menu: categories, dishes, prices, which station each dish goes to
5. Choose payments: cash, MoMo, Orange Money
6. Choose your devices: one device, or a hub plus phones (Platform P2, P4)
7. Do a test order end to end

### Part 3 · Run the day (the business flow)
Written as the real sequence, with the screen used at each step:

| Moment | What happens | Screen |
|---|---|---|
| Before opening | Turn on the hub, check devices are connected, open the shift | Hub / Register |
| Guests arrive | Seat the party, number of guests | Floor |
| Order | Take the order at the table on a phone, or at the till | Register |
| Kitchen | Order appears by station; cook marks Ready, then Served | Kitchen screen |
| Changes | Guest changes their mind: void with a reason; add items | Register |
| Table moves | Party moves to the terrace; two tables join | Floor |
| Bill | Request the bill, split by item, pay cash and MoMo | Register |
| Close table | Table cleared; kitchen screen clears itself | Floor |
| Counter / kiosk | Customer orders on the kiosk; pays at the counter or by MoMo | Kiosk |
| Power or internet cut | Keep working; everything sends later | All |
| Closing | Close the shift; check today's voids | Setup → Service rules |

### Part 4 · Screens
One page each, in the same layout every time: what it's for, the screen
annotated with numbered callouts, the 3–5 tasks done on it, and tips.

- **Register**: order, send, void, move, pay
- **Floor**: table colours, seat, bill, clear, move/join
- **Kitchen screen**: lanes, stations, Ready/Served, VOID and CHANGED badges, *Seen*
- **Kiosk**: customer flow, starting and leaving kiosk mode, idle reset
- **Setup**: floor plan, service rules, modules

### Part 5 · When something goes wrong
Short question → answer cards:
- *The power went off in the middle of service.*
- *The internet is down, and a guest wants to pay by MoMo.*
- *The hub phone died.*
- *A guest left before their food came out.*
- *The cook forgot to tap Served.*
- *We entered an order at the wrong table.*
- *A server says they didn't void that item.*

### Part 6 · Go further (Plus and Pro)
One card per feature: what it does, who it's for, and how to turn it on.

### Platform chapters used by this guide
- **P3 Working offline**: one picture showing that each device saves first, then sends.
- **P4 Several devices together**: hub, clients, joining with a QR code, what
  happens when the hub goes off. Uses the 8 screens in
  `Koomzo - Local Network (Hub and Clients).html`.
- **P6 Signage**: put the menu on a TV. The board updates when a price changes,
  and can show a breakfast menu in the morning and a lunch menu later. Uses the
  Signage module's playlists (`signage/`).

---

## 5 · Format

| Choice | Recommendation |
|---|---|
| Medium | **One HTML document** in the style of the Functional Specification: sticky side navigation, a module switcher, printable. Later, a **sales deck** cut from Part 1 + Part 3. |
| Screens | **Real screenshots from the prototype**, with numbered callouts. No drawn mock-ups. |
| Language | **English first, built so a French version can follow.** French is essential for Cameroon (FR/EN), Côte d'Ivoire and Senegal. Recommend French as the next version straight after. |
| Words | Restaurant vocabulary the reader uses: *maquis, terrasse, addition, emporter, ardoise*. Amounts in **FCFA**. Local names and dishes in the examples (Ndolé, Poulet DG, Bissap). |
| Print | Staff **task cards** (one A5 page per job: server, cashier, cook), printable from the same content. |
| Tier tags | *Essentials · Plus · Pro* chips on every heading, matching the product's tiers. |

---

## 6 · Honesty about what's built

The prototype shows some features through stand-ins:
- the local network hub
- printing to the kitchen
- owner approval by phone
- stock

A sales document must not promise what doesn't ship.

**Recommendation:** each such feature gets a small **"Available soon"** tag in
the guide. The list follows the Production Gap Spec (G1–G8) and is updated as
those land. Alternatively, describe them only in Part 6 until they ship.

---

## 7 · Decisions needed

1. **Main reader:** prospects first, with staff task cards from the same content? (recommended)
2. **Tier names:** *Essentials · Plus · Pro*, or match the commercial plan names (Lite · …)?
3. **Language:** English first, then French? Or French first?
4. **Not-yet-built features:** an "Available soon" tag, or keep them out of the Essentials part entirely?
5. **Sample venue:** a fictional maquis in Douala ("Chez Mama Ngono"), or a real pilot customer?
6. **Sales deck:** make it now from Part 1 + Part 3, or after the guide is approved?
7. **Screenshots:** are the current prototype screens good enough to show customers, or do some need polish first?
