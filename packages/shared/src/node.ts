/**
 * @preplai/shared/node — Node-only utilities
 *
 * These exports use node:crypto and process.env, so they CANNOT be bundled
 * for the browser (Vite/Rollup). Import from '@preplai/shared/node' in
 * server-side code only (API, MCP server, compiler CLI).
 *
 * Browser-safe exports live in '@preplai/shared' (the default entry).
 */

// Cryptographic utilities (API key generation, hashing)
export { KEY_PREFIX, hashKey, generateApiKey, hashSecret } from './crypto.js';

// URL construction (uses process.env)
export { getApiBase, getWebsiteBase, getMcpResource } from './urls.js';
