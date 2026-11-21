# AlDiwan API proxy

A thin Cloudflare Worker in front of `https://api.aldiwan.net/v1`. It supplies
CORS, keeps the API key server-side, and caches successful GET responses at the
edge for at most 24 hours.

## Deploy

```sh
npm install
npx wrangler login
npx wrangler secret put ALDIWAN_API_KEY
npm run deploy
```

`UPSTREAM` and `ALLOWED_ORIGINS` are configured in `wrangler.toml`.

## Point the app at it

```sh
VITE_DATA_SOURCE=live VITE_API_BASE=https://<worker>/api npm run dev
```

For example, `/api/poems?per_page=6` is forwarded as
`https://api.aldiwan.net/v1/poems?per_page=6`.

## Security invariants

- The API key exists only as a Worker secret and never reaches the browser.
- Only `GET` and `OPTIONS` are accepted.
- Browser origins must appear in `ALLOWED_ORIGINS`.
- Edge cache entries live for no more than 24 hours.

## Not done

- Per-IP rate limiting. Add a Cloudflare rate-limiting or WAF rule before
  exposing this Worker at scale.
