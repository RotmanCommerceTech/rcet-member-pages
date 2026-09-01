# RCET Team Pages

Every member of the RCET team gets a folder in this repo and a page on the web at:

```
https://about.rotmancommercetech.com/u/<your-github-username>/
```

Write whatever you want in it — HTML, CSS, JavaScript, a React app, a canvas
demo, an unhinged 1998 GeoCities tribute. It is your corner of the internet.

---

## Add your page (no command line needed)

You do **not** need Git installed. Everything below happens in the browser.

1. Sign in to GitHub. If you don't have an account, make one — your username
   becomes your page's URL, so pick one you like.
2. Open **[`members/_template/index.html`](members/_template/index.html)** and copy its contents.
3. At the top of this repo, click **Add file → Create new file**.
4. In the filename box, type exactly:

   ```
   members/<your-github-username>/index.html
   ```

   All lowercase. GitHub will turn the slashes into folders as you type.
5. Paste the template in, edit it, and click **Propose new file**. GitHub will
   automatically fork the repo and open a pull request for you.
6. A bot checks your PR (about 30 seconds). Green tick = good. A club admin
   merges it, and your page is live about a minute later.

Need to change something afterwards? Edit your file and open another PR. You can
do this as many times as you want, including during and after the event.

### Adding images or extra files

Same idea — use **Add file → Upload files** and put them in your own folder.
Reference them with relative paths:

```html
<img src="./photo.jpg" alt="me">
<script src="./app.js"></script>
```

---

## The rules

There is exactly one hard rule, and CI enforces it:

> **You may only add or change files inside `members/<your-github-username>/`.**

Beyond that:

| Limit | Value |
|---|---|
| Entry point | `index.html` is required |
| Max file size | 2 MB |
| Max folder size | 10 MB |
| Max files | 40 |
| Allowed types | `.html .css .js .mjs .json .md .txt` · images · fonts · `.mp3 .mp4 .webm` |

**Libraries** load from cdnjs, jsDelivr, or unpkg. React works fine — grab the
UMD builds and write your components in a `<script type="text/babel">` block, or
just write plain JS.

**What won't work:** `fetch()` to third-party APIs is blocked by the site's
Content-Security-Policy, and so are HTML forms that post somewhere. This is on
purpose — see below.

**Keep it decent.** Your name is on it, and so is the club's. Nothing that would
embarrass you in a job interview, nothing that impersonates anyone, no
credential-harvesting jokes. Admins can revert any page without warning.

---

## Why is this on a different domain?

Because your JavaScript is *real* JavaScript, and browsers trust code by origin.
If member pages lived on `rotmancommercetech.com`, any one person's page could
read the cookies and storage of the main club site. So they live on their own
origin — `about.rotmancommercetech.com` — where the worst a page can do is
misbehave inside its own sandbox. Same reason GitHub serves user sites from
`github.io` and not `github.com`.

---

## Running it locally (optional)

If you do use Git and want to preview before opening a PR:

```bash
git clone https://github.com/Slimebro1231/rcet-member-pages.git
cd rcet-member-pages
node scripts/build.mjs
npx serve dist
```

Requires Node 18+. `scripts/build.mjs` copies every member folder into `dist/u/`
and regenerates the directory page. Nothing else — no framework, no `npm install`.

You can also just open your `index.html` in a browser directly; relative paths
work the same way.

---

## For admins

- **Review every diff before merging.** The CI guard catches accidents and lazy
  attacks, but it runs from the PR's own branch, so a determined contributor
  could edit the check itself. Your eyes are the real control — if a PR touches
  anything outside its author's folder, that is the signal.
- In **Settings → Actions → General**, set *Fork pull request workflows* to
  **Require approval for all outside collaborators**.
- Protect `main`: require the `Only your own folder` and `Site builds` checks.
- To take a page down, delete the folder and push. It disappears on next deploy.
