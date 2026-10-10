/**
 * The storefront Worker: static assets, plus one data route.
 *
 * `wrangler.jsonc` sends only /catalog.json here (run_worker_first); everything
 * else — pages and the self-hosted photos under /images/ — is served straight
 * from `dist/`. The route reads the D1 catalogue and answers in the shape
 * src/lib/api.ts expects, so the build fetches its data from the same Worker
 * the site is served from.
 */

interface D1PreparedStatement {
  all<T>(): Promise<{ results: T[] }>;
}

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  CATALOG_DB: { prepare(query: string): D1PreparedStatement };
}

type Row = Record<string, unknown>;

const STORE = {
  name: "وقار",
  name_en: "WIỌAR",
  currency: "SAR",
  locale: "ar",
  domain: "wiqar-storefront.directed-countless.workers.dev",
};

const num = (value: unknown, fallback = 0): number =>
  typeof value === "number" ? value : Number(value ?? fallback) || fallback;

/** An ISO date the store can count down to; anything unparseable is absent. */
const isoOrNull = (value: unknown): string | null => {
  const raw = String(value ?? "").trim();
  return raw !== "" && !Number.isNaN(Date.parse(raw)) ? raw : null;
};

const list = (value: unknown): unknown[] => {
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * A catalogue image. Paths become absolute against the request origin, and a
 * `/images/...@1200.jpg` gains its 600px sibling as `thumb` for grids and cart.
 */
const toImage = (url: unknown, alt: unknown, origin: string) => {
  const raw = String(url ?? "");
  const absolute = raw && !/^https?:\/\//i.test(raw) ? `${origin}${raw}` : raw;
  const thumb = absolute.replace(/-1200(\.\w+)$/, "-600$1");
  return {
    url: absolute,
    alt: String(alt ?? ""),
    ...(thumb !== absolute ? { thumb } : {}),
  };
};

function toProduct(row: Row, categoryId: Map<string, number>, origin: string) {
  const price = num(row.price);
  const compareAt =
    row.compare_at_price === null || row.compare_at_price === undefined ? null : num(row.compare_at_price);
  const startsAt = isoOrNull(row.sale_starts_at);
  const endsAt = isoOrNull(row.sale_ends_at);
  const now = Date.now();
  const windowOpen =
    (startsAt === null || now >= Date.parse(startsAt)) &&
    (endsAt === null || now <= Date.parse(endsAt));
  const onSale = compareAt !== null && compareAt > price && windowOpen;
  const quantity = row.quantity === null || row.quantity === undefined ? null : num(row.quantity);
  const images = list(row.images)
    .map((entry) => toImage((entry as Row).url, (entry as Row).alt, origin))
    .filter((entry) => entry.url !== "");
  const fallback = toImage(row.image_url, row.name, origin);

  return {
    id: num(row.id),
    sku: String(row.sku ?? ""),
    slug: String(row.slug || String(row.sku ?? "").toLowerCase()),
    name: String(row.name ?? ""),
    subtitle: "",
    description: String(row.description ?? ""),
    price,
    regular_price: onSale ? compareAt : price,
    sale_price: onSale ? price : null,
    sale_starts_at: onSale ? startsAt : null,
    sale_ends_at: onSale ? endsAt : null,
    quantity,
    status: String(row.status ?? ""),
    is_out_of_stock: quantity !== null && quantity <= 0,
    category_id: categoryId.get(String(row.category ?? "")) ?? 0,
    origin: "",
    standard: "",
    featured: Boolean(row.featured),
    keywords: list(row.keywords).map((word) => String(word)),
    created_at: String(row.created_at ?? ""),
    options: list(row.options),
    image: images[0] ?? fallback,
    images: images.length > 0 ? images : fallback.url ? [fallback] : [],
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/catalog.json") return env.ASSETS.fetch(request);

    const [products, categories] = await Promise.all([
      env.CATALOG_DB.prepare("SELECT * FROM products ORDER BY created_at DESC, sku").all<Row>(),
      env.CATALOG_DB.prepare("SELECT id, slug, name FROM categories ORDER BY sort, id").all<Row>(),
    ]);

    const rooms = categories.results.map((row) => ({
      id: num(row.id),
      slug: String(row.slug ?? ""),
      name: String(row.name ?? ""),
    }));
    const byName = new Map(rooms.map((room) => [room.name, room.id]));

    return Response.json({
      store: STORE,
      categories: rooms,
      products: products.results.map((row) => toProduct(row, byName, url.origin)),
    });
  },
};
