// Reference conformance for the CalculatorEngine contract.
//
// This file is part of the type-checked source (not a test), so `astro check` /
// `tsc` prove two things at compile time:
//   1. A well-formed engine implements the contract (the positive case below).
//   2. Malformed shapes are rejected (the `@ts-expect-error` negative cases).
//
// It is intentionally tiny and imported by the runtime test to exercise
// validate()/compute() behaviour. It ships nothing meaningful to the client.

import type { CalculatorEngine, EngineResult } from './contract';
import { ok, fail } from './contract';

// --- A minimal, fully-conforming engine (positive conformance) -------------

export interface SumInput {
  a: number;
  b: number;
}

export interface SumResult extends EngineResult {}

export const sumReferenceEngine: CalculatorEngine<SumInput, SumResult> = {
  slug: 'reference-sum',
  category: 'math',
  defaultInput: () => ({ a: 0, b: 0 }),
  validate: (input) => {
    if (!Number.isFinite(input.a) || !Number.isFinite(input.b)) {
      return fail('operand.invalid');
    }
    return ok();
  },
  compute: (input) => ({
    // Raw value + enum key only — no localized "Sum" label, no formatting.
    items: [
      { key: 'sum', value: input.a + input.b, format: 'decimal', precision: 2, primary: true },
      { key: 'parity', enumKey: (input.a + input.b) % 2 === 0 ? 'even' : 'odd' },
    ],
  }),
  // Optional capability wired to prove the extension points type-check.
  history: (result) => ({ summary: result.items, primaryKey: 'sum' }),
};

// --- Negative conformance: these MUST fail to type-check --------------------
// Each `@ts-expect-error` asserts the following line is a compile error. If any
// shape below were wrongly accepted, `tsc` would flag the unused directive and
// the check would fail — so this doubles as a guard against contract drift.

// Missing required members (no defaultInput/validate/compute).
// @ts-expect-error - incomplete engine is not assignable to the contract
export const missingMembers: CalculatorEngine<SumInput, SumResult> = {
  slug: 'bad',
  category: 'math',
};

// A localized string leaking into a result item's value slot (must be number).
export const badResult: SumResult = {
  items: [
    // @ts-expect-error - result values are raw numbers, never localized strings
    { key: 'sum', value: 'twenty-two' },
  ],
};

// compute returning a bare string instead of the structured EngineResult.
export const badCompute: CalculatorEngine<SumInput, SumResult> = {
  slug: 'bad2',
  category: 'math',
  defaultInput: () => ({ a: 0, b: 0 }),
  validate: () => ok(),
  // @ts-expect-error - compute must return an EngineResult, not a string
  compute: () => 'result',
};
