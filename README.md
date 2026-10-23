# Boutique Mortgage — boutiquemtg.com

Private-client mortgage brand site for **West Coast Capital Mortgage Inc.** (NMLS #2817729 · CA · FL · TX).
Static HTML/CSS/JS, no bundler, deployed on Netlify from the repo root. Three Netlify Functions add the
integrations shared with the rest of the WCCM network.

## What's in here

| Piece | Where | Notes |
|---|---|---|
| Landing page | `index.html` | Hero scenario stack, live rates board, pillars, programs, process, payment estimator, Strategy Studio promo, AI concierge, markets, founder, lead form + scheduler, footer |
| Strategy Studio | `studio.html` | Embeds the WCCM property-location engine (`californiamtg.com/studio/`, same engine as Before Jumbo Loan / K West) |
| Legal | `disclosures.html`, `privacy.html` | Licensing, EHO, AI + SMS disclosures, privacy |
| Styles / scripts | `assets/css/styles.css`, `assets/js/main.js`, `assets/js/i18n.js`, `assets/js/consent.js` | Dark boutique design system, interactions, EN/ES/RU/中文, consent-gated tags |
| AI concierge | `netlify/functions/concierge.mjs` | Claude via `@anthropic-ai/sdk`, compliance system prompt, server-side key, scenario summary hand-off |
| Rates proxy | `netlify/functions/rates.mjs` | Mirrors `westcoastcapitalmortgage.com/assets/rates.json` — update rates once on the corporate site |
| CRM relay | `netlify/functions/submission-created.mjs` | Netlify Forms event → GR CRM `lead-inbound` (same pipeline as the other brand sites) |

## Integrations wired in

- **Lead capture** — Netlify Form `boutique-scenario` (honeypot, attribution hidden fields: UTM, gclid/gbraid/wbraid/fbclid, landing/conversion page, referrer, submission_id, language, concierge summary). AJAX submit with retry; falls back to the native POST → `/thanks.html`.
- **GR CRM** — every verified submission is relayed server-side to `grcrm.com/.netlify/functions/lead-inbound` with the per-source token.
- **Conversion tracking** — GTM `GTM-K2X3X454`, Google Ads `AW-18417657219` + lead conversion, GA4 `G-GB57YWMKBH`, Microsoft Clarity — all loaded only after cookie consent. Accepted leads push `wccm_lead_submit` with a `lead_event_id` (same event name as the corporate site, so existing GTM triggers work).
- **AI concierge** — Claude-powered chat that explains programs, organizes the scenario and hands it to a loan officer; never quotes or approves; multilingual. Summaries flow into the lead form (`concierge_summary`).
- **Live rates** — board reads the corporate `rates.json` through the proxy; "Use in estimator" pushes the rate into the calculator.
- **Payment estimator** — PITI with MI bands; one-click hand-off to the concierge or the form.
- **Strategy Studio + Financial Navigator video** — FHFA/FHA county limits, review paths, buydowns; HeyGen avatar tour video served from californiamtg.com.
- **Scheduler** — GR CRM public booking (`booking-get` / `booking-submit`) appears when `BOOKING_SLUG` is set in `index.html` → `BQ_CONFIG`.
- **Application paths** — secure 1003 (`2817729.my1003app.com`), OurMTG borrower portal, WWCCM.ai review.
- **i18n** — EN / ES / RU / 中文 text-node engine, persisted in `localStorage`.

## Deploy (Netlify)

1. New site from this repo. Build command: *(none)*. Publish directory: `.`. Functions: `netlify/functions` (from `netlify.toml`).
2. Environment variables (see `.env.example`): `ANTHROPIC_API_KEY`, `BOUTIQUE_CRM_LEAD_TOKEN` (create a *boutiquemtg.com* lead source in GR CRM), optional `ANTHROPIC_MODEL`, `CRM_LEAD_URL`, `RATES_SOURCE_URL`.
3. Domain: set `boutiquemtg.com` as primary, add `www.boutiquemtg.com` alias (redirect rule is in `netlify.toml`).
4. After the first deploy: **Forms → `boutique-scenario`** → add an email notification to the office inbox.
5. Optional: set `BOOKING_SLUG` in `index.html` to a GR CRM booking page slug to show the live scheduler.

## Local

```bash
npm install          # only needed for the concierge function
npx netlify dev      # site + functions at http://localhost:8888
npm run check        # syntax-check functions and scripts
```

West Coast Capital Mortgage Inc. · NMLS #2817729 · Equal Housing Opportunity.
