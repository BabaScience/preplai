/**
 * @preplai/player — Public API
 *
 * Re-exports all player modules for use by @preplai/mcp-server
 * and for standalone player bootstrap.
 */

// ── Pure logic (no DOM)
export { applyDefaults, assignEntranceDelays } from './apply-defaults.js';
export { resolveEntityRef } from './fuzzy-lookup.js';

// ── DOM-dependent modules
export { SceneController } from './scene-controller.js';
export type { SceneControllerOptions, EntityPatch } from './scene-controller.js';

export { NarratorController } from './narrator.js';

// ── Bridge (SSE + postMessage)
export {
  resolveSessionId,
  createSSEHandler,
  createPostMessageBridge,
  emitToParent,
} from './player-bridge.js';
export type {
  SSEHandlerCallbacks,
  PostMessageBridgeCallbacks,
} from './player-bridge.js';
