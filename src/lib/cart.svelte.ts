import {
  addLine,
  readCart,
  removeLine,
  setQuantity,
  totals,
  type CartLine,
  type CartLineInput,
} from '@/lib/cart';

/**
 * The cart, reactive. One module-level store shared by every island on the
 * page. The pure storage functions in cart.ts stay the source of truth, so
 * the checkout page — still plain TypeScript — reads and writes the same
 * lines in localStorage.
 */
class CartStore {
  lines = $state<CartLine[]>(readCart());
  /** The drawer's open state lives with the cart so any island can move it. */
  open = $state(false);

  get count(): number {
    return this.lines.reduce((sum, line) => sum + line.quantity, 0);
  }

  get hasItems(): boolean {
    return this.lines.length > 0;
  }

  get summary() {
    return totals(this.lines);
  }

  /* Arrow properties: safe to hand straight to an onclick. */
  add = (line: CartLineInput, quantity = 1): void => {
    this.lines = addLine(line, quantity);
  };

  setQuantity = (key: string, quantity: number): void => {
    this.lines = setQuantity(key, quantity);
  };

  remove = (key: string): void => {
    this.lines = removeLine(key);
  };

  show = (): void => {
    this.open = true;
  };

  hide = (): void => {
    this.open = false;
  };
}

export const cart = new CartStore();
