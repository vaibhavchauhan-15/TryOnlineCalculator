// Locale-aware value formatting — turns the engines' RAW values (kg, cents-free
// numbers, percentages) into strings a human reads, using Intl and the
// visitor's *region* preferences. Crucially this depends on `region` /
// `numberFormat` / `currency` / `unitSystem`, NOT on the content language: a
// German reading English content still sees "1.234,56 €" grouping if that is
// their region.
//
// The engine declares intent (ValueFormat); this module realises it. Unit words
// ("kg", "years") are returned as enum keys so the resolver can localize them
// from the MDX label pack — this file stays purely numeric.

import type { ValueFormat, ResultRange } from '../calculator-engine/contract';
import { LB_TO_KG, IN_TO_CM } from '../calculator-engine/units';
import type { UnitSystem } from '../preferences/store';
export type { UnitSystem };

export interface FormatContext {
  /** BCP-47 tag for digit grouping, e.g. "en-US", "en-IN", "de-DE". */
  numberFormat: string;
  /** ISO 4217 code for `currency` formatting. */
  currency: string;
  /** Which measurement system to display `mass`/`length` values in. */
  unitSystem: UnitSystem;
}

/** A formatted value plus the enum key of any unit word to localize (e.g. "kg"). */
export interface FormattedValue {
  /** The numeric part, grouped for the locale (no unit word). */
  text: string;
  /** Unit enum key the resolver localizes and appends (e.g. "kg", "lb", "years"). */
  unitKey?: string;
  /** For currency, the ISO code actually used (for aria/labels). */
  currencyCode?: string;
}

const nfCache = new Map<string, Intl.NumberFormat>();

function nf(locale: string, min: number, max: number): Intl.NumberFormat {
  const key = `n:${locale}:${min}:${max}`;
  let formatter = nfCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max });
    nfCache.set(key, formatter);
  }
  return formatter;
}

function cnf(locale: string, currency: string, precision?: number): Intl.NumberFormat {
  const key = `c:${locale}:${currency}:${precision ?? 'default'}`;
  let formatter = nfCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...(precision !== undefined ? { minimumFractionDigits: precision, maximumFractionDigits: precision } : {}),
    });
    nfCache.set(key, formatter);
  }
  return formatter;
}

/** Group a plain number for the locale. */
export function formatNumber(value: number, numberFormat: string, precision = 2): string {
  if (!Number.isFinite(value)) return '—';
  return nf(numberFormat, 0, precision).format(value);
}

/** Money in the active currency, grouped for the locale. */
export function formatCurrency(value: number, ctx: FormatContext, precision?: number): FormattedValue {
  if (!Number.isFinite(value)) return { text: '—' };
  try {
    const text = cnf(ctx.numberFormat, ctx.currency, precision).format(value);
    return { text, currencyCode: ctx.currency };
  } catch {
    return { text: formatNumber(value, ctx.numberFormat, precision ?? 2), currencyCode: ctx.currency };
  }
}

/** A percentage magnitude (12.5 → "12.5%"). Uses locale grouping, own sign. */
export function formatPercent(value: number, numberFormat: string, precision = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${nf(numberFormat, 0, precision).format(value)}%`;
}

/**
 * Mass in kilograms → displayed in the preferred system. Returns the number +
 * a unit enum key ("kg" or "lb") so the resolver appends the localized word.
 */
export function formatMass(kg: number, ctx: FormatContext, precision = 1): FormattedValue {
  if (!Number.isFinite(kg)) return { text: '—' };
  if (ctx.unitSystem === 'imperial') {
    return { text: formatNumber(kg / LB_TO_KG, ctx.numberFormat, precision), unitKey: 'lb' };
  }
  return { text: formatNumber(kg, ctx.numberFormat, precision), unitKey: 'kg' };
}

/**
 * Length in centimetres → displayed in the preferred system. Metric shows cm;
 * imperial shows inches (unit word localized downstream).
 */
export function formatLength(cm: number, ctx: FormatContext, precision = 1): FormattedValue {
  if (!Number.isFinite(cm)) return { text: '—' };
  if (ctx.unitSystem === 'imperial') {
    return { text: formatNumber(cm / IN_TO_CM, ctx.numberFormat, precision), unitKey: 'in' };
  }
  return { text: formatNumber(cm, ctx.numberFormat, precision), unitKey: 'cm' };
}

/** A count of months → "N" with a unit enum key ("months"). */
export function formatMonths(months: number, numberFormat: string): FormattedValue {
  if (!Number.isFinite(months)) return { text: '—' };
  return { text: formatNumber(months, numberFormat, 0), unitKey: 'months' };
}

/**
 * Format a single raw value per its declared ValueFormat. Returns the numeric
 * text plus any unit enum key to localize. Ranges (min–max) are handled by
 * formatRange below.
 */
export function formatValue(
  value: number,
  format: ValueFormat | undefined,
  ctx: FormatContext,
  precision?: number,
): FormattedValue {
  switch (format) {
    case 'currency':
      return formatCurrency(value, ctx, precision);
    case 'percent':
      return { text: formatPercent(value, ctx.numberFormat, precision ?? 2) };
    case 'mass':
      return formatMass(value, ctx, precision ?? 1);
    case 'length':
      return formatLength(value, ctx, precision ?? 1);
    case 'months':
      return formatMonths(value, ctx.numberFormat);
    case 'integer':
      return { text: formatNumber(value, ctx.numberFormat, 0) };
    case 'plain':
      return { text: formatNumber(value, ctx.numberFormat, precision ?? 2) };
    case 'decimal':
    default:
      return { text: formatNumber(value, ctx.numberFormat, precision ?? 2) };
  }
}

/** Format a min–max range as two values sharing one unit (e.g. "56.7 – 76.3 kg"). */
export function formatRange(
  range: ResultRange,
  format: ValueFormat | undefined,
  ctx: FormatContext,
  precision?: number,
): { min: FormattedValue; max: FormattedValue } {
  return {
    min: formatValue(range.min, format, ctx, precision),
    max: formatValue(range.max, format, ctx, precision),
  };
}
