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
// Registry export
// ---------------------------------------------------------------------------

export const healthEngines: AnyEngine[] = [
  bmrEngine as AnyEngine,
  tdeeEngine as AnyEngine,
  calorieEngine as AnyEngine,
  macroEngine as AnyEngine,
  waterIntakeEngine as AnyEngine,
  idealWeightEngine as AnyEngine,
];
