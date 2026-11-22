# diwan.rrmanx.com — DNS and Firebase

The site is already live at https://diwan-studio.web.app. This puts it on your own domain.

## 1. Firebase: register the domain

1. Open https://console.firebase.google.com/project/rrmanx/hosting/sites
2. Site **diwan-studio** → **Add custom domain**
3. Enter **diwan.rrmanx.com** → Continue.
4. Firebase shows the records to create. They are normally:

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | `diwan` | `diwan-studio.web.app` | 3600 |
| TXT | `diwan` | `hosting-site=diwan-studio` | 3600 |

If the console prints a different TXT token, use **its** value, not the one above.

## 2. Hostinger: create the records

hPanel → **Domains** → **rrmanx.com** → **DNS / Nameservers** → **DNS records** → **Add new record**:

- **CNAME** — Name: `diwan` · Target: `diwan-studio.web.app` · TTL: 3600
- **TXT** — Name: `diwan` · Value: `hosting-site=diwan-studio` · TTL: 3600

Leave the existing rrmanx.com A record (199.36.158.100) untouched — that is the portfolio.

## 3. Verify in Firebase

Back in the console, press **Verify**. It usually passes within minutes; DNS propagation can take up to a few hours.
SSL is issued automatically once verification passes (up to 24 hours; normally under an hour).

Check from a terminal:

```bash
dig +short diwan.rrmanx.com CNAME      # → diwan-studio.web.app.
dig +short diwan.rrmanx.com TXT        # → "hosting-site=diwan-studio"
curl -sI https://diwan.rrmanx.com | head -1   # → HTTP/2 200 once live
```

## 4. Let the Worker accept the new origin — required

The API proxy allow-lists browser origins, so the new domain is rejected until it is added.

**Dashboard (30 seconds):**
1. https://dash.cloudflare.com → **Workers & Pages** → **diwan-aldiwan-proxy**
2. **Settings** → **Variables and Secrets** → `ALLOWED_ORIGINS`
3. Append `,https://diwan.rrmanx.com` to the existing value, save, and deploy the new version.

Current value:

```
https://diwan-studio.web.app,http://localhost:5199,http://localhost:4173
```

New value:

```
https://diwan-studio.web.app,https://diwan.rrmanx.com,http://localhost:5199,http://localhost:4173
```

**CLI alternative** (after `npx wrangler@4 login` succeeds):

```bash
cd workers/aldiwan-proxy
npx wrangler@4 deployments   # find the current version
npx wrangler@4 versions view
# easiest: edit the var in wrangler.toml, then
npx wrangler@4 deploy
```

## 5. What changes in the app

Nothing. `VITE_API_BASE` is absolute (`https://diwan-aldiwan-proxy.copper-meat-b96.workers.dev/api`),
so the subdomain talks to the same Worker. Only the Worker's origin allow-list matters.

If the Worker rejects the origin, the app falls back to the local heritage corpus and the rail shows
«معاينة» instead of «مباشر» — a quick way to see whether step 4 is done.
