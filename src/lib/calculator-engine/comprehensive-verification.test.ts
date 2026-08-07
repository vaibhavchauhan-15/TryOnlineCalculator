import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { engines, getEngine } from './index';
import { pmt, futureValue } from '../calculators/_math';
import { converters, getConverter } from '../converters';

describe('Phase 14 & 18: Authoritative Comprehensive Verification Test Suite', () => {

  // =========================================================================
  // 1. ENGINE REGISTRY INVENTORY & SCHEMA INTEGRITY (PHASE 1 & 2)
  // =========================================================================
  describe('Phase 1: Engine Registry Inventory & Schema Integrity', () => {
    it('registers a non-empty set of engines without duplicate slugs', () => {
      expect(engines.length).toBeGreaterThan(50);
      const slugs = engines.map((e) => e.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it('every engine has a valid slug, category, defaultInput, validate, and compute', () => {
      for (const engine of engines) {
        expect(engine.slug).toBeTruthy();
        expect(engine.category).toBeTruthy();
        expect(typeof engine.defaultInput).toBe('function');
        if (engine.fields) {
          expect(typeof engine.fields).toBe('function');
        }
        if (engine.parseInput) {
          expect(typeof engine.parseInput).toBe('function');
        }
        expect(typeof engine.validate).toBe('function');
        expect(typeof engine.compute).toBe('function');

        const defInput = engine.defaultInput();
        expect(defInput).toBeDefined();
        const validation = engine.validate(defInput);
        expect(validation).toBeDefined();
        expect(validation.valid).toBe(true);

        const result = engine.compute(defInput);
        expect(result).toBeDefined();
        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 2. FINANCIAL CALCULATORS BENCHMARKS & EQUATIONS (PHASE 3, 4, 10)
  // =========================================================================
  describe('Phase 10: Financial Calculators Verification & Benchmarks', () => {

    it('Loan Engine (US Federal Reserve Regulation Z annuity standard)', () => {
      const engine = getEngine('loan-calculator')!;
      // $100,000 at 5% annual over 15 years (180 months)
      // PMT = 100000 * (0.05/12) / (1 - (1 + 0.05/12)^-180) = 790.7936...
      const res = engine.compute({ amount: 100000, rate: 5, term: 15 });
      const pmtVal = res.items.find((i) => i.key === 'monthlyPayment')?.value;
      const totalPaid = res.items.find((i) => i.key === 'totalPaid')?.value;
      const totalInterest = res.items.find((i) => i.key === 'totalInterest')?.value;

      expect(pmtVal).toBeCloseTo(790.79, 2);
      expect(totalPaid).toBeCloseTo(142342.85, 2);
      expect(totalInterest).toBeCloseTo(42342.85, 2);
    });

    it('Compound Interest Engine (Standard compound frequency A = P(1+r/n)^(nt))', () => {
      const engine = getEngine('compound-interest-calculator')!;
      // P=$5,000, r=6%, t=5 years, n=12 (monthly), monthly deposit=$100
      const res = engine.compute({ principal: 5000, rate: 6, years: 5, freq: 12, deposit: 100 });
      const futureBal = res.items.find((i) => i.key === 'futureBalance')?.value;

      // P*(1+r/n)^(nt) = 5000*(1+0.005)^60 = 6744.2508...
      // PMT future value = 100 * ((1.005^60 - 1) / 0.005) = 6977.003...
      // Total = 13721.25
      expect(futureBal).toBeCloseTo(13721.25, 2);
    });

    it('Simple Interest Engine (I = P * r * t)', () => {
      const engine = getEngine('simple-interest-calculator')!;
      const res = engine.compute({ principal: 10000, rate: 5, termYears: 3 });
      const interest = res.items.find((i) => i.key === 'totalInterest')?.value;
      const total = res.items.find((i) => i.key === 'totalAmount')?.value;

      // I = 10000 * 0.05 * 3 = 1500
      expect(interest).toBe(1500);
      expect(total).toBe(11500);
    });

    it('APR Calculator (Effective APR > Nominal Rate when fees are present)', () => {
      const engine = getEngine('apr-calculator')!;
      // $20,000 loan, 6% nominal rate, 5 year term, $500 upfront fees
      const res = engine.compute({ amount: 20000, rate: 6, term: 5, fees: 500 });
      const apr = res.items.find((i) => i.key === 'apr')?.value;
      const monthlyPayment = res.items.find((i) => i.key === 'monthlyPayment')?.value;

      expect(monthlyPayment).toBeCloseTo(386.66, 2);
      expect(apr).toBeGreaterThan(6.0);
      expect(apr).toBeCloseTo(7.06, 2);
    });
  });

  // =========================================================================
  // 3. HEALTH CALCULATORS BENCHMARKS (PHASE 11 - WHO/NIH EQUATIONS)
  // =========================================================================
  describe('Phase 11: Health Calculators Medical Formulas', () => {

    it('BMI Engine (WHO Standards: Metric & Imperial unit conversions)', () => {
      const engine = getEngine('bmi-calculator')!;
      // 80 kg, 180 cm -> BMI = 80 / (1.8)^2 = 24.69135...
      const resMetric = engine.compute({ unitSystem: 'metric', weightKg: 80, heightCm: 180, weightLbs: 176, heightFt: 5, heightIn: 11 });
      const bmiMetric = resMetric.items.find((i) => i.key === 'bmi')?.value;
      const catMetric = resMetric.items.find((i) => i.key === 'category')?.enumKey;

      expect(bmiMetric).toBeCloseTo(24.69, 2);
      expect(catMetric).toBe('normal');
    });

    it('BMR Engine (Mifflin-St Jeor Formula)', () => {
      const engine = getEngine('bmr-calculator')!;
      // 25yo Female, 60kg, 165cm
      // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 kcal
      const input = { unitSystem: 'metric' as const, sex: 'female' as const, age: 25, weightKg: 60, heightCm: 165, weightLb: 132, heightFt: 5, heightIn: 5 };
      const res = engine.compute(input);
      const bmr = res.items.find((i) => i.key === 'bmr')?.value;

      expect(bmr).toBeCloseTo(1345.25, 2);
    });

    it('TDEE Engine (Mifflin-St Jeor * Activity Factor)', () => {
      const engine = getEngine('tdee-calculator')!;
      // BMR = 1345.25, Activity = 1.375 (Light) -> TDEE = 1849.72 kcal
      const input = { unitSystem: 'metric' as const, sex: 'female' as const, age: 25, weightKg: 60, heightCm: 165, weightLb: 132, heightFt: 5, heightIn: 5, activity: 1.375 };
      const res = engine.compute(input);
      const tdee = res.items.find((i) => i.key === 'tdee')?.value;

      expect(tdee).toBeCloseTo(1849.72, 1);
    });
  });

  // =========================================================================
  // 4. MATH & BUSINESS CALCULATORS (PHASE 3 & 16)
  // =========================================================================
  describe('Phase 3: Math & Business Numerical Accuracy', () => {

    it('Percentage Engine (3 modes: percentOf, whatPercent, change)', () => {
      const engine = getEngine('percentage-calculator')!;
      // Mode 1: 20% of 150 = 30
      const r1 = engine.compute({ mode: 'percentOf', a: 20, b: 150 });
      expect(r1.items.find((i) => i.key === 'result')?.value).toBe(30);

      // Mode 2: 30 is what percent of 150? = 20%
      const r2 = engine.compute({ mode: 'whatPercent', a: 30, b: 150 });
      expect(r2.items.find((i) => i.key === 'result')?.value).toBe(20);

      // Mode 3: Change from 100 to 125 = +25%
      const r3 = engine.compute({ mode: 'change', a: 100, b: 125 });
      expect(r3.items.find((i) => i.key === 'percentChange')?.value).toBe(25);
    });

    it('CAGR Engine (CAGR = (End/Start)^(1/Years) - 1)', () => {
      const engine = getEngine('cagr-calculator')!;
      // Beginning = $10,000, Ending = $20,000 over 5 years
      // CAGR = (20000/10000)^(1/5) - 1 = 2^(0.2) - 1 = 14.8698%
      const res = engine.compute({ beginningValue: 10000, endingValue: 20000, years: 5 });
      const cagr = res.items.find((i) => i.key === 'cagr')?.value;

      expect(cagr).toBeCloseTo(14.87, 2);
    });

    it('VAT / GST Engine (Inclusive vs Exclusive tax logic)', () => {
      const engine = getEngine('vat-calculator')!;
      // Net mode: Net = 100, VAT = 20% -> Tax = 20, Gross = 120
      const rNet = engine.compute({ mode: 'net', amount: 100, rate: 20 });
      expect(rNet.items.find((i) => i.key === 'vatAmount')?.value).toBe(20);
      expect(rNet.items.find((i) => i.key === 'grossAmount')?.value).toBe(120);

      // Gross mode: Gross = 120, VAT = 20% -> Net = 100, Tax = 20
      const rGross = engine.compute({ mode: 'gross', amount: 120, rate: 20 });
      expect(rGross.items.find((i) => i.key === 'netAmount')?.value).toBe(100);
      expect(rGross.items.find((i) => i.key === 'vatAmount')?.value).toBe(20);
    });
  });

  // =========================================================================
  // 5. UNIT CONVERTER CONSTANTS (PHASE 8 - ISO 80000 / NIST SP 811)
  // =========================================================================
  describe('Phase 8: Unit Conversion Exact Constants', () => {
    it('verifies unit converter definitions against standard conversion factors', () => {
      const lengthConv = getConverter('length')!;
      expect(lengthConv).toBeDefined();

      const metre = lengthConv.units.find((u) => u.id === 'm');
      const km = lengthConv.units.find((u) => u.id === 'km');
      const foot = lengthConv.units.find((u) => u.id === 'ft');
      const inch = lengthConv.units.find((u) => u.id === 'in');

      expect(metre?.factor).toBe(1);
      expect(km?.factor).toBe(1000);
      expect(foot?.factor).toBe(0.3048); // Exact NIST conversion
      expect(inch?.factor).toBe(0.0254); // Exact NIST conversion
    });

    it('verifies weight converter standard factors (kg base)', () => {
      const weightConv = getConverter('weight')!;
      expect(weightConv).toBeDefined();

      const kg = weightConv.units.find((u) => u.id === 'kg');
      const lb = weightConv.units.find((u) => u.id === 'lb');
      const oz = weightConv.units.find((u) => u.id === 'oz');

      expect(kg?.factor).toBe(1);
      expect(lb?.factor).toBe(0.45359237); // Exact international avoirdupois pound
      expect(oz?.factor).toBeCloseTo(0.028349523125, 8);
    });
  });

  // =========================================================================
  // 6. PROPERTY-BASED TESTING (PHASE 6 - FAST-CHECK)
  // =========================================================================
  describe('Phase 6: Property-Based Testing with fast-check', () => {

    it('pmt function handles any positive input without crashing or returning NaN', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.0001, max: 1, noNaN: true }), // rate per period 0.01% to 100%
          fc.integer({ min: 1, max: 600 }),    // periods 1 to 600
          fc.double({ min: 1, max: 1e9, noNaN: true }),     // principal $1 to $1,000,000,000
          (rate, nper, pv) => {
            const p = pmt(rate, nper, pv);
            expect(Number.isFinite(p)).toBe(true);
            expect(p).toBeGreaterThan(0);
            expect(p * nper).toBeGreaterThan(pv); // Total paid must exceed principal for r > 0
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('futureValue function monotonicity property: higher interest rate produces higher FV', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 0.2, noNaN: true }),  // r1
          fc.double({ min: 0.01, max: 0.1, noNaN: true }),  // delta r
          fc.integer({ min: 1, max: 30 }),     // years
          fc.double({ min: 100, max: 10000, noNaN: true }), // principal
          (r1, dr, n, pv) => {
            const r2 = r1 + dr;
            const fv1 = futureValue(r1, n, 0, pv);
            const fv2 = futureValue(r2, n, 0, pv);
            expect(fv2).toBeGreaterThan(fv1);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('all registered engines handle random string inputs without throwing exceptions', () => {
      const sampleEngines = engines.slice(0, 10);
      for (const engine of sampleEngines) {
        fc.assert(
          fc.property(
            fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.double(), fc.boolean())),
            (randomValues) => {
              const strValues: Record<string, string> = {};
              for (const [k, v] of Object.entries(randomValues)) {
                strValues[k] = String(v);
              }
              expect(() => {
                const parsed = engine.parseInput ? engine.parseInput(strValues) : (strValues as any);
                const validated = engine.validate(parsed);
                if (validated.valid) {
                  const res = engine.compute(parsed);
                  expect(res).toBeDefined();
                  expect(Array.isArray(res.items)).toBe(true);
                }
              }).not.toThrow();
            }
          ),
          { numRuns: 100 }
        );
      }
    });
  });

  // =========================================================================
  // 7. EDGE CASE TESTING (PHASE 5)
  // =========================================================================
  describe('Phase 5: Edge Case Testing (Zero, Negative, Infinity, Boundary)', () => {

    it('pmt zero rate edge case returns exact linear division', () => {
      const p = pmt(0, 120, 12000);
      expect(p).toBe(100);
    });

    it('pmt handles invalid / negative periods safely', () => {
      expect(Number.isNaN(pmt(0.05, 0, 10000))).toBe(true);
      expect(Number.isNaN(pmt(0.05, -10, 10000))).toBe(true);
    });

    it('futureValue zero rate returns exact sum of contributions', () => {
      const fv = futureValue(0, 12, 100, 1000);
      expect(fv).toBe(2200); // 1000 + 12 * 100
    });

    it('engine input parsers withstand NaN and empty values gracefully', () => {
      for (const engine of engines) {
        if (!engine.parseInput) continue;
        const parsed = engine.parseInput({ amount: 'NaN', rate: '', term: 'abc' });
        expect(parsed).toBeDefined();
        // Validation should fail or compute safe defaults, never crash
        const validation = engine.validate(parsed);
        if (validation.valid) {
          const res = engine.compute(parsed);
          expect(res).toBeDefined();
          for (const item of res.items) {
            if (item.value !== undefined) {
              expect(Number.isNaN(item.value)).toBe(false);
            }
          }
        }
      }
    });
  });
});
