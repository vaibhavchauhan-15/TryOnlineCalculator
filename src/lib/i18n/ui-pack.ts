// Shared UI/chrome/category packs — the localized strings that are NOT tied to
// a single calculator (chrome labels, unit words, category display names).
//
// Kept separate from content.ts (which imports `astro:content` to load
// calculator MDX) so this module has ZERO Astro-runtime dependencies and can be
// imported by the SEO builders + unit tests directly.

import { DEFAULT_LOCALE } from './locales';

// Shared UI packs. All locale JSONs are matched eagerly; missing locales simply
// fall back to English via uiPack(). import.meta.glob keeps this in sync when a
// new locale pack is added by the localization CLI (Task 11) — no code change.
const UI_MODULES = import.meta.glob<{ default: UiPack }>('../../content/ui/*.json', { eager: true });

export interface UiPack {
  units?: Record<string, string>;
  chrome?: Record<string, string>;
  categories?: Record<string, string>;
  /** Strings for the localized home + category landing shells. */
  home?: Record<string, string>;
  /** Strings for the site footer. */
  footer?: Record<string, string>;
  /** Strings for localized error pages (404, 500). */
  errors?: Record<string, string>;
}

const UI_PACKS: Record<string, UiPack> = {};
for (const [path, mod] of Object.entries(UI_MODULES)) {
  const code = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '');
  UI_PACKS[code] = (mod as { default: UiPack }).default;
}

/** The shared UI pack for a locale, falling back to English. */
export function uiPack(locale: string): UiPack {
  return UI_PACKS[locale] ?? UI_PACKS[DEFAULT_LOCALE];
}

/** Localized category display name, falling back to English then the id. */
export function categoryName(locale: string, id: string): string {
  return uiPack(locale).categories?.[id] ?? uiPack(DEFAULT_LOCALE).categories?.[id] ?? id;
}
