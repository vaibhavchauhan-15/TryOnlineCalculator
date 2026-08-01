import { describe, test, expect, beforeEach, vi } from 'vitest';
import { initCurrencyConverter } from './currency-converter';

describe('currency-converter.ts client widget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('mounts currency converter widget, performs conversion and handles swap', () => {
    document.body.innerHTML = `
      <div data-cc>
        <script type="application/json" data-cc-config>
          {
            "usdPer": { "USD": 1, "EUR": 1.08 },
            "live": ["USD", "EUR"],
            "defaultFrom": "USD",
            "defaultTo": "EUR",
            "defaultValue": "100"
          }
        </script>
        <input type="text" data-cc-amount value="100" />
        <div data-currency-picker data-cc-from data-value="USD">
          <button class="curp-trigger"><span class="curp-value">USD</span></button>
          <div class="curp-pop" hidden>
            <input class="curp-search" />
            <ul class="curp-list"><li class="curp-opt" data-code="USD">USD</li><li class="curp-opt" data-code="EUR">EUR</li></ul>
            <div class="curp-empty" hidden></div>
          </div>
        </div>
        <div data-currency-picker data-cc-to data-value="EUR">
          <button class="curp-trigger"><span class="curp-value">EUR</span></button>
          <div class="curp-pop" hidden>
            <input class="curp-search" />
            <ul class="curp-list"><li class="curp-opt" data-code="USD">USD</li><li class="curp-opt" data-code="EUR">EUR</li></ul>
            <div class="curp-empty" hidden></div>
          </div>
        </div>
        <button data-cc-swap type="button">Swap</button>
        <button data-cc-copy type="button">Copy</button>
        <div data-cc-result></div>
        <div data-cc-updated></div>
        <div data-cc-chart></div>
        <div data-cc-chart-title></div>
        <div data-cc-change></div>
        <div data-cc-chart-note></div>
        <div data-cc-ranges><button data-range="1w">1w</button><button data-range="1m" class="is-active">1m</button></div>
      </div>
    `;

    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})); // pending promise

    initCurrencyConverter();

    const resultEl = document.querySelector<HTMLElement>('[data-cc-result]')!;
    const swapBtn = document.querySelector<HTMLButtonElement>('[data-cc-swap]')!;
    const fromPicker = document.querySelector<HTMLElement>('[data-cc-from]')!;
    const toPicker = document.querySelector<HTMLElement>('[data-cc-to]')!;

    expect(resultEl.textContent).not.toBe('—');
    expect(fromPicker.dataset.value).toBe('USD');
    expect(toPicker.dataset.value).toBe('EUR');

    // Test swap button
    swapBtn.click();
    expect(fromPicker.dataset.value).toBe('EUR');
    expect(toPicker.dataset.value).toBe('USD');
  });
});
