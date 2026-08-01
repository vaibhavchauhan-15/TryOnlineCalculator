import { describe, test, expect, beforeEach, vi } from 'vitest';
import { track } from './analytics';

describe('analytics.ts facade', () => {
  beforeEach(() => {
    delete window.gtag;
    delete window.__tocEvents;
  });

  test('track pushes events to window.__tocEvents ring buffer', () => {
    track('calculator_view', { id: 'bmi-calculator' });

    expect(window.__tocEvents).toHaveLength(1);
    expect(window.__tocEvents?.[0].event).toBe('calculator_view');
    expect(window.__tocEvents?.[0].params).toEqual({ id: 'bmi-calculator' });
  });

  test('track calls window.gtag when defined', () => {
    const mockGtag = vi.fn();
    window.gtag = mockGtag;

    track('language_switch', { from: 'en', to: 'de' });

    expect(mockGtag).toHaveBeenCalledWith('event', 'language_switch', { from: 'en', to: 'de' });
  });

  test('track handles buffer overflow at 50 events', () => {
    for (let i = 0; i < 60; i++) {
      track('search_query', { q: `test-${i}` });
    }

    expect(window.__tocEvents).toHaveLength(50);
    expect(window.__tocEvents?.[0].params).toEqual({ q: 'test-10' });
    expect(window.__tocEvents?.[49].params).toEqual({ q: 'test-59' });
  });
});
