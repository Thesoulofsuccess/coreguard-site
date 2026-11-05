# Coreguard

Website for Coreguard — building protection and surface systems (waterproofing, epoxy and PU flooring, decorative and permeable surfaces).

**Live:** https://www.coreguard.in

## Overview
- Goal: qualified enquiries from homes, buildings and industry, routed to WhatsApp
- Sections: hero (scanner lens), the system, audience journeys, system map, the Coreguard Diagnostic, capabilities, materials, project record, contact, privacy notice
- Stack: static HTML/CSS/JS, no build step. `support.js` renders the page; React 18.3.1 (MIT) is bundled in `public/vendor/`.

## Before launch
- Privacy notice is a draft: confirm retention period, responsible person and response time, and have it legally reviewed (DPDP Act, 2023)
- Diagnostic methods are marked "Pending approval" until the technical team confirms them
- Project records are "In preparation" until real evidence is available
- The "Prototype" label is on by default (`showBanner` in the page's settings)

## Deploy
Static assets in `public/`, served by Cloudflare via `wrangler.jsonc`.
