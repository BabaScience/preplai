/**
 * @preplai/mcp-server — Visual Script Quality Scorer
 *
 * Scores a VisualScript across multiple quality dimensions (0-100 each),
 * producing an aggregate score used for quality monitoring and prompt
 * regression detection.
 *
 * Dimensions:
 *   1. Entity Density      — Peaks at 5-7 entities/frame, penalises sparse/overcrowded
 *   2. Layout Quality      — Overlap detection + spacing variance
 *   3. Visual Balance      — Center-of-mass deviation from canvas center (50, 50)
 *   4. Entity Persistence  — % of entities reused across consecutive frames
 *   5. Narration Coverage  — Every frame should have narration text
 *   6. Format Compliance   — Valid types, positions as [x,y], compact keys present
 *   7. Narration Quality   — Word count, specificity, label-highlight alignment
 *   8. Narrative Arc       — Complexity growth, highlight progression, intro rate
 *   9. Connection Completeness — Orphan entity detection, connection ref integrity
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
    narrationQuality: DimensionScore;
    narrativeArc: DimensionScore;
    connectionCompleteness: DimensionScore;
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

/** Dimension weights for aggregate score (must sum to 1.0) */
const WEIGHTS = {
  entityDensity: 0.12,
  layoutQuality: 0.12,
  visualBalance: 0.06,
  entityPersistence: 0.12,
  narrationCoverage: 0.10,
  formatCompliance: 0.06,
  narrationQuality: 0.16,
  narrativeArc: 0.14,
  connectionCompleteness: 0.12,
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

// ── Narration Quality ────────────────────────────────────────────────────

/** Ideal narration word count range */
const NARRATION_IDEAL_MIN = 20;
const NARRATION_IDEAL_MAX = 60;

/**
 * Technical/specific terms that indicate substantive narration.
 * Generic filler words like "the", "is", "a" are excluded from ratio.
 */
const SPECIFICITY_PATTERNS = [
  // Technical terms
  /O\([^)]+\)/,          // Big-O notation: O(n), O(log n)
  /\d+(?:\.\d+)?%/,      // Percentages: 90%, 50.5%
  /\d+(?:\.\d+)?\s*(?:ms|s|KB|MB|GB|TB|Gbps|Mbps|req\/s)/i, // Metrics with units
  /\bp\d{2,3}\b/,        // Percentiles: p50, p95, p99
  /\b(?:SQL|NoSQL|REST|gRPC|HTTP|TCP|UDP|DNS|TLS|SSL|JWT|OAuth|CORS|API|CLI|SDK|CDN)\b/,
  /\b(?:Redis|Kafka|PostgreSQL|MySQL|MongoDB|Elasticsearch|Docker|Kubernetes|Nginx|HAProxy)\b/,
  /\b(?:React|Node|Python|Rust|Go|Java|TypeScript)\b/,
];

/** Common filler words to exclude from specificity ratio */
const FILLER_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
  'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each',
  'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very',
  'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'it', 'its',
  'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'i', 'my', 'me',
]);

/**
 * Narration Quality: measures depth and specificity of narration text.
 * - Word count: 20-60 words = ideal
 * - Specificity: ratio of technical/proper terms vs filler
 * - Label alignment: narration mentions highlighted entity's label
 */
export function scoreNarrationQuality(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 0, details: 'No frames' };

  const frameScores: number[] = [];
  let totalSpecificTerms = 0;
  let alignedFrames = 0;
  let framesWithHighlight = 0;

  for (const frame of frames) {
    const text = frame.narrationSegment || (frame as any).n || '';
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      frameScores.push(0);
      continue;
    }

    const words = trimmed.split(/\s+/);
    const wordCount = words.length;

    // ── Word count score (bell curve around 20-60) ──
    let wordScore: number;
    if (wordCount >= NARRATION_IDEAL_MIN && wordCount <= NARRATION_IDEAL_MAX) {
      wordScore = 100;
    } else if (wordCount < NARRATION_IDEAL_MIN) {
      // 1 word = 5, 10 words = 50, 19 = 95
      wordScore = clamp((wordCount / NARRATION_IDEAL_MIN) * 100, 0, 100);
    } else {
      // 61-80 = gentle dropoff, 100+ = steep
      const excess = wordCount - NARRATION_IDEAL_MAX;
      wordScore = clamp(100 - excess * 2, 0, 100);
    }

    // ── Specificity score ──
    // Count technical terms / pattern matches in the narration
    let specificCount = 0;
    for (const pattern of SPECIFICITY_PATTERNS) {
      const matches = trimmed.match(new RegExp(pattern.source, 'gi'));
      if (matches) specificCount += matches.length;
    }

    // Also count non-filler content words (capitalized words, multi-syllable technical terms)
    const contentWords = words.filter((w: string) => {
      const lower = w.toLowerCase().replace(/[^a-z]/g, '');
      return lower.length > 0 && !FILLER_WORDS.has(lower);
    });
    const contentRatio = wordCount > 0 ? contentWords.length / wordCount : 0;

    // Specificity: blend of pattern matches and content word ratio
    // 3+ pattern matches = strong specificity; contentRatio > 0.5 = good
    const patternScore = clamp(specificCount * 25, 0, 100);
    const contentScore = clamp(contentRatio * 150, 0, 100); // 0.67+ content ratio = 100
    const specificityScore = patternScore * 0.4 + contentScore * 0.6;

    totalSpecificTerms += specificCount;

    // ── Highlight-narration alignment ──
    const highlightedEntity = frame.entities.find((e) => (e as any).highlight === true);
    if (highlightedEntity) {
      framesWithHighlight++;
      const label = ((highlightedEntity as any).label || highlightedEntity.id || '').toLowerCase();
      if (label && trimmed.toLowerCase().includes(label)) {
        alignedFrames++;
      }
    }

    // Combine: 50% word count, 50% specificity
    frameScores.push(wordScore * 0.5 + specificityScore * 0.5);
  }

  const avgFrameScore = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;

  // Alignment bonus: if highlights are used, reward alignment
  let alignmentBonus = 0;
  if (framesWithHighlight > 0) {
    const alignmentRatio = alignedFrames / framesWithHighlight;
    alignmentBonus = alignmentRatio * 10; // Up to +10 bonus
  }

  const finalScore = clamp(Math.round(avgFrameScore + alignmentBonus), 0, 100);

  return {
    score: finalScore,
    details: `Avg narration quality ${finalScore}, ${totalSpecificTerms} specific terms found, ${alignedFrames}/${framesWithHighlight} highlight-aligned`,
  };
}

// ── Narrative Arc ────────────────────────────────────────────────────────

/** Ideal frame count range */
const FRAME_COUNT_IDEAL_MIN = 3;
const FRAME_COUNT_IDEAL_MAX = 7;

/**
 * Narrative Arc: measures storytelling structure across frames.
 * - Complexity growth: entity count should generally increase then plateau
 * - Highlight progression: highlighted entity should change between frames
 * - Introduction rate: new entities per transition (not too many, not too few)
 * - Frame count adequacy: penalise <3 or >8 frames
 */
export function scoreNarrativeArc(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 0, details: 'No frames' };
  if (frames.length === 1) return { score: 50, details: 'Single frame — narrative arc N/A' };

  // ── Complexity growth ──
  // Score: entity count should generally grow in the first 60% of frames
  const entityCounts = frames.map((f) => getContentEntities(f.entities).length);
  let growthPairs = 0;
  let totalPairs = 0;
  const growthWindow = Math.max(1, Math.ceil(frames.length * 0.6));
  for (let i = 1; i < growthWindow && i < frames.length; i++) {
    totalPairs++;
    if (entityCounts[i] >= entityCounts[i - 1]) growthPairs++;
  }
  // Growth in first 60% of frames = good; allows resolution/simplification at end
  const growthRatio = totalPairs > 0 ? growthPairs / totalPairs : 0.5;
  const growthScore = clamp(growthRatio * 100, 0, 100);

  // ── Highlight progression ──
  // The highlighted entity should change across frames
  const highlightIds: (string | null)[] = frames.map((f) => {
    const hl = f.entities.find((e) => (e as any).highlight === true);
    return hl ? hl.id : null;
  });
  const highlightsUsed = highlightIds.filter((id) => id !== null);

  let highlightScore: number;
  if (highlightsUsed.length === 0) {
    // No highlights at all — missed cinematic opportunity
    highlightScore = 30;
  } else {
    const uniqueHighlights = new Set(highlightsUsed);
    // More unique highlights = better progression
    // 1 unique out of 5 frames = 20%, 5 unique out of 5 = 100%
    const diversityRatio = uniqueHighlights.size / Math.max(highlightsUsed.length, 1);
    // Also reward having highlights on most frames
    const coverageRatio = highlightsUsed.length / frames.length;
    highlightScore = clamp(
      (diversityRatio * 60 + coverageRatio * 40),
      0,
      100,
    );
  }

  // ── Introduction rate ──
  // New entities per transition: ideal is 1-3 new per frame
  const introRates: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    const prevIds = new Set(frames[i - 1].entities.map((e) => e.id));
    const newEntities = frames[i].entities.filter((e) => !prevIds.has(e.id)).length;
    introRates.push(newEntities);
  }

  const introScores = introRates.map((rate) => {
    if (rate >= 1 && rate <= 3) return 100;
    if (rate === 0) return 50; // No new entities = stagnant but not terrible
    if (rate >= 4 && rate <= 5) return 70; // Slightly overwhelming
    return clamp(100 - (rate - 5) * 20, 0, 100); // >5 = very overwhelming
  });
  const avgIntroScore = introScores.length > 0
    ? introScores.reduce((s, v) => s + v, 0) / introScores.length
    : 50;

  // ── Frame count adequacy ──
  let frameCountScore: number;
  if (frames.length >= FRAME_COUNT_IDEAL_MIN && frames.length <= FRAME_COUNT_IDEAL_MAX) {
    frameCountScore = 100;
  } else if (frames.length < FRAME_COUNT_IDEAL_MIN) {
    frameCountScore = clamp((frames.length / FRAME_COUNT_IDEAL_MIN) * 100, 0, 100);
  } else {
    const excess = frames.length - FRAME_COUNT_IDEAL_MAX;
    frameCountScore = clamp(100 - excess * 12, 0, 100);
  }

  // Weighted combination
  const score = Math.round(
    growthScore * 0.25 +
    highlightScore * 0.30 +
    avgIntroScore * 0.25 +
    frameCountScore * 0.20,
  );

  return {
    score: clamp(score, 0, 100),
    details: `growth=${Math.round(growthScore)}, highlights=${Math.round(highlightScore)}, introRate=${Math.round(avgIntroScore)}, frameCount=${Math.round(frameCountScore)} (${frames.length} frames)`,
  };
}

// ── Connection Completeness ──────────────────────────────────────────────

/**
 * Connection Completeness: measures diagram quality via connectivity.
 * - Orphan ratio: % of content entities not referenced by any connection
 * - Reference integrity: do connection src/tgt IDs exist in the frame?
 *
 * A good diagram connects entities with arrows to show relationships.
 * Isolated floating boxes = bad diagram.
 */
export function scoreConnectionCompleteness(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 0, details: 'No frames' };

  const frameScores: number[] = [];
  let totalOrphans = 0;
  let totalContent = 0;
  let brokenRefs = 0;
  let totalRefs = 0;

  for (const frame of frames) {
    const contentEntities = getContentEntities(frame.entities);
    const connections = frame.entities.filter((e) => CONNECTION_TYPES.has(e.type));
    const entityIds = new Set(frame.entities.map((e) => e.id));

    if (contentEntities.length === 0) {
      frameScores.push(50); // Empty frame = neutral
      continue;
    }

    // If there's only 1 content entity, connections aren't expected
    if (contentEntities.length === 1) {
      frameScores.push(100);
      totalContent += 1;
      continue;
    }

    // ── Orphan detection ──
    // Build set of entity IDs that are connected (appear in any src/tgt)
    const connectedIds = new Set<string>();
    for (const conn of connections) {
      if (conn.sourceEntityId) connectedIds.add(conn.sourceEntityId);
      if (conn.targetEntityId) connectedIds.add(conn.targetEntityId);
    }

    const orphans = contentEntities.filter((e) => !connectedIds.has(e.id));
    const orphanRatio = orphans.length / contentEntities.length;
    totalOrphans += orphans.length;
    totalContent += contentEntities.length;

    // Score: 0 orphans = 100, 50% orphans = 50, 100% orphans = 20
    // We don't go to 0 because some frames legitimately introduce entities
    // before connecting them in later frames
    const orphanScore = connections.length === 0
      ? 20 // No connections at all in a multi-entity frame = bad
      : clamp(100 - orphanRatio * 80, 20, 100);

    // ── Reference integrity ──
    let refScore = 100;
    for (const conn of connections) {
      totalRefs++;
      const srcExists = !conn.sourceEntityId || entityIds.has(conn.sourceEntityId);
      const tgtExists = !conn.targetEntityId || entityIds.has(conn.targetEntityId);
      if (!srcExists || !tgtExists) {
        brokenRefs++;
        refScore = Math.max(0, refScore - 25); // Each broken ref = -25
      }
    }

    // If no connections, ref score is neutral
    if (connections.length === 0) refScore = 50;

    frameScores.push(orphanScore * 0.7 + refScore * 0.3);
  }

  const avg = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;

  return {
    score: Math.round(clamp(avg, 0, 100)),
    details: `${totalOrphans}/${totalContent} orphan entities, ${brokenRefs}/${totalRefs} broken refs`,
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
    narrationQuality: scoreNarrationQuality(frames),
    narrativeArc: scoreNarrativeArc(frames),
    connectionCompleteness: scoreConnectionCompleteness(frames),
  };

  // Weighted average
  const overall = Math.round(
    dimensions.entityDensity.score * WEIGHTS.entityDensity +
    dimensions.layoutQuality.score * WEIGHTS.layoutQuality +
    dimensions.visualBalance.score * WEIGHTS.visualBalance +
    dimensions.entityPersistence.score * WEIGHTS.entityPersistence +
    dimensions.narrationCoverage.score * WEIGHTS.narrationCoverage +
    dimensions.formatCompliance.score * WEIGHTS.formatCompliance +
    dimensions.narrationQuality.score * WEIGHTS.narrationQuality +
    dimensions.narrativeArc.score * WEIGHTS.narrativeArc +
    dimensions.connectionCompleteness.score * WEIGHTS.connectionCompleteness,
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
