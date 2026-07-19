// Pre-deploy validation / QA gate (Task 13).
//
// One command that fails the build on any content, i18n or SEO defect, split
// into three concerns, each a set of PURE, individually-testable checks:
//
//   1. Site integrity — every enabled locale has an MDX doc for every slug,
//      each passes the frontmatter schema, no duplicate slugs, every related[]
//      slug resolves (no orphan links), and the per-locale document sets match
//      (so hreflang alternates are reciprocal 1:1).
//   2. Content linter — title/description length, FAQ presence, duplicate/empty
//      questions, image alt text, and Markdown heading hierarchy in the body.
//   3. Translation & SEO QA — do-not-translate terms survive in translations
//      (a German title must keep "BMI", never expand to "Körpermassenindex"),
//      provenance is stamped, and translations are not left English wholesale.
//
// Usage: `npx vite-node scripts/validate.ts` (exit 1 on any error).

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

import { validateFrontmatter } from '../src/content/schema.ts';
import { enabledLocaleCodes, DEFAULT_LOCALE } from '../src/lib/i18n/locales.ts';
import { DO_NOT_TRANSLATE } from './lib/translator.ts';

const CONTENT_DIR = join(process.cwd(), 'src', 'content', 'calculators');

// --- Types ------------------------------------------------------------------

export interface Issue {
  level: 'error' | 'warn';
  where: string; // e.g. "de/bmi-calculator"
  rule: string;
  message: string;
}

export interface Doc {
  fm: Record<string, any>;
  body: string;
}

// SEO length guidance (soft-ish, enforced as errors so drift is caught early).
const TITLE_MAX = 65;
const DESC_MIN = 50;
const DESC_MAX = 165;

// --- Loading ----------------------------------------------------------------

export function parseDoc(raw: string): Doc | null {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  return { fm: (parse(m[1]) as Record<string, any>) ?? {}, body: (m[2] ?? '').trim() };
}

function readDoc(locale: string, slug: string): Doc | null {
  const path = join(CONTENT_DIR, locale, `${slug}.mdx`);
  if (!existsSync(path)) return null;
  return parseDoc(readFileSync(path, 'utf8'));
}

function slugsFor(locale: string): string[] {
  const dir = join(CONTENT_DIR, locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));
}

// ===========================================================================
// 1. Site integrity
// ===========================================================================

export function checkSiteIntegrity(
  docsByLocale: Record<string, Record<string, Doc>>,
  locales: string[],
): Issue[] {
  const issues: Issue[] = [];
  const enSlugs = Object.keys(docsByLocale[DEFAULT_LOCALE] ?? {}).sort();
  const enSet = new Set(enSlugs);

  for (const locale of locales) {
    const docs = docsByLocale[locale] ?? {};
    const seen = new Set<string>();

    // Every English slug must exist in this locale (1:1 hreflang alternates).
    for (const slug of enSlugs) {
      if (!docs[slug]) {
        issues.push({ level: 'error', where: `${locale}/${slug}`, rule: 'missing-translation', message: `no ${locale} document (breaks hreflang reciprocity)` });
      }
    }

    for (const [slug, doc] of Object.entries(docs)) {
      const where = `${locale}/${slug}`;

      // Schema.
      const res = validateFrontmatter(doc.fm);
      if (!res.success) {
        issues.push({ level: 'error', where, rule: 'schema', message: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      }

      // Duplicate slug within a locale (shouldn't happen on a filesystem, but
      // guards generated content).
      if (seen.has(slug)) issues.push({ level: 'error', where, rule: 'duplicate-slug', message: 'slug appears twice' });
      seen.add(slug);

      // The document's own `slug` field must match its filename.
      if (doc.fm.slug && doc.fm.slug !== slug) {
        issues.push({ level: 'error', where, rule: 'slug-mismatch', message: `frontmatter slug "${doc.fm.slug}" != filename` });
      }

      // Orphan check: every related[] target must be a real calculator.
      for (const rel of doc.fm.related ?? []) {
        if (!enSet.has(rel)) {
          issues.push({ level: 'error', where, rule: 'orphan-related', message: `related "${rel}" is not a known calculator` });
        }
      }

      // Locale docs that aren't in English are orphans (no alternate to point at).
      if (locale !== DEFAULT_LOCALE && !enSet.has(slug)) {
        issues.push({ level: 'error', where, rule: 'orphan-locale-doc', message: 'no English source document' });
      }
    }
  }
  return issues;
}

// ===========================================================================
// 2. Content linter
// ===========================================================================

export function lintContent(locale: string, slug: string, doc: Doc): Issue[] {
  const issues: Issue[] = [];
  const where = `${locale}/${slug}`;
  const fm = doc.fm;

  if (typeof fm.title === 'string' && fm.title.length > TITLE_MAX) {
    issues.push({ level: 'error', where, rule: 'title-length', message: `title ${fm.title.length} > ${TITLE_MAX} chars` });
  }
  if (typeof fm.description === 'string') {
    if (fm.description.length < DESC_MIN) issues.push({ level: 'warn', where, rule: 'desc-short', message: `description ${fm.description.length} < ${DESC_MIN}` });
    if (fm.description.length > DESC_MAX) issues.push({ level: 'error', where, rule: 'desc-length', message: `description ${fm.description.length} > ${DESC_MAX}` });
  }

  // FAQ hygiene: at least one, non-empty, no duplicate questions.
  const faq = fm.faq ?? [];
  if (faq.length === 0) issues.push({ level: 'warn', where, rule: 'faq-missing', message: 'no FAQ entries (weaker rich-result coverage)' });
  const qs = new Set<string>();
  for (const f of faq) {
    if (!f.q?.trim() || !f.a?.trim()) issues.push({ level: 'error', where, rule: 'faq-empty', message: 'empty FAQ question/answer' });
    const key = (f.q ?? '').trim().toLowerCase();
    if (qs.has(key)) issues.push({ level: 'error', where, rule: 'faq-duplicate', message: `duplicate FAQ question "${f.q}"` });
    qs.add(key);
  }

  // Markdown body: image alt text + heading hierarchy (no skipped levels, and
  // the body should not introduce a second H1 — the page <h1> is the title).
  const lines = doc.body.split('\n');
  let lastLevel = 1; // the page title is the H1
  for (const line of lines) {
    for (const img of line.matchAll(/!\[(.*?)\]\((.*?)\)/g)) {
      if (!img[1].trim()) issues.push({ level: 'error', where, rule: 'img-alt', message: `image "${img[2]}" is missing alt text` });
    }
    const h = line.match(/^(#{1,6})\s+/);
    if (h) {
      const level = h[1].length;
      if (level === 1) issues.push({ level: 'error', where, rule: 'duplicate-h1', message: 'body contains an H1 (reserved for the page title)' });
      else if (level > lastLevel + 1) issues.push({ level: 'error', where, rule: 'heading-skip', message: `heading jumps from H${lastLevel} to H${level}` });
      lastLevel = level;
    }
  }
  return issues;
}

// ===========================================================================
// 3. Translation & SEO QA
// ===========================================================================

// Locale-appropriate equivalents for otherwise do-not-translate acronyms. A
// protected term "survives" if the translation keeps the acronym OR uses the
// accepted market term. German keeps BMI/BMR/GPA verbatim (so no entries), but
// uses "Effektivzins" for APR; Spanish uses IMC/TMB and "EE. UU." for US.
export const ACCEPTED_EQUIVALENTS: Record<string, Record<string, string[]>> = {
  de: { APR: ['effektivzins', 'effektiver jahreszins'] },
  es: { BMI: ['imc'], BMR: ['tmb'], TDEE: ['get'], US: ['ee. uu.', 'eeuu', 'estados unidos'] },
  hi: {},
};

/** Do-not-translate terms present in the English title/description. */
function expectedProtectedTerms(enDoc: Doc): string[] {
  const hay = `${enDoc.fm.title} ${enDoc.fm.description}`;
  return [...DO_NOT_TRANSLATE].filter((t) => new RegExp(`\\b${t}\\b`).test(hay));
}

/** True when a protected term survived a translation, verbatim or via an accepted equivalent. */
export function termSurvives(term: string, locale: string, translatedText: string): boolean {
  if (new RegExp(`\\b${term}\\b`).test(translatedText)) return true;
  const equivalents = ACCEPTED_EQUIVALENTS[locale]?.[term] ?? [];
  const lower = translatedText.toLowerCase();
  return equivalents.some((e) => lower.includes(e));
}

export function checkTranslationQa(locale: string, slug: string, enDoc: Doc, tDoc: Doc): Issue[] {
  const issues: Issue[] = [];
  const where = `${locale}/${slug}`;

  // Provenance must be stamped by the CLI.
  if (tDoc.fm.source !== DEFAULT_LOCALE) issues.push({ level: 'error', where, rule: 'provenance-source', message: `source should be "${DEFAULT_LOCALE}"` });
  if (!tDoc.fm.model) issues.push({ level: 'warn', where, rule: 'provenance-model', message: 'no model stamped' });
  if (!tDoc.fm.translatedFromVersion) issues.push({ level: 'error', where, rule: 'provenance-version', message: 'translatedFromVersion missing' });

  // Do-not-translate terms present in the English title/description MUST survive
  // in the translation — verbatim (de "BMI Rechner") or via the accepted market
  // term (es "IMC"). Dropping BMI for "Körpermassenindex" in German is a failure.
  const translated = `${tDoc.fm.title} ${tDoc.fm.description}`;
  for (const term of expectedProtectedTerms(enDoc)) {
    if (!termSurvives(term, locale, translated)) {
      issues.push({ level: 'error', where, rule: 'do-not-translate', message: `protected term "${term}" lost (no accepted ${locale} equivalent either)` });
    }
  }

  // A translated title identical to English for a term-free calculator suggests
  // the locale was never actually translated (warn — some proper nouns match).
  if (locale !== DEFAULT_LOCALE && tDoc.fm.title === enDoc.fm.title && !expectedProtectedTerms(enDoc).length) {
    issues.push({ level: 'warn', where, rule: 'untranslated-title', message: 'title identical to English' });
  }

  return issues;
}

// ===========================================================================
// Orchestration
// ===========================================================================

export function runAllChecks(locales: string[]): Issue[] {
  const docsByLocale: Record<string, Record<string, Doc>> = {};
  for (const locale of locales) {
    docsByLocale[locale] = {};
    for (const slug of slugsFor(locale)) {
      const d = readDoc(locale, slug);
      if (d) docsByLocale[locale][slug] = d;
    }
  }

  const issues: Issue[] = [];
  issues.push(...checkSiteIntegrity(docsByLocale, locales));

  const enDocs = docsByLocale[DEFAULT_LOCALE] ?? {};
  for (const locale of locales) {
    for (const [slug, doc] of Object.entries(docsByLocale[locale])) {
      issues.push(...lintContent(locale, slug, doc));
      if (locale !== DEFAULT_LOCALE && enDocs[slug]) {
        issues.push(...checkTranslationQa(locale, slug, enDocs[slug], doc));
      }
    }
  }
  return issues;
}

function main(): void {
  const locales = [DEFAULT_LOCALE, ...enabledLocaleCodes().filter((c) => c !== DEFAULT_LOCALE)];
  const issues = runAllChecks(locales);
  const errors = issues.filter((i) => i.level === 'error');
  const warns = issues.filter((i) => i.level === 'warn');

  for (const i of issues) {
    const tag = i.level === 'error' ? 'ERROR' : 'warn ';
    console.log(`${tag} [${i.rule}] ${i.where}: ${i.message}`);
  }
  console.log(`\nValidation: ${errors.length} error(s), ${warns.length} warning(s) across ${locales.length} locale(s).`);
  if (errors.length) process.exitCode = 1;
  else console.log('PASS — site is deploy-ready.');
}

if (!process.env.VITEST) main();
