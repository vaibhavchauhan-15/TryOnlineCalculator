import type { Calculator } from '../types';
import { num, number } from '../format';

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

const DAY = 86400000;

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

function countWeekdays(start: Date, end: Date): number {
  let a = start, b = end;
  if (a > b) [a, b] = [b, a];
  let count = 0;
  const cur = new Date(a);
  while (cur <= b) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export const dateTimeCalculators: Calculator[] = [
  /* --------------------------------------------------------------------- Age */
  {
    slug: 'age-calculator',
    category: 'date-time',
    title: 'Age Calculator',
    description: 'Calculate your exact age in years, months and days from your date of birth.',
    intro: 'Enter your date of birth. Leave the "as of" date blank to use today.',
    keywords: ['age calculator', 'how old am i', 'exact age'],
    popular: true,
    inputs: [
      { name: 'dob', label: 'Date of birth', type: 'date', default: '2000-01-01' },
      { name: 'asOf', label: 'Age at date', type: 'date', help: 'Defaults to today if left blank.' },
    ],
    compute: (v) => {
      const dob = parseDate(v.dob);
      if (!dob) return { results: [], error: 'Enter a valid date of birth.' };
      const asOf = parseDate(v.asOf) ?? today();
      if (asOf < dob) return { results: [], error: 'The "as of" date is before the date of birth.' };
      const { years, months, days } = ymdDiff(dob, asOf);
      const totalDays = Math.round((asOf.getTime() - dob.getTime()) / DAY);
      return {
        results: [
          { label: 'Age', value: `${years} yr ${months} mo ${days} d`, primary: true },
          { label: 'Total months', value: number(years * 12 + months, 0) },
          { label: 'Total days', value: number(totalDays, 0) },
        ],
        breakdown: [
          { label: 'In weeks', value: `${number(Math.floor(totalDays / 7), 0)} weeks` },
          { label: 'In hours', value: `${number(totalDays * 24, 0)} hours` },
        ],
      };
    },
    faq: [
      { q: 'How is age calculated?', a: 'It counts complete years, then the remaining complete months, then leftover days — the same way you would say someone is "34 years, 2 months old".' },
      { q: 'Can I find my age on a future date?', a: 'Yes. Set the "age at date" field to any date to see how old you will be then.' },
    ],
    related: ['date-difference-calculator', 'business-days-calculator', 'working-days-calculator'],
  },

  /* --------------------------------------------------------- Date Difference */
  {
    slug: 'date-difference-calculator',
    category: 'date-time',
    title: 'Date Difference Calculator',
    description: 'Find the number of days, weeks and months between two dates.',
    intro: 'Choose a start and end date to see the exact span between them.',
    keywords: ['date difference calculator', 'days between dates', 'date duration'],
    popular: true,
    inputs: [
      { name: 'start', label: 'Start date', type: 'date', default: '2024-01-01' },
      { name: 'end', label: 'End date', type: 'date', default: '2024-12-31' },
    ],
    compute: (v) => {
      const start = parseDate(v.start);
      const end = parseDate(v.end);
      if (!start || !end) return { results: [], error: 'Enter both dates.' };
      const totalDays = Math.abs(Math.round((end.getTime() - start.getTime()) / DAY));
      const { years, months, days } = ymdDiff(start, end);
      return {
        results: [
          { label: 'Total days', value: number(totalDays, 0), primary: true },
          { label: 'Duration', value: `${years} yr ${months} mo ${days} d` },
          { label: 'Weeks', value: `${number(Math.floor(totalDays / 7), 0)} wk ${totalDays % 7} d` },
        ],
        breakdown: [
          { label: 'Total weeks', value: number(totalDays / 7, 1) },
          { label: 'Total months (approx)', value: number(years * 12 + months, 0) },
        ],
      };
    },
    faq: [
      { q: 'Are both dates included?', a: 'The total days figure is the count of days between the two dates. Add one if you want to include both the start and end day (inclusive counting).' },
    ],
    related: ['age-calculator', 'business-days-calculator', 'working-days-calculator'],
  },

  /* ----------------------------------------------------------- Business Days */
  {
    slug: 'business-days-calculator',
    category: 'date-time',
    title: 'Business Days Calculator',
    description: 'Count the number of business days (Mon–Fri) between two dates.',
    intro: 'Enter a start and end date to count the weekdays between them, excluding Saturdays and Sundays.',
    keywords: ['business days calculator', 'weekdays between dates', 'working days'],
    inputs: [
      { name: 'start', label: 'Start date', type: 'date', default: '2024-01-01' },
      { name: 'end', label: 'End date', type: 'date', default: '2024-03-31' },
      { name: 'holidays', label: 'Public holidays to exclude', type: 'number', default: 0, min: 0, max: 260, step: 1, span: 2 },
    ],
    compute: (v) => {
      const start = parseDate(v.start);
      const end = parseDate(v.end);
      if (!start || !end) return { results: [], error: 'Enter both dates.' };
      const weekdays = countWeekdays(start, end);
      const holidays = Math.max(Math.floor(num(v.holidays, 0)), 0);
      const business = Math.max(weekdays - holidays, 0);
      const totalDays = Math.abs(Math.round((end.getTime() - start.getTime()) / DAY)) + 1;
      return {
        results: [
          { label: 'Business days', value: number(business, 0), primary: true, hint: 'Mon–Fri, minus holidays' },
          { label: 'Weekdays', value: number(weekdays, 0) },
          { label: 'Weekend days', value: number(totalDays - weekdays, 0) },
        ],
      };
    },
    faq: [
      { q: 'Does it count both endpoints?', a: 'Yes. Business days are counted inclusively, so both the start and end date are included if they fall on a weekday.' },
      { q: 'Are holidays automatic?', a: 'No, holidays vary by country and region. Enter the number of public holidays in the range to subtract them.' },
    ],
    related: ['working-days-calculator', 'date-difference-calculator', 'age-calculator'],
  },

  /* ------------------------------------------------------------ Working Days */
  {
    slug: 'working-days-calculator',
    category: 'date-time',
    title: 'Working Days Calculator',
    description: 'Add or subtract a number of working days to a date, skipping weekends.',
    intro: 'Enter a start date and a number of working days to find the resulting business date.',
    keywords: ['working days calculator', 'add business days', 'deadline calculator'],
    inputs: [
      { name: 'start', label: 'Start date', type: 'date', default: '2024-06-03' },
      { name: 'days', label: 'Working days to add', type: 'number', default: 10, min: -500, max: 500, step: 1 },
    ],
    compute: (v) => {
      const start = parseDate(v.start);
      if (!start) return { results: [], error: 'Enter a valid start date.' };
      let remaining = Math.trunc(num(v.days, 0));
      const step = remaining >= 0 ? 1 : -1;
      remaining = Math.abs(remaining);
      const cur = new Date(start);
      while (remaining > 0) {
        cur.setDate(cur.getDate() + step);
        const day = cur.getDay();
        if (day !== 0 && day !== 6) remaining--;
      }
      const fmt = cur.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return {
        results: [
          { label: 'Result date', value: fmt, primary: true },
          { label: 'ISO date', value: cur.toISOString().slice(0, 10) },
        ],
      };
    },
    faq: [
      { q: 'Can I count backwards?', a: 'Yes. Enter a negative number of working days to find a date that many business days before the start.' },
    ],
    related: ['business-days-calculator', 'date-difference-calculator', 'age-calculator'],
  },
];
