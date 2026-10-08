# وقار — Wiqar

A curated goods store — ceramics, writing, textiles, leather, optics, audio, light, tools.
Arabic-first (RTL), statically built with Astro.

**Live:** https://wiqar.sa

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
src/data/        catalog.json (API-shaped) · theme.ts (the one palette)
src/assets/      photos (optimised at build) · fonts
src/styles/      world.css (tokens & base) · world-fonts.css · starwind.css
```

## How the data flows

`src/data/catalog.json` → `src/lib/api.ts` → pages, at build time. Nothing else reads the
catalogue: swapping the mock for a real backend means rewriting `api.ts` and nothing else.

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

On push to `main`, Cloudflare Workers Builds runs `bun run build` and deploys `dist/` to the
`wiqar-storefront` Worker. The Worker's shape lives in `wrangler.jsonc`; the domain is attached
in the Cloudflare dashboard.

Product photos are placeholders from royalty-free stock; sources are listed in
`src/assets/photos/CREDITS.txt` and each is replaced by real product photography.

## Related project

One sibling, in its own repository. It is not required for this one to build or run:

- **`wiqar-backend`** — the runtime that talks to Salla (catalogue, cart, checkout, token) for the
  day this storefront goes headless. `src/lib/api.ts` is the seam it plugs into.
