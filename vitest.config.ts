import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'server.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx', 'server.ts'],
      exclude: [
        'src/main.tsx',
        'src/routeTree.gen.ts',
        'src/routes/**',
        '**/*.test.*',
        'dist/**',
        'e2e/**',
      ],
    },
  },
});
