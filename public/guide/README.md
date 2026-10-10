# Koomzo User Guide — maintenance notes

Living document. A **hub** plus **one page per module**, in English and French, with the same structure and shared assets.

| File | Role |
|---|---|
| `Koomzo User Guide.html` | EN hub: Welcome · Lite/Mid/Full · Module guides · Platform P1–P7 |
| `Koomzo User Guide - <Module>.html` | EN module guide (Restaurant, Hotel, Retail Flex …) |
| `Koomzo Guide utilisateur[ - <Module>].html` | FR mirror of each page, section for section, with the same `id`s |
| `guide/guide.css` · `guide/guide.js` | Shared styles; page and language links; P2 devices loop |
| `guide/anim.css` · `guide/anim.js` | Step animations (one per module, plus P7) |
| `guide/img/<module>-*.jpg` | Screenshots, shared by both languages |
| `publish/` | Bundled single files — regenerate, never edit |

## Page links
`<body data-page="hotel">` names the page. Links carry `data-page="hub|restaurant|hotel|retail|…"`; `guide.js` rewrites them to project names in the editor, and to `index.html` / `fr.html` / `hotel.html` / `fr-hotel.html` once published. Old `#rk…` and `#s-…` links into the hub forward to the Restaurant page.

## Adding a module guide
1. Copy a module page (e.g. Hotel) in both languages and set `data-page`, the title and the `on` nav link.
2. Six parts — *Is this for me? · Set up · Run the day · Screens · When something goes wrong · Go further* — plus staff task cards. Prefix ids with the module (`ht-`, `rx-` …).
3. Tag every heading with `tier lite|mid|full`, taken from `kz/kz-caps.js`; tag anything not shipped with `soon`.
4. One signature animation: `<figure class="anim">` with `<ol class="anim__steps">`. Each `<li>` takes `data-set` (attributes, cumulative), `data-put` (text, cumulative) and `data-hot` (highlight, this step only). Captions are the `<li>` text, so EN and FR need no script strings.
5. In **every** page, turn the module's `<span>… Soon</span>` in the top bar, the hub sidebar and the hub's Module guides cards into a link.
6. Write the EN and FR pages in the same batch, then re-bundle `publish/`.
