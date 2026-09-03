// Validates that a pull request only adds/edits pages its author is allowed to edit.
//   members/<login>/   only that GitHub user
//   teams/<slug>/      anyone listed under that team in teams.json
//   anything else      admins only (teams.json "admins")
// Env: AUTHOR (GitHub login), BASE_SHA, HEAD_SHA. Runs in CI; locally:
//   AUTHOR=you BASE_SHA=origin/main HEAD_SHA=HEAD node scripts/validate-pr.mjs
import { execFileSync } from 'node:child_process';
import { ROOT, SLUG_RE, loadRegistry, checkFolder, kb } from './lib.mjs';

const { AUTHOR, BASE_SHA, HEAD_SHA } = process.env;
for (const [k, v] of Object.entries({ AUTHOR, BASE_SHA, HEAD_SHA })) if (!v) { console.error(`::error::${k} not set`); process.exit(2); }
const author = AUTHOR.toLowerCase();

let failed = false;
const fail = (msg) => { console.log(`::error::${msg}`); failed = true; };

let registry;
try { registry = loadRegistry(); } catch (e) { fail(e.message); finish(); }
const isAdmin = registry.admins.includes(author);
const myTeams = registry.teams.filter((t) => t.members.includes(author)).map((t) => t.slug);

console.log(`PR author: ${AUTHOR}${isAdmin ? '  (admin)' : ''}`);
console.log(`May edit:  members/${author}/${myTeams.map((s) => `  teams/${s}/`).join('')}${isAdmin ? '  (and everything else)' : ''}`);
console.log();

const changed = execFileSync('git', ['diff', '--name-only', `${BASE_SHA}...${HEAD_SHA}`], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').map((s) => s.trim()).filter(Boolean);
if (!changed.length) { fail('This PR changes no files.'); finish(); }

console.log('Changed files:');
for (const f of changed) console.log(`  ${f}`);
console.log();

// ---------------------------------------------------------------- ownership
const folders = new Set();
const outside = [];
for (const f of changed) {
  const m = f.match(/^(members|teams)\/([^/]+)\/(.+)$/);
  if (!m) { if (!isAdmin) outside.push(f); continue; }
  const [, kind, slug] = m;
  if (slug.startsWith('_') || slug.startsWith('.')) { if (!isAdmin) outside.push(f); continue; }
  folders.add(`${kind}/${slug}`);
  if (isAdmin) continue;
  if (kind === 'members' && slug !== author) outside.push(f);
  if (kind === 'teams') {
    const team = registry.teams.find((t) => t.slug === slug);
    if (!team) fail(`teams/${slug}/ is not a registered team. Ask an admin to add it to teams.json (the folder name must match the slug exactly).`);
    else if (!team.members.includes(author)) fail(`You (${AUTHOR}) are not listed under "${slug}" in teams.json, so you cannot publish to teams/${slug}/. Ask an admin to add your GitHub username to the team.`);
  }
}
if (outside.length) {
  fail(`You may only touch files inside your own folder(s) — these are outside it:`);
  for (const f of outside) console.log(`    ${f}`);
  console.log('  Member pages go in members/<your-github-username>/ (all lowercase). Team pages go in teams/<team-slug>/.');
}

// ---------------------------------------------------------- per-folder checks
for (const dir of folders) {
  const slug = dir.split('/')[1];
  if (!SLUG_RE.test(slug)) fail(`${dir}/ — folder names must be lowercase letters, digits and single hyphens.`);
  const { errors, count, bytes } = checkFolder(dir);
  if (errors.some((e) => e.endsWith('does not exist.'))) { console.log(`${dir}/ was removed.`); continue; }
  for (const e of errors) fail(e);
  console.log(`${dir}/: ${count} file(s), ${kb(bytes)} total.`);
}

finish();

function finish() {
  console.log();
  if (failed) { console.log('Validation failed. Fix the errors above and push again to this same PR.'); process.exit(1); }
  console.log('All checks passed. Your page goes live once a club admin merges this.');
  process.exit(0);
}
