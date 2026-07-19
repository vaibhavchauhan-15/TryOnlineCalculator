// The calculator content contract — a standalone Zod schema for a localized
// calculator MDX document's frontmatter.
//
// It is defined here (not inline in content.config.ts) so three consumers share
// ONE source of truth:
//   1. the Astro content collection (build-time validation of every MDX file),
//   2. the AI localization CLI (Task 11) which stamps + validates output, and
//   3. the validator/QA gate (Task 13) and unit tests.
//
// The frontmatter carries everything the localization layer + SEO layer need:
//   * a result LABEL PACK (labels / enums / hints / chartTitles) that the
//     resolver maps the engine's machine keys onto,
//   * structured editorial content (intro / how-to / formula / FAQ),
//   * PER-FACET versioning so a change to the maths, the copy or the SEO can be
//     tracked independently and flag stale translations, and
//   * reserved AI/provenance fields for the localization pipeline.

import { z } from 'zod';

// A map of machine key → localized string (labels, enums, units, hints, titles).
const stringMap = z.record(z.string(), z.string());

export const faqItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

export const formulaItemSchema = z.object({
  name: z.string().min(1),
  expr: z.string().min(1),
  desc: z.string().optional(),
});

export const exampleSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

export const calculatorFrontmatterSchema = z
  .object({
    // --- Identity ----------------------------------------------------------
    slug: z.string().min(1),
    category: z.enum(['finance', 'health', 'education', 'date-time', 'salary', 'math', 'shopping', 'travel']),
    title: z.string().min(1),
    description: z.string().min(1),
    keywords: z.array(z.string()).default([]),

    // --- Per-facet versioning (required) -----------------------------------
    // Bumping a facet independently lets the staleness detector (Task 11) know
    // exactly what changed: the maths, the translated copy, or the SEO surface.
    calculatorVersion: z.number().int().positive(),
    seoVersion: z.number().int().positive(),
    translationVersion: z.number().int().positive(),

    // --- AI / provenance (reserved for the localization pipeline) ----------
    source: z.string().min(2), // locale this document was authored/translated from, e.g. "en"
    translatedFromVersion: z.number().int().positive().optional(),
    model: z.string().optional(), // model id that produced a translation
    lastReviewed: z.string().optional(), // ISO date of last human review

    // --- Editorial metadata ------------------------------------------------
    searchIntent: z.string().optional(),
    readingLevel: z.string().optional(),
    market: z.string().optional(),
    audience: z.string().optional(),

    // --- Result LABEL PACK (consumed by the resolver) ----------------------
    labels: stringMap.optional(),
    enums: stringMap.optional(),
    hints: stringMap.optional(),
    chartTitles: stringMap.optional(),

    // --- Structured editorial content --------------------------------------
    intro: z.string().optional(),
    formulaIntro: z.string().optional(),
    formulaItems: z.array(formulaItemSchema).default([]),
    howto: z.array(z.string()).default([]),
    examples: z.array(exampleSchema).default([]),
    faq: z.array(faqItemSchema).default([]),
    related: z.array(z.string()).default([]),
  })
  .strict(); // reject unknown frontmatter keys so typos surface at build time

export type CalculatorFrontmatter = z.infer<typeof calculatorFrontmatterSchema>;

/** Parse + validate, returning the safe-parse result (used by tests + the CLI). */
export function validateFrontmatter(data: unknown) {
  return calculatorFrontmatterSchema.safeParse(data);
}
