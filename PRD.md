# PRD.md — Try Online Calculator

**Domain:** tryonlinecalculator.com
**Product Type:** Multi-niche calculator utility website (SEO-first, ad/affiliate monetized)
**Author:** Vaibhav Chauhan
**Status:** Draft v1.0
**Assumption:** "ATS friendly" interpreted as **SEO/structured-data friendly** (semantic HTML, schema.org markup, crawlability) since ATS applies to resumes, not websites. Flag if a different meaning was intended.

---

## 1. Product Overview

Try Online Calculator (TOC) is a single-domain hub of free, instant-answer calculators spanning Finance, Health, Education, Math, Date/Time, Salary, Shopping, Travel, Pets, Business, and Construction. Model follows proven micro-tool sites (iLovePDF, Omni Calculator, CalculatorSoup) — each tool is a standalone SEO landing page targeting one high-intent keyword, all sharing one reusable calculator engine and design system.

**Core thesis:** Don't build category-by-category. Launch the 30–40 highest-search-volume, highest-utility calculators across *every* niche first → signals topical authority to Google fast → compounding organic traffic → then backfill each niche into a full hub.

---

## 2. Goals

| Goal | Metric |
|---|---|
| Launch fast | MVP live in 3–4 weeks |
| SEO indexing | 90%+ of Phase 1 pages indexed within 30 days of launch |
| Traffic | 10K organic sessions/mo by end of Phase 3 |
| Topical authority | Rank top-10 for ≥15 Phase 1 keywords within 90 days |
| Monetization-ready | AdSense/Ezoic approved + integrated by Phase 2 |
| Reusability | New calculator ships in <1 day using shared engine (post-MVP) |

## 3. Non-Goals (v1)

- No user accounts / login
- No paid tiers or premium calculators (ads/affiliate only)
- No native mobile app
- No multi-language support (English only, v1)

## 4. Target Users

- Users with urgent, transactional search intent ("mortgage calculator", "bmi calculator") — want an instant answer, not a signup
- Students (GPA/grade calculators), job seekers (salary calculators), homeowners (mortgage/loan), fitness users (BMI/TDEE), small business owners (GST/invoice/break-even)
- Zero tolerance for friction: no login, <2s load, mobile-first

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router, SSG + ISR) | SEO-critical: pre-rendered HTML, fast TTFB, incremental rebuilds when calculators added |
| Language | TypeScript | Type-safe shared calculator engine across 180+ tools |
| Styling | Tailwind CSS | Fast, consistent design system at scale |
| Calc Engine | Shared `lib/calculators/*.ts` — one pure function per formula + Zod input validation | Decouples math logic from UI; unit-testable |
| Hosting | Vercel | Native Next.js ISR, edge caching, fast global delivery |
| Analytics | GA4 + Google Search Console + Vercel Analytics | Track per-calculator traffic/conversions |
| Monetization | Google AdSense (or Ezoic once >10k sessions/mo) | Passive revenue model per your micro-SaaS interest |
| Search widget | Algolia or local Fuse.js site search | Cross-linking between 180+ tools |
| Forms/Schema | react-hook-form + zod | Input validation on every calculator |
| CMS (optional, Phase 3+) | MDX for FAQ/content blocks | Non-dev content edits without redeploy |

---

## 6. Site Architecture / URL Structure

```
tryonlinecalculator.com/
├── finance/
│   ├── mortgage-calculator
│   ├── loan-calculator
│   ├── auto-loan-calculator
│   ├── investment-calculator
│   └── compound-interest-calculator
├── health/
│   ├── bmi-calculator
│   ├── bmr-calculator
│   └── calorie-calculator
├── education/
│   ├── gpa-calculator
│   ├── grade-calculator
│   └── percentage-calculator
├── salary/
├── math/
├── shopping/
├── travel/
├── date-time/
├── business/
├── pets/
├── home/
└── sitemap.xml / robots.txt
```

**URL rules:** lowercase, hyphenated, `/category/tool-name-calculator` — no query params for canonical pages, no trailing slash inconsistency, no duplicate slugs across categories.

---

## 7. Reusable Calculator Page Template

Every calculator page (180+ instances) must ship with this exact structure — this is the repeatable unit that makes the whole roadmap tractable:

1. **H1** — exact match primary keyword ("Mortgage Calculator")
2. **Intro** (40–60 words) — restates search intent, sets expectation
3. **Calculator widget** — inputs, instant client-side calc, no page reload
4. **Result breakdown** — not just one number; show the components (e.g., mortgage → principal, interest, tax, insurance)
5. **"How it works"** — formula explained in plain English + the actual formula
6. **Worked example** — one realistic sample calculation
7. **FAQ block** (3–6 Q&As) — targets long-tail/People Also Ask queries, marked up with `FAQPage` schema
8. **Related calculators** — 4–6 internal links within same/adjacent category (critical for internal link equity)
9. **Last updated date** — freshness signal for Google

### Per-page SEO checklist
- [ ] Unique `<title>`: `{Calculator Name} — Free Online {Category} Tool | Try Online Calculator`
- [ ] Unique meta description (150–160 chars, includes primary keyword)
- [ ] Canonical tag
- [ ] Open Graph + Twitter card tags
- [ ] Schema.org: `SoftwareApplication` (the tool) + `FAQPage` (the FAQ block)
- [ ] Semantic HTML: one `<h1>`, proper `<label for>` on every input (accessibility + ATS-style structured crawlability)
- [ ] Alt text on any illustrative image/icon
- [ ] Internal links: min 4 to related calculators, 1 to category hub
- [ ] Core Web Vitals: LCP <2.5s, CLS <0.1, INP <200ms
- [ ] Min 600–800 words unique content per page (thin-content penalty avoidance across 180 near-similar pages)

---

## Phase 1 — MVP Core (≈35 Calculators)

**Timeline:** 3–4 weeks
**Objective:** Ship calculator engine + design system + highest-demand tool per category. Every category gets a foothold so Google sees breadth immediately.

**Definition of Done:** Design system finalized, calculator engine abstraction proven across ≥3 different formula types (loan amortization, BMI, date-diff), all 35 pages live + indexed in Search Console, sitemap submitted.

### 🏦 Finance (⭐⭐⭐⭐⭐ priority)
1. Mortgage Calculator
2. Loan Calculator
3. Auto Loan Calculator
4. Car Payment Calculator
5. Investment Calculator
6. Compound Interest Calculator
7. Savings Calculator
8. Interest Calculator
9. APR Calculator
10. Retirement Calculator

### ❤️ Health
11. BMI Calculator
12. BMR Calculator
13. TDEE Calculator
14. Calorie Calculator
15. Macro Calculator
16. Water Intake Calculator
17. Ideal Weight Calculator

### 🎓 Education
18. GPA Calculator (US)
19. Grade Calculator
20. Final Grade Calculator
21. Percentage Calculator
22. Average Calculator

### 📅 Date & Time
23. Age Calculator
24. Date Difference Calculator
25. Business Days Calculator
26. Working Days Calculator

### 💼 Salary
27. Salary Calculator
28. Hourly Wage Calculator
29. Paycheck Calculator

### 🧮 Math
30. Basic Calculator
31. Scientific Calculator
32. Fraction Calculator

### 🛒 Shopping
33. Discount Calculator
34. Tip Calculator

### 🚗 Travel
35. Fuel Cost Calculator

---

## Phase 2 — Personal Finance Expansion (25)

**Rationale:** Finance calculators carry the highest CPC (AdSense/affiliate) and strongest long-term SEO equity — go deep here right after MVP validates the engine.

1. Mortgage Affordability
2. House Affordability
3. Refinance Calculator
4. Down Payment Calculator
5. Student Loan Calculator
6. Credit Card Payoff
7. Debt Payoff
8. Emergency Fund
9. Net Worth
10. Inflation
11. Budget
12. Leasing vs Buying
13. Car Depreciation
14. ROI
15. Profit Margin
16. Break Even
17. Markup
18. VAT
19. GST
20. Invoice
21. Cash Flow
22. Future Value
23. Present Value
24. Loan EMI
25. Amortization Schedule

*Note: GST/Invoice calculators overlap with your earlier GST SaaS research — reuse those formula/compliance notes here.*

---

## Phase 3 — Health Hub (25)

**Rationale:** Second-highest CPC niche + huge long-tail search volume (pregnancy, fitness, macros).

1. Body Fat %
2. Protein Intake
3. Lean Body Mass
4. Pregnancy Due Date
5. Ovulation Calculator
6. Pregnancy Test Calculator
7. BAC Calculator
8. Heart Rate Zones
9. Sleep Calculator
10. Running Pace Calculator
11. Walking Calories
12. Cycling Calories
13. One Rep Max
14. Target Heart Rate
15. Waist to Height Ratio
16. Waist Hip Ratio
17. Healthy Weight Range
18. Body Surface Area
19. Child BMI
20. Pregnancy Weight Gain
21. Calories Burned
22. Water by Weight
23. Intermittent Fasting Calculator
24. Fat Loss Calculator
25. Muscle Gain Calculator

---

## Phase 4 — Education (15)

1. CGPA Calculator
2. Weighted Grade Calculator
3. Attendance Calculator
4. Study Time Calculator
5. SAT Score Calculator
6. ACT Score Calculator
7. College GPA Calculator
8. Semester GPA Calculator
9. Cumulative GPA Calculator
10. Marks Percentage Calculator
11. Credit Hour GPA Calculator
12. Exam Average Calculator
13. Final Exam Score Calculator
14. Grade Point Calculator
15. Percentage Increase Calculator

---

## Phase 5 — Home & Construction (15)

1. Paint Calculator
2. Concrete Calculator
3. Flooring Calculator
4. Tile Calculator
5. Wallpaper Calculator
6. Gravel Calculator
7. Roofing Calculator
8. Mulch Calculator
9. Fence Calculator
10. Brick Calculator
11. Asphalt Calculator
12. Decking Calculator
13. Paver Calculator
14. Pool Volume Calculator
15. Room Size Calculator

---

## Phase 6 — Shopping & Daily Life (10)

1. Cashback Calculator
2. Coupon Savings Calculator
3. Unit Price Calculator
4. Price Per Ounce Calculator
5. Discount Calculator (advanced/stacked)
6. Sales Tax Calculator
7. Tip Calculator (advanced/group)
8. Split Bill Calculator
9. Currency Calculator
10. Cost Per Use Calculator

---

## Phase 7 — Date & Time (10)

1. Countdown Calculator
2. Leap Year Calculator
3. Time Duration Calculator
4. Time Zone Calculator
5. Calendar Weeks Calculator
6. Months Between Dates
7. Working Hours Calculator
8. Payroll Hours Calculator
9. Shift Hours Calculator
10. Business Hours Calculator

---

## Phase 8 — Career & Salary (10)

1. Overtime Calculator
2. Raise Calculator
3. Bonus Calculator
4. Freelance Rate Calculator
5. Cost of Living Calculator
6. Net Salary Calculator
7. Gross Salary Calculator
8. Hourly to Salary Calculator
9. Salary to Hourly Calculator
10. Commission Calculator

---

## Phase 9 — Travel (10)

1. Road Trip Cost Calculator
2. Fuel Economy Calculator
3. Flight Carbon Calculator
4. Distance Calculator
5. Travel Time Calculator
6. Fuel Split Calculator
7. Hotel Cost Calculator
8. Vacation Budget Calculator
9. Toll Cost Calculator
10. Trip Budget Calculator

---

## Phase 10 — Pet (8)

1. Dog Age Calculator
2. Cat Age Calculator
3. Dog Calorie Calculator
4. Dog Food Calculator
5. Pet Medication Dosage Calculator
6. Puppy Growth Calculator
7. Cat Calorie Calculator
8. Dog BMI Calculator

---

## Phase 11 — Business (15)

1. ROI Calculator (advanced)
2. Profit Margin Calculator
3. Gross Margin Calculator
4. Operating Margin Calculator
5. Break Even Calculator (advanced)
6. CAC Calculator
7. LTV Calculator
8. Revenue Growth Calculator
9. Churn Calculator
10. Inventory Turnover Calculator
11. Burn Rate Calculator
12. Runway Calculator
13. Invoice Calculator (advanced)
14. Tax Calculator (business)
15. VAT Calculator (advanced)

---

## Phase 12 — Advanced Math (10)

1. Graphing Calculator
2. Matrix Calculator
3. Equation Solver
4. Quadratic Solver
5. Derivative Calculator
6. Integral Calculator
7. Log Calculator
8. Binary Calculator
9. Hex Calculator
10. Complex Numbers Calculator

---

## 8. Roadmap Summary

| Phase | Focus | Calculators | Cumulative |
|---|---|---:|---:|
| 1 | Core MVP (cross-category) | 35 | 35 |
| 2 | Personal Finance | 25 | 60 |
| 3 | Health Hub | 25 | 85 |
| 4 | Education | 15 | 100 |
| 5 | Home & Construction | 15 | 115 |
| 6 | Shopping & Daily Life | 10 | 125 |
| 7 | Date & Time | 10 | 135 |
| 8 | Career & Salary | 10 | 145 |
| 9 | Travel | 10 | 155 |
| 10 | Pet | 8 | 163 |
| 11 | Business | 15 | 178 |
| 12 | Advanced Math | 10 | 188 |

**Total: ≈188 calculators**

---

## 9. Monetization Strategy

- **Phase 1–2:** Apply for Google AdSense once ~30 pages indexed with real content; display ads (non-intrusive, below-the-fold + sidebar) on all pages
- **Phase 2+:** Layer in affiliate links on finance calculators (loan/credit card providers) and health calculators (supplement/fitness affiliate programs) where contextually relevant
- **Phase 3+ (optional):** Evaluate Ezoic/Mediavine once traffic crosses their thresholds (~10K sessions/mo) for better RPM than AdSense alone
- No paywalls — monetization stays passive/ad-based per micro-SaaS, low-maintenance model

## 10. Success Metrics (KPIs)

| Metric | Phase 1 target | Phase 3 target |
|---|---|---|
| Indexed pages | 90% within 30 days | 95%+ |
| Organic sessions/mo | 1,000 | 10,000 |
| Avg. position (tracked keywords) | Top 30 | Top 10 |
| Bounce rate | <70% | <60% |
| Core Web Vitals pass rate | 90%+ pages | 95%+ pages |
| AdSense RPM | N/A (pre-approval) | Baseline established |

## 11. Launch Checklist (per phase)

- [ ] All calculators unit-tested (formula correctness — critical, wrong math = trust death)
- [ ] Mobile responsive audit
- [ ] Sitemap.xml regenerated + resubmitted to GSC
- [ ] Internal linking pass (no orphan pages)
- [ ] Schema markup validated (Google Rich Results Test)
- [ ] Core Web Vitals audit (Lighthouse ≥90 all categories)
- [ ] Analytics events firing (calculator "used" event per tool)
- [ ] 404/redirect audit for any renamed slugs

## 12. Risks

| Risk | Mitigation |
|---|---|
| Thin/duplicate content penalty across 180+ similar pages | Enforce 600–800 unique words + unique FAQ per page, no templated filler |
| Formula errors damaging trust/SEO | Unit tests + cite formula source in "How it works" section |
| Slow indexing due to site size | Submit sitemap in batches per phase, internal linking discipline, not all 188 at once |
| AdSense rejection (thin content at launch) | Don't apply until Phase 1 fully fleshed with real content, not placeholder text |
| Category cannibalization (e.g., "ROI Calculator" in both Phase 2 and Phase 11) | Canonicalize to one version; cross-link instead of duplicating |