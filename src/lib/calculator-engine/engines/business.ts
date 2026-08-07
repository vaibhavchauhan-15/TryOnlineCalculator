// Business & finance — pure engines for the profit/margin/tax family:
// VAT, margin, profit, commission, markup, debt-to-income, break-even,
// CAGR, inflation and ROI.
//
// Same rules as every other engine (see ../contract): a result carries RAW
// VALUES and machine KEYS only — never a localized string, currency symbol or
// formatted number. The localization layer resolves keys against the
// calculator's MDX label pack + the shared UI/units pack at render time, so the
// exact same engine renders in $, € or any currency/locale unchanged.

import type { CalculatorEngine, EngineResult, ResultItem, ChartData, EngineField } from '../contract';
import type { AnyEngine } from '../index';
import { ok, fail } from '../contract';
import { num } from '../units';

// Shared chart palette (mirrors the brand tokens used across the other engines).
const BLUE = '#0070f3';
const AMBER = '#f5a623';
const CYAN = '#50e3c2';

// =====================================================================
// VAT (value added tax) — add VAT to a net amount or remove it from gross
// =====================================================================

export type VatMode = 'net' | 'gross';

export interface VatInput {
  mode: VatMode;
  amount: number;
  rate: number; // VAT percentage
}

export const vatEngine: CalculatorEngine<VatInput, EngineResult> = {
  slug: 'vat-calculator',
  category: 'finance',

  defaultInput: () => ({ mode: 'net', amount: 100, rate: 20 }),

  fields: (): EngineField[] => [
    {
      name: 'mode', labelKey: 'field.mode', type: 'radio', defaultValue: 'net',
      options: [
        { value: 'net', labelKey: 'mode.addVat' },
        { value: 'gross', labelKey: 'mode.removeVat' },
      ],
      span: 2,
    },
    { name: 'amount', labelKey: 'field.amount', type: 'number', defaultValue: '100', min: 0, step: 1, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '20', min: 0, max: 100, step: 0.1, suffixKey: '%' },
  ],

  parseInput: (values): VatInput => ({
    mode: values.mode === 'gross' ? 'gross' : 'net',
    amount: num(values.amount, 0),
    rate: num(values.rate, 0),
  }),

  validate: (input) => {
    if (input.amount < 0) return fail('vat.amountRequired', { field: 'amount' });
    return ok();
  },

  compute: (input) => {
    const r = input.rate / 100;
    let net: number;
    let gross: number;
    if (input.mode === 'gross') {
      gross = input.amount;
      net = r > -1 ? gross / (1 + r) : gross;
    } else {
      net = input.amount;
      gross = net * (1 + r);
    }
    const vat = gross - net;

    const items: ResultItem[] = [
      { key: 'vatAmount', value: vat, format: 'currency', primary: true },
      { key: 'netAmount', value: net, format: 'currency' },
      { key: 'grossAmount', value: gross, format: 'currency' },
    ];

    const charts: ChartData[] = [
      {
        type: 'pie',
        titleKey: 'vat.pieTitle',
        format: 'currency',
        slices: [
          { labelKey: 'netAmount', value: Math.max(net, 0), color: BLUE },
          { labelKey: 'vatAmount', value: Math.max(vat, 0), color: AMBER },
        ],
      },
    ];

    return { items, charts };
  },
};

// =====================================================================
// Margin — gross profit margin from cost + revenue
// =====================================================================

export interface MarginInput {
  cost: number;
  revenue: number;
}

export const marginEngine: CalculatorEngine<MarginInput, EngineResult> = {
  slug: 'margin-calculator',
  category: 'finance',

  defaultInput: () => ({ cost: 40, revenue: 100 }),

  fields: (): EngineField[] => [
    { name: 'cost', labelKey: 'field.cost', type: 'number', defaultValue: '40', min: 0, step: 1, currency: true },
    { name: 'revenue', labelKey: 'field.revenue', type: 'number', defaultValue: '100', min: 0, step: 1, currency: true },
  ],

  parseInput: (values): MarginInput => ({
    cost: num(values.cost, 0),
    revenue: num(values.revenue, 0),
  }),

  validate: (input) => {
    if (input.revenue <= 0) return fail('margin.revenueRequired', { field: 'revenue' });
    return ok();
  },

  compute: (input) => {
    const profit = input.revenue - input.cost;
    const margin = input.revenue !== 0 ? (profit / input.revenue) * 100 : 0;
    const markup = input.cost !== 0 ? (profit / input.cost) * 100 : 0;

    const items: ResultItem[] = [
      { key: 'grossMargin', value: margin, format: 'percent', precision: 2, primary: true, tone: profit >= 0 ? 'success' : 'error' },
      { key: 'grossProfit', value: profit, format: 'currency', tone: profit >= 0 ? 'success' : 'error' },
      { key: 'markup', value: markup, format: 'percent', precision: 2 },
    ];

    const charts: ChartData[] = profit >= 0
      ? [{
          type: 'pie',
          titleKey: 'margin.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'cost', value: Math.max(input.cost, 0), color: BLUE },
            { labelKey: 'grossProfit', value: Math.max(profit, 0), color: CYAN },
          ],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// Profit — profit amount + margin from cost + revenue
// =====================================================================

export interface ProfitInput {
  cost: number;
  revenue: number;
}

export const profitEngine: CalculatorEngine<ProfitInput, EngineResult> = {
  slug: 'profit-calculator',
  category: 'finance',

  defaultInput: () => ({ cost: 2500, revenue: 4000 }),

  fields: (): EngineField[] => [
    { name: 'cost', labelKey: 'field.cost', type: 'number', defaultValue: '2500', min: 0, step: 10, currency: true },
    { name: 'revenue', labelKey: 'field.revenue', type: 'number', defaultValue: '4000', min: 0, step: 10, currency: true },
  ],

  parseInput: (values): ProfitInput => ({
    cost: num(values.cost, 0),
    revenue: num(values.revenue, 0),
  }),

  validate: (input) => {
    if (input.revenue <= 0 && input.cost <= 0) return fail('profit.inputRequired');
    return ok();
  },

  compute: (input) => {
    const profit = input.revenue - input.cost;
    const margin = input.revenue !== 0 ? (profit / input.revenue) * 100 : 0;
    const markup = input.cost !== 0 ? (profit / input.cost) * 100 : 0;

    const items: ResultItem[] = [
      { key: 'netProfit', value: profit, format: 'currency', primary: true, tone: profit >= 0 ? 'success' : 'error' },
      { key: 'profitMargin', value: margin, format: 'percent', precision: 2 },
      { key: 'markup', value: markup, format: 'percent', precision: 2 },
    ];

    const charts: ChartData[] = profit >= 0
      ? [{
          type: 'pie',
          titleKey: 'profit.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'cost', value: Math.max(input.cost, 0), color: BLUE },
            { labelKey: 'netProfit', value: Math.max(profit, 0), color: CYAN },
          ],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// Commission — sales commission from sale amount + rate (+ optional base pay)
// =====================================================================

export interface CommissionInput {
  saleAmount: number;
  rate: number; // commission percentage
  base: number; // base pay
}

export const commissionEngine: CalculatorEngine<CommissionInput, EngineResult> = {
  slug: 'commission-calculator',
  category: 'salary',

  defaultInput: () => ({ saleAmount: 10000, rate: 5, base: 0 }),

  fields: (): EngineField[] => [
    { name: 'saleAmount', labelKey: 'field.saleAmount', type: 'number', defaultValue: '10000', min: 0, step: 100, currency: true },
    { name: 'rate', labelKey: 'field.commissionRate', type: 'number', defaultValue: '5', min: 0, max: 100, step: 0.1, suffixKey: '%' },
    { name: 'base', labelKey: 'field.basePay', type: 'number', defaultValue: '0', min: 0, step: 100, currency: true },
  ],

  parseInput: (values): CommissionInput => ({
    saleAmount: num(values.saleAmount, 0),
    rate: num(values.rate, 0),
    base: num(values.base, 0),
  }),

  validate: (input) => {
    if (input.saleAmount < 0) return fail('commission.saleRequired', { field: 'saleAmount' });
    return ok();
  },

  compute: (input) => {
    const commission = (input.saleAmount * input.rate) / 100;
    const total = commission + input.base;

    const items: ResultItem[] = [
      { key: 'commission', value: commission, format: 'currency', primary: true },
      { key: 'totalEarnings', value: total, format: 'currency' },
    ];

    const charts: ChartData[] = input.base > 0
      ? [{
          type: 'pie',
          titleKey: 'commission.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'basePay', value: Math.max(input.base, 0), color: BLUE },
            { labelKey: 'commission', value: Math.max(commission, 0), color: CYAN },
          ],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// Markup — selling price + profit from cost + markup %
// =====================================================================

export interface MarkupInput {
  cost: number;
  markup: number; // markup percentage
}

export const markupEngine: CalculatorEngine<MarkupInput, EngineResult> = {
  slug: 'markup-calculator',
  category: 'finance',

  defaultInput: () => ({ cost: 40, markup: 50 }),

  fields: (): EngineField[] => [
    { name: 'cost', labelKey: 'field.cost', type: 'number', defaultValue: '40', min: 0, step: 1, currency: true },
    { name: 'markup', labelKey: 'field.markup', type: 'number', defaultValue: '50', min: 0, max: 1000, step: 1, suffixKey: '%' },
  ],

  parseInput: (values): MarkupInput => ({
    cost: num(values.cost, 0),
    markup: num(values.markup, 0),
  }),

  validate: (input) => {
    if (input.cost <= 0) return fail('markup.costRequired', { field: 'cost' });
    return ok();
  },

  compute: (input) => {
    const profit = (input.cost * input.markup) / 100;
    const price = input.cost + profit;
    const margin = price !== 0 ? (profit / price) * 100 : 0;

    const items: ResultItem[] = [
      { key: 'sellingPrice', value: price, format: 'currency', primary: true },
      { key: 'grossProfit', value: profit, format: 'currency', tone: 'success' },
      { key: 'grossMargin', value: margin, format: 'percent', precision: 2 },
    ];

    const charts: ChartData[] = [
      {
        type: 'pie',
        titleKey: 'markup.pieTitle',
        format: 'currency',
        slices: [
          { labelKey: 'cost', value: Math.max(input.cost, 0), color: BLUE },
          { labelKey: 'grossProfit', value: Math.max(profit, 0), color: CYAN },
        ],
      },
    ];

    return { items, charts };
  },
};

// =====================================================================
// Debt-to-Income (DTI) — monthly debt vs gross monthly income
// =====================================================================

export interface DtiInput {
  monthlyDebt: number;
  grossIncome: number; // monthly, before tax
}

export const debtToIncomeEngine: CalculatorEngine<DtiInput, EngineResult> = {
  slug: 'debt-to-income-calculator',
  category: 'finance',

  defaultInput: () => ({ monthlyDebt: 1500, grossIncome: 5000 }),

  fields: (): EngineField[] => [
    { name: 'monthlyDebt', labelKey: 'field.monthlyDebt', type: 'number', defaultValue: '1500', min: 0, step: 50, currency: true },
    { name: 'grossIncome', labelKey: 'field.grossIncome', type: 'number', defaultValue: '5000', min: 0, step: 100, currency: true },
  ],

  parseInput: (values): DtiInput => ({
    monthlyDebt: num(values.monthlyDebt, 0),
    grossIncome: num(values.grossIncome, 0),
  }),

  validate: (input) => {
    if (input.grossIncome <= 0) return fail('dti.incomeRequired', { field: 'grossIncome' });
    return ok();
  },

  compute: (input) => {
    const dti = input.grossIncome !== 0 ? (input.monthlyDebt / input.grossIncome) * 100 : 0;
    const remaining = Math.max(input.grossIncome - input.monthlyDebt, 0);
    // Lender rule of thumb: <=36% healthy, 37-43% caution, >43% high.
    const tone = dti <= 36 ? 'success' : dti <= 43 ? 'warning' : 'error';

    const items: ResultItem[] = [
      { key: 'dtiRatio', value: dti, format: 'percent', precision: 1, primary: true, tone },
      { key: 'monthlyDebt', value: input.monthlyDebt, format: 'currency' },
      { key: 'incomeAfterDebt', value: remaining, format: 'currency' },
    ];

    const charts: ChartData[] = input.grossIncome > 0
      ? [{
          type: 'pie',
          titleKey: 'dti.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'monthlyDebt', value: Math.max(input.monthlyDebt, 0), color: AMBER },
            { labelKey: 'incomeAfterDebt', value: remaining, color: BLUE },
          ],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// Break-even — units and revenue needed to cover fixed costs
// =====================================================================

export interface BreakEvenInput {
  fixedCosts: number;
  pricePerUnit: number;
  variableCost: number; // per unit
}

export const breakEvenEngine: CalculatorEngine<BreakEvenInput, EngineResult> = {
  slug: 'break-even-calculator',
  category: 'finance',

  defaultInput: () => ({ fixedCosts: 10000, pricePerUnit: 50, variableCost: 30 }),

  fields: (): EngineField[] => [
    { name: 'fixedCosts', labelKey: 'field.fixedCosts', type: 'number', defaultValue: '10000', min: 0, step: 100, currency: true },
    { name: 'pricePerUnit', labelKey: 'field.pricePerUnit', type: 'number', defaultValue: '50', min: 0, step: 1, currency: true },
    { name: 'variableCost', labelKey: 'field.variableCost', type: 'number', defaultValue: '30', min: 0, step: 1, currency: true },
  ],

  parseInput: (values): BreakEvenInput => ({
    fixedCosts: num(values.fixedCosts, 0),
    pricePerUnit: num(values.pricePerUnit, 0),
    variableCost: num(values.variableCost, 0),
  }),

  validate: (input) => {
    const contribution = input.pricePerUnit - input.variableCost;
    if (contribution <= 0) return fail('breakEven.contributionNonPositive', { field: 'pricePerUnit' });
    return ok();
  },

  compute: (input) => {
    const contribution = input.pricePerUnit - input.variableCost;
    const units = contribution > 0 ? input.fixedCosts / contribution : 0;
    const revenue = units * input.pricePerUnit;
    const variableTotal = units * input.variableCost;

    const items: ResultItem[] = [
      { key: 'breakEvenUnits', value: units, format: 'decimal', precision: 0, primary: true },
      { key: 'breakEvenRevenue', value: revenue, format: 'currency' },
      { key: 'contributionMargin', value: contribution, format: 'currency' },
    ];

    const charts: ChartData[] = units > 0
      ? [{
          type: 'pie',
          titleKey: 'breakEven.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'fixedCosts', value: Math.max(input.fixedCosts, 0), color: BLUE },
            { labelKey: 'variableCosts', value: Math.max(variableTotal, 0), color: AMBER },
          ],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// CAGR — compound annual growth rate between two values over N years
// =====================================================================

export interface CagrInput {
  beginningValue: number;
  endingValue: number;
  years: number;
}

export const cagrEngine: CalculatorEngine<CagrInput, EngineResult> = {
  slug: 'cagr-calculator',
  category: 'finance',

  defaultInput: () => ({ beginningValue: 1000, endingValue: 5000, years: 5 }),

  fields: (): EngineField[] => [
    { name: 'beginningValue', labelKey: 'field.beginningValue', type: 'number', defaultValue: '1000', min: 0, step: 100, currency: true },
    { name: 'endingValue', labelKey: 'field.endingValue', type: 'number', defaultValue: '5000', min: 0, step: 100, currency: true },
    { name: 'years', labelKey: 'field.years', type: 'number', defaultValue: '5', min: 0.1, max: 100, step: 0.5, suffixKey: 'years' },
  ],

  parseInput: (values): CagrInput => ({
    beginningValue: num(values.beginningValue, 0),
    endingValue: num(values.endingValue, 0),
    years: num(values.years, 0),
  }),

  validate: (input) => {
    if (input.beginningValue <= 0) return fail('cagr.beginningRequired', { field: 'beginningValue' });
    if (input.years <= 0) return fail('cagr.yearsRequired', { field: 'years' });
    return ok();
  },

  compute: (input) => {
    const t = Math.min(input.years, 100);
    const ratio = input.beginningValue > 0 ? input.endingValue / input.beginningValue : 0;
    const cagr = ratio >= 0 && t > 0 ? (Math.pow(ratio, 1 / t) - 1) * 100 : 0;
    const totalGrowth = input.endingValue - input.beginningValue;
    const totalReturn = input.beginningValue > 0 ? (ratio - 1) * 100 : 0;

    // Year-by-year projected value using the computed CAGR, for the chart.
    const g = cagr / 100;
    const wholeYears = Math.max(Math.ceil(t), 1);
    const yearLabels: string[] = ['0'];
    const valuePts: number[] = [input.beginningValue];
    for (let y = 1; y <= wholeYears; y++) {
      yearLabels.push(String(y));
      valuePts.push(input.beginningValue * Math.pow(1 + g, Math.min(y, t)));
    }

    const items: ResultItem[] = [
      { key: 'cagr', value: cagr, format: 'percent', precision: 2, primary: true, tone: cagr >= 0 ? 'success' : 'error' },
      { key: 'totalGrowth', value: totalGrowth, format: 'currency', tone: totalGrowth >= 0 ? 'success' : 'error' },
      { key: 'totalReturn', value: totalReturn, format: 'percent', precision: 2 },
    ];

    const charts: ChartData[] = valuePts.length > 2
      ? [{
          type: 'line',
          titleKey: 'cagr.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [{ labelKey: 'value', points: valuePts, color: BLUE }],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// Inflation — future cost + purchasing power of an amount over N years
// =====================================================================

export interface InflationInput {
  amount: number;
  rate: number; // annual inflation percentage
  years: number;
}

export const inflationEngine: CalculatorEngine<InflationInput, EngineResult> = {
  slug: 'inflation-calculator',
  category: 'finance',

  defaultInput: () => ({ amount: 1000, rate: 3, years: 10 }),

  fields: (): EngineField[] => [
    { name: 'amount', labelKey: 'field.amount', type: 'number', defaultValue: '1000', min: 0, step: 100, currency: true },
    { name: 'rate', labelKey: 'field.inflationRate', type: 'number', defaultValue: '3', min: 0, max: 100, step: 0.1, suffixKey: '%' },
    { name: 'years', labelKey: 'field.years', type: 'number', defaultValue: '10', min: 0.1, max: 100, step: 1, suffixKey: 'years' },
  ],

  parseInput: (values): InflationInput => ({
    amount: num(values.amount, 0),
    rate: num(values.rate, 0),
    years: num(values.years, 0),
  }),

  validate: (input) => {
    if (input.years <= 0) return fail('inflation.yearsRequired', { field: 'years' });
    return ok();
  },

  compute: (input) => {
    const t = Math.min(input.years, 100);
    const factor = Math.pow(1 + input.rate / 100, t);
    const futureCost = input.amount * factor;
    const purchasingPower = factor !== 0 ? input.amount / factor : 0;
    const totalInflation = (factor - 1) * 100;

    // Rising price of the same goods over the horizon, for the chart.
    const wholeYears = Math.max(Math.ceil(t), 1);
    const yearLabels: string[] = ['0'];
    const pricePts: number[] = [input.amount];
    for (let y = 1; y <= wholeYears; y++) {
      yearLabels.push(String(y));
      pricePts.push(input.amount * Math.pow(1 + input.rate / 100, Math.min(y, t)));
    }

    const items: ResultItem[] = [
      { key: 'futureCost', value: futureCost, format: 'currency', primary: true },
      { key: 'purchasingPower', value: purchasingPower, format: 'currency', tone: 'warning' },
      { key: 'totalInflation', value: totalInflation, format: 'percent', precision: 1 },
    ];

    const charts: ChartData[] = pricePts.length > 2
      ? [{
          type: 'line',
          titleKey: 'inflation.growthTitle',
          format: 'currency',
          labels: yearLabels,
          series: [{ labelKey: 'price', points: pricePts, color: AMBER }],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// ROI — return on investment (+ optional annualized ROI over N years)
// =====================================================================

export interface RoiInput {
  amountInvested: number;
  amountReturned: number;
  years: number;
}

export const roiEngine: CalculatorEngine<RoiInput, EngineResult> = {
  slug: 'roi-calculator',
  category: 'finance',

  defaultInput: () => ({ amountInvested: 1000, amountReturned: 1500, years: 1 }),

  fields: (): EngineField[] => [
    { name: 'amountInvested', labelKey: 'field.amountInvested', type: 'number', defaultValue: '1000', min: 0, step: 100, currency: true },
    { name: 'amountReturned', labelKey: 'field.amountReturned', type: 'number', defaultValue: '1500', min: 0, step: 100, currency: true },
    { name: 'years', labelKey: 'field.years', type: 'number', defaultValue: '1', min: 0, max: 100, step: 0.5, suffixKey: 'years' },
  ],

  parseInput: (values): RoiInput => ({
    amountInvested: num(values.amountInvested, 0),
    amountReturned: num(values.amountReturned, 0),
    years: num(values.years, 0),
  }),

  validate: (input) => {
    if (input.amountInvested <= 0) return fail('roi.investedRequired', { field: 'amountInvested' });
    return ok();
  },

  compute: (input) => {
    const netProfit = input.amountReturned - input.amountInvested;
    const roi = input.amountInvested !== 0 ? (netProfit / input.amountInvested) * 100 : 0;
    const t = Math.min(input.years, 100);
    const ratio = input.amountInvested > 0 ? input.amountReturned / input.amountInvested : 0;
    const annualized = t > 0 && ratio > 0 ? (Math.pow(ratio, 1 / t) - 1) * 100 : roi;

    const items: ResultItem[] = [
      { key: 'roi', value: roi, format: 'percent', precision: 2, primary: true, tone: roi >= 0 ? 'success' : 'error' },
      { key: 'netProfit', value: netProfit, format: 'currency', tone: netProfit >= 0 ? 'success' : 'error' },
      ...(t > 0 ? [{ key: 'annualizedRoi', value: annualized, format: 'percent' as const, precision: 2 }] : []),
    ];

    const charts: ChartData[] = netProfit >= 0
      ? [{
          type: 'pie',
          titleKey: 'roi.pieTitle',
          format: 'currency',
          slices: [
            { labelKey: 'amountInvested', value: Math.max(input.amountInvested, 0), color: BLUE },
            { labelKey: 'netProfit', value: Math.max(netProfit, 0), color: CYAN },
          ],
        }]
      : [];

    return { items, charts };
  },
};

// =====================================================================
// GST (goods and services tax) — add or remove GST, show CGST/SGST split
// =====================================================================

export type GstMode = 'exclusive' | 'inclusive';

export interface GstInput {
  mode: GstMode;
  amount: number;
  rate: number;
}

export const gstEngine: CalculatorEngine<GstInput, EngineResult> = {
  slug: 'gst-calculator',
  category: 'finance',

  defaultInput: () => ({ mode: 'exclusive', amount: 1000, rate: 18 }),

  fields: (): EngineField[] => [
    {
      name: 'mode', labelKey: 'field.mode', type: 'radio', defaultValue: 'exclusive',
      options: [
        { value: 'exclusive', labelKey: 'mode.addGst' },
        { value: 'inclusive', labelKey: 'mode.removeGst' },
      ],
      span: 2,
    },
    { name: 'amount', labelKey: 'field.amount', type: 'number', defaultValue: '1000', min: 0, step: 1, currency: true },
    { name: 'rate', labelKey: 'field.rate', type: 'number', defaultValue: '18', min: 0, max: 100, step: 0.1, suffixKey: '%' },
  ],

  parseInput: (values): GstInput => ({
    mode: values.mode === 'inclusive' ? 'inclusive' : 'exclusive',
    amount: num(values.amount, 0),
    rate: num(values.rate, 0),
  }),

  validate: (input) => {
    if (input.amount < 0) return fail('gst.amountRequired', { field: 'amount' });
    if (input.rate <= -100) return fail('gst.rateInvalid', { field: 'rate' });
    return ok();
  },

  compute: (input) => {
    const r = input.rate / 100;
    let net: number;
    let gross: number;
    if (input.mode === 'inclusive') {
      gross = input.amount;
      const denom = 1 + r;
      net = Math.abs(denom) > 1e-9 ? gross / denom : gross;
    } else {
      net = input.amount;
      gross = net * (1 + r);
    }
    const gst = gross - net;
    const halfGst = gst / 2;

    const items: ResultItem[] = [
      { key: 'gstAmount', value: gst, format: 'currency', primary: true },
      { key: 'netAmount', value: net, format: 'currency' },
      { key: 'grossAmount', value: gross, format: 'currency' },
    ];

    const breakdown: ResultItem[] = [
      { key: 'cgst', value: halfGst, format: 'currency' },
      { key: 'sgst', value: halfGst, format: 'currency' },
    ];

    const charts: ChartData[] = [
      {
        type: 'pie',
        titleKey: 'gst.pieTitle',
        format: 'currency',
        slices: [
          { labelKey: 'netAmount', value: Math.max(net, 0), color: BLUE },
          { labelKey: 'gstAmount', value: Math.max(gst, 0), color: AMBER },
        ],
      },
    ];

    return { items, breakdown, charts };
  },
};

// =====================================================================
// Export
// =====================================================================

export const businessEngines: AnyEngine[] = [
  vatEngine as AnyEngine,
  marginEngine as AnyEngine,
  profitEngine as AnyEngine,
  commissionEngine as AnyEngine,
  markupEngine as AnyEngine,
  debtToIncomeEngine as AnyEngine,
  breakEvenEngine as AnyEngine,
  cagrEngine as AnyEngine,
  inflationEngine as AnyEngine,
  roiEngine as AnyEngine,
  gstEngine as AnyEngine,
];

