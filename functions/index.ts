// Cloudflare Pages Function: dynamic locale redirect for the root path "/".
//
// Priority:
//   1. `locale-pref` cookie — returning visitor who previously chose a language
//   2. `Accept-Language` header — first-time visitor, match browser language
//   3. Fallback to /en/
//
// This replaces the static `/ /en/ 301` rule in public/_redirects so the root
// intelligently routes visitors to their preferred language on first load.

// Keep in sync with src/lib/i18n/locales.ts — only the codes that are currently
// served (enabled: true). A mismatch just means we fall through to the default.
const ENABLED_LOCALES = new Set(['en', 'de']);
const DEFAULT_LOCALE = 'en';

/**
 * Parse the Accept-Language header and return the first enabled locale code, or
 * null if none match. Handles tags like "de", "de-DE", "en-US;q=0.9", etc.
 */
function matchAcceptLanguage(header: string | null): string | null {
  if (!header) return null;

  // Parse into [{ lang, q }] sorted by quality descending.
  const entries = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      return { lang: tag.trim().toLowerCase(), q: isNaN(q) ? 0 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of entries) {
    // Try exact match first (e.g. "de"), then base language (e.g. "de" from "de-AT").
    if (ENABLED_LOCALES.has(lang)) return lang;
    const base = lang.split('-')[0];
    if (ENABLED_LOCALES.has(base)) return base;
  }

  return null;
}

/** Extract a named cookie value from the Cookie header string. */
function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

interface Env {}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  // Only handle the bare root path. Let everything else pass through.
  if (url.pathname !== '/') {
    return context.next();
  }

  const cookieHeader = request.headers.get('cookie');

  // 1. Check saved preference cookie
  const savedLocale = getCookie(cookieHeader, 'locale-pref');
  if (savedLocale && ENABLED_LOCALES.has(savedLocale)) {
    return Response.redirect(new URL(`/${savedLocale}/`, url), 302);
  }

  // 2. Match browser's Accept-Language header
  const acceptLang = request.headers.get('accept-language');
  const matched = matchAcceptLanguage(acceptLang);
  if (matched) {
    return Response.redirect(new URL(`/${matched}/`, url), 302);
  }

  // 3. Fallback to default locale
  return Response.redirect(new URL(`/${DEFAULT_LOCALE}/`, url), 302);
};
