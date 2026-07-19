// Currency selection + formatting for the calculators.
//
// The calculators are currency-agnostic arithmetic: the numbers a user types
// are already in whatever currency they think in. So we never convert amounts
// with live FX rates — we only change how results are *displayed* (symbol,
// digit grouping and default decimals). This keeps everything instant, offline
// and correct.
//
// Design goals:
//   * Fast    — pure string formatting, no network, no dependencies.
//   * Smart   — first visit auto-detects the user's currency from their browser
//               locale (and, as a fallback, timezone) with no permission prompt.
//   * Sticky  — an explicit choice is saved to localStorage and restored on the
//               next visit.
//   * Safe    — every browser API is feature-detected so it also runs during
//               server-side rendering (where it simply falls back to USD).

import { loadState, saveState } from './storage';

export interface CurrencyDef {
  /** ISO 4217 code, e.g. "USD". */
  code: string;
  /** Display symbol shown as an input prefix and in results, e.g. "$". */
  symbol: string;
  /** Human-readable name for the dropdown, e.g. "US Dollar". */
  name: string;
  /** Country / region, shown in the picker and used for search. */
  country: string;
  /** Locale used purely for digit grouping (e.g. "en-IN" for lakh grouping). */
  locale: string;
  /** Default number of fraction digits (0 for yen-like, 3 for Gulf dinars). */
  decimals: number;
}

// A broad catalog covering the world's most-used currencies. Grouping is
// standardised to en-US (Latin digits, comma thousands, dot decimal) for clean,
// predictable output everywhere, with the one exception of INR, which uses the
// Indian lakh/crore grouping its users expect. Symbols are shown as an input
// prefix and in results; the picker always shows the code + full name so
// ambiguous symbols (kr, ¥, R$, $) are never confusing.
export const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States', locale: 'en-US', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union', locale: 'en-US', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom', locale: 'en-US', decimals: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India', locale: 'en-IN', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan', locale: 'en-US', decimals: 0 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China', locale: 'en-US', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia', locale: 'en-US', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada', locale: 'en-US', decimals: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland', locale: 'en-US', decimals: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand', locale: 'en-US', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore', locale: 'en-US', decimals: 2 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', country: 'Hong Kong', locale: 'en-US', decimals: 2 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea', locale: 'en-US', decimals: 0 },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', country: 'Taiwan', locale: 'en-US', decimals: 2 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand', locale: 'en-US', decimals: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia', locale: 'en-US', decimals: 2 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia', locale: 'en-US', decimals: 0 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines', locale: 'en-US', decimals: 2 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam', locale: 'en-US', decimals: 0 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'United Arab Emirates', locale: 'en-US', decimals: 2 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', country: 'Saudi Arabia', locale: 'en-US', decimals: 2 },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', country: 'Qatar', locale: 'en-US', decimals: 2 },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', country: 'Kuwait', locale: 'en-US', decimals: 3 },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', country: 'Bahrain', locale: 'en-US', decimals: 3 },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', country: 'Oman', locale: 'en-US', decimals: 3 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey', locale: 'en-US', decimals: 2 },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', country: 'Russia', locale: 'en-US', decimals: 2 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa', locale: 'en-US', decimals: 2 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', country: 'Egypt', locale: 'en-US', decimals: 2 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria', locale: 'en-US', decimals: 2 },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', country: 'Pakistan', locale: 'en-US', decimals: 2 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh', locale: 'en-US', decimals: 2 },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', country: 'Sri Lanka', locale: 'en-US', decimals: 2 },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', country: 'Nepal', locale: 'en-US', decimals: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil', locale: 'en-US', decimals: 2 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', country: 'Mexico', locale: 'en-US', decimals: 2 },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', country: 'Argentina', locale: 'en-US', decimals: 2 },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', country: 'Chile', locale: 'en-US', decimals: 0 },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', country: 'Colombia', locale: 'en-US', decimals: 0 },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', country: 'Peru', locale: 'en-US', decimals: 2 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden', locale: 'en-US', decimals: 2 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'Norway', locale: 'en-US', decimals: 2 },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'Denmark', locale: 'en-US', decimals: 2 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', country: 'Poland', locale: 'en-US', decimals: 2 },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', country: 'Czech Republic', locale: 'en-US', decimals: 2 },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', country: 'Hungary', locale: 'en-US', decimals: 0 },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', country: 'Romania', locale: 'en-US', decimals: 2 },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', country: 'Ukraine', locale: 'en-US', decimals: 2 },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', country: 'Israel', locale: 'en-US', decimals: 2 },
];

const DEFAULT_CODE = 'USD';
const STORE_KEY = 'currency';
const EXPLICIT_KEY = 'currency:explicit';

const BY_CODE: Record<string, CurrencyDef> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
);

// Map an ISO 3166 country code to a supported currency. Only countries whose
// currency we actually carry are listed; anything else falls through to USD.
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', EC: 'USD', SV: 'USD', PA: 'USD',
  GB: 'GBP',
  IN: 'INR',
  JP: 'JPY',
  CN: 'CNY',
  AU: 'AUD',
  CA: 'CAD',
  CH: 'CHF', LI: 'CHF',
  NZ: 'NZD',
  SG: 'SGD',
  HK: 'HKD',
  KR: 'KRW',
  TW: 'TWD',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  TR: 'TRY',
  RU: 'RUB',
  ZA: 'ZAR',
  EG: 'EGP',
  NG: 'NGN',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  NP: 'NPR',
  BR: 'BRL',
  MX: 'MXN',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  SE: 'SEK',
  NO: 'NOK', SJ: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  UA: 'UAH',
  IL: 'ILS',
  // Eurozone members → EUR.
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR',
  GR: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR',
  NL: 'EUR', PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR', HR: 'EUR',
};

// A small IANA-timezone fallback for the biggest population centres, used only
// when the browser locale carries no usable region.
const TIMEZONE_CURRENCY: Record<string, string> = {
  'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR',
  'Asia/Tokyo': 'JPY',
  'Asia/Shanghai': 'CNY', 'Asia/Chongqing': 'CNY',
  'Asia/Seoul': 'KRW',
  'Asia/Bangkok': 'THB',
  'Asia/Jakarta': 'IDR',
  'Asia/Kuala_Lumpur': 'MYR',
  'Asia/Manila': 'PHP',
  'Asia/Ho_Chi_Minh': 'VND', 'Asia/Saigon': 'VND',
  'Asia/Taipei': 'TWD',
  'Asia/Karachi': 'PKR',
  'Asia/Dhaka': 'BDT',
  'Asia/Colombo': 'LKR',
  'Asia/Kathmandu': 'NPR',
  'Asia/Dubai': 'AED',
  'Asia/Riyadh': 'SAR',
  'Asia/Qatar': 'QAR',
  'Asia/Kuwait': 'KWD',
  'Asia/Bahrain': 'BHD',
  'Asia/Muscat': 'OMR',
  'Asia/Jerusalem': 'ILS',
  'Asia/Istanbul': 'TRY', 'Europe/Istanbul': 'TRY',
  'Europe/Moscow': 'RUB',
  'Europe/Kiev': 'UAH', 'Europe/Kyiv': 'UAH',
  'Europe/London': 'GBP',
  'Europe/Paris': 'EUR', 'Europe/Berlin': 'EUR', 'Europe/Madrid': 'EUR',
  'Europe/Rome': 'EUR', 'Europe/Amsterdam': 'EUR', 'Europe/Dublin': 'EUR',
  'Europe/Warsaw': 'PLN',
  'Europe/Prague': 'CZK',
  'Europe/Budapest': 'HUF',
  'Europe/Bucharest': 'RON',
  'Europe/Stockholm': 'SEK',
  'Europe/Oslo': 'NOK',
  'Europe/Copenhagen': 'DKK',
  'Africa/Johannesburg': 'ZAR',
  'Africa/Lagos': 'NGN',
  'Africa/Cairo': 'EGP',
  'America/New_York': 'USD', 'America/Chicago': 'USD', 'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Toronto': 'CAD', 'America/Vancouver': 'CAD',
  'America/Mexico_City': 'MXN',
  'America/Sao_Paulo': 'BRL',
  'America/Argentina/Buenos_Aires': 'ARS',
  'America/Santiago': 'CLP',
  'America/Bogota': 'COP',
  'America/Lima': 'PEN',
  'Australia/Sydney': 'AUD', 'Australia/Melbourne': 'AUD',
  'Pacific/Auckland': 'NZD',
};

export function isSupported(code: string | null | undefined): code is string {
  return !!code && code in BY_CODE;
}

/** Pull an ISO region code out of a BCP-47 language tag (e.g. "en-IN" → "IN"). */
function regionOf(tag: string): string | null {
  try {
    const loc = new Intl.Locale(tag);
    const region = (typeof loc.maximize === 'function' ? loc.maximize() : loc).region;
    if (region) return region.toUpperCase();
  } catch {
    /* fall through to a manual parse */
  }
  const m = /[-_]([A-Za-z]{2})(?:[-_]|$)/.exec(tag);
  return m ? m[1].toUpperCase() : null;
}

function detectFromLocale(): string | null {
  if (typeof navigator === 'undefined') return null;
  const tags = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of tags) {
    if (!tag) continue;
    const region = regionOf(tag);
    if (region && isSupported(COUNTRY_CURRENCY[region])) return COUNTRY_CURRENCY[region];
  }
  return null;
}

function detectFromTimeZone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const code = tz ? TIMEZONE_CURRENCY[tz] : null;
    return isSupported(code) ? code : null;
  } catch {
    return null;
  }
}

/** Read the geo-country cookie set by the Cloudflare edge middleware. */
function detectFromGeoCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)geo-country=([A-Z]{2})/);
  if (!m) return null;
  const code = COUNTRY_CURRENCY[m[1]];
  return isSupported(code) ? code : null;
}

/** Best-effort currency for a first-time visitor. Never throws. */
export function detectCurrency(): string {
  return detectFromGeoCookie() ?? detectFromLocale() ?? detectFromTimeZone() ?? DEFAULT_CODE;
}

// Resolve the starting currency synchronously at module load so the very first
// render (and the calculators' initial compute) already use it — no flash of
// the wrong symbol on the client. A saved explicit choice always wins.
let activeCode = DEFAULT_CODE;
let explicitChoice = false;
if (typeof window !== 'undefined') {
  const saved = loadState<string>(STORE_KEY);
  explicitChoice = loadState<boolean>(EXPLICIT_KEY) === true;
  if (isSupported(saved)) {
    activeCode = saved;
  } else {
    // No explicit choice yet: auto-detect AND persist it. Persisting the
    // detected code lets the pre-paint inline restore (see CalculatorWidget)
    // read it synchronously on the next load and paint the right symbol
    // immediately — so the currency never flashes from the default on refresh.
    activeCode = detectCurrency();
    saveState(STORE_KEY, activeCode, 0);
    // NOT an explicit choice — locale-aware pages may override this.
  }
}

export function getActiveCode(): string {
  return activeCode;
}

export function getActiveCurrency(): CurrencyDef {
  return BY_CODE[activeCode] ?? BY_CODE[DEFAULT_CODE];
}

type Listener = (currency: CurrencyDef) => void;
const listeners = new Set<Listener>();

/** Subscribe to currency changes. Returns an unsubscribe function. */
export function subscribeCurrency(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Switch the active display currency. Persists the choice (so it sticks for the
 * next visit) and notifies every subscriber. No-ops for unknown codes.
 */
export function setActiveCurrency(code: string): void {
  if (!isSupported(code) || code === activeCode) return;
  activeCode = code;
  explicitChoice = true;
  saveState(STORE_KEY, code, 0);
  saveState(EXPLICIT_KEY, true, 0);
  const currency = getActiveCurrency();
  listeners.forEach((cb) => cb(currency));
}

/** True if the user has manually chosen a currency (not just auto-detected). */
export function isExplicitCurrencyChoice(): boolean {
  return explicitChoice;
}

/**
 * Override the active currency from a locale/geo hint without marking it as an
 * explicit user choice. Used by the page locale sync so future locale switches
 * can still override. Notifies subscribers like setActiveCurrency does.
 */
export function setLocaleCurrency(code: string): void {
  if (!isSupported(code) || code === activeCode) return;
  activeCode = code;
  saveState(STORE_KEY, code, 0);
  // Deliberately does NOT set EXPLICIT_KEY — this is an automatic override.
  const currency = getActiveCurrency();
  listeners.forEach((cb) => cb(currency));
}

/** Active currency symbol (used for input prefixes and chart axes). */
export function getCurrencySymbol(): string {
  return getActiveCurrency().symbol;
}

/**
 * Format a number in the active currency. The symbol is always shown as a
 * prefix (matching the input affix), digits are grouped per the currency's
 * locale, and decimals default to the currency (2, or 0 for yen-like) unless
 * an explicit override is given.
 */
export function formatCurrency(n: number, opts: { decimals?: number } = {}): string {
  if (!Number.isFinite(n)) return '—';
  const cur = getActiveCurrency();
  const decimals = opts.decimals ?? cur.decimals;
  const sign = n < 0 ? '-' : '';
  const body = Math.abs(n).toLocaleString(cur.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}${cur.symbol}${body}`;
}
