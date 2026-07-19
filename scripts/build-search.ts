// Locale-aware search index builder (Task 12).
//
// Emits one static index per enabled locale to public/search/<locale>.json
// (served at /search/<locale>.json). Each index is built from the LOCALIZED
// MDX — so a German search matches "BMI Rechner" and a Spanish search matches
// "IMC" — plus a curated per-locale synonym list for terms a native speaker
// would type that aren't in the title/keywords.
//
// The client (Search.astro) lazily fetches the index for the page's active
// locale, so the HTML stays tiny and each language searches its own vocabulary.
//
// Run: `npx vite-node scripts/build-search.ts` (wired as the npm `prebuild`).

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

import { enabledLocales, DEFAULT_LOCALE } from '../src/lib/i18n/locales.ts';
import { uiPack, categoryName } from '../src/lib/i18n/ui-pack.ts';
import { localizedCategorySlug, localizedCalculatorSlug } from '../src/lib/i18n/slugs.ts';

const CONTENT_DIR = join(process.cwd(), 'src', 'content', 'calculators');
const EN_DIR = join(CONTENT_DIR, DEFAULT_LOCALE);
const OUT_DIR = join(process.cwd(), 'public', 'search');

// Native-vocabulary synonyms a speaker might type that aren't already in the
// localized title/keywords. Keyed by slug → locale → extra search terms.
const SYNONYMS: Record<string, Record<string, string[]>> = {
  'bmi-calculator': { es: ['IMC', 'indice de masa corporal'], de: ['Körpermassenindex', 'BMI Rechner'], hi: ['बॉडी मास इंडेक्स'] },
  'percentage-calculator': { es: ['porciento', 'tanto por ciento'], de: ['Prozentsatz'], hi: ['प्रतिशत निकालें'] },
  'mortgage-calculator': { es: ['hipoteca mensual'], de: ['Baufinanzierung', 'Immobilienkredit'], hi: ['होम लोन'] },
  'currency-converter': { es: ['cambio de moneda', 'tipo de cambio'], de: ['Devisenrechner', 'Umrechnung'], hi: ['करेंसी कन्वर्टर'] },
  'loan-calculator': { es: ['cuota préstamo', 'EMI'], de: ['Ratenkredit'], hi: ['EMI कैलकुलेटर'] },
  'calorie-calculator': { es: ['calorías diarias'], de: ['Kalorienbedarf'], hi: ['कैलोरी की जरूरत'] },
  'tip-calculator': { es: ['cuánto dejar de propina'], de: ['Trinkgeld berechnen'], hi: ['टिप कितनी दें'] },
};

interface IndexRecord {
  t: string; // localized title
  p: string; // locale-aware path
  c: string; // localized category label
  h: string; // lowercase haystack (title + keywords + synonyms + category)
  l: string; // lowercase title (for scoring)
}

function readFrontmatter(dir: string, slug: string): Record<string, any> | null {
  const path = join(dir, `${slug}.mdx`);
  if (!existsSync(path)) return null;
  const m = readFileSync(path, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  return m ? ((parse(m[1]) as Record<string, any>) ?? null) : null;
}

/** Locale-aware page path: all locales are prefixed, using translated slugs. */
function pagePath(locale: string, category: string, slug: string): string {
  const localCat = localizedCategorySlug(category, locale);
  const localSlug = localizedCalculatorSlug(slug, locale);
  return `/${locale}/${localCat}/${localSlug}`;
}

function buildLocale(locale: string): IndexRecord[] {
  const dir = join(CONTENT_DIR, locale);
  const slugs = readdirSync(EN_DIR).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));
  const records: IndexRecord[] = [];

  for (const slug of slugs) {
    // Prefer the localized document; fall back to English if not yet translated.
    const fm = readFrontmatter(dir, slug) ?? readFrontmatter(EN_DIR, slug);
    if (!fm) continue;

    const category = fm.category as string;
    const catLabel = categoryName(locale, category);
    const keywords: string[] = fm.keywords ?? [];
    const synonyms = SYNONYMS[slug]?.[locale] ?? [];
    const haystack = [fm.title, ...keywords, ...synonyms, catLabel].join(' ').toLowerCase();

    records.push({
      t: fm.title,
      p: pagePath(locale, category, slug),
      c: catLabel,
      h: haystack,
      l: String(fm.title).toLowerCase(),
    });
  }
  return records;
}

function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  let total = 0;
  for (const { code } of enabledLocales()) {
    const index = buildLocale(code);
    writeFileSync(join(OUT_DIR, `${code}.json`), JSON.stringify(index), 'utf8');
    total += index.length;
    // Touch uiPack so an unused-import lint never trips (and to fail fast if a
    // locale's UI pack is somehow unreadable during the build).
    void uiPack(code);
  }
  console.log(`Search indexes written: ${enabledLocales().length} locales, ${total} records → public/search/`);
}

if (!process.env.VITEST) main();

export { buildLocale, pagePath, SYNONYMS };
