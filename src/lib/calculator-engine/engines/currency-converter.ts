// Currency Converter — pure engine (live-API pilot).
//
// The conversion math is pure and instant: given the amount, the from/to codes
// and a rate map (`usdPer[CODE]` = value of one unit of CODE in USD), the
// converted amount is `amount * usdPer[from] / usdPer[to]`. This is the same
// factor model the rest of the site uses.
//
// The LIVE part — fetching fresh rates from the Frankfurter API — stays in the
// browser (src/lib/rates.ts) and is *injected* here as raw data. That keeps the
// engine pure and, crucially, unit-testable: tests pass a fixed `usdPer` map
// and never touch the network (the live path is mocked). The result is raw
// numbers only; the target-currency code travels as a hint param so the
// localization/formatting layer can render it in the right currency.

import type { CalculatorEngine, EngineResult, EngineField } from '../contract';
import { ok, fail } from '../contract';
import { isFiniteNumber, num } from '../units';
import { CURRENCIES } from '../../currency';

export interface CurrencyConverterInput {
  amount: number;
  from: string;
  to: string;
  /** value of ONE unit of each code in USD (live or static baseline). */
  usdPer: Record<string, number>;
}

export interface CurrencyConverterResult extends EngineResult {}

/** Pure conversion: raw converted amount, or NaN when a rate is missing. */
export function convert(amount: number, from: string, to: string, usdPer: Record<string, number>): number {
  const f = usdPer[from];
  const t = usdPer[to];
  if (!f || !t) return NaN;
  return (amount * f) / t;
}

/** Pure exchange rate (units of `to` per one unit of `from`). */
export function exchangeRate(from: string, to: string, usdPer: Record<string, number>): number {
  return convert(1, from, to, usdPer);
}

export const currencyConverterEngine: CalculatorEngine<CurrencyConverterInput, CurrencyConverterResult> = {
  slug: 'currency-converter',
  category: 'finance',

  defaultInput: () => ({ amount: 1, from: 'USD', to: 'EUR', usdPer: { USD: 1, EUR: 1.08 } }),

  fields: (): EngineField[] => {
    // Currency codes are not translated, so each option's labelKey is the code
    // itself (the resolver falls back to the key verbatim).
    const options = CURRENCIES.map((c) => ({ value: c.code, labelKey: c.code }));
    return [
      { name: 'amount', labelKey: 'field.amount', type: 'number', defaultValue: '1', min: 0, step: 1, span: 2 },
      { name: 'from', labelKey: 'field.from', type: 'select', defaultValue: 'USD', options },
      { name: 'to', labelKey: 'field.to', type: 'select', defaultValue: 'EUR', options },
    ];
  },

  // The live FX map is injected by the client (runtime.usdPer); the SSR seed and
  // tests pass a static baseline. Falls back to a 1:1 map so validate() surfaces
  // the "rate unavailable" issue rather than throwing.
  parseInput: (values, runtime): CurrencyConverterInput => ({
    amount: num(values.amount, 1),
    from: values.from || 'USD',
    to: values.to || 'EUR',
    usdPer: (runtime?.usdPer as Record<string, number>) ?? {},
  }),

  validate: (input) => {
    if (!isFiniteNumber(input.amount)) return fail('currency.amountRequired', { field: 'amount' });
    if (!input.usdPer[input.from]) return fail('currency.rateUnavailable', { field: 'from', params: { code: input.from } });
    if (!input.usdPer[input.to]) return fail('currency.rateUnavailable', { field: 'to', params: { code: input.to } });
    return ok();
  },

  compute: (input) => {
    const converted = convert(input.amount, input.from, input.to, input.usdPer);
    const rate = exchangeRate(input.from, input.to, input.usdPer);
    return {
      items: [
        // `format: 'plain'` because the target currency is per-conversion (not
        // the visitor's preference); the target code rides along as a param so
        // the formatter renders it in `to`, not the active currency.
        { key: 'converted', value: converted, format: 'plain', primary: true, hintParams: { from: input.from, to: input.to } },
        { key: 'rate', value: rate, format: 'plain', hintParams: { from: input.from, to: input.to } },
      ],
    };
  },
};
