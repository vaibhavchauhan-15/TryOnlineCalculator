// Client-side calculator engine. Mounts every [data-calculator] widget on the
// page, runs its compute() live as the user types, toggles conditional fields
// and wires up the reset + copy controls.

import { getCalculator } from './calculators';
import type { Values } from './types';
import { renderResultsHTML } from './render';
import { loadState, saveState, clearState } from './storage';
import { createHistoryUI, copyWithFeedback } from './history';

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Capture every named control's raw value so hidden/disabled fields survive a
// refresh too. Radios collapse to their selected value under the shared name.
function serialize(form: HTMLFormElement): Record<string, string> {
  const state: Record<string, string> = {};
  form.querySelectorAll<FormEl>('[name]').forEach((el) => {
    if (el instanceof HTMLInputElement && el.type === 'radio') {
      if (el.checked) state[el.name] = el.value;
    } else {
      state[el.name] = el.value;
    }
  });
  return state;
}

// Re-apply previously saved values onto the freshly rendered (empty) form.
function restore(form: HTMLFormElement, state: Record<string, string>): void {
  form.querySelectorAll<FormEl>('[name]').forEach((el) => {
    const saved = state[el.name];
    if (saved === undefined) return;
    if (el instanceof HTMLInputElement && el.type === 'radio') {
      el.checked = el.value === saved;
    } else {
      el.value = saved;
    }
  });
}

function collect(form: HTMLFormElement): Values {
  const values: Values = {};
  const data = new FormData(form);
  for (const [k, v] of data.entries()) {
    values[k] = typeof v === 'string' ? v : '';
  }
  // Ensure unchecked-but-present controls (disabled hidden fields) still resolve.
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name]').forEach((el) => {
    if (!(el.name in values) && el.type !== 'radio') values[el.name] = el.value;
  });
  return values;
}

function applyVisibility(root: HTMLElement, values: Values): void {
  root.querySelectorAll<HTMLElement>('[data-show-field]').forEach((wrap) => {
    const field = wrap.dataset.showField!;
    const allowed = (wrap.dataset.showValues || '').split('|');
    const show = allowed.includes(values[field]);
    wrap.hidden = !show;
    // Disable inputs in hidden wrappers so they drop out of FormData.
    wrap.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name]').forEach((el) => {
      el.disabled = !show;
    });
  });
}

function mount(root: HTMLElement): void {
  const slug = root.dataset.calculator!;
  const calc = getCalculator(slug);
  const form = root.querySelector<HTMLFormElement>('form[data-calc-form]');
  const output = root.querySelector<HTMLElement>('[data-calc-output]');
  if (!calc || !form || !output) return;

  const storeKey = `calc:${slug}`;

  // Restore saved values before the first render so the result reflects them.
  const saved = loadState<Record<string, string>>(storeKey);
  if (saved) restore(form, saved);

  // History panel (mounted below the result). record() is called on `change`
  // (i.e. when a field is committed / blurred) so we log meaningful results
  // rather than every keystroke.
  const historyMount = root.querySelector<HTMLElement>('[data-history-mount]');
  const history = historyMount ? createHistoryUI({ key: slug, mount: historyMount }) : null;

  const readPrimary = (): { label: string; value: string } | null => {
    const valEl = output.querySelector('[data-primary-value]');
    if (!valEl) return null;
    const labelEl = output.querySelector('.result-primary-label');
    return { label: labelEl?.textContent?.trim() ?? '', value: valEl.textContent?.trim() ?? '' };
  };

  const update = () => {
    // Visibility first so disabled fields drop out before we read values.
    applyVisibility(root, collect(form));
    const values = collect(form);
    const out = calc.compute(values);
    output.innerHTML = renderResultsHTML(out);
    saveState(storeKey, serialize(form));
  };

  form.addEventListener('input', update);
  form.addEventListener('change', () => {
    update();
    const primary = readPrimary();
    if (primary) history?.record(primary.label, primary.value);
  });

  // The small copy icon on the headline result (re-rendered each update, so
  // this is delegated on the stable output container).
  output.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-copy-result]');
    if (!btn) return;
    const val = output.querySelector('[data-primary-value]')?.textContent?.trim() ?? '';
    void copyWithFeedback(btn, val);
  });

  const resetBtn = root.querySelector<HTMLButtonElement>('[data-calc-reset]');
  resetBtn?.addEventListener('click', () => {
    form.reset();
    update();
    // Drop the just-persisted defaults so a refresh starts genuinely empty.
    clearState(storeKey);
  });

  const copyBtn = root.querySelector<HTMLButtonElement>('[data-calc-copy]');
  copyBtn?.addEventListener('click', async () => {
    const val = output.querySelector('[data-primary-value]')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(val);
      const label = copyBtn.querySelector('[data-copy-label]');
      if (label) {
        const prev = label.textContent;
        label.textContent = 'Copied';
        setTimeout(() => (label.textContent = prev), 1500);
      }
    } catch {
      /* clipboard unavailable */
    }
  });

  update();
}

function init(): void {
  document.querySelectorAll<HTMLElement>('[data-calculator]').forEach(mount);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
