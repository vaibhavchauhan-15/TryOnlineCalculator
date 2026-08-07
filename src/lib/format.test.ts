import { describe, test, expect } from 'vitest';
import { num, currency, number, percent, fixed, plural } from './format';

describe('format.ts helpers', () => {
  describe('num()', () => {
    test('returns number as is', () => {
      expect(num(42)).toBe(42);
      expect(num(0)).toBe(0);
      expect(num(-15.5)).toBe(-15.5);
    });

    test('returns fallback for empty, undefined, or null', () => {
      expect(Number.isNaN(num(undefined))).toBe(true);
      expect(num(undefined, 0)).toBe(0);
      expect(num('', 99)).toBe(99);
      expect(num(null as any, 10)).toBe(10);
    });

    test('cleans string inputs with currency or commas', () => {
      expect(num('$1,234.56')).toBe(1234.56);
      expect(num('  -10.5 ')).toBe(-10.5);
      expect(num('1e3')).toBe(1000);
    });

    test('rejects malformed numbers', () => {
      expect(num('1.2.3', 0)).toBe(0);
      expect(num('--5', 0)).toBe(0);
      expect(num('5-5', 0)).toBe(0);
      expect(num('abc', -1)).toBe(-1);
    });
  });

  describe('currency()', () => {
    test('formats currency using formatCurrency', () => {
      const res = currency(100);
      expect(typeof res).toBe('string');
      expect(res).toContain('100');
    });

    test('accepts decimals option', () => {
      const res = currency(10.1234, { decimals: 3 });
      expect(typeof res).toBe('string');
    });
  });

  describe('number()', () => {
    test('formats numbers with en-US locale', () => {
      expect(number(1234567.89)).toBe('1,234,567.89');
      expect(number(100, 0)).toBe('100');
    });

    test('returns dash for non-finite values', () => {
      expect(number(NaN)).toBe('—');
      expect(number(Infinity)).toBe('—');
    });
  });

  describe('percent()', () => {
    test('formats percentages with % sign', () => {
      expect(percent(12.5)).toBe('12.5%');
    });

    test('returns dash for non-finite values', () => {
      expect(percent(NaN)).toBe('—');
    });
  });

  describe('fixed()', () => {
    test('formats to fixed decimal places', () => {
      expect(fixed(3.14159, 2)).toBe('3.14');
      expect(fixed(3, 2)).toBe('3.00');
    });

    test('returns dash for non-finite values', () => {
      expect(fixed(Infinity)).toBe('—');
    });
  });

  describe('plural()', () => {
    test('pluralizes single and multiple items', () => {
      expect(plural(1, 'apple', 'apples')).toBe('apple');
      expect(plural(2, 'apple', 'apples')).toBe('apples');
      expect(plural(0, 'apple', 'apples')).toBe('apples');
      expect(plural(-1, 'apple', 'apples')).toBe('apple');
      expect(plural(5, 'category')).toBe('categorys');
    });
  });
});
