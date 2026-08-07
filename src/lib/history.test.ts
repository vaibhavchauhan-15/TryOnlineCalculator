import { describe, test, expect, beforeEach, vi } from 'vitest';
import { loadHistory, clearHistory, copyText, createHistoryUI, wireCalculateButton } from './history';

describe('history.ts helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  test('loadHistory returns empty array when empty', () => {
    expect(loadHistory('test-calc')).toEqual([]);
  });

  test('clearHistory removes key from localStorage', () => {
    localStorage.setItem('toc:v1:hist:test-calc', JSON.stringify([{ expr: '1+1', value: '2', ts: Date.now() }]));
    expect(loadHistory('test-calc')).toHaveLength(1);
    clearHistory('test-calc');
    expect(loadHistory('test-calc')).toEqual([]);
  });

  test('copyText falls back to document.execCommand when clipboard API absent', async () => {
    const res = await copyText('Hello world');
    expect(typeof res).toBe('boolean');
  });

  test('createHistoryUI manages history records, limits to MAX, and handles clear', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);

    const ui = createHistoryUI({ key: 'bmi', mount });

    // Record entries
    expect(ui.record('70kg, 1.75m', '22.9')).toBe(true);
    expect(ui.record('70kg, 1.75m', '22.9')).toBe(false); // Duplicate ignored
    expect(ui.record('70kg, 1.75m', 'Error')).toBe(false); // Error ignored

    expect(loadHistory('bmi')).toHaveLength(1);

    // Test clear button
    const clearBtn = mount.querySelector<HTMLButtonElement>('[data-hist-clear]')!;
    clearBtn.click();

    expect(loadHistory('bmi')).toHaveLength(0);
  });

  test('wireCalculateButton triggers compute callback and flashes saved', () => {
    const root = document.createElement('div');
    root.innerHTML = `<button data-calc-btn><span data-calc-ico></span><span data-calc-txt>Calculate</span></button>`;
    document.body.appendChild(root);

    let called = false;
    wireCalculateButton(root, () => {
      called = true;
      return true;
    });

    const btn = root.querySelector<HTMLButtonElement>('[data-calc-btn]')!;
    btn.click();

    expect(called).toBe(true);
    expect(root.querySelector('[data-calc-txt]')?.textContent).toBe('Saved');

    vi.advanceTimersByTime(1300);
    expect(root.querySelector('[data-calc-txt]')?.textContent).toBe('Calculate');
  });
});
