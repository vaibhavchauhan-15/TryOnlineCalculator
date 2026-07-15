// Dependency-free SVG chart renderer. Pure functions that return an HTML
// string, so charts render identically on the server (initial SEO / no-JS
// paint) and on the client (live updates) through the shared result pipeline.
//
// Colours for axes, gridlines and the donut hole use CSS custom properties so
// the charts follow the light / dark theme automatically. Series colours come
// from an explicit value or the shared palette below.

import type { BarDatum, ChartSpec, GaugeSegment, LineSeries, PieSlice } from './types';

/** Shared, theme-agnostic series palette (also used by legends). */
export const CHART_PALETTE = ['#0070f3', '#7928ca', '#f5a623', '#50e3c2', '#ff0080', '#00dfd8'];

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Trim floats to at most 2 decimals for compact SVG coordinates. */
function fmt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : '0';
}

/** Compact axis / legend value, e.g. 1_250_000 -> "$1.25M", 320000 -> "$320K". */
function compact(n: number, format?: ChartSpec['format']): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  let body: string;
  if (abs >= 1_000_000) body = `${trimZeros(abs / 1_000_000)}M`;
  else if (abs >= 1_000) body = `${trimZeros(abs / 1_000)}K`;
  else body = trimZeros(abs);
  return format === 'currency' ? `${sign}$${body}` : `${sign}${body}`;
}

function trimZeros(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r);
}

/** Round a max value up to a "nice" round number for axis ticks. */
function niceCeil(max: number): number {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / pow;
  let nice: number;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 2.5) nice = 2.5;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

function color(explicit: string | undefined, i: number): string {
  return explicit || CHART_PALETTE[i % CHART_PALETTE.length];
}

/** Point on a circle, 0deg = 12 o'clock, sweeping clockwise. */
function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/* ------------------------------------------------------------------ Pie / donut */

function renderPie(spec: ChartSpec): string {
  const slices = (spec.slices ?? []).filter((s) => Number.isFinite(s.value) && s.value > 0);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return '';

  const cx = 80;
  const cy = 80;
  const r = 72;
  const hole = 44;

  let arcs = '';
  let cumulative = 0; // fraction 0..1
  slices.forEach((s: PieSlice, i) => {
    const c = color(s.color, i);
    const frac = s.value / total;
    if (frac >= 0.9999) {
      arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"></circle>`;
    } else {
      const start = cumulative * 360;
      const end = (cumulative + frac) * 360;
      const [x0, y0] = polar(cx, cy, r, start);
      const [x1, y1] = polar(cx, cy, r, end);
      const large = end - start > 180 ? 1 : 0;
      arcs += `<path d="M ${cx} ${cy} L ${fmt(x0)} ${fmt(y0)} A ${r} ${r} 0 ${large} 1 ${fmt(x1)} ${fmt(y1)} Z" fill="${c}"></path>`;
    }
    cumulative += frac;
  });
  // Donut hole (matches the card surface in either theme).
  arcs += `<circle cx="${cx}" cy="${cy}" r="${hole}" fill="var(--color-canvas)"></circle>`;

  let legend = '<ul class="chart-legend">';
  slices.forEach((s, i) => {
    const c = color(s.color, i);
    const pct = (s.value / total) * 100;
    legend += `<li class="chart-legend-item">`;
    legend += `<span class="chart-swatch" style="background:${c}"></span>`;
    legend += `<span class="chart-legend-label">${esc(s.label)}</span>`;
    legend += `<span class="chart-legend-val">${pct.toFixed(1)}%</span>`;
    legend += `</li>`;
  });
  legend += '</ul>';

  const title = spec.title ? `<figcaption class="chart-title">${esc(spec.title)}</figcaption>` : '';
  return (
    `<figure class="chart chart-pie">${title}` +
    `<div class="chart-pie-body">` +
    `<svg viewBox="0 0 160 160" class="chart-svg chart-svg-pie" role="img" aria-label="${esc(spec.title ?? 'Pie chart')}">${arcs}</svg>` +
    legend +
    `</div></figure>`
  );
}

/* ------------------------------------------------------------------ Line chart */

function renderLine(spec: ChartSpec): string {
  const series = (spec.series ?? []).filter((s) => s.points.length > 0);
  if (!series.length) return '';
  const n = Math.max(...series.map((s) => s.points.length));
  if (n < 2) return '';

  const W = 340;
  const H = 210;
  const padL = 46;
  const padR = 14;
  const padT = 10;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  let max = 0;
  for (const s of series) for (const p of s.points) if (Number.isFinite(p) && p > max) max = p;
  const niceMax = niceCeil(max);

  const xAt = (i: number) => padL + (n === 1 ? 0 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - (v / niceMax) * plotH;

  // Horizontal gridlines + y-axis value labels.
  const ticks = 4;
  let grid = '';
  for (let t = 0; t <= ticks; t++) {
    const val = (niceMax * t) / ticks;
    const y = yAt(val);
    grid += `<line x1="${padL}" y1="${fmt(y)}" x2="${W - padR}" y2="${fmt(y)}" class="chart-grid"></line>`;
    grid += `<text x="${padL - 6}" y="${fmt(y + 3)}" class="chart-axis-label" text-anchor="end">${esc(compact(val, spec.format))}</text>`;
  }

  // X-axis labels (thinned so they never overlap).
  const labels = spec.labels ?? [];
  const step = Math.max(1, Math.ceil(n / 6));
  let xlabels = '';
  for (let i = 0; i < n; i += step) {
    const lab = labels[i] ?? String(i);
    xlabels += `<text x="${fmt(xAt(i))}" y="${H - padB + 16}" class="chart-axis-label" text-anchor="middle">${esc(String(lab))}</text>`;
  }
  // Always label the final point.
  if ((n - 1) % step !== 0) {
    const lab = labels[n - 1] ?? String(n - 1);
    xlabels += `<text x="${fmt(xAt(n - 1))}" y="${H - padB + 16}" class="chart-axis-label" text-anchor="middle">${esc(String(lab))}</text>`;
  }

  let lines = '';
  series.forEach((s: LineSeries, idx) => {
    const c = color(s.color, idx);
    const pts = s.points.map((v, i) => `${fmt(xAt(i))},${fmt(yAt(v))}`).join(' ');
    lines += `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"></polyline>`;
  });

  let legend = '<ul class="chart-legend">';
  series.forEach((s, i) => {
    const c = color(s.color, i);
    legend += `<li class="chart-legend-item"><span class="chart-swatch" style="background:${c}"></span><span class="chart-legend-label">${esc(s.label)}</span></li>`;
  });
  legend += '</ul>';

  const title = spec.title ? `<figcaption class="chart-title">${esc(spec.title)}</figcaption>` : '';
  return (
    `<figure class="chart chart-line">${title}${legend}` +
    `<svg viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg-line" role="img" aria-label="${esc(spec.title ?? 'Line chart')}">${grid}${lines}${xlabels}</svg>` +
    `</figure>`
  );
}

/* ------------------------------------------------------------- Horizontal bars */

// A CSS-driven horizontal bar chart. Bars are plain elements (not SVG) so the
// labels stay crisp at any size and the layout reflows naturally on mobile.
function renderBar(spec: ChartSpec): string {
  const bars = (spec.bars ?? []).filter((b) => Number.isFinite(b.value));
  if (!bars.length) return '';

  // Scale to the largest magnitude so every bar shares one axis. Negative
  // values are supported (drawn from a centre baseline).
  const hasNeg = bars.some((b) => b.value < 0);
  const max = Math.max(0, ...bars.map((b) => Math.abs(b.value)));
  if (!(max > 0)) return '';

  let rows = '';
  bars.forEach((b: BarDatum, i) => {
    const c = color(b.color, i);
    const pct = (Math.abs(b.value) / max) * 100;
    const val = b.display ?? compact(b.value, spec.format);
    if (hasNeg) {
      // Diverging layout: negative bars grow left of centre, positive right.
      const side = b.value < 0 ? 'is-neg' : 'is-pos';
      rows +=
        `<li class="bar-row bar-diverge ${side}">` +
        `<span class="bar-label">${esc(b.label)}</span>` +
        `<span class="bar-track"><span class="bar-fill" style="width:${fmt(pct / 2)}%;background:${c}"></span></span>` +
        `<span class="bar-value">${esc(val)}</span>` +
        `</li>`;
    } else {
      rows +=
        `<li class="bar-row">` +
        `<span class="bar-label">${esc(b.label)}</span>` +
        `<span class="bar-track"><span class="bar-fill" style="width:${fmt(pct)}%;background:${c}"></span></span>` +
        `<span class="bar-value">${esc(val)}</span>` +
        `</li>`;
    }
  });

  const title = spec.title ? `<figcaption class="chart-title">${esc(spec.title)}</figcaption>` : '';
  return `<figure class="chart chart-bar">${title}<ul class="bar-list">${rows}</ul></figure>`;
}

/* ----------------------------------------------------------------- Gauge chart */

function renderGauge(spec: ChartSpec): string {
  const segments = (spec.segments ?? []).filter((s) => s.to > s.from);
  if (!segments.length) return '';

  // Scale bounds: explicit, else span of the segments.
  const min = spec.min ?? Math.min(...segments.map((s) => s.from));
  const max = spec.max ?? Math.max(...segments.map((s) => s.to));
  const span = max - min;
  if (!(span > 0)) return '';

  const W = 340;
  const padL = 12;
  const padR = 12;
  const trackY = 46;
  const trackH = 16;
  const plotW = W - padL - padR;
  const r = trackH / 2;

  const xAt = (v: number) => padL + ((clamp(v, min, max) - min) / span) * plotW;

  // Coloured segment bands. Rounded caps on the first/last band only.
  let bands = '';
  segments.forEach((s: GaugeSegment, i) => {
    const c = color(s.color, i);
    const x0 = xAt(s.from);
    const x1 = xAt(s.to);
    const w = Math.max(0, x1 - x0);
    const first = i === 0;
    const last = i === segments.length - 1;
    if (first || last) {
      // Path with two rounded corners on the outer edge, square on the inner.
      const rl = first ? r : 0;
      const rr = last ? r : 0;
      bands += `<path d="${roundedRectPath(x0, trackY, w, trackH, rl, rr)}" fill="${c}"></path>`;
    } else {
      bands += `<rect x="${fmt(x0)}" y="${trackY}" width="${fmt(w)}" height="${trackH}" fill="${c}"></rect>`;
    }
  });

  // Boundary tick labels (segment edges), thinned to avoid overlap.
  const bounds: number[] = [segments[0].from, ...segments.map((s) => s.to)];
  let ticks = '';
  bounds.forEach((b) => {
    const x = xAt(b);
    ticks += `<line x1="${fmt(x)}" y1="${trackY + trackH}" x2="${fmt(x)}" y2="${trackY + trackH + 4}" class="gauge-tick"></line>`;
    ticks += `<text x="${fmt(x)}" y="${trackY + trackH + 16}" class="gauge-tick-label" text-anchor="middle">${esc(trimZeros(b))}</text>`;
  });

  // Segment name labels centred within each band (skipped if too narrow).
  let segLabels = '';
  segments.forEach((s) => {
    const x0 = xAt(s.from);
    const x1 = xAt(s.to);
    if (x1 - x0 < 34) return;
    segLabels += `<text x="${fmt((x0 + x1) / 2)}" y="${trackY - 10}" class="gauge-seg-label" text-anchor="middle">${esc(s.label)}</text>`;
  });

  // Needle / marker at the value.
  const hasValue = typeof spec.value === 'number' && Number.isFinite(spec.value);
  let marker = '';
  if (hasValue) {
    const mx = xAt(spec.value as number);
    const top = trackY - 5;
    const bot = trackY + trackH + 5;
    marker =
      `<line x1="${fmt(mx)}" y1="${top}" x2="${fmt(mx)}" y2="${bot}" class="gauge-needle"></line>` +
      `<circle cx="${fmt(mx)}" cy="${top}" r="4.5" class="gauge-needle-dot"></circle>`;
  }

  const valueText = spec.valueLabel ?? (hasValue ? trimZeros(spec.value as number) : '');
  const bigValue = valueText
    ? `<div class="gauge-value">${esc(valueText)}${spec.valueCaption ? `<span class="gauge-value-caption">${esc(spec.valueCaption)}</span>` : ''}</div>`
    : '';

  const title = spec.title ? `<figcaption class="chart-title">${esc(spec.title)}</figcaption>` : '';
  return (
    `<figure class="chart chart-gauge">${title}${bigValue}` +
    `<svg viewBox="0 0 ${W} ${trackY + trackH + 24}" class="chart-svg chart-svg-gauge" role="img" aria-label="${esc(spec.title ?? 'Gauge chart')}">` +
    `${bands}${segLabels}${ticks}${marker}` +
    `</svg>` +
    `</figure>`
  );
}

/** SVG path for a rect with optionally rounded left/right ends. */
function roundedRectPath(x: number, y: number, w: number, h: number, rl: number, rr: number): string {
  const x2 = x + w;
  const y2 = y + h;
  return (
    `M ${fmt(x + rl)} ${fmt(y)} ` +
    `L ${fmt(x2 - rr)} ${fmt(y)} ` +
    (rr ? `A ${rr} ${rr} 0 0 1 ${fmt(x2)} ${fmt(y + rr)} ` : '') +
    `L ${fmt(x2)} ${fmt(y2 - rr)} ` +
    (rr ? `A ${rr} ${rr} 0 0 1 ${fmt(x2 - rr)} ${fmt(y2)} ` : '') +
    `L ${fmt(x + rl)} ${fmt(y2)} ` +
    (rl ? `A ${rl} ${rl} 0 0 1 ${fmt(x)} ${fmt(y2 - rl)} ` : '') +
    `L ${fmt(x)} ${fmt(y + rl)} ` +
    (rl ? `A ${rl} ${rl} 0 0 1 ${fmt(x + rl)} ${fmt(y)} ` : '') +
    `Z`
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Render a single chart spec to an SVG-based HTML string. */
export function renderChart(spec: ChartSpec): string {
  if (spec.type === 'pie') return renderPie(spec);
  if (spec.type === 'line') return renderLine(spec);
  if (spec.type === 'gauge') return renderGauge(spec);
  if (spec.type === 'bar') return renderBar(spec);
  return '';
}

/** Render a list of charts wrapped in a container (empty string if none). */
export function renderCharts(charts?: ChartSpec[]): string {
  if (!charts || !charts.length) return '';
  const inner = charts.map(renderChart).filter(Boolean).join('');
  if (!inner) return '';
  return `<div class="chart-stack">${inner}</div>`;
}
