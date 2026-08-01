import type { Calculator } from '../types';
import { num, currency, percent, number } from '../format';
import { pmt, futureValue, solveRate } from './_math';

export const financeCalculators: Calculator[] = [
  /* ---------------------------------------------------------------- Mortgage */
  {
    slug: 'mortgage-calculator',
    category: 'finance',
    title: 'Mortgage Calculator',
    description:
      'Estimate your monthly mortgage payment including principal, interest, property tax and home insurance.',
    intro:
      'Enter your home price, down payment, rate and term to see the full monthly payment and how much interest you pay over the life of the loan.',
    keywords: ['mortgage calculator', 'home loan', 'monthly mortgage payment', 'PITI'],
    popular: true,
    inputs: [
      { name: 'homePrice', label: 'Home price', type: 'number', prefix: '$', default: 400000, min: 0, step: 1000 },
      { name: 'downPayment', label: 'Down payment', type: 'number', prefix: '$', default: 80000, min: 0, step: 1000 },
      { name: 'rate', label: 'Interest rate', type: 'number', suffix: '%', default: 6.5, min: 0, max: 30, step: 0.01 },
      { name: 'term', label: 'Loan term', type: 'number', suffix: 'yrs', default: 30, min: 1, max: 50, step: 1 },
      { name: 'tax', label: 'Property tax (yearly)', type: 'number', prefix: '$', default: 4800, min: 0, step: 100 },
      { name: 'insurance', label: 'Home insurance (yearly)', type: 'number', prefix: '$', default: 1800, min: 0, step: 100 },
    ],
    compute: (v) => {
      const price = num(v.homePrice, 0);
      const down = num(v.downPayment, 0);
      const principal = Math.max(price - down, 0);
      const r = num(v.rate, 0) / 100 / 12;
      // Cap the term so the amortization loop below can never run unbounded,
      // even if a caller bypasses the input's max (100 years is well past any
      // real loan and keeps the schedule to a sane 1,200 rows).
      const n = Math.min(num(v.term, 0), 100) * 12;
      if (down >= price && price > 0) return { results: [], error: 'Your down payment is equal to or greater than the home price, so there is no loan to finance. Lower the down payment or raise the home price.' };
      if (principal <= 0 || n <= 0) return { results: [], error: 'Enter a home price, down payment and loan term that leave a loan amount greater than zero.' };
      const pi = pmt(r, n, principal);
      const monthlyTax = num(v.tax, 0) / 12;
      const monthlyIns = num(v.insurance, 0) / 12;
      const total = pi + monthlyTax + monthlyIns;
      const totalInterest = pi * n - principal;

      // Yearly amortization schedule for the charts: remaining balance plus the
      // running totals of interest and payments made at the end of each year.
      const years = Math.ceil(n / 12);
      const yearLabels: string[] = ['0'];
      const balancePts: number[] = [principal];
      const interestPts: number[] = [0];
      const paidPts: number[] = [0];
      let bal = principal;
      let cumInterest = 0;
      let cumPaid = 0;
      for (let m = 1; m <= n; m++) {
        const interest = bal * r;
        bal = Math.max(bal - (pi - interest), 0);
        cumInterest += interest;
        cumPaid += pi;
        if (m % 12 === 0 || m === n) {
          yearLabels.push(String(Math.round(m / 12)));
          balancePts.push(bal);
          interestPts.push(cumInterest);
          paidPts.push(cumPaid);
        }
      }

      return {
        results: [
          { label: 'Monthly payment', value: currency(total), primary: true, hint: 'Principal, interest, tax & insurance' },
          { label: 'Principal & interest', value: currency(pi) },
          { label: 'Tax + insurance', value: currency(monthlyTax + monthlyIns) },
          { label: 'Total interest paid', value: currency(totalInterest), tone: 'warning' },
          { label: 'Total of all payments', value: currency(pi * n + (monthlyTax + monthlyIns) * n) },
        ],
        breakdown: [
          { label: 'Loan amount', value: currency(principal) },
          { label: 'Down payment', value: `${currency(down)} (${percent(price ? (down / price) * 100 : 0, 1)})` },
          { label: 'Payoff', value: `${number(n, 0)} payments` },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Monthly payment breakdown',
            format: 'currency',
            slices: [
              { label: 'Principal & interest', value: pi, color: '#0070f3' },
              { label: 'Property tax', value: monthlyTax, color: '#7928ca' },
              { label: 'Home insurance', value: monthlyIns, color: '#f5a623' },
            ],
          },
          {
            type: 'line',
            title: `Balance & interest over ${number(years, 0)} years`,
            format: 'currency',
            labels: yearLabels,
            series: [
              { label: 'Balance', points: balancePts, color: '#0070f3' },
              { label: 'Total interest', points: interestPts, color: '#f5a623' },
              { label: 'Total paid', points: paidPts, color: '#7928ca' },
            ],
          },
        ],
        info: {
          title: 'Latest mortgage rates',
          note: 'National average fixed rates, updated for reference. Your rate depends on credit, down payment and lender.',
          items: [
            { label: '30-year fixed', value: '6.628%' },
            { label: '15-year fixed', value: '5.811%' },
            { label: '10-year fixed', value: '5.684%' },
          ],
        },
      };
    },
    formulaIntro: 'A mortgage uses the standard amortizing-loan payment formula.',
    formulaItems: [
      { name: 'Monthly payment', expr: 'M = P · r(1 + r)^n / ((1 + r)^n − 1)', desc: 'P = loan amount, r = monthly rate, n = number of months.' },
    ],
    howto: [
      'Enter the home price and your planned down payment.',
      'Add the annual interest rate and the loan term in years.',
      'Optionally include yearly property tax and insurance for a full PITI payment.',
      'Read your estimated monthly payment and total interest below.',
    ],
    examples: [
      { title: '$320,000 loan at 6.5% for 30 years', body: 'A $400,000 home with $80,000 down leaves a $320,000 loan. At 6.5% over 30 years the principal & interest payment is about $2,023 per month.' },
    ],
    faq: [
      { q: 'What is PITI?', a: 'PITI stands for Principal, Interest, Taxes and Insurance — the four parts that make up a typical monthly mortgage payment.' },
      { q: 'Does this include PMI?', a: 'This estimate does not add private mortgage insurance. Lenders usually require PMI when your down payment is under 20%, which adds roughly 0.3%–1.5% of the loan per year.' },
      { q: 'Why does so much go to interest early on?', a: 'Interest is charged on the outstanding balance, which is highest at the start. As you pay down principal, the interest portion of each payment shrinks.' },
    ],
    related: ['loan-calculator', 'auto-loan-calculator', 'compound-interest-calculator', 'investment-calculator'],
  },

  /* -------------------------------------------------------------------- Loan */
  {
    slug: 'loan-calculator',
    category: 'finance',
    title: 'Loan Calculator',
    description: 'Calculate the monthly payment, total interest and total cost of any fixed-rate loan.',
    intro: 'Works as an EMI calculator for personal loans, student loans and any fixed-rate installment loan. Enter the amount, rate and term to see your equated monthly instalment.',
    keywords: ['loan calculator', 'emi calculator', 'loan emi calculator', 'personal loan', 'monthly payment', 'installment loan'],
    popular: true,
    inputs: [
      { name: 'amount', label: 'Loan amount', type: 'number', prefix: '$', default: 25000, min: 0, step: 500 },
      { name: 'rate', label: 'Interest rate', type: 'number', suffix: '%', default: 9, min: 0, max: 60, step: 0.01 },
      { name: 'term', label: 'Loan term', type: 'number', suffix: 'yrs', default: 5, min: 0.1, max: 40, step: 0.5 },
    ],
    compute: (v) => {
      const p = num(v.amount, 0);
      const r = num(v.rate, 0) / 100 / 12;
      const n = Math.min(num(v.term, 0), 100) * 12; // cap term so the schedule loop stays bounded
      if (p <= 0 || n <= 0) return { results: [], error: 'Enter a loan amount and term greater than zero.' };
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

      return {
        results: [
          { label: 'Monthly payment', value: currency(m), primary: true },
          { label: 'Total interest', value: currency(total - p), tone: 'warning' },
          { label: 'Total paid', value: currency(total) },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Principal vs interest',
            format: 'currency',
            slices: [
              { label: 'Principal', value: p, color: '#0070f3' },
              { label: 'Interest', value: total - p, color: '#f5a623' },
            ],
          },
          ...(balancePts.length > 2
            ? [{
                type: 'line' as const,
                title: 'Balance & interest over time',
                format: 'currency' as const,
                labels: yearLabels,
                series: [
                  { label: 'Balance', points: balancePts, color: '#0070f3' },
                  { label: 'Total interest', points: interestPts, color: '#f5a623' },
                ],
              }]
            : []),
        ],
      };
    },
    formulaItems: [{ name: 'Payment', expr: 'M = P · r / (1 − (1 + r)^−n)' }],
    howto: ['Enter the loan amount.', 'Add the annual interest rate.', 'Set the term in years to see your monthly payment.'],
    faq: [
      { q: 'Is the rate the same as APR?', a: 'Not always. APR also folds in certain fees, so the APR on a loan with origination fees will be higher than the stated interest rate.' },
      { q: 'What happens if I pay extra?', a: 'Extra payments go straight to principal, which lowers the balance interest is charged on and shortens the payoff time.' },
    ],
    related: ['mortgage-calculator', 'auto-loan-calculator', 'apr-calculator', 'interest-calculator'],
  },

  /* --------------------------------------------------------------- Auto Loan */
  {
    slug: 'auto-loan-calculator',
    category: 'finance',
    title: 'Auto Loan Calculator',
    description: 'Estimate your car loan payment after down payment, trade-in and sales tax.',
    intro: 'Factor in your down payment, trade-in value and local sales tax to see the real monthly cost of a vehicle.',
    keywords: ['auto loan calculator', 'car loan', 'vehicle finance'],
    popular: true,
    inputs: [
      { name: 'price', label: 'Vehicle price', type: 'number', prefix: '$', default: 32000, min: 0, step: 500 },
      { name: 'down', label: 'Down payment', type: 'number', prefix: '$', default: 4000, min: 0, step: 250 },
      { name: 'trade', label: 'Trade-in value', type: 'number', prefix: '$', default: 0, min: 0, step: 250 },
      { name: 'tax', label: 'Sales tax', type: 'number', suffix: '%', default: 7, min: 0, max: 20, step: 0.1 },
      { name: 'rate', label: 'Interest rate', type: 'number', suffix: '%', default: 7.5, min: 0, max: 40, step: 0.01 },
      { name: 'term', label: 'Loan term', type: 'number', suffix: 'months', default: 60, min: 1, max: 120, step: 1 },
    ],
    compute: (v) => {
      const price = num(v.price, 0);
      const down = num(v.down, 0);
      const trade = num(v.trade, 0);
      const taxAmt = (price * num(v.tax, 0)) / 100;
      const principal = Math.max(price + taxAmt - down - trade, 0);
      const r = num(v.rate, 0) / 100 / 12;
      const n = num(v.term, 0);
      if (principal <= 0 || n <= 0) return { results: [], error: 'Enter values that leave a positive amount to finance.' };
      const m = pmt(r, n, principal);
      const interest = m * n - principal;
      const upfront = down + trade;
      return {
        results: [
          { label: 'Monthly payment', value: currency(m), primary: true },
          { label: 'Amount financed', value: currency(principal) },
          { label: 'Sales tax', value: currency(taxAmt) },
          { label: 'Total interest', value: currency(interest), tone: 'warning' },
          { label: 'Total cost', value: currency(m * n + upfront) },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Total cost breakdown',
            format: 'currency',
            slices: [
              { label: 'Amount financed', value: principal, color: '#0070f3' },
              { label: 'Interest', value: interest, color: '#f5a623' },
              ...(upfront > 0 ? [{ label: 'Down + trade-in', value: upfront, color: '#7928ca' }] : []),
            ],
          },
        ],
      };
    },
    howto: ['Enter the vehicle price and your down payment.', 'Add any trade-in value and local sales tax rate.', 'Set the interest rate and term in months.'],
    faq: [
      { q: 'Is sales tax financed?', a: 'In most US states sales tax is calculated on the price and can be rolled into the loan. This calculator adds tax to the financed amount.' },
      { q: 'What loan term should I choose?', a: 'Shorter terms mean higher payments but far less interest. Terms beyond 60 months lower the payment but you risk owing more than the car is worth.' },
    ],
    related: ['car-payment-calculator', 'loan-calculator', 'mortgage-calculator', 'sales-tax-calculator'],
  },

  /* ------------------------------------------------------------ Car Payment */
  {
    slug: 'car-payment-calculator',
    category: 'finance',
    title: 'Car Payment Calculator',
    description: 'Quickly find the monthly payment for a car loan from the amount, rate and term.',
    intro: 'A stripped-down car loan calculator: enter what you are financing, the rate and the number of months.',
    keywords: ['car payment calculator', 'monthly car payment'],
    inputs: [
      { name: 'amount', label: 'Amount financed', type: 'number', prefix: '$', default: 28000, min: 0, step: 500 },
      { name: 'rate', label: 'Interest rate', type: 'number', suffix: '%', default: 7.5, min: 0, max: 40, step: 0.01 },
      { name: 'term', label: 'Loan term', type: 'number', suffix: 'months', default: 60, min: 1, max: 120, step: 1 },
    ],
    compute: (v) => {
      const p = num(v.amount, 0);
      const r = num(v.rate, 0) / 100 / 12;
      const n = num(v.term, 0);
      if (p <= 0 || n <= 0) return { results: [], error: 'Enter an amount and term greater than zero.' };
      const m = pmt(r, n, p);
      return {
        results: [
          { label: 'Monthly payment', value: currency(m), primary: true },
          { label: 'Total interest', value: currency(m * n - p), tone: 'warning' },
          { label: 'Total paid', value: currency(m * n) },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Principal vs interest',
            format: 'currency',
            slices: [
              { label: 'Principal', value: p, color: '#0070f3' },
              { label: 'Interest', value: m * n - p, color: '#f5a623' },
            ],
          },
        ],
      };
    },
    faq: [
      { q: 'How is this different from the auto loan calculator?', a: 'The auto loan calculator also handles down payment, trade-in and sales tax. Use this one when you already know the exact amount you are financing.' },
    ],
    related: ['auto-loan-calculator', 'loan-calculator', 'mortgage-calculator'],
  },

  /* -------------------------------------------------------------- Investment */
  {
    slug: 'investment-calculator',
    category: 'finance',
    title: 'Investment Calculator',
    description: 'Project the future value of an investment with regular contributions and compound growth.',
    intro: 'See how an initial investment plus monthly contributions can grow over time at an expected annual return. It also works as an SIP calculator for regular monthly investing.',
    keywords: ['investment calculator', 'sip calculator', 'future value', 'portfolio growth', 'monthly investment'],
    popular: true,
    inputs: [
      { name: 'initial', label: 'Initial investment', type: 'number', prefix: '$', default: 10000, min: 0, step: 500 },
      { name: 'monthly', label: 'Monthly contribution', type: 'number', prefix: '$', default: 500, min: 0, step: 50 },
      { name: 'rate', label: 'Annual return', type: 'number', suffix: '%', default: 8, min: -50, max: 100, step: 0.1 },
      { name: 'years', label: 'Years', type: 'number', suffix: 'yrs', default: 20, min: 1, max: 80, step: 1 },
    ],
    compute: (v) => {
      const pv = num(v.initial, 0);
      const c = num(v.monthly, 0);
      const r = num(v.rate, 0) / 100 / 12;
      const n = Math.min(num(v.years, 0), 100) * 12; // cap horizon so the growth loop stays bounded
      if (n <= 0) return { results: [], error: 'Enter a number of years greater than zero.' };
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

      return {
        results: [
          { label: 'Future value', value: currency(fv), primary: true },
          { label: 'Total contributed', value: currency(contributed) },
          { label: 'Interest earned', value: currency(fv - contributed), tone: 'success' },
        ],
        breakdown: [
          { label: 'Growth multiple', value: `${number(contributed ? fv / contributed : 0, 2)}×` },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Contributions vs growth',
            format: 'currency',
            slices: [
              { label: 'Contributed', value: contributed, color: '#0070f3' },
              { label: 'Growth', value: Math.max(fv - contributed, 0), color: '#50e3c2' },
            ],
          },
          {
            type: 'line',
            title: 'Projected growth',
            format: 'currency',
            labels: yearLabels,
            series: [
              { label: 'Balance', points: balancePts, color: '#0070f3' },
              { label: 'Contributed', points: contribPts, color: '#7928ca' },
            ],
          },
        ],
      };
    },
    formulaItems: [
      { name: 'Future value', expr: 'FV = P(1+r)^n + C · ((1+r)^n − 1) / r', desc: 'P = initial, C = periodic contribution, r = periodic rate, n = periods.' },
    ],
    howto: ['Enter your starting balance and monthly contribution.', 'Set an expected annual return and time horizon.'],
    faq: [
      { q: 'What return should I assume?', a: 'Historically a diversified stock portfolio has averaged roughly 7%–10% before inflation. Use a conservative figure and remember past performance does not guarantee future results.' },
      { q: 'Does this account for inflation?', a: 'No. To see purchasing power in today\'s dollars, subtract expected inflation (around 2%–3%) from your return rate.' },
    ],
    related: ['sip-calculator', 'compound-interest-calculator', 'savings-calculator', 'retirement-calculator'],
  },

  /* -------------------------------------------------------------------- SIP */
  {
    slug: 'sip-calculator',
    category: 'finance',
    title: 'SIP Calculator',
    description:
      'Calculate the maturity value and estimated returns of a monthly SIP or a one-time lumpsum investment, with an optional annual step-up.',
    intro:
      'A Systematic Investment Plan (SIP) invests a fixed amount every month so you benefit from compounding and rupee-cost averaging. Switch to Lumpsum for a one-time investment, or turn on an annual step-up to grow your monthly amount each year.',
    keywords: [
      'sip calculator',
      'sip return calculator',
      'lumpsum calculator',
      'step up sip calculator',
      'mutual fund calculator',
      'systematic investment plan',
      'monthly investment calculator',
    ],
    popular: true,
    visual: 'sip',
    inputs: [
      {
        name: 'mode', label: 'Investment type', type: 'radio', default: 'sip',
        options: [
          { label: 'SIP (monthly)', value: 'sip' },
          { label: 'Lumpsum', value: 'lumpsum' },
        ],
      },
      { name: 'amount', label: 'Investment amount', type: 'number', prefix: '$', default: 25000, min: 0, step: 500 },
      { name: 'rate', label: 'Expected return rate (p.a)', type: 'number', suffix: '%', default: 12, min: 0, max: 40, step: 0.1 },
      { name: 'years', label: 'Time period', type: 'number', suffix: 'yrs', default: 10, min: 1, max: 40, step: 1 },
      { name: 'stepup', label: 'Annual step-up', type: 'number', suffix: '%', default: 0, min: 0, max: 25, step: 1, help: 'SIP only. Raises your monthly amount by this % after every year.' },
    ],
    compute: (v) => {
      const mode = v.mode === 'lumpsum' ? 'lumpsum' : 'sip';
      const amount = num(v.amount, 0);
      const rate = num(v.rate, 0);
      const years = Math.min(Math.round(num(v.years, 0)), 100);
      const stepUp = mode === 'sip' ? Math.max(num(v.stepup, 0), 0) : 0;
      if (amount <= 0 || years <= 0) return { results: [], error: 'Enter an investment amount and a time period greater than zero.' };

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
      const amountLabel = mode === 'lumpsum' ? 'Total investment' : 'Monthly investment';

      return {
        results: [
          { label: 'Total value', value: currency(total, { decimals: 0 }), primary: true, hint: mode === 'lumpsum' ? 'One-time investment' : 'At the end of the plan' },
          { label: 'Invested amount', value: currency(invested, { decimals: 0 }) },
          { label: 'Est. returns', value: currency(gains, { decimals: 0 }), tone: 'success' },
        ],
        breakdown: [
          { label: amountLabel, value: currency(amount, { decimals: 0 }) },
          { label: 'Wealth gain multiple', value: `${number(invested ? total / invested : 0, 2)}×` },
          ...(mode === 'sip' && stepUp > 0 ? [{ label: 'Annual step-up', value: `${number(stepUp, 0)}%` }] : []),
        ],
        charts: [
          {
            type: 'pie',
            title: 'Invested vs estimated returns',
            format: 'currency',
            slices: [
              { label: 'Invested amount', value: invested, color: '#0070f3' },
              { label: 'Est. returns', value: gains, color: '#50e3c2' },
            ],
          },
          ...(valuePts.length > 2
            ? [{
                type: 'line' as const,
                title: 'Projected growth',
                format: 'currency' as const,
                labels: yearLabels,
                series: [
                  { label: 'Total value', points: valuePts, color: '#0070f3' },
                  { label: 'Invested', points: investedPts, color: '#7928ca' },
                ],
              }]
            : []),
        ],
      };
    },
    article: [
      {
        heading: 'What is a SIP calculator?',
        body: [
          'A Systematic Investment Plan (SIP) is a way of investing a fixed amount into mutual funds at regular intervals — usually every month, though weekly and quarterly options also exist. It is one of two common ways to invest in mutual funds, the other being a one-time lumpsum.',
          'A SIP calculator is a simple online tool that estimates the maturity value and returns of your monthly investments. You enter how much you invest each month, the number of years you stay invested, and an expected annual rate of return, and it projects the corpus you could build.',
          'The figures are estimates. Actual mutual fund returns vary with market conditions, and the calculator does not account for exit loads or a scheme\'s expense ratio.',
        ],
      },
      {
        heading: 'How can a SIP return calculator help you?',
        body: [
          'Investing through a SIP encourages financial discipline and a regular savings habit, and it spreads your entry across market highs and lows (rupee-cost averaging). A calculator makes planning easier by showing what those regular investments could grow into.',
          'In particular, it helps you decide how much to invest each month, tracks the total you will have contributed over the tenure, and gives an estimate of the returns and final value — in seconds and without manual maths.',
        ],
      },
      {
        heading: 'How does this SIP calculator work?',
        body: [
          'The maturity value of a SIP is calculated with the standard future-value-of-an-annuity formula:',
          '<strong>M = P × ((1 + i)<sup>n</sup> − 1) / i) × (1 + i)</strong>',
          'where <strong>M</strong> is the maturity amount, <strong>P</strong> is the amount invested each month, <strong>n</strong> is the number of instalments, and <strong>i</strong> is the periodic (monthly) rate of return.',
          'The important detail is how <strong>i</strong> is derived. A common mistake is to divide the annual return by 12 — treating a 12% annual return as 1% a month. Because returns compound, that overstates the result: 1% compounded for 12 months works out to more than 12% a year.',
          'The correct approach is to convert the annual return into an effective monthly return using <code>i = (1 + annual return)<sup>1/12</sup> − 1</code>. For a 12% annual return this comes to about 0.95% a month, not 1%, because compounding 0.95% over 12 months returns exactly 12%.',
          'For example, investing ₹1,000 a month for 12 months at 12% a year uses i ≈ 0.0095, giving M = 1,000 × ((1.0095<sup>12</sup> − 1) / 0.0095) × 1.0095 ≈ <strong>₹12,766</strong>. This calculator uses that effective monthly rate, so its maturity values line up with leading SIP tools.',
          'Remember that the return rate is only an assumption. Real returns rise and fall with the market, so treat the output as a projection rather than a guarantee.',
        ],
      },
      {
        heading: 'Advantages of this SIP calculator',
        body: [
          'You can plan investments around any amount and tenure, see an estimate of your total corpus at the end of the SIP, and switch to lumpsum mode for one-time investments. An optional annual step-up lets you raise your monthly amount each year to keep pace with a rising income, giving a realistic picture of a growing SIP.',
        ],
      },
    ],
    formulaIntro: 'A SIP is a series of monthly investments, while a lumpsum is a single deposit that compounds over time. The monthly rate is the effective rate that compounds to the stated annual return.',
    formulaItems: [
      { name: 'SIP maturity value', expr: 'M = P × ((1 + i)^n − 1) / i × (1 + i)', desc: 'P = monthly investment, i = effective monthly rate, n = number of instalments.' },
      { name: 'Effective monthly rate', expr: 'i = (1 + r)^(1/12) − 1', desc: 'r = expected annual return. Compounding i over 12 months reproduces r exactly, so 12% a year ≈ 0.95% a month.' },
      { name: 'Lumpsum future value', expr: 'FV = P × (1 + r)^t', desc: 'P = amount invested, r = annual rate, t = years.' },
      { name: 'Step-up SIP', expr: 'Monthly amount ×= (1 + g) each year', desc: 'g = annual step-up %, applied after every 12 instalments.' },
    ],
    howto: [
      'Choose SIP for a monthly investment or Lumpsum for a one-time deposit.',
      'Set the amount, your expected annual return and the time period.',
      'Optionally enable an annual step-up to grow your SIP each year.',
      'Read the invested amount, estimated returns and total value below.',
    ],
    examples: [
      { title: '₹25,000/month SIP at 12% for 10 years', body: 'Investing ₹25,000 every month for 10 years at a 12% expected annual return puts in ₹30,00,000 and grows to about ₹56,00,900 — roughly ₹26,00,900 of estimated returns.' },
      { title: 'Lumpsum ₹25,000 at 12% for 10 years', body: 'A single ₹25,000 investment compounding at 12% a year becomes about ₹77,646 after 10 years.' },
    ],
    faq: [
      { q: 'What is the difference between SIP and lumpsum?', a: 'A SIP invests a fixed amount every month, which spreads your entry across market highs and lows (rupee-cost averaging). A lumpsum invests the full amount once, so its return depends heavily on the single entry point.' },
      { q: 'Are SIPs the same as mutual funds?', a: 'No. A mutual fund is the investment; a SIP is just one method of putting money into it. The alternative is a one-time lumpsum. So you invest in a mutual fund either through a SIP or as a lumpsum.' },
      { q: 'How much can I invest in a SIP?', a: 'There is no upper limit. Many funds let you start with as little as ₹100 or ₹500 a month, and you can invest as much as you like above that.' },
      { q: 'What is the maximum tenure of a SIP?', a: 'There is no maximum — you can keep a SIP running for as long as you want. The minimum is usually around six months, and many investors continue for decades to benefit from long-term compounding.' },
      { q: 'Can I modify my SIP amount?', a: 'You cannot change the amount of an existing SIP directly, but you can start an additional SIP in the same fund or use a step-up SIP to raise the amount automatically each year.' },
      { q: 'Can I pause my SIP?', a: 'Most fund houses let you pause a SIP for a set period (often one to three months) instead of stopping it, and resume afterwards without starting a new plan.' },
      { q: 'Do SIPs allow only equity mutual funds?', a: 'No. You can run a SIP in equity, debt, hybrid or other categories of mutual funds. Equity SIPs suit long-term goals, while debt SIPs suit shorter horizons.' },
      { q: 'What is a step-up SIP?', a: 'A step-up (or top-up) SIP increases your monthly contribution by a set percentage each year — for example 10% — so your investing keeps pace with a rising income and builds a noticeably larger corpus.' },
      { q: 'What return rate should I assume?', a: 'Equity mutual funds have historically returned roughly 10%–12% a year over long periods, while debt funds are lower. These are estimates, not guarantees — actual returns vary with the market.' },
      { q: 'Are the returns guaranteed?', a: 'No. This calculator assumes a constant annual return for illustration. Real mutual fund returns fluctuate and can be negative in some years, so treat the result as a projection.' },
    ],
    related: ['investment-calculator', 'compound-interest-calculator', 'retirement-calculator', 'savings-calculator'],
  },

  /* --------------------------------------------------- Compound Interest */
  {
    slug: 'compound-interest-calculator',
    category: 'finance',
    title: 'Compound Interest Calculator',
    description: 'Calculate compound interest with any compounding frequency and optional regular deposits.',
    intro: 'Compound interest earns interest on your interest. Choose how often it compounds to see the effect.',
    keywords: ['compound interest calculator', 'interest on interest', 'compounding'],
    popular: true,
    inputs: [
      { name: 'principal', label: 'Principal', type: 'number', prefix: '$', default: 5000, min: 0, step: 100 },
      { name: 'rate', label: 'Annual interest rate', type: 'number', suffix: '%', default: 5, min: 0, max: 100, step: 0.01 },
      { name: 'years', label: 'Years', type: 'number', suffix: 'yrs', default: 10, min: 0.1, max: 80, step: 0.5 },
      {
        name: 'freq', label: 'Compound frequency', type: 'select', default: '12',
        options: [
          { label: 'Annually', value: '1' },
          { label: 'Semi-annually', value: '2' },
          { label: 'Quarterly', value: '4' },
          { label: 'Monthly', value: '12' },
          { label: 'Daily', value: '365' },
        ],
      },
      { name: 'deposit', label: 'Added each period', type: 'number', prefix: '$', default: 0, min: 0, step: 50 },
    ],
    compute: (v) => {
      const p = num(v.principal, 0);
      const rate = num(v.rate, 0) / 100;
      // Cap years and compounds/year so the nested sampling loop stays bounded.
      const t = Math.min(num(v.years, 0), 100);
      const k = Math.min(num(v.freq, 12), 365);
      const c = num(v.deposit, 0);
      if (t <= 0 || k <= 0) return { results: [], error: 'Enter a positive time period.' };
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

      return {
        results: [
          { label: 'Future balance', value: currency(fv), primary: true },
          { label: 'Total deposited', value: currency(contributed) },
          { label: 'Interest earned', value: currency(fv - contributed), tone: 'success' },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Deposits vs interest',
            format: 'currency',
            slices: [
              { label: 'Deposited', value: contributed, color: '#0070f3' },
              { label: 'Interest', value: Math.max(fv - contributed, 0), color: '#50e3c2' },
            ],
          },
          ...(balancePts.length > 2
            ? [{
                type: 'line' as const,
                title: 'Balance growth',
                format: 'currency' as const,
                labels: yearLabels,
                series: [
                  { label: 'Balance', points: balancePts, color: '#0070f3' },
                  { label: 'Deposited', points: depositPts, color: '#7928ca' },
                ],
              }]
            : []),
        ],
      };
    },
    formulaItems: [
      { name: 'Compound growth', expr: 'A = P(1 + r/k)^(k·t)', desc: 'k = compounds per year, t = years.' },
    ],
    faq: [
      { q: 'Does compounding frequency matter much?', a: 'It helps, but with diminishing returns. Moving from annual to monthly compounding makes a noticeable difference; monthly to daily is tiny.' },
      { q: 'What is APY?', a: 'Annual Percentage Yield is the effective yearly rate after compounding: APY = (1 + r/k)^k − 1.' },
    ],
    related: ['investment-calculator', 'sip-calculator', 'savings-calculator', 'retirement-calculator'],
  },

  /* ----------------------------------------------------------------- Savings */
  {
    slug: 'savings-calculator',
    category: 'finance',
    title: 'Savings Calculator',
    description: 'See how your savings grow with regular monthly deposits and interest.',
    intro: 'Plan toward a savings goal by combining a starting balance with steady monthly deposits.',
    keywords: ['savings calculator', 'savings goal', 'monthly savings'],
    inputs: [
      { name: 'initial', label: 'Starting balance', type: 'number', prefix: '$', default: 1000, min: 0, step: 100 },
      { name: 'monthly', label: 'Monthly deposit', type: 'number', prefix: '$', default: 300, min: 0, step: 25 },
      { name: 'rate', label: 'Annual interest rate', type: 'number', suffix: '%', default: 4, min: 0, max: 50, step: 0.01 },
      { name: 'years', label: 'Years', type: 'number', suffix: 'yrs', default: 5, min: 0.1, max: 60, step: 0.5 },
    ],
    compute: (v) => {
      const pv = num(v.initial, 0);
      const c = num(v.monthly, 0);
      const r = num(v.rate, 0) / 100 / 12;
      const n = Math.min(num(v.years, 0), 100) * 12; // cap horizon so the growth loop stays bounded
      if (n <= 0) return { results: [], error: 'Enter a positive number of years.' };
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

      return {
        results: [
          { label: 'Final balance', value: currency(fv), primary: true },
          { label: 'Total deposited', value: currency(contributed) },
          { label: 'Interest earned', value: currency(fv - contributed), tone: 'success' },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Deposits vs interest',
            format: 'currency',
            slices: [
              { label: 'Deposited', value: contributed, color: '#0070f3' },
              { label: 'Interest', value: Math.max(fv - contributed, 0), color: '#50e3c2' },
            ],
          },
          ...(balancePts.length > 2
            ? [{
                type: 'line' as const,
                title: 'Savings growth',
                format: 'currency' as const,
                labels: yearLabels,
                series: [
                  { label: 'Balance', points: balancePts, color: '#0070f3' },
                  { label: 'Deposited', points: depositPts, color: '#7928ca' },
                ],
              }]
            : []),
        ],
      };
    },
    faq: [
      { q: 'What rate do savings accounts pay?', a: 'High-yield savings accounts often track short-term rates. Check current rates from your bank, as they change with the wider economy.' },
    ],
    related: ['compound-interest-calculator', 'investment-calculator', 'retirement-calculator'],
  },

  /* --------------------------------------------------------------------- APR */
  {
    slug: 'apr-calculator',
    category: 'finance',
    title: 'APR Calculator',
    description: 'Find the true annual percentage rate of a loan once fees are included.',
    intro: 'APR reflects the real yearly cost of borrowing by folding upfront fees into the interest rate.',
    keywords: ['apr calculator', 'annual percentage rate', 'true cost of loan'],
    inputs: [
      { name: 'amount', label: 'Loan amount', type: 'number', prefix: '$', default: 20000, min: 0, step: 500 },
      { name: 'fees', label: 'Upfront fees', type: 'number', prefix: '$', default: 600, min: 0, step: 50 },
      { name: 'rate', label: 'Interest rate', type: 'number', suffix: '%', default: 6, min: 0, max: 60, step: 0.01 },
      { name: 'term', label: 'Loan term', type: 'number', suffix: 'yrs', default: 5, min: 0.1, max: 40, step: 0.5 },
    ],
    compute: (v) => {
      const amount = num(v.amount, 0);
      const fees = num(v.fees, 0);
      const r = num(v.rate, 0) / 100 / 12;
      const n = num(v.term, 0) * 12;
      if (amount <= 0 || n <= 0) return { results: [], error: 'Enter a loan amount and term greater than zero.' };
      const payment = pmt(r, n, amount);
      const net = amount - fees; // borrower actually receives this
      const monthlyApr = solveRate(n, payment, net);
      const apr = monthlyApr * 12 * 100;
      const totalInterest = payment * n - amount;
      return {
        results: [
          { label: 'APR', value: percent(apr, 3), primary: true },
          { label: 'Monthly payment', value: currency(payment) },
          { label: 'Nominal rate', value: percent(num(v.rate, 0), 2) },
          { label: 'Total fees', value: currency(fees) },
        ],
        charts: [
          {
            type: 'pie',
            title: 'What the loan really costs',
            format: 'currency',
            slices: [
              { label: 'Amount borrowed', value: amount, color: '#0070f3' },
              { label: 'Interest', value: Math.max(totalInterest, 0), color: '#f5a623' },
              ...(fees > 0 ? [{ label: 'Fees', value: fees, color: '#ff0080' }] : []),
            ],
          },
        ],
      };
    },
    formulaItems: [
      { name: 'APR', expr: 'Solve for i: (Amount − Fees) = M · (1 − (1+i)^−n) / i', desc: 'APR = 12 · i, where M is the payment based on the note rate.' },
    ],
    faq: [
      { q: 'Why is APR higher than the interest rate?', a: 'Because fees reduce the money you actually receive while your payments stay the same, the effective cost — the APR — is higher than the quoted rate.' },
      { q: 'Should I compare loans by APR?', a: 'APR is the best single number for comparing similar loans, but it assumes you keep the loan for the full term.' },
    ],
    related: ['loan-calculator', 'mortgage-calculator', 'interest-calculator'],
  },

  /* ---------------------------------------------------------------- Interest */
  {
    slug: 'interest-calculator',
    category: 'finance',
    title: 'Interest Calculator',
    description: 'Calculate simple or compound interest earned or owed over time.',
    intro: 'Switch between simple and compound interest to see how much a balance grows.',
    keywords: ['interest calculator', 'simple interest', 'compound interest'],
    inputs: [
      { name: 'principal', label: 'Principal', type: 'number', prefix: '$', default: 10000, min: 0, step: 100 },
      { name: 'rate', label: 'Annual interest rate', type: 'number', suffix: '%', default: 5, min: 0, max: 100, step: 0.01 },
      { name: 'years', label: 'Time', type: 'number', suffix: 'yrs', default: 3, min: 0.1, max: 80, step: 0.5 },
      {
        name: 'type', label: 'Interest type', type: 'radio', default: 'compound',
        options: [
          { label: 'Compound', value: 'compound' },
          { label: 'Simple', value: 'simple' },
        ],
      },
    ],
    compute: (v) => {
      const p = num(v.principal, 0);
      const rate = num(v.rate, 0) / 100;
      const t = num(v.years, 0);
      if (t <= 0) return { results: [], error: 'Enter a positive time period.' };
      let interest: number;
      if (v.type === 'simple') interest = p * rate * t;
      else interest = p * (Math.pow(1 + rate, t) - 1);
      return {
        results: [
          { label: 'Interest', value: currency(interest), primary: true },
          { label: 'Final balance', value: currency(p + interest) },
          { label: 'Principal', value: currency(p) },
        ],
        charts: p > 0
          ? [{
              type: 'pie',
              title: 'Principal vs interest',
              format: 'currency',
              slices: [
                { label: 'Principal', value: p, color: '#0070f3' },
                { label: 'Interest', value: Math.max(interest, 0), color: '#50e3c2' },
              ],
            }]
          : undefined,
      };
    },
    formulaItems: [
      { name: 'Simple interest', expr: 'I = P · r · t' },
      { name: 'Compound interest', expr: 'I = P · ((1 + r)^t − 1)' },
    ],
    faq: [
      { q: 'Simple vs compound — what is the difference?', a: 'Simple interest is charged only on the original principal. Compound interest is charged on the principal plus previously accumulated interest, so it grows faster.' },
    ],
    related: ['compound-interest-calculator', 'investment-calculator', 'savings-calculator', 'loan-calculator'],
  },

  /* -------------------------------------------------------------- Retirement */
  {
    slug: 'retirement-calculator',
    category: 'finance',
    title: 'Retirement Calculator',
    description: 'Estimate how much your retirement savings could grow by the time you retire.',
    intro: 'Combine your current savings with ongoing monthly contributions to project your nest egg at retirement.',
    keywords: ['retirement calculator', 'retirement savings', '401k growth'],
    inputs: [
      { name: 'age', label: 'Current age', type: 'number', suffix: 'yrs', default: 30, min: 0, max: 100, step: 1 },
      { name: 'retireAge', label: 'Retirement age', type: 'number', suffix: 'yrs', default: 65, min: 1, max: 100, step: 1 },
      { name: 'current', label: 'Current savings', type: 'number', prefix: '$', default: 25000, min: 0, step: 1000 },
      { name: 'monthly', label: 'Monthly contribution', type: 'number', prefix: '$', default: 600, min: 0, step: 50 },
      { name: 'rate', label: 'Annual return', type: 'number', suffix: '%', default: 7, min: -20, max: 60, step: 0.1 },
    ],
    compute: (v) => {
      const age = num(v.age, 0);
      const retire = num(v.retireAge, 0);
      const years = Math.min(retire - age, 120); // cap span so the projection loop stays bounded
      if (years <= 0) return { results: [], error: 'Retirement age must be greater than your current age.' };
      const pv = num(v.current, 0);
      const c = num(v.monthly, 0);
      const r = num(v.rate, 0) / 100 / 12;
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

      return {
        results: [
          { label: 'Balance at retirement', value: currency(fv), primary: true, hint: `In ${number(years, 0)} years` },
          { label: 'Total contributed', value: currency(contributed) },
          { label: 'Investment growth', value: currency(fv - contributed), tone: 'success' },
          { label: 'Est. monthly income (4% rule)', value: currency((fv * 0.04) / 12) },
        ],
        charts: [
          {
            type: 'pie',
            title: 'Contributions vs growth',
            format: 'currency',
            slices: [
              { label: 'Contributed', value: contributed, color: '#0070f3' },
              { label: 'Growth', value: Math.max(fv - contributed, 0), color: '#50e3c2' },
            ],
          },
          ...(balancePts.length > 2
            ? [{
                type: 'line' as const,
                title: 'Nest egg growth by age',
                format: 'currency' as const,
                labels: ageLabels,
                series: [
                  { label: 'Balance', points: balancePts, color: '#0070f3' },
                  { label: 'Contributed', points: contribPts, color: '#7928ca' },
                ],
              }]
            : []),
        ],
      };
    },
    faq: [
      { q: 'What is the 4% rule?', a: 'A common guideline suggesting you can withdraw about 4% of your retirement balance in the first year, then adjust for inflation, with a good chance the money lasts 30 years.' },
      { q: 'Is this adjusted for inflation?', a: 'No. Consider using a real return (nominal return minus inflation) if you want the result in today\'s purchasing power.' },
    ],
    related: ['investment-calculator', 'sip-calculator', 'compound-interest-calculator', 'savings-calculator'],
  },
  /* ---------------------------------------------------------------- FD */
  {
    slug: 'fd-calculator',
    category: 'finance',
    title: 'FD Calculator',
    description: 'Calculate your fixed deposit (FD) maturity amount, interest earned, and growth over time.',
    keywords: ['fd calculator', 'fixed deposit calculator', 'fd interest calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- RD */
  {
    slug: 'rd-calculator',
    category: 'finance',
    title: 'RD Calculator',
    description: 'Calculate recurring deposit (RD) maturity value, total invested amount, and interest earned.',
    keywords: ['rd calculator', 'recurring deposit calculator', 'rd interest calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- SWP */
  {
    slug: 'swp-calculator',
    category: 'finance',
    title: 'SWP Calculator',
    description: 'Calculate monthly income, remaining portfolio balance, and total returns from an SWP.',
    keywords: ['swp calculator', 'systematic withdrawal plan calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- PPF */
  {
    slug: 'ppf-calculator',
    category: 'finance',
    title: 'PPF Calculator',
    description: 'Calculate Public Provident Fund (PPF) maturity value and tax-free interest compounding.',
    keywords: ['ppf calculator', 'public provident fund calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- NPS */
  {
    slug: 'nps-calculator',
    category: 'finance',
    title: 'NPS Calculator',
    description: 'Calculate National Pension System (NPS) retirement corpus, 60% lump sum, and monthly pension.',
    keywords: ['nps calculator', 'national pension system calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Mutual Fund */
  {
    slug: 'mutual-fund-calculator',
    category: 'finance',
    title: 'Mutual Fund Calculator',
    description: 'Calculate expected returns and portfolio value for monthly SIP or lump sum mutual fund investments.',
    keywords: ['mutual fund calculator', 'mutual fund return calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Lumpsum */
  {
    slug: 'lumpsum-calculator',
    category: 'finance',
    title: 'Lumpsum Calculator',
    description: 'Calculate maturity value, total capital growth, and compound interest for lump sum investments.',
    keywords: ['lumpsum calculator', 'lump sum investment calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Simple Interest */
  {
    slug: 'simple-interest-calculator',
    category: 'finance',
    title: 'Simple Interest Calculator',
    description: 'Calculate simple interest earned, principal amount, and total accumulated balance.',
    keywords: ['simple interest calculator', 'simple interest formula calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Credit Card Payoff */
  {
    slug: 'credit-card-payoff-calculator',
    category: 'finance',
    title: 'Credit Card Payoff Calculator',
    description: 'Calculate months required to pay off credit card balance, total interest cost, and optimal monthly payments.',
    keywords: ['credit card payoff calculator', 'credit card interest calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Debt Payoff */
  {
    slug: 'debt-payoff-calculator',
    category: 'finance',
    title: 'Debt Payoff Calculator',
    description: 'Calculate how extra monthly payments reduce debt payoff time, save interest, and accelerate debt freedom.',
    keywords: ['debt payoff calculator', 'debt free calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Personal Loan */
  {
    slug: 'personal-loan-calculator',
    category: 'finance',
    title: 'Personal Loan Calculator',
    description: 'Calculate monthly EMI payments, origination fees, interest costs, and total repayment for personal loans.',
    keywords: ['personal loan calculator', 'personal loan emi calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Lease */
  {
    slug: 'lease-calculator',
    category: 'finance',
    title: 'Lease Calculator',
    description: 'Calculate monthly auto lease payments, depreciation charges, finance money factor fees, and total lease expenses.',
    keywords: ['lease calculator', 'auto lease calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Down Payment */
  {
    slug: 'down-payment-calculator',
    category: 'finance',
    title: 'Down Payment Calculator',
    description: 'Calculate house down payment target amount, remaining savings needed, and months to reach your goal.',
    keywords: ['down payment calculator', 'house down payment calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Amortization */
  {
    slug: 'amortization-calculator',
    category: 'finance',
    title: 'Amortization Calculator',
    description: 'Calculate loan monthly payments, annual principal vs interest split, and complete amortization schedules.',
    keywords: ['amortization calculator', 'loan amortization calculator'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
  /* ---------------------------------------------------------------- Net Worth */
  {
    slug: 'net-worth-calculator',
    category: 'finance',
    title: 'Net Worth Calculator',
    description: 'Calculate your personal net worth by subtracting total liabilities (debts) from total assets (wealth).',
    keywords: ['net worth calculator', 'calculate net worth'],
    inputs: [],
    compute: () => ({ results: [] }),
    faq: [],
  },
];
