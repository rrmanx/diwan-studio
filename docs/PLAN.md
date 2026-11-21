# Diwan Studio — Build Plan (v1.0)

**Product:** Diwan Studio — ستوديو الديوان
**Owner:** rrmanx
**Promise:** Discover classical Arabic poetry through the AlDiwan API, then compose it into
exportable artwork. *The API is the product's material, not an integration toggle.*

---

## 1. Constraint reality check (decides the build)

| Fact | Consequence |
|---|---|
| No AlDiwan API key exists yet on this machine | v1 ships **Preview mode** with a small public-domain heritage corpus; live adapter is complete and one secret away |
| api.aldiwan.net sends **no CORS** headers | Every live call must go through our own proxy; the browser never holds the key |
| Free plan = 1,000 general / 100 full-text / 10 per day | Cache aggressively (≤24h), never prefetch full poems, prefetch only the poem the user opens |
| Firebase project `rrmanx` has **billing disabled** | Static Hosting only today. Proxy ships as a Cloudflare Worker (free) + Firebase-Functions variant for later |
| 24h cache ceiling, attribution mandatory | Cache TTL enforced in the client with a visible age chip; attribution rendered in-app and baked into exports |
| Exporting API-sourced text needs written permission | Rights flag per poem: `public-domain` and `user` texts export; `api` texts export only after permission flips a constant |

**Decision:** build the whole product against a **typed data contract** that mirrors
`openapi.json` v2.0.0. Two providers implement it: `DemoProvider` (bundled corpus) and
`LiveProvider` (proxy → api.aldiwan.net). Switching is a build-time env var, not a rewrite.

---

## 2. What v1.0 ships

| # | Feature | Detail |
|---|---|---|
| 1 | Discovery home | Live-feeling hero verse, search, era/meter/rhyme rails, poet shelf, curated poems, quote of the moment |
| 2 | Search | `/search` — poems + poets, RTL-aware, term chips |
| 3 | Poets | `/poets` index by era · `/poets/:id` page with their poems |
| 4 | Poems | `/poems` filters (era, meter, rhyme, poet) + count; `/poems/:id` reader honouring `display_layout` |
| 5 | Quotes | `/quotes` stream + random quote; "design this" action |
| 6 | Studio | 3 templates (Classical / Editorial / Artistic), typography + palette + frame + size controls, verse picker, live SVG preview, **PNG export** at 1080×1080, 1080×1350, 1080×1920 |
| 7 | API inspector | Drawer: endpoint, query, status, latency, request id, quota remaining, cache age, copy-cURL. Never a key. |
| 8 | Integration page | All 14 endpoints mapped to the UI, architecture diagram, quota economics, rights, connect instructions — the artifact we hand to AlDiwan |
| 9 | Persistence | Designs in `localStorage`; API responses cached with TTL ≤24h; no corpus storage |

**Out of scope v1:** accounts, shares/URL shortener, AI features, non-PNG export, offline PWA,
payment, comments.

---

## 3. IA

```
/                 Discover — hero verse, search, vocab rails, poets, curated, quote
/search?q=&type=  Results (poems | poets | all)
/poets            Poet index, era filter
/poets/:id        Poet + poems
/poems            Explore, filters + count
/poems/:id        Reader (fetches full text on open)
/quotes           Quote stream + random
/studio           Studio (blank / user text)
/studio/:poemId   Studio bound to a poem; ?verses=0,1,2
/api              Integration: endpoint map, architecture, quotas, rights, connect
/about            About + attribution + legal
```

## 4. Endpoint coverage (14/14)

See `docs/API-MAP.md`. Every endpoint appears in the UI at least once; the integration page
lists them with live/demo status.

## 5. Data + rights model

- `source: 'api' | 'demo' | 'user'` on every text-bearing object.
- `rights: 'api' | 'public-domain' | 'user'` controls export availability.
- Demo texts are classical (public domain) and labelled as such; they never claim to be
  AlDiwan responses.
- Attribution object rendered verbatim wherever required; included in export footer.

## 6. Acceptance criteria

1. `npm run build` clean, no TypeScript errors; bundle < 400 KB gzip (fonts excluded).
2. Every route renders at 1440, 1024, 390 with no horizontal overflow; RTL correct.
3. Keyboard: skip link, focus rings, inspector opens with `?`/button, Escape closes.
4. Contrast AA on all text; `prefers-reduced-motion` respected; `prefers-color-scheme` respected with manual override.
5. Studio exports a valid PNG at all three sizes, with fonts correct, attribution rendered.
6. Lighthouse: performance ≥ 90, accessibility ≥ 95 on the built site.
7. No AlDiwan secret anywhere in client code or bundle.

## 7. Deploy

- Repo `rrmanx/diwan-studio` (public).
- Firebase Hosting site `diwan-studio` under project `rrmanx` → `https://diwan-studio.web.app`.
- Later custom domain `diwan.rrmanx.com` (DNS at Firebase already).
- Worker proxy: `workers/aldiwan-proxy` → `wrangler deploy` + `wrangler secret put ALDIWAN_API_KEY`.

## 8. Launch kit (after v1)

- 45–60s screen recording (search المتنبي → poem → studio → export → inspector).
- Launch post replying to the AlDiwan announcement; endpoint coverage + repo link.
- Direct note to the AlDiwan team offering the integration as a showcase, plus permission ask
  for exporting API text.
