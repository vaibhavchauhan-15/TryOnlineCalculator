// Content for the dedicated per-type converter landing pages
// (/unit-converter/length, /unit-converter/weight, …). Each entry is a
// self-contained, keyword-targeted SEO page: unique intro, overview,
// how-to, conversion-factor table and FAQ. The interactive widget on every
// page is the shared <UnitConverter /> opened on the matching tab.
import type { ConvCategoryId } from './convert';

export interface FactorRow {
  label: string;
  expr: string;
}

export interface ConverterFaq {
  q: string;
  a: string;
}

export interface ConverterPage {
  type: ConvCategoryId;
  name: string; // "Length"
  h1: string; // "Length Converter"
  title: string; // <title> (Layout appends the brand)
  description: string; // meta description
  keywords: string[];
  intro: string; // hero paragraph under the H1
  overview: string[]; // "About" paragraphs
  howto: string[];
  factors?: FactorRow[];
  note?: string; // shown in place of factors (currency)
  faq: ConverterFaq[];
}

export const converterPages: ConverterPage[] = [
  {
    type: 'length',
    name: 'Length',
    h1: 'Length Converter',
    title: 'Length Converter — cm, m, inches, feet, miles & more',
    description:
      'Free online length converter. Instantly convert between metric and imperial length units — mm, cm, m, km, inches, feet, yards, miles and nautical miles.',
    keywords: [
      'length converter',
      'length conversion',
      'distance converter',
      'cm to inches',
      'inches to cm',
      'meters to feet',
      'feet to meters',
      'km to miles',
      'miles to km',
      'mm to inches',
      'metric length converter',
    ],
    intro:
      'Convert any length or distance between metric and imperial units. Type a value and the result updates instantly — no button to press and no sign-up.',
    overview: [
      'This length converter handles every common unit of distance in one place: millimeters, centimeters, meters and kilometers on the metric side, and inches, feet, yards and miles on the imperial side, plus the nautical mile used in aviation and shipping. Because it converts in both directions, you can go from centimeters to inches or inches to centimeters using the same tool — just type in whichever box you already know.',
      'Every result is derived from the internationally defined exact factors (an inch is exactly 2.54 cm, a mile is exactly 1,609.344 m), so the numbers you see are accurate to the precision displayed. It is ideal for schoolwork, DIY and construction measurements, travel distances, screen and print sizes, and any time a spec is quoted in units you do not normally use.',
    ],
    howto: [
      'Choose the unit you already have from the left-hand list (for example, centimeters).',
      'Choose the unit you want on the right (for example, inches).',
      'Type your value into either box — the other side updates as you type.',
      'Use the swap button to flip the direction, or copy the result with one tap.',
    ],
    factors: [
      { label: '1 inch', expr: '= 2.54 cm' },
      { label: '1 foot', expr: '= 30.48 cm = 0.3048 m' },
      { label: '1 yard', expr: '= 0.9144 m' },
      { label: '1 mile', expr: '= 1.609344 km' },
      { label: '1 meter', expr: '= 3.28084 ft' },
      { label: '1 centimeter', expr: '= 0.393701 in' },
      { label: '1 kilometer', expr: '= 0.621371 mi' },
      { label: '1 nautical mile', expr: '= 1.852 km' },
    ],
    faq: [
      {
        q: 'How do I convert centimeters to inches?',
        a: 'Divide the number of centimeters by 2.54, because one inch is exactly 2.54 cm. For example, 30 cm ÷ 2.54 ≈ 11.81 inches. The converter above does this instantly in both directions.',
      },
      {
        q: 'How many feet are in a meter?',
        a: 'One meter equals about 3.28084 feet. To go the other way, one foot is exactly 0.3048 meters, so you can divide feet by 3.28084 or multiply by 0.3048.',
      },
      {
        q: 'How do I convert kilometers to miles?',
        a: 'Multiply kilometers by 0.621371 to get miles, or multiply miles by 1.609344 to get kilometers. So 100 km ≈ 62.14 miles.',
      },
      {
        q: 'What is the difference between metric and imperial length?',
        a: 'Metric units (millimeters, centimeters, meters, kilometers) are based on powers of ten, while imperial units (inches, feet, yards, miles) use fixed historical ratios. This tool converts freely between the two systems.',
      },
      {
        q: 'What is a nautical mile?',
        a: 'A nautical mile is a unit used in sea and air navigation, equal to exactly 1,852 meters — slightly longer than a standard (statute) mile of about 1,609 meters.',
      },
    ],
  },
  {
    type: 'weight',
    name: 'Weight',
    h1: 'Weight Converter',
    title: 'Weight Converter — kg, lbs, grams, ounces & stone',
    description:
      'Free online weight and mass converter. Instantly convert kilograms, grams, pounds, ounces, stone and tons — kg to lbs, lbs to kg, oz to grams and more.',
    keywords: [
      'weight converter',
      'mass converter',
      'weight conversion',
      'kg to lbs',
      'lbs to kg',
      'grams to ounces',
      'ounces to grams',
      'stone to pounds',
      'pounds to kg',
      'kg to stone',
    ],
    intro:
      'Convert weight and mass between metric and imperial units. Enter a value in any box and see every other unit update instantly.',
    overview: [
      'This weight converter covers milligrams, grams, kilograms and metric tons alongside ounces, pounds, stone and both US and UK tons. It is the fastest way to move between the units used on kitchen scales, gym plates, luggage limits, shipping labels and recipes from other countries — kilograms to pounds, pounds to kilograms, grams to ounces, or stone to pounds, all in the same tool.',
      'Conversions use the exact international definitions (one pound is exactly 0.45359237 kg, one ounce is 28.349523125 g), so results stay accurate to the digits shown. Strictly speaking these are units of mass, but in everyday use "weight" and "mass" are treated interchangeably, which is how this converter is set up.',
    ],
    howto: [
      'Pick the unit you have on the left (for example, kilograms).',
      'Pick the unit you want on the right (for example, pounds).',
      'Type a value into either field to convert in that direction.',
      'Tap swap to reverse, or copy the answer to your clipboard.',
    ],
    factors: [
      { label: '1 pound', expr: '= 0.453592 kg = 16 oz' },
      { label: '1 kilogram', expr: '= 2.20462 lb' },
      { label: '1 ounce', expr: '= 28.3495 g' },
      { label: '1 stone', expr: '= 14 lb = 6.35029 kg' },
      { label: '1 gram', expr: '= 0.035274 oz' },
      { label: '1 metric ton', expr: '= 1000 kg' },
      { label: '1 US ton', expr: '= 907.185 kg' },
    ],
    faq: [
      {
        q: 'How do I convert kilograms to pounds?',
        a: 'Multiply the kilograms by 2.20462 to get pounds. For example, 70 kg × 2.20462 ≈ 154.32 lb. To reverse it, multiply pounds by 0.453592.',
      },
      {
        q: 'How many grams are in an ounce?',
        a: 'One ounce equals 28.3495 grams. So 4 oz is about 113.4 g. The converter above switches between grams and ounces automatically.',
      },
      {
        q: 'How do I convert stone to pounds or kilograms?',
        a: 'One stone equals 14 pounds or about 6.35 kilograms. So 11 stone is 154 lb, which is roughly 69.85 kg.',
      },
      {
        q: 'Is weight the same as mass?',
        a: 'In physics they differ — mass is the amount of matter, while weight is the force gravity exerts on it. In everyday life the terms are used interchangeably, and this converter follows that common usage.',
      },
      {
        q: 'What is the difference between a metric ton and a US ton?',
        a: 'A metric ton (tonne) is 1,000 kg (about 2,204.6 lb). A US short ton is 2,000 lb (about 907.2 kg), and a UK long ton is 2,240 lb (about 1,016 kg).',
      },
    ],
  },
  {
    type: 'temperature',
    name: 'Temperature',
    h1: 'Temperature Converter',
    title: 'Temperature Converter — Celsius, Fahrenheit & Kelvin',
    description:
      'Free online temperature converter. Instantly convert Celsius, Fahrenheit and Kelvin — °C to °F, °F to °C, and Kelvin, with the correct formulas.',
    keywords: [
      'temperature converter',
      'temperature conversion',
      'celsius to fahrenheit',
      'fahrenheit to celsius',
      'c to f',
      'f to c',
      'celsius to kelvin',
      'kelvin to celsius',
    ],
    intro:
      'Convert temperatures between Celsius, Fahrenheit and Kelvin. Type a value and see the equivalent instantly, with the exact conversion formula shown below.',
    overview: [
      'Temperature is different from most conversions because the scales have different zero points, not just different sizes of degree. This converter handles that offset correctly, so Celsius to Fahrenheit, Fahrenheit to Celsius and conversions to and from Kelvin all come out right. It is handy for weather, cooking and oven settings, science homework and reading appliances or thermostats set to another scale.',
      'Celsius is the everyday metric scale where water freezes at 0° and boils at 100°. Fahrenheit, common in the United States, puts those points at 32° and 212°. Kelvin is the scientific absolute scale that starts at absolute zero (−273.15 °C), the coldest temperature physically possible.',
    ],
    howto: [
      'Select the scale you have on the left (for example, Celsius).',
      'Select the scale you want on the right (for example, Fahrenheit).',
      'Type a temperature into either box to convert in that direction.',
      'Negative values are supported — useful for winter temperatures and Kelvin work.',
    ],
    factors: [
      { label: '°C → °F', expr: '= (°C × 9/5) + 32' },
      { label: '°F → °C', expr: '= (°F − 32) × 5/9' },
      { label: '°C → K', expr: '= °C + 273.15' },
      { label: 'K → °C', expr: '= K − 273.15' },
      { label: 'Water freezes', expr: '0 °C = 32 °F = 273.15 K' },
      { label: 'Water boils', expr: '100 °C = 212 °F = 373.15 K' },
      { label: 'Body temperature', expr: '37 °C ≈ 98.6 °F' },
    ],
    faq: [
      {
        q: 'How do I convert Celsius to Fahrenheit?',
        a: 'Multiply the Celsius value by 9/5 (1.8) and add 32. For example, 20 °C × 1.8 + 32 = 68 °F. The converter above does this instantly.',
      },
      {
        q: 'How do I convert Fahrenheit to Celsius?',
        a: 'Subtract 32 from the Fahrenheit value, then multiply by 5/9. For example, (98.6 − 32) × 5/9 = 37 °C.',
      },
      {
        q: 'What is Kelvin and how does it relate to Celsius?',
        a: 'Kelvin is the SI absolute temperature scale. It uses the same degree size as Celsius but starts at absolute zero, so K = °C + 273.15. Water freezes at 273.15 K.',
      },
      {
        q: 'What is normal body temperature in Celsius and Fahrenheit?',
        a: 'Average normal body temperature is about 37 °C, which equals 98.6 °F. Readings a little above or below this are still considered normal.',
      },
      {
        q: 'What is absolute zero?',
        a: 'Absolute zero is the lowest possible temperature, defined as 0 Kelvin, which equals −273.15 °C or −459.67 °F. At this point molecular motion is at its minimum.',
      },
    ],
  },
  {
    type: 'speed',
    name: 'Speed',
    h1: 'Speed Converter',
    title: 'Speed Converter — mph, km/h, m/s, knots & ft/s',
    description:
      'Free online speed converter. Instantly convert miles per hour, kilometers per hour, meters per second, feet per second and knots — mph to km/h and more.',
    keywords: [
      'speed converter',
      'velocity converter',
      'speed conversion',
      'mph to kmh',
      'kmh to mph',
      'm/s to km/h',
      'knots to mph',
      'meters per second to mph',
    ],
    intro:
      'Convert speed and velocity between mph, km/h, m/s, ft/s and knots. Enter a value and every other unit updates instantly.',
    overview: [
      'This speed converter moves between the units used for driving, running, wind and water: miles per hour and kilometers per hour for road speeds, meters per second and feet per second for physics and engineering, and knots for aviation and sailing. Because it works both ways, mph to km/h and km/h to mph use the very same tool.',
      'It is useful for reading speed limits abroad, comparing running or cycling pace, interpreting weather wind speeds, and checking physics answers. All conversions use exact factors — for instance, one mph is exactly 1.609344 km/h and one knot is exactly 1.852 km/h.',
    ],
    howto: [
      'Choose the unit you have on the left (for example, km/h).',
      'Choose the unit you want on the right (for example, mph).',
      'Type a value into either field to convert instantly.',
      'Swap the direction or copy the result with the buttons provided.',
    ],
    factors: [
      { label: '1 mph', expr: '= 1.609344 km/h' },
      { label: '1 km/h', expr: '= 0.621371 mph' },
      { label: '1 m/s', expr: '= 3.6 km/h' },
      { label: '1 m/s', expr: '= 2.23694 mph' },
      { label: '1 knot', expr: '= 1.852 km/h = 1.15078 mph' },
      { label: '1 mph', expr: '= 0.44704 m/s' },
      { label: '1 ft/s', expr: '= 0.3048 m/s' },
    ],
    faq: [
      {
        q: 'How do I convert mph to km/h?',
        a: 'Multiply miles per hour by 1.609344. For example, 60 mph ≈ 96.56 km/h. To go the other way, multiply km/h by 0.621371.',
      },
      {
        q: 'How do I convert m/s to km/h?',
        a: 'Multiply meters per second by 3.6. So 10 m/s equals 36 km/h. Divide by 3.6 to convert km/h back to m/s.',
      },
      {
        q: 'What is a knot?',
        a: 'A knot is one nautical mile per hour, used in aviation and at sea. One knot equals 1.852 km/h or about 1.15078 mph.',
      },
      {
        q: 'How fast is 100 km/h in mph?',
        a: '100 km/h is about 62.14 mph. This converter shows the exact figure the moment you type a value.',
      },
      {
        q: 'What units of speed can I convert here?',
        a: 'You can convert between meters per second (m/s), kilometers per hour (km/h), miles per hour (mph), feet per second (ft/s) and knots, in any combination.',
      },
    ],
  },
  {
    type: 'volume',
    name: 'Volume',
    h1: 'Volume Converter',
    title: 'Volume Converter — liters, gallons, cups, ml & more',
    description:
      'Free online volume converter. Instantly convert liters, milliliters, gallons, cups, pints, quarts and cubic meters — including US and UK gallons.',
    keywords: [
      'volume converter',
      'volume conversion',
      'liquid converter',
      'liters to gallons',
      'gallons to liters',
      'ml to cups',
      'cups to ml',
      'ml to oz',
      'us gallon to uk gallon',
    ],
    intro:
      'Convert volume and capacity between metric and US/UK units. Type a value into any box to see the rest update instantly.',
    overview: [
      'This volume converter handles milliliters, liters and cubic meters plus the US cooking and liquid units — teaspoons, tablespoons, fluid ounces, cups, pints, quarts and gallons — as well as the UK gallon. It is built for kitchens, fuel and fluid measurements, and any recipe or spec written in units you do not normally use, converting liters to gallons or cups to milliliters in either direction.',
      'One important detail is handled for you: the US gallon (3.785412 L) and the UK (imperial) gallon (4.54609 L) are different sizes, and both are listed separately so you always pick the right one. All factors are exact, so measurements stay reliable.',
    ],
    howto: [
      'Select the unit you have on the left (for example, liters).',
      'Select the unit you want on the right (for example, US gallons).',
      'Type your value into either box to convert that direction.',
      'Watch for US vs UK gallon — both are available in the unit lists.',
    ],
    factors: [
      { label: '1 US gallon', expr: '= 3.785412 L' },
      { label: '1 UK gallon', expr: '= 4.54609 L' },
      { label: '1 liter', expr: '= 0.264172 US gal' },
      { label: '1 cup (US)', expr: '= 236.588 ml' },
      { label: '1 fluid ounce (US)', expr: '= 29.5735 ml' },
      { label: '1 tablespoon', expr: '= 14.7868 ml' },
      { label: '1 teaspoon', expr: '= 4.92892 ml' },
    ],
    faq: [
      {
        q: 'How do I convert liters to gallons?',
        a: 'Multiply liters by 0.264172 for US gallons, or by 0.219969 for UK gallons. So 10 liters ≈ 2.64 US gallons. Use the correct gallon for your region.',
      },
      {
        q: 'How many milliliters are in a cup?',
        a: 'A US cup is 236.588 ml. The converter above switches between cups and milliliters instantly, which is handy for following recipes.',
      },
      {
        q: 'What is the difference between a US gallon and a UK gallon?',
        a: 'A US gallon is 3.785412 liters while a UK (imperial) gallon is 4.54609 liters — about 20% larger. Both are listed separately in this tool.',
      },
      {
        q: 'How do I convert ml to fluid ounces?',
        a: 'Divide milliliters by 29.5735 to get US fluid ounces. So 500 ml ≈ 16.91 fl oz.',
      },
      {
        q: 'Which volume units can I convert?',
        a: 'You can convert between milliliters, liters, cubic meters, teaspoons, tablespoons, US fluid ounces, US cups, pints, quarts, US gallons and UK gallons.',
      },
    ],
  },
  {
    type: 'area',
    name: 'Area',
    h1: 'Area Converter',
    title: 'Area Converter — square meters, feet, acres & hectares',
    description:
      'Free online area converter. Instantly convert square meters, square feet, square kilometers, acres, hectares and square miles — sq ft to sq m and more.',
    keywords: [
      'area converter',
      'area conversion',
      'square feet to square meters',
      'square meters to square feet',
      'acres to hectares',
      'hectares to acres',
      'sq ft to sq m',
      'acre to square feet',
    ],
    intro:
      'Convert area between metric and imperial units. Enter a value and every other unit updates instantly.',
    overview: [
      'This area converter covers square millimeters, square centimeters, square meters and square kilometers, along with square inches, square feet, square yards and square miles, plus the two units most used for land — the acre and the hectare. It is ideal for floor plans, flooring and paint estimates, gardens, real-estate listings and land measurements, converting square feet to square meters or acres to hectares in either direction.',
      'Area factors are the squares of the matching length factors, so they are exact — for example, one square foot is 0.09290304 m² and one acre is 4,046.8564224 m². That precision matters when small per-unit differences add up over a large space.',
    ],
    howto: [
      'Pick the unit you have on the left (for example, square feet).',
      'Pick the unit you want on the right (for example, square meters).',
      'Type a value into either field to convert instantly.',
      'Use acres or hectares for land, and square feet or meters for rooms.',
    ],
    factors: [
      { label: '1 square foot', expr: '= 0.092903 m²' },
      { label: '1 square meter', expr: '= 10.7639 ft²' },
      { label: '1 acre', expr: '= 4046.86 m² = 0.404686 ha' },
      { label: '1 hectare', expr: '= 10,000 m² = 2.47105 ac' },
      { label: '1 square kilometer', expr: '= 0.386102 mi²' },
      { label: '1 square mile', expr: '= 2.58999 km² = 640 ac' },
      { label: '1 square yard', expr: '= 0.836127 m²' },
    ],
    faq: [
      {
        q: 'How do I convert square feet to square meters?',
        a: 'Multiply square feet by 0.092903. For example, 1,000 ft² ≈ 92.9 m². To reverse it, multiply square meters by 10.7639.',
      },
      {
        q: 'How many square feet are in an acre?',
        a: 'One acre is 43,560 square feet, or about 4,046.86 square meters. A hectare is larger, at 10,000 square meters.',
      },
      {
        q: 'How do I convert acres to hectares?',
        a: 'Multiply acres by 0.404686 to get hectares, or multiply hectares by 2.47105 to get acres. So 5 acres ≈ 2.02 hectares.',
      },
      {
        q: 'What is a hectare?',
        a: 'A hectare is a metric unit of land area equal to 10,000 square meters (a 100 m × 100 m square), roughly 2.47 acres. It is widely used in farming and land planning.',
      },
      {
        q: 'Which area units are supported?',
        a: 'You can convert between square millimeters, square centimeters, square meters, hectares, square kilometers, square inches, square feet, square yards, acres and square miles.',
      },
    ],
  },
  {
    type: 'currency',
    name: 'Currency',
    h1: 'Currency Converter',
    title: 'Currency Converter — live exchange rates, USD, EUR, GBP',
    description:
      'Free online currency converter with live reference exchange rates. Convert USD, EUR, GBP, INR, JPY, CNY, AUD, CAD and more major world currencies instantly.',
    keywords: [
      'currency converter',
      'exchange rate converter',
      'money converter',
      'usd to eur',
      'eur to usd',
      'usd to inr',
      'gbp to usd',
      'foreign exchange calculator',
      'live exchange rates',
    ],
    intro:
      'Convert between major world currencies using live reference exchange rates. Enter an amount and see the equivalent instantly.',
    overview: [
      'This currency converter supports major world currencies including the US dollar, euro, British pound, Indian rupee, Japanese yen, Chinese yuan, Australian and Canadian dollars, Swiss franc and many more. Exchange rates refresh from a public rates source when your connection allows, and it falls back to recent indicative rates when offline, so you always get a quick estimate.',
      'Rates shown are mid-market reference values for information only. The actual rate you receive from a bank, card or money-transfer service will differ because of margins and fees, so treat these figures as a guide for planning rather than an exact transaction price.',
    ],
    howto: [
      'Choose the currency you have on the left (for example, USD).',
      'Choose the currency you want on the right (for example, EUR).',
      'Type an amount into either box to convert in that direction.',
      'Check the "updated" note under the result to see how fresh the rates are.',
    ],
    note:
      'Exchange rates are indicative mid-market reference values that update automatically when possible. They are for information only and are not a quote — banks and providers add their own margin and fees.',
    faq: [
      {
        q: 'Are the exchange rates live?',
        a: 'The converter refreshes rates from a public exchange-rate source whenever your connection allows, and shows when they were last updated. If a live rate cannot be fetched, it falls back to recent indicative rates so you can still get an estimate.',
      },
      {
        q: 'How do I convert USD to EUR?',
        a: 'Select US Dollar on the left and Euro on the right, then type your dollar amount. The euro equivalent appears instantly at the current reference rate.',
      },
      {
        q: 'Why is my bank rate different from this one?',
        a: 'This tool shows the mid-market rate — the midpoint between buy and sell prices. Banks, cards and transfer services add a margin and sometimes fixed fees, so their rate is usually a little worse.',
      },
      {
        q: 'Which currencies are supported?',
        a: 'Major currencies are included, such as USD, EUR, GBP, INR, JPY, CNY, AUD, CAD, CHF, AED, SGD, HKD, BRL, ZAR, RUB, MXN, KRW and NZD.',
      },
      {
        q: 'Can I use this for actual money transfers?',
        a: 'It is designed for quick estimates and planning, not for executing transactions. For a real transfer, check the exact rate and fees quoted by your provider.',
      },
    ],
  },
];

const pageMap = new Map<string, ConverterPage>(converterPages.map((p) => [p.type, p]));

export function getConverterPage(type: string): ConverterPage | undefined {
  return pageMap.get(type);
}
