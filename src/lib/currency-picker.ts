// Reusable searchable currency picker (progressive enhancement).
//
// Enhances any `[data-currency-picker]` element rendered by CurrencyPicker.astro
// into an accessible combobox: a trigger button that opens a floating panel with
// a search box and a filtered, keyboard-navigable list of currencies.
//
// It is deliberately decoupled from the currency store so it can drive either
// the global display currency (calculators) or a local value (the currency
// converter's from/to). Communication is via DOM events:
//   * emits  `cur:change` (bubbles, detail:{code}) when the user picks a currency
//   * listens for `cur:set` (detail:{code}) to set the value with no emit
// and it always mirrors the current value on the `data-value` attribute.
//
// Fast: the search index is built once from the catalog and each keystroke is a
// simple scored substring scan over ~50 entries. Smooth: the panel is
// fixed-positioned from the trigger's rect so it floats above everything (never
// clipped by or overlapping surrounding cards) and flips above when short on
// space below.

import { CURRENCIES } from './currency';

interface IndexEntry {
  code: string;
  hay: string; // lowercased "code name country symbol" for matching
}

// Built once at module load — O(catalog) — so per-keystroke filtering is cheap.
const INDEX: IndexEntry[] = CURRENCIES.map((c) => ({
  code: c.code,
  hay: `${c.code} ${c.name} ${c.country} ${c.symbol}`.toLowerCase(),
}));

// The currently open panel's closer, so a single outside-click/Escape handler
// (and opening another picker) can dismiss whichever one is showing.
let closeOpen: (() => void) | null = null;

function score(entry: IndexEntry, q: string): number {
  const code = entry.code.toLowerCase();
  if (code === q) return 0;
  if (code.startsWith(q)) return 1;
  const idx = entry.hay.indexOf(q);
  if (idx === -1) return -1; // no match
  // Word-boundary hits rank above mid-word hits.
  return entry.hay[idx - 1] === ' ' || idx === 0 ? 2 : 3;
}

function enhance(root: HTMLElement): void {
  if (root.dataset.curpDone === '1') return;
  root.dataset.curpDone = '1';

  const trigger = root.querySelector<HTMLButtonElement>('.curp-trigger')!;
  const valueEl = root.querySelector<HTMLElement>('.curp-value')!;
  const pop = root.querySelector<HTMLElement>('.curp-pop')!;
  const search = root.querySelector<HTMLInputElement>('.curp-search')!;
  const list = root.querySelector<HTMLElement>('.curp-list')!;
  const empty = root.querySelector<HTMLElement>('.curp-empty')!;
  if (!trigger || !pop || !search || !list) return;

  const options = Array.from(list.querySelectorAll<HTMLElement>('.curp-opt'));
  const byCode = new Map(options.map((el) => [el.dataset.code!, el]));

  // Options currently matching the query, in ranked (visual) order.
  let visible: HTMLElement[] = options.slice();
  let activeIndex = -1;

  const labelFor = (code: string): string => {
    const el = byCode.get(code);
    return el ? el.dataset.trigger ?? code : code;
  };

  const reflectValue = (code: string): void => {
    root.dataset.value = code;
    valueEl.textContent = labelFor(code);
    options.forEach((el) =>
      el.setAttribute('aria-selected', el.dataset.code === code ? 'true' : 'false'),
    );
  };

  const setValue = (code: string, opts: { silent?: boolean } = {}): void => {
    if (!byCode.has(code)) return;
    const changed = root.dataset.value !== code;
    reflectValue(code);
    if (changed && !opts.silent) {
      root.dispatchEvent(new CustomEvent('cur:change', { bubbles: true, detail: { code } }));
    }
  };

  const setActive = (i: number): void => {
    if (!visible.length) {
      activeIndex = -1;
      list.removeAttribute('aria-activedescendant');
      return;
    }
    activeIndex = Math.max(0, Math.min(i, visible.length - 1));
    options.forEach((el) => el.classList.remove('is-active'));
    const el = visible[activeIndex];
    el.classList.add('is-active');
    if (el.id) list.setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  };

  const applyFilter = (raw: string): void => {
    const q = raw.trim().toLowerCase();
    if (!q) {
      visible = options.slice();
      options.forEach((el, i) => {
        el.hidden = false;
        el.style.order = String(i);
      });
    } else {
      const scored: { el: HTMLElement; s: number; i: number }[] = [];
      INDEX.forEach((entry, i) => {
        const el = byCode.get(entry.code);
        // The index covers the whole currency catalog; a picker may render a
        // subset (e.g. tests, a region-restricted list). Skip codes absent
        // from the DOM.
        if (!el) return;
        const s = score(entry, q);
        if (s < 0) {
          el.hidden = true;
        } else {
          el.hidden = false;
          scored.push({ el, s, i });
        }
      });
      scored.sort((a, b) => a.s - b.s || a.i - b.i);
      scored.forEach((item, pos) => (item.el.style.order = String(pos)));
      visible = scored.map((item) => item.el);
    }
    empty.hidden = visible.length > 0;
    // Keep the selected option active if still visible, else the top match.
    const selected = root.dataset.value;
    const selIdx = visible.findIndex((el) => el.dataset.code === selected);
    setActive(selIdx >= 0 ? selIdx : 0);
  };

  const positionPop = (): void => {
    const r = trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const width = Math.round(Math.min(Math.max(r.width, 280), vw - 16));
    // Anchor the panel's RIGHT edge to the trigger's right edge so it opens back
    // over its own column (the compact chip sits at the top-right of the form)
    // instead of spilling sideways across the grid gap onto the result cards.
    // The full-width `field` variant is as wide as the panel, so this collapses
    // to a plain left-aligned drop with no change in behaviour.
    let left = r.right - width;
    if (left < 8) left = 8; // never run off the left edge
    if (left + width > vw - 8) left = vw - 8 - width; // nor the right edge
    pop.style.width = `${width}px`;
    pop.style.left = `${Math.round(left)}px`;

    // Measure height with the panel laid out, then decide below vs above.
    const popH = pop.offsetHeight;
    const below = vh - r.bottom - 8;
    const above = r.top - 8;
    if (below >= popH || below >= above) {
      pop.style.top = `${Math.round(r.bottom + 6)}px`;
      pop.style.maxHeight = `${Math.round(Math.min(below - 6, 360))}px`;
    } else {
      pop.style.maxHeight = `${Math.round(Math.min(above - 6, 360))}px`;
      pop.style.top = `${Math.round(r.top - Math.min(pop.offsetHeight, above - 6) - 6)}px`;
    }
  };

  let rafId = 0;
  const onViewportChange = (): void => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      positionPop();
    });
  };

  const open = (): void => {
    if (!pop.hidden) return;
    if (closeOpen) closeOpen();
    pop.hidden = false;
    root.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    search.value = '';
    applyFilter('');
    positionPop();
    closeOpen = close;
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    // Focus the search box so typing filters immediately.
    search.focus();
  };

  function close(focusTrigger = false): void {
    if (pop.hidden) return;
    pop.hidden = true;
    root.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    list.removeAttribute('aria-activedescendant');
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
    if (closeOpen === close) closeOpen = null;
    if (focusTrigger) trigger.focus();
  }

  const commit = (el: HTMLElement | undefined): void => {
    if (!el || el.hidden) return;
    setValue(el.dataset.code!);
    close(true);
  };

  // ---- Events ------------------------------------------------------------
  trigger.addEventListener('click', () => {
    if (pop.hidden) open();
    else close(true);
  });

  // Keep the search box's events inside the picker: when the picker sits inside
  // a calculator <form>, a bubbling `input` would trigger a needless recompute.
  pop.addEventListener('input', (e) => e.stopPropagation());

  search.addEventListener('input', () => applyFilter(search.value));

  search.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(visible.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        commit(visible[activeIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  });

  list.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.curp-opt');
    if (el) commit(el);
  });

  list.addEventListener('mousemove', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.curp-opt');
    if (!el) return;
    const idx = visible.indexOf(el);
    if (idx >= 0 && idx !== activeIndex) setActive(idx);
  });

  // Programmatic set (e.g. store sync, converter swap) — no change emit.
  root.addEventListener('cur:set', (e) => {
    const code = (e as CustomEvent<{ code: string }>).detail?.code;
    if (code) setValue(code, { silent: true });
  });

  // Initialise the trigger label from the server-rendered value.
  reflectValue(root.dataset.value || CURRENCIES[0].code);
}

/** Enhance every not-yet-enhanced currency picker under `root`. Idempotent. */
export function enhanceCurrencyPickers(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-currency-picker]:not([data-curp-done])').forEach(enhance);
}

function init(): void {
  enhanceCurrencyPickers();
  document.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement;
    if (closeOpen && !target.closest('[data-currency-picker]')) closeOpen();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && closeOpen) closeOpen();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
