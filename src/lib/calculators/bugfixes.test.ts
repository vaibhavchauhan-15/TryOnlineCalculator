// Regression tests for the bug fixes applied during the comprehensive audit.
// Each group covers one fixed bug and tests the specific edge cases that
// previously produced incorrect results or crashes.

import { test, describe, expect } from 'vitest';
import { pmt, futureValue, solveRate } from './_math';
import { evaluate, gcd } from './_expr';
import { num } from '../format';

// =========================================================================
// Bug 1: pmt() edge cases — NaN/Infinity inputs, zero principal, extreme rates
// =========================================================================
describe('pmt() edge cases', () => {
  test('returns NaN when nper is 0', () => {
    expect(pmt(0.05, 0, 10000)).toBeNaN();
  });

  test('returns NaN when nper is negative', () => {
    expect(pmt(0.05, -12, 10000)).toBeNaN();
  });

  test('returns NaN for NaN inputs', () => {
    expect(pmt(NaN, 12, 10000)).toBeNaN();
    expect(pmt(0.05, NaN, 10000)).toBeNaN();
    expect(pmt(0.05, 12, NaN)).toBeNaN();
  });

  test('returns NaN for Infinity inputs', () => {
    expect(pmt(Infinity, 12, 10000)).toBeNaN();
    expect(pmt(0.05, Infinity, 10000)).toBeNaN();
    expect(pmt(0.05, 12, Infinity)).toBeNaN();
  });

  test('returns 0 when principal is 0', () => {
    expect(pmt(0.05, 12, 0)).toBe(0);
  });

  test('correctly handles 0% interest', () => {
    expect(pmt(0, 12, 12000)).toBe(1000);
  });

  test('correctly computes standard loan payment', () => {
    // $10,000 at 6% annual (0.5% monthly) for 60 months ≈ $193.33
    const payment = pmt(0.005, 60, 10000);
    expect(payment).toBeCloseTo(193.33, 1);
  });

  test('returns NaN for rate that causes non-finite intermediate', () => {
    // rate = -1 exactly makes (1+rate)^-n = 0^-n = Infinity, so factor is not finite
    expect(pmt(-1, 12, 10000)).toBeNaN();
  });
});

// =========================================================================
// Bug 2: futureValue() edge cases — NaN inputs, extreme growth
// =========================================================================
describe('futureValue() edge cases', () => {
  test('returns NaN for NaN inputs', () => {
    expect(futureValue(NaN, 12, 100, 1000)).toBeNaN();
    expect(futureValue(0.05, NaN, 100, 1000)).toBeNaN();
    expect(futureValue(0.05, 12, NaN, 1000)).toBeNaN();
    expect(futureValue(0.05, 12, 100, NaN)).toBeNaN();
  });

  test('returns NaN for Infinity inputs', () => {
    expect(futureValue(Infinity, 12, 100, 1000)).toBeNaN();
  });

  test('correctly handles 0% rate (simple sum)', () => {
    expect(futureValue(0, 12, 100, 1000)).toBe(2200); // 1000 + 100*12
  });

  test('correctly computes compound growth', () => {
    // $10,000 at 8% annual (0.667% monthly), no contributions, 10 years
    const fv = futureValue(0.08 / 12, 120, 0, 10000);
    expect(fv).toBeCloseTo(22196.4, 0);
  });
});

// =========================================================================
// Bug 3: solveRate() edge cases — degenerate inputs, convergence
// =========================================================================
describe('solveRate() edge cases', () => {
  test('returns NaN for non-positive nper', () => {
    expect(solveRate(0, 100, 1000)).toBeNaN();
    expect(solveRate(-12, 100, 1000)).toBeNaN();
  });

  test('returns NaN for non-positive payment', () => {
    expect(solveRate(12, 0, 1000)).toBeNaN();
    expect(solveRate(12, -100, 1000)).toBeNaN();
  });

  test('returns NaN for non-positive principal', () => {
    expect(solveRate(12, 100, 0)).toBeNaN();
    expect(solveRate(12, 100, -1000)).toBeNaN();
  });

  test('returns NaN for NaN inputs', () => {
    expect(solveRate(NaN, 100, 1000)).toBeNaN();
    expect(solveRate(12, NaN, 1000)).toBeNaN();
    expect(solveRate(12, 100, NaN)).toBeNaN();
  });

  test('converges for a standard loan', () => {
    // A $20,000 loan with $400/month over 60 months: rate should be ~0.77%/mo
    const rate = solveRate(60, 400, 20000);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(0.02);
    // Verify: pmt at that rate should reproduce ~$400
    const payment = pmt(rate, 60, 20000);
    expect(payment).toBeCloseTo(400, 0);
  });
});

// =========================================================================
// Bug 4: evaluate() division by zero — now throws instead of Infinity/NaN
// =========================================================================
describe('evaluate() division by zero', () => {
  test('division by zero throws an error', () => {
    expect(() => evaluate('1/0')).toThrow('Division by zero');
    expect(() => evaluate('10/0')).toThrow('Division by zero');
    expect(() => evaluate('0/0')).toThrow('Division by zero');
  });

  test('modulus by zero throws an error', () => {
    expect(() => evaluate('5%0')).toThrow('Division by zero');
    expect(() => evaluate('10%0')).toThrow('Division by zero');
  });

  test('division by non-zero still works', () => {
    expect(evaluate('10/2')).toBe(5);
    expect(evaluate('10/3')).toBeCloseTo(3.3333, 3);
  });

  test('modulus by non-zero still works', () => {
    expect(evaluate('10%3')).toBe(1);
    expect(evaluate('7%2')).toBe(1);
  });

  test('complex expression with zero divisor throws', () => {
    expect(() => evaluate('(2+3)/(5-5)')).toThrow('Division by zero');
  });
});

// =========================================================================
// Bug 5: gcd() — now handles float inputs by rounding
// =========================================================================
describe('gcd() with float inputs', () => {
  test('rounds float inputs to integers', () => {
    // gcd(1.5, 3) should behave as gcd(2, 3) = 1
    expect(gcd(1.5, 3)).toBe(1);
    // gcd(4.9, 3.1) should behave as gcd(5, 3) = 1
    expect(gcd(4.9, 3.1)).toBe(1);
  });

  test('still works correctly for integer inputs', () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(100, 25)).toBe(25);
    expect(gcd(7, 13)).toBe(1);
    expect(gcd(0, 5)).toBe(5);
  });

  test('handles negative inputs', () => {
    expect(gcd(-12, 8)).toBe(4);
    expect(gcd(12, -8)).toBe(4);
    expect(gcd(-12, -8)).toBe(4);
  });

  test('returns 1 when both are 0', () => {
    expect(gcd(0, 0)).toBe(1);
  });
});

// =========================================================================
// Bug 6: num() parser — rejects malformed input
// =========================================================================
describe('num() parser hardening', () => {
  test('rejects multiple decimal points', () => {
    expect(num('1.2.3', 0)).toBe(0);
    expect(num('..5', 0)).toBe(0);
    expect(num('1.2.3.4', 0)).toBe(0);
  });

  test('rejects multiple minus signs', () => {
    expect(num('--5', 0)).toBe(0);
    expect(num('---5', 0)).toBe(0);
  });

  test('rejects misplaced minus sign', () => {
    expect(num('5-3', 0)).toBe(0);
    expect(num('12-', 0)).toBe(0);
  });

  test('accepts valid negative numbers', () => {
    expect(num('-5', 0)).toBe(-5);
    expect(num('-3.14', 0)).toBe(-3.14);
  });

  test('accepts valid positive numbers', () => {
    expect(num('42', 0)).toBe(42);
    expect(num('3.14', 0)).toBe(3.14);
    expect(num('.5', 0)).toBe(0.5);
  });

  test('strips commas and currency symbols', () => {
    expect(num('$1,234.56', 0)).toBe(1234.56);
    expect(num('1,000,000', 0)).toBe(1000000);
  });

  test('handles scientific notation', () => {
    expect(num('1e5', 0)).toBe(100000);
    expect(num('1.5e-3', 0)).toBe(0.0015);
    expect(num('-2.5E10', 0)).toBe(-25000000000);
  });

  test('returns fallback for empty/whitespace', () => {
    expect(num('', 99)).toBe(99);
    expect(num(undefined, 99)).toBe(99);
    expect(num('   ', 99)).toBe(99);
  });

  test('handles number type input directly', () => {
    expect(num(42, 0)).toBe(42);
    expect(num(NaN, 0)).toBeNaN(); // number type passes through
    expect(num(Infinity, 0)).toBe(Infinity); // number type passes through
  });

  test('returns fallback for purely non-numeric strings', () => {
    expect(num('abc', 0)).toBe(0);
    expect(num('---', 0)).toBe(0);
  });
});
