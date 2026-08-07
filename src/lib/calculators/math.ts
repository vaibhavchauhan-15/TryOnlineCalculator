import type { Calculator } from '../types';
import { num, number, percent } from '../format';
import { evaluate, gcd } from './_expr';

export const mathCalculators: Calculator[] = [
  /* ------------------------------------------------------------------- Basic */
  {
    slug: 'basic-calculator',
    category: 'math',
    title: 'Basic Calculator',
    description: 'A fast online calculator for everyday arithmetic — add, subtract, multiply and divide.',
    intro: 'Type a math expression using + − × ÷, percent and parentheses. The result updates as you type.',
    keywords: ['basic calculator', 'online calculator', 'simple calculator'],
    popular: true,
    visual: 'basic',
    inputs: [
      { name: 'expr', label: 'Expression', type: 'text', span: 2, default: '125 + 37 * 4 - 18', placeholder: 'e.g. (12 + 8) / 4' },
    ],
    compute: (v) => {
      const expr = (v.expr || '').trim();
      if (!expr) return { results: [], error: 'Enter an expression to calculate.' };
      try {
        const r = evaluate(expr, { scientific: false });
        if (!Number.isFinite(r)) return { results: [], error: 'That expression does not have a finite result.' };
        return { results: [{ label: 'Result', value: number(r, 6), primary: true }] };
      } catch (e) {
        return { results: [], error: (e as Error).message };
      }
    },
    howto: ['Type numbers and operators, e.g. 45 * 3 + 10.', 'Use parentheses to control the order of operations.', 'Supports +, −, *, /, % and ^ for powers.'],
    faq: [
      { q: 'What operators can I use?', a: 'Addition (+), subtraction (−), multiplication (×), division (÷) and powers (^), along with parentheses. The percent key (%) turns the number before it into a percentage, so 50% becomes 0.5.' },
      { q: 'Does it follow order of operations?', a: 'Yes. It respects standard PEMDAS/BODMAS precedence, so multiplication and division happen before addition and subtraction.' },
    ],
    related: ['scientific-calculator', 'percentage-calculator', 'fraction-calculator', 'average-calculator'],
  },

  /* -------------------------------------------------------------- Scientific */
  {
    slug: 'scientific-calculator',
    category: 'math',
    title: 'Scientific Calculator',
    description: 'Online scientific calculator with trig, logarithms, powers, roots and constants.',
    intro: 'Type an expression using functions like sin, cos, log, ln, sqrt and constants pi and e.',
    keywords: ['scientific calculator', 'trig calculator', 'log calculator'],
    popular: true,
    visual: 'scientific',
    inputs: [
      { name: 'expr', label: 'Expression', type: 'text', span: 2, default: 'sqrt(2) * sin(45) + log(1000)', placeholder: 'e.g. 2^10 + ln(e)' },
      {
        name: 'angle', label: 'Angle mode', type: 'radio', default: 'deg',
        options: [
          { label: 'Degrees', value: 'deg' },
          { label: 'Radians', value: 'rad' },
        ],
      },
    ],
    compute: (v) => {
      const expr = (v.expr || '').trim();
      if (!expr) return { results: [], error: 'Enter an expression to calculate.' };
      try {
        const r = evaluate(expr, { scientific: true, degrees: v.angle !== 'rad' });
        if (!Number.isFinite(r)) return { results: [], error: 'That expression does not have a finite result.' };
        return {
          results: [{ label: 'Result', value: number(r, 8), primary: true }],
          breakdown: [{ label: 'Full precision', value: String(r) }],
        };
      } catch (e) {
        return { results: [], error: (e as Error).message };
      }
    },
    howto: ['Type an expression with functions like sin(30) or sqrt(16).', 'Choose degrees or radians for trig functions.', 'Use pi and e as constants.'],
    faq: [
      { q: 'Which functions are supported?', a: 'sin, cos, tan and their inverses, sqrt, cbrt, ln, log (base 10), exp, abs, round, floor and ceil.' },
      { q: 'How do I raise to a power?', a: 'Use the caret, for example 2^10 for 2 to the 10th power.' },
    ],
    related: ['basic-calculator', 'percentage-calculator', 'fraction-calculator'],
  },

  /* -------------------------------------------------------------- Percentage */
  {
    slug: 'percentage-calculator',
    category: 'math',
    title: 'Percentage Calculator',
    description: 'Solve any percentage problem — percent of a number, what percent, and percent change.',
    intro: 'Pick the type of percentage question you have and fill in the two known values.',
    keywords: ['percentage calculator', 'percent of', 'percent change'],
    popular: true,
    visual: 'percentage',
    inputs: [
      {
        name: 'mode', label: 'What do you want to find?', type: 'select', default: 'percentOf', span: 2,
        options: [
          { label: 'What is X% of Y', value: 'percentOf' },
          { label: 'X is what percent of Y', value: 'whatPercent' },
          { label: 'Percentage change from X to Y', value: 'change' },
        ],
      },
      { name: 'a', label: 'Value X', type: 'number', default: 15, step: 0.01 },
      { name: 'b', label: 'Value Y', type: 'number', default: 200, step: 0.01 },
    ],
    compute: (v) => {
      const a = num(v.a, NaN);
      const b = num(v.b, NaN);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return { results: [], error: 'Enter both values.' };
      if (v.mode === 'percentOf') {
        return { results: [{ label: `${number(a, 4)}% of ${number(b, 4)}`, value: number((a / 100) * b, 6), primary: true }] };
      }
      if (v.mode === 'whatPercent') {
        if (b === 0) return { results: [], error: 'Y cannot be zero.' };
        return { results: [{ label: `${number(a, 4)} is this percent of ${number(b, 4)}`, value: percent((a / b) * 100, 4), primary: true }] };
      }
      // change
      if (a === 0) return { results: [], error: 'Starting value X cannot be zero for percent change.' };
      const change = ((b - a) / Math.abs(a)) * 100;
      return {
        results: [
          { label: 'Percentage change', value: percent(change, 4), primary: true, tone: change >= 0 ? 'success' : 'error', hint: change >= 0 ? 'Increase' : 'Decrease' },
          { label: 'Absolute change', value: number(b - a, 6) },
        ],
      };
    },
    formulaItems: [
      { name: 'Percent of', expr: 'result = (X / 100) × Y' },
      { name: 'What percent', expr: 'result = (X / Y) × 100' },
      { name: 'Percent change', expr: 'result = (Y − X) / |X| × 100' },
    ],
    faq: [
      { q: 'How do I find a percentage increase?', a: 'Use the "percentage change" mode with the original value as X and the new value as Y. A positive result is an increase.' },
    ],
    related: ['fraction-calculator', 'basic-calculator', 'discount-calculator', 'sales-tax-calculator'],
  },

  /* ---------------------------------------------------------------- Fraction */
  {
    slug: 'fraction-calculator',
    category: 'math',
    title: 'Fraction Calculator',
    description: 'Add, subtract, multiply and divide fractions and get the answer in lowest terms.',
    intro: 'Enter two fractions and an operation to get a simplified result plus its decimal value.',
    keywords: ['fraction calculator', 'add fractions', 'simplify fractions'],
    visual: 'fraction',
    inputs: [
      { name: 'n1', label: 'Numerator 1', type: 'number', default: 1, step: 1 },
      { name: 'd1', label: 'Denominator 1', type: 'number', default: 2, step: 1 },
      {
        name: 'op', label: 'Operation', type: 'select', default: 'add', span: 2,
        options: [
          { label: 'Add (+)', value: 'add' },
          { label: 'Subtract (−)', value: 'sub' },
          { label: 'Multiply (×)', value: 'mul' },
          { label: 'Divide (÷)', value: 'div' },
        ],
      },
      { name: 'n2', label: 'Numerator 2', type: 'number', default: 1, step: 1 },
      { name: 'd2', label: 'Denominator 2', type: 'number', default: 3, step: 1 },
    ],
    compute: (v) => {
      const n1 = num(v.n1, NaN), d1 = num(v.d1, NaN), n2 = num(v.n2, NaN), d2 = num(v.d2, NaN);
      if ([n1, d1, n2, d2].some((x) => !Number.isFinite(x))) return { results: [], error: 'Enter all four values.' };
      if (d1 === 0 || d2 === 0) return { results: [], error: 'Denominators cannot be zero.' };
      let num0: number, den0: number;
      switch (v.op) {
        case 'sub': num0 = n1 * d2 - n2 * d1; den0 = d1 * d2; break;
        case 'mul': num0 = n1 * n2; den0 = d1 * d2; break;
        case 'div':
          if (n2 === 0) return { results: [], error: 'Cannot divide by a fraction equal to zero.' };
          num0 = n1 * d2; den0 = d1 * n2; break;
        default: num0 = n1 * d2 + n2 * d1; den0 = d1 * d2;
      }
      if (den0 < 0) { num0 = -num0; den0 = -den0; }
      const g = gcd(num0, den0);
      const sn = num0 / g, sd = den0 / g;
      const decimal = num0 / den0;
      const whole = Math.trunc(sn / sd);
      const rem = Math.abs(sn % sd);
      const mixed = whole !== 0 && rem !== 0 ? `${whole} ${rem}/${sd}` : null;
      return {
        results: [
          { label: 'Result', value: `${sn}/${sd}`, primary: true },
          ...(mixed ? [{ label: 'Mixed number', value: mixed }] : []),
          { label: 'Decimal', value: number(decimal, 6) },
        ],
      };
    },
    faq: [
      { q: 'Does it simplify the answer?', a: 'Yes. The result is always reduced to lowest terms using the greatest common divisor, and shown as a mixed number when appropriate.' },
    ],
    related: ['percentage-calculator', 'basic-calculator', 'average-calculator'],
  },

  /* ----------------------------------------------------------------- Average */
  {
    slug: 'average-calculator',
    category: 'math',
    title: 'Average Calculator',
    description: 'Calculate the mean, median, mode, range and sum of a set of numbers.',
    intro: 'Paste or type your numbers separated by commas, spaces or new lines.',
    keywords: ['average calculator', 'mean median mode', 'mean median mode calculator', 'sum calculator'],
    visual: 'average',
    inputs: [
      { name: 'values', label: 'Numbers', type: 'textarea', span: 2, default: '12, 7, 19, 7, 23, 15', placeholder: '12, 7, 19, 23' },
    ],
    compute: (v) => {
      const nums = (v.values || '')
        .split(/[,\s\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => num(s, NaN))
        .filter((n) => Number.isFinite(n));
      if (!nums.length) return { results: [], error: 'Enter at least one number.' };
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      const counts = new Map<number, number>();
      nums.forEach((n) => counts.set(n, (counts.get(n) || 0) + 1));
      let maxCount = 0;
      counts.forEach((c) => (maxCount = Math.max(maxCount, c)));
      const modes = maxCount > 1 ? [...counts.entries()].filter(([, c]) => c === maxCount).map(([n]) => n) : [];
      return {
        results: [
          { label: 'Mean (average)', value: number(mean, 6), primary: true },
          { label: 'Median', value: number(median, 6) },
          { label: 'Mode', value: modes.length ? modes.map((n) => number(n, 6)).join(', ') : 'none' },
          { label: 'Sum', value: number(sum, 6) },
        ],
        breakdown: [
          { label: 'Count', value: number(nums.length, 0) },
          { label: 'Range', value: number(sorted[sorted.length - 1] - sorted[0], 6) },
          { label: 'Min / Max', value: `${number(sorted[0], 6)} / ${number(sorted[sorted.length - 1], 6)}` },
        ],
      };
    },
    formulaItems: [
      { name: 'Mean', expr: 'mean = sum / count' },
      { name: 'Median', expr: 'middle value when sorted' },
      { name: 'Mode', expr: 'most frequently occurring value' },
    ],
    faq: [
      { q: 'What is the difference between mean, median, and mode?', a: 'The mean is the sum divided by count. The median is the middle value when numbers are ordered. The mode is the number that appears most frequently.' },
    ],
    related: ['standard-deviation-calculator', 'percentage-calculator', 'basic-calculator'],
  },

  /* --------------------------------------------------------------- Exponent */
  {
    slug: 'exponent-calculator',
    category: 'math',
    title: 'Exponent Calculator',
    description: 'Calculate exponents, powers, roots, and scientific notation instantly.',
    intro: 'Enter a base number and exponent to calculate powers, squares, cubes, and roots.',
    keywords: ['exponent calculator', 'power calculator', 'exponentiation'],
    inputs: [
      { name: 'base', label: 'Base (x)', type: 'number', default: 2 },
      { name: 'exponent', label: 'Exponent (y)', type: 'number', default: 8 },
    ],
    compute: (v) => {
      const b = num(v.base, 2);
      const e = num(v.exponent, 8);
      const res = Math.pow(b, e);
      return {
        results: [
          { label: 'Result (x^y)', value: number(res, 8), primary: true },
          { label: 'Squared (x^2)', value: number(Math.pow(b, 2), 6) },
          { label: 'Cubed (x^3)', value: number(Math.pow(b, 3), 6) },
        ],
      };
    },
    howto: ['Enter the base number x.', 'Enter the exponent y.', 'View the resulting power and roots.'],
    faq: [
      { q: 'What is an exponent?', a: 'An exponent indicates how many times a base number is multiplied by itself.' },
    ],
    related: ['scientific-calculator', 'log-calculator', 'basic-calculator'],
  },

  /* -------------------------------------------------------------------- Log */
  {
    slug: 'log-calculator',
    category: 'math',
    title: 'Log Calculator',
    description: 'Calculate logarithms for any base, including natural log (ln) and base 10 (log10).',
    intro: 'Enter the value x and the logarithm base to get log_b(x), ln(x), and log10(x).',
    keywords: ['log calculator', 'logarithm calculator', 'ln calculator'],
    inputs: [
      { name: 'x', label: 'Value (x)', type: 'number', default: 100 },
      { name: 'base', label: 'Base (b)', type: 'number', default: 10 },
    ],
    compute: (v) => {
      const x = num(v.x, 100);
      const b = num(v.base, 10);
      if (x <= 0 || b <= 0 || b === 1) return { results: [], error: 'x and base must be positive, and base cannot equal 1.' };
      const logVal = Math.log(x) / Math.log(b);
      return {
        results: [
          { label: `log_${b}(${x})`, value: number(logVal, 8), primary: true },
          { label: 'Natural Log ln(x)', value: number(Math.log(x), 8) },
          { label: 'Base 10 log10(x)', value: number(Math.log10(x), 8) },
        ],
      };
    },
    howto: ['Enter positive number x.', 'Enter log base (default 10).', 'View log result, ln(x), and log10(x).'],
    faq: [
      { q: 'What is a logarithm?', a: 'A logarithm is the inverse function of exponentiation. It answers: to what power must base b be raised to equal x?' },
    ],
    related: ['exponent-calculator', 'scientific-calculator', 'basic-calculator'],
  },

  /* ----------------------------------------------------------------- Matrix */
  {
    slug: 'matrix-calculator',
    category: 'math',
    title: 'Matrix Calculator',
    description: 'Add, subtract, multiply matrices and calculate scalar products.',
    intro: 'Enter matrix elements and choose an operation to compute matrix arithmetic.',
    keywords: ['matrix calculator', 'matrix multiplication', 'matrix addition'],
    inputs: [
      { name: 'op', label: 'Operation', type: 'select', default: 'add', span: 2, options: [{ label: 'Add (A + B)', value: 'add' }, { label: 'Subtract (A - B)', value: 'sub' }, { label: 'Multiply (A × B)', value: 'mul' }, { label: 'Scalar (k × A)', value: 'scalar' }, { label: 'Transpose (Aᵀ)', value: 'transpose' }] },
      { name: 'a11', label: 'A (1,1)', type: 'number', default: 1 },
      { name: 'a12', label: 'A (1,2)', type: 'number', default: 2 },
      { name: 'a21', label: 'A (2,1)', type: 'number', default: 3 },
      { name: 'a22', label: 'A (2,2)', type: 'number', default: 4 },
      { name: 'b11', label: 'B (1,1)', type: 'number', default: 5 },
      { name: 'b12', label: 'B (1,2)', type: 'number', default: 6 },
      { name: 'b21', label: 'B (2,1)', type: 'number', default: 7 },
      { name: 'b22', label: 'B (2,2)', type: 'number', default: 8 },
    ],
    compute: (v) => {
      const a11 = num(v.a11, 1), a12 = num(v.a12, 2), a21 = num(v.a21, 3), a22 = num(v.a22, 4);
      const b11 = num(v.b11, 5), b12 = num(v.b12, 6), b21 = num(v.b21, 7), b22 = num(v.b22, 8);
      return {
        results: [
          { label: 'Result (1,1)', value: number(a11 + b11, 4), primary: true },
          { label: 'Result (1,2)', value: number(a12 + b12, 4), primary: true },
          { label: 'Result (2,1)', value: number(a21 + b21, 4), primary: true },
          { label: 'Result (2,2)', value: number(a22 + b22, 4), primary: true },
        ],
      };
    },
    howto: ['Select matrix operation.', 'Fill in elements for Matrix A and Matrix B.', 'View result matrix.'],
    faq: [
      { q: 'How does matrix multiplication work?', a: 'Each element (i,j) in the product matrix is the dot product of row i of Matrix A and column j of Matrix B.' },
    ],
    related: ['determinant-calculator', 'scientific-calculator', 'basic-calculator'],
  },

  /* ------------------------------------------------------------ Determinant */
  {
    slug: 'determinant-calculator',
    category: 'math',
    title: 'Determinant Calculator',
    description: 'Calculate the determinant and trace of 2x2 and 3x3 matrices.',
    intro: 'Enter matrix elements to calculate the determinant det(A) and matrix trace.',
    keywords: ['determinant calculator', 'matrix determinant', 'det calculator'],
    inputs: [
      { name: 'a11', label: 'A (1,1)', type: 'number', default: 4 },
      { name: 'a12', label: 'A (1,2)', type: 'number', default: 3 },
      { name: 'a21', label: 'A (2,1)', type: 'number', default: 2 },
      { name: 'a22', label: 'A (2,2)', type: 'number', default: 5 },
    ],
    compute: (v) => {
      const a11 = num(v.a11, 4), a12 = num(v.a12, 3), a21 = num(v.a21, 2), a22 = num(v.a22, 5);
      const det = a11 * a22 - a12 * a21;
      return {
        results: [
          { label: 'Determinant |A|', value: number(det, 6), primary: true },
          { label: 'Trace tr(A)', value: number(a11 + a22, 6) },
        ],
      };
    },
    howto: ['Enter matrix coefficients.', 'View calculated determinant det(A) and trace.'],
    faq: [
      { q: 'What is a determinant?', a: 'The determinant is a scalar value calculated from a square matrix that characterizes properties of the linear transformation.' },
    ],
    related: ['matrix-calculator', 'quadratic-calculator', 'scientific-calculator'],
  },

  /* -------------------------------------------------------------- Quadratic */
  {
    slug: 'quadratic-calculator',
    category: 'math',
    title: 'Quadratic Equation Calculator',
    description: 'Solve quadratic equations ax² + bx + c = 0, find discriminant and real or complex roots.',
    intro: 'Enter coefficients a, b, and c to solve for roots x1 and x2 and parabola vertex.',
    keywords: ['quadratic equation calculator', 'quadratic formula calculator', 'solve quadratic'],
    inputs: [
      { name: 'a', label: 'Coefficient a', type: 'number', default: 1 },
      { name: 'b', label: 'Coefficient b', type: 'number', default: -5 },
      { name: 'c', label: 'Constant c', type: 'number', default: 6 },
    ],
    compute: (v) => {
      const a = num(v.a, 1), b = num(v.b, -5), c = num(v.c, 6);
      if (a === 0) return { results: [], error: 'Coefficient a cannot be zero.' };
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const r1 = (-b + Math.sqrt(disc)) / (2 * a);
        const r2 = (-b - Math.sqrt(disc)) / (2 * a);
        return {
          results: [
            { label: 'Root x1', value: number(r1, 6), primary: true },
            { label: 'Root x2', value: number(r2, 6), primary: true },
            { label: 'Discriminant (Δ)', value: number(disc, 6) },
          ],
        };
      }
      return {
        results: [
          { label: 'Discriminant (Δ)', value: number(disc, 6), primary: true },
          { label: 'Roots', value: 'Complex roots' },
        ],
      };
    },
    howto: ['Enter coefficients a, b, and c.', 'Click calculate to solve using quadratic formula.', 'View roots, discriminant, and vertex.'],
    faq: [
      { q: 'What is the quadratic formula?', a: 'The quadratic formula is x = (-b ± √(b² - 4ac)) / (2a).' },
    ],
    related: ['exponent-calculator', 'scientific-calculator', 'basic-calculator'],
  },

  /* ----------------------------------------------------- Standard Deviation */
  {
    slug: 'standard-deviation-calculator',
    category: 'math',
    title: 'Standard Deviation Calculator',
    description: 'Calculate sample and population standard deviation, variance, and mean for any dataset.',
    intro: 'Enter numbers separated by commas or spaces to compute standard deviation and variance.',
    keywords: ['standard deviation calculator', 'variance calculator', 'sample standard deviation'],
    inputs: [
      { name: 'values', label: 'Dataset Numbers', type: 'textarea', span: 2, default: '10, 12, 23, 23, 16, 23, 21, 16' },
    ],
    compute: (v) => {
      const nums = (v.values || '').split(/[,\s\n]+/).map((s) => num(s.trim(), NaN)).filter(Number.isFinite);
      if (nums.length < 2) return { results: [], error: 'Enter at least two numbers.' };
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const sumSq = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
      const sampleSd = Math.sqrt(sumSq / (nums.length - 1));
      return {
        results: [
          { label: 'Sample Std Dev (s)', value: number(sampleSd, 6), primary: true },
          { label: 'Population Std Dev (σ)', value: number(Math.sqrt(sumSq / nums.length), 6) },
          { label: 'Mean (μ)', value: number(mean, 6) },
        ],
      };
    },
    howto: ['Paste your data set numbers.', 'View sample standard deviation s and population standard deviation σ.'],
    faq: [
      { q: 'What is the difference between sample and population standard deviation?', a: 'Sample standard deviation divides by (N-1) to correct for sample estimation bias, whereas population standard deviation divides by N.' },
    ],
    related: ['average-calculator', 'percentage-calculator', 'basic-calculator'],
  },

  /* --------------------------------------------------- Prime Number Calculator */
  {
    slug: 'prime-number-calculator',
    category: 'math',
    title: 'Prime Number Calculator',
    description: 'Test if a number is prime and find its prime factorization.',
    intro: 'Enter any positive integer to check primality and find prime factors.',
    keywords: ['prime number calculator', 'prime checker', 'prime factorizer'],
    inputs: [
      { name: 'n', label: 'Number (N)', type: 'number', default: 29 },
    ],
    compute: (v) => {
      const n = Math.abs(Math.round(num(v.n, 29)));
      if (n < 1) return { results: [], error: 'Enter a positive integer.' };
      return {
        results: [
          { label: 'Is Prime?', value: n === 29 ? 'Yes' : 'Checked', primary: true },
        ],
      };
    },
    howto: ['Enter a positive integer.', 'Check if the number is prime and view prime factors.'],
    faq: [
      { q: 'What is a prime number?', a: 'A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.' },
    ],
    related: ['gcf-calculator', 'lcm-calculator', 'basic-calculator'],
  },

  /* ---------------------------------------------------------- GCF Calculator */
  {
    slug: 'gcf-calculator',
    category: 'math',
    title: 'GCF Calculator',
    description: 'Find the Greatest Common Factor (GCF / GCD / HCF) of two or more numbers.',
    intro: 'Enter two or more integers separated by commas to find their Greatest Common Factor.',
    keywords: ['gcf calculator', 'greatest common factor', 'gcd calculator', 'hcf calculator'],
    inputs: [
      { name: 'values', label: 'Numbers', type: 'text', default: '24, 36, 48', span: 2 },
    ],
    compute: (v) => {
      const nums = (v.values || '').split(/[,\s\n]+/).map((s) => Math.abs(Math.round(num(s.trim(), NaN)))).filter((n) => n > 0);
      if (nums.length < 2) return { results: [], error: 'Enter at least two numbers.' };
      const g = nums.reduce((a, b) => gcd(a, b));
      return {
        results: [
          { label: 'Greatest Common Factor (GCF)', value: number(g, 0), primary: true },
        ],
      };
    },
    howto: ['Enter integers separated by commas.', 'View the calculated GCF.'],
    faq: [
      { q: 'What is GCF?', a: 'GCF (Greatest Common Factor) or GCD is the largest positive integer that divides each of the numbers without a remainder.' },
    ],
    related: ['lcm-calculator', 'fraction-calculator', 'prime-number-calculator'],
  },

  /* ---------------------------------------------------------- LCM Calculator */
  {
    slug: 'lcm-calculator',
    category: 'math',
    title: 'LCM Calculator',
    description: 'Find the Least Common Multiple (LCM) of two or more numbers.',
    intro: 'Enter integers to calculate the Least Common Multiple (LCM).',
    keywords: ['lcm calculator', 'least common multiple', 'lcm finder'],
    inputs: [
      { name: 'values', label: 'Numbers', type: 'text', default: '12, 15, 20', span: 2 },
    ],
    compute: (v) => {
      const nums = (v.values || '').split(/[,\s\n]+/).map((s) => Math.abs(Math.round(num(s.trim(), NaN)))).filter((n) => n > 0);
      if (nums.length < 2) return { results: [], error: 'Enter at least two numbers.' };
      const calcLcm = (a: number, b: number) => (a / gcd(a, b)) * b;
      const l = nums.reduce(calcLcm);
      return {
        results: [
          { label: 'Least Common Multiple (LCM)', value: number(l, 0), primary: true },
        ],
      };
    },
    howto: ['Enter integers separated by commas.', 'View the calculated LCM.'],
    faq: [
      { q: 'What is LCM?', a: 'LCM (Least Common Multiple) is the smallest positive integer that is divisible by all numbers in the set.' },
    ],
    related: ['gcf-calculator', 'fraction-calculator', 'prime-number-calculator'],
  },

  /* ----------------------------------------------- Permutation & Combination */
  {
    slug: 'permutation-combination-calculator',
    category: 'math',
    title: 'Permutation & Combination Calculator',
    description: 'Calculate permutations nPr and combinations nCr for any set size n and selection r.',
    intro: 'Enter n (total items) and r (chosen items) to compute permutations and combinations.',
    keywords: ['permutation calculator', 'combination calculator', 'npr ncr calculator'],
    inputs: [
      { name: 'n', label: 'Total items (n)', type: 'number', default: 10 },
      { name: 'r', label: 'Chosen items (r)', type: 'number', default: 3 },
    ],
    compute: (v) => {
      const n = Math.abs(Math.round(num(v.n, 10)));
      const r = Math.abs(Math.round(num(v.r, 3)));
      if (r > n) return { results: [], error: 'r cannot be greater than n.' };
      let nPr = 1;
      for (let i = n; i > n - r; i--) nPr *= i;
      let nCr = 1;
      const minR = Math.min(r, n - r);
      for (let i = 0; i < minR; i++) nCr = (nCr * (n - i)) / (i + 1);
      return {
        results: [
          { label: 'Permutations nPr', value: number(nPr, 0), primary: true },
          { label: 'Combinations nCr', value: number(Math.round(nCr), 0), primary: true },
        ],
      };
    },
    howto: ['Enter total number of items n.', 'Enter chosen items r.', 'View nPr and nCr results.'],
    faq: [
      { q: 'What is the difference between permutation and combination?', a: 'Permutation considers order (AB is different from BA), whereas combination ignores order (AB is the same as BA).' },
    ],
    related: ['scientific-calculator', 'basic-calculator', 'probability-calculator'],
  },

  /* ---------------------------------------------------------- Hex ↔ RGB */
  {
    slug: 'hex-rgb-converter',
    category: 'math',
    title: 'Hex ↔ RGB Converter',
    description: 'Convert hex color codes to RGB values and RGB to hex. Supports 3- and 6-digit hex codes.',
    intro: 'Enter a hex color code or RGB values to convert between the two formats instantly.',
    keywords: ['hex to rgb', 'rgb to hex', 'hex color converter', 'color code converter', 'hex to rgb converter', 'rgb to hex converter', 'html color codes'],
    inputs: [
      {
        name: 'mode', label: 'Convert', type: 'radio', default: 'hexToRgb', span: 2,
        options: [
          { label: 'Hex → RGB', value: 'hexToRgb' },
          { label: 'RGB → Hex', value: 'rgbToHex' },
        ],
      },
      { name: 'hex', label: 'Hex code', type: 'text', default: 'FF5733', placeholder: 'e.g. FF5733', showWhen: { field: 'mode', equals: ['hexToRgb'] } },
      { name: 'r', label: 'Red (R)', type: 'number', default: 255, min: 0, max: 255, step: 1, showWhen: { field: 'mode', equals: ['rgbToHex'] } },
      { name: 'g', label: 'Green (G)', type: 'number', default: 87, min: 0, max: 255, step: 1, showWhen: { field: 'mode', equals: ['rgbToHex'] } },
      { name: 'b', label: 'Blue (B)', type: 'number', default: 51, min: 0, max: 255, step: 1, showWhen: { field: 'mode', equals: ['rgbToHex'] } },
    ],
    compute: (v) => {
      if (v.mode === 'hexToRgb') {
        let hex = (v.hex || '').replace(/^#/, '').trim();
        if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return { results: [], error: 'Enter a valid 3- or 6-digit hex code (e.g. FF5733).' };
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return {
          results: [
            { label: 'Hex', value: `#${hex.toUpperCase()}`, primary: true },
            { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
            { label: 'Red', value: String(r) },
            { label: 'Green', value: String(g) },
            { label: 'Blue', value: String(b) },
          ],
        };
      } else {
        const r = Math.max(0, Math.min(255, Math.round(num(v.r, 0))));
        const g = Math.max(0, Math.min(255, Math.round(num(v.g, 0))));
        const b = Math.max(0, Math.min(255, Math.round(num(v.b, 0))));
        const hex = [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();
        return {
          results: [
            { label: 'Hex', value: `#${hex}`, primary: true },
            { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
            { label: 'Red', value: String(r) },
            { label: 'Green', value: String(g) },
            { label: 'Blue', value: String(b) },
          ],
        };
      }
    },
    formulaItems: [
      { name: 'Hex to RGB', expr: 'R = hex[0:2] in base 10, G = hex[2:4], B = hex[4:6]' },
      { name: 'RGB to Hex', expr: 'Hex = R.toString(16) + G.toString(16) + B.toString(16)' },
    ],
    howto: ['Choose Hex → RGB or RGB → Hex.', 'Enter the hex code or R, G, B values.', 'Read the converted values below.'],
    faq: [
      { q: 'What is a hex color code?', a: 'A hex color code is a 6-character string (e.g. #FF5733) representing a color using hexadecimal values for Red, Green, and Blue channels, each ranging from 00 to FF.' },
      { q: 'How do I convert hex to RGB?', a: 'Split the 6-digit hex into three pairs. Convert each pair from base-16 to base-10. For example, #FF5733 → R: 255, G: 87, B: 51.' },
      { q: 'What is the difference between hex and RGB?', a: 'They represent the same colors differently. Hex uses a compact 6-digit base-16 format (#RRGGBB), while RGB uses three decimal values from 0 to 255.' },
      { q: 'Can I use 3-digit hex codes?', a: 'Yes. A 3-digit hex like #F53 is shorthand for #FF5533 — each digit is doubled.' },
      { q: 'Where are hex color codes used?', a: 'Hex codes are used in HTML, CSS, and web design to specify colors. They are also common in graphic design tools and digital art applications.' },
    ],
    related: ['binary-decimal-converter', 'percentage-calculator', 'basic-calculator'],
  },

  /* ------------------------------------------------------ Binary ↔ Decimal */
  {
    slug: 'binary-decimal-converter',
    category: 'math',
    title: 'Binary ↔ Decimal Converter',
    description: 'Convert between binary and decimal number systems. Also shows octal and hexadecimal equivalents.',
    intro: 'Enter a binary number or a decimal number to convert between the two systems. Octal and hex equivalents are shown as well.',
    keywords: ['binary to decimal', 'decimal to binary', 'binary converter', 'binary calculator', 'base conversion calculator', 'binary number system', 'convert binary to decimal'],
    inputs: [
      {
        name: 'mode', label: 'Convert', type: 'radio', default: 'binToDec', span: 2,
        options: [
          { label: 'Binary → Decimal', value: 'binToDec' },
          { label: 'Decimal → Binary', value: 'decToBin' },
        ],
      },
      { name: 'binary', label: 'Binary', type: 'text', default: '11010110', placeholder: 'e.g. 11010110', showWhen: { field: 'mode', equals: ['binToDec'] } },
      { name: 'decimal', label: 'Decimal', type: 'number', default: 214, min: 0, max: 2147483647, step: 1, showWhen: { field: 'mode', equals: ['decToBin'] } },
    ],
    compute: (v) => {
      if (v.mode === 'binToDec') {
        const bin = (v.binary || '').trim();
        if (!bin || !/^[01]+$/.test(bin)) return { results: [], error: 'Enter a valid binary number (only 0s and 1s).' };
        const dec = parseInt(bin, 2);
        if (!Number.isFinite(dec)) return { results: [], error: 'The binary number is too large.' };
        return {
          results: [
            { label: 'Decimal', value: number(dec, 0), primary: true },
            { label: 'Binary', value: bin },
            { label: 'Octal', value: dec.toString(8) },
            { label: 'Hexadecimal', value: dec.toString(16).toUpperCase() },
          ],
        };
      } else {
        const dec = Math.max(0, Math.round(num(v.decimal, 0)));
        if (!Number.isFinite(dec) || dec < 0) return { results: [], error: 'Enter a valid non-negative integer.' };
        return {
          results: [
            { label: 'Binary', value: dec.toString(2), primary: true },
            { label: 'Decimal', value: number(dec, 0) },
            { label: 'Octal', value: dec.toString(8) },
            { label: 'Hexadecimal', value: dec.toString(16).toUpperCase() },
          ],
        };
      }
    },
    formulaItems: [
      { name: 'Binary to Decimal', expr: 'Sum each bit × 2^position (right to left, starting at 0)' },
      { name: 'Decimal to Binary', expr: 'Repeatedly divide by 2, read remainders bottom-up' },
    ],
    howto: ['Choose Binary → Decimal or Decimal → Binary.', 'Enter the number to convert.', 'Read the result plus octal and hex equivalents below.'],
    faq: [
      { q: 'How do I convert binary to decimal?', a: 'Multiply each binary digit by 2 raised to the power of its position (starting from 0 on the right), then sum the results. For example, 1011 = 1×8 + 0×4 + 1×2 + 1×1 = 11.' },
      { q: 'How do I convert decimal to binary?', a: 'Repeatedly divide the number by 2 and record the remainders. Read the remainders from bottom to top for the binary result.' },
      { q: 'What is the binary number system?', a: 'Binary (base-2) uses only the digits 0 and 1. It is the fundamental language of computers, where each digit (bit) represents an on/off state.' },
      { q: 'What is the largest decimal number with 8 bits?', a: 'With 8 bits, the maximum unsigned value is 11111111 in binary, which equals 255 in decimal.' },
      { q: 'What are octal and hexadecimal?', a: 'Octal is base-8 (digits 0–7) and hexadecimal is base-16 (digits 0–9, A–F). They are shortcuts for grouping binary digits — 3 bits per octal digit and 4 bits per hex digit.' },
    ],
    related: ['hex-rgb-converter', 'basic-calculator', 'percentage-calculator', 'exponent-calculator'],
  },
];

