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
  return v.toLocaleString(undefined, { maximumFractionDigits: digits });
}

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
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions =
    range === '5y' || range === '1y'
      ? { month: 'short', year: '2-digit', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(undefined, opts).format(d);
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

    chartEl.innerHTML = buildChartSVG(pts, data);
    wireChartHover(pts, data);
  }

  // Geometry is measured from the rendered element so the SVG maps 1:1 to CSS
  // pixels — text and dots stay crisp and undistorted at any viewport size.
  // Left padding leaves room for y-axis rate labels.
  const PL = 58, PR = 14, PT = 14, PB = 28;
  let W = 600, H = 250;
  let plotW = W - PL - PR;
  let plotH = H - PT - PB;

  function measure(): void {
    W = Math.max(260, Math.round(chartEl.clientWidth || 600));
    H = Math.round(Math.min(300, Math.max(200, W * 0.46)));
    plotW = W - PL - PR;
    plotH = H - PT - PB;
  }

  function scales(pts: { v: number }[]) {
    let min = Infinity, max = -Infinity;
    for (const p of pts) { if (p.v < min) min = p.v; if (p.v > max) max = p.v; }
    const dataMin = min, dataMax = max;
    if (min === max) { min -= Math.abs(min) * 0.01 || 1; max += Math.abs(max) * 0.01 || 1; }
    const pad = (max - min) * 0.12;
    min -= pad; max += pad;
    const n = pts.length;
    const xAt = (i: number) => PL + (n === 1 ? 0 : (i / (n - 1)) * plotW);
    const yAt = (v: number) => PT + plotH - ((v - min) / (max - min)) * plotH;
    return { min, max, dataMin, dataMax, xAt, yAt };
  }

  function buildChartSVG(pts: { t: string; v: number }[], data: HistoryPayload): string {
    measure();
    const { dataMin, dataMax, xAt, yAt } = scales(pts);
    const up = pts[pts.length - 1].v >= pts[0].v;
    const stroke = up ? 'var(--color-success, #22c55e)' : '#ef4444';

    const line = pts.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.v).toFixed(1)}`).join(' ');
    const baseY = (PT + plotH).toFixed(1);
    const area = `${PL},${baseY} ${line} ${(PL + plotW).toFixed(1)},${baseY}`;

    // Horizontal gridlines + y-axis rate labels (4 evenly spaced ticks).
    const yTicks = 4;
    let grid = '';
    for (let k = 0; k < yTicks; k++) {
      const v = dataMax - ((dataMax - dataMin) * k) / (yTicks - 1);
      const y = yAt(v);
      const base = k === yTicks - 1 ? ' cc-grid-base' : '';
      grid +=
        `<line class="cc-grid${base}" x1="${PL}" x2="${(PL + plotW).toFixed(1)}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"></line>` +
        `<text class="cc-axis cc-axis-y" x="${(PL - 8).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${formatRate(v)}</text>`;
    }

    // X labels: ~5 evenly spaced dates.
    const n = pts.length;
    const ticks = Math.min(5, n);
    let xlabels = '';
    for (let k = 0; k < ticks; k++) {
      const i = Math.round((k / (ticks - 1)) * (n - 1));
      const anchor = k === 0 ? 'start' : k === ticks - 1 ? 'end' : 'middle';
      xlabels += `<text x="${xAt(i).toFixed(1)}" y="${H - 8}" text-anchor="${anchor}" class="cc-axis">${fmtDate(pts[i].t, range)}</text>`;
    }

    return (
      `<svg viewBox="0 0 ${W} ${H}" class="cc-svg" role="img" aria-label="${data.from} to ${data.to} exchange rate over ${RANGE_LABEL[range]}">` +
      `<defs><linearGradient id="cc-fill" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="${stroke}" stop-opacity="0.2"></stop>` +
      `<stop offset="100%" stop-color="${stroke}" stop-opacity="0"></stop>` +
      `</linearGradient></defs>` +
      grid +
      `<polygon points="${area}" fill="url(#cc-fill)"></polygon>` +
      `<polyline points="${line}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline>` +
      `<g class="cc-cross" hidden><line class="cc-cross-line" y1="${PT}" y2="${(PT + plotH).toFixed(1)}"></line><circle class="cc-cross-dot" r="5" fill="${stroke}"></circle></g>` +
      xlabels +
      `<rect x="0" y="0" width="${W}" height="${H}" fill="transparent" data-cc-hit></rect>` +
      `</svg>` +
      `<div class="cc-tip" hidden></div>`
    );
  }

  function wireChartHover(pts: { t: string; v: number }[], data: HistoryPayload): void {
    const svg = chartEl.querySelector<SVGSVGElement>('.cc-svg');
    const hit = chartEl.querySelector<SVGRectElement>('[data-cc-hit]');
    const cross = chartEl.querySelector<SVGGElement>('.cc-cross');
    const line = chartEl.querySelector<SVGLineElement>('.cc-cross-line');
    const dot = chartEl.querySelector<SVGCircleElement>('.cc-cross-dot');
    const tip = chartEl.querySelector<HTMLElement>('.cc-tip');
    if (!svg || !hit || !cross || !line || !dot || !tip) return;
    const { xAt, yAt } = scales(pts);
    const n = pts.length;

    const toViewBoxX = (clientX: number): number => {
      const pt = svg.createSVGPoint();
      pt.x = clientX; pt.y = 0;
      const ctm = svg.getScreenCTM();
      if (!ctm) return 0;
      return pt.matrixTransform(ctm.inverse()).x;
    };

    const move = (clientX: number): void => {
      const vx = toViewBoxX(clientX);
      const frac = Math.max(0, Math.min(1, (vx - PL) / plotW));
      const i = Math.round(frac * (n - 1));
      const p = pts[Math.max(0, Math.min(n - 1, i))];
      const x = xAt(i), y = yAt(p.v);
      cross.removeAttribute('hidden');
      line.setAttribute('x1', String(x));
      line.setAttribute('x2', String(x));
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(y));
      tip.hidden = false;
      tip.innerHTML = `<span class="cc-tip-val">${formatRate(p.v)} ${data.to}</span><span class="cc-tip-date">${fmtDate(p.t, range)}</span>`;
      // Anchor the tooltip to the hovered point. The SVG maps 1:1 to CSS
      // pixels, so viewBox coords translate directly to percentages of the
      // chart box — the tip floats just above the dot and tracks it.
      const leftPct = (x / W) * 100;
      const topPct = (y / H) * 100;
      tip.style.left = `${Math.max(6, Math.min(94, leftPct))}%`;
      tip.style.top = `${topPct}%`;
      // Flip below the dot when it sits too near the top to fit the tip above.
      tip.classList.toggle('is-below', y < H * 0.3);
    };

    const onMove = (e: PointerEvent) => move(e.clientX);
    const onLeave = () => { cross.setAttribute('hidden', ''); if (tip) tip.hidden = true; };
    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerdown', onMove);
    hit.addEventListener('pointerleave', onLeave);
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
