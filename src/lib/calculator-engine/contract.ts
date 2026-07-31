// The Compatibility Contract — the single stable interface every calculator
// implements. It is the seam between the *pure engine* layer (arithmetic only)
// and everything above it (localization, rendering, SEO).
//
// The one rule that makes the whole i18n architecture work:
//
//   A calculator result carries RAW VALUES and ENUM KEYS ONLY.
//   Never a localized string, a currency symbol, a unit label or a formatted
//   number. Those are added later by the localization layer (Task 4) from the
//   MDX content for the active locale.
//
// So a BMI result says `{ key: 'category', enumKey: 'normal' }`, not
// `"Normal weight"`; and `{ key: 'bmi', value: 22.9, format: 'decimal' }`, not
// `"22.9"`. This is what lets the exact same engine render in English, German,
// Hindi or Spanish with zero code changes.

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type IssueSeverity = 'error' | 'warning';

/**
 * A single validation problem. `code` is a machine key (e.g.
 * "weight.required", "downPayment.exceedsPrice") that the localization layer
 * maps to a human message; `params` carry any numbers the message interpolates.
 * No user-facing text lives here.
 */
export interface ValidationIssue {
  /** Input field this refers to, when field-specific. */
  field?: string;
  /** Stable machine key for the localized message. */
  code: string;
  severity: IssueSeverity;
  /** Numeric/enum params for message interpolation (never prose). */
  params?: Record<string, number | string>;
}

export interface ValidationResult {
  /** True when there are no `error`-severity issues. */
  valid: boolean;
  issues: ValidationIssue[];
}

/** Convenience builder: a passing validation with optional warnings. */
export function ok(issues: ValidationIssue[] = []): ValidationResult {
  return { valid: !issues.some((i) => i.severity === 'error'), issues };
}

/** Convenience builder: a single-error failure. */
export function fail(code: string, opts: { field?: string; params?: Record<string, number | string> } = {}): ValidationResult {
  return { valid: false, issues: [{ code, severity: 'error', field: opts.field, params: opts.params }] };
}

// ---------------------------------------------------------------------------
// Result model — presentation-neutral (raw values + enum keys only)
// ---------------------------------------------------------------------------

/**
 * How the localization layer should format a raw numeric value. The engine
 * only declares intent; the actual symbol/grouping/units come from the active
 * locale + region + currency preferences at render time.
 */
export type ValueFormat =
  | 'decimal' // grouped number, `precision` decimals
  | 'integer' // grouped whole number
  | 'currency' // money in the active currency
  | 'percent' // value is already a percentage magnitude (e.g. 12.5 → "12.5%")
  | 'mass' // kilograms; rendered per the active unit system
  | 'length' // centimetres; rendered per the active unit system
  | 'months' // a count of months; may render as "x years y months"
  | 'plain'; // dimensionless passthrough

export type ResultTone = 'default' | 'success' | 'warning' | 'error';

export interface ResultRange {
  min: number;
  max: number;
}

/**
 * One line of output. Exactly one of `value` / `range` / `enumKey` / `text` is
 * the payload; `value`/`range`/`enumKey` are raw, `text` is a raw computed
 * string passed through verbatim. `key` is the semantic label key the
 * localization layer resolves to a localized label.
 */
export interface ResultItem {
  /** Semantic label key, e.g. "bmi", "monthlyPayment", "healthyRange". */
  key: string;
  /** Raw scalar payload. */
  value?: number;
  /** Raw range payload (e.g. a healthy-weight band). */
  range?: ResultRange;
  /** Categorical payload — an enum key localized downstream (e.g. "normal"). */
  enumKey?: string;
  /** Raw computed string payload passed through verbatim (e.g. "#FF5733"). */
  text?: string;
  /** Formatting intent for `value`/`range`. */
  format?: ValueFormat;
  /** Decimal-precision hint for the formatter. */
  precision?: number;
  /** Semantic tone (drives styling + can select a localized hint). */
  tone?: ResultTone;
  /** Marks the single headline result. */
  primary?: boolean;
  /** Optional templated hint: a message key + numeric/enum params only. */
  hintKey?: string;
  hintParams?: Record<string, number | string>;
}

/**
 * The complete result of a calculation. Presentation-neutral: every string a
 * user eventually sees is derived from these keys + values by the localization
 * layer. `charts` is optional raw chart data (see ChartData).
 */
export interface EngineResult {
  items: ResultItem[];
  /** Optional secondary breakdown rows (same shape, rendered compactly). */
  breakdown?: ResultItem[];
  /** Optional raw chart data. */
  charts?: ChartData[];
}

// ---------------------------------------------------------------------------
// Chart data — raw, with label KEYS instead of localized labels
// ---------------------------------------------------------------------------

export type ChartType = 'pie' | 'line' | 'gauge' | 'bar';

export interface ChartSlice {
  /** Label key localized downstream. */
  labelKey: string;
  value: number;
  color?: string;
}

export interface ChartBar {
  labelKey: string;
  value: number;
  color?: string;
}

export interface ChartSeries {
  labelKey: string;
  points: number[];
  color?: string;
}

export interface GaugeBand {
  from: number;
  to: number;
  /** Enum/label key localized downstream (e.g. "healthy"). */
  labelKey: string;
  color?: string;
}

/**
 * Raw chart definition. Axis/legend/segment text are KEYS; only numbers and
 * optional colours are literal. `titleKey` and value labels are resolved by the
 * localization layer, and numeric axes are formatted per the active locale.
 */
export interface ChartData {
  type: ChartType;
  titleKey?: string;
  /** Numeric axis formatting intent. */
  format?: 'currency' | 'decimal';
  slices?: ChartSlice[];
  bars?: ChartBar[];
  series?: ChartSeries[];
  /** X-axis tick labels for a line chart (usually already numeric, e.g. years). */
  labels?: string[];
  segments?: GaugeBand[];
  value?: number;
  min?: number;
  max?: number;
  /** Enum key for a gauge's matched band (e.g. the BMI category). */
  valueEnumKey?: string;
}

// ---------------------------------------------------------------------------
// Optional extension capabilities (future-proofing, plan improvement #1)
// ---------------------------------------------------------------------------

/** A single row a calculator can contribute to the history panel. */
export interface HistoryEntry {
  /** Raw summary values keyed for localization. */
  summary: ResultItem[];
  primaryKey: string;
}

export type ExportFormat = 'csv' | 'json';

/** Raw, serialisable data a calculator can offer for export (CSV/PDF later). */
export interface ExportData {
  format: ExportFormat;
  /** Column keys localized downstream; rows are raw values. */
  columnKeys: string[];
  rows: (number | string)[][];
}

// ---------------------------------------------------------------------------
// Input field descriptors — presentation-neutral form schema
// ---------------------------------------------------------------------------
//
// So the renderer (Task 6) can build a live form for any engine WITHOUT the
// engine emitting localized strings. Every human-facing label is a KEY the
// localization layer resolves from the calculator's MDX label pack; only
// structure (types, bounds, options, conditional visibility) lives here.

export type InputControlType = 'number' | 'select' | 'radio' | 'text';

export interface EngineFieldOption {
  /** Stable machine value submitted by the control. */
  value: string;
  /** Enum/label key localized downstream (never a localized string). */
  labelKey: string;
}

export interface EngineField {
  /** Field name; the key parseInput reads and the form control's `name`. */
  name: string;
  /** Label key localized from the MDX label pack. */
  labelKey: string;
  type: InputControlType;
  /** Default value as a string (drives the SSR/no-JS form + reset). */
  defaultValue: string;
  min?: number;
  max?: number;
  step?: number;
  /** Marks a monetary field so the widget shows the active currency prefix. */
  currency?: boolean;
  /** Unit-suffix key localized downstream (e.g. "%", "years", "kg"). */
  suffixKey?: string;
  /** Options for select/radio controls. */
  options?: EngineFieldOption[];
  /** Column span in the 2-col grid. Defaults to 1. */
  span?: 1 | 2;
  /** Conditional visibility: show only when `field` equals one of `equals`. */
  showWhen?: { field: string; equals: string[] };
  /** Optional help-text key localized downstream. */
  helpKey?: string;
  /** Numeric input mode hint. */
  placeholderKey?: string;
}

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

/**
 * Every calculator implements this. `TInput` is the calculator's typed input
 * shape; `TResult` is its structured, presentation-neutral result (constrained
 * to EngineResult so the renderer + localization layer can walk any result
 * generically).
 *
 * Required members are the stable core. The optional `chart` / `history` /
 * `export` capabilities let richer calculators add features without changing
 * the base contract or the shared pipeline.
 */
export interface CalculatorEngine<TInput, TResult extends EngineResult = EngineResult> {
  /** URL slug, stable across locales (slugs are not translated). */
  readonly slug: string;
  /** Category id this calculator belongs to. */
  readonly category: string;

  /** The default input the widget starts with (drives the SSR/no-JS result). */
  defaultInput(): TInput;

  /** Validate raw input, returning machine-keyed issues (no prose). */
  validate(input: TInput): ValidationResult;

  /** Pure computation: raw values + enum keys only, never a localized string. */
  compute(input: TInput): TResult;

  /**
   * Presentation-neutral form schema for the live widget (Task 6). Optional so
   * calculators with a bespoke UI can omit it; the generic renderer uses it to
   * build inputs whose labels are localized from the MDX pack.
   */
  fields?(): EngineField[];

  /**
   * Coerce raw string form values (from the DOM) into the engine's typed input.
   * Paired with `fields()`. Kept on the engine so parsing rules live next to
   * the maths. `runtime` carries non-form data the client injects (e.g. live
   * FX rates for the currency converter).
   */
  parseInput?(values: Record<string, string>, runtime?: Record<string, unknown>): TInput;

  // --- Optional capabilities -------------------------------------------------

  /** Provide raw chart data derived from a result. */
  chart?(result: TResult): ChartData | ChartData[];
  /** Provide a raw history row derived from a result. */
  history?(result: TResult): HistoryEntry;
  /** Provide raw exportable data derived from a result. */
  export?(result: TResult): ExportData;
}
