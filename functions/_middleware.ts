/// <reference path="../worker-configuration.d.ts" />
// Cloudflare Pages Function middleware.
//
// Runs at the edge for EVERY request. Two responsibilities:
//
// 1. Geo-country cookie — injects a `geo-country` cookie from CF-IPCountry so
//    the client can detect the visitor's country without an API call.
//
// 2. Language preference enforcement — when the visitor has an explicit
//    `locale-pref` cookie (set by the language switcher), any navigation to a
//    DIFFERENT locale prefix is 302-redirected to the equivalent path under
//    their chosen locale. This "locks" the user into their preferred language
//    so they don't accidentally land on /de/ pages when they chose English, and
//    vice versa.
//
//    The redirect is a 302 (temporary) so search engines don't cache
//    user-specific routing decisions. It only fires on locale-prefixed HTML
//    page paths — never on static assets, API routes, or the bare root "/".

interface Env {}

// Keep in sync with src/lib/i18n/locales.ts (enabled locales only).
const ENABLED_LOCALES = new Set(['en', 'de']);

// Paths that should never be subject to locale enforcement (static assets,
// service worker, build artifacts, etc.).
const SKIP_PATTERN = /^\/(?:fonts|_astro|_image|favicon|robots\.txt|sitemap|site\.webmanifest|web-app-manifest|apple-touch-icon|search\/)/;

/** Extract a named cookie value from the Cookie header string. */
function getCookie(cookieHeader: string, name: string): string | null {
  const prefix = name + '=';
  for (const part of cookieHeader.split('; ')) {
    const trimmed = part.trimStart();
    if (trimmed.startsWith(prefix)) {
      try {
        return decodeURIComponent(trimmed.slice(prefix.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Parse the locale prefix from a path.
 * "/de/finanzen/hypothekenrechner" → { locale: "de", rest: "/finanzen/hypothekenrechner" }
 * "/about" → { locale: null, rest: "/about" }
 */
function splitLocaleFromPath(pathname: string): { locale: string | null; rest: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*|)$/);
  if (match && ENABLED_LOCALES.has(match[1])) {
    return { locale: match[1], rest: match[2] || '/' };
  }
  return { locale: null, rest: pathname };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const { pathname } = url;

  // Skip static assets and non-page paths entirely.
  if (SKIP_PATTERN.test(pathname)) {
    return context.next();
  }

  // Skip the bare root — handled by functions/index.ts.
  if (pathname === '/') {
    return context.next();
  }

  const cookieHeader = request.headers.get('cookie') || '';

  // --- Language preference enforcement ---
  // Only enforce on locale-prefixed paths (the actual content pages).
  const { locale: pathLocale, rest } = splitLocaleFromPath(pathname);

  if (pathLocale) {
    const localePref = getCookie(cookieHeader, 'locale-pref');

    // If the user has an explicit preference AND it differs from the path's
    // locale, redirect them to the same page under their preferred locale.
    if (localePref && ENABLED_LOCALES.has(localePref) && localePref !== pathLocale) {
      const redirectPath = `/${localePref}${rest}`;
      const redirectUrl = new URL(redirectPath, url.origin);
      // Preserve query string (e.g. UTM params).
      redirectUrl.search = url.search;
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }
  }

  // --- Non-prefixed / disabled-locale catch-all: 301 → /en equivalent ---
  // If the path does NOT start with an ENABLED locale prefix it needs
  // redirecting. This is the production equivalent of src/middleware.ts and the
  // single owner of the "prepend /en" logic — public/_redirects deliberately
  // has NO blanket `/*  /en/:splat` rule, because that would re-prefix
  // already-/en/ paths on every hop and produce an infinite /en/en/en/… loop.
  if (!pathLocale) {
    // Distinguish a held-back / unknown locale prefix (e.g. /hi/…, /es/…, or any
    // two-letter segment that isn't an enabled locale) from a genuine legacy
    // non-prefixed path (e.g. /finance, /about).
    //
    //   * Locale-shaped prefix → drop it and send the visitor to the English
    //     home (/en/). Prepending /en would yield /en/hi/… which 404s.
    //   * Everything else       → prepend /en to the full path.
    const firstSegment = pathname.split('/')[1] ?? '';
    const isLocaleShaped = /^[a-z]{2}$/.test(firstSegment); // 2-letter, not enabled (else pathLocale would be set)

    const target = isLocaleShaped
      ? new URL('/en/', url.origin)
      : new URL(`/en${pathname}`, url.origin);
    // Preserve the query string only when we keep the path (legacy redirects).
    if (!isLocaleShaped) target.search = url.search;

    return new Response(null, {
      status: 301,
      headers: { Location: target.toString() },
    });
  }

  // --- Continue to the origin (static asset serving) ---
  const response = await context.next();

  // --- Geo-country cookie injection ---
  // Only set the cookie if it isn't already present (first visit or expired).
  if (!cookieHeader.includes('geo-country=')) {
    const country = request.headers.get('cf-ipcountry');
    if (country && country !== 'XX' && country !== 'T1') {
      const newResponse = new Response(response.body, response);
      newResponse.headers.append(
        'Set-Cookie',
        `geo-country=${country}; Path=/; SameSite=Lax; Secure; Max-Age=31536000`,
      );
      return newResponse;
    }
  }

  return response;
};
