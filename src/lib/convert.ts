// Unit-conversion engine for the Unit Converter tool.
//
// Design goals mirror the rest of the site's lib layer:
//   * Fast   — plain data + pure functions, no dependencies, tree-shakeable.
//   * Safe   — conversion never throws; invalid input returns NaN.
//   * Exact  — factors use the internationally defined exact values so a
//              round-trip (A → B → A) is lossless to display precision.
//
// Every linear category converts through a single base unit: a value is first
// scaled to the base, then to the target. Temperature is non-linear (it has an
// offset) so its units carry explicit to/from functions. Currency is handled
// separately because its rates are data, not physical constants.

export type ConvCategoryId =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'speed'
  | 'volume'
  | 'area'
  | 'currency';

export interface Unit {
  id: string;
  name: string; // "Meter"
  plural: string; // "Meters" — used in the read-out sentence
  symbol: string; // "m"
  /** Convert a value in this unit to the category's base unit. */
  toBase: (v: number) => number;
  /** Convert a value in the category's base unit to this unit. */
  fromBase: (v: number) => number;
}

export interface ConvCategory {
  id: ConvCategoryId;
  name: string; // "Length"
  /** Inline 24x24 lucide-style stroke path(s) for the tab icon. */
  icon: string;
  units: Unit[];
  defaultFrom: string;
  defaultTo: string;
  /** Seed value shown when the tab is first opened. */
  sample: number;
}

/** Build a linear unit (value × factor = base) with trimmed labels. */
function linear(
  id: string,
  name: string,
  plural: string,
  symbol: string,
  factor: number,
): Unit {
  return {
    id,
    name,
    plural,
    symbol,
    toBase: (v) => v * factor,
    fromBase: (v) => v / factor,
  };
}

// ---- Length (base: metre) -------------------------------------------------
const length: Unit[] = [
  linear('nm', 'Nanometer', 'Nanometers', 'nm', 1e-9),
  linear('um', 'Micrometer', 'Micrometers', 'µm', 1e-6),
  linear('mm', 'Millimeter', 'Millimeters', 'mm', 0.001),
  linear('cm', 'Centimeter', 'Centimeters', 'cm', 0.01),
  linear('m', 'Meter', 'Meters', 'm', 1),
  linear('km', 'Kilometer', 'Kilometers', 'km', 1000),
  linear('in', 'Inch', 'Inches', 'in', 0.0254),
  linear('ft', 'Foot', 'Feet', 'ft', 0.3048),
  linear('yd', 'Yard', 'Yards', 'yd', 0.9144),
  linear('mi', 'Mile', 'Miles', 'mi', 1609.344),
  linear('nmi', 'Nautical mile', 'Nautical miles', 'nmi', 1852),
];

// ---- Weight / mass (base: kilogram) ---------------------------------------
const weight: Unit[] = [
  linear('mg', 'Milligram', 'Milligrams', 'mg', 1e-6),
  linear('g', 'Gram', 'Grams', 'g', 0.001),
  linear('kg', 'Kilogram', 'Kilograms', 'kg', 1),
  linear('t', 'Metric ton', 'Metric tons', 't', 1000),
  linear('oz', 'Ounce', 'Ounces', 'oz', 0.028349523125),
  linear('lb', 'Pound', 'Pounds', 'lb', 0.45359237),
  linear('st', 'Stone', 'Stone', 'st', 6.35029318),
  linear('ton_us', 'US ton (short)', 'US tons', 'ton', 907.18474),
  linear('ton_uk', 'UK ton (long)', 'UK tons', 'ton', 1016.0469088),
];

// ---- Temperature (base: Celsius) — non-linear -----------------------------
const temperature: Unit[] = [
  {
    id: 'c',
    name: 'Celsius',
    plural: 'Celsius',
    symbol: '°C',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  {
    id: 'f',
    name: 'Fahrenheit',
    plural: 'Fahrenheit',
    symbol: '°F',
    toBase: (v) => ((v - 32) * 5) / 9,
    fromBase: (v) => (v * 9) / 5 + 32,
  },
  {
    id: 'k',
    name: 'Kelvin',
    plural: 'Kelvin',
    symbol: 'K',
    toBase: (v) => v - 273.15,
    fromBase: (v) => v + 273.15,
  },
];

// ---- Speed (base: metre / second) -----------------------------------------
const speed: Unit[] = [
  linear('mps', 'Meter / second', 'Meters / second', 'm/s', 1),
  linear('kmh', 'Kilometer / hour', 'Kilometers / hour', 'km/h', 1 / 3.6),
  linear('mph', 'Mile / hour', 'Miles / hour', 'mph', 0.44704),
  linear('fps', 'Foot / second', 'Feet / second', 'ft/s', 0.3048),
  linear('kn', 'Knot', 'Knots', 'kn', 0.514444444),
];

// ---- Volume (base: litre) -------------------------------------------------
const volume: Unit[] = [
  linear('ml', 'Milliliter', 'Milliliters', 'ml', 0.001),
  linear('l', 'Liter', 'Liters', 'L', 1),
  linear('m3', 'Cubic meter', 'Cubic meters', 'm³', 1000),
  linear('tsp', 'Teaspoon (US)', 'Teaspoons', 'tsp', 0.00492892159),
  linear('tbsp', 'Tablespoon (US)', 'Tablespoons', 'tbsp', 0.0147867648),
  linear('floz', 'Fluid ounce (US)', 'Fluid ounces', 'fl oz', 0.0295735296),
  linear('cup', 'Cup (US)', 'Cups', 'cup', 0.2365882365),
  linear('pt', 'Pint (US)', 'Pints', 'pt', 0.473176473),
  linear('qt', 'Quart (US)', 'Quarts', 'qt', 0.946352946),
  linear('gal', 'Gallon (US)', 'Gallons', 'gal', 3.785411784),
  linear('gal_uk', 'Gallon (UK)', 'Gallons', 'gal', 4.54609),
];

// ---- Area (base: square metre) --------------------------------------------
const area: Unit[] = [
  linear('mm2', 'Square millimeter', 'Square millimeters', 'mm²', 1e-6),
  linear('cm2', 'Square centimeter', 'Square centimeters', 'cm²', 1e-4),
  linear('m2', 'Square meter', 'Square meters', 'm²', 1),
  linear('ha', 'Hectare', 'Hectares', 'ha', 10000),
  linear('km2', 'Square kilometer', 'Square kilometers', 'km²', 1e6),
  linear('in2', 'Square inch', 'Square inches', 'in²', 0.00064516),
  linear('ft2', 'Square foot', 'Square feet', 'ft²', 0.09290304),
  linear('yd2', 'Square yard', 'Square yards', 'yd²', 0.83612736),
  linear('ac', 'Acre', 'Acres', 'ac', 4046.8564224),
  linear('mi2', 'Square mile', 'Square miles', 'mi²', 2589988.110336),
];

// ---- Currency (base: USD) -------------------------------------------------
// Rates are units of the currency per 1 USD. These are indicative fallback
// values; the live UI refreshes them from a public rates API when available.
export interface Currency {
  code: string; // "EUR"
  name: string; // "Euro"
  symbol: string; // "€"
}

export const currencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
];

/** Indicative fallback rates: currency units per 1 USD. */
export const fallbackRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.3,
  JPY: 157,
  CNY: 7.24,
  AUD: 1.52,
  CAD: 1.37,
  CHF: 0.9,
  AED: 3.67,
  SGD: 1.35,
  HKD: 7.81,
  BRL: 5.43,
  ZAR: 18.6,
  RUB: 92,
  MXN: 18.3,
  KRW: 1360,
  NZD: 1.66,
};

/** Convert `value` between currencies using a rates-per-USD table. */
export function convertCurrency(
  value: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  const rf = rates[from];
  const rt = rates[to];
  if (!Number.isFinite(value) || !rf || !rt) return NaN;
  const usd = value / rf;
  return usd * rt;
}

// ---- Category registry ----------------------------------------------------
export const convCategories: ConvCategory[] = [
  {
    id: 'length',
    name: 'Length',
    icon: 'M2 12h20 M6 9v6 M10 7v10 M14 9v6 M18 7v10',
    units: length,
    defaultFrom: 'm',
    defaultTo: 'ft',
    sample: 1,
  },
  {
    id: 'weight',
    name: 'Weight',
    icon: 'M12 3a2 2 0 0 0-2 2H5l-2 14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2L19 5h-5a2 2 0 0 0-2-2Z M9 5h6',
    units: weight,
    defaultFrom: 'kg',
    defaultTo: 'lb',
    sample: 1,
  },
  {
    id: 'temperature',
    name: 'Temperature',
    icon: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z',
    units: temperature,
    defaultFrom: 'c',
    defaultTo: 'f',
    sample: 25,
  },
  {
    id: 'speed',
    name: 'Speed',
    icon: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M13.4 10.6 19 5 M4 20a8 8 0 1 1 16 0Z',
    units: speed,
    defaultFrom: 'kmh',
    defaultTo: 'mph',
    sample: 100,
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: 'M5 3h14l-1 4H6L5 3Z M6 7l1.5 12a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2L18 7',
    units: volume,
    defaultFrom: 'l',
    defaultTo: 'gal',
    sample: 1,
  },
  {
    id: 'area',
    name: 'Area',
    icon: 'M3 3h18v18H3Z M3 9h18 M9 3v18',
    units: area,
    defaultFrom: 'm2',
    defaultTo: 'ft2',
    sample: 1,
  },
  {
    id: 'currency',
    name: 'Currency',
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M9.5 9a2.5 2.5 0 0 1 2.5-2c1.4 0 2.5.9 2.5 2 M14.5 15a2.5 2.5 0 0 1-2.5 2c-1.4 0-2.5-.9-2.5-2 M12 6v12',
    units: [], // currency uses the rates table, not the Unit list
    defaultFrom: 'USD',
    defaultTo: 'EUR',
    sample: 1,
  },
];

const categoryMap = new Map<ConvCategoryId, ConvCategory>(
  convCategories.map((c) => [c.id, c]),
);

export function getConvCategory(id: ConvCategoryId): ConvCategory | undefined {
  return categoryMap.get(id);
}

/**
 * Convert `value` from one unit to another within a linear / temperature
 * category. Returns NaN when the value or a unit is invalid.
 */
export function convertUnit(value: number, from: Unit, to: Unit): number {
  if (!Number.isFinite(value)) return NaN;
  return to.fromBase(from.toBase(value));
}

/**
 * Format a numeric result for display: locale grouping for large numbers,
 * enough significant digits for small ones, and trimmed trailing zeros.
 */
export function formatValue(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  // Extremely large or small magnitudes read better in scientific notation.
  if (abs >= 1e15 || abs < 1e-9) {
    return n.toExponential(4).replace(/\.?0+e/, 'e');
  }
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 8 }).format(n);
}
