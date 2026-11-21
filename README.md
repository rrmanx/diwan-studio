# Diwan Studio — ستوديو الديوان

Diwan Studio is an Arabic-first typographer's desk for classical Arabic poetry: browse poems,
poets and quotes, then compose a selected text into an exportable design. This repository holds
the foundation — the token system, self-hosted Arabic typefaces, route shell and a typed data
contract with demo and live providers — ready for the product pages to be built on top.

## Stack

- Vite + React 19 + TypeScript (strict)
- Tailwind CSS v4 via `@tailwindcss/vite`, design tokens in `src/styles/tokens.css`
- react-router-dom v7 with `BrowserRouter`
- Self-hosted Readex Pro, Reem Kufi, Amiri, Aref Ruqaa and IBM Plex Mono in `public/fonts/`

## Scripts

- `npm install` — install dependencies
- `npm run dev` — start the dev server
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — typecheck, then build to `dist/`
- `npm run preview` — preview the production build
- `node scripts/fetch-fonts.mjs` — re-download woff2 files and regenerate `public/fonts/fonts.css`

## Data source

Copy `.env.example` to `.env`. `VITE_DATA_SOURCE=demo` (default) serves bundled public-domain
heritage text from `src/data/demo/`; it is not an AlDiwan response. Set `VITE_DATA_SOURCE=live`
to call the proxy at `VITE_API_BASE` (default `/api`). No API key is ever placed in the client —
the proxy holds it. `VITE_SITE_URL` is reserved for the canonical site URL.

## Deploy

Static build only: deploy `dist/` to the Firebase Hosting site `diwan-studio` under project
`rrmanx` (`https://diwan-studio.web.app`). The API proxy ships separately as a Cloudflare Worker.
