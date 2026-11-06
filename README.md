# coreguard.in

Static site served by Cloudflare from `public/` (see `wrangler.jsonc`). Push the whole folder; delete anything in the repo's `public/` that is not in this package.

## Pages
- `index.html` — homepage: film hero, Collections, Building protection, Permeable, How we work, enquiry
- `designed-surfaces.html`, `building-protection.html`, `permeable-surfaces.html` — pillar pages
- `privacy.html` — privacy notice
- `sitemap.xml`, `robots.txt` — for search engines (submit the sitemap in Google Search Console)

Each page carries a pre-rendered HTML copy of its content (`<div id="ssr">`), so search engines and link previews can read it without JavaScript. It is swapped for the live page as soon as the scripts start.

## Hero
- `hero-film.js` — the film (Desire, Craft, Reveal, Possibilities), pause, chapters, finish picker, Collections tabs
- `hero-block.js` — the 3D cutaway (uses `vendor/three.min.js`)
- `cg-hero.css` — hero and Collections styles
- `assets/hero/` — rendered scenes, depth maps (`d-*.jpg`), card images, Collections tiles (`c/`)

## Shared
- `cg-site.css`, `cg-site.js` — site styles; header, forms, brochure download
  - `CG_ENDPOINT` in `cg-site.js`: paste a form endpoint (Web3Forms, Formspree…) to also receive enquiries by email.

## Before launch, replace or confirm
- Collections tiles marked "Inspiration image" and the pathway concept visual are not Coreguard projects.
- Tiles marked "Photo · ownership to confirm": confirm these are Coreguard's own work.
- Only list finish categories Coreguard supplies and executes.
- Build-ups are illustrative until approved by the technical team.
- Privacy notice: legal review.
