// BMI — pure engine (health pilot).
//
// Computes Body Mass Index, a category, the healthy-weight band, an optional
// body-fat estimate and a gauge chart. Every output is a raw number or an enum
// key: the category is `enumKey: "normal"`, never "Normal weight"; the healthy
// range is raw kilograms tagged `mass`, never "56.7 – 76.3 kg". Presentation is
// the localization layer's job.

import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import { ok, fail } from '../contract';
import { ftInToCm, lbToKg, isFiniteNumber, num } from '../units';

export type Sex = 'male' | 'female';
export type UnitSystem = 'metric' | 'imperial';
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface BmiInput {
  unitSystem: UnitSystem;
  sex: Sex;
  age: number;
  /** Metric measurements (used when unitSystem === 'metric'). */
  heightCm: number;
  weightKg: number;
  /** Imperial measurements (used when unitSystem === 'imperial'). */
  heightFt: number;
  heightIn: number;
  weightLb: number;
}

export interface BmiResult extends EngineResult {}

/** kg from whichever unit system the input is in. */
function kgFrom(input: BmiInput): number {
  return input.unitSystem === 'imperial' ? lbToKg(input.weightLb) : input.weightKg;
}
/** cm from whichever unit system the input is in. */
function cmFrom(input: BmiInput): number {
  return input.unitSystem === 'imperial' ? ftInToCm(input.heightFt, input.heightIn) : input.heightCm;
}

/** BMI → category enum key + tone (matches the original thresholds). */
export function bmiCategory(bmi: number): { key: BmiCategory; tone: 'success' | 'warning' | 'error' } {
  if (bmi < 18.5) return { key: 'underweight', tone: 'warning' };
  if (bmi < 25) return { key: 'normal', tone: 'success' };
  if (bmi < 30) return { key: 'overweight', tone: 'warning' };
  return { key: 'obese', tone: 'error' };
}

export const bmiEngine: CalculatorEngine<BmiInput, BmiResult> = {
  slug: 'bmi-calculator',
  category: 'health',

  defaultInput: () => ({
    unitSystem: 'metric',
    sex: 'male',
    age: 30,
    heightCm: 175,
    weightKg: 75,
    heightFt: 5,
    heightIn: 9,
    weightLb: 165,
  }),

  fields: (): EngineField[] => [
    {
      name: 'unitSystem', labelKey: 'field.unitSystem', type: 'radio', defaultValue: 'metric', span: 2,
      options: [
        { value: 'metric', labelKey: 'metric' },
        { value: 'imperial', labelKey: 'imperial' },
      ],
    },
    {
      name: 'sex', labelKey: 'field.sex', type: 'radio', defaultValue: 'male',
      options: [
        { value: 'male', labelKey: 'male' },
        { value: 'female', labelKey: 'female' },
      ],
    },
    { name: 'age', labelKey: 'field.age', type: 'number', defaultValue: '30', min: 2, max: 120, step: 1, suffixKey: 'years' },
    // Metric measurements.
    { name: 'heightCm', labelKey: 'field.height', type: 'number', defaultValue: '175', min: 50, max: 260, step: 1, suffixKey: 'cm', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    { name: 'weightKg', labelKey: 'field.weight', type: 'number', defaultValue: '75', min: 10, max: 400, step: 0.5, suffixKey: 'kg', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    // Imperial measurements.
    { name: 'heightFt', labelKey: 'field.heightFt', type: 'number', defaultValue: '5', min: 1, max: 8, step: 1, suffixKey: 'ft', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    { name: 'heightIn', labelKey: 'field.heightIn', type: 'number', defaultValue: '9', min: 0, max: 11, step: 1, suffixKey: 'in', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    { name: 'weightLb', labelKey: 'field.weightLb', type: 'number', defaultValue: '165', min: 20, max: 880, step: 1, suffixKey: 'lb', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
  ],

  parseInput: (values): BmiInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    sex: values.sex === 'female' ? 'female' : 'male',
    age: num(values.age, 30),
    heightCm: num(values.heightCm, 175),
    weightKg: num(values.weightKg, 75),
    heightFt: num(values.heightFt, 5),
    heightIn: num(values.heightIn, 9),
    weightLb: num(values.weightLb, 165),
  }),

  validate: (input) => {
    const kg = kgFrom(input);
    const cm = cmFrom(input);
    if (!isFiniteNumber(kg) || !isFiniteNumber(cm) || kg <= 0 || cm <= 0) {
      return fail('bmi.heightWeightRequired');
    }
    return ok();
  },

  compute: (input) => {
    const kg = kgFrom(input);
    const cm = cmFrom(input);
    const m = cm / 100;
    const bmi = kg / (m * m);
    const cat = bmiCategory(bmi);
    const lowKg = 18.5 * m * m;
    const highKg = 24.9 * m * m;

    const items: ResultItem[] = [
      { key: 'bmi', value: bmi, format: 'decimal', precision: 1, primary: true, enumKey: cat.key, tone: cat.tone },
      { key: 'category', enumKey: cat.key, tone: cat.tone },
      { key: 'healthyRange', range: { min: lowKg, max: highKg }, format: 'mass', precision: 1 },
    ];

    // Body-fat estimate (Deurenberg): uses BMI + age + sex. sex = 1 for male.
    if (input.age >= 15) {
      const sex = input.sex === 'female' ? 0 : 1;
      const bodyFat = 1.2 * bmi + 0.23 * input.age - 10.8 * sex - 5.4;
      const clamped = Math.min(60, Math.max(2, bodyFat));
      items.push({ key: 'bodyFat', value: clamped, format: 'percent', precision: 1, hintKey: 'bmi.bodyFatMethod' });
    }

    // Distance from the healthy band, with a raw kg delta + direction enum key.
    if (kg < lowKg) {
      items.push({ key: 'toHealthyRange', value: lowKg - kg, format: 'mass', precision: 1, enumKey: 'gain', tone: 'warning' });
    } else if (kg > highKg) {
      items.push({ key: 'toHealthyRange', value: kg - highKg, format: 'mass', precision: 1, enumKey: 'lose', tone: 'warning' });
    }

    return {
      items,
      charts: [
        {
          type: 'gauge',
          titleKey: 'bmi.gaugeTitle',
          value: bmi,
          valueEnumKey: cat.key,
          min: 15,
          max: 40,
          segments: [
            { from: 15, to: 18.5, labelKey: 'underweight', color: '#47a3ff' },
            { from: 18.5, to: 25, labelKey: 'normal', color: '#50e3c2' },
            { from: 25, to: 30, labelKey: 'overweight', color: '#f5a623' },
            { from: 30, to: 40, labelKey: 'obese', color: '#ee0000' },
          ],
        },
      ],
    };
  },
};
