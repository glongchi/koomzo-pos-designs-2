# Stabilisation prompt — breaking the fix/re-break cycle

Paste the block below into Claude Code at the repo root
(`/Users/longchikanouo/repos/koomzodesignsystem`).

---

## Why the cycle exists (diagnosis to state up front)

Your pipeline is excellent **per section** and blind **across sections**. Five facts,
all already in your own docs:

1. `kz2-verifier` verifies *the section under change*. Nothing re-verifies the screens
   that section's shared components also feed.
2. `DECISIONS.md` D59 already states the rule — *"a change to a shared component is
   verified at EVERY caller; a defect found at one caller is checked at all of them"* —
   and nothing operationalises it. `.toFixed(1)` on restaurant + POS + mobile was caught
   by luck, not by a gate.
3. `TICKETS.md` names the hazard itself: T-S1/S2/S3/S6/S7a are **one shared component
   each, fixing many screens at once**, with a leverage note saying do them *before*
   the per-call-site P2s. Nothing enforces that order, so a local fix lands first, the
   shared fix lands later and undoes it.
4. `npm run test:ci` gates **compile, lint, money, karma**. It does not gate *rendered
   output*, so every visual and layout regression is invisible to the only gate that
   counts as green.
5. `fidelity-report/shots/` + `capture.sh` is already a whole-app screenshot corpus —
   the missing regression baseline exists and is simply not wired into the loop.

**The consequence:** a regression and a never-worked screen are indistinguishable, so
every fix round re-litigates the whole app from scratch. That is the cycle.

---

# THE PROMPT

> **Stabilisation pass — stop the fix/re-break cycle before fixing anything else.**
>
> Read `CLAUDE.md`, `docs/kz-migration-v2/DECISIONS.md`, `TASK.md §4`,
> `fidelity-report/TICKETS.md` and `docs/kz-migration-v2/PARITY-inventory.md` first.
> Use the `kz2-parity` and `koomzo-e2e` skills. Do **not** start fixing tickets yet.
>
> We are stuck in a loop: each fix round closes gaps and silently reopens others. I
> believe the cause is that verification is per-section while the breakage is
> cross-section — every fix to a shared component lands unverified at its other callers.
> Test that hypothesis, then build the three things that make it impossible, then fix.
>
> ## Phase 0 — Freeze a baseline (nothing gets fixed until this exists)
>
> 0.1 Bring up both servers via `preview_start` (`koomzo-ds` :4300,
> `koomzo-v2-source` :5173). Confirm `npm run test:ci` exit code — record it verbatim,
> including if it is non-zero. **Read the exit code, never grep the output (D56).**
>
> 0.2 Capture **every route in the app** — not the module under discussion — at both
> viewports (1440×900 desktop, 390×844 mobile), source and target, using
> `fidelity-report/capture.sh` or a refresh of it. Write to
> `.artifacts/baseline-<date>/`. Enumerate routes from `app-routing.module.ts` plus
> every module's `:view` slug table, **not** from memory or from `MODULE-INVENTORY.md`
> — a route the docs forgot is exactly where a regression hides.
>
> 0.3 Write `docs/kz-migration-v2/FROZEN.md`: one row per route × viewport, marked
> `VERIFIED` (parity-checked and passing), `KNOWN-GAP` (broken, ticketed, expected) or
> `UNVERIFIED` (never checked). **This distinction is the point of the whole phase.**
> Without it a regression and a never-worked screen look identical, which is why each
> round re-litigates the app.
>
> ## Phase 1 — Build the caller map
>
> 1.1 For every component in `src/app/shared/components/` and every token in
> `src/theme/`, list which routes render it. Grep for the selector *and* for
> hand-rolled equivalents — **auditing code and auditing output are different
> searches** (D65: `Synced` was a bare `<span>` on eleven screens and a component grep
> found two).
>
> 1.2 Write it to `docs/kz-migration-v2/CALLER-MAP.md`, and add the reverse index
> (route → shared components it depends on).
>
> 1.3 Make it non-optional: a spec or a script that fails when a shared component gains
> a caller not listed in the map. **A stale map decays silently with a green tick**
> (D52/D46) — the same failure class as the duplicated tax rule.
>
> ## Phase 2 — Re-order the fix queue by blast radius
>
> 2.1 Rewrite the `TICKETS.md` queue in dependency order, not priority order:
> **shared-component and token fixes first, per-call-site fixes last.** A P2 call-site
> fix that lands before its shared fix will be undone by it — that is the cycle
> mechanically, and your own leverage note already says so.
>
> 2.2 Resolve every ⚑ ticket needing a product decision **before** coding anything
> downstream of it. `T-S1` (icon rail vs flat sidebar) gates width on every screen and
> compounds `T-B3`; coding around an undecided ⚑ is re-work with extra steps.
>
> 2.3 For each shared fix, list its callers from the Phase 1 map **in the ticket**, and
> state which are `VERIFIED` in `FROZEN.md`. Those are the screens the fix must not
> regress, and they are the re-verification list.
>
> ## Phase 3 — Fix, with a blast-radius gate per change
>
> Per fix, in this order — and one fix per commit:
>
> 1. `npm run test:ci`, read `$?`.
> 2. **Behavioural re-verification at every caller** the map names: walk the spec's §5
>    interaction rows for those routes, not just the one you were fixing. Plus the four
>    axes that cross every screen — capability gating (§6), XAF locale (§8), offline
>    copy (§9), and theme re-skin through `green`/`azure`/`neutral` (D11).
> 3. **Visual re-verification at every caller**, both viewports, diffed against the
>    Phase 0 baseline. Classify each delta: *intended* (the fix), *token-level*
>    (acceptable, note it) or *structural* (**a regression — stop and report**).
> 4. Update `FROZEN.md`. A route you re-verified moves to `VERIFIED`; one you did not
>    re-verify **stays where it was** and does not silently inherit the fix's pass.
> 5. Commit. **Never batch two shared-component fixes into one commit** — when a
>    regression appears you must be able to name which one caused it.
>
> Stop conditions: a structural delta at a caller you did not intend to touch, or
> `test:ci` non-zero. Report, do not fix forward.
>
> ## Parity definitions — use these, don't improvise them
>
> **Behavioural parity** = for the same action, the same state change, the same derived
> numbers, the same gating, the same persisted shape. Verify by *driving both apps*,
> never by reading code. Includes: interaction rows pass at both viewports; capability
> tier/role/device/plan changes add and remove the same rail items; money is
> space-grouped zero-decimal XAF through one pipe; dates day-first, times 24-hour;
> French screens render French and the toggle survives reload; offline copy present and
> matching; `localStorage['kz.caps.v1']` same shape both sides.
>
> **Visual parity** = same structure, same hierarchy, same breakpoint behaviour, same
> token family. *Not* pixel identity. Structural deltas (missing element, different
> hierarchy, a breakpoint the target never switches at) are bugs; token-level deltas
> (spacing, radius, weight, tint) are notes.
>
> **The narrow-viewport exemption still holds (D68/R27):** resize the real window on
> both sides; leave the source's preview frame alone. A difference you can only produce
> inside that frame is not a finding. A breakpoint the target **never switches at all**
> is a finding.
>
> ## Deliverables
>
> 1. `FROZEN.md` — the route × viewport verification ledger.
> 2. `CALLER-MAP.md` — shared component ↔ route index, both directions, with its
>    staleness guard.
> 3. A re-ordered `TICKETS.md` with blast radius and re-verification list per ticket.
> 4. A commit per fix, each naming the callers re-verified.
> 5. `STABILISATION.md` — what regressed historically and which mechanism now prevents
>    each class.
>
> ## Additional observations — required, not optional
>
> My diagnosis above is a hypothesis from reading the skills and agents, not from
> driving the app. **I want you to disagree with it where the repo says otherwise.**
> Before you start Phase 1, and again at the end, report:
>
> - **Where my diagnosis is wrong.** If the cycle has a different root cause — stale
>   `ng serve` bundles (D49/D55), specs that recompute rules instead of calling them
>   (D59), fixture drift, a gate that cannot fail — say so and argue it. A wrong theory
>   costs more than a missing one.
> - **Regression classes I have not named**, and for each: is it *preventable by a
>   gate*, *preventable by ordering*, or *only findable by inspection*? The third
>   category is the one that needs a human decision about how much to care.
> - **Any decision in `DECISIONS.md` that is now contradicted by the code**, or that
>   two modules interpret differently. A locked decision the tree has drifted from is
>   worse than no decision, because it is trusted.
> - **Any place my proposed process is too heavy** — if re-verifying every caller of
>   `kz-status-badge` means seven screens per fix, tell me, and propose what to sample
>   instead and why that sample is sufficient.
> - **What you would do differently if this were your repo.** One paragraph, blunt.
>
> Do Phase 0 and Phase 1, then **stop and report before Phase 2.** I want to see the
> baseline and the caller map — and your disagreements — before any code changes.

---

## Notes for the human

**Why Phase 0 before any fix.** `FROZEN.md` is the artefact that ends the loop. Right
now "this screen is broken" carries no information about whether it *was ever working*,
so every round starts from zero. One ledger converts an open-ended re-audit into a diff.

**Why the caller map is a file and not a habit.** D59 is already the rule. It didn't
hold, because a rule that needs someone to remember the callers fails the first time the
list is long. The map makes it a lookup.

**Why `test:ci` stays as-is.** Screenshot diffing is not worth putting in the gate at
this stage — too brittle, too slow, and it would make the one trusted green signal
noisy. Keep it as a **phase gate** the agent runs per fix, not a commit gate.

**The one ⚑ worth deciding yourself, now:** `T-S1` — compact icon rail vs the current
flat labelled sidebar. It sets width on every screen, it compounds `T-B3`, and it is a
product call, not a parity call. If the flat sidebar is a deliberate Ionic adaptation,
saying so closes a P1 and downgrades everything hanging off it.
