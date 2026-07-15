// Core types for the reusable calculator engine.

export type CategoryId =
  | 'finance'
  | 'health'
  | 'education'
  | 'date-time'
  | 'salary'
  | 'math'
  | 'shopping'
  | 'travel';

export type FieldType = 'number' | 'select' | 'radio' | 'date' | 'text' | 'textarea';

export interface FieldOption {
  label: string;
  value: string;
}

export interface InputField {
  name: string;
  label: string;
  type: FieldType;
  default?: string | number;
  placeholder?: string;
  prefix?: string; // e.g. "$"
  suffix?: string; // e.g. "%", "yrs", "kg"
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  help?: string;
  /** Show this field only when another field equals one of these values. */
  showWhen?: { field: string; equals: string[] };
  /** Column span in the 2-col input grid (1 or 2). Defaults to 1. */
  span?: 1 | 2;
}

export interface ResultItem {
  label: string;
  value: string; // pre-formatted
  primary?: boolean; // headline result
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

/** One slice of a pie / donut chart. */
export interface PieSlice {
  label: string;
  value: number;
  /** Optional explicit colour; falls back to the shared chart palette. */
  color?: string;
}

/** One line on a line chart. `points` are y-values aligned to `ChartSpec.labels`. */
export interface LineSeries {
  label: string;
  points: number[];
  color?: string;
}

/** One coloured band on a gauge chart (e.g. a BMI category range). */
export interface GaugeSegment {
  /** Range start on the gauge scale (inclusive). */
  from: number;
  /** Range end on the gauge scale (exclusive). */
  to: number;
  label: string;
  /** Explicit colour; falls back to the shared chart palette. */
  color?: string;
}

/**
 * A reusable chart definition. Charts are rendered as dependency-free inline
 * SVG in the shared result pipeline, so any calculator can attach one.
 */
export interface ChartSpec {
  type: 'pie' | 'line' | 'gauge';
  title?: string;
  /** How to format numeric axis / legend values. */
  format?: 'currency' | 'number';
  /** Pie/donut slices. */
  slices?: PieSlice[];
  /** Line-chart series. */
  series?: LineSeries[];
  /** X-axis tick labels for a line chart (aligned to each series point). */
  labels?: string[];
  /** Gauge: coloured bands laid out along the scale. */
  segments?: GaugeSegment[];
  /** Gauge: the value the needle points to. */
  value?: number;
  /** Gauge: pre-formatted big value label (defaults to the numeric value). */
  valueLabel?: string;
  /** Gauge: short caption under the value (e.g. the matched category). */
  valueCaption?: string;
  /** Gauge: scale bounds. Defaults derive from the segments when omitted. */
  min?: number;
  max?: number;
}

/** A small labelled reference block (e.g. "Latest mortgage rates"). */
export interface InfoBlock {
  title: string;
  note?: string;
  items: { label: string; value: string }[];
}

export interface ComputeOutput {
  results: ResultItem[];
  error?: string;
  /** Optional breakdown rows for a simple table (e.g. amortization summary). */
  breakdown?: { label: string; value: string }[];
  /** Optional charts rendered below the result rows. */
  charts?: ChartSpec[];
  /** Optional reference / info block rendered with the result. */
  info?: InfoBlock;
}

/** Values come in as strings from the DOM; compute coerces as needed. */
export type Values = Record<string, string>;

export type ComputeFn = (values: Values) => ComputeOutput;

export interface FaqItem {
  q: string;
  a: string;
}

export interface FormulaItem {
  name: string;
  expr: string;
  desc?: string;
}

export interface Calculator {
  slug: string;
  category: CategoryId;
  title: string; // e.g. "Mortgage Calculator"
  description: string; // 1-2 sentence summary (used for meta + hero)
  intro?: string; // longer intro paragraph shown above the tool
  keywords?: string[];
  popular?: boolean;
  /**
   * When set, the page renders an interactive visual calculator (keypad /
   * structured UI) instead of the generic form widget. The compute() function
   * and inputs are still used for SEO / no-JS fallback and related content.
   */
  visual?: 'basic' | 'scientific' | 'fraction' | 'percentage' | 'average';
  inputs: InputField[];
  compute: ComputeFn;
  formulaIntro?: string;
  formulaItems?: FormulaItem[];
  howto?: string[];
  examples?: { title: string; body: string }[];
  faq: FaqItem[];
  related?: string[]; // slugs
}

export interface Category {
  id: CategoryId;
  name: string;
  path: string;
  tagline: string;
  description: string;
  icon: string; // inline svg path data or emoji-free identifier
}
