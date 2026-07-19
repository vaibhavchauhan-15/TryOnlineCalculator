// Tests for the SEO head helpers (Task 5): hreflang alternates, self-canonical,
// og:locale.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { hreflangAlternates, canonicalFor, ogLocale } from './seo-head';
import { enabledLocaleCodes } from './locales';

test('hreflang set covers every enabled locale plus x-default', () => {
  const alts = hreflangAlternates('/finance/mortgage-calculator');
  const langs = alts.map((a) => a.hreflang);
  for (const code of enabledLocaleCodes()) assert.ok(langs.includes(code), `${code} present`);
  assert.ok(langs.includes('x-default'), 'x-default present');
  // One per enabled locale + x-default.
  assert.equal(alts.length, enabledLocaleCodes().length + 1);
});

test('alternates are absolute, locale-prefixed URLs with translated slugs', () => {
  const alts = hreflangAlternates('/health/bmi-calculator');
  const de = alts.find((a) => a.hreflang === 'de')!;
  assert.equal(de.href, 'https://tryonlinecalculator.com/de/gesundheit/bmi-rechner');
  // x-default points at the default locale, which is now prefixed (/en/).
  const xd = alts.find((a) => a.hreflang === 'x-default')!;
  assert.equal(xd.href, 'https://tryonlinecalculator.com/en/health/bmi-calculator');
});

test('canonical is self-referential to the page locale', () => {
  assert.equal(
    canonicalFor('es', '/math/percentage-calculator'),
    'https://tryonlinecalculator.com/es/matematicas/calculadora-porcentaje',
  );
});

test('ogLocale builds lang_REGION', () => {
  assert.equal(ogLocale('en', 'US'), 'en_US');
  assert.equal(ogLocale('de', 'DE'), 'de_DE');
  assert.equal(ogLocale('hi'), 'hi');
});
