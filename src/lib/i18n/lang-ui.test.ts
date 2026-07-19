// Language selector + suggestion banner logic (Task 8).
//
// The DOM wiring (dropdown, toast) is exercised in the browser; here we lock
// the PURE decision logic that governs when a suggestion is offered and which
// locale the selector maps to — the parts that must never mis-fire.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { preferredEnabledLocale, suggestionFor } from './lang-ui';
import { switchLocale } from './paths';

test('preferredEnabledLocale picks the first enabled base language', () => {
  // "de-AT" → base "de" (enabled). "pt" is defined but disabled → skipped.
  assert.equal(preferredEnabledLocale(['pt-BR', 'de-AT', 'en-US']), 'de');
  assert.equal(preferredEnabledLocale(['fr-FR']), null); // fr disabled
  assert.equal(preferredEnabledLocale(['es']), 'es');
  assert.equal(preferredEnabledLocale([]), null);
});

test('suggestionFor offers a switch only when it helps', () => {
  // Browser prefers German, page is English → suggest "de".
  assert.equal(suggestionFor('en', ['de-DE', 'en'], false), 'de');
  // Already on the browser's language → no suggestion.
  assert.equal(suggestionFor('de', ['de-DE'], false), null);
  // Dismissed → never suggest again.
  assert.equal(suggestionFor('en', ['de-DE'], true), null);
  // Not a localized page (no current locale) → nothing.
  assert.equal(suggestionFor(undefined, ['de-DE'], false), null);
  // Browser language is a disabled locale → nothing.
  assert.equal(suggestionFor('en', ['fr-FR'], false), null);
});

test('selector maps the current path to the target locale (slug re-localized)', () => {
  assert.equal(switchLocale('/en/health/bmi-calculator', 'de'), '/de/gesundheit/bmi-rechner');
  assert.equal(switchLocale('/de/finanzen/hypothekenrechner', 'es'), '/es/finanzas/calculadora-hipoteca');
});
