// Runtime tests for the CalculatorEngine contract (Task 2).
//
// Compile-time conformance (positive + negative shapes) is proven separately by
// `astro check` over contract.reference.ts. Here we exercise the runtime
// behaviour of the validation builders and a conforming reference engine, and
// assert that results never carry presentation strings.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { ok, fail } from './contract';
import { sumReferenceEngine } from './contract.reference';

test('ok() passes with no issues and stays valid with warnings only', () => {
  assert.equal(ok().valid, true);
  const withWarning = ok([{ code: 'x.rounded', severity: 'warning' }]);
  assert.equal(withWarning.valid, true);
  assert.equal(withWarning.issues.length, 1);
});

test('ok() becomes invalid if an error-severity issue is present', () => {
  const r = ok([{ code: 'x.bad', severity: 'error' }]);
  assert.equal(r.valid, false);
});

test('fail() produces a single machine-keyed error with no prose', () => {
  const r = fail('downPayment.exceedsPrice', { field: 'downPayment', params: { price: 100 } });
  assert.equal(r.valid, false);
  assert.equal(r.issues[0].code, 'downPayment.exceedsPrice');
  assert.equal(r.issues[0].severity, 'error');
  assert.equal(r.issues[0].field, 'downPayment');
  assert.deepEqual(r.issues[0].params, { price: 100 });
});

test('reference engine validates and rejects non-finite input', () => {
  assert.equal(sumReferenceEngine.validate({ a: 1, b: 2 }).valid, true);
  assert.equal(sumReferenceEngine.validate({ a: NaN, b: 2 }).valid, false);
});

test('reference engine compute returns raw values + enum keys only', () => {
  const result = sumReferenceEngine.compute({ a: 3, b: 4 });
  const sum = result.items.find((i) => i.key === 'sum')!;
  const parity = result.items.find((i) => i.key === 'parity')!;
  assert.equal(sum.value, 7);
  assert.equal(typeof sum.value, 'number'); // never a string
  assert.equal(parity.enumKey, 'odd'); // categorical as an enum key, not a label
  // No item carries a localized label or formatted string.
  for (const item of result.items) {
    assert.equal('label' in item, false);
    if (item.value !== undefined) assert.equal(typeof item.value, 'number');
  }
});

test('optional history capability derives from the result', () => {
  const result = sumReferenceEngine.compute({ a: 2, b: 2 });
  const entry = sumReferenceEngine.history!(result);
  assert.equal(entry.primaryKey, 'sum');
  assert.ok(entry.summary.length >= 1);
});
