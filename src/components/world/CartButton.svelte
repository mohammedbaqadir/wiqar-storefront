<script lang="ts">
  import { cart } from '@/lib/cart.svelte';
  import { toArabicDigits } from '@/lib/format';

  let countEl = $state<HTMLSpanElement | undefined>(undefined);
  let shown = cart.count;

  /* One quiet tick when something is added, nothing on the way out. */
  $effect(() => {
    const count = cart.count;
    if (
      count > shown &&
      countEl &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      countEl.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
        { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
    shown = count;
  });
</script>

<button
  type="button"
  onclick={() => (cart.open ? cart.hide() : cart.show())}
  class="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-room-ink transition-colors hover:text-accent-d"
  aria-label="السلة"
  aria-pressed={cart.open}
>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="size-4.5"
    aria-hidden="true"
  >
    <path d="M6 8h12l-1 11H7z"></path>
    <path d="M9 8a3 3 0 0 1 6 0"></path>
  </svg>
  {#if cart.count > 0}
    <span bind:this={countEl} class="font-data text-[0.7rem] leading-none">
      {toArabicDigits(cart.count)}
    </span>
  {/if}
</button>
