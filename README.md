# Koomzo — Application Suite (local)

Every Koomzo application screen as a runnable **React + Node** project. No
documents, specs or decks are included — application files only.

## Run it

```bash
cd koomzo-pos-web
npm install
npm start
```

Then open **http://localhost:5173** — the launcher lists all 35 screens.

Node 18 or newer. A different port: `PORT=3000 npm start`.

## What this is

Each screen is a **React application**: components in `.jsx`, state in React
hooks, styled with the Koomzo design tokens. JSX is transpiled in the browser by
`@babel/standalone`, and a small **Express** server (`server.js`) serves the
screens and their shared modules from `public/`. This is the same code that runs
in the design tool, packaged to run anywhere — there is no build step, so
editing a `.jsx` file and reloading the page is the whole loop.

## Layout

```
koomzo-pos-web/
  package.json        Express dependency + start script
  server.js           Static server + /api/screens index
  public/
    index.html        React launcher (all screens, searchable)
    Koomzo *.html      one entry point per screen
    kz/                shared shell: capability registry, locale, setup, profile
    pos/               design tokens (colors_and_type.css), kit.css, favicon
    padmin/            admin shell — rail, topbar, tables
    formbuilder/       form builder: fields, logic, data sources, i18n
    workflow/          orchestrator + flow designer
    automations/       recipes and runs
    forms/ forms-admin/    published forms, submissions, records
    retail/ retailflex/ restaurant/ grocery/   selling modules
    hotel/ salon/ gym/ queue/ signage/         operations modules
    inventory/ mrp/ invoicing/ catalog/ barcode/
    apps/ home/ settings/ uadmin/ mobile/
```

Shared design tokens: `public/pos/colors_and_type.css`. The capability registry
that drives progressive disclosure: `public/kz/kz-caps.js`.

## Notes

- React, ReactDOM, Babel and Ionicons load from CDNs, so first load needs
  network access. To run fully offline, vendor those four scripts into `public/`
  and update the `<script src>` tags in each HTML file.
- Data is in-memory fixtures (`*-data.js`, `rdata.js`, `gm-data.js`, …). Nothing
  persists across reloads except language and a few UI preferences in
  `localStorage`.
- To move to a bundled production setup, point Vite at the same `.jsx` files:
  they are ordinary React components, but they currently share state through
  `window` assignments rather than ES module imports, so that port means adding
  `import`/`export` to each file.
