import type { Category, CategoryId } from './types';

// Ordered for homepage + nav display. Icons are lucide-style 24x24 stroke paths.
export const categories: Category[] = [
  {
    id: 'finance',
    name: 'Finance',
    path: '/finance',
    tagline: 'Money, loans & investing',
    description:
      'Mortgage, loan, investment and interest calculators to plan every financial decision with confidence.',
    icon: 'M16 7h6v6 M22 7l-8.5 8.5-5-5L2 17',
  },
  {
    id: 'health',
    name: 'Health',
    path: '/health',
    tagline: 'Body, fitness & nutrition',
    description:
      'BMI, calorie, macro and body metric calculators built on trusted formulas used by clinicians and coaches.',
    icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  },
  {
    id: 'education',
    name: 'Education',
    path: '/education',
    tagline: 'Grades & GPA',
    description:
      'Figure out your GPA, current grade and the score you need on the final exam in seconds.',
    icon: 'M22 10 12 5 2 10l10 5 10-5Z M6 12v5c3 2.5 9 2.5 12 0v-5',
  },
  {
    id: 'math',
    name: 'Math',
    path: '/math',
    tagline: 'Everyday & scientific',
    description:
      'Basic, scientific, percentage, fraction and average calculators for homework and quick checks.',
    icon: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M8 7h8 M8 12h.01 M12 12h.01 M16 12h.01 M8 16h.01 M12 16h.01 M16 16h.01',
  },
  {
    id: 'salary',
    name: 'Salary',
    path: '/salary',
    tagline: 'Pay & wages',
    description:
      'Convert between hourly, weekly, monthly and annual pay and estimate take-home paychecks.',
    icon: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z M16 12h.01 M2 10h20',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    path: '/shopping',
    tagline: 'Discounts, tips & tax',
    description:
      'Work out sale prices, tips and sales tax before you get to the register.',
    icon: 'M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M19 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L23 6H6',
  },
  {
    id: 'date-time',
    name: 'Date & Time',
    path: '/date-time',
    tagline: 'Ages, spans & days',
    description:
      'Calculate exact age, the difference between two dates and the number of working days.',
    icon: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  },
  {
    id: 'travel',
    name: 'Travel',
    path: '/travel',
    tagline: 'Fuel & mileage',
    description:
      'Estimate fuel cost for a trip and convert distance and fuel economy figures.',
    icon: 'M5 17H3v-3.3a2 2 0 0 1 .9-1.68L6 11l1.3-3.9A2 2 0 0 1 9.2 6h5.6a2 2 0 0 1 1.9 1.37L18 11l2.1.02a2 2 0 0 1 .9 1.68V17h-2 M7 17h10 M7 17a2 2 0 1 1-4 0 M21 17a2 2 0 1 1-4 0',
  },
];

const categoryMap = new Map<CategoryId, Category>(categories.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): Category | undefined {
  return categoryMap.get(id);
}
