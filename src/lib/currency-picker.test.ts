import { describe, test, expect, beforeEach } from 'vitest';
import { enhanceCurrencyPickers } from './currency-picker';

describe('currency-picker.ts reusable component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('enhances currency picker element with searching and custom events', () => {
    document.body.innerHTML = `
      <div data-currency-picker data-value="USD">
        <button type="button" class="curp-trigger">
          <span class="curp-value">USD</span>
        </button>
        <div class="curp-pop" hidden>
          <input type="text" class="curp-search" />
          <ul class="curp-list">
            <li class="curp-opt" data-code="USD" data-trigger="USD ($)">USD</li>
            <li class="curp-opt" data-code="EUR" data-trigger="EUR (€)">EUR</li>
            <li class="curp-opt" data-code="GBP" data-trigger="GBP (£)">GBP</li>
          </ul>
          <div class="curp-empty" hidden>No results</div>
        </div>
      </div>
    `;

    enhanceCurrencyPickers();

    const root = document.querySelector<HTMLElement>('[data-currency-picker]')!;
    const trigger = document.querySelector<HTMLButtonElement>('.curp-trigger')!;
    const search = document.querySelector<HTMLInputElement>('.curp-search')!;
    const pop = document.querySelector<HTMLElement>('.curp-pop')!;

    expect(root.dataset.curpDone).toBe('1');

    // Click to open
    trigger.click();
    expect(pop.hidden).toBe(false);

    // Search filter
    search.value = 'eur';
    search.dispatchEvent(new Event('input'));

    const eurOpt = document.querySelector<HTMLLIElement>('[data-code="EUR"]')!;
    let changeFired = false;
    root.addEventListener('cur:change', (e: any) => {
      if (e.detail.code === 'EUR') changeFired = true;
    });

    eurOpt.click();
    expect(changeFired).toBe(true);
    expect(root.dataset.value).toBe('EUR');
    expect(pop.hidden).toBe(true);
  });
});
