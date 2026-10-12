<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { money } from '@/lib/format';
  import { normalize, scoreMatch, searchText } from '@/lib/search';

  interface SearchItem {
    slug: string;
    name: string;
    price: number;
    thumb: string;
    category: string;
    hay: string;
    label: string;
  }

  interface RawCatalog {
    categories?: Array<{ id: number; name: string }>;
    products?: Array<{
      slug: string;
      name: string;
      price: number;
      description?: string;
      sku?: string;
      keywords?: string[];
      category_id: number;
      image?: { url?: string; thumb?: string };
    }>;
  }

  /* Same origin in production; the worker carries CORS, so dev fetches it too. */
  const CATALOG_URL = import.meta.env.DEV
    ? 'https://wiqar-storefront.directed-countless.workers.dev/catalog.json'
    : '/catalog.json';

  const RECENTS_KEY = 'wq-search-recent';

  let open = $state(false);
  let query = $state('');
  let active = $state(-1);
  let loading = $state(false);
  let items = $state<SearchItem[]>([]);
  let recents = $state<string[]>([]);
  let inputEl = $state<HTMLInputElement | undefined>(undefined);
  let panelEl = $state<HTMLElement | undefined>(undefined);
  let lastFocused: HTMLElement | null = null;
  let closing = false;

  const results = $derived.by(() => {
    const q = query.trim();
    if (q === '' || items.length === 0) return [];
    return items
      .map((item) => ({ item, ...scoreMatch(item.hay, item.label, q) }))
      .filter((entry) => entry.matched)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((entry) => entry.item);
  });

  const load = async (): Promise<void> => {
    const w = window as unknown as { __wqSearchItems?: SearchItem[] };
    if (w.__wqSearchItems) {
      items = w.__wqSearchItems;
      return;
    }
    loading = true;
    try {
      const response = await fetch(CATALOG_URL);
      const data = (await response.json()) as RawCatalog;
      const names = new Map((data.categories ?? []).map((category) => [category.id, category.name]));
      const built = (data.products ?? []).map((product): SearchItem => {
        const category = names.get(product.category_id) ?? '';
        return {
          slug: product.slug,
          name: product.name,
          price: product.price,
          thumb: product.image?.thumb ?? product.image?.url ?? '',
          category,
          hay: searchText(
            product.name,
            product.description ?? '',
            product.sku ?? '',
            category,
            ...(product.keywords ?? [])
          ),
          label: normalize(product.name),
        };
      });
      w.__wqSearchItems = built;
      items = built;
    } catch {
      /* offline: the overlay answers "no results", never breaks the page */
    } finally {
      loading = false;
    }
  };

  const rememberRead = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]') as unknown;
      recents = Array.isArray(saved)
        ? saved.filter((entry): entry is string => typeof entry === 'string').slice(0, 4)
        : [];
    } catch {
      recents = [];
    }
  };

  const rememberWrite = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === '') return;
    recents = [trimmed, ...recents.filter((entry) => entry !== trimmed)].slice(0, 4);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
    } catch {
      /* private mode: the list simply does not persist */
    }
  };

  const show = (seed = '') => {
    if (open) return;
    lastFocused = (document.activeElement as HTMLElement | null) ?? null;
    query = seed;
    active = -1;
    rememberRead();
    open = true;
    void load();
    queueMicrotask(() => inputEl?.focus());
  };

  const hide = () => {
    open = false;
    closing = true;
    lastFocused?.focus?.();
    lastFocused = null;
    closing = false;
  };

  const pick = (item: SearchItem) => {
    rememberWrite(query);
    hide();
    void navigate(`/product/${item.slug}`);
  };

  const openAllResults = () => {
    rememberWrite(query);
    const q = query.trim();
    hide();
    void navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const onInputKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length > 0) active = (active + 1) % results.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      active = active <= 0 ? results.length - 1 : active - 1;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (active >= 0 && results[active]) pick(results[active]);
      else if (query.trim() !== '') openAllResults();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      hide();
    }
  };

  const onPanelKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !panelEl) return;
    const focusables = Array.from(
      panelEl.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  $effect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  });

  onMount(() => {
    const controller = new AbortController();
    const { signal } = controller;

    /* Only the newest island keeps document listeners — the drawer's handover. */
    const handover = (window as unknown as { __wqSearchHandover?: () => void }).__wqSearchHandover;
    handover?.();
    (window as unknown as { __wqSearchHandover?: () => void }).__wqSearchHandover = () =>
      controller.abort();

    document.addEventListener(
      'click',
      (event) => {
        const target = event.target as Element | null;
        const trigger = target?.closest?.('[data-search-trigger]');
        if (!trigger) return;
        event.preventDefault();
        show();
      },
      { signal }
    );

    document.addEventListener(
      'input',
      (event) => {
        if (closing) return;
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.matches('[data-search-trigger]')) return;
        const seed = target.value;
        target.value = '';
        show(seed);
      },
      { signal }
    );

    document.addEventListener(
      'keydown',
      (event) => {
        if (open) {
          if (event.key === 'Escape') hide();
          return;
        }
        if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          show();
          return;
        }
        if (event.key === '/') {
          const element = event.target as HTMLElement | null;
          const typing = element
            ? element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable
            : false;
          if (!typing) {
            event.preventDefault();
            show();
          }
        }
      },
      { signal }
    );

    return () => controller.abort();
  });
</script>

<div
  data-search-overlay
  inert={!open ? true : undefined}
  data-open={open ? '' : undefined}
  class="pointer-events-none fixed inset-0 z-[60] opacity-0 transition-opacity duration-200 data-[open]:pointer-events-auto data-[open]:opacity-100"
>
  <div class="absolute inset-0 bg-scrim/50" aria-hidden="true" onclick={hide}></div>

  <div
    bind:this={panelEl}
    role="dialog"
    aria-modal="true"
    aria-label="البحث في المتجر"
    onkeydown={onPanelKeydown}
    class="relative mx-auto mt-[9vh] w-[min(92vw,38rem)] border border-hairline-ink bg-exhibit text-ink shadow-[0_28px_70px_-28px_rgba(17,17,16,0.5)]"
  >
    <div class="flex items-center gap-3 border-b border-hairline-ink px-5">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        class="size-4 shrink-0 text-ink-3"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6"></circle>
        <path d="M20 20l-4.2-4.2"></path>
      </svg>
      <input
        bind:this={inputEl}
        bind:value={query}
        oninput={() => (active = -1)}
        onkeydown={onInputKey}
        type="text"
        autocomplete="off"
        spellcheck="false"
        placeholder="ابحث باسم القطعة أو رقمها…"
        aria-label="البحث في المتجر"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={query.trim() !== '' && results.length > 0}
        aria-controls="wq-search-results"
        aria-activedescendant={active >= 0 ? `wq-sr-${active}` : undefined}
        class="wq-field-bare min-h-14 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
      />
      <kbd class="hidden font-data text-[0.65rem] text-ink-3 sm:block">Esc</kbd>
    </div>

    {#if loading}
      <p class="px-5 py-6 text-sm text-ink-2">جارٍ التحميل…</p>
    {:else if query.trim() === ''}
      <div class="space-y-4 px-5 py-5">
        {#if recents.length > 0}
          <div class="space-y-2">
            <p class="font-data text-[0.7rem] tracking-[0.12em] text-ink-3">آخر ما بحثت عنه</p>
            <div class="flex flex-wrap gap-2">
              {#each recents as recent (recent)}
                <button
                  type="button"
                  onclick={() => {
                    query = recent;
                    active = -1;
                    inputEl?.focus();
                  }}
                  class="min-h-9 border border-hairline-ink px-3 text-sm text-ink-2 transition-colors hover:bg-room-2"
                >
                  {recent}
                </button>
              {/each}
            </div>
          </div>
        {/if}
        <p class="text-sm text-ink-3">اكتب اسم القطعة أو رقمها، أو جرّب: «عود» · «جلد» · «قلم»</p>
      </div>
    {:else if results.length === 0}
      <p class="px-5 py-6 text-sm text-ink-2">لا نتائج لـ «{query.trim()}».</p>
    {:else}
      <ul id="wq-search-results" role="listbox" aria-label="النتائج" class="max-h-[50vh] overflow-y-auto py-1">
        {#each results as item, index (item.slug)}
          <li id={`wq-sr-${index}`} role="option" aria-selected={index === active ? 'true' : 'false'}>
            <a
              href={`/product/${item.slug}`}
              onclick={(event) => {
                event.preventDefault();
                pick(item);
              }}
              onmouseenter={() => (active = index)}
              class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-room-2"
            >
              {#if item.thumb}
                <img src={item.thumb} alt="" class="size-11 shrink-0 bg-exhibit-2 object-cover" />
              {/if}
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm text-ink">{item.name}</span>
                {#if item.category}
                  <span class="block text-[0.7rem] text-ink-3">{item.category}</span>
                {/if}
              </span>
              <span class="wq-price shrink-0 text-sm text-ink-2">{money(item.price)}</span>
            </a>
          </li>
        {/each}
      </ul>
      <a
        href={`/search?q=${encodeURIComponent(query.trim())}`}
        onclick={(event) => {
          event.preventDefault();
          openAllResults();
        }}
        class="block border-t border-hairline-ink px-5 py-3 text-sm text-ink-2 transition-colors hover:bg-room-2"
      >
        عرض كل النتائج
      </a>
    {/if}

    <p class="hidden border-t border-hairline-ink px-5 py-2 font-data text-[0.65rem] text-ink-3 sm:block">
      ↑↓ للتنقل · ↵ للفتح · Esc للإغلاق
    </p>
  </div>
</div>
