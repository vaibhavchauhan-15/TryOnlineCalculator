// Count-up / odometer animation for calculator result values.
//
// When a result changes, we roll the number from its previous value to the new
// one instead of snapping instantly — the small motion that makes iOS/Google
// calculator results feel alive. Kept deliberately cheap and safe:
//
//   * Fast    — a single requestAnimationFrame loop, ~220ms, ease-out. Only the
//               element's text is updated; no layout properties are animated.
//   * Correct — the final frame is always the exact string the engine produced,
//               so grouping/locale/rounding is never approximated at rest. The
//               value is also mirrored to `data-final` so a copy taken mid-roll
//               still yields the finished result.
//   * Polite  — honours `prefers-reduced-motion` (instant) and only animates a
//               genuine numeric change whose surrounding text (currency symbol,
//               unit, %) is unchanged. Anything else settles instantly.

const DURATION = 220;

// First signed number inside a result string, e.g. the "1,234.56" in
// "$1,234.56 / mo" or the "24.7" in "24.7 kg".
const NUM_RE = /-?\d[\d,]*(?:\.\d+)?/;

interface NumParts {
  num: number;
  decimals: number;
  grouped: boolean;
  prefix: string;
  suffix: string;
}

function parseParts(text: string): NumParts | null {
  const m = NUM_RE.exec(text);
  if (!m) return null;
  const raw = m[0];
  return {
    num: Number(raw.replace(/,/g, '')),
    decimals: (raw.split('.')[1] ?? '').length,
    grouped: raw.includes(','),
    prefix: text.slice(0, m.index),
    suffix: text.slice(m.index + raw.length),
  };
}

function fmt(n: number, decimals: number, grouped: boolean): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  });
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Animate `el` from `prevText` to its current textContent (the freshly rendered
 * result). No-op-safe: if animation isn't appropriate the element simply keeps
 * its final value. The exact final string is always mirrored to `data-final`.
 */
export function animateValue(el: HTMLElement, prevText: string | null | undefined): void {
  const finalText = el.textContent ?? '';
  el.dataset.final = finalText;

  if (prevText == null || prefersReducedMotion()) return;

  const from = parseParts(prevText);
  const to = parseParts(finalText);
  // Only roll a real numeric delta with matching surrounding text so we never
  // interpolate across unrelated results (e.g. "$5/mo" → "3 years").
  if (
    !from ||
    !to ||
    from.prefix !== to.prefix ||
    from.suffix !== to.suffix ||
    from.num === to.num ||
    !Number.isFinite(from.num) ||
    !Number.isFinite(to.num)
  ) {
    return;
  }

  // Cancel any in-flight animation on this element.
  const prevRaf = el.dataset.cuRaf;
  if (prevRaf) cancelAnimationFrame(Number(prevRaf));

  const start = performance.now();
  const delta = to.num - from.num;

  const step = (now: number): void => {
    const t = Math.min(1, (now - start) / DURATION);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    if (t < 1) {
      const val = from.num + delta * eased;
      el.textContent = to.prefix + fmt(val, to.decimals, to.grouped) + to.suffix;
      el.dataset.cuRaf = String(requestAnimationFrame(step));
    } else {
      el.textContent = finalText; // exact engine output at rest
      delete el.dataset.cuRaf;
    }
  };
  el.dataset.cuRaf = String(requestAnimationFrame(step));
}

/**
 * Snapshot the currently displayed result values inside `root`, keyed by label,
 * so the next render can roll each value from where it was. Call this BEFORE
 * replacing the results HTML.
 */
export function snapshotResults(root: HTMLElement): Record<string, string> {
  const map: Record<string, string> = {};
  const primary = root.querySelector('[data-primary-value]');
  if (primary) {
    const label = root.querySelector('.result-primary-label')?.textContent?.trim() ?? '';
    map['primary:' + label] = primary.textContent?.trim() ?? '';
  }
  root.querySelectorAll('.result-row').forEach((row) => {
    const label = row.querySelector('.result-label')?.textContent?.trim() ?? '';
    const val = row.querySelector('.result-value');
    if (val) map['row:' + label] = val.textContent?.trim() ?? '';
  });
  return map;
}

/**
 * Roll every result value inside `root` from the given snapshot to its new
 * rendered value. Call this AFTER replacing the results HTML.
 */
export function animateResults(root: HTMLElement, prev: Record<string, string>): void {
  const primary = root.querySelector<HTMLElement>('[data-primary-value]');
  if (primary) {
    const label = root.querySelector('.result-primary-label')?.textContent?.trim() ?? '';
    animateValue(primary, prev['primary:' + label]);
  }
  root.querySelectorAll<HTMLElement>('.result-row').forEach((row) => {
    const label = row.querySelector('.result-label')?.textContent?.trim() ?? '';
    const val = row.querySelector<HTMLElement>('.result-value');
    if (val) animateValue(val, prev['row:' + label]);
  });
}
