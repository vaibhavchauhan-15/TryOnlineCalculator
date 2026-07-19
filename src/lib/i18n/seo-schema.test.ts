// Localized structured-data tests (Task 7): schemas carry localized names,
// locale-prefixed absolute URLs and the correct inLanguage tag.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  localizedBreadcrumbSchema,
  localizedCalculatorSchema,
  localizedFaqSchema,
  localizedCalculatorPageSchemas,
} from './seo-schema';

const OPTS = {
  homeLabel: 'Startseite',
  categoryId: 'health',
  categoryPath: '/health',
  title: 'BMI Rechner',
  description: 'Berechnen Sie Ihren Body-Mass-Index.',
  pagePath: '/health/bmi-calculator',
  faq: [{ q: 'Was ist BMI?', a: 'Ein Verhältnis von Gewicht zu Größe.' }],
};

test('WebApplication schema uses localized name + inLanguage + locale URL', () => {
  const s = localizedCalculatorSchema('de', OPTS) as Record<string, any>;
  assert.equal(s.name, 'BMI Rechner');
  assert.equal(s.inLanguage, 'de');
  assert.equal(s.url, 'https://tryonlinecalculator.com/de/gesundheit/bmi-rechner');
  assert.equal(s.isAccessibleForFree, true);
});

test('breadcrumb localizes home + category and prefixes every URL', () => {
  const s = localizedBreadcrumbSchema('de', OPTS) as Record<string, any>;
  const items = s.itemListElement;
  assert.equal(items[0].name, 'Startseite');
  // Category name is localized from the German UI pack (Task 11).
  assert.equal(items[1].name, 'Gesundheit');
  assert.equal(items[0].item, 'https://tryonlinecalculator.com/de');
  assert.equal(items[2].item, 'https://tryonlinecalculator.com/de/gesundheit/bmi-rechner');
});

test('FAQ schema carries inLanguage + localized Q/A', () => {
  const s = localizedFaqSchema('de', OPTS.faq) as Record<string, any>;
  assert.equal(s.inLanguage, 'de');
  assert.equal(s.mainEntity[0].name, 'Was ist BMI?');
  assert.equal(s.mainEntity[0].acceptedAnswer.text, 'Ein Verhältnis von Gewicht zu Größe.');
});

test('page schema set includes FAQ only when FAQ items exist', () => {
  const withFaq = localizedCalculatorPageSchemas('es', OPTS);
  assert.equal(withFaq.length, 3);
  const noFaq = localizedCalculatorPageSchemas('es', { ...OPTS, faq: [] });
  assert.equal(noFaq.length, 2);
  // Spanish URLs are prefixed with /es and use translated slugs.
  assert.equal((withFaq[1] as any).url, 'https://tryonlinecalculator.com/es/salud/calculadora-imc');
});
