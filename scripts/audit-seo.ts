// Post-build SEO + performance-hygiene auditor (Task 14).
//
// Lighthouse / Core Web Vitals need a real browser (see the checklist printed
// at the end for the exact runnable command + thresholds). Everything that can
// be verified from the STATIC build output, this does — across all 222 pages,
// every locale — so SEO regressions fail CI instead of surfacing in Search
// Console weeks later:
//
//   * <html lang> + <title> + meta description on every page,
//   * self-referential canonical (matches the page's own absolute URL),
//   * locale pages: noindex (staged pilot), og:locale, and a COMPLETE +
//     RECIPROCAL hreflang set whose alternate targets actually exist in dist,
//   * root pages: indexable (not noindex),
//   * no-JS fallback: a server-rendered result (or the visual-calc link) is in
//     the HTML before any JS runs,
//   * CLS hygiene: the theme/preference script is inlined in <head> (pre-paint),
//   * robots.txt + sitemap sanity (sitemap excludes the noindex locale pages).
//
// Usage: `npx vite-node scripts/audit-seo.ts` (exit 1 on any error).

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { SITE } from '../src/lib/seo-site.ts';
import { enabledLocaleCodes, getLocale, isIndexedLocale } from '../src/lib/i18n/locales.ts';
import { isStaticPageSlug } from '../src/lib/i18n/slugs.ts';
import { STATIC_PAGE_LOCALES } from '../src/lib/i18n/seo-head.ts';

const DIST = join(process.cwd(), 'dist');
const LOCALES = enabledLocaleCodes();
const LOCALE_SEG = new RegExp(`^(${LOCALES.join('|')})(/|$)`);

export interface Issue {
  level: 'error' | 'warn';
  page: string;
  rule: string;
  message: string;
}

// --- Page enumeration -------------------------------------------------------

function walkHtml(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtml(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** dist/de/health/bmi-calculator/index.html → "/de/health/bmi-calculator". */
export function urlPathOf(distRelPath: string): string {
  let p = distRelPath.split(sep).join('/').replace(/index\.html$/, '').replace(/\.html$/, '');
  p = '/' + p.replace(/\/$/, '').replace(/^\//, '');
  return p === '/' ? '/' : p;
}

function localeOfPath(urlPath: string): string | null {
  const m = urlPath.replace(/^\//, '').match(LOCALE_SEG);
  return m ? m[1] : null;
}

// --- Cheap HTML field extraction (regex; the build output is well-formed) ---

const head = (html: string) => html.split('</head>')[0] ?? html;
const attr = (html: string, re: RegExp) => html.match(re)?.[1];

export interface Meta {
  lang?: string;
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogLocale?: string;
  hreflang: { lang: string; href: string }[];
  hasResult: boolean;
  hasVisualNote: boolean;
  headHasThemeScript: boolean;
}

export function extractMeta(html: string): Meta {
  const h = head(html);
  const hreflang: { lang: string; href: string }[] = [];
  for (const m of h.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g)) {
    hreflang.push({ lang: m[1], href: m[2] });
  }
  return {
    lang: attr(html, /<html[^>]+lang="([^"]+)"/),
    title: attr(h, /<title>([^<]*)<\/title>/),
    description: attr(h, /<meta[^>]+name="description"[^>]+content="([^"]*)"/),
    canonical: attr(h, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/),
    robots: attr(h, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/),
    ogLocale: attr(h, /<meta[^>]+property="og:locale"[^>]+content="([^"]*)"/),
    hreflang,
    hasResult: /data-primary-value|result-primary-value/.test(html),
    hasVisualNote: /calc-visual-note/.test(html),
    headHasThemeScript: /data-theme|localStorage/.test(h),
  };
}

// --- Per-page audit ---------------------------------------------------------

export function auditPage(urlPath: string, meta: Meta, exists: (p: string) => boolean): Issue[] {
  const issues: Issue[] = [];
  const page = urlPath;
  const err = (rule: string, message: string) => issues.push({ level: 'error', page, rule, message });
  const warn = (rule: string, message: string) => issues.push({ level: 'warn', page, rule, message });

  // Error pages (404/500) are legitimately noindex with a home canonical — they
  // only need the basics (lang + title), not self-canonical or indexability.
  const isErrorPage = /^\/(?:[a-z]{2}\/)?(404|500)$/.test(urlPath);
  // The bare "/" is a locale-redirect stub (noindex, canonical → /en/), handled
  // at the edge by functions/index.ts — not a live content page.
  const isRedirectStub = urlPath === '/';

  if (!meta.lang) err('html-lang', 'missing <html lang>');
  if (!meta.title) err('title', 'missing <title>');
  if (!isErrorPage && !isRedirectStub && !meta.description) err('description', 'missing meta description');

  if (isErrorPage || isRedirectStub) {
    if (!/noindex/.test(meta.robots ?? '')) warn('error-page-index', 'redirect/error page should be noindex');
    return issues;
  }

  // Canonical must be self-referential.
  const expected = `${SITE}${urlPath}`;
  if (!meta.canonical) err('canonical', 'missing canonical');
  else if (meta.canonical.replace(/\/$/, '') !== expected.replace(/\/$/, '')) {
    err('canonical', `canonical "${meta.canonical}" != self "${expected}"`);
  }

  const locale = localeOfPath(urlPath);
  const segs = urlPath.split('/').filter(Boolean);
  // A calculator/converter is a LEAF detail page: /{locale}/{category}/{slug}
  // (3 path segments). Two-segment paths are hubs/category indexes (listing
  // pages with prose, no interactive widget) and are not held to the no-JS
  // interactive-result rule.
  const isCalc = segs.length >= 3 && (/(-calculator|-converter)$/.test(urlPath) || /calculator|converter/.test(urlPath));

  if (locale) {
    // Indexed locales (en, de) must NOT be noindex; other locales must be noindex until rollout.
    if (!isIndexedLocale(locale)) {
      if (!/noindex/.test(meta.robots ?? '')) err('noindex', 'locale page must be noindex during rollout');
    } else {
      if (/noindex/.test(meta.robots ?? '')) err('indexed-noindex', 'indexed locale page should not be noindex');
    }
    if (!meta.ogLocale) warn('og-locale', 'missing og:locale');
    if (meta.lang && meta.lang !== locale && !meta.lang.startsWith(locale)) {
      err('lang-mismatch', `<html lang="${meta.lang}"> != path locale "${locale}"`);
    }

    // hreflang must cover every locale in which the page is published + x-default,
    // be self-referential, and each alternate target must exist in the build.
    // Standalone static/legal pages (about, contact, privacy, terms) are only
    // authored for a subset of locales, so their required set is scoped to those.
    const isStaticLegal = segs.length === 2 && isStaticPageSlug(segs[1]);
    const requiredLocales = isStaticLegal ? (STATIC_PAGE_LOCALES as readonly string[]) : LOCALES;
    const langs = new Set(meta.hreflang.map((a) => a.lang));
    for (const l of requiredLocales) if (!langs.has(l)) err('hreflang-missing', `no hreflang for "${l}"`);
    if (!langs.has('x-default')) err('hreflang-xdefault', 'missing x-default');
    const selfAlt = meta.hreflang.find((a) => a.lang === locale);
    if (!selfAlt) err('hreflang-self', 'no self-referential hreflang');
    for (const a of meta.hreflang) {
      if (a.lang === 'x-default') continue;
      const altPath = a.href.replace(SITE, '');
      if (!exists(altPath)) err('hreflang-broken', `alternate ${a.lang} → ${altPath} has no built page`);
    }

    // No-JS fallback: a calculator page must render SOMETHING server-side.
    if (isCalc && !meta.hasResult && !meta.hasVisualNote) {
      err('no-js-fallback', 'no server-rendered result or visual-calc link');
    }
  } else {
    // Live root pages must remain indexable.
    if (/noindex/.test(meta.robots ?? '')) err('root-noindex', 'live root page is noindex');
  }

  return issues;
}

// --- Orchestration ----------------------------------------------------------

export function auditDist(): Issue[] {
  if (!existsSync(DIST)) return [{ level: 'error', page: '(dist)', rule: 'no-build', message: 'dist/ not found — run the build first' }];

  const files = walkHtml(DIST);
  const urlPaths = new Set(files.map((f) => urlPathOf(relative(DIST, f))));
  const exists = (p: string) => urlPaths.has(p.replace(/\/$/, '') || '/') || urlPaths.has(p);

  const issues: Issue[] = [];
  for (const f of files) {
    const urlPath = urlPathOf(relative(DIST, f));
    const meta = extractMeta(readFileSync(f, 'utf8'));
    issues.push(...auditPage(urlPath, meta, exists));
  }

  // Site-wide: robots.txt + sitemap sanity, and CLS pre-paint script.
  const robots = join(DIST, 'robots.txt');
  if (!existsSync(robots)) issues.push({ level: 'error', page: '/robots.txt', rule: 'robots', message: 'missing robots.txt' });
  else if (!/sitemap/i.test(readFileSync(robots, 'utf8'))) issues.push({ level: 'error', page: '/robots.txt', rule: 'robots-sitemap', message: 'robots.txt has no Sitemap directive' });

  const sitemap = join(DIST, 'sitemap-0.xml');
  if (existsSync(sitemap)) {
    const xml = readFileSync(sitemap, 'utf8');
    // Only non-indexed locales should be absent from the sitemap.
    const nonIndexedLocales = LOCALES.filter(l => !isIndexedLocale(l));
    if (nonIndexedLocales.length > 0) {
      const leakedLocs = (xml.match(new RegExp(`<loc>${SITE}/(${nonIndexedLocales.join('|')})/`, 'g')) ?? []).length;
      if (leakedLocs > 0) issues.push({ level: 'error', page: '/sitemap-0.xml', rule: 'sitemap-noindex', message: `${leakedLocs} noindex locale URLs leaked into the sitemap` });
    }
  } else {
    issues.push({ level: 'error', page: '/sitemap-0.xml', rule: 'sitemap', message: 'missing sitemap-0.xml' });
  }

  // The bare "/" is a locale-redirect stub with no chrome; check the real
  // default-locale homepage for the pre-paint theme script instead.
  const home = join(DIST, 'en', 'index.html');
  if (existsSync(home) && !extractMeta(readFileSync(home, 'utf8')).headHasThemeScript) {
    issues.push({ level: 'warn', page: '/en', rule: 'cls-prepaint', message: 'no pre-paint theme/preference script in <head> (CLS/flash risk)' });
  }

  return issues;
}

const LIGHTHOUSE_CHECKLIST = `
Browser-based checks (run with the preview server up: \`npm run preview\`):
  npx lighthouse http://localhost:4321/health/bmi-calculator --only-categories=performance,seo,accessibility,best-practices --preset=desktop
  Repeat per locale: /en/… /de/… /hi/… /es/…
Thresholds (Task 14 gate):
  Performance >= 90 · SEO >= 90 · Accessibility >= 90
  LCP < 2.5s · CLS < 0.1 · TBT < 200ms
  hreflang: 0 errors (Search Console "International Targeting" or an hreflang validator)
`;

function main(): void {
  const issues = auditDist();
  const errors = issues.filter((i) => i.level === 'error');
  const warns = issues.filter((i) => i.level === 'warn');
  for (const i of issues) console.log(`${i.level === 'error' ? 'ERROR' : 'warn '} [${i.rule}] ${i.page}: ${i.message}`);
  console.log(`\nSEO audit: ${errors.length} error(s), ${warns.length} warning(s).`);
  console.log(LIGHTHOUSE_CHECKLIST);
  if (errors.length) process.exitCode = 1;
  else console.log('PASS — static SEO invariants hold across all locales.');
}

if (!process.env.VITEST) main();
