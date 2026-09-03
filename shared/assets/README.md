# Shared assets

Served at `/shared/assets/…` and available to every page. Exported from the old
Wix site on 2 September 2026 and resized for the web. Reference them with an
absolute path, e.g. `<img src="/shared/assets/pillars/data-ai.jpg" alt="…">`.

| Folder | What | Notes |
|---|---|---|
| `brand/` | `logo.png` (1024), `logo-256.png`, `hero-bigbang.jpg` | The blue circuit-head mark is the logo; the header uses `logo-256.png`. The old site had no image wordmark — the name is always set in type. |
| `pillars/` | One poster per pillar (1080×1080) | RCET-made: Data & AI, Extended Reality, Sustainable Technologies, Computing & Connectivity, Information & Security. |
| `events/` | Photos and posters from past events | Commerce & Connection (Oct 2024), AI Transformation Competition + workshops (Nov 2024), Northbound (poster, venue, white pixel banner), Tech & Tonic (Nov 2025, from Instagram), Ship & Sip and the mentorship program posters (2026, from Instagram). |
| `partners/` | Partner and academic logos | Microsoft, Meta, AWS, SAP, Vanguard, Cohere, BDO, Harvard, Columbia, Stanford, Yale; `-white` variants of Meta and Microsoft for dark backgrounds. Use only where a real partnership applies. |
| `decor/` | Abstract blue renders, an iridescent glass render (`glass-1.jpg`), Toronto map, CN Tower timeline | The old site's decorative art; on-brand backgrounds and accents. |
| `icons.svg` | Lucide icon sprite (ISC) | `<svg class="rcet-icon"><use href="/shared/assets/icons.svg#megaphone"/></svg>`; symbol ids are the Lucide names. |
| `people/` | `forest-li.jpg` (President), `jeffrey-zhang.jpg` (Vice President), `portrait-about-page.jpg` | Leadership portraits used on the About page; the last one is from the old site, identity unconfirmed. |

Keep additions small (photos ≤ 1600px, ≈ 300 KB). Admins edit this folder;
team folders can't.
