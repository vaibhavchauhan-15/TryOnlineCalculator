// Shared formatting + parsing helpers used by calculator compute functions.
// Runs on the server and in the browser.

import { formatCurrency } from './currency';

export function num(v: string | number | undefined, fallback = NaN): number {
  if (typeof v === 'number') return v;
  if (v === undefined || v === null || v === '') return fallback;
  // strip commas, currency symbols and spaces
  const cleaned = String(v).replace(/[^0-9.\-eE]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return fallback;
  // Reject malformed input: multiple dots (not in scientific notation),
  // multiple minus signs, or minus not at the start.
  if ((cleaned.match(/\./g) || []).length > 1 && !/[eE]/.test(cleaned)) return fallback;
  if ((cleaned.match(/-/g) || []).length > 1) return fallback;
  if (cleaned.indexOf('-') > 0 && !/[eE]/.test(cleaned.slice(0, cleaned.indexOf('-')))) return fallback;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

// Format a monetary value in the user's currently selected currency. The
// symbol, digit grouping and default decimals all follow the active currency
// (see src/lib/currency.ts); pass `decimals` to override the precision (e.g.
// a 3-decimal cost-per-mile). The legacy `symbol` option is accepted for
// backwards compatibility but ignored — the active currency owns the symbol.
export function currency(n: number, opts: { decimals?: number; symbol?: string } = {}): string {
  return formatCurrency(n, { decimals: opts.decimals });
}

const numCache = new Map<number, Intl.NumberFormat>();

function getEnUsFormatter(decimals: number): Intl.NumberFormat {
  let fmt = numCache.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
    numCache.set(decimals, fmt);
  }
  return fmt;
}

export function number(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  return getEnUsFormatter(decimals).format(n);
}

export function percent(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  return `${getEnUsFormatter(decimals).format(n)}%`;
}

export function fixed(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(decimals);
}

/** Pluralize a unit word based on a count. */
export function plural(n: number, one: string, many = one + 's'): string {
  return Math.abs(n) === 1 ? one : many;
}
