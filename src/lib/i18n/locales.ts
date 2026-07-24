// Locale registry — the single, config-driven source of truth for every
// language the site can serve. Enabling a new language is a one-line change
// here (flip `enabled: true`); routing, hreflang, sitemap and the language
// selector all read from this list, so nothing else needs touching.
//
// Design notes:
//   * `code`        — the URL segment and content-folder name (e.g. "/de/…",
//                     content/calculators/de/…). Keep it a short ISO 639-1 code.
//   * `bcp47`       — the full IETF language tag used for <html lang>, og:locale
//                     and Intl formatting when no explicit region is chosen.
//   * `defaultRegion` — the region a first-time visitor of this language gets
//                     for number/currency formatting until they pick their own.
//   * `enabled`     — gate for the threshold-based rollout. Disabled locales are
//                     defined (so translations can be prepared) but produce no
//                     routes and never appear in hreflang/sitemap/selector.

export interface LocaleDef {
  /** URL + content-folder code, e.g. "en", "de", "hi", "es". */
  code: string;
  /** Native language name for the selector, e.g. "Deutsch". */
  nativeName: string;
  /** English name for tooling/logs, e.g. "German". */
  englishName: string;
  /** Full BCP-47 tag for <html lang>, og:locale, Intl. */
  bcp47: string;
  /** Region used for formatting when the visitor has not chosen one. */
  defaultRegion: string;
  /** Text direction. Only "rtl" locales flip the layout. */
  dir: 'ltr' | 'rtl';
  /** Rollout gate — disabled locales produce no routes. */
  enabled: boolean;
}

// The default locale is special: it is the fallback for missing translations
// and the target of the bare "/" redirect. Keep it first and always enabled.
export const DEFAULT_LOCALE = 'en';

export const LOCALES: LocaleDef[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', bcp47: 'en', defaultRegion: 'US', dir: 'ltr', enabled: true },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', bcp47: 'de', defaultRegion: 'DE', dir: 'ltr', enabled: true },

  // --- Prepared but held back: translations exist in the repo (content/ +
  // ui-pack) but are not yet production-ready. Disabled so they produce no
  // routes and never appear in hreflang/sitemap/selector — nothing is served
  // or indexed until the flag is flipped back to true.
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', bcp47: 'hi', defaultRegion: 'IN', dir: 'ltr', enabled: false },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', bcp47: 'es', defaultRegion: 'ES', dir: 'ltr', enabled: false },

  // --- Next wave (Task 15 rollout gate). Defined but not yet served. --------
  { code: 'fr', nativeName: 'Français', englishName: 'French', bcp47: 'fr', defaultRegion: 'FR', dir: 'ltr', enabled: false },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese', bcp47: 'pt', defaultRegion: 'BR', dir: 'ltr', enabled: false },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', bcp47: 'ja', defaultRegion: 'JP', dir: 'ltr', enabled: false },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian', bcp47: 'it', defaultRegion: 'IT', dir: 'ltr', enabled: false },
  { code: 'nl', nativeName: 'Nederlands', englishName: 'Dutch', bcp47: 'nl', defaultRegion: 'NL', dir: 'ltr', enabled: false },
];

const BY_CODE = new Map<string, LocaleDef>(LOCALES.map((l) => [l.code, l]));

/** Every locale currently served (has routes, hreflang, sitemap entries). */
export function enabledLocales(): LocaleDef[] {
  return LOCALES.filter((l) => l.enabled);
}

/** Just the codes of enabled locales — handy for getStaticPaths cross-products. */
export function enabledLocaleCodes(): string[] {
  return enabledLocales().map((l) => l.code);
}

export function getLocale(code: string): LocaleDef | undefined {
  return BY_CODE.get(code);
}

/** True when `code` is a defined, enabled locale. */
export function isEnabledLocale(code: string | undefined | null): code is string {
  return !!code && (BY_CODE.get(code)?.enabled ?? false);
}

export function defaultLocale(): LocaleDef {
  return BY_CODE.get(DEFAULT_LOCALE)!;
}

/** Native name for the selector, falling back to the code. */
export function localeNativeName(code: string): string {
  return BY_CODE.get(code)?.nativeName ?? code;
}

/**
 * Locales that have passed the content-quality gate and should be indexed by
 * search engines (no noindex tag, included in sitemap). Add a locale here once
 * its translations are production-ready.
 */
const INDEXED_LOCALES = new Set<string>([DEFAULT_LOCALE, 'de']);

/** True when a locale's pages should carry `index, follow` (no noindex). */
export function isIndexedLocale(code: string): boolean {
  return INDEXED_LOCALES.has(code);
}
