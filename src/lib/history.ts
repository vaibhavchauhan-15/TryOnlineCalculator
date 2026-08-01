// Shared calculation-history + clipboard helpers used by every calculator
// (the generic form widget and the visual keypad / fraction / percentage /
// average tools).
//
// Design goals mirror storage.ts:
//   * Fast   — tiny per-calculator JSON blobs, capped list, cheap re-render.
//   * Safe   — all storage access wrapped in try/catch so private mode /
//              disabled storage degrade gracefully to "no history".
//   * Smooth — copy feedback is a lightweight icon swap; the panel is a
//              collapsed pill by default so it never crowds the calculator.

const NS = 'toc:v1:hist:';
const MAX = 12;

export interface HistoryEntry {
  /** Short expression / input summary (e.g. "1/2 + 1/3"). */
  expr: string;
  /** The result string the user copies. */
  value: string;
  /** Epoch ms — used to render a relative timestamp. */
  ts: number;
}

/** Read the stored history list. Returns [] when missing or unreadable. */
export function loadHistory(key: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(NS + key);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? (arr as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(key: string, list: HistoryEntry[]): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(list));
  } catch {
    /* quota exceeded or storage disabled — ignore */
  }
}

/** Remove a calculator's stored history. */
export function clearHistory(key: string): void {
  try {
    localStorage.removeItem(NS + key);
  } catch {
    /* ignore */
  }
}

// ---- Clipboard ------------------------------------------------------------

/** Copy `text` to the clipboard, with a legacy fallback. Returns success. */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ---- Icons ----------------------------------------------------------------

export const COPY_ICON =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

export const CHECK_ICON =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

/**
 * Copy `value` and flash a checkmark on `btn` for a moment. Safe to call
 * repeatedly — the pending revert timer is tracked on the element.
 */
export async function copyWithFeedback(btn: HTMLElement, value: string): Promise<void> {
  const ok = await copyText(value);
  if (!ok) return;
  const prev = btn.getAttribute('data-revert-timer');
  if (prev) clearTimeout(Number(prev));
  btn.classList.add('is-copied');

  // Labeled buttons use [data-copy-ico] + [data-copy-txt] so we can restore the
  // text; icon-only buttons just swap their whole contents.
  const ico = btn.querySelector<HTMLElement>('[data-copy-ico]');
  const txt = btn.querySelector<HTMLElement>('[data-copy-txt]');
  const prevTxt = txt?.textContent ?? null;
  if (ico) ico.innerHTML = CHECK_ICON;
  else btn.innerHTML = CHECK_ICON;
  if (txt) txt.textContent = 'Copied';

  const timer = window.setTimeout(() => {
    btn.classList.remove('is-copied');
    if (ico) ico.innerHTML = COPY_ICON;
    else btn.innerHTML = COPY_ICON;
    if (txt && prevTxt !== null) txt.textContent = prevTxt;
    btn.removeAttribute('data-revert-timer');
  }, 1200);
  btn.setAttribute('data-revert-timer', String(timer));
}

// ---- History panel UI -----------------------------------------------------

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export interface HistoryController {
  /**
   * Add a result to the history (deduped against the most recent entry).
   * Returns true when a new entry was actually stored, false when the value
   * was empty / an error / a duplicate of the latest entry.
   */
  record(expr: string, value: string): boolean;
}

const EMPTY_MARKS = new Set(['', '—', '\u2014', 'Error', 'error']);

/**
 * Build a collapsible history panel inside `mount` and return a controller
 * whose `record()` the calculator calls when it produces a fresh result.
 */
export function createHistoryUI(opts: { key: string; mount: HTMLElement }): HistoryController {
  const { key, mount } = opts;
  let list = loadHistory(key);

  const root = document.createElement('div');
  root.className = 'calc-history';
  root.innerHTML = `
    <div class="calc-history-head">
      <button type="button" class="calc-history-toggle" aria-expanded="false" aria-label="Toggle calculation history">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path></svg>
        <span>History</span>
        <span class="calc-history-count" data-hist-count>0</span>
        <svg class="calc-history-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
      </button>
      <button type="button" class="calc-history-clear" data-hist-clear aria-label="Clear calculation history">Clear</button>
    </div>
    <ul class="calc-history-list" data-hist-list></ul>
  `;
  mount.appendChild(root);

  const countEl = root.querySelector<HTMLElement>('[data-hist-count]')!;
  const listEl = root.querySelector<HTMLElement>('[data-hist-list]')!;
  const toggleBtn = root.querySelector<HTMLButtonElement>('.calc-history-toggle')!;
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-hist-clear]')!;

  function renderList(): void {
    listEl.innerHTML = list
      .map(
        (e) => `
      <li class="calc-history-item" data-hist-item data-value="${esc(e.value)}" data-expr="${esc(e.expr)}" role="button" tabindex="0" aria-label="Use calculation ${esc(e.expr || e.value)}">
        <div class="calc-history-info">
          <span class="calc-history-value">${esc(e.value)}</span>
          ${e.expr ? `<span class="calc-history-expr">${esc(e.expr)}</span>` : ''}
        </div>
        <div class="calc-history-meta">
          <span class="calc-history-time">${relTime(e.ts)}</span>
          <button type="button" class="icon-copy-btn calc-history-copy" data-copy="${esc(e.value)}" aria-label="Copy ${esc(e.value)}" title="Copy">${COPY_ICON}</button>
        </div>
      </li>`,
      )
      .join('');
  }

  function triggerBadgePop(): void {
    countEl.classList.remove('is-popping');
    void countEl.offsetWidth;
    countEl.classList.add('is-popping');
  }

  function render(): void {
    const count = list.length;
    root.classList.toggle('has-entries', count > 0);
    countEl.textContent = String(count);
    if (count === 0) {
      root.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
    renderList();
  }

  toggleBtn.addEventListener('click', () => {
    if (!list.length) return;
    const open = root.classList.toggle('is-open');
    toggleBtn.setAttribute('aria-expanded', String(open));
    if (open) renderList(); // refresh relative timestamps on open
  });

  clearBtn.addEventListener('click', () => {
    list = [];
    clearHistory(key);
    render();
  });

  // Delegated listener: item click loads entry into calculator display, copy button copies.
  listEl.addEventListener('click', (e) => {
    const copyBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-copy]');
    if (copyBtn) {
      e.stopPropagation();
      void copyWithFeedback(copyBtn, copyBtn.getAttribute('data-copy') ?? '');
      return;
    }
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-hist-item]');
    if (item) {
      const val = item.getAttribute('data-value') ?? '';
      const expr = item.getAttribute('data-expr') ?? '';
      const calcDev = mount.closest<HTMLElement>('[data-keypad]');
      if (calcDev) {
        calcDev.dispatchEvent(new CustomEvent('calculator:load-history', { detail: { value: val, expr } }));
      }
    }
  });

  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = (e.target as HTMLElement).closest<HTMLElement>('[data-hist-item]');
      if (item && !(e.target as HTMLElement).closest('[data-copy]')) {
        e.preventDefault();
        item.click();
      }
    }
  });

  render();

  return {
    record(expr, value) {
      const v = (value ?? '').trim();
      if (EMPTY_MARKS.has(v)) return false;
      const last = list[0];
      if (last && last.value === v && last.expr === expr) return false;
      list.unshift({ expr: expr ?? '', value: v, ts: Date.now() });
      if (list.length > MAX) list.length = MAX;
      saveHistory(key, list);
      render();
      triggerBadgePop();
      return true;
    },
  };
}

// ---- Reusable "Calculate" button ------------------------------------------

/**
 * Wire the shared <CalculateButton /> (see components/CalculateButton.astro)
 * inside `root`. On click it runs `compute` — which should recompute the
 * result and record it to history — and briefly flashes "Saved" when a fresh
 * entry was stored so the click feels acknowledged even though the read-out
 * already previews live.
 *
 * `compute` returns whatever `HistoryController.record` returned (true when a
 * new entry was stored). Returning false leaves the button label untouched.
 */
export function wireCalculateButton(root: HTMLElement, compute: () => boolean): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-calc-btn]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const saved = compute();
    if (saved) flashSaved(btn);
  });
}

const SAVED_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

/** Briefly swap the button to a "Saved" checkmark, then restore it. */
function flashSaved(btn: HTMLElement): void {
  const prev = btn.getAttribute('data-revert-timer');
  if (prev) clearTimeout(Number(prev));
  const ico = btn.querySelector<HTMLElement>('[data-calc-ico]');
  const txt = btn.querySelector<HTMLElement>('[data-calc-txt]');
  const prevTxt = txt?.textContent ?? null;
  btn.classList.add('is-saved');
  if (ico) ico.innerHTML = SAVED_ICON;
  if (txt) txt.textContent = 'Saved';
  const timer = window.setTimeout(() => {
    btn.classList.remove('is-saved');
    if (ico) ico.innerHTML = CALC_ICON;
    if (txt && prevTxt !== null) txt.textContent = prevTxt;
    btn.removeAttribute('data-revert-timer');
  }, 1200);
  btn.setAttribute('data-revert-timer', String(timer));
}

// Kept in sync with the markup in components/CalculateButton.astro so the icon
// can be restored after the "Saved" flash.
const CALC_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="11" x2="8" y2="11"></line><line x1="12" y1="11" x2="12" y2="11"></line><line x1="16" y1="11" x2="16" y2="11"></line><line x1="8" y1="15" x2="8" y2="15"></line><line x1="12" y1="15" x2="12" y2="15"></line><line x1="16" y1="15" x2="16" y2="18"></line><line x1="8" y1="18" x2="12" y2="18"></line></svg>';
