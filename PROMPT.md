# The prompt

Copy the box that matches your tool, fill in the `<blanks>`, paste it in.
That is the whole setup.

Your team's slug (folder name): `marketing` · `research-development` ·
`operations` · `business-development` · `finance`

## Tools that can read a repo

Claude Code, Cursor, Codex, GitHub Copilot (agent mode), Gemini CLI, Jules,
Devin, Windsurf, and anything else that can clone and run git.

```text
Clone https://github.com/RotmanCommerceTech/rcet-member-pages and read AGENTS.md
before doing anything else. It has the rules and the design system — follow
it exactly.

I'm on the <TEAM NAME> team, folder teams/<team-slug>/. Build our team page
by editing the starter page already in that folder. Do not touch anything
outside it.

About us:
- What we do: <one or two lines>
- People: <Name — role; Name — role; …>
- What we've shipped: <3–6 things, with dates if you know them>
- What we're looking for: <new members / sponsors / speakers / …>
- Vibe: <clean and corporate / playful / bold / minimal / …> — but keep the
  shared header, footer and colour tokens.
- Photos: <none / attached / paths>

Preview it with `node scripts/serve.mjs`, check the browser console for CSP
errors, and check it at 375px and 1280px wide. When it's done, open a pull
request to main from a branch called teams/<team-slug>.
```

If the AI asks you for a token, password or key: it doesn't need one. Your
GitHub login (on the team roster) is the only credential. Ask an admin to add
you to `teams.json` if the PR check says you're not on the team.

## Tools that are a chat window

ChatGPT, Claude.ai, Gemini, Lovable, v0, Bolt, and similar. They can't open a
pull request, so you upload the files yourself afterwards (see below).

```text
I need a single static web page: one index.html plus optional CSS, JS and
image files. No build step, no server, no framework unless it compiles to
static files.

Read these two files and follow them exactly:
- https://raw.githubusercontent.com/RotmanCommerceTech/rcet-member-pages/main/AGENTS.md
- https://raw.githubusercontent.com/RotmanCommerceTech/rcet-member-pages/main/shared/rcet.css
Start from our current page:
- https://raw.githubusercontent.com/RotmanCommerceTech/rcet-member-pages/main/teams/<team-slug>/index.html
If you can't open links, say so and I'll paste them.

I'm on the <TEAM NAME> team at Rotman Commerce Emerging Technologies (RCET).
The page will be served at /teams/<team-slug>/ and must keep the
<link> to /shared/rcet.css, the <script> for /shared/rcet.js, and the
<rcet-header team="<TEAM NAME>"> and <rcet-footer team="<TEAM NAME>"> elements.
Use only var(--rcet-*) colours. Any other file must be referenced with a
relative path like ./photo.jpg.

About us:
- What we do: <one or two lines>
- People: <Name — role; Name — role; …>
- What we've shipped: <3–6 things, with dates if you know them>
- What we're looking for: <new members / sponsors / speakers / …>
- Vibe: <clean and corporate / playful / bold / minimal / …>

Give me every file in full, with its file name, ready to upload.
```

Then publish:

1. Go to https://github.com/RotmanCommerceTech/rcet-member-pages/tree/main/teams/<team-slug>
2. **Add file → Upload files**, drop the files in (replace `index.html`).
3. Write a one-line description and click **Propose changes**. That opens a
   pull request; a bot checks it in about 30 seconds.
4. An admin merges it. The page is live a minute later.

No GitHub account? Zip the files and email them to
rotmancommercetech@gmail.com with your team name. An admin imports them.
