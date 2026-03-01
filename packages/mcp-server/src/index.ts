/**
 * @preplai/mcp-server — Package Entry Point
 *
 * Re-exports all public modules for the MCP server package.
 */

// Database layer
export { createDatabase } from './db.js';
export type { SessionRow, VisualScriptRow, NarrationRow } from './db.js';

// Session store
export { SessionStore } from './session-store.js';
export type { InMemorySession } from './session-store.js';

// SSE registry
export { SseRegistry } from './sse.js';
export type { SseReply } from './sse.js';

// Error helpers
export { mcpOk, mcpErr, mcpNotFound, mcpValidationError, withErrorBoundary } from './errors.js';
export type { McpToolContent } from './errors.js';

// Tool handlers
export {
  handleCreateSession,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
  handleListSessions,
  handleDeleteSession,
  handleRemoveScene,
} from './tools.js';
