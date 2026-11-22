# Contributing

Small, focused changes are easiest to review.

## Setup

```bash
git clone https://github.com/rrmanx/diwan-studio.git
cd diwan-studio
npm install
npm run dev       # http://localhost:5199
```

Node 22.12 or newer. Thmanyah fonts are fetched at dev and build time from jsDelivr by
`scripts/fetch-thmanyah.mjs`; do not commit `public/fonts/thmanyah/`. If the CDN is
unreachable, the build continues with fallback faces.

## Data sources

Copy `.env.example` to `.env.local`:

- `VITE_DATA_SOURCE=demo` — the bundled public-domain preview corpus.
- `VITE_DATA_SOURCE=live` — every request goes through the Cloudflare Worker proxy.
- `VITE_API_BASE` — the proxy URL ending in `/api` (default `/api`).

With neither set, the app tries live first and falls back to demo.

## Never put a key in the browser

The AlDiwan key exists only as a Worker secret (`ALDIWAN_API_KEY`). Never add it to
`.env`, source, HTML, tests or a commit; `.env.production` is gitignored.

## Rights gate

API text is display-only. `EXPORT_API_TEXT` in `src/lib/rights.ts` decides whether it
can be exported; leave it `false` unless AlDiwan grants written permission.

## Commits and PRs

One change per commit, imperative subject (`Fix hemistich wrapping in exports`). Before
a PR run `npm run typecheck` and `npm run build`; both must pass. Keep the diff tight.
