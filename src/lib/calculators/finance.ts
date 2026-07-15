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
      const n = num(v.term, 0) * 12;
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
    intro: 'Works for personal loans, student loans and any fixed-rate installment loan. Enter the amount, rate and term.',
    keywords: ['loan calculator', 'personal loan', 'monthly payment', 'installment loan'],
    popular: true,
    inputs: [
      { name: 'amount', label: 'Loan amount', type: 'number', prefix: '$', default: 25000, min: 0, step: 500 },
      { name: 'rate', label: 'Interest rate', type: 'number', suffix: '%', default: 9, min: 0, max: 60, step: 0.01 },
      { name: 'term', label: 'Loan term', type: 'number', suffix: 'yrs', default: 5, min: 0.1, max: 40, step: 0.5 },
    ],
    compute: (v) => {
      const p = num(v.amount, 0);
      const r = num(v.rate, 0) / 100 / 12;
      const n = num(v.term, 0) * 12;
      if (p <= 0 || n <= 0) return { results: [], error: 'Enter a loan amount and term greater than zero.' };
      const m = pmt(r, n, p);
      const total = m * n;
      return {
        results: [
          { label: 'Monthly payment', value: currency(m), primary: true },
          { label: 'Total interest', value: currency(total - p), tone: 'warning' },
          { label: 'Total paid', value: currency(total) },
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
      return {
        results: [
          { label: 'Monthly payment', value: currency(m), primary: true },
          { label: 'Amount financed', value: currency(principal) },
          { label: 'Sales tax', value: currency(taxAmt) },
          { label: 'Total interest', value: currency(m * n - principal), tone: 'warning' },
          { label: 'Total cost', value: currency(m * n + down + trade) },
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
    intro: 'See how an initial investment plus monthly contributions can grow over time at an expected annual return.',
    keywords: ['investment calculator', 'future value', 'portfolio growth'],
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
      const n = num(v.years, 0) * 12;
      if (n <= 0) return { results: [], error: 'Enter a number of years greater than zero.' };
      const fv = futureValue(r, n, c, pv);
      const contributed = pv + c * n;
      return {
        results: [
          { label: 'Future value', value: currency(fv), primary: true },
          { label: 'Total contributed', value: currency(contributed) },
          { label: 'Interest earned', value: currency(fv - contributed), tone: 'success' },
        ],
        breakdown: [
          { label: 'Growth multiple', value: `${number(contributed ? fv / contributed : 0, 2)}×` },
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
    related: ['compound-interest-calculator', 'savings-calculator', 'retirement-calculator', 'interest-calculator'],
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
      const t = num(v.years, 0);
      const k = num(v.freq, 12);
      const c = num(v.deposit, 0);
      if (t <= 0 || k <= 0) return { results: [], error: 'Enter a positive time period.' };
      const r = rate / k;
      const n = k * t;
      const fv = futureValue(r, n, c, p);
      const contributed = p + c * n;
      return {
        results: [
          { label: 'Future balance', value: currency(fv), primary: true },
          { label: 'Total deposited', value: currency(contributed) },
          { label: 'Interest earned', value: currency(fv - contributed), tone: 'success' },
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
    related: ['investment-calculator', 'savings-calculator', 'interest-calculator', 'retirement-calculator'],
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
      const n = num(v.years, 0) * 12;
      if (n <= 0) return { results: [], error: 'Enter a positive number of years.' };
      const fv = futureValue(r, n, c, pv);
      const contributed = pv + c * n;
      return {
        results: [
          { label: 'Final balance', value: currency(fv), primary: true },
          { label: 'Total deposited', value: currency(contributed) },
          { label: 'Interest earned', value: currency(fv - contributed), tone: 'success' },
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
      return {
        results: [
          { label: 'APR', value: percent(apr, 3), primary: true },
          { label: 'Monthly payment', value: currency(payment) },
          { label: 'Nominal rate', value: percent(num(v.rate, 0), 2) },
          { label: 'Total fees', value: currency(fees) },
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
      const years = retire - age;
      if (years <= 0) return { results: [], error: 'Retirement age must be greater than your current age.' };
      const pv = num(v.current, 0);
      const c = num(v.monthly, 0);
      const r = num(v.rate, 0) / 100 / 12;
      const n = years * 12;
      const fv = futureValue(r, n, c, pv);
      const contributed = pv + c * n;
      return {
        results: [
          { label: 'Balance at retirement', value: currency(fv), primary: true, hint: `In ${number(years, 0)} years` },
          { label: 'Total contributed', value: currency(contributed) },
          { label: 'Investment growth', value: currency(fv - contributed), tone: 'success' },
          { label: 'Est. monthly income (4% rule)', value: currency((fv * 0.04) / 12) },
        ],
      };
    },
    faq: [
      { q: 'What is the 4% rule?', a: 'A common guideline suggesting you can withdraw about 4% of your retirement balance in the first year, then adjust for inflation, with a good chance the money lasts 30 years.' },
      { q: 'Is this adjusted for inflation?', a: 'No. Consider using a real return (nominal return minus inflation) if you want the result in today\'s purchasing power.' },
    ],
    related: ['investment-calculator', 'compound-interest-calculator', 'savings-calculator'],
  },
];
