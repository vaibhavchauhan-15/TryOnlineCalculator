// Locale-specific URL slug translations.
//
// This registry maps English slugs (used as the canonical identifiers in
// content, code, and the `en` routes) to their localized equivalents for each
// non-default locale. A locale that doesn't appear here, or a slug without an
// entry, falls back to the English slug.
//
// Category paths and calculator slugs are both covered. The lookup helpers at
// the bottom are the public API consumed by the routing layer and path helpers.

import { DEFAULT_LOCALE } from './locales';

// ---------------------------------------------------------------------------
// Category slug translations (the URL path segment, not the display name).
// English categories: finance, health, education, math, salary, shopping, date-time, travel
// ---------------------------------------------------------------------------

const CATEGORY_SLUGS: Record<string, Record<string, string>> = {
  de: {
    finance: 'finanzen',
    health: 'gesundheit',
    education: 'bildung',
    math: 'mathematik',
    salary: 'gehalt',
    shopping: 'einkaufen',
    'date-time': 'datum-zeit',
    travel: 'reise',
  },
  es: {
    finance: 'finanzas',
    health: 'salud',
    education: 'educacion',
    math: 'matematicas',
    salary: 'salario',
    shopping: 'compras',
    'date-time': 'fecha-hora',
    travel: 'viajes',
  },
  hi: {
    finance: 'finance',
    health: 'health',
    education: 'education',
    math: 'math',
    salary: 'salary',
    shopping: 'shopping',
    'date-time': 'date-time',
    travel: 'travel',
  },
};

// ---------------------------------------------------------------------------
// Calculator slug translations.
// Keys are the English slugs (content IDs). Values are the localized URL slugs.
// ---------------------------------------------------------------------------

const CALCULATOR_SLUGS: Record<string, Record<string, string>> = {
  de: {
    'mortgage-calculator': 'hypothekenrechner',
    'loan-calculator': 'kreditrechner',
    'auto-loan-calculator': 'autokredit-rechner',
    'car-payment-calculator': 'kfz-ratenrechner',
    'investment-calculator': 'anlagerechner',
    'sip-calculator': 'sip-rechner',
    'compound-interest-calculator': 'zinseszinsrechner',
    'savings-calculator': 'sparrechner',
    'apr-calculator': 'effektivzins-rechner',
    'interest-calculator': 'zinsrechner',
    'retirement-calculator': 'rentenrechner',
    'bmi-calculator': 'bmi-rechner',
    'bmr-calculator': 'bmr-rechner',
    'calorie-calculator': 'kalorienrechner',
    'tdee-calculator': 'tdee-rechner',
    'macro-calculator': 'makro-rechner',
    'ideal-weight-calculator': 'idealgewicht-rechner',
    'water-intake-calculator': 'wasseraufnahme-rechner',
    'gpa-calculator': 'gpa-rechner',
    'grade-calculator': 'notenrechner',
    'final-grade-calculator': 'abschlussnoten-rechner',
    'average-grade-calculator': 'notendurchschnitt-rechner',
    'percentage-calculator': 'prozentrechner',
    'fraction-calculator': 'bruchrechner',
    'average-calculator': 'durchschnittsrechner',
    'scientific-calculator': 'wissenschaftlicher-taschenrechner',
    'basic-calculator': 'einfacher-rechner',
    'salary-calculator': 'gehaltsrechner',
    'paycheck-calculator': 'lohnrechner',
    'hourly-wage-calculator': 'stundenlohn-rechner',
    'discount-calculator': 'rabattrechner',
    'tip-calculator': 'trinkgeldrechner',
    'sales-tax-calculator': 'mehrwertsteuer-rechner',
    'age-calculator': 'altersrechner',
    'date-difference-calculator': 'datumsrechner',
    'business-days-calculator': 'werktagerechner',
    'working-days-calculator': 'arbeitstage-rechner',
    'fuel-cost-calculator': 'spritkosten-rechner',
    'mileage-calculator': 'kilometerrechner',
    'currency-converter': 'waehrungsrechner',
  },
  es: {
    'mortgage-calculator': 'calculadora-hipoteca',
    'loan-calculator': 'calculadora-prestamos',
    'auto-loan-calculator': 'calculadora-prestamo-auto',
    'car-payment-calculator': 'calculadora-pago-auto',
    'investment-calculator': 'calculadora-inversiones',
    'sip-calculator': 'calculadora-sip',
    'compound-interest-calculator': 'calculadora-interes-compuesto',
    'savings-calculator': 'calculadora-ahorros',
    'apr-calculator': 'calculadora-tae',
    'interest-calculator': 'calculadora-intereses',
    'retirement-calculator': 'calculadora-jubilacion',
    'bmi-calculator': 'calculadora-imc',
    'bmr-calculator': 'calculadora-tmb',
    'calorie-calculator': 'calculadora-calorias',
    'tdee-calculator': 'calculadora-tdee',
    'macro-calculator': 'calculadora-macros',
    'ideal-weight-calculator': 'calculadora-peso-ideal',
    'water-intake-calculator': 'calculadora-agua',
    'gpa-calculator': 'calculadora-gpa',
    'grade-calculator': 'calculadora-notas',
    'final-grade-calculator': 'calculadora-nota-final',
    'average-grade-calculator': 'calculadora-promedio',
    'percentage-calculator': 'calculadora-porcentaje',
    'fraction-calculator': 'calculadora-fracciones',
    'average-calculator': 'calculadora-promedio-numeros',
    'scientific-calculator': 'calculadora-cientifica',
    'basic-calculator': 'calculadora-basica',
    'salary-calculator': 'calculadora-salario',
    'paycheck-calculator': 'calculadora-nomina',
    'hourly-wage-calculator': 'calculadora-salario-hora',
    'discount-calculator': 'calculadora-descuentos',
    'tip-calculator': 'calculadora-propina',
    'sales-tax-calculator': 'calculadora-impuestos',
    'age-calculator': 'calculadora-edad',
    'date-difference-calculator': 'calculadora-fechas',
    'business-days-calculator': 'calculadora-dias-habiles',
    'working-days-calculator': 'calculadora-dias-laborales',
    'fuel-cost-calculator': 'calculadora-combustible',
    'mileage-calculator': 'calculadora-kilometraje',
    'currency-converter': 'conversor-divisas',
  },
  hi: {
    'mortgage-calculator': 'mortgage-calculator',
    'loan-calculator': 'loan-calculator',
    'auto-loan-calculator': 'auto-loan-calculator',
    'car-payment-calculator': 'car-payment-calculator',
    'investment-calculator': 'investment-calculator',
    'sip-calculator': 'sip-calculator',
    'compound-interest-calculator': 'compound-interest-calculator',
    'savings-calculator': 'savings-calculator',
    'apr-calculator': 'apr-calculator',
    'interest-calculator': 'interest-calculator',
    'retirement-calculator': 'retirement-calculator',
    'bmi-calculator': 'bmi-calculator',
    'bmr-calculator': 'bmr-calculator',
    'calorie-calculator': 'calorie-calculator',
    'tdee-calculator': 'tdee-calculator',
    'macro-calculator': 'macro-calculator',
    'ideal-weight-calculator': 'ideal-weight-calculator',
    'water-intake-calculator': 'water-intake-calculator',
    'gpa-calculator': 'gpa-calculator',
    'grade-calculator': 'grade-calculator',
    'final-grade-calculator': 'final-grade-calculator',
    'average-grade-calculator': 'average-grade-calculator',
    'percentage-calculator': 'percentage-calculator',
    'fraction-calculator': 'fraction-calculator',
    'average-calculator': 'average-calculator',
    'scientific-calculator': 'scientific-calculator',
    'basic-calculator': 'basic-calculator',
    'salary-calculator': 'salary-calculator',
    'paycheck-calculator': 'paycheck-calculator',
    'hourly-wage-calculator': 'hourly-wage-calculator',
    'discount-calculator': 'discount-calculator',
    'tip-calculator': 'tip-calculator',
    'sales-tax-calculator': 'sales-tax-calculator',
    'age-calculator': 'age-calculator',
    'date-difference-calculator': 'date-difference-calculator',
    'business-days-calculator': 'business-days-calculator',
    'working-days-calculator': 'working-days-calculator',
    'fuel-cost-calculator': 'fuel-cost-calculator',
    'mileage-calculator': 'mileage-calculator',
    'currency-converter': 'currency-converter',
  },
};

// ---------------------------------------------------------------------------
// Static page slug translations (about, contact, privacy, terms).
// ---------------------------------------------------------------------------

const STATIC_PAGE_SLUGS: Record<string, Record<string, string>> = {
  de: {
    about: 'ueber-uns',
    contact: 'kontakt',
    privacy: 'datenschutz',
    terms: 'nutzungsbedingungen',
  },
  es: {
    about: 'about',
    contact: 'contact',
    privacy: 'privacy',
    terms: 'terms',
  },
  hi: {
    about: 'about',
    contact: 'contact',
    privacy: 'privacy',
    terms: 'terms',
  },
};

// ---------------------------------------------------------------------------
// Unit-converter slug translations.
// The parent segment "unit-converter" and each converter type slug.
// ---------------------------------------------------------------------------

const CONVERTER_PARENT_SLUGS: Record<string, string> = {
  de: 'einheitenumrechner',
  es: 'conversor-unidades',
  hi: 'unit-converter',
};

const CONVERTER_TYPE_SLUGS: Record<string, Record<string, string>> = {
  de: {
    length: 'laenge',
    weight: 'gewicht',
    temperature: 'temperatur',
    speed: 'geschwindigkeit',
    volume: 'volumen',
    area: 'flaeche',
    currency: 'waehrung',
  },
  es: {
    length: 'longitud',
    weight: 'peso',
    temperature: 'temperatura',
    speed: 'velocidad',
    volume: 'volumen',
    area: 'area',
    currency: 'moneda',
  },
  hi: {
    length: 'length',
    weight: 'weight',
    temperature: 'temperature',
    speed: 'speed',
    volume: 'volume',
    area: 'area',
    currency: 'currency',
  },
};

// ---------------------------------------------------------------------------
// Reverse maps: localized slug → English slug. Built once at module load.
// ---------------------------------------------------------------------------

const REVERSE_CATEGORY: Record<string, Record<string, string>> = {};
const REVERSE_CALCULATOR: Record<string, Record<string, string>> = {};
const REVERSE_STATIC_PAGE: Record<string, Record<string, string>> = {};
const REVERSE_CONVERTER_PARENT: Record<string, string> = {};
const REVERSE_CONVERTER_TYPE: Record<string, Record<string, string>> = {};

for (const [locale, map] of Object.entries(CATEGORY_SLUGS)) {
  REVERSE_CATEGORY[locale] = {};
  for (const [en, loc] of Object.entries(map)) {
    REVERSE_CATEGORY[locale][loc] = en;
  }
}

for (const [locale, map] of Object.entries(CALCULATOR_SLUGS)) {
  REVERSE_CALCULATOR[locale] = {};
  for (const [en, loc] of Object.entries(map)) {
    REVERSE_CALCULATOR[locale][loc] = en;
  }
}

for (const [locale, map] of Object.entries(STATIC_PAGE_SLUGS)) {
  REVERSE_STATIC_PAGE[locale] = {};
  for (const [en, loc] of Object.entries(map)) {
    REVERSE_STATIC_PAGE[locale][loc] = en;
  }
}

for (const [locale, slug] of Object.entries(CONVERTER_PARENT_SLUGS)) {
  REVERSE_CONVERTER_PARENT[slug] = locale;
}

for (const [locale, map] of Object.entries(CONVERTER_TYPE_SLUGS)) {
  REVERSE_CONVERTER_TYPE[locale] = {};
  for (const [en, loc] of Object.entries(map)) {
    REVERSE_CONVERTER_TYPE[locale][loc] = en;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Translate an English category slug to the locale-specific URL slug.
 * Returns the English slug unchanged when the locale is `en` or has no mapping.
 */
export function localizedCategorySlug(enSlug: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return enSlug;
  return CATEGORY_SLUGS[locale]?.[enSlug] ?? enSlug;
}

/**
 * Translate an English calculator slug to the locale-specific URL slug.
 * Returns the English slug unchanged when the locale is `en` or has no mapping.
 */
export function localizedCalculatorSlug(enSlug: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return enSlug;
  return CALCULATOR_SLUGS[locale]?.[enSlug] ?? enSlug;
}

/**
 * Translate an English static page slug (about, contact, privacy, terms) to
 * the locale-specific URL slug. Returns unchanged when locale is `en` or no mapping.
 */
export function localizedStaticPageSlug(enSlug: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return enSlug;
  return STATIC_PAGE_SLUGS[locale]?.[enSlug] ?? enSlug;
}

/**
 * Reverse-resolve a localized static page slug back to the English canonical slug.
 */
export function englishStaticPageSlug(localizedSlug: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return localizedSlug;
  return REVERSE_STATIC_PAGE[locale]?.[localizedSlug] ?? localizedSlug;
}

/**
 * Check if a slug is a known static page (English or localized in any locale).
 */
export function isStaticPageSlug(slug: string): boolean {
  const STATIC_PAGES = new Set(['about', 'contact', 'privacy', 'terms']);
  if (STATIC_PAGES.has(slug)) return true;
  for (const map of Object.values(REVERSE_STATIC_PAGE)) {
    if (slug in map) return true;
  }
  return false;
}

/**
 * Reverse-resolve a localized category slug back to the English canonical slug.
 * Used by routing to find which category a translated URL refers to.
 */
export function englishCategorySlug(localizedSlug: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return localizedSlug;
  return REVERSE_CATEGORY[locale]?.[localizedSlug] ?? localizedSlug;
}

/**
 * Reverse-resolve a localized calculator slug back to the English canonical slug.
 * Used by routing to find which calculator a translated URL refers to.
 */
export function englishCalculatorSlug(localizedSlug: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return localizedSlug;
  return REVERSE_CALCULATOR[locale]?.[localizedSlug] ?? localizedSlug;
}

/**
 * Build a fully localized calculator path: /{locale}/{localCategory}/{localSlug}
 * from an English category and slug.
 */
export function localizedCalculatorPath(enCategory: string, enSlug: string, locale: string): string {
  const cat = localizedCategorySlug(enCategory, locale);
  const slug = localizedCalculatorSlug(enSlug, locale);
  return `/${locale}/${cat}/${slug}`;
}

/**
 * Build a fully localized category path: /{locale}/{localCategory}
 * from an English category id.
 */
export function localizedCategoryPath(enCategory: string, locale: string): string {
  const cat = localizedCategorySlug(enCategory, locale);
  return `/${locale}/${cat}`;
}

/**
 * Get all localized category slugs for a given locale.
 * Returns undefined if no mapping exists for the locale.
 */
export function categorySlugMap(locale: string): Record<string, string> | undefined {
  return CATEGORY_SLUGS[locale];
}

/**
 * Get all localized calculator slugs for a given locale.
 * Returns undefined if no mapping exists for the locale.
 */
export function calculatorSlugMap(locale: string): Record<string, string> | undefined {
  return CALCULATOR_SLUGS[locale];
}

// ---------------------------------------------------------------------------
// Unit-converter slug helpers
// ---------------------------------------------------------------------------

/**
 * Translate the English "unit-converter" parent slug to the locale-specific slug.
 */
export function localizedConverterParentSlug(locale: string): string {
  if (locale === DEFAULT_LOCALE) return 'unit-converter';
  return CONVERTER_PARENT_SLUGS[locale] ?? 'unit-converter';
}

/**
 * Translate an English converter type slug (e.g. "length") to the locale slug.
 */
export function localizedConverterTypeSlug(enSlug: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return enSlug;
  return CONVERTER_TYPE_SLUGS[locale]?.[enSlug] ?? enSlug;
}

/**
 * Reverse-resolve a localized converter parent slug to check if it is a known
 * converter parent. Returns the locale code if found, or undefined.
 */
export function localeFromConverterParent(localizedSlug: string): string | undefined {
  if (localizedSlug === 'unit-converter') return DEFAULT_LOCALE;
  return REVERSE_CONVERTER_PARENT[localizedSlug];
}

/**
 * Reverse-resolve a localized converter type slug back to the English type.
 */
export function englishConverterTypeSlug(localizedSlug: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return localizedSlug;
  return REVERSE_CONVERTER_TYPE[locale]?.[localizedSlug] ?? localizedSlug;
}

/**
 * Check if a slug is a known converter parent for any locale (or English).
 */
export function isConverterParentSlug(slug: string): boolean {
  if (slug === 'unit-converter') return true;
  return slug in REVERSE_CONVERTER_PARENT;
}
