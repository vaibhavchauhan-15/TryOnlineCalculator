// Lightweight analytics facade (browser-only).
//
// The site already loads Google Analytics (gtag) in the Layout head. This wraps
// gtag with a tiny, typed `track()` so feature code (language switching, the
// suggestion banner, calculator usage) can emit events without knowing about
// the transport. It is safe on the server and when the tag is blocked: every
// call is feature-detected and never throws.
//
// Events are also mirrored to a `window.__tocEvents` ring buffer so the
// analytics debug view / tests can assert an event fired without a live GA
// connection.

export type AnalyticsEvent =
  | 'calculator_view'
  | 'language_switch'
  | 'language_banner_show'
  | 'language_banner_accept'
  | 'language_banner_dismiss'
  | 'preference_change'
  | 'search_query'
  | 'search_zero_results';

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __tocEvents?: { event: string; params: Params; t: number }[];
  }
}

const MAX_BUFFER = 50;

/** Emit an analytics event. No-ops on the server; never throws. */
export function track(event: AnalyticsEvent, params: Params = {}): void {
  if (typeof window === 'undefined') return;

  // Debug ring buffer (used by the analytics debug view + tests).
  try {
    const buf = (window.__tocEvents = window.__tocEvents || []);
    buf.push({ event, params, t: Date.now() });
    if (buf.length > MAX_BUFFER) buf.shift();
  } catch {
    /* ignore */
  }

  try {
    window.gtag?.('event', event, params);
  } catch {
    /* tag blocked/unavailable */
  }
}
