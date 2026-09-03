// Builds dist/ — no framework, no dependencies.
//   dist/index.html          generated directory of teams (and members)
//   dist/teams/<slug>/...    each team page, verbatim
//   dist/u/<login>/...       each member page, verbatim
//   dist/shared/...          the shared design system
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { ROOT, loadRegistry, listPageDirs, pageMeta, metaCspFor } from './lib.mjs';

const DIST = path.join(ROOT, 'dist');
const REPO = 'https://github.com/Slimebro1231/rcet-member-pages';
// Set BASE_PATH="/rcet-member-pages" to build for a project GitHub Pages URL
// (https://<user>.github.io/rcet-member-pages/). Leave unset for a real domain.
const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function build({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const registry = loadRegistry();

  // Teams: every registered team appears on the directory; only built ones get a link.
  const teamDirs = listPageDirs('teams');
  const unknown = teamDirs.filter((d) => !registry.teams.some((t) => t.slug === d));
  if (unknown.length) throw new Error(`These team folders are not in teams.json: ${unknown.join(', ')}. Add them (an admin edit) or remove the folder.`);

  const teams = [];
  for (const t of registry.teams) {
    const index = path.join(ROOT, 'teams', t.slug, 'index.html');
    if (!existsSync(index)) { teams.push({ ...t, built: false }); continue; }
    const meta = pageMeta(await readFile(index, 'utf8'));
    teams.push({ ...t, built: true, blurb: meta.description || t.blurb });
  }

  const members = [];
  for (const login of listPageDirs('members')) {
    const index = path.join(ROOT, 'members', login, 'index.html');
    if (!existsSync(index)) { log(`  skip members/${login} — no index.html`); continue; }
    const meta = pageMeta(await readFile(index, 'utf8'));
    members.push({ login, title: meta.title || login });
  }

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'shared'), path.join(DIST, 'shared'), { recursive: true });
  if (BASE) await rewriteTree(path.join(DIST, 'shared'), (_, text) => rebase(text));
  for (const t of teams) if (t.built) await copyPage(path.join(ROOT, 'teams', t.slug), path.join(DIST, 'teams', t.slug), `/teams/${t.slug}/`);
  for (const m of members) await copyPage(path.join(ROOT, 'members', m.login), path.join(DIST, 'u', m.login), `/u/${m.login}/`);
  await writeFile(path.join(DIST, 'index.html'), rebase(directoryPage(teams, members)));
  await writeFile(path.join(DIST, '404.html'), rebase(notFoundPage()));
  if (existsSync(path.join(ROOT, '_headers'))) await cp(path.join(ROOT, '_headers'), path.join(DIST, '_headers'));

  const built = teams.filter((t) => t.built);
  log(`Built ${built.length}/${teams.length} team page(s) and ${members.length} member page(s) into dist/`);
  for (const t of teams) log(`  ${t.built ? '/teams/' + t.slug + '/' : '(no page yet)'.padEnd(14)}  ${t.name}`);
  for (const m of members) log(`  /u/${m.login}/  ${m.title}`);
  return { teams, members };
}

// Copy a page folder verbatim, then (a) inject the production CSP as a <meta> tag so the
// sandbox holds on any host, and (b) prefix absolute URLs when building under BASE_PATH.
async function copyPage(src, dest, url) {
  await cp(src, dest, { recursive: true });
  const csp = metaCspFor(url);
  await rewriteTree(dest, (file, text) => {
    if (/\.html?$/i.test(file)) {
      if (csp && !/http-equiv=["']Content-Security-Policy["']/i.test(text)) text = injectMeta(text, `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
      return rebase(text);
    }
    if (/\.(css|m?js)$/i.test(file)) return rebase(text);
    return text;
  });
}
async function rewriteTree(dir, fn) {
  for (const f of await readdir(dir, { recursive: true })) {
    const full = path.join(dir, f);
    if (!(await stat(full)).isFile() || !/\.(html?|css|m?js)$/i.test(f)) continue;
    const before = await readFile(full, 'utf8');
    const after = fn(f, before) ?? before;
    if (after !== before) await writeFile(full, after);
  }
}
function injectMeta(html, tag) {
  const m = html.match(/<meta\s+charset[^>]*>/i) || html.match(/<head[^>]*>/i);
  if (!m) return `${tag}\n${html}`;
  const at = m.index + m[0].length;
  return `${html.slice(0, at)}\n${tag}${html.slice(at)}`;
}
// Absolute site paths → BASE-prefixed. Only the paths this site owns: /shared/ /teams/ /u/ and "/".
function rebase(text) {
  if (!BASE) return text;
  return text
    .replace(/((?:src|href|content)=["'])\/(shared|teams|u)\//g, `$1${BASE}/$2/`)
    .replace(/(url\(["']?)\/(shared|teams|u)\//g, `$1${BASE}/$2/`)
    .replace(/(href=["'])\/(["'#?])/g, `$1${BASE}/$2`);
}

function shell({ title, description, body, headerAttrs = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="/shared/rcet.css">
<script src="/shared/rcet.js" defer></script>
<style>
  .team-card { display: grid; gap: 10px; align-content: start; min-height: 100%; }
  .team-card .rcet-tag { justify-self: start; }
  .team-card h3 { margin: 4px 0 0; }
  .team-card p { color: var(--rcet-muted); margin: 0; }
  .team-card .go { margin-top: auto; padding-top: 12px; font-size: 14px; font-weight: 600; color: var(--rcet-accent); }
  .team-card--soon { border-style: dashed; box-shadow: none; background: transparent; }
  .team-card--soon .go { color: var(--rcet-muted); font-weight: 500; }
  .member-card .rcet-mono { font-size: 13px; color: var(--rcet-accent); display: block; margin-bottom: 6px; }
  .member-card .t { overflow-wrap: anywhere; }
  .howto { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); counter-reset: step; }
  .howto div { position: relative; padding: 20px 20px 20px 56px; border: 1px solid var(--rcet-line); border-radius: var(--rcet-radius); background: var(--rcet-surface); }
  .howto div::before { counter-increment: step; content: counter(step, decimal-leading-zero); position: absolute; left: 20px; top: 22px;
    font-family: var(--rcet-font-mono); font-size: 13px; color: var(--rcet-accent); }
  .howto b { display: block; margin-bottom: 4px; }
  .howto p { margin: 0; font-size: 15px; color: var(--rcet-muted); }
</style>
</head>
<body>
<rcet-header${headerAttrs}></rcet-header>
<main>
${body}
</main>
<rcet-footer></rcet-footer>
</body>
</html>
`;
}

const words = (n) => (['No teams', 'One team', 'Two teams', 'Three teams', 'Four teams', 'Five teams', 'Six teams', 'Seven teams', 'Eight teams', 'Nine teams', 'Ten teams'][n] || `${n} teams`);

function directoryPage(teams, members) {
  const built = teams.filter((t) => t.built).length;
  const teamCards = teams.map((t) => t.built
    ? `      <a class="rcet-card team-card" href="/teams/${esc(t.slug)}/">
        <span class="rcet-tag">Team</span>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.blurb)}</p>
        <span class="go">Visit the page →</span>
      </a>`
    : `      <div class="rcet-card team-card team-card--soon">
        <span class="rcet-tag">Team</span>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.blurb)}</p>
        <span class="go">Page coming soon</span>
      </div>`).join('\n');

  const memberCards = members.map((m) => `      <a class="rcet-card member-card" href="/u/${esc(m.login)}/">
        <span class="rcet-mono">@${esc(m.login)}</span>
        <span class="t">${esc(m.title)}</span>
      </a>`).join('\n');

  const body = `
  <section class="rcet-hero">
    <div class="rcet-container">
      <p class="rcet-eyebrow">Rotman Commerce Emerging Technologies</p>
      <h1>Our teams</h1>
      <p class="rcet-lede">${words(teams.length)} run RCET. Each one built its own page — written, designed and
      published by the people on it, straight from this site's GitHub repository.</p>
    </div>
  </section>

  <section class="rcet-section rcet-section--alt" id="teams">
    <div class="rcet-container">
      <div class="rcet-section-head">
        <div><p class="rcet-eyebrow">Teams</p><h2>${teams.length} teams, ${built} page${built === 1 ? '' : 's'} live</h2></div>
        <p>Each team owns one folder in the repo and nothing else. That is the whole rule.</p>
      </div>
      <div class="rcet-grid rcet-grid--3">
${teamCards}
      </div>
    </div>
  </section>
${members.length ? `
  <section class="rcet-section" id="members">
    <div class="rcet-container">
      <div class="rcet-section-head">
        <div><p class="rcet-eyebrow">People</p><h2>Member pages</h2></div>
        <p>Personal pages by individual members, one folder per GitHub account.</p>
      </div>
      <div class="rcet-grid rcet-grid--4">
${memberCards}
      </div>
    </div>
  </section>` : ''}

  <section class="rcet-section${members.length ? ' rcet-section--alt' : ''}" id="how">
    <div class="rcet-container">
      <div class="rcet-section-head">
        <div><p class="rcet-eyebrow">How it works</p><h2>Publish your team's page</h2></div>
        <p>No Wix, no CMS. Paste the repo link into the AI tool of your choice and ship.</p>
      </div>
      <div class="howto">
        <div><b>Paste the repo link into your AI</b><p>Claude, Cursor, Codex, ChatGPT, Lovable, whatever you use. It reads the instructions in the repo.</p></div>
        <div><b>Build in your team's folder</b><p>Everything under <code>teams/&lt;your-team&gt;/</code> is yours. The shared header, footer and colours keep it on-brand.</p></div>
        <div><b>Open a pull request</b><p>A bot checks the rules in about 30 seconds. An admin merges, and the page is live a minute later.</p></div>
      </div>
      <div class="rcet-btn-row">
        <a class="rcet-btn rcet-btn--primary" href="${REPO}#readme">Read the instructions</a>
        <a class="rcet-btn rcet-btn--ghost" href="${REPO}">Open the repository</a>
      </div>
    </div>
  </section>`;

  return shell({
    title: 'Our Teams | RCET',
    description: 'The teams behind Rotman Commerce Emerging Technologies, each page built by the team on it.',
    body,
  });
}

function notFoundPage() {
  return shell({
    title: 'Not found | RCET',
    description: 'That page does not exist.',
    body: `
  <section class="rcet-hero">
    <div class="rcet-container">
      <p class="rcet-eyebrow">404</p>
      <h1>Nothing here</h1>
      <p class="rcet-lede">That page does not exist, or it has not been published yet.</p>
      <div class="rcet-btn-row"><a class="rcet-btn rcet-btn--primary" href="/">All teams</a></div>
    </div>
  </section>`,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  build().catch((e) => { console.error(`::error::${e.message}`); process.exit(1); });
}
