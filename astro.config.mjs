// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://wiqar-storefront.directed-countless.workers.dev',
  integrations: [sitemap(), svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
