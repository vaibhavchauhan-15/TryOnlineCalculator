import { defineConfig } from 'vitest/config';

// Vitest resolves modules through Vite exactly like Astro does, so the
// codebase's extensionless TS imports (e.g. `from '../types'`) work in tests
// without changes. Node's native --test runner cannot do this, which is why
// the project standardises on Vitest.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'happy-dom',
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'scripts/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
    },
  },
});
