/**
 * @preplai/shared — Package Entry Point
 *
 * Re-exports all types, constants, schemas, and utilities.
 */

// Core types
export type {
  VisualEntity,
  VisualEntityType,
  IllustrationFrame,
  EntityTransition,
  VisualScript,
  Session,
  SessionState,
  SessionStatus,
  SceneRecord,
  ApiError,
  ApiErrorCode,
  ApiResponse,
  McpToolResult,
  McpToolName,
  EntranceAnimationClass,
} from './types.js';

export { ok, fail } from './types.js';

// Zod schemas (runtime validation)
export {
  VisualEntitySchema,
  IllustrationFrameSchema,
  EntityTransitionSchema,
  VisualScriptSchema,
  VisualEntityPatchSchema,
  CreateSessionSchema,
  CreateApiKeySchema,
} from './schemas.js';

export type {
  VisualEntityInput,
  VisualScriptInput,
  VisualEntityPatch,
  CreateSessionInput,
  CreateApiKeyInput,
} from './schemas.js';

// Player palettes
export {
  PLAYER_THEMES,
  PLAYER_PALETTES,
  PALETTES,
  getEntityColor,
} from './palettes.js';
export type { PlayerTheme, PlayerPalette, EntityPalette } from './palettes.js';

// Constants
export {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_VIEW_BOX,
  CANVAS_ASPECT_RATIO,
  CANVAS_BG_COLOR,
  FRAME_DURATION_MIN_MS,
  DEFAULT_FRAME_DURATION_MS,
  INTER_ENTITY_STAGGER_MS,
  ANIMATION_DELAY_MIN_MS,
  ENTITY_MIN_VISIBLE_MS,
  DEFAULT_ENTRANCE_DURATION_MS,
  MAX_ANIMATED_ELEMENTS,
  ENTITY_COUNT_WARN_THRESHOLD,
  ENTITY_COUNT_ERROR_THRESHOLD,
  MAX_FRAMES_PER_SCRIPT,
  MAX_ENTITIES_PER_FRAME,
  SESSION_TTL_DEFAULT_SECONDS,
  SESSION_TTL_MAX_SECONDS,
  ENTITY_DEFAULTS,
  TIER_RATE_LIMITS,
  TIER_LIMITS,
  PERFORMANCE_CONTRACTS,
  ENTRANCE_ANIMATION_CLASSES,
} from './constants.js';

// Type guards and utilities
export {
  isVisualEntity,
  isVisualScript,
  isArrowType,
  isConnectionType,
  requiresMetadata,
  applyEntityDefaults,
  buildEntityMap,
  assignEntranceDelays,
  validateVisualScript,
  resolveEntityRef,
} from './guards.js';
