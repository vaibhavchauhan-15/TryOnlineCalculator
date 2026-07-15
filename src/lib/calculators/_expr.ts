// A small, safe math expression evaluator (shunting-yard -> RPN).
// No use of eval/Function. Supports + - * / ^ %, parentheses, unary minus,
// constants (pi, e) and, when scientific=true, common functions.

type Token = { type: 'num' | 'op' | 'lparen' | 'rparen' | 'func' | 'sep'; value: string };

const FUNCS: Record<string, (x: number) => number> = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  sqrt: (x) => Math.sqrt(x),
  cbrt: (x) => Math.cbrt(x),
  ln: (x) => Math.log(x),
  log: (x) => Math.log10(x),
  exp: (x) => Math.exp(x),
  abs: (x) => Math.abs(x),
  round: (x) => Math.round(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
};

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };
const PREC: Record<string, number> = { '+': 2, '-': 2, '*': 3, '/': 3, '%': 3, '^': 4, 'u-': 5 };
const RIGHT = new Set(['^', 'u-']);

function tokenize(input: string): Token[] {
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
      if (word in FUNCS) tokens.push({ type: 'func', value: word });
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
    } else {
      throw new Error(`Unexpected character: ${c}`);
    }
  }
  return tokens;
}

export function evaluate(input: string, opts: { scientific?: boolean; degrees?: boolean } = {}): number {
  if (!input.trim()) return NaN;
  const raw = tokenize(input);
  // Mark unary minus and validate function usage.
  const output: Token[] = [];
  const ops: Token[] = [];
  let prev: Token | null = null;
  for (const t of raw) {
    if (t.type === 'num') {
      output.push(t);
    } else if (t.type === 'func') {
      if (!opts.scientific) throw new Error('Functions are only available in scientific mode.');
      ops.push(t);
    } else if (t.type === 'op') {
      let op = t.value;
      const isUnary = op === '-' && (!prev || prev.type === 'op' || prev.type === 'lparen');
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
      if (ops.length && ops[ops.length - 1].type === 'func') output.push(ops.pop()!);
    }
    prev = t.type === 'op' && (t.value === '-') && (!prev || prev.type === 'op' || prev.type === 'lparen')
      ? { type: 'op', value: 'u-' }
      : t;
  }
  while (ops.length) {
    const o = ops.pop()!;
    if (o.type === 'lparen') throw new Error('Mismatched parentheses.');
    output.push(o);
  }

  const stack: number[] = [];
  const toRad = (x: number) => (opts.degrees ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (opts.degrees ? (x * 180) / Math.PI : x);
  for (const t of output) {
    if (t.type === 'num') {
      stack.push(parseFloat(t.value));
    } else if (t.type === 'func') {
      const a = stack.pop();
      if (a === undefined) throw new Error('Invalid expression.');
      let r: number;
      if (['sin', 'cos', 'tan'].includes(t.value)) r = FUNCS[t.value](toRad(a));
      else if (['asin', 'acos', 'atan'].includes(t.value)) r = fromRad(FUNCS[t.value](a));
      else r = FUNCS[t.value](a);
      stack.push(r);
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
        case '/': stack.push(a / b); break;
        case '%': stack.push(a % b); break;
        case '^': stack.push(Math.pow(a, b)); break;
        default: throw new Error(`Unknown operator ${t.value}`);
      }
    }
  }
  if (stack.length !== 1) throw new Error('Invalid expression.');
  return stack[0];
}

// Greatest common divisor for the fraction calculator.
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
