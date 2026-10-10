# Data

The catalogue lives in **D1 — `wiqar-products` — and nowhere else.** The storefront
build fetches it through the worker's `/catalog.json` route and bakes it into the
static pages. Auth for the commands below comes from `.env` (git-ignored):
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DEPLOY_HOOK_URL`.

## Daily operations (from the repo root)

    bun run sale --sale wq-001 --now 240 --until 2026-10-20   # a piece on sale
    bun run sale --sale wq-001 --off 15 --until 36h           # percent, not price
    bun run sale --end-sale wq-001                            # or: all
    bun run sale --sales                                      # live / scheduled / ended
    bun run sale --ping                                       # rebuild after a dashboard edit

`--until` / `--from` take `2d` / `36h` / `90m`, a plain date (that day's local
end), or an ISO instant. `--dry-run` prints the SQL without writing. Dashboard
edits (D1 → wiqar-products → Console) work too, but then ping the rebuild.

## What a sale is (fields on `products`)

- `price` — the regular price. Never changes when you set a sale.
- `sale_price` — the temporary price; must sit below `price`.
- `sale_starts_at` / `sale_ends_at` — the window, ISO dates. No window = runs until ended.
- `compare_at_price` — a crossed "previous price" for permanent markdowns (no window).

Every mark on the page is presence-driven: a sale renders the crossed price, the
counter, and the badge; when the window ends the regular price is simply back.

## Rebuilds

- `bun run sale` writes ping the deploy hook automatically.
- Sale windows: the worker's cron (every 10 min) pings when a window opens or
  closes, so grids never keep a stale badge.
- The deploy hook URL lives as a worker secret (`DEPLOY_HOOK_URL`).

## Schema changes

Add `migrations/0002_….sql`, then apply:

    bunx wrangler d1 migrations apply wiqar-products --remote   # live
    bunx wrangler d1 migrations apply wiqar-products --local    # dev copy

The build also validates every row (`src/lib/validate.ts`) and fails on broken
data — the last good deploy keeps serving.

## Backups

D1 Time Travel covers the last 30 days:

    bunx wrangler d1 time-travel info wiqar-products
    bunx wrangler d1 export wiqar-products --remote --output backup.sql
