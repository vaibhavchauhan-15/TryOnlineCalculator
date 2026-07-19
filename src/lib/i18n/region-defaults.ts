// Region → formatting defaults. On the server we render each locale's page with
// its region's sensible defaults (currency, digit grouping, unit system); the
// client then re-renders live from the visitor's actual preferences (Task 6).
//
// This is intentionally small — it only needs the default regions of the
// enabled locales plus a safe fallback. It is the server-side seed, not the
// full currency catalog.

import type { UnitSystem } from '../preferences/store';
import { getLocale, DEFAULT_LOCALE } from './locales';

export interface RegionDefaults {
  currency: string;
  numberFormat: string;
  unitSystem: UnitSystem;
}

// Only the United States (plus Liberia/Myanmar) use imperial by default.
const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM']);

const REGION_CURRENCY: Record<string, string> = {
  US: 'USD',
  DE: 'EUR',
  ES: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  IN: 'INR',
  JP: 'JPY',
  BR: 'BRL',
  GB: 'GBP',
};

/** Formatting defaults for a locale, seeded from its default region. */
export function regionDefaultsForLocale(locale: string): RegionDefaults {
  const def = getLocale(locale) ?? getLocale(DEFAULT_LOCALE)!;
  const region = def.defaultRegion;
  return {
    currency: REGION_CURRENCY[region] ?? 'USD',
    // Digit grouping follows language + region (e.g. "de-DE", "en-IN").
    numberFormat: `${def.bcp47}-${region}`,
    unitSystem: IMPERIAL_REGIONS.has(region) ? 'imperial' : 'metric',
  };
}
