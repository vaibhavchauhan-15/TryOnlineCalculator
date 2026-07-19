import { defineConfig } from 'vitest/config';

// Vitest resolves modules through Vite exactly like Astro does, so the
// codebase's extensionless TS imports (e.g. `from '../types'`) work in tests
// without changes. Node's native --test runner cannot do this, which is why
// the project standardises on Vitest.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
