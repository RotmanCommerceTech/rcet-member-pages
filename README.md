# RCET Team Pages

The teams behind **Rotman Commerce Emerging Technologies**, each with a page
built by the team itself and published through this repository. Every team
owns one folder; a pull request is the publish button.

- Live site: https://slimebro1231.github.io/rcet-member-pages/ (moving to
  `about.rotmancommercetech.com` — see [Hosting](#hosting))
- Main club site: https://www.rotmancommercetech.com/ (stays on Wix)

```
teams/marketing/                 ← one folder per team, index.html required
teams/research-development/
teams/operations/
teams/business-development/
teams/finance/
members/<github-username>/       ← optional personal pages
shared/rcet.css, shared/rcet.js  ← the design system every page loads
shared/assets/                   ← logo, hero art, pillar posters, event photos, partner logos
content/                         ← text exported from the old Wix site, for the main-site redo
teams.json                       ← who may publish to which team (admins edit)
```

---

## Build your team's page

About ten minutes with an AI tool. No coding, no Git and no install required.

1. **Copy this link:** `https://github.com/Slimebro1231/rcet-member-pages`
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

**One thing to do first:** your GitHub username has to be on your team's list
in [`teams.json`](teams.json). Send it to an admin. That list is the only
"key" — nobody needs a password, token or invite code.

---

## The rules

There is one hard rule, and CI enforces it:

> **You may only add or change files inside your own folder** —
> `teams/<your-team>/` (if you're on that team's list) or
> `members/<your-github-username>/`.

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

### The roster

`teams.json` is the access list. Add each person's GitHub login under their
team; case doesn't matter. Then invite them as collaborators so their CI runs
without an approval click and they don't need to fork:

```bash
scripts/add-collaborators.sh --from-teams
```

Invitations must be accepted before someone can push — send them the day
before, not during. `admins` in `teams.json` may edit anything; keep it in
sync with `.github/CODEOWNERS`, which is what makes only admin approvals
count toward the required review.

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
gh api -X POST repos/Slimebro1231/rcet-member-pages/pages -f build_type=workflow
```

The site appears at https://slimebro1231.github.io/rcet-member-pages/ a minute
after the next push.

**Custom domain (do this before linking from the main site).** Nobody should
see a personal GitHub username in the club's URL.

1. In Wix → Domains → *rotmancommercetech.com* → Manage DNS records, add a
   **CNAME** record: host `about`, value `slimebro1231.github.io` (the current
   Pages host; check the Pages settings after any repo move).
2. Wait until `dig +short about.rotmancommercetech.com` returns something.
3. Add a file named `CNAME` at the repo root containing
   `about.rotmancommercetech.com`, then tell GitHub:

   ```bash
   gh api -X PUT repos/Slimebro1231/rcet-member-pages/pages -f cname=about.rotmancommercetech.com -F https_enforced=true
   ```

   The workflow sees the file and builds for `/` instead of `/rcet-member-pages/`.
   HTTPS provisions itself within about an hour. Also add the domain under
   GitHub *Settings → Pages → Verified domains* so nobody else can claim it.

**Move the repo to a club organization (recommended).** The site should
belong to RCET, not to whoever set it up. Create a free GitHub organization
(*New organization → Free*, e.g. `RotmanCommerceTech`), then:

```bash
gh api -X POST repos/Slimebro1231/rcet-member-pages/transfer -f new_owner=<OrgName>
scripts/set-repo.sh <OrgName>/rcet-member-pages
```

The transfer keeps history, PRs, branch protection and redirects the old URLs.
`scripts/set-repo.sh` rewrites every reference in the docs and scripts; commit
and push the result. Make the current execs organization owners so admin
access survives graduation.

**Cloudflare Pages (optional).** Build command `node scripts/build.mjs`,
output `dist`. `_headers` is honoured there for real HTTP headers.

**Showing the pages on the Wix site.** Wix can't host these files itself, but
it can link to them or embed them. Add a nav item pointing at the directory,
or drop an *Embed HTML* element on a Wix page with:

```html
<iframe src="https://slimebro1231.github.io/rcet-member-pages/teams/marketing/"
        style="width:100%;height:100vh;border:0" loading="lazy" title="Marketing team"></iframe>
```

The headers allow embedding from `rotmancommercetech.com` and Wix domains only.

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
