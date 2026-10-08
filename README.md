# وقار — Wiqar

A curated goods store — ceramics, writing, textiles, leather, optics, audio, light, tools.
Arabic-first (RTL), statically built with Astro.

**Live:** https://wiqar-storefront.directed-countless.workers.dev

## Stack

- **Astro** (static output) + **TypeScript**; **Bun** for install, build and run
- **Tailwind CSS v4** + **Starwind UI** components
- Self-hosted Arabic typefaces: Naseeb, Amiri, IBM Plex Arabic / Mono
- `@astrojs/sitemap`, photos optimised to AVIF + WebP at build time

## Structure

```
src/pages/       routes: home, catalog, category/[slug], product/[slug], search, 404
src/layouts/     Base.astro — theme vars, meta/OG, skip link, cart, image fade-in
src/components/  world/ (the store's own parts) · starwind/ (vendored UI)
src/lib/         api · cart · search · images · schema · format · url
src/worker.ts    the /catalog.json route — D1 in, storefront-shaped JSON out
src/data/        theme.ts (the one palette)
src/assets/      fonts
src/styles/      world.css (tokens & base) · world-fonts.css · starwind.css
```

## How the data flows

Cloudflare D1 `wiqar-products` → `/catalog.json` on the store's own Worker (`src/worker.ts`) →
`src/lib/api.ts` → pages, at build time. Nothing else reads the catalogue. The local agent in
`../data` keeps D1 in sync; after a change it pings the Worker's deploy hook, which rebuilds and
publishes the site.

Cart, search suggestions, sorting, the gallery and product options run client-side as five
small plain-TypeScript scripts — no UI framework.

## Commands

| | |
|---|---|
| `bun install` | install dependencies |
| `bun run dev` | dev server (see `AGENTS.md` for background mode) |
| `bun run build` | build to `dist/` |
| `bun run preview` | serve the build locally |
| `bun run deploy` | build, then deploy to Cloudflare Workers |

## Deploy

On push to `main`, Cloudflare Workers Builds builds `bun run build` and deploys the
`wiqar-storefront` Worker (config in `wrangler.jsonc`); the domain is attached in the Cloudflare
dashboard. Data changes trigger the same build through the Worker's deploy hook, so the site
republishes whenever the D1 catalogue changes.

Product photos are placeholder links from royalty-free stock, stored with each product in D1;
each is replaced by real product photography.

## Related project

One sibling, in its own repository. It is not required for this one to build or run:

- **`wiqar-backend`** — the runtime that talks to Salla (catalogue, cart, checkout, token) for the
  day this storefront goes headless. `src/lib/api.ts` is the seam it plugs into.
