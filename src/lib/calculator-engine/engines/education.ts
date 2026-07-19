// Education — pure engines (GPA, course grade, final grade, average grade).
//
// These four migrate the legacy `src/lib/calculators/education.ts` compute()s to
// the CalculatorEngine contract. As always the results are presentation-neutral:
//   - GPA / quality points / averages     → raw numbers, format 'decimal'
//   - grades / weights / needed-on-final   → raw magnitudes, format 'percent'
//   - letter grades and reachability state → ENUM KEYS (localized downstream)
// No localized strings or pre-formatted numbers ever leave an engine.
//
// Letter grades carry characters ('+', '-') that are illegal in an enumKey
// (which must match /^[a-z][a-zA-Z.]*$/), so every letter is mapped to a safe
// enum key: 'A+' → 'aPlus', 'B-' → 'bMinus', 'F' → 'f', and so on.
//
// DYNAMIC vs STATIC inputs
// ------------------------
// GPA, course-grade and average-grade take a VARIABLE number of rows, rendered
// by bespoke components (GpaCalculator.astro, GradeCalculator.astro,
// AverageGradeCalculator.astro). Those three OMIT fields() on purpose — the
// generic form renderer doesn't drive them — but they still implement
// parseInput() so the shared pipeline can coerce raw DOM values into the typed
// row structure. Their parseInput scans indexed keys (see each engine's note).
// Final-grade is a plain 3-input form, so it also ships fields().

import type { CalculatorEngine, EngineResult, ResultItem, EngineField, ChartData } from '../contract';
import type { AnyEngine } from '../index';
import { ok, fail } from '../contract';
import { num, isFiniteNumber } from '../units';

// ---------------------------------------------------------------- Grade tables

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.7,
  'B+': 3.3, B: 3.0, 'B-': 2.7,
  'C+': 2.3, C: 2.0, 'C-': 1.7,
  'D+': 1.3, D: 1.0, 'D-': 0.7,
  F: 0.0,
};

// Letter → enum key (safe for the /^[a-z][a-zA-Z.]*$/ enumKey rule).
const LETTER_ENUM: Record<string, string> = {
  'A+': 'aPlus', A: 'a', 'A-': 'aMinus',
  'B+': 'bPlus', B: 'b', 'B-': 'bMinus',
  'C+': 'cPlus', C: 'c', 'C-': 'cMinus',
  'D+': 'dPlus', D: 'd', 'D-': 'dMinus',
  F: 'f',
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

/** Enum key for the letter grade a percentage maps to. */
function letterEnumFromPercent(p: number): string {
  return LETTER_ENUM[letterFromPercent(p)];
}

/** Standing band for a 0–4.0 GPA (matches the legacy gpaGauge bands). */
function gpaStanding(gpa: number): string {
  if (gpa < 2) return 'low';
  if (gpa < 3) return 'fair';
  if (gpa < 3.5) return 'good';
  return 'great';
}

// Shared gauge builders — raw chart data (label/enum KEYS only, no prose).
function gradeGauge(grade: number, titleKey: string): ChartData {
  return {
    type: 'gauge',
    titleKey,
    value: grade,
    min: 0,
    max: 100,
    valueEnumKey: letterEnumFromPercent(grade),
    segments: [
      { from: 0, to: 60, labelKey: 'f', color: '#ee0000' },
      { from: 60, to: 70, labelKey: 'd', color: '#f5a623' },
      { from: 70, to: 80, labelKey: 'c', color: '#f8d347' },
      { from: 80, to: 90, labelKey: 'b', color: '#7ed321' },
      { from: 90, to: 100, labelKey: 'a', color: '#50e3c2' },
    ],
  };
}

function gpaGauge(gpa: number): ChartData {
  return {
    type: 'gauge',
    titleKey: 'gpa.gaugeTitle',
    value: gpa,
    min: 0,
    max: 4,
    valueEnumKey: gpaStanding(gpa),
    segments: [
      { from: 0, to: 2, labelKey: 'low', color: '#ee0000' },
      { from: 2, to: 3, labelKey: 'fair', color: '#f5a623' },
      { from: 3, to: 3.5, labelKey: 'good', color: '#7ed321' },
      { from: 3.5, to: 4, labelKey: 'great', color: '#50e3c2' },
    ],
  };
}

// ============================================================================
// GPA — DYNAMIC (no fields(); bespoke GpaCalculator.astro renders the rows)
// ============================================================================
//
// parseInput scans indexed keys: for every `grade-<n>` present it reads the
// matching `credits-<n>` (default 1, matching the legacy `num(parts[1], 1)`).
// Rows are collected in ascending index order. Example values:
//   { 'grade-0': 'A', 'credits-0': '3', 'grade-1': 'B+', 'credits-1': '4' }

export interface GpaRow {
  grade: string;
  credits: number;
}

export interface GpaInput {
  rows: GpaRow[];
}

export interface GpaResult extends EngineResult {}

/** Collect ascending row indices from keys like `${prefix}-0`, `${prefix}-1`. */
function rowIndices(values: Record<string, string>, prefix: string): number[] {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  const idx = new Set<number>();
  for (const key of Object.keys(values)) {
    const m = key.match(re);
    if (m) idx.add(Number(m[1]));
  }
  return Array.from(idx).sort((a, b) => a - b);
}

export const gpaEngine: CalculatorEngine<GpaInput, GpaResult> = {
  slug: 'gpa-calculator',
  category: 'education',

  defaultInput: (): GpaInput => ({
    rows: [
      { grade: 'A', credits: 3 },
      { grade: 'B+', credits: 4 },
      { grade: 'A-', credits: 3 },
      { grade: 'B', credits: 3 },
    ],
  }),

  parseInput: (values): GpaInput => ({
    rows: rowIndices(values, 'grade').map((i) => ({
      grade: (values[`grade-${i}`] || '').toUpperCase(),
      credits: num(values[`credits-${i}`], 1),
    })),
  }),

  validate: (input) => {
    if (!input.rows.length) return fail('education.noCourses');
    const totalCredits = input.rows.reduce(
      (sum, r) => (GRADE_POINTS[r.grade.toUpperCase()] === undefined ? sum : sum + r.credits),
      0,
    );
    if (totalCredits <= 0) return fail('education.noValidGrades');
    return ok();
  },

  compute: (input) => {
    let totalPoints = 0;
    let totalCredits = 0;
    const breakdown: ResultItem[] = [];
    for (const r of input.rows) {
      const grade = r.grade.toUpperCase();
      const pts = GRADE_POINTS[grade];
      if (pts === undefined) continue;
      const credits = r.credits;
      totalPoints += pts * credits;
      totalCredits += credits;
      breakdown.push({
        key: 'course',
        value: pts,
        format: 'decimal',
        precision: 1,
        enumKey: LETTER_ENUM[grade],
        hintParams: { credits },
      });
    }
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return {
      items: [
        { key: 'gpa', value: gpa, format: 'decimal', precision: 2, primary: true },
        { key: 'totalCredits', value: totalCredits, format: 'decimal', precision: 1 },
        { key: 'qualityPoints', value: totalPoints, format: 'decimal', precision: 1 },
      ],
      breakdown,
      charts: [gpaGauge(gpa)],
    };
  },
};

// ============================================================================
// GRADE — DYNAMIC (no fields(); bespoke GradeCalculator.astro renders the rows)
// ============================================================================
//
// parseInput scans indexed keys: for every `score-<n>` it reads the matching
// `weight-<n>`. Both are parsed with a NaN fallback so invalid pairs can be
// dropped exactly as the legacy compute did. Example values:
//   { 'score-0': '95', 'weight-0': '20', 'score-1': '88', 'weight-1': '30' }

export interface GradeRow {
  score: number;
  weight: number;
}

export interface GradeInput {
  rows: GradeRow[];
}

export interface GradeResult extends EngineResult {}

export const gradeEngine: CalculatorEngine<GradeInput, GradeResult> = {
  slug: 'grade-calculator',
  category: 'education',

  defaultInput: (): GradeInput => ({
    rows: [
      { score: 95, weight: 20 },
      { score: 88, weight: 30 },
      { score: 76, weight: 20 },
      { score: 90, weight: 30 },
    ],
  }),

  parseInput: (values): GradeInput => ({
    rows: rowIndices(values, 'score').map((i) => ({
      score: num(values[`score-${i}`], NaN),
      weight: num(values[`weight-${i}`], NaN),
    })),
  }),

  validate: (input) => {
    if (!input.rows.length) return fail('education.noAssignments');
    const totalWeight = input.rows.reduce(
      (sum, r) => (isFiniteNumber(r.score) && isFiniteNumber(r.weight) ? sum + r.weight : sum),
      0,
    );
    if (totalWeight <= 0) return fail('education.invalidPairs');
    return ok();
  },

  compute: (input) => {
    let weighted = 0;
    let totalWeight = 0;
    for (const r of input.rows) {
      if (!isFiniteNumber(r.score) || !isFiniteNumber(r.weight)) continue;
      weighted += r.score * r.weight;
      totalWeight += r.weight;
    }
    const grade = totalWeight > 0 ? weighted / totalWeight : 0;
    return {
      items: [
        {
          key: 'overallGrade',
          value: grade,
          format: 'percent',
          precision: 2,
          primary: true,
          hintKey: 'grade.letter',
          hintParams: { letter: letterEnumFromPercent(grade) },
        },
        { key: 'letterGrade', enumKey: letterEnumFromPercent(grade) },
        {
          key: 'totalWeight',
          value: totalWeight,
          format: 'percent',
          precision: 0,
          tone: totalWeight === 100 ? 'success' : 'warning',
        },
      ],
      charts: [gradeGauge(grade, 'grade.gaugeTitle')],
    };
  },
};

// ============================================================================
// FINAL GRADE — STATIC (three number inputs; ships fields())
// ============================================================================

export interface FinalGradeInput {
  current: number;
  desired: number;
  weight: number; // percentage
}

export interface FinalGradeResult extends EngineResult {}

export const finalGradeEngine: CalculatorEngine<FinalGradeInput, FinalGradeResult> = {
  slug: 'final-grade-calculator',
  category: 'education',

  defaultInput: (): FinalGradeInput => ({ current: 84, desired: 90, weight: 30 }),

  fields: (): EngineField[] => [
    { name: 'current', labelKey: 'field.current', type: 'number', defaultValue: '84', min: 0, max: 200, step: 0.1, suffixKey: '%' },
    { name: 'desired', labelKey: 'field.desired', type: 'number', defaultValue: '90', min: 0, max: 200, step: 0.1, suffixKey: '%' },
    { name: 'weight', labelKey: 'field.weight', type: 'number', defaultValue: '30', min: 0.1, max: 100, step: 0.1, suffixKey: '%' },
  ],

  parseInput: (values): FinalGradeInput => ({
    current: num(values.current, 0),
    desired: num(values.desired, 0),
    weight: num(values.weight, 0),
  }),

  validate: (input) => {
    if (input.weight / 100 <= 0) return fail('education.finalWeightPositive', { field: 'weight' });
    return ok();
  },

  compute: (input) => {
    const current = input.current;
    const desired = input.desired;
    const w = input.weight / 100;
    const needed = (desired - current * (1 - w)) / w;

    const tone: ResultItem['tone'] = needed > 100 ? 'error' : needed <= 0 ? 'success' : 'default';
    const status = needed > 100 ? 'outOfReach' : needed <= 0 ? 'alreadySecured' : 'achievable';
    const hintKey = needed > 100 ? 'finalGrade.notReachable' : needed <= 0 ? 'finalGrade.alreadySecured' : undefined;

    return {
      items: [
        { key: 'scoreNeeded', value: needed, format: 'percent', precision: 1, primary: true, tone, hintKey },
        { key: 'status', enumKey: status, tone },
      ],
      breakdown: [
        { key: 'gradeFromOtherWork', value: current * (1 - w), format: 'percent', precision: 1 },
        { key: 'finalContributesUpTo', value: w * 100, format: 'percent', precision: 1 },
      ],
      charts: [
        {
          type: 'gauge',
          titleKey: 'finalGrade.gaugeTitle',
          value: needed,
          min: 0,
          max: 100,
          valueEnumKey: status,
          segments: [
            { from: 0, to: 60, labelKey: 'easy', color: '#50e3c2' },
            { from: 60, to: 80, labelKey: 'doable', color: '#7ed321' },
            { from: 80, to: 100, labelKey: 'hard', color: '#f5a623' },
          ],
        },
      ],
    };
  },
};

// ============================================================================
// AVERAGE GRADE — DYNAMIC (no fields(); bespoke AverageGradeCalculator.astro)
// ============================================================================
//
// parseInput scans indexed keys `score-<n>` (one score per row) and keeps only
// the finite values, exactly as the legacy compute filtered its parsed list.
// Example values: { 'score-0': '88', 'score-1': '92', 'score-2': '79' }

export interface AverageGradeInput {
  scores: number[];
}

export interface AverageGradeResult extends EngineResult {}

export const averageGradeEngine: CalculatorEngine<AverageGradeInput, AverageGradeResult> = {
  slug: 'average-grade-calculator',
  category: 'education',

  defaultInput: (): AverageGradeInput => ({ scores: [88, 92, 79, 95, 84] }),

  parseInput: (values): AverageGradeInput => ({
    scores: rowIndices(values, 'score')
      .map((i) => num(values[`score-${i}`], NaN))
      .filter((n) => isFiniteNumber(n)),
  }),

  validate: (input) => {
    const nums = input.scores.filter((n) => isFiniteNumber(n));
    if (!nums.length) return fail('education.noScores');
    return ok();
  },

  compute: (input) => {
    const nums = input.scores.filter((n) => isFiniteNumber(n));
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = nums.length > 0 ? sum / nums.length : 0;

    const charts: ChartData[] = [gradeGauge(avg, 'averageGrade.gaugeTitle')];
    // Show each individual score as a bar when the list is small enough to read.
    if (nums.length > 0 && nums.length <= 12) {
      charts.push({
        type: 'bar',
        titleKey: 'averageGrade.barTitle',
        format: 'decimal',
        bars: nums.map((n, i) => ({
          labelKey: String(i + 1),
          value: n,
          color: n >= avg ? '#50e3c2' : '#f5a623',
        })),
      });
    }

    return {
      items: [
        {
          key: 'average',
          value: avg,
          format: 'decimal',
          precision: 2,
          primary: true,
          hintKey: 'grade.letter',
          hintParams: { letter: letterEnumFromPercent(avg) },
        },
        { key: 'count', value: nums.length, format: 'integer' },
        { key: 'highest', value: nums.length ? Math.max(...nums) : 0, format: 'decimal', precision: 2 },
        { key: 'lowest', value: nums.length ? Math.min(...nums) : 0, format: 'decimal', precision: 2 },
      ],
      charts,
    };
  },
};

// ------------------------------------------------------------------ Export

export const educationEngines: AnyEngine[] = [
  gpaEngine as AnyEngine,
  gradeEngine as AnyEngine,
  finalGradeEngine as AnyEngine,
  averageGradeEngine as AnyEngine,
];
