/**
 * @preplai/shared — Zod Validation Schemas
 *
 * Single source of validation truth. Imported by MCP server tool handlers
 * and the SSE event pipeline. Guarantees schema parity across the full pipeline.
 */
import { z } from 'zod';

// ── VisualEntity Schema ───────────────────────────────────────────────

export const VisualEntitySchema = z.object({
  id: z.string().min(1).max(128),
  type: z.string().min(1),

  position: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }),

  size: z.number().positive().max(10).optional(),
  label: z.string().max(200).optional(),
  color: z.string().max(50).optional(),
  highlight: z.boolean().optional(),

  animation: z.object({
    delay: z.number().min(0).max(60_000).optional(),
    duration: z.number().min(0).max(10_000).optional(),
    easing: z.string().max(100).optional(),
    entrance: z.string().max(100).optional(),
  }).optional(),

  sourceEntityId: z.string().max(128).optional(),
  targetEntityId: z.string().max(128).optional(),
  parentEntityId: z.string().max(128).optional(),

  textContent: z.string().max(10_000).optional(),
  codeLanguage: z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type VisualEntityInput = z.infer<typeof VisualEntitySchema>;

// ── EntityTransition Schema ───────────────────────────────────────────

export const EntityTransitionSchema = z.object({
  entityId: z.string().min(1).max(128),
  from: z.record(z.unknown()),
  to: z.record(z.unknown()),
  duration: z.number().min(0).max(10_000),
  easing: z.string().max(100).optional(),
});

// ── IllustrationFrame Schema ──────────────────────────────────────────

export const IllustrationFrameSchema = z.object({
  id: z.string().min(1).max(128),
  startTime: z.number().min(0),
  endTime: z.number().min(0),

  entities: z.array(VisualEntitySchema).min(0).max(150),
  transitions: z.array(EntityTransitionSchema).optional(),

  narrationSegment: z.string().max(5000),
  description: z.string().max(500),
}).refine(
  (f) => f.endTime > f.startTime,
  { message: 'Frame endTime must be greater than startTime.' },
);

// ── VisualScript Schema ───────────────────────────────────────────────

export const VisualScriptSchema = z.object({
  sceneId: z.string().uuid(),
  frames: z.array(IllustrationFrameSchema).min(1).max(100),
  totalDuration: z.number().min(0).max(3_600_000),
  entities: z.record(VisualEntitySchema).optional(),
}).refine(
  (s) => s.totalDuration >= (s.frames.at(-1)?.endTime ?? 0),
  { message: 'totalDuration must be >= last frame endTime.' },
);

export type VisualScriptInput = z.infer<typeof VisualScriptSchema>;

// ── VisualEntityPatch Schema ──────────────────────────────────────────

export const VisualEntityPatchSchema = z.object({
  label: z.string().max(200).optional(),
  color: z.string().max(50).optional(),
  highlight: z.boolean().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  size: z.number().positive().max(10).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type VisualEntityPatch = z.infer<typeof VisualEntityPatchSchema>;

// ── Session Schema ────────────────────────────────────────────────────

export const CreateSessionSchema = z.object({
  title: z.string().min(1).max(200),
  domain: z.string().max(100).optional(),
  ttlSeconds: z.number().int().min(60).max(86_400).optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// ── API Key Schema ────────────────────────────────────────────────────

export const CreateApiKeySchema = z.object({
  tier: z.enum(['developer', 'startup', 'scale']),
  expiresInDays: z.number().int().positive().optional(),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
