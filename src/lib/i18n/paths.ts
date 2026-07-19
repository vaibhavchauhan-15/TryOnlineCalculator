// Locale-aware path helpers. Every internal link on the site should be built
// through these so switching locales, adding the locale prefix, and mapping a
// page across languages all stay correct in one place.
//
// URL model (all locales prefixed, slugs translated per locale):
//   /en/                                  home (English)
//   /en/finance/mortgage-calculator       English calculator page
//   /de/finanzen/hypothekenrechner        German calculator page
//   /es/finanzas/calculadora-hipoteca     Spanish calculator page
//
// The `to()` function builds a localized URL from an English-slug path and a
// target locale. The `switchLocale()` function maps a full localized URL from
// one locale to another by first resolving back to English slugs, then
// re-localizing for the target.

import { DEFAULT_LOCALE, isEnabledLocale } from './locales';
import {
  localizedCategorySlug,
  localizedCalculatorSlug,
  localizedStaticPageSlug,
  englishCategorySlug,
  englishCalculatorSlug,
  englishStaticPageSlug,
  isStaticPageSlug,
  localizedConverterParentSlug,
  localizedConverterTypeSlug,
  englishConverterTypeSlug,
  isConverterParentSlug,
} from './slugs';

/**
 * Build a fully localized path from an English-slug site-relative path and a
 * target locale. This is the primary link-building helper.
 *
 * Examples:
 *   to('/', 'de')                              → '/de'
 *   to('/finance', 'de')                       → '/de/finanzen'
 *   to('/finance/mortgage-calculator', 'de')   → '/de/finanzen/hypothekenrechner'
 *   to('/unit-converter', 'de')                → '/de/einheitenumrechner'
 *   to('/unit-converter/length', 'de')         → '/de/einheitenumrechner/laenge'
 */
export function to(path: string, locale: string): string {
  if (path === '/' || path === '') return `/${locale}`;
  const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const segments = clean.split('/');

  // Handle unit-converter paths first
  if (segments[0] === 'unit-converter') {
    const parent = localizedConverterParentSlug(locale);
    if (segments.length === 1) {
      return `/${locale}/${parent}`;
    }
    if (segments.length === 2) {
      const typeSlug = localizedConverterTypeSlug(segments[1], locale);
      return `/${locale}/${parent}/${typeSlug}`;
    }
  }

  // Handle static pages (about, contact, privacy, terms)
  if (segments.length === 1 && isStaticPageSlug(segments[0])) {
    const localSlug = localizedStaticPageSlug(segments[0], locale);
    return `/${locale}/${localSlug}`;
  }

  if (segments.length >= 1) {
    // Check if first segment looks like a category
    const localCat = localizedCategorySlug(segments[0], locale);
    if (segments.length === 1) {
      // Category path: /finance → /de/finanzen
      return `/${locale}/${localCat}`;
    }
    if (segments.length === 2) {
      // Calculator path: /finance/mortgage-calculator → /de/finanzen/hypothekenrechner
      const localSlug = localizedCalculatorSlug(segments[1], locale);
      return `/${locale}/${localCat}/${localSlug}`;
    }
  }

  // Fallback for other paths
  return `/${locale}/${clean}`;
}

/** Build a locale home path, e.g. "/de" or "/en". */
export function homePath(locale: string): string {
  return `/${locale}`;
}

/**
 * Split a full site path into its locale segment and the remainder.
 * `/de/finanzen/hypothekenrechner` → { locale: "de", rest: "/finanzen/hypothekenrechner" }.
 * When no known locale prefix is present, `locale` is undefined and `rest` is
 * the original path (lets us handle legacy/unprefixed URLs gracefully).
 */
export function splitLocale(path: string): { locale: string | undefined; rest: string } {
  const m = path.match(/^\/([a-z]{2})(\/.*|)$/i);
  if (m && isEnabledLocale(m[1])) {
    return { locale: m[1], rest: m[2] || '/' };
  }
  return { locale: undefined, rest: path || '/' };
}

/**
 * Resolve a localized path back to the English-slug canonical path.
 * `/de/finanzen/hypothekenrechner` → { locale: "de", enPath: "/finance/mortgage-calculator" }
 *
 * This is needed by switchLocale to map between locale URLs.
 */
export function resolveToEnglish(fullPath: string): { locale: string; enPath: string } {
  const { locale, rest } = splitLocale(fullPath);
  const loc = locale ?? DEFAULT_LOCALE;

  if (rest === '/' || rest === '') return { locale: loc, enPath: '/' };

  const segments = rest.replace(/^\/+/, '').replace(/\/+$/, '').split('/');

  // Check if this is a converter path (localized parent slug)
  if (segments.length >= 1 && isConverterParentSlug(segments[0])) {
    if (segments.length === 1) {
      return { locale: loc, enPath: '/unit-converter' };
    }
    if (segments.length === 2) {
      const enType = englishConverterTypeSlug(segments[1], loc);
      return { locale: loc, enPath: `/unit-converter/${enType}` };
    }
  }

  // Check if this is a static page (localized or English slug)
  if (segments.length === 1 && isStaticPageSlug(segments[0])) {
    const enSlug = englishStaticPageSlug(segments[0], loc);
    return { locale: loc, enPath: `/${enSlug}` };
  }

  if (segments.length >= 1) {
    const enCat = englishCategorySlug(segments[0], loc);
    if (segments.length === 1) {
      return { locale: loc, enPath: `/${enCat}` };
    }
    if (segments.length === 2) {
      const enSlug = englishCalculatorSlug(segments[1], loc);
      return { locale: loc, enPath: `/${enCat}/${enSlug}` };
    }
  }

  // Fallback: return as-is
  return { locale: loc, enPath: rest };
}

/**
 * Map the current path to the same page in another locale — the core operation
 * behind the language selector. Resolves the current URL back to English slugs,
 * then rebuilds with the target locale's translated slugs.
 *
 * `/de/finanzen/hypothekenrechner` + target 'es' → `/es/finanzas/calculadora-hipoteca`
 */
export function switchLocale(currentPath: string, target: string): string {
  const { enPath } = resolveToEnglish(currentPath);
  return to(enPath, target);
}

/** Strip any locale prefix, returning the locale-agnostic rest path. */
export function stripLocale(path: string): string {
  return splitLocale(path).rest;
}

/** The locale for a path, defaulting to the site default when unprefixed. */
export function localeOf(path: string): string {
  return splitLocale(path).locale ?? DEFAULT_LOCALE;
}
