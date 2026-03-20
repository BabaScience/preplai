/**
 * @preplai/shared — Constants
 *
 * All magic numbers and configuration values used across the PRE system.
 * These are the canonical values referenced by architecture docs 01-06.
 */

// ── Canvas Constants ──────────────────────────────────────────────────

export const CANVAS_WIDTH = 1920 as const;
export const CANVAS_HEIGHT = 1080 as const;
export const CANVAS_VIEW_BOX = '0 0 1920 1080' as const;
export const CANVAS_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
export const CANVAS_BG_COLOR = '#0f0f1a' as const;

// ── Timing Constants ──────────────────────────────────────────────────

export const FRAME_DURATION_MIN_MS = 2_500 as const;
export const DEFAULT_FRAME_DURATION_MS = 5_000 as const;
export const INTER_ENTITY_STAGGER_MS = 80 as const;
export const ANIMATION_DELAY_MIN_MS = 150 as const;
export const ENTITY_MIN_VISIBLE_MS = 1_200 as const;
export const DEFAULT_ENTRANCE_DURATION_MS = 450 as const;

// ── Limits ────────────────────────────────────────────────────────────

export const MAX_ANIMATED_ELEMENTS = 500 as const;
export const ENTITY_COUNT_WARN_THRESHOLD = 150 as const;
export const ENTITY_COUNT_ERROR_THRESHOLD = 400 as const;
export const MAX_FRAMES_PER_SCRIPT = 100 as const;
export const MAX_ENTITIES_PER_FRAME = 150 as const;
export const SESSION_TTL_DEFAULT_SECONDS = 14_400 as const;
export const SESSION_TTL_MAX_SECONDS = 86_400 as const;

// ── Entity Defaults ───────────────────────────────────────────────────

export const ENTITY_DEFAULTS = {
  size: 2.5,
  color: '#4A90D9',
  highlight: false,
  animation: {
    delay: 0,
    duration: DEFAULT_ENTRANCE_DURATION_MS,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    entrance: 'entrance-fadeInUp',
  },
} as const;

// ── Rate Limit Tiers ──────────────────────────────────────────────────

export const TIER_RATE_LIMITS: Record<'developer' | 'startup' | 'scale', number> = {
  developer: 100,
  startup: 500,
  scale: 2_000,
} as const;

// ── Dashboard/MCP Tier Limits ──────────────────────────────────────────
// Used by MCP server for enforcement and dashboard for display.

export const TIER_LIMITS: Record<string, { maxSessions: number; maxScenesPerMonth: number; maxScenesPerSession: number; sessionExpiryDays: number }> = {
  free: {
    maxSessions: 5,
    maxScenesPerMonth: -1,
    maxScenesPerSession: -1,
    sessionExpiryDays: 7,
  },
  pro: {
    maxSessions: 100,
    maxScenesPerMonth: 2000,
    maxScenesPerSession: 100,
    sessionExpiryDays: 90,
  },
  enterprise: {
    maxSessions: -1,
    maxScenesPerMonth: -1,
    maxScenesPerSession: -1,
    sessionExpiryDays: 365,
  },
};

// ── Performance Contracts ─────────────────────────────────────────────

export const PERFORMANCE_CONTRACTS = {
  MCP_TOOL_P95_MS: 200,
  SSE_DELIVERY_P95_MS: 50,
  SESSION_READ_P95_MS: 50,
  PLAYER_HTML_P95_MS: 100,
  MAX_VISUAL_SCRIPT_BYTES: 512 * 1024,
  MAX_SCRIPT_DURATION_MS: 3_600_000,
} as const;

// ── CSS Entrance Animation Classes ───────────────────────────────────

export const ENTRANCE_ANIMATION_CLASSES = [
  'entrance-fadeInUp',
  'entrance-fadeIn',
  'entrance-drawIn',
  'entrance-scaleIn',
] as const;
