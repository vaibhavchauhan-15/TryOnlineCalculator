// QA gate tests (Task 13): each seeded defect must be caught; a clean branch
// must pass. This is the safety net that keeps the build gate honest.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  checkSiteIntegrity,
  lintContent,
  checkTranslationQa,
  termSurvives,
  parseDoc,
  type Doc,
} from './validate.ts';

// A minimal valid English document.
const enDoc = (over: Partial<Record<string, any>> = {}): Doc => ({
  fm: {
    slug: 'loan-calculator', category: 'finance',
    title: 'Loan Calculator', description: 'Calculate the monthly payment and total interest on any fixed-rate loan.',
    keywords: ['loan'], calculatorVersion: 1, seoVersion: 1, translationVersion: 1, source: 'en',
    faq: [{ q: 'How?', a: 'Enter values.' }], related: [], ...over,
  },
  body: 'Some prose about loans.',
});

const has = (issues: { rule: string }[], rule: string) => issues.some((i) => i.rule === rule);

// --- Site integrity ---------------------------------------------------------

test('clean single-locale set has no integrity errors', () => {
  const docs = { en: { 'loan-calculator': enDoc() } };
  const errors = checkSiteIntegrity(docs, ['en']).filter((i) => i.level === 'error');
  assert.deepEqual(errors, []);
});

test('missing translation breaks hreflang reciprocity', () => {
  const docs = { en: { 'loan-calculator': enDoc() }, de: {} as Record<string, Doc> };
  assert.ok(has(checkSiteIntegrity(docs, ['en', 'de']), 'missing-translation'));
});

test('orphan related slug is caught', () => {
  const docs = { en: { 'loan-calculator': enDoc({ related: ['does-not-exist'] }) } };
  assert.ok(has(checkSiteIntegrity(docs, ['en']), 'orphan-related'));
});

test('slug/filename mismatch is caught', () => {
  const docs = { en: { 'loan-calculator': enDoc({ slug: 'wrong' }) } };
  assert.ok(has(checkSiteIntegrity(docs, ['en']), 'slug-mismatch'));
});

test('schema violation is caught', () => {
  const docs = { en: { 'loan-calculator': { fm: { slug: 'loan-calculator' }, body: '' } as Doc } };
  assert.ok(has(checkSiteIntegrity(docs, ['en']), 'schema'));
});

// --- Content linter ---------------------------------------------------------

test('over-long title and description are caught', () => {
  const long = lintContent('en', 'x', enDoc({ title: 'T'.repeat(80), description: 'D'.repeat(200) }));
  assert.ok(has(long, 'title-length'));
  assert.ok(has(long, 'desc-length'));
});

test('duplicate and empty FAQ entries are caught', () => {
  const dup = lintContent('en', 'x', enDoc({ faq: [{ q: 'Same?', a: 'a' }, { q: 'Same?', a: 'b' }] }));
  assert.ok(has(dup, 'faq-duplicate'));
  const empty = lintContent('en', 'x', enDoc({ faq: [{ q: '  ', a: '' }] }));
  assert.ok(has(empty, 'faq-empty'));
});

test('body H1 and skipped heading levels are caught', () => {
  const doc = { ...enDoc(), body: '# Nope\n\nText\n\n### Skipped' };
  const issues = lintContent('en', 'x', doc);
  assert.ok(has(issues, 'duplicate-h1'));
  assert.ok(has(issues, 'heading-skip'));
});

test('image without alt text is caught', () => {
  const doc = { ...enDoc(), body: 'See ![](/chart.png) here.' };
  assert.ok(has(lintContent('en', 'x', doc), 'img-alt'));
});

test('clean content lints cleanly', () => {
  const errors = lintContent('en', 'x', enDoc()).filter((i) => i.level === 'error');
  assert.deepEqual(errors, []);
});

// --- Translation & SEO QA ---------------------------------------------------

const bmiEn = enDoc({ slug: 'bmi-calculator', title: 'BMI Calculator', description: 'Calculate your Body Mass Index (BMI) quickly.' });

test('German dropping "BMI" for Körpermassenindex is a QA failure', () => {
  const badDe: Doc = { fm: { ...bmiEn.fm, title: 'Körpermassenindex-Rechner', description: 'Berechnen Sie Ihren Körpermassenindex.', source: 'en', model: 'm', translatedFromVersion: 1 }, body: '' };
  assert.ok(has(checkTranslationQa('de', 'bmi-calculator', bmiEn, badDe), 'do-not-translate'));
});

test('German keeping "BMI" verbatim passes', () => {
  const goodDe: Doc = { fm: { ...bmiEn.fm, title: 'BMI-Rechner', description: 'Berechnen Sie Ihren BMI.', source: 'en', model: 'm', translatedFromVersion: 1 }, body: '' };
  const errs = checkTranslationQa('de', 'bmi-calculator', bmiEn, goodDe).filter((i) => i.level === 'error');
  assert.deepEqual(errs, []);
});

test('Spanish using "IMC" for BMI is accepted (locale equivalent)', () => {
  const goodEs: Doc = { fm: { ...bmiEn.fm, title: 'Calculadora de IMC', description: 'Calcula tu IMC.', source: 'en', model: 'm', translatedFromVersion: 1 }, body: '' };
  assert.equal(termSurvives('BMI', 'es', 'Calculadora de IMC'), true);
  const errs = checkTranslationQa('es', 'bmi-calculator', bmiEn, goodEs).filter((i) => i.level === 'error');
  assert.deepEqual(errs, []);
});

test('missing provenance is caught', () => {
  const noProv: Doc = { fm: { ...bmiEn.fm, title: 'BMI-Rechner', description: 'x BMI', source: 'de' }, body: '' };
  const issues = checkTranslationQa('de', 'bmi-calculator', bmiEn, noProv);
  assert.ok(has(issues, 'provenance-source'));
  assert.ok(has(issues, 'provenance-version'));
});

// --- Parsing ---------------------------------------------------------------

test('parseDoc splits frontmatter and body', () => {
  const doc = parseDoc('---\nslug: "x"\ntitle: "T"\n---\n\nBody text.');
  assert.equal(doc!.fm.slug, 'x');
  assert.equal(doc!.body, 'Body text.');
});
