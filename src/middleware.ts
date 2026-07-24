// Astro middleware — defense-in-depth 301 redirect for non-localized URLs.
//
// The PRIMARY redirect mechanism is the `redirects` config in astro.config.mjs
// (works in dev as HTTP 301, generates meta-refresh HTML in static builds).
//
// In production on Cloudflare Pages, public/_redirects + functions/_middleware.ts
// handle redirects at the edge before static assets are served.
//
// This middleware acts as an additional safety net: if a non-locale-prefixed
// request somehow reaches the Astro rendering pipeline (e.g. during SSR preview
// or if the redirects config doesn't catch an edge case), it will still get a
// proper 301 redirect.

import { defineMiddleware } from 'astro:middleware';
import { LOCALES } from './lib/i18n/locales';

// All defined locale codes (enabled AND disabled) — a request starting with any
// of these is already locale-prefixed and must not be redirected again.
const ALL_LOCALE_CODES = LOCALES.map((l) => l.code);

// Paths that should never be redirected (static assets, build artifacts, API
// routes, service worker files, etc.).
const SKIP_PREFIXES = [
  '/_astro',
  '/_image',
  '/api',
  '/favicon',
  '/fonts',
  '/images',
  '/robots',
  '/sitemap',
  '/manifest',
  '/site.webmanifest',
  '/web-app-manifest',
  '/apple-touch-icon',
  '/search',
];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // 1. Skip static/internal paths.
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return next();
  }

  // 2. Already locale-prefixed — pass through.
  if (
    ALL_LOCALE_CODES.some(
      (code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`),
    )
  ) {
    return next();
  }

  // 3. The bare root "/" is handled by src/pages/index.astro (client-side
  //    locale detection) or functions/index.ts in production.
  if (pathname === '/') {
    return next();
  }

  // 4. Everything else is a legacy non-prefixed path → 301 to /en equivalent.
  const target = new URL(`/en${pathname}`, context.url);
  target.search = context.url.search; // preserve query params

  return context.redirect(target.pathname + target.search, 301);
});
