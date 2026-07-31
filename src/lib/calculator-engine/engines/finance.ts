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
// FD Calculator (Fixed Deposit)
// =====================================================================

export interface FdInput {
  depositAmount: number;
  rate: number;
  tenureYears: number;
  compounding: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly';
}

export interface FdResult extends EngineResult {}

export const fdEngine: CalculatorEngine<FdInput, FdResult> = {
  slug: 'fd-calculator',
  category: 'finance',

  defaultInput: () => ({ depositAmount: 100000, rate: 7, tenureYears: 5, compounding: 'quarterly' }),

  fields: (): EngineField[] => [
    { name: 'depositAmount', labelKey: 'field.depositAmount', type: 'number', defaultValue: '100000', min: 0, step: 1000, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '7', min: 0, max: 30, step: 0.01, suffixKey: '%' },
    { name: 'tenureYears', labelKey: 'field.tenureYears', type: 'number', defaultValue: '5', min: 0.25, max: 30, step: 0.25, suffixKey: 'years' },
    {
      name: 'compounding',
      labelKey: 'field.compounding',
      type: 'select',
      defaultValue: 'quarterly',
      options: [
        { labelKey: 'compounding.monthly', value: 'monthly' },
        { labelKey: 'compounding.quarterly', value: 'quarterly' },
        { labelKey: 'compounding.halfYearly', value: 'halfYearly' },
        { labelKey: 'compounding.yearly', value: 'yearly' },
      ],
    },
  ],

  parseInput: (v): FdInput => ({
    depositAmount: num(v.depositAmount, 0),
    rate: num(v.rate, 0),
    tenureYears: num(v.tenureYears, 0),
    compounding: (['monthly', 'quarterly', 'halfYearly', 'yearly'].includes(String(v.compounding)) ? String(v.compounding) : 'quarterly') as FdInput['compounding'],
  }),

  validate: (input) => {
    if (input.depositAmount <= 0 || input.tenureYears <= 0) return fail('finance.fdRequired');
    return ok();
  },

  compute: (input) => {
    const p = input.depositAmount;
    const r = input.rate / 100;
    const t = Math.min(input.tenureYears, 50);
    const freqMap = { monthly: 12, quarterly: 4, halfYearly: 2, yearly: 1 };
    const n = freqMap[input.compounding] || 4;
    const maturity = p * Math.pow(1 + r / n, n * t);
    const interest = Math.max(maturity - p, 0);

    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [p];
    const interestPts: number[] = [0];
    for (let y = 1; y <= Math.ceil(t); y++) {
      const curT = Math.min(y, t);
      const val = p * Math.pow(1 + r / n, n * curT);
      yearLabels.push(String(y));
      balancePts.push(val);
      interestPts.push(val - p);
    }

    return {
      items: [
        { key: 'maturityAmount', value: maturity, format: 'currency', primary: true },
        { key: 'totalInvestment', value: p, format: 'currency' },
        { key: 'totalInterest', value: interest, format: 'currency', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'fd.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'principal', value: p, color: '#0070f3' },
            { labelKey: 'interest', value: interest, color: '#50e3c2' },
          ],
        },
        {
          type: 'line',
          titleKey: 'fd.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'interest', points: interestPts, color: '#50e3c2' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// RD Calculator (Recurring Deposit)
// =====================================================================

export interface RdInput {
  monthlyDeposit: number;
  rate: number;
  tenureYears: number;
}

export interface RdResult extends EngineResult {}

export const rdEngine: CalculatorEngine<RdInput, RdResult> = {
  slug: 'rd-calculator',
  category: 'finance',

  defaultInput: () => ({ monthlyDeposit: 5000, rate: 7, tenureYears: 3 }),

  fields: (): EngineField[] => [
    { name: 'monthlyDeposit', labelKey: 'field.monthlyDeposit', type: 'number', defaultValue: '5000', min: 0, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '7', min: 0, max: 30, step: 0.01, suffixKey: '%' },
    { name: 'tenureYears', labelKey: 'field.tenureYears', type: 'number', defaultValue: '3', min: 0.25, max: 30, step: 0.25, suffixKey: 'years' },
  ],

  parseInput: (v): RdInput => ({
    monthlyDeposit: num(v.monthlyDeposit, 0),
    rate: num(v.rate, 0),
    tenureYears: num(v.tenureYears, 0),
  }),

  validate: (input) => {
    if (input.monthlyDeposit <= 0 || input.tenureYears <= 0) return fail('finance.rdRequired');
    return ok();
  },

  compute: (input) => {
    const P = input.monthlyDeposit;
    const r = input.rate / 100;
    const totalMonths = Math.min(input.tenureYears * 12, 600);
    const invested = P * totalMonths;

    let maturity = 0;
    for (let m = 1; m <= totalMonths; m++) {
      const monthsCompounded = totalMonths - m + 1;
      maturity += P * Math.pow(1 + r / 4, (4 * monthsCompounded) / 12);
    }
    const interest = Math.max(maturity - invested, 0);

    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [0];
    const investedPts: number[] = [0];
    let curBal = 0;
    for (let m = 1; m <= totalMonths; m++) {
      curBal = (curBal + P) * Math.pow(1 + r / 4, 4 / 12);
      if (m % 12 === 0 || m === totalMonths) {
        yearLabels.push(String(Math.round(m / 12)));
        balancePts.push(curBal);
        investedPts.push(P * m);
      }
    }

    return {
      items: [
        { key: 'maturityAmount', value: maturity, format: 'currency', primary: true },
        { key: 'totalInvested', value: invested, format: 'currency' },
        { key: 'totalInterest', value: interest, format: 'currency', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'rd.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'invested', value: invested, color: '#0070f3' },
            { labelKey: 'interest', value: interest, color: '#50e3c2' },
          ],
        },
        {
          type: 'line',
          titleKey: 'rd.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'invested', points: investedPts, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// SWP Calculator (Systematic Withdrawal Plan)
// =====================================================================

export interface SwpInput {
  totalInvestment: number;
  monthlyWithdrawal: number;
  rate: number;
  tenureYears: number;
}

export interface SwpResult extends EngineResult {}

export const swpEngine: CalculatorEngine<SwpInput, SwpResult> = {
  slug: 'swp-calculator',
  category: 'finance',

  defaultInput: () => ({ totalInvestment: 500000, monthlyWithdrawal: 4000, rate: 8, tenureYears: 10 }),

  fields: (): EngineField[] => [
    { name: 'totalInvestment', labelKey: 'field.totalInvestment', type: 'number', defaultValue: '500000', min: 0, step: 5000, currency: true },
    { name: 'monthlyWithdrawal', labelKey: 'field.monthlyWithdrawal', type: 'number', defaultValue: '4000', min: 0, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '8', min: 0, max: 30, step: 0.01, suffixKey: '%' },
    { name: 'tenureYears', labelKey: 'field.tenureYears', type: 'number', defaultValue: '10', min: 1, max: 40, step: 1, suffixKey: 'years' },
  ],

  parseInput: (v): SwpInput => ({
    totalInvestment: num(v.totalInvestment, 0),
    monthlyWithdrawal: num(v.monthlyWithdrawal, 0),
    rate: num(v.rate, 0),
    tenureYears: num(v.tenureYears, 0),
  }),

  validate: (input) => {
    if (input.totalInvestment <= 0 || input.tenureYears <= 0) return fail('finance.swpRequired');
    return ok();
  },

  compute: (input) => {
    const P = input.totalInvestment;
    const W = input.monthlyWithdrawal;
    const r = input.rate / 100 / 12;
    const totalMonths = Math.min(input.tenureYears * 12, 600);

    let bal = P;
    let totalWithdrawn = 0;
    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [P];
    const withdrawnPts: number[] = [0];

    for (let m = 1; m <= totalMonths; m++) {
      const interest = bal * r;
      bal = Math.max(bal + interest - W, 0);
      totalWithdrawn += W;
      if (m % 12 === 0 || m === totalMonths) {
        yearLabels.push(String(Math.round(m / 12)));
        balancePts.push(bal);
        withdrawnPts.push(totalWithdrawn);
      }
    }

    const totalReturns = bal + totalWithdrawn - P;

    return {
      items: [
        { key: 'finalBalance', value: bal, format: 'currency', primary: true },
        { key: 'totalWithdrawn', value: totalWithdrawn, format: 'currency' },
        { key: 'totalReturns', value: totalReturns, format: 'currency', tone: totalReturns >= 0 ? 'success' : 'warning' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'swp.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'finalBalance', value: bal, color: '#0070f3' },
            { labelKey: 'totalWithdrawn', value: totalWithdrawn, color: '#7928ca' },
          ],
        },
        {
          type: 'line',
          titleKey: 'swp.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'withdrawn', points: withdrawnPts, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// PPF Calculator (Public Provident Fund)
// =====================================================================

export interface PpfInput {
  yearlyInvestment: number;
  rate: number;
  tenureYears: number;
}

export interface PpfResult extends EngineResult {}

export const ppfEngine: CalculatorEngine<PpfInput, PpfResult> = {
  slug: 'ppf-calculator',
  category: 'finance',

  defaultInput: () => ({ yearlyInvestment: 150000, rate: 7.1, tenureYears: 15 }),

  fields: (): EngineField[] => [
    { name: 'yearlyInvestment', labelKey: 'field.yearlyInvestment', type: 'number', defaultValue: '150000', min: 500, max: 150000, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '7.1', min: 0, max: 20, step: 0.1, suffixKey: '%' },
    { name: 'tenureYears', labelKey: 'field.tenureYears', type: 'number', defaultValue: '15', min: 15, max: 50, step: 5, suffixKey: 'years' },
  ],

  parseInput: (v): PpfInput => ({
    yearlyInvestment: num(v.yearlyInvestment, 0),
    rate: num(v.rate, 0),
    tenureYears: num(v.tenureYears, 0),
  }),

  validate: (input) => {
    if (input.yearlyInvestment <= 0 || input.tenureYears < 15) return fail('finance.ppfRequired');
    return ok();
  },

  compute: (input) => {
    const P = Math.min(input.yearlyInvestment, 150000);
    const r = input.rate / 100;
    const years = Math.min(input.tenureYears, 50);

    let bal = 0;
    let invested = 0;
    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [0];
    const investedPts: number[] = [0];

    for (let y = 1; y <= years; y++) {
      invested += P;
      bal = (bal + P) * (1 + r);
      yearLabels.push(String(y));
      balancePts.push(bal);
      investedPts.push(invested);
    }

    const interest = Math.max(bal - invested, 0);

    return {
      items: [
        { key: 'maturityValue', value: bal, format: 'currency', primary: true },
        { key: 'totalInvested', value: invested, format: 'currency' },
        { key: 'totalInterest', value: interest, format: 'currency', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'ppf.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'invested', value: invested, color: '#0070f3' },
            { labelKey: 'interest', value: interest, color: '#50e3c2' },
          ],
        },
        {
          type: 'line',
          titleKey: 'ppf.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'invested', points: investedPts, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// NPS Calculator (National Pension System)
// =====================================================================

export interface NpsInput {
  monthlyContribution: number;
  currentAge: number;
  retirementAge: number;
  rate: number;
  annuityPercent: number;
  annuityRate: number;
}

export interface NpsResult extends EngineResult {}

export const npsEngine: CalculatorEngine<NpsInput, NpsResult> = {
  slug: 'nps-calculator',
  category: 'finance',

  defaultInput: () => ({ monthlyContribution: 5000, currentAge: 30, retirementAge: 60, rate: 10, annuityPercent: 40, annuityRate: 6 }),

  fields: (): EngineField[] => [
    { name: 'monthlyContribution', labelKey: 'field.monthlyContribution', type: 'number', defaultValue: '5000', min: 500, step: 500, currency: true },
    { name: 'currentAge', labelKey: 'field.currentAge', type: 'number', defaultValue: '30', min: 18, max: 69, step: 1, suffixKey: 'years' },
    { name: 'retirementAge', labelKey: 'field.retirementAge', type: 'number', defaultValue: '60', min: 50, max: 75, step: 1, suffixKey: 'years' },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '10', min: 0, max: 25, step: 0.1, suffixKey: '%' },
    { name: 'annuityPercent', labelKey: 'field.annuityPercent', type: 'number', defaultValue: '40', min: 40, max: 100, step: 5, suffixKey: '%' },
    { name: 'annuityRate', labelKey: 'field.annuityRate', type: 'number', defaultValue: '6', min: 0, max: 15, step: 0.1, suffixKey: '%' },
  ],

  parseInput: (v): NpsInput => ({
    monthlyContribution: num(v.monthlyContribution, 0),
    currentAge: num(v.currentAge, 0),
    retirementAge: num(v.retirementAge, 0),
    rate: num(v.rate, 0),
    annuityPercent: num(v.annuityPercent, 0),
    annuityRate: num(v.annuityRate, 0),
  }),

  validate: (input) => {
    if (input.monthlyContribution <= 0 || input.retirementAge <= input.currentAge) return fail('finance.npsRequired');
    return ok();
  },

  compute: (input) => {
    const P = input.monthlyContribution;
    const years = Math.min(input.retirementAge - input.currentAge, 60);
    const months = years * 12;
    const r = input.rate / 100 / 12;

    const totalCorpus = futureValue(r, months, P, 0);
    const annuityCorpus = totalCorpus * (Math.max(input.annuityPercent, 40) / 100);
    const lumpSum = totalCorpus - annuityCorpus;
    const monthlyPension = (annuityCorpus * (input.annuityRate / 100)) / 12;

    const ageLabels: string[] = [String(input.currentAge)];
    const corpusPts: number[] = [0];
    let bal = 0;
    for (let m = 1; m <= months; m++) {
      bal = bal * (1 + r) + P;
      if (m % 12 === 0 || m === months) {
        ageLabels.push(String(input.currentAge + Math.round(m / 12)));
        corpusPts.push(bal);
      }
    }

    return {
      items: [
        { key: 'totalCorpus', value: totalCorpus, format: 'currency', primary: true },
        { key: 'lumpSumWithdrawal', value: lumpSum, format: 'currency' },
        { key: 'annuityCorpus', value: annuityCorpus, format: 'currency' },
        { key: 'monthlyPension', value: monthlyPension, format: 'currency', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'nps.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'lumpSum', value: lumpSum, color: '#0070f3' },
            { labelKey: 'annuityCorpus', value: annuityCorpus, color: '#7928ca' },
          ],
        },
        {
          type: 'line',
          titleKey: 'nps.growthTitle',
          format: 'currency',
          labels: ageLabels,
          series: [{ labelKey: 'balance', points: corpusPts, color: '#0070f3' }],
        },
      ],
    };
  },
};

// =====================================================================
// Mutual Fund Calculator
// =====================================================================

export interface MutualFundInput {
  mode: 'sip' | 'lumpsum';
  amount: number;
  rate: number;
  tenureYears: number;
}

export interface MutualFundResult extends EngineResult {}

export const mutualFundEngine: CalculatorEngine<MutualFundInput, MutualFundResult> = {
  slug: 'mutual-fund-calculator',
  category: 'finance',

  defaultInput: () => ({ mode: 'sip', amount: 5000, rate: 12, tenureYears: 10 }),

  fields: (): EngineField[] => [
    {
      name: 'mode',
      labelKey: 'field.mode',
      type: 'select',
      defaultValue: 'sip',
      options: [
        { labelKey: 'mode.sip', value: 'sip' },
        { labelKey: 'mode.lumpsum', value: 'lumpsum' },
      ],
    },
    { name: 'amount', labelKey: 'field.amount', type: 'number', defaultValue: '5000', min: 100, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '12', min: 0, max: 30, step: 0.1, suffixKey: '%' },
    { name: 'tenureYears', labelKey: 'field.tenureYears', type: 'number', defaultValue: '10', min: 1, max: 40, step: 1, suffixKey: 'years' },
  ],

  parseInput: (v): MutualFundInput => ({
    mode: v.mode === 'lumpsum' ? 'lumpsum' : 'sip',
    amount: num(v.amount, 0),
    rate: num(v.rate, 0),
    tenureYears: num(v.tenureYears, 0),
  }),

  validate: (input) => {
    if (input.amount <= 0 || input.tenureYears <= 0) return fail('finance.mfRequired');
    return ok();
  },

  compute: (input) => {
    const P = input.amount;
    const r = input.rate / 100;
    const years = Math.min(input.tenureYears, 50);

    let totalValue = 0;
    let invested = 0;
    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [0];
    const investedPts: number[] = [0];

    if (input.mode === 'sip') {
      const rm = r / 12;
      const months = years * 12;
      invested = P * months;
      totalValue = futureValue(rm, months, P, 0);

      let bal = 0;
      balancePts[0] = 0;
      investedPts[0] = 0;
      for (let m = 1; m <= months; m++) {
        bal = bal * (1 + rm) + P;
        if (m % 12 === 0 || m === months) {
          yearLabels.push(String(Math.round(m / 12)));
          balancePts.push(bal);
          investedPts.push(P * m);
        }
      }
    } else {
      invested = P;
      totalValue = P * Math.pow(1 + r, years);
      balancePts[0] = P;
      investedPts[0] = P;
      for (let y = 1; y <= years; y++) {
        yearLabels.push(String(y));
        balancePts.push(P * Math.pow(1 + r, y));
        investedPts.push(P);
      }
    }

    const returns = Math.max(totalValue - invested, 0);

    return {
      items: [
        { key: 'totalValue', value: totalValue, format: 'currency', primary: true },
        { key: 'investedAmount', value: invested, format: 'currency' },
        { key: 'estReturns', value: returns, format: 'currency', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'mf.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'invested', value: invested, color: '#0070f3' },
            { labelKey: 'returns', value: returns, color: '#50e3c2' },
          ],
        },
        {
          type: 'line',
          titleKey: 'mf.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'invested', points: investedPts, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Lumpsum Calculator
// =====================================================================

export interface LumpsumInput {
  investment: number;
  rate: number;
  tenureYears: number;
}

export interface LumpsumResult extends EngineResult {}

export const lumpsumEngine: CalculatorEngine<LumpsumInput, LumpsumResult> = {
  slug: 'lumpsum-calculator',
  category: 'finance',

  defaultInput: () => ({ investment: 100000, rate: 12, tenureYears: 10 }),

  fields: (): EngineField[] => [
    { name: 'investment', labelKey: 'field.investment', type: 'number', defaultValue: '100000', min: 500, step: 1000, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '12', min: 0, max: 30, step: 0.1, suffixKey: '%' },
    { name: 'tenureYears', labelKey: 'field.tenureYears', type: 'number', defaultValue: '10', min: 1, max: 40, step: 1, suffixKey: 'years' },
  ],

  parseInput: (v): LumpsumInput => ({
    investment: num(v.investment, 0),
    rate: num(v.rate, 0),
    tenureYears: num(v.tenureYears, 0),
  }),

  validate: (input) => {
    if (input.investment <= 0 || input.tenureYears <= 0) return fail('finance.lumpsumRequired');
    return ok();
  },

  compute: (input) => {
    const P = input.investment;
    const r = input.rate / 100;
    const years = Math.min(input.tenureYears, 50);

    const maturityValue = P * Math.pow(1 + r, years);
    const growth = Math.max(maturityValue - P, 0);

    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [P];
    const growthPts: number[] = [0];

    for (let y = 1; y <= years; y++) {
      const val = P * Math.pow(1 + r, y);
      yearLabels.push(String(y));
      balancePts.push(val);
      growthPts.push(val - P);
    }

    return {
      items: [
        { key: 'maturityValue', value: maturityValue, format: 'currency', primary: true },
        { key: 'totalInvested', value: P, format: 'currency' },
        { key: 'totalGrowth', value: growth, format: 'currency', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'lumpsum.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'principal', value: P, color: '#0070f3' },
            { labelKey: 'growth', value: growth, color: '#50e3c2' },
          ],
        },
        {
          type: 'line',
          titleKey: 'lumpsum.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'growth', points: growthPts, color: '#50e3c2' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Simple Interest Calculator
// =====================================================================

export interface SimpleInterestInput {
  principal: number;
  rate: number;
  termYears: number;
}

export interface SimpleInterestResult extends EngineResult {}

export const simpleInterestEngine: CalculatorEngine<SimpleInterestInput, SimpleInterestResult> = {
  slug: 'simple-interest-calculator',
  category: 'finance',

  defaultInput: () => ({ principal: 10000, rate: 5, termYears: 3 }),

  fields: (): EngineField[] => [
    { name: 'principal', labelKey: 'field.principal', type: 'number', defaultValue: '10000', min: 0, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '5', min: 0, max: 100, step: 0.1, suffixKey: '%' },
    { name: 'termYears', labelKey: 'field.termYears', type: 'number', defaultValue: '3', min: 0.1, max: 50, step: 0.5, suffixKey: 'years' },
  ],

  parseInput: (v): SimpleInterestInput => ({
    principal: num(v.principal, 0),
    rate: num(v.rate, 0),
    termYears: num(v.termYears, 0),
  }),

  validate: (input) => {
    if (input.principal <= 0 || input.termYears <= 0) return fail('finance.siRequired');
    return ok();
  },

  compute: (input) => {
    const P = input.principal;
    const r = input.rate / 100;
    const t = Math.min(input.termYears, 50);

    const interest = P * r * t;
    const totalAmount = P + interest;

    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [P];
    const interestPts: number[] = [0];

    for (let y = 1; y <= Math.ceil(t); y++) {
      const curT = Math.min(y, t);
      const curI = P * r * curT;
      yearLabels.push(String(y));
      balancePts.push(P + curI);
      interestPts.push(curI);
    }

    return {
      items: [
        { key: 'totalAmount', value: totalAmount, format: 'currency', primary: true },
        { key: 'principalAmount', value: P, format: 'currency' },
        { key: 'totalInterest', value: interest, format: 'currency', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'simpleInterest.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'principal', value: P, color: '#0070f3' },
            { labelKey: 'interest', value: interest, color: '#50e3c2' },
          ],
        },
        {
          type: 'line',
          titleKey: 'simpleInterest.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'interest', points: interestPts, color: '#50e3c2' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Credit Card Payoff Calculator
// =====================================================================

export interface CreditCardPayoffInput {
  balance: number;
  apr: number;
  monthlyPayment: number;
}

export interface CreditCardPayoffResult extends EngineResult {}

export const creditCardPayoffEngine: CalculatorEngine<CreditCardPayoffInput, CreditCardPayoffResult> = {
  slug: 'credit-card-payoff-calculator',
  category: 'finance',

  defaultInput: () => ({ balance: 5000, apr: 21.99, monthlyPayment: 200 }),

  fields: (): EngineField[] => [
    { name: 'balance', labelKey: 'field.balance', type: 'number', defaultValue: '5000', min: 0, step: 100, currency: true },
    { name: 'apr', labelKey: 'field.apr', type: 'number', defaultValue: '21.99', min: 0, max: 60, step: 0.01, suffixKey: '%' },
    { name: 'monthlyPayment', labelKey: 'field.monthlyPayment', type: 'number', defaultValue: '200', min: 10, step: 10, currency: true },
  ],

  parseInput: (v): CreditCardPayoffInput => ({
    balance: num(v.balance, 0),
    apr: num(v.apr, 0),
    monthlyPayment: num(v.monthlyPayment, 0),
  }),

  validate: (input) => {
    const monthlyRate = input.apr / 100 / 12;
    if (input.balance <= 0) return fail('finance.ccRequired');
    if (input.monthlyPayment <= input.balance * monthlyRate) return fail('finance.ccPaymentTooLow');
    return ok();
  },

  compute: (input) => {
    const P = input.balance;
    const r = input.apr / 100 / 12;
    const pmt = input.monthlyPayment;

    let bal = P;
    let totalInterest = 0;
    let months = 0;
    const monthLabels: string[] = ['0'];
    const balancePts: number[] = [P];

    while (bal > 0 && months < 600) {
      months++;
      const interest = bal * r;
      totalInterest += interest;
      const principalPaid = Math.min(pmt - interest, bal);
      bal = Math.max(bal - principalPaid, 0);

      if (months % 6 === 0 || bal === 0) {
        monthLabels.push(String(months));
        balancePts.push(bal);
      }
    }

    const totalPaid = P + totalInterest;

    return {
      items: [
        { key: 'payoffMonths', value: months, format: 'integer', primary: true },
        { key: 'totalInterest', value: totalInterest, format: 'currency', tone: 'warning' },
        { key: 'totalPaid', value: totalPaid, format: 'currency' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'creditCard.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'balance', value: P, color: '#0070f3' },
            { labelKey: 'interest', value: totalInterest, color: '#f5a623' },
          ],
        },
        {
          type: 'line',
          titleKey: 'creditCard.growthTitle',
          format: 'currency',
          labels: monthLabels,
          series: [{ labelKey: 'balance', points: balancePts, color: '#0070f3' }],
        },
      ],
    };
  },
};

// =====================================================================
// Debt Payoff Calculator
// =====================================================================

export interface DebtPayoffInput {
  balance: number;
  rate: number;
  minPayment: number;
  extraPayment: number;
}

export interface DebtPayoffResult extends EngineResult {}

export const debtPayoffEngine: CalculatorEngine<DebtPayoffInput, DebtPayoffResult> = {
  slug: 'debt-payoff-calculator',
  category: 'finance',

  defaultInput: () => ({ balance: 15000, rate: 15, minPayment: 350, extraPayment: 150 }),

  fields: (): EngineField[] => [
    { name: 'balance', labelKey: 'field.balance', type: 'number', defaultValue: '15000', min: 0, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '15', min: 0, max: 60, step: 0.1, suffixKey: '%' },
    { name: 'minPayment', labelKey: 'field.minPayment', type: 'number', defaultValue: '350', min: 10, step: 10, currency: true },
    { name: 'extraPayment', labelKey: 'field.extraPayment', type: 'number', defaultValue: '150', min: 0, step: 10, currency: true },
  ],

  parseInput: (v): DebtPayoffInput => ({
    balance: num(v.balance, 0),
    rate: num(v.rate, 0),
    minPayment: num(v.minPayment, 0),
    extraPayment: num(v.extraPayment, 0),
  }),

  validate: (input) => {
    const monthlyRate = input.rate / 100 / 12;
    if (input.balance <= 0) return fail('finance.debtRequired');
    if (input.minPayment <= input.balance * monthlyRate) return fail('finance.debtPaymentTooLow');
    return ok();
  },

  compute: (input) => {
    const P = input.balance;
    const r = input.rate / 100 / 12;
    const basePmt = input.minPayment;
    const accPmt = input.minPayment + input.extraPayment;

    // Helper to simulate payoff
    const simulate = (payment: number) => {
      let bal = P;
      let interest = 0;
      let m = 0;
      const pts: number[] = [P];
      while (bal > 0 && m < 600) {
        m++;
        const i = bal * r;
        interest += i;
        bal = Math.max(bal - Math.min(payment - i, bal), 0);
        if (m % 3 === 0 || bal === 0) pts.push(bal);
      }
      return { months: m, interest, pts };
    };

    const base = simulate(basePmt);
    const acc = simulate(accPmt);

    const interestSaved = Math.max(base.interest - acc.interest, 0);
    const monthsSaved = Math.max(base.months - acc.months, 0);

    return {
      items: [
        { key: 'payoffMonths', value: acc.months, format: 'integer', primary: true },
        { key: 'totalInterest', value: acc.interest, format: 'currency', tone: 'warning' },
        { key: 'interestSaved', value: interestSaved, format: 'currency', tone: 'success' },
        { key: 'monthsSaved', value: monthsSaved, format: 'integer', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'debt.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'balance', value: P, color: '#0070f3' },
            { labelKey: 'interest', value: acc.interest, color: '#f5a623' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Personal Loan Calculator
// =====================================================================

export interface PersonalLoanInput {
  loanAmount: number;
  rate: number;
  tenureYears: number;
  originationFeePercent: number;
}

export interface PersonalLoanResult extends EngineResult {}

export const personalLoanEngine: CalculatorEngine<PersonalLoanInput, PersonalLoanResult> = {
  slug: 'personal-loan-calculator',
  category: 'finance',

  defaultInput: () => ({ loanAmount: 15000, rate: 10.5, tenureYears: 3, originationFeePercent: 2 }),

  fields: (): EngineField[] => [
    { name: 'loanAmount', labelKey: 'field.loanAmount', type: 'number', defaultValue: '15000', min: 500, step: 500, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '10.5', min: 0, max: 50, step: 0.1, suffixKey: '%' },
    { name: 'tenureYears', labelKey: 'field.tenureYears', type: 'number', defaultValue: '3', min: 0.5, max: 10, step: 0.5, suffixKey: 'years' },
    { name: 'originationFeePercent', labelKey: 'field.originationFeePercent', type: 'number', defaultValue: '2', min: 0, max: 10, step: 0.5, suffixKey: '%' },
  ],

  parseInput: (v): PersonalLoanInput => ({
    loanAmount: num(v.loanAmount, 0),
    rate: num(v.rate, 0),
    tenureYears: num(v.tenureYears, 0),
    originationFeePercent: num(v.originationFeePercent, 0),
  }),

  validate: (input) => {
    if (input.loanAmount <= 0 || input.tenureYears <= 0) return fail('finance.personalLoanRequired');
    return ok();
  },

  compute: (input) => {
    const P = input.loanAmount;
    const r = input.rate / 100 / 12;
    const n = Math.min(input.tenureYears * 12, 120);

    const emi = pmt(r, n, P);
    const feeAmount = P * (input.originationFeePercent / 100);
    const totalInterest = emi * n - P;
    const totalCost = emi * n + feeAmount;

    return {
      items: [
        { key: 'monthlyEmi', value: emi, format: 'currency', primary: true },
        { key: 'totalInterest', value: totalInterest, format: 'currency', tone: 'warning' },
        { key: 'feeAmount', value: feeAmount, format: 'currency' },
        { key: 'totalCost', value: totalCost, format: 'currency' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'personalLoan.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'principal', value: P, color: '#0070f3' },
            { labelKey: 'interest', value: totalInterest, color: '#f5a623' },
            { labelKey: 'feeAmount', value: feeAmount, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Lease Calculator
// =====================================================================

export interface LeaseInput {
  price: number;
  downPayment: number;
  termMonths: number;
  apr: number;
  residualPercent: number;
}

export interface LeaseResult extends EngineResult {}

export const leaseEngine: CalculatorEngine<LeaseInput, LeaseResult> = {
  slug: 'lease-calculator',
  category: 'finance',

  defaultInput: () => ({ price: 35000, downPayment: 3000, termMonths: 36, apr: 4.5, residualPercent: 55 }),

  fields: (): EngineField[] => [
    { name: 'price', labelKey: 'field.price', type: 'number', defaultValue: '35000', min: 1000, step: 1000, currency: true },
    { name: 'downPayment', labelKey: 'field.downPayment', type: 'number', defaultValue: '3000', min: 0, step: 500, currency: true },
    { name: 'termMonths', labelKey: 'field.termMonths', type: 'number', defaultValue: '36', min: 12, max: 72, step: 6, suffixKey: 'months' },
    { name: 'apr', labelKey: 'field.apr', type: 'number', defaultValue: '4.5', min: 0, max: 30, step: 0.1, suffixKey: '%' },
    { name: 'residualPercent', labelKey: 'field.residualPercent', type: 'number', defaultValue: '55', min: 10, max: 90, step: 1, suffixKey: '%' },
  ],

  parseInput: (v): LeaseInput => ({
    price: num(v.price, 0),
    downPayment: num(v.downPayment, 0),
    termMonths: num(v.termMonths, 0),
    apr: num(v.apr, 0),
    residualPercent: num(v.residualPercent, 0),
  }),

  validate: (input) => {
    if (input.price <= 0 || input.termMonths <= 0) return fail('finance.leaseRequired');
    return ok();
  },

  compute: (input) => {
    const netCap = Math.max(input.price - input.downPayment, 0);
    const residual = input.price * (input.residualPercent / 100);
    const term = Math.min(input.termMonths, 120);

    const monthlyDep = Math.max((netCap - residual) / term, 0);
    const moneyFactor = input.apr / 100 / 24;
    const monthlyFinance = (netCap + residual) * moneyFactor;
    const monthlyLease = monthlyDep + monthlyFinance;
    const totalLeaseCost = input.downPayment + monthlyLease * term;

    return {
      items: [
        { key: 'monthlyLease', value: monthlyLease, format: 'currency', primary: true },
        { key: 'monthlyDepreciation', value: monthlyDep, format: 'currency' },
        { key: 'monthlyFinance', value: monthlyFinance, format: 'currency' },
        { key: 'totalLeaseCost', value: totalLeaseCost, format: 'currency' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'lease.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'depreciation', value: monthlyDep * term, color: '#0070f3' },
            { labelKey: 'finance', value: monthlyFinance * term, color: '#f5a623' },
            { labelKey: 'downPayment', value: input.downPayment, color: '#7928ca' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Down Payment Calculator
// =====================================================================

export interface DownPaymentInput {
  homePrice: number;
  downPercent: number;
  currentSavings: number;
  monthlySavings: number;
  savingsYield: number;
}

export interface DownPaymentResult extends EngineResult {}

export const downPaymentEngine: CalculatorEngine<DownPaymentInput, DownPaymentResult> = {
  slug: 'down-payment-calculator',
  category: 'finance',

  defaultInput: () => ({ homePrice: 350000, downPercent: 20, currentSavings: 20000, monthlySavings: 1500, savingsYield: 4.5 }),

  fields: (): EngineField[] => [
    { name: 'homePrice', labelKey: 'field.homePrice', type: 'number', defaultValue: '350000', min: 10000, step: 5000, currency: true },
    { name: 'downPercent', labelKey: 'field.downPercent', type: 'number', defaultValue: '20', min: 1, max: 100, step: 1, suffixKey: '%' },
    { name: 'currentSavings', labelKey: 'field.currentSavings', type: 'number', defaultValue: '20000', min: 0, step: 1000, currency: true },
    { name: 'monthlySavings', labelKey: 'field.monthlySavings', type: 'number', defaultValue: '1500', min: 50, step: 50, currency: true },
    { name: 'savingsYield', labelKey: 'field.savingsYield', type: 'number', defaultValue: '4.5', min: 0, max: 20, step: 0.1, suffixKey: '%' },
  ],

  parseInput: (v): DownPaymentInput => ({
    homePrice: num(v.homePrice, 0),
    downPercent: num(v.downPercent, 0),
    currentSavings: num(v.currentSavings, 0),
    monthlySavings: num(v.monthlySavings, 0),
    savingsYield: num(v.savingsYield, 0),
  }),

  validate: (input) => {
    if (input.homePrice <= 0) return fail('finance.downPaymentRequired');
    return ok();
  },

  compute: (input) => {
    const target = input.homePrice * (input.downPercent / 100);
    const r = input.savingsYield / 100 / 12;
    const pmt = input.monthlySavings;

    let bal = input.currentSavings;
    let months = 0;
    const monthLabels: string[] = ['0'];
    const balancePts: number[] = [bal];

    while (bal < target && months < 600) {
      months++;
      bal = bal * (1 + r) + pmt;
      if (months % 6 === 0 || bal >= target) {
        monthLabels.push(String(months));
        balancePts.push(bal);
      }
    }

    const totalContributed = input.currentSavings + pmt * months;
    const interestEarned = Math.max(target - totalContributed, 0);

    return {
      items: [
        { key: 'targetDownPayment', value: target, format: 'currency', primary: true },
        { key: 'monthsToGoal', value: months, format: 'integer' },
        { key: 'remainingToSave', value: Math.max(target - input.currentSavings, 0), format: 'currency' },
        { key: 'interestEarned', value: interestEarned, format: 'currency', tone: 'success' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'downPayment.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'currentSavings', value: input.currentSavings, color: '#0070f3' },
            { labelKey: 'contributed', value: pmt * months, color: '#7928ca' },
            { labelKey: 'interest', value: interestEarned, color: '#50e3c2' },
          ],
        },
        {
          type: 'line',
          titleKey: 'downPayment.growthTitle',
          format: 'currency',
          labels: monthLabels,
          series: [{ labelKey: 'balance', points: balancePts, color: '#0070f3' }],
        },
      ],
    };
  },
};

// =====================================================================
// Amortization Calculator
// =====================================================================

export interface AmortizationInput {
  loanAmount: number;
  rate: number;
  termYears: number;
}

export interface AmortizationResult extends EngineResult {}

export const amortizationEngine: CalculatorEngine<AmortizationInput, AmortizationResult> = {
  slug: 'amortization-calculator',
  category: 'finance',

  defaultInput: () => ({ loanAmount: 250000, rate: 6.5, termYears: 30 }),

  fields: (): EngineField[] => [
    { name: 'loanAmount', labelKey: 'field.loanAmount', type: 'number', defaultValue: '250000', min: 1000, step: 5000, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '6.5', min: 0, max: 30, step: 0.1, suffixKey: '%' },
    { name: 'termYears', labelKey: 'field.termYears', type: 'number', defaultValue: '30', min: 1, max: 50, step: 1, suffixKey: 'years' },
  ],

  parseInput: (v): AmortizationInput => ({
    loanAmount: num(v.loanAmount, 0),
    rate: num(v.rate, 0),
    termYears: num(v.termYears, 0),
  }),

  validate: (input) => {
    if (input.loanAmount <= 0 || input.termYears <= 0) return fail('finance.amortizationRequired');
    return ok();
  },

  compute: (input) => {
    const P = input.loanAmount;
    const r = input.rate / 100 / 12;
    const n = Math.min(input.termYears * 12, 600);
    const m = pmt(r, n, P);
    const totalPaid = m * n;
    const totalInterest = totalPaid - P;

    const yearLabels: string[] = ['0'];
    const balancePts: number[] = [P];
    const interestPts: number[] = [0];
    let bal = P;
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

    return {
      items: [
        { key: 'monthlyPayment', value: m, format: 'currency', primary: true },
        { key: 'totalInterest', value: totalInterest, format: 'currency', tone: 'warning' },
        { key: 'totalPaid', value: totalPaid, format: 'currency' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'amortization.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'principal', value: P, color: '#0070f3' },
            { labelKey: 'interest', value: totalInterest, color: '#f5a623' },
          ],
        },
        {
          type: 'line',
          titleKey: 'amortization.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [
            { labelKey: 'balance', points: balancePts, color: '#0070f3' },
            { labelKey: 'totalInterest', points: interestPts, color: '#f5a623' },
          ],
        },
      ],
    };
  },
};

// =====================================================================
// Net Worth Calculator
// =====================================================================

export interface NetWorthInput {
  cash: number;
  investments: number;
  realEstate: number;
  vehicles: number;
  otherAssets: number;
  mortgage: number;
  autoLoan: number;
  creditCards: number;
  otherDebts: number;
}

export interface NetWorthResult extends EngineResult {}

export const netWorthEngine: CalculatorEngine<NetWorthInput, NetWorthResult> = {
  slug: 'net-worth-calculator',
  category: 'finance',

  defaultInput: () => ({
    cash: 15000,
    investments: 85000,
    realEstate: 350000,
    vehicles: 25000,
    otherAssets: 5000,
    mortgage: 220000,
    autoLoan: 12000,
    creditCards: 3000,
    otherDebts: 0,
  }),

  fields: (): EngineField[] => [
    { name: 'cash', labelKey: 'field.cash', type: 'number', defaultValue: '15000', min: 0, step: 500, currency: true },
    { name: 'investments', labelKey: 'field.investments', type: 'number', defaultValue: '85000', min: 0, step: 1000, currency: true },
    { name: 'realEstate', labelKey: 'field.realEstate', type: 'number', defaultValue: '350000', min: 0, step: 5000, currency: true },
    { name: 'vehicles', labelKey: 'field.vehicles', type: 'number', defaultValue: '25000', min: 0, step: 500, currency: true },
    { name: 'otherAssets', labelKey: 'field.otherAssets', type: 'number', defaultValue: '5000', min: 0, step: 500, currency: true },
    { name: 'mortgage', labelKey: 'field.mortgage', type: 'number', defaultValue: '220000', min: 0, step: 5000, currency: true },
    { name: 'autoLoan', labelKey: 'field.autoLoan', type: 'number', defaultValue: '12000', min: 0, step: 500, currency: true },
    { name: 'creditCards', labelKey: 'field.creditCards', type: 'number', defaultValue: '3000', min: 0, step: 100, currency: true },
    { name: 'otherDebts', labelKey: 'field.otherDebts', type: 'number', defaultValue: '0', min: 0, step: 100, currency: true },
  ],

  parseInput: (v): NetWorthInput => ({
    cash: num(v.cash, 0),
    investments: num(v.investments, 0),
    realEstate: num(v.realEstate, 0),
    vehicles: num(v.vehicles, 0),
    otherAssets: num(v.otherAssets, 0),
    mortgage: num(v.mortgage, 0),
    autoLoan: num(v.autoLoan, 0),
    creditCards: num(v.creditCards, 0),
    otherDebts: num(v.otherDebts, 0),
  }),

  validate: () => ok(),

  compute: (input) => {
    const totalAssets = input.cash + input.investments + input.realEstate + input.vehicles + input.otherAssets;
    const totalLiabilities = input.mortgage + input.autoLoan + input.creditCards + input.otherDebts;
    const netWorth = totalAssets - totalLiabilities;
    const assetDebtRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : totalAssets;

    return {
      items: [
        { key: 'netWorth', value: netWorth, format: 'currency', primary: true, tone: netWorth >= 0 ? 'success' : 'warning' },
        { key: 'totalAssets', value: totalAssets, format: 'currency', tone: 'success' },
        { key: 'totalLiabilities', value: totalLiabilities, format: 'currency', tone: 'warning' },
        { key: 'assetDebtRatio', value: assetDebtRatio, format: 'decimal' },
      ],
      charts: [
        {
          type: 'pie',
          titleKey: 'netWorth.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'cash', value: input.cash, color: '#0070f3' },
            { labelKey: 'investments', value: input.investments, color: '#50e3c2' },
            { labelKey: 'realEstate', value: input.realEstate, color: '#7928ca' },
            { labelKey: 'vehicles', value: input.vehicles, color: '#f5a623' },
            { labelKey: 'otherAssets', value: input.otherAssets, color: '#ff0080' },
          ],
        },
      ],
    };
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
  fdEngine as AnyEngine,
  rdEngine as AnyEngine,
  swpEngine as AnyEngine,
  ppfEngine as AnyEngine,
  npsEngine as AnyEngine,
  mutualFundEngine as AnyEngine,
  lumpsumEngine as AnyEngine,
  simpleInterestEngine as AnyEngine,
  creditCardPayoffEngine as AnyEngine,
  debtPayoffEngine as AnyEngine,
  personalLoanEngine as AnyEngine,
  leaseEngine as AnyEngine,
  downPaymentEngine as AnyEngine,
  amortizationEngine as AnyEngine,
  netWorthEngine as AnyEngine,
];

