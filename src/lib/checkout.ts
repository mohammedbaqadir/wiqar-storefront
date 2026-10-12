import { FREE_SHIPPING_AT, readCart, totals, type CartLine } from '@/lib/cart';

/**
 * The purchase exit.
 *
 * This module is the only place that knows how an order leaves the storefront.
 * The cart travels to the backend, which turns it into a real Salla cart —
 * guest carts need no token, the store and the app identify themselves with
 * headers — and answers with Salla's `checkout_url`. The shopper is sent there;
 * Salla hosts the address step, shipping, and payment.
 *
 * Lines are identified by SKU: the one name the D1 catalogue and the Salla
 * store share.
 */

/** Base of the checkout runtime. Overridable with PUBLIC_BACKEND_URL at build time. */
const BACKEND_URL =
  import.meta.env.PUBLIC_BACKEND_URL ?? 'https://wiqar-backend.directed-countless.workers.dev';

/* A production build must never aim shoppers at a local or plain-http backend:
   a stale build variable should fail honestly, not navigate into the void. */
const backendUsable = import.meta.env.DEV || BACKEND_URL.startsWith('https://');

/** A line as the checkout backend wants it: sku, count, chosen options. */
export interface CheckoutLine {
  identifier_type: 'sku';
  identifier: string;
  quantity: number;
  options?: Array<{ name: string; value: string }>;
}

/** Flat rate under the free-shipping threshold. The real rate arrives at Salla's checkout. */
export const SHIPPING_FLAT = 25;

/** What shipping costs on a given basket. */
export const shippingFor = (subtotal: number): number =>
  subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FLAT;

export interface CheckoutOrder {
  lines: CheckoutLine[];
  subtotal: number;
  currency: 'SAR';
}

export type CheckoutResult =
  | { status: 'redirect'; redirectTo: string }
  | { status: 'unconfigured' }
  | { status: 'failed'; reason: string };

/** The cart, ready to be sent to the checkout backend. */
export const buildOrder = (lines: CartLine[] = readCart()): CheckoutOrder => ({
  lines: lines.map((line) => ({
    identifier_type: 'sku',
    identifier: line.sku ?? '',
    quantity: line.quantity,
    options: line.options?.map((option) => ({ name: option.name, value: option.value })),
  })),
  subtotal: totals(lines).subtotal,
  currency: 'SAR',
});

interface CartShape {
  id?: number | string;
  checkout_url?: string;
  urls?: { checkout?: string };
}

interface Envelope {
  data?: CartShape;
  error?: { message?: string };
}

/**
 * Hand the order over: create the Salla cart, add every line, answer with
 * where the shopper goes next. Nothing is charged here — payment happens on
 * Salla's page.
 */
export const beginCheckout = async (order: CheckoutOrder = buildOrder()): Promise<CheckoutResult> => {
  if (!backendUsable) return { status: 'unconfigured' };
  if (order.lines.length === 0) return { status: 'failed', reason: 'empty' };
  if (order.lines.some((line) => line.identifier === '')) {
    return { status: 'failed', reason: 'missing-sku' };
  }

  let payload: Envelope | null = null;
  try {
    const response = await fetch(`${BACKEND_URL}/cart`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    });
    payload = (await response.json().catch(() => null)) as Envelope | null;
    if (response.status === 503) return { status: 'unconfigured' };
    if (!response.ok) {
      return { status: 'failed', reason: payload?.error?.message ?? `cart ${response.status}` };
    }
  } catch {
    return { status: 'failed', reason: 'offline' };
  }

  const cart = payload?.data ?? (payload as CartShape | null);
  const cartId = cart?.id === undefined ? '' : String(cart.id);
  const checkoutUrl = cart?.checkout_url ?? cart?.urls?.checkout ?? '';
  if (!cartId || !checkoutUrl) return { status: 'failed', reason: 'cart-shape' };

  for (const line of order.lines) {
    try {
      const response = await fetch(`${BACKEND_URL}/cart/${encodeURIComponent(cartId)}/items`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(line),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        const itemPayload = (await response.json().catch(() => null)) as Envelope | null;
        return { status: 'failed', reason: itemPayload?.error?.message ?? `item ${response.status}` };
      }
    } catch {
      return { status: 'failed', reason: 'offline' };
    }
  }

  return { status: 'redirect', redirectTo: checkoutUrl };
};
