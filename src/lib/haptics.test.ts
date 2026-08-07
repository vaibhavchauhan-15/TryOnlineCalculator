import { describe, test, expect, beforeEach, vi } from 'vitest';
import { haptic } from './haptics';

describe('haptics.ts tactile feedback', () => {
  let vibrateMock: any;

  beforeEach(() => {
    vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
      configurable: true,
    });
  });

  test('haptic.tap() triggers 8ms vibration', () => {
    haptic.tap();
    expect(vibrateMock).toHaveBeenCalledWith(8);
  });

  test('haptic.medium() triggers 12ms vibration', () => {
    haptic.medium();
    expect(vibrateMock).toHaveBeenCalledWith(12);
  });

  test('haptic.success() triggers pulse pattern', () => {
    haptic.success();
    expect(vibrateMock).toHaveBeenCalledWith([10, 40, 14]);
  });

  test('haptic.error() triggers 24ms vibration', () => {
    haptic.error();
    expect(vibrateMock).toHaveBeenCalledWith(24);
  });

  test('suppresses vibration when prefers-reduced-motion is true', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
    haptic.tap();
    expect(vibrateMock).not.toHaveBeenCalled();
  });
});
