// JSON-LD schema builders for structured data.
import type { Calculator, Category, FaqItem } from './types';
import { getCategory } from './categories';

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
    url: `${SITE}/${calc.category}/${calc.slug}`,
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
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Try Online Calculator',
    url: SITE,
    logo: `${SITE}/web-app-manifest-512x512.png`,
    description:
      'Try Online Calculator provides fast, free and privacy-friendly online calculators for finance, health, education and everyday math.',
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
    { name: 'Home', path: '/' },
    { name: cat?.name ?? calc.category, path: cat?.path ?? `/${calc.category}` },
    { name: calc.title, path: `/${calc.category}/${calc.slug}` },
  ];
  const schemas: Record<string, unknown>[] = [breadcrumbSchema(crumbs), calculatorSchema(calc)];
  if (calc.faq.length) schemas.push(faqSchema(calc));
  return schemas;
}
