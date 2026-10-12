# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two, and in this order:

1. **The self-buyer** — a man in his late twenties in the Gulf who buys few things well:
   mugs, pens, leather, optics, audio, light, tools. He reads materials on purpose
   (خزف يدوي، خشب زيتون، أسيتات ياباني) and decides slowly.
2. **The gift buyer** — buys the same pieces for someone else: less material knowledge, more
   dependent on presentation and on the piece arriving well.

## Product Purpose

A curated storefront for وقار: a short list of goods, each admitted only if it passes the house
standard. Success is a shop that reads as a real store — browsable, priced, buyable — and that
a designer would call authored rather than assembled. The shop is expected to take real orders
on Salla later, so nothing in the interface may block that switch.

There is a second, stricter bar, because this front exists to prove the headless build: put it
next to any stock Salla theme and a stranger must name three things it does that a theme
cannot — and want them. Quiet is a tone, not an alibi.

## Positioning

The list is short on purpose and the reason is written on the page: quality, taste and value in
one rank, and a piece that misses any of the three is not shown. A neighbouring store can copy
the layout; it cannot copy a standard it does not hold to, or the record-keeper voice that
carries it.

## Operating Context

- Arabic-first, RTL, Gulf market; SAR including VAT; Arabic-Indic digits.
- The store must feel alive: motion is part of the voice — choreographed entrances, shared
  transitions, responsive feedback — not decoration added on top. Lean tooling only: CSS, the
  View Transitions API, and Svelte; no animation libraries.
- The catalogue is the merchant's own curation. The vitrine piece is a deliberate editorial
  choice (`featured` in the data), not whichever item happens to come first.
- Published service promises: free delivery over ٥٠٠ ر.س، 14-day returns، cash on delivery،
  support by email and WhatsApp.
- Checkout hands off for real: `src/lib/checkout.ts` sends the cart (by SKU) to the Salla
  runtime, which builds a Salla cart and returns the hosted `checkout_url`. The current store is
  a Salla **demo** store — it accepts carts but refuses to complete orders; real orders wait on a
  real Salla store.

## Capabilities and Constraints

- Static Astro site on Cloudflare Workers (46 pages). The catalogue lives in Cloudflare D1 and
  is served to the build by the store's own Worker; pages read it through one module,
  `src/lib/api.ts`, so the source can move again without touching a page.
- Two worlds, one shop: the light greige room by day and the blue-hour slate room by night,
  chosen by the visitor's system preference and switchable with the lamp in the footer. At
  night each photograph sits in its own pool of lamplight; by day it rests on a lit plinth.
- Cart, the buy box (with its floating bar), and the search overlay are Svelte 5 islands;
  sorting, filtering and the gallery stay plain TypeScript. Choice values in the data can
  carry their own stock and price.
- Sales live in the data (`sale_price` plus a window). The crossed price, the badge and the
  countdown appear only when the data is there, and the regular price returns when the window
  ends.
- Photographs are placeholder JPEGs from royalty-free stock, stored with each product as
  three views derived from one source frame — full, detail, alternate — documented in
  `public/images/CREDITS.md`. They must never be presented as the shop's own photography;
  a different object is never shown as this product, and real photography replaces each
  set file-for-file when it arrives.
- No accounts, wishlist or reviews exist.
- The Salla runtime is deliberately **its own project** (`wiqar-backend`, a Cloudflare Worker):
  required at runtime for buying, never for building. The data seam is `src/lib/catalog.ts`; the buy
  seam is `src/lib/checkout.ts`. If that project is abandoned, the shop still builds and browses.
- The Salla app and its tokens already exist and flow; what's still missing for orders is a real
  (non-demo) Salla store.

## Brand Commitments

- The name وقار and the Latin wordmark WIỌAR.
- The owner's standard, in the store's own voice: الجودة · الذوق · القيمة.
- Arabic-first voice: plain, precise, never salesy.
- **Not binding:** the visual world may evolve. The current one — a warm greige room by day
  (#edeae3), the blue-hour slate room by night (#4c5668), champagne in small doses, Naseeb /
  Amiri / Plex — is the incumbent to preserve until a deliberate replacement is chosen.

## Evidence on Hand

- A 35-piece catalogue in Cloudflare D1 with prices, stock, descriptions and image links;
  `options`, `keywords` and `featured` columns exist for enrichment. Categories are a D1 table.
- Product photographs are placeholder JPEGs (royalty-free stock) in `public/images`, three
  derived views per piece, stored as paths with each product.
- Schema changes are versioned in `migrations/`; operations are documented in `DATA.md`.
- No reviews, testimonials, press, founder story or customer logos exist. Future work must not
  invent them.

## Product Principles

1. A short list is the product, not a limitation — what fails the standard is not shown.
2. The piece leads and the chrome recedes: photographs, materials and prices before decoration.
3. Say it plainly, in Arabic, in the voice of the person who chose the piece.
4. Every claim on the page has something behind it; nothing promises what the shop cannot do yet.
5. Nothing is presented as something else — not a placeholder photo as a product view, not a mock
   backend as a working checkout.
6. Quiet, never still — composure is the tone, motion is the life.
7. At any moment this front does at least three things the theme system cannot.

## Accessibility & Inclusion

- RTL and Arabic first: logical properties, Arabic-Indic digits, no letter-spacing on Arabic script.
- Text meets WCAG AA contrast on every ground; touch targets are 44px minimum; cart, gallery,
  search and checkout all have keyboard paths; motion is suppressed under `prefers-reduced-motion`.
