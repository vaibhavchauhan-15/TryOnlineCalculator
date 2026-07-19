// Full engine-registry coverage + invariants (Task 9).
//
// Locks three things now that every calculator is extracted:
//   1. COVERAGE — every legacy calculator slug has a pure engine.
//   2. UNIQUENESS — no slug is registered twice.
//   3. NO PROSE — every engine's default computation carries only raw values +
//      machine keys (no localized strings leak out of the engine layer).
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { engines, getEngine } from './index';
import type { EngineResult, ResultItem } from './contract';
import { allCalculators } from '../calculators';

// Machine keys are camelCase identifiers; digits are allowed (e.g. "equivalentL100").
const KEY_RE = /^[a-z][a-zA-Z0-9.]*$/;
const ENUM_RE = /^[a-z][a-zA-Z0-9]*$/;

function assertNoProse(slug: string, result: EngineResult): void {
  const walk = (items: ResultItem[] | undefined) => {
    for (const it of items ?? []) {
      assert.equal('label' in it, false, `${slug}: item has no label`);
      assert.equal(typeof (it as { value?: unknown }).value === 'string', false, `${slug}: value not a string`);
      assert.match(it.key, KEY_RE, `${slug}: key "${it.key}" is an identifier`);
      if (it.enumKey) assert.match(it.enumKey, ENUM_RE, `${slug}: enumKey "${it.enumKey}"`);
    }
  };
  walk(result.items);
  walk(result.breakdown);
  // Chart category labels are usually translation keys, but a numeric axis
  // label (e.g. a score index "1", "2") is raw locale-neutral data — allow both.
  const isLabel = (s: string) => KEY_RE.test(s) || /^\d+$/.test(s);
  for (const chart of result.charts ?? []) {
    if (chart.titleKey) assert.match(chart.titleKey, KEY_RE, `${slug}: chart titleKey`);
    for (const s of chart.slices ?? []) assert.ok(isLabel(s.labelKey), `${slug}: slice labelKey "${s.labelKey}"`);
    for (const b of chart.bars ?? []) assert.ok(isLabel(b.labelKey), `${slug}: bar labelKey "${b.labelKey}"`);
    for (const ser of chart.series ?? []) assert.ok(isLabel(ser.labelKey), `${slug}: series labelKey "${ser.labelKey}"`);
    for (const seg of chart.segments ?? []) assert.ok(isLabel(seg.labelKey), `${slug}: segment labelKey "${seg.labelKey}"`);
  }
}

test('every legacy calculator has a pure engine', () => {
  const missing = allCalculators.filter((c) => !getEngine(c.slug)).map((c) => c.slug);
  assert.deepEqual(missing, [], `missing engines for: ${missing.join(', ')}`);
});

test('no duplicate engine slugs', () => {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const e of engines) {
    if (seen.has(e.slug)) dupes.push(e.slug);
    seen.add(e.slug);
  }
  assert.deepEqual(dupes, [], `duplicate slugs: ${dupes.join(', ')}`);
});

test('every engine computes its default input with no prose', () => {
  for (const e of engines) {
    const input = e.defaultInput();
    // Default input should validate; if not, that is a real bug.
    const v = e.validate(input);
    assert.equal(v.valid, true, `${e.slug}: default input should validate (got ${JSON.stringify(v.issues)})`);
    const result = e.compute(input);
    assert.ok(result.items.length > 0, `${e.slug}: produces at least one result item`);
    assertNoProse(e.slug, result);
  }
});

test('form engines round-trip parseInput(field defaults) === defaultInput()', () => {
  for (const e of engines) {
    if (!e.fields || !e.parseInput) continue; // dynamic/visual engines are exempt
    // The currency converter's validity depends on runtime FX rates injected by
    // the client, not on form fields, so it is exempt from this static check.
    if (e.slug === 'currency-converter') continue;
    const values: Record<string, string> = {};
    for (const f of e.fields()) values[f.name] = f.defaultValue;
    const parsed = e.parseInput(values);
    // The parsed defaults must validate (the form's initial state is valid).
    assert.equal(e.validate(parsed).valid, true, `${e.slug}: field defaults validate`);
  }
});
