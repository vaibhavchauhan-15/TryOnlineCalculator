// JSON-LD schema builders for structured data.
import type { Calculator, Category, FaqItem } from './types';
import { getCategory } from './categories';
import { to } from './i18n/paths';
import { DEFAULT_LOCALE } from './i18n/locales';

const SITE = 'https://tryonlinecalculator.com';

export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.path}`,
    })),
  };
}

export function faqSchema(calc: Calculator) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: calc.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Build a FAQPage schema from a plain list of question/answer items. */
export function faqPageSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function calculatorSchema(calc: Calculator) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: calc.title,
    url: `${SITE}${to(`/${calc.category}/${calc.slug}`, DEFAULT_LOCALE)}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    description: calc.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'Try Online Calculator', url: SITE },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Try Online Calculator',
    alternateName: 'TryOnlineCalculator',
    url: SITE,
    description:
      'Free online calculators for finance, health, math, education, dates and more — including mortgage, BMI, loan, percentage and age calculators.',
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/en/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Authoritative profiles for the publishing organization. Populate with real
// profile URLs as they go live — an empty entry is omitted so we never emit a
// broken `sameAs`. This is a standard entity-trust (EEAT) signal.
const ORG_SAME_AS = [
  // 'https://twitter.com/tryonlinecalc',
  // 'https://www.linkedin.com/company/tryonlinecalculator',
].filter(Boolean);

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Try Online Calculator',
    url: SITE,
    logo: `${SITE}/web-app-manifest-512x512.png`,
    description:
      'Try Online Calculator provides fast, free and privacy-friendly online calculators for finance, health, education and everyday math.',
    ...(ORG_SAME_AS.length ? { sameAs: ORG_SAME_AS } : {}),
  };
}

export function itemListSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: `${SITE}${it.path}`,
    })),
  };
}

export function calculatorPageSchemas(calc: Calculator) {
  const cat: Category | undefined = getCategory(calc.category);
  const crumbs = [
    { name: 'Home', path: to('/', DEFAULT_LOCALE) },
    { name: cat?.name ?? calc.category, path: to(cat?.path ?? `/${calc.category}`, DEFAULT_LOCALE) },
    { name: calc.title, path: to(`/${calc.category}/${calc.slug}`, DEFAULT_LOCALE) },
  ];
  const schemas: Record<string, unknown>[] = [breadcrumbSchema(crumbs), calculatorSchema(calc)];
  if (calc.faq.length) schemas.push(faqSchema(calc));
  return schemas;
}
