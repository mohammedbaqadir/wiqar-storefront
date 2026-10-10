<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { lineKey, optionLabel, FREE_SHIPPING_AT, type CartLineInput } from '@/lib/cart';
  import { cart } from '@/lib/cart.svelte';
  import { money, toArabicDigits } from '@/lib/format';
  import { url } from '@/lib/url';

  let panelEl = $state<HTMLElement | undefined>(undefined);
  let announce = $state('');
  let recentKey = $state<string | null>(null);
  let lastFocused: HTMLElement | null = null;
  let recentTimer: ReturnType<typeof setTimeout> | undefined;

  const summary = $derived(cart.summary);
  const progress = $derived(Math.min(100, Math.round((summary.subtotal / FREE_SHIPPING_AT) * 100)));

  /* Opening and closing come with their manners: scroll lock, focus in and
     out. The effect reads only `open`, so the stores never loop. */
  $effect(() => {
    if (cart.open) {
      lastFocused = (document.activeElement as HTMLElement | null) ?? null;
      document.body.style.overflow = 'hidden';
      queueMicrotask(() => panelEl?.querySelector<HTMLElement>('[data-cart-close]')?.focus());
    } else {
      document.body.style.overflow = '';
      lastFocused?.focus?.();
      lastFocused = null;
    }
  });

  onMount(() => {
    const controller = new AbortController();
    const { signal } = controller;

    /* Only the newest island keeps document listeners: re-hydration hands the
       baton over instead of stacking. */
    const handover = (window as unknown as { __wqCartHandover?: () => void }).__wqCartHandover;
    handover?.();
    (window as unknown as { __wqCartHandover?: () => void }).__wqCartHandover = () =>
      controller.abort();

    /* One delegated listener reaches every add button on every page. */
    document.addEventListener(
      'click',
      (event) => {
        const target = event.target as Element | null;
        const button = target?.closest?.('[data-add-to-cart]') as HTMLElement | null;
        if (!button) return;

        const data = button.dataset;
        const buy = button.closest('[data-buy]');
        const quantityInput = buy?.querySelector<HTMLInputElement>('input[name="quantity"]');
        const chosen = Array.from(
          buy?.querySelectorAll<HTMLInputElement>('[data-option]:checked') ?? []
        )
          .map((input) => ({ name: input.dataset.optionName ?? '', value: input.value }))
          .filter((option) => option.name !== '' && option.value !== '');
        const name = data.productName ?? '';
        const key = lineKey(Number(data.productId), chosen.length > 0 ? chosen : undefined);

        const line: CartLineInput = {
          id: Number(data.productId),
          slug: data.productSlug ?? '',
          name,
          options: chosen.length > 0 ? chosen : undefined,
          price: Number(data.productPrice ?? 0),
          image: data.productImage ?? '',
          max: data.productStock ? Number(data.productStock) : null,
        };

        cart.add(line, quantityInput ? Number(quantityInput.value) || 1 : 1);
        announce = `أُضيف ${name} إلى السلة.`;
        recentKey = key;
        if (recentTimer) clearTimeout(recentTimer);
        recentTimer = setTimeout(() => (recentKey = null), 900);
        cart.show();
      },
      { signal }
    );

    document.addEventListener(
      'keydown',
      (event) => {
        if (!cart.open) return;
        if (event.key === 'Escape') {
          cart.hide();
          return;
        }
        if (event.key !== 'Tab' || !panelEl) return;

        const items = Array.from(
          panelEl.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((element) => element.offsetParent !== null);
        if (items.length === 0) return;

        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      },
      { signal }
    );

    /* Leaving a page mid-open must not leave the body locked. */
    document.addEventListener(
      'astro:page-load',
      () => {
        if (cart.open) cart.hide();
      },
      { signal }
    );

    return () => controller.abort();
  });

  onDestroy(() => {
    if (recentTimer) clearTimeout(recentTimer);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });
</script>

<div
  data-cart-drawer
  inert={!cart.open ? true : undefined}
  data-open={cart.open ? '' : undefined}
  class="group/cart pointer-events-none fixed inset-0 z-50 opacity-0 transition-opacity duration-200 data-[open]:pointer-events-auto data-[open]:opacity-100"
>
  <div data-cart-overlay class="absolute inset-0 bg-scrim/50" aria-hidden="true" onclick={cart.hide}></div>

  <div
    bind:this={panelEl}
    data-cart-panel
    role="dialog"
    aria-modal="true"
    aria-label="سلة المشتريات"
    class="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-exhibit text-ink shadow-[0_28px_70px_-28px_rgba(17,17,16,0.5)]"
  >
    <header class="flex items-center justify-between gap-4 border-b border-hairline-ink px-5 py-4">
      <h2 class="font-display text-xl">
        السلة
        {#if cart.hasItems}
          <span class="font-data text-sm text-ink-3">({toArabicDigits(summary.count)})</span>
        {/if}
      </h2>
      <button
        type="button"
        data-cart-close
        aria-label="إغلاق السلة"
        onclick={cart.hide}
        class="grid size-11 place-items-center text-ink transition-colors hover:text-accent-d"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          class="size-4.5"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18"></path>
        </svg>
      </button>
    </header>

    {#if !cart.hasItems}
      <div class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p class="font-display text-lg text-ink">سلتك فارغة</p>
        <p class="text-sm leading-relaxed text-ink-2">لم تُضف أي قطعة بعد.</p>
        <a
          href={url('/catalog')}
          class="mt-2 inline-flex min-h-11 items-center border border-hairline-ink px-4 text-sm text-ink transition-colors hover:bg-exhibit-2"
        >
          تصفّح المتجر
        </a>
      </div>
    {:else}
      <ul class="flex flex-1 flex-col overflow-y-auto px-5 py-1">
        {#each cart.lines as line (line.key)}
          <li
            class="flex gap-3 border-b border-hairline-ink py-4"
            class:wq-line-in={line.key === recentKey}
          >
            <img class="size-20 shrink-0 bg-exhibit-2 object-cover" src={line.image} alt={line.name} />
            <div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <a
                    href={url(`/product/${line.slug}`)}
                    class="block truncate text-sm text-ink transition-colors hover:text-accent-d"
                  >
                    {line.name}
                  </a>
                  {#if optionLabel(line.options)}
                    <p class="mt-0.5 font-data text-[0.7rem] text-ink-3">
                      {optionLabel(line.options)}
                    </p>
                  {/if}
                </div>
                <button
                  type="button"
                  onclick={() => cart.remove(line.key)}
                  class="-me-1 inline-flex min-h-11 shrink-0 items-center px-1.5 text-[0.7rem] text-ink-3 transition-colors hover:text-signal"
                >
                  إزالة
                </button>
              </div>
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center border border-hairline-ink">
                  <button
                    type="button"
                    aria-label="زيادة الكمية"
                    onclick={() => cart.setQuantity(line.key, line.quantity + 1)}
                    disabled={line.max !== null && line.quantity >= line.max}
                    class="size-11 text-ink transition-colors hover:bg-exhibit-2 disabled:opacity-35"
                  >
                    +
                  </button>
                  <span class="min-w-8 text-center font-data text-sm text-ink">
                    {toArabicDigits(line.quantity)}
                  </span>
                  <button
                    type="button"
                    aria-label="إنقاص الكمية"
                    onclick={() => cart.setQuantity(line.key, line.quantity - 1)}
                    class="size-11 text-ink transition-colors hover:bg-exhibit-2"
                  >
                    −
                  </button>
                </div>
                <span class="wq-price text-base text-ink">{money(line.price * line.quantity)}</span>
              </div>
            </div>
          </li>
        {/each}
      </ul>

      <footer class="flex flex-col gap-4 border-t border-hairline-ink px-5 py-4">
        <div class="space-y-2">
          <p class="text-[0.8rem] text-ink-2">
            {summary.toFreeShipping > 0
              ? `أضف ${money(summary.toFreeShipping)} للحصول على توصيل مجاني.`
              : 'التوصيل مجاني.'}
          </p>
          <div class="h-[3px] w-full bg-exhibit-2">
            <span
              class="block h-full bg-accent transition-[width] duration-300"
              style={`width:${progress}%`}
            ></span>
          </div>
        </div>

        <div class="flex items-baseline justify-between gap-4">
          <span class="text-sm text-ink-2">المجموع الفرعي</span>
          <span class="wq-price text-xl text-ink">{money(summary.subtotal)}</span>
        </div>

        <p class="text-[0.75rem] leading-relaxed text-ink-3">
          الشحن يُحسب عند الدفع · إرجاع خلال ١٤ يومًا
        </p>

        <a
          href={url('/checkout')}
          class="inline-flex min-h-11 items-center justify-center bg-ink px-4 text-sm text-exhibit transition-colors hover:bg-ink/90"
        >
          إتمام الشراء
        </a>

        <button
          type="button"
          onclick={cart.hide}
          class="min-h-11 border border-hairline-ink px-4 text-sm text-ink transition-colors hover:bg-exhibit-2"
        >
          متابعة التسوّق
        </button>
      </footer>
    {/if}

    <p aria-live="polite" class="sr-only">{announce}</p>
  </div>
</div>
