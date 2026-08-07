// Pilot engine tests (Task 3): math parity with the original calculators +
// the invariant that results carry only raw values and enum keys (no prose).
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { bmiEngine, bmiCategory } from './bmi';
import { percentageEngine } from './percentage';
import { mortgageEngine } from './mortgage';
import { currencyConverterEngine, convert, exchangeRate } from './currency-converter';
import { oneRepMaxEngine } from './health';
import type { EngineResult, ResultItem } from '../contract';

// --- Shared invariant: no localized strings anywhere in a result -----------
// A result item may only carry raw numbers + machine keys. This asserts there
// is no `label`/`hint`/`value:string`, and that every key looks like an
// identifier (no spaces, i.e. no human prose leaking through).
function assertNoProse(result: EngineResult): void {
  const walk = (items: ResultItem[] | undefined) => {
    for (const it of items ?? []) {
      assert.equal('label' in it, false, 'no label field');
      assert.equal('hint' in it, false, 'no hint prose field');
      if (it.value !== undefined) assert.equal(typeof it.value, 'number');
      assert.match(it.key, /^[a-z][a-zA-Z0-9.]*$/, `key "${it.key}" is an identifier`);
      if (it.enumKey) assert.match(it.enumKey, /^[a-z][a-zA-Z]*$/, `enumKey "${it.enumKey}"`);
    }
  };
  walk(result.items);
  walk(result.breakdown);
  for (const chart of result.charts ?? []) {
    for (const s of chart.slices ?? []) assert.match(s.labelKey, /^[a-z][a-zA-Z]*$/);
    for (const seg of chart.segments ?? []) assert.match(seg.labelKey, /^[a-z][a-zA-Z]*$/);
    for (const ser of chart.series ?? []) assert.match(ser.labelKey, /^[a-z][a-zA-Z]*$/);
  }
}

// =========================================================================
// BMI
// =========================================================================
test('BMI: 75kg / 175cm computes 24.49 and category "normal"', () => {
  const r = bmiEngine.compute({ ...bmiEngine.defaultInput() });
  const bmi = r.items.find((i) => i.key === 'bmi')!;
  assert.ok(Math.abs(bmi.value! - 24.4898) < 0.001, `bmi ${bmi.value}`);
  assert.equal(bmi.enumKey, 'normal');
  const cat = r.items.find((i) => i.key === 'category')!;
  assert.equal(cat.enumKey, 'normal');
  // Healthy range is raw kilograms, not a formatted string.
  const range = r.items.find((i) => i.key === 'healthyRange')!;
  assert.ok(Math.abs(range.range!.min - 56.65625) < 1e-6);
  assert.ok(Math.abs(range.range!.max - 76.25625) < 1e-6);
  assertNoProse(r);
});

test('BMI: category thresholds match the original', () => {
  assert.equal(bmiCategory(17).key, 'underweight');
  assert.equal(bmiCategory(22).key, 'normal');
  assert.equal(bmiCategory(27).key, 'overweight');
  assert.equal(bmiCategory(31).key, 'obese');
});

test('BMI: imperial input normalizes to the same metric result', () => {
  // 165 lb, 5ft9in ≈ 74.84 kg / 175.26 cm → BMI ≈ 24.37
  const r = bmiEngine.compute({ ...bmiEngine.defaultInput(), unitSystem: 'imperial' });
  const bmi = r.items.find((i) => i.key === 'bmi')!;
  assert.ok(bmi.value! > 24 && bmi.value! < 25, `bmi ${bmi.value}`);
});

test('BMI: invalid height/weight fails validation', () => {
  assert.equal(bmiEngine.validate({ ...bmiEngine.defaultInput(), heightCm: 0, weightKg: 0 }).valid, false);
});

// =========================================================================
// Percentage
// =========================================================================
test('Percentage: 15% of 200 = 30', () => {
  const r = percentageEngine.compute({ mode: 'percentOf', a: 15, b: 200 });
  assert.equal(r.items[0].value, 30);
  assertNoProse(r);
});

test('Percentage: 15 is 7.5% of 200', () => {
  const r = percentageEngine.compute({ mode: 'whatPercent', a: 15, b: 200 });
  assert.equal(r.items[0].value, 7.5);
});

test('Percentage: change 100→150 is +50% (increase)', () => {
  const r = percentageEngine.compute({ mode: 'change', a: 100, b: 150 });
  const change = r.items.find((i) => i.key === 'percentChange')!;
  assert.equal(change.value, 50);
  assert.equal(change.enumKey, 'increase');
  assert.equal(r.items.find((i) => i.key === 'absoluteChange')!.value, 50);
});

test('Percentage: validation guards zero denominators', () => {
  assert.equal(percentageEngine.validate({ mode: 'whatPercent', a: 1, b: 0 }).valid, false);
  assert.equal(percentageEngine.validate({ mode: 'change', a: 0, b: 5 }).valid, false);
});

// =========================================================================
// Mortgage
// =========================================================================
test('Mortgage: default $320k loan at 6.5%/30yr ≈ $2022.62 P&I', () => {
  const r = mortgageEngine.compute(mortgageEngine.defaultInput());
  const pi = r.items.find((i) => i.key === 'principalInterest')!;
  assert.ok(Math.abs(pi.value! - 2022.62) < 0.5, `P&I ${pi.value}`);
  // Monthly total adds $400 tax + $150 insurance.
  const total = r.items.find((i) => i.key === 'monthlyPayment')!;
  assert.ok(Math.abs(total.value! - (pi.value! + 550)) < 1e-6);
  // Loan amount raw, payments count raw integer.
  assert.equal(r.breakdown!.find((i) => i.key === 'loanAmount')!.value, 320000);
  assert.equal(r.breakdown!.find((i) => i.key === 'payments')!.value, 360);
  // Two charts (pie + line), all label keys, no prose.
  assert.equal(r.charts!.length, 2);
  assertNoProse(r);
});

test('Mortgage: down payment ≥ price fails validation', () => {
  const v = mortgageEngine.validate({ ...mortgageEngine.defaultInput(), downPayment: 500000 });
  assert.equal(v.valid, false);
  assert.equal(v.issues[0].code, 'mortgage.downPaymentExceedsPrice');
});

// =========================================================================
// Currency Converter (live feed mocked via injected usdPer)
// =========================================================================
const RATES = { USD: 1, EUR: 1.08, INR: 0.012 };

test('Currency: pure convert() and exchangeRate() math', () => {
  assert.ok(Math.abs(convert(100, 'USD', 'EUR', RATES) - 92.5926) < 0.001);
  assert.ok(Math.abs(convert(100, 'USD', 'INR', RATES) - 8333.333) < 0.01);
  assert.ok(Math.abs(exchangeRate('USD', 'EUR', RATES) - 0.925926) < 1e-5);
  // Missing rate → NaN (never throws, never guesses).
  assert.ok(Number.isNaN(convert(100, 'USD', 'ZZZ', RATES)));
});

test('Currency: engine compute returns raw converted value + rate', () => {
  const r = currencyConverterEngine.compute({ amount: 100, from: 'USD', to: 'EUR', usdPer: RATES });
  const converted = r.items.find((i) => i.key === 'converted')!;
  assert.ok(Math.abs(converted.value! - 92.5926) < 0.001);
  assert.deepEqual(converted.hintParams, { from: 'USD', to: 'EUR' });
  assertNoProse(r);
});

test('Currency: unavailable rate fails validation without a network call', () => {
  const v = currencyConverterEngine.validate({ amount: 1, from: 'USD', to: 'ZZZ', usdPer: RATES });
  assert.equal(v.valid, false);
  assert.equal(v.issues[0].code, 'currency.rateUnavailable');
  assert.equal(v.issues[0].params!.code, 'ZZZ');
});

// =========================================================================
// One Rep Max
// =========================================================================
test('One Rep Max: 100 kg / 5 reps computes ~115.1 kg with format mass', () => {
  const r = oneRepMaxEngine.compute({ ...oneRepMaxEngine.defaultInput(), unitSystem: 'metric', weightLiftedKg: 100, reps: 5 });
  const item1RM = r.items.find((i) => i.key === 'oneRepMax')!;
  assert.ok(Math.abs(item1RM.value! - 115.084) < 0.01);
  assert.equal(item1RM.format, 'mass');
  assertNoProse(r);
});

test('One Rep Max: 100 lb / 5 reps converts to SI internally and outputs format mass', () => {
  const r = oneRepMaxEngine.compute({ ...oneRepMaxEngine.defaultInput(), unitSystem: 'imperial', weightLiftedLb: 100, reps: 5 });
  const item1RM = r.items.find((i) => i.key === 'oneRepMax')!;
  // Internal kg value should be ~52.201 kg (which converts to 115.1 lb when rendered with imperial unitSystem)
  assert.ok(Math.abs(item1RM.value! - 52.201) < 0.01);
  assert.equal(item1RM.format, 'mass');
  assertNoProse(r);
});

