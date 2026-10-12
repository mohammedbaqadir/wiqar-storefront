# وقار — Wiqar

A curated goods store — writing, textiles, scent, tableware, leather.
Arabic-first (RTL), statically built with Astro.

**Live:** https://wiqar-storefront.directed-countless.workers.dev

## Stack

- **Astro** (static output) + **TypeScript**; **Bun** for install, build and run
- **Svelte 5** islands for the interactive parts; **Tailwind CSS v4** + **Starwind UI** for the rest
- Self-hosted Arabic typefaces: Naseeb, Reem Kufi, Amiri, IBM Plex Arabic / Mono
- Two worlds (day room default, night room by choice), View Transitions for page motion, `@astrojs/sitemap`

## Structure

```
src/pages/       routes: home, catalog, category/[slug], product/[slug], search, checkout, 404
src/layouts/     Base.astro — worlds, meta/OG, skip link, cart island, page transitions
src/components/  store/ (the shop's own parts) · starwind/ (vendored UI)
src/lib/         catalog · cart (+ Svelte store) · checkout · format · structured-data · search · url · validate
src/worker.ts    the /catalog.json route — D1 in, storefront-shaped JSON out
src/data/        theme.ts (the two palettes)
scripts/sale.ts  the sale tool — wrangler against D1
migrations/      the D1 schema, versioned
src/assets/      fonts
src/styles/      world.css (tokens, worlds, motion) · world-fonts.css · starwind.css
public/images/   product photography (1200px + 600px) · CREDITS.md
```

## How the data flows

Cloudflare D1 `wiqar-products` is the only database. The store's own Worker (`src/worker.ts`)
serves it as `/catalog.json`; `src/lib/catalog.ts` validates and reads it at build time. Changes go
through `bun run sale` (or the D1 console) and ping the deploy hook, which rebuilds and publishes;
a cron on the Worker rebuilds when a sale window opens or closes. Schema changes are versioned in
`migrations/`; the operations guide is `DATA.md`.

The cart drawer, the header's cart button, the buy box (with its floating bar), and the search
overlay are Svelte 5 islands; sorting, catalogue filtering, the search page and the gallery stay
small plain-TypeScript scripts.

## How a purchase leaves the shop

The handoff is real: `src/lib/checkout.ts` posts the cart — lines identified by SKU — to the
sibling `wiqar-backend`, which builds a Salla cart holding those exact products and answers with
Salla's `checkout_url`. The shopper finishes on Salla's hosted checkout.

Two boundaries to know:

- **The SKU is the join key** between D1 and Salla. A renamed SKU silently breaks that product's
  handoff (details in `DATA.md`).
- **The current store is a Salla demo store.** It accepts carts but refuses to complete orders —
  Salla's own message: `لا يمكن إتمام الطلب من متجر تجريبي`. Real orders wait on a real Salla
  store; nothing in this repo changes when that happens.

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

Product photos are placeholder JPEGs in `public/images` (1200px and 600px variants, provenance
in `CREDITS.md`); D1 stores their paths, and each is replaced by real product photography.

## Related project

One sibling, in its own repository (github.com/mohammedbaqadir/wiqar-backend) — required for
buying, never for building:

- **`wiqar-backend`** — the worker that talks to Salla: tokens, catalogue reads, cart handoff,
  webhooks. The data seam is `src/lib/catalog.ts` (D1 → pages); the buy seam is
  `src/lib/checkout.ts` (cart → Salla). Set `PUBLIC_BACKEND_URL` to aim the storefront at a
  different backend instance.
