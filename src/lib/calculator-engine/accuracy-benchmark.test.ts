import { describe, it, expect } from 'vitest';
import { getEngine } from './index';

describe('Phase 13: Standard Calculator Accuracy Benchmarks & Reference Solutions', () => {

  describe('Finance Engine Benchmarks', () => {
    it('Loan Calculator: $250,000 at 6% annual for 30 years', () => {
      const engine = getEngine('loan-calculator')!;
      const input = { amount: 250000, rate: 6, term: 30 };
      const res = engine.compute(input);
      const monthlyPayment = res.items.find((i) => i.key === 'monthlyPayment')?.value;
      const totalPayment = res.items.find((i) => i.key === 'totalPaid')?.value;
      const totalInterest = res.items.find((i) => i.key === 'totalInterest')?.value;

      // Standard PMT = 250000 * (0.005) / (1 - (1.005)^-360) = 1498.8763...
      expect(monthlyPayment).toBeCloseTo(1498.88, 2);
      expect(totalPayment).toBeCloseTo(539595.47, 2);
      expect(totalInterest).toBeCloseTo(289595.47, 2);
    });

    it('Compound Interest: $10,000 at 5% compounded monthly for 10 years', () => {
      const engine = getEngine('compound-interest-calculator')!;
      const input = { principal: 10000, rate: 5, years: 10, freq: 12, deposit: 0 };
      const res = engine.compute(input);
      const total = res.items.find((i) => i.key === 'futureBalance')?.value;

      // A = 10000 * (1 + 0.05/12)^(120) = 16470.0949...
      expect(total).toBeCloseTo(16470.09, 2);
    });

    it('APR Calculator: $10,000 loan with $300 fee at 5% over 3 years', () => {
      const engine = getEngine('apr-calculator')!;
      const input = { amount: 10000, rate: 5, term: 3, fees: 300 };
      const res = engine.compute(input);
      const apr = res.items.find((i) => i.key === 'apr')?.value;
      
      // Effective APR should be higher than nominal rate 5%
      expect(apr).toBeGreaterThan(5);
      expect(apr).toBeCloseTo(7.05, 1);
    });
  });

  describe('Health Engine Benchmarks', () => {
    it('BMI Calculator: Metric 70kg, 175cm', () => {
      const engine = getEngine('bmi-calculator')!;
      const input = { unitSystem: 'metric' as const, weightKg: 70, heightCm: 175, weightLbs: 154, heightFt: 5, heightIn: 9 };
      const res = engine.compute(input);
      const bmi = res.items.find((i) => i.key === 'bmi')?.value;
      const category = res.items.find((i) => i.key === 'category')?.enumKey;

      // 70 / (1.75)^2 = 22.85714...
      expect(bmi).toBeCloseTo(22.86, 2);
      expect(category).toBe('normal');
    });

    it('BMR Calculator: Mifflin-St Jeor 30yo Male, 80kg, 180cm', () => {
      const engine = getEngine('bmr-calculator')!;
      const input = { unitSystem: 'metric' as const, gender: 'male' as const, age: 30, weightKg: 80, heightCm: 180, weightLbs: 176, heightFt: 5, heightIn: 11, formula: 'mifflin' };
      const res = engine.compute(input);
      const bmr = res.items.find((i) => i.key === 'bmr')?.value;

      // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780 kcal
      expect(bmr).toBe(1780);
    });

    it('TDEE Calculator: Moderate Activity (1.55x) for 1780 BMR', () => {
      const engine = getEngine('tdee-calculator')!;
      const input = { unitSystem: 'metric' as const, sex: 'male' as const, age: 30, weightKg: 80, heightCm: 180, weightLbs: 176, heightFt: 5, heightIn: 11, activity: 1.55 };
      const res = engine.compute(input);
      const tdee = res.items.find((i) => i.key === 'tdee')?.value;

      // 1780 * 1.55 = 2759 kcal
      expect(tdee).toBeCloseTo(2759, 0);
    });
  });

  describe('Math Engine Benchmarks', () => {
    it('Quadratic Equation: x^2 - 5x + 6 = 0 (roots 2 and 3)', () => {
      const engine = getEngine('quadratic-calculator')!;
      const input = { a: 1, b: -5, c: 6 };
      const res = engine.compute(input);
      const x1 = res.items.find((i) => i.key === 'root1')?.value;
      const x2 = res.items.find((i) => i.key === 'root2')?.value;
      const disc = res.items.find((i) => i.key === 'discriminant')?.value;

      expect(disc).toBe(1);
      expect(x1).toBe(3);
      expect(x2).toBe(2);
    });

    it('Percentage Calculator: 15% of 200 is 30', () => {
      const engine = getEngine('percentage-calculator')!;
      const input = { mode: 'percentOf' as const, a: 15, b: 200 };
      const res = engine.compute(input);
      const result = res.items.find((i) => i.key === 'result')?.value;

      expect(result).toBe(30);
    });
  });

  describe('Date/Time Engine Benchmarks', () => {
    it('Date Difference: Jan 1, 2026 to Dec 31, 2026', () => {
      const engine = getEngine('date-difference-calculator')!;
      const input = { start: '2026-01-01', end: '2026-12-31' };
      const res = engine.compute(input);
      const days = res.items.find((i) => i.key === 'totalDays')?.value;

      expect(days).toBe(364);
    });
  });
});
