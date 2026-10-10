<script lang="ts">
  import { onMount } from 'svelte';
  import type { ApiProduct } from '@/lib/api';
  import { money, stockLabel, toArabicDigits } from '@/lib/format';

  interface Props {
    product: ApiProduct;
  }

  let { product }: Props = $props();

  /* One chosen index per option group; absent means the first value — the
     same state the server renders. */
  let choice = $state<Record<number, number>>({});

  const selected = $derived(
    product.options.map((option, index) => option.values[choice[index] ?? 0])
  );

  /* A value's own price wins; the scarcest tracked stock wins. Values without
     either simply defer to the piece's own numbers. */
  const variantPrice = $derived(selected.find((value) => typeof value?.price === 'number')?.price);
  const variantStock = $derived.by(() => {
    const tracked = selected
      .map((value) => value?.stock)
      .filter((stock): stock is number => typeof stock === 'number');
    return tracked.length > 0 ? Math.min(...tracked) : null;
  });

  const gone = $derived(product.is_out_of_stock || product.quantity === 0);
  const onSale = $derived(
    variantPrice === undefined &&
      product.sale_price !== null &&
      product.sale_price < product.regular_price
  );
  const lowStockLabel = $derived(
    variantStock !== null && variantStock > 0 && variantStock <= 3 ? stockLabel(variantStock) : null
  );

  /* The countdown renders only after mount: the server has no clock to trust. */
  let mounted = $state(false);
  let now = $state(Date.now());

  onMount(() => {
    mounted = true;
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });

  const dayPhrase = (count: number): string =>
    count === 1
      ? 'يوم'
      : count === 2
        ? 'يومين'
        : count <= 10
          ? `${toArabicDigits(count)} أيام`
          : `${toArabicDigits(count)} يومًا`;
  const hourPhrase = (count: number): string =>
    count === 1
      ? 'ساعة'
      : count === 2
        ? 'ساعتين'
        : count <= 10
          ? `${toArabicDigits(count)} ساعات`
          : `${toArabicDigits(count)} ساعةً`;

  const saleEnd = $derived(product.sale_ends_at ? Date.parse(product.sale_ends_at) : null);
  const expired = $derived(saleEnd !== null && now > saleEnd);
  const saleLive = $derived(onSale && !expired);
  const payPrice = $derived(
    saleLive
      ? (product.sale_price ?? product.price)
      : (variantPrice ?? (expired ? product.regular_price : product.price))
  );

  const countdown = $derived.by(() => {
    if (!saleLive || saleEnd === null) return null;
    const left = saleEnd - now;
    if (left <= 0) return null;
    const days = Math.floor(left / 86_400_000);
    const hours = Math.floor((left % 86_400_000) / 3_600_000);
    if (days >= 1) {
      const parts = [dayPhrase(days)];
      if (hours > 0) parts.push(hourPhrase(hours));
      return `ينتهي العرض خلال ${parts.join(' و')}`;
    }
    const minutes = Math.floor((left % 3_600_000) / 60_000);
    const seconds = Math.floor((left % 60_000) / 1000);
    const pad = (value: number) => toArabicDigits(String(value).padStart(2, '0'));
    return `ينتهي العرض خلال ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  });

  /* Same classes the starwind Button renders, so the island does not drift. */
  const buttonClass =
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-outline/50 h-11 px-5 text-base';
</script>

<div data-buy class="space-y-5 wq-in wq-d2">
  <div class="space-y-2">
    <div class="flex items-end gap-4">
      <span class="wq-price text-3xl text-room-ink">{money(payPrice)}</span>
      {#if saleLive}
        <span class="wq-price text-base text-room-ink-3 line-through">
          {money(product.regular_price)}
        </span>
      {/if}
    </div>
    {#if mounted && countdown}
      <p class="font-data text-[0.8rem] text-room-ink-3">{countdown}</p>
    {/if}
  </div>

  {#each product.options as option, optionIndex (optionIndex)}
    <fieldset class="space-y-2">
      <legend class="font-data text-[0.7rem] tracking-[0.12em] text-room-ink-3">
        {option.name}
      </legend>
      <div class="flex flex-wrap gap-2">
        {#each option.values as value, valueIndex (valueIndex)}
          <label class="cursor-pointer">
            <input
              type="radio"
              name={`option-${optionIndex}`}
              value={value.label}
              checked={(choice[optionIndex] ?? 0) === valueIndex}
              data-option
              data-option-name={option.name}
              class="peer sr-only"
              onchange={() => (choice[optionIndex] = valueIndex)}
            />
            <span
              class="inline-flex min-h-11 items-center gap-2 border border-hairline px-3 text-sm text-room-ink-2 transition-colors peer-checked:border-outline peer-checked:text-room-ink peer-focus-visible:ring-2 peer-focus-visible:ring-outline/40"
            >
              {#if value.swatch}
                <span
                  aria-hidden="true"
                  class="size-3.5 rounded-full border border-hairline"
                  style:background={value.swatch}
                ></span>
              {/if}
              {value.label}
            </span>
          </label>
        {/each}
      </div>
    </fieldset>
  {/each}

  {#if gone}
    <button type="button" disabled class={buttonClass}>نفدت الكمية</button>
  {:else if variantStock === 0}
    <button type="button" disabled class={buttonClass}>نفد هذا الخيار</button>
  {:else}
    <div class="flex flex-wrap items-center gap-4">
      <label
        class="flex min-h-11 items-center gap-3 border border-hairline bg-exhibit px-3 focus-within:border-outline focus-within:ring-2 focus-within:ring-outline/40"
      >
        <span class="text-sm text-room-ink-2">الكمية</span>
        <input
          type="number"
          name="quantity"
          value="1"
          min="1"
          class="wq-field-bare w-14 p-0 text-center font-data text-sm text-ink"
        />
      </label>
      <button
        type="button"
        data-add-to-cart
        data-product-id={product.id}
        data-product-slug={product.slug}
        data-product-name={product.name}
        data-product-price={payPrice}
        data-product-image={product.image.thumb ?? product.image.url}
        data-product-stock={variantStock ?? product.quantity ?? ''}
        class={buttonClass}
      >
        أضف إلى السلة
      </button>
    </div>
    {#if lowStockLabel}
      <p class="text-[0.8rem] text-signal">{lowStockLabel}</p>
    {/if}
  {/if}
</div>
