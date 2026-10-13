# وقار — Wiqar

An Arabic-first (RTL) storefront for a curated goods store — writing, textiles, scent, tableware,
leather. Statically built, served from Cloudflare's edge, with Salla as the commerce engine.

**Live:** https://wiqar-storefront.directed-countless.workers.dev

`Astro 7` · `Svelte 5` islands · `Tailwind v4 + Starwind` · `Cloudflare Workers + D1` · `TypeScript 6` with `astro check`

## What this is

A custom, hand-built storefront for the wiqar store. The catalogue (35 pieces) is presented from this
repository's own database and design system; **buying is delegated to Salla** through the sibling
[wiqar-backend](https://github.com/mohammedbaqadir/wiqar-backend) repository. The storefront builds
and browses without the backend — only checkout needs it.

Everything a visitor sees is generated ahead of time: 46 pages, baked at build time with the
catalogue inside, served as static files. JavaScript ships in exactly five places — the cart drawer,
the cart button, the buy box, the search overlay, and the hero — while sorting, filtering, and the
gallery stay small plain-TypeScript scripts.

## How it works

- **Pages are baked, not computed** — `astro build` renders every page ahead of time; visitors never wait on a server to think.
- **The catalogue is data** — Cloudflare D1 holds it, the store's own Worker serves it as `/catalog.json`, and the build reads and validates it once.
- **The cart is local** — cart state lives in `localStorage` behind `src/lib/cart.ts` (plus a small Svelte store); adding to cart never touches a network.
- **Checkout is a handoff** — `src/lib/checkout.ts` posts the cart (lines identified by SKU) to the backend, which builds a Salla cart and returns Salla's `checkout_url`; the shopper finishes on Salla's hosted checkout.
- **Two worlds, one shop** — every color is a design token (`src/data/theme.ts`); the day room is the default, the blue-hour night room is opt-in via the footer lamp (or the system's preference).
- **The edge serves it** — a Cloudflare Worker serves the static files, the `/catalog.json` route, and runs a cron that rebuilds the site when a sale window opens or closes.

## Project map

```
src/pages/       routes: home · catalog · category/[slug] · product/[slug] · search · checkout · 404
src/layouts/     Base.astro — the worlds, meta/OG, the cart island, page transitions
src/components/  store/ (the shop's own parts) · starwind/ (vendored UI primitives)
src/lib/         catalog · cart (+ Svelte store) · checkout · format · structured-data · search · url · validate
src/data/        theme.ts — the two palettes (the single source of color)
src/styles/      world.css (tokens, worlds, motion) · starwind.css (Tailwind mapping) · world-fonts.css
src/worker.ts    the Worker: static assets, /catalog.json from D1, the sale-edge cron
scripts/sale.ts  the sale tool — sale windows in D1, in one command
migrations/      the D1 schema, versioned
public/images/   product photography (1200px + 600px) with provenance in CREDITS.md
```

## Commands

| Command | What it does |
|---|---|
| `bun install` | install dependencies |
| `bun run dev` | dev server (background mode: see `AGENTS.md`) |
| `bun run build` | bake all pages to `dist/` |
| `bun run check` | the type gate — `astro check` across pages, components, and scripts |
| `bun run preview` | serve the build locally |
| `bun run sale …` | open or close sale windows in D1 — see `DATA.md` |
| `bun run deploy` | build, then deploy the Worker (CI does the same on push) |

## Data, sales, and deploy

Cloudflare D1 (`wiqar-products`) is the storefront's only database, and `migrations/` is the schema
source; day-to-day operations are documented in `DATA.md`. Sales are data (`sale_price` plus a
window): `bun run sale` writes them and pings the deploy hook. A cron on the Worker checks every ten
minutes and rebuilds when a window opens or closes — and the build **fails on invalid catalogue
rows**, so the last good deploy keeps serving until the data is fixed.

Two boundaries worth knowing:

- **The SKU is the join key** between D1 and Salla. A renamed SKU silently breaks that product's
  checkout handoff (details in `DATA.md`).
- **The current store is a Salla demo store.** It accepts carts but refuses to complete orders —
  Salla's own message: `لا يمكن إتمام الطلب من متجر تجريبي`. Real orders wait on a real Salla store;
  nothing in this repository changes when that happens.

## Design

Token-driven by construction: every color is named once in `src/data/theme.ts` and repainted by the
world attribute — which is how day and night are the same shop in two lightings. Arabic-first
typography (Naseeb, Reem Kufi, Amiri, IBM Plex Arabic / Mono), a brass-and-stone world, an
outline-drawn wordmark, and View Transitions for page motion. The product truth lives in
`PRODUCT.md`.

## Related

- **[wiqar-backend](https://github.com/mohammedbaqadir/wiqar-backend)** — the Worker that talks to
  Salla: tokens, catalogue reads, cart handoff, webhooks. Data seam here: `src/lib/catalog.ts`;
  buy seam: `src/lib/checkout.ts`. Set `PUBLIC_BACKEND_URL` to aim the storefront at a different
  backend instance.
