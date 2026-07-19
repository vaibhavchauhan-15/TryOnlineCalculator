// Travel — pure engines (fuel-cost + mileage).
//
// Translated from the legacy inline calculators in src/lib/calculators/travel.ts
// to the CalculatorEngine contract. Every output stays presentation-neutral:
// raw numbers tagged with a `format` + a `hintKey` for the unit word (e.g.
// `hintKey: 'unit.mpg'`), never a localized string like "30 MPG". The unit word
// and currency symbol are attached later by the localization layer, so the same
// engine renders correctly in any locale / unit system.

import type { CalculatorEngine, EngineResult, ResultItem, EngineField } from '../contract';
import { ok, fail } from '../contract';
import { num } from '../units';
import type { AnyEngine } from '../index';

export type TravelUnit = 'us' | 'metric';
export type RoundTrip = 'yes' | 'no';

/** 235.214583 = litres-per-100km ⇄ US MPG conversion constant (exact, from legacy). */
const MPG_L100_CONST = 235.214583;

// ---------------------------------------------------------------------------
// Fuel Cost Calculator
// ---------------------------------------------------------------------------

export interface FuelCostInput {
  unit: TravelUnit;
  /** US measurements (used when unit === 'us'). */
  distance: number; // miles
  economy: number; // MPG
  priceUs: number; // $/gal
  /** Metric measurements (used when unit === 'metric'). */
  distanceKm: number; // km
  economyL: number; // L/100km
  priceL: number; // $/L
  roundtrip: RoundTrip;
}

export interface FuelCostResult extends EngineResult {}

export const fuelCostEngine: CalculatorEngine<FuelCostInput, FuelCostResult> = {
  slug: 'fuel-cost-calculator',
  category: 'travel',

  defaultInput: () => ({
    unit: 'us',
    distance: 300,
    economy: 30,
    priceUs: 3.5,
    distanceKm: 480,
    economyL: 8,
    priceL: 1.5,
    roundtrip: 'no',
  }),

  fields: (): EngineField[] => [
    {
      name: 'unit', labelKey: 'field.unit', type: 'radio', defaultValue: 'us', span: 2,
      options: [
        { value: 'us', labelKey: 'unitSystem.us' },
        { value: 'metric', labelKey: 'unitSystem.metric' },
      ],
    },
    // US measurements.
    { name: 'distance', labelKey: 'field.distance', type: 'number', defaultValue: '300', min: 0, step: 1, suffixKey: 'unit.mi', showWhen: { field: 'unit', equals: ['us'] } },
    { name: 'economy', labelKey: 'field.fuelEconomy', type: 'number', defaultValue: '30', min: 0.1, step: 0.1, suffixKey: 'unit.mpg', showWhen: { field: 'unit', equals: ['us'] } },
    { name: 'priceUs', labelKey: 'field.fuelPrice', type: 'number', defaultValue: '3.5', min: 0, step: 0.01, currency: true, suffixKey: 'unit.perGallon', showWhen: { field: 'unit', equals: ['us'] } },
    // Metric measurements.
    { name: 'distanceKm', labelKey: 'field.distance', type: 'number', defaultValue: '480', min: 0, step: 1, suffixKey: 'unit.km', showWhen: { field: 'unit', equals: ['metric'] } },
    { name: 'economyL', labelKey: 'field.consumption', type: 'number', defaultValue: '8', min: 0.1, step: 0.1, suffixKey: 'unit.litresPer100km', showWhen: { field: 'unit', equals: ['metric'] } },
    { name: 'priceL', labelKey: 'field.fuelPrice', type: 'number', defaultValue: '1.5', min: 0, step: 0.01, currency: true, suffixKey: 'unit.perLitre', showWhen: { field: 'unit', equals: ['metric'] } },
    {
      name: 'roundtrip', labelKey: 'field.roundTrip', type: 'radio', defaultValue: 'no',
      options: [
        { value: 'no', labelKey: 'travel.oneWay' },
        { value: 'yes', labelKey: 'travel.roundTrip' },
      ],
    },
  ],

  parseInput: (values): FuelCostInput => ({
    unit: values.unit === 'metric' ? 'metric' : 'us',
    distance: num(values.distance, 0),
    economy: num(values.economy, 0),
    priceUs: num(values.priceUs, 0),
    distanceKm: num(values.distanceKm, 0),
    economyL: num(values.economyL, 0),
    priceL: num(values.priceL, 0),
    roundtrip: values.roundtrip === 'yes' ? 'yes' : 'no',
  }),

  validate: (input) => {
    const rt = input.roundtrip === 'yes' ? 2 : 1;
    if (input.unit === 'metric') {
      const distance = input.distanceKm * rt;
      const cons = input.economyL;
      if (distance <= 0 || cons <= 0) return fail('travel.distanceConsumptionRequired');
    } else {
      const distance = input.distance * rt;
      const mpg = input.economy;
      if (distance <= 0 || mpg <= 0) return fail('travel.distanceEconomyRequired');
    }
    return ok();
  },

  compute: (input) => {
    const rt = input.roundtrip === 'yes' ? 2 : 1;
    let fuelUsed: number;
    let distance: number;
    let price: number;
    let fuelUnitKey: string;

    if (input.unit === 'metric') {
      distance = input.distanceKm * rt;
      const cons = input.economyL;
      price = input.priceL;
      fuelUsed = (distance / 100) * cons;
      fuelUnitKey = 'unit.litre';
    } else {
      distance = input.distance * rt;
      const mpg = input.economy;
      price = input.priceUs;
      fuelUsed = distance / mpg;
      fuelUnitKey = 'unit.gallon';
    }

    const cost = fuelUsed * price;

    const items: ResultItem[] = [
      {
        key: 'totalFuelCost', value: cost, format: 'currency', primary: true,
        hintKey: input.roundtrip === 'yes' ? 'travel.roundTrip' : 'travel.oneWay',
      },
      { key: 'fuelNeeded', value: fuelUsed, format: 'decimal', precision: 2, hintKey: fuelUnitKey },
      { key: 'costPerDistance', value: distance ? cost / distance : 0, format: 'currency', precision: 3 },
    ];

    return { items };
  },
};

// ---------------------------------------------------------------------------
// Mileage Calculator
// ---------------------------------------------------------------------------

export interface MileageInput {
  unit: TravelUnit;
  /** US measurements (used when unit === 'us'). */
  distance: number; // miles
  fuel: number; // gallons
  /** Metric measurements (used when unit === 'metric'). */
  distanceKm: number; // km
  fuelL: number; // litres
}

export interface MileageResult extends EngineResult {}

export const mileageEngine: CalculatorEngine<MileageInput, MileageResult> = {
  slug: 'mileage-calculator',
  category: 'travel',

  defaultInput: () => ({
    unit: 'us',
    distance: 300,
    fuel: 10,
    distanceKm: 480,
    fuelL: 38,
  }),

  fields: (): EngineField[] => [
    {
      name: 'unit', labelKey: 'field.unit', type: 'radio', defaultValue: 'us', span: 2,
      options: [
        { value: 'us', labelKey: 'unitSystem.us' },
        { value: 'metric', labelKey: 'unitSystem.metric' },
      ],
    },
    // US measurements.
    { name: 'distance', labelKey: 'field.distanceTravelled', type: 'number', defaultValue: '300', min: 0, step: 1, suffixKey: 'unit.mi', showWhen: { field: 'unit', equals: ['us'] } },
    { name: 'fuel', labelKey: 'field.fuelUsed', type: 'number', defaultValue: '10', min: 0.01, step: 0.1, suffixKey: 'unit.gallon', showWhen: { field: 'unit', equals: ['us'] } },
    // Metric measurements.
    { name: 'distanceKm', labelKey: 'field.distanceTravelled', type: 'number', defaultValue: '480', min: 0, step: 1, suffixKey: 'unit.km', showWhen: { field: 'unit', equals: ['metric'] } },
    { name: 'fuelL', labelKey: 'field.fuelUsed', type: 'number', defaultValue: '38', min: 0.01, step: 0.1, suffixKey: 'unit.litre', showWhen: { field: 'unit', equals: ['metric'] } },
  ],

  parseInput: (values): MileageInput => ({
    unit: values.unit === 'metric' ? 'metric' : 'us',
    distance: num(values.distance, 0),
    fuel: num(values.fuel, 0),
    distanceKm: num(values.distanceKm, 0),
    fuelL: num(values.fuelL, 0),
  }),

  validate: (input) => {
    if (input.unit === 'metric') {
      if (input.distanceKm <= 0 || input.fuelL <= 0) return fail('travel.distanceFuelRequired');
    } else {
      if (input.distance <= 0 || input.fuel <= 0) return fail('travel.distanceFuelRequired');
    }
    return ok();
  },

  compute: (input) => {
    if (input.unit === 'metric') {
      const d = input.distanceKm;
      const f = input.fuelL;
      const l100 = (f / d) * 100;
      const items: ResultItem[] = [
        { key: 'fuelEconomy', value: l100, format: 'decimal', precision: 2, primary: true, hintKey: 'unit.litresPer100km' },
        { key: 'equivalentMpg', value: MPG_L100_CONST / l100, format: 'decimal', precision: 1, hintKey: 'unit.mpg' },
        { key: 'kmPerLitre', value: d / f, format: 'decimal', precision: 2, hintKey: 'unit.kmPerLitre' },
      ];
      return { items };
    }

    const d = input.distance;
    const f = input.fuel;
    const mpg = d / f;
    const items: ResultItem[] = [
      { key: 'fuelEconomy', value: mpg, format: 'decimal', precision: 1, primary: true, hintKey: 'unit.mpg' },
      { key: 'equivalentL100', value: MPG_L100_CONST / mpg, format: 'decimal', precision: 2, hintKey: 'unit.litresPer100km' },
    ];
    return { items };
  },
};

// ---------------------------------------------------------------------------
// Registry export
// ---------------------------------------------------------------------------

export const travelEngines: AnyEngine[] = [
  fuelCostEngine as AnyEngine,
  mileageEngine as AnyEngine,
];
