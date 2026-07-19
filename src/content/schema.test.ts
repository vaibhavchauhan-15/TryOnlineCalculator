// Tests for the calculator MDX frontmatter schema (Task 4).
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { validateFrontmatter } from './schema';

const valid = {
  slug: 'bmi-calculator',
  category: 'health',
  title: 'BMI Calculator',
  description: 'Calculate your Body Mass Index.',
  calculatorVersion: 1,
  seoVersion: 1,
  translationVersion: 1,
  source: 'en',
  labels: { bmi: 'Your BMI' },
  enums: { normal: 'Normal weight' },
  faq: [{ q: 'What is BMI?', a: 'A ratio of weight to height.' }],
};

test('a well-formed document parses and applies array defaults', () => {
  const r = validateFrontmatter(valid);
  assert.equal(r.success, true);
  if (r.success) {
    assert.deepEqual(r.data.keywords, []); // default applied
    assert.deepEqual(r.data.howto, []);
  }
});

test('versioning is required — a missing facet is rejected', () => {
  const { seoVersion, ...noSeo } = valid;
  assert.equal(validateFrontmatter(noSeo).success, false);
  const { translationVersion, ...noTrans } = valid;
  assert.equal(validateFrontmatter(noTrans).success, false);
  const { calculatorVersion, ...noCalc } = valid;
  assert.equal(validateFrontmatter(noCalc).success, false);
});

test('versions must be positive integers', () => {
  assert.equal(validateFrontmatter({ ...valid, seoVersion: 0 }).success, false);
  assert.equal(validateFrontmatter({ ...valid, seoVersion: 1.5 }).success, false);
  assert.equal(validateFrontmatter({ ...valid, calculatorVersion: -1 }).success, false);
});

test('an unknown category is rejected', () => {
  assert.equal(validateFrontmatter({ ...valid, category: 'sports' }).success, false);
});

test('required identity fields cannot be empty', () => {
  assert.equal(validateFrontmatter({ ...valid, title: '' }).success, false);
  assert.equal(validateFrontmatter({ ...valid, description: '' }).success, false);
});

test('the source provenance field is required', () => {
  const { source, ...noSource } = valid;
  assert.equal(validateFrontmatter(noSource).success, false);
});

test('unknown frontmatter keys are rejected (strict) to catch typos', () => {
  assert.equal(validateFrontmatter({ ...valid, ttile: 'typo' }).success, false);
});

test('malformed FAQ entries are rejected', () => {
  assert.equal(validateFrontmatter({ ...valid, faq: [{ q: 'only question' }] }).success, false);
});
