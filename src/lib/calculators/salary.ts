import type { Calculator, Values } from '../types';
import { num, currency, number } from '../format';

// Convert any pay figure to an annual amount given hours/week and weeks/year.
function toAnnual(v: Values): number | null {
  const amount = num(v.amount, NaN);
  if (!Number.isFinite(amount)) return null;
  const hpw = num(v.hours, 40);
  const wpy = num(v.weeks, 52);
  switch (v.freq) {
    case 'hourly': return amount * hpw * wpy;
    case 'daily': return amount * (hpw / 8) * wpy; // assume 8h days
    case 'weekly': return amount * wpy;
    case 'biweekly': return amount * (wpy / 2);
    case 'semimonthly': return amount * 24;
    case 'monthly': return amount * 12;
    case 'annual': return amount;
    default: return amount;
  }
}

function annualBreakdown(annual: number, hpw: number, wpy: number) {
  const hours = hpw * wpy;
  return [
    { label: 'Hourly', value: currency(hours ? annual / hours : 0) },
    { label: 'Daily', value: currency((annual / wpy) / 5) },
    { label: 'Weekly', value: currency(annual / wpy) },
    { label: 'Bi-weekly', value: currency(annual / (wpy / 2)) },
    { label: 'Monthly', value: currency(annual / 12) },
    { label: 'Annual', value: currency(annual) },
  ];
}

// 2024 US federal income tax (approximate). status: single | married
function federalTax(taxable: number, status: string): number {
  const brackets = status === 'married'
    ? [[0, 0.1], [23200, 0.12], [94300, 0.22], [201050, 0.24], [383900, 0.32], [487450, 0.35], [731200, 0.37]]
    : [[0, 0.1], [11600, 0.12], [47150, 0.22], [100525, 0.24], [191950, 0.32], [243725, 0.35], [609350, 0.37]];
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [floor, rate] = brackets[i];
    const ceil = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (taxable > floor) tax += (Math.min(taxable, ceil) - floor) * rate;
    else break;
  }
  return tax;
}

const freqField = {
  name: 'freq', label: 'Pay frequency', type: 'select' as const, default: 'annual', span: 2 as const,
  options: [
    { label: 'Hourly', value: 'hourly' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-weekly', value: 'biweekly' },
    { label: 'Semi-monthly', value: 'semimonthly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Annual', value: 'annual' },
  ],
};

export const salaryCalculators: Calculator[] = [
  /* ------------------------------------------------------------------ Salary */
  {
    slug: 'salary-calculator',
    category: 'salary',
    title: 'Salary Calculator',
    description: 'Convert your pay between hourly, weekly, monthly and annual amounts.',
    intro: 'Enter any pay figure and its frequency to see the equivalent hourly, weekly, monthly and yearly pay.',
    keywords: ['salary calculator', 'pay converter', 'annual salary'],
    popular: true,
    inputs: [
      { name: 'amount', label: 'Pay amount', type: 'number', prefix: '$', default: 75000, min: 0, step: 100 },
      freqField,
      { name: 'hours', label: 'Hours per week', type: 'number', suffix: 'h', default: 40, min: 1, max: 168, step: 1 },
      { name: 'weeks', label: 'Weeks per year', type: 'number', suffix: 'wk', default: 52, min: 1, max: 52, step: 1 },
    ],
    compute: (v) => {
      const annual = toAnnual(v);
      if (annual === null || annual < 0) return { results: [], error: 'Enter a valid pay amount.' };
      const hpw = num(v.hours, 40), wpy = num(v.weeks, 52);
      return {
        results: [
          { label: 'Annual salary', value: currency(annual), primary: true },
          { label: 'Monthly', value: currency(annual / 12) },
          { label: 'Hourly', value: currency(hpw * wpy ? annual / (hpw * wpy) : 0) },
        ],
        breakdown: annualBreakdown(annual, hpw, wpy),
      };
    },
    faq: [
      { q: 'How many work hours are in a year?', a: 'A common full-time figure is 2,080 hours — 40 hours a week for 52 weeks. Adjust the hours and weeks fields if your schedule differs.' },
    ],
    related: ['hourly-wage-calculator', 'paycheck-calculator', 'compound-interest-calculator'],
  },

  /* ------------------------------------------------------------ Hourly Wage */
  {
    slug: 'hourly-wage-calculator',
    category: 'salary',
    title: 'Hourly Wage Calculator',
    description: 'Turn an hourly rate into weekly, monthly and annual income — or the other way around.',
    intro: 'Enter your hourly rate and typical schedule to project your yearly earnings.',
    keywords: ['hourly wage calculator', 'hourly to salary', 'hourly pay'],
    inputs: [
      { name: 'amount', label: 'Hourly rate', type: 'number', prefix: '$', default: 28, min: 0, step: 0.25 },
      { name: 'hours', label: 'Hours per week', type: 'number', suffix: 'h', default: 40, min: 1, max: 168, step: 1 },
      { name: 'weeks', label: 'Weeks per year', type: 'number', suffix: 'wk', default: 52, min: 1, max: 52, step: 1 },
    ],
    compute: (v) => {
      const rate = num(v.amount, NaN);
      if (!Number.isFinite(rate) || rate < 0) return { results: [], error: 'Enter a valid hourly rate.' };
      const hpw = num(v.hours, 40), wpy = num(v.weeks, 52);
      const annual = rate * hpw * wpy;
      return {
        results: [
          { label: 'Annual income', value: currency(annual), primary: true },
          { label: 'Monthly', value: currency(annual / 12) },
          { label: 'Weekly', value: currency(rate * hpw) },
        ],
        breakdown: annualBreakdown(annual, hpw, wpy),
      };
    },
    faq: [
      { q: 'Does this include overtime?', a: 'No. It assumes a steady rate for all hours. If you work overtime at a higher rate, calculate those hours separately.' },
    ],
    related: ['salary-calculator', 'paycheck-calculator'],
  },

  /* -------------------------------------------------------------- Paycheck */
  {
    slug: 'paycheck-calculator',
    category: 'salary',
    title: 'Paycheck Calculator (US)',
    description: 'Estimate your take-home pay after federal income tax and FICA from your gross salary.',
    intro: 'A simplified estimate of net pay using 2024 federal brackets, the standard deduction and FICA. Not tax advice.',
    keywords: ['paycheck calculator', 'take home pay', 'net pay'],
    popular: true,
    inputs: [
      { name: 'gross', label: 'Annual gross salary', type: 'number', prefix: '$', default: 75000, min: 0, step: 500 },
      {
        name: 'status', label: 'Filing status', type: 'radio', default: 'single',
        options: [
          { label: 'Single', value: 'single' },
          { label: 'Married (jointly)', value: 'married' },
        ],
      },
      {
        name: 'period', label: 'Pay period', type: 'select', default: 'biweekly',
        options: [
          { label: 'Weekly (52)', value: '52' },
          { label: 'Bi-weekly (26)', value: '26' },
          { label: 'Semi-monthly (24)', value: '24' },
          { label: 'Monthly (12)', value: '12' },
        ],
      },
      { name: 'state', label: 'State tax rate', type: 'number', suffix: '%', default: 4, min: 0, max: 15, step: 0.1 },
    ],
    compute: (v) => {
      const gross = num(v.gross, 0);
      if (gross <= 0) return { results: [], error: 'Enter your annual gross salary.' };
      const stdDeduction = v.status === 'married' ? 29200 : 14600;
      const taxable = Math.max(gross - stdDeduction, 0);
      const federal = federalTax(taxable, v.status);
      const ss = Math.min(gross, 168600) * 0.062;
      const medicare = gross * 0.0145;
      const stateTax = gross * (num(v.state, 0) / 100);
      const totalTax = federal + ss + medicare + stateTax;
      const net = gross - totalTax;
      const periods = num(v.period, 26);
      return {
        results: [
          { label: 'Net pay per paycheck', value: currency(net / periods), primary: true, hint: `${number(periods, 0)} paychecks/year` },
          { label: 'Annual take-home', value: currency(net), tone: 'success' },
          { label: 'Total tax', value: currency(totalTax), tone: 'warning' },
          { label: 'Effective tax rate', value: `${number((totalTax / gross) * 100, 1)}%` },
        ],
        breakdown: [
          { label: 'Federal income tax', value: currency(federal) },
          { label: 'Social Security (6.2%)', value: currency(ss) },
          { label: 'Medicare (1.45%)', value: currency(medicare) },
          { label: 'State tax', value: currency(stateTax) },
        ],
      };
    },
    faq: [
      { q: 'Is this exact?', a: 'No. It is a simplified estimate using the standard deduction and 2024 federal brackets. It ignores credits, pre-tax deductions, local taxes and withholding elections. Use it as a ballpark, not tax advice.' },
      { q: 'What is FICA?', a: 'FICA is the combined Social Security (6.2%) and Medicare (1.45%) payroll tax withheld from your wages.' },
    ],
    related: ['salary-calculator', 'hourly-wage-calculator'],
  },
];
