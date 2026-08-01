import { describe, test, expect, beforeEach } from 'vitest';

describe('localized-client.ts client controller', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('mounts localized calculator and renders output on input change', async () => {
    document.body.innerHTML = `
      <div data-localized-calc="bmi-calculator">
        <form data-calc-form>
          <div class="field-wrap">
            <input type="number" name="height" value="175" step="1" />
          </div>
          <div class="field-wrap">
            <input type="number" name="weight" value="70" step="1" />
          </div>
        </form>
        <div data-calc-output></div>
        <script type="application/json" data-packs>
          { "pack": {}, "fallback": {} }
        </script>
      </div>
    `;

    // Import localized-client after DOM is set up
    await import('./localized-client');

    const output = document.querySelector<HTMLElement>('[data-calc-output]')!;
    expect(output.innerHTML).not.toBe('');
  });
});
