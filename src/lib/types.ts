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

export type FieldType = 'number' | 'select' | 'radio' | 'date' | 'text';

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

export interface ComputeOutput {
  results: ResultItem[];
  error?: string;
  /** Optional breakdown rows for a simple table (e.g. amortization summary). */
  breakdown?: { label: string; value: string }[];
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
