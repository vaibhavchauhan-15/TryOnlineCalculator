// Shared formatting + parsing helpers used by calculator compute functions.
// Kept dependency-free so it can run on the server and in the browser.

export function num(v: string | number | undefined, fallback = NaN): number {
  if (typeof v === 'number') return v;
  if (v === undefined || v === null || v === '') return fallback;
  // strip commas, currency symbols and spaces
  const cleaned = String(v).replace(/[^0-9.\-eE]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

export function currency(n: number, opts: { decimals?: number; symbol?: string } = {}): string {
  const { decimals = 2, symbol = '$' } = opts;
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const s = abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}${symbol}${s}`;
}

export function number(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function percent(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })}%`;
}

export function fixed(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(decimals);
}

/** Pluralize a unit word based on a count. */
export function plural(n: number, one: string, many = one + 's'): string {
  return Math.abs(n) === 1 ? one : many;
}
