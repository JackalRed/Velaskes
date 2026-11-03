# SMTHNG — Editorial Website

A bilingual static brand and B2B website for **SMTHNG**, an independent scented-candle studio in Porto, Portugal.

## Pages

- `/` — brand story, curated fragrance collection, materials, stockist call-to-action.
- `/stockists/` — partnership proposition for concept stores, consignment and wholesale enquiries.
- Portuguese by default. English toggle remembers the last selected language locally.
- `outreach/email-template-pt.html` — personalized one-image outreach email. Replace `{{NOME_DA_LOJA}}` before sending.

## Content and assets

The image files in `assets/img/` are **original SMTHNG photographs from the owner's Google Drive**, checked into this repository so the site does not rely on unstable Drive hotlinks.

The site intentionally **does not publish unapproved retail or wholesale prices**, promise free samples, or claim a specific fragrance is in stock. Partners request a tailored trade proposal.

## Local preview

No build tools are necessary. For correct folder routes, serve the repository root via a local server:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080/` and `http://localhost:8080/stockists/`.

## Deploy later

This is plain HTML/CSS/JavaScript. It can be deployed to Cloudflare Pages or another static host with **no build command** and **root (`/`) output**. Configure the domain `smthng.store` only after approving the visual QA. Nothing here changes existing DNS or production hosting.

## Before launch

- Approve copy and fragrance availability; check scent descriptions against current formulas.
- Confirm the outbound address `general@smthng.store` can receive enquiries.
- Confirm current brand terms and retail pricing in a separate commercial document.
- Review on mobile and desktop, including both languages.
- After domain launch, use `https://smthng.store/stockists/` in outreach.

Photos © SMTHNG. All rights reserved.
