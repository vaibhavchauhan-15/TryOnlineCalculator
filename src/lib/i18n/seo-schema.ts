// Localized structured-data (JSON-LD) builders for the internationalized site
// (Task 7).
//
// Every schema is locale-aware:
//   * `name` / breadcrumb labels / FAQ text come from the LOCALIZED MDX + UI
//     pack (so a German page emits "BMI Rechner", a Spanish one "IMC"),
//   * `url` is the locale-prefixed absolute URL, and
//   * `inLanguage` carries the page's BCP-47 tag,
// so Google indexes the right language variant and Rich Results validate per
// locale. English builders in src/lib/seo.ts stay for the legacy root pages.

import { SITE } from '../seo-site';
import { to } from './paths';
import { getLocale, DEFAULT_LOCALE } from './locales';
import { categoryName } from './ui-pack';

export interface LocalizedFaqItem {
  q: string;
  a: string;
}

function bcp47(locale: string): string {
  return getLocale(locale)?.bcp47 ?? DEFAULT_LOCALE;
}

/** Absolute, locale-prefixed URL for a locale-agnostic path. */
function absUrl(locale: string, pathWithoutLocale: string): string {
  return `${SITE}${to(pathWithoutLocale, locale)}`;
}

/** Localized breadcrumb: Home / Category / Title, all locale-prefixed. */
export function localizedBreadcrumbSchema(
  locale: string,
  opts: { homeLabel: string; categoryId: string; categoryPath: string; title: string; pagePath: string },
) {
  const crumbs = [
    { name: opts.homeLabel, path: '/' },
    { name: categoryName(locale, opts.categoryId), path: opts.categoryPath },
    { name: opts.title, path: opts.pagePath },
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absUrl(locale, c.path),
    })),
  };
}

/** Localized WebApplication schema for a calculator page. */
export function localizedCalculatorSchema(
  locale: string,
  opts: { title: string; description: string; pagePath: string },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: opts.title,
    url: absUrl(locale, opts.pagePath),
    inLanguage: bcp47(locale),
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    description: opts.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: 'Try Online Calculator', url: SITE },
  };
}

/** Localized FAQPage schema from the page's localized FAQ items. */
export function localizedFaqSchema(locale: string, items: LocalizedFaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: bcp47(locale),
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Localized HowTo schema from the page's howto steps. */
export function localizedHowToSchema(
  locale: string,
  opts: { title: string; description: string; pagePath: string; steps: string[] },
) {
  const stepPrefix = locale === 'de' ? 'Schritt' : 'Step';
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.title,
    description: opts.description,
    inLanguage: bcp47(locale),
    url: absUrl(locale, opts.pagePath),
    step: opts.steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: `${stepPrefix} ${i + 1}`,
      text,
    })),
  };
}

/**
 * The full JSON-LD set for a localized calculator page. Emits breadcrumb +
 * WebApplication always, and FAQPage when the page has FAQ content.
 * Emits HowTo when howto steps are provided.
 */
export function localizedCalculatorPageSchemas(
  locale: string,
  opts: {
    homeLabel: string;
    categoryId: string;
    categoryPath: string;
    title: string;
    description: string;
    pagePath: string;
    faq: LocalizedFaqItem[];
    howto?: string[];
  },
): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [
    localizedBreadcrumbSchema(locale, opts),
    localizedCalculatorSchema(locale, opts),
  ];
  if (opts.faq.length) schemas.push(localizedFaqSchema(locale, opts.faq));
  if (opts.howto?.length) {
    schemas.push(localizedHowToSchema(locale, {
      title: opts.title,
      description: opts.description,
      pagePath: opts.pagePath,
      steps: opts.howto,
    }));
  }
  return schemas;
}
