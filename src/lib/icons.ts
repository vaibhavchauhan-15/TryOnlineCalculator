// Per-calculator icons (lucide-style 24x24 stroke paths), keyed by slug.
// Centralised here so every browse card can show an icon that matches the
// individual tool instead of repeating the shared category icon.

/** Build a full circle as arc path data (our card renders a single <path>). */
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

export const calculatorIcons: Record<string, string> = {
  /* ---------------------------------------------------------------- Finance */
  // House — home financing.
  'mortgage-calculator': 'M3 10.5 12 3l9 7.5 M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9 M9 21v-6h5v6',
  // Bank building — borrowing.
  'loan-calculator': 'M3 21h18 M5 21V9l7-4 7 4v12 M9 21v-6h6v6 M9 12h.01 M15 12h.01',
  // Car with wheels — auto financing.
  'auto-loan-calculator': `M5 13l1.6-4.2A2 2 0 0 1 8.5 7.5h7A2 2 0 0 1 17.4 8.8L19 13v4h-2 M7 17H5v-4h14v4h-2 ${circle(7.5, 17, 1.5)} ${circle(16.5, 17, 1.5)}`,
  // Credit card — monthly car payment.
  'car-payment-calculator': 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z M3 10h18 M6 15h4',
  // Trending-up line — growing investment.
  'investment-calculator': 'M3 17l6-6 4 4 8-8 M15 7h6v6',
  // Stacked layers — interest compounding on itself.
  'compound-interest-calculator': 'M12 2 2 7l10 5 10-5-10-5z M2 12l10 5 10-5 M2 17l10 5 10-5',
  // Coin stack — building savings.
  'savings-calculator': 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  // Document with lines — APR disclosure / fees.
  'apr-calculator': 'M6 2h9l4 4v16H6z M14 2v5h5 M9 12h6 M9 16h4',
  // Dollar in a circle — interest earned/owed.
  'interest-calculator': `${circle(12, 12, 9)} M14.5 9.5a2.5 2.5 0 0 0-2.5-1.5c-1.7 0-2.5.9-2.5 2s.8 2 2.5 2 2.5.9 2.5 2-.8 2-2.5 2a2.5 2.5 0 0 1-2.5-1.5 M12 6v12`,
  // Armchair — retirement.
  'retirement-calculator': 'M5 12a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2 M4 12a2 2 0 0 1 2 2v3h12v-3a2 2 0 0 1 2-2 M6 17v3 M18 17v3',

  /* ----------------------------------------------------------------- Health */
  // Gauge with needle — body mass index reading.
  'bmi-calculator': 'M4 18a8 8 0 1 1 16 0z M12 18l4-4',
  // Flame — metabolism / calories burned at rest.
  'bmr-calculator': 'M12 3c3 3 4.5 5 4.5 8a4.5 4.5 0 0 1-9 0c0-1.4.6-2.6 1.5-3.5C9.5 8 12 6.5 12 3z',
  // Activity pulse — daily energy expenditure.
  'tdee-calculator': 'M3 12h4l2.5 7 5-14 2.5 7h4',
  // Apple — food calories.
  'calorie-calculator': 'M12 7c-2-2.5-6-1.8-6 2 0 4 3 8 6 8s6-4 6-8c0-3.8-4-4.5-6-2z M12 7V4a2 2 0 0 1 2-2',
  // Pie split — macronutrient breakdown.
  'macro-calculator': `${circle(12, 12, 9)} M12 3v9h9`,
  // Droplet — water intake.
  'water-intake-calculator': 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  // Bathroom scale with readout — ideal weight.
  'ideal-weight-calculator': 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M9 8h6 M12 8l-1 3',
  // Tape measure / body fat ratio.
  'body-fat-calculator': 'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M12 7v10 M9 10h6 M9 14h6',
  // Muscle arm / lean body mass.
  'lean-body-mass-calculator': 'M6 18h12 M9 14l3-8 3 8 M12 10h.01',
  // Barbell — 1RM max lift.
  'one-rep-max-calculator': 'M2 12h20 M6 7v10 M18 7v10 M4 9v6 M20 9v6',
  // Stopwatch — pace.
  'pace-calculator': 'M12 2v3 M10 2h4 M12 14l3-3 M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
  // Runner — running pace.
  'running-pace-calculator': 'M13 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M7 21l3-7 3 2 4 5 M17 11l-4-2-2 4 4 3 M6 13l4-2',
  // Heart with pulse — HR zones.
  'heart-rate-zone-calculator': 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z M6 11h3l1.5-3 2.5 6 2-4h3',
  // Baby stroller / calendar — due date.
  'pregnancy-due-date-calculator': 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M12 13a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  // Cycle calendar / flower — ovulation.
  'ovulation-calculator': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 3',
  // Protein shaker / container.
  'protein-intake-calculator': 'M7 4h10 M8 4v16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4 M9 9h6 M9 14h6',
  // Medical shield / kidneys — creatinine clearance.
  'creatinine-clearance-calculator': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',

  /* -------------------------------------------------------------- Education */
  // Graduation cap — GPA.
  'gpa-calculator': 'M2 10l10-5 10 5-10 5z M6 12v5c3 2 9 2 12 0v-5 M22 10v5',
  // Clipboard with check — grade.
  'grade-calculator': 'M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2 M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 M9 14l2 2 4-4',
  // Flag / target — final grade needed.
  'final-grade-calculator': 'M4 21V4 M4 4h13l-2.5 4L17 12H4',
  // Ascending bars — averaging grades.
  'average-grade-calculator': 'M3 20h18 M6 20v-5 M11 20V9 M16 20v-8',

  /* ------------------------------------------------------------------- Math */
  // Calculator device — basic arithmetic.
  'basic-calculator': 'M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M8 6h8v3H8z M8 13h.01 M12 13h.01 M16 13h.01 M8 17h.01 M12 17h.01 M16 17h.01',
  // Sigma — scientific functions.
  'scientific-calculator': 'M18 4H6l6 8-6 8h12 M16 4v2 M16 20v-2',
  // Percent — percentage math.
  'percentage-calculator': `M19 5 5 19 ${circle(7, 7, 2)} ${circle(17, 17, 2)}`,
  // Slash with numerator/denominator marks — fractions.
  'fraction-calculator': 'M17 5 7 19 M6 8h4 M14 16h4',
  // Bars with a mean line — average.
  'average-calculator': 'M4 20h16 M7 20v-5 M12 20V9 M17 20v-8 M4 13h16',
  // Exponent power icon.
  'exponent-calculator': 'M4 19L14 5 M15 5h5v5 M18 12l2 2 M18 18l2-2',
  // Logarithm icon.
  'log-calculator': 'M4 19V5 M4 19h16 M8 13c2-4 4-6 8-6',
  // Matrix grid icon.
  'matrix-calculator': 'M4 4v16 M20 4v16 M8 8h.01 M12 8h.01 M16 8h.01 M8 16h.01 M12 16h.01 M16 16h.01',
  // Determinant bars icon.
  'determinant-calculator': 'M6 4v16 M18 4v16 M9 9l6 6 M15 9l-6 6',
  // Quadratic parabola curve icon.
  'quadratic-calculator': 'M4 6c4 10 12 10 16 0 M4 12h16 M12 4v16',
  // Standard deviation bell curve icon.
  'standard-deviation-calculator': 'M3 19c4 0 6-14 9-14s5 14 9 14 M12 5v14',
  // Prime number icon.
  'prime-number-calculator': 'M4 12h16 M12 4v16 M8 8l8 8 M16 8l-8 8',
  // GCF divisor icon.
  'gcf-calculator': 'M4 6h16 M4 12h16 M4 18h16 M10 4v16',
  // LCM multiple icon.
  'lcm-calculator': 'M3 17l6-6 4 4 8-8 M13 7h8v8',
  // Permutation & Combination icon.
  'permutation-combination-calculator': 'M4 7h16 M4 17h16 M12 7v10 M7 12h10',

  /* ----------------------------------------------------------------- Salary */
  // Banknote with coin — annual salary.
  'salary-calculator': `M2 6h20v12H2z M6 6v12 M18 6v12 ${circle(12, 12, 3)}`,
  // Clock — hourly wage.
  'hourly-wage-calculator': `${circle(12, 12, 9)} M12 7v5l3 2`,
  // Receipt / pay stub — paycheck.
  'paycheck-calculator': 'M5 3h14v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L5 21z M8 8h8 M8 12h6',

  /* --------------------------------------------------------------- Shopping */
  // Price tag — discount.
  'discount-calculator': 'M20.6 13.4 13 21a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1 0-2.8L10.6 3.6a2 2 0 0 1 1.4-.6h5a2 2 0 0 1 2 2v5a2 2 0 0 1-.4 1.4z M15.5 7.5h.01',
  // Fork & knife — restaurant tip.
  'tip-calculator': 'M5 3v7a2 2 0 0 0 2 2h0 M6.5 3v18 M18 3c-1.7 0-3 1.8-3 5v4h3 M18 12v9',
  // Percent tag — sales tax.
  'sales-tax-calculator': `M9 3h6l1 5H8z M6 8h12l-1 13H7z ${circle(10, 13, 1)} ${circle(14, 17, 1)} M15 12l-6 6`,

  /* -------------------------------------------------------------- Date & Time */
  // Birthday cake — age from date of birth.
  'age-calculator': 'M12 3v3 M8 8h8a2 2 0 0 1 2 2v2H6v-2a2 2 0 0 1 2-2z M4 14h16v6H4z M4 14c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5',
  // Calendar with range dots — difference between two dates.
  'date-difference-calculator': 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M8 14h.01 M12 14h.01 M16 14h.01 M8 18h.01 M12 18h.01',
  // Briefcase — business days.
  'business-days-calculator': 'M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M3 12h18',
  // Calendar with a check — working days.
  'working-days-calculator': 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M9 16l2 2 4-4',

  /* ----------------------------------------------------------------- Travel */
  // Fuel pump — fuel cost.
  'fuel-cost-calculator': 'M3 22V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v17 M3 13h9 M15 8l3 3v7a2 2 0 0 0 3 0V10l-3-3 M18 5V3',
  // Road — mileage / distance.
  'mileage-calculator': 'M8 3 4 21 M16 3l4 18 M12 5v3 M12 11v3 M12 17v3',

  /* --------------------------------------------------- Business & Finance */
  // Receipt with percent — value added tax.
  'vat-calculator': 'M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z M9 8l6 6 M9.5 8.5h.01 M14.5 13.5h.01',
  // Segmented ring — profit margin slice of revenue.
  'margin-calculator': `${circle(12, 12, 9)} M12 3a9 9 0 0 1 7.8 4.5L12 12z`,
  // Coins with an up arrow — profit made.
  'profit-calculator': `${circle(8, 15, 4)} M14 6h6v6 M20 6l-6 6-3-3`,
  // Handshake / badge with percent — sales commission.
  'commission-calculator': `${circle(12, 8, 5)} M8 13l-2 8 6-3 6 3-2-8 M10.5 8l1 1 2-2`,
  // Tag with up arrow — markup added to cost.
  'markup-calculator': 'M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z M7 7h.01 M13 15l3-3 3 3 M16 12v6',
  // Scales — debt weighed against income.
  'debt-to-income-calculator': 'M12 3v18 M6 21h12 M3 8h18 M3 8l3 6a3 3 0 0 0 6 0M21 8l-3 6a3 3 0 0 1-6 0',
  // Crossing lines — break-even point.
  'break-even-calculator': 'M3 3v18h18 M6 18 18 6 M6 8l12 8',
  // Rising curve arrow — compound annual growth.
  'cagr-calculator': 'M3 20c4 0 6-3 9-8s5-8 9-8 M17 4h4v4',
  // Coin with a down trend — inflation eroding value.
  'inflation-calculator': `${circle(12, 8, 5)} M12 6v4 M11 8h2 M4 15l4 4 3-3 4 4 5-6 M17 18h3v-3`,
  // Circular arrow around a coin — return on investment.
  'roi-calculator': `M21 12a9 9 0 1 1-3-6.7 M21 3v4h-4 ${circle(12, 12, 3)}`,
};

/** Icon path for a calculator, or undefined if none is mapped. */
export function calculatorIcon(slug: string): string | undefined {
  return calculatorIcons[slug];
}
