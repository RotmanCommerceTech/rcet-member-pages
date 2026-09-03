// Stamps teams/_template/ into teams/<slug>/ for a team listed in teams.json.
//   node scripts/new-team.mjs <slug>            create
//   node scripts/new-team.mjs <slug> --force    overwrite an existing folder
import { cp, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadRegistry } from './lib.mjs';

const [slug, flag] = process.argv.slice(2);
if (!slug) { console.error('usage: node scripts/new-team.mjs <slug> [--force]'); process.exit(2); }
const team = loadRegistry().teams.find((t) => t.slug === slug);
if (!team) { console.error(`"${slug}" is not in teams.json. Add it there first.`); process.exit(1); }

const src = path.join(ROOT, 'teams', '_template');
const dest = path.join(ROOT, 'teams', slug);
if (existsSync(dest)) {
  if (flag !== '--force') { console.error(`teams/${slug}/ already exists (use --force to overwrite).`); process.exit(1); }
  await rm(dest, { recursive: true });
}
await cp(src, dest, { recursive: true });

const vars = { TEAM_NAME: team.name, TEAM_SLUG: team.slug, TEAM_BLURB: team.blurb };
for (const f of await readdir(dest, { recursive: true })) {
  const full = path.join(dest, f);
  if (!/\.(html?|css|m?js|json|md|txt|svg)$/i.test(f)) continue;
  const text = await readFile(full, 'utf8');
  await writeFile(full, text.replace(/\{\{(TEAM_[A-Z_]+)\}\}/g, (_, k) => vars[k] ?? _));
}
console.log(`Created teams/${slug}/ for "${team.name}".`);
