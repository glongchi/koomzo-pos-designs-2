# Koomzo Queue — requirements

**Status:** draft for review · **Author:** design · **Date:** 14 Aug 2026

A configurable queue management system: one product that runs a salon's chairs, a
bank's counters, a kitchen's stations or a service centre's desks by
configuration rather than by code.

---

## 1. Why

Every counter-service business runs the same loop — *someone joins, someone is
called, someone is served, someone leaves* — but each one names it differently
and each one buys a different box to do it. Koomzo Queue models the loop once and
lets the business name it.

## 2. Scope

**In scope (v1):** ticket intake, lane assignment, calling and completion, a
read-only display, per-business configuration, offline peer-to-peer operation
between devices in one location.

**Out of scope (v1):** SMS/notification gateways, online/remote joining,
appointment scheduling (Koomzo Appointments already owns that), analytics beyond
today's counters, multi-site federation.

## 3. Domain model

The system has four objects. Everything else is a label.

| Object | Definition | Named in salon / bank / kitchen / support |
|---|---|---|
| **Lane** | A place where one item is served at a time | Chair / Counter / Station / Desk |
| **Item** | One unit of demand, identified by a ticket number | Client / Customer / Order / Visitor |
| **Category** | The kind of work, drives routing and expected duration | Service / Transaction / Course / Enquiry |
| **Device** | A physical screen running one mode | — |

**Item lifecycle:** `waiting → called → serving → done`, with
`no-show` (called, never arrived) and `transferred` (moved to another lane) as
terminal/branching states. State only moves forward; corrections are explicit
actions, never silent edits.

**Identity is the ticket number, not the person.** Numbers are
`<category code>-<sequence>` (`W-042`). A name is optional metadata for the
operator; the public display shows the number. This is a privacy requirement,
not a preference.

**Routing.** A category names the lanes that can serve it. `Call next` on a lane
takes the longest-waiting item the lane is allowed to serve, with priority items
first. No auto-assignment on intake — an unassigned item belongs to the pool,
which is what keeps lanes evenly loaded.

## 4. Device modes

One codebase, four modes; a device is set to one mode and stays there.

1. **Display** — read-only wall board. No input of any kind. Themed (§7).
2. **Serve** — the lane operator's console. Owns exactly one lane: call next,
   start, complete, no-show, transfer, pause. This is the "child application"
   that processes a lane.
3. **Intake** — the entry point. Creates items and hands out numbers.
4. **Supervise** — configuration and override: lanes, categories, business
   preset, display theme, and the ability to reassign or void any item.

Serve and Intake are **roles** (a person signs in and permissions follow);
Display and Supervise are **device states** (set once, PIN to leave).

## 5. Functional requirements

**Intake**
- F1 Create an item by picking a category; optional name/label, party size, note.
- F2 Mark an item priority (accessibility, appointment, escalation).
- F3 Show the issued number, position in line and expected wait on confirmation.
- F4 Never block on optional fields — a ticket must be obtainable in one tap.

**Serve**
- F5 Call the next allowed item for this lane; show the number prominently.
- F6 Advance state: start serving, complete, no-show, transfer to another lane.
- F7 Pause the lane (break) — paused lanes are skipped by routing and shown as
  paused on the display.
- F8 Show the operator their own counters for the session (served, average
  handling time).

**Display**
- F9 Show every open lane with its current item and status.
- F10 Show the next items waiting, with position and expected wait.
- F11 Announce a change of state visibly (a newly called number is emphasised).
- F12 Never scroll and never overflow: page the waiting list when it exceeds the
  space, and page on a fixed interval.
- F13 Prove liveness (a visible clock/heartbeat) so a frozen screen is obvious.

**Supervise**
- F14 Switch business preset; renames terms and loads that preset's categories
  and lanes.
- F15 Add, rename, pause and close lanes; set which categories each lane serves.
- F16 Set category code, colour and expected duration.
- F17 Choose the display theme.
- F18 Reset the day: clear finished items and restart numbering.

## 6. Offline & peer-to-peer

The system must work with no internet in a single location.

- N1 Every device holds the full day's state locally and remains usable alone.
- N2 Devices discover each other on the local network and replicate over a mesh;
  no device is a required server.
- N3 **Number allocation is collision-free by construction:** each intake device
  is granted a block of sequence numbers, so two devices cannot issue the same
  ticket even while partitioned.
- N4 Item state converges by last-writer-wins on a per-item basis, ordered by a
  logical clock; state transitions are monotonic so a late-arriving `waiting`
  can never overwrite a `done`.
- N5 Every device shows its sync state: peers connected, operations pending, and
  the time of the last successful exchange. A partitioned device says so.
- N6 Rejoining after a partition must not renumber, reorder or resurrect items.

## 7. Display themes

The display is the one screen a customer looks at, and rooms differ — a dark bar,
a bright bank branch, a kitchen line. v1 ships four themes, all built from Koomzo
tokens (no new colours):

| Theme | Use |
|---|---|
| **Midnight** | Dim rooms, TVs — dark surface, high contrast |
| **Daylight** | Bright branches — light canvas, hairline cards |
| **Brand** | Purple flood, for a branded lobby |
| **Contrast** | Accessibility-first: maximum contrast, largest type, no decoration |

Themes change surface, ink and accent only. Layout, sizes and behaviour are
identical across themes so a room can switch without retraining anyone.

## 8. Non-functional

- Q1 Any state change appears on every connected display within 2 seconds.
- Q2 Display legible at 5 m: current number ≥ 96px at 1080p, ≥ 40px on a 10"
  counter tablet; scales by container, not by breakpoint.
- Q3 Touch targets ≥ 44px on Serve and Intake; the display has none.
- Q4 A device recovers its state after power loss with no operator action.
- Q5 Accessible: WCAG AA contrast in every theme, no colour-only status.

## 9. Deliberate exclusions & risks

- **No voice announcements in v1.** They need per-market audio and are the
  single most complained-about feature when done badly.
- **No customer-facing wait promises beyond a rounded estimate.** Waits round up
  to the nearest 5 minutes; precision destroys trust the moment it slips.
- **No auto-assignment of items to lanes on intake.** It looks efficient and
  loads unevenly the first time someone takes a long job.
- **Risk:** a business with genuinely parallel service (one operator, many items
  at once — a kitchen pass) strains the one-item-per-lane rule. Kitchen preset
  mitigates with multiple stations; true parallelism is a v2 question.
