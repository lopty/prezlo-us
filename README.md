# Prezlo United States

A standalone, pre-rendered marketing site for **us.prezlo.io**. The homepage uses Unbounce as a visual reference and carries Prezlo’s rust and orange wordmark treatment with a restrained navy US accent.

## Run locally

Use Node.js 22 or later. There are no package dependencies or API keys.

- Build: `npm run build`
- Build and serve for Google AI Studio: `npm run dev` (listens on `0.0.0.0:3000` by default and uses `PORT` when the host provides it)
- Serve existing output on your machine: `npm run preview`
- Local URL: `http://127.0.0.1:4173/`
- Alternate port in PowerShell: `$env:PREZLO_PREVIEW_PORT = '4174'`

For GitHub import into Google AI Studio, use the repository root that contains `package.json` and `package-lock.json`. The project supports `npm ci` for a clean install.

The build writes `dist/`, including the files for each canonical path, a custom `404.html`, `robots.txt`, `sitemap.xml` and `routes.json`. The local server returns HTTP 404 for an unknown path. The build checks the route inventory, internal asset and page links, and primary headings before writing output.

## Inventory and source

| Content | Routes |
| --- | ---: |
| US homepage | 1 |
| State, industry and guide directories | 3 |
| State pages | 50 |
| Industry pages | 11 |
| Buyer guides | 10 |
| Total sitemap URLs | 75 |

Edit state examples in `src/states.mjs`, industry and guide content in `src/editorial.mjs`, and templates in `build.mjs`. Design assets are under `src/assets/`. The US routes follow the supplied page map. The 10 proposed state–industry combination pages remain in the backlog and need distinct local material. The other six country builds are future releases. The sample scenarios illustrate operations and handoff decisions. Review them with a local editor before public launch. The public geography links provide reference geography. A business’s own coverage owner verifies eligibility.

The hero photograph in `src/assets/studio-owner.jpg` is an illustrative editorial image made with built-in ImageGen. The brief requested a portrait of a small-business owner at a laptop in a daylight-lit studio, framed for an arched crop, with navy clothing and rust brick.

## Render and Hostinger handoff

- Service type: **Static Site**
- Root directory: repository root
- Build command: `npm run build`
- Publish directory: `dist`
- Custom domain: `us.prezlo.io`
- Hostinger DNS: add a CNAME named `us` in the `prezlo.io` zone, targeting the exact hostname Render assigns, such as `<assigned-service>.onrender.com`. Resolve any conflicting record for `us` before saving. Verify the domain and TLS in Render.
- After hosting setup, verify that an unknown URL returns HTTP 404, slashless paths redirect to their corresponding directory routes, and the sitemap uses the approved production domain. Use `PREZLO_SITE_ORIGIN` only if the approved production origin changes.

[Render static site setup](https://render.com/docs/static-sites) · [Render domain verification](https://render.com/docs/custom-domains) · [Render DNS configuration](https://render.com/docs/configure-other-dns)

## Conversion handoff

Signup and trial buttons point to Prezlo registration. Demo buttons use the existing Prezlo booking calendar. Billing stays on the main domain. The static frontend sends visitors through ordinary links with no new tracking parameters, cookies or lead storage.

For consented measurement, define the recommendation observed, attributable visit, CTA click, inquiry received and qualified lead as distinct events. Retain original acquisition source in the approved analytics flow, keep personal information out of URLs, and record accepted scope with the intake owner or CRM. Completion events, attribution persistence and CRM receipt remain launch checks in an authorized environment.
