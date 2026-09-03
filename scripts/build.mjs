// Builds dist/ — no framework, no dependencies.
//   dist/index.html, about/, events/   the club's own pages, from site/ (admin-owned)
//   dist/teams/index.html              generated directory of teams (and members)
//   dist/teams/<slug>/...              each team page, verbatim
//   dist/u/<login>/...                 each member page, verbatim
//   dist/shared/...                    the shared design system and assets
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { ROOT, loadRegistry, listPageDirs, pageMeta, metaCspFor } from './lib.mjs';

const DIST = path.join(ROOT, 'dist');
const REPO = 'https://github.com/RotmanCommerceTech/rcet-member-pages';
// Set BASE_PATH="/rcet-member-pages" to build for a project GitHub Pages URL
// (https://<user>.github.io/rcet-member-pages/). Leave unset for a real domain.
const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '');
// Absolute origin for Open Graph tags (og:image must be absolute). deploy.yml sets it.
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');

// "Previously with" strip on the directory. Only organizations the old site named as
// partners of a past event: Microsoft + BDO (AI Transformation, Nov 2024), Meta (Commerce &
// Connection, Oct 2024), AWS Canada (Blueprint to the Cloud, Feb 2025), and the universities on
// the VR panels. SAP, Cohere and Vanguard only appeared on the not-yet-held Northbound page, so
// they are left out; add them here once those partnerships are real (logos are in shared/assets/partners/).
// A third field of 'invert' flips a white-on-transparent logo to dark for the grayscale strip.
const PARTNERS = [
  ['Microsoft', 'microsoft-white.png', 'invert'], ['Meta', 'meta.png'], ['AWS', 'aws.png'], ['BDO', 'bdo.png'],
  ['Harvard', 'harvard.png'], ['Columbia', 'columbia.png'], ['Stanford', 'stanford.png'], ['Yale', 'yale.png'],
];

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

  for (let i = 0; ; i++) { // a concurrent rebuild (serve.mjs) can race the delete
    try { await rm(DIST, { recursive: true, force: true }); break; }
    catch (e) { if (i >= 4) throw e; await new Promise((r) => setTimeout(r, 200)); }
  }
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'shared'), path.join(DIST, 'shared'), { recursive: true });
  if (BASE) await rewriteTree(path.join(DIST, 'shared'), (_, text) => rebase(text));
  for (const t of teams) {
    if (t.built) { await copyPage(path.join(ROOT, 'teams', t.slug), path.join(DIST, 'teams', t.slug), `/teams/${t.slug}/`); continue; }
    await mkdir(path.join(DIST, 'teams', t.slug), { recursive: true });
    await writeFile(path.join(DIST, 'teams', t.slug, 'index.html'), rebase(comingSoonPage(t)));
  }
  for (const m of members) await copyPage(path.join(ROOT, 'members', m.login), path.join(DIST, 'u', m.login), `/u/${m.login}/`);
  await mkdir(path.join(DIST, 'teams'), { recursive: true });
  await writeFile(path.join(DIST, 'teams', 'index.html'), rebase(directoryPage(teams, members)));
  await writeFile(path.join(DIST, '404.html'), rebase(notFoundPage()));
  await copySite(teams);
  if (existsSync(path.join(ROOT, '_headers'))) await cp(path.join(ROOT, '_headers'), path.join(DIST, '_headers'));

  const built = teams.filter((t) => t.built);
  log(`Built ${built.length}/${teams.length} team page(s) and ${members.length} member page(s) into dist/`);
  for (const t of teams) log(`  ${t.built ? '/teams/' + t.slug + '/' : '(no page yet)'.padEnd(14)}  ${t.name}`);
  for (const m of members) log(`  /u/${m.login}/  ${m.title}`);
  return { teams, members };
}

// The club's own pages: site/ → dist root. Static HTML with a few build-time snippets:
//   <!-- TEAMS_GRID -->       cards for every registered team
//   <!-- PARTNERS_STRIP -->   the "previously with" marquee
//   {{SITE_URL}}              absolute origin (+ base path) for Open Graph tags
async function copySite(teams) {
  const src = path.join(ROOT, 'site');
  if (!existsSync(src)) return;
  await cp(src, DIST, { recursive: true });
  await rewriteTree(DIST, (file, text) => {
    if (file.startsWith('teams/') || file.startsWith('u/') || file.startsWith('shared/')) return text;
    if (!/\.html?$/i.test(file)) return text;
    return rebase(text
      .replace(/<!--\s*TEAMS_GRID\s*-->/g, `<div class="rcet-grid rcet-grid--3">\n${teamCards(teams)}\n      </div>`)
      .replace(/<!--\s*PARTNERS_STRIP\s*-->/g, partnersStrip())
      .replace(/\{\{SITE_URL\}\}/g, `${SITE_URL}${BASE}`));
  });
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
// Absolute site paths → BASE-prefixed. Only the paths this site owns: /shared/ /teams/ /u/ /about/ /events/ and "/".
function rebase(text) {
  if (!BASE) return text;
  return text
    .replace(/((?:src|href|content)=["'])\/(shared|teams|u|about|events)\//g, `$1${BASE}/$2/`)
    .replace(/(url\(["']?)\/(shared|teams|u|about|events)\//g, `$1${BASE}/$2/`)
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
<link rel="icon" type="image/png" sizes="32x32" href="/shared/assets/brand/favicon-32.png">
<link rel="apple-touch-icon" href="/shared/assets/brand/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Rotman Commerce Emerging Technologies">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE_URL}${BASE}/shared/assets/brand/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/shared/rcet.css">
<script src="/shared/rcet.js" defer></script>
<style>
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
<main id="main">
${body}
</main>
<rcet-footer></rcet-footer>
</body>
</html>
`;
}

const teamIcon = (t) => `<span class="rcet-icon-badge"><svg class="rcet-icon rcet-icon--lg" aria-hidden="true"><use href="/shared/assets/icons.svg#${esc(t.icon)}"/></svg></span>`;
function teamCards(teams) {
  return teams.map((t, i) => `      <a class="rcet-card team-card${t.built ? '' : ' team-card--soon'}" href="/teams/${esc(t.slug)}/" data-reveal style="--i:${i}">
        ${teamIcon(t)}
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.blurb)}</p>
        <span class="go">${t.built ? 'Visit the page →' : 'Page coming soon'}</span>
      </a>`).join('\n');
}
function partnersStrip() {
  const logos = PARTNERS.map(([name, file, mode]) => `<img src="/shared/assets/partners/${file}" alt="${esc(name)}" loading="lazy"${mode === 'invert' ? ' class="rcet-invert"' : ''}>`).join('');
  return `
  <section class="partners" aria-label="Partners">
    <div class="rcet-container">
      <p class="rcet-eyebrow">Previously with</p>
      <div class="rcet-marquee"><div class="rcet-marquee__track">${logos}${logos}</div></div>
    </div>
  </section>`;
}

const words = (n) => (['No teams', 'One team', 'Two teams', 'Three teams', 'Four teams', 'Five teams', 'Six teams', 'Seven teams', 'Eight teams', 'Nine teams', 'Ten teams'][n] || `${n} teams`);

function directoryPage(teams, members) {
  const built = teams.filter((t) => t.built).length;
  const cards = teamCards(teams);

  const memberCards = members.map((m, i) => `      <a class="rcet-card member-card" href="/u/${esc(m.login)}/" data-reveal style="--i:${i}">
        <span class="rcet-mono">@${esc(m.login)}</span>
        <span class="t">${esc(m.title)}</span>
      </a>`).join('\n');

  const body = `
  <section class="rcet-hero rcet-hero--art rcet-bg-mesh" data-constellation>
    <div class="rcet-container">
      <p class="rcet-eyebrow">Rotman Commerce Emerging Technologies</p>
      <h1>Our teams</h1>
      <p class="rcet-lede">${words(teams.length)} run RCET. Each one builds its own page here — written, designed and
      published by the people on it, straight from this site's GitHub repository.</p>
    </div>
  </section>

${partnersStrip()}

  <section class="rcet-section rcet-section--alt" id="teams">
    <div class="rcet-container">
      <div class="rcet-section-head">
        <div><p class="rcet-eyebrow">Teams</p><h2>${teams.length} teams, ${built} page${built === 1 ? '' : 's'} live</h2></div>
        <p>Each team owns one folder in the repo and nothing else. That is the whole rule.</p>
      </div>
      <div class="rcet-grid rcet-grid--3">
${cards}
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
        <a class="rcet-btn rcet-btn--ghost" href="${REPO}/blob/main/PROMPT.md">Copy the prompt</a>
      </div>
    </div>
  </section>`;

  return shell({
    title: 'Our Teams | RCET',
    description: 'The teams behind Rotman Commerce Emerging Technologies, each page built by the team on it.',
    body,
  });
}

function comingSoonPage(t) {
  return shell({
    title: `${t.name} | RCET`,
    description: t.blurb || `The ${t.name} team at Rotman Commerce Emerging Technologies.`,
    headerAttrs: ` team="${esc(t.name)}"`,
    body: `
  <section class="rcet-hero rcet-bg-dots">
    <div class="rcet-container">
      <p class="rcet-eyebrow">Coming soon</p>
      <h1>${esc(t.name)}</h1>
      <p class="rcet-lede">${esc(t.blurb || 'This team has not published its page yet.')}</p>
      <p class="rcet-muted">The ${esc(t.name)} team is building this page. Check back soon.</p>
      <div class="rcet-btn-row"><a class="rcet-btn rcet-btn--primary" href="/teams/">All teams</a></div>
    </div>
  </section>`,
  });
}

function notFoundPage() {
  return shell({
    title: 'Not found | RCET',
    description: 'That page does not exist.',
    body: `
  <section class="rcet-hero rcet-bg-dots">
    <div class="rcet-container">
      <p class="rcet-eyebrow">404 · Signal lost</p>
      <h1>Nothing here</h1>
      <p class="rcet-lede">That page does not exist, or it has not been published yet.</p>
      <div class="rcet-btn-row"><a class="rcet-btn rcet-btn--primary" href="/">Home</a><a class="rcet-btn rcet-btn--ghost" href="/teams/">All teams</a></div>
    </div>
  </section>`,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  build().catch((e) => { console.error(`::error::${e.message}`); process.exit(1); });
}
