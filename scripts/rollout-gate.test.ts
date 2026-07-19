// Rollout gate tests (Task 15): every threshold must gate correctly, a missing
// locale blocks, a clean cohort clears, and the next wave is registry-driven.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { evaluateLocale, evaluateGate, nextWaveLocales, type LocaleMetrics } from './rollout-gate.ts';

const good: LocaleMetrics = { indexedPct: 98, hreflangErrors: 0, duplicatePages: 0, cwvPassPct: 97, ctrTrendPct: 1.2, crawlAnomalies: 0 };

test('a healthy locale passes every threshold', () => {
  assert.equal(evaluateLocale('de', good).pass, true);
});

test('each threshold breach fails the locale', () => {
  assert.ok(evaluateLocale('de', { ...good, indexedPct: 94 }).failures.some((f) => /indexed/.test(f)));
  assert.ok(evaluateLocale('de', { ...good, hreflangErrors: 1 }).failures.some((f) => /hreflang/.test(f)));
  assert.ok(evaluateLocale('de', { ...good, duplicatePages: 3 }).failures.some((f) => /duplicate/.test(f)));
  assert.ok(evaluateLocale('de', { ...good, cwvPassPct: 95 }).failures.some((f) => /CWV/.test(f))); // must be > 95
  assert.ok(evaluateLocale('de', { ...good, ctrTrendPct: -0.5 }).failures.some((f) => /CTR/.test(f)));
  assert.ok(evaluateLocale('de', { ...good, crawlAnomalies: 2 }).failures.some((f) => /crawl/.test(f)));
});

test('CWV boundary: exactly 95% fails (threshold is strictly greater)', () => {
  assert.equal(evaluateLocale('de', { ...good, cwvPassPct: 95 }).pass, false);
  assert.equal(evaluateLocale('de', { ...good, cwvPassPct: 95.1 }).pass, true);
});

test('gate passes only when all live locales are present and pass', () => {
  const metrics = { en: good, de: good, hi: good, es: good };
  const res = evaluateGate(metrics, ['en', 'de', 'hi', 'es']);
  assert.equal(res.pass, true);
  assert.deepEqual(res.missing, []);
});

test('a missing locale blocks the gate', () => {
  const res = evaluateGate({ en: good, de: good, hi: good }, ['en', 'de', 'hi', 'es']);
  assert.equal(res.pass, false);
  assert.deepEqual(res.missing, ['es']);
});

test('one failing locale blocks the whole cohort', () => {
  const res = evaluateGate({ en: good, de: { ...good, indexedPct: 80 }, hi: good, es: good }, ['en', 'de', 'hi', 'es']);
  assert.equal(res.pass, false);
  assert.ok(res.verdicts.find((v) => v.locale === 'de')!.pass === false);
});

test('next wave is the set of defined-but-disabled locales', () => {
  const wave = nextWaveLocales().map((w) => w.code);
  // From the registry: fr/pt/ja/it/nl are defined with enabled:false.
  assert.ok(wave.includes('fr'));
  assert.ok(wave.includes('ja'));
  // Live locales must NOT be in the next wave.
  assert.ok(!wave.includes('en') && !wave.includes('de'));
});
