// Local preview: builds dist/, serves it, rebuilds when files change.
//   node scripts/serve.mjs            → http://localhost:8787
//   PORT=3000 node scripts/serve.mjs
// Sends the same headers as production (_headers), so a page that breaks the
// Content-Security-Policy breaks here first.
import { createServer } from 'node:http';
import { readFile, stat, watch } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, headerRules, headerMatches } from './lib.mjs';
import { build } from './build.mjs';

const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 8787;
const MIME = {
  html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', json: 'application/json',
  md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
  svg: 'image/svg+xml', ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  mp3: 'audio/mpeg', mp4: 'video/mp4', webm: 'video/webm', vtt: 'text/vtt',
};

let building = null;
const rebuild = (reason) => building ??= build({ quiet: true })
  .then(() => console.log(`  rebuilt${reason ? ` (${reason})` : ''}`))
  .catch((e) => console.error(`  build failed: ${e.message}`))
  .finally(() => { building = null; });

await rebuild();
const rules = headerRules();

createServer(async (req, res) => {
  let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url.endsWith('/')) url += 'index.html';
  let file = path.join(DIST, url);
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  let status = 200;
  try {
    if ((await stat(file)).isDirectory()) { res.writeHead(301, { Location: url + '/' }).end(); return; }
  } catch { file = path.join(DIST, '404.html'); status = 404; }
  const headers = { 'Content-Type': MIME[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' };
  for (const r of rules) if (headerMatches(r.pattern, url)) for (const [k, v] of r.headers) headers[k] = headers[k] ? `${headers[k]}, ${v}` : v;
  res.writeHead(status, headers);
  res.end(await readFile(file));
}).listen(PORT, () => console.log(`\n  http://localhost:${PORT}\n  watching members/ teams/ shared/ teams.json — Ctrl-C to stop\n`));

let timer;
const onChange = (what) => { clearTimeout(timer); timer = setTimeout(() => rebuild(what), 150); };
for (const p of ['members', 'teams', 'shared', 'teams.json']) {
  if (!existsSync(path.join(ROOT, p))) continue;
  (async () => { for await (const ev of watch(path.join(ROOT, p), { recursive: true })) onChange(`${p}/${ev.filename ?? ''}`.replace(/\/$/, '')); })().catch(() => {});
}
