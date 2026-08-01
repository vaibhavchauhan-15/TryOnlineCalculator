import { describe, test, expect, beforeEach } from 'vitest';
import { enhanceSelects } from './dropdown';

describe('dropdown.ts custom select enhancement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('enhances native <select> elements into styled listbox', () => {
    document.body.innerHTML = `
      <label for="color-select" id="color-label">Choose color</label>
      <select id="color-select">
        <option value="red">Red</option>
        <option value="blue" selected>Blue</option>
        <option value="green">Green</option>
      </select>
    `;

    enhanceSelects();

    const wrap = document.querySelector('.cs')!;
    const trigger = document.querySelector<HTMLButtonElement>('.cs-trigger')!;
    const listbox = document.querySelector<HTMLUListElement>('.cs-panel')!;
    const select = document.querySelector<HTMLSelectElement>('#color-select')!;

    expect(wrap).not.toBeNull();
    expect(trigger).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(select.classList.contains('cs-native')).toBe(true);
    expect(trigger.textContent).toContain('Blue');

    // Test clicking trigger to open panel
    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(listbox.hidden).toBe(false);

    // Test selecting another option
    const greenOption = listbox.querySelector<HTMLLIElement>('[data-value="green"]')!;
    greenOption.click();

    expect(select.value).toBe('green');
    expect(trigger.textContent).toContain('Green');
    expect(listbox.hidden).toBe(true);
  });

  test('syncs trigger text when cs:sync event is dispatched', () => {
    document.body.innerHTML = `
      <select id="unit-select">
        <option value="m">Meters</option>
        <option value="ft">Feet</option>
      </select>
    `;

    enhanceSelects();

    const select = document.querySelector<HTMLSelectElement>('#unit-select')!;
    const trigger = document.querySelector<HTMLButtonElement>('.cs-trigger')!;

    select.value = 'ft';
    select.dispatchEvent(new Event('cs:sync', { bubbles: true }));

    expect(trigger.textContent).toContain('Feet');
  });
});
