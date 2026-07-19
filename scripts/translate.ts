// AI localization CLI (Task 11).
//
// Localizes the English calculator MDX into every target locale via a PLUGGABLE
// translator (scripts/lib/translator.ts). It:
//   * translates only the translatable fields (title/description/keywords/intro/
//     formula intro/how-to/examples/FAQ + the label pack values + body prose),
//   * PRESERVES everything that must never change: slug, category, versions,
//     formula expressions, related-slug lists, {placeholders}, numbers and
//     do-not-translate terms (BMI, GPA, APR, currency codes…),
//   * STAMPS provenance: source="en", translatedFromVersion, model, and copies
//     the per-facet versions so the staleness detector can compare later.
//
// Usage:
//   npx vite-node scripts/translate.ts                 # generate all enabled non-en locales
//   npx vite-node scripts/translate.ts --locales de,es # only these
//   npx vite-node scripts/translate.ts --check         # report stale/missing, write nothing
//
// The shipped translator is offline + deterministic (glossary-driven), so this
// runs and is verifiable with no network/model. Swap in an LLM adapter (same
// Translator interface) for production-quality prose.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

import { DictionaryTranslator, type Translator, type Glossary } from './lib/translator.ts';
import { enabledLocales, DEFAULT_LOCALE } from '../src/lib/i18n/locales.ts';

import deGloss from './lib/glossary/de.json' with { type: 'json' };
import esGloss from './lib/glossary/es.json' with { type: 'json' };
import hiGloss from './lib/glossary/hi.json' with { type: 'json' };

const CONTENT_DIR = join(process.cwd(), 'src', 'content', 'calculators');
const EN_DIR = join(CONTENT_DIR, DEFAULT_LOCALE);

const GLOSSARIES: Record<string, Glossary> = {
  de: deGloss as Glossary,
  es: esGloss as Glossary,
  hi: hiGloss as Glossary,
};

// ---------------------------------------------------------------------------
// MDX read / write
// ---------------------------------------------------------------------------

interface Doc {
  fm: Record<string, any>;
  body: string;
}

function readDoc(dir: string, slug: string): Doc | null {
  const path = join(dir, `${slug}.mdx`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  return { fm: (parse(m[1]) as Record<string, any>) ?? {}, body: m[2].trim() };
}

// Frontmatter key order for readable, stable output.
const FM_ORDER = [
  'slug', 'category', 'title', 'description', 'keywords',
  'calculatorVersion', 'seoVersion', 'translationVersion',
  'source', 'translatedFromVersion', 'model', 'lastReviewed',
  'searchIntent', 'readingLevel', 'market', 'audience',
  'labels', 'enums', 'hints', 'chartTitles',
  'intro', 'formulaIntro', 'formulaItems', 'howto', 'examples', 'faq', 'related',
];

function serialize(doc: Doc): string {
  const keys = [...FM_ORDER, ...Object.keys(doc.fm).filter((k) => !FM_ORDER.includes(k))];
  let fm = '';
  for (const k of keys) {
    const v = doc.fm[k];
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
    fm += `${k}: ${JSON.stringify(v)}\n`;
  }
  return `---\n${fm}---\n\n${doc.body}\n`;
}

// ---------------------------------------------------------------------------
// Translatable-string extraction + application (pure, testable)
// ---------------------------------------------------------------------------

/** Collect every translatable string from a document (order-stable, de-duped). */
export function translatableStrings(doc: Doc): string[] {
  const set = new Set<string>();
  const add = (s: unknown) => { if (typeof s === 'string' && s.trim()) set.add(s); };

  add(doc.fm.title);
  add(doc.fm.description);
  add(doc.fm.intro);
  add(doc.fm.formulaIntro);
  for (const k of doc.fm.keywords ?? []) add(k);
  for (const s of doc.fm.howto ?? []) add(s);
  for (const e of doc.fm.examples ?? []) { add(e.title); add(e.body); }
  for (const f of doc.fm.faq ?? []) { add(f.q); add(f.a); }
  for (const f of doc.fm.formulaItems ?? []) { add(f.name); add(f.desc); } // NB: NOT f.expr
  for (const map of ['labels', 'enums', 'hints', 'chartTitles'] as const) {
    for (const v of Object.values(doc.fm[map] ?? {})) add(v);
  }
  for (const para of doc.body.split(/\n{2,}/)) add(para);
  return [...set];
}

const mapStr = (m: Map<string, string>, s: unknown): any => (typeof s === 'string' ? (m.get(s) ?? s) : s);
const mapObj = (m: Map<string, string>, o: Record<string, string> | undefined) => {
  if (!o) return o;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) out[k] = m.get(v) ?? v;
  return out;
};

/**
 * Produce the localized document: apply the translation map to every
 * translatable field, preserve the protected ones, and stamp provenance.
 */
export function applyTranslations(en: Doc, m: Map<string, string>, locale: string, model: string): Doc {
  const fm: Record<string, any> = { ...en.fm };

  fm.title = mapStr(m, en.fm.title);
  fm.description = mapStr(m, en.fm.description);
  if (en.fm.intro) fm.intro = mapStr(m, en.fm.intro);
  if (en.fm.formulaIntro) fm.formulaIntro = mapStr(m, en.fm.formulaIntro);
  fm.keywords = (en.fm.keywords ?? []).map((k: string) => mapStr(m, k));
  fm.howto = (en.fm.howto ?? []).map((s: string) => mapStr(m, s));
  fm.examples = (en.fm.examples ?? []).map((e: any) => ({ title: mapStr(m, e.title), body: mapStr(m, e.body) }));
  fm.faq = (en.fm.faq ?? []).map((f: any) => ({ q: mapStr(m, f.q), a: mapStr(m, f.a) }));
  // Formula NAME is translated; the EXPRESSION is preserved verbatim.
  fm.formulaItems = (en.fm.formulaItems ?? []).map((f: any) => ({
    name: mapStr(m, f.name), expr: f.expr, ...(f.desc ? { desc: mapStr(m, f.desc) } : {}),
  }));
  fm.labels = mapObj(m, en.fm.labels);
  fm.enums = mapObj(m, en.fm.enums);
  fm.hints = mapObj(m, en.fm.hints);
  fm.chartTitles = mapObj(m, en.fm.chartTitles);

  // Provenance / versioning.
  fm.source = DEFAULT_LOCALE;
  fm.translatedFromVersion = en.fm.translationVersion;
  fm.model = model;
  delete fm.lastReviewed; // machine draft — awaits human review

  const body = en.body.split(/\n{2,}/).map((p) => mapStr(m, p)).join('\n\n');
  return { fm, body };
}

// ---------------------------------------------------------------------------
// Staleness detection (pure, testable)
// ---------------------------------------------------------------------------

export interface Staleness {
  stale: boolean;
  reasons: string[];
}

/**
 * A translation is stale when the English content it was translated from has
 * advanced past what this document recorded. Compares the per-facet versions
 * so a maths-only bump, a copy bump or an SEO bump each flags correctly.
 */
export function checkStaleness(enFm: Record<string, any>, targetFm: Record<string, any>): Staleness {
  const reasons: string[] = [];
  if ((targetFm.translatedFromVersion ?? 0) < (enFm.translationVersion ?? 0)) {
    reasons.push(`content: translatedFrom v${targetFm.translatedFromVersion} < en v${enFm.translationVersion}`);
  }
  if ((targetFm.seoVersion ?? 0) < (enFm.seoVersion ?? 0)) {
    reasons.push(`seo: v${targetFm.seoVersion} < en v${enFm.seoVersion}`);
  }
  if ((targetFm.calculatorVersion ?? 0) < (enFm.calculatorVersion ?? 0)) {
    reasons.push(`calculator: v${targetFm.calculatorVersion} < en v${enFm.calculatorVersion}`);
  }
  return { stale: reasons.length > 0, reasons };
}

// ---------------------------------------------------------------------------
// CLI orchestration
// ---------------------------------------------------------------------------

async function translateDoc(en: Doc, locale: string, translator: Translator): Promise<Doc> {
  const texts = translatableStrings(en);
  const translated = await translator.translate({ texts, targetLocale: locale });
  const map = new Map<string, string>();
  texts.forEach((t, i) => map.set(t, translated[i]));
  return applyTranslations(en, map, locale, translator.id);
}

const UI_DIR = join(process.cwd(), 'src', 'content', 'ui');

/**
 * Translate the shared UI pack (chrome + category names) into a locale. Units
 * are locale-neutral symbols (kg, %, min…) and are copied verbatim.
 */
async function translateUiPack(locale: string, translator: Translator): Promise<void> {
  const en = JSON.parse(readFileSync(join(UI_DIR, `${DEFAULT_LOCALE}.json`), 'utf8'));
  const out: Record<string, any> = { units: en.units }; // units unchanged

  for (const section of ['chrome', 'categories'] as const) {
    const src = en[section] ?? {};
    const keys = Object.keys(src);
    const values = keys.map((k) => src[k] as string);
    const translated = await translator.translate({ texts: values, targetLocale: locale });
    const map: Record<string, string> = {};
    keys.forEach((k, i) => (map[k] = translated[i]));
    out[section] = map;
  }
  writeFileSync(join(UI_DIR, `${locale}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const checkMode = args.includes('--check');
  const localesArg = args.find((a) => a.startsWith('--locales'));
  const requested = localesArg ? localesArg.split('=')[1]?.split(',') ?? args[args.indexOf(localesArg) + 1]?.split(',') : null;

  const targets = enabledLocales()
    .map((l) => l.code)
    .filter((c) => c !== DEFAULT_LOCALE)
    .filter((c) => !requested || requested.includes(c));

  const translator = new DictionaryTranslator(GLOSSARIES);
  const enSlugs = readdirSync(EN_DIR).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));

  let written = 0;
  const staleReport: string[] = [];

  for (const locale of targets) {
    const outDir = join(CONTENT_DIR, locale);
    if (!checkMode && !existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    // Localize the shared UI pack (chrome + category names) for this locale.
    if (!checkMode) await translateUiPack(locale, translator);

    for (const slug of enSlugs) {
      const en = readDoc(EN_DIR, slug);
      if (!en) continue;

      if (checkMode) {
        const target = readDoc(outDir, slug);
        if (!target) { staleReport.push(`${locale}/${slug}: MISSING`); continue; }
        const s = checkStaleness(en.fm, target.fm);
        if (s.stale) staleReport.push(`${locale}/${slug}: STALE — ${s.reasons.join('; ')}`);
        continue;
      }

      const localized = await translateDoc(en, locale, translator);
      writeFileSync(join(outDir, `${slug}.mdx`), serialize(localized), 'utf8');
      written++;
    }
  }

  if (checkMode) {
    if (staleReport.length) {
      console.log(`Staleness report (${staleReport.length}):\n${staleReport.join('\n')}`);
      process.exitCode = 1;
    } else {
      console.log('All translations are up to date.');
    }
  } else {
    console.log(`Localized MDX written: ${written} (locales: ${targets.join(', ')}, model: ${translator.id}).`);
  }
}

// Run as a CLI, but never when imported by the test runner (Vitest sets
// process.env.VITEST), so the pure exports above can be unit-tested in isolation.
if (!process.env.VITEST) {
  main().catch((e) => { console.error(e); process.exitCode = 1; });
}
