/**
 * @pre/compiler — Main Orchestrator
 *
 * Runs the 5-stage compilation pipeline synchronously.
 * Pure function — no I/O, no async, no side effects.
 *
 * Pipeline:
 *   Stage 1: Schema validation + duplicate checks   → CompilerError[] on failure
 *   Stage 2: Entity defaults application             → CompilerWarning[]
 *   Stage 3: Position clamping                       → CompilerWarning[]
 *   Stage 4: Connection & hierarchy resolution       → CompilerWarning[]
 *   Stage 5: Temporal choreography & frame timing    → CompilerWarning[]
 *   Post:    Frame transition computation
 */

import type { CompileResult } from './types.js';
import { stage1Validate } from './stage1-validate.js';
import { stage2ApplyDefaults } from './stage2-defaults.js';
import { stage3ClampPositions } from './stage3-positions.js';
import { stage4ResolveConnections } from './stage4-connections.js';
import { stage5Temporal } from './stage5-temporal.js';
import { computeTransitions } from './transitions.js';
import type { CompilerWarning } from './types.js';

export function compileVisualScript(raw: unknown): CompileResult {
  const allWarnings: CompilerWarning[] = [];

  // ── Stage 1: Schema Validation ───────────────────────────────────
  const s1 = stage1Validate(raw);
  if (!s1.ok) {
    return { success: false, errors: s1.errors };
  }

  // ── Stage 2: Entity Defaults ─────────────────────────────────────
  const s2 = stage2ApplyDefaults(s1.script);
  allWarnings.push(...s2.warnings);

  // ── Stage 3: Position Clamping ───────────────────────────────────
  const s3 = stage3ClampPositions(s2.script);
  allWarnings.push(...s3.warnings);

  // ── Stage 4: Connection Resolution ──────────────────────────────
  const s4 = stage4ResolveConnections(s3.script);
  allWarnings.push(...s4.warnings);

  // ── Stage 5: Temporal Choreography ──────────────────────────────
  const s5 = stage5Temporal(s4.script);
  allWarnings.push(...s5.warnings);

  // ── Post: Frame Transitions ──────────────────────────────────────
  const finalScript = computeTransitions(s5.script);

  return {
    success: true,
    script: finalScript,
    warnings: allWarnings,
  };
}
