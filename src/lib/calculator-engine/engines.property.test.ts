import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { engines } from './index';

describe('Property-Based Formula Fuzzing (fast-check)', () => {
  engines.forEach((engine) => {
    describe(`Engine: ${engine.slug}`, () => {
      it(`property: [${engine.slug}] never throws unhandled errors on arbitrary input`, () => {
        const fields = engine.fields ? engine.fields() : [];
        // Generate arbitrary object with random types for each field
        const arbitraryInput: Record<string, fc.Arbitrary<any>> = {};

        fields.forEach((field) => {
          if (field.type === 'number') {
            arbitraryInput[field.name] = fc.oneof(
              fc.double({ noNaN: false, noDefaultInfinity: false }),
              fc.integer(),
              fc.float(),
              fc.string(),
              fc.constant(0),
              fc.constant(-1),
              fc.constant(NaN),
              fc.constant(Infinity),
              fc.constant(-Infinity)
            );
          } else if (field.type === 'radio' || field.type === 'select') {
            const options = field.options?.map((o) => o.value) || ['default'];
            arbitraryInput[field.name] = fc.oneof(
              fc.constantFrom(...options),
              fc.string(),
              fc.constant('')
            );
          } else {
            // Text/other fields receive raw DOM form values, which are always
            // strings. Fuzz with garbage strings — arbitrary objects/arrays are
            // impossible form submissions and crash engines on shape mismatch.
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
          fc.property(fc.record(arbitraryInput), (rawValues) => {
            try {
              const parsed = engine.parseInput ? engine.parseInput(rawValues) : rawValues;
              const validation = engine.validate(parsed);
              if (validation.valid) {
                const res = engine.compute(parsed);
                expect(res).toBeDefined();
                expect(Array.isArray(res.items)).toBe(true);

                // Ensure no numeric result item evaluates to NaN or Infinity
                res.items.forEach((item) => {
                  if (typeof item.value === 'number') {
                    expect(Number.isNaN(item.value)).toBe(false);
                    expect(Number.isFinite(item.value)).toBe(true);
                  }
                  if (item.range) {
                    expect(Number.isNaN(item.range.min)).toBe(false);
                    expect(Number.isFinite(item.range.min)).toBe(true);
                    expect(Number.isNaN(item.range.max)).toBe(false);
                    expect(Number.isFinite(item.range.max)).toBe(true);
                  }
                });

                if (res.charts) {
                  res.charts.forEach((chart) => {
                    if (chart.type === 'gauge') {
                      expect(Number.isNaN(chart.value)).toBe(false);
                      expect(Number.isFinite(chart.value)).toBe(true);
                    }
                  });
                }
              }
            } catch (err: any) {
              // Fail the test if an unhandled crash or stack overflow occurs
              throw new Error(`Engine ${engine.slug} threw error: ${err.message || err}`);
            }
          }),
          { numRuns: 100 }
        );
      });

      it(`property: [${engine.slug}] defaultInput produces valid computation with finite numbers`, () => {
        const defaultIn = engine.defaultInput();
        const validation = engine.validate(defaultIn);
        expect(validation.valid).toBe(true);

        const res = engine.compute(defaultIn);
        expect(res.items.length).toBeGreaterThan(0);

        res.items.forEach((item) => {
          if (typeof item.value === 'number') {
            expect(Number.isFinite(item.value)).toBe(true);
          }
        });
      });
    });
  });
});
