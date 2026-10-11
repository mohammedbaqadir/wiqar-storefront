/**
 * The cart, kept in the visitor's browser until the backend owns it.
 *
 * One source of truth for every page: the drawer, the header count and the
 * product page all read and write through here. Pointing this at Salla later
 * replaces the storage calls, not the shape.
 *
 * A line is keyed by the product *and* the options chosen, so the same piece in
 * two colours is two lines rather than a muddled quantity. Options are stored
 * as name/value pairs — that is what a checkout handoff needs, and the label
 * shoppers read is derived from them.
 *
 * Every function touches localStorage inside a try/catch: private-mode Safari
 * throws on access, and a cart is never worth breaking the page for.
 */

export interface CartOption {
  name: string;
  value: string;
}

export interface CartLineInput {
  id: number;
  slug: string;
  name: string;
  /** The catalogue sku — what a Salla cart line is identified by. */
  sku?: string;
  /** Chosen values, in the order the product page asks for them. */
  options?: CartOption[];
  price: number;
  image: string;
  /** Last known stock; null means the store does not track it. */
  max: number | null;
}

export interface CartLine extends CartLineInput {
  key: string;
  quantity: number;
}

export interface CartTotals {
  count: number;
  subtotal: number;
  freeShippingAt: number;
  toFreeShipping: number;
}

const STORAGE_KEY = 'wq-cart';
export const FREE_SHIPPING_AT = 500;

type Listener = (lines: CartLine[]) => void;
const listeners = new Set<Listener>();

export const lineKey = (id: number, options?: CartOption[]): string =>
  `${id}::${(options ?? []).map((option) => `${option.name}=${option.value}`).join('|')}`;

/** What the shopper reads on a line: the values, not the field names. */
export const optionLabel = (options?: CartOption[]): string =>
  (options ?? []).map((option) => option.value).join(' · ');

const isOption = (value: unknown): value is CartOption =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as CartOption).name === 'string' &&
  typeof (value as CartOption).value === 'string';

const isLine = (value: unknown): value is CartLineInput & { quantity: number } => {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Partial<CartLine>;
  return (
    typeof line.id === 'number' &&
    typeof line.slug === 'string' &&
    typeof line.name === 'string' &&
    typeof line.price === 'number' &&
    typeof line.image === 'string' &&
    typeof line.quantity === 'number' &&
    (line.max === null || typeof line.max === 'number') &&
    (line.sku === undefined || typeof line.sku === 'string') &&
    (line.options === undefined || (Array.isArray(line.options) && line.options.every(isOption)))
  );
};

/** Keeps a quantity sane: at least one, never past the shelf. */
export const clampQuantity = (quantity: number, max: number | null): number => {
  const whole = Math.max(1, Math.floor(quantity) || 1);
  return max === null ? whole : Math.min(whole, Math.max(1, max));
};

export const readCart = (): CartLine[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLine).map((line) => {
      const options = line.options?.length ? line.options : undefined;
      return { ...line, options, key: lineKey(line.id, options) };
    });
  } catch {
    return [];
  }
};

const writeCart = (lines: CartLine[]): CartLine[] => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* storage unavailable: the cart still works for this page view */
  }
  listeners.forEach((listener) => listener(lines));
  return lines;
};

/** Returns an unsubscribe function. */
export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const addLine = (line: CartLineInput, quantity = 1): CartLine[] => {
  const lines = readCart();
  const options = line.options?.length ? line.options : undefined;
  const key = lineKey(line.id, options);
  const existing = lines.find((item) => item.key === key);

  if (existing) {
    existing.quantity = clampQuantity(existing.quantity + quantity, existing.max);
  } else {
    lines.push({ ...line, options, key, quantity: clampQuantity(quantity, line.max) });
  }
  return writeCart(lines);
};

export const setQuantity = (key: string, quantity: number): CartLine[] =>
  writeCart(
    readCart().map((line) =>
      line.key === key ? { ...line, quantity: clampQuantity(quantity, line.max) } : line
    )
  );

export const removeLine = (key: string): CartLine[] =>
  writeCart(readCart().filter((line) => line.key !== key));

export const clearCart = (): CartLine[] => writeCart([]);

export const totals = (lines: CartLine[]): CartTotals => {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return {
    count,
    subtotal,
    freeShippingAt: FREE_SHIPPING_AT,
    toFreeShipping: Math.max(0, FREE_SHIPPING_AT - subtotal),
  };
};
