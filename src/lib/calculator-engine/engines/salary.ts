// Salary — pure engines (salary converter, hourly wage, US paycheck).
//
// Pay-frequency conversion and a simplified US take-home estimate. Every
// monetary output is a raw number tagged `currency`; the active currency symbol
// and grouping are applied by the localization layer, so the same engine
// renders in $, €, ₹ or any other currency with no change. Percentages travel
// as raw magnitudes tagged `percent`; counts carried into hint messages travel
// as raw `hintParams`, never as prose. Pay-frequency / filing-status / pay-
// period labels are enum keys resolved downstream.

import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import type { AnyEngine } from '../index';
import { ok, fail } from '../contract';
import { num } from '../units';

// --------------------------------------------------------------- Shared math

export type PayFrequency =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'semimonthly'
  | 'monthly'
  | 'annual';

// Convert any pay figure to an annual amount given hours/week and weeks/year.
// Returns null when the amount is not a finite number (matches legacy).
function toAnnual(amount: number, freq: PayFrequency, hpw: number, wpy: number): number | null {
  if (!Number.isFinite(amount)) return null;
  switch (freq) {
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

// The shared hourly→annual breakdown table, as presentation-neutral rows.
function annualBreakdown(annual: number, hpw: number, wpy: number): ResultItem[] {
  const hours = hpw * wpy;
  return [
    { key: 'hourly', value: hours ? annual / hours : 0, format: 'currency' },
    { key: 'daily', value: (annual / wpy) / 5, format: 'currency' },
    { key: 'weekly', value: annual / wpy, format: 'currency' },
    { key: 'biweekly', value: annual / (wpy / 2), format: 'currency' },
    { key: 'monthly', value: annual / 12, format: 'currency' },
    { key: 'annual', value: annual, format: 'currency' },
  ];
}

// 2024 US federal income tax (approximate). status: single | married
function federalTax(taxable: number, status: string): number {
  const brackets: [number, number][] = status === 'married'
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

// Shared pay-frequency select field (default 'annual', spans both columns).
const freqField: EngineField = {
  name: 'freq', labelKey: 'field.freq', type: 'select', defaultValue: 'annual', span: 2,
  options: [
    { value: 'hourly', labelKey: 'freq.hourly' },
    { value: 'daily', labelKey: 'freq.daily' },
    { value: 'weekly', labelKey: 'freq.weekly' },
    { value: 'biweekly', labelKey: 'freq.biweekly' },
    { value: 'semimonthly', labelKey: 'freq.semimonthly' },
    { value: 'monthly', labelKey: 'freq.monthly' },
    { value: 'annual', labelKey: 'freq.annual' },
  ],
};

const FREQUENCIES: PayFrequency[] = ['hourly', 'daily', 'weekly', 'biweekly', 'semimonthly', 'monthly', 'annual'];
function parseFreq(raw: string | undefined): PayFrequency {
  return (FREQUENCIES as string[]).includes(raw ?? '') ? (raw as PayFrequency) : 'annual';
}

// ------------------------------------------------------------------- Salary

export interface SalaryInput {
  amount: number;
  freq: PayFrequency;
  hours: number;
  weeks: number;
}

export interface SalaryResult extends EngineResult {}

export const salaryEngine: CalculatorEngine<SalaryInput, SalaryResult> = {
  slug: 'salary-calculator',
  category: 'salary',

  defaultInput: () => ({ amount: 75000, freq: 'annual', hours: 40, weeks: 52 }),

  fields: (): EngineField[] => [
    { name: 'amount', labelKey: 'field.payAmount', type: 'number', defaultValue: '75000', min: 0, step: 100, currency: true },
    freqField,
    { name: 'hours', labelKey: 'field.hoursPerWeek', type: 'number', defaultValue: '40', min: 1, max: 168, step: 1, suffixKey: 'h' },
    { name: 'weeks', labelKey: 'field.weeksPerYear', type: 'number', defaultValue: '52', min: 1, max: 52, step: 1, suffixKey: 'wk' },
  ],

  parseInput: (values): SalaryInput => ({
    amount: num(values.amount, NaN),
    freq: parseFreq(values.freq),
    hours: num(values.hours, 40),
    weeks: num(values.weeks, 52),
  }),

  validate: (input) => {
    const annual = toAnnual(input.amount, input.freq, input.hours, input.weeks);
    if (annual === null || annual < 0) return fail('salary.invalidAmount', { field: 'amount' });
    return ok();
  },

  compute: (input) => {
    const annual = toAnnual(input.amount, input.freq, input.hours, input.weeks) ?? 0;
    const hpw = input.hours;
    const wpy = input.weeks;

    const items: ResultItem[] = [
      { key: 'annualSalary', value: annual, format: 'currency', primary: true },
      { key: 'monthly', value: annual / 12, format: 'currency' },
      { key: 'hourly', value: hpw * wpy ? annual / (hpw * wpy) : 0, format: 'currency' },
    ];

    return { items, breakdown: annualBreakdown(annual, hpw, wpy) };
  },
};

// -------------------------------------------------------------- Hourly Wage

export interface HourlyWageInput {
  amount: number; // hourly rate
  hours: number;
  weeks: number;
}

export interface HourlyWageResult extends EngineResult {}

export const hourlyWageEngine: CalculatorEngine<HourlyWageInput, HourlyWageResult> = {
  slug: 'hourly-wage-calculator',
  category: 'salary',

  defaultInput: () => ({ amount: 28, hours: 40, weeks: 52 }),

  fields: (): EngineField[] => [
    { name: 'amount', labelKey: 'field.hourlyRate', type: 'number', defaultValue: '28', min: 0, step: 0.25, currency: true },
    { name: 'hours', labelKey: 'field.hoursPerWeek', type: 'number', defaultValue: '40', min: 1, max: 168, step: 1, suffixKey: 'h' },
    { name: 'weeks', labelKey: 'field.weeksPerYear', type: 'number', defaultValue: '52', min: 1, max: 52, step: 1, suffixKey: 'wk' },
  ],

  parseInput: (values): HourlyWageInput => ({
    amount: num(values.amount, NaN),
    hours: num(values.hours, 40),
    weeks: num(values.weeks, 52),
  }),

  validate: (input) => {
    if (!Number.isFinite(input.amount) || input.amount < 0) return fail('salary.invalidRate', { field: 'amount' });
    return ok();
  },

  compute: (input) => {
    const rate = input.amount;
    const hpw = input.hours;
    const wpy = input.weeks;
    const annual = rate * hpw * wpy;

    const items: ResultItem[] = [
      { key: 'annualIncome', value: annual, format: 'currency', primary: true },
      { key: 'monthly', value: annual / 12, format: 'currency' },
      { key: 'weekly', value: rate * hpw, format: 'currency' },
    ];

    return { items, breakdown: annualBreakdown(annual, hpw, wpy) };
  },
};

// ----------------------------------------------------------------- Paycheck

export type FilingStatus = 'single' | 'married';

export interface PaycheckInput {
  gross: number;
  status: FilingStatus;
  period: number; // paychecks per year
  state: number; // state tax rate (percentage)
}

export interface PaycheckResult extends EngineResult {}

export const paycheckEngine: CalculatorEngine<PaycheckInput, PaycheckResult> = {
  slug: 'paycheck-calculator',
  category: 'salary',

  defaultInput: () => ({ gross: 75000, status: 'single', period: 26, state: 4 }),

  fields: (): EngineField[] => [
    { name: 'gross', labelKey: 'field.grossSalary', type: 'number', defaultValue: '75000', min: 0, step: 500, currency: true },
    {
      name: 'status', labelKey: 'field.filingStatus', type: 'radio', defaultValue: 'single',
      options: [
        { value: 'single', labelKey: 'status.single' },
        { value: 'married', labelKey: 'status.married' },
      ],
    },
    {
      name: 'period', labelKey: 'field.payPeriod', type: 'select', defaultValue: 'biweekly',
      options: [
        { value: '52', labelKey: 'period.weekly' },
        { value: '26', labelKey: 'period.biweekly' },
        { value: '24', labelKey: 'period.semimonthly' },
        { value: '12', labelKey: 'period.monthly' },
      ],
    },
    { name: 'state', labelKey: 'field.stateTaxRate', type: 'number', defaultValue: '4', min: 0, max: 15, step: 0.1, suffixKey: '%' },
  ],

  parseInput: (values): PaycheckInput => ({
    gross: num(values.gross, 0),
    status: values.status === 'married' ? 'married' : 'single',
    period: num(values.period, 26),
    state: num(values.state, 0),
  }),

  validate: (input) => {
    if (input.gross <= 0) return fail('salary.grossRequired', { field: 'gross' });
    return ok();
  },

  compute: (input) => {
    const gross = input.gross;
    const stdDeduction = input.status === 'married' ? 29200 : 14600;
    const taxable = Math.max(gross - stdDeduction, 0);
    const federal = federalTax(taxable, input.status);
    const ss = Math.min(gross, 168600) * 0.062;
    const medicare = gross * 0.0145;
    const stateTax = gross * (input.state / 100);
    const totalTax = federal + ss + medicare + stateTax;
    const net = gross - totalTax;
    const periods = input.period;

    const items: ResultItem[] = [
      { key: 'netPayPerPaycheck', value: net / periods, format: 'currency', primary: true, hintKey: 'paycheck.paychecksPerYear', hintParams: { periods } },
      { key: 'annualTakeHome', value: net, format: 'currency', tone: 'success' },
      { key: 'totalTax', value: totalTax, format: 'currency', tone: 'warning' },
      { key: 'effectiveTaxRate', value: gross ? (totalTax / gross) * 100 : 0, format: 'percent', precision: 1 },
    ];

    const breakdown: ResultItem[] = [
      { key: 'federalIncomeTax', value: federal, format: 'currency' },
      { key: 'socialSecurity', value: ss, format: 'currency' },
      { key: 'medicare', value: medicare, format: 'currency' },
      { key: 'stateTax', value: stateTax, format: 'currency' },
    ];

    return {
      items,
      breakdown,
      charts: [
        {
          type: 'pie',
          titleKey: 'paycheck.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'takeHome', value: Math.max(net, 0), color: '#50e3c2' },
            { labelKey: 'federalTax', value: Math.max(federal, 0), color: '#0070f3' },
            { labelKey: 'socialSecurity', value: Math.max(ss, 0), color: '#7928ca' },
            { labelKey: 'medicare', value: Math.max(medicare, 0), color: '#f5a623' },
            ...(stateTax > 0 ? [{ labelKey: 'stateTax', value: stateTax, color: '#ff0080' }] : []),
          ],
        },
      ],
    };
  },
};

// ------------------------------------------------------------------ Export

export const salaryEngines: AnyEngine[] = [
  salaryEngine as AnyEngine,
  hourlyWageEngine as AnyEngine,
  paycheckEngine as AnyEngine,
];
