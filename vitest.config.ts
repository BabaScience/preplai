import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve workspace packages to source (not dist) for testing
      '@preplai/shared/node': path.resolve(__dirname, 'packages/shared/src/node.ts'),
      '@preplai/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
      '@preplai/illustrations': path.resolve(__dirname, 'packages/illustrations/src/index.ts'),
      '@preplai/compiler': path.resolve(__dirname, 'packages/compiler/src/index.ts'),
      '@preplai/player': path.resolve(__dirname, 'packages/player/src/index.ts'),
      '@preplai/mcp-server': path.resolve(__dirname, 'packages/mcp-server/src/index.ts'),
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
