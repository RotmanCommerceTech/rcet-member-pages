# RCET website

The website of **Rotman Commerce Emerging Technologies**: the club's own pages
plus one page per team, each built by the team itself and published through
this repository. A pull request is the publish button.

Live at **https://rotmancommercetech.com/**

```
site/index.html                  ← home            (admins edit)
site/about/index.html            ← about, leadership, pillars
site/events/index.html           ← past events, upcoming = work in progress
teams/<slug>/                    ← one folder per team, index.html required (teams edit)
members/<github-username>/       ← optional personal pages (anyone edits their own)
shared/rcet.css, shared/rcet.js  ← the design system every page loads
shared/assets/                   ← logo, hero art, pillar posters, event photos, partner logos
content/                         ← text exported from the old Wix site, plus vetted design ideas
teams.json                       ← the teams, and who may publish to each (admins edit)
```

The directory of teams is generated at `/teams/`; team pages live at
`/teams/<slug>/`, member pages at `/u/<github-username>/`.

---

## Build your team's page

About ten minutes with an AI tool. No coding, no Git and no install required.

1. **Copy this link:** `https://github.com/RotmanCommerceTech/rcet-member-pages`
2. **Paste it into your AI tool** with the prompt from **[PROMPT.md](PROMPT.md)**.
   Claude Code, Cursor, Codex, Copilot, ChatGPT, Gemini, Lovable, v0, Bolt —
   anything. The repo contains [AGENTS.md](AGENTS.md), which tells the AI the
   rules and the design system, so every team's page comes out looking like
   part of the same site.
3. **Tell it about your team:** what you do, who's on it, what you shipped,
   what you're looking for. It edits the starter page in `teams/<your-team>/`.
4. **Publish**, whichever way fits:

| You used… | Then… |
|---|---|
| An AI tool with git (Claude Code, Cursor, Codex, Copilot agent) | Let it open the pull request. Done. |
| A chat tool that gives you files (ChatGPT, Lovable, v0, Bolt) | On GitHub open `teams/<your-team>/` → **Add file → Upload files** → drop them in → **Propose changes**. That is a pull request too. |
| Nothing with GitHub / no account | Zip the folder and email it to rotmancommercetech@gmail.com. An admin imports it. |

A bot checks the pull request in about 30 seconds (green tick = fine). An
admin merges; your page is live a minute later. Change it as often as you like.

**No sign-up, no keys.** Any GitHub account can open a pull request to a team
folder; an admin reads it and merges. (Once an admin lists usernames under a
team in [`teams.json`](teams.json), only those people can publish to it. Until
then the folder is open, and review is the control.)

---

## The rules

There is one hard rule, and CI enforces it:

> **You may only add or change files inside your own folder** —
> `teams/<your-team>/` or `members/<your-github-username>/`. One pull request
> should touch one folder. Everything else (the club's pages in `site/`, the
> shared styles, the scripts) is for admins.

Beyond that:

| Limit | Value |
|---|---|
| Entry point | `index.html` is required |
| Max file size | 2 MB |
| Max folder size | 10 MB |
| Max files | 40 |
| Allowed types | `.html .css .js .mjs .json .md .txt` · images · fonts · `.mp3 .mp4 .webm` |

**Libraries** load from cdnjs, jsDelivr or unpkg. React works: use the UMD
builds and Babel standalone, or build with Vite (`base: './'`) and commit the
output.

**What won't work:** `fetch()` to other sites, iframes and forms that post
anywhere are blocked by the site's Content-Security-Policy. On purpose — see
[Security](#security).

**Keep it decent.** Your name is on it, and so is the club's. Nothing that
would embarrass you in an interview, nothing that impersonates anyone, no
login-lookalike forms. Admins can revert any page without warning.

---

## Looking like one site

Every page loads the shared stylesheet and the shared header/footer:

```html
<link rel="stylesheet" href="/shared/rcet.css">
<script src="/shared/rcet.js" defer></script>
…
<rcet-header team="Marketing"></rcet-header>
…
<rcet-footer team="Marketing"></rcet-footer>
```

The stylesheet gives you the RCET colours (`var(--rcet-blue)` and friends),
the fonts, and ready-made cards, buttons, tags, stats and people rows. Keep the
header, footer and colour tokens; everything between them is yours. Prefer a
dark page? `<html data-theme="dark">`. Details and examples in
**[DESIGN.md](DESIGN.md)**.

---

## Personal pages

Members can also have a page of their own at `/u/<github-username>/`. Copy
[`members/_template/index.html`](members/_template/index.html) into
`members/<your-github-username>/index.html` (all lowercase) and open a PR.
Same rules; the design system is optional here.

---

## Run it locally

```bash
node scripts/serve.mjs
```

Builds the site into `dist/`, serves it at http://localhost:8787 with the
production headers, and rebuilds when you save. Node 18+, no `npm install`.
`node scripts/build.mjs` builds once without serving.

---

## For admins

### The club's own pages

`site/` holds the home, about and events pages as plain HTML on the shared
design system. Edit them like any other page (an AI tool with AGENTS.md works
here too) and push to `main`; they deploy in about a minute. Two build-time
snippets are available in these files: `<!-- TEAMS_GRID -->` (cards for every
team in `teams.json`) and `<!-- PARTNERS_STRIP -->` (the partner marquee; the
list is at the top of `scripts/build.mjs`). Leadership names live in
`site/about/index.html` under the LEADERSHIP comment.

### The roster (optional)

`teams.json` lists the teams. While a team's `members` list is empty, anyone
with a GitHub account can open a pull request to that team's folder and an
admin reviews it. Once you know people's GitHub logins, add them under their
team (case doesn't matter) and the folder is locked to them. Then, optionally,
invite them as collaborators so their CI runs without an approval click and
they don't need to fork:

```bash
scripts/add-collaborators.sh --from-teams
```

`admins` in `teams.json` may edit anything; keep it in sync with
`.github/CODEOWNERS`, which is what makes only admin approvals count toward
the required review.

### Event day

- Pull requests from people who are not collaborators run CI from a fork.
  The repo is set so only accounts *brand new to GitHub* need an admin to click
  **Approve and run** on their first PR; everyone else's checks run on their own.
- Two checks must be green: *Only your own folder* and *Site builds*. The first
  failure message tells the author exactly what to fix.
- Merge from the PR page; the site redeploys in about a minute. Merge often.

### Reviewing

Read every diff before merging. The CI guard catches accidents and lazy
attacks, but it runs from the PR's own branch, so a determined contributor
could edit the check itself. If a PR touches anything outside its author's
folder, that is the signal. Branch protection on `main` requires both checks
(*Only your own folder*, *Site builds*) and one code-owner approval.

### Importing a bundle someone emailed you

```bash
scripts/import-bundle.sh marketing ~/Downloads/marketing-page.zip --as theirgithublogin
```

Unpacks it into `teams/marketing/` on a new branch (uses `dist/` if it's a
built Vite project, strips `node_modules` and friends, rewrites `/assets/`
paths to relative), runs the validator, pushes, and opens the PR for you to
review. `--as` is optional and only records who made the page.

### Adding a team

Add it to `teams.json`, then `node scripts/new-team.mjs <slug>` stamps the
starter page into `teams/<slug>/`. Commit both.

### Hosting

**GitHub Pages (now).** `.github/workflows/deploy.yml` builds and publishes
`dist/` on every push to `main`. Enable it once:

```bash
gh api -X POST repos/RotmanCommerceTech/rcet-member-pages/pages -f build_type=workflow
```

The site appears at https://rotmancommercetech.com/ about a minute
after every push to `main`.

**Domain (done).** `rotmancommercetech.com` points at GitHub Pages: four `A`
records (185.199.108–111.153) on the apex and a CNAME `www` →
`rotmancommercetech.github.io`, all managed in the Wix DNS panel (Wix still
holds the registration). The `CNAME` file in the repo root tells the workflow
to build for `/`, and *Settings → Pages* carries the domain with HTTPS
enforced. `www` redirects to the bare domain. If DNS ever changes, re-check
*Settings → Pages*, and add the domain under *Verified domains* on the
organization so nobody else can claim it.

**Organization.** The repo lives in the `RotmanCommerceTech` organization so
it belongs to the club, not to a person. Keep at least two current execs as
organization owners so admin access survives graduation. If the repo is ever
moved or renamed again, `scripts/set-repo.sh <owner/repo>` rewrites every
reference in the docs and scripts.

**Cloudflare Pages (optional).** Build command `node scripts/build.mjs`,
output `dist`. `_headers` is honoured there for real HTTP headers.

**The Wix site is retired.** The domain now serves this repo; the Wix site
still exists in the Wix dashboard but is unreachable. The old `about.`
subdomain is no longer served (one custom domain per Pages site); delete
its DNS record, or point it at a tiny redirect site if old links matter.

### Security

Member and team JavaScript is *real* JavaScript, and browsers trust code by
origin. That is why these pages live on their own origin and not on
`rotmancommercetech.com`: the worst a page can do is misbehave inside its own
sandbox, and it can never read the main site's cookies or storage. Same
reason GitHub serves user sites from `github.io`.

The second line of defence is the Content-Security-Policy in `_headers`
(scripts only from three CDNs, no cross-origin `fetch`, no iframes, no form
posts). `scripts/build.mjs` also injects it into every page as a `<meta>` tag,
so it holds on hosts that ignore `_headers`, GitHub Pages included.

To take a page down: delete the folder, push. It disappears on the next deploy.
