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

// ---------------------------------------------------------------------------
// German homepage FAQ — SEO-optimised for German-language search queries.
// Links point to /de/ locale-prefixed paths.
// ---------------------------------------------------------------------------
const homeFaqSectionsDe: FaqSection[] = [
  {
    title: 'Nutzung der Rechner',
    items: [
      {
        q: 'Sind diese Online-Rechner kostenlos?',
        a: 'Ja. Jeder Rechner auf Try Online Calculator ist völlig kostenlos — ohne Anmeldung, ohne Download und ohne Nutzungslimits.',
      },
      {
        q: 'Sind Online-Rechner genau?',
        a: 'Ja. Jedes Tool verwendet die gleichen Standardformeln, auf die Banken, Ärzte, Lehrer und Buchhalter vertrauen. Jede Ergebnisseite zeigt die Formel und ein Rechenbeispiel, damit Sie das Ergebnis selbst prüfen können.',
      },
    ],
  },
  {
    title: 'Mathematik & Prozentrechnung',
    items: [
      {
        q: 'Wie berechne ich Prozentsätze?',
        a: 'Multiplizieren Sie die Zahl mit dem Prozentsatz und teilen Sie durch 100 — zum Beispiel: 20 % von 150 = 150 × 20 ÷ 100 = 30. Der <a href="/de/mathematik/prozentrechner">Prozentrechner</a> erledigt alle Varianten und zeigt die Schritte.',
      },
      {
        q: 'Wie berechne ich eine prozentuale Steigerung?',
        a: 'Ziehen Sie den alten Wert vom neuen ab, teilen Sie durch den alten Wert und multiplizieren Sie mit 100. Beispiel: Von 40 auf 50 ergibt (50 − 40) ÷ 40 × 100 = 25 % Steigerung. Nutzen Sie den <a href="/de/mathematik/prozentrechner">Prozentrechner</a>.',
      },
    ],
  },
  {
    title: 'Kredite, Hypotheken & Finanzen',
    items: [
      {
        q: 'Wie berechne ich Hypothekenzahlungen?',
        a: 'Eine Hypothekenzahlung setzt sich aus Tilgung, Zinsen, Grundsteuer und Versicherung zusammen. Der <a href="/de/finanzen/hypothekenrechner">Hypothekenrechner</a> schlüsselt Ihre monatliche Rate und die Gesamtzinsen über die Laufzeit auf.',
      },
      {
        q: 'Wie berechne ich EMI oder monatliche Kreditraten?',
        a: 'Geben Sie Kreditbetrag, Zinssatz und Laufzeit in den <a href="/de/finanzen/kreditrechner">Kreditrechner</a> ein — er liefert die monatliche Rate (EMI) und die Gesamtzinsen über die Laufzeit.',
      },
      {
        q: 'Wie berechne ich Zinseszins?',
        a: 'Zinseszins nutzt die Formel A = P(1 + r/n)^(nt), wobei P das Kapital, r der Jahreszins, n die Zinsperioden pro Jahr und t die Jahre sind. Der <a href="/de/finanzen/zinseszinsrechner">Zinseszinsrechner</a> erledigt die Berechnung und zeigt das Wachstum grafisch.',
      },
    ],
  },
  {
    title: 'Gesundheit & Fitness',
    items: [
      {
        q: 'Wie berechne ich meinen BMI?',
        a: 'Der BMI ist Ihr Gewicht in Kilogramm geteilt durch das Quadrat Ihrer Körpergröße in Metern (kg ÷ m²). Der <a href="/de/gesundheit/bmi-rechner">BMI-Rechner</a> rechnet in metrischen oder imperialen Einheiten und zeigt die Kategorie an.',
      },
      {
        q: 'Wie viele Kalorien sollte ich pro Tag essen?',
        a: 'Ihr täglicher Kalorienbedarf entspricht Ihrem TDEE — den Kalorien, die Sie verbrennen, um Ihr aktuelles Gewicht zu halten. Der <a href="/de/gesundheit/kalorienrechner">Kalorienrechner</a> schätzt diesen Wert und passt ihn für Ab-, Zunehmen oder Halten an.',
      },
    ],
  },
  {
    title: 'Noten & Bildung',
    items: [
      {
        q: 'Wie berechne ich meinen Notendurchschnitt (GPA)?',
        a: 'Multiplizieren Sie jede Kursnote mit den Kreditstunden, addieren Sie die Notenpunkte und teilen Sie durch die Gesamtkredits. Der <a href="/de/bildung/gpa-rechner">GPA-Rechner</a> berechnet diesen gewichteten Durchschnitt für Sie.',
      },
    ],
  },
  {
    title: 'Datum & Zeit',
    items: [
      {
        q: 'Wie berechne ich mein Alter?',
        a: 'Ziehen Sie Ihr Geburtsdatum vom heutigen Datum ab, um Ihr Alter in Jahren, Monaten und Tagen zu erhalten. Der <a href="/de/datum-zeit/altersrechner">Altersrechner</a> berücksichtigt Schaltjahre und unterschiedliche Monatslängen automatisch.',
      },
      {
        q: 'Wie berechne ich die Tage zwischen zwei Daten?',
        a: 'Zählen Sie die Kalendertage vom früheren zum späteren Datum. Der <a href="/de/datum-zeit/datumsrechner">Datumsrechner</a> gibt die genaue Anzahl der Tage, Wochen und Monate zwischen zwei Daten zurück.',
      },
    ],
  },
  {
    title: 'Einkaufen & Trinkgeld',
    items: [
      {
        q: 'Wie berechne ich Rabatte?',
        a: 'Multiplizieren Sie den Preis mit dem Rabattprozentsatz und ziehen Sie das Ergebnis vom Originalpreis ab — 25 % Rabatt auf 80 € spart 20 €, Endpreis 60 €. Der <a href="/de/einkaufen/rabattrechner">Rabattrechner</a> zeigt den Verkaufspreis und Ihre Ersparnis.',
      },
      {
        q: 'Wie viel Trinkgeld sollte ich geben?',
        a: 'In Deutschland sind 5–10 % des Rechnungsbetrags bei gutem Service üblich. Der <a href="/de/einkaufen/trinkgeldrechner">Trinkgeldrechner</a> berechnet den Betrag und teilt die Summe pro Person auf.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Locale-indexed FAQ map + accessor
// ---------------------------------------------------------------------------
const homeFaqByLocale: Record<string, FaqSection[]> = {
  de: homeFaqSectionsDe,
};

/**
 * Return homepage FAQ sections for the given locale.
 * Falls back to English when no translation exists.
 */
export function getHomeFaqSections(locale: string): FaqSection[] {
  return homeFaqByLocale[locale] ?? homeFaqSections;
}

/**
 * Return the flat FAQ items list for a given locale (used for JSON-LD).
 */
export function getHomeFaqItems(locale: string): FaqItem[] {
  return getHomeFaqSections(locale).flatMap((s) => s.items);
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

/**
 * Per-category FAQ blocks for localized category pages.
 * Keyed by locale, then by category ID.
 */
export const categoryFaqsByLocale: Record<string, Partial<Record<CategoryId, FaqItem[]>>> = {
  de: {
    finance: [
      {
        q: 'Wofür werden Finanzrechner verwendet?',
        a: 'Finanzrechner verwandeln alltägliche Geldfragen in klare Zahlen — eine monatliche Kreditrate, die Zinsen auf ein Sparkonto oder den zukünftigen Wert einer Geldanlage. Starten Sie mit dem <a href="/de/finanzen/hypothekenrechner">Hypothekenrechner</a>, <a href="/de/finanzen/kreditrechner">Kreditrechner</a> oder <a href="/de/finanzen/anlagerechner">Anlagerechner</a>.',
      },
      {
        q: 'Welchen Finanzrechner sollte ich für eine Immobilienfinanzierung nutzen?',
        a: 'Verwenden Sie den <a href="/de/finanzen/hypothekenrechner">Hypothekenrechner</a>, um eine vollständige monatliche Rate inklusive Tilgung, Zinsen, Steuer und Versicherung zu schätzen, und den <a href="/de/finanzen/kreditrechner">Kreditrechner</a> für die monatliche Rate und Gesamtzinsen bei jedem anderen Darlehen.',
      },
      {
        q: 'Wie berechne ich, wie viel Zinsen ich zahle oder verdiene?',
        a: 'Der <a href="/de/finanzen/zinsrechner">Zinsrechner</a> berechnet sowohl einfache als auch Zinseszinsen, während der <a href="/de/finanzen/zinseszinsrechner">Zinseszinsrechner</a> zeigt, wie ein Guthaben wächst, wenn Zinsen auf bereits erwirtschaftete Zinsen berechnet werden.',
      },
      {
        q: 'Sind diese Finanzrechner kostenlos und genau?',
        a: 'Ja. Alle Finanztools sind kostenlos ohne Anmeldung, laufen vollständig in Ihrem Browser und verwenden die gleichen Standard-Tilgungs- und Zinsformeln, auf die Banken und Kreditgeber vertrauen. Jede Ergebnisseite zeigt die verwendete Formel und ein Rechenbeispiel.',
      },
      {
        q: 'Kann ich diese Tools für die Altersvorsorge und Anlageplanung nutzen?',
        a: 'Ja. Der <a href="/de/finanzen/anlagerechner">Anlagerechner</a> projiziert das Wachstum aus einer Einmalanlage und monatlichen Beiträgen, und der <a href="/de/finanzen/rentenrechner">Rentenrechner</a> zeigt, ob Ihre Sparrate auf dem richtigen Weg zu Ihrem Ziel ist.',
      },
      {
        q: 'Wie berechne ich die monatliche Rate für einen Autokredit?',
        a: 'Nutzen Sie den <a href="/de/finanzen/autokredit-rechner">Autokredit-Rechner</a> für eine vollständige Berechnung mit Anzahlung, Inzahlungnahme und Steuer, oder den <a href="/de/finanzen/kfz-ratenrechner">Autoraten-Rechner</a>, wenn Sie den Finanzierungsbetrag bereits kennen.',
      },
    ],
  },
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

/** German FAQ block for the unit converter hub (/de/einheitenumrechner). */
export const unitConverterFaqsDe: FaqItem[] = [
  {
    q: 'Was ist ein Einheitenumrechner?',
    a: 'Ein Einheitenumrechner wandelt eine Messung von einer Einheit in eine andere um — etwa Kilometer in Meilen oder Kilogramm in Pfund — durch Multiplikation mit dem korrekten Umrechnungsfaktor. Diese Seite bietet eigene Umrechner für <a href="/de/einheitenumrechner/laenge">Länge</a>, <a href="/de/einheitenumrechner/gewicht">Gewicht</a>, <a href="/de/einheitenumrechner/temperatur">Temperatur</a>, <a href="/de/einheitenumrechner/geschwindigkeit">Geschwindigkeit</a>, <a href="/de/einheitenumrechner/volumen">Volumen</a>, <a href="/de/einheitenumrechner/flaeche">Fläche</a> und <a href="/de/einheitenumrechner/waehrung">Währung</a>.',
  },
  {
    q: 'Wie rechne ich zwischen metrischen und imperialen Einheiten um?',
    a: 'Wählen Sie den Umrechner für Ihren Messtyp, geben Sie einen Wert ein und wählen Sie die Ausgangs- und Zieleinheit. Das Ergebnis wird sofort mit exakten Umrechnungsfaktoren angezeigt — keine eigene Berechnung nötig.',
  },
  {
    q: 'Sind die Umrechnungen genau?',
    a: 'Ja. Jeder Umrechner verwendet offizielle, veröffentlichte Umrechnungsfaktoren und zeigt eine Referenztabelle der exakten Faktoren an, sodass Sie jedes Ergebnis selbst überprüfen können.',
  },
  {
    q: 'Wie rechne ich kg in Pfund oder Celsius in Fahrenheit um?',
    a: 'Verwenden Sie den <a href="/de/einheitenumrechner/gewicht">Gewichtsumrechner</a> für Kilogramm und Pfund und den <a href="/de/einheitenumrechner/temperatur">Temperaturumrechner</a> für Celsius, Fahrenheit und Kelvin. Beide rechnen in beide Richtungen um, während Sie tippen.',
  },
  {
    q: 'Ist der Einheitenumrechner kostenlos und privat?',
    a: 'Ja. Jeder Umrechner ist kostenlos ohne Anmeldung und alle Umrechnungen laufen in Ihrem Browser — Ihre Eingaben verlassen nie Ihr Gerät.',
  },
];

/**
 * Return the unit converter hub FAQs for a given locale.
 */
export function getUnitConverterFaqs(locale: string): FaqItem[] {
  if (locale === 'de') return unitConverterFaqsDe;
  return unitConverterFaqs;
}
