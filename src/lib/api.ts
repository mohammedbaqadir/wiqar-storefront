import { stockLabel } from '@/lib/format';

/**
 * The store's data seam. Every page reads the shop through this file and
 * nothing else. The catalogue comes from the /catalog.json route on the store's
 * own Worker (src/worker.ts), which reads the D1 catalogue; the shapes below
 * stay the contract, so the source can move again without touching a page.
 */

export interface ApiImage {
  url: string;
  alt: string;
  /** A 600px sibling for grids and the cart, when the catalogue has one. */
  thumb?: string;
}

/** A choice the shopper makes: a size, a colour, a measure. */
export interface ApiProductOptionValue {
  label: string;
  swatch?: string;
  /** Units left of this exact choice; absent when the catalogue doesn't track it. */
  stock?: number;
  /** This choice's own price; absent when it sells at the piece's price. */
  price?: number;
}

export interface ApiProductOption {
  name: string;
  values: ApiProductOptionValue[];
}

export interface ApiCategory {
  id: number;
  slug: string;
  name: string;
}

export interface ApiProduct {
  id: number;
  sku: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  regular_price: number;
  sale_price: number | null;
  quantity: number | null;
  status: string;
  is_out_of_stock: boolean;
  category_id: number;
  origin: string;
  standard: string;
  /** The piece the vitrine leads with. */
  featured?: boolean;
  /** Shopper-facing synonyms: the forms people type that the copy doesn't carry. */
  keywords: string[];
  /** ISO date, newest first when sorting by "الأحدث". */
  created_at: string;
  /** Empty when the piece has no choices to make. */
  options: ApiProductOption[];
  image: ApiImage;
  images: ApiImage[];
}

export interface ApiStore {
  name: string;
  name_en: string;
  currency: string;
  locale: string;
  domain: string;
}

interface ApiCatalog {
  store: ApiStore;
  categories: ApiCategory[];
  products: ApiProduct[];
}

const CATALOG_URL =
  import.meta.env.CATALOG_URL ?? 'https://wiqar-storefront.directed-countless.workers.dev/catalog.json';

let pending: Promise<ApiCatalog> | null = null;

/**
 * The catalogue is fetched once per build (or dev server). A bad response stops
 * the build on purpose: a shop page with no products is worse than a failure.
 */
const load = (): Promise<ApiCatalog> => {
  if (!pending) {
    pending = fetch(CATALOG_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`catalogue fetch failed: ${response.status} ${response.statusText} — ${CATALOG_URL}`);
      }
      return response.json() as Promise<ApiCatalog>;
    });
  }
  return pending;
};

export const getStore = async (): Promise<ApiStore> => (await load()).store;

export const getCategories = async (): Promise<ApiCategory[]> => (await load()).categories;

export const getProducts = async (): Promise<ApiProduct[]> => (await load()).products;

export const getProduct = async (slug: string): Promise<ApiProduct | null> =>
  (await load()).products.find((product) => product.slug === slug) ?? null;

export const getCategory = async (id: number): Promise<ApiCategory | null> =>
  (await load()).categories.find((category) => category.id === id) ?? null;

export const getProductsInCategory = async (categoryId: number): Promise<ApiProduct[]> =>
  (await load()).products.filter((product) => product.category_id === categoryId);

/**
 * Closest pieces first: the same room, then shared keywords, then a nearby price.
 * Deterministic, so the row never reshuffles between builds.
 */
export const getRelated = async (product: ApiProduct, limit = 4): Promise<ApiProduct[]> => {
  const { products } = await load();
  const words = new Set(product.keywords ?? []);

  const score = (other: ApiProduct): number => {
    let points = other.category_id === product.category_id ? 3 : 0;
    points += (other.keywords ?? []).filter((word) => words.has(word)).length;

    const spread =
      Math.max(other.price, product.price) / Math.max(1, Math.min(other.price, product.price));
    return spread <= 1.6 ? points + 1 : points;
  };

  return products
    .filter((other) => other.id !== product.id)
    .map((other) => ({ product: other, points: score(other) }))
    .sort((a, b) => b.points - a.points || a.product.price - b.product.price)
    .slice(0, limit)
    .map((entry) => entry.product);
};

export const isOnSale = (product: ApiProduct): boolean =>
  product.sale_price !== null && product.sale_price < product.regular_price;

/** Gone: either the flag or an empty shelf. */
export const isOutOfStock = (product: ApiProduct): boolean =>
  product.is_out_of_stock || product.quantity === 0;

/** The one red: last units, never for a product that is already gone. */
export const isLowStock = (product: ApiProduct): boolean =>
  !isOutOfStock(product) && product.quantity !== null && product.quantity <= 3;

/** What the red flag says: a single piece is not "1 قطع". */
export const lowStockLabel = (product: ApiProduct): string =>
  stockLabel(product.quantity ?? 0);
