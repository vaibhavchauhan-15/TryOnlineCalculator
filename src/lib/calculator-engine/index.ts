// Pure-engine registry. As calculators are migrated to the CalculatorEngine
// contract (Task 3 pilots now, all of them in Task 9) they register here. The
// renderer + localization layers resolve an engine by slug through this map.

import type { CalculatorEngine, EngineResult } from './contract';

// Engines are heterogeneous in their input/result types, so the registry keys
// them by slug behind the base contract (every result is an EngineResult).
export type AnyEngine = CalculatorEngine<any, EngineResult>;

// The four pilots live in their own files (Task 3); the rest were extracted per
// category (Task 9). Category arrays intentionally EXCLUDE the pilots to avoid
// duplicate slugs.
import { bmiEngine } from './engines/bmi';
import { percentageEngine } from './engines/percentage';
import { mortgageEngine } from './engines/mortgage';
import { currencyConverterEngine } from './engines/currency-converter';
import { financeEngines } from './engines/finance';
import { healthEngines } from './engines/health';
import { educationEngines } from './engines/education';
import { mathEngines } from './engines/math';
import { salaryEngines } from './engines/salary';
import { shoppingEngines } from './engines/shopping';
import { dateTimeEngines } from './engines/date-time';
import { travelEngines } from './engines/travel';
import { businessEngines } from './engines/business';

export const engines: AnyEngine[] = [
  // Pilots (health/math/finance).
  bmiEngine as AnyEngine,
  percentageEngine as AnyEngine,
  mortgageEngine as AnyEngine,
  currencyConverterEngine as AnyEngine,
  // Extracted category engines.
  ...financeEngines,
  ...healthEngines,
  ...educationEngines,
  ...mathEngines,
  ...salaryEngines,
  ...shoppingEngines,
  ...dateTimeEngines,
  ...travelEngines,
  ...businessEngines,
];

const bySlug = new Map<string, AnyEngine>(engines.map((e) => [e.slug, e]));

export function getEngine(slug: string): AnyEngine | undefined {
  return bySlug.get(slug);
}

/** Slugs that have a pure engine today (used to route the pilot through it). */
export function hasEngine(slug: string): boolean {
  return bySlug.has(slug);
}

export * from './contract';
