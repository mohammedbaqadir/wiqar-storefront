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

## Positioning

The list is short on purpose and the reason is written on the page: quality, taste and value in
one rank, and a piece that misses any of the three is not shown. A neighbouring store can copy
the layout; it cannot copy a standard it does not hold to, or the record-keeper voice that
carries it.

## Operating Context

- Arabic-first, RTL, Gulf market; SAR including VAT; Arabic-Indic digits.
- The catalogue is the merchant's own curation. The vitrine piece is a deliberate editorial
  choice (`featured` in the data), not whichever item happens to come first.
- Published service promises: free delivery over ٥٠٠ ر.س، 14-day returns، cash on delivery،
  support by email and WhatsApp.
- Payments and fulfilment are **not** wired. Checkout stops at a designed handoff in
  `src/lib/checkout.ts` — the single place the integration will land.

## Capabilities and Constraints

- Static Astro site on Cloudflare Workers (46 pages). The catalogue lives in Cloudflare D1 and
  is served to the build by the store's own Worker; pages read it through one module,
  `src/lib/api.ts`, so the source can move again without touching a page.
- Cart, search, sorting, options and the gallery run client-side as plain TypeScript — no UI
  framework; the entire client bundle is ~12 KB.
- Photographs are placeholders from royalty-free stock, credited in
  `src/assets/photos/CREDITS.txt`. They must never be presented as the shop's own photography,
  and a second image is never shown as another view of the same object unless it truly is one.
- No accounts, wishlist or reviews exist.
- The Salla runtime is deliberately **its own project** (`wiqar-backend`, a Cloudflare Worker) so
  this storefront never depends on it structurally. The seam is `src/lib/api.ts`; if that project
  is abandoned, nothing here has to change.
- Still needed for real data and checkout: the Salla app record (an email address) and the app's
  access token.

## Brand Commitments

- The name وقار and the Latin wordmark WIỌAR.
- The owner's standard, in the store's own voice: الجودة · الذوق · القيمة.
- Arabic-first voice: plain, precise, never salesy.
- **Not binding:** the visual world may evolve. The current one — one warm greige ground (#edeae3),
  champagne in small doses, single light mode, Naseeb / Amiri / Plex — is the incumbent to
  preserve until a deliberate replacement is chosen.

## Evidence on Hand

- A 35-piece catalogue in Cloudflare D1 with prices, stock, descriptions and image links;
  `options`, `keywords` and `featured` columns exist for enrichment. Categories are a D1 table.
- Product photographs are placeholder links (royalty-free stock) stored with each product; the
  earlier local placeholder set remains in `src/assets/photos` and is no longer referenced.
- No reviews, testimonials, press, founder story or customer logos exist. Future work must not
  invent them.

## Product Principles

1. A short list is the product, not a limitation — what fails the standard is not shown.
2. The piece leads and the chrome recedes: photographs, materials and prices before decoration.
3. Say it plainly, in Arabic, in the voice of the person who chose the piece.
4. Every claim on the page has something behind it; nothing promises what the shop cannot do yet.
5. Nothing is presented as something else — not a placeholder photo as a product view, not a mock
   backend as a working checkout.

## Accessibility & Inclusion

- RTL and Arabic first: logical properties, Arabic-Indic digits, no letter-spacing on Arabic script.
- Text meets WCAG AA contrast on every ground; touch targets are 44px minimum; cart, gallery,
  search and checkout all have keyboard paths; motion is suppressed under `prefers-reduced-motion`.
