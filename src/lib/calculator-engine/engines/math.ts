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

import type { CalculatorEngine, EngineResult, ResultItem, EngineField, ValueFormat } from '../contract';
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

// ========================================================= Exponent Calculator

export interface ExponentInput {
  base: number;
  exponent: number;
}

export interface ExponentResult extends EngineResult {}

export const exponentCalculatorEngine: CalculatorEngine<ExponentInput, ExponentResult> = {
  slug: 'exponent-calculator',
  category: 'math',

  defaultInput: () => ({ base: 2, exponent: 8 }),

  fields: (): EngineField[] => [
    { name: 'base', labelKey: 'field.base', type: 'number', defaultValue: '2' },
    { name: 'exponent', labelKey: 'field.exponent', type: 'number', defaultValue: '8' },
  ],

  parseInput: (values): ExponentInput => ({
    base: num(values.base, 2),
    exponent: num(values.exponent, 8),
  }),

  validate: (input) => {
    if (!isFiniteNumber(input.base) || !isFiniteNumber(input.exponent)) {
      return fail('math.invalidNumber');
    }
    return ok();
  },

  compute: (input) => {
    const { base, exponent } = input;
    const result = Math.pow(base, exponent);
    const squared = Math.pow(base, 2);
    const cubed = Math.pow(base, 3);
    const sqrtVal = base >= 0 ? Math.sqrt(base) : NaN;
    const reciprocal = result !== 0 ? 1 / result : NaN;

    const items: ResultItem[] = [
      { key: 'result', value: result, format: 'decimal', precision: 8, primary: true },
      { key: 'squared', value: squared, format: 'decimal', precision: 6 },
      { key: 'cubed', value: cubed, format: 'decimal', precision: 6 },
      ...(Number.isFinite(sqrtVal) ? [{ key: 'sqrt', value: sqrtVal, format: 'decimal' as ValueFormat, precision: 6 }] : []),
      ...(Number.isFinite(reciprocal) ? [{ key: 'reciprocal', value: reciprocal, format: 'decimal' as ValueFormat, precision: 8 }] : []),
    ];

    return { items };
  },
};

// ============================================================ Log Calculator

export interface LogInput {
  x: number;
  base: number;
}

export interface LogResult extends EngineResult {}

export const logCalculatorEngine: CalculatorEngine<LogInput, LogResult> = {
  slug: 'log-calculator',
  category: 'math',

  defaultInput: () => ({ x: 100, base: 10 }),

  fields: (): EngineField[] => [
    { name: 'x', labelKey: 'field.x', type: 'number', defaultValue: '100' },
    { name: 'base', labelKey: 'field.base', type: 'number', defaultValue: '10' },
  ],

  parseInput: (values): LogInput => ({
    x: num(values.x, 100),
    base: num(values.base, 10),
  }),

  validate: (input) => {
    if (!isFiniteNumber(input.x) || input.x <= 0) {
      return fail('math.xPositive', { field: 'x' });
    }
    if (!isFiniteNumber(input.base) || input.base <= 0 || input.base === 1) {
      return fail('math.baseInvalid', { field: 'base' });
    }
    return ok();
  },

  compute: (input) => {
    const { x, base } = input;
    const lnX = Math.log(x);
    const logBase = lnX / Math.log(base);
    const log10Val = Math.log10(x);
    const log2Val = Math.log2(x);

    return {
      items: [
        { key: 'result', value: logBase, format: 'decimal', precision: 8, primary: true },
        { key: 'ln', value: lnX, format: 'decimal', precision: 8 },
        { key: 'log10', value: log10Val, format: 'decimal', precision: 8 },
        { key: 'log2', value: log2Val, format: 'decimal', precision: 8 },
      ],
    };
  },
};

// ========================================================= Matrix Calculator

export type MatrixOp = 'add' | 'sub' | 'mul' | 'scalar' | 'transpose';

export interface MatrixInput {
  op: MatrixOp;
  a11: number; a12: number; a21: number; a22: number;
  b11: number; b12: number; b21: number; b22: number;
  k: number;
}

export interface MatrixResult extends EngineResult {}

export const matrixCalculatorEngine: CalculatorEngine<MatrixInput, MatrixResult> = {
  slug: 'matrix-calculator',
  category: 'math',

  defaultInput: () => ({
    op: 'add',
    a11: 1, a12: 2, a21: 3, a22: 4,
    b11: 5, b12: 6, b21: 7, b22: 8,
    k: 2,
  }),

  fields: (): EngineField[] => [
    {
      name: 'op', labelKey: 'field.op', type: 'select', defaultValue: 'add', span: 2,
      options: [
        { value: 'add', labelKey: 'op.add' },
        { value: 'sub', labelKey: 'op.sub' },
        { value: 'mul', labelKey: 'op.mul' },
        { value: 'scalar', labelKey: 'op.scalar' },
        { value: 'transpose', labelKey: 'op.transpose' },
      ],
    },
    { name: 'a11', labelKey: 'field.a11', type: 'number', defaultValue: '1' },
    { name: 'a12', labelKey: 'field.a12', type: 'number', defaultValue: '2' },
    { name: 'a21', labelKey: 'field.a21', type: 'number', defaultValue: '3' },
    { name: 'a22', labelKey: 'field.a22', type: 'number', defaultValue: '4' },
    { name: 'b11', labelKey: 'field.b11', type: 'number', defaultValue: '5', showWhen: { field: 'op', equals: ['add', 'sub', 'mul'] } },
    { name: 'b12', labelKey: 'field.b12', type: 'number', defaultValue: '6', showWhen: { field: 'op', equals: ['add', 'sub', 'mul'] } },
    { name: 'b21', labelKey: 'field.b21', type: 'number', defaultValue: '7', showWhen: { field: 'op', equals: ['add', 'sub', 'mul'] } },
    { name: 'b22', labelKey: 'field.b22', type: 'number', defaultValue: '8', showWhen: { field: 'op', equals: ['add', 'sub', 'mul'] } },
    { name: 'k', labelKey: 'field.k', type: 'number', defaultValue: '2', showWhen: { field: 'op', equals: ['scalar'] } },
  ],

  parseInput: (values): MatrixInput => {
    const op: MatrixOp = ['add', 'sub', 'mul', 'scalar', 'transpose'].includes(values.op) ? (values.op as MatrixOp) : 'add';
    return {
      op,
      a11: num(values.a11, 1), a12: num(values.a12, 2), a21: num(values.a21, 3), a22: num(values.a22, 4),
      b11: num(values.b11, 5), b12: num(values.b12, 6), b21: num(values.b21, 7), b22: num(values.b22, 8),
      k: num(values.k, 2),
    };
  },

  validate: (input) => {
    if (![input.a11, input.a12, input.a21, input.a22].every(isFiniteNumber)) {
      return fail('math.allMatrixValuesRequired');
    }
    return ok();
  },

  compute: (input) => {
    let r11 = 0, r12 = 0, r21 = 0, r22 = 0;
    const { a11, a12, a21, a22, b11, b12, b21, b22, k, op } = input;

    switch (op) {
      case 'sub':
        r11 = a11 - b11; r12 = a12 - b12; r21 = a21 - b21; r22 = a22 - b22;
        break;
      case 'mul':
        r11 = a11 * b11 + a12 * b21; r12 = a11 * b12 + a12 * b22;
        r21 = a21 * b11 + a22 * b21; r22 = a21 * b12 + a22 * b22;
        break;
      case 'scalar':
        r11 = a11 * k; r12 = a12 * k; r21 = a21 * k; r22 = a22 * k;
        break;
      case 'transpose':
        r11 = a11; r12 = a21; r21 = a12; r22 = a22;
        break;
      default: // add
        r11 = a11 + b11; r12 = a12 + b12; r21 = a21 + b21; r22 = a22 + b22;
    }

    return {
      items: [
        { key: 'r11', value: r11, format: 'decimal', precision: 4, primary: true },
        { key: 'r12', value: r12, format: 'decimal', precision: 4, primary: true },
        { key: 'r21', value: r21, format: 'decimal', precision: 4, primary: true },
        { key: 'r22', value: r22, format: 'decimal', precision: 4, primary: true },
      ],
    };
  },
};

// ==================================================== Determinant Calculator

export interface DeterminantInput {
  dim: '2' | '3';
  a11: number; a12: number; a13: number;
  a21: number; a22: number; a23: number;
  a31: number; a32: number; a33: number;
}

export interface DeterminantResult extends EngineResult {}

export const determinantCalculatorEngine: CalculatorEngine<DeterminantInput, DeterminantResult> = {
  slug: 'determinant-calculator',
  category: 'math',

  defaultInput: () => ({
    dim: '2',
    a11: 4, a12: 3, a13: 0,
    a21: 2, a22: 5, a23: 0,
    a31: 0, a32: 0, a33: 1,
  }),

  fields: (): EngineField[] => [
    {
      name: 'dim', labelKey: 'field.dim', type: 'select', defaultValue: '2', span: 2,
      options: [
        { value: '2', labelKey: 'dim.2x2' },
        { value: '3', labelKey: 'dim.3x3' },
      ],
    },
    { name: 'a11', labelKey: 'field.a11', type: 'number', defaultValue: '4' },
    { name: 'a12', labelKey: 'field.a12', type: 'number', defaultValue: '3' },
    { name: 'a13', labelKey: 'field.a13', type: 'number', defaultValue: '0', showWhen: { field: 'dim', equals: ['3'] } },
    { name: 'a21', labelKey: 'field.a21', type: 'number', defaultValue: '2' },
    { name: 'a22', labelKey: 'field.a22', type: 'number', defaultValue: '5' },
    { name: 'a23', labelKey: 'field.a23', type: 'number', defaultValue: '0', showWhen: { field: 'dim', equals: ['3'] } },
    { name: 'a31', labelKey: 'field.a31', type: 'number', defaultValue: '0', showWhen: { field: 'dim', equals: ['3'] } },
    { name: 'a32', labelKey: 'field.a32', type: 'number', defaultValue: '0', showWhen: { field: 'dim', equals: ['3'] } },
    { name: 'a33', labelKey: 'field.a33', type: 'number', defaultValue: '1', showWhen: { field: 'dim', equals: ['3'] } },
  ],

  parseInput: (values): DeterminantInput => ({
    dim: values.dim === '3' ? '3' : '2',
    a11: num(values.a11, 4), a12: num(values.a12, 3), a13: num(values.a13, 0),
    a21: num(values.a21, 2), a22: num(values.a22, 5), a23: num(values.a23, 0),
    a31: num(values.a31, 0), a32: num(values.a32, 0), a33: num(values.a33, 1),
  }),

  validate: (input) => {
    if (![input.a11, input.a12, input.a21, input.a22].every(isFiniteNumber)) {
      return fail('math.allMatrixValuesRequired');
    }
    return ok();
  },

  compute: (input) => {
    const { dim, a11, a12, a13, a21, a22, a23, a31, a32, a33 } = input;
    let det = 0;
    let trace = 0;

    if (dim === '3') {
      det =
        a11 * (a22 * a33 - a23 * a32) -
        a12 * (a21 * a33 - a23 * a31) +
        a13 * (a21 * a32 - a22 * a31);
      trace = a11 + a22 + a33;
    } else {
      det = a11 * a22 - a12 * a21;
      trace = a11 + a22;
    }

    return {
      items: [
        { key: 'determinant', value: det, format: 'decimal', precision: 6, primary: true },
        { key: 'trace', value: trace, format: 'decimal', precision: 6 },
      ],
    };
  },
};

// ==================================================== Quadratic Calculator

export interface QuadraticInput {
  a: number;
  b: number;
  c: number;
}

export interface QuadraticResult extends EngineResult {}

export const quadraticCalculatorEngine: CalculatorEngine<QuadraticInput, QuadraticResult> = {
  slug: 'quadratic-calculator',
  category: 'math',

  defaultInput: () => ({ a: 1, b: -5, c: 6 }),

  fields: (): EngineField[] => [
    { name: 'a', labelKey: 'field.a', type: 'number', defaultValue: '1' },
    { name: 'b', labelKey: 'field.b', type: 'number', defaultValue: '-5' },
    { name: 'c', labelKey: 'field.c', type: 'number', defaultValue: '6' },
  ],

  parseInput: (values): QuadraticInput => ({
    a: num(values.a, 1),
    b: num(values.b, -5),
    c: num(values.c, 6),
  }),

  validate: (input) => {
    if (![input.a, input.b, input.c].every(isFiniteNumber)) {
      return fail('math.allValuesRequired');
    }
    if (input.a === 0) {
      return fail('math.aNonZero', { field: 'a' });
    }
    return ok();
  },

  compute: (input) => {
    const { a, b, c } = input;
    const disc = b * b - 4 * a * c;
    const vertexX = -b / (2 * a);
    const vertexY = c - (b * b) / (4 * a);

    const items: ResultItem[] = [
      { key: 'discriminant', value: disc, format: 'decimal', precision: 6, primary: true },
      { key: 'vertexX', value: vertexX, format: 'decimal', precision: 6 },
      { key: 'vertexY', value: vertexY, format: 'decimal', precision: 6 },
    ];

    if (disc >= 0) {
      const r1 = (-b + Math.sqrt(disc)) / (2 * a);
      const r2 = (-b - Math.sqrt(disc)) / (2 * a);
      items.push({ key: 'root1', value: r1, format: 'decimal', precision: 6 });
      items.push({ key: 'root2', value: r2, format: 'decimal', precision: 6 });
    } else {
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(-disc) / (2 * Math.abs(a));
      items.push({ key: 'root1Real', value: realPart, format: 'decimal', precision: 6 });
      items.push({ key: 'root1Imag', value: imagPart, format: 'decimal', precision: 6 });
    }

    return { items };
  },
};

// ============================================ Standard Deviation Calculator

export interface StandardDeviationInput {
  values: string;
}

export interface StandardDeviationResult extends EngineResult {}

export const standardDeviationCalculatorEngine: CalculatorEngine<StandardDeviationInput, StandardDeviationResult> = {
  slug: 'standard-deviation-calculator',
  category: 'math',

  defaultInput: () => ({ values: '10, 12, 23, 23, 16, 23, 21, 16' }),

  fields: (): EngineField[] => [
    { name: 'values', labelKey: 'field.values', type: 'text', defaultValue: '10, 12, 23, 23, 16, 23, 21, 16', span: 2 },
  ],

  parseInput: (values): StandardDeviationInput => ({ values: values.values ?? '' }),

  validate: (input) => {
    const nums = parseNumberList(input.values);
    if (nums.length < 2) return fail('math.atLeastTwoNumbers', { field: 'values' });
    return ok();
  },

  compute: (input) => {
    const nums = parseNumberList(input.values);
    const n = nums.length;
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const sumSqDiff = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0);

    const popVar = sumSqDiff / n;
    const popSd = Math.sqrt(popVar);
    const sampleVar = n > 1 ? sumSqDiff / (n - 1) : popVar;
    const sampleSd = Math.sqrt(sampleVar);

    return {
      items: [
        { key: 'sampleSd', value: sampleSd, format: 'decimal', precision: 6, primary: true },
        { key: 'popSd', value: popSd, format: 'decimal', precision: 6 },
        { key: 'sampleVar', value: sampleVar, format: 'decimal', precision: 6 },
        { key: 'popVar', value: popVar, format: 'decimal', precision: 6 },
        { key: 'mean', value: mean, format: 'decimal', precision: 6 },
        { key: 'count', value: n, format: 'integer' },
        { key: 'sum', value: sum, format: 'decimal', precision: 6 },
      ],
    };
  },
};

// ================================================= Prime Number Calculator

export interface PrimeInput {
  n: number;
}

export interface PrimeResult extends EngineResult {}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function getPrimeFactors(n: number): number[] {
  const factors: number[] = [];
  let d = 2;
  let temp = n;
  while (temp >= 2) {
    if (temp % d === 0) {
      factors.push(d);
      temp /= d;
    } else {
      d++;
      if (d * d > temp) {
        if (temp > 1) factors.push(temp);
        break;
      }
    }
  }
  return factors;
}

export const primeNumberCalculatorEngine: CalculatorEngine<PrimeInput, PrimeResult> = {
  slug: 'prime-number-calculator',
  category: 'math',

  defaultInput: () => ({ n: 29 }),

  fields: (): EngineField[] => [
    { name: 'n', labelKey: 'field.n', type: 'number', defaultValue: '29', min: 1, step: 1 },
  ],

  parseInput: (values): PrimeInput => ({ n: Math.abs(Math.round(num(values.n, 29))) }),

  validate: (input) => {
    if (!isFiniteNumber(input.n) || input.n < 1) return fail('math.positiveIntegerRequired', { field: 'n' });
    return ok();
  },

  compute: (input) => {
    const { n } = input;
    const prime = isPrime(n);
    let nextP = n + 1;
    while (!isPrime(nextP)) nextP++;

    let prevP = 0;
    if (n > 2) {
      prevP = n - 1;
      while (prevP > 1 && !isPrime(prevP)) prevP--;
    }

    const factors = getPrimeFactors(n);

    return {
      items: [
        { key: 'isPrime', enumKey: prime ? 'yes' : 'no', primary: true },
        { key: 'nextPrime', value: nextP, format: 'integer' },
        ...(prevP > 1 ? [{ key: 'prevPrime', value: prevP, format: 'integer' as ValueFormat }] : []),
        { key: 'factorCount', value: factors.length, format: 'integer' },
      ],
    };
  },
};

// ========================================================== GCF Calculator

export interface GCFInput {
  values: string;
}

export interface GCFResult extends EngineResult {}

export const gcfCalculatorEngine: CalculatorEngine<GCFInput, GCFResult> = {
  slug: 'gcf-calculator',
  category: 'math',

  defaultInput: () => ({ values: '24, 36, 48' }),

  fields: (): EngineField[] => [
    { name: 'values', labelKey: 'field.values', type: 'text', defaultValue: '24, 36, 48', span: 2 },
  ],

  parseInput: (values): GCFInput => ({ values: values.values ?? '' }),

  validate: (input) => {
    const nums = parseNumberList(input.values).map((n) => Math.abs(Math.round(n))).filter((n) => n > 0);
    if (nums.length < 2) return fail('math.atLeastTwoNumbers', { field: 'values' });
    return ok();
  },

  compute: (input) => {
    const nums = parseNumberList(input.values).map((n) => Math.abs(Math.round(n))).filter((n) => n > 0);
    const resultGcf = nums.reduce((acc, curr) => gcd(acc, curr));

    return {
      items: [
        { key: 'gcf', value: resultGcf, format: 'integer', primary: true },
        { key: 'count', value: nums.length, format: 'integer' },
      ],
    };
  },
};

// ========================================================== LCM Calculator

export interface LCMInput {
  values: string;
}

export interface LCMResult extends EngineResult {}

export const lcmCalculatorEngine: CalculatorEngine<LCMInput, LCMResult> = {
  slug: 'lcm-calculator',
  category: 'math',

  defaultInput: () => ({ values: '12, 15, 20' }),

  fields: (): EngineField[] => [
    { name: 'values', labelKey: 'field.values', type: 'text', defaultValue: '12, 15, 20', span: 2 },
  ],

  parseInput: (values): LCMInput => ({ values: values.values ?? '' }),

  validate: (input) => {
    const nums = parseNumberList(input.values).map((n) => Math.abs(Math.round(n))).filter((n) => n > 0);
    if (nums.length < 2) return fail('math.atLeastTwoNumbers', { field: 'values' });
    return ok();
  },

  compute: (input) => {
    const nums = parseNumberList(input.values).map((n) => Math.abs(Math.round(n))).filter((n) => n > 0);
    const calcLcm = (a: number, b: number) => (a / gcd(a, b)) * b;
    const resultLcm = nums.reduce((acc, curr) => calcLcm(acc, curr));
    const resultGcf = nums.reduce((acc, curr) => gcd(acc, curr));

    return {
      items: [
        { key: 'lcm', value: resultLcm, format: 'integer', primary: true },
        { key: 'gcf', value: resultGcf, format: 'integer' },
        { key: 'count', value: nums.length, format: 'integer' },
      ],
    };
  },
};

// =================================== Permutation & Combination Calculator

export interface PermutationCombinationInput {
  n: number;
  r: number;
}

export interface PermutationCombinationResult extends EngineResult {}

function factorial(n: number): number {
  if (n < 0 || n > 170) return NaN;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export const permutationCombinationCalculatorEngine: CalculatorEngine<PermutationCombinationInput, PermutationCombinationResult> = {
  slug: 'permutation-combination-calculator',
  category: 'math',

  defaultInput: () => ({ n: 10, r: 3 }),

  fields: (): EngineField[] => [
    { name: 'n', labelKey: 'field.n', type: 'number', defaultValue: '10', min: 0, step: 1 },
    { name: 'r', labelKey: 'field.r', type: 'number', defaultValue: '3', min: 0, step: 1 },
  ],

  parseInput: (values): PermutationCombinationInput => ({
    n: Math.abs(Math.round(num(values.n, 10))),
    r: Math.abs(Math.round(num(values.r, 3))),
  }),

  validate: (input) => {
    const { n, r } = input;
    if (!isFiniteNumber(n) || !isFiniteNumber(r) || n < 0 || r < 0) {
      return fail('math.nonNegativeRequired');
    }
    if (r > n) {
      return fail('math.rLessThanN', { field: 'r' });
    }
    return ok();
  },

  compute: (input) => {
    const { n, r } = input;
    let nPr = 1;
    for (let i = n; i > n - r; i--) nPr *= i;

    let nCr = 1;
    const minR = Math.min(r, n - r);
    for (let i = 0; i < minR; i++) nCr = (nCr * (n - i)) / (i + 1);
    nCr = Math.round(nCr);

    const nPrRep = Math.pow(n, r);
    let nCrRep = 1;
    const nRep = n + r - 1;
    if (nRep >= r) {
      const minRRep = Math.min(r, nRep - r);
      for (let i = 0; i < minRRep; i++) nCrRep = (nCrRep * (nRep - i)) / (i + 1);
      nCrRep = Math.round(nCrRep);
    }

    return {
      items: [
        { key: 'nPr', value: nPr, format: 'integer', primary: true },
        { key: 'nCr', value: nCr, format: 'integer', primary: true },
        { key: 'nPrRep', value: nPrRep, format: 'integer' },
        { key: 'nCrRep', value: nCrRep, format: 'integer' },
        { key: 'nFact', value: factorial(n), format: 'integer' },
        { key: 'rFact', value: factorial(r), format: 'integer' },
      ],
    };
  },
};

// =================================== Hex ↔ RGB Converter

export interface HexRgbInput {
  mode: 'hexToRgb' | 'rgbToHex';
  hex: string;
  r: number;
  g: number;
  b: number;
}

export const hexRgbConverterEngine: CalculatorEngine<HexRgbInput, EngineResult> = {
  slug: 'hex-rgb-converter',
  category: 'math',

  defaultInput: () => ({ mode: 'hexToRgb', hex: 'FF5733', r: 255, g: 87, b: 51 }),

  fields: (): EngineField[] => [
    {
      name: 'mode', labelKey: 'field.mode', type: 'radio', defaultValue: 'hexToRgb',
      options: [
        { value: 'hexToRgb', labelKey: 'mode.hexToRgb' },
        { value: 'rgbToHex', labelKey: 'mode.rgbToHex' },
      ],
      span: 2,
    },
    { name: 'hex', labelKey: 'field.hex', type: 'text', defaultValue: 'FF5733', showWhen: { field: 'mode', equals: ['hexToRgb'] } },
    { name: 'r', labelKey: 'field.r', type: 'number', defaultValue: '255', min: 0, max: 255, step: 1, showWhen: { field: 'mode', equals: ['rgbToHex'] } },
    { name: 'g', labelKey: 'field.g', type: 'number', defaultValue: '87', min: 0, max: 255, step: 1, showWhen: { field: 'mode', equals: ['rgbToHex'] } },
    { name: 'b', labelKey: 'field.b', type: 'number', defaultValue: '51', min: 0, max: 255, step: 1, showWhen: { field: 'mode', equals: ['rgbToHex'] } },
  ],

  parseInput: (values): HexRgbInput => ({
    mode: values.mode === 'rgbToHex' ? 'rgbToHex' : 'hexToRgb',
    hex: values.hex || '',
    r: num(values.r, 0),
    g: num(values.g, 0),
    b: num(values.b, 0),
  }),

  validate: (input) => {
    if (input.mode === 'hexToRgb') {
      let hex = input.hex.replace(/^#/, '').trim();
      if (!/^[0-9a-fA-F]{3}$/.test(hex) && !/^[0-9a-fA-F]{6}$/.test(hex)) {
        return fail('hex.invalid', { field: 'hex' });
      }
    }
    return ok();
  },

  compute: (input) => {
    if (input.mode === 'hexToRgb') {
      let hex = input.hex.replace(/^#/, '').trim();
      if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const hexDec = parseInt(hex, 16);
      return {
        items: [
          { key: 'hexDec', value: hexDec, format: 'plain', primary: true },
          { key: 'red', value: r, format: 'integer' },
          { key: 'green', value: g, format: 'integer' },
          { key: 'blue', value: b, format: 'integer' },
        ],
      };
    } else {
      const r = Math.max(0, Math.min(255, Math.round(input.r)));
      const g = Math.max(0, Math.min(255, Math.round(input.g)));
      const b = Math.max(0, Math.min(255, Math.round(input.b)));
      const hexDec = (r << 16) | (g << 8) | b;
      return {
        items: [
          { key: 'hexDec', value: hexDec, format: 'plain', primary: true },
          { key: 'red', value: r, format: 'integer' },
          { key: 'green', value: g, format: 'integer' },
          { key: 'blue', value: b, format: 'integer' },
        ],
      };
    }
  },
};

// =================================== Binary ↔ Decimal Converter

export interface BinaryDecimalInput {
  mode: 'binToDec' | 'decToBin';
  binary: string;
  decimal: number;
}

export const binaryDecimalConverterEngine: CalculatorEngine<BinaryDecimalInput, EngineResult> = {
  slug: 'binary-decimal-converter',
  category: 'math',

  defaultInput: () => ({ mode: 'binToDec', binary: '11010110', decimal: 214 }),

  fields: (): EngineField[] => [
    {
      name: 'mode', labelKey: 'field.mode', type: 'radio', defaultValue: 'binToDec',
      options: [
        { value: 'binToDec', labelKey: 'mode.binToDec' },
        { value: 'decToBin', labelKey: 'mode.decToBin' },
      ],
      span: 2,
    },
    { name: 'binary', labelKey: 'field.binary', type: 'text', defaultValue: '11010110', showWhen: { field: 'mode', equals: ['binToDec'] } },
    { name: 'decimal', labelKey: 'field.decimal', type: 'number', defaultValue: '214', min: 0, step: 1, showWhen: { field: 'mode', equals: ['decToBin'] } },
  ],

  parseInput: (values): BinaryDecimalInput => ({
    mode: values.mode === 'decToBin' ? 'decToBin' : 'binToDec',
    binary: values.binary || '',
    decimal: num(values.decimal, 0),
  }),

  validate: (input) => {
    if (input.mode === 'binToDec') {
      const bin = input.binary.trim();
      if (!bin || !/^[01]+$/.test(bin)) return fail('binary.invalid', { field: 'binary' });
    } else {
      if (!isFiniteNumber(input.decimal) || input.decimal < 0) return fail('decimal.invalid', { field: 'decimal' });
    }
    return ok();
  },

  compute: (input) => {
    if (input.mode === 'binToDec') {
      const dec = parseInt(input.binary.trim(), 2);
      return {
        items: [
          { key: 'decimalValue', value: dec, format: 'integer', primary: true },
          { key: 'octalDec', value: dec, format: 'plain' },
          { key: 'hexDec', value: dec, format: 'plain' },
        ],
      };
    } else {
      const dec = Math.max(0, Math.round(input.decimal));
      return {
        items: [
          { key: 'decimalValue', value: dec, format: 'integer', primary: true },
          { key: 'octalDec', value: dec, format: 'plain' },
          { key: 'hexDec', value: dec, format: 'plain' },
        ],
      };
    }
  },
};

// ====================================================================== Export

export const mathEngines: AnyEngine[] = [
  basicCalculatorEngine as AnyEngine,
  scientificCalculatorEngine as AnyEngine,
  fractionCalculatorEngine as AnyEngine,
  averageCalculatorEngine as AnyEngine,
  exponentCalculatorEngine as AnyEngine,
  logCalculatorEngine as AnyEngine,
  matrixCalculatorEngine as AnyEngine,
  determinantCalculatorEngine as AnyEngine,
  quadraticCalculatorEngine as AnyEngine,
  standardDeviationCalculatorEngine as AnyEngine,
  primeNumberCalculatorEngine as AnyEngine,
  gcfCalculatorEngine as AnyEngine,
  lcmCalculatorEngine as AnyEngine,
  permutationCombinationCalculatorEngine as AnyEngine,
  hexRgbConverterEngine as AnyEngine,
  binaryDecimalConverterEngine as AnyEngine,
];


