# Koomzo — Templates, Dish Photos & Customer Display — Production Gap Spec

**Target:** `~/repos/koomzoapps` (Ionic 8 · Capacitor 8 · Angular 19, full backend)
**Source of behaviour:** the React prototype. UI and rules are final there — port, don't redesign.
- Template Library — `kz/kz-templates.js`, `kz/kz-templates-admin.jsx`, `restaurant/template-pick.jsx` · plan `Koomzo - Template Library Plan.html`
- Dish photos + CSV menu — `restaurant/menu-setup.jsx` (`DishArt`, `PhotoField`, `msParseCsv`, `msPlan`)
- Customer display (CFD) — `kz/kz-cfd.js`, `kz/kz-cfd-ui.jsx`, `kz/kz-cfd-display.jsx`, `kz/kz-charge.jsx` · plan `Koomzo - Customer Display Plan.html`

**Parent specs:** `Koomzo Restaurant - Production Gap Spec.md` (ground rules §0 apply unchanged: local-first, one `sync_outbox`, idempotent keys, authority confirms, every rule is a policy), `Koomzo Link - Local Network Plan.md`.

This spec lists only what the prototype **could not** build — no backend, no device APIs, no real network. Each item names the prototype stand-in it replaces and the acceptance line it closes.

---

## T1 · Template Library on the platform backend

**Prototype:** `localStorage['kz:tpl:v1']` shared by the Control Centre and every venue in one browser. Closes plan A10 “Pass · prototype”.

### Collections (platform scope, not tenant scope)
| Collection | Key fields | Notes |
|---|---|---|
| `pf_template` | `id`, `kind` (menu · floor), `name`, `description`, `venue_types[]`, `locale`, `currency`, `status` (draft · published · archived), `version`, `pair_with`, `updated_by`, `updated_at` | Platform-owned. Tenants read only `status = published`. |
| `pf_template_version` | `template_id`, `version`, `content` (JSON), `published_by`, `published_at` | **Immutable.** A publish writes a new row; customers copy the latest. |
| `pf_template_draft` | `template_id`, `content`, `dirty`, `updated_by` | One working copy per template; never visible to tenants. |
| `rk_template_use` | `tenant_id`, `loc_id`, `template_id`, `version`, `kind`, `mode` (replace · add), `applied_by`, `applied_at` | Written by the tenant; drives “Used by N”. |

### Rules
- **Role `template_editor`** (Koomzo staff) is the only writer of `pf_*`. Tenants have read on published versions.
- `POST /v1/platform/templates/:id/publish` runs the same checks as `KZ_TPL.check()` server-side and returns the reasons on refusal.
- Applying a template is a **copy on the tenant**: the client reads one `pf_template_version`, writes `rk_menu_item` / `rk_category` / `rk_floor` rows with new ids, and records `rk_template_use` in the same op group. No foreign key from tenant data to `pf_*`.
- Content `currency` must equal the tenant currency or the template is hidden (D5).
- Cache published versions on the device so onboarding works offline after one sync.

### Endpoints
`GET /v1/templates?kind=&venue=&currency=` · `GET /v1/templates/:id/versions/latest` · `POST /v1/template-uses` (idempotent on `idem_key`) · platform: `POST|PATCH /v1/platform/templates`, `POST …/:id/publish|archive|restore|duplicate`, `GET …/:id/uses`.

---

## T2 · Real tenant identity on copy records

**Prototype:** tenant name is a constant (“Chez Mama Ngono · Douala”) in `TemplatePicker.apply`.
- `rk_template_use.tenant_id`/`loc_id` come from the session; the Control Centre shows the workspace name and location.

---

## T3 · Template undo survives a reload

**Prototype:** one in-memory undo (`tplUndo`) — lost on reload. Plan A12 note.
- Store the pre-apply snapshot in the op group as an **inverse group**; `Undo` replays it. Expires on the next edit to the same collection or after 24 h, whichever is first.

---

## T4 · Dish photos through the media CDN

**Prototype:** upload is resized on the device (640 px JPEG) and stored as a `data:` URL inside the menu record; links are any `https://` URL.
- `POST /v1/media` (multipart) → `{ media_id, url, w, h }`. Store `item.pos.image_url` = CDN URL and `image_media_id`. Never store image bytes in an item document.
- Server re-encodes to WebP, sizes 160 / 480 / 960, strips EXIF. Max upload 8 MB, image types only.
- Pasted URLs are **fetched and re-hosted** on publish/save (no hot-linking from the till or customer display); keep the original as `source_url`.
- Offline: queue the file in the outbox with a local blob path (`Filesystem`), show it from the local copy, swap to the CDN URL when the upload is accepted.
- Templates (T1) reference media by `media_id`; copying a template copies the reference, not the bytes.
- CSV `image` column: same re-host on import; rows whose URL fails become warnings, not import failures.

---

## C1 · Customer display transport over Koomzo Link

**Prototype:** `BroadcastChannel('kzcfd:<register>')` — only works inside one browser.
- Carry `CfdSnapshot` / `CfdEvent` (contract in the plan, unchanged) on Link as a **non-persisted stream** (`stream: cfd/<register_id>`): not written to `sync_outbox`, never replayed, latest-wins by `seq`.
- Heartbeat 2 s from the register; display marks stale at 5 s (already built).
- Works hub ↔ client on the shop Wi-Fi with the internet down; the display never talks to the cloud.

## C2 · Pairing as a backend record

**Prototype:** 4-digit code in `localStorage['kz:cfd:codes']`, pairing kept on the display in `kz:cfd:pair`.
- `cfd_pairing`: `display_device_id`, `register_id`, `loc_id`, `paired_at`, `paired_by`. Codes are **single-use, expire in 10 minutes**, bind to one register (align with Signage pairing rules).
- Unpair from either side revokes the row; the display returns to the code screen.

## C3 · Built-in rear screen (all-in-one POS)

**Prototype:** `window.open(…?builtin=1)` popup.
- Android: Capacitor plugin over `android.app.Presentation` / `DisplayManager` — render the display route on the secondary display of the same device; no pairing.
- Web/desktop: Presentation API where available, popup fallback.

## C4 · Display app as a Capacitor build

- Second build target of the same Angular workspace (like the Signage player): route `/cfd`, kiosk-locked, screen-always-on (`KeepAwake`), auto-start on boot, immersive mode.
- Layout auto-select by physical size (landscape 10–15″, portrait 7–8″, small 4–6″) with the `?layout=` override kept for testing.

## C5 · Android payment terminal

- Run the display app on the terminal’s screen (Sunmi / PAX class devices). v1 shows bill and wallet status only — **card/NFC capture stays out of scope** (needs the acquirer SDK).
- Printer on the terminal handles the “Printed” receipt choice via `PrintService`.

## C6 · MoMo / Orange Money status from the provider

**Prototype:** pending phase is the shared `useCharge` timer.
- The register’s tender state comes from provider callbacks + status polling (Register spec change 5); the CFD only mirrors it. `pay.phoneMasked` comes from the payer number the provider returns, masked on the register.

## C7 · Receipt choice actually delivered

**Prototype:** the choice reaches the register as a suggestion; nothing is sent.
- Accepted `receipt` event → `POST /v1/receipts/:order_id/send` with channel `whatsapp | sms | print | none` through `MessagingService`; phone from the attached customer or typed on the display (masked in every log).

## C8 · Restaurant loyalty member lookup

**Prototype:** accepted loyalty phone attaches a generic “client fidèle” with demo points (Restaurant has no customer list).
- Use the shared Customers/Loyalty service (same as Retail): look up by phone, attach `customer_id` to `rk_order`, accrue points at payment. Unknown number → offer “Create member” on the register.

## C9 · Signage playlist on the idle screen

**Prototype:** not built (plan A4 Partial); promo slides cover it.
- Embed the Signage player renderer in the display app; setting `idle.source = slides | signage_loop:<loop_id>`. Plays from the same checksum cache; falls back to slides if the loop is not fully cached (Signage “never blanks” rule).

## C10 · Tip line

**Prototype:** accepted tip adds a `Tip` order line (`id: 'tip'`), excluded from stock posting.
- Model tips as `order.tip_minor` (not a line): separate from service charge, excluded from TVA base per local rule, reported in the Z report and payable to staff via server banking (Restaurant G6).

## C11 · Settings as venue policy

**Prototype:** `localStorage['kz:cfd:set:<register>']`.
- Store in `PolicyService` under `cfd.*` per register (`lang`, `welcome`, `slides`, `table_rule`, `rx_privacy`, `actions.{loyalty,receipt,tip}`, `tip_presets`, `done_sec`); changes audited like every policy.

---

## Build order

| # | Gap | Depends on | Size |
|---|---|---|---|
| 1 | T1 template collections, publish, copy | Restaurant G1 (SQLite + outbox) | M |
| 2 | T2 tenant identity on copy records | 1, auth session | S |
| 3 | T4 media upload + CDN | `/v1/media`, outbox blob support | M |
| 4 | C11 CFD settings as policy | PolicyService | S |
| 5 | C1 Link stream + C2 pairing records | Link (Restaurant G7) | M |
| 6 | C4 display Capacitor build, C3 rear screen | 5 | M |
| 7 | C6 provider-driven wallet state | Register spec change 5 | S |
| 8 | C7 receipt delivery, C8 loyalty lookup | MessagingService, Customers service | M |
| 9 | C10 tip model | Restaurant G6 server banking | S |
| 10 | T3 persistent undo | 1 | S |
| 11 | C9 Signage loop on idle | Signage player | M |
| 12 | C5 payment terminal packaging | 6 | S |

## Open decisions
1. T4: re-host pasted image URLs always, or allow trusted CDN domains as-is?
2. C2: 4-digit code (prototype, easier at the counter) vs 6-digit Signage-style code?
3. C10: is a tip subject to TVA in Cameroon for this venue type, or always outside the base?
