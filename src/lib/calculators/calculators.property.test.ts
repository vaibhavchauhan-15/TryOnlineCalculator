import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { allCalculators } from './index';

describe('Property-Based Calculator Fuzzing (allCalculators)', () => {
  allCalculators.forEach((calc) => {
    describe(`Calculator: ${calc.slug}`, () => {
      it(`property: [${calc.slug}] never throws unhandled errors on arbitrary input`, () => {
        const arbitraryInput: Record<string, fc.Arbitrary<any>> = {};

        calc.inputs.forEach((inputDef) => {
          if (inputDef.type === 'number') {
            arbitraryInput[inputDef.name] = fc.oneof(
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
          } else if (inputDef.type === 'select' || inputDef.type === 'radio') {
            const options = inputDef.options?.map((o) => o.value) || ['default'];
            arbitraryInput[inputDef.name] = fc.oneof(
              fc.constantFrom(...options),
              fc.string(),
              fc.constant('')
            );
          } else {
            // Text/other inputs receive raw DOM form values, which are always
            // strings. Fuzz with garbage strings — arbitrary objects/arrays are
            // impossible form submissions and crash calculators on shape mismatch.
            arbitraryInput[inputDef.name] = fc.oneof(
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
              const res = calc.compute(rawValues);
              expect(res).toBeDefined();
              expect(Array.isArray(res.results)).toBe(true);

              // If calculation succeeded without returning an error message:
              if (!res.error) {
                res.results.forEach((p) => {
                  expect(p.label).toBeDefined();
                  expect(p.value).toBeDefined();
                  expect(p.value).not.toContain('NaN');
                  expect(p.value).not.toContain('Infinity');
                });

                if (res.breakdown) {
                  res.breakdown.forEach((b) => {
                    expect(b.label).toBeDefined();
                    expect(b.value).toBeDefined();
                    expect(b.value).not.toContain('NaN');
                    expect(b.value).not.toContain('Infinity');
                  });
                }
              }
            } catch (err: any) {
              throw new Error(`Calculator ${calc.slug} threw error: ${err.message || err}`);
            }
          }),
          { numRuns: 100 }
        );
      });
    });
  });
});
