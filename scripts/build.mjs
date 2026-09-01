// Builds dist/ from members/*/ — no framework, no dependencies.
//   dist/u/<username>/...   each participant's page, verbatim
//   dist/index.html         generated directory of everyone
import { readdir, readFile, writeFile, mkdir, cp, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEMBERS = path.join(ROOT, 'members');
const DIST = path.join(ROOT, 'dist');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function collect() {
  const entries = await readdir(MEMBERS, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const index = path.join(MEMBERS, e.name, 'index.html');
    if (!existsSync(index)) {
      console.warn(`  skip ${e.name} — no index.html`);
      continue;
    }
    const html = await readFile(index, 'utf8');
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = (m ? m[1] : '').trim().replace(/\s+/g, ' ');
    out.push({ user: e.name, title: title || e.name });
  }
  return out.sort((a, b) => a.user.localeCompare(b.user));
}

function page(members) {
  const cards = members.map((m) => `
      <a class="card" href="/u/${esc(m.user)}/">
        <span class="handle">${esc(m.user)}</span>
        <span class="title">${esc(m.title)}</span>
      </a>`).join('');

  const empty = `
      <p class="empty">No pages yet — yours could be the first.
      See <a href="https://github.com/Slimebro1231/rcet-member-pages#readme">the instructions</a>.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Team | RCET</title>
<meta name="description" content="The people behind Rotman Commerce Emerging Technologies — each page written by the person on it.">
<style>
  :root {
    --bg: #070d16; --panel: #0e1826; --line: #1e2c3f;
    --fg: #e8eef5; --muted: #8ea3ba; --accent: #7da8cc;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font: 16px/1.6 ui-sans-serif, -apple-system, "Segoe UI", Inter, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 920px; margin: 0 auto; padding: 72px 24px 96px; }
  .brand {
    font-family: ui-serif, Georgia, "Times New Roman", serif;
    font-size: 15px; line-height: 1.3; color: var(--muted);
    letter-spacing: .01em; margin-bottom: 56px;
  }
  .brand b { display: block; color: var(--fg); font-weight: 400; }
  h1 { font-size: clamp(30px, 6vw, 46px); line-height: 1.1; margin: 0 0 16px; font-weight: 600; letter-spacing: -.02em; }
  .lede { color: var(--muted); max-width: 56ch; margin: 0 0 12px; }
  .count { color: var(--accent); font-variant-numeric: tabular-nums; font-size: 14px;
           letter-spacing: .08em; text-transform: uppercase; margin: 32px 0 16px; }
  .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
  .card {
    display: flex; flex-direction: column; gap: 6px; padding: 18px 20px;
    background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
    text-decoration: none; color: inherit; transition: border-color .15s, transform .15s;
  }
  .card:hover { border-color: var(--accent); transform: translateY(-2px); }
  .handle { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: var(--accent); }
  .title { font-size: 15px; color: var(--fg); overflow-wrap: anywhere; }
  .empty { color: var(--muted); }
  a { color: var(--accent); }
  footer { margin-top: 64px; padding-top: 24px; border-top: 1px solid var(--line);
           color: var(--muted); font-size: 13px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand">Rotman Commerce<b>Emerging Technologies</b></div>
    <h1>The Team</h1>
    <p class="lede">The people behind RCET, in their own words — and their own code.
    Every page here is hand-written HTML, CSS and JavaScript, published by
    its author through a pull request.</p>
    <p class="count">${members.length} ${members.length === 1 ? 'person' : 'people'}</p>
    ${members.length ? `<div class="grid">${cards}\n    </div>` : empty}
    <footer>
      Each page is authored by the person named on it and served from a sandboxed
      origin, separate from the main RCET site. Views expressed are their own.
    </footer>
  </div>
</body>
</html>
`;
}

const members = await collect();
await mkdir(DIST, { recursive: true });
for (const m of members) {
  await cp(path.join(MEMBERS, m.user), path.join(DIST, 'u', m.user), { recursive: true });
}
await writeFile(path.join(DIST, 'index.html'), page(members));
if (existsSync(path.join(ROOT, '_headers'))) {
  await cp(path.join(ROOT, '_headers'), path.join(DIST, '_headers'));
}
console.log(`Built ${members.length} member page(s) into dist/`);
for (const m of members) console.log(`  /u/${m.user}/  ${m.title}`);
