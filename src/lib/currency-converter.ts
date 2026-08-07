// Client engine for the currency converter (progressive enhancement).
//
// The page ships with static reference rates so it works with no JS and is
// crawlable. On load this script:
//   * fetches live rates from the Frankfurter API (in the browser) and switches
//     the math to them,
//   * converts live as the user types, swaps and picks currencies,
//   * draws an interactive exchange-rate history chart with range filters,
//   * remembers the visitor's currencies/amount/range across refreshes.
//
// It is dependency-free and degrades gracefully: if any fetch fails it keeps
// using the embedded static rates and simply hides the history chart.

import { enhanceCurrencyPickers } from './currency-picker';
import { fetchLiveRates, fetchHistory } from './rates';
import { CURRENCIES } from './currency';

const SYMBOL_BY_CODE: Record<string, string> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.symbol]),
);

interface CCConfig {
  usdPer: Record<string, number>;
  live: string[];
  defaultFrom: string;
  defaultTo: string;
  defaultValue: string;
}

type Range = '1w' | '1m' | '3m' | '6m' | '1y' | '5y';

interface HistoryPayload {
  from: string;
  to: string;
  range: Range;
  supported: boolean;
  points: { t: string; v: number }[];
  updated: string;
}

const RANGE_LABEL: Record<Range, string> = {
  '1w': '7 days', '1m': '30 days', '3m': '3 months',
  '6m': '6 months', '1y': '1 year', '5y': '5 years',
};

// ---- Picker helpers (from/to are enhanced CurrencyPicker elements) ---------
const getCode = (el: HTMLElement): string => el.dataset.value ?? '';
const setCode = (el: HTMLElement, code: string): void => {
  el.dispatchEvent(new CustomEvent('cur:set', { detail: { code } }));
};
const onCodeChange = (el: HTMLElement, cb: () => void): void => {
  el.addEventListener('cur:change', cb);
};

// ---- Formatting ------------------------------------------------------------
function formatMoney(amount: number, code: string): string {
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: amount !== 0 && Math.abs(amount) < 1 ? 4 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${code}`;
  }
}

function formatRate(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
  return v.toLocaleString('en-US', { maximumFractionDigits: digits });
}

// Decimals that suit a given tick step, so every y-axis label shares the same
// precision (e.g. step 0.02 → 2 dp, step 5 → 0 dp). Keeps the axis tidy.
function decimalsForStep(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 2;
  if (step >= 1) return 0;
  return Math.min(6, Math.max(0, Math.ceil(-Math.log10(step) + 1e-9)));
}

// Compact, readable y-axis label. Large rates collapse to K/M so the label
// stays short (16,240 → "16.2K"); smaller rates use step-based precision.
function formatAxis(v: number, step: number): string {
  if (!Number.isFinite(v)) return '';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${trimZeros((v / 1_000_000).toFixed(2))}M`;
  if (abs >= 10_000) return `${trimZeros((v / 1_000).toFixed(1))}K`;
  const dec = decimalsForStep(step);
  return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function trimZeros(s: string): string {
  return s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

// A "nice" rounded step (1/2/2.5/5 × 10ⁿ) close to the rough interval — the
// classic axis-tick algorithm, so ticks land on human-friendly numbers.
function niceStep(rough: number): number {
  if (!(rough > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  const mult = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return mult * pow;
}

// Evenly spaced nice tick values covering [min, max].
function niceTicks(min: number, max: number, target = 5): { ticks: number[]; step: number } {
  if (!(max > min)) return { ticks: [min], step: 1 };
  const step = niceStep((max - min) / Math.max(1, target - 1));
  const start = Math.ceil(min / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-6; v += step) {
    ticks.push(Number(v.toPrecision(12)));
  }
  return { ticks, step };
}

const clamp = (lo: number, hi: number, v: number): number => Math.max(lo, Math.min(hi, v));

function parseAmount(raw: string): number {
  const cleaned = raw.trim().replace(/,/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return NaN;
  // Reject multiple dots or misplaced minus signs
  if ((cleaned.match(/\./g) || []).length > 1) return NaN;
  if ((cleaned.match(/-/g) || []).length > 1) return NaN;
  if (cleaned.lastIndexOf('-') > 0) return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function fmtDate(iso: string, range: Range): string {
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00Z'));
  if (Number.isNaN(d.getTime())) return iso;
  let opts: Intl.DateTimeFormatOptions;
  if (range === '1w') {
    opts = { weekday: 'short', day: 'numeric', timeZone: 'UTC' };
  } else if (range === '1m' || range === '3m' || range === '6m') {
    opts = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  } else {
    opts = { month: 'short', year: '2-digit', timeZone: 'UTC' };
  }
  return new Intl.DateTimeFormat('en-US', opts).format(d);
}

function fmtFullDate(iso: string): string {
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00Z'));
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
}

// ---------------------------------------------------------------------------
function mount(root: HTMLElement): void {
  const cfgEl = root.querySelector<HTMLScriptElement>('[data-cc-config]');
  if (!cfgEl) return;
  const cfg = JSON.parse(cfgEl.textContent || '{}') as CCConfig;

  const amountEl = root.querySelector<HTMLInputElement>('[data-cc-amount]')!;
  const fromEl = root.querySelector<HTMLElement>('[data-cc-from]')!;
  const toEl = root.querySelector<HTMLElement>('[data-cc-to]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-cc-result]')!;
  const updatedEl = root.querySelector<HTMLElement>('[data-cc-updated]')!;
  const swapBtn = root.querySelector<HTMLButtonElement>('[data-cc-swap]')!;
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-cc-copy]')!;

  const chartEl = root.querySelector<HTMLElement>('[data-cc-chart]')!;
  const chartTitleEl = root.querySelector<HTMLElement>('[data-cc-chart-title]')!;
  const changeEl = root.querySelector<HTMLElement>('[data-cc-change]')!;
  const noteEl = root.querySelector<HTMLElement>('[data-cc-chart-note]')!;
  const rangesEl = root.querySelector<HTMLElement>('[data-cc-ranges]')!;

  // Live rates start as the embedded static baseline, then get replaced.
  let usdPer: Record<string, number> = { ...cfg.usdPer };
  let liveSet = new Set<string>(cfg.live);
  let isLive = false;

  const factor = (code: string): number | undefined => usdPer[code];

  const convert = (amount: number, from: string, to: string): number => {
    const f = factor(from);
    const t = factor(to);
    if (!f || !t) return NaN;
    return (amount * f) / t;
  };

  // ---- Core update -------------------------------------------------------
  function update(): void {
    const from = getCode(fromEl);
    const to = getCode(toEl);
    const amount = parseAmount(amountEl.value);

    const out = convert(amount, from, to);
    if (Number.isNaN(out)) {
      resultEl.textContent = '—';
      resultEl.classList.toggle('is-error', amountEl.value.trim() !== '');
    } else {
      resultEl.textContent = formatMoney(out, to);
      resultEl.classList.remove('is-error');
    }

    savePrefs();
  }

  // ---- Preference persistence (survives page refresh) --------------------
  const PREFS_KEY = 'cc:prefs:v1';
  function savePrefs(): void {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ from: getCode(fromEl), to: getCode(toEl), amount: amountEl.value, range }),
      );
    } catch {
      /* storage unavailable (private mode / quota) — ignore */
    }
  }
  function restorePrefs(): void {
    let saved: { from?: string; to?: string; amount?: string; range?: Range } = {};
    try {
      saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    } catch {
      return;
    }
    if (saved.from && usdPer[saved.from]) setCode(fromEl, saved.from);
    if (saved.to && usdPer[saved.to]) setCode(toEl, saved.to);
    if (typeof saved.amount === 'string' && saved.amount !== '') amountEl.value = saved.amount;
    if (saved.range && RANGE_LABEL[saved.range]) {
      range = saved.range;
      rangesEl.querySelectorAll<HTMLElement>('[data-range]').forEach((b) =>
        b.classList.toggle('is-active', b.dataset.range === range));
    }
  }

  // ---- History chart -----------------------------------------------------
  let range: Range = '1m';
  const cache = new Map<string, HistoryPayload>();
  let reqToken = 0;

  async function loadChart(): Promise<void> {
    const from = getCode(fromEl);
    const to = getCode(toEl);
    chartTitleEl.textContent = `${from} → ${to}`;

    if (from === to) {
      showChartMessage('Pick two different currencies to see their rate history.');
      return;
    }
    if (!liveSet.has(from) || !liveSet.has(to)) {
      showChartMessage('Live history is available for major (ECB-tracked) currencies. This pair uses a reference rate only.');
      return;
    }

    const key = `${from}:${to}:${range}`;
    const cached = cache.get(key);
    if (cached) {
      drawChart(cached);
      return;
    }

    const token = ++reqToken;
    chartEl.classList.add('is-loading');
    try {
      // Fetched straight from the Frankfurter API in the browser (no backend).
      const data = await fetchHistory(from, to, range);
      if (token !== reqToken) return; // a newer request superseded this one
      cache.set(key, data);
      drawChart(data);
    } catch {
      if (token === reqToken) showChartMessage('Could not load rate history right now.');
    } finally {
      if (token === reqToken) chartEl.classList.remove('is-loading');
    }
  }

  function showChartMessage(msg: string): void {
    chartEl.innerHTML = '';
    changeEl.textContent = '';
    changeEl.className = 'cc-change';
    noteEl.textContent = msg;
  }

  // Remembers the last drawn payload so a viewport resize can re-render the
  // chart crisply at the new pixel width (see the ResizeObserver below).
  let lastData: HistoryPayload | null = null;

  function drawChart(data: HistoryPayload): void {
    if (!data.supported || data.points.length < 2) {
      lastData = null;
      showChartMessage('Not enough history to chart this pair yet.');
      return;
    }
    lastData = data;
    const pts = data.points;
    const first = pts[0].v;
    const last = pts[pts.length - 1].v;
    const diff = last - first;
    const pct = first ? (diff / first) * 100 : 0;
    const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    const arrow = dir === 'up' ? '\u25B2' : dir === 'down' ? '\u25BC' : '\u2013';
    changeEl.className = `cc-change is-${dir}`;
    changeEl.textContent = `${arrow} ${formatRate(Math.abs(diff))} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
    noteEl.textContent = `Daily close · ${RANGE_LABEL[range]} · updated ${new Date(data.updated).toLocaleDateString()}`;

    measure();
    const sc = scales(pts);
    chartEl.innerHTML = buildChartSVG(pts, data, sc);
    wireChartHover(pts, data, sc);
  }

  // Geometry is measured from the rendered element so the SVG maps 1:1 to CSS
  // pixels — text and dots stay crisp and undistorted at any viewport size.
  // Padding leaves room for axis labels; PL grows to fit wider y-axis numbers.
  let PL = 44;
  const PR = 16, PT = 16, PB = 26;
  let W = 600, H = 250;
  let plotW = W - PL - PR;
  let plotH = H - PT - PB;
  let axisFont = 11;

  function measure(): void {
    W = Math.max(260, Math.round(chartEl.clientWidth || 600));
    H = Math.round(Math.min(320, Math.max(210, W * 0.5)));
    axisFont = W < 360 ? 10 : W < 560 ? 11 : 12;
  }

  interface Scale {
    min: number; max: number;
    ticks: number[]; step: number;
    xAt: (i: number) => number;
    yAt: (v: number) => number;
  }

  function scales(pts: { v: number }[]): Scale {
    let dmin = Infinity, dmax = -Infinity;
    for (const p of pts) { if (p.v < dmin) dmin = p.v; if (p.v > dmax) dmax = p.v; }
    if (dmin === dmax) { const d = Math.abs(dmin) * 0.01 || 1; dmin -= d; dmax += d; }

    // Pad the data range, then snap to human-friendly tick values so labels
    // read as round numbers (75 / 80 / 85) rather than raw data extremes.
    const pad = (dmax - dmin) * 0.12;
    let min = dmin - pad;
    let max = dmax + pad;
    const targetTicks = H < 240 ? 4 : 5;
    const { ticks, step } = niceTicks(min, max, targetTicks);
    if (ticks.length) {
      min = Math.min(min, ticks[0]);
      max = Math.max(max, ticks[ticks.length - 1]);
    }

    // Grow the left gutter to fit the widest y-label so numbers never clip.
    const widest = ticks.reduce((w, v) => Math.max(w, formatAxis(v, step).length), 3);
    PL = Math.round(Math.min(76, Math.max(38, widest * axisFont * 0.65 + 16)));
    plotW = W - PL - PR;
    plotH = H - PT - PB;

    const n = pts.length;
    const span = max - min || 1;
    const xAt = (i: number) => PL + (n <= 1 ? plotW : (i / (n - 1)) * plotW);
    const yAt = (v: number) => PT + plotH - ((v - min) / span) * plotH;
    return { min, max, ticks, step, xAt, yAt };
  }

  // Smooth the polyline into a gently curved path using a monotone-safe
  // Catmull-Rom → cubic-Bézier conversion. Tension is kept low so the curve
  // never overshoots real data (no invented peaks) — it just softens corners.
  function smoothPath(coords: { x: number; y: number }[]): string {
    const n = coords.length;
    if (n === 0) return '';
    if (n < 3) return coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    let d = `M${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = coords[i - 1] || coords[i];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function buildChartSVG(pts: { t: string; v: number }[], data: HistoryPayload, sc: Scale): string {
    const { ticks, step, xAt, yAt } = sc;
    const up = pts[pts.length - 1].v >= pts[0].v;
    const stroke = up ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)';
    const uid = Math.random().toString(36).slice(2, 8);

    const coords = pts.map((p, i) => ({ x: xAt(i), y: yAt(p.v) }));
    const linePath = smoothPath(coords);
    const baseY = (PT + plotH).toFixed(1);
    const areaPath = `${linePath} L${(PL + plotW).toFixed(1)} ${baseY} L${PL.toFixed(1)} ${baseY} Z`;

    // Horizontal gridlines + y-axis labels on nice tick values.
    let grid = '';
    for (const v of ticks) {
      const y = yAt(v);
      if (y < PT - 1 || y > PT + plotH + 1) continue;
      grid +=
        `<line class="cc-grid" x1="${PL}" x2="${(PL + plotW).toFixed(1)}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"></line>` +
        `<text class="cc-axis cc-axis-y" x="${(PL - 8).toFixed(1)}" y="${(y + axisFont * 0.34).toFixed(1)}" text-anchor="end">${formatAxis(v, step)}</text>`;
    }

    // Dashed baseline at the opening value — the reference for the % change.
    const openY = yAt(pts[0].v);
    const baseline = `<line class="cc-baseline" x1="${PL}" x2="${(PL + plotW).toFixed(1)}" y1="${openY.toFixed(1)}" y2="${openY.toFixed(1)}"></line>`;

    // X labels: evenly spaced dates, adapted to width and date range span.
    const n = pts.length;
    const maxCount = Math.max(3, Math.min(7, Math.floor(plotW / 70)));
    const count = Math.min(maxCount, n);
    let xlabels = '';
    for (let k = 0; k < count; k++) {
      const i = count === 1 ? 0 : Math.round((k / (count - 1)) * (n - 1));
      const anchor = k === 0 ? 'start' : k === count - 1 ? 'end' : 'middle';
      xlabels += `<text x="${xAt(i).toFixed(1)}" y="${(H - 7).toFixed(1)}" text-anchor="${anchor}" class="cc-axis">${fmtDate(pts[i].t, range)}</text>`;
    }

    const end = coords[coords.length - 1];

    return (
      `<svg viewBox="0 0 ${W} ${H}" class="cc-svg" style="--cc-axis-fs:${axisFont}px" role="img" aria-label="${data.from} to ${data.to} exchange rate over ${RANGE_LABEL[range]}">` +
      `<defs><linearGradient id="cc-fill-${uid}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="${stroke}" stop-opacity="0.22"></stop>` +
      `<stop offset="100%" stop-color="${stroke}" stop-opacity="0"></stop>` +
      `</linearGradient></defs>` +
      grid +
      baseline +
      `<path class="cc-area" d="${areaPath}" fill="url(#cc-fill-${uid})"></path>` +
      `<path class="cc-line" d="${linePath}" pathLength="100" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>` +
      `<circle class="cc-end-dot" cx="${end.x.toFixed(1)}" cy="${end.y.toFixed(1)}" r="3.5" fill="${stroke}"></circle>` +
      `<g class="cc-cross" hidden><line class="cc-cross-line" y1="${PT}" y2="${(PT + plotH).toFixed(1)}"></line><circle class="cc-cross-dot" r="5" fill="${stroke}"></circle></g>` +
      xlabels +
      `<rect x="0" y="0" width="${W}" height="${H}" fill="transparent" data-cc-hit></rect>` +
      `</svg>` +
      `<div class="cc-tip" hidden></div>`
    );
  }

  function wireChartHover(pts: { t: string; v: number }[], data: HistoryPayload, sc: Scale): void {
    const hit = chartEl.querySelector<SVGRectElement>('[data-cc-hit]');
    const cross = chartEl.querySelector<SVGGElement>('.cc-cross');
    const line = chartEl.querySelector<SVGLineElement>('.cc-cross-line');
    const dot = chartEl.querySelector<SVGCircleElement>('.cc-cross-dot');
    const tip = chartEl.querySelector<HTMLElement>('.cc-tip');
    if (!hit || !cross || !line || !dot || !tip) return;
    const { xAt, yAt } = sc;
    const n = pts.length;

    let cachedRect: DOMRect | null = null;
    const getRect = (): DOMRect => {
      if (!cachedRect) cachedRect = chartEl.getBoundingClientRect();
      return cachedRect;
    };

    const show = (clientX: number): void => {
      const rect = getRect();
      if (!rect || rect.width === 0) return;
      const vx = ((clientX - rect.left) / rect.width) * W;
      const frac = clamp(0, 1, (vx - PL) / (plotW || 1));
      const i = clamp(0, n - 1, Math.round(frac * (n - 1)));
      const p = pts[i];
      const x = xAt(i), y = yAt(p.v);

      cross.removeAttribute('hidden');
      line.setAttribute('x1', x.toFixed(1));
      line.setAttribute('x2', x.toFixed(1));
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', y.toFixed(1));

      const sym = SYMBOL_BY_CODE[data.to] ?? (data.to === 'USD' ? '$' : `${data.to} `);
      const valStr = `${sym}${formatRate(p.v)}`;

      tip.innerHTML =
        `<span class="cc-tip-val">${valStr}</span>` +
        `<span class="cc-tip-sep">|</span>` +
        `<span class="cc-tip-date">${fmtFullDate(p.t)}</span>`;

      tip.removeAttribute('hidden');

      const sx = rect.width / W;
      const sy = rect.height / H;
      const px = x * sx;
      const py = y * sy;
      const half = tip.offsetWidth / 2 || 60;
      const clampedX = clamp(half + 6, rect.width - half - 6, px);
      tip.style.left = `${clampedX.toFixed(1)}px`;
      tip.style.top = `${py.toFixed(1)}px`;
      tip.classList.toggle('is-below', py < rect.height * 0.32);
    };

    const hide = (): void => {
      cross.setAttribute('hidden', '');
      tip.setAttribute('hidden', '');
      cachedRect = null;
    };

    let raf = 0;
    const onPointerMove = (e: PointerEvent) => {
      const cx = e.clientX;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        show(cx);
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      cachedRect = chartEl.getBoundingClientRect();
      onPointerMove(e);
    };

    hit.addEventListener('pointerenter', () => { cachedRect = chartEl.getBoundingClientRect(); });
    hit.addEventListener('pointermove', onPointerMove, { passive: true });
    hit.addEventListener('pointerdown', onPointerDown, { passive: true });
    hit.addEventListener('pointerleave', hide);
    hit.addEventListener('pointercancel', hide);
    hit.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') {
        setTimeout(hide, 2000);
      }
    });
  }

  // Re-render on width changes so the SVG stays pixel-perfect (debounced to a
  // frame). Only redraws when a chart is actually shown.
  let resizeRaf = 0;
  let lastW = 0;
  const ro = new ResizeObserver(() => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      const w = Math.round(chartEl.clientWidth);
      if (w === lastW) return;
      lastW = w;
      if (lastData) drawChart(lastData);
    });
  });
  ro.observe(chartEl);

  // ---- Live rates fetch --------------------------------------------------
  async function loadRates(): Promise<void> {
    try {
      // Live rates come straight from the Frankfurter API in the browser, so
      // this works on a fully static host with no backend.
      const data = await fetchLiveRates();
      if (data && data.usdPer) {
        usdPer = { ...cfg.usdPer, ...data.usdPer };
        liveSet = new Set(data.live);
        isLive = data.source === 'live';
        const when = data.date || (data.updated ? data.updated.slice(0, 10) : '');
        updatedEl.textContent = isLive
          ? `Live rates${when ? ` · ${when}` : ''} · updates daily`
          : 'Reference rates (live feed unavailable)';
        updatedEl.classList.toggle('is-live', isLive);
        update();
        loadChart();
      }
    } catch {
      /* keep static rates + default "reference rates" note */
    }
  }

  // ---- Wire events -------------------------------------------------------
  amountEl.addEventListener('input', update);
  onCodeChange(fromEl, () => { update(); loadChart(); });
  onCodeChange(toEl, () => { update(); loadChart(); });

  swapBtn.addEventListener('click', () => {
    // Replay the spin animation on every click (works the same on tap and mouse click).
    swapBtn.classList.remove('is-swapping');
    void swapBtn.offsetWidth; // force reflow so the animation restarts
    swapBtn.classList.add('is-swapping');

    const f = getCode(fromEl);
    const t = getCode(toEl);
    setCode(fromEl, t);
    setCode(toEl, f);
    const cur = resultEl.textContent?.replace(/[^0-9.\-]/g, '') ?? '';
    if (cur && !resultEl.classList.contains('is-error')) amountEl.value = cur;
    update();
    loadChart();
  });
  swapBtn.addEventListener('animationend', () => swapBtn.classList.remove('is-swapping'));

  copyBtn.addEventListener('click', async () => {
    const txt = resultEl.textContent?.trim() ?? '';
    if (!txt || txt === '—') return;
    try {
      await navigator.clipboard.writeText(txt);
      copyBtn.classList.add('is-copied');
      setTimeout(() => copyBtn.classList.remove('is-copied'), 900);
    } catch { /* clipboard unavailable */ }
  });

  rangesEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-range]');
    if (!btn) return;
    range = btn.dataset.range as Range;
    rangesEl.querySelectorAll('[data-range]').forEach((b) =>
      b.classList.toggle('is-active', b === btn));
    savePrefs();
    loadChart();
  });

  // Restore the visitor's last from/to/amount/range before the first paint.
  restorePrefs();

  // First paint with static rates, then upgrade to live.
  update();
  loadChart();
  void loadRates();
}

export function initCurrencyConverter(): void {
  enhanceCurrencyPickers();
  document.querySelectorAll<HTMLElement>('[data-cc]').forEach(mount);
}
