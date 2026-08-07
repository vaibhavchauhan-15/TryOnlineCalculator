import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { engines } from './index';
import { pmt, futureValue, solveRate } from '../calculators/_math';
import { evaluate, gcd } from '../calculators/_expr';

describe('Phase 3: Property-Based Testing (fast-check 10,000+ Inputs)', () => {

  describe('Core Mathematical Helper Invariants', () => {
    it('property: pmt with rate=0 returns total / nper', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 1e7, noNaN: true }),
          fc.integer({ min: 1, max: 600 }),
          (pv, nper) => {
            const res = pmt(0, nper, pv);
            expect(res).toBeCloseTo(pv / nper, 5);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('property: futureValue with rate=0 returns pv + pmt * nper', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1e6, noNaN: true }),
          fc.double({ min: 0, max: 1e4, noNaN: true }),
          fc.integer({ min: 1, max: 360 }),
          (pv, pmtAmt, nper) => {
            const fv = futureValue(0, nper, pmtAmt, pv);
            expect(fv).toBeCloseTo(pv + pmtAmt * nper, 5);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('property: expression evaluator handles single numbers safely', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
          (val) => {
            const res = evaluate(val.toString());
            expect(Number.isFinite(res)).toBe(true);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('property: gcd(a, b) divides both a and b', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1e6 }),
          fc.integer({ min: 1, max: 1e6 }),
          (a, b) => {
            const g = gcd(a, b);
            expect(a % g).toBe(0);
            expect(b % g).toBe(0);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Engine Invariants Across All Calculator Engines', () => {
    engines.forEach((engine) => {
      it(`property: [${engine.slug}] random valid and invalid inputs never crash`, () => {
        const fields = engine.fields ? engine.fields() : [];
        const arbitraryInput: Record<string, fc.Arbitrary<any>> = {};

        fields.forEach((field) => {
          if (field.type === 'number') {
            arbitraryInput[field.name] = fc.oneof(
              fc.double({ noNaN: false, noDefaultInfinity: false }),
              fc.integer(),
              fc.constant(0),
              fc.constant(-1),
              fc.constant(NaN),
              fc.constant(Infinity),
              fc.constant(-Infinity),
              fc.constant('100'),
              fc.constant('invalid_text')
            );
          } else if (field.type === 'select' || field.type === 'radio') {
            const opts = field.options?.map((o) => o.value) ?? ['default'];
            arbitraryInput[field.name] = fc.oneof(
              fc.constantFrom(...opts),
              fc.string(),
              fc.constant('')
            );
          } else {
            // Text/other fields receive raw DOM form values, which are always
            // strings. Fuzz with garbage strings (empty, whitespace, long) —
            // arbitrary objects/arrays are impossible form submissions.
            arbitraryInput[field.name] = fc.oneof(
              fc.string(),
              fc.constant(''),
              fc.constant('   '),
              fc.constant('0'),
              fc.constant('-1'),
              fc.constant('invalid_text'),
              fc.constant('NaN'),
              fc.constant('Infinity')
            );
          }
        });

        fc.assert(
          fc.property(fc.record(arbitraryInput), (raw) => {
            try {
              const parsed = engine.parseInput ? engine.parseInput(raw) : raw;
              const validation = engine.validate(parsed);
              expect(typeof validation.valid).toBe('boolean');

              if (validation.valid) {
                const result = engine.compute(parsed);
                expect(result).toBeDefined();
                expect(Array.isArray(result.items)).toBe(true);

                result.items.forEach((item) => {
                  if (typeof item.value === 'number') {
                    expect(Number.isNaN(item.value)).toBe(false);
                    expect(Number.isFinite(item.value)).toBe(true);
                  }
                });
              }
            } catch (err: any) {
              throw new Error(`Engine ${engine.slug} failed on input ${JSON.stringify(raw)}: ${err.message}`);
            }
          }),
          { numRuns: 200 }
        );
      });
    });
  });
});
