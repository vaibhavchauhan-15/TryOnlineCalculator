// Date & Time — pure engines (age, date difference, business days, working days).
//
// Every calculator here deals in *dates*, but the contract only speaks raw
// numbers + enum keys — never a localized date string. So instead of emitting
// prose like "34 years, 2 months old" or a locale-formatted "Monday, June 17,
// 2024", these engines emit the raw components (years / months / days, or the
// result date's year / month / day) plus a weekday ENUM KEY the localization
// layer resolves. The exact day-count, inclusive/exclusive and weekend logic of
// the original inline calculators is preserved verbatim.

import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import type { AnyEngine } from '../index';
import { ok, fail } from '../contract';
import { num } from '../units';

// --------------------------------------------------------------- date helpers

const DAY = 86400000;

/** Parse a YYYY-MM-DD string at local midnight, matching the legacy parser. */
function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Today at local midnight (matches the legacy `today()`). */
function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Format a Date as YYYY-MM-DD from its LOCAL components (avoids UTC shift). */
function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Calendar difference in whole years / months / days (legacy `ymdDiff`). */
function ymdDiff(from: Date, to: Date) {
  let a = from, b = to;
  const sign = a > b ? -1 : 1;
  if (sign < 0) [a, b] = [b, a];
  let years = b.getFullYear() - a.getFullYear();
  let months = b.getMonth() - a.getMonth();
  let days = b.getDate() - a.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(b.getFullYear(), b.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days, sign };
}

/** Count Mon–Fri days in [start, end] inclusive, in O(1) (legacy logic). */
function countWeekdays(start: Date, end: Date): number {
  let a = start, b = end;
  if (a > b) [a, b] = [b, a];
  const total = Math.round((b.getTime() - a.getTime()) / DAY) + 1;
  if (total <= 0) return 0;
  const fullWeeks = Math.floor(total / 7);
  let count = fullWeeks * 5;
  const remainder = total % 7;
  const startDay = a.getDay();
  for (let i = 0; i < remainder; i++) {
    const day = (startDay + i) % 7;
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

/** getDay() (0=Sun … 6=Sat) → enum key resolved downstream. */
const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// ------------------------------------------------------------------------ Age

export interface AgeInput {
  dob: string; // YYYY-MM-DD
  asOf: string; // YYYY-MM-DD; blank → today (resolved at parse time)
}

export interface AgeResult extends EngineResult {}

export const ageEngine: CalculatorEngine<AgeInput, AgeResult> = {
  slug: 'age-calculator',
  category: 'date-time',

  // asOf defaults to today (legacy: blank "as of" date uses today), resolved
  // here so compute() stays deterministic for a given input.
  defaultInput: (): AgeInput => ({ dob: '2000-01-01', asOf: isoLocal(today()) }),

  fields: (): EngineField[] => [
    { name: 'dob', labelKey: 'field.dob', type: 'text', defaultValue: '2000-01-01' },
    { name: 'asOf', labelKey: 'field.asOf', type: 'text', defaultValue: '', helpKey: 'field.asOfHelp' },
  ],

  // Raw date strings pass through untouched; a blank "as of" resolves to today
  // at parse time so the pure compute below never reads the wall clock.
  parseInput: (values): AgeInput => ({
    dob: (values.dob ?? '').trim(),
    asOf: (values.asOf ?? '').trim() || isoLocal(today()),
  }),

  validate: (input) => {
    const dob = parseDate(input.dob);
    if (!dob) return fail('dateTime.invalidDob', { field: 'dob' });
    const asOf = parseDate(input.asOf) ?? today();
    if (asOf < dob) return fail('dateTime.asOfBeforeDob', { field: 'asOf' });
    return ok();
  },

  compute: (input) => {
    const dob = parseDate(input.dob);
    if (!dob) return { items: [] };
    const asOf = parseDate(input.asOf) ?? today();
    const { years, months, days } = ymdDiff(dob, asOf);
    const totalDays = Math.round((asOf.getTime() - dob.getTime()) / DAY);
    const totalMonths = years * 12 + months;

    const items: ResultItem[] = [
      { key: 'years', value: years, format: 'integer', primary: true },
      { key: 'months', value: months, format: 'integer' },
      { key: 'days', value: days, format: 'integer' },
      { key: 'totalMonths', value: totalMonths, format: 'integer' },
      { key: 'totalDays', value: totalDays, format: 'integer' },
    ];

    const breakdown: ResultItem[] = [
      { key: 'weeks', value: Math.floor(totalDays / 7), format: 'integer' },
      { key: 'hours', value: totalDays * 24, format: 'integer' },
    ];

    return { items, breakdown };
  },
};

// -------------------------------------------------------------- Date Difference

export interface DateDifferenceInput {
  start: string;
  end: string;
}

export interface DateDifferenceResult extends EngineResult {}

export const dateDifferenceEngine: CalculatorEngine<DateDifferenceInput, DateDifferenceResult> = {
  slug: 'date-difference-calculator',
  category: 'date-time',

  defaultInput: (): DateDifferenceInput => ({ start: '2024-01-01', end: '2024-12-31' }),

  fields: (): EngineField[] => [
    { name: 'start', labelKey: 'field.start', type: 'text', defaultValue: '2024-01-01' },
    { name: 'end', labelKey: 'field.end', type: 'text', defaultValue: '2024-12-31' },
  ],

  parseInput: (values): DateDifferenceInput => ({
    start: (values.start ?? '').trim(),
    end: (values.end ?? '').trim(),
  }),

  validate: (input) => {
    if (!parseDate(input.start)) return fail('dateTime.invalidStart', { field: 'start' });
    if (!parseDate(input.end)) return fail('dateTime.invalidEnd', { field: 'end' });
    return ok();
  },

  compute: (input) => {
    const start = parseDate(input.start);
    const end = parseDate(input.end);
    if (!start || !end) return { items: [] };

    const totalDays = Math.abs(Math.round((end.getTime() - start.getTime()) / DAY));
    const { years, months, days } = ymdDiff(start, end);

    const items: ResultItem[] = [
      { key: 'totalDays', value: totalDays, format: 'integer', primary: true },
      // Legacy "Duration" ("y yr m mo d d") → separate raw components.
      { key: 'years', value: years, format: 'integer' },
      { key: 'months', value: months, format: 'integer' },
      { key: 'days', value: days, format: 'integer' },
      // Legacy "Weeks" ("w wk r d") → whole weeks + leftover days.
      { key: 'weeks', value: Math.floor(totalDays / 7), format: 'integer' },
      { key: 'weeksRemainderDays', value: totalDays % 7, format: 'integer' },
    ];

    const breakdown: ResultItem[] = [
      { key: 'totalWeeks', value: totalDays / 7, format: 'decimal', precision: 1 },
      { key: 'totalMonths', value: years * 12 + months, format: 'integer' },
    ];

    return { items, breakdown };
  },
};

// --------------------------------------------------------------- Business Days

export interface BusinessDaysInput {
  start: string;
  end: string;
  holidays: number;
}

export interface BusinessDaysResult extends EngineResult {}

export const businessDaysEngine: CalculatorEngine<BusinessDaysInput, BusinessDaysResult> = {
  slug: 'business-days-calculator',
  category: 'date-time',

  defaultInput: (): BusinessDaysInput => ({ start: '2024-01-01', end: '2024-03-31', holidays: 0 }),

  fields: (): EngineField[] => [
    { name: 'start', labelKey: 'field.start', type: 'text', defaultValue: '2024-01-01' },
    { name: 'end', labelKey: 'field.end', type: 'text', defaultValue: '2024-03-31' },
    { name: 'holidays', labelKey: 'field.holidays', type: 'number', defaultValue: '0', min: 0, max: 260, step: 1, span: 2 },
  ],

  parseInput: (values): BusinessDaysInput => ({
    start: (values.start ?? '').trim(),
    end: (values.end ?? '').trim(),
    holidays: num(values.holidays, 0),
  }),

  validate: (input) => {
    if (!parseDate(input.start)) return fail('dateTime.invalidStart', { field: 'start' });
    if (!parseDate(input.end)) return fail('dateTime.invalidEnd', { field: 'end' });
    return ok();
  },

  compute: (input) => {
    const start = parseDate(input.start);
    const end = parseDate(input.end);
    if (!start || !end) return { items: [] };

    const weekdays = countWeekdays(start, end);
    const holidays = Math.max(Math.floor(input.holidays), 0);
    const business = Math.max(weekdays - holidays, 0);
    const totalDays = Math.abs(Math.round((end.getTime() - start.getTime()) / DAY)) + 1;
    const weekendDays = totalDays - weekdays;

    const items: ResultItem[] = [
      { key: 'businessDays', value: business, format: 'integer', primary: true, hintKey: 'dateTime.businessDaysHint' },
      { key: 'weekdays', value: weekdays, format: 'integer' },
      { key: 'weekendDays', value: weekendDays, format: 'integer' },
    ];

    const result: BusinessDaysResult = { items };

    if (totalDays > 0) {
      // Business + holidays make up the weekdays, so these slices are
      // non-overlapping and sum to the total span.
      const slices = [
        { labelKey: 'businessDays', value: Math.max(business, 0), color: '#0070f3' },
        ...(holidays > 0 ? [{ labelKey: 'holidays', value: Math.min(holidays, weekdays), color: '#ff0080' }] : []),
        { labelKey: 'weekend', value: Math.max(weekendDays, 0), color: '#f5a623' },
      ];
      result.charts = [
        { type: 'pie', titleKey: 'dateTime.businessPieTitle', format: 'decimal', slices },
      ];
    }

    return result;
  },
};

// ---------------------------------------------------------------- Working Days

export interface WorkingDaysInput {
  start: string;
  days: number;
}

export interface WorkingDaysResult extends EngineResult {}

export const workingDaysEngine: CalculatorEngine<WorkingDaysInput, WorkingDaysResult> = {
  slug: 'working-days-calculator',
  category: 'date-time',

  defaultInput: (): WorkingDaysInput => ({ start: '2024-06-03', days: 10 }),

  fields: (): EngineField[] => [
    { name: 'start', labelKey: 'field.start', type: 'text', defaultValue: '2024-06-03' },
    { name: 'days', labelKey: 'field.days', type: 'number', defaultValue: '10', min: -500, max: 500, step: 1 },
  ],

  parseInput: (values): WorkingDaysInput => ({
    start: (values.start ?? '').trim(),
    days: num(values.days, 0),
  }),

  validate: (input) => {
    if (!parseDate(input.start)) return fail('dateTime.invalidStart', { field: 'start' });
    return ok();
  },

  compute: (input) => {
    const start = parseDate(input.start);
    if (!start) return { items: [] };

    // Cap the count so the day-stepping loop can never run unbounded even if a
    // caller bypasses the ±500 field max (100k business days ≈ 385 years).
    let remaining = Math.trunc(input.days);
    const step = remaining >= 0 ? 1 : -1;
    remaining = Math.min(Math.abs(remaining), 100000);
    const cur = new Date(start);
    while (remaining > 0) {
      cur.setDate(cur.getDate() + step);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) remaining--;
    }

    // The result date, decomposed into raw components + a weekday enum key.
    // The localization layer formats these into a locale date string.
    const items: ResultItem[] = [
      { key: 'resultWeekday', enumKey: WEEKDAY_KEYS[cur.getDay()], primary: true },
      { key: 'resultYear', value: cur.getFullYear(), format: 'plain' },
      { key: 'resultMonth', value: cur.getMonth() + 1, format: 'plain' },
      { key: 'resultDay', value: cur.getDate(), format: 'plain' },
    ];

    return { items };
  },
};

// ------------------------------------------------------------------------ Export

export const dateTimeEngines: AnyEngine[] = [
  ageEngine as AnyEngine,
  dateDifferenceEngine as AnyEngine,
  businessDaysEngine as AnyEngine,
  workingDaysEngine as AnyEngine,
];
