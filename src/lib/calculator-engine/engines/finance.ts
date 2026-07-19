// Finance — pure engines (loan, auto loan, car payment, investment, SIP,
// compound interest, savings, APR, simple/compound interest, retirement).
//
// Migrated from the legacy inline `financeCalculators`. The two finance
// calculators that already have engines — `mortgage-calculator` (see
// ./mortgage) and `currency-converter` (see ./currency-converter) — are NOT
// duplicated here.
//
// The maths is preserved exactly from each legacy compute(), reusing the shared
// helpers in ../../calculators/_math (pmt, futureValue, solveRate). Every
// monetary output is a raw number tagged `currency`; rates/percentages travel
// as raw magnitudes tagged `percent`; counts as `integer`; plain multiples as
// `decimal`. The active currency symbol, grouping and unit labels are applied
// later by the localization layer, so the same engine renders in $, €, ₹ or any
// other currency/locale with no change. All labels/titles are machine KEYS.
//
// Editorial reference blocks (e.g. the mortgage "Latest rates" info panel) are
// intentionally omitted — that content lives in the calculator MDX, not here.

import type { CalculatorEngine, EngineResult, ResultItem, ChartData, EngineField } from '../contract';
import type { AnyEngine } from '../index';
import { ok, fail } from '../contract';
import { num } from '../units';
import { pmt, futureValue, solveRate } from '../../calculators/_math';

// =====================================================================
// Loan
// =====================================================================

export interface LoanInput {
  amount: number;
  rate: number; // annual percentage
  term: number; // years
}

export interface LoanResult extends EngineResult {}

export const loanEngine: CalculatorEngine<LoanInput, LoanResult> = {
  slug: 'loan-calculator',
  category: 'finance',

  defaultInput: () => ({ amount: 25000, rate: 9, term: 5 }),

  fields: (): EngineField[] => [
    { name: 'amount', labelKey: 'field.amount', type: 'number', defaultValue: '25000', min: 0, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '9', min: 0, max: 60, step: 0.01, suffixKey: '%' },
    { name: 'term', labelKey: 'field.term', type: 'number', defaultValue: '5', min: 0.1, max: 40, step: 0.5, suffixKey: 'years' },
  ],

  parseInput: (values): LoanInput => ({
    amount: num(values.amount, 0),
    rate: num(values.rate, 0),
    term: num(values.term, 0),
  }),

  validate: (input) => {
    const n = Math.min(input.term, 100) * 12;
    if (input.amount <= 0 || n <= 0) return fail('finance.loanRequired');
    return ok();
  },

  compute: (input) => {
    const p = input.amount;
    const r = input.rate / 100 / 12;
    const n = Math.min(input.term, 100) * 12; // cap term so the schedule loop stays bounded
    const m = pmt(r, n, p);
    const total = m * n;

    // Yearly balance / cumulative interest for the payoff line chart.
    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [p];
    const interestPts: number[] = [0];
    let bal = p;
    let cumInterest = 0;
    for (let k = 1; k <= n; k++) {
      const interest = bal * r;
      bal = Math.max(bal - (m - interest), 0);
      cumInterest += interest;
      if (k % 12 === 0 || k === n) {
        yearLabels.push(String(Math.round(k / 12)));
        balancePts.push(bal);
        interestPts.push(cumInterest);
      }
    }

    const items: ResultItem[] = [
      { key: 'monthlyPayment', value: m, format: 'currency', primary: true },
      { key: 'totalInterest', value: total - p, format: 'currency', tone: 'warning' },
      { key: 'totalPaid', value: total, format: 'currency' },
    ];

    const charts: ChartData[] = [
      {
        type: 'pie',
        titleKey: 'loan.pieTitle',
        format: 'currency',
        slices: [
          { labelKey: 'principal', value: p, color: '#0070f3' },
          { labelKey: 'interest', value: total - p, color: '#f5a623' },
        ],
      },
    ];
    if (balancePts.length > 2) {
      charts.push({
        type: 'line',
        titleKey: 'loan.balanceTitle',
        format: 'currency',
        labels: yearLabels,
        series: [
          { labelKey: 'balance', points: balancePts, color: '#0070f3' },
          { labelKey: 'totalInterest', points: interestPts, color: '#f5a623' },
        ],
      });
    }

    return { items, charts };
  },
};

// =====================================================================
// Auto Loan
// =====================================================================

export interface AutoLoanInput {
  price: number;
  down: number;
  trade: number;
  tax: number; // sales tax percentage
  rate: number; // annual percentage
  term: number; // months
}

export interface AutoLoanResult extends EngineResult {}

export const autoLoanEngine: CalculatorEngine<AutoLoanInput, AutoLoanResult> = {
  slug: 'auto-loan-calculator',
  category: 'finance',

  defaultInput: () => ({ price: 32000, down: 4000, trade: 0, tax: 7, rate: 7.5, term: 60 }),

  fields: (): EngineField[] => [
    { name: 'price', labelKey: 'field.vehiclePrice', type: 'number', defaultValue: '32000', min: 0, step: 500, currency: true },
    { name: 'down', labelKey: 'field.downPayment', type: 'number', defaultValue: '4000', min: 0, step: 250, currency: true },
    { name: 'trade', labelKey: 'field.tradeIn', type: 'number', defaultValue: '0', min: 0, step: 250, currency: true },
    { name: 'tax', labelKey: 'field.salesTax', type: 'number', defaultValue: '7', min: 0, max: 20, step: 0.1, suffixKey: '%' },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '7.5', min: 0, max: 40, step: 0.01, suffixKey: '%' },
    { name: 'term', labelKey: 'field.term', type: 'number', defaultValue: '60', min: 1, max: 120, step: 1, suffixKey: 'months' },
  ],

  parseInput: (values): AutoLoanInput => ({
    price: num(values.price, 0),
    down: num(values.down, 0),
    trade: num(values.trade, 0),
    tax: num(values.tax, 0),
    rate: num(values.rate, 0),
    term: num(values.term, 0),
  }),

  validate: (input) => {
    const taxAmt = (input.price * input.tax) / 100;
    const principal = Math.max(input.price + taxAmt - input.down - input.trade, 0);
    if (principal <= 0 || input.term <= 0) return fail('finance.noFinanceAmount');
    return ok();
  },

  compute: (input) => {
    const price = input.price;
    const down = input.down;
    const trade = input.trade;
    const taxAmt = (price * input.tax) / 100;
    const principal = Math.max(price + taxAmt - down - trade, 0);
    const r = input.rate / 100 / 12;
    const n = input.term;
    const m = pmt(r, n, principal);
    const interest = m * n - principal;
    const upfront = down + trade;

    const items: ResultItem[] = [
      { key: 'monthlyPayment', value: m, format: 'currency', primary: true },
      { key: 'amountFinanced', value: principal, format: 'currency' },
      { key: 'salesTax', value: taxAmt, format: 'currency' },
      { key: 'totalInterest', value: interest, format: 'currency', tone: 'warning' },
      { key: 'totalCost', value: m * n + upfront, format: 'currency' },
    ];

    return {
      items,
      charts: [
        {
          type: 'pie',
          titleKey: 'autoLoan.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'amountFinanced', value: principal, color: '#0070f3' },
            { labelKey: 'interest', value: interest, color: '#f5a623' },
            ...(upfront > 0 ? [{ labelKey: 'downTradeIn', value: upfront, color: '#7928ca' }] : []),
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Car Payment
// =====================================================================

export interface CarPaymentInput {
  amount: number;
  rate: number; // annual percentage
  term: number; // months
}

export interface CarPaymentResult extends EngineResult {}

export const carPaymentEngine: CalculatorEngine<CarPaymentInput, CarPaymentResult> = {
  slug: 'car-payment-calculator',
  category: 'finance',

  defaultInput: () => ({ amount: 28000, rate: 7.5, term: 60 }),

  fields: (): EngineField[] => [
    { name: 'amount', labelKey: 'field.amountFinanced', type: 'number', defaultValue: '28000', min: 0, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '7.5', min: 0, max: 40, step: 0.01, suffixKey: '%' },
    { name: 'term', labelKey: 'field.term', type: 'number', defaultValue: '60', min: 1, max: 120, step: 1, suffixKey: 'months' },
  ],

  parseInput: (values): CarPaymentInput => ({
    amount: num(values.amount, 0),
    rate: num(values.rate, 0),
    term: num(values.term, 0),
  }),

  validate: (input) => {
    if (input.amount <= 0 || input.term <= 0) return fail('finance.amountTermRequired');
    return ok();
  },

  compute: (input) => {
    const p = input.amount;
    const r = input.rate / 100 / 12;
    const n = input.term;
    const m = pmt(r, n, p);

    const items: ResultItem[] = [
      { key: 'monthlyPayment', value: m, format: 'currency', primary: true },
      { key: 'totalInterest', value: m * n - p, format: 'currency', tone: 'warning' },
      { key: 'totalPaid', value: m * n, format: 'currency' },
    ];

    return {
      items,
      charts: [
        {
          type: 'pie',
          titleKey: 'carPayment.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'principal', value: p, color: '#0070f3' },
            { labelKey: 'interest', value: m * n - p, color: '#f5a623' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Investment
// =====================================================================

export interface InvestmentInput {
  initial: number;
  monthly: number;
  rate: number; // annual percentage
  years: number;
}

export interface InvestmentResult extends EngineResult {}

export const investmentEngine: CalculatorEngine<InvestmentInput, InvestmentResult> = {
  slug: 'investment-calculator',
  category: 'finance',

  defaultInput: () => ({ initial: 10000, monthly: 500, rate: 8, years: 20 }),

  fields: (): EngineField[] => [
    { name: 'initial', labelKey: 'field.initialInvestment', type: 'number', defaultValue: '10000', min: 0, step: 500, currency: true },
    { name: 'monthly', labelKey: 'field.monthlyContribution', type: 'number', defaultValue: '500', min: 0, step: 50, currency: true },
    { name: 'rate', labelKey: 'field.annualReturn', type: 'number', defaultValue: '8', min: -50, max: 100, step: 0.1, suffixKey: '%' },
    { name: 'years', labelKey: 'field.years', type: 'number', defaultValue: '20', min: 1, max: 80, step: 1, suffixKey: 'years' },
  ],

  parseInput: (values): InvestmentInput => ({
    initial: num(values.initial, 0),
    monthly: num(values.monthly, 0),
    rate: num(values.rate, 0),
    years: num(values.years, 0),
  }),

  validate: (input) => {
    const n = Math.min(input.years, 100) * 12;
    if (n <= 0) return fail('finance.yearsRequired', { field: 'years' });
    return ok();
  },

  compute: (input) => {
    const pv = input.initial;
    const c = input.monthly;
    const r = input.rate / 100 / 12;
    const n = Math.min(input.years, 100) * 12; // cap horizon so the growth loop stays bounded
    const fv = futureValue(r, n, c, pv);
    const contributed = pv + c * n;

    // Year-by-year balance vs money contributed for the growth chart.
    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [pv];
    const contribPts: number[] = [pv];
    let bal = pv;
    for (let k = 1; k <= n; k++) {
      bal = bal * (1 + r) + c;
      if (k % 12 === 0 || k === n) {
        yearLabels.push(String(Math.round(k / 12)));
        balancePts.push(bal);
        contribPts.push(pv + c * k);
      }
    }

    const items: ResultItem[] = [
      { key: 'futureValue', value: fv, format: 'currency', primary: true },
      { key: 'totalContributed', value: contributed, format: 'currency' },
      { key: 'interestEarned', value: fv - contributed, format: 'currency', tone: 'success' },
    ];

    const breakdown: ResultItem[] = [
      { key: 'growthMultiple', value: contributed ? fv / contributed : 0, format: 'decimal', precision: 2 },
    ];

    return {
      items,
      breakdown,
      charts: [
        {
          type: 'pie',
          titleKey: 'investment.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'contributed', value: contributed, color: '#0070f3' },
            { labelKey: 'growth', value: Math.max(fv - contributed, 0), color: '#50e3c2' },
          ],
        },
        {
          type: 'line',
          titleKey: 'investment.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'contributed', points: contribPts, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// SIP
// =====================================================================

export type SipMode = 'sip' | 'lumpsum';

export interface SipInput {
  mode: SipMode;
  amount: number;
  rate: number; // annual percentage
  years: number;
  stepup: number; // annual step-up percentage
}

export interface SipResult extends EngineResult {}

export const sipEngine: CalculatorEngine<SipInput, SipResult> = {
  slug: 'sip-calculator',
  category: 'finance',

  defaultInput: () => ({ mode: 'sip', amount: 25000, rate: 12, years: 10, stepup: 0 }),

  fields: (): EngineField[] => [
    {
      name: 'mode', labelKey: 'field.investmentType', type: 'radio', defaultValue: 'sip',
      options: [
        { value: 'sip', labelKey: 'mode.sip' },
        { value: 'lumpsum', labelKey: 'mode.lumpsum' },
      ],
    },
    { name: 'amount', labelKey: 'field.investmentAmount', type: 'number', defaultValue: '25000', min: 0, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.expectedReturn', type: 'number', defaultValue: '12', min: 0, max: 40, step: 0.1, suffixKey: '%' },
    { name: 'years', labelKey: 'field.timePeriod', type: 'number', defaultValue: '10', min: 1, max: 40, step: 1, suffixKey: 'years' },
    { name: 'stepup', labelKey: 'field.annualStepUp', type: 'number', defaultValue: '0', min: 0, max: 25, step: 1, suffixKey: '%', helpKey: 'sip.stepUpHelp' },
  ],

  parseInput: (values): SipInput => ({
    mode: values.mode === 'lumpsum' ? 'lumpsum' : 'sip',
    amount: num(values.amount, 0),
    rate: num(values.rate, 0),
    years: num(values.years, 0),
    stepup: num(values.stepup, 0),
  }),

  validate: (input) => {
    const years = Math.min(Math.round(input.years), 100);
    if (input.amount <= 0 || years <= 0) return fail('finance.amountYearsRequired');
    return ok();
  },

  compute: (input) => {
    const mode: SipMode = input.mode === 'lumpsum' ? 'lumpsum' : 'sip';
    const amount = input.amount;
    const rate = input.rate;
    const years = Math.min(Math.round(input.years), 100);
    const stepUp = mode === 'sip' ? Math.max(input.stepup, 0) : 0;

    let invested: number;
    let total: number;
    // Growth of invested capital vs total value, sampled each year for the chart.
    const yearLabels: string[] = ['0'];
    const investedPts: number[] = [mode === 'lumpsum' ? amount : 0];
    const valuePts: number[] = [mode === 'lumpsum' ? amount : 0];

    if (mode === 'lumpsum') {
      invested = amount;
      total = amount * Math.pow(1 + rate / 100, years);
      for (let y = 1; y <= years; y++) {
        yearLabels.push(String(y));
        investedPts.push(amount);
        valuePts.push(amount * Math.pow(1 + rate / 100, y));
      }
    } else {
      // Effective monthly rate (compounds to the stated annual return),
      // not the nominal rate/12 which over-states SIP maturity.
      const i = Math.pow(1 + rate / 100, 1 / 12) - 1;
      const g = stepUp / 100;
      let fv = 0;
      let put = 0;
      let monthly = amount;
      for (let y = 0; y < years; y++) {
        for (let m = 0; m < 12; m++) {
          fv = (fv + monthly) * (1 + i);
          put += monthly;
        }
        monthly *= 1 + g;
        yearLabels.push(String(y + 1));
        investedPts.push(put);
        valuePts.push(fv);
      }
      invested = put;
      total = fv;
    }

    const gains = Math.max(total - invested, 0);

    const items: ResultItem[] = [
      { key: 'totalValue', value: total, format: 'currency', precision: 0, primary: true, hintKey: mode === 'lumpsum' ? 'sip.oneTimeHint' : 'sip.endOfPlanHint' },
      { key: 'investedAmount', value: invested, format: 'currency', precision: 0 },
      { key: 'estReturns', value: gains, format: 'currency', precision: 0, tone: 'success' },
    ];

    const breakdown: ResultItem[] = [
      { key: mode === 'lumpsum' ? 'totalInvestment' : 'monthlyInvestment', value: amount, format: 'currency', precision: 0 },
      { key: 'wealthGainMultiple', value: invested ? total / invested : 0, format: 'decimal', precision: 2 },
      ...(mode === 'sip' && stepUp > 0 ? [{ key: 'annualStepUp', value: stepUp, format: 'percent' as const, precision: 0 }] : []),
    ];

    const charts: ChartData[] = [
      {
        type: 'pie',
        titleKey: 'sip.pieTitle',
        format: 'currency',
        slices: [
          { labelKey: 'investedAmount', value: invested, color: '#0070f3' },
          { labelKey: 'estReturns', value: gains, color: '#50e3c2' },
        ],
      },
    ];
    if (valuePts.length > 2) {
      charts.push({
        type: 'line',
        titleKey: 'sip.growthTitle',
        format: 'currency',
        labels: yearLabels,
        series: [
          { labelKey: 'totalValue', points: valuePts, color: '#0070f3' },
          { labelKey: 'invested', points: investedPts, color: '#7928ca' },
        ],
      });
    }

    return { items, breakdown, charts };
  },
};

// =====================================================================
// Compound Interest
// =====================================================================

export interface CompoundInterestInput {
  principal: number;
  rate: number; // annual percentage
  years: number;
  freq: number; // compounds per year
  deposit: number; // added each period
}

export interface CompoundInterestResult extends EngineResult {}

export const compoundInterestEngine: CalculatorEngine<CompoundInterestInput, CompoundInterestResult> = {
  slug: 'compound-interest-calculator',
  category: 'finance',

  defaultInput: () => ({ principal: 5000, rate: 5, years: 10, freq: 12, deposit: 0 }),

  fields: (): EngineField[] => [
    { name: 'principal', labelKey: 'field.principal', type: 'number', defaultValue: '5000', min: 0, step: 100, currency: true },
    { name: 'rate', labelKey: 'field.annualRate', type: 'number', defaultValue: '5', min: 0, max: 100, step: 0.01, suffixKey: '%' },
    { name: 'years', labelKey: 'field.years', type: 'number', defaultValue: '10', min: 0.1, max: 80, step: 0.5, suffixKey: 'years' },
    {
      name: 'freq', labelKey: 'field.compoundFrequency', type: 'select', defaultValue: '12',
      options: [
        { value: '1', labelKey: 'freq.annually' },
        { value: '2', labelKey: 'freq.semiannually' },
        { value: '4', labelKey: 'freq.quarterly' },
        { value: '12', labelKey: 'freq.monthly' },
        { value: '365', labelKey: 'freq.daily' },
      ],
    },
    { name: 'deposit', labelKey: 'field.addedEachPeriod', type: 'number', defaultValue: '0', min: 0, step: 50, currency: true },
  ],

  parseInput: (values): CompoundInterestInput => ({
    principal: num(values.principal, 0),
    rate: num(values.rate, 0),
    years: num(values.years, 0),
    freq: num(values.freq, 12),
    deposit: num(values.deposit, 0),
  }),

  validate: (input) => {
    const t = Math.min(input.years, 100);
    const k = Math.min(input.freq, 365);
    if (t <= 0 || k <= 0) return fail('finance.periodRequired', { field: 'years' });
    return ok();
  },

  compute: (input) => {
    const p = input.principal;
    const rate = input.rate / 100;
    // Cap years and compounds/year so the nested sampling loop stays bounded.
    const t = Math.min(input.years, 100);
    const k = Math.min(input.freq, 365);
    const c = input.deposit;
    const r = rate / k;
    const n = k * t;
    const fv = futureValue(r, n, c, p);
    const contributed = p + c * n;

    // Sample the balance at each whole year for the growth line chart.
    const wholeYears = Math.floor(t);
    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [p];
    const depositPts: number[] = [p];
    let bal = p;
    let period = 0;
    for (let y = 1; y <= wholeYears; y++) {
      for (let j = 0; j < k; j++) {
        bal = bal * (1 + r) + c;
        period++;
      }
      yearLabels.push(String(y));
      balancePts.push(bal);
      depositPts.push(p + c * period);
    }

    const items: ResultItem[] = [
      { key: 'futureBalance', value: fv, format: 'currency', primary: true },
      { key: 'totalDeposited', value: contributed, format: 'currency' },
      { key: 'interestEarned', value: fv - contributed, format: 'currency', tone: 'success' },
    ];

    const charts: ChartData[] = [
      {
        type: 'pie',
        titleKey: 'compound.pieTitle',
        format: 'currency',
        slices: [
          { labelKey: 'deposited', value: contributed, color: '#0070f3' },
          { labelKey: 'interest', value: Math.max(fv - contributed, 0), color: '#50e3c2' },
        ],
      },
    ];
    if (balancePts.length > 2) {
      charts.push({
        type: 'line',
        titleKey: 'compound.balanceTitle',
        format: 'currency',
        labels: yearLabels,
        series: [
          { labelKey: 'balance', points: balancePts, color: '#0070f3' },
          { labelKey: 'deposited', points: depositPts, color: '#7928ca' },
        ],
      });
    }

    return { items, charts };
  },
};

// =====================================================================
// Savings
// =====================================================================

export interface SavingsInput {
  initial: number;
  monthly: number;
  rate: number; // annual percentage
  years: number;
}

export interface SavingsResult extends EngineResult {}

export const savingsEngine: CalculatorEngine<SavingsInput, SavingsResult> = {
  slug: 'savings-calculator',
  category: 'finance',

  defaultInput: () => ({ initial: 1000, monthly: 300, rate: 4, years: 5 }),

  fields: (): EngineField[] => [
    { name: 'initial', labelKey: 'field.startingBalance', type: 'number', defaultValue: '1000', min: 0, step: 100, currency: true },
    { name: 'monthly', labelKey: 'field.monthlyDeposit', type: 'number', defaultValue: '300', min: 0, step: 25, currency: true },
    { name: 'rate', labelKey: 'field.annualRate', type: 'number', defaultValue: '4', min: 0, max: 50, step: 0.01, suffixKey: '%' },
    { name: 'years', labelKey: 'field.years', type: 'number', defaultValue: '5', min: 0.1, max: 60, step: 0.5, suffixKey: 'years' },
  ],

  parseInput: (values): SavingsInput => ({
    initial: num(values.initial, 0),
    monthly: num(values.monthly, 0),
    rate: num(values.rate, 0),
    years: num(values.years, 0),
  }),

  validate: (input) => {
    const n = Math.min(input.years, 100) * 12;
    if (n <= 0) return fail('finance.yearsRequired', { field: 'years' });
    return ok();
  },

  compute: (input) => {
    const pv = input.initial;
    const c = input.monthly;
    const r = input.rate / 100 / 12;
    const n = Math.min(input.years, 100) * 12; // cap horizon so the growth loop stays bounded
    const fv = futureValue(r, n, c, pv);
    const contributed = pv + c * n;

    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [pv];
    const depositPts: number[] = [pv];
    let bal = pv;
    for (let k = 1; k <= n; k++) {
      bal = bal * (1 + r) + c;
      if (k % 12 === 0 || k === n) {
        yearLabels.push(String(Math.round(k / 12)));
        balancePts.push(bal);
        depositPts.push(pv + c * k);
      }
    }

    const items: ResultItem[] = [
      { key: 'finalBalance', value: fv, format: 'currency', primary: true },
      { key: 'totalDeposited', value: contributed, format: 'currency' },
      { key: 'interestEarned', value: fv - contributed, format: 'currency', tone: 'success' },
    ];

    const charts: ChartData[] = [
      {
        type: 'pie',
        titleKey: 'savings.pieTitle',
        format: 'currency',
        slices: [
          { labelKey: 'deposited', value: contributed, color: '#0070f3' },
          { labelKey: 'interest', value: Math.max(fv - contributed, 0), color: '#50e3c2' },
        ],
      },
    ];
    if (balancePts.length > 2) {
      charts.push({
        type: 'line',
        titleKey: 'savings.growthTitle',
        format: 'currency',
        labels: yearLabels,
        series: [
          { labelKey: 'balance', points: balancePts, color: '#0070f3' },
          { labelKey: 'deposited', points: depositPts, color: '#7928ca' },
        ],
      });
    }

    return { items, charts };
  },
};

// =====================================================================
// APR
// =====================================================================

export interface AprInput {
  amount: number;
  fees: number;
  rate: number; // annual percentage
  term: number; // years
}

export interface AprResult extends EngineResult {}

export const aprEngine: CalculatorEngine<AprInput, AprResult> = {
  slug: 'apr-calculator',
  category: 'finance',

  defaultInput: () => ({ amount: 20000, fees: 600, rate: 6, term: 5 }),

  fields: (): EngineField[] => [
    { name: 'amount', labelKey: 'field.loanAmount', type: 'number', defaultValue: '20000', min: 0, step: 500, currency: true },
    { name: 'fees', labelKey: 'field.upfrontFees', type: 'number', defaultValue: '600', min: 0, step: 50, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '6', min: 0, max: 60, step: 0.01, suffixKey: '%' },
    { name: 'term', labelKey: 'field.term', type: 'number', defaultValue: '5', min: 0.1, max: 40, step: 0.5, suffixKey: 'years' },
  ],

  parseInput: (values): AprInput => ({
    amount: num(values.amount, 0),
    fees: num(values.fees, 0),
    rate: num(values.rate, 0),
    term: num(values.term, 0),
  }),

  validate: (input) => {
    const n = input.term * 12;
    if (input.amount <= 0 || n <= 0) return fail('finance.loanAmountRequired');
    return ok();
  },

  compute: (input) => {
    const amount = input.amount;
    const fees = input.fees;
    const r = input.rate / 100 / 12;
    const n = input.term * 12;
    const payment = pmt(r, n, amount);
    const net = amount - fees; // borrower actually receives this
    const monthlyApr = solveRate(n, payment, net);
    const apr = monthlyApr * 12 * 100;
    const totalInterest = payment * n - amount;

    const items: ResultItem[] = [
      { key: 'apr', value: apr, format: 'percent', precision: 3, primary: true },
      { key: 'monthlyPayment', value: payment, format: 'currency' },
      { key: 'nominalRate', value: input.rate, format: 'percent', precision: 2 },
      { key: 'totalFees', value: fees, format: 'currency' },
    ];

    return {
      items,
      charts: [
        {
          type: 'pie',
          titleKey: 'apr.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'amountBorrowed', value: amount, color: '#0070f3' },
            { labelKey: 'interest', value: Math.max(totalInterest, 0), color: '#f5a623' },
            ...(fees > 0 ? [{ labelKey: 'fees', value: fees, color: '#ff0080' }] : []),
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Interest (simple / compound)
// =====================================================================

export type InterestType = 'compound' | 'simple';

export interface InterestInput {
  principal: number;
  rate: number; // annual percentage
  years: number;
  type: InterestType;
}

export interface InterestResult extends EngineResult {}

export const interestEngine: CalculatorEngine<InterestInput, InterestResult> = {
  slug: 'interest-calculator',
  category: 'finance',

  defaultInput: () => ({ principal: 10000, rate: 5, years: 3, type: 'compound' }),

  fields: (): EngineField[] => [
    { name: 'principal', labelKey: 'field.principal', type: 'number', defaultValue: '10000', min: 0, step: 100, currency: true },
    { name: 'rate', labelKey: 'field.annualRate', type: 'number', defaultValue: '5', min: 0, max: 100, step: 0.01, suffixKey: '%' },
    { name: 'years', labelKey: 'field.time', type: 'number', defaultValue: '3', min: 0.1, max: 80, step: 0.5, suffixKey: 'years' },
    {
      name: 'type', labelKey: 'field.interestType', type: 'radio', defaultValue: 'compound',
      options: [
        { value: 'compound', labelKey: 'type.compound' },
        { value: 'simple', labelKey: 'type.simple' },
      ],
    },
  ],

  parseInput: (values): InterestInput => ({
    principal: num(values.principal, 0),
    rate: num(values.rate, 0),
    years: num(values.years, 0),
    type: values.type === 'simple' ? 'simple' : 'compound',
  }),

  validate: (input) => {
    if (input.years <= 0) return fail('finance.periodRequired', { field: 'years' });
    return ok();
  },

  compute: (input) => {
    const p = input.principal;
    const rate = input.rate / 100;
    const t = input.years;
    let interest: number;
    if (input.type === 'simple') interest = p * rate * t;
    else interest = p * (Math.pow(1 + rate, t) - 1);

    const items: ResultItem[] = [
      { key: 'interest', value: interest, format: 'currency', primary: true },
      { key: 'finalBalance', value: p + interest, format: 'currency' },
      { key: 'principal', value: p, format: 'currency' },
    ];

    const charts: ChartData[] = p > 0
      ? [{
          type: 'pie',
          titleKey: 'interest.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'principal', value: p, color: '#0070f3' },
            { labelKey: 'interest', value: Math.max(interest, 0), color: '#50e3c2' },
          ],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// Retirement
// =====================================================================

export interface RetirementInput {
  age: number;
  retireAge: number;
  current: number;
  monthly: number;
  rate: number; // annual percentage
}

export interface RetirementResult extends EngineResult {}

export const retirementEngine: CalculatorEngine<RetirementInput, RetirementResult> = {
  slug: 'retirement-calculator',
  category: 'finance',

  defaultInput: () => ({ age: 30, retireAge: 65, current: 25000, monthly: 600, rate: 7 }),

  fields: (): EngineField[] => [
    { name: 'age', labelKey: 'field.currentAge', type: 'number', defaultValue: '30', min: 0, max: 100, step: 1, suffixKey: 'years' },
    { name: 'retireAge', labelKey: 'field.retirementAge', type: 'number', defaultValue: '65', min: 1, max: 100, step: 1, suffixKey: 'years' },
    { name: 'current', labelKey: 'field.currentSavings', type: 'number', defaultValue: '25000', min: 0, step: 1000, currency: true },
    { name: 'monthly', labelKey: 'field.monthlyContribution', type: 'number', defaultValue: '600', min: 0, step: 50, currency: true },
    { name: 'rate', labelKey: 'field.annualReturn', type: 'number', defaultValue: '7', min: -20, max: 60, step: 0.1, suffixKey: '%' },
  ],

  parseInput: (values): RetirementInput => ({
    age: num(values.age, 0),
    retireAge: num(values.retireAge, 0),
    current: num(values.current, 0),
    monthly: num(values.monthly, 0),
    rate: num(values.rate, 0),
  }),

  validate: (input) => {
    const years = Math.min(input.retireAge - input.age, 120);
    if (years <= 0) return fail('finance.retireAgeInvalid', { field: 'retireAge' });
    return ok();
  },

  compute: (input) => {
    const age = input.age;
    const retire = input.retireAge;
    const years = Math.min(retire - age, 120); // cap span so the projection loop stays bounded
    const pv = input.current;
    const c = input.monthly;
    const r = input.rate / 100 / 12;
    const n = years * 12;
    const fv = futureValue(r, n, c, pv);
    const contributed = pv + c * n;

    // Balance vs contributed at each age from now to retirement.
    const ageLabels: string[] = [String(age)];
    const balancePts: number[] = [pv];
    const contribPts: number[] = [pv];
    let bal = pv;
    for (let k = 1; k <= n; k++) {
      bal = bal * (1 + r) + c;
      if (k % 12 === 0 || k === n) {
        ageLabels.push(String(age + Math.round(k / 12)));
        balancePts.push(bal);
        contribPts.push(pv + c * k);
      }
    }

    const items: ResultItem[] = [
      { key: 'balanceAtRetirement', value: fv, format: 'currency', primary: true, hintKey: 'retirement.inYears', hintParams: { years } },
      { key: 'totalContributed', value: contributed, format: 'currency' },
      { key: 'investmentGrowth', value: fv - contributed, format: 'currency', tone: 'success' },
      { key: 'estMonthlyIncome', value: (fv * 0.04) / 12, format: 'currency' },
    ];

    const charts: ChartData[] = [
      {
        type: 'pie',
        titleKey: 'retirement.pieTitle',
        format: 'currency',
        slices: [
          { labelKey: 'contributed', value: contributed, color: '#0070f3' },
          { labelKey: 'growth', value: Math.max(fv - contributed, 0), color: '#50e3c2' },
        ],
      },
    ];
    if (balancePts.length > 2) {
      charts.push({
        type: 'line',
        titleKey: 'retirement.growthTitle',
        format: 'currency',
        labels: ageLabels,
        series: [
          { labelKey: 'balance', points: balancePts, color: '#0070f3' },
          { labelKey: 'contributed', points: contribPts, color: '#7928ca' },
        ],
      });
    }

    return { items, charts };
  },
};

// =====================================================================
// Export
// =====================================================================

export const financeEngines: AnyEngine[] = [
  loanEngine as AnyEngine,
  autoLoanEngine as AnyEngine,
  carPaymentEngine as AnyEngine,
  investmentEngine as AnyEngine,
  sipEngine as AnyEngine,
  compoundInterestEngine as AnyEngine,
  savingsEngine as AnyEngine,
  aprEngine as AnyEngine,
  interestEngine as AnyEngine,
  retirementEngine as AnyEngine,
];
