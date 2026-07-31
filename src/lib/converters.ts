// Unit-converter engine + content.
//
// One entry per converter type (length, weight, temperature, speed, volume,
// area, currency). Each entry is fully self-contained: it carries its own
// units, exact conversion factors, page copy, how-to steps, a conversion-factor
// table, a supported-units list and five targeted FAQs so every page ships
// genuinely unique, non-thin content.
//
// Conversion model
// ----------------
//   * Linear converters store `factor` = the value of ONE unit expressed in the
//     converter's base unit (metre, kilogram, litre, m/s, m², USD). Converting
//     is then: base = value * fromFactor; result = base / toFactor.
//   * Temperature is non-linear (it has offsets), so it is flagged
//     `kind: 'temperature'` and handled with explicit formulas in the client.
//
// The config is plain JSON-serialisable data (no functions) so the interactive
// component can embed it in a <script type="application/json"> tag and run the
// exact same numbers in the browser.

import type { FaqItem } from './types';
import { faqPageSchema, breadcrumbSchema } from './seo';
import { CURRENCIES } from './currency';

const SITE = 'https://tryonlinecalculator.com';

// Approximate reference exchange rates: value of ONE unit of each currency in
// US dollars (the currency converter's base unit). These are static estimates
// for quick conversions and demonstrations — not live market rates (see the
// on-page disclaimer). Currency metadata (name, symbol) is single-sourced from
// the shared catalog in ./currency; here we only attach a rate per code.
const CURRENCY_RATES: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, INR: 0.012, JPY: 0.0067, CNY: 0.14,
  AUD: 0.66, CAD: 0.73, CHF: 1.12, NZD: 0.61, SGD: 0.74, HKD: 0.128,
  KRW: 0.00075, TWD: 0.031, THB: 0.028, MYR: 0.22, IDR: 0.000063,
  PHP: 0.0175, VND: 0.00004, AED: 0.272, SAR: 0.266, QAR: 0.275,
  KWD: 3.25, BHD: 2.65, OMR: 2.6, TRY: 0.03, RUB: 0.011, ZAR: 0.054,
  EGP: 0.021, NGN: 0.00065, PKR: 0.0036, BDT: 0.0091, LKR: 0.0033,
  NPR: 0.0075, BRL: 0.185, MXN: 0.058, ARS: 0.0011, CLP: 0.00105,
  COP: 0.00025, PEN: 0.27, SEK: 0.096, NOK: 0.094, DKK: 0.145,
  PLN: 0.25, CZK: 0.043, HUF: 0.0028, RON: 0.22, UAH: 0.024, ILS: 0.27,
};

// Currency converter units, generated from the shared catalog so the picker and
// the converter always agree. The unit id is the ISO code (matches the picker's
// value) and the "symbol" shown in the grid/equation is the code itself.
const currencyUnits: ConverterUnit[] = CURRENCIES.filter(
  (c) => CURRENCY_RATES[c.code] !== undefined,
).map((c) => ({ id: c.code, name: c.name, symbol: c.code, factor: CURRENCY_RATES[c.code] }));

export type ConverterKind = 'linear' | 'temperature';

export interface ConverterUnit {
  id: string;
  name: string;
  symbol: string;
  /** Value of one unit in the base unit. Omitted for temperature. */
  factor?: number;
}

export interface FactorRow {
  label: string;
  value: string;
}

export interface ConverterConfig {
  slug: string;
  kind: ConverterKind;
  /** Emoji-free short label for the type, e.g. "Length". */
  name: string;
  /** H1 / page title, e.g. "Length Converter". */
  title: string;
  /** Human name of the base unit (for notes). */
  baseUnit: string;
  /** <title> tag. */
  metaTitle: string;
  /** Meta description (150-160 chars). */
  metaDescription: string;
  /** Hero sub-heading (1-2 sentences). */
  description: string;
  /** Longer intro paragraph above the tool. */
  intro: string;
  /** "About" section paragraphs. */
  about: string[];
  keywords: string[];
  units: ConverterUnit[];
  defaultFrom: string;
  defaultTo: string;
  defaultValue: string;
  /** Decimal places hint for the primary read-out. */
  precision: number;
  howto: string[];
  /** Exact conversion-factor rows shown in a table. */
  factorRows: FactorRow[];
  /** Optional disclaimer / note rendered under the tool (e.g. currency). */
  note?: string;
  faqs: FaqItem[];
}

/* ============================================================
   LENGTH
   ============================================================ */
const length: ConverterConfig = {
  slug: 'length',
  kind: 'linear',
  name: 'Length',
  title: 'Length Converter',
  baseUnit: 'metre',
  metaTitle: 'Length Converter — cm to inches, meters to feet, km to miles',
  metaDescription:
    'Free length converter for cm to inches, meters to feet, km to miles and more. Instant, accurate distance conversions between metric and imperial units.',
  description: 'Convert cm to inches, meters to feet, kilometers to miles and every other length unit instantly.',
  intro:
    'This length converter turns any distance measurement into another unit the moment you type. It is built for the everyday searches people actually make — cm to inches for a screen size, meters to feet for a room, or kilometers to miles for a run — and covers metric, imperial and nautical units in one place.',
  about: [
    'Length (or distance) measures how far apart two points are. The world uses two main systems: the metric system, built on the metre and its decimal multiples (millimetre, centimetre, kilometre), and the imperial/US customary system, built on the inch, foot, yard and mile. Because most countries use metric while the United States still relies on feet and inches, converting between the two is one of the most common measurement tasks online.',
    'Every conversion here is anchored to the metre, the SI base unit of length. One inch is defined as exactly 0.0254 metres, one foot as 0.3048 metres and one mile as 1,609.344 metres, so the results you see are exact by definition rather than rounded approximations. Enter a value once and this tool shows it in all supported units at the same time, which is handy when you are comparing specifications or filling in a form that expects a different unit.',
  ],
  keywords: [
    'length converter',
    'cm to inches',
    'inches to cm',
    'meters to feet',
    'feet to meters',
    'km to miles',
    'miles to km',
    'mm to inches',
    'yards to meters',
    'distance converter',
  ],
  units: [
    { id: 'km', name: 'Kilometre', symbol: 'km', factor: 1000 },
    { id: 'm', name: 'Metre', symbol: 'm', factor: 1 },
    { id: 'cm', name: 'Centimetre', symbol: 'cm', factor: 0.01 },
    { id: 'mm', name: 'Millimetre', symbol: 'mm', factor: 0.001 },
    { id: 'um', name: 'Micrometre', symbol: 'µm', factor: 1e-6 },
    { id: 'mi', name: 'Mile', symbol: 'mi', factor: 1609.344 },
    { id: 'yd', name: 'Yard', symbol: 'yd', factor: 0.9144 },
    { id: 'ft', name: 'Foot', symbol: 'ft', factor: 0.3048 },
    { id: 'in', name: 'Inch', symbol: 'in', factor: 0.0254 },
    { id: 'nmi', name: 'Nautical mile', symbol: 'nmi', factor: 1852 },
  ],
  defaultFrom: 'cm',
  defaultTo: 'in',
  defaultValue: '30',
  precision: 6,
  howto: [
    'Type the distance you want to convert into the value box.',
    'Pick the unit you are converting from (for example, centimetres).',
    'Pick the unit you want the answer in (for example, inches).',
    'Read the converted result instantly — no button to press.',
    'Use the swap arrows to reverse the direction, or scan the "all units" grid to see every unit at once.',
  ],
  factorRows: [
    { label: '1 inch', value: '2.54 cm = 25.4 mm' },
    { label: '1 foot', value: '30.48 cm = 0.3048 m' },
    { label: '1 yard', value: '0.9144 m = 3 feet' },
    { label: '1 mile', value: '1.609344 km = 1,760 yards' },
    { label: '1 centimetre', value: '0.393701 inches' },
    { label: '1 metre', value: '3.28084 feet = 39.3701 inches' },
    { label: '1 kilometre', value: '0.621371 miles' },
    { label: '1 nautical mile', value: '1.852 km = 1.15078 miles' },
  ],
  faqs: [
    { q: 'How do I convert cm to inches?', a: 'Divide the number of centimetres by 2.54, because one inch equals exactly 2.54 cm. For example, 30 cm ÷ 2.54 = 11.81 inches. The converter does this automatically as you type.' },
    { q: 'How many feet are in a meter?', a: 'One metre equals about 3.28084 feet. To convert metres to feet, multiply by 3.28084; to go from feet to metres, multiply by 0.3048.' },
    { q: 'How do I convert km to miles?', a: 'Multiply kilometres by 0.621371 to get miles. So 5 km ≈ 3.11 miles. To reverse it, multiply miles by 1.609344.' },
    { q: 'Is the inch exactly 2.54 cm?', a: 'Yes. Since 1959 the international inch has been defined as exactly 0.0254 metres (2.54 cm), so conversions between inches and centimetres are exact rather than approximate.' },
    { q: 'What is a nautical mile and how is it different?', a: 'A nautical mile is used in aviation and marine navigation and equals exactly 1,852 metres — about 1.151 statute (land) miles. It was originally based on one minute of latitude.' },
  ],
};

/* ============================================================
   WEIGHT / MASS
   ============================================================ */
const weight: ConverterConfig = {
  slug: 'weight',
  kind: 'linear',
  name: 'Weight',
  title: 'Weight Converter',
  baseUnit: 'kilogram',
  metaTitle: 'Weight Converter — kg to lbs, grams to ounces, stone to kg',
  metaDescription:
    'Free weight converter for kg to lbs, pounds to kg, grams to ounces and stone to kg. Instant, exact mass conversions between metric and imperial units.',
  description: 'Convert kg to lbs, grams to ounces, stone to kilograms and every other weight unit instantly.',
  intro:
    'This weight converter switches any mass value between metric and imperial units as soon as you type. It handles the conversions people search for most — kg to lbs at the gym, grams to ounces in the kitchen, and stone to kilograms for body weight — with exact, internationally defined factors.',
  about: [
    'Weight in everyday use means mass — the amount of matter in an object. The metric system measures mass in grams and kilograms, while the imperial and US customary systems use ounces, pounds and stones. Kitchen scales, shipping labels, fitness apps and medical charts frequently mix these units, which is why converting between them quickly matters.',
    'All values here are anchored to the kilogram, the SI base unit of mass. One pound is defined as exactly 0.45359237 kilograms and one ounce as one-sixteenth of a pound, so the numbers are exact by definition. The stone, still common in the UK and Ireland for body weight, equals 14 pounds or about 6.35 kilograms. Enter a figure once and see it in every unit at the same time.',
  ],
  keywords: [
    'weight converter',
    'kg to lbs',
    'lbs to kg',
    'grams to ounces',
    'ounces to grams',
    'stone to kg',
    'kg to stone',
    'pounds to kg',
    'mass converter',
    'grams to pounds',
  ],
  units: [
    { id: 't', name: 'Metric tonne', symbol: 't', factor: 1000 },
    { id: 'kg', name: 'Kilogram', symbol: 'kg', factor: 1 },
    { id: 'g', name: 'Gram', symbol: 'g', factor: 0.001 },
    { id: 'mg', name: 'Milligram', symbol: 'mg', factor: 1e-6 },
    { id: 'lb', name: 'Pound', symbol: 'lb', factor: 0.45359237 },
    { id: 'oz', name: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
    { id: 'st', name: 'Stone', symbol: 'st', factor: 6.35029318 },
    { id: 'ton-us', name: 'US ton (short)', symbol: 'ton', factor: 907.18474 },
    { id: 'ton-uk', name: 'UK ton (long)', symbol: 'long ton', factor: 1016.0469088 },
  ],
  defaultFrom: 'kg',
  defaultTo: 'lb',
  defaultValue: '70',
  precision: 6,
  howto: [
    'Enter the weight you want to convert in the value box.',
    'Choose the unit you are starting from (for example, kilograms).',
    'Choose the unit you want the result in (for example, pounds).',
    'The converted weight appears immediately as you type.',
    'Tap the swap arrows to flip the direction, or use the "all units" grid to compare every unit at once.',
  ],
  factorRows: [
    { label: '1 kilogram', value: '2.204623 lb = 1,000 g' },
    { label: '1 pound', value: '0.453592 kg = 16 ounces' },
    { label: '1 ounce', value: '28.349523 g' },
    { label: '1 stone', value: '6.350293 kg = 14 pounds' },
    { label: '1 gram', value: '0.035274 ounces' },
    { label: '1 metric tonne', value: '1,000 kg = 2,204.62 lb' },
    { label: '1 US ton (short)', value: '907.18474 kg = 2,000 lb' },
    { label: '1 UK ton (long)', value: '1,016.05 kg = 2,240 lb' },
  ],
  faqs: [
    { q: 'How do I convert kg to lbs?', a: 'Multiply kilograms by 2.204623 to get pounds. For example, 70 kg × 2.204623 ≈ 154.32 lb. To convert pounds back to kilograms, multiply by 0.453592.' },
    { q: 'How many grams are in an ounce?', a: 'One ounce equals about 28.3495 grams. To convert ounces to grams multiply by 28.3495; to convert grams to ounces multiply by 0.035274.' },
    { q: 'How do I convert stone to kg?', a: 'Multiply stone by 6.350293 to get kilograms, since one stone is 14 pounds. So 11 stone ≈ 69.85 kg. The converter also splits or combines stones and pounds via the pound unit.' },
    { q: 'Is weight the same as mass?', a: 'In physics, mass measures matter and weight measures the force of gravity on that mass. In everyday use — scales, recipes, body weight — the two words are used interchangeably, and that is what this converter handles.' },
    { q: 'Why are there two kinds of ton?', a: 'The US short ton is 2,000 pounds (about 907 kg), the UK long ton is 2,240 pounds (about 1,016 kg), and the metric tonne is exactly 1,000 kg. This tool includes all three so you can pick the right one.' },
  ],
};

/* ============================================================
   TEMPERATURE
   ============================================================ */
const temperature: ConverterConfig = {
  slug: 'temperature',
  kind: 'temperature',
  name: 'Temperature',
  title: 'Temperature Converter',
  baseUnit: 'Celsius',
  metaTitle: 'Temperature Converter — Celsius to Fahrenheit, C to F, K',
  metaDescription:
    'Free temperature converter for Celsius to Fahrenheit, Fahrenheit to Celsius and Kelvin. Instant, accurate C to F conversions with the exact formula.',
  description: 'Convert Celsius to Fahrenheit, Fahrenheit to Celsius, and Kelvin instantly with the exact formula.',
  intro:
    'This temperature converter switches between Celsius, Fahrenheit, Kelvin and Rankine the moment you type. It is built for the everyday need to translate a weather forecast, an oven setting or a science value — most often Celsius to Fahrenheit and back — using the precise conversion formulas rather than rough rules of thumb.',
  about: [
    'Temperature scales differ in two ways: where they put zero, and how big each degree is. Celsius sets 0° at the freezing point of water and 100° at its boiling point. Fahrenheit puts freezing at 32° and boiling at 212°, so a Fahrenheit degree is smaller and the scales are offset. Kelvin uses the same degree size as Celsius but starts at absolute zero (−273.15 °C), which makes it the SI base unit for temperature used in science.',
    'Because the scales have both an offset and a different step size, temperature cannot be converted with a single multiplier the way length or weight can. Converting Celsius to Fahrenheit uses °F = °C × 9/5 + 32; the reverse is °C = (°F − 32) × 5/9. This tool applies those exact formulas, so a forecast of 25 °C correctly becomes 77 °F, and body temperature of 98.6 °F becomes 37 °C.',
  ],
  keywords: [
    'temperature converter',
    'celsius to fahrenheit',
    'fahrenheit to celsius',
    'c to f',
    'f to c',
    'celsius to kelvin',
    'kelvin to celsius',
    'temperature conversion',
    'convert temperature',
    'degrees converter',
  ],
  units: [
    { id: 'c', name: 'Celsius', symbol: '°C' },
    { id: 'f', name: 'Fahrenheit', symbol: '°F' },
    { id: 'k', name: 'Kelvin', symbol: 'K' },
    { id: 'r', name: 'Rankine', symbol: '°R' },
  ],
  defaultFrom: 'c',
  defaultTo: 'f',
  defaultValue: '25',
  precision: 2,
  howto: [
    'Type the temperature you want to convert into the value box.',
    'Select the scale you are converting from (for example, Celsius).',
    'Select the scale you want the answer in (for example, Fahrenheit).',
    'The converted temperature appears instantly using the exact formula.',
    'Use the swap arrows to reverse the scales, or read the grid to see Celsius, Fahrenheit, Kelvin and Rankine together.',
  ],
  factorRows: [
    { label: 'Celsius → Fahrenheit', value: '°F = °C × 9/5 + 32' },
    { label: 'Fahrenheit → Celsius', value: '°C = (°F − 32) × 5/9' },
    { label: 'Celsius → Kelvin', value: 'K = °C + 273.15' },
    { label: 'Kelvin → Celsius', value: '°C = K − 273.15' },
    { label: 'Fahrenheit → Rankine', value: '°R = °F + 459.67' },
    { label: 'Celsius → Rankine', value: '°R = (°C + 273.15) × 9/5' },
    { label: 'Water freezes', value: '0 °C = 32 °F = 273.15 K = 491.67 °R' },
    { label: 'Water boils', value: '100 °C = 212 °F = 373.15 K' },
    { label: 'Body temperature', value: '37 °C = 98.6 °F' },
    { label: 'Absolute zero', value: '−273.15 °C = −459.67 °F = 0 K = 0 °R' },
  ],
  faqs: [
    { q: 'How do I convert Celsius to Fahrenheit?', a: 'Multiply the Celsius value by 9/5 (1.8) and add 32. For example, 25 °C × 1.8 + 32 = 77 °F. The converter applies this formula automatically.' },
    { q: 'How do I convert Fahrenheit to Celsius?', a: 'Subtract 32 from the Fahrenheit value, then multiply by 5/9. For example, (98.6 − 32) × 5/9 = 37 °C, which is normal body temperature.' },
    { q: 'What is the quick way to estimate C to F?', a: 'A rough shortcut is to double the Celsius value and add 30 (25 °C → about 80 °F). It is close for everyday temperatures but not exact — use the ×9/5 + 32 formula for accuracy.' },
    { q: 'What is Kelvin used for?', a: 'Kelvin is the SI base unit of temperature used in science. It starts at absolute zero, so there are no negative values. To convert, add 273.15 to a Celsius reading to get Kelvin.' },
    { q: 'At what temperature are Celsius and Fahrenheit equal?', a: 'At −40 degrees. −40 °C equals −40 °F, the single point where the two scales meet, which you can confirm with the converter.' },
  ],
};

/* ============================================================
   SPEED
   ============================================================ */
const speed: ConverterConfig = {
  slug: 'speed',
  kind: 'linear',
  name: 'Speed',
  title: 'Speed Converter',
  baseUnit: 'metre per second',
  metaTitle: 'Speed Converter — mph to km/h, km/h to mph, knots, m/s',
  metaDescription:
    'Free speed converter for mph to km/h, km/h to mph, knots and m/s. Instant, accurate velocity conversions for driving, running, sailing and flying.',
  description: 'Convert mph to km/h, km/h to mph, knots, m/s and feet per second instantly.',
  intro:
    'This speed converter changes any velocity into another unit as soon as you type. It covers the conversions drivers, runners, sailors and pilots reach for most — mph to km/h across borders, m/s in physics class, and knots at sea or in the air.',
  about: [
    'Speed measures how much distance is covered in a unit of time. Road speeds are shown in miles per hour (mph) in the US and UK and in kilometres per hour (km/h) across most of the world, so converting between them is essential when driving abroad or reading imported specifications. Scientists use metres per second (m/s), the SI unit, while ships and aircraft measure speed in knots (nautical miles per hour).',
    'Each value here is anchored to the metre per second. One km/h equals exactly 1000⁄3600 m/s, one mph equals 0.44704 m/s, and one knot equals 1852⁄3600 m/s (0.514444 m/s). Because these definitions are exact, the converter gives precise results — for example, a 100 km/h limit is exactly 62.14 mph, and a 60 mph highway speed is 96.56 km/h.',
  ],
  keywords: [
    'speed converter',
    'mph to km/h',
    'km/h to mph',
    'knots to mph',
    'm/s to km/h',
    'km/h to m/s',
    'knots to km/h',
    'velocity converter',
    'mph to knots',
    'feet per second',
  ],
  units: [
    { id: 'kmh', name: 'Kilometre / hour', symbol: 'km/h', factor: 0.277777778 },
    { id: 'mph', name: 'Mile / hour', symbol: 'mph', factor: 0.44704 },
    { id: 'ms', name: 'Metre / second', symbol: 'm/s', factor: 1 },
    { id: 'fps', name: 'Foot / second', symbol: 'ft/s', factor: 0.3048 },
    { id: 'kn', name: 'Knot', symbol: 'kn', factor: 0.514444444 },
  ],
  defaultFrom: 'mph',
  defaultTo: 'kmh',
  defaultValue: '60',
  precision: 4,
  howto: [
    'Enter the speed you want to convert in the value box.',
    'Pick the unit you are converting from (for example, miles per hour).',
    'Pick the unit you want the result in (for example, kilometres per hour).',
    'The converted speed updates instantly as you type.',
    'Use the swap arrows to reverse direction, or view the grid to see every speed unit together.',
  ],
  factorRows: [
    { label: '1 mph', value: '1.609344 km/h = 0.44704 m/s' },
    { label: '1 km/h', value: '0.621371 mph = 0.277778 m/s' },
    { label: '1 m/s', value: '3.6 km/h = 2.236936 mph' },
    { label: '1 knot', value: '1.852 km/h = 1.150779 mph' },
    { label: '1 foot/second', value: '0.681818 mph = 1.09728 km/h' },
    { label: '60 mph', value: '96.56 km/h = 26.82 m/s' },
    { label: '100 km/h', value: '62.14 mph = 27.78 m/s' },
  ],
  faqs: [
    { q: 'How do I convert mph to km/h?', a: 'Multiply miles per hour by 1.609344. For example, 60 mph × 1.609344 = 96.56 km/h. To convert km/h to mph, multiply by 0.621371.' },
    { q: 'How fast is 100 km/h in mph?', a: '100 km/h equals about 62.14 mph. This is a common motorway/highway speed, so it is one of the most-searched speed conversions.' },
    { q: 'What is a knot?', a: 'A knot is one nautical mile per hour, used in shipping and aviation. One knot equals 1.852 km/h or about 1.151 mph. It comes from an old method of measuring speed with knotted rope.' },
    { q: 'How do I convert m/s to km/h?', a: 'Multiply metres per second by 3.6. So 10 m/s = 36 km/h. To go from km/h to m/s, divide by 3.6.' },
    { q: 'Which speed unit does science use?', a: 'The metre per second (m/s) is the SI unit of speed and is standard in physics. This converter treats m/s as its base unit, so all other units are defined precisely against it.' },
  ],
};

/* ============================================================
   VOLUME
   ============================================================ */
const volume: ConverterConfig = {
  slug: 'volume',
  kind: 'linear',
  name: 'Volume',
  title: 'Volume Converter',
  baseUnit: 'litre',
  metaTitle: 'Volume Converter — liters to gallons, ml to oz, cups to ml',
  metaDescription:
    'Free volume converter for liters to gallons, gallons to liters, ml to oz and cups to ml. Instant, accurate capacity conversions for cooking and fuel.',
  description: 'Convert liters to gallons, ml to fluid ounces, cups to milliliters and more instantly.',
  intro:
    'This volume converter turns any capacity measurement into another unit as you type. It handles the conversions people search for in the kitchen and at the pump — litres to gallons for fuel, millilitres to fluid ounces for drinks, and cups to millilitres for recipes — across metric, US and imperial units.',
  about: [
    'Volume measures how much space a substance occupies. The metric system uses litres and millilitres (plus cubic metres and cubic centimetres), while cooking and fuel in the US and UK use gallons, quarts, pints, cups, fluid ounces, tablespoons and teaspoons. A frequent source of confusion is that US and imperial (UK) gallons and pints are different sizes, which this tool keeps separate.',
    'Every value is anchored to the litre. One US gallon equals exactly 3.785411784 litres, while one imperial gallon is 4.54609 litres — about 20% larger. A US cup is 236.588 ml and a US fluid ounce is 29.5735 ml. Because recipes and fuel prices constantly mix these systems, seeing a single value in every unit at once removes the guesswork.',
  ],
  keywords: [
    'volume converter',
    'liters to gallons',
    'gallons to liters',
    'ml to oz',
    'oz to ml',
    'cups to ml',
    'ml to cups',
    'quarts to liters',
    'tablespoons to ml',
    'capacity converter',
  ],
  units: [
    { id: 'm3', name: 'Cubic metre', symbol: 'm³', factor: 1000 },
    { id: 'l', name: 'Litre', symbol: 'L', factor: 1 },
    { id: 'ml', name: 'Millilitre', symbol: 'mL', factor: 0.001 },
    { id: 'gal-us', name: 'US gallon', symbol: 'gal', factor: 3.785411784 },
    { id: 'qt-us', name: 'US quart', symbol: 'qt', factor: 0.946352946 },
    { id: 'pt-us', name: 'US pint', symbol: 'pt', factor: 0.473176473 },
    { id: 'cup-us', name: 'US cup', symbol: 'cup', factor: 0.2365882365 },
    { id: 'floz-us', name: 'US fluid ounce', symbol: 'fl oz', factor: 0.0295735295625 },
    { id: 'tbsp-us', name: 'US tablespoon', symbol: 'tbsp', factor: 0.01478676478125 },
    { id: 'tsp-us', name: 'US teaspoon', symbol: 'tsp', factor: 0.00492892159375 },
    { id: 'gal-uk', name: 'Imperial gallon', symbol: 'gal (UK)', factor: 4.54609 },
    { id: 'pt-uk', name: 'Imperial pint', symbol: 'pt (UK)', factor: 0.56826125 },
  ],
  defaultFrom: 'l',
  defaultTo: 'gal-us',
  defaultValue: '1',
  precision: 6,
  howto: [
    'Type the volume you want to convert into the value box.',
    'Choose the unit you are converting from (for example, litres).',
    'Choose the unit you want the answer in (for example, US gallons).',
    'The converted volume appears immediately as you type.',
    'Swap the direction with the arrows, or check the grid to see every volume unit at once.',
  ],
  factorRows: [
    { label: '1 US gallon', value: '3.785412 L = 128 US fl oz' },
    { label: '1 imperial gallon', value: '4.54609 L = 1.20095 US gallons' },
    { label: '1 litre', value: '0.264172 US gal = 33.814 US fl oz' },
    { label: '1 US cup', value: '236.588 mL = 8 US fl oz' },
    { label: '1 US fluid ounce', value: '29.5735 mL' },
    { label: '1 US quart', value: '0.946353 L = 2 US pints' },
    { label: '1 US tablespoon', value: '14.7868 mL = 3 teaspoons' },
    { label: '1 cubic metre', value: '1,000 L = 264.172 US gallons' },
  ],
  faqs: [
    { q: 'How do I convert liters to gallons?', a: 'For US gallons, divide litres by 3.785412 (or multiply by 0.264172). So 10 litres ≈ 2.64 US gallons. For imperial gallons, divide by 4.54609 instead.' },
    { q: 'How many ml are in a fluid ounce?', a: 'One US fluid ounce is about 29.5735 millilitres. An imperial (UK) fluid ounce is slightly smaller at 28.4131 ml. This converter uses US fluid ounces by default.' },
    { q: 'How do I convert cups to ml?', a: 'One US cup equals about 236.588 millilitres. Multiply the number of cups by 236.588 to get millilitres, or divide ml by 236.588 to get cups.' },
    { q: 'Why are US and UK gallons different?', a: 'They were standardised separately. A US gallon is 3.785 litres while an imperial (UK) gallon is 4.546 litres — roughly 20% larger. Always check which gallon a figure refers to, especially for fuel economy.' },
    { q: 'Is a litre the same as a kilogram?', a: 'Only for pure water at 4 °C, where one litre weighs about one kilogram. For other liquids the weight differs because density varies, so volume and mass are not interchangeable in general.' },
  ],
};

/* ============================================================
   AREA
   ============================================================ */
const area: ConverterConfig = {
  slug: 'area',
  kind: 'linear',
  name: 'Area',
  title: 'Area Converter',
  baseUnit: 'square metre',
  metaTitle: 'Area Converter — sq ft to sq m, acres to hectares, m² to ft²',
  metaDescription:
    'Free area converter for square feet to square meters, acres to hectares and m² to ft². Instant, accurate area conversions for land, rooms and property.',
  description: 'Convert square feet to square meters, acres to hectares, and every other area unit instantly.',
  intro:
    'This area converter changes any surface measurement into another unit the moment you type. It focuses on the conversions used in property, construction and land — square feet to square metres for floor plans, and acres to hectares for land — and does one job only: area, with nothing else mixed in.',
  about: [
    'Area measures the size of a two-dimensional surface, such as a floor, a wall or a plot of land. It is expressed in squared length units: square metres (m²) and square kilometres in the metric system, square feet (ft²), square yards and square miles in the imperial system, plus the acre and the hectare for land. Real-estate listings, flooring quotes and land records routinely switch between these, making conversion a common task.',
    'All values are anchored to the square metre, the SI unit of area. Because area scales with the square of length, the factors are the length factors squared: one square foot is 0.3048² = 0.09290304 m², and one square mile is 1609.344² ≈ 2,589,988 m². An acre is defined as 4,046.8564224 m² and a hectare as exactly 10,000 m² (100 m × 100 m), so 1 hectare ≈ 2.471 acres.',
  ],
  keywords: [
    'area converter',
    'sq ft to sq m',
    'square feet to square meters',
    'square meters to square feet',
    'acres to hectares',
    'hectares to acres',
    'sq m to sq ft',
    'acre to sq ft',
    'land area converter',
    'square yards to square meters',
  ],
  units: [
    { id: 'km2', name: 'Square kilometre', symbol: 'km²', factor: 1e6 },
    { id: 'ha', name: 'Hectare', symbol: 'ha', factor: 10000 },
    { id: 'm2', name: 'Square metre', symbol: 'm²', factor: 1 },
    { id: 'cm2', name: 'Square centimetre', symbol: 'cm²', factor: 0.0001 },
    { id: 'mi2', name: 'Square mile', symbol: 'mi²', factor: 2589988.110336 },
    { id: 'acre', name: 'Acre', symbol: 'ac', factor: 4046.8564224 },
    { id: 'yd2', name: 'Square yard', symbol: 'yd²', factor: 0.83612736 },
    { id: 'ft2', name: 'Square foot', symbol: 'ft²', factor: 0.09290304 },
    { id: 'in2', name: 'Square inch', symbol: 'in²', factor: 0.00064516 },
  ],
  defaultFrom: 'ft2',
  defaultTo: 'm2',
  defaultValue: '1000',
  precision: 6,
  howto: [
    'Type the area you want to convert into the value box.',
    'Select the unit you are converting from (for example, square feet).',
    'Select the unit you want the result in (for example, square metres).',
    'The converted area appears instantly as you type.',
    'Use the swap arrows to reverse the units, or read the grid to compare every area unit at once.',
  ],
  factorRows: [
    { label: '1 square foot', value: '0.092903 m² = 144 sq inches' },
    { label: '1 square metre', value: '10.7639 ft² = 1.19599 sq yards' },
    { label: '1 square yard', value: '0.836127 m² = 9 square feet' },
    { label: '1 acre', value: '4,046.86 m² = 43,560 square feet' },
    { label: '1 hectare', value: '10,000 m² = 2.471054 acres' },
    { label: '1 acre', value: '0.404686 hectares' },
    { label: '1 square kilometre', value: '100 hectares = 247.105 acres' },
    { label: '1 square mile', value: '2.589988 km² = 640 acres' },
  ],
  faqs: [
    { q: 'How do I convert square feet to square meters?', a: 'Multiply square feet by 0.092903. For example, 1,000 ft² × 0.092903 ≈ 92.9 m². To convert square metres to square feet, multiply by 10.7639.' },
    { q: 'How many square feet are in an acre?', a: 'One acre is exactly 43,560 square feet, or about 4,046.86 square metres. It is a standard unit for land area in the US and UK.' },
    { q: 'How do I convert acres to hectares?', a: 'Multiply acres by 0.404686 to get hectares, since one hectare equals about 2.471 acres. So 10 acres ≈ 4.05 hectares.' },
    { q: 'What is the difference between a hectare and an acre?', a: 'A hectare is a metric land unit equal to 10,000 m² (a 100 m × 100 m square). An acre is an imperial unit of 4,046.86 m². One hectare is roughly 2.47 acres.' },
    { q: 'Why do area factors look like length factors squared?', a: 'Because area is length × length. If 1 foot = 0.3048 m, then 1 square foot = 0.3048² = 0.09290304 m². That is why converting area uses the square of the length conversion factor.' },
  ],
};

/* ============================================================
   CURRENCY
   ============================================================ */
const currency: ConverterConfig = {
  slug: 'currency',
  kind: 'linear',
  name: 'Currency',
  title: 'Currency Converter',
  baseUnit: 'US dollar',
  metaTitle: 'Currency Converter — Live Rates USD to EUR, INR, GBP, JPY',
  metaDescription:
    'Free currency converter with live daily exchange rates for USD to EUR, USD to INR, GBP and JPY, plus interactive rate-history charts from 1 week to 5 years.',
  description: 'Convert USD to EUR, USD to INR, GBP, JPY and more with live daily exchange rates and interactive rate-history charts.',
  intro:
    'This currency converter changes an amount from one currency into another as you type, covering the pairs people search for most — USD to EUR, USD to INR, and USD to GBP. Rates for the major world currencies update every working day from official central-bank data, and an interactive chart shows how any pair has moved over the last week, month or several years.',
  about: [
    'A currency converter translates a monetary amount from one national currency into another using an exchange rate — the price of one currency in terms of another. Exchange rates move constantly during trading hours in response to interest rates, inflation, trade flows and market sentiment, which is why the same $100 can be worth slightly different amounts of euros from one day to the next.',
    'This tool uses live reference rates for the major world currencies, refreshed every working day from European Central Bank data (published around 16:00 CET), so a USD to EUR or USD to GBP conversion reflects the latest official close. A handful of less-traded currencies fall back to a clearly flagged reference estimate. Every amount is anchored to the US dollar (USD): each currency carries its value in dollars, so converting between any two currencies routes through USD. For an exact figure to send money, book travel or trade, always confirm with your bank or a live foreign-exchange source at the moment of the transaction, since providers add a margin on top of the mid-market rate.',
  ],
  keywords: [
    'currency converter',
    'usd to eur',
    'eur to usd',
    'usd to inr',
    'usd to gbp',
    'gbp to usd',
    'usd to jpy',
    'exchange rate converter',
    'money converter',
    'convert currency',
  ],
  units: currencyUnits,
  defaultFrom: 'USD',
  defaultTo: 'EUR',
  defaultValue: '100',
  precision: 2,
  howto: [
    'Enter the amount you want to convert in the value box.',
    'Choose the currency you are converting from (for example, US Dollar).',
    'Choose the currency you want the result in (for example, Euro).',
    'Read the converted amount instantly, along with the live rate and its inverse.',
    'Tap a popular currency to switch the target, or use the chart range buttons (1W to 5Y) to see how the pair has moved over time.',
  ],
  note: 'Live rates for major currencies update every working day from European Central Bank reference data; a few less-traded currencies use a flagged reference estimate. Banks and transfer services add a margin, so confirm the exact figure before making a real transaction.',
  factorRows: [
    { label: '1 USD', value: '≈ 0.93 EUR' },
    { label: '1 EUR', value: '≈ 1.08 USD' },
    { label: '1 GBP', value: '≈ 1.27 USD' },
    { label: '1 USD', value: '≈ 83.3 INR' },
    { label: '1 USD', value: '≈ 149 JPY' },
    { label: '1 USD', value: '≈ 1.37 CAD' },
    { label: '1 USD', value: '≈ 1.52 AUD' },
    { label: '1 USD', value: '≈ 7.14 CNY' },
  ],
  faqs: [
    { q: 'How do I convert USD to EUR?', a: 'Enter the dollar amount and pick USD as the source and EUR as the target. The converter multiplies by the current USD→EUR rate and shows the result instantly. It also displays the live rate and its inverse, so you can sanity-check the number.' },
    { q: 'Are these exchange rates live?', a: 'Yes for the major world currencies. Rates refresh every working day from European Central Bank reference data (published around 16:00 CET). A few less-traded currencies use a clearly flagged reference estimate rather than a live feed.' },
    { q: 'How often do the rates update?', a: 'Official reference rates are published once per working day, so the converter refreshes daily. It does not track intraday (minute-by-minute) movements, which is why the history chart starts at a one-week range rather than showing tick data.' },
    { q: 'Can I see historical exchange rates?', a: 'Yes. The built-in chart plots the daily closing rate for any supported pair. Use the range buttons to switch between one week, one month, three months, six months, one year and five years, and hover the line to read the rate on a specific day.' },
    { q: 'Why is the amount I receive from a bank different?', a: 'Banks and money-transfer services add a margin or fee on top of the mid-market rate shown here, so the amount you actually receive is usually a little lower. Always confirm the final figure with your provider before sending money.' },
  ],
};

export const converters: ConverterConfig[] = [
  length,
  weight,
  temperature,
  speed,
  volume,
  area,
  currency,
];

const bySlug = new Map<string, ConverterConfig>(converters.map((c) => [c.slug, c]));

export function getConverter(slug: string): ConverterConfig | undefined {
  return bySlug.get(slug);
}

/** JSON-LD schemas for a single converter page (breadcrumb + app + FAQ). */
export function converterPageSchemas(cfg: ConverterConfig) {
  const path = `/en/unit-converter/${cfg.slug}`;
  const crumbs = [
    { name: 'Home', path: '/en' },
    { name: 'Unit Converter', path: '/en/unit-converter' },
    { name: cfg.title, path },
  ];
  const app = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: cfg.title,
    url: `${SITE}${path}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    description: cfg.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'Try Online Calculator', url: SITE },
  };
  const schemas: Record<string, unknown>[] = [breadcrumbSchema(crumbs), app];
  if (cfg.faqs.length) schemas.push(faqPageSchema(cfg.faqs));
  return schemas;
}
