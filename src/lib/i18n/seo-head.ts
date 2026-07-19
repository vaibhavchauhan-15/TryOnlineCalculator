// SEO head helpers for the internationalized site: hreflang alternates,
// x-default and locale-correct canonicals. All derived from the locale registry
// so enabling a language automatically adds its alternates everywhere.
//
// Rules implemented (Google's hreflang guidance):
//   * Every enabled locale variant of a page lists ALL variants (reciprocal).
//   * Each page's canonical is SELF-referential to its own locale URL (never a
//     cross-locale canonical — that would de-index the alternates).
//   * An x-default points at the default-locale URL as the language fallback.

import { SITE } from '../seo-site';
import { enabledLocales, defaultLocale, getLocale } from './locales';
import { to } from './paths';

export interface HreflangAlternate {
  hreflang: string;
  href: string;
}

/**
 * Build the hreflang alternate set for a locale-agnostic path (e.g.
 * "/finance/mortgage-calculator"). Returns one entry per enabled locale plus an
 * x-default. Absolute URLs, as hreflang requires.
 */
export function hreflangAlternates(pathWithoutLocale: string): HreflangAlternate[] {
  const alts = enabledLocales().map((l) => ({
    hreflang: l.bcp47,
    href: `${SITE}${to(pathWithoutLocale, l.code)}`,
  }));
  alts.push({ hreflang: 'x-default', href: `${SITE}${to(pathWithoutLocale, defaultLocale().code)}` });
  return alts;
}

/** Self-referential canonical for a page in a specific locale. */
export function canonicalFor(locale: string, pathWithoutLocale: string): string {
  return `${SITE}${to(pathWithoutLocale, locale)}`;
}

/**
 * Locales in which the standalone static/legal pages (about, contact, privacy,
 * terms) are actually published. These pages are hand-authored per language and
 * only exist for English and German today, so their hreflang set must be scoped
 * to those locales (advertising hi/es alternates that 404 would be an error).
 */
export const STATIC_PAGE_LOCALES = ['en', 'de'] as const;

/**
 * hreflang alternates for a standalone static page (e.g. "about"), scoped to the
 * locales where that page exists, plus an x-default pointing at English.
 */
export function staticPageHreflang(enSlug: string): HreflangAlternate[] {
  const clean = enSlug.replace(/^\/+/, '');
  const alts = STATIC_PAGE_LOCALES.map((code) => ({
    hreflang: getLocale(code)?.bcp47 ?? code,
    href: `${SITE}${to(`/${clean}`, code)}`,
  }));
  alts.push({ hreflang: 'x-default', href: `${SITE}${to(`/${clean}`, defaultLocale().code)}` });
  return alts;
}

/** og:locale value (underscored BCP-47-ish, e.g. "en_US"). */
export function ogLocale(bcp47: string, region?: string): string {
  const lang = bcp47.split('-')[0];
  return region ? `${lang}_${region}` : lang;
}
