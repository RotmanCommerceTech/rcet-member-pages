# AGENTS.md — instructions for AI coding assistants

You are helping a team at **Rotman Commerce Emerging Technologies (RCET)** build
their team's page on the RCET team-pages site. Read this whole file before
writing code. (Humans: `README.md` is the friendlier version of the same thing.)

## What you are building

A static page — HTML, CSS and JavaScript, no build step — that lives in exactly
one folder:

```
teams/<team-slug>/index.html     ← required entry point
teams/<team-slug>/…              ← anything else the page needs (images, scripts, styles)
```

Team slugs, from `teams.json`: `marketing`, `research-development`,
`operations`, `business-development`, `finance`. If it is not obvious which
team the user is on, ask.

**Every team folder already contains a starter page.** Edit it rather than
starting from a blank file, unless the user explicitly wants a redesign from
scratch. It shows the shared header/footer, the tokens and a sensible section
order.

Personal pages work the same way in `members/<github-login>/` (one per
GitHub account).

## Hard rules — CI rejects anything else

1. **Only touch files inside the user's own folder.** Not `shared/`, not
   `teams.json`, not other teams, not `scripts/` or `.github/`. If something
   there needs changing, say so; an admin does it.
2. `index.html` must exist. Limits: 40 files, 2 MB per file, 10 MB per folder.
   Allowed types: `.html .htm .css .js .mjs .json .md .txt`, images
   (`png jpg jpeg gif webp avif svg ico`), fonts (`woff woff2 ttf otf`), media
   (`mp3 mp4 webm vtt`). No dotfiles, no symlinks, no `node_modules/`.
3. **Relative paths** for the folder's own assets: `./photo.jpg`, `./app.js`.
   The page is served at `/teams/<slug>/`, so an absolute `/photo.jpg` breaks.
   The only absolute paths you should write are `/shared/rcet.css`,
   `/shared/rcet.js`, `/shared/assets/…` and `/` (the directory).
4. **Static only.** No server, database, environment variables, secrets, or
   build step in CI. Frameworks with a build step are fine only if the built
   output is what gets committed (see below).
5. The page runs under a **Content-Security-Policy**:
   - Scripts: inline `<script>` is fine. External scripts only from
     `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, `unpkg.com`.
   - Styles: inline is fine; external from those CDNs and `fonts.googleapis.com`.
     Fonts from `fonts.gstatic.com`.
   - Images: any `https://` URL, `data:` and `blob:`. Media: same-origin only.
   - **No `fetch()` / XHR / WebSocket to any other origin** (`connect-src 'self'`),
     no `<iframe>`, no `<form action>` posting anywhere, no `<base>`, no plugins.
   So: no third-party APIs, analytics, embeds or newsletter forms. Put data
   inline or in a JSON file next to the page (same-origin fetch of your own
   files works). Link out instead of embedding.
6. **Keep it appropriate.** It carries the club's name and the members' real
   names. No impersonation, no login-style forms, nothing the team would not
   show a recruiter. Admins can revert any page without warning.

## Design system — how to look like the rest of the site

The main RCET site is white with navy, electric blue and cyan; big tight
display headlines; monospace labels. The shared stylesheet and components
encode that. Load them in `<head>` (the starter page already does):

```html
<link rel="stylesheet" href="/shared/rcet.css">
<script src="/shared/rcet.js" defer></script>
```

The starter page's `<head>` also carries the site favicon links; keep them.

Keep the shared header and footer as the first and last elements in `<body>`,
with the team's display name:

```html
<rcet-header team="Marketing"></rcet-header>
…your page…
<rcet-footer team="Marketing"></rcet-footer>
```

`shared/rcet.css` is short and is the source of truth — read it. Summary:

| Token | Light value | Use it for |
|---|---|---|
| `--rcet-navy` | `#192e4f` | dark sections, avatars, strong accents |
| `--rcet-blue` | `#1a6aff` | the accent: buttons, links, eyebrows (`--rcet-accent`) |
| `--rcet-cyan` | `#1ad7ff` | highlights, selection, dark-theme accent |
| `--rcet-pale` | `#d3e4ff` | tags, soft tinted backgrounds |
| `--rcet-bg` / `--rcet-bg-alt` | `#ffffff` / `#f3f6fb` | page / alternating section backgrounds |
| `--rcet-fg` / `--rcet-muted` | `#0f172a` / `#5b6577` | text / secondary text |
| `--rcet-line` | `#e2e8f0` | borders |
| `--rcet-font-display` | Inter Tight | headings, 700–800, tight tracking |
| `--rcet-font-body` | Inter | body copy, 17px / 1.65 |
| `--rcet-font-mono` | Azeret Mono | eyebrows, tags, numbers, handles |
| `--rcet-radius`, `--rcet-shadow` | 12px, soft | cards and images |

Classes: `.rcet-container` (1120px, 24px gutters) · `.rcet-section` and
`.rcet-section--alt` / `.rcet-section--dark` · `.rcet-hero` · `.rcet-eyebrow`
· `.rcet-lede` · `.rcet-section-head` · `.rcet-grid` with `--2` / `--3` / `--4`
· `.rcet-card` (use `<a class="rcet-card">` for clickable) · `.rcet-btn` with
`--primary` / `--ghost`, in a `.rcet-btn-row` · `.rcet-tag` · `.rcet-stat`
· `.rcet-person` + `.rcet-avatar` (initials `<span>` or an `<img>`) ·
`.rcet-prose` · `.rcet-center` · `.rcet-muted` · `.rcet-mono`.

Dark page: put `data-theme="dark"` on `<html>`. Every token swaps; nothing
else to change.

Imagery: `shared/assets/` is a served library from the old site — the logo,
the "Big Bang" hero, one poster per pillar, event photos, partner logos and
abstract blue renders (see `shared/assets/README.md`). Use them with absolute
paths (`/shared/assets/events/…`) instead of re-uploading; add the team's own
photos to the team folder.

Guidance:

- **Use the tokens, never the hex values.** One accent colour. Do not invent a
  new palette; personality comes from layout, imagery, copy and interaction.
- Light background by default. Big display `h1` with a mono `.rcet-eyebrow`
  above it. Generous whitespace, sections alternating `bg` / `bg-alt`,
  12px radius, 1px borders, soft shadows.
- Suggested order (the starter page): hero (team name, one-line purpose, two
  buttons) → numbers → what we do (three cards) → the team (people cards) →
  highlights (dated list) → contact (dark section). Reorder, drop or add
  sections freely, but keep a hero at the top and a way to contact the team
  at the bottom.
- **Real content beats lorem ipsum.** Ask the user for: what the team does
  (1–2 lines), members with roles, 3–6 things they shipped, what they are
  looking for (recruits, sponsors, speakers), any photos. Leave no
  placeholder text behind.
- Mobile first: single column under 760px; check at 375px and 1280px wide.
- Motion is welcome but subtle. `rcet.css` already disables transitions under
  `prefers-reduced-motion`.
- Accessibility: one `h1`, headings in order, alt text on images, contrast at
  least 4.5:1, keyboard focus visible (already handled).
- Libraries are fine (Three.js, GSAP, Chart.js, React…) from the three CDNs
  above. Prefer no library for things CSS can do.

## React, Vite and other frameworks

Preferred: plain HTML, CSS and JS. Nothing to build and easy to review.

Without a build step: React from a CDN (UMD builds of `react` and `react-dom`
from cdnjs/jsDelivr/unpkg) with `React.createElement`, or JSX through Babel
standalone in a `<script type="text/babel">` block.

If the user's tool produced a Vite / CRA / Next project, export it to static
files and commit **only the built output** into the team folder:

- Vite: set `base: './'` in `vite.config.*`, run `vite build`, copy the
  contents of `dist/` into `teams/<slug>/`. Keep the `/shared/…` `<link>` and
  `<script>` and the `<rcet-header>` / `<rcet-footer>` elements in
  `index.html` (put them in Vite's `index.html` so they survive the build).
- Next.js: `output: 'export'` with relative asset paths is fiddly; prefer Vite.
- Do not commit `src/`, `node_modules/`, lockfiles or config — the 40-file
  limit is there to stop exactly that.

## Preview locally

```bash
node scripts/serve.mjs
```

Builds the site, serves it at http://localhost:8787 with the production
headers, and rebuilds when files change. Open
`http://localhost:8787/teams/<slug>/`. If the browser console shows a CSP
error, fix it before publishing: the live site enforces the same policy.
Node 18+, no `npm install`.

## Publish

Pick whichever the user can do. The user's GitHub username must be listed
under their team in `teams.json` for A and B; that list is the only
credential — there are no tokens or keys to ask for.

- **A. Pull request** (you have git and the user is on the roster):
  `git checkout -b teams/<slug>`, commit only the team folder, push, open a PR
  against `main`. Two checks run in about 30 seconds: *Only your own folder*
  and *Site builds*. An admin merges; the page is live a minute later.
  `main` is protected — do not try to push to it directly.
- **B. Upload on GitHub** (no git): hand the user the files. On github.com they
  open `teams/<slug>/`, choose *Add file → Upload files*, drop the files in
  and click *Propose changes*. GitHub opens the PR for them.
- **C. Send a bundle** (no GitHub account): zip the team folder (or the built
  `dist/`) and send it to an admin, who imports it with
  `scripts/import-bundle.sh`.

## Definition of done

- Only `teams/<slug>/` changed; `index.html` present; within the limits.
- `/shared/rcet.css` and `/shared/rcet.js` loaded; `<rcet-header>` and
  `<rcet-footer>` present with the team name.
- `<title>Team Name | RCET</title>` and a `<meta name="description">` — both
  show on the directory page at `/`.
- No console errors at `http://localhost:8787/teams/<slug>/`; looks right at
  375px and 1280px.
- Real names and content the team signed off on; no placeholders left.
