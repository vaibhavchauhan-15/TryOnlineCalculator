// Health — pure engines (migrated from src/lib/calculators/health.ts).
//
// Every calculator here follows the same rule as bmi.ts: compute in SI (kg, cm)
// internally, emit RAW values + ENUM KEYS only. Mass outputs are raw kilograms
// tagged `mass` (the localization layer converts to lb per the active unit
// system); lengths are raw centimetres tagged `length`. Energy (calories) and
// nutrient grams are NOT kilograms, so they use `integer`/`decimal` with a
// machine unit hint key (e.g. 'unit.kcalPerDay', 'unit.grams') — never prose.
//
// bmi-calculator is already migrated in bmi.ts and is intentionally omitted.

import type { AnyEngine } from '../index';
import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import { ok, fail } from '../contract';
import { ftInToCm, lbToKg, IN_TO_CM, isFiniteNumber, num } from '../units';

export type Sex = 'male' | 'female';
export type UnitSystem = 'metric' | 'imperial';

// ---------------------------------------------------------------------------
// Shared input shape + SI helpers (age/height/weight body metrics)
// ---------------------------------------------------------------------------

interface BodyInput {
  unitSystem: UnitSystem;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  heightFt: number;
  heightIn: number;
  weightLb: number;
}

/** kg from whichever unit system the input is in. */
function kgFromBody(input: { unitSystem: UnitSystem; weightKg: number; weightLb: number }): number {
  return input.unitSystem === 'imperial' ? lbToKg(input.weightLb) : input.weightKg;
}
/** cm from whichever unit system the input is in. */
function cmFromBody(input: { unitSystem: UnitSystem; heightCm: number; heightFt: number; heightIn: number }): number {
  return input.unitSystem === 'imperial' ? ftInToCm(input.heightFt, input.heightIn) : input.heightCm;
}

/** Mifflin-St Jeor BMR (kcal/day). Matches the legacy formula exactly. */
function mifflinBmr(input: BodyInput): number {
  const kg = kgFromBody(input);
  const cm = cmFromBody(input);
  const base = 10 * kg + 6.25 * cm - 5 * input.age;
  return input.sex === 'female' ? base - 161 : base + 5;
}

// ---------------------------------------------------------------------------
// Shared field descriptors (reuse the bmi.ts unitSystem/sex radio pattern)
// ---------------------------------------------------------------------------

const unitSystemField: EngineField = {
  name: 'unitSystem', labelKey: 'field.unitSystem', type: 'radio', defaultValue: 'metric', span: 2,
  options: [
    { value: 'metric', labelKey: 'metric' },
    { value: 'imperial', labelKey: 'imperial' },
  ],
};

const sexField: EngineField = {
  name: 'sex', labelKey: 'field.sex', type: 'radio', defaultValue: 'male',
  options: [
    { value: 'male', labelKey: 'male' },
    { value: 'female', labelKey: 'female' },
  ],
};

/** Height + weight, metric/imperial conditionals — same pattern as bmi.ts. */
const heightWeightFields: EngineField[] = [
  { name: 'heightCm', labelKey: 'field.height', type: 'number', defaultValue: '175', min: 50, max: 260, step: 1, suffixKey: 'cm', showWhen: { field: 'unitSystem', equals: ['metric'] } },
  { name: 'weightKg', labelKey: 'field.weight', type: 'number', defaultValue: '75', min: 10, max: 400, step: 0.5, suffixKey: 'kg', showWhen: { field: 'unitSystem', equals: ['metric'] } },
  { name: 'heightFt', labelKey: 'field.heightFt', type: 'number', defaultValue: '5', min: 1, max: 8, step: 1, suffixKey: 'ft', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
  { name: 'heightIn', labelKey: 'field.heightIn', type: 'number', defaultValue: '9', min: 0, max: 11, step: 1, suffixKey: 'in', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
  { name: 'weightLb', labelKey: 'field.weightLb', type: 'number', defaultValue: '165', min: 20, max: 880, step: 1, suffixKey: 'lb', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
];

const activityField: EngineField = {
  name: 'activity', labelKey: 'field.activity', type: 'select', defaultValue: '1.55', span: 2,
  options: [
    { value: '1.2', labelKey: 'activity.sedentary' },
    { value: '1.375', labelKey: 'activity.light' },
    { value: '1.55', labelKey: 'activity.moderate' },
    { value: '1.725', labelKey: 'activity.veryActive' },
    { value: '1.9', labelKey: 'activity.extraActive' },
  ],
};

/** Standard body-metric parse block (used by bmr/tdee/calorie). */
function parseBody(values: Record<string, string>): BodyInput {
  return {
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    sex: values.sex === 'female' ? 'female' : 'male',
    age: num(values.age, 30),
    heightCm: num(values.heightCm, 175),
    weightKg: num(values.weightKg, 75),
    heightFt: num(values.heightFt, 5),
    heightIn: num(values.heightIn, 9),
    weightLb: num(values.weightLb, 165),
  };
}

const defaultBody: () => BodyInput = () => ({
  unitSystem: 'metric', sex: 'male', age: 30,
  heightCm: 175, weightKg: 75, heightFt: 5, heightIn: 9, weightLb: 165,
});

// ===========================================================================
// BMR — Basal Metabolic Rate
// ===========================================================================

export interface BmrInput extends BodyInput {}
export interface BmrResult extends EngineResult {}

export const bmrEngine: CalculatorEngine<BmrInput, BmrResult> = {
  slug: 'bmr-calculator',
  category: 'health',

  defaultInput: defaultBody,

  fields: (): EngineField[] => [
    unitSystemField,
    sexField,
    { name: 'age', labelKey: 'field.age', type: 'number', defaultValue: '30', min: 1, max: 120, step: 1, suffixKey: 'years' },
    ...heightWeightFields,
  ],

  parseInput: (values): BmrInput => parseBody(values),

  validate: (input) => {
    const bmr = mifflinBmr(input);
    if (!isFiniteNumber(bmr) || bmr <= 0) return fail('health.bodyMetricsRequired');
    return ok();
  },

  compute: (input) => {
    const bmr = mifflinBmr(input);
    const levels: { key: string; factor: number; color: string }[] = [
      { key: 'resting', factor: 1, color: '#7928ca' },
      { key: 'sedentary', factor: 1.2, color: '#0070f3' },
      { key: 'light', factor: 1.375, color: '#0070f3' },
      { key: 'moderate', factor: 1.55, color: '#0070f3' },
      { key: 'veryActive', factor: 1.725, color: '#0070f3' },
      { key: 'extraActive', factor: 1.9, color: '#0070f3' },
    ];

    return {
      items: [
        { key: 'bmr', value: bmr, format: 'integer', primary: true, hintKey: 'unit.kcalPerDay' },
      ],
      breakdown: [
        { key: 'sedentary', value: bmr * 1.2, format: 'integer', hintKey: 'unit.kcalPerDay' },
        { key: 'moderate', value: bmr * 1.55, format: 'integer', hintKey: 'unit.kcalPerDay' },
        { key: 'veryActive', value: bmr * 1.725, format: 'integer', hintKey: 'unit.kcalPerDay' },
      ],
      charts: [
        {
          type: 'bar',
          titleKey: 'bmr.chartActivity',
          format: 'decimal',
          bars: levels.map((l) => ({ labelKey: l.key, value: Math.round(bmr * l.factor), color: l.color })),
        },
      ],
    };
  },
};

// ===========================================================================
// TDEE — Total Daily Energy Expenditure
// ===========================================================================

export interface TdeeInput extends BodyInput {
  activity: number;
}
export interface TdeeResult extends EngineResult {}

export const tdeeEngine: CalculatorEngine<TdeeInput, TdeeResult> = {
  slug: 'tdee-calculator',
  category: 'health',

  defaultInput: () => ({ ...defaultBody(), activity: 1.55 }),

  fields: (): EngineField[] => [
    unitSystemField,
    sexField,
    activityField,
    { name: 'age', labelKey: 'field.age', type: 'number', defaultValue: '30', min: 1, max: 120, step: 1, suffixKey: 'years' },
    ...heightWeightFields,
  ],

  parseInput: (values): TdeeInput => ({ ...parseBody(values), activity: num(values.activity, 1.55) }),

  validate: (input) => {
    const tdee = mifflinBmr(input) * input.activity;
    if (!isFiniteNumber(tdee) || tdee <= 0) return fail('health.bodyMetricsRequired');
    return ok();
  },

  compute: (input) => {
    const bmr = mifflinBmr(input);
    const tdee = bmr * input.activity;

    return {
      items: [
        { key: 'tdee', value: tdee, format: 'integer', primary: true, hintKey: 'unit.kcalPerDay' },
        { key: 'bmr', value: bmr, format: 'integer', hintKey: 'unit.kcalPerDay' },
      ],
      breakdown: [
        { key: 'mildLoss', value: tdee - 250, format: 'integer', hintKey: 'unit.kcalPerDay' },
        { key: 'weightLoss', value: tdee - 500, format: 'integer', hintKey: 'unit.kcalPerDay' },
        { key: 'weightGain', value: tdee + 500, format: 'integer', hintKey: 'unit.kcalPerDay' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'tdee.chartComposition',
          format: 'decimal',
          slices: [
            { labelKey: 'restingBmr', value: Math.round(bmr), color: '#7928ca' },
            { labelKey: 'activity', value: Math.max(Math.round(tdee - bmr), 0), color: '#f5a623' },
          ],
        },
        {
          type: 'bar',
          titleKey: 'tdee.chartGoals',
          format: 'decimal',
          bars: [
            { labelKey: 'weightLoss', value: Math.max(Math.round(tdee - 500), 0), color: '#ff0080' },
            { labelKey: 'mildLoss', value: Math.max(Math.round(tdee - 250), 0), color: '#f5a623' },
            { labelKey: 'maintain', value: Math.round(tdee), color: '#0070f3' },
            { labelKey: 'mildGain', value: Math.round(tdee + 250), color: '#50e3c2' },
            { labelKey: 'weightGain', value: Math.round(tdee + 500), color: '#00dfd8' },
          ],
        },
      ],
    };
  },
};

// ===========================================================================
// Calorie — daily calorie target for a goal
// ===========================================================================

export type CalorieGoal = 'lose' | 'mildlose' | 'maintain' | 'mildgain' | 'gain';

export interface CalorieInput extends BodyInput {
  activity: number;
  goal: CalorieGoal;
}
export interface CalorieResult extends EngineResult {}

const CALORIE_ADJUST: Record<CalorieGoal, number> = {
  lose: -500, mildlose: -250, maintain: 0, mildgain: 250, gain: 500,
};

export const calorieEngine: CalculatorEngine<CalorieInput, CalorieResult> = {
  slug: 'calorie-calculator',
  category: 'health',

  defaultInput: () => ({ ...defaultBody(), activity: 1.55, goal: 'maintain' }),

  fields: (): EngineField[] => [
    unitSystemField,
    sexField,
    activityField,
    { name: 'age', labelKey: 'field.age', type: 'number', defaultValue: '30', min: 1, max: 120, step: 1, suffixKey: 'years' },
    ...heightWeightFields,
    {
      name: 'goal', labelKey: 'field.goal', type: 'select', defaultValue: 'maintain', span: 2,
      options: [
        { value: 'lose', labelKey: 'goal.lose' },
        { value: 'mildlose', labelKey: 'goal.mildLoss' },
        { value: 'maintain', labelKey: 'goal.maintain' },
        { value: 'mildgain', labelKey: 'goal.mildGain' },
        { value: 'gain', labelKey: 'goal.gain' },
      ],
    },
  ],

  parseInput: (values): CalorieInput => {
    const goal = (['lose', 'mildlose', 'maintain', 'mildgain', 'gain'] as const).includes(values.goal as CalorieGoal)
      ? (values.goal as CalorieGoal)
      : 'maintain';
    return { ...parseBody(values), activity: num(values.activity, 1.55), goal };
  },

  validate: (input) => {
    const tdee = mifflinBmr(input) * input.activity;
    if (!isFiniteNumber(tdee) || tdee <= 0) return fail('health.bodyMetricsRequired');
    return ok();
  },

  compute: (input) => {
    const tdee = mifflinBmr(input) * input.activity;
    const target = tdee + (CALORIE_ADJUST[input.goal] ?? 0);
    const goals: { key: string; goal: CalorieGoal }[] = [
      { key: 'lose', goal: 'lose' },
      { key: 'mildLoss', goal: 'mildlose' },
      { key: 'maintain', goal: 'maintain' },
      { key: 'mildGain', goal: 'mildgain' },
      { key: 'gain', goal: 'gain' },
    ];

    return {
      items: [
        { key: 'dailyTarget', value: target, format: 'integer', primary: true, hintKey: 'unit.kcal' },
        { key: 'maintenance', value: tdee, format: 'integer', hintKey: 'unit.kcal' },
        { key: 'weeklyTarget', value: target * 7, format: 'integer', hintKey: 'unit.kcal' },
      ],
      charts: [
        {
          type: 'bar',
          titleKey: 'calorie.chartGoals',
          format: 'decimal',
          bars: goals.map((g) => ({
            labelKey: g.key,
            value: Math.max(Math.round(tdee + (CALORIE_ADJUST[g.goal] ?? 0)), 0),
            color: g.goal === input.goal ? '#0070f3' : '#c7d2e0',
          })),
        },
      ],
    };
  },
};

// ===========================================================================
// Macro — split a daily calorie target into protein / carbs / fat grams
// ===========================================================================

export type MacroSplit = 'balanced' | 'lowcarb' | 'highprotein' | 'endurance';

export interface MacroInput {
  calories: number;
  split: MacroSplit;
}
export interface MacroResult extends EngineResult {}

const MACRO_SPLITS: Record<MacroSplit, [number, number, number]> = {
  balanced: [0.3, 0.4, 0.3],
  lowcarb: [0.4, 0.2, 0.4],
  highprotein: [0.4, 0.4, 0.2],
  endurance: [0.25, 0.55, 0.2],
};

export const macroEngine: CalculatorEngine<MacroInput, MacroResult> = {
  slug: 'macro-calculator',
  category: 'health',

  defaultInput: () => ({ calories: 2200, split: 'balanced' }),

  fields: (): EngineField[] => [
    { name: 'calories', labelKey: 'field.calories', type: 'number', defaultValue: '2200', min: 0, step: 50, suffixKey: 'kcal', span: 2 },
    {
      name: 'split', labelKey: 'field.split', type: 'select', defaultValue: 'balanced', span: 2,
      options: [
        { value: 'balanced', labelKey: 'split.balanced' },
        { value: 'lowcarb', labelKey: 'split.lowCarb' },
        { value: 'highprotein', labelKey: 'split.highProtein' },
        { value: 'endurance', labelKey: 'split.endurance' },
      ],
    },
  ],

  parseInput: (values): MacroInput => {
    const split = (['balanced', 'lowcarb', 'highprotein', 'endurance'] as const).includes(values.split as MacroSplit)
      ? (values.split as MacroSplit)
      : 'balanced';
    return { calories: num(values.calories, 0), split };
  },

  validate: (input) => {
    if (!isFiniteNumber(input.calories) || input.calories <= 0) return fail('health.caloriesRequired', { field: 'calories' });
    return ok();
  },

  compute: (input) => {
    const cal = input.calories;
    const [p, c, f] = MACRO_SPLITS[input.split] ?? MACRO_SPLITS.balanced;
    const proteinG = (cal * p) / 4;
    const carbsG = (cal * c) / 4;
    const fatG = (cal * f) / 9;

    return {
      items: [
        { key: 'protein', value: proteinG, format: 'integer', primary: true, hintKey: 'unit.grams', hintParams: { percent: Math.round(p * 100) } },
        { key: 'carbs', value: carbsG, format: 'integer', hintKey: 'unit.grams', hintParams: { percent: Math.round(c * 100) } },
        { key: 'fat', value: fatG, format: 'integer', hintKey: 'unit.grams', hintParams: { percent: Math.round(f * 100) } },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'macro.chartCalories',
          format: 'decimal',
          slices: [
            { labelKey: 'protein', value: Math.round(cal * p), color: '#0070f3' },
            { labelKey: 'carbs', value: Math.round(cal * c), color: '#f5a623' },
            { labelKey: 'fat', value: Math.round(cal * f), color: '#50e3c2' },
          ],
        },
        {
          type: 'bar',
          titleKey: 'macro.chartGrams',
          format: 'decimal',
          bars: [
            { labelKey: 'protein', value: Math.round(proteinG), color: '#0070f3' },
            { labelKey: 'carbs', value: Math.round(carbsG), color: '#f5a623' },
            { labelKey: 'fat', value: Math.round(fatG), color: '#50e3c2' },
          ],
        },
      ],
    };
  },
};

// ===========================================================================
// Water intake — daily water target from weight + exercise
// ===========================================================================

export interface WaterInput {
  unitSystem: UnitSystem;
  weightKg: number;
  weightLb: number;
  exercise: number; // minutes/day
}
export interface WaterResult extends EngineResult {}

export const waterIntakeEngine: CalculatorEngine<WaterInput, WaterResult> = {
  slug: 'water-intake-calculator',
  category: 'health',

  defaultInput: () => ({ unitSystem: 'metric', weightKg: 75, weightLb: 165, exercise: 30 }),

  fields: (): EngineField[] => [
    unitSystemField,
    { name: 'weightKg', labelKey: 'field.weight', type: 'number', defaultValue: '75', min: 10, max: 400, step: 0.5, suffixKey: 'kg', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    { name: 'weightLb', labelKey: 'field.weightLb', type: 'number', defaultValue: '165', min: 20, max: 880, step: 1, suffixKey: 'lb', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    { name: 'exercise', labelKey: 'field.exercise', type: 'number', defaultValue: '30', min: 0, max: 600, step: 5, suffixKey: 'min' },
  ],

  parseInput: (values): WaterInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    weightKg: num(values.weightKg, 75),
    weightLb: num(values.weightLb, 165),
    exercise: num(values.exercise, 30),
  }),

  validate: (input) => {
    const kg = kgFromBody({ unitSystem: input.unitSystem, weightKg: input.weightKg, weightLb: input.weightLb });
    if (!isFiniteNumber(kg) || kg <= 0) return fail('health.weightRequired');
    return ok();
  },

  compute: (input) => {
    const kg = kgFromBody({ unitSystem: input.unitSystem, weightKg: input.weightKg, weightLb: input.weightLb });
    const base = kg * 35; // ml per kg
    const exercise = (input.exercise / 30) * 350; // ~350 ml per 30 min
    const ml = base + exercise;

    const items: ResultItem[] = [
      { key: 'dailyWater', value: ml / 1000, format: 'decimal', precision: 2, primary: true, hintKey: 'unit.liters' },
      { key: 'cups', value: ml / 240, format: 'integer', hintKey: 'unit.cups' },
      { key: 'fluidOunces', value: ml / 29.5735, format: 'integer', hintKey: 'unit.floz' },
    ];

    const result: WaterResult = { items };
    if (exercise > 0) {
      result.charts = [
        {
          type: 'pie',
          titleKey: 'water.chartSources',
          format: 'decimal',
          slices: [
            { labelKey: 'bodyWeightNeed', value: Math.round(base), color: '#0070f3' },
            { labelKey: 'exerciseTopUp', value: Math.round(exercise), color: '#00dfd8' },
          ],
        },
      ];
    }
    return result;
  },
};

// ===========================================================================
// Ideal weight — Devine / Robinson / Miller / Hamwi formulas
// ===========================================================================

export interface IdealWeightInput {
  unitSystem: UnitSystem;
  sex: Sex;
  heightCm: number;
  heightFt: number;
  heightIn: number;
}
export interface IdealWeightResult extends EngineResult {}

export const idealWeightEngine: CalculatorEngine<IdealWeightInput, IdealWeightResult> = {
  slug: 'ideal-weight-calculator',
  category: 'health',

  defaultInput: () => ({ unitSystem: 'metric', sex: 'male', heightCm: 175, heightFt: 5, heightIn: 9 }),

  fields: (): EngineField[] => [
    unitSystemField,
    sexField,
    { name: 'heightCm', labelKey: 'field.height', type: 'number', defaultValue: '175', min: 50, max: 260, step: 1, suffixKey: 'cm', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    { name: 'heightFt', labelKey: 'field.heightFt', type: 'number', defaultValue: '5', min: 1, max: 8, step: 1, suffixKey: 'ft', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    { name: 'heightIn', labelKey: 'field.heightIn', type: 'number', defaultValue: '9', min: 0, max: 11, step: 1, suffixKey: 'in', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
  ],

  parseInput: (values): IdealWeightInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    sex: values.sex === 'female' ? 'female' : 'male',
    heightCm: num(values.heightCm, 175),
    heightFt: num(values.heightFt, 5),
    heightIn: num(values.heightIn, 9),
  }),

  validate: (input) => {
    const cm = cmFromBody({ unitSystem: input.unitSystem, heightCm: input.heightCm, heightFt: input.heightFt, heightIn: input.heightIn });
    if (!isFiniteNumber(cm) || cm <= 0) return fail('health.heightRequired');
    return ok();
  },

  compute: (input) => {
    const cm = cmFromBody({ unitSystem: input.unitSystem, heightCm: input.heightCm, heightFt: input.heightFt, heightIn: input.heightIn });
    const inches = cm / IN_TO_CM;
    const over60 = Math.max(inches - 60, 0);
    const male = input.sex !== 'female';

    const devine = (male ? 50 : 45.5) + 2.3 * over60;
    const robinson = (male ? 52 : 49) + (male ? 1.9 : 1.7) * over60;
    const miller = (male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * over60;
    const hamwi = (male ? 48 : 45.5) + (male ? 2.7 : 2.2) * over60;
    const avg = (devine + robinson + miller + hamwi) / 4;

    return {
      items: [
        { key: 'idealWeight', value: avg, format: 'mass', precision: 1, primary: true },
      ],
      breakdown: [
        { key: 'devine', value: devine, format: 'mass', precision: 1 },
        { key: 'robinson', value: robinson, format: 'mass', precision: 1 },
        { key: 'miller', value: miller, format: 'mass', precision: 1 },
        { key: 'hamwi', value: hamwi, format: 'mass', precision: 1 },
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// Body Fat % — U.S. Navy Method
// ---------------------------------------------------------------------------

export interface BodyFatInput {
  unitSystem: UnitSystem;
  sex: Sex;
  age: number;
  heightCm: number;
  heightFt: number;
  heightIn: number;
  weightKg: number;
  weightLb: number;
  neckCm: number;
  neckIn: number;
  waistCm: number;
  waistIn: number;
  hipCm: number;
  hipIn: number;
}
export interface BodyFatResult extends EngineResult {}

export const bodyFatEngine: CalculatorEngine<BodyFatInput, BodyFatResult> = {
  slug: 'body-fat-calculator',
  category: 'health',

  defaultInput: () => ({
    unitSystem: 'metric', sex: 'male', age: 30,
    heightCm: 175, heightFt: 5, heightIn: 9,
    weightKg: 75, weightLb: 165,
    neckCm: 38, neckIn: 15,
    waistCm: 85, waistIn: 33.5,
    hipCm: 95, hipIn: 37.5,
  }),

  fields: (): EngineField[] => [
    unitSystemField,
    sexField,
    { name: 'age', labelKey: 'field.age', type: 'number', defaultValue: '30', min: 1, max: 120, step: 1, suffixKey: 'years' },
    ...heightWeightFields,
    { name: 'neckCm', labelKey: 'field.neck', type: 'number', defaultValue: '38', min: 20, max: 80, step: 0.5, suffixKey: 'cm', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    { name: 'neckIn', labelKey: 'field.neckIn', type: 'number', defaultValue: '15', min: 8, max: 32, step: 0.25, suffixKey: 'in', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    { name: 'waistCm', labelKey: 'field.waist', type: 'number', defaultValue: '85', min: 40, max: 200, step: 0.5, suffixKey: 'cm', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    { name: 'waistIn', labelKey: 'field.waistIn', type: 'number', defaultValue: '33.5', min: 15, max: 80, step: 0.25, suffixKey: 'in', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    { name: 'hipCm', labelKey: 'field.hip', type: 'number', defaultValue: '95', min: 40, max: 200, step: 0.5, suffixKey: 'cm', showWhen: { field: 'sex', equals: ['female'] } },
    { name: 'hipIn', labelKey: 'field.hipIn', type: 'number', defaultValue: '37.5', min: 15, max: 80, step: 0.25, suffixKey: 'in', showWhen: { field: 'sex', equals: ['female'] } },
  ],

  parseInput: (values): BodyFatInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    sex: values.sex === 'female' ? 'female' : 'male',
    age: num(values.age, 30),
    heightCm: num(values.heightCm, 175),
    heightFt: num(values.heightFt, 5),
    heightIn: num(values.heightIn, 9),
    weightKg: num(values.weightKg, 75),
    weightLb: num(values.weightLb, 165),
    neckCm: num(values.neckCm, 38),
    neckIn: num(values.neckIn, 15),
    waistCm: num(values.waistCm, 85),
    waistIn: num(values.waistIn, 33.5),
    hipCm: num(values.hipCm, 95),
    hipIn: num(values.hipIn, 37.5),
  }),

  validate: (input) => {
    const heightCm = cmFromBody(input);
    const weightKg = kgFromBody(input);
    const neckCm = input.unitSystem === 'imperial' ? input.neckIn * IN_TO_CM : input.neckCm;
    const waistCm = input.unitSystem === 'imperial' ? input.waistIn * IN_TO_CM : input.waistCm;
    if (heightCm <= 0 || weightKg <= 0 || neckCm <= 0 || waistCm <= 0) return fail('health.bodyMetricsRequired');
    if (input.sex === 'male' && waistCm <= neckCm) return fail('health.waistMustBeLargerThanNeck');
    return ok();
  },

  compute: (input) => {
    const height = cmFromBody(input);
    const weight = kgFromBody(input);
    const neck = input.unitSystem === 'imperial' ? input.neckIn * IN_TO_CM : input.neckCm;
    const waist = input.unitSystem === 'imperial' ? input.waistIn * IN_TO_CM : input.waistCm;
    const hip = input.unitSystem === 'imperial' ? input.hipIn * IN_TO_CM : input.hipCm;

    let bodyFatPct = 0;
    if (input.sex === 'female') {
      const denom = 1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height);
      bodyFatPct = 495 / denom - 450;
    } else {
      const denom = 1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height);
      bodyFatPct = 495 / denom - 450;
    }

    bodyFatPct = Math.min(60, Math.max(2, bodyFatPct));
    const fatMassKg = weight * (bodyFatPct / 100);
    const leanMassKg = weight - fatMassKg;

    return {
      items: [
        { key: 'bodyFat', value: bodyFatPct, format: 'decimal', precision: 1, primary: true, hintKey: 'unit.percent' },
        { key: 'fatMass', value: fatMassKg, format: 'mass', precision: 1 },
        { key: 'leanMass', value: leanMassKg, format: 'mass', precision: 1 },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'bodyFat.chartComposition',
          format: 'decimal',
          slices: [
            { labelKey: 'leanMass', value: Math.round(leanMassKg * 10) / 10, color: '#0070f3' },
            { labelKey: 'fatMass', value: Math.round(fatMassKg * 10) / 10, color: '#f5a623' },
          ],
        },
      ],
    };
  },
};

// ===========================================================================
// Lean Body Mass — Boer / James / Hume formulas
// ===========================================================================

export interface LeanBodyMassInput {
  unitSystem: UnitSystem;
  sex: Sex;
  heightCm: number;
  heightFt: number;
  heightIn: number;
  weightKg: number;
  weightLb: number;
}
export interface LeanBodyMassResult extends EngineResult {}

export const leanBodyMassEngine: CalculatorEngine<LeanBodyMassInput, LeanBodyMassResult> = {
  slug: 'lean-body-mass-calculator',
  category: 'health',

  defaultInput: () => ({
    unitSystem: 'metric', sex: 'male',
    heightCm: 175, heightFt: 5, heightIn: 9,
    weightKg: 75, weightLb: 165,
  }),

  fields: (): EngineField[] => [
    unitSystemField,
    sexField,
    ...heightWeightFields,
  ],

  parseInput: (values): LeanBodyMassInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    sex: values.sex === 'female' ? 'female' : 'male',
    heightCm: num(values.heightCm, 175),
    heightFt: num(values.heightFt, 5),
    heightIn: num(values.heightIn, 9),
    weightKg: num(values.weightKg, 75),
    weightLb: num(values.weightLb, 165),
  }),

  validate: (input) => {
    const h = cmFromBody(input);
    const w = kgFromBody(input);
    if (h <= 0 || w <= 0) return fail('health.bodyMetricsRequired');
    return ok();
  },

  compute: (input) => {
    const h = cmFromBody(input);
    const w = kgFromBody(input);
    const male = input.sex !== 'female';

    const boer = male ? 0.407 * w + 0.267 * h - 19.2 : 0.252 * w + 0.473 * h - 48.3;
    const james = male ? 1.1 * w - 128 * Math.pow(w / h, 2) : 1.07 * w - 148 * Math.pow(w / h, 2);
    const hume = male ? 0.32810 * w + 0.33929 * h - 29.5336 : 0.29569 * w + 0.41813 * h - 43.2933;

    const avgLbm = (boer + james + hume) / 3;
    const fatMass = w - avgLbm;
    const leanPct = (avgLbm / w) * 100;

    return {
      items: [
        { key: 'leanBodyMass', value: avgLbm, format: 'mass', precision: 1, primary: true },
        { key: 'fatMass', value: fatMass, format: 'mass', precision: 1 },
        { key: 'leanMassPercent', value: leanPct, format: 'decimal', precision: 1, hintKey: 'unit.percent' },
      ],
      breakdown: [
        { key: 'boer', value: boer, format: 'mass', precision: 1 },
        { key: 'james', value: james, format: 'mass', precision: 1 },
        { key: 'hume', value: hume, format: 'mass', precision: 1 },
      ],
    };
  },
};

// ===========================================================================
// One Rep Max — Epley / Brzycki / Lander / Lombardi formulas
// ===========================================================================

export interface OneRepMaxInput {
  unitSystem: UnitSystem;
  weightLiftedKg: number;
  weightLiftedLb: number;
  reps: number;
}
export interface OneRepMaxResult extends EngineResult {}

export const oneRepMaxEngine: CalculatorEngine<OneRepMaxInput, OneRepMaxResult> = {
  slug: 'one-rep-max-calculator',
  category: 'health',

  defaultInput: () => ({ unitSystem: 'metric', weightLiftedKg: 100, weightLiftedLb: 225, reps: 5 }),

  fields: (): EngineField[] => [
    unitSystemField,
    { name: 'weightLiftedKg', labelKey: 'field.weightLifted', type: 'number', defaultValue: '100', min: 1, max: 1000, step: 0.5, suffixKey: 'kg', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    { name: 'weightLiftedLb', labelKey: 'field.weightLiftedLb', type: 'number', defaultValue: '225', min: 1, max: 2000, step: 1, suffixKey: 'lb', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    { name: 'reps', labelKey: 'field.reps', type: 'number', defaultValue: '5', min: 1, max: 30, step: 1, span: 1 },
  ],

  parseInput: (values): OneRepMaxInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    weightLiftedKg: num(values.weightLiftedKg, 100),
    weightLiftedLb: num(values.weightLiftedLb, 225),
    reps: num(values.reps, 5),
  }),

  validate: (input) => {
    const w = input.unitSystem === 'imperial' ? lbToKg(input.weightLiftedLb) : input.weightLiftedKg;
    if (w <= 0 || input.reps <= 0) return fail('health.weightAndRepsRequired');
    return ok();
  },

  compute: (input) => {
    const w = input.unitSystem === 'imperial' ? lbToKg(input.weightLiftedLb) : input.weightLiftedKg;
    const r = input.reps;

    const epley = r === 1 ? w : w * (1 + r / 30);
    const brzycki = r === 1 ? w : w * (36 / (37 - r));
    const lander = r === 1 ? w : (100 * w) / (101.3 - 2.67123 * r);
    const lombardi = r === 1 ? w : w * Math.pow(r, 0.10);

    const avg1RM = (epley + brzycki + lander + lombardi) / 4;

    const p95 = avg1RM * 0.95;
    const p90 = avg1RM * 0.90;
    const p85 = avg1RM * 0.85;
    const p80 = avg1RM * 0.80;
    const p75 = avg1RM * 0.75;
    const p70 = avg1RM * 0.70;

    return {
      items: [
        { key: 'oneRepMax', value: avg1RM, format: 'mass', precision: 1, primary: true },
        { key: 'epley', value: epley, format: 'mass', precision: 1 },
        { key: 'brzycki', value: brzycki, format: 'mass', precision: 1 },
      ],
      breakdown: [
        { key: 'rep95', value: p95, format: 'mass', precision: 1 },
        { key: 'rep90', value: p90, format: 'mass', precision: 1 },
        { key: 'rep85', value: p85, format: 'mass', precision: 1 },
        { key: 'rep80', value: p80, format: 'mass', precision: 1 },
        { key: 'rep75', value: p75, format: 'mass', precision: 1 },
        { key: 'rep70', value: p70, format: 'mass', precision: 1 },
      ],
    };
  },
};

// ===========================================================================
// Pace Calculator — Time, Distance, Pace & Speed
// ===========================================================================

export interface PaceInput {
  unitSystem: UnitSystem;
  hours: number;
  minutes: number;
  seconds: number;
  distance: number;
}
export interface PaceResult extends EngineResult {}

export const paceEngine: CalculatorEngine<PaceInput, PaceResult> = {
  slug: 'pace-calculator',
  category: 'health',

  defaultInput: () => ({ unitSystem: 'metric', hours: 0, minutes: 25, seconds: 0, distance: 5 }),

  fields: (): EngineField[] => [
    unitSystemField,
    { name: 'hours', labelKey: 'field.hours', type: 'number', defaultValue: '0', min: 0, max: 99, step: 1 },
    { name: 'minutes', labelKey: 'field.minutes', type: 'number', defaultValue: '25', min: 0, max: 59, step: 1 },
    { name: 'seconds', labelKey: 'field.seconds', type: 'number', defaultValue: '0', min: 0, max: 59, step: 1 },
    { name: 'distance', labelKey: 'field.distance', type: 'number', defaultValue: '5', min: 0.1, max: 1000, step: 0.1, span: 2 },
  ],

  parseInput: (values): PaceInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    hours: num(values.hours, 0),
    minutes: num(values.minutes, 25),
    seconds: num(values.seconds, 0),
    distance: num(values.distance, 5),
  }),

  validate: (input) => {
    const totalSec = input.hours * 3600 + input.minutes * 60 + input.seconds;
    if (totalSec <= 0 || input.distance <= 0) return fail('health.timeAndDistanceRequired');
    return ok();
  },

  compute: (input) => {
    const totalSec = input.hours * 3600 + input.minutes * 60 + input.seconds;
    const dist = input.distance;

    const secPerUnit = totalSec / dist;
    const paceMin = Math.floor(secPerUnit / 60);
    const paceSec = Math.round(secPerUnit % 60);
    const paceFormatted = paceMin + (paceSec / 100);

    const km = input.unitSystem === 'imperial' ? dist * 1.60934 : dist;
    const speedKmH = km / (totalSec / 3600);
    const speedMph = speedKmH / 1.60934;

    return {
      items: [
        { key: 'pace', value: paceFormatted, format: 'decimal', precision: 2, primary: true },
        { key: 'speedKmH', value: speedKmH, format: 'decimal', precision: 2 },
        { key: 'speedMph', value: speedMph, format: 'decimal', precision: 2 },
      ],
      breakdown: [
        { key: 'split1km', value: totalSec / (km || 1) / 60, format: 'decimal', precision: 2 },
        { key: 'split5km', value: (totalSec / (km || 1) / 60) * 5, format: 'decimal', precision: 2 },
        { key: 'split10km', value: (totalSec / (km || 1) / 60) * 10, format: 'decimal', precision: 2 },
      ],
    };
  },
};

// ===========================================================================
// Running Pace — Target Pace & Race Finish Time Predictor
// ===========================================================================

export interface RunningPaceInput {
  unitSystem: UnitSystem;
  targetDistance: '5k' | '10k' | 'halfMarathon' | 'marathon';
  hours: number;
  minutes: number;
  seconds: number;
}
export interface RunningPaceResult extends EngineResult {}

const RACE_DISTANCES_KM: Record<string, number> = {
  '5k': 5,
  '10k': 10,
  halfMarathon: 21.0975,
  marathon: 42.195,
};

export const runningPaceEngine: CalculatorEngine<RunningPaceInput, RunningPaceResult> = {
  slug: 'running-pace-calculator',
  category: 'health',

  defaultInput: () => ({ unitSystem: 'metric', targetDistance: '5k', hours: 0, minutes: 25, seconds: 0 }),

  fields: (): EngineField[] => [
    unitSystemField,
    {
      name: 'targetDistance', labelKey: 'field.targetDistance', type: 'select', defaultValue: '5k', span: 2,
      options: [
        { value: '5k', labelKey: 'race.5k' },
        { value: '10k', labelKey: 'race.10k' },
        { value: 'halfMarathon', labelKey: 'race.halfMarathon' },
        { value: 'marathon', labelKey: 'race.marathon' },
      ],
    },
    { name: 'hours', labelKey: 'field.hours', type: 'number', defaultValue: '0', min: 0, max: 99, step: 1 },
    { name: 'minutes', labelKey: 'field.minutes', type: 'number', defaultValue: '25', min: 0, max: 59, step: 1 },
    { name: 'seconds', labelKey: 'field.seconds', type: 'number', defaultValue: '0', min: 0, max: 59, step: 1 },
  ],

  parseInput: (values): RunningPaceInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    targetDistance: (['5k', '10k', 'halfMarathon', 'marathon'].includes(values.targetDistance)
      ? values.targetDistance
      : '5k') as any,
    hours: num(values.hours, 0),
    minutes: num(values.minutes, 25),
    seconds: num(values.seconds, 0),
  }),

  validate: (input) => {
    const totalSec = input.hours * 3600 + input.minutes * 60 + input.seconds;
    if (totalSec <= 0) return fail('health.timeRequired');
    return ok();
  },

  compute: (input) => {
    const totalSec = input.hours * 3600 + input.minutes * 60 + input.seconds;
    const distKm = RACE_DISTANCES_KM[input.targetDistance] ?? 5;

    const secPerKm = totalSec / distKm;
    const paceMin = Math.floor(secPerKm / 60);
    const paceSec = Math.round(secPerKm % 60);
    const paceKmFormatted = paceMin + (paceSec / 100);

    // Riegel race time predictor formula: T2 = T1 * (D2 / D1)^1.06
    const predictSec = (targetKm: number) => totalSec * Math.pow(targetKm / distKm, 1.06);

    const t5k = predictSec(5) / 60;
    const t10k = predictSec(10) / 60;
    const tHalf = predictSec(21.0975) / 60;
    const tMar = predictSec(42.195) / 60;

    return {
      items: [
        { key: 'targetPace', value: paceKmFormatted, format: 'decimal', precision: 2, primary: true },
        { key: 'predicted5k', value: t5k, format: 'decimal', precision: 1 },
        { key: 'predicted10k', value: t10k, format: 'decimal', precision: 1 },
      ],
      breakdown: [
        { key: 'predictedHalfMarathon', value: tHalf, format: 'decimal', precision: 1 },
        { key: 'predictedMarathon', value: tMar, format: 'decimal', precision: 1 },
      ],
    };
  },
};

// ===========================================================================
// Heart Rate Zone — Tanaka & Karvonen Training Zones
// ===========================================================================

export interface HeartRateZoneInput {
  age: number;
  restingHeartRate: number;
}
export interface HeartRateZoneResult extends EngineResult {}

export const heartRateZoneEngine: CalculatorEngine<HeartRateZoneInput, HeartRateZoneResult> = {
  slug: 'heart-rate-zone-calculator',
  category: 'health',

  defaultInput: () => ({ age: 30, restingHeartRate: 60 }),

  fields: (): EngineField[] => [
    { name: 'age', labelKey: 'field.age', type: 'number', defaultValue: '30', min: 10, max: 100, step: 1, suffixKey: 'years' },
    { name: 'restingHeartRate', labelKey: 'field.restingHeartRate', type: 'number', defaultValue: '60', min: 30, max: 120, step: 1, suffixKey: 'bpm' },
  ],

  parseInput: (values): HeartRateZoneInput => ({
    age: num(values.age, 30),
    restingHeartRate: num(values.restingHeartRate, 60),
  }),

  validate: (input) => {
    if (input.age <= 0 || input.restingHeartRate <= 0) return fail('health.heartRateMetricsRequired');
    return ok();
  },

  compute: (input) => {
    const maxHr = Math.round(208 - 0.7 * input.age);
    const hrr = maxHr - input.restingHeartRate;

    const z1Low = Math.round(input.restingHeartRate + hrr * 0.50);
    const z1High = Math.round(input.restingHeartRate + hrr * 0.60);

    const z2Low = z1High;
    const z2High = Math.round(input.restingHeartRate + hrr * 0.70);

    const z3Low = z2High;
    const z3High = Math.round(input.restingHeartRate + hrr * 0.80);

    const z4Low = z3High;
    const z4High = Math.round(input.restingHeartRate + hrr * 0.90);

    const z5Low = z4High;
    const z5High = maxHr;

    return {
      items: [
        { key: 'maxHeartRate', value: maxHr, format: 'integer', primary: true, hintKey: 'unit.bpm' },
        { key: 'heartRateReserve', value: hrr, format: 'integer', hintKey: 'unit.bpm' },
      ],
      breakdown: [
        { key: 'zone1Warmup', value: z1High, format: 'integer', hintKey: 'unit.bpm' },
        { key: 'zone2FatBurn', value: z2High, format: 'integer', hintKey: 'unit.bpm' },
        { key: 'zone3Aerobic', value: z3High, format: 'integer', hintKey: 'unit.bpm' },
        { key: 'zone4Anaerobic', value: z4High, format: 'integer', hintKey: 'unit.bpm' },
        { key: 'zone5MaxEffort', value: z5High, format: 'integer', hintKey: 'unit.bpm' },
      ],
      charts: [
        {
          type: 'bar',
          titleKey: 'heartRate.chartZones',
          format: 'integer',
          bars: [
            { labelKey: 'zone1', value: z1High, color: '#50e3c2' },
            { labelKey: 'zone2', value: z2High, color: '#0070f3' },
            { labelKey: 'zone3', value: z3High, color: '#f5a623' },
            { labelKey: 'zone4', value: z4High, color: '#ff0080' },
            { labelKey: 'zone5', value: z5High, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};

// ===========================================================================
// Pregnancy Due Date — Naegele's Rule & Milestone Timeline
// ===========================================================================

export interface PregnancyDueDateInput {
  cycleLength: number;
  daysAgoLmp: number;
}
export interface PregnancyDueDateResult extends EngineResult {}

export const pregnancyDueDateEngine: CalculatorEngine<PregnancyDueDateInput, PregnancyDueDateResult> = {
  slug: 'pregnancy-due-date-calculator',
  category: 'health',

  defaultInput: () => ({ cycleLength: 28, daysAgoLmp: 70 }),

  fields: (): EngineField[] => [
    { name: 'cycleLength', labelKey: 'field.cycleLength', type: 'number', defaultValue: '28', min: 20, max: 45, step: 1, suffixKey: 'days' },
    { name: 'daysAgoLmp', labelKey: 'field.daysAgoLmp', type: 'number', defaultValue: '70', min: 0, max: 300, step: 1, suffixKey: 'days' },
  ],

  parseInput: (values): PregnancyDueDateInput => ({
    cycleLength: num(values.cycleLength, 28),
    daysAgoLmp: num(values.daysAgoLmp, 70),
  }),

  validate: (input) => {
    if (input.daysAgoLmp < 0 || input.cycleLength <= 0) return fail('health.lmpRequired');
    return ok();
  },

  compute: (input) => {
    const totalPregnancyDays = 280 + (input.cycleLength - 28);
    const currentGestationalDays = input.daysAgoLmp;
    const currentWeeks = Math.floor(currentGestationalDays / 7);
    const remainingDays = Math.max(0, totalPregnancyDays - currentGestationalDays);

    let trimester = 1;
    if (currentWeeks >= 28) trimester = 3;
    else if (currentWeeks >= 13) trimester = 2;

    return {
      items: [
        { key: 'currentWeeks', value: currentWeeks, format: 'integer', primary: true, hintKey: 'unit.weeks' },
        { key: 'daysRemaining', value: remainingDays, format: 'integer', hintKey: 'unit.days' },
        { key: 'trimester', value: trimester, format: 'integer' },
      ],
      breakdown: [
        { key: 'conceptionDay', value: 14 + (input.cycleLength - 28), format: 'integer', hintKey: 'unit.days' },
        { key: 'firstTrimesterEnd', value: 84, format: 'integer', hintKey: 'unit.days' },
        { key: 'secondTrimesterEnd', value: 189, format: 'integer', hintKey: 'unit.days' },
      ],
    };
  },
};

// ===========================================================================
// Ovulation Calculator — Fertile Window & Cycle Tracking
// ===========================================================================

export interface OvulationInput {
  cycleLength: number;
  daysAgoLmp: number;
}
export interface OvulationResult extends EngineResult {}

export const ovulationEngine: CalculatorEngine<OvulationInput, OvulationResult> = {
  slug: 'ovulation-calculator',
  category: 'health',

  defaultInput: () => ({ cycleLength: 28, daysAgoLmp: 14 }),

  fields: (): EngineField[] => [
    { name: 'cycleLength', labelKey: 'field.cycleLength', type: 'number', defaultValue: '28', min: 20, max: 45, step: 1, suffixKey: 'days' },
    { name: 'daysAgoLmp', labelKey: 'field.daysAgoLmp', type: 'number', defaultValue: '14', min: 0, max: 60, step: 1, suffixKey: 'days' },
  ],

  parseInput: (values): OvulationInput => ({
    cycleLength: num(values.cycleLength, 28),
    daysAgoLmp: num(values.daysAgoLmp, 14),
  }),

  validate: (input) => {
    if (input.cycleLength <= 0 || input.daysAgoLmp < 0) return fail('health.cycleMetricsRequired');
    return ok();
  },

  compute: (input) => {
    const ovulationCycleDay = input.cycleLength - 14;
    const fertileStartDay = ovulationCycleDay - 5;
    const fertileEndDay = ovulationCycleDay + 1;

    const daysUntilOvulation = ovulationCycleDay - input.daysAgoLmp;

    return {
      items: [
        { key: 'ovulationDay', value: ovulationCycleDay, format: 'integer', primary: true, hintKey: 'unit.cycleDay' },
        { key: 'fertileStart', value: fertileStartDay, format: 'integer', hintKey: 'unit.cycleDay' },
        { key: 'fertileEnd', value: fertileEndDay, format: 'integer', hintKey: 'unit.cycleDay' },
      ],
      breakdown: [
        { key: 'nextPeriodDay', value: input.cycleLength, format: 'integer', hintKey: 'unit.cycleDay' },
        { key: 'daysUntilOvulation', value: daysUntilOvulation, format: 'integer', hintKey: 'unit.days' },
      ],
    };
  },
};

// ===========================================================================
// Protein Intake — Daily Target & Meal Distribution
// ===========================================================================

export interface ProteinIntakeInput {
  unitSystem: UnitSystem;
  weightKg: number;
  weightLb: number;
  goal: 'maintain' | 'fatLoss' | 'muscleGain' | 'endurance';
}
export interface ProteinIntakeResult extends EngineResult {}

const PROTEIN_MULTIPLIERS: Record<string, number> = {
  maintain: 1.4,
  fatLoss: 2.0,
  muscleGain: 1.8,
  endurance: 1.3,
};

export const proteinIntakeEngine: CalculatorEngine<ProteinIntakeInput, ProteinIntakeResult> = {
  slug: 'protein-intake-calculator',
  category: 'health',

  defaultInput: () => ({ unitSystem: 'metric', weightKg: 75, weightLb: 165, goal: 'muscleGain' }),

  fields: (): EngineField[] => [
    unitSystemField,
    { name: 'weightKg', labelKey: 'field.weight', type: 'number', defaultValue: '75', min: 20, max: 400, step: 0.5, suffixKey: 'kg', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    { name: 'weightLb', labelKey: 'field.weightLb', type: 'number', defaultValue: '165', min: 40, max: 880, step: 1, suffixKey: 'lb', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    {
      name: 'goal', labelKey: 'field.goal', type: 'select', defaultValue: 'muscleGain', span: 2,
      options: [
        { value: 'maintain', labelKey: 'proteinGoal.maintain' },
        { value: 'fatLoss', labelKey: 'proteinGoal.fatLoss' },
        { value: 'muscleGain', labelKey: 'proteinGoal.muscleGain' },
        { value: 'endurance', labelKey: 'proteinGoal.endurance' },
      ],
    },
  ],

  parseInput: (values): ProteinIntakeInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    weightKg: num(values.weightKg, 75),
    weightLb: num(values.weightLb, 165),
    goal: (['maintain', 'fatLoss', 'muscleGain', 'endurance'].includes(values.goal)
      ? values.goal
      : 'muscleGain') as any,
  }),

  validate: (input) => {
    const w = kgFromBody(input);
    if (w <= 0) return fail('health.weightRequired');
    return ok();
  },

  compute: (input) => {
    const weightKg = kgFromBody(input);
    const mult = PROTEIN_MULTIPLIERS[input.goal] ?? 1.6;
    const proteinGrams = weightKg * mult;
    const proteinCalories = proteinGrams * 4;
    const perMeal = proteinGrams / 4;

    return {
      items: [
        { key: 'dailyProtein', value: proteinGrams, format: 'integer', primary: true, hintKey: 'unit.grams' },
        { key: 'proteinCalories', value: proteinCalories, format: 'integer', hintKey: 'unit.kcal' },
        { key: 'perMeal', value: perMeal, format: 'integer', hintKey: 'unit.grams' },
      ],
      breakdown: [
        { key: 'sedentaryBase', value: weightKg * 0.8, format: 'integer', hintKey: 'unit.grams' },
        { key: 'athleteTarget', value: weightKg * 2.2, format: 'integer', hintKey: 'unit.grams' },
      ],
    };
  },
};

// ===========================================================================
// Creatinine Clearance — Cockcroft-Gault & eGFR
// ===========================================================================

export interface CreatinineClearanceInput {
  unitSystem: UnitSystem;
  sex: Sex;
  age: number;
  weightKg: number;
  weightLb: number;
  serumCreatinine: number;
}
export interface CreatinineClearanceResult extends EngineResult {}

export const creatinineClearanceEngine: CalculatorEngine<CreatinineClearanceInput, CreatinineClearanceResult> = {
  slug: 'creatinine-clearance-calculator',
  category: 'health',

  defaultInput: () => ({ unitSystem: 'metric', sex: 'male', age: 50, weightKg: 70, weightLb: 154, serumCreatinine: 1.0 }),

  fields: (): EngineField[] => [
    unitSystemField,
    sexField,
    { name: 'age', labelKey: 'field.age', type: 'number', defaultValue: '50', min: 18, max: 120, step: 1, suffixKey: 'years' },
    { name: 'weightKg', labelKey: 'field.weight', type: 'number', defaultValue: '70', min: 20, max: 300, step: 0.5, suffixKey: 'kg', showWhen: { field: 'unitSystem', equals: ['metric'] } },
    { name: 'weightLb', labelKey: 'field.weightLb', type: 'number', defaultValue: '154', min: 40, max: 660, step: 1, suffixKey: 'lb', showWhen: { field: 'unitSystem', equals: ['imperial'] } },
    { name: 'serumCreatinine', labelKey: 'field.serumCreatinine', type: 'number', defaultValue: '1.0', min: 0.1, max: 20, step: 0.1, suffixKey: 'mgdl', span: 2 },
  ],

  parseInput: (values): CreatinineClearanceInput => ({
    unitSystem: values.unitSystem === 'imperial' ? 'imperial' : 'metric',
    sex: values.sex === 'female' ? 'female' : 'male',
    age: num(values.age, 50),
    weightKg: num(values.weightKg, 70),
    weightLb: num(values.weightLb, 154),
    serumCreatinine: num(values.serumCreatinine, 1.0),
  }),

  validate: (input) => {
    const w = kgFromBody(input);
    if (input.age <= 0 || w <= 0 || input.serumCreatinine <= 0) return fail('health.creatinineMetricsRequired');
    return ok();
  },

  compute: (input) => {
    const w = kgFromBody(input);
    const scr = input.serumCreatinine;
    const femaleMult = input.sex === 'female' ? 0.85 : 1.0;

    const crcl = (((140 - input.age) * w) / (72 * scr)) * femaleMult;
    const egfr = crcl * 0.95; // Approximate CKD-EPI correlated value

    return {
      items: [
        { key: 'creatinineClearance', value: crcl, format: 'decimal', precision: 1, primary: true, hintKey: 'unit.mlMin' },
        { key: 'egfr', value: egfr, format: 'decimal', precision: 1, hintKey: 'unit.mlMin173m2' },
      ],
      breakdown: [
        { key: 'stage1Normal', value: 90, format: 'integer', hintKey: 'unit.mlMin' },
        { key: 'stage2Mild', value: 60, format: 'integer', hintKey: 'unit.mlMin' },
        { key: 'stage3Moderate', value: 30, format: 'integer', hintKey: 'unit.mlMin' },
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// Registry export
// ---------------------------------------------------------------------------

export const healthEngines: AnyEngine[] = [
  bmrEngine as AnyEngine,
  tdeeEngine as AnyEngine,
  calorieEngine as AnyEngine,
  macroEngine as AnyEngine,
  waterIntakeEngine as AnyEngine,
  idealWeightEngine as AnyEngine,
  bodyFatEngine as AnyEngine,
  leanBodyMassEngine as AnyEngine,
  oneRepMaxEngine as AnyEngine,
  paceEngine as AnyEngine,
  runningPaceEngine as AnyEngine,
  heartRateZoneEngine as AnyEngine,
  pregnancyDueDateEngine as AnyEngine,
  ovulationEngine as AnyEngine,
  proteinIntakeEngine as AnyEngine,
  creatinineClearanceEngine as AnyEngine,
];

