// Search Console rollout gate (Task 15).
//
// The final, measurable go/no-go before the NEXT language wave. The pilot
// locales (en/de/hi/es) ship noindex; once they are live and indexed, we feed
// this gate a snapshot of Search Console + CrUX metrics per locale. It checks
// every locale against the rollout thresholds and, only if ALL pass, clears the
// next wave (fr/pt/ja/it/nl) — which is then a one-line config flip
// (`enabled: true` in src/lib/i18n/locales.ts, the single source of truth).
//
// Usage:
//   npx vite-node scripts/rollout-gate.ts                         # uses the sample snapshot
//   npx vite-node scripts/rollout-gate.ts path/to/metrics.json    # real GSC export

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { LOCALES, enabledLocaleCodes } from '../src/lib/i18n/locales.ts';

// The rollout thresholds from the plan. A locale must clear EVERY one.
export const THRESHOLDS = {
  indexedPct: 95, // >= 95% of submitted pages indexed
  hreflangErrors: 0, // exactly 0 hreflang errors
  duplicatePages: 0, // exactly 0 "duplicate, Google chose different canonical"
  cwvPassPct: 95, // > 95% of URLs pass Core Web Vitals
  ctrTrendPct: 0, // CTR stable or improving (delta >= 0)
  crawlAnomalies: 0, // no unexplained crawl spikes/errors
} as const;

export interface LocaleMetrics {
  indexedPct: number;
  hreflangErrors: number;
  duplicatePages: number;
  cwvPassPct: number;
  ctrTrendPct: number;
  crawlAnomalies: number;
}

export interface LocaleVerdict {
  locale: string;
  pass: boolean;
  failures: string[];
}

/** Evaluate one locale's metrics against the thresholds. */
export function evaluateLocale(locale: string, m: LocaleMetrics): LocaleVerdict {
  const failures: string[] = [];
  if (m.indexedPct < THRESHOLDS.indexedPct) failures.push(`indexed ${m.indexedPct}% < ${THRESHOLDS.indexedPct}%`);
  if (m.hreflangErrors > THRESHOLDS.hreflangErrors) failures.push(`hreflang errors ${m.hreflangErrors} > 0`);
  if (m.duplicatePages > THRESHOLDS.duplicatePages) failures.push(`duplicate pages ${m.duplicatePages} > 0`);
  if (m.cwvPassPct <= THRESHOLDS.cwvPassPct) failures.push(`CWV pass ${m.cwvPassPct}% not > ${THRESHOLDS.cwvPassPct}%`);
  if (m.ctrTrendPct < THRESHOLDS.ctrTrendPct) failures.push(`CTR trend ${m.ctrTrendPct}% < 0 (declining)`);
  if (m.crawlAnomalies > THRESHOLDS.crawlAnomalies) failures.push(`crawl anomalies ${m.crawlAnomalies} > 0`);
  return { locale, pass: failures.length === 0, failures };
}

export interface GateResult {
  pass: boolean;
  verdicts: LocaleVerdict[];
  missing: string[]; // enabled locales with no metrics supplied
}

/** Gate the whole live cohort. Every enabled locale must have metrics AND pass. */
export function evaluateGate(metricsByLocale: Record<string, LocaleMetrics>, liveLocales: string[]): GateResult {
  const verdicts: LocaleVerdict[] = [];
  const missing: string[] = [];
  for (const locale of liveLocales) {
    const m = metricsByLocale[locale];
    if (!m) { missing.push(locale); continue; }
    verdicts.push(evaluateLocale(locale, m));
  }
  const pass = missing.length === 0 && verdicts.every((v) => v.pass);
  return { pass, verdicts, missing };
}

/** The next language wave — locales defined but not yet enabled. */
export function nextWaveLocales(): { code: string; englishName: string }[] {
  return LOCALES.filter((l) => !l.enabled).map((l) => ({ code: l.code, englishName: l.englishName }));
}

const MONITORING_CHECKLIST = `
Monitoring checklist (map each to its threshold before deciding):
  • Coverage report        → Indexed pages            (threshold: >= ${THRESHOLDS.indexedPct}% of submitted)
  • International Targeting → hreflang errors          (threshold: = ${THRESHOLDS.hreflangErrors})
  • Coverage / Pages       → "Duplicate" exclusions    (threshold: = ${THRESHOLDS.duplicatePages})
  • Core Web Vitals (CrUX) → URLs passing CWV          (threshold: > ${THRESHOLDS.cwvPassPct}%)
  • Performance report     → CTR trend vs prior period (threshold: >= ${THRESHOLDS.ctrTrendPct}%, i.e. stable/up)
  • Crawl stats            → unexplained crawl spikes  (threshold: = ${THRESHOLDS.crawlAnomalies})
Also submit each locale's sitemap and confirm no manual actions.
`;

function toggleInstructions(): string {
  const wave = nextWaveLocales();
  if (!wave.length) return 'No further locales are defined — add them to LOCALES first.';
  const list = wave.map((w) => `${w.code} (${w.englishName})`).join(', ');
  return (
    `Next wave to enable: ${list}\n` +
    `Config toggle (single source of truth): in src/lib/i18n/locales.ts, set \`enabled: true\`\n` +
    `for each next-wave locale. Routing, hreflang, sitemap, the language selector and\n` +
    `the search-index build all read from that list — no other code changes needed.\n` +
    `Then: npm run translate  →  npm run build  (generates + validates the new locales).`
  );
}

function main(): void {
  const arg = process.argv[2];
  const path = arg ? join(process.cwd(), arg) : join(process.cwd(), 'scripts', 'data', 'rollout-metrics.sample.json');
  if (!existsSync(path)) { console.error(`Metrics file not found: ${path}`); process.exitCode = 1; return; }

  const data = JSON.parse(readFileSync(path, 'utf8')) as { locales: Record<string, LocaleMetrics>; capturedAt?: string };
  const live = enabledLocaleCodes();
  const result = evaluateGate(data.locales ?? {}, live);

  console.log(`Rollout gate — live locales: ${live.join(', ')} (snapshot ${data.capturedAt ?? 'n/a'})\n`);
  for (const v of result.verdicts) {
    console.log(v.pass ? `  PASS  ${v.locale}` : `  FAIL  ${v.locale}: ${v.failures.join('; ')}`);
  }
  for (const m of result.missing) console.log(`  FAIL  ${m}: no metrics supplied`);

  console.log(MONITORING_CHECKLIST);

  if (result.pass) {
    console.log('GO — all live locales clear the thresholds.\n');
    console.log(toggleInstructions());
  } else {
    console.log('NO-GO — hold the next wave until every live locale clears every threshold.');
    process.exitCode = 1;
  }
}

if (!process.env.VITEST) main();
