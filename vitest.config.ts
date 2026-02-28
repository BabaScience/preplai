import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve workspace packages to source (not dist) for testing
      '@pre/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
      '@pre/illustrations': path.resolve(__dirname, 'packages/illustrations/src/index.ts'),
      '@pre/compiler': path.resolve(__dirname, 'packages/compiler/src/index.ts'),
      '@pre/player': path.resolve(__dirname, 'packages/player/src/index.ts'),
      '@pre/mcp-server': path.resolve(__dirname, 'packages/mcp-server/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts'],
    environmentMatchGlobs: [
      // illustrations and player tests need DOM APIs
      ['packages/illustrations/**/*.test.ts', 'jsdom'],
      ['packages/player/**/*.test.ts', 'jsdom'],
      // Integration tests need DOM for rendering tests
      ['packages/mcp-server/**/integration.test.ts', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/index.ts'],
    },
    testTimeout: 5000,
  },
});
