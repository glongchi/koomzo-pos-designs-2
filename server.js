// Koomzo — application server.
// Serves the React screens (JSX transpiled in the browser), user guides and plan documents from ./public.
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5173;
const pub = path.join(__dirname, 'public');
const app = express();

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Markdown plans and specs open as a readable page; add ?raw to get the file itself.
app.get(/\.md$/, (req, res, next) => {
  if ('raw' in req.query) return next();
  const file = path.join(pub, decodeURIComponent(req.path));
  if (!file.startsWith(pub) || !fs.existsSync(file)) return next();
  const title = path.basename(file, '.md');
  res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="icon" type="image/png" href="/pos/koomzo-favicon.png"><link rel="stylesheet" href="/pos/colors_and_type.css"><style>body{margin:0;background:var(--kz-bg);font-family:var(--kz-font-sans);color:var(--kz-ink)}main{max-width:860px;margin:0 auto;padding:40px 24px 80px}a{color:var(--kz-primary)}a:hover{color:var(--kz-primary-shade)}.bar{display:flex;gap:16px;font-size:13px;margin-bottom:24px}pre{white-space:pre-wrap;word-wrap:break-word;background:var(--kz-surface);border:1px solid var(--kz-border);border-radius:var(--kz-radius);padding:28px;font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace}</style></head><body><main><div class="bar"><a href="/">← All screens</a><a href="?raw">Raw file</a></div><pre>${esc(fs.readFileSync(file, 'utf8'))}</pre></main></body></html>`);
});

app.use(express.static(pub, {
  extensions: ['html'],
  setHeaders: (res, p) => { if (p.endsWith('.md')) res.setHeader('Content-Type', 'text/markdown; charset=utf-8'); },
}));

// Screen and document index as JSON.
app.get('/api/screens', (_req, res) => {
  const files = fs.readdirSync(pub).filter(f => /\.(html|md)$/.test(f) && f !== 'index.html');
  res.json(files.sort());
});

app.get('/', (_req, res) => res.sendFile(path.join(pub, 'index.html')));

app.listen(PORT, () => {
  console.log(`\n  Koomzo → http://localhost:${PORT}\n`);
});
