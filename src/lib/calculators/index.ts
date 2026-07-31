import type { Calculator, CategoryId } from '../types';
import { financeCalculators } from './finance';
import { healthCalculators } from './health';
import { educationCalculators } from './education';
import { mathCalculators } from './math';
import { salaryCalculators } from './salary';
import { shoppingCalculators } from './shopping';
import { dateTimeCalculators } from './date-time';
import { travelCalculators } from './travel';
import { businessCalculators } from './business';

export const allCalculators: Calculator[] = [
  ...financeCalculators,
  ...healthCalculators,
  ...educationCalculators,
  ...mathCalculators,
  ...salaryCalculators,
  ...shoppingCalculators,
  ...dateTimeCalculators,
  ...travelCalculators,
  ...businessCalculators,
];

const bySlug = new Map<string, Calculator>(allCalculators.map((c) => [c.slug, c]));

export function getCalculator(slug: string): Calculator | undefined {
  return bySlug.get(slug);
}

export function calculatorsByCategory(category: CategoryId): Calculator[] {
  return allCalculators.filter((c) => c.category === category);
}

export function popularCalculators(limit = 8): Calculator[] {
  const pop = allCalculators.filter((c) => c.popular);
  return pop.slice(0, limit);
}

/** Lightweight index for the client-side search box. */
export interface SearchEntry {
  slug: string;
  title: string;
  category: CategoryId;
  path: string;
  keywords: string;
}

export function searchIndex(): SearchEntry[] {
  return allCalculators.map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    path: `/${c.category}/${c.slug}`,
    keywords: (c.keywords || []).join(' ') + ' ' + c.description,
  }));
}
