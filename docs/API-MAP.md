# API-MAP — AlDiwan v2.0.0 ↔ Diwan Studio

Contract source: https://developers.aldiwan.net/openapi.json (v2.0.0, 14 paths, 30 schemas).
Report: `~/Downloads/check-out/aldiwan-api/REPORT.md`.

## Transport

| | |
|---|---|
| Base | `https://api.aldiwan.net/v1` |
| Auth | `Authorization: Bearer aldiwan_live_…` — **server side only** |
| CORS | none — browser calls are impossible, so every live call goes through our proxy |
| Shape | JSON only; `{ data, meta, links }` for collections, `{ data }` for a single item |
| Quota headers | `X-MonthlyQuota-{Limit,Remaining,Reset}`, `X-FullTextQuota-Daily-{…}`, `X-FullTextQuota-Monthly-{…}`, `X-Request-Id`, `Retry-After` |
| Pagination | `page` (≤1000), `per_page` (≤50; ≤20 for /search) |

## Endpoints → UI

| Endpoint | Params | Used by | Notes |
|---|---|---|---|
| `GET /search` | q (2–100), type=all\|poems\|poets, per_page | `/search` | Results header, poet + poem tabs |
| `GET /poets` | q, page, per_page | `/poets` | Index with era filter (client-side) |
| `GET /poets/{id}` | — | `/poets/:id` | Header |
| `GET /poets/{id}/poems` | page, per_page | `/poets/:id` | Shelf |
| `GET /poems` | poet_id, era_id, meter, rhyme, page, per_page | `/poems`, home rails | Filter bar |
| `GET /poems/count` | same filters | `/poems` | "N نتيجة" |
| `GET /poems/slugs` | same filters | `/studio` poetry picker | Returns **integers**, despite the name |
| `GET /poems/{id}` | — | `/poems/:id`, `/studio/:id` | **Full text** — burns full-text quota; fetch only on open |
| `GET /quotes` | author_id, topic, sort, page, per_page | `/quotes` | Stream |
| `GET /quotes/random` | — | home, `/quotes` | One unit, no full-text cost |
| `GET /quotes/{id}` | — | `/quotes` | Detail |
| `GET /eras` | — | filters, home | Controlled vocabulary |
| `GET /meters` | — | filters | Value = `name`, echo exactly |
| `GET /rhymes` | — | filters | Value = `letter` (param is `rhyme`) |

Vocabulary lists are fetched **once**, cached 24h, and used for filter values verbatim
(diacritics matter).

## Types (mirror of the contract)

```ts
type Layout = 'hemistichs' | 'lines' | 'stanzas'
type Attribution = { required: boolean; text: string; url: string }
type PoetRef = { id: number; name: string }
type Era = { id: number; name: string }
type PoemSummary = { id: number; title: string; poet: PoetRef; era: Era; meter: string | null;
  rhyme: string | null; display_layout: Layout; excerpt: string; attribution: Attribution }
type Poem = Omit<PoemSummary, 'excerpt'> & { text: string }
type Quote = { id: number; title: string; text: string; topic: string | null;
  author: { id: number | null; name: string }; attribution: Attribution }
type PageMeta = { current_page: number; per_page: number; total: number; last_page: number }
```

## Proxy contract (the only place the key exists)

```
GET  https://<worker>/api/poems?per_page=6&page=1
  →  https://api.aldiwan.net/v1/poems?per_page=6&page=1
     Authorization: Bearer $ALDIWAN_API_KEY
     Accept: application/json
  ←  JSON, plus Access-Control-Allow-Origin, and X-Request-Id / quota headers exposed
```

- Path prefix `/api/` is stripped; everything else is passed through unchanged.
- Only `GET` and `OPTIONS`; no request body.
- Edge cache: 24h max (licence ceiling) keyed on the full URL, honouring `Cache-Control: max-age=86400`.
- Full-text (`/poems/{id}`) is **not** cached beyond 24h and never prefetched.
- Errors pass through with the API's own JSON body and status.
- The key is a Worker secret (`wrangler secret put ALDIWAN_API_KEY`); it never reaches the client,
  and the Worker never logs it.

## Client rules

1. `VITE_DATA_SOURCE` = `demo` (default) | `live`; `VITE_API_BASE` = proxy base.
2. Every call appends a `RequestLog` entry (endpoint, query, status, ms, request-id, quota, cached).
3. Responses cached in `sessionStorage` with `fetchedAt`; anything older than 24h is refetched.
4. Full text is fetched only when a poem page or studio opens.
5. `/poems/{id}` payloads are never persisted beyond the cache ceiling; designs persist instead.
6. No key, no secret header, no Authorization value is ever read by the client.

## Error contract

```json
{ "error": { "code": "quota_exceeded", "message": "…", "request_id": "req_…",
  "limit": 1000, "used": 1000, "remaining": 0, "reset_at": "…" } }
```

UI mapping: 401/403 → «تعذّر التحقق من مفتاح الديوان» + link to the integration page;
404 → empty state; 422 → «قيمة الفلتر غير مقبولة»; 429/403 quota → quota banner with reset date;
5xx → «خلل مؤقت في الديوان» + retry.

## Demo provider

Bundled `src/data/demo/*.json`: 9 poems, 8 poets, 12 quotes, 4 eras, 5 meters, 4 rhymes.
Texts are **public-domain classical poetry**, not AlDiwan responses. Every demo object carries
`source: 'demo'` and `rights: 'public-domain'`; the UI labels preview mode globally.
Demo implements the same filters, paging and search semantics as the live API so the switch is a
config change.
