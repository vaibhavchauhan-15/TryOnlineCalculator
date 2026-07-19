// Client controller for localized calculator widgets (Task 6).
//
// This is the browser half of the i18n renderer. A localized page ships:
//   * a server-rendered form built from the engine's presentation-neutral
//     field descriptors (labels already localized), and
//   * the calculator's label pack + English fallback serialized into a
//     <script type="application/json"> tag.
//
// On mount this controller wires the form to the PURE engine + the localization
// resolver, so the result re-computes as the user types AND re-renders live
// whenever a preference changes (numberFormat / currency / unitSystem) — with
// no page reload. The server render is the no-JS fallback; everything here is
// pure enhancement.

import { getEngine } from '../calculator-engine';
import type { LabelPack } from './resolver';
import { createResolver } from './resolver';
import type { FormatContext } from './format-locale';
import { renderLocalizedResultHTML } from './render-localized';
import { getPreferences, subscribe, setPreferences, type Preferences } from '../preferences/store';
import { isExplicitCurrencyChoice, setLocaleCurrency } from '../currency';
import { regionDefaultsForLocale } from './region-defaults';
import { splitLocale } from './paths';
import { fetchLiveRates, STATIC_USD_PER } from '../rates';
import { loadState, saveState, clearState } from '../storage';
import { track } from '../analytics';

type Values = Record<string, string>;

/** Preferences → the formatting context the resolver/formatters consume. */
function formatContextFor(p: Preferences): FormatContext {
  return { numberFormat: p.numberFormat, currency: p.currency, unitSystem: p.unitSystem };
}

/** Collect every named control's value (radios collapse to the checked value). */
function collect(form: HTMLFormElement): Values {
  const values: Values = {};
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name]').forEach((el) => {
    if (el instanceof HTMLInputElement && el.type === 'radio') {
      if (el.checked) values[el.name] = el.value;
    } else {
      values[el.name] = el.value;
    }
  });
  return values;
}

/** Re-apply saved values to the freshly rendered form. */
function restore(form: HTMLFormElement, state: Values): void {
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name]').forEach((el) => {
    const saved = state[el.name];
    if (saved === undefined) return;
    if (el instanceof HTMLInputElement && el.type === 'radio') el.checked = el.value === saved;
    else el.value = saved;
  });
}

/** Show/hide conditional fields (data-show-field) and disable hidden inputs. */
function applyVisibility(root: HTMLElement, values: Values): void {
  root.querySelectorAll<HTMLElement>('[data-show-field]').forEach((wrap) => {
    const field = wrap.dataset.showField!;
    const allowed = (wrap.dataset.showValues || '').split('|');
    const show = allowed.includes(values[field]);
    wrap.hidden = !show;
    wrap.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name]').forEach((el) => {
      el.disabled = !show;
    });
  });
}

/** Nudge a number field by its step and fire `input` so the result re-runs. */
function stepInput(input: HTMLInputElement, dir: 1 | -1): void {
  const step = Number(input.step) || 1;
  const min = input.min !== '' ? Number(input.min) : -Infinity;
  const max = input.max !== '' ? Number(input.max) : Infinity;
  const seed = input.value !== '' ? Number(input.value) : Number(input.placeholder || '0');
  const base = Number.isFinite(seed) ? seed : 0;
  const next = Math.min(max, Math.max(min, base + dir * step));
  const decimals = (String(step).split('.')[1] || '').length;
  input.value = decimals ? next.toFixed(decimals) : String(Math.round(next));
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function wireSteppers(form: HTMLFormElement): void {
  let hold: ReturnType<typeof setTimeout> | undefined;
  let repeat: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    if (hold) clearTimeout(hold);
    if (repeat) clearInterval(repeat);
    hold = repeat = undefined;
  };
  form.addEventListener('pointerdown', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-step-up],[data-step-down]');
    if (!btn) return;
    e.preventDefault();
    const input = btn.closest('.field-wrap')?.querySelector<HTMLInputElement>('input[type="number"]');
    if (!input || input.disabled) return;
    const dir: 1 | -1 = btn.hasAttribute('data-step-up') ? 1 : -1;
    stepInput(input, dir);
    hold = setTimeout(() => {
      repeat = setInterval(() => stepInput(input, dir), 70);
    }, 350);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => form.addEventListener(ev, stop));
}

function mount(root: HTMLElement): void {
  const slug = root.dataset.localizedCalc!;
  const engine = getEngine(slug);
  const form = root.querySelector<HTMLFormElement>('form[data-calc-form]');
  const output = root.querySelector<HTMLElement>('[data-calc-output]');
  const packEl = root.querySelector<HTMLScriptElement>('script[data-packs]');
  if (!engine || !engine.fields || !engine.parseInput || !form || !output || !packEl) return;

  let pack: LabelPack = {};
  let fallback: LabelPack = {};
  try {
    const parsed = JSON.parse(packEl.textContent || '{}') as { pack: LabelPack; fallback: LabelPack };
    pack = parsed.pack ?? {};
    fallback = parsed.fallback ?? {};
  } catch {
    return; // malformed packs — keep the SSR result
  }

  const storeKey = `lcalc:${slug}`;
  const saved = loadState<Values>(storeKey);
  if (saved) restore(form, saved);

  // Live FX rates for the currency converter are injected as runtime data. We
  // start from the static baseline (instant, offline) and upgrade to live rates
  // when the fetch resolves.
  const runtime: Record<string, unknown> = {};
  if (slug === 'currency-converter') runtime.usdPer = { ...STATIC_USD_PER };

  let ctx: FormatContext = formatContextFor(getPreferences());

  // Repaint the currency symbol on monetary input prefixes for the active
  // currency, widening the field padding so multi-char symbols never overlap.
  const paintCurrencyPrefix = () => {
    let sym = ctx.currency;
    try {
      const parts = new Intl.NumberFormat(ctx.numberFormat, { style: 'currency', currency: ctx.currency }).formatToParts(0);
      sym = parts.find((p) => p.type === 'currency')?.value ?? ctx.currency;
    } catch {
      /* keep the code as the symbol */
    }
    root.querySelectorAll<HTMLElement>('[data-currency-prefix]').forEach((affix) => {
      if (affix.textContent !== sym) affix.textContent = sym;
      const input = affix.closest('.field-wrap')?.querySelector<HTMLElement>('.field');
      if (!input) return;
      const w = Math.ceil(affix.getBoundingClientRect().width);
      if (w > 0) input.style.paddingLeft = `calc(0.75rem + ${w}px + 0.35rem)`;
    });
  };

  const render = () => {
    const values = collect(form);
    applyVisibility(root, values);
    const input = engine.parseInput!(collect(form), runtime);
    const validation = engine.validate(input);
    if (!validation.valid) {
      // Keep the last good result rather than blanking on a transient invalid
      // state (e.g. a momentarily empty field mid-edit).
      saveState(storeKey, values);
      return;
    }
    const result = engine.compute(input);
    const display = createResolver(pack, fallback, ctx).resolve(result);
    output.innerHTML = renderLocalizedResultHTML(display);
    saveState(storeKey, values);
  };

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  wireSteppers(form);

  // Re-render live on any preference change that affects formatting.
  subscribe((p) => {
    const next = formatContextFor(p);
    if (next.numberFormat === ctx.numberFormat && next.currency === ctx.currency && next.unitSystem === ctx.unitSystem) return;
    ctx = next;
    paintCurrencyPrefix();
    render();
  });

  // The Calculate button re-runs the computation explicitly (the result also
  // updates live as the user types, so this is a confirming affordance).
  root.querySelector('[data-calc-btn]')?.addEventListener('click', () => render());

  // Reset control.
  root.querySelector('[data-calc-reset]')?.addEventListener('click', () => {
    form.reset();
    clearState(storeKey);
    render();
  });

  // Copy the headline value.
  output.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-copy-result]');
    if (!btn) return;
    const el = output.querySelector<HTMLElement>('[data-primary-value]');
    const val = (el?.textContent ?? '').trim();
    void navigator.clipboard?.writeText(val).catch(() => {});
  });

  // Currency converter: upgrade to live rates once, then re-render.
  if (slug === 'currency-converter') {
    fetchLiveRates()
      .then((payload) => {
        runtime.usdPer = payload.usdPer;
        render();
      })
      .catch(() => {/* keep static baseline */});
  }

  paintCurrencyPrefix();
  render();
}

function init(): void {
  // If the user hasn't explicitly chosen a currency, sync to the page locale's
  // default. E.g. on /de/ pages, auto-set EUR; on /hi/ pages, auto-set INR.
  // This ensures the currency matches the page language on first visit.
  if (!isExplicitCurrencyChoice()) {
    const { locale } = splitLocale(location.pathname);
    if (locale) {
      const defaults = regionDefaultsForLocale(locale);
      setLocaleCurrency(defaults.currency);
      // Also update the preferences store so the formatContext is in sync.
      const prefs = getPreferences();
      if (prefs.currency !== defaults.currency || prefs.numberFormat !== defaults.numberFormat) {
        setPreferences({ currency: defaults.currency, numberFormat: defaults.numberFormat });
      }
    }
  }

  const roots = document.querySelectorAll<HTMLElement>('[data-localized-calc]');
  roots.forEach(mount);
  if (roots.length) track('calculator_view', { count: roots.length });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
