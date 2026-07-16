import type { Calculator } from '../types';
import { num, currency, fixed } from '../format';

export const travelCalculators: Calculator[] = [
  /* -------------------------------------------------------------- Fuel Cost */
  {
    slug: 'fuel-cost-calculator',
    category: 'travel',
    title: 'Fuel Cost Calculator',
    description: 'Estimate the fuel cost of a trip from distance, fuel economy and fuel price.',
    intro: 'Enter your trip distance, your vehicle fuel economy and the price of fuel to estimate the cost.',
    keywords: ['fuel cost calculator', 'gas cost', 'trip fuel'],
    popular: true,
    inputs: [
      {
        name: 'unit', label: 'Units', type: 'radio', default: 'us', span: 2,
        options: [
          { label: 'US (miles, MPG, $/gal)', value: 'us' },
          { label: 'Metric (km, L/100km, $/L)', value: 'metric' },
        ],
      },
      { name: 'distance', label: 'Trip distance', type: 'number', default: 300, min: 0, step: 1, suffix: 'mi', showWhen: { field: 'unit', equals: ['us'] } },
      { name: 'economy', label: 'Fuel economy', type: 'number', default: 30, min: 0.1, step: 0.1, suffix: 'MPG', showWhen: { field: 'unit', equals: ['us'] } },
      { name: 'priceUs', label: 'Fuel price', type: 'number', prefix: '$', default: 3.5, min: 0, step: 0.01, suffix: '/gal', showWhen: { field: 'unit', equals: ['us'] } },
      { name: 'distanceKm', label: 'Trip distance', type: 'number', default: 480, min: 0, step: 1, suffix: 'km', showWhen: { field: 'unit', equals: ['metric'] } },
      { name: 'economyL', label: 'Consumption', type: 'number', default: 8, min: 0.1, step: 0.1, suffix: 'L/100km', showWhen: { field: 'unit', equals: ['metric'] } },
      { name: 'priceL', label: 'Fuel price', type: 'number', prefix: '$', default: 1.5, min: 0, step: 0.01, suffix: '/L', showWhen: { field: 'unit', equals: ['metric'] } },
      { name: 'roundtrip', label: 'Round trip?', type: 'radio', default: 'no', options: [{ label: 'One way', value: 'no' }, { label: 'Round trip', value: 'yes' }] },
    ],
    compute: (v) => {
      const rt = v.roundtrip === 'yes' ? 2 : 1;
      let fuelUsed: number;
      let distance: number;
      let price: number;
      let unitLabel: string;
      if (v.unit === 'metric') {
        distance = num(v.distanceKm, 0) * rt;
        const cons = num(v.economyL, 0);
        price = num(v.priceL, 0);
        if (distance <= 0 || cons <= 0) return { results: [], error: 'Enter a valid distance and consumption.' };
        fuelUsed = (distance / 100) * cons;
        unitLabel = 'L';
      } else {
        distance = num(v.distance, 0) * rt;
        const mpg = num(v.economy, 0);
        price = num(v.priceUs, 0);
        if (distance <= 0 || mpg <= 0) return { results: [], error: 'Enter a valid distance and fuel economy.' };
        fuelUsed = distance / mpg;
        unitLabel = 'gal';
      }
      const cost = fuelUsed * price;
      return {
        results: [
          { label: 'Total fuel cost', value: currency(cost), primary: true, hint: v.roundtrip === 'yes' ? 'Round trip' : 'One way' },
          { label: 'Fuel needed', value: `${fixed(fuelUsed, 2)} ${unitLabel}` },
          { label: 'Cost per unit distance', value: currency(distance ? cost / distance : 0, { decimals: 3 }) },
        ],
      };
    },
    formulaItems: [
      { name: 'US', expr: 'cost = (distance ÷ MPG) × price per gallon' },
      { name: 'Metric', expr: 'cost = (distance ÷ 100 × L/100km) × price per litre' },
    ],
    faq: [
      { q: 'How do I convert MPG to L/100km?', a: 'Divide 235.21 by the MPG value. For example 30 MPG is about 7.84 L/100km.' },
    ],
    related: ['mileage-calculator', 'auto-loan-calculator'],
  },

  /* ---------------------------------------------------------------- Mileage */
  {
    slug: 'mileage-calculator',
    category: 'travel',
    title: 'Mileage Calculator',
    description: 'Calculate your vehicle fuel economy in MPG or L/100km from distance and fuel used.',
    intro: 'Enter the distance travelled and the amount of fuel used to work out your real fuel economy.',
    keywords: ['mileage calculator', 'mpg calculator', 'fuel economy'],
    inputs: [
      {
        name: 'unit', label: 'Units', type: 'radio', default: 'us', span: 2,
        options: [
          { label: 'US (miles, gallons)', value: 'us' },
          { label: 'Metric (km, litres)', value: 'metric' },
        ],
      },
      { name: 'distance', label: 'Distance travelled', type: 'number', default: 300, min: 0, step: 1, suffix: 'mi', showWhen: { field: 'unit', equals: ['us'] } },
      { name: 'fuel', label: 'Fuel used', type: 'number', default: 10, min: 0.01, step: 0.1, suffix: 'gal', showWhen: { field: 'unit', equals: ['us'] } },
      { name: 'distanceKm', label: 'Distance travelled', type: 'number', default: 480, min: 0, step: 1, suffix: 'km', showWhen: { field: 'unit', equals: ['metric'] } },
      { name: 'fuelL', label: 'Fuel used', type: 'number', default: 38, min: 0.01, step: 0.1, suffix: 'L', showWhen: { field: 'unit', equals: ['metric'] } },
    ],
    compute: (v) => {
      if (v.unit === 'metric') {
        const d = num(v.distanceKm, 0);
        const f = num(v.fuelL, 0);
        if (d <= 0 || f <= 0) return { results: [], error: 'Enter a valid distance and fuel amount.' };
        const l100 = (f / d) * 100;
        return {
          results: [
            { label: 'Fuel economy', value: `${fixed(l100, 2)} L/100km`, primary: true },
            { label: 'Equivalent MPG', value: `${fixed(235.214583 / l100, 1)} MPG` },
            { label: 'km per litre', value: `${fixed(d / f, 2)} km/L` },
          ],
        };
      }
      const d = num(v.distance, 0);
      const f = num(v.fuel, 0);
      if (d <= 0 || f <= 0) return { results: [], error: 'Enter a valid distance and fuel amount.' };
      const mpg = d / f;
      return {
        results: [
          { label: 'Fuel economy', value: `${fixed(mpg, 1)} MPG`, primary: true },
          { label: 'Equivalent L/100km', value: `${fixed(235.214583 / mpg, 2)} L/100km` },
        ],
      };
    },
    faq: [
      { q: 'How do I measure MPG accurately?', a: 'Fill your tank, reset the trip meter, drive normally, then refill and note the gallons added. Divide the miles driven by the gallons it took to refill.' },
    ],
    related: ['fuel-cost-calculator', 'auto-loan-calculator'],
  },
];
