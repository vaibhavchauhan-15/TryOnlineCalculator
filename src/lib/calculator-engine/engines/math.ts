// Math — pure engines (basic, scientific, fraction, average).
//
// Migrated from the legacy `src/lib/calculators/math.ts`. `percentage-calculator`
// already lives in `./percentage.ts` and is intentionally NOT re-implemented here.
//
// The one rule that keeps the i18n architecture honest: every result carries
// RAW VALUES + ENUM KEYS ONLY — never a localized string or a pre-formatted
// number. So the fraction engine emits a raw numerator/denominator/whole as
// separate keyed items rather than a "3 1/2" string, and the localization layer
// assembles the mixed-number phrase for the active locale.
//
// Two shapes of calculator live here:
//
//   • basic-calculator / scientific-calculator are VISUAL keypad calculators.
//     A bespoke keypad component renders the UI, so they deliberately OMIT
//     fields(); they still implement parseInput() + compute() so the calculation
//     runs through the engine. Their parseInput reads `values.expression` (the
//     expression string the keypad builds) and compute() evaluates it via the
//     shared expression evaluator in `../../calculators/_expr` — the exact same
//     evaluator the legacy calculators used (imported, never re-implemented).
//
//   • fraction-calculator / average-calculator map to simple inputs, so they
//     DO provide fields() and are rendered by the generic form renderer.

import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import type { AnyEngine } from '../index';
import { ok, fail } from '../contract';
import { isFiniteNumber, num } from '../units';
// Reuse the legacy safe expression evaluator + gcd — identical math, no re-impl.
import { evaluate, gcd } from '../../calculators/_expr';

// ============================================================ Basic Calculator
//
// VISUAL keypad calculator — fields() omitted on purpose. The keypad component
// owns the UI and submits the built-up expression string under `expression`.

export interface BasicInput {
  expression: string;
}

export interface BasicResult extends EngineResult {}

export const basicCalculatorEngine: CalculatorEngine<BasicInput, BasicResult> = {
  slug: 'basic-calculator',
  category: 'math',

  defaultInput: () => ({ expression: '125 + 37 * 4 - 18' }),

  // No fields(): a bespoke keypad component renders this calculator. parseInput
  // still exists so the engine can compute from the raw form value.
  parseInput: (values): BasicInput => ({ expression: values.expression ?? '' }),

  validate: (input) => {
    const expr = input.expression.trim();
    if (!expr) return fail('math.expressionRequired', { field: 'expression' });
    try {
      const r = evaluate(expr, { scientific: false });
      if (!Number.isFinite(r)) return fail('math.notFinite', { field: 'expression' });
    } catch {
      return fail('math.invalidExpression', { field: 'expression' });
    }
    return ok();
  },

  compute: (input) => {
    // Defensive: validate() gates errors, but keep compute crash-free.
    let value = NaN;
    try {
      value = evaluate(input.expression.trim(), { scientific: false });
    } catch {
      value = NaN;
    }
    // Legacy formatted with number(r, 6) → raw decimal, precision 6.
    return { items: [{ key: 'result', value, format: 'decimal', precision: 6, primary: true }] };
  },
};

// ======================================================= Scientific Calculator
//
// VISUAL keypad calculator — fields() omitted. The bespoke keypad component
// renders both the expression input and the degrees/radians toggle, submitting
// them as `expression` and `angle`.

export type AngleMode = 'deg' | 'rad';

export interface ScientificInput {
  expression: string;
  angle: AngleMode;
}

export interface ScientificResult extends EngineResult {}

export const scientificCalculatorEngine: CalculatorEngine<ScientificInput, ScientificResult> = {
  slug: 'scientific-calculator',
  category: 'math',

  defaultInput: () => ({ expression: 'sqrt(2) * sin(45) + log(1000)', angle: 'deg' }),

  // No fields(): the keypad component renders the expression + angle toggle.
  parseInput: (values): ScientificInput => ({
    expression: values.expression ?? '',
    angle: values.angle === 'rad' ? 'rad' : 'deg',
  }),

  validate: (input) => {
    const expr = input.expression.trim();
    if (!expr) return fail('math.expressionRequired', { field: 'expression' });
    try {
      const r = evaluate(expr, { scientific: true, degrees: input.angle !== 'rad' });
      if (!Number.isFinite(r)) return fail('math.notFinite', { field: 'expression' });
    } catch {
      return fail('math.invalidExpression', { field: 'expression' });
    }
    return ok();
  },

  compute: (input) => {
    let value = NaN;
    try {
      value = evaluate(input.expression.trim(), { scientific: true, degrees: input.angle !== 'rad' });
    } catch {
      value = NaN;
    }
    // Legacy: number(r, 8) headline + a full-precision breakdown row.
    return {
      items: [{ key: 'result', value, format: 'decimal', precision: 8, primary: true }],
      breakdown: [{ key: 'fullPrecision', value, format: 'plain' }],
    };
  },
};

// ========================================================= Fraction Calculator
//
// STATIC form calculator — provides fields(). Replicates the legacy fraction
// arithmetic and emits raw components (numerator, denominator, whole, remainder)
// so the localization layer can build "n/d" and the mixed-number phrase itself.

export type FractionOp = 'add' | 'sub' | 'mul' | 'div';

export interface FractionInput {
  n1: number;
  d1: number;
  op: FractionOp;
  n2: number;
  d2: number;
}

export interface FractionResult extends EngineResult {}

export const fractionCalculatorEngine: CalculatorEngine<FractionInput, FractionResult> = {
  slug: 'fraction-calculator',
  category: 'math',

  defaultInput: () => ({ n1: 1, d1: 2, op: 'add', n2: 1, d2: 3 }),

  fields: (): EngineField[] => [
    { name: 'n1', labelKey: 'field.n1', type: 'number', defaultValue: '1', step: 1 },
    { name: 'd1', labelKey: 'field.d1', type: 'number', defaultValue: '2', step: 1 },
    {
      name: 'op', labelKey: 'field.op', type: 'select', defaultValue: 'add', span: 2,
      options: [
        { value: 'add', labelKey: 'op.add' },
        { value: 'sub', labelKey: 'op.sub' },
        { value: 'mul', labelKey: 'op.mul' },
        { value: 'div', labelKey: 'op.div' },
      ],
    },
    { name: 'n2', labelKey: 'field.n2', type: 'number', defaultValue: '1', step: 1 },
    { name: 'd2', labelKey: 'field.d2', type: 'number', defaultValue: '3', step: 1 },
  ],

  parseInput: (values): FractionInput => {
    const op: FractionOp =
      values.op === 'sub' || values.op === 'mul' || values.op === 'div' ? values.op : 'add';
    return {
      n1: num(values.n1, NaN),
      d1: num(values.d1, NaN),
      op,
      n2: num(values.n2, NaN),
      d2: num(values.d2, NaN),
    };
  },

  validate: (input) => {
    if (![input.n1, input.d1, input.n2, input.d2].every(isFiniteNumber)) {
      return fail('math.allFractionValuesRequired');
    }
    if (input.d1 === 0 || input.d2 === 0) return fail('math.denominatorNonZero');
    if (input.op === 'div' && input.n2 === 0) return fail('math.divideByZeroFraction', { field: 'n2' });
    return ok();
  },

  compute: (input) => {
    const { n1, d1, n2, d2 } = input;
    let num0: number, den0: number;
    switch (input.op) {
      case 'sub': num0 = n1 * d2 - n2 * d1; den0 = d1 * d2; break;
      case 'mul': num0 = n1 * n2; den0 = d1 * d2; break;
      case 'div': num0 = n1 * d2; den0 = d1 * n2; break;
      default: num0 = n1 * d2 + n2 * d1; den0 = d1 * d2; // add
    }
    // Normalise sign so the denominator is always positive.
    if (den0 < 0) { num0 = -num0; den0 = -den0; }
    const g = gcd(num0, den0);
    const sn = num0 / g; // simplified numerator
    const sd = den0 / g; // simplified denominator
    const decimal = den0 === 0 ? NaN : num0 / den0;
    const whole = Math.trunc(sn / sd);
    const remainder = Math.abs(sn % sd);

    // Raw components only — no "sn/sd" or "whole rem/sd" strings. The
    // localization layer assembles the fraction + mixed-number phrasing.
    const items: ResultItem[] = [
      { key: 'numerator', value: sn, format: 'integer', primary: true },
      { key: 'denominator', value: sd, format: 'integer', primary: true },
      { key: 'decimal', value: decimal, format: 'decimal', precision: 6 },
    ];

    // Mixed-number parts (only meaningful when both are non-zero, matching the
    // legacy behaviour); still emitted raw for downstream assembly.
    const breakdown: ResultItem[] = [
      { key: 'whole', value: whole, format: 'integer' },
      { key: 'remainder', value: remainder, format: 'integer' },
    ];

    return { items, breakdown };
  },
};

// =========================================================== Average Calculator
//
// STATIC form calculator — provides fields() (a single free-text list of
// numbers). parseInput reads the raw list string under `values` (the legacy
// input key); compute derives mean/median/mode/sum/range as raw numbers.

export interface AverageInput {
  values: string;
}

export interface AverageResult extends EngineResult {}

/** Parse the raw list string into finite numbers (commas/spaces/newlines). */
function parseNumberList(raw: string): number[] {
  return raw
    .split(/[,\s\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => num(s, NaN))
    .filter((n) => Number.isFinite(n));
}

export const averageCalculatorEngine: CalculatorEngine<AverageInput, AverageResult> = {
  slug: 'average-calculator',
  category: 'math',

  defaultInput: () => ({ values: '12, 7, 19, 7, 23, 15' }),

  // Simple mapping → provide fields(). The contract has no textarea control, so
  // a wide `text` field carries the comma/space/newline-separated list.
  fields: (): EngineField[] => [
    { name: 'values', labelKey: 'field.values', type: 'text', defaultValue: '12, 7, 19, 7, 23, 15', span: 2 },
  ],

  parseInput: (values): AverageInput => ({ values: values.values ?? '' }),

  validate: (input) => {
    if (!parseNumberList(input.values).length) return fail('math.noNumbers', { field: 'values' });
    return ok();
  },

  compute: (input) => {
    const nums = parseNumberList(input.values);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Mode(s): only counts as a mode when a value repeats (maxCount > 1).
    const counts = new Map<number, number>();
    nums.forEach((n) => counts.set(n, (counts.get(n) || 0) + 1));
    let maxCount = 0;
    counts.forEach((c) => (maxCount = Math.max(maxCount, c)));
    const modes = maxCount > 1 ? [...counts.entries()].filter(([, c]) => c === maxCount).map(([n]) => n) : [];

    const items: ResultItem[] = [
      { key: 'mean', value: mean, format: 'decimal', precision: 6, primary: true },
      { key: 'median', value: median, format: 'decimal', precision: 6 },
    ];

    // Emit each mode as its own raw item so no values are lost to a joined
    // string; when there is no repeated value, emit the `none` enum key.
    if (modes.length) {
      for (const m of modes) items.push({ key: 'mode', value: m, format: 'decimal', precision: 6 });
    } else {
      items.push({ key: 'mode', enumKey: 'none' });
    }

    items.push({ key: 'sum', value: sum, format: 'decimal', precision: 6 });

    const breakdown: ResultItem[] = [
      { key: 'count', value: nums.length, format: 'integer' },
      { key: 'range', value: sorted[sorted.length - 1] - sorted[0], format: 'decimal', precision: 6 },
      { key: 'min', value: sorted[0], format: 'decimal', precision: 6 },
      { key: 'max', value: sorted[sorted.length - 1], format: 'decimal', precision: 6 },
    ];

    return { items, breakdown };
  },
};

// ====================================================================== Export

export const mathEngines: AnyEngine[] = [
  basicCalculatorEngine as AnyEngine,
  scientificCalculatorEngine as AnyEngine,
  fractionCalculatorEngine as AnyEngine,
  averageCalculatorEngine as AnyEngine,
];
