// Shared helpers for build / validate / new-team. No dependencies.
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// One slug rule for team folders and (lower-cased) GitHub logins.
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;

export const LIMITS = {
  maxFileBytes: 2 * 1024 * 1024,
  maxDirBytes: 10 * 1024 * 1024,
  maxFiles: 40,
  allowedExt: new Set(('html htm css js mjs json md txt ' +
    'png jpg jpeg gif webp avif svg ico ' +
    'woff woff2 ttf otf mp3 mp4 webm vtt').split(' ')),
};

// ---- teams.json -------------------------------------------------------------
export function loadRegistry() {
  const file = path.join(ROOT, 'teams.json');
  let data;
  try { data = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { throw new Error(`teams.json is not valid JSON: ${e.message}`); }

  const errors = [];
  const admins = Array.isArray(data.admins) ? data.admins : [];
  if (!admins.length) errors.push('teams.json: "admins" must list at least one GitHub login.');
  const teams = Array.isArray(data.teams) ? data.teams : (errors.push('teams.json: "teams" must be an array.'), []);

  const seen = new Set();
  for (const t of teams) {
    if (!t || typeof t !== 'object') { errors.push('teams.json: every team must be an object.'); continue; }
    if (!SLUG_RE.test(String(t.slug))) errors.push(`teams.json: bad slug "${t.slug}" (lowercase letters, digits, single hyphens).`);
    if (seen.has(t.slug)) errors.push(`teams.json: duplicate slug "${t.slug}".`);
    seen.add(t.slug);
    if (!t.name || typeof t.name !== 'string') errors.push(`teams.json: team "${t.slug}" needs a "name".`);
    if (!Array.isArray(t.members)) errors.push(`teams.json: team "${t.slug}" needs a "members" array (GitHub logins; may be empty).`);
  }
  if (errors.length) throw new Error(errors.join('\n'));

  const lc = (s) => String(s).toLowerCase();
  return {
    admins: admins.map(lc),
    teams: teams.map((t) => ({
      slug: t.slug,
      name: t.name,
      blurb: typeof t.blurb === 'string' ? t.blurb : '',
      icon: /^[a-z0-9-]+$/.test(String(t.icon || '')) ? t.icon : 'users',
      members: t.members.map(lc),
    })),
  };
}

// ---- folder checks (same rules for teams/<slug>/ and members/<login>/) ------
export function checkFolder(relDir) {
  const abs = path.join(ROOT, relDir);
  const errors = [];
  if (!existsSync(abs)) return { errors: [`${relDir}/ does not exist.`], count: 0, bytes: 0 };
  if (!existsSync(path.join(abs, 'index.html'))) errors.push(`Missing ${relDir}/index.html — every page needs that file as its entry point.`);

  let count = 0, bytes = 0;
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = path.relative(ROOT, full);
      const st = lstatSync(full);
      if (st.isSymbolicLink()) { errors.push(`${rel} is a symlink — not allowed.`); continue; }
      if (name.startsWith('.')) { errors.push(`${rel} is a dotfile — not allowed.`); continue; }
      if (st.isDirectory()) {
        if (name === 'node_modules') { errors.push(`${rel}/ — commit your built output, not node_modules.`); continue; }
        walk(full); continue;
      }
      count += 1; bytes += st.size;
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
      if (!LIMITS.allowedExt.has(ext)) errors.push(`${rel} has a disallowed file type (${ext ? '.' + ext : 'no extension'}). Allowed: ${[...LIMITS.allowedExt].join(' ')}`);
      if (st.size > LIMITS.maxFileBytes) errors.push(`${rel} is ${kb(st.size)} — the per-file limit is ${kb(LIMITS.maxFileBytes)}.`);
    }
  };
  walk(abs);
  if (count > LIMITS.maxFiles) errors.push(`${relDir}/ has ${count} files — the limit is ${LIMITS.maxFiles}.`);
  if (bytes > LIMITS.maxDirBytes) errors.push(`${relDir}/ totals ${kb(bytes)} — the limit is ${kb(LIMITS.maxDirBytes)}.`);
  return { errors, count, bytes };
}

export const kb = (n) => `${Math.round(n / 1024)} KB`;

// Pull <title> and <meta name="description"> out of an index.html, for the directory page.
export function pageMeta(html) {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const d = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
         || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  return { title: clean(t && t[1]).replace(/\s*\|\s*RCET\s*$/i, ''), description: clean(d && d[1]) };
}

// Folders under members/ or teams/ that are real pages (skip _template etc.).
export function listPageDirs(kind) {
  const base = path.join(ROOT, kind);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

// ---- _headers (Cloudflare format) --------------------------------------------
// "/path/*" lines followed by indented "Header: value" lines. Used by serve.mjs to
// mirror production headers locally, and by build.mjs to inject the CSP as a
// <meta> tag so it also applies on hosts without custom headers (GitHub Pages).
export function headerRules() {
  const file = path.join(ROOT, '_headers');
  if (!existsSync(file)) return [];
  const rules = [];
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) { rules.push({ pattern: raw.trim(), headers: [] }); continue; }
    const i = raw.indexOf(':'); if (i < 0 || !rules.length) continue;
    rules.at(-1).headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
  }
  return rules;
}
export const headerMatches = (pattern, url) =>
  pattern.endsWith('/*') ? url.startsWith(pattern.slice(0, -1)) || url === pattern.slice(0, -2) : pattern === url;

// CSP that applies to a URL, minus directives a <meta> tag cannot carry.
export function metaCspFor(url) {
  const parts = [];
  for (const r of headerRules()) if (headerMatches(r.pattern, url))
    for (const [k, v] of r.headers) if (k.toLowerCase() === 'content-security-policy') parts.push(...v.split(';'));
  const keep = parts.map((s) => s.trim()).filter((s) => s && !/^(frame-ancestors|report-uri|report-to|sandbox)\b/i.test(s));
  return keep.join('; ');
}
