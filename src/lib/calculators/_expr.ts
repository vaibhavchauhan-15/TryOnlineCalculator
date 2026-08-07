// A small, safe math expression evaluator (shunting-yard -> RPN).
// No use of eval/Function. Supports + - * / ^ %, parentheses, unary minus,
// constants (pi, e) and, when scientific=true, common functions.
// Extended with hyperbolic, combinatorial, and multi-argument functions.

type Token = { type: 'num' | 'op' | 'lparen' | 'rparen' | 'func' | 'sep'; value: string };

// Single-argument functions
const FUNCS: Record<string, (x: number) => number> = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  sinh: (x) => Math.sinh(x),
  cosh: (x) => Math.cosh(x),
  tanh: (x) => Math.tanh(x),
  asinh: (x) => Math.asinh(x),
  acosh: (x) => Math.acosh(x),
  atanh: (x) => Math.atanh(x),
  sqrt: (x) => Math.sqrt(x),
  cbrt: (x) => Math.cbrt(x),
  ln: (x) => Math.log(x),
  log: (x) => Math.log10(x),
  exp: (x) => Math.exp(x),
  abs: (x) => Math.abs(x),
  sign: (x) => Math.sign(x),
  fact: (x) => { const n = Math.round(x); if (n < 0 || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
  gamma: (x) => {
    // Lanczos approximation for Gamma function
    if (x <= 0 && x === Math.floor(x)) return NaN; // poles
    if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gammaPositive(1 - x));
    return gammaPositive(x);
  },
  round: (x) => Math.round(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
};

// Two-argument functions (comma-separated)
const FUNCS2: Record<string, (a: number, b: number) => number> = {
  npr: (n, r) => {
    const ni = Math.round(n), ri = Math.round(r);
    if (ni < 0 || ri < 0 || ri > ni) return NaN;
    let result = 1;
    for (let i = ni; i > ni - ri; i--) result *= i;
    return result;
  },
  ncr: (n, r) => {
    const ni = Math.round(n), ri = Math.round(r);
    if (ni < 0 || ri < 0 || ri > ni) return NaN;
    const rr = Math.min(ri, ni - ri);
    let result = 1;
    for (let i = 0; i < rr; i++) result = result * (ni - i) / (i + 1);
    return Math.round(result);
  },
  gcd: (a, b) => gcdInternal(Math.abs(Math.round(a)), Math.abs(Math.round(b))),
  lcm: (a, b) => {
    const ai = Math.abs(Math.round(a)), bi = Math.abs(Math.round(b));
    if (ai === 0 && bi === 0) return 0;
    return (ai / gcdInternal(ai, bi)) * bi;
  },
  nrt: (n, x) => {
    // nth root of x
    if (n === 0) return NaN;
    if (x < 0 && n % 2 === 0) return NaN;
    if (x < 0) return -Math.pow(-x, 1 / n);
    return Math.pow(x, 1 / n);
  },
};

// Zero-argument functions
const FUNCS0: Record<string, () => number> = {
  rand: () => Math.random(),
};

// Internal GCD helper
function gcdInternal(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

// Lanczos approximation for positive x
function gammaPositive(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  const t = x + g - 0.5;
  let sum = c[0];
  for (let i = 1; i < g + 2; i++) sum += c[i] / (x - 1 + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x - 0.5) * Math.exp(-t) * sum;
}

const ALL_FUNC_NAMES = new Set([...Object.keys(FUNCS), ...Object.keys(FUNCS2), ...Object.keys(FUNCS0)]);

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };
const PREC: Record<string, number> = { '+': 2, '-': 2, '*': 3, '/': 3, '%': 3, '^': 4, 'u-': 4 };
const RIGHT = new Set(['^', 'u-']);

const tokenCache = new Map<string, Token[]>();
const MAX_TOKEN_CACHE = 100;

function tokenize(input: string): Token[] {
  let cached = tokenCache.get(input);
  if (cached) return cached;
  const tokens: Token[] = [];
  const s = input.replace(/\s+/g, '');
  let i = 0;
  const isDigit = (c: string) => c >= '0' && c <= '9';
  const isAlpha = (c: string) => /[a-zA-Z]/.test(c);
  while (i < s.length) {
    const c = s[i];
    if (isDigit(c) || c === '.') {
      let j = i + 1;
      while (j < s.length && (isDigit(s[j]) || s[j] === '.' || s[j] === 'e' || s[j] === 'E' || ((s[j] === '+' || s[j] === '-') && (s[j - 1] === 'e' || s[j - 1] === 'E')))) j++;
      tokens.push({ type: 'num', value: s.slice(i, j) });
      i = j;
    } else if (isAlpha(c)) {
      let j = i + 1;
      while (j < s.length && isAlpha(s[j])) j++;
      const word = s.slice(i, j).toLowerCase();
      if (ALL_FUNC_NAMES.has(word)) tokens.push({ type: 'func', value: word });
      else if (word in CONSTS) tokens.push({ type: 'num', value: String(CONSTS[word]) });
      else throw new Error(`Unknown name: ${word}`);
      i = j;
    } else if ('+-*/^%'.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
    } else if (c === '(') {
      tokens.push({ type: 'lparen', value: c });
      i++;
    } else if (c === ')') {
      tokens.push({ type: 'rparen', value: c });
      i++;
    } else if (c === ',') {
      tokens.push({ type: 'sep', value: c });
      i++;
    } else {
      throw new Error(`Unexpected character: ${c}`);
    }
  }
  if (tokenCache.size >= MAX_TOKEN_CACHE) {
    const firstKey = tokenCache.keys().next().value;
    if (firstKey !== undefined) tokenCache.delete(firstKey);
  }
  tokenCache.set(input, tokens);
  return tokens;
}

export function evaluate(input: string, opts: { scientific?: boolean; degrees?: boolean } = {}): number {
  if (!input.trim()) return NaN;
  const raw = tokenize(input);
  // Mark unary minus and validate function usage.
  const output: Token[] = [];
  const ops: Token[] = [];
  // Track argument counts for multi-argument functions
  const argCounts: number[] = []; // counts commas seen
  const argHasContent: boolean[] = []; // whether at least one value was output inside the current function's parens
  // Helper: mark innermost function as having content
  const markContent = () => {
    if (argHasContent.length > 0) argHasContent[argHasContent.length - 1] = true;
  };
  let prev: Token | null = null;
  for (const t of raw) {
    if (t.type === 'num') {
      output.push(t);
      markContent();
    } else if (t.type === 'func') {
      if (!opts.scientific) throw new Error('Functions are only available in scientific mode.');
      ops.push(t);
      argCounts.push(0); // counts commas
      argHasContent.push(false);
    } else if (t.type === 'sep') {
      // Comma separator — pop operators until matching left paren
      while (ops.length && ops[ops.length - 1].type !== 'lparen') {
        output.push(ops.pop()!);
      }
      if (!ops.length) throw new Error('Mismatched parentheses.');
      // Increment comma count for the enclosing function
      if (argCounts.length > 0) argCounts[argCounts.length - 1]++;
    } else if (t.type === 'op') {
      let op = t.value;
      const isUnary = op === '-' && (!prev || prev.type === 'op' || prev.type === 'lparen' || prev.type === 'sep');
      if (isUnary) op = 'u-';
      while (
        ops.length &&
        ops[ops.length - 1].type !== 'lparen' &&
        (ops[ops.length - 1].type === 'func' ||
          (PREC[ops[ops.length - 1].value] > PREC[op] ||
            (PREC[ops[ops.length - 1].value] === PREC[op] && !RIGHT.has(op))))
      ) {
        output.push(ops.pop()!);
      }
      ops.push({ type: 'op', value: op });
    } else if (t.type === 'lparen') {
      ops.push(t);
    } else if (t.type === 'rparen') {
      while (ops.length && ops[ops.length - 1].type !== 'lparen') output.push(ops.pop()!);
      if (!ops.length) throw new Error('Mismatched parentheses.');
      ops.pop();
      if (ops.length && ops[ops.length - 1].type === 'func') {
        const fn = ops.pop()!;
        // Compute actual argument count: commas + 1 if there's content, else 0
        const commas = argCounts.pop() ?? 0;
        const hasContent = argHasContent.pop() ?? false;
        const argc = hasContent ? commas + 1 : 0;
        fn.value = fn.value + ':' + argc;
        output.push(fn);
        // This function's result counts as content for any enclosing function
        markContent();
      }
    }
    prev = t.type === 'op' && (t.value === '-') && (!prev || prev.type === 'op' || prev.type === 'lparen' || prev.type === 'sep')
      ? { type: 'op', value: 'u-' }
      : t;
  }
  while (ops.length) {
    const o = ops.pop()!;
    if (o.type === 'lparen') throw new Error('Mismatched parentheses.');
    // Function without explicit parens — treat as single-arg (e.g., implicit sin 30)
    if (o.type === 'func') {
      o.value = o.value + ':1';
      argCounts.pop();
      argHasContent.pop();
    }
    output.push(o);
  }

  const stack: number[] = [];
  const toRad = (x: number) => (opts.degrees ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (opts.degrees ? (x * 180) / Math.PI : x);
  for (const t of output) {
    if (t.type === 'num') {
      stack.push(parseFloat(t.value));
    } else if (t.type === 'func') {
      // Parse function name and argument count
      const parts = t.value.split(':');
      const fname = parts[0];
      const argc = parseInt(parts[1] ?? '1', 10);

      if (fname in FUNCS0 && argc === 0) {
        // Zero-argument function (e.g., rand())
        stack.push(FUNCS0[fname]());
      } else if (fname in FUNCS2 && argc === 2) {
        // Two-argument function
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) throw new Error('Invalid expression.');
        stack.push(FUNCS2[fname](a, b));
      } else if (fname in FUNCS) {
        const a = stack.pop();
        if (a === undefined) throw new Error('Invalid expression.');
        let r: number;
        if (['sin', 'cos', 'tan'].includes(fname)) r = FUNCS[fname](toRad(a));
        else if (['asin', 'acos', 'atan'].includes(fname)) r = fromRad(FUNCS[fname](a));
        else r = FUNCS[fname](a);
        stack.push(r);
      } else if (fname in FUNCS0) {
        stack.push(FUNCS0[fname]());
      } else {
        throw new Error(`Unknown function: ${fname}`);
      }
    } else if (t.value === 'u-') {
      const a = stack.pop();
      if (a === undefined) throw new Error('Invalid expression.');
      stack.push(-a);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('Invalid expression.');
      switch (t.value) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/':
          if (b === 0) throw new Error('Division by zero.');
          stack.push(a / b);
          break;
        case '%':
          if (b === 0) throw new Error('Division by zero.');
          stack.push(a % b);
          break;
        case '^': stack.push(Math.pow(a, b)); break;
        default: throw new Error(`Unknown operator ${t.value}`);
      }
    }
  }
  if (stack.length !== 1) throw new Error('Invalid expression.');
  return stack[0];
}

// Greatest common divisor for the fraction calculator.
// Rounds inputs to integers first so floating-point remainders don't cause
// infinite loops when a user types a decimal numerator or denominator.
export function gcd(a: number, b: number): number {
  return gcdInternal(a, b);
}
