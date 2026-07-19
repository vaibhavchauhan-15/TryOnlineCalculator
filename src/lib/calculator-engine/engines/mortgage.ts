// Mortgage — pure engine (finance pilot).
//
// Full PITI payment, total interest and a yearly amortization schedule feeding
// a pie + line chart. Monetary outputs are raw numbers tagged `currency`; the
// active currency symbol and grouping are applied by the localization layer, so
// the same engine renders in $, €, ₹ or any other currency with no change.
//
// Note: the original inline calculator also showed a "Latest mortgage rates"
// info block. That is editorial reference content, not a computed result, so it
// moves to the calculator's MDX (Task 4/10) rather than living in the engine.

import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import { ok, fail } from '../contract';
import { isFiniteNumber, num } from '../units';
import { pmt } from '../../calculators/_math';

export interface MortgageInput {
  homePrice: number;
  downPayment: number;
  rate: number; // annual percentage
  term: number; // years
  tax: number; // yearly property tax
  insurance: number; // yearly home insurance
}

export interface MortgageResult extends EngineResult {}

function principalOf(input: MortgageInput): number {
  return Math.max(input.homePrice - input.downPayment, 0);
}

export const mortgageEngine: CalculatorEngine<MortgageInput, MortgageResult> = {
  slug: 'mortgage-calculator',
  category: 'finance',

  defaultInput: () => ({
    homePrice: 400000,
    downPayment: 80000,
    rate: 6.5,
    term: 30,
    tax: 4800,
    insurance: 1800,
  }),

  fields: (): EngineField[] => [
    { name: 'homePrice', labelKey: 'field.homePrice', type: 'number', defaultValue: '400000', min: 0, step: 1000, currency: true },
    { name: 'downPayment', labelKey: 'field.downPayment', type: 'number', defaultValue: '80000', min: 0, step: 1000, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '6.5', min: 0, max: 40, step: 0.05, suffixKey: '%' },
    { name: 'term', labelKey: 'field.term', type: 'number', defaultValue: '30', min: 1, max: 40, step: 1, suffixKey: 'years' },
    { name: 'tax', labelKey: 'field.tax', type: 'number', defaultValue: '4800', min: 0, step: 100, currency: true },
    { name: 'insurance', labelKey: 'field.insurance', type: 'number', defaultValue: '1800', min: 0, step: 100, currency: true },
  ],

  parseInput: (values): MortgageInput => ({
    homePrice: num(values.homePrice, 0),
    downPayment: num(values.downPayment, 0),
    rate: num(values.rate, 0),
    term: num(values.term, 0),
    tax: num(values.tax, 0),
    insurance: num(values.insurance, 0),
  }),

  validate: (input) => {
    if (![input.homePrice, input.downPayment, input.rate, input.term].every(isFiniteNumber)) {
      return fail('mortgage.invalidInput');
    }
    if (input.downPayment >= input.homePrice && input.homePrice > 0) {
      return fail('mortgage.downPaymentExceedsPrice', { field: 'downPayment' });
    }
    // Cap the term to keep the amortization loop bounded (matches original).
    const n = Math.min(input.term, 100) * 12;
    if (principalOf(input) <= 0 || n <= 0) return fail('mortgage.noLoanAmount');
    return ok();
  },

  compute: (input) => {
    const principal = principalOf(input);
    const r = input.rate / 100 / 12;
    const n = Math.min(input.term, 100) * 12;

    const pi = pmt(r, n, principal);
    const monthlyTax = input.tax / 12;
    const monthlyIns = input.insurance / 12;
    const total = pi + monthlyTax + monthlyIns;
    const totalInterest = pi * n - principal;
    const totalPaid = pi * n + (monthlyTax + monthlyIns) * n;

    // Yearly amortization schedule for the charts.
    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [principal];
    const interestPts: number[] = [0];
    const paidPts: number[] = [0];
    let bal = principal;
    let cumInterest = 0;
    let cumPaid = 0;
    for (let mo = 1; mo <= n; mo++) {
      const interest = bal * r;
      bal = Math.max(bal - (pi - interest), 0);
      cumInterest += interest;
      cumPaid += pi;
      if (mo % 12 === 0 || mo === n) {
        yearLabels.push(String(Math.round(mo / 12)));
        balancePts.push(bal);
        interestPts.push(cumInterest);
        paidPts.push(cumPaid);
      }
    }

    const items: ResultItem[] = [
      { key: 'monthlyPayment', value: total, format: 'currency', primary: true, hintKey: 'mortgage.pitiHint' },
      { key: 'principalInterest', value: pi, format: 'currency' },
      { key: 'taxInsurance', value: monthlyTax + monthlyIns, format: 'currency' },
      { key: 'totalInterest', value: totalInterest, format: 'currency', tone: 'warning' },
      { key: 'totalPayments', value: totalPaid, format: 'currency' },
    ];

    const breakdown: ResultItem[] = [
      { key: 'loanAmount', value: principal, format: 'currency' },
      { key: 'downPayment', value: input.downPayment, format: 'currency', hintKey: 'mortgage.downPaymentPct', hintParams: { pct: input.homePrice ? (input.downPayment / input.homePrice) * 100 : 0 } },
      { key: 'payments', value: n, format: 'integer' },
    ];

    return {
      items,
      breakdown,
      charts: [
        {
          type: 'pie',
          titleKey: 'mortgage.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'principalInterest', value: pi, color: '#0070f3' },
            { labelKey: 'propertyTax', value: monthlyTax, color: '#7928ca' },
            { labelKey: 'homeInsurance', value: monthlyIns, color: '#f5a623' },
          ],
        },
        {
          type: 'line',
          titleKey: 'mortgage.balanceTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'totalInterest', points: interestPts, color: '#f5a623' },
            { labelKey: 'totalPaid', points: paidPts, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};
