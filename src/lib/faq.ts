import type { FaqItem, CategoryId } from './types';

/**
 * Homepage FAQ content. Questions are deduplicated from a large keyword set and
 * grouped into themed sections for a readable accordion. Answers are short,
 * SEO-friendly and link to the relevant on-site calculator where one exists.
 *
 * Answer strings may contain inline HTML (links). The same strings are reused
 * verbatim for the FAQPage JSON-LD so the structured data matches the page.
 */
export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export const homeFaqSections: FaqSection[] = [
  {
    title: 'Using the calculators',
    items: [
      {
        q: 'Are these online calculators free to use?',
        a: 'Yes. Every calculator on Try Online Calculator is completely free, with no sign-up, no download and no limits on how often you use it.',
      },
      {
        q: 'Are online calculators accurate?',
        a: 'Yes. Each tool uses the same standard formulas that banks, clinicians, teachers and accountants rely on, and every result page shows the formula and a worked example so you can check the math yourself.',
      },
    ],
  },
  {
    title: 'Math & percentages',
    items: [
      {
        q: 'How do I calculate percentages?',
        a: 'To find a percentage of a number, multiply the number by the percent and divide by 100 — for example, 20% of 150 is 150 × 20 ÷ 100 = 30. The <a href="/math/percentage-calculator">percentage calculator</a> does every variation for you and shows the steps.',
      },
      {
        q: 'How do I calculate percentage increase?',
        a: 'Subtract the old value from the new value, divide by the old value, then multiply by 100. For example, going from 40 to 50 is (50 − 40) ÷ 40 × 100 = 25% increase. Try the <a href="/math/percentage-calculator">percentage calculator</a>.',
      },
    ],
  },
  {
    title: 'Loans, mortgages & finance',
    items: [
      {
        q: 'How do I calculate mortgage payments?',
        a: 'A mortgage payment combines principal, interest, property tax and insurance (PITI). The <a href="/finance/mortgage-calculator">mortgage calculator</a> breaks down your full monthly payment and total interest across the loan term.',
      },
      {
        q: 'How do I calculate EMI or monthly loan payments?',
        a: 'Enter the loan amount, interest rate and term into the <a href="/finance/loan-calculator">loan calculator</a> and it returns the equated monthly instalment (EMI) plus the total interest you will pay over the life of the loan.',
      },
      {
        q: 'How do I calculate compound interest?',
        a: 'Compound interest uses A = P(1 + r/n)^(nt), where P is the principal, r the annual rate, n the times it compounds per year and t the years. The <a href="/finance/compound-interest-calculator">compound interest calculator</a> does it for you and charts the growth.',
      },
    ],
  },
  {
    title: 'Health & fitness',
    items: [
      {
        q: 'How do I calculate BMI?',
        a: 'BMI is your weight in kilograms divided by your height in metres squared (kg ÷ m²). The <a href="/health/bmi-calculator">BMI calculator</a> does the math in metric or imperial units and tells you the category.',
      },
      {
        q: 'How many calories should I eat per day?',
        a: 'Your daily calorie need equals your TDEE — the calories you burn to maintain your current weight. The <a href="/health/calorie-calculator">calorie calculator</a> estimates it and adjusts for losing, maintaining or gaining.',
      },
    ],
  },
  {
    title: 'Grades & education',
    items: [
      {
        q: 'How do I calculate my GPA?',
        a: 'Multiply each course grade by its credit hours to get grade points, add them up and divide by the total credits. The <a href="/education/gpa-calculator">GPA calculator</a> does this weighted average for you.',
      },
    ],
  },
  {
    title: 'Dates & time',
    items: [
      {
        q: 'How do I calculate my age?',
        a: 'Subtract your birth date from today\u2019s date to get your age in years, months and days. The <a href="/date-time/age-calculator">age calculator</a> handles leap years and month lengths automatically.',
      },
      {
        q: 'How do I calculate days between two dates?',
        a: 'Count the number of calendar days from the earlier date to the later one. The <a href="/date-time/date-difference-calculator">date difference calculator</a> returns the exact number of days, weeks and months between two dates.',
      },
    ],
  },
  {
    title: 'Shopping & tips',
    items: [
      {
        q: 'How do I calculate discounts?',
        a: 'Multiply the price by the discount percentage and subtract it from the original price — 25% off $80 saves $20, leaving $60. The <a href="/shopping/discount-calculator">discount calculator</a> shows the sale price and how much you save.',
      },
      {
        q: 'How much should I tip?',
        a: 'In the US, 15–20% of the pre-tax bill is customary for good table service, with 18% a common default. The <a href="/shopping/tip-calculator">tip calculator</a> works out the tip and the split per person.',
      },
    ],
  },
];

/** Flattened list of every FAQ item, used to build the FAQPage JSON-LD. */
export const homeFaqItems: FaqItem[] = homeFaqSections.flatMap((s) => s.items);

/**
 * Per-category FAQ blocks for the category hub pages (/finance, /health, …).
 * Each set targets category-level "People Also Ask" queries and links to the
 * most relevant tools in that category. Answers may contain inline HTML links
 * and are reused verbatim for the page's FAQPage JSON-LD.
 */
export const categoryFaqs: Record<CategoryId, FaqItem[]> = {
  finance: [
    {
      q: 'What are financial calculators used for?',
      a: 'Financial calculators turn everyday money questions into clear numbers — a monthly loan payment, the interest on a savings pot, or the future value of an investment. Start with the <a href="/finance/mortgage-calculator">mortgage calculator</a>, <a href="/finance/loan-calculator">loan calculator</a> or <a href="/finance/investment-calculator">investment calculator</a>.',
    },
    {
      q: 'Which finance calculator should I use for a home loan?',
      a: 'Use the <a href="/finance/mortgage-calculator">mortgage calculator</a> to estimate a full monthly payment including principal, interest, tax and insurance, and the <a href="/finance/loan-calculator">loan calculator</a> for the EMI and total interest on any other loan.',
    },
    {
      q: 'How do I calculate how much interest I will pay or earn?',
      a: 'The <a href="/finance/interest-calculator">interest calculator</a> handles both simple and compound interest, while the <a href="/finance/compound-interest-calculator">compound interest calculator</a> shows how a balance grows as interest is added and then earns interest of its own.',
    },
    {
      q: 'Are these finance calculators free and accurate?',
      a: 'Yes. Every finance tool is free with no sign-up, runs entirely in your browser, and uses the same standard amortization and interest formulas that banks and lenders rely on. Each result page shows the formula and a worked example.',
    },
    {
      q: 'Can I use these tools for retirement and investment planning?',
      a: 'Yes. The <a href="/finance/investment-calculator">investment calculator</a> projects growth from a lump sum and monthly contributions, and the <a href="/finance/retirement-calculator">retirement calculator</a> estimates whether your savings rate is on track for your goal.',
    },
  ],
  health: [
    {
      q: 'What health calculators are available here?',
      a: 'You can check your <a href="/health/bmi-calculator">BMI</a>, estimate daily calories with the <a href="/health/calorie-calculator">calorie calculator</a> and <a href="/health/tdee-calculator">TDEE calculator</a>, set nutrition targets with the <a href="/health/macro-calculator">macro calculator</a>, and find your <a href="/health/water-intake-calculator">daily water intake</a>.',
    },
    {
      q: 'How do I calculate my BMI?',
      a: 'BMI is your weight in kilograms divided by your height in metres squared (kg ÷ m²). The <a href="/health/bmi-calculator">BMI calculator</a> works in metric or imperial units and tells you which category you fall into.',
    },
    {
      q: 'How many calories should I eat per day?',
      a: 'Your daily need equals your total daily energy expenditure (TDEE). Find it with the <a href="/health/tdee-calculator">TDEE calculator</a>, then set a target for losing, maintaining or gaining weight using the <a href="/health/calorie-calculator">calorie calculator</a>.',
    },
    {
      q: 'Are these health calculators a substitute for medical advice?',
      a: 'No. These tools give general estimates using well-established formulas for information only. They are not medical advice — always consult a qualified healthcare professional before making health decisions.',
    },
    {
      q: 'How much water should I drink each day?',
      a: 'Daily water needs depend on your body weight, activity level and climate, but a common guide is around 2–3 litres. The <a href="/health/water-intake-calculator">water intake calculator</a> gives you a personalised target.',
    },
  ],
  education: [
    {
      q: 'What education calculators can I use?',
      a: 'Track your grades with the <a href="/education/gpa-calculator">GPA calculator</a>, score a test or assignment with the <a href="/education/grade-calculator">grade calculator</a>, and work out the mark you still need with the <a href="/education/final-grade-calculator">final grade calculator</a>.',
    },
    {
      q: 'How do I calculate my GPA?',
      a: 'Multiply each course grade by its credit hours to get grade points, add them up, and divide by the total credits. The <a href="/education/gpa-calculator">GPA calculator</a> does this weighted average automatically.',
    },
    {
      q: 'What grade do I need on my final exam?',
      a: 'Enter your current grade, its weight and your target into the <a href="/education/final-grade-calculator">final grade calculator</a> and it tells you exactly what score you need on the final to hit your goal.',
    },
    {
      q: 'How do I convert points into a percentage and letter grade?',
      a: 'Divide the points you scored by the total possible, then multiply by 100. The <a href="/education/grade-calculator">grade calculator</a> converts scores into a percentage and letter grade and can weight several assessments together.',
    },
    {
      q: 'Are these education calculators free to use?',
      a: 'Yes. Every education tool is completely free with no sign-up or download, and works instantly in your browser on any device.',
    },
  ],
  math: [
    {
      q: 'What math calculators are available?',
      a: 'Use the <a href="/math/basic-calculator">basic calculator</a> for quick sums, the <a href="/math/scientific-calculator">scientific calculator</a> for advanced functions, and dedicated <a href="/math/percentage-calculator">percentage</a>, <a href="/math/fraction-calculator">fraction</a> and <a href="/math/average-calculator">average</a> calculators that show every step.',
    },
    {
      q: 'How do I calculate a percentage?',
      a: 'Multiply the number by the percent and divide by 100 — 20% of 150 is 150 × 20 ÷ 100 = 30. The <a href="/math/percentage-calculator">percentage calculator</a> also handles percentage change and "what percent of" problems.',
    },
    {
      q: 'When should I use a scientific calculator?',
      a: 'Use the <a href="/math/scientific-calculator">scientific calculator</a> for trigonometry, logarithms, exponents, roots and constants like pi — anything beyond basic add, subtract, multiply and divide.',
    },
    {
      q: 'How do I add, simplify or convert fractions?',
      a: 'The <a href="/math/fraction-calculator">fraction calculator</a> adds, subtracts, multiplies and divides fractions, reduces them to lowest terms, and converts between fractions and decimals — showing the working each time.',
    },
    {
      q: 'How do I find an average?',
      a: 'Add all the values and divide by how many there are. The <a href="/math/average-calculator">average calculator</a> also reports the median and range of your data set.',
    },
  ],
  salary: [
    {
      q: 'What can salary calculators help me with?',
      a: 'Convert between hourly, weekly, monthly and annual pay with the <a href="/salary/salary-calculator">salary calculator</a>, estimate take-home pay with the <a href="/salary/paycheck-calculator">paycheck calculator</a>, and work out earnings from an hourly rate with the <a href="/salary/hourly-wage-calculator">hourly wage calculator</a>.',
    },
    {
      q: 'How do I calculate my take-home pay?',
      a: 'Subtract income tax and other deductions from your gross pay. The <a href="/salary/paycheck-calculator">paycheck calculator</a> estimates your net salary after tax so you know what actually lands in your account.',
    },
    {
      q: 'How do I convert an hourly wage to an annual salary?',
      a: 'Multiply your hourly rate by the hours you work per week and then by 52 weeks. The <a href="/salary/salary-calculator">salary calculator</a> converts between hourly, weekly, monthly and yearly pay in one step.',
    },
    {
      q: 'How is overtime pay calculated?',
      a: 'Overtime is usually paid at 1.5 times your normal hourly rate for hours beyond your standard week. Work out your base rate first with the <a href="/salary/hourly-wage-calculator">hourly wage calculator</a>.',
    },
    {
      q: 'Are these salary calculators free?',
      a: 'Yes. Every salary tool is free with no sign-up, and your figures stay on your device because all calculations run in your browser.',
    },
  ],
  shopping: [
    {
      q: 'What shopping calculators can I use?',
      a: 'Work out sale prices with the <a href="/shopping/discount-calculator">discount calculator</a>, split a bill and add gratuity with the <a href="/shopping/tip-calculator">tip calculator</a>, and add tax to a purchase with the <a href="/shopping/sales-tax-calculator">sales tax calculator</a>.',
    },
    {
      q: 'How do I calculate a discount?',
      a: 'Multiply the price by the discount percentage and subtract it from the original — 25% off $80 saves $20, leaving $60. The <a href="/shopping/discount-calculator">discount calculator</a> shows the sale price and your saving.',
    },
    {
      q: 'How much should I tip?',
      a: 'In the US, 15–20% of the pre-tax bill is customary, with 18% a common default. The <a href="/shopping/tip-calculator">tip calculator</a> works out the tip and splits the total between any number of people.',
    },
    {
      q: 'How do I calculate sales tax on a purchase?',
      a: 'Multiply the price by the sales tax rate and add it to the total. The <a href="/shopping/sales-tax-calculator">sales tax calculator</a> shows the tax amount and the final price you will pay.',
    },
    {
      q: 'Are these shopping calculators free to use?',
      a: 'Yes. Every shopping tool is free with no sign-up and works instantly in your browser on phones and desktops.',
    },
  ],
  'date-time': [
    {
      q: 'What date and time calculators are available?',
      a: 'Find your exact age with the <a href="/date-time/age-calculator">age calculator</a>, measure the gap between two dates with the <a href="/date-time/date-difference-calculator">date difference calculator</a>, and count weekdays with the <a href="/date-time/business-days-calculator">business days</a> and <a href="/date-time/working-days-calculator">working days</a> calculators.',
    },
    {
      q: 'How old am I exactly?',
      a: 'Enter your date of birth into the <a href="/date-time/age-calculator">age calculator</a> and it returns your exact age in years, months and days, handling leap years and month lengths automatically.',
    },
    {
      q: 'How many days are between two dates?',
      a: 'Enter a start and end date into the <a href="/date-time/date-difference-calculator">date difference calculator</a> and it counts the total days, weeks, months and years between them.',
    },
    {
      q: 'How do I count business or working days?',
      a: 'The <a href="/date-time/business-days-calculator">business days calculator</a> and <a href="/date-time/working-days-calculator">working days calculator</a> count only the weekdays between two dates, skipping weekends.',
    },
    {
      q: 'Are these date calculators free?',
      a: 'Yes. Every date and time tool is free with no sign-up, and all calculations happen in your browser so nothing is sent to a server.',
    },
  ],
  travel: [
    {
      q: 'What travel calculators can I use?',
      a: 'Estimate the fuel cost of a journey with the <a href="/travel/fuel-cost-calculator">fuel cost calculator</a>, and convert distance and fuel figures with the <a href="/unit-converter">unit converter</a>.',
    },
    {
      q: 'How do I calculate the fuel cost of a trip?',
      a: 'Divide the trip distance by your vehicle\u2019s fuel economy to get the fuel used, then multiply by the price per unit. The <a href="/travel/fuel-cost-calculator">fuel cost calculator</a> does it for you.',
    },
    {
      q: 'How do I convert between miles and kilometres?',
      a: 'Multiply miles by 1.609 to get kilometres, or kilometres by 0.621 to get miles. The <a href="/unit-converter/length">length converter</a> handles this instantly.',
    },
    {
      q: 'Can I split fuel costs between passengers?',
      a: 'Yes — work out the total fuel cost with the <a href="/travel/fuel-cost-calculator">fuel cost calculator</a>, then divide it by the number of travellers to get each person\u2019s share.',
    },
    {
      q: 'Are these travel calculators free to use?',
      a: 'Yes. Every travel tool is free with no sign-up and runs entirely in your browser, on any device.',
    },
  ],
};

/** FAQ block for the unit converter hub (/unit-converter). */
export const unitConverterFaqs: FaqItem[] = [
  {
    q: 'What is a unit converter?',
    a: 'A unit converter changes a measurement from one unit to another — such as kilometres to miles or kilograms to pounds — by multiplying by the correct conversion factor. This hub has a dedicated converter for <a href="/unit-converter/length">length</a>, <a href="/unit-converter/weight">weight</a>, <a href="/unit-converter/temperature">temperature</a>, <a href="/unit-converter/speed">speed</a>, <a href="/unit-converter/volume">volume</a>, <a href="/unit-converter/area">area</a> and <a href="/unit-converter/currency">currency</a>.',
  },
  {
    q: 'How do I convert between metric and imperial units?',
    a: 'Pick the converter for your measurement type, enter a value, and choose the units to convert from and to. The result updates instantly using exact conversion factors — no maths required.',
  },
  {
    q: 'Are the conversions accurate?',
    a: 'Yes. Each converter uses standard, published conversion factors and shows a reference table of the exact factors it applies, so you can check any result yourself.',
  },
  {
    q: 'How do I convert kg to pounds or Celsius to Fahrenheit?',
    a: 'Use the <a href="/unit-converter/weight">weight converter</a> for kilograms and pounds, and the <a href="/unit-converter/temperature">temperature converter</a> for Celsius, Fahrenheit and Kelvin. Both convert in either direction as you type.',
  },
  {
    q: 'Is the unit converter free and private?',
    a: 'Yes. Every converter is free with no sign-up, and all conversions run in your browser, so the values you enter never leave your device.',
  },
];
