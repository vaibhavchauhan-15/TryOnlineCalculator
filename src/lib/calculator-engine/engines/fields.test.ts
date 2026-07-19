// Field descriptor + input-parsing tests (Task 6).
//
// The renderer builds the live form from each engine's presentation-neutral
// field descriptors, and re-computes from raw string form values via
// parseInput. These tests lock two invariants:
//   1. Field descriptors carry only label/enum KEYS (no localized prose), and
//   2. parseInput(defaultValues) round-trips to the same result as
//      defaultInput(), so the SSR seed and the client agree.

import { test } from 'vitest';
import assert from 'node:assert/strict';

import { bmiEngine } from './bmi';
import { percentageEngine } from './percentage';
import { mortgageEngine } from './mortgage';
import { currencyConverterEngine } from './currency-converter';
import { STATIC_USD_PER } from '../../rates';
import type { AnyEngine } from '../index';
import type { EngineField } from '../contract';

const PILOTS = [bmiEngine, percentageEngine, mortgageEngine, currencyConverterEngine] as unknown as AnyEngine[];

// Every field's labelKey/options/suffix must be a machine key, never prose.
function assertKeyLike(f: EngineField): void {
  assert.match(f.labelKey, /^[a-zA-Z][\w.]*$/, `field "${f.name}" labelKey "${f.labelKey}" is a key`);
  for (const o of f.options ?? []) {
    assert.match(o.labelKey, /^[a-zA-Z][\w.]*$/, `option "${o.value}" labelKey "${o.labelKey}" is a key`);
  }
}

test('every pilot engine exposes fields() + parseInput()', () => {
  for (const e of PILOTS) {
    assert.equal(typeof e.fields, 'function', `${e.slug} has fields()`);
    assert.equal(typeof e.parseInput, 'function', `${e.slug} has parseInput()`);
    const fields = e.fields!();
    assert.ok(fields.length > 0, `${e.slug} has at least one field`);
    fields.forEach(assertKeyLike);
  }
});

test('field descriptors carry no localized prose (keys only)', () => {
  for (const e of PILOTS) {
    for (const f of e.fields!()) {
      // A label like "Home price" would contain a space; keys never do.
      assert.equal(/\s/.test(f.labelKey), false, `${e.slug}.${f.name} labelKey has no spaces`);
    }
  }
});

test('parseInput(defaults) matches defaultInput() for the form calculators', () => {
  for (const e of [bmiEngine, percentageEngine, mortgageEngine]) {
    const values: Record<string, string> = {};
    for (const f of e.fields!()) values[f.name] = f.defaultValue;
    const parsed = e.parseInput!(values);
    assert.deepEqual(parsed, e.defaultInput(), `${e.slug} parseInput(defaults) === defaultInput()`);
  }
});

test('currency converter parseInput injects runtime usdPer', () => {
  const values = { amount: '100', from: 'USD', to: 'EUR' };
  const input = currencyConverterEngine.parseInput!(values, { usdPer: STATIC_USD_PER });
  assert.equal(input.amount, 100);
  assert.equal(input.from, 'USD');
  assert.equal(input.to, 'EUR');
  assert.equal(input.usdPer, STATIC_USD_PER);
  // Without runtime rates, usdPer is empty so validate() surfaces the issue
  // rather than the parser guessing a rate.
  const noRates = currencyConverterEngine.parseInput!(values);
  assert.deepEqual(noRates.usdPer, {});
  assert.equal(currencyConverterEngine.validate(noRates).valid, false);
});

test('lenient number parsing strips grouping commas and spaces', () => {
  const parsed = mortgageEngine.parseInput!({
    homePrice: '1,200,000', downPayment: ' 240000 ', rate: '5.75', term: '30', tax: '', insurance: '0',
  });
  assert.equal(parsed.homePrice, 1200000);
  assert.equal(parsed.downPayment, 240000);
  assert.equal(parsed.tax, 0); // empty → 0
});

test('conditional fields are declared for BMI unit system', () => {
  const metricOnly = bmiEngine.fields!().filter((f) => f.showWhen?.equals.includes('metric'));
  const imperialOnly = bmiEngine.fields!().filter((f) => f.showWhen?.equals.includes('imperial'));
  assert.ok(metricOnly.some((f) => f.name === 'heightCm'));
  assert.ok(imperialOnly.some((f) => f.name === 'weightLb'));
});
