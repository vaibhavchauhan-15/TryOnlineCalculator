// Tests for the unified preferences store (Task 1).
//
// These run under Node (no DOM), which exercises the SSR-safe path: the store
// resolves to defaults on load and never touches localStorage. We drive state
// through the test-only seam so behaviour is deterministic without a browser.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  getPreferences,
  getPreference,
  setPreference,
  setPreferences,
  subscribe,
  subscribeKey,
  resetPreferences,
  __setStateForTest,
} from './store';

test('defaults are complete and self-consistent', () => {
  resetPreferences();
  const p = getPreferences();
  assert.equal(p.locale, 'en');
  assert.ok(p.region && p.currency && p.numberFormat);
  assert.ok(p.unitSystem === 'metric' || p.unitSystem === 'imperial');
  assert.ok(['light', 'dark', 'system'].includes(p.theme));
});

test('set/get a single preference round-trips', () => {
  resetPreferences();
  setPreference('currency', 'INR');
  assert.equal(getPreference('currency'), 'INR');
});

test('locale and region are independent (English content, Indian formatting)', () => {
  resetPreferences();
  setPreferences({ locale: 'en', region: 'IN', currency: 'INR', numberFormat: 'en-IN' });
  const p = getPreferences();
  assert.equal(p.locale, 'en');
  assert.equal(p.region, 'IN');
  assert.equal(p.numberFormat, 'en-IN');
  assert.notEqual(p.locale, p.region);
});

test('invalid locale falls back to default; region defaults from the locale', () => {
  __setStateForTest({ locale: 'zz' }); // unknown/disabled
  assert.equal(getPreference('locale'), 'en');
  __setStateForTest({ locale: 'de' });
  assert.equal(getPreference('region'), 'DE'); // German default region
});

test('subscribe fires once per real change and not for no-ops', () => {
  resetPreferences();
  let calls = 0;
  const off = subscribe(() => calls++);
  setPreference('theme', 'light'); // change
  setPreference('theme', 'light'); // no-op, must not fire
  assert.equal(calls, 1);
  off();
  setPreference('theme', 'dark'); // after unsubscribe, must not fire
  assert.equal(calls, 1);
});

test('subscribeKey only fires for its own facet', () => {
  resetPreferences();
  let currencyChanges = 0;
  const off = subscribeKey('currency', () => currencyChanges++);
  setPreference('theme', 'light'); // different facet → no fire
  assert.equal(currencyChanges, 0);
  setPreference('currency', 'EUR'); // matching facet → fire
  assert.equal(currencyChanges, 1);
  off();
});
