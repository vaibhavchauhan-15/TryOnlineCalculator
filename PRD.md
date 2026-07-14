# CalculatorHub - Phase 1 PRD

Version: 1.0
Status: Planning
Target: Production MVP
Framework: Next.js 15 + React 19 + TypeScript

---

# 1. Product Overview

## Product Name

**CalculatorHub**

---

## Mission

Build the internet's most comprehensive collection of modern, lightning-fast, SEO-optimized calculators.

The product should solve everyday calculation problems across:

* Finance
* Health
* Education
* Math
* Salary
* Shopping
* Date & Time
* Travel

while providing an excellent user experience and dominating organic search.

---

# 2. Vision

Create a calculator website that becomes the default destination whenever someone searches:

* mortgage calculator
* bmi calculator
* calorie calculator
* investment calculator
* age calculator
* loan calculator
* grade calculator

Goal:

> Become one of the largest calculator websites with 150+ calculators over multiple development phases.

---

# 3. Success Metrics

## Technical

* Lighthouse Performance ≥ 98
* SEO ≥ 100
* Accessibility ≥ 95
* Best Practices ≥ 100

---

## UX

First Contentful Paint

< 1 second

Largest Contentful Paint

< 2 seconds

Interaction to Next Paint

< 150ms

CLS

< 0.05

---

## Business

Phase 1 goals

* 30–35 calculators
* 100 indexed pages
* 10k monthly visitors
* 100 referring domains
* Top 10 ranking for long-tail calculator keywords

---

# 4. Target Users

## Primary

People who need quick calculations.

Examples

* Students
* Home buyers
* Investors
* Fitness enthusiasts
* Office workers
* Engineers
* Teachers

---

## Secondary

Professionals

* Accountants
* HR
* Financial advisors
* Doctors
* Nutritionists

---

# 5. Product Principles

The product must be

* Extremely fast
* Mobile-first
* Accessible
* SEO-first
* Privacy-friendly
* No login required
* No unnecessary animations
* Easy to use in under 10 seconds

---

# 6. Tech Stack

## Frontend

* Next.js 15 (App Router)
* React 19
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* Framer Motion (minimal)

---

## State

* Zustand

---

## Data

Static JSON

Future

PostgreSQL + Supabase

---

## Deployment

* Vercel
* Cloudflare CDN

---

## Analytics

* Google Analytics 4
* Google Search Console
* Microsoft Clarity
* Plausible (optional)

---

# 7. Phase 1 Calculators

## Math

* Basic Calculator
* Scientific Calculator
* Percentage Calculator
* Fraction Calculator
* Average Calculator

---

## Finance

* Mortgage Calculator
* Loan Calculator
* Auto Loan Calculator
* Car Payment Calculator
* Investment Calculator
* Compound Interest Calculator
* Savings Calculator
* APR Calculator
* Interest Calculator
* Retirement Calculator

---

## Health

* BMI Calculator
* BMR Calculator
* TDEE Calculator
* Calorie Calculator
* Macro Calculator
* Water Intake Calculator
* Ideal Weight Calculator

---

## Education

* GPA Calculator (US)
* Grade Calculator
* Final Grade Calculator
* Average Grade Calculator

---

## Date

* Age Calculator
* Date Difference Calculator
* Business Days Calculator
* Working Days Calculator

---

## Salary

* Salary Calculator
* Hourly Wage Calculator
* Paycheck Calculator (US)

---

## Shopping

* Discount Calculator
* Tip Calculator
* Sales Tax Calculator

---

## Travel

* Fuel Cost Calculator
* Mileage Calculator

Total calculators

≈35

---

# 8. Site Architecture

```
/
├── finance/
│   ├── mortgage-calculator
│   ├── loan-calculator
│   ├── investment-calculator
│   └── compound-interest-calculator
│
├── health/
├── education/
├── salary/
├── shopping/
├── travel/
├── math/
├── date-time/
│
├── about
├── privacy
├── terms
├── contact
├── sitemap.xml
└── robots.txt
```

---

# 9. Homepage Requirements

Hero

* Search bar
* Popular calculators
* Category grid
* CTA buttons

Sections

* Popular Calculators
* Finance
* Health
* Education
* Math
* Date & Time
* Recently Added
* FAQ
* Featured Guides

Footer

* Categories
* Company
* Legal
* Sitemap

---

# 10. Calculator Page Layout

Every calculator page MUST follow the exact structure.

```
Breadcrumb

Title

Description

Calculator Card

Result Card

Charts (optional)

Formula

Step-by-step Explanation

Examples

FAQ

Related Calculators

Internal Links

Schema Markup
```

---

# 11. Calculator Component System

Reusable components

```
CalculatorLayout

CalculatorCard

InputField

Slider

UnitToggle

Dropdown

ResultCard

CopyButton

ShareButton

PrintButton

ResetButton

SaveButton

HistoryPanel

FormulaBox

ExampleSection

FAQ

RelatedCalculatorGrid

ErrorMessage

LoadingSkeleton
```

---

# 12. Design System

Style

Modern

Minimal

Apple + Stripe inspired

---

Colors

Primary

Blue

Accent

Emerald

Background

White

Dark

Gray 950

Success

Green

Warning

Orange

Error

Red

---

Radius

16px

---

Spacing

8-point grid

---

Typography

Geist

Inter

---

Icons

Lucide React

---

# 13. Responsive Design

Desktop

1440+

Laptop

1024

Tablet

768

Mobile

360+

Every calculator must be fully usable on mobile.

---

# 14. Accessibility

Must support

Keyboard navigation

ARIA labels

Screen readers

High contrast

Visible focus states

Semantic HTML

WCAG AA

---

# 15. Performance

No hydration errors

No layout shift

Lazy loading

Dynamic imports

Image optimization

Tree shaking

Code splitting

Memoization

Server Components where possible

---

# 16. SEO Requirements

Every calculator page requires

Unique

* Title
* Meta description
* Canonical
* OpenGraph
* Twitter Card

Schema

* FAQ
* Breadcrumb
* WebPage
* SoftwareApplication
* HowTo (where applicable)

Generate

* XML Sitemap
* Robots.txt
* RSS Feed (future)

---

# 17. Internal Linking

Every calculator page links to

* Related calculators
* Same category
* Parent category
* Homepage
* Guides

Goal

Strong topical authority.

---

# 18. Search

Global search

Features

* Instant search
* Fuzzy search
* Keyboard shortcuts
* Category filters
* Popular searches

---

# 19. Favorites

Allow users to

* Save calculators
* Recently visited
* LocalStorage only

No login.

---

# 20. History

Store

* Recent calculations
* Last values
* Unit preferences

Using LocalStorage.

---

# 21. Error Handling

Invalid inputs

Division by zero

Negative values

Overflow

NaN

Infinity

Helpful validation messages.

---

# 22. Internationalization

Future-ready

Architecture must support

* Multiple languages
* Multiple currencies
* Metric/Imperial
* Locale formatting

---

# 23. Analytics Events

Track

Homepage search

Calculator opened

Calculation performed

Reset clicked

Share clicked

Copy clicked

Time on calculator

Most used calculator

---

# 24. Security

Sanitize all inputs

Validate client-side

Validate server-side (future)

No XSS

No unsafe HTML

Strict CSP

HTTPS only

---

# 25. Testing

Unit Tests

* Vitest

Component Tests

* React Testing Library

E2E

* Playwright

Coverage target

90%

---

# 26. Code Standards

Strict TypeScript

ESLint

Prettier

Absolute imports

Feature-based architecture

Reusable hooks

Reusable utilities

No duplicated business logic

---

# 27. Folder Structure

```
app/

components/
  calculator/
  ui/
  layout/

features/
  finance/
  health/
  math/
  education/

hooks/

lib/

utils/

types/

data/

public/

styles/
```

---

# 28. Future Phases

## Phase 2

Finance Expansion

25 calculators

---

## Phase 3

Health Expansion

25 calculators

---

## Phase 4

Education Expansion

15 calculators

---

## Phase 5

Home Calculators

15 calculators

---

## Phase 6

Shopping

10 calculators

---

## Phase 7

Date & Time

10 calculators

---

## Phase 8

Salary

10 calculators

---

## Phase 9

Travel

10 calculators

---

## Phase 10

Business

15 calculators

---

## Phase 11

Pet

8 calculators

---

## Phase 12

Advanced Math

10 calculators

---

# 29. Definition of Done

A calculator is considered complete only if it includes:

* Responsive UI
* Input validation
* Accurate formulas
* Result explanations
* Formula section
* Worked examples
* FAQ
* SEO metadata
* JSON-LD schema
* Accessibility support
* Analytics events
* Unit tests
* E2E tests
* Lighthouse score ≥98
* Mobile optimization
* Internal linking
* Related calculators
* Print support
* Share support
* Copy result support

---

# 30. AI Agent Instructions

The AI development agent must follow these rules:

1. Never duplicate components or business logic.
2. Build every calculator from reusable primitives.
3. Prioritize Server Components unless client interactivity is required.
4. Use strict TypeScript with no `any` types.
5. Keep calculators modular and independently testable.
6. Generate SEO metadata and JSON-LD for every calculator page.
7. Optimize for Core Web Vitals and mobile-first performance.
8. Use accessible HTML, proper labels, and keyboard navigation.
9. Validate all user inputs and handle edge cases gracefully.
10. Ensure all formulas are mathematically verified before implementation.
11. Maintain a consistent design system across all pages.
12. Design the architecture so adding the next 150+ calculators requires minimal code changes.

---

# Phase 1 Deliverables

* 35 production-ready calculators
* Reusable calculator engine
* Global search
* Category pages
* SEO-ready architecture
* Analytics integration
* Responsive design
* Accessibility compliance
* Test suite
* Deployment to Vercel
* Documentation for future calculator expansion

**End of PRD**
