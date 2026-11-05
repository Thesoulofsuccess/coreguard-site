# Coreguard

Website for Coreguard — designed surfaces, building protection and permeable surfaces.

**Live:** https://www.coreguard.in

## Overview
- Goal: qualified enquiries from homes, buildings and industry, routed to WhatsApp
- Sections: hero (three pillars), designed surfaces, building protection (system map), permeable surfaces (cutaway), how systems are built, starting point, the Diagnostic, materials & technology, projects, contact, privacy notice
- Company profile PDF: public/Coreguard-Company-Profile.pdf (8 pages, same three pillars)
- Stack: static HTML/CSS/JS, no build step. `support.js` renders the page; React 18.3.1 (MIT) is bundled in `public/vendor/`.

## Before launch
- Privacy notice is a draft: confirm retention period, responsible person and response time, and have it legally reviewed (DPDP Act, 2023)
- Diagnostic methods are marked "Pending approval" until the technical team confirms them
- Project records are "In preparation" until real evidence is available
- The "Prototype" label is on by default (`showBanner` in the page's settings)

## Deploy
Static assets in `public/`, served by Cloudflare via `wrangler.jsonc`.
