# Try Online Calculator

A single-domain hub of free, instant-answer calculators, unit converters and a live
currency converter spanning Finance, Health, Education, Math, Salary, Shopping,
Date & Time and Travel — served in multiple languages.

The site is SEO-first: every calculator is a standalone, statically-rendered landing page
built from one shared, type-safe calculator engine and a common design system. Pages work
without JavaScript (server-rendered results for crawlers and no-JS users) and upgrade to a
live, as-you-type experience in the browser.

- **Live site:** https://tryonlinecalculator.com
- **Product spec:** see [`PRD.md`](./PRD.md)
- **Design language:** see [`DESIGN.md`](./DESIGN.md)

## Tech Stack

| Layer | Choice |
| :--- | :--- |
| Framework | [Astro 7](https://astro.build) (static output, islands, built-in i18n routing) |
| Language | TypeScript 6 |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) (via `@tailwindcss/vite`) + a token-based `global.css` |
| Fonts | Geist + Geist Mono (self-hosted `woff2`, `font-display: optional`) |
| Content | MDX (localized calculator copy, FAQ, worked examples per language) |
| Hosting | [Cloudflare Pages](https://developers.cloudflare.com/pages/) — fully static, no adapter or server |
| Live data | [Frankfurter API](https://frankfurter.dev) fetched directly in the browser (currency rates + history) |
| Testing | [Vitest](https://vitest.dev) |
| Sitemap | `@astrojs/sitemap` (locale-aware, filtered by indexing gate) |
| Deploy tooling | [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (`wrangler pages deploy`) |

Node `>=22.12.0` is required (see `engines` in `package.json`).

## Getting Started

```sh
npm install
npm run dev        # local dev server (astro dev)
```

Per the workspace conventions in `AGENTS.md`, you can also run the dev server in the
background and manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Commands

All commands run from the project root.

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the local dev server |
| `npm run build` | Validate + build search index + build production site + run SEO audit |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build + deploy the static `./dist` to Cloudflare Pages |
| `npm run validate` | Run the calculator/content validation checks |
| `npm run audit` | Run the post-build SEO audit (`scripts/audit-seo.ts`) |
| `npm run search:index` | Rebuild the client-side search index (`scripts/build-search.ts`) |
| `npm run translate` | Generate/sync translations for enabled locales |
| `npm run translate:check` | Check translation coverage without writing files |
| `npm run rollout:gate` | Evaluate locale readiness for production rollout |
| `npm run test` | Run unit tests (Vitest, single run) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run astro ...` | Run Astro CLI commands (`astro add`, `astro check`, ...) |

## Internationalization (i18n)

The site supports multiple languages via Astro's built-in i18n routing with
`prefixDefaultLocale: true`. Every language lives under its own URL segment,
including English (`/en/finance/...`). The bare `/` redirects to `/en/`.

### Enabled Locales

| Code | Language | Indexed |
| :--- | :--- | :---: |
| `en` | English | Yes |
| `de` | Deutsch | Yes |
| `hi` | Hindi | No (noindex) |
| `es` | Español | No (noindex) |

Additional locales (French, Portuguese, Japanese, Italian, Dutch) are defined but
not yet enabled — flipping them on is a one-line change in `src/lib/i18n/locales.ts`.

### How It Works

- **Locale registry** (`src/lib/i18n/locales.ts`) — single source of truth. Routing,
  hreflang, sitemap and the language selector all read from this list.
- **MDX content** (`src/content/calculators/{locale}/`) — localized calculator copy
  (title, description, how-it-works, worked examples, FAQ) per language.
- **UI strings** (`src/content/ui/{locale}.json`) — shared labels, buttons, error messages.
- **Calculator engine** is locale-agnostic: results carry raw values and enum keys only.
  The localization layer formats numbers, currencies and labels for the active locale.
- **Preferences store** (`src/lib/preferences/store.ts`) — separates content language
  from region (formatting). A visitor can read English content formatted for India (INR,
  metric) without any conflict.
- **Rollout gate** (`scripts/rollout-gate.ts`) — evaluates content-quality thresholds
  before enabling a locale for production indexing.

### Adding a New Language

1. Add a `LocaleDef` entry in `src/lib/i18n/locales.ts` with `enabled: true`.
2. Add a `src/content/ui/{code}.json` file with translated UI strings.
3. Add MDX content files in `src/content/calculators/{code}/`.
4. Run `npm run translate` to auto-generate missing translations.
5. Run `npm run rollout:gate` to check if the locale passes quality thresholds.

## How It Works

The whole site is generated from **data**, not hand-authored pages.

1. Each calculator is a `Calculator` object (formula, inputs, chart specs, related links)
   defined in `src/lib/calculators/<category>.ts` and aggregated in `src/lib/calculators/index.ts`.
2. Localized content (title, description, FAQ, worked examples, how-it-works) lives in
   MDX files under `src/content/calculators/{locale}/{slug}.mdx`.
3. Categories are described once in `src/lib/categories.ts`.
4. Dynamic Astro routes (`src/pages/[locale]/[category]/[slug].astro`) call
   `getStaticPaths()` to statically render one page per calculator × locale at build time.
5. The shared page template renders the widget, "how it works", worked examples, FAQ and
   related links, and emits `SoftwareApplication` / `FAQPage` / `BreadcrumbList` JSON-LD
   for structured data.
6. On the server, `render.ts` produces the initial result HTML (SEO + no-JS fallback).
   In the browser, `client.ts` mounts every `[data-calculator]` widget and re-runs the same
   `compute()` function live as the user types.
7. The **Calculator Engine** (`src/lib/calculator-engine/`) provides a stable contract
   interface — every calculator implements a validate + compute function that returns raw
   values and enum keys. The localization layer adds formatted text downstream.

Adding a new calculator is mostly a matter of adding one more `Calculator` entry to the
relevant category file and creating the MDX content for each enabled locale.

## Calculators

The site currently ships **40 calculators** across 8 categories plus a full-featured
**currency converter** and **unit converter** hub:

| Category | Calculators |
| :--- | :--- |
| Finance | Mortgage, Loan, Auto Loan, Car Payment, Investment, Compound Interest, Savings, Interest, APR, Retirement, SIP |
| Health | BMI, BMR, TDEE, Calorie, Macro, Water Intake, Ideal Weight |
| Education | GPA, Grade, Final Grade, Average Grade, Percentage, Average |
| Math | Basic, Scientific, Fraction |
| Salary | Salary, Hourly Wage, Paycheck |
| Shopping | Discount, Tip, Sales Tax |
| Date & Time | Age, Date Difference, Business Days, Working Days |
| Travel | Fuel Cost, Mileage |
| Currency | Live currency converter (160+ currencies, history chart) |
| Unit Converters | Length, weight, temperature, volume, area, speed and more |

## Project Structure

```text
tryonlinecalculator.com/
├── public/                         # Static assets served as-is
│   ├── fonts/                      # Self-hosted Geist / Geist Mono woff2 files
│   ├── _headers                    # Cloudflare Pages HTTP headers (caching, security)
│   ├── _redirects                  # Root "/" → "/en/" redirect
│   ├── favicon.svg, favicon.ico, favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-*.png
│   └── site.webmanifest
│
├── src/
│   ├── components/                 # Astro UI components
│   │   ├── Header.astro            # Site header / nav
│   │   ├── Footer.astro            # Site footer
│   │   ├── Search.astro            # Client-side calculator search
│   │   ├── LanguageSwitcher.astro  # Locale picker (flags/native names)
│   │   ├── CategoryCard.astro      # Category tile (homepage / hubs)
│   │   ├── CalculatorCard.astro    # Calculator tile in grids
│   │   ├── LinkCard.astro          # Generic link tile
│   │   ├── CalculatorWidget.astro  # Generic form-driven calculator widget
│   │   ├── LocalizedCalculatorWidget.astro  # i18n-aware widget wrapper
│   │   ├── CalculateButton.astro   # Shared calculate/submit control
│   │   ├── KeypadCalculator.astro  # Visual basic/scientific keypad
│   │   ├── FractionCalculator.astro
│   │   ├── PercentageCalculator.astro
│   │   ├── AverageCalculator.astro
│   │   ├── GpaCalculator.astro
│   │   ├── GradeCalculator.astro
│   │   ├── FinalGradeCalculator.astro
│   │   ├── AverageGradeCalculator.astro
│   │   ├── SipCalculator.astro     # SIP (Systematic Investment Plan) widget
│   │   ├── CurrencyConverter.astro # Full currency converter (live rates + history)
│   │   ├── CurrencyPicker.astro    # Searchable currency selector
│   │   ├── CurrencySelect.astro    # Compact currency dropdown
│   │   ├── SwapButton.astro        # From ↔ To swap control
│   │   ├── UnitConverter.astro     # Interactive unit-converter widget
│   │   ├── FaqAccordion.astro      # Reusable FAQ accordion
│   │   ├── HomeFaq.astro           # Homepage FAQ block (localized)
│   │   └── Agentation.astro        # Agentation integration snippet
│   │
│   ├── content/                    # Localized content (Astro Content Collections)
│   │   ├── calculators/            # MDX per calculator per locale
│   │   │   ├── en/                 # English (40 .mdx files)
│   │   │   ├── de/                 # German
│   │   │   ├── hi/                 # Hindi
│   │   │   └── es/                 # Spanish
│   │   ├── ui/                     # UI string packs per locale
│   │   │   ├── en.json
│   │   │   ├── de.json
│   │   │   ├── hi.json
│   │   │   └── es.json
│   │   ├── schema.ts              # Content collection schema
│   │   └── coverage.test.ts       # Ensures all locales have matching content
│   │
│   ├── layouts/
│   │   └── Layout.astro            # Base HTML shell: <head>, meta, JSON-LD, hreflang
│   │
│   ├── lib/                        # Framework-agnostic engine + content (TypeScript)
│   │   ├── calculator-engine/      # Stable contract interface for all calculators
│   │   │   ├── contract.ts         # validate() + compute() contract types
│   │   │   ├── units.ts            # Unit system definitions
│   │   │   ├── engines/            # Per-calculator engine implementations
│   │   │   ├── index.ts            # Engine registry
│   │   │   └── *.test.ts           # Contract + registry tests
│   │   │
│   │   ├── calculators/            # Calculator definitions, grouped by category
│   │   │   ├── index.ts            # Aggregates all calculators + lookup/search helpers
│   │   │   ├── finance.ts
│   │   │   ├── health.ts
│   │   │   ├── education.ts
│   │   │   ├── math.ts
│   │   │   ├── salary.ts
│   │   │   ├── shopping.ts
│   │   │   ├── date-time.ts
│   │   │   ├── travel.ts
│   │   │   ├── _expr.ts            # Safe expression parser (keypad calculators)
│   │   │   └── _math.ts            # Shared math helpers
│   │   │
│   │   ├── i18n/                   # Internationalization engine
│   │   │   ├── locales.ts          # Locale registry (single source of truth)
│   │   │   ├── content.ts          # MDX content resolution
│   │   │   ├── paths.ts            # Locale-aware URL helpers
│   │   │   ├── slugs.ts            # Localized slug handling
│   │   │   ├── resolver.ts         # Locale resolution from URL/prefs
│   │   │   ├── format-locale.ts    # Intl formatting per locale
│   │   │   ├── region-defaults.ts  # Region → currency/unit defaults
│   │   │   ├── lang-ui.ts          # Language switcher logic
│   │   │   ├── ui-pack.ts          # Load UI string packs
│   │   │   ├── render-localized.ts # Localized render pipeline
│   │   │   ├── localized-client.ts # Browser i18n runtime
│   │   │   ├── seo-head.ts         # hreflang + locale meta tags
│   │   │   ├── seo-schema.ts       # Locale-aware JSON-LD
│   │   │   └── *.test.ts           # i18n unit tests
│   │   │
│   │   ├── preferences/            # Visitor preferences store
│   │   │   ├── store.ts            # Locale + region + currency + unit system
│   │   │   └── store.test.ts
│   │   │
│   │   ├── types.ts                # Core engine types (Calculator, Category, etc.)
│   │   ├── categories.ts           # Category metadata + lookup
│   │   ├── converters.ts           # Unit-converter engine + content
│   │   ├── converters-de.ts        # German unit-converter labels
│   │   ├── currency-converter.ts   # Currency converter client engine
│   │   ├── currency-picker.ts      # Currency picker behavior
│   │   ├── currency.ts             # Currency utilities
│   │   ├── rates.ts               # Frankfurter API rate fetching
│   │   ├── client.ts              # Browser runtime: mounts + runs live widgets
│   │   ├── render.ts              # Pure result → HTML (server + client)
│   │   ├── charts.ts             # Dependency-free inline SVG charts
│   │   ├── seo.ts                # JSON-LD schema builders
│   │   ├── seo-site.ts           # Site-level SEO helpers
│   │   ├── format.ts             # Number/currency/date formatting
│   │   ├── history.ts            # Result history + copy-to-clipboard UI
│   │   ├── storage.ts            # localStorage persistence
│   │   ├── countup.ts            # Animated count-up effect
│   │   ├── haptics.ts            # Haptic feedback (mobile)
│   │   ├── dropdown.ts           # Dropdown UI behavior
│   │   ├── analytics.ts          # GA4 event tracking facade
│   │   ├── icons.ts              # Inline SVG icon set
│   │   └── faq.ts                # Shared FAQ content (localized)
│   │
│   ├── pages/                     # File-based routes
│   │   ├── index.astro            # Root redirect (→ /en/)
│   │   ├── robots.txt.ts          # Generated robots.txt
│   │   ├── 404.astro, 500.astro   # Legacy error pages
│   │   ├── about, contact, privacy, terms  # Legacy non-prefixed (redirect)
│   │   ├── en/                    # English-only static pages
│   │   │   ├── about.astro
│   │   │   ├── contact.astro
│   │   │   ├── privacy.astro
│   │   │   └── terms.astro
│   │   ├── de/                    # German-only static pages
│   │   │   ├── ueber-uns.astro
│   │   │   ├── kontakt.astro
│   │   │   ├── datenschutz.astro
│   │   │   └── nutzungsbedingungen.astro
│   │   ├── [locale]/              # Dynamic locale-prefixed routes
│   │   │   ├── index.astro        # /{locale}/ homepage
│   │   │   ├── 404.astro, 500.astro
│   │   │   ├── [category]/
│   │   │   │   ├── index.astro    # /{locale}/{category} hub
│   │   │   │   └── [slug].astro   # /{locale}/{category}/{slug}
│   │   │   └── [converterHub]/
│   │   │       ├── index.astro    # /{locale}/unit-converter hub
│   │   │       └── [type].astro   # /{locale}/unit-converter/{type}
│   │   └── unit-converter/        # Legacy non-prefixed converter (redirect)
│   │       ├── index.astro
│   │       └── [type].astro
│   │
│   └── styles/
│       └── global.css             # Design tokens + global styles (Tailwind @theme layer)
│
├── scripts/                       # Build-time utilities (run via vite-node)
│   ├── validate.ts                # Calculator + content integrity checks
│   ├── build-search.ts            # Builds the client-side search index
│   ├── audit-seo.ts               # Post-build SEO audit (titles, meta, schema)
│   ├── rollout-gate.ts            # Locale readiness evaluator
│   ├── translate.ts               # Translation generator/syncer
│   ├── generate-mdx.ts            # MDX content scaffolding
│   └── *.test.ts                  # Unit tests for each script
│
├── astro.config.mjs               # Astro config (i18n, sitemap, MDX, Tailwind)
├── wrangler.jsonc                  # Cloudflare Pages config (output dir only)
├── package.json
├── tsconfig.json
├── PRD.md                          # Product requirements / roadmap
├── DESIGN.md                       # Design language + component tokens
├── AGENTS.md / CLAUDE.md           # Dev workflow notes for AI agents
├── dist/                           # Build output (generated)
├── .astro/                         # Astro cache / generated types (generated)
└── .wrangler/                      # Wrangler local state (generated)
```

## Routing

All content lives under locale-prefixed URLs. Non-prefixed legacy URLs 301-redirect
to the English equivalent.

| Route | Source | Description |
| :--- | :--- | :--- |
| `/` | `pages/index.astro` | Redirects to `/en/` |
| `/{locale}` | `pages/[locale]/index.astro` | Localized homepage (category grid + popular calculators) |
| `/{locale}/{category}` | `pages/[locale]/[category]/index.astro` | Category hub (e.g. `/en/finance`) |
| `/{locale}/{category}/{slug}` | `pages/[locale]/[category]/[slug].astro` | Individual calculator page |
| `/{locale}/unit-converter` | `pages/[locale]/[converterHub]/index.astro` | Unit-converter hub |
| `/{locale}/unit-converter/{type}` | `pages/[locale]/[converterHub]/[type].astro` | A specific converter |
| `/en/about`, `/en/contact`, `/en/privacy`, `/en/terms` | `pages/en/*.astro` | English static pages |
| `/de/ueber-uns`, `/de/kontakt`, etc. | `pages/de/*.astro` | German static pages (localized slugs) |
| `/robots.txt` | `pages/robots.txt.ts` | Generated robots file |

Category ids: `finance`, `health`, `education`, `math`, `salary`, `shopping`,
`date-time`, `travel`.

## Key Features

- **40+ calculators** across 8 categories with full SEO page (intro, widget, how-it-works, worked example, FAQ, related links)
- **Currency converter** — 160+ currencies, live rates via Frankfurter API, interactive history chart (1W–5Y ranges), swap, keyboard-first UX
- **Unit converters** — length, weight, temperature, volume, area, speed and more
- **Multi-language** — 4 enabled locales, 5 more defined and ready to roll out
- **Locale-agnostic engine** — raw values + enum keys in, localized text out
- **Visitor preferences** — persistent locale, region, currency, unit system and theme (light/dark/system)
- **No-JS fallback** — server-rendered initial results for crawlers and no-JS users
- **Progressive enhancement** — live as-you-type calculation in the browser
- **Inline SVG charts** — pie, line, bar and gauge charts with zero dependencies
- **JSON-LD structured data** — `SoftwareApplication`, `FAQPage`, `BreadcrumbList` per page
- **Hreflang** — proper cross-locale linking for search engines
- **Core Web Vitals optimized** — `font-display: optional`, fingerprinted assets with 1-year cache, security headers
- **Google Analytics (GA4)** — typed event tracking (calculator views, language switches, search)
- **Client-side search** — pre-built search index shipped as a static JSON file
- **Content validation** — pre-build checks ensure every calculator has complete content
- **SEO audit** — post-build scan verifies titles, meta descriptions, schema markup

## Deployment

The site is fully static and targets Cloudflare Pages. `npm run deploy` builds the site to
`./dist` and uploads it via `wrangler pages deploy`. There is no Worker, KV namespace or
server binding — live currency rates and exchange-rate history are fetched directly from the
[Frankfurter API](https://frankfurter.dev) in the browser.

HTTP headers (`public/_headers`) set:
- 1-year immutable cache for fingerprinted `/_astro/*` assets
- `noindex` on the `*.pages.dev` preview domain
- Security headers: `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin` referrer, HSTS, restrictive Permissions-Policy

## Testing

```sh
npm run test          # single run (vitest run)
npm run test:watch    # watch mode
```

Tests cover the calculator engine contracts, i18n helpers, SEO schema generation,
content coverage, search indexing, the rollout gate and build scripts.

## Documentation

Full Astro documentation: https://docs.astro.build

Useful guides:

- [Project structure](https://docs.astro.build/en/basics/project-structure/)
- [Routing, dynamic routes & middleware](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components (React, Vue, Svelte, ...)](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Styling & Tailwind](https://docs.astro.build/en/guides/styling/)
- [Internationalization](https://docs.astro.build/en/guides/internationalization/)
