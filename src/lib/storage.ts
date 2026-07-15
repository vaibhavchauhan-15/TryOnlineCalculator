// Lightweight client-side persistence for calculator inputs.
//
// Design goals:
//   * Fast   — writes are debounced so typing never blocks the main thread,
//              and values are kept tiny (per-calculator JSON blobs).
//   * Safe   — every access is wrapped in try/catch so private mode, disabled
//              storage or quota errors degrade gracefully to "no persistence".
//   * Lossless on refresh — pending writes are flushed synchronously when the
//              page is hidden/unloaded, so even an instant refresh keeps the
//              last keystroke.
//
// Keys are namespaced under a version prefix so we can evolve the shape later
// without colliding with anything else on the origin.

const NS = 'toc:v1:';

/** Read and parse a stored value. Returns null when missing or unreadable. */
export function loadState<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

const timers = new Map<string, number>();
const latest = new Map<string, unknown>();

function flush(key: string): void {
  const timer = timers.get(key);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(key);
  }
  if (!latest.has(key)) return;
  try {
    localStorage.setItem(NS + key, JSON.stringify(latest.get(key)));
  } catch {
    /* quota exceeded or storage disabled — ignore */
  }
  latest.delete(key);
}

/**
 * Persist a value for `key`. Writes are debounced by `delay` ms; the newest
 * value always wins. Use for high-frequency events like `input`.
 */
export function saveState(key: string, value: unknown, delay = 150): void {
  latest.set(key, value);
  const existing = timers.get(key);
  if (existing !== undefined) clearTimeout(existing);
  timers.set(key, window.setTimeout(() => flush(key), delay));
}

/** Remove a stored value and cancel any pending write for it. */
export function clearState(key: string): void {
  latest.delete(key);
  const timer = timers.get(key);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(key);
  }
  try {
    localStorage.removeItem(NS + key);
  } catch {
    /* ignore */
  }
}

// Flush all pending writes when the page is about to disappear. `pagehide`
// covers refresh/navigation/back-forward cache; the visibility hook catches
// tab switches and mobile app backgrounding where `pagehide` may not fire.
if (typeof window !== 'undefined') {
  const flushAll = () => {
    for (const key of [...latest.keys()]) flush(key);
  };
  window.addEventListener('pagehide', flushAll);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAll();
  });
}
