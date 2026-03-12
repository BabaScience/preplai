/**
 * Vite config for MCP App single-file HTML build.
 *
 * Bundles mcp-app.html + mcp-app-bootstrap.ts + mcp-app-styles.css
 * into a single self-contained HTML file at dist/mcp-app.html.
 *
 * Uses vite-plugin-singlefile to inline all JS/CSS into the HTML.
 */
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'mcp-app.html'),
    },
    target: 'es2020',
    minify: true,
  },
});
