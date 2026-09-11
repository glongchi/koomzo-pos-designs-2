// Koomzo — application server.
// Serves the React screens (JSX transpiled in the browser) from ./public.
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5173;
const pub = path.join(__dirname, 'public');
const app = express();

app.use(express.static(pub, { extensions: ['html'] }));

// Screen index as JSON — the launcher reads this.
app.get('/api/screens', (_req, res) => {
  const files = fs.readdirSync(pub).filter(f => f.endsWith('.html') && f !== 'index.html');
  res.json(files.sort());
});

app.get('/', (_req, res) => res.sendFile(path.join(pub, 'index.html')));

app.listen(PORT, () => {
  console.log(`\n  Koomzo → http://localhost:${PORT}\n`);
});
