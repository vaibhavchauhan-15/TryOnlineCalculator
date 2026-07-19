// Percentage — pure engine (math pilot).
//
// Three modes (what is X% of Y / X is what percent of Y / percent change).
// Results are raw numbers keyed by mode; the direction of a change is an enum
// key ("increase"/"decrease"), never a localized word. The `a`/`b` operands are
// attached as hint params so the localization layer can build a phrase like
// "15% of 200" without the engine ever producing prose.

import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import { ok, fail } from '../contract';
import { isFiniteNumber, num } from '../units';

export type PercentMode = 'percentOf' | 'whatPercent' | 'change';

export interface PercentageInput {
  mode: PercentMode;
  a: number;
  b: number;
}

export interface PercentageResult extends EngineResult {}

export const percentageEngine: CalculatorEngine<PercentageInput, PercentageResult> = {
  slug: 'percentage-calculator',
  category: 'math',

  defaultInput: () => ({ mode: 'percentOf', a: 15, b: 200 }),

  fields: (): EngineField[] => [
    {
      name: 'mode', labelKey: 'field.mode', type: 'select', defaultValue: 'percentOf', span: 2,
      options: [
        { value: 'percentOf', labelKey: 'mode.percentOf' },
        { value: 'whatPercent', labelKey: 'mode.whatPercent' },
        { value: 'change', labelKey: 'mode.change' },
      ],
    },
    { name: 'a', labelKey: 'field.a', type: 'number', defaultValue: '15', step: 1 },
    { name: 'b', labelKey: 'field.b', type: 'number', defaultValue: '200', step: 1 },
  ],

  parseInput: (values): PercentageInput => {
    const mode: PercentMode =
      values.mode === 'whatPercent' || values.mode === 'change' ? values.mode : 'percentOf';
    return { mode, a: num(values.a, 0), b: num(values.b, 0) };
  },

  validate: (input) => {
    if (!isFiniteNumber(input.a) || !isFiniteNumber(input.b)) return fail('percentage.bothRequired');
    if (input.mode === 'whatPercent' && input.b === 0) return fail('percentage.yNonZero', { field: 'b' });
    if (input.mode === 'change' && input.a === 0) return fail('percentage.xNonZero', { field: 'a' });
    return ok();
  },

  compute: (input) => {
    const { a, b } = input;

    if (input.mode === 'percentOf') {
      return {
        items: [
          { key: 'result', value: (a / 100) * b, format: 'decimal', precision: 6, primary: true, hintParams: { a, b } },
        ],
      };
    }

    if (input.mode === 'whatPercent') {
      return {
        items: [
          { key: 'result', value: (a / b) * 100, format: 'percent', precision: 4, primary: true, hintParams: { a, b } },
        ],
      };
    }

    // Percentage change from a to b.
    const change = ((b - a) / Math.abs(a)) * 100;
    const items: ResultItem[] = [
      {
        key: 'percentChange',
        value: change,
        format: 'percent',
        precision: 4,
        primary: true,
        tone: change >= 0 ? 'success' : 'error',
        enumKey: change >= 0 ? 'increase' : 'decrease',
      },
      { key: 'absoluteChange', value: b - a, format: 'decimal', precision: 6 },
    ];
    return { items };
  },
};
