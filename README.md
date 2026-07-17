# Try Online Calculator

A single-domain hub of free, instant-answer calculators and unit converters spanning
Finance, Health, Education, Math, Salary, Shopping, Date & Time and Travel.

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
| Framework | [Astro 7](https://astro.build) (static output + islands) |
| Language | TypeScript |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) (via `@tailwindcss/vite`) + a token-based `global.css` |
| Fonts | Geist + Geist Mono (self-hosted `woff2` and Fontsource) |
| Hosting | [Cloudflare Pages](https://developers.cloudflare.com/pages/) — fully static, no adapter, Worker or server |
| Live data | [Frankfurter API](https://frankfurter.dev) fetched directly in the browser (currency rates + history) |
| Sitemap | `@astrojs/sitemap` |
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
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build (`astro build`) and deploy the static `./dist` to Cloudflare Pages (`wrangler pages deploy`) |
| `npm run astro ...` | Run Astro CLI commands (`astro add`, `astro check`, ...) |

## How It Works

The whole site is generated from **data**, not hand-authored pages.

1. Each calculator is a `Calculator` object (formula, inputs, FAQ, related links, SEO copy)
   defined in `src/lib/calculators/<category>.ts` and aggregated in `src/lib/calculators/index.ts`.
2. Categories are described once in `src/lib/categories.ts`.
3. Dynamic Astro routes (`src/pages/[category]/...` and `src/pages/unit-converter/...`)
   call `getStaticPaths()` to statically render one page per calculator, converter and
   category at build time.
4. The shared page template renders the widget, "how it works", worked examples, FAQ and
   related links, and emits `SoftwareApplication` / `FAQPage` / `BreadcrumbList` JSON-LD
   for structured data.
5. On the server, `render.ts` produces the initial result HTML (SEO + no-JS fallback).
   In the browser, `client.ts` mounts every `[data-calculator]` widget and re-runs the same
   `compute()` function live as the user types.

Adding a new calculator is mostly a matter of adding one more `Calculator` entry to the
relevant category file — no new route or template work required.

## Project Structure

```text
tryonlinecalculator.com/
├── public/                     # Static assets served as-is
│   ├── fonts/                  # Self-hosted Geist / Geist Mono woff2 files
│   ├── _headers                # Cloudflare Pages HTTP headers
│   ├── favicon.svg, favicon.ico, favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-192x192.png, web-app-manifest-512x512.png
│   └── site.webmanifest
│
├── src/
│   ├── assets/                 # Bundled/optimized assets (astro.svg, background.svg)
│   │
│   ├── components/             # Astro UI components
│   │   ├── Header.astro                # Site header / nav
│   │   ├── Footer.astro                # Site footer
│   │   ├── Search.astro                # Client-side calculator search
│   │   ├── CategoryCard.astro          # Category tile (homepage / hubs)
│   │   ├── CalculatorCard.astro        # Calculator tile in grids
│   │   ├── LinkCard.astro              # Generic link tile
│   │   ├── CalculatorWidget.astro      # Generic form-driven calculator widget
│   │   ├── CalculateButton.astro       # Shared calculate/submit control
│   │   ├── KeypadCalculator.astro      # Visual basic/scientific keypad
│   │   ├── FractionCalculator.astro    # Visual fraction calculator
│   │   ├── PercentageCalculator.astro  # Visual percentage calculator
│   │   ├── AverageCalculator.astro     # Visual average calculator
│   │   ├── UnitConverter.astro         # Interactive unit-converter widget
│   │   ├── GpaCalculator.astro         # Guided GPA widget
│   │   ├── GradeCalculator.astro       # Guided grade widget
│   │   ├── FinalGradeCalculator.astro  # Guided final-grade widget
│   │   ├── AverageGradeCalculator.astro# Guided average-grade widget
│   │   ├── FaqAccordion.astro          # Reusable FAQ accordion
│   │   ├── HomeFaq.astro               # Homepage FAQ block
│   │   └── Agentation.astro            # Agentation integration snippet
│   │
│   ├── layouts/
│   │   └── Layout.astro         # Base HTML shell: <head>, meta, JSON-LD, header/footer
│   │
│   ├── lib/                     # Framework-agnostic engine + content (TypeScript)
│   │   ├── calculators/         # Calculator definitions, grouped by category
│   │   │   ├── index.ts         # Aggregates all calculators + lookup/search helpers
│   │   │   ├── finance.ts
│   │   │   ├── health.ts
│   │   │   ├── education.ts
│   │   │   ├── math.ts
│   │   │   ├── salary.ts
│   │   │   ├── shopping.ts
│   │   │   ├── date-time.ts
│   │   │   ├── travel.ts
│   │   │   ├── _expr.ts         # Safe expression parser (keypad calculators)
│   │   │   └── _math.ts         # Shared math helpers
│   │   ├── types.ts             # Core engine types (Calculator, Category, ChartSpec, ...)
│   │   ├── categories.ts        # Category metadata + lookup
│   │   ├── converters.ts        # Unit-converter engine + content (self-contained data)
│   │   ├── client.ts            # Browser runtime: mounts + runs live widgets
│   │   ├── render.ts            # Pure result -> HTML (server + client)
│   │   ├── charts.ts            # Dependency-free inline SVG charts
│   │   ├── seo.ts               # JSON-LD schema builders (SoftwareApplication, FAQ, etc.)
│   │   ├── format.ts            # Number/currency/date formatting
│   │   ├── history.ts           # Result history + copy-to-clipboard UI
│   │   ├── storage.ts           # localStorage persistence for widget state
│   │   ├── dropdown.ts          # Dropdown UI behavior
│   │   ├── icons.ts             # Inline SVG icon set
│   │   ├── faq.ts               # Shared FAQ content helpers
│   │   └── client.ts            # (see above)
│   │
│   ├── pages/                   # File-based routes
│   │   ├── index.astro          # Homepage
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── privacy.astro
│   │   ├── terms.astro
│   │   ├── 404.astro
│   │   ├── 500.astro
│   │   ├── robots.txt.ts        # Generated robots.txt
│   │   ├── [category]/          # Category hub + calculator pages
│   │   │   ├── index.astro      # /{category} hub listing
│   │   │   └── [slug].astro     # /{category}/{calculator-slug}
│   │   └── unit-converter/
│   │       ├── index.astro      # Unit-converter hub
│   │       └── [type].astro     # /unit-converter/{type}
│   │
│   └── styles/
│       └── global.css           # Design tokens + global styles (Tailwind layer)
│
├── astro.config.mjs             # Astro config (static output, sitemap, Tailwind)
├── wrangler.jsonc               # Cloudflare Pages config (static output dir only)
├── package.json
├── tsconfig.json
├── PRD.md                       # Product requirements / roadmap
├── DESIGN.md                    # Design language + component tokens
├── AGENTS.md / CLAUDE.md        # Dev workflow notes for AI agents
├── dist/                        # Build output (generated)
├── .astro/                      # Astro cache / generated types (generated)
└── .wrangler/                   # Wrangler local state (generated)
```

## Routing

| Route | Source | Description |
| :--- | :--- | :--- |
| `/` | `pages/index.astro` | Homepage with category grid + popular calculators |
| `/{category}` | `pages/[category]/index.astro` | Category hub (e.g. `/finance`, `/health`) |
| `/{category}/{slug}` | `pages/[category]/[slug].astro` | Individual calculator page |
| `/unit-converter` | `pages/unit-converter/index.astro` | Unit-converter hub |
| `/unit-converter/{type}` | `pages/unit-converter/[type].astro` | A specific converter (length, weight, ...) |
| `/about`, `/contact`, `/privacy`, `/terms` | `pages/*.astro` | Static content pages |
| `/robots.txt` | `pages/robots.txt.ts` | Generated robots file |
| `404`, `500` | `pages/404.astro`, `pages/500.astro` | Error pages |

Category ids in use: `finance`, `health`, `education`, `math`, `salary`, `shopping`,
`date-time`, `travel` (see `src/lib/types.ts` and `src/lib/categories.ts`).

## Deployment

The site is fully static and targets Cloudflare Pages. `npm run deploy` builds the site to
`./dist` and uploads it via `wrangler pages deploy`. There is no Worker, KV namespace or
server binding — live currency rates and exchange-rate history are fetched directly from the
[Frankfurter API](https://frankfurter.dev) in the browser. Static-hosting config lives in
`wrangler.jsonc` (just the build output dir); HTTP headers are set in `public/_headers`.

## Documentation

Full Astro documentation: https://docs.astro.build

Useful guides:

- [Project structure](https://docs.astro.build/en/basics/project-structure/)
- [Routing, dynamic routes & middleware](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components (React, Vue, Svelte, ...)](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Styling & Tailwind](https://docs.astro.build/en/guides/styling/)
