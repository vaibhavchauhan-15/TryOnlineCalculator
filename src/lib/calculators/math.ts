import type { Calculator } from '../types';
import { num, number, percent } from '../format';
import { evaluate, gcd } from './_expr';

export const mathCalculators: Calculator[] = [
  /* ------------------------------------------------------------------- Basic */
  {
    slug: 'basic-calculator',
    category: 'math',
    title: 'Basic Calculator',
    description: 'A fast online calculator for everyday arithmetic — add, subtract, multiply and divide.',
    intro: 'Type a math expression using + − × ÷, percent and parentheses. The result updates as you type.',
    keywords: ['basic calculator', 'online calculator', 'simple calculator'],
    popular: true,
    visual: 'basic',
    inputs: [
      { name: 'expr', label: 'Expression', type: 'text', span: 2, default: '125 + 37 * 4 - 18', placeholder: 'e.g. (12 + 8) / 4' },
    ],
    compute: (v) => {
      const expr = (v.expr || '').trim();
      if (!expr) return { results: [], error: 'Enter an expression to calculate.' };
      try {
        const r = evaluate(expr, { scientific: false });
        if (!Number.isFinite(r)) return { results: [], error: 'That expression does not have a finite result.' };
        return { results: [{ label: 'Result', value: number(r, 6), primary: true }] };
      } catch (e) {
        return { results: [], error: (e as Error).message };
      }
    },
    howto: ['Type numbers and operators, e.g. 45 * 3 + 10.', 'Use parentheses to control the order of operations.', 'Supports +, −, *, /, % and ^ for powers.'],
    faq: [
      { q: 'What operators can I use?', a: 'Addition (+), subtraction (−), multiplication (×), division (÷) and powers (^), along with parentheses. The percent key (%) turns the number before it into a percentage, so 50% becomes 0.5.' },
      { q: 'Does it follow order of operations?', a: 'Yes. It respects standard PEMDAS/BODMAS precedence, so multiplication and division happen before addition and subtraction.' },
    ],
    related: ['scientific-calculator', 'percentage-calculator', 'fraction-calculator', 'average-calculator'],
  },

  /* -------------------------------------------------------------- Scientific */
  {
    slug: 'scientific-calculator',
    category: 'math',
    title: 'Scientific Calculator',
    description: 'Online scientific calculator with trig, logarithms, powers, roots and constants.',
    intro: 'Type an expression using functions like sin, cos, log, ln, sqrt and constants pi and e.',
    keywords: ['scientific calculator', 'trig calculator', 'log calculator'],
    popular: true,
    visual: 'scientific',
    inputs: [
      { name: 'expr', label: 'Expression', type: 'text', span: 2, default: 'sqrt(2) * sin(45) + log(1000)', placeholder: 'e.g. 2^10 + ln(e)' },
      {
        name: 'angle', label: 'Angle mode', type: 'radio', default: 'deg',
        options: [
          { label: 'Degrees', value: 'deg' },
          { label: 'Radians', value: 'rad' },
        ],
      },
    ],
    compute: (v) => {
      const expr = (v.expr || '').trim();
      if (!expr) return { results: [], error: 'Enter an expression to calculate.' };
      try {
        const r = evaluate(expr, { scientific: true, degrees: v.angle !== 'rad' });
        if (!Number.isFinite(r)) return { results: [], error: 'That expression does not have a finite result.' };
        return {
          results: [{ label: 'Result', value: number(r, 8), primary: true }],
          breakdown: [{ label: 'Full precision', value: String(r) }],
        };
      } catch (e) {
        return { results: [], error: (e as Error).message };
      }
    },
    howto: ['Type an expression with functions like sin(30) or sqrt(16).', 'Choose degrees or radians for trig functions.', 'Use pi and e as constants.'],
    faq: [
      { q: 'Which functions are supported?', a: 'sin, cos, tan and their inverses, sqrt, cbrt, ln, log (base 10), exp, abs, round, floor and ceil.' },
      { q: 'How do I raise to a power?', a: 'Use the caret, for example 2^10 for 2 to the 10th power.' },
    ],
    related: ['basic-calculator', 'percentage-calculator', 'fraction-calculator'],
  },

  /* -------------------------------------------------------------- Percentage */
  {
    slug: 'percentage-calculator',
    category: 'math',
    title: 'Percentage Calculator',
    description: 'Solve any percentage problem — percent of a number, what percent, and percent change.',
    intro: 'Pick the type of percentage question you have and fill in the two known values.',
    keywords: ['percentage calculator', 'percent of', 'percent change'],
    popular: true,
    visual: 'percentage',
    inputs: [
      {
        name: 'mode', label: 'What do you want to find?', type: 'select', default: 'percentOf', span: 2,
        options: [
          { label: 'What is X% of Y', value: 'percentOf' },
          { label: 'X is what percent of Y', value: 'whatPercent' },
          { label: 'Percentage change from X to Y', value: 'change' },
        ],
      },
      { name: 'a', label: 'Value X', type: 'number', default: 15, step: 0.01 },
      { name: 'b', label: 'Value Y', type: 'number', default: 200, step: 0.01 },
    ],
    compute: (v) => {
      const a = num(v.a, NaN);
      const b = num(v.b, NaN);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return { results: [], error: 'Enter both values.' };
      if (v.mode === 'percentOf') {
        return { results: [{ label: `${number(a, 4)}% of ${number(b, 4)}`, value: number((a / 100) * b, 6), primary: true }] };
      }
      if (v.mode === 'whatPercent') {
        if (b === 0) return { results: [], error: 'Y cannot be zero.' };
        return { results: [{ label: `${number(a, 4)} is this percent of ${number(b, 4)}`, value: percent((a / b) * 100, 4), primary: true }] };
      }
      // change
      if (a === 0) return { results: [], error: 'Starting value X cannot be zero for percent change.' };
      const change = ((b - a) / Math.abs(a)) * 100;
      return {
        results: [
          { label: 'Percentage change', value: percent(change, 4), primary: true, tone: change >= 0 ? 'success' : 'error', hint: change >= 0 ? 'Increase' : 'Decrease' },
          { label: 'Absolute change', value: number(b - a, 6) },
        ],
      };
    },
    formulaItems: [
      { name: 'Percent of', expr: 'result = (X / 100) × Y' },
      { name: 'What percent', expr: 'result = (X / Y) × 100' },
      { name: 'Percent change', expr: 'result = (Y − X) / |X| × 100' },
    ],
    faq: [
      { q: 'How do I find a percentage increase?', a: 'Use the "percentage change" mode with the original value as X and the new value as Y. A positive result is an increase.' },
    ],
    related: ['fraction-calculator', 'basic-calculator', 'discount-calculator', 'sales-tax-calculator'],
  },

  /* ---------------------------------------------------------------- Fraction */
  {
    slug: 'fraction-calculator',
    category: 'math',
    title: 'Fraction Calculator',
    description: 'Add, subtract, multiply and divide fractions and get the answer in lowest terms.',
    intro: 'Enter two fractions and an operation to get a simplified result plus its decimal value.',
    keywords: ['fraction calculator', 'add fractions', 'simplify fractions'],
    visual: 'fraction',
    inputs: [
      { name: 'n1', label: 'Numerator 1', type: 'number', default: 1, step: 1 },
      { name: 'd1', label: 'Denominator 1', type: 'number', default: 2, step: 1 },
      {
        name: 'op', label: 'Operation', type: 'select', default: 'add', span: 2,
        options: [
          { label: 'Add (+)', value: 'add' },
          { label: 'Subtract (−)', value: 'sub' },
          { label: 'Multiply (×)', value: 'mul' },
          { label: 'Divide (÷)', value: 'div' },
        ],
      },
      { name: 'n2', label: 'Numerator 2', type: 'number', default: 1, step: 1 },
      { name: 'd2', label: 'Denominator 2', type: 'number', default: 3, step: 1 },
    ],
    compute: (v) => {
      const n1 = num(v.n1, NaN), d1 = num(v.d1, NaN), n2 = num(v.n2, NaN), d2 = num(v.d2, NaN);
      if ([n1, d1, n2, d2].some((x) => !Number.isFinite(x))) return { results: [], error: 'Enter all four values.' };
      if (d1 === 0 || d2 === 0) return { results: [], error: 'Denominators cannot be zero.' };
      let num0: number, den0: number;
      switch (v.op) {
        case 'sub': num0 = n1 * d2 - n2 * d1; den0 = d1 * d2; break;
        case 'mul': num0 = n1 * n2; den0 = d1 * d2; break;
        case 'div':
          if (n2 === 0) return { results: [], error: 'Cannot divide by a fraction equal to zero.' };
          num0 = n1 * d2; den0 = d1 * n2; break;
        default: num0 = n1 * d2 + n2 * d1; den0 = d1 * d2;
      }
      if (den0 < 0) { num0 = -num0; den0 = -den0; }
      const g = gcd(num0, den0);
      const sn = num0 / g, sd = den0 / g;
      const decimal = num0 / den0;
      const whole = Math.trunc(sn / sd);
      const rem = Math.abs(sn % sd);
      const mixed = whole !== 0 && rem !== 0 ? `${whole} ${rem}/${sd}` : null;
      return {
        results: [
          { label: 'Result', value: `${sn}/${sd}`, primary: true },
          ...(mixed ? [{ label: 'Mixed number', value: mixed }] : []),
          { label: 'Decimal', value: number(decimal, 6) },
        ],
      };
    },
    faq: [
      { q: 'Does it simplify the answer?', a: 'Yes. The result is always reduced to lowest terms using the greatest common divisor, and shown as a mixed number when appropriate.' },
    ],
    related: ['percentage-calculator', 'basic-calculator', 'average-calculator'],
  },

  /* ----------------------------------------------------------------- Average */
  {
    slug: 'average-calculator',
    category: 'math',
    title: 'Average Calculator',
    description: 'Calculate the mean, median, mode, range and sum of a set of numbers.',
    intro: 'Paste or type your numbers separated by commas, spaces or new lines.',
    keywords: ['average calculator', 'mean median mode', 'sum calculator'],
    visual: 'average',
    inputs: [
      { name: 'values', label: 'Numbers', type: 'textarea', span: 2, default: '12, 7, 19, 7, 23, 15', placeholder: '12, 7, 19, 23' },
    ],
    compute: (v) => {
      const nums = (v.values || '')
        .split(/[,\s\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => num(s, NaN))
        .filter((n) => Number.isFinite(n));
      if (!nums.length) return { results: [], error: 'Enter at least one number.' };
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      const counts = new Map<number, number>();
      nums.forEach((n) => counts.set(n, (counts.get(n) || 0) + 1));
      let maxCount = 0;
      counts.forEach((c) => (maxCount = Math.max(maxCount, c)));
      const modes = maxCount > 1 ? [...counts.entries()].filter(([, c]) => c === maxCount).map(([n]) => n) : [];
      return {
        results: [
          { label: 'Mean (average)', value: number(mean, 6), primary: true },
          { label: 'Median', value: number(median, 6) },
          { label: 'Mode', value: modes.length ? modes.map((n) => number(n, 6)).join(', ') : 'none' },
          { label: 'Sum', value: number(sum, 6) },
        ],
        breakdown: [
          { label: 'Count', value: number(nums.length, 0) },
          { label: 'Range', value: number(sorted[sorted.length - 1] - sorted[0], 6) },
          { label: 'Min / Max', value: `${number(sorted[0], 6)} / ${number(sorted[sorted.length - 1], 6)}` },
        ],
      };
    },
    formulaItems: [{ name: 'Mean', expr: 'mean = sum of values / count' }],
    faq: [
      { q: 'What is the difference between mean and median?', a: 'The mean is the sum divided by the count. The median is the middle value when sorted, which is less affected by extreme outliers.' },
    ],
    related: ['percentage-calculator', 'basic-calculator', 'average-grade-calculator'],
  },
];
