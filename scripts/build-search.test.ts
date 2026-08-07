// Locale-aware search index tests (Task 12): each locale index is built from
// the localized MDX with locale-correct paths and native-vocabulary synonyms.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { buildLocale, pagePath } from './build-search.ts';
import { enabledLocaleCodes } from '../src/lib/i18n/locales.ts';

test('pagePath: all locales prefixed, slugs translated', () => {
  assert.equal(pagePath('en', 'health', 'bmi-calculator'), '/en/health/bmi-calculator');
  assert.equal(pagePath('de', 'health', 'bmi-calculator'), '/de/gesundheit/bmi-rechner');
  assert.equal(pagePath('es', 'finance', 'loan-calculator'), '/es/finanzas/calculadora-prestamos');
});

test('every enabled locale index covers all calculators', () => {
  const enCount = buildLocale('en').length;
  assert.ok(enCount >= 40, `en index has ${enCount} records`);
  for (const code of enabledLocaleCodes()) {
    assert.equal(buildLocale(code).length, enCount, `${code} index matches en count`);
  }
}, 30000);

test('German index uses localized titles + native synonyms', () => {
  const de = buildLocale('de');
  const bmi = de.find((r) => r.p === '/de/gesundheit/bmi-rechner')!;
  assert.equal(bmi.t, 'BMI-Rechner');
  assert.equal(bmi.c, 'Gesundheit');
  // "Rechner" (German for calculator) matches — the whole point of per-locale search.
  assert.ok(bmi.h.includes('rechner'), 'German haystack has "rechner"');
  // Native synonym folded in.
  assert.ok(bmi.h.includes('körpermassenindex'), 'German BMI synonym present');
});

test('Spanish index matches "IMC" for the BMI calculator', () => {
  const es = buildLocale('es');
  const bmi = es.find((r) => r.p === '/es/salud/calculadora-imc')!;
  assert.equal(bmi.t, 'Calculadora de IMC');
  assert.ok(bmi.h.includes('imc'), 'Spanish BMI matches "IMC"');
});

test('every locale index path is locale-prefixed', () => {
  for (const code of enabledLocaleCodes()) {
    const recs = buildLocale(code);
    assert.ok(recs.every((r) => r.p.startsWith(`/${code}/`)), `${code} paths are prefixed with /${code}/`);
  }
}, 30000);
