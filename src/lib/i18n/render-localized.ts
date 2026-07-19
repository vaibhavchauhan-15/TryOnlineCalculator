// Server + client renderer for a localized DisplayResult. Mirrors the shape of
// the legacy render.ts but consumes the localization layer's DisplayResult
// (already-localized labels + formatted values) instead of the old
// ComputeOutput. Reuses the shared SVG chart renderer by mapping DisplayChart
// onto the ChartSpec it expects.

import type { DisplayResult, DisplayChart } from './resolver';
import type { ChartSpec } from '../types';
import { renderCharts } from '../charts';
import { esc } from '../render';

const toneClass: Record<string, string> = {
  success: 'is-success',
  warning: 'is-warning',
  error: 'is-error',
  default: '',
};

/** Map a localized DisplayChart onto the legacy ChartSpec the renderer draws. */
function toChartSpec(c: DisplayChart): ChartSpec {
  return {
    type: c.type,
    title: c.title,
    // Engine uses 'decimal'; the legacy chart renderer's axis format is 'number'.
    format: c.format === 'currency' ? 'currency' : 'number',
    slices: c.slices?.map((s) => ({ label: s.label, value: s.value, color: s.color })),
    bars: c.bars?.map((b) => ({ label: b.label, value: b.value, color: b.color })),
    series: c.series?.map((s) => ({ label: s.label, points: s.points, color: s.color })),
    labels: c.labels,
    segments: c.segments?.map((seg) => ({ from: seg.from, to: seg.to, label: seg.label, color: seg.color })),
    value: c.value,
    valueLabel: c.valueLabel,
    min: c.min,
    max: c.max,
  };
}

/**
 * Render a localized result to an HTML string. Identical structure to the
 * legacy renderer so the existing result CSS applies unchanged.
 */
export function renderLocalizedResultHTML(out: DisplayResult): string {
  if (!out.items.length) return '';

  const primary = out.items.find((r) => r.primary) ?? out.items[0];
  const rest = out.items.filter((r) => r !== primary);

  let main = '';
  main += `<div class="result-primary ${toneClass[primary.tone ?? 'default']}">`;
  main += `<span class="result-primary-label">${esc(primary.label)}</span>`;
  main += `<span class="result-primary-value" data-primary-value>${esc(primary.value)}</span>`;
  if (primary.hint) main += `<span class="result-primary-hint">${esc(primary.hint)}</span>`;
  main += `</div>`;

  if (rest.length) {
    main += `<div class="result-list">`;
    for (const r of rest) {
      main += `<div class="result-row ${toneClass[r.tone ?? 'default']}">`;
      main += `<span class="result-label">${esc(r.label)}${r.hint ? `<span class="result-hint">${esc(r.hint)}</span>` : ''}</span>`;
      main += `<span class="result-value">${esc(r.value)}</span>`;
      main += `</div>`;
    }
    main += `</div>`;
  }

  if (out.breakdown && out.breakdown.length) {
    main += `<div class="result-breakdown"><dl class="breakdown-list">`;
    for (const b of out.breakdown) {
      main += `<div class="breakdown-row"><dt>${esc(b.label)}${b.hint ? ` <span class="result-hint">${esc(b.hint)}</span>` : ''}</dt><dd>${esc(b.value)}</dd></div>`;
    }
    main += `</dl></div>`;
  }

  const visuals = renderCharts(out.charts?.map(toChartSpec));
  if (!visuals) return `<div class="result-shell">${main}</div>`;

  return (
    `<div class="result-shell has-visuals">` +
    `<div class="result-main">${main}</div>` +
    `<div class="result-visuals">${visuals}</div>` +
    `</div>`
  );
}
