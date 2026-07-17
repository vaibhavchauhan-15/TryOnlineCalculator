// Live exchange-rate helpers (browser-side).
//
// Strategy
// --------
//   * Source of truth for LIVE rates is the Frankfurter API
//     (https://frankfurter.dev) — free, no key, CORS-enabled, sourced from
//     central banks and updated every working day around 16:00 CET.
//   * The browser calls Frankfurter directly, so the whole widget works on a
//     purely static host (Cloudflare Pages) with no server, Worker or KV.
//     Frankfurter sends `Access-Control-Allow-Origin: *` and long
//     `Cache-Control` headers, so the browser HTTP cache handles rate-limiting
//     and repeat visits for free.
//   * Frankfurter only covers the ~30 ECB-tracked currencies. The site's picker
//     lists more than that, so any currency Frankfurter does not carry falls
//     back to a static reference rate (clearly flagged as non-live).
//   * All rates are normalised to a single shape: `usdPer[CODE]` = the value of
//     ONE unit of CODE in US dollars. This matches the converter's factor model
//     (base = value * fromFactor; result = base / toFactor).
//
// Resilience
// ----------
//   Every fetch can reject; callers (see currency-converter.ts) catch and keep
//   the embedded static baseline, so a slow or failing feed only affects this
//   one widget — it never breaks the page.

/** Currencies Frankfurter serves live (the ECB reference set). */
export const LIVE_CODES = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
  'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK',
  'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR',
] as const;

const LIVE_SET = new Set<string>(LIVE_CODES);

export function isLiveSupported(code: string): boolean {
  return LIVE_SET.has(code);
}

// Static reference rates: value of ONE unit of each currency in US dollars.
// Used as a fallback for currencies Frankfurter does not track, and as a
// no-JS / first-paint baseline. These are rough estimates for quick
// conversions — the on-page disclaimer makes this clear.
export const STATIC_USD_PER: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, INR: 0.012, JPY: 0.0067, CNY: 0.14,
  AUD: 0.66, CAD: 0.73, CHF: 1.12, NZD: 0.61, SGD: 0.74, HKD: 0.128,
  KRW: 0.00075, TWD: 0.031, THB: 0.028, MYR: 0.22, IDR: 0.000063,
  PHP: 0.0175, VND: 0.00004, AED: 0.272, SAR: 0.266, QAR: 0.275,
  KWD: 3.25, BHD: 2.65, OMR: 2.6, TRY: 0.03, RUB: 0.011, ZAR: 0.054,
  EGP: 0.021, NGN: 0.00065, PKR: 0.0036, BDT: 0.0091, LKR: 0.0033,
  NPR: 0.0075, BRL: 0.185, MXN: 0.058, ARS: 0.0011, CLP: 0.00105,
  COP: 0.00025, PEN: 0.27, SEK: 0.096, NOK: 0.094, DKK: 0.145,
  PLN: 0.25, CZK: 0.043, HUF: 0.0028, RON: 0.22, UAH: 0.024, ILS: 0.27,
  ISK: 0.0072,
};

export interface RatesPayload {
  /** Base currency for the factor map (always USD here). */
  base: 'USD';
  /** value of ONE unit of each code in USD. */
  usdPer: Record<string, number>;
  /** ISO timestamp of when the data was fetched. */
  updated: string;
  /** Frankfurter's data date (YYYY-MM-DD) when available. */
  date?: string;
  /** Codes whose value in `usdPer` came from the live feed. */
  live: string[];
  /** 'live' when the upstream fetch succeeded, 'static' when it fell back. */
  source: 'live' | 'static';
}

const FRANKFURTER = 'https://api.frankfurter.dev/v1';

/**
 * Fetch the latest rates from Frankfurter and normalise them to `usdPer`.
 * Frankfurter `latest?base=USD` returns `rates[CODE]` = units of CODE per 1 USD,
 * so the value of one CODE in USD is `1 / rates[CODE]`. Live values overlay the
 * static baseline so unsupported currencies still convert. Rejects on failure —
 * the caller falls back to the embedded static rates.
 */
export async function fetchLiveRates(): Promise<RatesPayload> {
  const res = await fetch(`${FRANKFURTER}/latest?base=USD`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
  const data = (await res.json()) as { date?: string; rates?: Record<string, number> };
  const rates = data.rates ?? {};

  const liveUsdPer: Record<string, number> = { USD: 1 };
  const live: string[] = ['USD'];
  for (const [code, perUsd] of Object.entries(rates)) {
    if (typeof perUsd === 'number' && perUsd > 0) {
      liveUsdPer[code] = 1 / perUsd;
      live.push(code);
    }
  }

  return {
    base: 'USD',
    usdPer: { ...STATIC_USD_PER, ...liveUsdPer },
    updated: new Date().toISOString(),
    date: data.date,
    live,
    source: 'live',
  };
}

/* ------------------------------------------------------------------ History */

export type HistoryRange = '1w' | '1m' | '3m' | '6m' | '1y' | '5y';

const RANGE_DAYS: Record<HistoryRange, number> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  '5y': 365 * 5,
};

export function isHistoryRange(v: string): v is HistoryRange {
  return v in RANGE_DAYS;
}

export interface HistoryPoint {
  /** Date, YYYY-MM-DD. */
  t: string;
  /** Exchange rate: units of `to` per one unit of `from`. */
  v: number;
}

export interface HistoryPayload {
  from: string;
  to: string;
  range: HistoryRange;
  supported: boolean;
  points: HistoryPoint[];
  updated: string;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch a from→to exchange-rate time series over the given range, straight from
 * Frankfurter. Only pairs where BOTH currencies are live-supported have real
 * history; anything else resolves to `{ supported: false }` so the UI hides the
 * chart cleanly. Rejects only on a network/HTTP error, which the caller catches.
 */
export async function fetchHistory(
  from: string,
  to: string,
  range: HistoryRange,
): Promise<HistoryPayload> {
  const base = from.toUpperCase();
  const target = to.toUpperCase();
  const empty = (supported: boolean): HistoryPayload => ({
    from: base, to: target, range, supported, points: [], updated: new Date().toISOString(),
  });

  if (base === target) return empty(false);
  if (!isLiveSupported(base) || !isLiveSupported(target)) return empty(false);

  const days = RANGE_DAYS[range];
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const url = `${FRANKFURTER}/${ymd(start)}..${ymd(end)}?base=${base}&symbols=${target}`;

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
  const data = (await res.json()) as { rates?: Record<string, Record<string, number>> };
  const rows = data.rates ?? {};
  const points: HistoryPoint[] = Object.keys(rows)
    .sort()
    .map((date) => ({ t: date, v: rows[date]?.[target] }))
    .filter((p): p is HistoryPoint => Number.isFinite(p.v));

  return {
    from: base, to: target, range, supported: true, points, updated: new Date().toISOString(),
  };
}
