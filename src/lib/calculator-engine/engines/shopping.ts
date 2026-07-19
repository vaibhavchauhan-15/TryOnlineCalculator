// Shopping — pure engines (discount, tip, sales tax).
//
// Straight arithmetic over money + percentages. Every monetary output is a raw
// number tagged `currency`; the active currency symbol and grouping are applied
// by the localization layer, so the same engine renders in $, €, ₹ or any other
// currency with no change. Percentages/counts carried into messages travel as
// raw `hintParams`, never as prose. Category labels (e.g. the sales-tax mode)
// are enum keys resolved downstream.

import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import type { AnyEngine } from '../index';
import { ok, fail } from '../contract';
import { num } from '../units';

// ---------------------------------------------------------------- Discount

export interface DiscountInput {
  price: number;
  discount: number; // percentage
  extra: number; // stacked percentage
}

export interface DiscountResult extends EngineResult {}

export const discountEngine: CalculatorEngine<DiscountInput, DiscountResult> = {
  slug: 'discount-calculator',
  category: 'shopping',

  defaultInput: () => ({ price: 120, discount: 25, extra: 0 }),

  fields: (): EngineField[] => [
    { name: 'price', labelKey: 'field.price', type: 'number', defaultValue: '120', min: 0, step: 0.01, currency: true },
    { name: 'discount', labelKey: 'field.discount', type: 'number', defaultValue: '25', min: 0, max: 100, step: 0.5, suffixKey: '%' },
    { name: 'extra', labelKey: 'field.extra', type: 'number', defaultValue: '0', min: 0, max: 100, step: 0.5, suffixKey: '%' },
  ],

  parseInput: (values): DiscountInput => ({
    price: num(values.price, 0),
    discount: num(values.discount, 0),
    extra: num(values.extra, 0),
  }),

  validate: (input) => {
    if (input.price < 0) return fail('shopping.invalidPrice', { field: 'price' });
    return ok();
  },

  compute: (input) => {
    const price = input.price;
    const d1 = input.discount / 100;
    const d2 = input.extra / 100;
    const afterFirst = price * (1 - d1);
    const final = afterFirst * (1 - d2);
    const saved = price - final;

    const items: ResultItem[] = [
      { key: 'finalPrice', value: final, format: 'currency', primary: true },
      {
        key: 'savings',
        value: saved,
        format: 'currency',
        tone: 'success',
        hintKey: 'discount.savingsPct',
        hintParams: { pct: price ? (saved / price) * 100 : 0 },
      },
    ];

    const result: DiscountResult = { items };

    if (d2 > 0) {
      result.breakdown = [{ key: 'afterFirstDiscount', value: afterFirst, format: 'currency' }];
    }

    if (price > 0 && saved > 0) {
      result.charts = [
        {
          type: 'pie',
          titleKey: 'discount.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'youPay', value: final, color: '#0070f3' },
            { labelKey: 'youSave', value: saved, color: '#50e3c2' },
          ],
        },
      ];
    }

    return result;
  },
};

// --------------------------------------------------------------------- Tip

export interface TipInput {
  bill: number;
  tip: number; // percentage
  people: number;
}

export interface TipResult extends EngineResult {}

export const tipEngine: CalculatorEngine<TipInput, TipResult> = {
  slug: 'tip-calculator',
  category: 'shopping',

  defaultInput: () => ({ bill: 84.5, tip: 18, people: 2 }),

  fields: (): EngineField[] => [
    { name: 'bill', labelKey: 'field.bill', type: 'number', defaultValue: '84.5', min: 0, step: 0.01, currency: true },
    { name: 'tip', labelKey: 'field.tip', type: 'number', defaultValue: '18', min: 0, max: 100, step: 1, suffixKey: '%' },
    { name: 'people', labelKey: 'field.people', type: 'number', defaultValue: '2', min: 1, max: 100, step: 1, suffixKey: 'people' },
  ],

  parseInput: (values): TipInput => ({
    bill: num(values.bill, 0),
    tip: num(values.tip, 0),
    people: num(values.people, 1),
  }),

  validate: (input) => {
    if (input.bill < 0) return fail('shopping.invalidBill', { field: 'bill' });
    return ok();
  },

  compute: (input) => {
    const bill = input.bill;
    const tipPct = input.tip / 100;
    const people = Math.max(Math.floor(input.people), 1);
    const tipAmt = bill * tipPct;
    const total = bill + tipAmt;

    const items: ResultItem[] = [
      { key: 'totalWithTip', value: total, format: 'currency', primary: true },
      { key: 'tipAmount', value: tipAmt, format: 'currency' },
      {
        key: 'perPerson',
        value: total / people,
        format: 'currency',
        hintKey: 'tip.splitWays',
        hintParams: { people },
      },
    ];

    const result: TipResult = {
      items,
      breakdown: [{ key: 'tipPerPerson', value: tipAmt / people, format: 'currency' }],
    };

    if (bill > 0) {
      result.charts = [
        {
          type: 'pie',
          titleKey: 'tip.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'bill', value: bill, color: '#0070f3' },
            { labelKey: 'tip', value: Math.max(tipAmt, 0), color: '#f5a623' },
          ],
        },
      ];
    }

    return result;
  },
};

// --------------------------------------------------------------- Sales Tax

export type SalesTaxMode = 'pretax' | 'gross';

export interface SalesTaxInput {
  price: number;
  rate: number; // percentage
  mode: SalesTaxMode;
}

export interface SalesTaxResult extends EngineResult {}

export const salesTaxEngine: CalculatorEngine<SalesTaxInput, SalesTaxResult> = {
  slug: 'sales-tax-calculator',
  category: 'shopping',

  defaultInput: () => ({ price: 60, rate: 8.25, mode: 'pretax' }),

  fields: (): EngineField[] => [
    { name: 'price', labelKey: 'field.price', type: 'number', defaultValue: '60', min: 0, step: 0.01, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '8.25', min: 0, max: 30, step: 0.01, suffixKey: '%' },
    {
      name: 'mode', labelKey: 'field.mode', type: 'radio', defaultValue: 'pretax', span: 2,
      options: [
        { value: 'pretax', labelKey: 'mode.pretax' },
        { value: 'gross', labelKey: 'mode.gross' },
      ],
    },
  ],

  parseInput: (values): SalesTaxInput => ({
    price: num(values.price, 0),
    rate: num(values.rate, 0),
    mode: values.mode === 'gross' ? 'gross' : 'pretax',
  }),

  validate: (input) => {
    if (input.price < 0) return fail('shopping.invalidAmount', { field: 'price' });
    return ok();
  },

  compute: (input) => {
    const amount = input.price;
    const rate = input.rate / 100;

    const taxPie = (net: number, tax: number): SalesTaxResult['charts'] =>
      net > 0 || tax > 0
        ? [
            {
              type: 'pie',
              titleKey: 'salesTax.pieTitle',
              format: 'currency',
              slices: [
                { labelKey: 'preTaxPrice', value: Math.max(net, 0), color: '#0070f3' },
                { labelKey: 'salesTax', value: Math.max(tax, 0), color: '#f5a623' },
              ],
            },
          ]
        : undefined;

    if (input.mode === 'gross') {
      const net = amount / (1 + rate);
      const tax = amount - net;
      return {
        items: [
          { key: 'preTaxPrice', value: net, format: 'currency', primary: true },
          { key: 'taxPortion', value: tax, format: 'currency' },
          { key: 'total', value: amount, format: 'currency' },
        ],
        charts: taxPie(net, tax),
      };
    }

    const tax = amount * rate;
    return {
      items: [
        { key: 'totalWithTax', value: amount + tax, format: 'currency', primary: true },
        { key: 'taxAmount', value: tax, format: 'currency' },
        { key: 'preTaxPrice', value: amount, format: 'currency' },
      ],
      charts: taxPie(amount, tax),
    };
  },
};

// ------------------------------------------------------------------ Export

export const shoppingEngines: AnyEngine[] = [
  discountEngine as AnyEngine,
  tipEngine as AnyEngine,
  salesTaxEngine as AnyEngine,
];
