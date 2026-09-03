# Design ideas and vetted libraries

Researched on 2 September 2026 for the RCET site. Every CDN URL and licence below was
checked live at the time. All of it works under the site's Content-Security-Policy
(scripts only from cdnjs, jsDelivr or unpkg; styles from those plus Google Fonts).
Several items are already built into `shared/rcet.css` / `rcet.js`: the Lucide sprite
(`shared/assets/icons.svg`), `.rcet-bg-dots`, `.rcet-bg-mesh`, `data-reveal`,
`.rcet-marquee`, `data-constellation`, the skip link and print styles.


## 1. Icon set

**Top pick: Lucide** — clean 1.5–2px stroke line icons, closest match to the circuit-head mark's line-art style.

- **Lucide** — https://lucide.dev · ISC license (verified) · sprite: `https://cdn.jsdelivr.net/npm/lucide-static@1.39.0/sprite.svg` (200), or per-icon `https://cdn.jsdelivr.net/npm/lucide-static@1.39.0/icons/cpu.svg`. Symbol IDs are bare names (`#cpu`, `#shield`, `#network`). **How to use here:** self-host the ~sprite (small, single file) so every team page shares one icon set with zero extra requests.
  ```html
  <svg width="20" height="20" aria-hidden="true" stroke="currentColor" fill="none">
    <use href="/assets/lucide-sprite.svg#cpu"/>
  </svg>
  ```
- **Phosphor Icons** — https://phosphoricons.com · MIT (verified) · `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/style.css` (also on unpkg, same path, both 200). **How to use here:** its "duotone" weight can echo the navy/cyan two-tone brand on the five pillar icons. `<i class="ph ph-cpu"></i>`.
- **Tabler Icons** — https://tabler.io/icons · MIT (verified) · `https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/3.46.0/tabler-icons.min.css`, or per-icon SVG `https://cdn.jsdelivr.net/npm/@tabler/icons@3.46.0/icons/outline/cpu.svg`. **How to use here:** largest set (5,900+) — fallback if a very specific tech metaphor (radar, lock, chip) isn't in Lucide.

## 2. Background / visual texture

**Top pick: pure-CSS dot grid** — zero JS, zero requests, instant paint.

- **Dot grid (pure CSS)** — no license needed. **How to use here:** pale-blue dots on white behind hero/section breaks.
  ```css
  .bg-dots{background-image:radial-gradient(#d3e4ff 1.5px,transparent 1.5px);background-size:22px 22px}
  ```
- **Gradient mesh (pure CSS)** — layered radial-gradients in navy/blue/cyan. **How to use here:** soft brand-colored blooms behind the directory hero, no library.
  ```css
  .bg-mesh{background:radial-gradient(40% 50% at 15% 20%,#1a6aff33,transparent),
    radial-gradient(35% 45% at 85% 15%,#1ad7ff33,transparent),
    radial-gradient(50% 60% at 50% 100%,#192e4f22,transparent);}
  ```
- **tsParticles (constellation/network)** — https://particles.js.org · MIT · `https://cdn.jsdelivr.net/npm/@tsparticles/slim@4.4.0/tsparticles.slim.bundle.min.js` (≈43.6 KB gzipped, verified via response headers). **How to use here:** a moving constellation visually rhymes with the circuit-head logo; use only on the homepage hero, cap `number.value` to ~40 on mobile.
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@tsparticles/slim@4.4.0/tsparticles.slim.bundle.min.js"></script>
  <script>
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    tsParticles.load("bg",{particles:{number:{value:40},links:{enable:true,color:"#1a6aff"},
      move:{enable:true,speed:.6},color:{value:"#192e4f"}},background:{color:"transparent"}});
  }
  </script>
  ```
- **Subtle noise** — inline SVG `feTurbulence` as a CSS data-URI, zero requests. **How to use here:** 2–3% opacity grain over pale-blue sections avoids a flat "crypto-landing" gradient look.
- **three.js** (flag, don't default to) — `https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js` (200) but ≈146 KB gzipped even in the older classic build (verified). Only worth it for a literal rotating 3D wireframe hero moment; skip for a no-build-step club site otherwise.

**Perf/motion note:** any animated background must pause on tab-hide (`visibilitychange`), gate behind `prefers-reduced-motion`, and load `defer`.

## 3. Illustration & image sources

**Top pick: unDraw** — https://undraw.co · custom free license (verified at /license): commercial use OK, **no attribution required**, cannot resell/repackage or use to train AI. Has an in-browser color picker that recolors the entire SVG to one hex. **How to use here:** set the picker to `#1a6aff` and export matching empty-state/hero graphics.

- **Open Peeps / Humaaans** (Pablo Stanley) — https://www.openpeeps.com · **CC0** (verified, public domain) · explicitly built to be recolored: "black and white are just a starting point." **How to use here:** flat line-art people for a "meet the team" or about-page illustration that echoes the line-art logo.
- **Blush** — https://blush.design · free custom license (verified at /license): no attribution, commercial OK, modification/recoloring OK; cannot resell the illustrations themselves. **How to use here:** its curated Open Peeps collection lets you recolor + export directly to navy/cyan in-browser.
- **DrawKit** — https://www.drawkit.com · free tier, no attribution for commercial use, no resale/AI-training. **How to use here:** "Big Head" or "Space" free packs for a lighter, less-generic alternative to unDraw.
- **Haikei** — https://haikei.app · free, no signup (verified terms at /terms) — generates blob/wave/network SVG backgrounds, not for building a competing generator. **How to use here:** export a "Blob" or "Stacked Waves" shape, recolor to `#192e4f`/`#1ad7ff`, use as a section divider — ties directly into Section 2.
- **Unsplash / Pexels** — https://unsplash.com/license, https://www.pexels.com/license (both verified) — no attribution required, commercial OK, cannot resell unaltered. **How to use here:** real photography for Northbound conference/event recap pages, not for illustration-style brand graphics.

## 4. Micro-interactions & motion

**Top pick: vanilla scroll-reveal via IntersectionObserver** — no library, works everywhere, trivially respects reduced motion.

```css
.reveal{opacity:0;transform:translateY(16px);transition:.5s ease}
.reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.reveal{transition:none;opacity:1;transform:none}}
```
```js
document.querySelectorAll('.reveal').forEach(el=>new IntersectionObserver(([e],o)=>{
  if(e.isIntersecting){e.target.classList.add('in');o.disconnect();}
},{threshold:.2}).observe(el));
```
- **Count-up stat numbers** (vanilla, `requestAnimationFrame`) — good for "5 pillars / 5 teams / X partners." **How to use here:** trigger the same IntersectionObserver above on the stats band.
- **Hover-tilt team cards** (vanilla) — subtle 3D tilt on directory cards on mousemove, reset on mouseleave. **Too much if:** combined with drop shadows *and* a magnetic button *and* a background animation on the same card — pick one flourish per element.
- **GSAP + ScrollTrigger** — https://gsap.com · **now 100% free for commercial use** as of April 2025, including all former Club plugins (verified at gsap.com/licensing; only restriction is building a competing no-code animation builder). `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/gsap.min.js` + `.../ScrollTrigger.min.js` (both 200, core ≈27.6 KB gzipped). **How to use here:** staggered reveal of team-grid cards.
- **AOS (Animate on Scroll)** — https://michalsnik.github.io/aos/ · MIT (verified) · `https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css` + `.../aos.js` (≈4.6 KB gzipped) — declarative `data-aos="fade-up"`, no JS to write. Lighter alternative to GSAP for simple fades.
- **Zero-JS extras** — CSS `@keyframes` marquee for the partner-logo strip (pause on hover + `prefers-reduced-motion`), and the native `@view-transition{navigation:auto}` rule for page-to-page nav — cross-document support is Chromium-only so far (verified via Chrome for Developers docs), but it's a free progressive enhancement that no-ops elsewhere.

## 5. Inspiration

**Top pick: basement.studio** — closest visual register to RCET's brand (huge tight display type + monospace labels + tech-forward, not crypto-flashy).

Student/hackathon/university sites:
- **Hack the North** — https://hackthenorth.com (verified live) — illustrated storybook homepage; borrow its whimsical, fully-illustrated 404 page as a "how far you could go" reference, not the playful tone itself.
- **UTMIST** (UofT AI club) — https://www.utmist.ca (verified) — stats band + sponsor-logo grid + FAQ accordion with plus-icon disclosure; a direct UofT peer to model information architecture on.
- **UofT Blueprint** — https://uoftblueprint.org (verified) — dual-audience CTA structure (students vs. partner orgs) and a "Coming Soon" tag pattern on unbuilt project cards — directly reusable for unbuilt RCET team pages.
- **ETHGlobal** — https://ethglobal.com (verified) — huge tight bold headline paired with a Humaaans/Blush-style flat gradient illustration, proof that this illustration style reads as technical, not childish.
- **nwPlus** (UBC hackathon collective) — https://nwplus.io (verified, 200) — multi-event hub model (nwHacks/cmd-f/HackCamp under one brand), relevant if RCET's Northbound needs its own sub-brand page.
- **Major League Hacking** — https://mlh.io (verified, 200) — sponsor-tier presentation pattern worth borrowing for RCET's Microsoft/Meta/AWS/BDO/SAP/Cohere partner section.

Team/people pages:
- **Pentagram** — https://www.pentagram.com/about (verified) — uniform square-cropped portraits standardize 24 partners' varied source photos into one consistent grid.
- **basement.studio** — https://basement.studio (verified live) — huge tight headline over a real-time WebGL wireframe hero, plus a monospace pill-toggle label ("HUMAN / MACHINE") that's almost identical in spirit to an Azeret Mono eyebrow label.
- **Vercel** — https://vercel.com/about (verified) — eyebrow-label typography for section headers and credential-first one-line bios ("Creator of React") instead of generic descriptions.
- **Ueno** — https://ueno.co (verified live) — horizontal marquee of client names separated by a circle glyph (○); adapt as a text/logo marquee for RCET's partner list.

## 6. Finishing touches

- **Favicon** — self-host an SVG mark (recolored circuit-head, can respond to `prefers-color-scheme` internally) + `favicon.ico` + 180×180 `apple-touch-icon.png`; generate the fallback set at https://realfavicongenerator.net (verified 200). No CDN dependency.
- **OG image** — 1200×630 PNG/JPG, keep logo/title inside the center ~1080×600 safe zone (SVG not supported by any platform); one shared `/og-default.png`, optionally swap per team page.
- **Coming-soon state** — keep the route live (not a 404): small monospace "COMING SOON" eyebrow badge + pillar icon + link back to the directory, mirroring UofT Blueprint's project-card pattern (Section 5).
- **Dark mode** — default to `prefers-color-scheme`; optional toggle writes `[data-theme]` on `<html>` + `localStorage`; inline a tiny blocking script before CSS to avoid a flash of the wrong theme.
- **Skip link** — first element in `<body>`, visually hidden until `:focus`: `<a class="skip-link" href="#main">Skip to content</a>`.
- **Print styles** — `@media print{nav,.bg-dots,.bg-mesh,button{display:none}a[href]:after{content:" (" attr(href) ")"}}`.
- **404 page** — on-brand and restrained: monospace "404 // SIGNAL LOST" eyebrow, circuit-head mark with one dashed/broken line, link back to the directory.

## 7. Fonts

Confirmed live at Google Fonts, exact weights verified by fetching the stylesheet directly:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Azeret+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```
Inter Tight serves 400/500/600/700/800 (900 also exists if ever needed); Inter and Azeret Mono serve 400/500/600/700 on this endpoint.

Alternative display fonts if Inter Tight ever feels generic (both verified live, pair well with Azeret Mono):
- **Space Grotesk** — https://fonts.google.com/specimen/Space+Grotesk · SIL OFL · `family=Space+Grotesk:wght@400;500;600;700` (200). Same geometric-sans DNA as a mono grid, more "developer tool" personality, still institutional rather than startup-y.
- **Sora** — https://fonts.google.com/specimen/Sora · SIL OFL · `family=Sora:wght@400;500;600;700;800` (200). Rounder terminals soften the tech-forward look just enough to stay approachable for a student club.
