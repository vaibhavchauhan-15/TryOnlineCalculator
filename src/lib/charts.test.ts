import { describe, test, expect } from 'vitest';
import { renderChart, renderCharts, CHART_PALETTE } from './charts';

describe('charts.ts SVG chart renderer', () => {
  test('CHART_PALETTE is an array of color strings', () => {
    expect(Array.isArray(CHART_PALETTE)).toBe(true);
    expect(CHART_PALETTE.length).toBeGreaterThan(0);
  });

  describe('renderChart() - pie/donut', () => {
    test('renders pie chart SVG correctly', () => {
      const html = renderChart({
        type: 'pie',
        title: 'Breakdown',
        slices: [
          { label: 'Principal', value: 800, color: '#0070f3' },
          { label: 'Interest', value: 200, color: '#ff0080' },
        ],
      });

      expect(html).toContain('chart-pie');
      expect(html).toContain('Breakdown');
      expect(html).toContain('80.0%');
      expect(html).toContain('20.0%');
    });

    test('returns empty for empty or zero slices', () => {
      expect(renderChart({ type: 'pie', slices: [] })).toBe('');
      expect(renderChart({ type: 'pie', slices: [{ label: 'Zero', value: 0 }] })).toBe('');
    });
  });

  describe('renderChart() - line', () => {
    test('renders line chart with points and x-axis labels', () => {
      const html = renderChart({
        type: 'line',
        title: 'Growth',
        labels: ['Year 1', 'Year 2', 'Year 3'],
        series: [{ label: 'Balance', points: [1000, 1500, 2200] }],
      });

      expect(html).toContain('chart-line');
      expect(html).toContain('polyline');
      expect(html).toContain('Year 1');
      expect(html).toContain('Year 3');
    });

    test('returns empty string if fewer than 2 points', () => {
      expect(renderChart({ type: 'line', series: [{ label: 'One', points: [10] }] })).toBe('');
    });
  });

  describe('renderChart() - bar', () => {
    test('renders horizontal bar chart', () => {
      const html = renderChart({
        type: 'bar',
        title: 'Comparison',
        bars: [
          { label: 'Option A', value: 50 },
          { label: 'Option B', value: 100 },
        ],
      });

      expect(html).toContain('chart-bar');
      expect(html).toContain('Option A');
      expect(html).toContain('Option B');
      expect(html).toContain('width:100%');
    });

    test('renders diverging bar chart for negative values', () => {
      const html = renderChart({
        type: 'bar',
        bars: [
          { label: 'Loss', value: -50 },
          { label: 'Gain', value: 100 },
        ],
      });

      expect(html).toContain('is-neg');
      expect(html).toContain('is-pos');
    });
  });

  describe('renderChart() - gauge', () => {
    test('renders gauge chart with needle marker and segments', () => {
      const html = renderChart({
        type: 'gauge',
        title: 'BMI Status',
        value: 22.5,
        valueCaption: 'Normal',
        segments: [
          { label: 'Underweight', from: 0, to: 18.5, color: '#3b82f6' },
          { label: 'Normal', from: 18.5, to: 25, color: '#22c55e' },
          { label: 'Overweight', from: 25, to: 40, color: '#ef4444' },
        ],
      });

      expect(html).toContain('chart-gauge');
      expect(html).toContain('gauge-needle');
      expect(html).toContain('22.5');
      expect(html).toContain('Normal');
    });
  });

  describe('renderCharts() wrapper', () => {
    test('renders empty string for empty array', () => {
      expect(renderCharts([])).toBe('');
      expect(renderCharts(undefined)).toBe('');
    });

    test('wraps multiple charts in chart-stack container', () => {
      const html = renderCharts([
        { type: 'bar', bars: [{ label: 'A', value: 10 }] },
        { type: 'pie', slices: [{ label: 'B', value: 10 }] },
      ]);

      expect(html).toContain('chart-stack');
    });
  });
});
