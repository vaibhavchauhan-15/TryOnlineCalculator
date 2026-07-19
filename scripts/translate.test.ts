// AI localization CLI tests (Task 11): the translator's protection rules + the
// CLI's provenance stamping and staleness detection. These lock the MECHANICS
// (what must never break) independent of translation prose quality.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { DictionaryTranslator, IdentityTranslator, segmentPlaceholders, isProtectedToken } from './lib/translator.ts';
import { translatableStrings, applyTranslations, checkStaleness } from './translate.ts';
import deGloss from './lib/glossary/de.json' with { type: 'json' };

const de = new DictionaryTranslator({ de: deGloss as any });

async function tr(text: string, locale = 'de'): Promise<string> {
  return (await de.translate({ texts: [text], targetLocale: locale }))[0];
}

// --- Translator protection --------------------------------------------------

test('whole-string phrase match localizes titles and labels', async () => {
  assert.equal(await tr('Loan Calculator'), 'Kreditrechner');
  assert.equal(await tr('Monthly payment'), 'Monatliche Rate');
  assert.equal(await tr('Home'), 'Startseite');
});

test('do-not-translate terms and currency codes survive verbatim', () => {
  assert.equal(isProtectedToken('BMI'), true);
  assert.equal(isProtectedToken('APR'), true);
  assert.equal(isProtectedToken('USD'), true);
  assert.equal(isProtectedToken('EUR'), true);
  assert.equal(isProtectedToken('payment'), false);
});

test('BMI stays "BMI" (never expanded) inside a translated string', async () => {
  // Word-level fallback path: "Your BMI" is a phrase → localized, BMI kept.
  assert.equal(await tr('Your BMI'), 'Ihr BMI');
});

test('placeholders are never translated', async () => {
  const segs = segmentPlaceholders('{from} to {to}');
  assert.deepEqual(segs.map((s) => s.protectedChunk), [true, false, true]);
  const out = await tr('{from} to {to}');
  assert.ok(out.includes('{from}'), 'placeholder {from} preserved');
  assert.ok(out.includes('{to}'), 'placeholder {to} preserved');
});

test('numbers are preserved by the word-level fallback', async () => {
  const out = await tr('Save 25 percent today');
  assert.ok(out.includes('25'), 'number 25 preserved');
});

test('identity translator passes everything through', async () => {
  const id = new IdentityTranslator();
  assert.deepEqual(await id.translate({ texts: ['a', 'b'], targetLocale: 'de' }), ['a', 'b']);
});

test('a locale with no glossary passes through (English fallback)', async () => {
  assert.equal((await de.translate({ texts: ['Loan Calculator'], targetLocale: 'zz' }))[0], 'Loan Calculator');
});

// --- CLI field handling -----------------------------------------------------

const enDoc = {
  fm: {
    slug: 'loan-calculator', category: 'finance',
    title: 'Loan Calculator', description: 'Calculate a loan.',
    keywords: ['loan calculator', 'emi'],
    calculatorVersion: 2, seoVersion: 3, translationVersion: 4, source: 'en',
    labels: { monthlyPayment: 'Monthly payment' },
    formulaItems: [{ name: 'Payment', expr: 'M = P·r/(1-(1+r)^-n)' }],
    faq: [{ q: 'Is the rate APR?', a: 'No.' }],
    related: ['mortgage-calculator'],
  },
  body: 'A loan calculator.',
};

test('translatableStrings excludes formula expressions and slugs', () => {
  const strs = translatableStrings(enDoc);
  assert.ok(strs.includes('Loan Calculator'));
  assert.ok(strs.includes('Payment')); // formula NAME is translatable
  assert.ok(!strs.includes('M = P·r/(1-(1+r)^-n)'), 'formula EXPR excluded');
  assert.ok(!strs.includes('loan-calculator'), 'slug excluded');
  assert.ok(!strs.includes('mortgage-calculator'), 'related slug excluded');
});

test('applyTranslations preserves expr/slug/related + stamps provenance', () => {
  const map = new Map<string, string>([['Loan Calculator', 'Kreditrechner'], ['Monthly payment', 'Monatliche Rate'], ['Payment', 'Zahlung']]);
  const out = applyTranslations(enDoc, map, 'de', 'offline-dictionary-v1');
  assert.equal(out.fm.title, 'Kreditrechner');
  assert.equal(out.fm.labels.monthlyPayment, 'Monatliche Rate');
  // Preserved:
  assert.equal(out.fm.slug, 'loan-calculator');
  assert.equal(out.fm.formulaItems[0].expr, 'M = P·r/(1-(1+r)^-n)');
  assert.equal(out.fm.formulaItems[0].name, 'Zahlung');
  assert.deepEqual(out.fm.related, ['mortgage-calculator']);
  // Provenance:
  assert.equal(out.fm.source, 'en');
  assert.equal(out.fm.translatedFromVersion, 4);
  assert.equal(out.fm.model, 'offline-dictionary-v1');
  assert.equal(out.fm.calculatorVersion, 2); // per-facet versions copied through
  assert.equal(out.fm.seoVersion, 3);
});

// --- Staleness detection ----------------------------------------------------

test('checkStaleness flags a content bump', () => {
  const enFm = { translationVersion: 5, seoVersion: 1, calculatorVersion: 1 };
  const fresh = { translatedFromVersion: 5, seoVersion: 1, calculatorVersion: 1 };
  const stale = { translatedFromVersion: 4, seoVersion: 1, calculatorVersion: 1 };
  assert.equal(checkStaleness(enFm, fresh).stale, false);
  assert.equal(checkStaleness(enFm, stale).stale, true);
  assert.match(checkStaleness(enFm, stale).reasons[0], /content/);
});

test('checkStaleness flags an SEO-only bump independently', () => {
  const enFm = { translationVersion: 1, seoVersion: 2, calculatorVersion: 1 };
  const target = { translatedFromVersion: 1, seoVersion: 1, calculatorVersion: 1 };
  const s = checkStaleness(enFm, target);
  assert.equal(s.stale, true);
  assert.match(s.reasons[0], /seo/);
});
