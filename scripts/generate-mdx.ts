// English MDX generator (Task 10).
//
// Authors one src/content/calculators/en/<slug>.mdx per calculator by combining:
//   * the editorial content of the legacy Calculator object (title, description,
//     keywords, intro, formula, how-to, examples, FAQ, related, long-form
//     article), and
//   * the LABEL PACK the calculator's pure engine needs — discovered by
//     introspecting the engine's fields() + a default compute() (result keys,
//     enum keys, hint keys, chart titles) so the localization resolver has an
//     English string for every machine key the engine emits.
//
// English strings are the curated OVERRIDES where a key humanizes poorly (letter
// grades, unit shorthands, percentage modes), otherwise a humanized form of the
// key. The four hand-authored pilots are skipped so their quality is preserved.
//
// Run with:  npx vite-node scripts/generate-mdx.ts
// (vite-node resolves the project's extensionless TS imports.)

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { allCalculators } from '../src/lib/calculators/index.ts';
import { getEngine } from '../src/lib/calculator-engine/index.ts';
import { humanizeKey } from '../src/lib/i18n/resolver.ts';
import type { AnyEngine } from '../src/lib/calculator-engine/index.ts';
import type { EngineResult, ResultItem, EngineField } from '../src/lib/calculator-engine/contract.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'content', 'calculators', 'en');

// Pilots already have hand-authored MDX — never overwrite them.
const PILOTS = new Set(['bmi-calculator', 'percentage-calculator', 'mortgage-calculator', 'currency-converter']);

// --- Curated English for keys that humanize poorly -------------------------

const LETTERS: Record<string, string> = {
  aPlus: 'A+', a: 'A', aMinus: 'A-', bPlus: 'B+', b: 'B', bMinus: 'B-',
  cPlus: 'C+', c: 'C', cMinus: 'C-', dPlus: 'D+', d: 'D', dMinus: 'D-', f: 'F',
};
const STANDING: Record<string, string> = { low: 'Needs work', fair: 'Fair', good: 'Good', great: 'Excellent' };
const STATUS: Record<string, string> = {
  outOfReach: 'Out of reach', alreadySecured: 'Already secured', achievable: 'Achievable',
  easy: 'Comfortable', doable: 'Doable', hard: 'Challenging',
};
const OVERRIDES: Record<string, string> = {
  ...LETTERS, ...STANDING, ...STATUS,
  'op.add': 'Add', 'op.sub': 'Subtract', 'op.mul': 'Multiply', 'op.div': 'Divide',
  'mode.sip': 'Monthly SIP', 'mode.lumpsum': 'Lump sum',
  'mode.percentOf': 'What is X% of Y', 'mode.whatPercent': 'X is what percent of Y', 'mode.change': 'Percent change from X to Y',
  'type.compound': 'Compound', 'type.simple': 'Simple',
  'unit.mpg': 'MPG', 'unit.floz': 'fl oz', 'unit.litresPer100km': 'L/100km', 'unit.kmPerLitre': 'km/L',
  'unit.perGallon': 'per gallon', 'unit.perLitre': 'per litre', 'unit.kcalPerDay': 'kcal/day', 'unit.kcal': 'kcal',
  'unit.grams': 'g', 'unit.liters': 'liters', 'unit.cups': 'cups', 'unit.mi': 'mi', 'unit.km': 'km',
  'unit.gallon': 'gal', 'unit.litre': 'L',
  'unitSystem.us': 'US (imperial)', 'unitSystem.metric': 'Metric',
  'travel.oneWay': 'One way', 'travel.roundTrip': 'Round trip',
};

// Categorical enum keys some engines only emit for non-default inputs; force
// them into the pack so every category renders with a curated label.
const EXTRA_ENUMS: Record<string, string[]> = {
  'gpa-calculator': [...Object.keys(LETTERS), ...Object.keys(STANDING)],
  'grade-calculator': Object.keys(LETTERS),
  'final-grade-calculator': Object.keys(STATUS),
  'average-grade-calculator': Object.keys(LETTERS),
};

const englishFor = (key: string): string => OVERRIDES[key] ?? humanizeKey(key);

// --- Key collection from an engine -----------------------------------------

interface Buckets {
  labels: Set<string>;
  enums: Set<string>;
  hints: Set<string>;
  chartTitles: Set<string>;
}

function collectFromItems(items: ResultItem[] | undefined, b: Buckets): void {
  for (const it of items ?? []) {
    b.labels.add(it.key);
    if (it.enumKey) b.enums.add(it.enumKey);
    if (it.hintKey) b.hints.add(it.hintKey);
  }
}

function collectFields(fields: EngineField[], b: Buckets): void {
  for (const f of fields) {
    b.labels.add(f.labelKey);
    if (f.helpKey) b.hints.add(f.helpKey);
    for (const o of f.options ?? []) b.enums.add(o.labelKey);
  }
}

function collectFromResult(result: EngineResult, b: Buckets): void {
  collectFromItems(result.items, b);
  collectFromItems(result.breakdown, b);
  for (const c of result.charts ?? []) {
    if (c.titleKey) b.chartTitles.add(c.titleKey);
    for (const s of c.slices ?? []) b.labels.add(s.labelKey);
    for (const bar of c.bars ?? []) if (!/^\d+$/.test(bar.labelKey)) b.labels.add(bar.labelKey);
    for (const ser of c.series ?? []) b.labels.add(ser.labelKey);
    for (const seg of c.segments ?? []) b.enums.add(seg.labelKey);
    if (c.valueEnumKey) b.enums.add(c.valueEnumKey);
  }
}

function packFor(engine: AnyEngine): Buckets {
  const b: Buckets = { labels: new Set(), enums: new Set(), hints: new Set(), chartTitles: new Set() };
  if (engine.fields) collectFields(engine.fields(), b);
  try {
    collectFromResult(engine.compute(engine.defaultInput()), b);
  } catch {
    /* ignore — some engines need runtime data; fields still give most keys */
  }
  for (const k of EXTRA_ENUMS[engine.slug] ?? []) b.enums.add(k);
  return b;
}

// A machine key that is a unit word already covered by the shared UI pack
// should NOT be duplicated into a calculator's own labels (keeps packs lean).
const UI_UNITS = new Set(['kg', 'lb', 'cm', 'in', 'ft', 'months', 'years', '%', 'h', 'wk', 'min', 'people', 'kcal']);

function toRecord(keys: Set<string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of [...keys].sort()) {
    if (UI_UNITS.has(k)) continue;
    out[k] = englishFor(k);
  }
  return out;
}

// --- MDX serialization (JSON values are valid YAML) ------------------------

function line(key: string, value: unknown): string {
  return `${key}: ${JSON.stringify(value)}\n`;
}

function frontmatter(fields: Record<string, unknown>): string {
  let s = '';
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
    s += line(k, v);
  }
  return s;
}

function body(calc: any): string {
  // Prefer the legacy long-form article; fall back to intro/description.
  if (Array.isArray(calc.article) && calc.article.length) {
    return calc.article
      .map((sec: any) => `## ${sec.heading}\n\n${(sec.body ?? []).join('\n\n')}`)
      .join('\n\n');
  }
  return String(calc.intro ?? calc.description ?? '');
}

// --- Generate ---------------------------------------------------------------

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
let skipped = 0;
const missingEngine: string[] = [];

for (const calc of allCalculators) {
  if (PILOTS.has(calc.slug)) { skipped++; continue; }
  const engine = getEngine(calc.slug);
  if (!engine) { missingEngine.push(calc.slug); continue; }

  const b = packFor(engine);
  const labels = toRecord(b.labels);
  const enums = toRecord(b.enums);
  const hints = toRecord(b.hints);
  const chartTitles = toRecord(b.chartTitles);

  const fm = frontmatter({
    slug: calc.slug,
    category: calc.category,
    title: calc.title,
    description: calc.description,
    keywords: calc.keywords ?? [],
    calculatorVersion: 1,
    seoVersion: 1,
    translationVersion: 1,
    source: 'en',
    searchIntent: calc.intro ? undefined : undefined,
    labels,
    enums,
    hints,
    chartTitles,
    intro: calc.intro,
    formulaIntro: calc.formulaIntro,
    formulaItems: calc.formulaItems ?? [],
    howto: calc.howto ?? [],
    examples: calc.examples ?? [],
    faq: calc.faq ?? [],
    related: calc.related ?? [],
  });

  const mdx = `---\n${fm}---\n\n${body(calc)}\n`;
  writeFileSync(join(OUT_DIR, `${calc.slug}.mdx`), mdx, 'utf8');
  written++;
}

console.log(`MDX generated: ${written} written, ${skipped} pilots skipped.`);
if (missingEngine.length) console.log(`WARNING no engine for: ${missingEngine.join(', ')}`);
