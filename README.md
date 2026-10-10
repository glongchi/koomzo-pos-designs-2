# Koomzo — Application Suite (local)

Every Koomzo application screen as a runnable **React + Node** project, together with the **user guides** (EN/FR) and the **plans and specs** each module was built from.

## Run it

```bash
npm install
npm start
```

Then open **http://localhost:5173**. The launcher lists every screen, guide and plan, and has a search box.

You need Node 18 or newer. To use a different port: `PORT=3000 npm start`.

## What this is

Each screen is a **React application**: components in `.jsx`, state in React hooks, styled with the Koomzo design tokens. `@babel/standalone` transpiles the JSX in the browser. A small **Express** server (`server.js`) serves everything from `public/`. There is no build step: edit a `.jsx` file and reload the page.

Markdown plans (`*.md`) open as a readable page in the browser. Add `?raw` to the URL to get the file itself.

## Layout

```
koomzo-pos-web/
  package.json · server.js · CHANGES.md
  backend/                Firebase functions + Firestore rules (not started by npm start)
  public/
    index.html            Launcher: screens, guides, plans (searchable)
    Koomzo *.html         One entry point per screen, guide page or spec
    Koomzo *.md           Plans and specs (Markdown)
    kz/                   Shared shell: capability registry, locale, setup, profile
    pos/                  Design tokens (colors_and_type.css), kit.css, favicon
    link/                 Local network: hub/client core, peers, device app
    guide/                User guide CSS, JS, step animations, screenshots
    restaurant/ hotel/ retailflex/ retail/ grocery/ salon/ gym/ queue/ signage/
    inventory/ mrp/ invoicing/ catalog/ barcode/
    padmin/ formbuilder/ workflow/ automations/ forms/ forms-admin/
    apps/ home/ settings/ uadmin/ docs/ spec/
```

## Plans and specs — latest

| Document | Module |
|---|---|
| `Koomzo Restaurant - Production Gap Spec.md` | Restaurant & Bar: gaps to production (G1–G6) |
| `Koomzo Restaurant - Service Scenario Plan.md` | Restaurant & Bar: service scenarios |
| `Koomzo Restaurant - Server Banking and Ardoise Plan.md` | Restaurant & Bar: server banking and the ardoise (tab) |
| `Koomzo Hotel - Booking Form Corrections Plan.md` | Hotel: arrival calendar, nights and deposit counters, per-tenant settings |
| `Koomzo Link - Local Network Plan.md` · `Koomzo - Local Network (Hub and Clients).html` | Local network: one hub, many clients, offline |
| `Koomzo - Batch 1 Close-out Rulings.md` / `.html` | Batch 1 rulings |
| `Koomzo User Guide - Plan.md` · `Koomzo User Guide - Edition 2 Plan.md` | User guide, editions 1 and 2 |
| `Koomzo Queue - Requirements.md` | Queue |

The rest of the specs (functional spec, register, inventory, signage, MRP, progressive disclosure…) are listed under **Specs & references** in the launcher.

## Notes

- React, ReactDOM, Babel and Ionicons load from CDNs, so the first load needs network access. To run fully offline, vendor those four scripts into `public/` and update the `<script src>` tags.
- Data comes from in-memory fixtures (`*-data.js`). Only language and a few UI preferences persist, in `localStorage`.
- To move to a bundled production setup, point Vite at the same `.jsx` files. They share state through `window` assignments rather than ES module imports, so that port means adding `import`/`export` to each file.
- The user guide pages link to each other under project names. `public/guide/guide.js` also handles the short published names (`index.html`, `fr.html`, `hotel.html`, `fr-hotel.html` …).
