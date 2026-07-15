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
    title: 'About online calculators',
    items: [
      {
        q: 'What is a calculator?',
        a: 'A calculator is a tool that performs arithmetic and other mathematical operations for you. An <a href="/math/basic-calculator">online calculator</a> does the same thing in your browser, with no app to install, so you can add, subtract, multiply, divide and run more advanced formulas instantly.',
      },
      {
        q: 'How do online calculators work?',
        a: 'Every calculator here runs entirely in your browser using JavaScript. You type your numbers, the tool applies a fixed, documented formula, and the result updates immediately. Nothing is sent to a server, so your inputs stay private on your device.',
      },
      {
        q: 'Are online calculators accurate?',
        a: 'Yes. Each tool uses the same standard formulas that banks, clinicians, teachers and accountants rely on, and every result page shows the formula and a worked example so you can check the math yourself.',
      },
      {
        q: 'Which calculator should I use?',
        a: 'Pick the calculator that matches your goal: <a href="/finance">finance</a> tools for loans and investing, <a href="/health">health</a> tools for BMI and calories, <a href="/education">education</a> tools for grades and GPA, and <a href="/math">math</a> tools for everyday sums. Use the search box at the top of the page to jump straight to one.',
      },
      {
        q: 'What is the best online calculator?',
        a: 'The best online calculator is the one built for your exact task. A general <a href="/math/basic-calculator">basic calculator</a> handles quick sums, a <a href="/math/scientific-calculator">scientific calculator</a> handles advanced math, and dedicated tools like the <a href="/finance/mortgage-calculator">mortgage</a> or <a href="/health/bmi-calculator">BMI</a> calculators give you a full, explained answer in one step.',
      },
      {
        q: 'Can I use a calculator for free?',
        a: 'Yes. Every calculator on Try Online Calculator is completely free, with no sign-up, no download and no limits on how often you use it.',
      },
      {
        q: 'When should I use a scientific calculator?',
        a: 'Use a <a href="/math/scientific-calculator">scientific calculator</a> when you need trigonometry, logarithms, exponents, square roots, powers or constants like pi — anything beyond the basic add, subtract, multiply and divide operations.',
      },
      {
        q: 'When should I use a graphing calculator?',
        a: 'A graphing calculator is designed to plot equations and visualise functions, so it is most useful in algebra, calculus and statistics coursework. For numeric answers to trigonometry, logarithm and power problems, our <a href="/math/scientific-calculator">scientific calculator</a> covers the calculation side.',
      },
    ],
  },
  {
    title: 'Percentages, fractions & math',
    items: [
      {
        q: 'How do I calculate percentages?',
        a: 'To find a percentage of a number, multiply the number by the percent and divide by 100 — for example, 20% of 150 is 150 × 20 ÷ 100 = 30. The <a href="/math/percentage-calculator">percentage calculator</a> does every variation for you and shows the steps.',
      },
      {
        q: 'How do I calculate percentages between two numbers?',
        a: 'Divide the difference between the two numbers by the original number, then multiply by 100. The <a href="/math/percentage-calculator">percentage calculator</a> works out "what percent of" and "percent difference" automatically.',
      },
      {
        q: 'How do I calculate percentage increase?',
        a: 'Subtract the old value from the new value, divide by the old value, then multiply by 100. For example, going from 40 to 50 is (50 − 40) ÷ 40 × 100 = 25% increase. Try the <a href="/math/percentage-calculator">percentage calculator</a>.',
      },
      {
        q: 'How do I calculate percentage decrease?',
        a: 'Subtract the new value from the old value, divide by the old value, then multiply by 100. A drop from 50 to 40 is (50 − 40) ÷ 50 × 100 = 20% decrease. The <a href="/math/percentage-calculator">percentage calculator</a> handles it in one click.',
      },
      {
        q: 'How do I calculate fractions?',
        a: 'To add or subtract fractions, give them a common denominator first; to multiply, multiply the numerators and denominators; to divide, flip the second fraction and multiply. The <a href="/math/fraction-calculator">fraction calculator</a> adds, subtracts, multiplies and divides fractions and shows the working.',
      },
      {
        q: 'How do I simplify fractions?',
        a: 'Divide the numerator and denominator by their greatest common divisor. For example, 8/12 simplifies to 2/3. The <a href="/math/fraction-calculator">fraction calculator</a> reduces any fraction to its lowest terms.',
      },
      {
        q: 'How do I convert fractions to decimals?',
        a: 'Divide the numerator by the denominator — 3/4 becomes 3 ÷ 4 = 0.75. The <a href="/math/fraction-calculator">fraction calculator</a> converts between fractions and decimals for you.',
      },
      {
        q: 'How do I calculate square roots?',
        a: 'A square root is the number that, multiplied by itself, gives the original value — the square root of 25 is 5. Use the <a href="/math/scientific-calculator">scientific calculator</a> to find the square root of any number instantly.',
      },
      {
        q: 'How do I calculate exponents?',
        a: 'An exponent tells you how many times to multiply a number by itself, so 2 to the power of 3 is 2 × 2 × 2 = 8. Enter the base and power on the <a href="/math/scientific-calculator">scientific calculator</a> to compute exponents and powers.',
      },
      {
        q: 'How do I calculate logarithms?',
        a: 'A logarithm answers "what power do I raise the base to?" — log base 10 of 1000 is 3 because 10³ = 1000. The <a href="/math/scientific-calculator">scientific calculator</a> supports both log (base 10) and natural log (ln).',
      },
      {
        q: 'How do I calculate averages?',
        a: 'Add all the values together, then divide by how many values there are. For 4, 8 and 12, the average is (4 + 8 + 12) ÷ 3 = 8. The <a href="/math/average-calculator">average calculator</a> also finds the median and range.',
      },
      {
        q: 'How do I calculate standard deviation?',
        a: 'Find the mean, subtract it from each value and square the result, average those squared differences, then take the square root. The <a href="/math/average-calculator">average calculator</a> reports the mean and spread of your data set.',
      },
      {
        q: 'How do I calculate probability?',
        a: 'Divide the number of favourable outcomes by the total number of possible outcomes. Rolling a 6 on one die is 1 ÷ 6 ≈ 0.167, or about 16.7%. Use the <a href="/math/percentage-calculator">percentage calculator</a> to express any probability as a percentage.',
      },
      {
        q: 'What is a percentage calculator?',
        a: 'A <a href="/math/percentage-calculator">percentage calculator</a> works out percentages of a number, percentage change and "what percent of" problems, showing each step so you can learn the method as well as the answer.',
      },
      {
        q: 'What is a scientific calculator?',
        a: 'A <a href="/math/scientific-calculator">scientific calculator</a> extends a basic calculator with trigonometry, logarithms, exponents, roots, factorials and constants like pi and e — the functions students and engineers need.',
      },
      {
        q: 'What is a graphing calculator?',
        a: 'A graphing calculator plots equations and functions on a coordinate grid so you can see their shape, roots and intersections. It is popular in algebra and calculus classes; for the underlying calculations, use our <a href="/math/scientific-calculator">scientific calculator</a>.',
      },
    ],
  },
  {
    title: 'Loans, mortgages & finance',
    items: [
      {
        q: 'How do I calculate compound interest?',
        a: 'Compound interest uses A = P(1 + r/n)^(nt), where P is the principal, r the annual rate, n the times it compounds per year and t the years. The <a href="/finance/compound-interest-calculator">compound interest calculator</a> does it for you and charts the growth.',
      },
      {
        q: 'How do I calculate simple interest?',
        a: 'Simple interest is Principal × Rate × Time (I = P × r × t), with the rate as a decimal. £1,000 at 5% for 3 years earns £150. The <a href="/finance/interest-calculator">interest calculator</a> handles both simple and compound interest.',
      },
      {
        q: 'How do I calculate EMI?',
        a: 'An EMI (equated monthly instalment) is found with the loan amortization formula using the principal, monthly rate and number of months. The <a href="/finance/loan-calculator">loan calculator</a> computes your EMI and total interest instantly.',
      },
      {
        q: 'How do I calculate loan EMI?',
        a: 'Enter the loan amount, interest rate and term into the <a href="/finance/loan-calculator">loan calculator</a> and it returns the equated monthly instalment (EMI) plus the total interest you will pay over the life of the loan.',
      },
      {
        q: 'How do I calculate monthly loan payments?',
        a: 'Monthly payments depend on the principal, interest rate and loan term. The <a href="/finance/loan-calculator">loan calculator</a> applies the standard amortization formula and shows your monthly payment and payoff total.',
      },
      {
        q: 'How do I calculate mortgage payments?',
        a: 'A mortgage payment combines principal, interest, property tax and insurance (PITI). The <a href="/finance/mortgage-calculator">mortgage calculator</a> breaks down your full monthly payment and total interest across the loan term.',
      },
      {
        q: 'How do I calculate investment returns?',
        a: 'Compare the ending value with the amount you invested, then annualise it over the holding period. The <a href="/finance/investment-calculator">investment calculator</a> projects growth from a lump sum and regular contributions.',
      },
      {
        q: 'How do I calculate SIP returns?',
        a: 'A SIP (systematic investment plan) invests a fixed amount each month, and returns compound on every contribution. The <a href="/finance/investment-calculator">investment calculator</a> works as an SIP calculator by projecting the future value of monthly deposits.',
      },
      {
        q: 'How do I calculate retirement savings?',
        a: 'Combine your current savings, monthly contributions and an expected return over the years until retirement. The <a href="/finance/retirement-calculator">retirement calculator</a> estimates the nest egg you are on track to build.',
      },
      {
        q: 'How do I calculate credit card interest?',
        a: 'Credit card interest is charged on your balance using the daily periodic rate (APR ÷ 365) applied to each day of the billing cycle. Use the <a href="/finance/interest-calculator">interest calculator</a> to estimate the interest on a carried balance.',
      },
      {
        q: 'How do I calculate tax?',
        a: 'Multiply the taxable amount by the applicable tax rate. For a purchase, the <a href="/shopping/sales-tax-calculator">sales tax calculator</a> adds sales tax to a price; for pay, the <a href="/salary/paycheck-calculator">paycheck calculator</a> estimates tax withheld from your income.',
      },
      {
        q: 'How do I calculate salary after tax?',
        a: 'Subtract income tax and other deductions from your gross pay to get take-home pay. The <a href="/salary/paycheck-calculator">paycheck calculator</a> estimates your net salary after tax.',
      },
      {
        q: 'How do I calculate profit margin?',
        a: 'Profit margin is profit divided by revenue, times 100. If you sell for $120 at a $30 profit, the margin is 30 ÷ 120 × 100 = 25%. The <a href="/math/percentage-calculator">percentage calculator</a> makes this quick.',
      },
      {
        q: 'How much house can I afford?',
        a: 'A common guide is to keep your total housing payment under about 28% of your gross monthly income. Use the <a href="/finance/mortgage-calculator">mortgage calculator</a> to test a home price, down payment and rate against a payment you are comfortable with.',
      },
      {
        q: 'How much mortgage can I afford?',
        a: 'Lenders typically look for a housing payment near 28% of gross income and total debts under about 36%. Enter different loan amounts in the <a href="/finance/mortgage-calculator">mortgage calculator</a> to find a monthly payment that fits your budget.',
      },
      {
        q: 'How much rent can I afford?',
        a: 'A widely used rule is to spend no more than 30% of your gross monthly income on rent. Estimate your take-home pay with the <a href="/salary/paycheck-calculator">paycheck calculator</a>, then set your rent ceiling from there.',
      },
      {
        q: 'How much loan can I qualify for?',
        a: 'Your borrowing limit depends on income, existing debts, credit and the interest rate. Try a target monthly payment in the <a href="/finance/loan-calculator">loan calculator</a> to see the loan amount it supports.',
      },
      {
        q: 'How much should I save for retirement?',
        a: 'A common target is to replace roughly 70–80% of your pre-retirement income. The <a href="/finance/retirement-calculator">retirement calculator</a> shows whether your current savings rate is on track for that goal.',
      },
      {
        q: 'How much should I invest every month?',
        a: 'Work backwards from your goal: decide the amount you want and by when, then solve for the monthly deposit. The <a href="/finance/investment-calculator">investment calculator</a> lets you test monthly contributions and see the projected total.',
      },
      {
        q: 'How long will my savings last?',
        a: 'It depends on your balance, withdrawal rate and any interest earned. Model your balance and regular deposits in the <a href="/finance/savings-calculator">savings calculator</a> to see how it changes over time.',
      },
      {
        q: 'How long will it take to pay off my loan?',
        a: 'The payoff time depends on the balance, interest rate and how much you pay each month. Adjust the term in the <a href="/finance/loan-calculator">loan calculator</a> to see how faster payments shorten the schedule.',
      },
      {
        q: 'How long will it take to pay off my credit card?',
        a: 'Higher monthly payments clear a balance far faster because less goes to interest. Use the <a href="/finance/interest-calculator">interest calculator</a> to see how the APR affects the total you repay.',
      },
      {
        q: 'When will my loan be paid off?',
        a: 'Your loan is paid off after the final scheduled payment of its term — 30 years for a standard mortgage, for example. The <a href="/finance/loan-calculator">loan calculator</a> shows the number of payments and payoff total.',
      },
      {
        q: 'What is EMI?',
        a: 'EMI stands for equated monthly instalment — the fixed amount you pay each month on a loan, covering both interest and principal until the balance is cleared. Calculate it with the <a href="/finance/loan-calculator">loan calculator</a>.',
      },
      {
        q: 'What is APR?',
        a: 'APR (annual percentage rate) is the yearly cost of borrowing, including interest and certain fees, expressed as a percentage. See the <a href="/finance/apr-calculator">APR calculator</a> for details.',
      },
      {
        q: 'What is compound interest?',
        a: 'Compound interest is interest earned on both your original principal and the interest already added, so your money grows faster over time. Model it with the <a href="/finance/compound-interest-calculator">compound interest calculator</a>.',
      },
      {
        q: 'What is simple interest?',
        a: 'Simple interest is calculated only on the original principal, not on accumulated interest, so it grows in a straight line. Compare it with compounding in the <a href="/finance/interest-calculator">interest calculator</a>.',
      },
      {
        q: 'What is ROI?',
        a: 'ROI (return on investment) measures how much you gained relative to what you invested: (gain − cost) ÷ cost × 100. Project investment growth with the <a href="/finance/investment-calculator">investment calculator</a>.',
      },
      {
        q: 'What is SIP?',
        a: 'A SIP (systematic investment plan) is a way of investing a fixed sum at regular intervals, usually monthly, so you buy in steadily over time. The <a href="/finance/investment-calculator">investment calculator</a> projects SIP growth.',
      },
      {
        q: 'What is CAGR?',
        a: 'CAGR (compound annual growth rate) is the steady yearly rate that would take an investment from its start value to its end value over a period. Estimate long-term growth with the <a href="/finance/investment-calculator">investment calculator</a>.',
      },
      {
        q: 'What is a mortgage calculator?',
        a: 'A <a href="/finance/mortgage-calculator">mortgage calculator</a> estimates your monthly home loan payment from the price, down payment, interest rate and term, including property tax and insurance.',
      },
      {
        q: 'What is a loan calculator?',
        a: 'A <a href="/finance/loan-calculator">loan calculator</a> works out the monthly payment (EMI), total interest and payoff total for any loan once you enter the amount, rate and term.',
      },
      {
        q: 'What is an investment calculator?',
        a: 'An <a href="/finance/investment-calculator">investment calculator</a> projects how a lump sum and regular contributions grow over time at an expected rate of return, doubling as an SIP calculator.',
      },
      {
        q: 'What is a compound interest calculator?',
        a: 'A <a href="/finance/compound-interest-calculator">compound interest calculator</a> shows how savings grow when interest is added to the balance and then earns interest of its own.',
      },
      {
        q: 'What is a mortgage affordability calculator?',
        a: 'A mortgage affordability calculator estimates the home price and loan you can comfortably carry based on your income, debts and down payment. Test scenarios with the <a href="/finance/mortgage-calculator">mortgage calculator</a>.',
      },
      {
        q: 'What is an amortization calculator?',
        a: 'An amortization calculator shows how each payment splits between interest and principal and how the balance falls to zero over the term. The <a href="/finance/loan-calculator">loan calculator</a> includes this breakdown.',
      },
    ],
  },
  {
    title: 'Health, fitness & nutrition',
    items: [
      {
        q: 'What is BMI?',
        a: 'BMI (body mass index) is a quick screening number that relates your weight to your height to estimate whether you are in a healthy weight range. Check yours with the <a href="/health/bmi-calculator">BMI calculator</a>.',
      },
      {
        q: 'How do I calculate BMI?',
        a: 'BMI is your weight in kilograms divided by your height in metres squared (kg ÷ m²). The <a href="/health/bmi-calculator">BMI calculator</a> does the math in metric or imperial units and tells you the category.',
      },
      {
        q: 'What is TDEE?',
        a: 'TDEE (total daily energy expenditure) is the total number of calories you burn in a day, including exercise and everyday activity. Find yours with the <a href="/health/tdee-calculator">TDEE calculator</a>.',
      },
      {
        q: 'How do I calculate TDEE?',
        a: 'TDEE is your BMR multiplied by an activity factor for how active you are. The <a href="/health/tdee-calculator">TDEE calculator</a> combines both steps to estimate your daily calorie burn.',
      },
      {
        q: 'What is BMR?',
        a: 'BMR (basal metabolic rate) is the number of calories your body needs at complete rest to keep basic functions running. Calculate it with the <a href="/health/bmr-calculator">BMR calculator</a>.',
      },
      {
        q: 'How do I calculate my BMR?',
        a: 'BMR is usually estimated with the Mifflin-St Jeor equation using your weight, height, age and sex. The <a href="/health/bmr-calculator">BMR calculator</a> applies the formula for you.',
      },
      {
        q: 'How do I calculate body fat percentage?',
        a: 'Body fat percentage estimates the share of your weight that is fat, often from measurements or BMI-based formulas. As a starting point, check your BMI with the <a href="/health/bmi-calculator">BMI calculator</a> and your ideal range with the <a href="/health/ideal-weight-calculator">ideal weight calculator</a>.',
      },
      {
        q: 'How do I calculate my ideal body weight?',
        a: 'Ideal weight formulas use your height and sex to suggest a healthy target range. The <a href="/health/ideal-weight-calculator">ideal weight calculator</a> gives you an estimate based on established equations.',
      },
      {
        q: 'How do I calculate macros?',
        a: 'Macros split your daily calories into protein, carbohydrate and fat, each with its own calories per gram. The <a href="/health/macro-calculator">macro calculator</a> turns your calorie target into daily gram goals.',
      },
      {
        q: 'How do I calculate protein intake?',
        a: 'A common guide is around 0.7–1 gram of protein per pound of body weight, more if you train hard. The <a href="/health/macro-calculator">macro calculator</a> sets a protein target alongside your carbs and fat.',
      },
      {
        q: 'How do I calculate water intake?',
        a: 'Daily water needs scale with your body weight and activity level. The <a href="/health/water-intake-calculator">water intake calculator</a> estimates how much you should drink each day.',
      },
      {
        q: 'How much water should I drink daily?',
        a: 'A frequent rule of thumb is about 2–3 litres a day, but the right amount depends on your weight, activity and climate. The <a href="/health/water-intake-calculator">water intake calculator</a> gives you a personalised target.',
      },
      {
        q: 'How do I calculate calories for weight loss?',
        a: 'Find your TDEE, then eat below it — a deficit of about 500 calories a day tends to lose roughly a pound a week. Start with the <a href="/health/tdee-calculator">TDEE calculator</a> and set your target using the <a href="/health/calorie-calculator">calorie calculator</a>.',
      },
      {
        q: 'How do I calculate calorie deficit?',
        a: 'A calorie deficit is your TDEE minus the calories you eat. Subtract your daily intake from your maintenance calories; the <a href="/health/calorie-calculator">calorie calculator</a> shows the deficit for a weight-loss target.',
      },
      {
        q: 'How many calories should I eat per day?',
        a: 'Your daily calorie need equals your TDEE — the calories you burn to maintain your current weight. The <a href="/health/calorie-calculator">calorie calculator</a> estimates it and adjusts for losing, maintaining or gaining.',
      },
      {
        q: 'How many calories should I eat to lose weight?',
        a: 'Eat below your maintenance calories, commonly a 500-calorie daily deficit for about a pound of loss per week. The <a href="/health/calorie-calculator">calorie calculator</a> sets a weight-loss target for you.',
      },
      {
        q: 'How many calories should I eat to gain weight?',
        a: 'Eat above your maintenance calories, often a surplus of around 250–500 a day for steady gain. The <a href="/health/calorie-calculator">calorie calculator</a> works out a weight-gain target.',
      },
      {
        q: 'How many carbs should I eat daily?',
        a: 'Carbs typically make up 45–65% of daily calories, but the split depends on your goals and activity. The <a href="/health/macro-calculator">macro calculator</a> converts your calorie target into a daily carb goal.',
      },
      {
        q: 'How many grams of protein do I need?',
        a: 'Most active adults aim for roughly 0.7–1 gram of protein per pound of body weight. The <a href="/health/macro-calculator">macro calculator</a> calculates your daily grams alongside carbs and fat.',
      },
      {
        q: 'How long will it take to lose weight?',
        a: 'At a 500-calorie daily deficit you lose about a pound a week, so a 10-pound goal takes roughly 10 weeks. Set your deficit with the <a href="/health/calorie-calculator">calorie calculator</a> to estimate your timeline.',
      },
      {
        q: 'What is body fat percentage?',
        a: 'Body fat percentage is the proportion of your total body weight made up of fat, used alongside BMI as a fitness measure. Check your weight range with the <a href="/health/bmi-calculator">BMI calculator</a>.',
      },
      {
        q: 'What is a calorie calculator?',
        a: 'A <a href="/health/calorie-calculator">calorie calculator</a> estimates how many calories you should eat each day to lose, maintain or gain weight, based on your body metrics and activity level.',
      },
      {
        q: 'How much Benadryl can I give my dog?',
        a: 'Dosing medication for pets is a veterinary decision, not something to estimate from a general calculator. Contact your veterinarian for the correct dose and never give human medicine to a dog without professional advice.',
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
      {
        q: 'How do I calculate my CGPA?',
        a: 'CGPA is the cumulative average of all your semester GPAs, weighted by credits. Enter each term in the <a href="/education/gpa-calculator">GPA calculator</a> to find your overall cumulative grade point average.',
      },
      {
        q: 'How do I calculate my final grade?',
        a: 'Combine each assessment score with its weight, or work out the exam mark you still need to reach a target. The <a href="/education/final-grade-calculator">final grade calculator</a> tells you exactly what you need on the final.',
      },
      {
        q: 'What is a GPA calculator?',
        a: 'A <a href="/education/gpa-calculator">GPA calculator</a> converts your course grades and credit hours into a grade point average, so you can track your standing across a semester or your whole degree.',
      },
      {
        q: 'What is a grade calculator?',
        a: 'A <a href="/education/grade-calculator">grade calculator</a> turns the points you scored on a test or assignment into a percentage and letter grade, and can weight multiple assessments together.',
      },
    ],
  },
  {
    title: 'Dates, time & work hours',
    items: [
      {
        q: 'How old am I today?',
        a: 'Your age today is the time elapsed from your date of birth to now, in years, months and days. Enter your birthday in the <a href="/date-time/age-calculator">age calculator</a> for an exact figure.',
      },
      {
        q: 'How do I calculate my age?',
        a: 'Subtract your birth date from today\u2019s date to get your age in years, months and days. The <a href="/date-time/age-calculator">age calculator</a> handles leap years and month lengths automatically.',
      },
      {
        q: 'How do I calculate age from date of birth?',
        a: 'Count full years from your date of birth to today, then add the remaining months and days. The <a href="/date-time/age-calculator">age calculator</a> does this precisely from any birth date.',
      },
      {
        q: 'How do I calculate days between two dates?',
        a: 'Count the number of calendar days from the earlier date to the later one. The <a href="/date-time/date-difference-calculator">date difference calculator</a> returns the exact number of days, weeks and months between two dates.',
      },
      {
        q: 'How do I calculate the number of days between two dates?',
        a: 'Enter a start and end date into the <a href="/date-time/date-difference-calculator">date difference calculator</a> and it counts the total days between them, accounting for leap years.',
      },
      {
        q: 'How many years between two dates?',
        a: 'Subtract the earlier year from the later one and adjust for the month and day. The <a href="/date-time/date-difference-calculator">date difference calculator</a> reports the gap in years, months and days.',
      },
      {
        q: 'How do I calculate time differences?',
        a: 'Convert both times to a common unit, subtract, then convert back to hours and minutes. The <a href="/date-time/date-difference-calculator">date difference calculator</a> measures spans between two points in time.',
      },
      {
        q: 'How do I calculate business days?',
        a: 'Count only the weekdays between two dates and skip weekends and holidays. The <a href="/date-time/business-days-calculator">business days calculator</a> does this automatically.',
      },
      {
        q: 'How do I calculate working hours?',
        a: 'Subtract your start time from your end time and take off any unpaid breaks. For the number of working days in a period, use the <a href="/date-time/working-days-calculator">working days calculator</a>.',
      },
      {
        q: 'How many hours have I worked?',
        a: 'Add up the hours between each clock-in and clock-out, minus unpaid breaks. To count the working days in a stretch of dates, use the <a href="/date-time/working-days-calculator">working days calculator</a>.',
      },
      {
        q: 'How do I calculate overtime?',
        a: 'Overtime is the hours worked beyond your standard week, usually paid at 1.5 times your normal rate. Work out your base pay first with the <a href="/salary/hourly-wage-calculator">hourly wage calculator</a>.',
      },
      {
        q: 'What is an age calculator?',
        a: 'An <a href="/date-time/age-calculator">age calculator</a> works out your exact age in years, months and days from your date of birth, and can also count down to your next birthday.',
      },
      {
        q: 'How long will mail take from ZIP code to ZIP code?',
        a: 'Mail delivery time depends on the carrier, service class and distance between the two ZIP codes, so it is not a fixed calculation. Check the shipping estimate on your postal carrier\u2019s website for the most accurate delivery window.',
      },
    ],
  },
  {
    title: 'Pregnancy & family planning',
    items: [
      {
        q: 'How do I calculate pregnancy due date?',
        a: 'The common method adds 280 days (40 weeks) to the first day of your last menstrual period. This is an estimate — your doctor or midwife will confirm the due date with a scan.',
      },
      {
        q: 'How do I calculate ovulation?',
        a: 'Ovulation usually happens about 14 days before your next period starts, so in a 28-day cycle that is around day 14. Cycle length varies, so treat it as an estimate and confirm with your healthcare provider if needed.',
      },
      {
        q: 'How do I calculate pregnancy weeks?',
        a: 'Pregnancy is counted from the first day of your last menstrual period, so the number of weeks is the time elapsed since then. A typical pregnancy runs about 40 weeks.',
      },
      {
        q: 'How many days after my period can I get pregnant?',
        a: 'You are most fertile in the days leading up to and including ovulation, roughly days 11–16 of a 28-day cycle. Cycles differ, so this is only a general guide — speak to a healthcare professional for personal advice.',
      },
      {
        q: 'When did I get pregnant?',
        a: 'Conception usually occurs around the time of ovulation, about two weeks after the first day of your last period in a typical cycle. A doctor can give a more precise estimate from an ultrasound.',
      },
      {
        q: 'When should I take a pregnancy test?',
        a: 'For the most reliable result, test after the first day of a missed period. Testing too early can give a false negative because hormone levels may still be low.',
      },
    ],
  },
  {
    title: 'Shopping, tips & everyday questions',
    items: [
      {
        q: 'How do I calculate discounts?',
        a: 'Multiply the price by the discount percentage and subtract it from the original price — 25% off $80 saves $20, leaving $60. The <a href="/shopping/discount-calculator">discount calculator</a> shows the sale price and how much you save.',
      },
      {
        q: 'How do I calculate tips?',
        a: 'Multiply the bill by your tip percentage — 18% of a $50 bill is $9. The <a href="/shopping/tip-calculator">tip calculator</a> also splits the total between any number of people.',
      },
      {
        q: 'How much should I tip?',
        a: 'In the US, 15–20% of the pre-tax bill is customary for good table service, with 18% a common default. The <a href="/shopping/tip-calculator">tip calculator</a> works out the tip and the split per person.',
      },
      {
        q: 'How do you use a betting calculator?',
        a: 'A betting calculator converts odds into an implied probability and shows the potential payout for a given stake. We don\u2019t currently offer one, but you can convert odds and returns to percentages with the <a href="/math/percentage-calculator">percentage calculator</a>.',
      },
      {
        q: 'What is an odds calculator?',
        a: 'An odds calculator turns betting odds into the chance of an outcome and the payout on a winning stake. To express any odds as a percentage chance, use the <a href="/math/percentage-calculator">percentage calculator</a>.',
      },
      {
        q: 'What is a unit converter?',
        a: 'A unit converter changes a measurement from one unit to another — such as kilometres to miles or kilograms to pounds — by multiplying by the correct conversion factor. Explore more everyday tools in <a href="/math">math</a> and <a href="/travel">travel</a>.',
      },
      {
        q: 'What is a currency converter?',
        a: 'A currency converter changes an amount from one currency to another using the current exchange rate. Because rates move constantly, always use a live rate; for the underlying percentage math, the <a href="/math/percentage-calculator">percentage calculator</a> helps.',
      },
      {
        q: 'How much food stamps will I get?',
        a: 'SNAP (food stamp) benefits depend on your household size, income and allowable deductions under rules set by your state. Check your state\u2019s official SNAP website or benefits office for an accurate estimate.',
      },
      {
        q: 'How long does alcohol stay in your system?',
        a: 'The body clears roughly one standard drink per hour, but this varies with weight, sex, food and metabolism, and detection windows differ by test. This is general information, not medical or legal advice.',
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
