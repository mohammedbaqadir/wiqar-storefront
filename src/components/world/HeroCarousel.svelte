<script lang="ts">
  import { onMount } from 'svelte';
  import { isLowStock, isOnSale, isOutOfStock, lowStockLabel, type ApiProduct } from '@/lib/api';
  import { money } from '@/lib/format';
  import { url } from '@/lib/url';

  interface Props {
    products: ApiProduct[];
  }

  let { products }: Props = $props();

  let active = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  let running = false;
  let touchX: number | null = null;

  const go = (index: number) => (active = (index + products.length) % products.length);

  const halt = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
  };

  const arm = () => {
    if (!running || document.hidden) return;
    halt();
    timer = setInterval(() => go(active + 1), 7000);
  };

  /* A deliberate move resets the clock; hover, focus and a hidden tab pause it. */
  const pick = (index: number) => {
    go(index);
    arm();
  };

  const onTouchStart = (event: TouchEvent) => {
    touchX = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (touchX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchX) - touchX;
    if (Math.abs(delta) > 44) pick(active + (delta < 0 ? 1 : -1));
    touchX = null;
  };

  onMount(() => {
    running = products.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    arm();
    const onVisibility = () => (document.hidden ? halt() : arm());
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      halt();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });
</script>

<section
  class="relative border-b border-hairline"
  aria-roledescription="carousel"
  aria-label="المختارات"
  onmouseenter={halt}
  onmouseleave={arm}
  onfocusin={halt}
  onfocusout={arm}
  ontouchstart={onTouchStart}
  ontouchend={onTouchEnd}
>
  <div class="relative min-h-[48vh] overflow-hidden bg-exhibit-2 sm:min-h-[54vh] lg:min-h-[62vh]">
    {#each products as product, index (product.slug)}
      {@const gone = isOutOfStock(product)}
      <article
        class="slide {index === active ? 'active' : ''}"
        inert={index === active ? undefined : true}
        aria-hidden={index === active ? undefined : true}
      >
        <img
          src={product.image.url}
          alt={product.image.alt}
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchpriority={index === 0 ? 'high' : undefined}
          class="absolute inset-0 size-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-scrim/75 via-scrim/20 to-scrim/5"></div>

        <div class="absolute inset-x-0 bottom-0">
          <div class="mx-auto flex max-w-6xl flex-col items-start gap-3 px-5 pb-16 lg:px-8 lg:pb-20">
            <p class="flex items-center gap-3 font-data text-[0.7rem] text-on-photo/70">
              <span class="tracking-normal">المختارة</span>
              <span aria-hidden="true" class="h-px w-6 bg-on-photo/40"></span>
              <span class="tracking-[0.2em]" dir="ltr">{product.sku}</span>
            </p>
            <h2 class="font-display text-4xl leading-tight text-on-photo lg:text-6xl">
              {product.name}
            </h2>
            <p
              class="line-clamp-2 max-w-xl font-reading text-base leading-loose text-on-photo/85 lg:text-lg"
            >
              {product.description}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
              <span class="flex flex-wrap items-center gap-3">
                <span class="wq-price text-xl text-on-photo">{money(product.price)}</span>
                {#if isOnSale(product)}
                  <span class="wq-price text-sm text-on-photo/60 line-through">
                    {money(product.regular_price)}
                  </span>
                  <span class="bg-ink px-2 py-0.5 text-[0.7rem] text-exhibit">عرض</span>
                {/if}
              </span>
              {#if gone}
                <span class="font-data text-[0.7rem] text-on-photo/70">نفدت الكمية</span>
              {:else if isLowStock(product)}
                <span class="font-data text-[0.7rem] text-on-photo/70">{lowStockLabel(product)}</span>
              {/if}
              <a
                href={url(`/product/${product.slug}`)}
                class="inline-flex h-11 items-center justify-center rounded-md border bg-background px-5 text-base font-medium whitespace-nowrap text-foreground shadow-xs transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:border-outline focus-visible:ring-3 focus-visible:ring-outline/50"
              >
                {gone ? 'تفاصيل القطعة' : 'تسوّق القطعة'}
              </a>
            </div>
          </div>
        </div>
      </article>
    {/each}

    {#if products.length > 1}
      <div class="pointer-events-none absolute inset-x-0 bottom-5 z-10">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 lg:px-8">
          <div class="pointer-events-auto flex items-center gap-2">
            {#each products as product, index (product.slug)}
              <button
                type="button"
                aria-current={index === active ? 'true' : undefined}
                aria-label={`المختارة ${index + 1}: ${product.name}`}
                onclick={() => pick(index)}
                class="h-[3px] w-7 transition-colors {index === active
                  ? 'bg-on-photo'
                  : 'bg-on-photo/35 hover:bg-on-photo/60'}"
              ></button>
            {/each}
          </div>
          <div class="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="السابق"
              onclick={() => pick(active - 1)}
              class="grid size-10 place-items-center rounded-full border border-on-photo/35 text-on-photo transition-colors hover:bg-on-photo/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-outline/50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
                aria-hidden="true"
              >
                <path d="M9 6l6 6-6 6"></path>
              </svg>
            </button>
            <button
              type="button"
              aria-label="التالي"
              onclick={() => pick(active + 1)}
              class="grid size-10 place-items-center rounded-full border border-on-photo/35 text-on-photo transition-colors hover:bg-on-photo/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-outline/50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
                aria-hidden="true"
              >
                <path d="M15 6l-6 6 6 6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 1100ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .slide img {
    transform: scale(1.06);
    transition: transform 9000ms ease-out;
    will-change: transform;
  }

  .slide.active {
    opacity: 1;
    pointer-events: auto;
  }

  .slide.active img {
    transform: scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    .slide,
    .slide img {
      transition: none;
    }

    .slide img {
      transform: none;
    }
  }
</style>
