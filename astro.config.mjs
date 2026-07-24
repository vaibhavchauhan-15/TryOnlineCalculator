// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { EnumChangefreq } from 'sitemap';
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
      // lastmod is the only sitemap field Google actually reads and acts on.
      // Stamp every URL with the build date so Google knows content was reviewed.
      lastmod: new Date(),
      // Serialize: add changefreq hints (Bing still uses them) and priority
      // based on page depth — homepage and category pages rank higher.
      /** @param {import('@astrojs/sitemap').SitemapItem} item @returns {import('@astrojs/sitemap').SitemapItem} */
      serialize(item) {
        const url = item.url;
        // Homepage: highest priority, changes weekly
        if (url.match(/\/(?:en|de)\/$/)) {
          return { ...item, changefreq: EnumChangefreq.WEEKLY, priority: 1.0 };
        }
        // Category pages: high priority
        if (url.match(/\/(?:en|de)\/(?:finance|health|education|math|salary|shopping|date-time|travel|unit-converter)\/?$/)) {
          return { ...item, changefreq: EnumChangefreq.WEEKLY, priority: 0.9 };
        }
        // Converter type pages
        if (url.includes('/unit-converter/') || url.includes('/einheitenumrechner/')) {
          return { ...item, changefreq: EnumChangefreq.MONTHLY, priority: 0.8 };
        }
        // Individual calculator pages: bulk of content
        if (url.match(/\/(?:en|de)\/[^/]+\/[^/]+\/?$/)) {
          return { ...item, changefreq: EnumChangefreq.MONTHLY, priority: 0.8 };
        }
        // Static pages (about, contact, privacy, terms)
        return { ...item, changefreq: EnumChangefreq.YEARLY, priority: 0.3 };
      },
    }),
  ],

  vite: {
    plugins: [
      tailwindcss(),
      // Dev-only: 301 redirect non-locale-prefixed legacy URLs to /en/ equivalent.
      // In production this is handled at the edge by public/_redirects and
      // functions/_middleware.ts. The Vite plugin intercepts requests BEFORE
      // Astro's router, so it catches paths like /finance that would otherwise
      // 404 because no matching page definition exists.
      {
        name: 'legacy-url-redirect',
        configureServer(server) {
          // Run BEFORE Vite's internal middleware and Astro's router by
          // registering directly (not in the returned function). This ensures
          // req.url still has the original query string intact.
          server.middlewares.use((req, res, next) => {
            const url = req.originalUrl ?? req.url ?? '/';
            // Parse pathname (strip query string for matching).
            const qIdx = url.indexOf('?');
            const pathname = qIdx >= 0 ? url.slice(0, qIdx) : url;

            // Skip: already locale-prefixed.
            if (locales.some((code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`))) {
              return next();
            }
            // Skip: root "/" (handled by src/pages/index.astro).
            if (pathname === '/') {
              return next();
            }
            // Skip: static assets / internal Astro paths.
            if (/^\/((_astro|_image|fonts|images|favicon|api|robots|sitemap|manifest|site\.webmanifest|web-app-manifest|apple-touch-icon|search|node_modules|@)(\/|$|\?))/.test(url)) {
              return next();
            }
            // Skip: files with extensions (e.g. .css, .js, .png) — these are
            // static assets served by Vite directly.
            if (/\.\w{2,10}(\?|$)/.test(pathname)) {
              return next();
            }

            // Legacy non-prefixed path → 301 to /en equivalent.
            // Preserve query parameters and hash.
            const suffix = qIdx >= 0 ? url.slice(qIdx) : '';
            const target = `/en${pathname}${suffix}`;
            res.writeHead(301, { Location: target });
            res.end();
          });
        },
      },
    ],
  },
});
