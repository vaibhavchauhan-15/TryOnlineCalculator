// Pure result-rendering used both on the server (initial HTML for SEO / no-JS)
// and on the client (live updates). Returns an HTML string.

import type { ComputeOutput } from './types';
import { renderCharts } from './charts';

export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const toneClass: Record<string, string> = {
  success: 'is-success',
  warning: 'is-warning',
  error: 'is-error',
  default: '',
};

export function renderResultsHTML(out: ComputeOutput): string {
  if (out.error) return `<div class="result-shell"><div class="calc-error" role="status">${esc(out.error)}</div></div>`;
  if (!out.results.length)
    return `<div class="result-shell"><div class="calc-error" role="status">Enter values to see the result.</div></div>`;

  const primary = out.results.find((r) => r.primary) ?? out.results[0];
  const rest = out.results.filter((r) => r !== primary);

  // --- Summary group: the headline number, supporting rows and breakdown. ---
  let main = '';
  main += `<div class="result-primary ${toneClass[primary.tone ?? 'default']}">`;
  main += `<button type="button" class="result-copy" data-copy-result aria-label="Copy result" title="Copy result"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>`;
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
    main += `<div class="result-breakdown"><span class="eyebrow">Breakdown</span><dl class="breakdown-list">`;
    for (const b of out.breakdown) {
      main += `<div class="breakdown-row"><dt>${esc(b.label)}</dt><dd>${esc(b.value)}</dd></div>`;
    }
    main += `</dl></div>`;
  }

  // --- Visuals group: charts and any reference/info block. ---
  let visuals = renderCharts(out.charts);

  if (out.info && out.info.items.length) {
    visuals += `<div class="result-info">`;
    visuals += `<span class="eyebrow">${esc(out.info.title)}</span>`;
    visuals += `<div class="result-info-grid">`;
    for (const item of out.info.items) {
      visuals += `<div class="result-info-item"><span class="result-info-label">${esc(item.label)}</span><span class="result-info-value">${esc(item.value)}</span></div>`;
    }
    visuals += `</div>`;
    if (out.info.note) visuals += `<span class="result-info-note">${esc(out.info.note)}</span>`;
    visuals += `</div>`;
  }

  // No charts/info: keep the flat summary flow (unchanged for most calculators).
  if (!visuals) return `<div class="result-shell">${main}</div>`;

  // Rich output: split into a summary column and a visuals column so the two
  // sit side by side on wide screens (far less scrolling) and stack on mobile.
  return (
    `<div class="result-shell has-visuals">` +
    `<div class="result-main">${main}</div>` +
    `<div class="result-visuals">${visuals}</div>` +
    `</div>`
  );
}
