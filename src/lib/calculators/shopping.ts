import type { Calculator, ChartSpec } from '../types';
import { num, currency, percent, number } from '../format';

export const shoppingCalculators: Calculator[] = [
  /* ---------------------------------------------------------------- Discount */
  {
    slug: 'discount-calculator',
    category: 'shopping',
    title: 'Discount Calculator',
    description: 'Find the sale price and how much you save from a percentage discount.',
    intro: 'Enter the original price and the discount percentage to see the final price and your savings.',
    keywords: ['discount calculator', 'sale price', 'percent off'],
    popular: true,
    inputs: [
      { name: 'price', label: 'Original price', type: 'number', prefix: '$', default: 120, min: 0, step: 0.01 },
      { name: 'discount', label: 'Discount', type: 'number', suffix: '%', default: 25, min: 0, max: 100, step: 0.5 },
      { name: 'extra', label: 'Extra discount (stacked)', type: 'number', suffix: '%', default: 0, min: 0, max: 100, step: 0.5 },
    ],
    compute: (v) => {
      const price = num(v.price, 0);
      if (price < 0) return { results: [], error: 'Enter a valid price.' };
      const d1 = num(v.discount, 0) / 100;
      const d2 = num(v.extra, 0) / 100;
      const afterFirst = price * (1 - d1);
      const final = afterFirst * (1 - d2);
      const saved = price - final;
      return {
        results: [
          { label: 'Final price', value: currency(final), primary: true },
          { label: 'You save', value: currency(saved), tone: 'success', hint: percent(price ? (saved / price) * 100 : 0, 1) },
        ],
        breakdown: d2 > 0 ? [{ label: 'After first discount', value: currency(afterFirst) }] : undefined,
        charts: price > 0 && saved > 0
          ? [{
              type: 'pie',
              title: 'Final price vs savings',
              format: 'currency',
              slices: [
                { label: 'You pay', value: final, color: '#0070f3' },
                { label: 'You save', value: saved, color: '#50e3c2' },
              ],
            }]
          : undefined,
      };
    },
    formulaItems: [{ name: 'Sale price', expr: 'final = price × (1 − discount)' }],
    faq: [
      { q: 'How do stacked discounts work?', a: 'A second discount usually applies to the already-reduced price, not the original. That is why "25% off then 10% off" is not the same as 35% off.' },
    ],
    related: ['sales-tax-calculator', 'tip-calculator', 'percentage-calculator'],
  },

  /* --------------------------------------------------------------------- Tip */
  {
    slug: 'tip-calculator',
    category: 'shopping',
    title: 'Tip Calculator',
    description: 'Calculate the tip and split the total bill between any number of people.',
    intro: 'Enter the bill, choose a tip percentage and split it across your group.',
    keywords: ['tip calculator', 'gratuity', 'split the bill'],
    popular: true,
    inputs: [
      { name: 'bill', label: 'Bill amount', type: 'number', prefix: '$', default: 84.5, min: 0, step: 0.01 },
      { name: 'tip', label: 'Tip', type: 'number', suffix: '%', default: 18, min: 0, max: 100, step: 1 },
      { name: 'people', label: 'Split between', type: 'number', suffix: 'people', default: 2, min: 1, max: 100, step: 1 },
    ],
    compute: (v) => {
      const bill = num(v.bill, 0);
      if (bill < 0) return { results: [], error: 'Enter a valid bill amount.' };
      const tipPct = num(v.tip, 0) / 100;
      const people = Math.max(Math.floor(num(v.people, 1)), 1);
      const tipAmt = bill * tipPct;
      const total = bill + tipAmt;
      return {
        results: [
          { label: 'Total with tip', value: currency(total), primary: true },
          { label: 'Tip amount', value: currency(tipAmt) },
          { label: `Each person pays`, value: currency(total / people), hint: `Split ${people} ways` },
        ],
        breakdown: [{ label: 'Tip per person', value: currency(tipAmt / people) }],
        charts: bill > 0
          ? [{
              type: 'pie',
              title: 'Bill vs tip',
              format: 'currency',
              slices: [
                { label: 'Bill', value: bill, color: '#0070f3' },
                { label: 'Tip', value: Math.max(tipAmt, 0), color: '#f5a623' },
              ],
            }]
          : undefined,
      };
    },
    faq: [
      { q: 'How much should I tip?', a: 'In the US, 15%–20% is typical for table service. This calculator defaults to 18%, but you can set any percentage.' },
      { q: 'Should I tip on the pre-tax amount?', a: 'Either is common. Tipping on the pre-tax subtotal is technically correct, but many people tip on the full total for simplicity.' },
    ],
    related: ['sales-tax-calculator', 'discount-calculator', 'percentage-calculator'],
  },

  /* --------------------------------------------------------------- Sales Tax */
  {
    slug: 'sales-tax-calculator',
    category: 'shopping',
    title: 'Sales Tax Calculator',
    description: 'Add sales tax to a price or work out the tax portion of a total.',
    intro: 'Enter a price and tax rate to see the tax amount and the final total.',
    keywords: ['sales tax calculator', 'add tax', 'tax included'],
    inputs: [
      { name: 'price', label: 'Amount', type: 'number', prefix: '$', default: 60, min: 0, step: 0.01 },
      { name: 'rate', label: 'Sales tax rate', type: 'number', suffix: '%', default: 8.25, min: 0, max: 30, step: 0.01 },
      {
        name: 'mode', label: 'The amount above is', type: 'radio', default: 'pretax', span: 2,
        options: [
          { label: 'Before tax', value: 'pretax' },
          { label: 'Tax included', value: 'gross' },
        ],
      },
    ],
    compute: (v) => {
      const amount = num(v.price, 0);
      const rate = num(v.rate, 0) / 100;
      if (amount < 0) return { results: [], error: 'Enter a valid amount.' };
      const taxPie = (net: number, tax: number): ChartSpec[] =>
        net > 0 || tax > 0
          ? [{
              type: 'pie',
              title: 'Pre-tax price vs tax',
              format: 'currency',
              slices: [
                { label: 'Pre-tax price', value: Math.max(net, 0), color: '#0070f3' },
                { label: 'Sales tax', value: Math.max(tax, 0), color: '#f5a623' },
              ],
            }]
          : [];
      if (v.mode === 'gross') {
        const net = amount / (1 + rate);
        const tax = amount - net;
        return {
          results: [
            { label: 'Pre-tax price', value: currency(net), primary: true },
            { label: 'Tax portion', value: currency(tax) },
            { label: 'Total', value: currency(amount) },
          ],
          charts: taxPie(net, tax),
        };
      }
      const tax = amount * rate;
      return {
        results: [
          { label: 'Total with tax', value: currency(amount + tax), primary: true },
          { label: 'Tax amount', value: currency(tax) },
          { label: 'Pre-tax price', value: currency(amount) },
        ],
        charts: taxPie(amount, tax),
      };
    },
    faq: [
      { q: 'How do I remove tax from a total?', a: 'Switch the mode to "Tax included". The calculator divides by (1 + rate) to recover the original pre-tax price.' },
    ],
    related: ['discount-calculator', 'tip-calculator', 'percentage-calculator'],
  },
];
