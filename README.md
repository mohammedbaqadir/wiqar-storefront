# وقار — Wiqar

An online store, Arabic-first (RTL). 35 products: pens and desk items, textiles, perfume, coffee
tools, and leather goods. Built as static pages and served from Cloudflare's network.

**Live:** https://wiqar-storefront.directed-countless.workers.dev

`Astro 7` · `Svelte 5` islands for the interactive parts · `Tailwind v4 + Starwind` · `Cloudflare Workers + D1` · `TypeScript 6` with `astro check`

## What this is

The website for the wiqar store. It shows the catalogue from its own database and its own design.
The actual selling happens on Salla, through the sibling
[wiqar-backend](https://github.com/mohammedbaqadir/wiqar-backend) repository. The site builds and
browses without the backend — only checkout needs it.

All 46 pages are built in advance, with the catalogue already inside the HTML. Visitors get
finished files, not pages that are computed while they wait. Only five parts of the site use
JavaScript in the browser: the cart drawer, the cart button, the buy box, the search box, and the
hero. Sorting, filtering, and the photo gallery are small plain-TypeScript scripts.

## How it works

- **Pages are built ahead of time** — `astro build` makes all 46 pages at build time; visitors never wait for a server.
- **The catalogue is data** — it lives in Cloudflare D1; the site's Worker serves it as `/catalog.json`; the build reads and checks it once.
- **The cart lives in the browser** — it is stored in `localStorage` (`src/lib/cart.ts`, plus a small Svelte store). Adding to the cart needs no network call.
- **Checkout goes through the backend** — `src/lib/checkout.ts` sends the cart (each line is a SKU) to the backend. The backend creates a cart on Salla and returns Salla's `checkout_url`. The customer pays on Salla.
- **Two themes, one shop** — every color is a token (`src/data/theme.ts`). The day theme is the default; the night theme ("blue hour") turns on from the footer lamp, or follows the system setting.
- **A Worker serves everything** — it serves the static files and `/catalog.json`, and runs a cron job that rebuilds the site when a sale starts or ends.

## Project map

```
src/pages/       routes: home · catalog · category/[slug] · product/[slug] · search · checkout · 404
src/layouts/     Base.astro — the themes, meta/OG, the cart island, page transitions
src/components/  store/ (the shop's own parts) · starwind/ (UI components from Starwind)
src/lib/         catalog · cart (+ Svelte store) · checkout · format · structured-data · search · url · validate
src/data/        theme.ts — the two color sets (day and night)
src/styles/      world.css (tokens, themes, animation) · starwind.css (Tailwind mapping) · world-fonts.css
src/worker.ts    the Worker: static assets, /catalog.json from D1, the sale cron
scripts/sale.ts  the sale tool — sale windows in D1, in one command
migrations/      the D1 schema, versioned
public/images/   product photos (1200px + 600px) with sources in CREDITS.md
```

## Commands

| Command | What it does |
|---|---|
| `bun install` | install dependencies |
| `bun run dev` | dev server (background mode: see `AGENTS.md`) |
| `bun run build` | build all pages to `dist/` |
| `bun run check` | type checking (`astro check`) for all pages, components, and scripts |
| `bun run preview` | serve the build locally |
| `bun run sale …` | open or close sale windows in D1 — see `DATA.md` |
| `bun run deploy` | build, then deploy the Worker (CI does the same on push) |

## Data, sales, and deploy

Cloudflare D1 (`wiqar-products`) is the store's only database. `migrations/` holds the schema, and
`DATA.md` explains the day-to-day work. A sale is data: a `sale_price` and a time window.
`bun run sale` writes it and calls the deploy hook. A cron on the Worker checks every ten minutes
and rebuilds the site when a sale starts or ends. If a catalogue row is wrong, the build **fails**,
so the last working version stays online until the data is fixed.

Two rules to remember:

- **The SKU links the two sides.** D1 and Salla match products by SKU. If you rename a SKU, that
  product's checkout breaks quietly (details in `DATA.md`).
- **The current store is a Salla demo store.** Carts work, but orders cannot complete — Salla shows
  `لا يمكن إتمام الطلب من متجر تجريبي`. Real orders need a real (non-demo) Salla store; nothing in
  this repository changes when you get one.

## Design

Every color is defined once in `src/data/theme.ts` and swapped by a theme attribute — that is how
day and night stay the same shop in two different lights. Arabic-first typography (Naseeb, Reem
Kufi, Amiri, IBM Plex Arabic / Mono). The wordmark is a drawing (SVG outlines), not text. Page
transitions use the browser's View Transitions API. Product facts live in `PRODUCT.md`.

## Related

- **[wiqar-backend](https://github.com/mohammedbaqadir/wiqar-backend)** — the Worker that talks to
  Salla: tokens, catalogue reads, carts, webhooks. This repo reads the catalogue in
  `src/lib/catalog.ts` and calls the backend in `src/lib/checkout.ts`. `PUBLIC_BACKEND_URL` points
  the site at a different backend instance.
