# وقار — Wiqar

A curated goods store — writing, textiles, scent, tableware, leather.
Arabic-first (RTL), statically built with Astro.

**Live:** https://wiqar-storefront.directed-countless.workers.dev

## Stack

- **Astro** (static output) + **TypeScript**; **Bun** for install, build and run
- **Svelte 5** islands for the interactive parts; **Tailwind CSS v4** + **Starwind UI** for the rest
- Self-hosted Arabic typefaces: Naseeb, Amiri, IBM Plex Arabic / Mono
- Two worlds (day room, night gallery), View Transitions for page motion, `@astrojs/sitemap`

## Structure

```
src/pages/       routes: home, catalog, category/[slug], product/[slug], search, checkout, 404
src/layouts/     Base.astro — worlds, meta/OG, skip link, cart island, page transitions
src/components/  world/ (the store's own parts) · starwind/ (vendored UI)
src/lib/         api · cart (+ Svelte store) · checkout · format · schema · search · url · validate
src/worker.ts    the /catalog.json route — D1 in, storefront-shaped JSON out
src/data/        theme.ts (the two palettes)
tools/sale.ts    the sale tool — wrangler against D1
migrations/      the D1 schema, versioned
src/assets/      fonts
src/styles/      world.css (tokens, worlds, motion) · world-fonts.css · starwind.css
```

## How the data flows

Cloudflare D1 `wiqar-products` is the only database. The store's own Worker (`src/worker.ts`)
serves it as `/catalog.json`; `src/lib/api.ts` validates and reads it at build time. Changes go
through `bun run sale` (or the D1 console) and ping the deploy hook, which rebuilds and publishes;
a cron on the Worker rebuilds when a sale window opens or closes. Schema changes are versioned in
`migrations/`; the operations guide is `DATA.md`.

The cart drawer, header count and the product buy box (options, live price/stock, countdown) are
Svelte 5 islands; search suggestions, sorting and the gallery stay small plain-TypeScript scripts.

## Commands

| | |
|---|---|
| `bun install` | install dependencies |
| `bun run dev` | dev server (see `AGENTS.md` for background mode) |
| `bun run build` | build to `dist/` |
| `bun run preview` | serve the build locally |
| `bun run sale …` | sales against D1 — see `DATA.md` |
| `bun run deploy` | build, then deploy to Cloudflare Workers |

## Deploy

On push to `main`, Cloudflare Workers Builds runs `bun run build` and deploys the
`wiqar-storefront` Worker (config in `wrangler.jsonc`). Data changes republish through the
deploy hook — the sale tool pings it, and the Worker's cron pings it when a sale window opens
or closes. The build fails on invalid catalogue rows, so the last good deploy keeps serving.

Product photos are placeholder JPEGs in `public/images` (1200px and 600px variants); D1
stores their paths, and each is replaced by real product photography.

## Related project

One sibling, in its own repository. It is not required for this one to build or run:

- **`wiqar-backend`** — the runtime that talks to Salla (catalogue, cart, checkout, token) for the
  day this storefront goes headless. `src/lib/api.ts` is the seam it plugs into.
