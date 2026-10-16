# Changes in this drop (v2.2.0)

## Restaurant & Bar
- **Add your menu**: Setup → Menu — categories (add, rename, reorder, remove empty), dishes with price, kitchen station, tags, icon/colour.
- **Dish photos**: CDN link or upload (resized on device), shown on register, kiosk, setup list and templates; icon fallback when missing.
- **CSV import / export** with a downloadable template, row-level errors, Add or Replace. Optional `image` column.
- **Start from a template** for the menu and the floor plan (replaces the old "Start from a layout" sheet). Check-price labels, one Undo, paired menu ↔ floor offer.
- **Customer display**: Setup → Customer display; live bill, payment, thank-you; table bills only at Print bill / Pay.

## Retail Flex
- Products screen for shops without the Inventory module (from the earlier drop, refreshed).
- **Customer display**: variants, weight, attached customer; age-check notice; Pharmacy hides prescription names.

## Platform
- **Template Library** (Control Centre → Templates, or `Koomzo - Template Library.html`): create, edit with the same editors, preview, publish versions, archive, Used by N.
- **Customer display app** `Koomzo Customer Display.html` + `Koomzo - Customer Display Demo.html`. New capability `cfd` (all tiers).
- Shared charge model (`kz/kz-charge.jsx`) now mirrors payment to the display.

## Plans and specs (new)
- `Koomzo - Template Library Plan.html`, `Koomzo - Customer Display Plan.html` — validated plans with cross-check tables.
- `Koomzo - Templates, Photos & Customer Display - Production Gap Spec.md` — production tasks T1–T4, C1–C11 for the target app.
- Updated: `Koomzo Restaurant - Production Gap Spec.md` (see-also + build order), functional spec data (`spec/spec-data.js`).
- Carried: Restaurant (production gaps, service scenarios, server banking/ardoise), Hotel booking form corrections, Local network (Link) plan and hub/clients page.

## User guides
- Restaurant and Retail Flex (EN + FR): menu, photos, CSV, templates, customer display. Hub guides: P8 Templates (Koomzo staff).

## New files
`kz/kz-templates.js` · `kz/kz-templates-admin.jsx` · `kz/kz-templates.css` · `kz/kz-cfd.js` · `kz/kz-cfd-ui.jsx` · `kz/kz-cfd-display.jsx` · `kz/kz-cfd.css` · `restaurant/template-pick.jsx` · `restaurant/menu-setup.jsx`
