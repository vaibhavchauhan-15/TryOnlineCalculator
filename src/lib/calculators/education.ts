import type { Calculator } from '../types';
import { num, fixed, percent, number } from '../format';

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.7,
  'B+': 3.3, B: 3.0, 'B-': 2.7,
  'C+': 2.3, C: 2.0, 'C-': 1.7,
  'D+': 1.3, D: 1.0, 'D-': 0.7,
  F: 0.0,
};

function letterFromPercent(p: number): string {
  if (p >= 97) return 'A+';
  if (p >= 93) return 'A';
  if (p >= 90) return 'A-';
  if (p >= 87) return 'B+';
  if (p >= 83) return 'B';
  if (p >= 80) return 'B-';
  if (p >= 77) return 'C+';
  if (p >= 73) return 'C';
  if (p >= 70) return 'C-';
  if (p >= 67) return 'D+';
  if (p >= 63) return 'D';
  if (p >= 60) return 'D-';
  return 'F';
}

export const educationCalculators: Calculator[] = [
  /* --------------------------------------------------------------------- GPA */
  {
    slug: 'gpa-calculator',
    category: 'education',
    title: 'GPA Calculator',
    description: 'Calculate your weighted grade point average from your course grades and credit hours.',
    intro: 'Enter one course per line as "grade, credits" — for example "A, 3". Letter grades from A+ to F are supported.',
    keywords: ['gpa calculator', 'grade point average', 'college gpa'],
    popular: true,
    inputs: [
      {
        name: 'courses', label: 'Courses (grade, credits per line)', type: 'textarea', span: 2,
        default: 'A, 3\nB+, 4\nA-, 3\nB, 3',
        placeholder: 'A, 3\nB+, 4\nA-, 3',
      },
    ],
    compute: (v) => {
      const lines = (v.courses || '').split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return { results: [], error: 'Enter at least one course.' };
      let totalPoints = 0;
      let totalCredits = 0;
      const rows: { label: string; value: string }[] = [];
      for (const line of lines) {
        const parts = line.split(/[,\s]+/).filter(Boolean);
        const grade = (parts[0] || '').toUpperCase();
        const credits = num(parts[1], 1);
        const pts = GRADE_POINTS[grade];
        if (pts === undefined) continue;
        totalPoints += pts * credits;
        totalCredits += credits;
        rows.push({ label: `${grade} · ${number(credits, 1)} cr`, value: `${fixed(pts, 1)} pts` });
      }
      if (totalCredits <= 0) return { results: [], error: 'No valid grades found. Use letters like A, B+, C-.' };
      const gpa = totalPoints / totalCredits;
      return {
        results: [
          { label: 'GPA', value: fixed(gpa, 2), primary: true },
          { label: 'Total credits', value: number(totalCredits, 1) },
          { label: 'Quality points', value: fixed(totalPoints, 1) },
        ],
        breakdown: rows,
      };
    },
    formulaItems: [{ name: 'Weighted GPA', expr: 'GPA = Σ(grade points × credits) / Σ credits' }],
    howto: ['Enter each course on its own line as grade then credits.', 'Separate the grade and credits with a comma or space.', 'Your weighted GPA updates instantly.'],
    faq: [
      { q: 'What scale is this?', a: 'It uses the standard US unweighted 4.0 scale where A = 4.0 and F = 0.0, including plus and minus grades.' },
      { q: 'How are credits weighted?', a: 'Courses worth more credits count more toward your GPA. Each course contributes grade points times its credit hours.' },
    ],
    related: ['grade-calculator', 'final-grade-calculator', 'average-grade-calculator'],
  },

  /* ------------------------------------------------------------------- Grade */
  {
    slug: 'grade-calculator',
    category: 'education',
    title: 'Grade Calculator',
    description: 'Calculate your overall course grade from assignment scores and their weights.',
    intro: 'Enter each assignment as "score, weight" per line. Scores and weights are percentages.',
    keywords: ['grade calculator', 'weighted grade', 'course grade'],
    popular: true,
    inputs: [
      {
        name: 'items', label: 'Assignments (score %, weight %)', type: 'textarea', span: 2,
        default: '95, 20\n88, 30\n76, 20\n90, 30',
        placeholder: '95, 20\n88, 30',
      },
    ],
    compute: (v) => {
      const lines = (v.items || '').split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return { results: [], error: 'Enter at least one assignment.' };
      let weighted = 0;
      let totalWeight = 0;
      for (const line of lines) {
        const [s, w] = line.split(/[,\s]+/).filter(Boolean);
        const score = num(s, NaN);
        const weight = num(w, NaN);
        if (!Number.isFinite(score) || !Number.isFinite(weight)) continue;
        weighted += score * weight;
        totalWeight += weight;
      }
      if (totalWeight <= 0) return { results: [], error: 'Enter valid score and weight pairs.' };
      const grade = weighted / totalWeight;
      return {
        results: [
          { label: 'Overall grade', value: percent(grade, 2), primary: true, hint: `Letter: ${letterFromPercent(grade)}` },
          { label: 'Letter grade', value: letterFromPercent(grade) },
          { label: 'Total weight entered', value: percent(totalWeight, 0), tone: totalWeight === 100 ? 'success' : 'warning' },
        ],
      };
    },
    formulaItems: [{ name: 'Weighted grade', expr: 'Grade = Σ(score × weight) / Σ weight' }],
    faq: [
      { q: 'Do the weights need to add up to 100%?', a: 'Not for the calculation — the result is normalised by the total weight. But if you have entered every graded item, the weights should total 100%.' },
    ],
    related: ['final-grade-calculator', 'gpa-calculator', 'average-grade-calculator', 'percentage-calculator'],
  },

  /* ------------------------------------------------------------- Final Grade */
  {
    slug: 'final-grade-calculator',
    category: 'education',
    title: 'Final Grade Calculator',
    description: 'Find out what score you need on your final exam to reach your target grade.',
    intro: 'Enter your current grade, the grade you want, and how much the final is worth.',
    keywords: ['final grade calculator', 'final exam grade', 'grade needed'],
    popular: true,
    inputs: [
      { name: 'current', label: 'Current grade', type: 'number', suffix: '%', default: 84, min: 0, max: 200, step: 0.1 },
      { name: 'desired', label: 'Desired final grade', type: 'number', suffix: '%', default: 90, min: 0, max: 200, step: 0.1 },
      { name: 'weight', label: 'Final exam weight', type: 'number', suffix: '%', default: 30, min: 0.1, max: 100, step: 0.1 },
    ],
    compute: (v) => {
      const current = num(v.current, 0);
      const desired = num(v.desired, 0);
      const w = num(v.weight, 0) / 100;
      if (w <= 0) return { results: [], error: 'Final exam weight must be greater than zero.' };
      const needed = (desired - current * (1 - w)) / w;
      const tone = needed > 100 ? 'error' : needed <= 0 ? 'success' : 'default';
      const hint = needed > 100 ? 'Not reachable with this final alone' : needed <= 0 ? 'Already secured!' : undefined;
      return {
        results: [
          { label: 'Score needed on final', value: percent(needed, 1), primary: true, tone, hint },
        ],
        breakdown: [
          { label: 'Grade from other work', value: percent(current * (1 - w), 1) },
          { label: 'Final contributes up to', value: percent(w * 100, 1) },
        ],
      };
    },
    formulaItems: [{ name: 'Required final', expr: 'Needed = (Target − Current·(1 − w)) / w', desc: 'w = final exam weight as a decimal.' }],
    faq: [
      { q: 'What if I need more than 100%?', a: 'It means the target is not achievable from the final exam alone — you would need extra credit or a higher-weighted assessment.' },
    ],
    related: ['grade-calculator', 'gpa-calculator', 'percentage-calculator'],
  },

  /* -------------------------------------------------------- Average Grade */
  {
    slug: 'average-grade-calculator',
    category: 'education',
    title: 'Average Grade Calculator',
    description: 'Average a list of grades or test scores, with optional weights.',
    intro: 'Enter your scores separated by commas or new lines to get the mean.',
    keywords: ['average grade calculator', 'average score', 'mean grade'],
    inputs: [
      { name: 'scores', label: 'Scores', type: 'textarea', span: 2, default: '88, 92, 79, 95, 84', placeholder: '88, 92, 79' },
    ],
    compute: (v) => {
      const nums = (v.scores || '')
        .split(/[,\s\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => num(s, NaN))
        .filter((n) => Number.isFinite(n));
      if (!nums.length) return { results: [], error: 'Enter at least one score.' };
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = sum / nums.length;
      return {
        results: [
          { label: 'Average', value: fixed(avg, 2), primary: true, hint: `Letter: ${letterFromPercent(avg)}` },
          { label: 'Number of scores', value: number(nums.length, 0) },
          { label: 'Highest / lowest', value: `${number(Math.max(...nums), 2)} / ${number(Math.min(...nums), 2)}` },
        ],
      };
    },
    faq: [
      { q: 'Can I average weighted grades here?', a: 'This tool takes a simple mean. For weighted assignments use the Grade Calculator instead.' },
    ],
    related: ['grade-calculator', 'gpa-calculator', 'average-calculator'],
  },
];
