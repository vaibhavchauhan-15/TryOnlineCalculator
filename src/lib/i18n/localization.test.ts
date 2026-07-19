// Tests for the localization layer (Task 4): Intl formatting by region + the
// resolver that turns raw engine results into localized display text with an
// English fallback.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatMass,
  formatValue,
} from './format-locale';
import { createResolver, type LabelPack } from './resolver';
import { bmiEngine } from '../calculator-engine/engines/bmi';
import { mortgageEngine } from '../calculator-engine/engines/mortgage';

const US = { numberFormat: 'en-US', currency: 'USD', unitSystem: 'imperial' as const };
const IN = { numberFormat: 'en-IN', currency: 'INR', unitSystem: 'metric' as const };
const DE = { numberFormat: 'de-DE', currency: 'EUR', unitSystem: 'metric' as const };

// --- format-locale ---------------------------------------------------------
test('number grouping follows the region', () => {
  assert.equal(formatNumber(1234.56, 'en-US', 2), '1,234.56');
  assert.equal(formatNumber(1234.56, 'de-DE', 2), '1.234,56');
  // Indian lakh grouping.
  assert.equal(formatNumber(1234567, 'en-IN', 0), '12,34,567');
});

test('currency formats symbol + grouping per region', () => {
  assert.equal(formatCurrency(2022.62, US).text, '$2,022.62');
  const de = formatCurrency(2022.62, DE);
  assert.ok(de.text.includes('2.022,62'));
  assert.equal(de.currencyCode, 'EUR');
});

test('percent keeps its magnitude and locale grouping', () => {
  assert.equal(formatPercent(12.5, 'en-US', 4), '12.5%');
  assert.equal(formatPercent(1234.5, 'de-DE', 1), '1.234,5%');
});

test('mass converts by unit system and returns a unit enum key', () => {
  const metric = formatMass(76.25625, { ...IN }, 1);
  assert.equal(metric.unitKey, 'kg');
  assert.equal(metric.text, '76.3');
  const imperial = formatMass(76.25625, { ...US }, 1);
  assert.equal(imperial.unitKey, 'lb'); // 76.256 kg ≈ 168.1 lb
  assert.ok(Math.abs(Number(imperial.text.replace(/,/g, '')) - 168.1) < 0.2);
});

test('formatValue routes by ValueFormat', () => {
  assert.equal(formatValue(50, 'percent', US, 0).text, '50%');
  assert.equal(formatValue(360, 'integer', US).text, '360');
  assert.equal(formatValue(320000, 'currency', US).text, '$320,000.00');
});

// --- resolver --------------------------------------------------------------
// A realistic English fallback pack for BMI + shared units.
const bmiFallback: LabelPack = {
  labels: { bmi: 'Your BMI', category: 'Category', healthyRange: 'Healthy weight range', bodyFat: 'Estimated body fat', toHealthyRange: 'To reach healthy range' },
  enums: { underweight: 'Underweight', normal: 'Normal weight', overweight: 'Overweight', obese: 'Obese', gain: 'Gain', lose: 'Lose' },
  units: { kg: 'kg', lb: 'lb', cm: 'cm', in: 'in' },
  hints: { 'bmi.bodyFatMethod': 'Deurenberg estimate for adults' },
  chartTitles: { 'bmi.gaugeTitle': 'Where your BMI falls' },
};

// A German pack that translates most keys but intentionally omits `bodyFat` to
// exercise the English fallback, and keeps "BMI" as "BMI" (do-not-translate).
const bmiDe: LabelPack = {
  labels: { bmi: 'Ihr BMI', category: 'Kategorie', healthyRange: 'Gesundes Gewicht', toHealthyRange: 'Bis zum Normalbereich' },
  enums: { underweight: 'Untergewicht', normal: 'Normalgewicht', overweight: 'Übergewicht', obese: 'Adipös', gain: 'Zunehmen', lose: 'Abnehmen' },
  units: { kg: 'kg' },
  hints: {},
  chartTitles: { 'bmi.gaugeTitle': 'Wo Ihr BMI liegt' },
};

test('resolver localizes labels, enums and units (German)', () => {
  const result = bmiEngine.compute(bmiEngine.defaultInput());
  const r = createResolver(bmiDe, bmiFallback, DE).resolve(result);

  const bmi = r.items.find((i) => i.label === 'Ihr BMI')!;
  assert.ok(bmi, 'BMI label localized');
  assert.equal(bmi.value, '24,5'); // de grouping, 1 decimal
  assert.equal(bmi.hint, 'Normalgewicht'); // category enum localized as hint

  const category = r.items.find((i) => i.label === 'Kategorie')!;
  assert.equal(category.value, 'Normalgewicht'); // pure-enum item → localized enum

  const range = r.items.find((i) => i.label === 'Gesundes Gewicht')!;
  assert.ok(range.value.endsWith(' kg'));
  assert.ok(range.value.includes('–'));
});

test('resolver falls back to English for a missing translation key', () => {
  const result = bmiEngine.compute(bmiEngine.defaultInput());
  const r = createResolver(bmiDe, bmiFallback, DE).resolve(result);
  // `bodyFat` label is absent from the German pack → English fallback.
  const bodyFat = r.items.find((i) => i.label === 'Estimated body fat');
  assert.ok(bodyFat, 'missing key fell back to English label');
  assert.equal(bodyFat!.hint, 'Deurenberg estimate for adults');
});

test('resolver localizes chart titles and gauge bands', () => {
  const result = bmiEngine.compute(bmiEngine.defaultInput());
  const r = createResolver(bmiDe, bmiFallback, DE).resolve(result);
  const gauge = r.charts![0];
  assert.equal(gauge.title, 'Wo Ihr BMI liegt');
  assert.equal(gauge.valueLabel, 'Normalgewicht');
  assert.deepEqual(gauge.segments!.map((s) => s.label), ['Untergewicht', 'Normalgewicht', 'Übergewicht', 'Adipös']);
});

test('resolver formats mortgage currency in the active currency', () => {
  const mortgageFallback: LabelPack = {
    labels: { monthlyPayment: 'Monthly payment', principalInterest: 'Principal & interest', loanAmount: 'Loan amount', payments: 'Payments' },
    hints: { 'mortgage.pitiHint': 'Principal, interest, tax & insurance' },
  };
  const result = mortgageEngine.compute(mortgageEngine.defaultInput());
  const r = createResolver({}, mortgageFallback, IN).resolve(result); // empty pack → all English, INR formatting
  const monthly = r.items.find((i) => i.label === 'Monthly payment')!;
  assert.ok(monthly.value.startsWith('₹'), `INR symbol, got ${monthly.value}`);
  assert.equal(monthly.hint, 'Principal, interest, tax & insurance');
  const payments = r.breakdown!.find((i) => i.label === 'Payments')!;
  assert.equal(payments.value, '360');
});
