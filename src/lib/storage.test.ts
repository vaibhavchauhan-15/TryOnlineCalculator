import { describe, test, expect, beforeEach, vi } from 'vitest';
import { loadState, saveState, clearState } from './storage';

describe('storage.ts helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  test('loadState returns null for non-existent key', () => {
    expect(loadState('missing')).toBeNull();
  });

  test('saveState debounces writes and flushes after delay', () => {
    saveState('test-key', { a: 1 }, 100);
    expect(loadState('test-key')).toBeNull();

    vi.advanceTimersByTime(150);
    expect(loadState('test-key')).toEqual({ a: 1 });
  });

  test('saveState newest value wins during rapid writes', () => {
    saveState('test-key', { step: 1 }, 100);
    saveState('test-key', { step: 2 }, 100);
    saveState('test-key', { step: 3 }, 100);

    vi.advanceTimersByTime(150);
    expect(loadState('test-key')).toEqual({ step: 3 });
  });

  test('clearState removes item and cancels pending timer', () => {
    saveState('test-key', { val: 42 }, 100);
    clearState('test-key');

    vi.advanceTimersByTime(150);
    expect(loadState('test-key')).toBeNull();
  });

  test('loadState handles JSON parse errors gracefully', () => {
    localStorage.setItem('toc:v1:corrupt', '{invalid json');
    expect(loadState('corrupt')).toBeNull();
  });
});
