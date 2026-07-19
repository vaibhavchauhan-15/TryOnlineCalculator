// Unified preferences store — one place that owns every per-visitor setting.
//
// The key design decision is separating *content language* from *region*:
//
//   locale       what language the page content is in   → drives the URL + MDX
//   region       where the visitor is / how they format → drives Intl grouping,
//                currency default and unit system
//
// So "English content, formatted for India, in INR, metric" is fully
// representable ({ locale:"en", region:"IN", currency:"INR",
// numberFormat:"en-IN", unitSystem:"metric" }) — the case a single "locale"
// field cannot express.
//
// Migration + safety:
//   * Backward-compatible. Theme still mirrors to the legacy `theme` key that
//     the pre-paint inline script reads, and currency still mirrors to the
//     legacy currency key that src/lib/currency.ts reads, so nothing that
//     depends on those breaks while we migrate callers over.
//   * SSR-safe. Every browser API is feature-detected; on the server the store
//     resolves to sensible defaults and never throws.
//   * Reactive. subscribe() fires on any change; callers can watch a single
//     facet (see subscribeKey) to avoid needless re-renders.

import { loadState, saveState } from '../storage';
import { DEFAULT_LOCALE, isEnabledLocale, getLocale } from '../i18n/locales';
import { track } from '../analytics';

export type ThemePref = 'light' | 'dark' | 'system';
export type UnitSystem = 'metric' | 'imperial';

export interface Preferences {
  /** Content language (ISO 639-1). Must be an enabled locale. */
  locale: string;
  /** ISO 3166 region for formatting/currency/units, independent of language. */
  region: string;
  /** ISO 4217 currency code for monetary display. */
  currency: string;
  /** BCP-47 tag used purely for Intl digit grouping, e.g. "en-IN". */
  numberFormat: string;
  /** Measurement system for height/weight/distance inputs. */
  unitSystem: UnitSystem;
  /** Colour theme. "system" follows the OS preference. */
  theme: ThemePref;
}

const PREFS_KEY = 'preferences';
const LEGACY_THEME_KEY = 'theme'; // read by the pre-paint inline script (un-namespaced)
const LEGACY_CURRENCY_KEY = 'currency'; // read by src/lib/currency.ts (via storage NS)

function defaults(): Preferences {
  return {
    locale: DEFAULT_LOCALE,
    region: 'US',
    currency: 'USD',
    numberFormat: 'en-US',
    unitSystem: 'imperial',
    theme: 'dark',
  };
}

// Fold a partial/legacy blob into a complete, validated Preferences object.
function normalize(partial: Partial<Preferences> | null): Preferences {
  const base = defaults();
  if (!partial) return base;
  const locale = isEnabledLocale(partial.locale) ? partial.locale! : base.locale;
  return {
    locale,
    region: partial.region || getLocale(locale)?.defaultRegion || base.region,
    currency: partial.currency || base.currency,
    numberFormat: partial.numberFormat || base.numberFormat,
    unitSystem: partial.unitSystem === 'metric' || partial.unitSystem === 'imperial' ? partial.unitSystem : base.unitSystem,
    theme: partial.theme === 'light' || partial.theme === 'dark' || partial.theme === 'system' ? partial.theme : base.theme,
  };
}

// Resolve the starting preferences synchronously at module load. Order:
//   1. an explicit saved preferences blob (a returning visitor)
//   2. legacy single keys (theme / currency) migrated forward
//   3. defaults
function loadInitial(): Preferences {
  if (typeof window === 'undefined') return defaults();

  const saved = loadState<Partial<Preferences>>(PREFS_KEY);
  if (saved) return normalize(saved);

  // First run with the unified store: migrate whatever legacy keys exist.
  const legacy: Partial<Preferences> = {};
  try {
    const t = window.localStorage.getItem(LEGACY_THEME_KEY);
    if (t === 'light' || t === 'dark') legacy.theme = t;
  } catch {
    /* storage disabled */
  }
  const curr = loadState<string>(LEGACY_CURRENCY_KEY);
  if (typeof curr === 'string') legacy.currency = curr;
  return normalize(legacy);
}

let current: Preferences = loadInitial();

type Listener = (prefs: Preferences) => void;
const listeners = new Set<Listener>();

/** Current preferences snapshot (a copy — mutating it does nothing). */
export function getPreferences(): Preferences {
  return { ...current };
}

export function getPreference<K extends keyof Preferences>(key: K): Preferences[K] {
  return current[key];
}

/** Subscribe to any preference change. Returns an unsubscribe function. */
export function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Subscribe to changes of a single facet only. The callback fires with the new
 * value whenever that key changes, so a widget that only cares about
 * `numberFormat` need not re-render when the theme flips.
 */
export function subscribeKey<K extends keyof Preferences>(
  key: K,
  cb: (value: Preferences[K]) => void,
): () => void {
  let prev = current[key];
  return subscribe((p) => {
    if (p[key] !== prev) {
      prev = p[key];
      cb(p[key]);
    }
  });
}

function persist(): void {
  // Before persisting, sync the in-memory theme with the legacy localStorage
  // key in case the theme was changed directly (e.g. by the pre-paint script
  // or the Header toggle writing to localStorage before this store loaded).
  // This prevents setPreferences() calls (like language switch) from
  // overwriting the user's actual theme choice with a stale default.
  try {
    const live = window.localStorage.getItem(LEGACY_THEME_KEY);
    if ((live === 'light' || live === 'dark') && live !== current.theme) {
      current = { ...current, theme: live };
    }
  } catch {
    /* ignore */
  }

  saveState(PREFS_KEY, current, 0);
  // Mirror to legacy keys so the pre-paint theme script and currency.ts keep
  // reading a value they understand during the migration window.
  try {
    if (current.theme !== 'system') window.localStorage.setItem(LEGACY_THEME_KEY, current.theme);
  } catch {
    /* ignore */
  }
  saveState(LEGACY_CURRENCY_KEY, current.currency, 0);
}

/**
 * Update one or more preferences at once. No-ops when nothing actually changes,
 * otherwise persists and notifies every subscriber exactly once.
 */
export function setPreferences(patch: Partial<Preferences>): void {
  const next = normalize({ ...current, ...patch });
  const changedKeys = (Object.keys(next) as (keyof Preferences)[]).filter((k) => next[k] !== current[k]);
  if (!changedKeys.length) return;
  const previous = current;
  current = next;
  if (typeof window !== 'undefined') persist();
  const snapshot = getPreferences();
  listeners.forEach((cb) => cb(snapshot));

  // Observability: report which formatting facets a visitor changed (currency /
  // region / unit system / number format). The locale switch is tracked
  // separately by the language selector, so it is excluded here.
  const formatFacets = changedKeys.filter((k) => k !== 'locale' && k !== 'theme');
  if (formatFacets.length) {
    track('preference_change', {
      changed: formatFacets.join(','),
      currency: next.currency,
      region: next.region,
      unitSystem: next.unitSystem,
      numberFormat: next.numberFormat,
      from: formatFacets.map((k) => `${k}:${String(previous[k])}`).join(','),
    });
  }
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  setPreferences({ [key]: value } as Partial<Preferences>);
}

/** Reset everything to defaults (used by tests + a future "reset" control). */
export function resetPreferences(): void {
  current = defaults();
  if (typeof window !== 'undefined') persist();
  const snapshot = getPreferences();
  listeners.forEach((cb) => cb(snapshot));
}

// Test-only seam: replace the in-memory state without touching storage, so unit
// tests can start from a known baseline without a DOM.
export function __setStateForTest(prefs: Partial<Preferences>): void {
  current = normalize(prefs);
}
