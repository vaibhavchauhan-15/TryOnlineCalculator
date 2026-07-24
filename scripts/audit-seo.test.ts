// SEO auditor tests (Task 14): pure meta extraction + per-page rules, with
// seeded defects that must be caught and a clean page that must pass.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { extractMeta, auditPage, urlPathOf, type Meta } from './audit-seo.ts';

const SITE = 'https://tryonlinecalculator.com';
const has = (issues: { rule: string }[], rule: string) => issues.some((i) => i.rule === rule);
// All alternate targets "exist" unless a test says otherwise.
const allExist = () => true;

function localeMeta(over: Partial<Meta> = {}): Meta {
  return {
    lang: 'de', title: 'BMI-Rechner', description: 'Berechnen Sie Ihren BMI schnell und einfach online.',
    canonical: `${SITE}/de/health/bmi-calculator`, robots: 'index, follow', ogLocale: 'de_DE',
    hreflang: [
      { lang: 'en', href: `${SITE}/health/bmi-calculator` },
      { lang: 'de', href: `${SITE}/de/health/bmi-calculator` },
      { lang: 'hi', href: `${SITE}/hi/health/bmi-calculator` },
      { lang: 'es', href: `${SITE}/es/health/bmi-calculator` },
      { lang: 'x-default', href: `${SITE}/health/bmi-calculator` },
    ],
    hasResult: true, hasVisualNote: false, headHasThemeScript: true, ...over,
  };
}

// --- extractMeta ------------------------------------------------------------

test('extractMeta pulls lang, canonical, robots, og:locale and hreflang', () => {
  const html = `<!doctype html><html lang="de"><head>` +
    `<title>BMI-Rechner</title>` +
    `<meta name="description" content="desc">` +
    `<link rel="canonical" href="${SITE}/de/health/bmi-calculator">` +
    `<link rel="alternate" hreflang="en" href="${SITE}/health/bmi-calculator">` +
    `<link rel="alternate" hreflang="x-default" href="${SITE}/health/bmi-calculator">` +
    `<meta name="robots" content="noindex, nofollow">` +
    `<meta property="og:locale" content="de_DE">` +
    `</head><body><span class="result-primary-value">24.5</span></body></html>`;
  const m = extractMeta(html);
  assert.equal(m.lang, 'de');
  assert.equal(m.canonical, `${SITE}/de/health/bmi-calculator`);
  assert.equal(m.robots, 'noindex, nofollow');
  assert.equal(m.ogLocale, 'de_DE');
  assert.equal(m.hreflang.length, 2);
  assert.equal(m.hasResult, true);
});

test('urlPathOf maps dist paths to URL paths', () => {
  assert.equal(urlPathOf('de/health/bmi-calculator/index.html'), '/de/health/bmi-calculator');
  assert.equal(urlPathOf('health/bmi-calculator/index.html'), '/health/bmi-calculator');
  assert.equal(urlPathOf('index.html'), '/');
});

// --- Clean pages pass -------------------------------------------------------

test('a well-formed locale calculator page passes', () => {
  const errs = auditPage('/de/health/bmi-calculator', localeMeta(), allExist).filter((i) => i.level === 'error');
  assert.deepEqual(errs, []);
});

test('a well-formed root page passes', () => {
  const meta = localeMeta({ lang: 'en', canonical: `${SITE}/health/bmi-calculator`, robots: 'index, follow', hreflang: [] });
  const errs = auditPage('/health/bmi-calculator', meta, allExist).filter((i) => i.level === 'error');
  assert.deepEqual(errs, []);
});

// --- Seeded SEO defects -----------------------------------------------------

test('non-self canonical is caught', () => {
  const meta = localeMeta({ canonical: `${SITE}/health/bmi-calculator` }); // points at EN root, not self
  assert.ok(has(auditPage('/de/health/bmi-calculator', meta, allExist), 'canonical'));
});

test('indexed locale page wrongly marked noindex is caught', () => {
  // en and de are the live, indexed locales, so their pages must stay
  // indexable. A stray noindex would drop the page from search — a defect.
  // (Held-back locales like hi/es are disabled entirely: they build no pages,
  // so there is no enabled-but-non-indexed locale to police here anymore.)
  const meta = localeMeta({ robots: 'noindex, nofollow' });
  assert.ok(has(auditPage('/de/health/bmi-calculator', meta, allExist), 'indexed-noindex'));
});

test('incomplete hreflang set is caught', () => {
  const meta = localeMeta({ hreflang: [{ lang: 'de', href: `${SITE}/de/health/bmi-calculator` }] });
  const issues = auditPage('/de/health/bmi-calculator', meta, allExist);
  assert.ok(has(issues, 'hreflang-missing'));
  assert.ok(has(issues, 'hreflang-xdefault'));
});

test('broken hreflang alternate (no built page) is caught', () => {
  const missingEs = (p: string) => p !== '/es/health/bmi-calculator';
  assert.ok(has(auditPage('/de/health/bmi-calculator', localeMeta(), missingEs), 'hreflang-broken'));
});

test('lang/path locale mismatch is caught', () => {
  const meta = localeMeta({ lang: 'fr' });
  assert.ok(has(auditPage('/de/health/bmi-calculator', meta, allExist), 'lang-mismatch'));
});

test('missing no-JS fallback on a calculator page is caught', () => {
  const meta = localeMeta({ hasResult: false, hasVisualNote: false });
  assert.ok(has(auditPage('/de/health/bmi-calculator', meta, allExist), 'no-js-fallback'));
});

test('root page that is noindex is caught', () => {
  const meta = localeMeta({ lang: 'en', canonical: `${SITE}/health/bmi-calculator`, robots: 'noindex', hreflang: [] });
  assert.ok(has(auditPage('/health/bmi-calculator', meta, allExist), 'root-noindex'));
});
