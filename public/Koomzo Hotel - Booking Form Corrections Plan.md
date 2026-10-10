# Koomzo Hotel — New booking form: date, nights and deposit inputs

Status: **IMPLEMENTED** — see §Implementation and cross-validation at the end.
File: `Koomzo Hotel - Rooms, Folio & Housekeeping.html` → `hotel/ht-book.jsx` (`BookSheet`), `hotel/ht.css`.

## Today (as found in code)
| Field | Control now | Limit |
|---|---|---|
| Arrives | 7 chips: Today, Tomorrow, 18–22 Aug | Can't book beyond 6 days out |
| Nights | Chips 1 · 2 · 3 · 5 · 7 · 14 | No 4, 6, 10, 21 … |
| Security deposit held | Chips None · 50 000 · 100 000 · 150 000 · one period's rate | No other amounts |

Data stays as it is: `day` is an offset from today (0 = tonight), `nights` and `dep` are integers. The tape chart and rack already read any offset, so **no data-model change** is needed.

---

## C1 · Arrives: calendar button next to the quick chips
- Keep the 7 chips. Add a last chip, **`Pick a date`** (`calendar-outline` icon), that opens a **calendar popover** anchored to the chip. On a phone it opens as a bottom sheet instead.
- **Calendar:**
  - A month grid starting on Monday, with ‹ › month navigation.
  - Today is ringed. Past days are disabled. The range runs from today to 12 months ahead.
  - The **stay is previewed as a range** (arrival through departure) as you hover or pick, using the current Nights value.
  - Tapping a day sets the arrival and closes the popover.
- **After picking:** if the date matches a quick chip, that chip lights up. Otherwise the calendar chip itself shows the date, e.g. `Thu 3 Sep`, and stays selected.
- **Availability:** days where the **selected room** is already booked are struck through, and arriving on one is blocked. The check uses `st.stays` (`no`, `from`, `nights`) and must cover every night of the stay.
- **Departure line** under the field: `Departs Sat 5 Sep · 2 nights`.
- **Fix that comes with it:** dates now roll over months. Today, `HT.dayNo + d` would print "32 Aug". Every date label goes through one date helper built from `HT.today`.

## C2 · Nights: stepper beside the common options
- Layout: **[ − ] [ 3 ] [ + ]**, then the existing chips `1 2 3 5 7 14`.
- The **− / +** buttons are 44 px circles, the same style as the restaurant `kstep`.
- The **middle box is a number field.** Tap it to type a value directly. Range 1–365. An empty or invalid entry snaps back to the last valid value when you leave the field.
- **Chip sync:** a chip lights up when its value equals the current nights. Typing 4 lights no chip.
- **Weekly and Monthly plans:**
  - The stepper moves in whole weeks (±7) for Weekly. For Monthly it moves in months (±30), and the field shows `30 nights · 1 month`.
  - The note line already rounds weekly stays. That stays, and the plan makes it visible in the field.

## C3 · Security deposit held: same design, plus your own amount
- Layout: **[ − ] [ amount in FCFA ] [ + ]**, then the existing chips (None · 50 000 · 100 000 · 150 000 · *one period's rate*).
- **Amount field:**
  - It takes any whole FCFA amount, and **typing a value is the "non-common amount" input**.
  - It shows thousands separators (`75 000`) and an `FCFA` suffix.
  - Range 0–5 000 000.
- **− / +** step by **5 000 FCFA** and floor at 0.
- Chips light up when their value matches the amount. A typed amount like 75 000 lights none.
- The info note at the bottom adds `· deposit 75 000 held` when the deposit is above 0. The folio line `Security deposit taken` already uses `dep`, so nothing changes there.

## Shared component
A single `HtStepper({ value, onChange, min, max, step, format, suffix })` in `ht-parts.jsx`, used by both C2 and C3. A single `HtDatePop({ value, onPick, nights, blocked })` lives in the same file.

---

## Acceptance checks (for cross-validation after build)
1. **Arrives:** the 7 chips are unchanged. A **Pick a date** chip is present.
2. The calendar opens from the chip. On a phone-width frame it opens as a bottom sheet.
3. In the calendar, past days are disabled, today is marked, and ‹ › moves across months, including Aug → Sep.
4. Picking a date 3 weeks out shows that date on the calendar chip. The departure line is correct across the month boundary. Saving puts the stay on the tape chart at the right offset.
5. Picking tomorrow from the calendar lights the **Tomorrow** chip.
6. With room 205 selected, the nights of Yaoundé Delegation's booking (+6, 2 nights) are struck through and can't be picked.
7. **Nights:** − / + change the value by 1. Typing `4` works and no chip is lit. Typing `0`, `abc` or `400` snaps back to a valid value.
8. Tapping the **7** chip sets the field to 7, and + then gives 8.
9. On the Weekly plan, + moves the nights 7 → 14.
10. **Deposit:** typing `75000` displays `75 000 FCFA` and no chip is lit. + gives 80 000. − from 0 stays at 0.
11. Tapping **100 000** sets the field to that amount. The folio gets `Security deposit taken −75 000` after booking with 75 000.
12. All new buttons are at least 44 px. Nothing overflows the sheet at phone width.
13. No console errors. Existing booking flows are unchanged: walk-in check-in today, and the cases where bookings or deposits are switched off.

## Decisions (validated)
1. **Max nights:** configurable per tenant in Setup → Booking form: 30 · 90 · 180 · **365** (default).
2. **Deposit step:** configurable per tenant: 1 000 · **5 000** (default) · 10 000 · 25 000.
3. **Occupancy dots in the calendar:** yes. A toggle in Setup, on by default.
4. **Room chips follow the picked dates:** yes. A toggle in Setup, on by default.

## C4 · Setup → Booking form (added by decisions 1–4)
- A new panel at the top of Setup, shown when Bookings is on, with the four settings above.
- Saved per tenant: localStorage `kz:ht:bookcfg` in the prototype; `hotel_settings` on the tenant in production.

---

## Implementation and cross-validation

Files: `hotel/ht-parts.jsx` (date helpers, `HtStepper`, `HtDatePop`), `hotel/ht-book.jsx` (`BookSheet`, `BookingFormSetup`), `hotel/ht-app.jsx` (settings state, toast date), `hotel/ht.css`.

| # | Check | Result |
|---|---|---|
| 1 | 7 chips unchanged + **Pick a date** chip | Done |
| 2 | Calendar opens from the chip; phone = bottom sheet | **Deviation:** it opens inline under the chips at full width, not as a floating popover or bottom sheet. The booking form is already a sheet, and a floating layer gets clipped by the sheet's scroll. Same content and behaviour. |
| 3 | Past days disabled · today ringed · ‹ › across months | Done (range today → +365) |
| 4 | Date 3 weeks out on the chip; departure across the month boundary; tape chart offset | Done (`htDay` / `htShort` from `HT.today`) |
| 5 | Calendar tomorrow lights **Tomorrow** | Done (days 0–6 map to the quick chips) |
| 6 | Room 205: Yaoundé nights struck and not pickable | Done. Arrivals that would overlap a later booking are also disabled. |
| 7 | Nights − / +, type 4, bad input snaps back | Done (range 1 → tenant max) |
| 8 | Chip 7 then + → 8 | Done |
| 9 | Weekly: + moves 7 → 14 | Done. Monthly moves ±30. **Addition:** the chips change with the plan (Weekly 7·14·21·28, Monthly 30·60·90), and switching plan rounds the nights to that unit. |
| 10 | Deposit 75000 → `75 000 FCFA`, + → 80 000, − floors at 0 | Done (step from Setup) |
| 11 | Deposit chip sets the field; folio shows the deposit | Done (existing `dep` path unchanged) |
| 12 | 44 px targets; no overflow at phone width | Steppers and calendar days are 44 px. Existing chips stay at 30 px (unchanged). |
| 13 | No console errors; walk-in and gated-off flows unchanged | Out for verification |
| — | Room chips follow dates (decision 4) | Done. The label reads "N free from {date}". A selected room that clashes shows a warning and blocks Save. |
| — | Booking toast date | Now uses the same helper (no more "32 Aug") |
