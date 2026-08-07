import { describe, test, expect, beforeEach, vi } from 'vitest';
import { isLiveSupported, fetchLiveRates, fetchHistory, isHistoryRange, STATIC_USD_PER } from './rates';

describe('rates.ts live exchange rate module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('isLiveSupported checks ECB supported currencies', () => {
    expect(isLiveSupported('USD')).toBe(true);
    expect(isLiveSupported('EUR')).toBe(true);
    expect(isLiveSupported('INR')).toBe(true);
    expect(isLiveSupported('XYZ')).toBe(false);
  });

  test('isHistoryRange checks valid history range string', () => {
    expect(isHistoryRange('1w')).toBe(true);
    expect(isHistoryRange('1y')).toBe(true);
    expect(isHistoryRange('10y')).toBe(false);
  });

  test('fetchLiveRates normalises Frankfurter response to usdPer factors', async () => {
    const mockResponse = {
      date: '2026-08-01',
      rates: { EUR: 0.92, GBP: 0.78, JPY: 150 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const payload = await fetchLiveRates();

    expect(payload.source).toBe('live');
    expect(payload.usdPer.USD).toBe(1);
    expect(payload.usdPer.EUR).toBeCloseTo(1 / 0.92, 4);
    expect(payload.usdPer.INR).toBe(STATIC_USD_PER.INR);
  });

  test('fetchLiveRates throws on network error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as any);

    await expect(fetchLiveRates()).rejects.toThrow('Frankfurter 500');
  });

  test('fetchHistory resolves time-series points for supported currency pairs', async () => {
    const mockResponse = {
      rates: {
        '2026-07-25': { EUR: 0.91 },
        '2026-07-26': { EUR: 0.92 },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const hist = await fetchHistory('USD', 'EUR', '1w');

    expect(hist.supported).toBe(true);
    expect(hist.points).toHaveLength(2);
    expect(hist.points[0]).toEqual({ t: '2026-07-25', v: 0.91 });
  });

  test('fetchHistory returns empty non-supported for unsupported pair or identical pair', async () => {
    const same = await fetchHistory('USD', 'USD', '1w');
    expect(same.supported).toBe(false);
    expect(same.points).toHaveLength(0);

    const unsupported = await fetchHistory('USD', 'XYZ', '1w');
    expect(unsupported.supported).toBe(false);
  });
});
