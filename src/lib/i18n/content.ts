// Content access for the localization layer — loads a calculator's localized
// MDX (label pack + editorial content) and the shared UI/units pack, and
// assembles the LabelPack the resolver consumes, with English fallback baked in.
//
// This is the ONE place that knows how content is stored (Astro content
// collection + JSON UI packs); the resolver and renderer stay content-agnostic.

import { getEntry, type CollectionEntry } from 'astro:content';
import type { LabelPack } from './resolver';
import { DEFAULT_LOCALE } from './locales';
import { uiPack, categoryName } from './ui-pack';

// Re-export the UI-pack helpers so existing importers of content.ts keep
// working (uiPack/categoryName now live in the Astro-runtime-free ui-pack.ts).
export { uiPack, categoryName };

/** Turn a calculator MDX entry's frontmatter into a resolver LabelPack. */
function toLabelPack(entry: CollectionEntry<'calculators'>, locale: string): LabelPack {
  const d = entry.data;
  return {
    labels: d.labels,
    enums: d.enums,
    hints: d.hints,
    chartTitles: d.chartTitles,
    units: uiPack(locale).units,
  };
}

export interface LocalizedCalculatorContent {
  entry: CollectionEntry<'calculators'>;
  /** LabelPack for the requested locale. */
  pack: LabelPack;
  /** English LabelPack used as the render-time fallback for missing keys. */
  fallback: LabelPack;
}

/**
 * Load a calculator's content for a locale, with the English document as the
 * fallback pack. Returns null when neither the requested locale nor English has
 * the document (so the route can 404 cleanly).
 */
export async function getCalculatorContent(
  slug: string,
  locale: string,
): Promise<LocalizedCalculatorContent | null> {
  const enEntry = await getEntry('calculators', `${DEFAULT_LOCALE}/${slug}`);
  const fallback: LabelPack = enEntry
    ? toLabelPack(enEntry, DEFAULT_LOCALE)
    : { units: uiPack(DEFAULT_LOCALE).units };

  const localeEntry =
    locale === DEFAULT_LOCALE ? enEntry : await getEntry('calculators', `${locale}/${slug}`);

  // Render-time English fallback: if this locale is not yet translated, serve
  // the English document but keep the requested locale's formatting context.
  const entry = localeEntry ?? enEntry;
  if (!entry) return null;

  return {
    entry,
    pack: toLabelPack(entry, entry === enEntry ? DEFAULT_LOCALE : locale),
    fallback,
  };
}
