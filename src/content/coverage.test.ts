// English MDX coverage + label-pack completeness (Task 10).
//
// These lock the "author all English MDX" guarantee:
//   1. Every registered engine has an English MDX document (so the localized
//      route builds a page for it), and every MDX document has an engine.
//   2. Every machine key an engine emits (field labels/options, result keys,
//      enum keys, hint keys, chart titles) is present in its MDX label pack OR
//      the shared UI pack — so the primary content never relies on the
//      humanization fallback to look presentable.
//   3. Every MDX document passes the frontmatter schema.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

import { engines, getEngine } from '../lib/calculator-engine';
import type { AnyEngine } from '../lib/calculator-engine';
import type { EngineResult, ResultItem } from '../lib/calculator-engine/contract';
import { validateFrontmatter } from './schema';
import enUi from './ui/en.json';

const EN_DIR = join(process.cwd(), 'src', 'content', 'calculators', 'en');
// currency-converter has an engine + MDX but no legacy Calculator; it is a
// first-class localized calculator, so it participates in coverage normally.

function readFrontmatter(slug: string): Record<string, any> {
  const raw = readFileSync(join(EN_DIR, `${slug}.mdx`), 'utf8');
  // Normalize CRLF (Windows) line endings so the frontmatter regex matches.
  const normalized = raw.replace(/\r\n/g, '\n');
  const m = normalized.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(m, `${slug}: has frontmatter`);
  return parse(m![1]) as Record<string, any>;
}

const mdxSlugs = readdirSync(EN_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''));

const UI_UNITS = new Set(Object.keys(enUi.units));

// --- Key collection (mirrors the generator) --------------------------------

function keysFromResult(result: EngineResult, out: { labels: Set<string>; enums: Set<string>; hints: Set<string>; titles: Set<string> }): void {
  const items = (arr: ResultItem[] | undefined) => {
    for (const it of arr ?? []) {
      out.labels.add(it.key);
      if (it.enumKey) out.enums.add(it.enumKey);
      if (it.hintKey) out.hints.add(it.hintKey);
    }
  };
  items(result.items);
  items(result.breakdown);
  for (const c of result.charts ?? []) {
    if (c.titleKey) out.titles.add(c.titleKey);
    for (const s of c.slices ?? []) out.labels.add(s.labelKey);
    for (const b of c.bars ?? []) if (!/^\d+$/.test(b.labelKey)) out.labels.add(b.labelKey);
    for (const ser of c.series ?? []) out.labels.add(ser.labelKey);
    for (const seg of c.segments ?? []) out.enums.add(seg.labelKey);
    if (c.valueEnumKey) out.enums.add(c.valueEnumKey);
  }
}

function engineKeys(engine: AnyEngine) {
  const out = { labels: new Set<string>(), enums: new Set<string>(), hints: new Set<string>(), titles: new Set<string>() };
  if (engine.fields) {
    for (const f of engine.fields()) {
      out.labels.add(f.labelKey);
      if (f.helpKey) out.hints.add(f.helpKey);
      for (const o of f.options ?? []) out.enums.add(o.labelKey);
    }
  }
  try {
    keysFromResult(engine.compute(engine.defaultInput()), out);
  } catch {
    /* runtime-dependent engine — fields cover most keys */
  }
  return out;
}

// --- Tests ------------------------------------------------------------------

test('every registered engine has an English MDX document', () => {
  const missing = engines.map((e) => e.slug).filter((s) => !mdxSlugs.includes(s));
  assert.deepEqual(missing, [], `engines missing MDX: ${missing.join(', ')}`);
});

test('every English MDX document has a registered engine', () => {
  const orphans = mdxSlugs.filter((s) => !getEngine(s));
  assert.deepEqual(orphans, [], `MDX without engine: ${orphans.join(', ')}`);
});

test('every MDX document passes the frontmatter schema', () => {
  for (const slug of mdxSlugs) {
    const fm = readFrontmatter(slug);
    const res = validateFrontmatter(fm);
    assert.equal(res.success, true, `${slug}: ${res.success ? '' : JSON.stringify(res.error.issues)}`);
  }
});

test('every engine key is covered by its MDX label pack or the UI units pack', () => {
  const gaps: string[] = [];
  for (const engine of engines) {
    const fm = readFrontmatter(engine.slug);
    const labels = new Set(Object.keys(fm.labels ?? {}));
    const enums = new Set(Object.keys(fm.enums ?? {}));
    const hints = new Set(Object.keys(fm.hints ?? {}));
    const titles = new Set(Object.keys(fm.chartTitles ?? {}));
    const k = engineKeys(engine);

    const check = (need: Set<string>, have: Set<string>, kind: string) => {
      for (const key of need) {
        if (have.has(key)) continue;
        if (UI_UNITS.has(key)) continue; // shared unit words live in the UI pack
        // Currency/ISO codes (USD, EUR, ZAR…) are locale-neutral and render
        // verbatim — they intentionally need no label-pack entry.
        if (/^[A-Z0-9]{2,6}$/.test(key)) continue;
        gaps.push(`${engine.slug} [${kind}] "${key}"`);
      }
    };
    // Labels/enums may live in either the labels or enums map (options vs items).
    const labelOrEnum = new Set([...labels, ...enums]);
    check(k.labels, labelOrEnum, 'label');
    check(k.enums, labelOrEnum, 'enum');
    check(k.hints, new Set([...hints, ...labels]), 'hint');
    check(k.titles, titles, 'chartTitle');
  }
  assert.deepEqual(gaps, [], `uncovered engine keys:\n${gaps.join('\n')}`);
});
