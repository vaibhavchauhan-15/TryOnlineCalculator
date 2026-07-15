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

// A small neutral info glyph shown next to guidance / validation hints so the
// message reads as a friendly nudge rather than a dead-end. Used for both the
// empty state and any compute() message (which are guidance, never scary red).
const HINT_ICON =
  '<svg class="calc-hint-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';

function hintHTML(msg: string): string {
  return `<div class="result-shell"><div class="calc-error" role="status">${HINT_ICON}<span>${esc(msg)}</span></div></div>`;
}

export function renderResultsHTML(out: ComputeOutput): string {
  if (out.error) return hintHTML(out.error);
  if (!out.results.length) return hintHTML('Fill in the fields and your answer appears here instantly — no button to press.');

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

  // Reference/info block (e.g. "Latest mortgage rates") reads as supporting
  // data for the numbers, so it lives with the summary. Keeping it here also
  // balances the summary column against the (often taller) charts column so
  // the side-by-side layout has no awkward gap under the shorter side.
  if (out.info && out.info.items.length) {
    main += `<div class="result-info">`;
    main += `<span class="eyebrow">${esc(out.info.title)}</span>`;
    main += `<div class="result-info-grid">`;
    for (const item of out.info.items) {
      main += `<div class="result-info-item"><span class="result-info-label">${esc(item.label)}</span><span class="result-info-value">${esc(item.value)}</span></div>`;
    }
    main += `</div>`;
    if (out.info.note) main += `<span class="result-info-note">${esc(out.info.note)}</span>`;
    main += `</div>`;
  }

  // --- Visuals group: charts only. ---
  const visuals = renderCharts(out.charts);

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
