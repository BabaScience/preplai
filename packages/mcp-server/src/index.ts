/**
 * @preplai/mcp-server — Package Entry Point
 *
 * Re-exports all public modules for the MCP server package.
 * Database: uses @preplai/db (MongoDB).
 */

// Session store
export { SessionStore } from './session-store.js';
export type { InMemorySession } from './session-store.js';

// SSE registry
export { SseRegistry } from './sse.js';
export type { SseReply } from './sse.js';

// Error helpers
export { mcpOk, mcpErr, mcpNotFound, mcpValidationError, mcpUnauthorized, mcpLimitExceeded, withErrorBoundary } from './errors.js';
export type { McpToolContent } from './errors.js';

// Auth
export {
  createApiKey,
  validateApiKey,
  trackUsage,
  checkSceneLimit,
  checkSessionLimit,
  generateApiKey,
  hashKey,
  authError,
  TIER_LIMITS,
} from './auth.js';
export type { TierLimits, ValidatedKey, CreateKeyResult, LimitCheckResult } from './auth.js';

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

// JSON diagnostic
export { diagnoseJsonError, formatDiagnosticConsole, formatDiagnosticMcp, safeParseJson } from './json-diagnostic.js';
export type { JsonDiagnostic } from './json-diagnostic.js';

// Audio / TTS
export { AudioStore } from './audio-store.js';
export { TtsService } from './tts-service.js';
export { generateSpeech, aggregateWordTimestamps } from './elevenlabs.js';
export type { ElevenLabsConfig, TtsResult, WordTimestamp } from './elevenlabs.js';
export { generateFocusCues, buildLabelMap } from './tts-service.js';
