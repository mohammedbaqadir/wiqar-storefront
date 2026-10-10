<script lang="ts">
  import type { ApiProduct } from '@/lib/api';
  import { money, stockLabel } from '@/lib/format';

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
  const shownPrice = $derived(
    onSale ? (product.sale_price ?? product.price) : (variantPrice ?? product.price)
  );
  const lowStockLabel = $derived(
    variantStock !== null && variantStock > 0 && variantStock <= 3 ? stockLabel(variantStock) : null
  );

  /* Same classes the starwind Button renders, so the island does not drift. */
  const buttonClass =
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-outline/50 h-11 px-5 text-base';
</script>

<div data-buy class="space-y-5 wq-in wq-d2">
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

  <div class="flex items-end gap-4">
    <span class="wq-price text-3xl text-room-ink">{money(shownPrice)}</span>
    {#if onSale}
      <span class="wq-price text-base text-room-ink-3 line-through">
        {money(product.regular_price)}
      </span>
    {/if}
  </div>

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
        data-product-price={variantPrice ?? product.price}
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
