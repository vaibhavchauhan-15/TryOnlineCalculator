// Content collections for the internationalized site.
//
// Calculators live at src/content/calculators/{locale}/{slug}.mdx. The locale
// is the first path segment, so a single glob collection holds every language
// and the loader's `id` (e.g. "en/bmi-calculator") encodes both facets. The
// frontmatter is validated by the shared Zod schema (src/content/schema.ts),
// so a malformed or version-less document fails the build.

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { calculatorFrontmatterSchema } from './content/schema';

const calculators = defineCollection({
  // The glob loader would otherwise derive the entry id from the frontmatter
  // `slug` field, which is identical across locales (en/de/hi/es all use
  // "bmi-calculator") and would collide. Deriving the id from the FILE PATH
  // keeps the locale segment, so ids are "en/bmi-calculator", "de/…", etc.
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/calculators',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: calculatorFrontmatterSchema,
});

export const collections = { calculators };
