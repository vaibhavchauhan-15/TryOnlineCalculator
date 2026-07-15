import type { Calculator, ResultItem, Values } from '../types';
import { num, number, fixed } from '../format';

const LB_TO_KG = 0.45359237;
const IN_TO_CM = 2.54;

function kgFrom(v: Values): number {
  if (v.unit === 'imperial') return num(v.weightLb, 0) * LB_TO_KG;
  return num(v.weightKg, 0);
}
function cmFrom(v: Values): number {
  if (v.unit === 'imperial') return (num(v.heightFt, 0) * 12 + num(v.heightIn, 0)) * IN_TO_CM;
  return num(v.heightCm, 0);
}

const unitField = {
  name: 'unit',
  label: 'Units',
  type: 'radio' as const,
  default: 'metric',
  options: [
    { label: 'Metric (cm, kg)', value: 'metric' },
    { label: 'Imperial (ft, lb)', value: 'imperial' },
  ],
  span: 2 as const,
};

const heightWeightFields = [
  { name: 'heightCm', label: 'Height', type: 'number' as const, suffix: 'cm', default: 175, min: 0, step: 0.1, showWhen: { field: 'unit', equals: ['metric'] } },
  { name: 'weightKg', label: 'Weight', type: 'number' as const, suffix: 'kg', default: 75, min: 0, step: 0.1, showWhen: { field: 'unit', equals: ['metric'] } },
  { name: 'heightFt', label: 'Height (feet)', type: 'number' as const, suffix: 'ft', default: 5, min: 0, step: 1, showWhen: { field: 'unit', equals: ['imperial'] } },
  { name: 'heightIn', label: 'Height (inches)', type: 'number' as const, suffix: 'in', default: 9, min: 0, step: 1, showWhen: { field: 'unit', equals: ['imperial'] } },
  { name: 'weightLb', label: 'Weight', type: 'number' as const, suffix: 'lb', default: 165, min: 0, step: 0.1, showWhen: { field: 'unit', equals: ['imperial'] } },
];

function bmiCategory(bmi: number): { label: string; tone: 'success' | 'warning' | 'error' | 'default' } {
  if (bmi < 18.5) return { label: 'Underweight', tone: 'warning' };
  if (bmi < 25) return { label: 'Normal weight', tone: 'success' };
  if (bmi < 30) return { label: 'Overweight', tone: 'warning' };
  return { label: 'Obese', tone: 'error' };
}

const activityField = {
  name: 'activity',
  label: 'Activity level',
  type: 'select' as const,
  default: '1.55',
  span: 2 as const,
  options: [
    { label: 'Sedentary (little or no exercise)', value: '1.2' },
    { label: 'Lightly active (1–3 days/week)', value: '1.375' },
    { label: 'Moderately active (3–5 days/week)', value: '1.55' },
    { label: 'Very active (6–7 days/week)', value: '1.725' },
    { label: 'Extra active (physical job / 2× training)', value: '1.9' },
  ],
};

const genderField = {
  name: 'gender',
  label: 'Sex',
  type: 'radio' as const,
  default: 'male',
  options: [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ],
};

function mifflinBmr(v: Values): number {
  const kg = kgFrom(v);
  const cm = cmFrom(v);
  const age = num(v.age, 0);
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return v.gender === 'female' ? base - 161 : base + 5;
}

export const healthCalculators: Calculator[] = [
  /* --------------------------------------------------------------------- BMI */
  {
    slug: 'bmi-calculator',
    category: 'health',
    title: 'BMI Calculator',
    description: 'Calculate your Body Mass Index with age and sex for a clearer, more personal reading of your weight.',
    intro: 'BMI relates your weight to your height. Add your age and sex and we also estimate your body-fat percentage, then plot the result on a visual scale so you can see exactly where you land.',
    keywords: ['bmi calculator', 'body mass index', 'healthy weight', 'body fat percentage', 'bmi with age'],
    popular: true,
    inputs: [
      unitField,
      genderField,
      { name: 'age', label: 'Age', type: 'number', suffix: 'yrs', default: 30, min: 2, max: 120, step: 1 },
      ...heightWeightFields,
    ],
    compute: (v) => {
      const kg = kgFrom(v);
      const cm = cmFrom(v);
      if (kg <= 0 || cm <= 0) return { results: [], error: 'Enter a valid height and weight.' };
      const m = cm / 100;
      const bmi = kg / (m * m);
      const cat = bmiCategory(bmi);
      const lowKg = 18.5 * m * m;
      const highKg = 24.9 * m * m;
      const toDisplay = (k: number) => (v.unit === 'imperial' ? `${fixed(k / LB_TO_KG, 1)} lb` : `${fixed(k, 1)} kg`);

      const results: ResultItem[] = [
        { label: 'Your BMI', value: fixed(bmi, 1), primary: true, hint: cat.label, tone: cat.tone },
        { label: 'Category', value: cat.label, tone: cat.tone },
        { label: 'Healthy weight range', value: `${toDisplay(lowKg)} – ${toDisplay(highKg)}` },
      ];

      // Body-fat estimate (Deurenberg): uses BMI together with age + sex, so a
      // 25-year-old and a 60-year-old at the same BMI get different readings.
      const age = num(v.age, 0);
      if (age >= 15) {
        const sex = v.gender === 'female' ? 0 : 1;
        const bodyFat = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4;
        const clamped = Math.min(60, Math.max(2, bodyFat));
        results.push({ label: 'Estimated body fat', value: `${fixed(clamped, 1)}%`, hint: 'Deurenberg estimate for adults', tone: 'default' });
      }

      // How far the current weight is from the healthy range.
      if (kg < lowKg) {
        results.push({ label: 'To reach healthy range', value: `Gain ${toDisplay(lowKg - kg)}`, tone: 'warning' });
      } else if (kg > highKg) {
        results.push({ label: 'To reach healthy range', value: `Lose ${toDisplay(kg - highKg)}`, tone: 'warning' });
      }

      return {
        results,
        charts: [
          {
            type: 'gauge',
            title: 'Where your BMI falls',
            value: bmi,
            valueLabel: fixed(bmi, 1),
            valueCaption: cat.label,
            min: 15,
            max: 40,
            segments: [
              { from: 15, to: 18.5, label: 'Under', color: '#47a3ff' },
              { from: 18.5, to: 25, label: 'Healthy', color: '#50e3c2' },
              { from: 25, to: 30, label: 'Over', color: '#f5a623' },
              { from: 30, to: 40, label: 'Obese', color: '#ee0000' },
            ],
          },
        ],
      };
    },
    formulaItems: [
      { name: 'BMI (metric)', expr: 'BMI = weight(kg) / height(m)²' },
      { name: 'BMI (imperial)', expr: 'BMI = 703 · weight(lb) / height(in)²' },
      { name: 'Body fat % (Deurenberg)', expr: 'BF% = 1.2·BMI + 0.23·age − 10.8·sex − 5.4', desc: 'sex = 1 for male, 0 for female (adult estimate).' },
    ],
    howto: [
      'Pick metric or imperial units.',
      'Enter your sex and age for a more personal reading.',
      'Enter your height and weight.',
      'Read your BMI, body-fat estimate and category on the scale.',
    ],
    faq: [
      { q: 'Why does the calculator ask for age and sex?', a: 'BMI itself only uses height and weight, but age and sex let us estimate your body-fat percentage and interpret the number more accurately. At the same BMI, body fat tends to be higher with age and higher for women than men.' },
      { q: 'Is BMI accurate for everyone?', a: 'BMI is a population screen, not a diagnosis. It can overestimate body fat in muscular people and underestimate it in older adults. The body-fat estimate helps, but treat both as a starting point.' },
      { q: 'What is a healthy BMI?', a: 'For most adults a BMI between 18.5 and 24.9 is considered the healthy range.' },
    ],
    related: ['bmr-calculator', 'ideal-weight-calculator', 'calorie-calculator', 'tdee-calculator'],
  },

  /* --------------------------------------------------------------------- BMR */
  {
    slug: 'bmr-calculator',
    category: 'health',
    title: 'BMR Calculator',
    description: 'Estimate your Basal Metabolic Rate — the calories your body burns at complete rest.',
    intro: 'BMR is the energy you would burn lying in bed all day. It uses the accurate Mifflin-St Jeor equation.',
    keywords: ['bmr calculator', 'basal metabolic rate', 'resting calories'],
    inputs: [unitField, genderField, { name: 'age', label: 'Age', type: 'number', suffix: 'yrs', default: 30, min: 1, max: 120, step: 1 }, ...heightWeightFields],
    compute: (v) => {
      const bmr = mifflinBmr(v);
      if (!Number.isFinite(bmr) || bmr <= 0) return { results: [], error: 'Enter valid age, height and weight.' };
      return {
        results: [
          { label: 'BMR', value: `${number(bmr, 0)} cal/day`, primary: true, hint: 'Calories burned at rest' },
        ],
        breakdown: [
          { label: 'Sedentary (×1.2)', value: `${number(bmr * 1.2, 0)} cal/day` },
          { label: 'Moderately active (×1.55)', value: `${number(bmr * 1.55, 0)} cal/day` },
          { label: 'Very active (×1.725)', value: `${number(bmr * 1.725, 0)} cal/day` },
        ],
      };
    },
    formulaItems: [
      { name: 'Mifflin-St Jeor (men)', expr: 'BMR = 10·kg + 6.25·cm − 5·age + 5' },
      { name: 'Mifflin-St Jeor (women)', expr: 'BMR = 10·kg + 6.25·cm − 5·age − 161' },
    ],
    faq: [
      { q: 'BMR vs TDEE?', a: 'BMR is calories burned at complete rest. TDEE multiplies BMR by an activity factor to estimate everything you burn in a day.' },
    ],
    related: ['tdee-calculator', 'calorie-calculator', 'macro-calculator', 'bmi-calculator'],
  },

  /* -------------------------------------------------------------------- TDEE */
  {
    slug: 'tdee-calculator',
    category: 'health',
    title: 'TDEE Calculator',
    description: 'Find your Total Daily Energy Expenditure — the calories you burn each day including activity.',
    intro: 'TDEE tells you roughly how many calories you need to maintain your current weight.',
    keywords: ['tdee calculator', 'total daily energy expenditure', 'maintenance calories'],
    popular: true,
    inputs: [unitField, genderField, activityField, { name: 'age', label: 'Age', type: 'number', suffix: 'yrs', default: 30, min: 1, max: 120, step: 1 }, ...heightWeightFields],
    compute: (v) => {
      const bmr = mifflinBmr(v);
      const factor = num(v.activity, 1.55);
      const tdee = bmr * factor;
      if (!Number.isFinite(tdee) || tdee <= 0) return { results: [], error: 'Enter valid age, height and weight.' };
      return {
        results: [
          { label: 'TDEE', value: `${number(tdee, 0)} cal/day`, primary: true, hint: 'Calories to maintain weight' },
          { label: 'BMR', value: `${number(bmr, 0)} cal/day` },
        ],
        breakdown: [
          { label: 'Mild weight loss (−0.25 kg/wk)', value: `${number(tdee - 250, 0)} cal/day` },
          { label: 'Weight loss (−0.5 kg/wk)', value: `${number(tdee - 500, 0)} cal/day` },
          { label: 'Weight gain (+0.5 kg/wk)', value: `${number(tdee + 500, 0)} cal/day` },
        ],
      };
    },
    faq: [
      { q: 'How do I lose weight with TDEE?', a: 'Eat below your TDEE. A deficit of about 500 calories per day leads to roughly half a kilogram (one pound) of fat loss per week.' },
    ],
    related: ['calorie-calculator', 'bmr-calculator', 'macro-calculator', 'bmi-calculator'],
  },

  /* ----------------------------------------------------------------- Calorie */
  {
    slug: 'calorie-calculator',
    category: 'health',
    title: 'Calorie Calculator',
    description: 'Work out how many calories you should eat per day to lose, maintain or gain weight.',
    intro: 'Based on your body metrics, activity and goal, this shows a daily calorie target.',
    keywords: ['calorie calculator', 'daily calories', 'weight loss calories'],
    popular: true,
    inputs: [
      unitField, genderField, activityField,
      { name: 'age', label: 'Age', type: 'number', suffix: 'yrs', default: 30, min: 1, max: 120, step: 1 },
      ...heightWeightFields,
      {
        name: 'goal', label: 'Goal', type: 'select', default: 'maintain', span: 2,
        options: [
          { label: 'Lose weight (−0.5 kg/week)', value: 'lose' },
          { label: 'Mild loss (−0.25 kg/week)', value: 'mildlose' },
          { label: 'Maintain weight', value: 'maintain' },
          { label: 'Mild gain (+0.25 kg/week)', value: 'mildgain' },
          { label: 'Gain weight (+0.5 kg/week)', value: 'gain' },
        ],
      },
    ],
    compute: (v) => {
      const bmr = mifflinBmr(v);
      const tdee = bmr * num(v.activity, 1.55);
      if (!Number.isFinite(tdee) || tdee <= 0) return { results: [], error: 'Enter valid age, height and weight.' };
      const adj: Record<string, number> = { lose: -500, mildlose: -250, maintain: 0, mildgain: 250, gain: 500 };
      const target = tdee + (adj[v.goal] ?? 0);
      return {
        results: [
          { label: 'Daily calorie target', value: `${number(target, 0)} cal`, primary: true },
          { label: 'Maintenance (TDEE)', value: `${number(tdee, 0)} cal` },
          { label: 'Weekly target', value: `${number(target * 7, 0)} cal` },
        ],
      };
    },
    faq: [
      { q: 'Is it safe to eat very few calories?', a: 'Extreme deficits are hard to sustain and can cost you muscle. Most adults should not drop below about 1,200 (women) or 1,500 (men) calories without medical guidance.' },
    ],
    related: ['tdee-calculator', 'macro-calculator', 'bmr-calculator', 'ideal-weight-calculator'],
  },

  /* ------------------------------------------------------------------- Macro */
  {
    slug: 'macro-calculator',
    category: 'health',
    title: 'Macro Calculator',
    description: 'Split a daily calorie target into protein, carbohydrate and fat grams.',
    intro: 'Choose a macro split and see how many grams of each nutrient to eat per day.',
    keywords: ['macro calculator', 'macronutrients', 'protein carbs fat'],
    inputs: [
      { name: 'calories', label: 'Daily calories', type: 'number', suffix: 'cal', default: 2200, min: 0, step: 50, span: 2 },
      {
        name: 'split', label: 'Macro split', type: 'select', default: 'balanced', span: 2,
        options: [
          { label: 'Balanced (30P / 40C / 30F)', value: 'balanced' },
          { label: 'Low carb (40P / 20C / 40F)', value: 'lowcarb' },
          { label: 'High protein (40P / 40C / 20F)', value: 'highprotein' },
          { label: 'Endurance (25P / 55C / 20F)', value: 'endurance' },
        ],
      },
    ],
    compute: (v) => {
      const cal = num(v.calories, 0);
      if (cal <= 0) return { results: [], error: 'Enter a daily calorie amount.' };
      const splits: Record<string, [number, number, number]> = {
        balanced: [0.3, 0.4, 0.3],
        lowcarb: [0.4, 0.2, 0.4],
        highprotein: [0.4, 0.4, 0.2],
        endurance: [0.25, 0.55, 0.2],
      };
      const [p, c, f] = splits[v.split] ?? splits.balanced;
      return {
        results: [
          { label: 'Protein', value: `${number((cal * p) / 4, 0)} g`, primary: true, hint: `${Math.round(p * 100)}% of calories` },
          { label: 'Carbohydrates', value: `${number((cal * c) / 4, 0)} g`, hint: `${Math.round(c * 100)}% of calories` },
          { label: 'Fat', value: `${number((cal * f) / 9, 0)} g`, hint: `${Math.round(f * 100)}% of calories` },
        ],
      };
    },
    formulaItems: [
      { name: 'Grams from calories', expr: 'protein & carbs = 4 cal/g, fat = 9 cal/g' },
    ],
    faq: [
      { q: 'How much protein do I need?', a: 'Active people generally aim for roughly 1.6–2.2 g of protein per kg of body weight per day to support muscle.' },
    ],
    related: ['calorie-calculator', 'tdee-calculator', 'bmr-calculator'],
  },

  /* ------------------------------------------------------------ Water Intake */
  {
    slug: 'water-intake-calculator',
    category: 'health',
    title: 'Water Intake Calculator',
    description: 'Estimate how much water you should drink each day based on your weight and activity.',
    intro: 'A simple daily water target based on body weight, with an adjustment for exercise.',
    keywords: ['water intake calculator', 'daily water', 'hydration'],
    inputs: [
      unitField,
      { name: 'weightKg', label: 'Weight', type: 'number', suffix: 'kg', default: 75, min: 0, step: 0.1, showWhen: { field: 'unit', equals: ['metric'] } },
      { name: 'weightLb', label: 'Weight', type: 'number', suffix: 'lb', default: 165, min: 0, step: 0.1, showWhen: { field: 'unit', equals: ['imperial'] } },
      { name: 'exercise', label: 'Daily exercise', type: 'number', suffix: 'min', default: 30, min: 0, max: 600, step: 5 },
    ],
    compute: (v) => {
      const kg = v.unit === 'imperial' ? num(v.weightLb, 0) * LB_TO_KG : num(v.weightKg, 0);
      if (kg <= 0) return { results: [], error: 'Enter a valid weight.' };
      const base = kg * 35; // ml per kg
      const exercise = (num(v.exercise, 0) / 30) * 350; // ~350 ml per 30 min
      const ml = base + exercise;
      return {
        results: [
          { label: 'Daily water', value: `${fixed(ml / 1000, 2)} L`, primary: true },
          { label: 'In cups (240 ml)', value: `${number(ml / 240, 0)} cups` },
          { label: 'In US fl oz', value: `${number(ml / 29.5735, 0)} oz` },
        ],
      };
    },
    faq: [
      { q: 'Do other drinks count?', a: 'Yes. Water, tea, coffee, milk and water-rich foods all contribute to hydration, though plain water is the most efficient source.' },
    ],
    related: ['calorie-calculator', 'bmr-calculator', 'ideal-weight-calculator'],
  },

  /* ----------------------------------------------------------- Ideal Weight */
  {
    slug: 'ideal-weight-calculator',
    category: 'health',
    title: 'Ideal Weight Calculator',
    description: 'Estimate your ideal body weight using the Devine, Robinson, Miller and Hamwi formulas.',
    intro: 'Ideal body weight formulas give a target range based on your height and sex.',
    keywords: ['ideal weight calculator', 'ideal body weight', 'healthy weight'],
    inputs: [
      unitField, genderField,
      { name: 'heightCm', label: 'Height', type: 'number', suffix: 'cm', default: 175, min: 0, step: 0.1, showWhen: { field: 'unit', equals: ['metric'] } },
      { name: 'heightFt', label: 'Height (feet)', type: 'number', suffix: 'ft', default: 5, min: 0, step: 1, showWhen: { field: 'unit', equals: ['imperial'] } },
      { name: 'heightIn', label: 'Height (inches)', type: 'number', suffix: 'in', default: 9, min: 0, step: 1, showWhen: { field: 'unit', equals: ['imperial'] } },
    ],
    compute: (v) => {
      const cm = v.unit === 'imperial' ? (num(v.heightFt, 0) * 12 + num(v.heightIn, 0)) * IN_TO_CM : num(v.heightCm, 0);
      const inches = cm / IN_TO_CM;
      if (cm <= 0) return { results: [], error: 'Enter a valid height.' };
      const over60 = Math.max(inches - 60, 0);
      const male = v.gender !== 'female';
      const devine = (male ? 50 : 45.5) + 2.3 * over60;
      const robinson = (male ? 52 : 49) + (male ? 1.9 : 1.7) * over60;
      const miller = (male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * over60;
      const hamwi = (male ? 48 : 45.5) + (male ? 2.7 : 2.2) * over60;
      const toDisplay = (k: number) => (v.unit === 'imperial' ? `${fixed(k / LB_TO_KG, 1)} lb` : `${fixed(k, 1)} kg`);
      const avg = (devine + robinson + miller + hamwi) / 4;
      return {
        results: [
          { label: 'Ideal weight (average)', value: toDisplay(avg), primary: true },
        ],
        breakdown: [
          { label: 'Devine formula', value: toDisplay(devine) },
          { label: 'Robinson formula', value: toDisplay(robinson) },
          { label: 'Miller formula', value: toDisplay(miller) },
          { label: 'Hamwi formula', value: toDisplay(hamwi) },
        ],
      };
    },
    faq: [
      { q: 'Which formula is best?', a: 'They all give similar results. The Devine formula is the most widely used in clinical settings, but treating the average as a range is most practical.' },
    ],
    related: ['bmi-calculator', 'calorie-calculator', 'bmr-calculator'],
  },
];
