# Rights & attribution

## What the licence requires (AlDiwan v2.0.0)

1. **Attribution is mandatory** wherever AlDiwan content is displayed — render the returned
   `attribution` object verbatim and keep the canonical URL.
2. **Cache ceiling is 24 hours.** No permanent storage of API text.
3. **No bulk download, corpus building, mirroring, or redistribution**; no competing dataset.
4. **No AI training, evaluation, enrichment, or dataset creation** without a separate written licence.
5. **Commercial use and large-scale republication need prior written approval.**
6. **No keys in the browser** — the proxy is mandatory.

## What Diwan Studio does

| Surface | Behaviour |
|---|---|
| Discovery, reader | Renders API text with the returned attribution block and source link |
| Cache | `sessionStorage`, 24h TTL, purge on expiry; nothing written to disk |
| Designs | Only the user's own composition settings persist (template, type, colours, verse picks), plus the verse text the user explicitly designs |
| Export | Allowed for `public-domain` (demo heritage texts) and `user` text. **Blocked for `api` text** until AlDiwan grants written permission for social graphics — the button shows the request-notice instead |
| API inspector | Shows endpoint, status, latency, request-id and quota; never the key or headers |

## Permission ask (send with the launch note)

> We built Diwan Studio as an independent integration of the AlDiwan API. Users can select a poem
> and export it as a social graphic with AlDiwan attribution and a canonical link baked into the
> image. May we enable export for API-sourced texts? We will keep the 24-hour cache ceiling,
> render your attribution on every asset, and never bulk-store or redistribute the corpus.

Until the answer is yes, `EXPORT_API_TEXT = false` in `src/lib/rights.ts` keeps the gate closed.
