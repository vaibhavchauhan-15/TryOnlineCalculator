// The localization resolver — the bridge between a raw EngineResult (numbers +
// enum keys) and display-ready text for the active locale.
//
// It combines two inputs:
//   * a LabelPack for the active locale (from the calculator's MDX frontmatter
//     + the shared UI/units pack), and
//   * an English fallback LabelPack, so a not-yet-translated key still renders
//     in English instead of leaking a raw key like "healthyRange".
//
// It is pure and content-source-agnostic: whoever loads the MDX (Task 5/10)
// passes plain objects in. That keeps this fully unit-testable today.

import type {
  EngineResult,
  ResultItem,
  ResultTone,
  ChartData,
} from '../calculator-engine/contract';
import { formatValue, formatRange, formatNumber, type FormatContext } from './format-locale';

/**
 * All localized strings a calculator needs, keyed by the engine's machine keys.
 * `labels` cover result/breakdown/chart-series keys; `enums` cover categorical
 * values (e.g. "normal"); `units` cover unit words ("kg", "months"); `hints`
 * are templated messages that may contain {placeholders}.
 */
export interface LabelPack {
  labels?: Record<string, string>;
  enums?: Record<string, string>;
  units?: Record<string, string>;
  hints?: Record<string, string>;
  chartTitles?: Record<string, string>;
}

export interface DisplayItem {
  label: string;
  value: string;
  primary?: boolean;
  hint?: string;
  tone?: ResultTone;
}

export interface DisplayChart {
  type: ChartData['type'];
  title?: string;
  format?: ChartData['format'];
  slices?: { label: string; value: number; color?: string }[];
  bars?: { label: string; value: number; color?: string }[];
  series?: { label: string; points: number[]; color?: string }[];
  labels?: string[];
  segments?: { from: number; to: number; label: string; color?: string }[];
  value?: number;
  min?: number;
  max?: number;
  valueLabel?: string;
}

export interface DisplayResult {
  items: DisplayItem[];
  breakdown?: DisplayItem[];
  charts?: DisplayChart[];
}

/**
 * Interpolate {name} placeholders in a template with params. Numeric params are
 * grouped for the locale (so "{pct}% of price" reads "20%" not "20.0001%"),
 * while string params pass through verbatim.
 */
function interpolate(template: string, numberFormat: string, params?: Record<string, number | string>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const v = params[name];
    if (v === undefined) return whole;
    return typeof v === 'number' ? formatNumber(v, numberFormat, 2) : String(v);
  });
}

/**
 * Humanize a machine key into readable text as a LAST-RESORT fallback, so a key
 * that is missing from every pack still renders as words rather than leaking a
 * raw identifier like "monthlyPayment" or "unit.kcalPerDay". Takes the segment
 * after the last dot, splits camelCase and digit runs, and sentence-cases it.
 * A single-symbol key (e.g. "%") passes through unchanged.
 */
export function humanizeKey(key: string): string {
  const seg = key.includes('.') ? key.slice(key.lastIndexOf('.') + 1) : key;
  if (!/[a-zA-Z]/.test(seg)) return seg; // symbols like "%" pass through
  // All-caps acronyms / codes (USD, EUR, MPG, ZAR) render verbatim, never
  // "Usd" — these are locale-neutral codes, not translatable words.
  if (/^[A-Z0-9]{2,6}$/.test(seg)) return seg;
  const words = seg
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Ordered text lookup across a pack, then the English fallback. When a key is
 * absent from both, it is HUMANIZED rather than returned raw, so a missing
 * translation degrades to readable English words, never a bare identifier.
 * Exported so the widget can localize form field labels/options with the exact
 * same precedence the result resolver uses.
 */
export function lookupText(pack: LabelPack, fallback: LabelPack, key: string): string {
  return (
    pack.labels?.[key] ??
    pack.enums?.[key] ??
    pack.units?.[key] ??
    pack.chartTitles?.[key] ??
    fallback.labels?.[key] ??
    fallback.enums?.[key] ??
    fallback.units?.[key] ??
    fallback.chartTitles?.[key] ??
    humanizeKey(key)
  );
}

export class Resolver {
  constructor(
    private readonly pack: LabelPack,
    private readonly fallback: LabelPack,
    private readonly ctx: FormatContext,
  ) {}

  /** Ordered text lookup across the pack, then the English fallback, then key. */
  private text(key: string): string {
    return lookupText(this.pack, this.fallback, key);
  }

  /** Public label lookup (form fields, options, unit suffixes). */
  label(key: string): string {
    return this.text(key);
  }

  private hint(hintKey: string, params?: Record<string, number | string>): string {
    const template = this.pack.hints?.[hintKey] ?? this.fallback.hints?.[hintKey] ?? hintKey;
    return interpolate(template, this.ctx.numberFormat, params);
  }

  /** Format a value item's numeric text, appending a localized unit word. */
  private valueText(item: ResultItem): string {
    if (item.range) {
      const { min, max } = formatRange(item.range, item.format, this.ctx, item.precision);
      const unit = min.unitKey ? ` ${this.text(min.unitKey)}` : '';
      return `${min.text} – ${max.text}${unit}`;
    }
    if (item.value !== undefined) {
      const f = formatValue(item.value, item.format, this.ctx, item.precision);
      const unit = f.unitKey ? ` ${this.text(f.unitKey)}` : '';
      return `${f.text}${unit}`;
    }
    // Pure-enum item (e.g. a category): the value IS the localized enum text.
    if (item.enumKey) return this.text(item.enumKey);
    return '';
  }

  resolveItem(item: ResultItem): DisplayItem {
    // A templated label can interpolate hintParams (e.g. "{a}% of {b}").
    const rawLabel = this.text(item.key);
    const label = interpolate(rawLabel, this.ctx.numberFormat, item.hintParams);

    // Hint precedence: explicit hintKey → localized enum (for value+enum items).
    let hint: string | undefined;
    if (item.hintKey) hint = this.hint(item.hintKey, item.hintParams);
    else if (item.enumKey && item.value !== undefined) hint = this.text(item.enumKey);

    return {
      label,
      value: this.valueText(item),
      primary: item.primary,
      hint,
      tone: item.tone,
    };
  }

  private resolveChart(chart: ChartData): DisplayChart {
    const numberLabels = (arr?: { labelKey: string; value: number; color?: string }[]) =>
      arr?.map((s) => ({ label: this.text(s.labelKey), value: s.value, color: s.color }));
    return {
      type: chart.type,
      title: chart.titleKey ? this.text(chart.titleKey) : undefined,
      format: chart.format,
      slices: numberLabels(chart.slices),
      bars: numberLabels(chart.bars),
      series: chart.series?.map((s) => ({ label: this.text(s.labelKey), points: s.points, color: s.color })),
      labels: chart.labels,
      segments: chart.segments?.map((seg) => ({ from: seg.from, to: seg.to, label: this.text(seg.labelKey), color: seg.color })),
      value: chart.value,
      min: chart.min,
      max: chart.max,
      valueLabel: chart.valueEnumKey ? this.text(chart.valueEnumKey) : undefined,
    };
  }

  /** Resolve a whole EngineResult into display-ready text. */
  resolve(result: EngineResult): DisplayResult {
    return {
      items: result.items.map((i) => this.resolveItem(i)),
      breakdown: result.breakdown?.map((i) => this.resolveItem(i)),
      charts: result.charts?.map((c) => this.resolveChart(c)),
    };
  }
}

/** Convenience factory. */
export function createResolver(pack: LabelPack, fallback: LabelPack, ctx: FormatContext): Resolver {
  return new Resolver(pack, fallback, ctx);
}
