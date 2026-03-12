/**
 * @preplai/mcp-server — Visual Script Quality Scorer
 *
 * Scores a VisualScript across multiple quality dimensions (0-100 each),
 * producing an aggregate score used for quality monitoring and prompt
 * regression detection.
 *
 * Dimensions:
 *   1. Entity Density   — Peaks at 5-7 entities/frame, penalises sparse/overcrowded
 *   2. Layout Quality   — Overlap detection + spacing variance
 *   3. Visual Balance   — Center-of-mass deviation from canvas center (50, 50)
 *   4. Entity Persistence — % of entities reused across consecutive frames
 *   5. Narration Coverage — Every frame should have narration text
 *   6. Format Compliance  — Valid types, positions as [x,y], compact keys present
 */

import type { VisualScript, IllustrationFrame, VisualEntity } from '@preplai/shared';

// ── Types ────────────────────────────────────────────────────────────────

export interface DimensionScore {
  score: number; // 0-100
  details: string;
}

export interface QualityReport {
  overall: number; // 0-100 weighted average
  dimensions: {
    entityDensity: DimensionScore;
    layoutQuality: DimensionScore;
    visualBalance: DimensionScore;
    entityPersistence: DimensionScore;
    narrationCoverage: DimensionScore;
    formatCompliance: DimensionScore;
  };
  frameCount: number;
  totalEntities: number;
  timestamp: string;
}

// ── Constants ────────────────────────────────────────────────────────────

/** Ideal entity count per frame (peak of scoring curve) */
const IDEAL_DENSITY_MIN = 5;
const IDEAL_DENSITY_MAX = 7;

/** Canvas center in percentage coordinates */
const CANVAS_CENTER_X = 50;
const CANVAS_CENTER_Y = 50;

/** Minimum distance (%) between entity positions to avoid overlap */
const OVERLAP_THRESHOLD = 8;

/** Dimension weights for aggregate score */
const WEIGHTS = {
  entityDensity: 0.20,
  layoutQuality: 0.20,
  visualBalance: 0.10,
  entityPersistence: 0.20,
  narrationCoverage: 0.20,
  formatCompliance: 0.10,
} as const;

// ── Connection types that don't count toward density ─────────────────────

const CONNECTION_TYPES = new Set([
  'Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow', 'Transition',
]);

const HEADING_TYPES = new Set(['H1', 'H2', 'H3']);

// ── Helpers ──────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Get position from entity — handles both {x,y} and array [x,y] formats */
function getPosition(entity: VisualEntity): { x: number; y: number } {
  const pos = entity.position;
  if (Array.isArray(pos)) {
    return { x: (pos as number[])[0] ?? 50, y: (pos as number[])[1] ?? 50 };
  }
  return { x: pos?.x ?? 50, y: pos?.y ?? 50 };
}

/** Get content entities (exclude connections, headings, labels) for density scoring */
function getContentEntities(entities: VisualEntity[]): VisualEntity[] {
  return entities.filter(
    (e) => !CONNECTION_TYPES.has(e.type) && !HEADING_TYPES.has(e.type) && e.type !== 'Label',
  );
}

/** Euclidean distance between two points */
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Standard deviation */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// ── Dimension Scorers ────────────────────────────────────────────────────

/**
 * Entity Density: peaks at 5-7 content entities per frame.
 * Uses a bell-curve-like scoring: 100 at 5-7, drops for < 3 or > 10.
 */
export function scoreEntityDensity(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 0, details: 'No frames' };

  const frameScores = frames.map((frame) => {
    const count = getContentEntities(frame.entities).length;

    if (count >= IDEAL_DENSITY_MIN && count <= IDEAL_DENSITY_MAX) {
      return 100;
    }
    if (count < IDEAL_DENSITY_MIN) {
      // 0 entities = 0, 1 = 20, 2 = 50, 3 = 70, 4 = 85
      return clamp(count * (100 / IDEAL_DENSITY_MIN), 0, 100);
    }
    // count > IDEAL_DENSITY_MAX
    // 8 = 90, 9 = 75, 10 = 60, 12 = 30, 15+ = 0
    const excess = count - IDEAL_DENSITY_MAX;
    return clamp(100 - excess * 15, 0, 100);
  });

  const avg = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;
  const lowFrames = frameScores.filter((s) => s < 50).length;

  return {
    score: Math.round(avg),
    details: `Avg density score ${Math.round(avg)}, ${lowFrames}/${frames.length} frames below 50`,
  };
}

/**
 * Layout Quality: penalises overlapping entities and uneven spacing.
 * - Overlap: % of entity pairs closer than OVERLAP_THRESHOLD
 * - Spacing variance: coefficient of variation of pairwise distances
 */
export function scoreLayoutQuality(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 0, details: 'No frames' };

  const frameScores = frames.map((frame) => {
    const entities = getContentEntities(frame.entities);
    if (entities.length < 2) return 100; // Single entity can't overlap

    const positions = entities.map(getPosition);
    const pairs: number[] = [];
    let overlaps = 0;
    const totalPairs = (positions.length * (positions.length - 1)) / 2;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const d = distance(positions[i], positions[j]);
        pairs.push(d);
        if (d < OVERLAP_THRESHOLD) overlaps++;
      }
    }

    // Overlap penalty: 0 overlaps = 100, all overlap = 0
    const overlapScore = totalPairs > 0
      ? 100 * (1 - overlaps / totalPairs)
      : 100;

    // Spacing variance: low CV = evenly spaced = good
    const mean = pairs.reduce((s, v) => s + v, 0) / pairs.length;
    const cv = mean > 0 ? stdDev(pairs) / mean : 0;
    // CV of 0 = 100, CV of 1 = 50, CV of 2+ = 0
    const spacingScore = clamp(100 - cv * 50, 0, 100);

    return overlapScore * 0.6 + spacingScore * 0.4;
  });

  const avg = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;

  return {
    score: Math.round(avg),
    details: `Avg layout score ${Math.round(avg)} across ${frames.length} frames`,
  };
}

/**
 * Visual Balance: measures center-of-mass deviation from canvas center.
 * Entities clustered to one side score low; centered layouts score high.
 */
export function scoreVisualBalance(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 0, details: 'No frames' };

  const frameScores = frames.map((frame) => {
    const entities = getContentEntities(frame.entities);
    if (entities.length === 0) return 50; // Empty frame is neutral

    const positions = entities.map(getPosition);
    const cx = positions.reduce((s, p) => s + p.x, 0) / positions.length;
    const cy = positions.reduce((s, p) => s + p.y, 0) / positions.length;

    // Distance from canvas center (max possible ~70.7 for corner)
    const deviation = distance({ x: cx, y: cy }, { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y });

    // 0 deviation = 100, 30+ deviation = 0
    return clamp(100 - (deviation / 30) * 100, 0, 100);
  });

  const avg = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;

  return {
    score: Math.round(avg),
    details: `Avg balance score ${Math.round(avg)}`,
  };
}

/**
 * Entity Persistence: % of entity IDs reused between consecutive frames.
 * High persistence = narrative continuity (good cinematic practice).
 */
export function scoreEntityPersistence(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length <= 1) {
    return { score: 100, details: 'Single frame — persistence N/A' };
  }

  const ratios: number[] = [];

  for (let i = 1; i < frames.length; i++) {
    const prevIds = new Set(frames[i - 1].entities.map((e) => e.id));
    const currIds = new Set(frames[i].entities.map((e) => e.id));

    if (prevIds.size === 0 && currIds.size === 0) {
      ratios.push(1); // Both empty = fully persistent
      continue;
    }

    const union = new Set([...prevIds, ...currIds]);
    const intersection = [...prevIds].filter((id) => currIds.has(id));
    const ratio = union.size > 0 ? intersection.length / union.size : 0;
    ratios.push(ratio);
  }

  const avg = ratios.reduce((s, v) => s + v, 0) / ratios.length;
  // 30%+ persistence is good for cinematic presentations
  // Scale: 0% = 0, 30% = 70, 50%+ = 100
  const score = clamp(avg * 200, 0, 100);

  return {
    score: Math.round(score),
    details: `Avg persistence ratio ${(avg * 100).toFixed(1)}% across ${ratios.length} transitions`,
  };
}

/**
 * Narration Coverage: every frame should have narration text.
 * Scores by % of frames with non-empty narration.
 */
export function scoreNarrationCoverage(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 0, details: 'No frames' };

  const withNarration = frames.filter((f) => {
    const text = f.narrationSegment || (f as any).n || '';
    return text.trim().length > 0;
  }).length;

  const ratio = withNarration / frames.length;
  const missing = frames.length - withNarration;

  return {
    score: Math.round(ratio * 100),
    details: missing === 0
      ? `All ${frames.length} frames have narration`
      : `${missing}/${frames.length} frames missing narration`,
  };
}

/**
 * Format Compliance: checks for valid entity types, position format,
 * and presence of key fields.
 */
export function scoreFormatCompliance(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 0, details: 'No frames' };

  let totalChecks = 0;
  let passedChecks = 0;
  const issues: string[] = [];

  for (const frame of frames) {
    for (const entity of frame.entities) {
      totalChecks++;

      // Check position is valid (0-100 range)
      const pos = getPosition(entity);
      const posValid = pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100;
      if (posValid) passedChecks++;
      else issues.push(`Entity ${entity.id}: position out of range`);

      // Check entity has an id
      totalChecks++;
      if (entity.id && entity.id.length > 0) passedChecks++;
      else issues.push('Entity missing id');

      // Check entity has a type
      totalChecks++;
      if (entity.type && entity.type.length > 0) passedChecks++;
      else issues.push(`Entity ${entity.id}: missing type`);

      // Connection entities should have source/target
      if (CONNECTION_TYPES.has(entity.type)) {
        totalChecks++;
        if (entity.sourceEntityId && entity.targetEntityId) {
          passedChecks++;
        } else {
          issues.push(`Connection ${entity.id}: missing source/target`);
        }
      }
    }
  }

  if (totalChecks === 0) return { score: 100, details: 'No entities to check' };

  const ratio = passedChecks / totalChecks;
  const uniqueIssues = [...new Set(issues)].slice(0, 5);

  return {
    score: Math.round(ratio * 100),
    details: uniqueIssues.length > 0
      ? `${passedChecks}/${totalChecks} checks passed. Issues: ${uniqueIssues.join('; ')}`
      : `All ${totalChecks} checks passed`,
  };
}

// ── Main Scorer ──────────────────────────────────────────────────────────

/**
 * Score a VisualScript across all quality dimensions.
 * Returns an aggregate score (0-100) with per-dimension breakdown.
 */
export function scoreVisualScript(script: VisualScript): QualityReport {
  const frames = script.frames ?? [];

  const dimensions = {
    entityDensity: scoreEntityDensity(frames),
    layoutQuality: scoreLayoutQuality(frames),
    visualBalance: scoreVisualBalance(frames),
    entityPersistence: scoreEntityPersistence(frames),
    narrationCoverage: scoreNarrationCoverage(frames),
    formatCompliance: scoreFormatCompliance(frames),
  };

  // Weighted average
  const overall = Math.round(
    dimensions.entityDensity.score * WEIGHTS.entityDensity +
    dimensions.layoutQuality.score * WEIGHTS.layoutQuality +
    dimensions.visualBalance.score * WEIGHTS.visualBalance +
    dimensions.entityPersistence.score * WEIGHTS.entityPersistence +
    dimensions.narrationCoverage.score * WEIGHTS.narrationCoverage +
    dimensions.formatCompliance.score * WEIGHTS.formatCompliance,
  );

  const totalEntities = frames.reduce((s, f) => s + f.entities.length, 0);

  return {
    overall,
    dimensions,
    frameCount: frames.length,
    totalEntities,
    timestamp: new Date().toISOString(),
  };
}
