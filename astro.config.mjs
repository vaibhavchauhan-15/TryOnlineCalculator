// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Fully static site (no on-demand routes) — the currency converter fetches
// live rates directly from the Frankfurter API in the browser, so no server
// adapter is needed. Builds to ./dist for static hosting (Cloudflare Pages).
export default defineConfig({
  site: 'https://tryonlinecalculator.com',
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
