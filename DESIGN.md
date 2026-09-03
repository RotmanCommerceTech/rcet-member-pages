# Design guide

The point of the shared design system is that six pages built by six teams
with six different AI tools still read as one site. The system is small on
purpose: a stylesheet, two web components, and a handful of rules. Everything
here lives in [`shared/rcet.css`](shared/rcet.css) and
[`shared/rcet.js`](shared/rcet.js); this document explains it.

## The aesthetic in one paragraph

Think Apple product page, scaled to a student club: calm, confident, spacious.
One idea per section. An oversized headline, one short muted line, then air.
Real photos, wide, rounded, softly shadowed. The page's big statement lives in
a dark navy section. Small mono labels introduce sections, one accent colour
does all the pointing, and motion is scroll-driven and quiet. Loud is wrong.

## The look

It follows the main RCET site: **white background**, deep navy, an electric
blue accent, cyan highlights. Big, tight display headlines with a small
monospace label ("eyebrow") above them. Lots of air between sections.
Rounded cards with hairline borders and a soft shadow.

```
navy   #192e4f   ██   dark sections, avatars, strong contrast
blue   #1a6aff   ██   the accent (buttons, links, eyebrows)
cyan   #1ad7ff   ██   highlights, selection, the accent on dark
pale   #d3e4ff   ██   tags, tinted backgrounds
ink    #0f172a   ██   text
```

Type: **Inter Tight** for headings (700–800, letter-spacing −0.02em),
**Inter** for body (17px / 1.65), **Azeret Mono** for eyebrows, tags,
numbers and handles. All three load from Google Fonts through the shared
stylesheet; you do not need to add them.

## Use it

In `<head>`:

```html
<link rel="stylesheet" href="/shared/rcet.css">
<script src="/shared/rcet.js" defer></script>
```

First and last thing in `<body>`:

```html
<rcet-header team="Operations"></rcet-header>
…
<rcet-footer team="Operations"></rcet-footer>
```

The header and footer are rendered as ordinary HTML (no shadow DOM), so your
CSS can restyle them if you must. Please don't remove them: they are how a
visitor gets back to the other teams and to the main site.

## Tokens

Write `var(--rcet-blue)`, never `#1a6aff`. Pages that use the tokens keep
working when the palette is tuned, and flip to dark mode for free.

| Purpose | Token |
|---|---|
| Page background / alternate section | `--rcet-bg` / `--rcet-bg-alt` |
| Card surface, borders | `--rcet-surface`, `--rcet-line` |
| Text, secondary text | `--rcet-fg`, `--rcet-muted` |
| Accent and text-on-accent | `--rcet-accent`, `--rcet-accent-fg` |
| Brand colours | `--rcet-navy` `--rcet-blue` `--rcet-cyan` `--rcet-pale` |
| Fonts | `--rcet-font-display` `--rcet-font-body` `--rcet-font-mono` |
| Radius, shadow | `--rcet-radius` (12px), `--rcet-radius-sm`, `--rcet-shadow` |
| Layout | `--rcet-container` (1120px), `--rcet-gutter` (24px), `--rcet-section-y` |

**Dark page:** `<html data-theme="dark">`. The accent becomes cyan, surfaces
become navy. Nothing else to do.

## Components

```html
<section class="rcet-hero">
  <div class="rcet-container">
    <p class="rcet-eyebrow">RCET · Finance</p>
    <h1>Finance</h1>
    <p class="rcet-lede">One line on what the team is for.</p>
    <div class="rcet-btn-row">
      <a class="rcet-btn rcet-btn--primary" href="#team">Meet the team</a>
      <a class="rcet-btn rcet-btn--ghost" href="#contact">Work with us</a>
    </div>
  </div>
</section>

<section class="rcet-section rcet-section--alt">
  <div class="rcet-container">
    <div class="rcet-section-head">
      <div><p class="rcet-eyebrow">What we do</p><h2>Three things we own</h2></div>
      <p>Optional one-liner on the right.</p>
    </div>
    <div class="rcet-grid rcet-grid--3">
      <div class="rcet-card"><span class="rcet-tag">01</span><h3>Budgets</h3><p>…</p></div>
      <div class="rcet-card rcet-person"><span class="rcet-avatar">MP</span><div><b>Megan Phan</b><span>Director</span></div></div>
      <div class="rcet-stat"><b>27</b><span>events</span></div>
    </div>
  </div>
</section>

<section class="rcet-section rcet-section--dark" id="contact">…</section>
```

- `.rcet-section` alternates with `--alt`; use `--dark` once, usually for
  the closing call-to-action.
- `.rcet-grid` is responsive on its own; `--2/--3/--4` set the target column
  count on wide screens.
- `<a class="rcet-card">` makes a whole card clickable with a hover lift.
- `.rcet-avatar` takes initials in a `<span>` or a photo as an `<img>`.

## Imagery

`shared/assets/` holds the logo, the old hero artwork, a poster for each of the
five pillars, event photos, partner logos and the abstract blue renders from
the old site — see [`shared/assets/README.md`](shared/assets/README.md). Use
them by absolute path (`/shared/assets/pillars/data-ai.jpg`); put your own
photos in your team folder and reference them relatively.

## Built-in extras

All optional, all in `shared/rcet.css` + `rcet.js`, all off unless you use them:

- **Icons** — Lucide line icons, self-hosted: `<svg class="rcet-icon"><use href="/shared/assets/icons.svg#megaphone"/></svg>`.
  Wrap in `.rcet-icon-badge` for a tinted square. Symbol names are listed in the sprite file.
- **Backgrounds** — `.rcet-bg-dots` (pale dot grid) and `.rcet-bg-mesh` (soft brand blooms) on any section.
- **Constellation** — `<section class="rcet-hero rcet-hero--art" data-constellation>` draws a slow
  network of dots behind the hero. Off under reduced motion; pauses off-screen.
- **Reveal on scroll** — add `data-reveal` to cards; `style="--i:2"` staggers siblings.
- **Scroll-lit statement** — put `data-words` on a big heading; its words brighten one by one
  as the reader scrolls. Best once per page, in a dark section (see the About page).
- **Marquee** — `.rcet-marquee > .rcet-marquee__track` with the logos repeated twice; pauses on hover.
- **Count-up numbers** — `<b data-count="130" data-suffix="+">130+</b>` inside `.rcet-stat`; `data-format="k"` shows 1.8k.
- **`.rcet-cinematic`** on any image for the bigger radius and soft shadow; `.rcet-grid--wrap-center` on a
  grid whose last row would otherwise sit alone on the left.
- **Skip link and print styles** come with `<rcet-header>`; give your `<main>` the id `main`.

More ideas, libraries and free illustration sources, all licence-checked and CSP-compatible:
[`content/design-ideas.md`](content/design-ideas.md).

## Do / don't

**Do**
- Start from your team's starter page; it already has the right bones.
- Put real names, real dates and real outcomes on the page.
- Add personality in the body: an illustration, a canvas background, a
  timeline, a playful interaction, a photo grid.
- Test on a phone (375px) and a laptop (1280px).
- Keep it fast: compress images (WebP, under 300 KB each is plenty).

**Don't**
- Introduce a second accent colour or a different font family.
- Remove or hide the shared header and footer.
- Use absolute paths for your own files (`/photo.jpg`); use `./photo.jpg`.
- Load anything from a domain the CSP does not allow — check the console.
- Leave placeholder text ("Person Name", "Something you did") on a live page.

## Why it's this strict about colours and not about layout

Colour and type are what people notice first when two pages don't belong
together. Layout is where a team's character shows. So the tokens are fixed,
the header and footer are fixed, and everything between them is yours.
