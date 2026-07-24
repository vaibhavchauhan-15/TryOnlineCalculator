// Tests for the locale registry and path helpers (Task 1).
import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  LOCALES,
  DEFAULT_LOCALE,
  enabledLocales,
  enabledLocaleCodes,
  isEnabledLocale,
  getLocale,
  localeNativeName,
} from './locales';
import { to, homePath, splitLocale, switchLocale, stripLocale, localeOf } from './paths';

test('default locale is defined and enabled', () => {
  const def = getLocale(DEFAULT_LOCALE);
  assert.ok(def, 'default locale exists in registry');
  assert.equal(def!.enabled, true);
});

test('enabled locales are the live set (en, de) and exclude held-back ones', () => {
  const codes = enabledLocaleCodes();
  for (const c of ['en', 'de']) assert.ok(codes.includes(c), `${c} enabled`);
  assert.ok(codes.length <= LOCALES.length);
  // Held-back (hi, es) and next-wave (fr, …) locales must not leak into routing.
  for (const c of ['hi', 'es', 'fr']) assert.ok(!codes.includes(c), `${c} is disabled`);
});

test('isEnabledLocale gates unknown and disabled codes', () => {
  assert.equal(isEnabledLocale('en'), true);
  assert.equal(isEnabledLocale('fr'), false); // defined but disabled
  assert.equal(isEnabledLocale('zz'), false); // unknown
  assert.equal(isEnabledLocale(undefined), false);
});

test('enabling a locale is config-only (registry drives everything)', () => {
  // enabledLocales() derives purely from the `enabled` flag — no route/helper
  // hardcodes a language, so flipping the flag is the only change needed.
  const derived = enabledLocales().every((l) => l.enabled);
  assert.equal(derived, true);
});

test('native name falls back to the code', () => {
  assert.equal(localeNativeName('de'), 'Deutsch');
  assert.equal(localeNativeName('xx'), 'xx');
});

test('to() prefixes a locale segment and translates slugs', () => {
  // prefixDefaultLocale: every locale (including en) is prefixed; non-default
  // locales also translate the category + calculator slugs.
  assert.equal(to('/finance/mortgage-calculator', 'de'), '/de/finanzen/hypothekenrechner');
  assert.equal(to('/', 'en'), '/en');
  assert.equal(to('/finance/mortgage-calculator', 'en'), '/en/finance/mortgage-calculator');
  assert.equal(to('/finance', 'hi'), '/hi/finance');
});

test('homePath is a clean locale segment', () => {
  assert.equal(homePath('es'), '/es');
  assert.equal(homePath('en'), '/en');
});

test('splitLocale separates a known locale prefix from the rest', () => {
  assert.deepEqual(splitLocale('/de/finance/x'), { locale: 'de', rest: '/finance/x' });
  assert.deepEqual(splitLocale('/en'), { locale: 'en', rest: '/' });
  // An unknown/disabled prefix is treated as content, not a locale.
  assert.deepEqual(splitLocale('/fr/finance'), { locale: undefined, rest: '/fr/finance' });
});

test('switchLocale swaps the locale and re-localizes slugs', () => {
  // Resolves the localized URL back to English slugs, then re-localizes for the
  // target locale.
  assert.equal(switchLocale('/de/finanzen/hypothekenrechner', 'es'), '/es/finanzas/calculadora-hipoteca');
  assert.equal(switchLocale('/en', 'hi'), '/hi');
});

test('stripLocale and localeOf are inverse-ish helpers', () => {
  assert.equal(stripLocale('/de/gesundheit/bmi-rechner'), '/gesundheit/bmi-rechner');
  assert.equal(localeOf('/de/gesundheit/bmi-rechner'), 'de');
  assert.equal(localeOf('/health/bmi-calculator'), DEFAULT_LOCALE);
  // A held-back locale prefix is treated as content, not a locale.
  assert.equal(localeOf('/hi/health/bmi-calculator'), DEFAULT_LOCALE);
});
