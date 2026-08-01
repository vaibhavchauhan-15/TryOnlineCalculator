// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderLocalizedResultHTML } from '../lib/i18n/render-localized';
import { getEngine } from '../lib/calculator-engine';
import { regionDefaultsForLocale } from '../lib/i18n/region-defaults';
import { createResolver } from '../lib/i18n/resolver';

describe('Calculator Component & DOM Testing (happy-dom)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('component: renders HTML results cleanly without unescaped tags', () => {
    const html = renderLocalizedResultHTML({
      items: [
        { key: 'res', label: '<script>alert("xss")</script>', value: '$100.00', primary: true, tone: 'success' },
      ],
    });

    container.innerHTML = html;
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).toContain('&lt;script&gt;');
    expect(container.querySelector('[data-primary-value]')?.textContent).toBe('$100.00');
  });

  it('component: verifies loan calculator engine produces valid HTML structures', () => {
    const engine = getEngine('loan-calculator');
    expect(engine).toBeDefined();

    if (!engine || !engine.parseInput) return;

    const input = engine.parseInput({ amount: '50000', rate: '6.5', term: '15' });
    const result = engine.compute(input);
    const ctx = regionDefaultsForLocale('en');
    const displayResult = createResolver({ labels: {}, enums: {}, hints: {} }, { labels: {}, enums: {}, hints: {} }, ctx).resolve(result);

    const html = renderLocalizedResultHTML(displayResult);
    container.innerHTML = html;
    expect(container.querySelector('[data-primary-value]')).not.toBeNull();
  });
});
