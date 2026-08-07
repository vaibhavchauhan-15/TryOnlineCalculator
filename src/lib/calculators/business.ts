import type { Calculator } from '../types';
import { num, currency, percent, number } from '../format';

// Business & finance calculators (profit / margin / tax family). These legacy
// definitions power the category listings, homepage and client-side search.
// The live, localized page result is produced by the matching pure engines in
// ../calculator-engine/engines/business.ts; the compute() functions here mirror
// that maths for the no-JS / SEO fallback and stay the single search source.

export const businessCalculators: Calculator[] = [
  /* -------------------------------------------------------------------- VAT */
  {
    slug: 'vat-calculator',
    category: 'finance',
    title: 'VAT Calculator',
    description: 'Add VAT to a net price or remove VAT from a gross price at any rate.',
    intro:
      'Enter an amount and VAT rate to instantly see the net price, the VAT amount and the gross total. Switch modes to add VAT to a net figure or extract the VAT already inside a gross figure.',
    keywords: ['vat calculator', 'add vat', 'remove vat', 'vat calculator uk', 'value added tax', 'net to gross'],
    popular: true,
    inputs: [
      {
        name: 'mode', label: 'Mode', type: 'radio', default: 'net', span: 2,
        options: [
          { label: 'Add VAT (net → gross)', value: 'net' },
          { label: 'Remove VAT (gross → net)', value: 'gross' },
        ],
      },
      { name: 'amount', label: 'Amount', type: 'number', prefix: '$', default: 100, min: 0, step: 1 },
      { name: 'rate', label: 'VAT rate', type: 'number', suffix: '%', default: 20, min: 0, max: 100, step: 0.1 },
    ],
    compute: (v) => {
      const amount = num(v.amount, 0);
      const r = num(v.rate, 0) / 100;
      let net: number;
      let gross: number;
      if (v.mode === 'gross') {
        gross = amount;
        net = r > -1 ? gross / (1 + r) : gross;
      } else {
        net = amount;
        gross = net * (1 + r);
      }
      const vat = gross - net;
      return {
        results: [
          { label: 'VAT amount', value: currency(vat), primary: true },
          { label: 'Net amount', value: currency(net) },
          { label: 'Gross amount', value: currency(gross) },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Net vs VAT',
            format: 'currency',
            slices: [
              { label: 'Net amount', value: Math.max(net, 0), color: '#0070f3' },
              { label: 'VAT amount', value: Math.max(vat, 0), color: '#f5a623' },
            ],
          },
        ],
      };
    },
    formulaIntro: 'VAT is added on top of the net price or extracted from the gross price.',
    formulaItems: [
      { name: 'Add VAT', expr: 'Gross = Net × (1 + rate / 100)' },
      { name: 'Remove VAT', expr: 'Net = Gross / (1 + rate / 100)' },
      { name: 'VAT amount', expr: 'VAT = Gross − Net' },
    ],
    howto: [
      'Choose whether to add VAT to a net amount or remove it from a gross amount.',
      'Enter the amount.',
      'Set the VAT rate (e.g. 20%).',
      'Read the net price, VAT amount and gross total below.',
    ],
    examples: [
      { title: '$100 net at 20% VAT', body: 'A $100 net price at 20% VAT adds $20 of VAT for a $120 gross total.' },
    ],
    faq: [
      { q: 'How do I remove VAT from a gross price?', a: 'Switch to "Remove VAT". The calculator divides the gross amount by (1 + rate/100) to recover the original net price, then shows the VAT as the difference.' },
      { q: 'What is the difference between VAT and sales tax?', a: 'VAT is charged at each stage of the supply chain and is common in the UK and EU, while US sales tax is charged only once at the final sale. The maths of adding a percentage is the same.' },
    ],
    related: ['sales-tax-calculator', 'margin-calculator', 'markup-calculator', 'discount-calculator'],
  },

  /* ----------------------------------------------------------------- Margin */
  {
    slug: 'margin-calculator',
    category: 'finance',
    title: 'Margin Calculator',
    description: 'Calculate gross profit margin, profit and markup from cost and revenue.',
    intro:
      'Enter your cost and selling price (revenue) to see the gross profit, the profit margin as a percentage of revenue, and the equivalent markup on cost.',
    keywords: ['margin calculator', 'profit margin calculator', 'gross margin', 'margin vs markup'],
    popular: true,
    inputs: [
      { name: 'cost', label: 'Cost', type: 'number', prefix: '$', default: 40, min: 0, step: 1 },
      { name: 'revenue', label: 'Revenue', type: 'number', prefix: '$', default: 100, min: 0, step: 1 },
    ],
    compute: (v) => {
      const cost = num(v.cost, 0);
      const revenue = num(v.revenue, 0);
      if (revenue <= 0) return { results: [], error: 'Enter a revenue (selling price) greater than zero.' };
      const profit = revenue - cost;
      const margin = (profit / revenue) * 100;
      const markup = cost !== 0 ? (profit / cost) * 100 : 0;
      return {
        results: [
          { label: 'Gross margin', value: percent(margin, 2), primary: true, tone: profit >= 0 ? 'success' : 'error' },
          { label: 'Gross profit', value: currency(profit), tone: profit >= 0 ? 'success' : 'error' },
          { label: 'Markup', value: percent(markup, 2) },
        ],
        charts: profit >= 0 ? [
          {
            type: 'pie', title: 'Cost vs profit', format: 'currency',
            slices: [
              { label: 'Cost', value: Math.max(cost, 0), color: '#0070f3' },
              { label: 'Gross profit', value: Math.max(profit, 0), color: '#50e3c2' },
            ],
          },
        ] : undefined,
      };
    },
    formulaItems: [
      { name: 'Gross margin', expr: 'Margin % = (Revenue − Cost) / Revenue × 100' },
      { name: 'Markup', expr: 'Markup % = (Revenue − Cost) / Cost × 100' },
    ],
    howto: ['Enter the item cost.', 'Enter the revenue (selling price).', 'Read the margin, profit and markup below.'],
    faq: [
      { q: 'What is the difference between margin and markup?', a: 'Margin is profit as a percentage of the selling price; markup is profit as a percentage of the cost. A 50% markup on a $40 cost is only a 33.3% margin.' },
      { q: 'What is a good profit margin?', a: 'It varies by industry, but many retail businesses aim for gross margins of 30%–50%. Compare against typical margins in your specific sector.' },
    ],
    related: ['markup-calculator', 'profit-calculator', 'vat-calculator', 'discount-calculator'],
  },

  /* ----------------------------------------------------------------- Profit */
  {
    slug: 'profit-calculator',
    category: 'finance',
    title: 'Profit Calculator',
    description: 'Work out net profit, profit margin and markup from your costs and revenue.',
    intro:
      'Enter total cost and total revenue to see how much profit you make, your profit margin as a percentage, and the markup applied to cost.',
    keywords: ['profit calculator', 'net profit calculator', 'business profit', 'profit and margin'],
    popular: true,
    inputs: [
      { name: 'cost', label: 'Cost', type: 'number', prefix: '$', default: 2500, min: 0, step: 10 },
      { name: 'revenue', label: 'Revenue', type: 'number', prefix: '$', default: 4000, min: 0, step: 10 },
    ],
    compute: (v) => {
      const cost = num(v.cost, 0);
      const revenue = num(v.revenue, 0);
      const profit = revenue - cost;
      const margin = revenue !== 0 ? (profit / revenue) * 100 : 0;
      const markup = cost !== 0 ? (profit / cost) * 100 : 0;
      return {
        results: [
          { label: 'Net profit', value: currency(profit), primary: true, tone: profit >= 0 ? 'success' : 'error' },
          { label: 'Profit margin', value: percent(margin, 2) },
          { label: 'Markup', value: percent(markup, 2) },
        ],
        charts: profit >= 0 ? [
          {
            type: 'pie', title: 'Cost vs profit', format: 'currency',
            slices: [
              { label: 'Cost', value: Math.max(cost, 0), color: '#0070f3' },
              { label: 'Net profit', value: Math.max(profit, 0), color: '#50e3c2' },
            ],
          },
        ] : undefined,
      };
    },
    formulaItems: [
      { name: 'Net profit', expr: 'Profit = Revenue − Cost' },
      { name: 'Profit margin', expr: 'Margin % = Profit / Revenue × 100' },
    ],
    howto: ['Enter your total cost.', 'Enter your total revenue.', 'Read the profit, margin and markup below.'],
    faq: [
      { q: 'What counts as cost here?', a: 'Use the total cost of the goods or service you are selling — the cost of goods sold. For net profit after overheads, include operating expenses in the cost figure.' },
      { q: 'How is profit margin different from profit?', a: 'Profit is the raw amount you keep; profit margin expresses that profit as a percentage of revenue, which makes it easy to compare across different sale sizes.' },
    ],
    related: ['margin-calculator', 'markup-calculator', 'roi-calculator', 'break-even-calculator'],
  },

  /* ------------------------------------------------------------- Commission */
  {
    slug: 'commission-calculator',
    category: 'salary',
    title: 'Commission Calculator',
    description: 'Calculate sales commission and total earnings from a sale amount and rate.',
    intro:
      'Enter the sale amount and your commission rate to see how much commission you earn. Add a base pay to see your total earnings for the period.',
    keywords: ['commission calculator', 'sales commission', 'commission rate', 'commission pay'],
    inputs: [
      { name: 'saleAmount', label: 'Sale amount', type: 'number', prefix: '$', default: 10000, min: 0, step: 100 },
      { name: 'rate', label: 'Commission rate', type: 'number', suffix: '%', default: 5, min: 0, max: 100, step: 0.1 },
      { name: 'base', label: 'Base pay', type: 'number', prefix: '$', default: 0, min: 0, step: 100 },
    ],
    compute: (v) => {
      const sale = num(v.saleAmount, 0);
      const rate = num(v.rate, 0);
      const base = num(v.base, 0);
      const commission = (sale * rate) / 100;
      const total = commission + base;
      return {
        results: [
          { label: 'Commission', value: currency(commission), primary: true },
          { label: 'Total earnings', value: currency(total) },
        ],
        charts: base > 0 ? [
          {
            type: 'pie', title: 'Base pay vs commission', format: 'currency',
            slices: [
              { label: 'Base pay', value: Math.max(base, 0), color: '#0070f3' },
              { label: 'Commission', value: Math.max(commission, 0), color: '#50e3c2' },
            ],
          },
        ] : undefined,
      };
    },
    formulaItems: [
      { name: 'Commission', expr: 'Commission = Sale amount × rate / 100' },
      { name: 'Total earnings', expr: 'Total = Base pay + Commission' },
    ],
    howto: ['Enter the total sale amount.', 'Enter your commission rate.', 'Optionally add a base pay for total earnings.'],
    faq: [
      { q: 'How is commission calculated?', a: 'Commission is the sale amount multiplied by the commission rate. A 5% rate on a $10,000 sale pays $500 in commission.' },
      { q: 'What is a tiered commission?', a: 'A tiered structure pays a higher rate once sales pass a threshold. Calculate each tier separately and add the results for your total.' },
    ],
    related: ['salary-calculator', 'paycheck-calculator', 'profit-calculator', 'markup-calculator'],
  },

  /* ----------------------------------------------------------------- Markup */
  {
    slug: 'markup-calculator',
    category: 'finance',
    title: 'Markup Calculator',
    description: 'Find the selling price, profit and margin from a cost and markup percentage.',
    intro:
      'Enter your cost and the markup percentage you want to apply to see the selling price, the profit per unit and the resulting profit margin.',
    keywords: ['markup calculator', 'markup percentage', 'selling price calculator', 'cost plus pricing'],
    inputs: [
      { name: 'cost', label: 'Cost', type: 'number', prefix: '$', default: 40, min: 0, step: 1 },
      { name: 'markup', label: 'Markup', type: 'number', suffix: '%', default: 50, min: 0, max: 1000, step: 1 },
    ],
    compute: (v) => {
      const cost = num(v.cost, 0);
      const markup = num(v.markup, 0);
      if (cost <= 0) return { results: [], error: 'Enter a cost greater than zero.' };
      const profit = (cost * markup) / 100;
      const price = cost + profit;
      const margin = price !== 0 ? (profit / price) * 100 : 0;
      return {
        results: [
          { label: 'Selling price', value: currency(price), primary: true },
          { label: 'Gross profit', value: currency(profit), tone: 'success' },
          { label: 'Gross margin', value: percent(margin, 2) },
        ],
        charts: [
          {
            type: 'pie', title: 'Cost vs profit', format: 'currency',
            slices: [
              { label: 'Cost', value: Math.max(cost, 0), color: '#0070f3' },
              { label: 'Gross profit', value: Math.max(profit, 0), color: '#50e3c2' },
            ],
          },
        ],
      };
    },
    formulaItems: [
      { name: 'Selling price', expr: 'Price = Cost × (1 + markup / 100)' },
      { name: 'Margin', expr: 'Margin % = (Price − Cost) / Price × 100' },
    ],
    howto: ['Enter the item cost.', 'Enter the markup percentage.', 'Read the selling price, profit and margin below.'],
    faq: [
      { q: 'How do I set a selling price from cost?', a: 'Decide the markup percentage you want on cost, then multiply the cost by (1 + markup/100). A 50% markup on a $40 cost gives a $60 selling price.' },
      { q: 'Why is my margin lower than my markup?', a: 'Markup is measured against cost while margin is measured against the higher selling price, so the margin percentage is always smaller than the markup.' },
    ],
    related: ['margin-calculator', 'profit-calculator', 'vat-calculator', 'discount-calculator'],
  },

  /* --------------------------------------------------------- Debt-to-Income */
  {
    slug: 'debt-to-income-calculator',
    category: 'finance',
    title: 'Debt-to-Income (DTI) Calculator',
    description: 'Calculate your debt-to-income ratio from monthly debt payments and gross income.',
    intro:
      'Your debt-to-income (DTI) ratio compares your monthly debt payments to your gross monthly income. Lenders use it to gauge how comfortably you can take on a mortgage or loan.',
    keywords: ['debt to income calculator', 'dti calculator', 'debt to income ratio', 'dti ratio'],
    popular: true,
    inputs: [
      { name: 'monthlyDebt', label: 'Monthly debt payments', type: 'number', prefix: '$', default: 1500, min: 0, step: 50 },
      { name: 'grossIncome', label: 'Gross monthly income', type: 'number', prefix: '$', default: 5000, min: 0, step: 100 },
    ],
    compute: (v) => {
      const debt = num(v.monthlyDebt, 0);
      const income = num(v.grossIncome, 0);
      if (income <= 0) return { results: [], error: 'Enter a gross monthly income greater than zero.' };
      const dti = (debt / income) * 100;
      const remaining = Math.max(income - debt, 0);
      const tone = dti <= 36 ? 'success' : dti <= 43 ? 'warning' : 'error';
      return {
        results: [
          { label: 'Debt-to-income ratio', value: percent(dti, 1), primary: true, tone },
          { label: 'Monthly debt', value: currency(debt) },
          { label: 'Income after debt', value: currency(remaining) },
        ],
        charts: [
          {
            type: 'pie', title: 'Debt vs remaining income', format: 'currency',
            slices: [
              { label: 'Monthly debt', value: Math.max(debt, 0), color: '#f5a623' },
              { label: 'Income after debt', value: remaining, color: '#0070f3' },
            ],
          },
        ],
      };
    },
    formulaItems: [
      { name: 'DTI ratio', expr: 'DTI % = Monthly debt / Gross monthly income × 100' },
    ],
    howto: ['Add up your monthly debt payments (loans, cards, mortgage).', 'Enter your gross monthly income before tax.', 'Read your DTI ratio below.'],
    faq: [
      { q: 'What is a good debt-to-income ratio?', a: 'Lenders generally view 36% or below as healthy. Many mortgage programs allow up to 43%, and above that borrowing becomes harder.' },
      { q: 'Should I use gross or net income?', a: 'DTI uses gross income — your income before taxes and deductions — because that is the figure most lenders underwrite against.' },
    ],
    related: ['mortgage-calculator', 'loan-calculator', 'roi-calculator', 'savings-calculator'],
  },

  /* ------------------------------------------------------------- Break-even */
  {
    slug: 'break-even-calculator',
    category: 'finance',
    title: 'Break-even Calculator',
    description: 'Find the units and revenue you need to sell to cover your fixed costs.',
    intro:
      'The break-even point is where total revenue equals total cost — no profit, no loss. Enter your fixed costs, price per unit and variable cost per unit to find how many units you must sell.',
    keywords: ['break even calculator', 'break-even point', 'break even analysis', 'break even units'],
    inputs: [
      { name: 'fixedCosts', label: 'Fixed costs', type: 'number', prefix: '$', default: 10000, min: 0, step: 100 },
      { name: 'pricePerUnit', label: 'Price per unit', type: 'number', prefix: '$', default: 50, min: 0, step: 1 },
      { name: 'variableCost', label: 'Variable cost per unit', type: 'number', prefix: '$', default: 30, min: 0, step: 1 },
    ],
    compute: (v) => {
      const fixed = num(v.fixedCosts, 0);
      const price = num(v.pricePerUnit, 0);
      const variable = num(v.variableCost, 0);
      const contribution = price - variable;
      if (contribution <= 0) return { results: [], error: 'The price per unit must be greater than the variable cost per unit.' };
      const units = fixed / contribution;
      const revenue = units * price;
      const variableTotal = units * variable;
      return {
        results: [
          { label: 'Break-even units', value: number(units, 0), primary: true },
          { label: 'Break-even revenue', value: currency(revenue) },
          { label: 'Contribution margin / unit', value: currency(contribution) },
        ],
        charts: [
          {
            type: 'pie', title: 'Costs at break-even', format: 'currency',
            slices: [
              { label: 'Fixed costs', value: Math.max(fixed, 0), color: '#0070f3' },
              { label: 'Variable costs', value: Math.max(variableTotal, 0), color: '#f5a623' },
            ],
          },
        ],
      };
    },
    formulaItems: [
      { name: 'Break-even units', expr: 'Units = Fixed costs / (Price − Variable cost)' },
      { name: 'Break-even revenue', expr: 'Revenue = Units × Price' },
    ],
    howto: ['Enter your total fixed costs.', 'Enter the price and variable cost per unit.', 'Read the break-even units and revenue below.'],
    faq: [
      { q: 'What is the contribution margin?', a: 'It is the price per unit minus the variable cost per unit — the amount each sale contributes toward covering fixed costs and, after break-even, profit.' },
      { q: 'What happens above the break-even point?', a: 'Every unit sold beyond break-even adds its full contribution margin straight to profit, because the fixed costs are already covered.' },
    ],
    related: ['profit-calculator', 'margin-calculator', 'roi-calculator', 'markup-calculator'],
  },

  /* ------------------------------------------------------------------- CAGR */
  {
    slug: 'cagr-calculator',
    category: 'finance',
    title: 'CAGR Calculator',
    description: 'Calculate the compound annual growth rate between a starting and ending value.',
    intro:
      'CAGR (compound annual growth rate) is the smoothed yearly rate an investment would need to grow from its starting value to its ending value over a number of years.',
    keywords: ['cagr calculator', 'compound annual growth rate', 'annual growth rate', 'cagr formula'],
    popular: true,
    inputs: [
      { name: 'beginningValue', label: 'Beginning value', type: 'number', prefix: '$', default: 1000, min: 0, step: 100 },
      { name: 'endingValue', label: 'Ending value', type: 'number', prefix: '$', default: 5000, min: 0, step: 100 },
      { name: 'years', label: 'Years', type: 'number', suffix: 'yrs', default: 5, min: 0.1, max: 100, step: 0.5 },
    ],
    compute: (v) => {
      const begin = num(v.beginningValue, 0);
      const end = num(v.endingValue, 0);
      const years = num(v.years, 0);
      if (begin <= 0) return { results: [], error: 'Enter a beginning value greater than zero.' };
      if (years <= 0) return { results: [], error: 'Enter a number of years greater than zero.' };
      const ratio = end / begin;
      const cagr = ratio > 0 ? (Math.pow(ratio, 1 / years) - 1) * 100 : 0;
      const totalGrowth = end - begin;
      const totalReturn = (ratio - 1) * 100;
      return {
        results: [
          { label: 'CAGR', value: percent(cagr, 2), primary: true, tone: cagr >= 0 ? 'success' : 'error' },
          { label: 'Total growth', value: currency(totalGrowth), tone: totalGrowth >= 0 ? 'success' : 'error' },
          { label: 'Total return', value: percent(totalReturn, 2) },
        ],
      };
    },
    formulaItems: [
      { name: 'CAGR', expr: 'CAGR = (Ending / Beginning)^(1 / years) − 1' },
    ],
    howto: ['Enter the beginning value.', 'Enter the ending value.', 'Enter the number of years to see the annual growth rate.'],
    faq: [
      { q: 'Why use CAGR instead of a simple average?', a: 'CAGR accounts for compounding, giving the constant yearly rate that connects the start and end values. A simple average ignores the order and compounding of returns.' },
      { q: 'Does CAGR show volatility?', a: 'No. CAGR is a smoothed figure and hides the ups and downs along the way — two investments with very different paths can share the same CAGR.' },
    ],
    related: ['investment-calculator', 'roi-calculator', 'compound-interest-calculator', 'inflation-calculator'],
  },

  /* -------------------------------------------------------------- Inflation */
  {
    slug: 'inflation-calculator',
    category: 'finance',
    title: 'Inflation Calculator',
    description: 'See how inflation changes the future cost and purchasing power of money over time.',
    intro:
      'Inflation erodes the value of money over time. Enter an amount, an expected annual inflation rate and a number of years to see the future cost of the same goods and the shrinking purchasing power of that money.',
    keywords: ['inflation calculator', 'purchasing power calculator', 'future value of money', 'inflation rate'],
    popular: true,
    inputs: [
      { name: 'amount', label: 'Amount', type: 'number', prefix: '$', default: 1000, min: 0, step: 100 },
      { name: 'rate', label: 'Annual inflation rate', type: 'number', suffix: '%', default: 3, min: 0, max: 100, step: 0.1 },
      { name: 'years', label: 'Years', type: 'number', suffix: 'yrs', default: 10, min: 0.1, max: 100, step: 1 },
    ],
    compute: (v) => {
      const amount = num(v.amount, 0);
      const rate = num(v.rate, 0);
      const years = num(v.years, 0);
      if (years <= 0) return { results: [], error: 'Enter a number of years greater than zero.' };
      const factor = Math.pow(1 + rate / 100, years);
      const futureCost = amount * factor;
      const purchasingPower = factor !== 0 ? amount / factor : 0;
      const totalInflation = (factor - 1) * 100;
      return {
        results: [
          { label: 'Future cost', value: currency(futureCost), primary: true },
          { label: 'Purchasing power', value: currency(purchasingPower), tone: 'warning' },
          { label: 'Total inflation', value: percent(totalInflation, 1) },
        ],
      };
    },
    formulaItems: [
      { name: 'Future cost', expr: 'Future = Amount × (1 + rate / 100)^years' },
      { name: 'Purchasing power', expr: 'Power = Amount / (1 + rate / 100)^years' },
    ],
    howto: ['Enter the amount of money.', 'Enter the expected annual inflation rate.', 'Enter the number of years to project.'],
    faq: [
      { q: 'What is a typical inflation rate?', a: 'Many central banks target around 2% per year. Actual inflation varies — use a rate that reflects your region and time horizon.' },
      { q: 'What does purchasing power mean?', a: 'It is how much your money can actually buy. At 3% inflation, $1,000 today has the buying power of about $744 in ten years.' },
    ],
    related: ['compound-interest-calculator', 'cagr-calculator', 'investment-calculator', 'retirement-calculator'],
  },

  /* -------------------------------------------------------------------- ROI */
  {
    slug: 'roi-calculator',
    category: 'finance',
    title: 'ROI Calculator',
    description: 'Calculate return on investment, net profit and annualized ROI.',
    intro:
      'Return on investment (ROI) measures the gain or loss on an investment relative to its cost. Enter the amount invested and the amount returned to see your ROI, net profit and annualized return.',
    keywords: ['roi calculator', 'return on investment', 'roi formula', 'annualized roi'],
    popular: true,
    inputs: [
      { name: 'amountInvested', label: 'Amount invested', type: 'number', prefix: '$', default: 1000, min: 0, step: 100 },
      { name: 'amountReturned', label: 'Amount returned', type: 'number', prefix: '$', default: 1500, min: 0, step: 100 },
      { name: 'years', label: 'Years held', type: 'number', suffix: 'yrs', default: 1, min: 0, max: 100, step: 0.5 },
    ],
    compute: (v) => {
      const invested = num(v.amountInvested, 0);
      const returned = num(v.amountReturned, 0);
      const years = num(v.years, 0);
      if (invested <= 0) return { results: [], error: 'Enter an amount invested greater than zero.' };
      const netProfit = returned - invested;
      const roi = (netProfit / invested) * 100;
      const ratio = returned / invested;
      const annualized = years > 0 && ratio > 0 ? (Math.pow(ratio, 1 / years) - 1) * 100 : roi;
      const results = [
        { label: 'ROI', value: percent(roi, 2), primary: true, tone: (roi >= 0 ? 'success' : 'error') as 'success' | 'error' },
        { label: 'Net profit', value: currency(netProfit), tone: (netProfit >= 0 ? 'success' : 'error') as 'success' | 'error' },
      ];
      if (years > 0) results.push({ label: 'Annualized ROI', value: percent(annualized, 2), tone: 'success' });
      return {
        results,
        charts: netProfit >= 0 ? [
          {
            type: 'pie', title: 'Invested vs profit', format: 'currency',
            slices: [
              { label: 'Amount invested', value: Math.max(invested, 0), color: '#0070f3' },
              { label: 'Net profit', value: Math.max(netProfit, 0), color: '#50e3c2' },
            ],
          },
        ] : undefined,
      };
    },
    formulaItems: [
      { name: 'ROI', expr: 'ROI % = (Returned − Invested) / Invested × 100' },
      { name: 'Annualized ROI', expr: 'Annualized = (Returned / Invested)^(1 / years) − 1' },
    ],
    howto: ['Enter the amount you invested.', 'Enter the amount you got back.', 'Optionally add the years held for an annualized ROI.'],
    faq: [
      { q: 'What is a good ROI?', a: 'It depends on the investment and risk. As a benchmark, the stock market has historically returned roughly 7%–10% per year on average over the long run.' },
      { q: 'Why calculate annualized ROI?', a: 'Total ROI does not account for time. Annualized ROI converts the total return into a per-year rate so you can compare investments held for different lengths of time.' },
    ],
    related: ['cagr-calculator', 'investment-calculator', 'profit-calculator', 'compound-interest-calculator'],
  },

  /* -------------------------------------------------------------------- GST */
  {
    slug: 'gst-calculator',
    category: 'finance',
    title: 'GST Calculator',
    description: 'Add GST to a price or remove GST from a total. Works for India, Australia, Singapore and other GST countries.',
    intro:
      'Enter an amount and GST rate to instantly calculate the GST amount, net price and gross total. Switch modes to add GST or extract GST from a GST-inclusive price.',
    keywords: ['gst calculator', 'gst calculator online', 'gst calculator india', 'cgst sgst calculator', 'goods and services tax calculator', '18% gst calculator', 'gst tax calculator'],
    inputs: [
      {
        name: 'mode', label: 'Mode', type: 'radio', default: 'exclusive', span: 2,
        options: [
          { label: 'Add GST (exclusive)', value: 'exclusive' },
          { label: 'Remove GST (inclusive)', value: 'inclusive' },
        ],
      },
      { name: 'amount', label: 'Amount', type: 'number', prefix: '$', default: 1000, min: 0, step: 1 },
      { name: 'rate', label: 'GST rate', type: 'number', suffix: '%', default: 18, min: 0, max: 100, step: 0.1 },
    ],
    compute: (v) => {
      const amount = num(v.amount, 0);
      const r = num(v.rate, 0) / 100;
      if (amount < 0) return { results: [], error: 'Enter a valid amount.' };
      let net: number;
      let gross: number;
      if (v.mode === 'inclusive') {
        gross = amount;
        net = r > -1 ? gross / (1 + r) : gross;
      } else {
        net = amount;
        gross = net * (1 + r);
      }
      const gst = gross - net;
      const halfGst = gst / 2;
      return {
        results: [
          { label: 'GST amount', value: currency(gst), primary: true },
          { label: 'Net amount', value: currency(net) },
          { label: 'Gross amount', value: currency(gross) },
        ],
        breakdown: [
          { label: 'CGST (half)', value: currency(halfGst) },
          { label: 'SGST (half)', value: currency(halfGst) },
        ],
        charts: net > 0 || gst > 0
          ? [{
              type: 'pie',
              title: 'Net vs GST',
              format: 'currency',
              slices: [
                { label: 'Net amount', value: Math.max(net, 0), color: '#0070f3' },
                { label: 'GST amount', value: Math.max(gst, 0), color: '#f5a623' },
              ],
            }]
          : undefined,
      };
    },
    formulaIntro: 'GST is added on top of the net price or extracted from the gross price.',
    formulaItems: [
      { name: 'Add GST', expr: 'Gross = Net × (1 + rate / 100)' },
      { name: 'Remove GST', expr: 'Net = Gross / (1 + rate / 100)' },
      { name: 'GST amount', expr: 'GST = Gross − Net' },
      { name: 'CGST / SGST', expr: 'CGST = SGST = GST / 2' },
    ],
    howto: [
      'Choose whether to add GST to a net amount or remove it from a GST-inclusive price.',
      'Enter the amount.',
      'Set the GST rate (e.g. 18% for India, 10% for Australia).',
      'Read the net price, GST amount, gross total and CGST/SGST split below.',
    ],
    examples: [
      { title: '₹1,000 at 18% GST', body: 'A net price of ₹1,000 at 18% GST adds ₹180 of GST (₹90 CGST + ₹90 SGST) for a gross total of ₹1,180.' },
    ],
    faq: [
      { q: 'What is GST?', a: 'GST (Goods and Services Tax) is a comprehensive indirect tax on the supply of goods and services. It replaced multiple cascading taxes in countries like India (2017), Australia, Singapore and others.' },
      { q: 'How is GST calculated?', a: 'For exclusive GST: GST = Amount × Rate / 100, and Total = Amount + GST. For inclusive GST: Net = Total / (1 + Rate / 100), and GST = Total − Net.' },
      { q: 'What is the difference between CGST, SGST and IGST?', a: 'In India, for intra-state sales GST is split equally into CGST (Central) and SGST (State). For inter-state sales the full rate is charged as IGST (Integrated GST).' },
      { q: 'What GST rate should I use?', a: 'Common rates are 5%, 12%, 18% and 28% in India; 10% in Australia; 7% in Singapore. Use the rate applicable to your product or service.' },
      { q: 'How do I remove GST from a price?', a: 'Switch to "GST Inclusive" mode. The calculator divides the total by (1 + rate / 100) to find the original price before GST.' },
    ],
    related: ['vat-calculator', 'sales-tax-calculator', 'margin-calculator', 'discount-calculator'],
  },
];
