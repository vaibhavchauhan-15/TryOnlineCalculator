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

/** Format a Date as YYYY-MM-DD using its LOCAL components. Using toISOString()
 *  here would shift to UTC and print the previous day for users in positive
 *  timezone offsets, contradicting the local "Result date" shown above it. */
function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

// Count Mon–Fri days in [start, end] inclusive. Computed in O(1) from the total
// day span and the start weekday rather than iterating day-by-day, so a range
// spanning centuries (which a manually entered/pasted date allows) resolves
// instantly instead of locking the main thread in a multi-million-step loop.
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
      const weekendDays = totalDays - weekdays;
      return {
        results: [
          { label: 'Business days', value: number(business, 0), primary: true, hint: 'Mon–Fri, minus holidays' },
          { label: 'Weekdays', value: number(weekdays, 0) },
          { label: 'Weekend days', value: number(weekendDays, 0) },
        ],
        charts: totalDays > 0
          ? [{
              type: 'pie',
              title: 'How the days break down',
              format: 'number',
              // Business + holidays make up the weekdays, so these three slices
              // are non-overlapping and sum to the total span.
              slices: [
                { label: 'Business days', value: Math.max(business, 0), color: '#0070f3' },
                ...(holidays > 0 ? [{ label: 'Holidays', value: Math.min(holidays, weekdays), color: '#ff0080' }] : []),
                { label: 'Weekend', value: Math.max(weekendDays, 0), color: '#f5a623' },
              ],
            }]
          : undefined,
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
      // Cap the count so the day-stepping loop can never run unbounded even if
      // a caller bypasses the input's ±500 max (100k business days ≈ 385 years).
      let remaining = Math.trunc(num(v.days, 0));
      const step = remaining >= 0 ? 1 : -1;
      remaining = Math.min(Math.abs(remaining), 100000);
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
          { label: 'ISO date', value: isoLocal(cur) },
        ],
      };
    },
    faq: [
      { q: 'Can I count backwards?', a: 'Yes. Enter a negative number of working days to find a date that many business days before the start.' },
    ],
    related: ['business-days-calculator', 'date-difference-calculator', 'age-calculator'],
  },

  /* ---------------------------------------------------------- Time Duration */
  {
    slug: 'time-duration-calculator',
    category: 'date-time',
    title: 'Time Duration Calculator',
    description: 'Calculate the duration between two times in hours, minutes and seconds.',
    intro: 'Enter a start time and an end time in HH:MM format to see the elapsed duration. Overnight spans are handled automatically.',
    keywords: ['time duration calculator', 'time calculator hours minutes', 'hours between times', 'time difference calculator', 'elapsed time calculator', 'calculate time difference', 'time span calculator'],
    inputs: [
      { name: 'start', label: 'Start time', type: 'text', default: '09:00', placeholder: 'HH:MM', span: 1 },
      { name: 'end', label: 'End time', type: 'text', default: '17:30', placeholder: 'HH:MM', span: 1 },
    ],
    compute: (v) => {
      const parseTime = (s: string) => {
        const m = (s || '').match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        const h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        if (h < 0 || h > 23 || min < 0 || min > 59) return null;
        return h * 60 + min;
      };
      const s = parseTime(v.start);
      const e = parseTime(v.end);
      if (s === null || e === null) return { results: [], error: 'Enter valid times in HH:MM format (24-hour).' };
      let diff = e - s;
      if (diff < 0) diff += 1440; // overnight
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return {
        results: [
          { label: 'Duration', value: `${hrs} hr ${mins} min`, primary: true },
          { label: 'Total minutes', value: number(diff, 0) },
          { label: 'Total seconds', value: number(diff * 60, 0) },
        ],
        breakdown: [
          { label: 'In decimal hours', value: number(diff / 60, 2) },
        ],
      };
    },
    formulaItems: [
      { name: 'Duration', expr: 'Duration = End time − Start time' },
      { name: 'Overnight', expr: 'If End < Start, Duration = (End + 24:00) − Start' },
    ],
    howto: ['Enter the start time in HH:MM (24-hour format).', 'Enter the end time.', 'Read the duration in hours and minutes below.'],
    faq: [
      { q: 'How do I calculate time duration?', a: 'Enter the start time and end time in HH:MM format. The calculator finds the difference in hours and minutes, handling overnight spans automatically.' },
      { q: 'Does it handle overnight time spans?', a: 'Yes. If the end time is earlier than the start time (e.g. 23:00 to 02:00), the calculator assumes the span crosses midnight and gives you 3 hours.' },
      { q: 'Can I use 12-hour format?', a: 'Enter times in 24-hour format (e.g. 2:30 PM = 14:30). This avoids AM/PM confusion.' },
      { q: 'How do I convert minutes to hours and minutes?', a: 'Divide total minutes by 60. The quotient is hours, the remainder is minutes. For example, 150 minutes = 2 hours 30 minutes.' },
    ],
    related: ['date-difference-calculator', 'age-calculator', 'business-days-calculator', 'countdown-calculator'],
  },

  /* ------------------------------------------------------- Time Zone Converter */
  {
    slug: 'time-zone-converter',
    category: 'date-time',
    title: 'Time Zone Converter',
    description: 'Convert any time between world time zones instantly. Supports UTC, EST, PST, IST, CET, JST and 25+ zones.',
    intro: 'Enter a time in HH:MM format, select the source and target time zones, and see the converted time instantly.',
    keywords: ['time zone converter', 'time zone calculator', 'convert time zones', 'world clock converter', 'time zone difference', 'EST to IST converter', 'time zone conversion'],
    inputs: [
      { name: 'time', label: 'Time', type: 'text', default: '12:00', placeholder: 'HH:MM', span: 2 },
      {
        name: 'from', label: 'From timezone', type: 'select', default: '-300', span: 1,
        options: [
          { label: 'UTC-12 (Baker Island)', value: '-720' },
          { label: 'UTC-11 (Samoa)', value: '-660' },
          { label: 'UTC-10 (Hawaii)', value: '-600' },
          { label: 'UTC-9 (Alaska)', value: '-540' },
          { label: 'UTC-8 (PST)', value: '-480' },
          { label: 'UTC-7 (MST)', value: '-420' },
          { label: 'UTC-6 (CST US)', value: '-360' },
          { label: 'UTC-5 (EST)', value: '-300' },
          { label: 'UTC-4 (AST)', value: '-240' },
          { label: 'UTC-3 (Buenos Aires)', value: '-180' },
          { label: 'UTC-2 (South Georgia)', value: '-120' },
          { label: 'UTC-1 (Azores)', value: '-60' },
          { label: 'UTC+0 (GMT / London)', value: '0' },
          { label: 'UTC+1 (CET / Berlin)', value: '60' },
          { label: 'UTC+2 (EET / Cairo)', value: '120' },
          { label: 'UTC+3 (Moscow)', value: '180' },
          { label: 'UTC+3:30 (Tehran)', value: '210' },
          { label: 'UTC+4 (Dubai)', value: '240' },
          { label: 'UTC+4:30 (Kabul)', value: '270' },
          { label: 'UTC+5 (Pakistan)', value: '300' },
          { label: 'UTC+5:30 (IST / India)', value: '330' },
          { label: 'UTC+5:45 (Nepal)', value: '345' },
          { label: 'UTC+6 (Bangladesh)', value: '360' },
          { label: 'UTC+6:30 (Myanmar)', value: '390' },
          { label: 'UTC+7 (Bangkok)', value: '420' },
          { label: 'UTC+8 (Singapore / China)', value: '480' },
          { label: 'UTC+9 (JST / Tokyo)', value: '540' },
          { label: 'UTC+9:30 (Adelaide)', value: '570' },
          { label: 'UTC+10 (AEST / Sydney)', value: '600' },
          { label: 'UTC+11 (Solomon Is.)', value: '660' },
          { label: 'UTC+12 (NZST / Auckland)', value: '720' },
          { label: 'UTC+13 (Tonga)', value: '780' },
        ],
      },
      {
        name: 'to', label: 'To timezone', type: 'select', default: '330', span: 1,
        options: [
          { label: 'UTC-12 (Baker Island)', value: '-720' },
          { label: 'UTC-11 (Samoa)', value: '-660' },
          { label: 'UTC-10 (Hawaii)', value: '-600' },
          { label: 'UTC-9 (Alaska)', value: '-540' },
          { label: 'UTC-8 (PST)', value: '-480' },
          { label: 'UTC-7 (MST)', value: '-420' },
          { label: 'UTC-6 (CST US)', value: '-360' },
          { label: 'UTC-5 (EST)', value: '-300' },
          { label: 'UTC-4 (AST)', value: '-240' },
          { label: 'UTC-3 (Buenos Aires)', value: '-180' },
          { label: 'UTC-2 (South Georgia)', value: '-120' },
          { label: 'UTC-1 (Azores)', value: '-60' },
          { label: 'UTC+0 (GMT / London)', value: '0' },
          { label: 'UTC+1 (CET / Berlin)', value: '60' },
          { label: 'UTC+2 (EET / Cairo)', value: '120' },
          { label: 'UTC+3 (Moscow)', value: '180' },
          { label: 'UTC+3:30 (Tehran)', value: '210' },
          { label: 'UTC+4 (Dubai)', value: '240' },
          { label: 'UTC+4:30 (Kabul)', value: '270' },
          { label: 'UTC+5 (Pakistan)', value: '300' },
          { label: 'UTC+5:30 (IST / India)', value: '330' },
          { label: 'UTC+5:45 (Nepal)', value: '345' },
          { label: 'UTC+6 (Bangladesh)', value: '360' },
          { label: 'UTC+6:30 (Myanmar)', value: '390' },
          { label: 'UTC+7 (Bangkok)', value: '420' },
          { label: 'UTC+8 (Singapore / China)', value: '480' },
          { label: 'UTC+9 (JST / Tokyo)', value: '540' },
          { label: 'UTC+9:30 (Adelaide)', value: '570' },
          { label: 'UTC+10 (AEST / Sydney)', value: '600' },
          { label: 'UTC+11 (Solomon Is.)', value: '660' },
          { label: 'UTC+12 (NZST / Auckland)', value: '720' },
          { label: 'UTC+13 (Tonga)', value: '780' },
        ],
      },
    ],
    compute: (v) => {
      const m = (v.time || '').match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return { results: [], error: 'Enter a valid time in HH:MM format (24-hour).' };
      const h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      if (h < 0 || h > 23 || min < 0 || min > 59) return { results: [], error: 'Enter a valid time (0–23 hours, 0–59 minutes).' };
      const fromOffset = num(v.from, 0);
      const toOffset = num(v.to, 0);
      const totalMins = h * 60 + min + (toOffset - fromOffset);
      let dayShift = 0;
      let adjusted = totalMins;
      if (adjusted >= 1440) { adjusted -= 1440; dayShift = 1; }
      if (adjusted < 0) { adjusted += 1440; dayShift = -1; }
      const rh = Math.floor(adjusted / 60);
      const rm = adjusted % 60;
      const converted = `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
      const diffHrs = (toOffset - fromOffset) / 60;
      const dayLabel = dayShift === 1 ? ' (+1 day)' : dayShift === -1 ? ' (−1 day)' : '';
      return {
        results: [
          { label: 'Converted time', value: `${converted}${dayLabel}`, primary: true },
          { label: 'Time difference', value: `${diffHrs >= 0 ? '+' : ''}${number(diffHrs, 1)} hours` },
        ],
      };
    },
    howto: ['Enter the time you want to convert.', 'Select the source timezone.', 'Select the target timezone.', 'Read the converted time below.'],
    faq: [
      { q: 'How do I convert between time zones?', a: 'Select the source and target time zones, enter the time you want to convert, and the calculator instantly shows the equivalent time in the target zone.' },
      { q: 'Does it account for daylight saving time?', a: 'This calculator uses fixed UTC offsets. For precise DST-adjusted times, note that many regions shift by 1 hour during summer months.' },
      { q: 'What is UTC?', a: 'UTC (Coordinated Universal Time) is the primary time standard. Time zones are defined as offsets from UTC, for example EST is UTC-5 and IST (India) is UTC+5:30.' },
      { q: 'How do I know if it is the next day?', a: 'If the converted time goes past midnight, the result shows a "+1 day" indicator. If it goes before midnight backwards, it shows "−1 day".' },
      { q: 'What is the time difference between EST and IST?', a: 'EST (UTC-5) to IST (UTC+5:30) is a 10.5-hour difference. When it is 9:00 AM EST, it is 7:30 PM IST.' },
    ],
    related: ['time-duration-calculator', 'date-difference-calculator', 'countdown-calculator', 'business-days-calculator'],
  },

  /* ------------------------------------------------------------- Countdown */
  {
    slug: 'countdown-calculator',
    category: 'date-time',
    title: 'Countdown Calculator',
    description: 'Count the days, weeks, months and hours remaining until any future date.',
    intro: 'Enter a target date to see exactly how much time is left — in days, weeks, months and a year-month-day breakdown.',
    keywords: ['countdown calculator', 'days until calculator', 'countdown to date', 'how many days until', 'date countdown', 'countdown timer calculator', 'days remaining calculator'],
    inputs: [
      { name: 'target', label: 'Target date', type: 'date', default: '2027-01-01' },
    ],
    compute: (v) => {
      const target = parseDate(v.target);
      if (!target) return { results: [], error: 'Enter a valid target date.' };
      const now = today();
      const totalDays = Math.round((target.getTime() - now.getTime()) / DAY);
      const isPast = totalDays < 0;
      const absDays = Math.abs(totalDays);
      const { years, months, days } = ymdDiff(now, target);
      const label = isPast ? 'Days ago' : 'Days remaining';
      return {
        results: [
          { label, value: number(absDays, 0), primary: true, tone: isPast ? 'warning' : 'success' },
          { label: 'Breakdown', value: `${years} yr ${months} mo ${days} d` },
          { label: 'Weeks', value: `${number(Math.floor(absDays / 7), 0)} wk ${absDays % 7} d` },
        ],
        breakdown: [
          { label: 'Total hours', value: number(absDays * 24, 0) },
          { label: 'Total months (approx)', value: number(years * 12 + months, 0) },
        ],
      };
    },
    howto: ['Enter the date you are counting down to.', 'View the days, weeks and months remaining.', 'If the date has passed, the calculator shows how long ago it was.'],
    faq: [
      { q: 'How does the countdown calculator work?', a: 'Enter a future date and the calculator instantly shows the remaining time in days, weeks, months and a year-month-day breakdown.' },
      { q: 'What if the date is in the past?', a: 'The calculator tells you the date has already passed and shows how long ago it was.' },
      { q: 'How are months counted?', a: 'Months are counted as full calendar months from today. The remaining days after full months are shown separately.' },
      { q: 'Can I count down to a specific time?', a: 'This calculator counts down to the start of the selected date (midnight). For time-specific durations, use the time duration calculator.' },
      { q: 'How many days until New Year?', a: 'Enter January 1 of the next year as the target date to see the exact countdown.' },
    ],
    related: ['date-difference-calculator', 'age-calculator', 'business-days-calculator', 'working-days-calculator'],
  },
];
