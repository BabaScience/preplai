import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/player-bootstrap.ts'),
      name: 'PreplaiPlayer',
      fileName: () => 'player-bundle.js',
      formats: ['iife'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    target: 'es2020',
    minify: true,
    sourcemap: true,
  },
});
