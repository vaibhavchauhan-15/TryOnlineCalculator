// Language selector dropdown + suggestion banner (Task 8).
//
// Two pieces of language UX, both client-only and both observable:
//   1. The header selector — opens the menu, and when a language is chosen
//      records it in preferences.locale and fires `language_switch` before the
//      browser follows the (already-correct) anchor.
//   2. A suggestion banner — if the visitor's browser language maps to an
//      enabled locale different from the page's, we OFFER to switch (never
//      auto-redirect, per the plan). Shown once, dismissible, and every state
//      is tracked.
//
// The banner is a FIXED bottom toast so appearing/dismissing it never shifts
// page content (zero CLS — see Task 14).

import { getLocale, isEnabledLocale, localeNativeName, DEFAULT_LOCALE } from './locales';
import { splitLocale, switchLocale, stripLocale } from './paths';
import { regionDefaultsForLocale } from './region-defaults';
import { setPreferences } from '../preferences/store';
import { setActiveCurrency } from '../currency';
import { loadState, saveState } from '../storage';
import { track } from '../analytics';
import { categories } from '../categories';

/**
 * Persist the user's language choice as a cookie so the edge function
 * (functions/index.ts) can read it on the next visit and redirect to the
 * correct locale without waiting for client JS.
 *
 * Cookie properties:
 *   path=/        — readable on every path (the root redirect needs it)
 *   max-age=1y    — same longevity as the geo-country cookie
 *   SameSite=Lax  — safe from CSRF, readable by the edge
 *   Secure        — HTTPS only in production (harmless on localhost)
 */
function setLocaleCookie(locale: string): void {
  document.cookie = `locale-pref=${encodeURIComponent(locale)}; path=/; max-age=31536000; SameSite=Lax; Secure`;
}

const BANNER_DISMISS_KEY = 'langBanner:v1';

// Country/region flag shown next to the suggested language. Language ≠ country,
// so this is a friendly visual hint only, keyed by locale code.
const LOCALE_FLAG: Record<string, string> = { en: '🇬🇧', de: '🇩🇪', es: '🇪🇸', hi: '🇮🇳' };

// The page kinds that have a localized counterpart to switch to: the home,
// every category index, and every calculator (all localized in all locales).
// Static pages (/about, /unit-converter, …) have no localized version, so the
// banner is suppressed there to avoid offering a switch that would 404.
const CATEGORY_IDS = new Set<string>(categories.map((c) => c.id));

function hasLocalizedCounterpart(path: string): boolean {
  const segs = stripLocale(path).split('/').filter(Boolean);
  if (segs.length === 0) return true; // home
  if (segs.length === 1) return CATEGORY_IDS.has(segs[0]); // category index
  if (segs.length === 2) return CATEGORY_IDS.has(segs[0]); // /category/slug calculator
  return false;
}

/* ----------------------------------------------------------------- Selector */

function wireSelector(): void {
  const root = document.querySelector<HTMLElement>('[data-lang-switch]');
  if (!root) return;
  const toggle = root.querySelector<HTMLButtonElement>('[data-lang-toggle]');
  const menu = root.querySelector<HTMLElement>('[data-lang-menu]');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    menu.hidden = !open;
    root.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => setOpen(Boolean(menu.hidden)));

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  // Record the choice before navigation follows the anchor.
  menu.querySelectorAll<HTMLAnchorElement>('[data-lang-option]').forEach((a) => {
    a.addEventListener('click', () => {
      const target = a.dataset.langOption!;
      const { locale: from } = splitLocale(location.pathname);
      if (isEnabledLocale(target)) {
        // Switch locale and update currency to the target locale's default.
        const regionDefaults = regionDefaultsForLocale(target);
        setPreferences({ locale: target, currency: regionDefaults.currency, numberFormat: regionDefaults.numberFormat });
        setActiveCurrency(regionDefaults.currency);
        // Persist as cookie for edge-level redirect on next visit.
        setLocaleCookie(target);
      }
      track('language_switch', { from: from ?? 'none', to: target });
    });
  });
}

/* ------------------------------------------------------------------- Banner */

/** First enabled locale among the browser's preferred language tags, if any. */
export function preferredEnabledLocale(tags: readonly string[]): string | null {
  for (const tag of tags) {
    if (!tag) continue;
    const base = tag.toLowerCase().split('-')[0];
    if (isEnabledLocale(base)) return base;
  }
  return null;
}

/**
 * Pure decision for the suggestion banner: given the page's locale, the
 * browser's language tags and whether the banner was dismissed, return the
 * locale to suggest — or null to show nothing. No auto-redirect: this only
 * decides whether to OFFER a switch.
 */
export function suggestionFor(
  currentLocale: string | undefined,
  browserTags: readonly string[],
  dismissed: boolean,
): string | null {
  if (!currentLocale || dismissed) return null;
  const suggested = preferredEnabledLocale(browserTags);
  if (!suggested || suggested === currentLocale) return null;
  return suggested;
}



function showBanner(currentLocale: string, suggested: string): void {
  const suggestedName = localeNativeName(suggested);
  const el = document.createElement('div');
  el.className = 'lang-banner';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Language suggestion');
  const bcp47 = getLocale(suggested)?.bcp47 ?? suggested;
  const flag = LOCALE_FLAG[suggested] ?? '';
  el.innerHTML =
    `<span class="lang-banner-text">${flag ? flag + ' ' : ''}It looks like your preferred language is <strong>${suggestedName}</strong>.</span>` +
    `<span class="lang-banner-actions">` +
    `<a class="lang-banner-view" href="${switchLocale(location.pathname, suggested)}" hreflang="${bcp47}" lang="${bcp47}">Switch to ${suggestedName}</a>` +
    `<button type="button" class="lang-banner-dismiss" aria-label="Dismiss">Stay in ${localeNativeName(currentLocale)}</button>` +
    `</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  track('language_banner_show', { current: currentLocale, suggested });

  const persistDismiss = () => saveState(BANNER_DISMISS_KEY, suggested, 0);

  el.querySelector('.lang-banner-view')?.addEventListener('click', () => {
    const regionDefaults = regionDefaultsForLocale(suggested);
    setPreferences({ locale: suggested, currency: regionDefaults.currency, numberFormat: regionDefaults.numberFormat });
    setActiveCurrency(regionDefaults.currency);
    // Persist as cookie for edge-level redirect on next visit.
    setLocaleCookie(suggested);
    persistDismiss();
    track('language_banner_accept', { current: currentLocale, suggested });
  });
  el.querySelector('.lang-banner-dismiss')?.addEventListener('click', () => {
    persistDismiss();
    track('language_banner_dismiss', { current: currentLocale, suggested });
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 220);
  });
}

function maybeSuggest(): void {
  // The unprefixed root pages ARE the default locale, so treat a missing prefix
  // as the default — that's what makes the banner appear on the English home
  // (where most visitors land) and not just on already-localized pages.
  const { locale } = splitLocale(location.pathname);
  const currentLocale = locale ?? DEFAULT_LOCALE;
  const tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  const dismissed = Boolean(loadState<string>(BANNER_DISMISS_KEY));
  const suggested = suggestionFor(currentLocale, tags, dismissed);
  if (suggested && hasLocalizedCounterpart(location.pathname)) showBanner(currentLocale, suggested);
}

/* --------------------------------------------------------------------- Boot */

function init(): void {
  wireSelector();
  maybeSuggest();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
