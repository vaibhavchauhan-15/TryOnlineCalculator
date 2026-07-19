// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { LOCALES, DEFAULT_LOCALE } from './src/lib/i18n/locales.ts';

// Enabled locale codes drive routing, hreflang and the sitemap. Enabling a new
// language is a one-line flip in src/lib/i18n/locales.ts — this config, the
// [locale] routes and the SEO layer all read from that single registry.
const locales = LOCALES.filter((l) => l.enabled).map((l) => l.code);

// The non-prefixed legacy URLs are now 301 redirects and must be excluded from
// the sitemap. All canonical content lives under locale prefixes (/en/, /de/, …).
// Locales that have passed the content-quality gate are included in the sitemap;
// others remain excluded until their translations are production-ready.
const INDEXED_LOCALE_CODES = new Set([DEFAULT_LOCALE, 'de']);
const NON_INDEXED_LOCALES = locales.filter(l => !INDEXED_LOCALE_CODES.has(l));
const NON_INDEXED_LOCALE_PREFIX = NON_INDEXED_LOCALES.length
  ? new RegExp(`^https?://[^/]+/(?:${NON_INDEXED_LOCALES.join('|')})(?:/|$)`)
  : null;

// Legacy non-prefixed paths (redirects) — match anything that does NOT start with a locale prefix.
const LOCALE_PREFIXED = new RegExp(`^https?://[^/]+/(?:${locales.join('|')})(?:/|$)`);

// https://astro.build/config
// Language-first internationalized static site. Calculators compute purely in
// the browser (the currency converter fetches live rates from the Frankfurter
// API), so no server adapter is needed. Builds to ./dist for static hosting
// (Cloudflare Pages).
export default defineConfig({
  site: 'https://tryonlinecalculator.com',

  // prefixDefaultLocale: every language lives under its own segment, including
  // English (/en/…). The bare "/" is redirected to /en/ via public/_redirects.
  // redirectToDefaultLocale is disabled because we ship a static site and
  // handle the root redirect at the edge, avoiding a render-time round trip.
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales,
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },

  integrations: [
    mdx(),
    sitemap({
      // Include locale-prefixed pages that have passed the indexing gate.
      // Exclude: non-prefixed redirects and non-indexed locale pages.
      filter: (page) => LOCALE_PREFIXED.test(page) && (NON_INDEXED_LOCALE_PREFIX ? !NON_INDEXED_LOCALE_PREFIX.test(page) : true),
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: Object.fromEntries(
          LOCALES.filter((l) => l.enabled).map((l) => [l.code, l.bcp47]),
        ),
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
