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

## Admins

The club's own pages are in `site/`, the roster of teams is `teams.json`, and
`scripts/` holds the build, the pull-request check and a few helpers. The
operating notes are kept outside this repo.
