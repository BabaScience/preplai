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
import {
  CONNECTION_TYPES as SHARED_CONNECTION_TYPES,
  HEADING_TYPES as SHARED_HEADING_TYPES,
  clamp,
  distance,
  stdDev,
} from '@preplai/shared';

// ── Types ────────────────────────────────────────────────────────────────

export interface DimensionScore {
  score: number; // 0-100
  details: string;
}

export interface QualityReport {
  overall: number; // 0-100 weighted average × bottleneck multiplier
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
    colorBudget: DimensionScore;
    signalToNoise: DimensionScore;
    visualHierarchy: DimensionScore;
    modalityAlignment: DimensionScore;
    systematization: DimensionScore;
    tierAlignment: DimensionScore;
  };
  /** Weakest dimension that constrains the overall score (Goldratt bottleneck) */
  bottleneck: {
    dimension: string;
    score: number;
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
  entityDensity: 0.07,
  layoutQuality: 0.08,
  visualBalance: 0.06,
  entityPersistence: 0.08,
  narrationCoverage: 0.05,
  formatCompliance: 0.03,
  narrationQuality: 0.08,
  narrativeArc: 0.08,
  connectionCompleteness: 0.07,
  colorBudget: 0.06,
  signalToNoise: 0.10,          // Tufte's data-ink ratio
  visualHierarchy: 0.09,        // Gestalt visual focus
  modalityAlignment: 0.07,      // Paivio's dual coding
  systematization: 0.06,        // cross-frame consistency
  tierAlignment: 0.06,          // NEW: Gestalt alignment (same tier = same Y)
} as const;

// ── Use shared entity classification sets ────────────────────────────────

const CONNECTION_TYPES = SHARED_CONNECTION_TYPES;
const HEADING_TYPES = SHARED_HEADING_TYPES;

/** Labels considered generic/uninformative — penalized in quality scoring (Pillar III) */
const GENERIC_LABEL_PATTERNS = [
  /^(Node|Step|Component|Item|Element|Box|Block|Module|Part|Thing)\s*\d*$/i,
  /^[A-Z]$/,           // Single letters: A, B, C
  /^(Untitled|Label|Entity|Object)\s*\d*$/i,
  /^\d+$/,             // Bare numbers
];

// ── Helpers ──────────────────────────────────────────────────────────────

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

    // ── Narration-visual redundancy detection (Pillar III) ──
    // If narration content words are >70% identical to entity labels, it's just restating the visual
    const entityLabelWords = new Set(
      frame.entities
        .map((e) => ((e as any).label || '').toLowerCase())
        .filter((l: string) => l.length > 0)
        .flatMap((l: string) => l.split(/\s+/))
        .filter((w: string) => !FILLER_WORDS.has(w)),
    );
    const narrationContentLower = contentWords.map((w: string) => w.toLowerCase().replace(/[^a-z]/g, ''));
    const overlapCount = narrationContentLower.filter((w: string) => entityLabelWords.has(w)).length;
    const redundancyRatio = narrationContentLower.length > 0
      ? overlapCount / narrationContentLower.length
      : 0;
    // >70% overlap = narration is restating the visual, apply progressive penalty
    const redundancyPenalty = redundancyRatio > 0.7
      ? (redundancyRatio - 0.7) * 100 // 0.8 overlap = -10, 0.9 = -20, 1.0 = -30
      : 0;

    // Combine: 45% word count, 45% specificity, minus redundancy penalty
    frameScores.push(Math.max(0, wordScore * 0.45 + specificityScore * 0.45 - redundancyPenalty));
  }

  const avgFrameScore = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;

  // Alignment bonus: if highlights are used, reward alignment
  let alignmentBonus = 0;
  if (framesWithHighlight > 0) {
    const alignmentRatio = alignedFrames / framesWithHighlight;
    alignmentBonus = alignmentRatio * 10; // Up to +10 bonus
  }

  // ── Label specificity penalty (Pillar III) ──
  // Detect generic labels across all frames
  let genericLabelCount = 0;
  let totalLabels = 0;
  for (const frame of frames) {
    for (const entity of frame.entities) {
      const label = (entity as any).label;
      if (!label || CONNECTION_TYPES.has(entity.type) || HEADING_TYPES.has(entity.type)) continue;
      totalLabels++;
      const isGeneric = GENERIC_LABEL_PATTERNS.some((p) => p.test(label.trim()));
      if (isGeneric) genericLabelCount++;
    }
  }
  // Each 10% generic labels reduces final score by 5 points (max -50 penalty)
  const genericRatio = totalLabels > 0 ? genericLabelCount / totalLabels : 0;
  const labelSpecificityPenalty = Math.round(genericRatio * 50);

  const finalScore = clamp(Math.round(avgFrameScore + alignmentBonus - labelSpecificityPenalty), 0, 100);

  return {
    score: finalScore,
    details: `Avg narration quality ${finalScore}, ${totalSpecificTerms} specific terms, ${alignedFrames}/${framesWithHighlight} hl-aligned, ${genericLabelCount}/${totalLabels} generic labels`,
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
    // No highlights at all — critical Pillar I failure (no focal point, no depth-of-field)
    highlightScore = 15;
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

  // ── Front-loading penalty (Pillar IV: Emotional Resonance) ──
  // Penalize if first frame has >1.3x the average entity count (dumps complexity upfront)
  const avgEntityCount = entityCounts.reduce((s, v) => s + v, 0) / entityCounts.length;
  let frontLoadPenalty = 0;
  if (entityCounts.length > 1 && entityCounts[0] > avgEntityCount * 1.3) {
    frontLoadPenalty = 15;
  }

  // ── Complexity peak position (Pillar II: Compositional Structure) ──
  // Reward if peak complexity is in middle frames, penalize if at very start
  const peakIndex = entityCounts.indexOf(Math.max(...entityCounts));
  const normalizedPeakPosition = frames.length > 1
    ? peakIndex / (frames.length - 1)
    : 0.5; // single frame is neutral
  let peakPositionBonus = 0;
  if (normalizedPeakPosition >= 0.3 && normalizedPeakPosition <= 0.7) {
    peakPositionBonus = 10;
  } else if (normalizedPeakPosition < 0.15) {
    peakPositionBonus = -10; // Peak at very start = bad
  }

  // Weighted combination + adjustments
  const rawScore = Math.round(
    growthScore * 0.25 +
    highlightScore * 0.30 +
    avgIntroScore * 0.25 +
    frameCountScore * 0.20,
  );
  const score = clamp(rawScore + peakPositionBonus - frontLoadPenalty, 0, 100);

  return {
    score,
    details: `growth=${Math.round(growthScore)}, highlights=${Math.round(highlightScore)}, introRate=${Math.round(avgIntroScore)}, frameCount=${Math.round(frameCountScore)}, peak=${peakPositionBonus > 0 ? '+' : ''}${peakPositionBonus}, frontLoad=${frontLoadPenalty > 0 ? '-' : ''}${frontLoadPenalty} (${frames.length} frames)`,
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

// ── Signal-to-Noise Ratio (Tufte's Data-Ink Ratio) ──────────────────────

/**
 * Measures what proportion of entities carry semantic weight vs decorative noise.
 * Noise = unlabeled unconnected entities, generic labels, overloaded frames.
 *
 * Based on Edward Tufte's Data-Ink Ratio: every element must justify its
 * existence by conveying information.
 */
export function scoreSignalToNoise(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 100, details: 'No frames' };

  let totalNoise = 0;
  let totalEntities = 0;
  let overloadedFrames = 0;

  for (const frame of frames) {
    const content = getContentEntities(frame.entities);
    const connections = frame.entities.filter(e => CONNECTION_TYPES.has(e.type));
    totalEntities += content.length;

    // Build connected entity IDs
    const connectedIds = new Set<string>();
    for (const conn of connections) {
      if (conn.sourceEntityId) connectedIds.add(conn.sourceEntityId);
      if (conn.targetEntityId) connectedIds.add(conn.targetEntityId);
    }

    for (const entity of content) {
      // Noise: no label AND not connected to anything
      if (!entity.label && !connectedIds.has(entity.id)) {
        totalNoise++;
        continue;
      }
      // Noise: generic/uninformative label
      if (entity.label && GENERIC_LABEL_PATTERNS.some(p => p.test(entity.label!))) {
        totalNoise += 0.5; // partial noise — at least it exists
      }
    }

    // Overloaded frames (>10 content entities = cognitive overload)
    if (content.length > 10) overloadedFrames++;
  }

  if (totalEntities === 0) return { score: 100, details: 'No content entities' };

  const noiseRatio = totalNoise / totalEntities;
  const overloadPenalty = overloadedFrames * 15;

  const score = clamp(100 - noiseRatio * 80 - overloadPenalty, 0, 100);

  return {
    score: Math.round(score),
    details: `${totalNoise.toFixed(1)}/${totalEntities} noise entities, ${overloadedFrames} overloaded frames`,
  };
}

// ── Visual Hierarchy (Gestalt Principles) ────────────────────────────────

/**
 * Verifies the most important entity per frame (highlighted) is visually
 * prominent — centrally positioned, with emphasis metadata, and singular focus.
 *
 * Based on Gestalt psychology: proximity, similarity, figure-ground separation.
 */
export function scoreVisualHierarchy(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 100, details: 'No frames' };

  const frameScores: number[] = [];
  let framesWithGoodFocus = 0;

  for (const frame of frames) {
    const content = getContentEntities(frame.entities);
    if (content.length === 0) { frameScores.push(50); continue; }

    const highlighted = content.filter(e => e.highlight === true);
    let score = 50; // baseline

    if (highlighted.length === 1) {
      // Perfect: exactly 1 highlight
      score = 70;
      const h = highlighted[0];
      const pos = getPosition(h);

      // Bonus: highlighted entity near center (within 30% of center)
      const distFromCenter = distance(pos, { x: 50, y: 50 });
      if (distFromCenter < 30) score += 15;

      // Bonus: highlighted entity has emphasis metadata
      const emphasis = (h.metadata as Record<string, unknown>)?.emphasis;
      if (emphasis === 'high' || emphasis === 'critical') score += 15;

      framesWithGoodFocus++;
    } else if (highlighted.length === 0) {
      // No highlight — acceptable for establishing frames but not ideal
      score = 40;
    } else {
      // Multiple highlights — competing focus (bad)
      score = 30;
    }

    frameScores.push(clamp(score, 0, 100));
  }

  const avg = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;

  return {
    score: Math.round(clamp(avg, 0, 100)),
    details: `${framesWithGoodFocus}/${frames.length} frames with clear visual focus`,
  };
}

// ── Modality Alignment (Paivio's Dual Coding Theory) ────────────────────

/**
 * Checks that narration adds context beyond what entity labels show.
 * Narration that just reads labels aloud is a Redundancy Principle violation.
 *
 * Based on Allan Paivio's Dual Coding Theory and Richard Mayer's
 * Redundancy Principle.
 */
export function scoreModalityAlignment(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 100, details: 'No frames' };

  const frameScores: number[] = [];
  let totalOverlap = 0;
  let totalNarrationWords = 0;

  for (const frame of frames) {
    const narration = frame.narrationSegment ?? '';
    if (!narration.trim()) { frameScores.push(30); continue; } // no narration = bad

    // Collect all label words
    const labelWords = new Set<string>();
    for (const e of frame.entities) {
      if (e.label) {
        for (const w of e.label.toLowerCase().split(/\s+/)) {
          if (w.length > 2) labelWords.add(w); // skip tiny words
        }
      }
    }

    // Count narration words that are just label text
    const narrationWords = narration.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    totalNarrationWords += narrationWords.length;
    let overlap = 0;
    for (const w of narrationWords) {
      if (labelWords.has(w)) overlap++;
    }
    totalOverlap += overlap;

    const overlapRatio = narrationWords.length > 0 ? overlap / narrationWords.length : 0;

    // Score: low overlap = narration adds context (good)
    // High overlap = narration just reads labels (bad)
    let score: number;
    if (overlapRatio < 0.3) score = 100;      // narration adds lots of new context
    else if (overlapRatio < 0.5) score = 80;  // decent amount of new info
    else if (overlapRatio < 0.7) score = 60;  // borderline — too much label parroting
    else score = 35;                           // mostly reading labels aloud

    // Bonus: narration is substantive (>15 words)
    if (narrationWords.length > 15) score = Math.min(100, score + 10);

    frameScores.push(clamp(score, 0, 100));
  }

  const avg = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;
  const overallOverlap = totalNarrationWords > 0
    ? ((totalOverlap / totalNarrationWords) * 100).toFixed(0)
    : '0';

  return {
    score: Math.round(clamp(avg, 0, 100)),
    details: `${overallOverlap}% narration-label overlap (lower = better, narration adds context)`,
  };
}

// ── Cross-Frame Systematization (Design Consistency) ────────────────────

/**
 * Verifies visual consistency across frames:
 * - Same entity type uses same color category
 * - Heading usage is consistent
 * - Connection types are consistent
 *
 * Based on the Principle of Least Astonishment from software engineering.
 */
export function scoreSystematization(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length <= 1) return { score: 100, details: 'Single frame — consistency N/A' };

  let score = 100;
  const issues: string[] = [];

  // Check heading consistency: either all frames have H1 or none do
  const framesWithH1 = frames.filter(f =>
    f.entities.some(e => e.type === 'H1'),
  ).length;
  if (framesWithH1 > 0 && framesWithH1 < frames.length) {
    const inconsistentPct = Math.abs(framesWithH1 - frames.length) / frames.length;
    score -= inconsistentPct * 20;
    issues.push(`H1 in ${framesWithH1}/${frames.length} frames`);
  }

  // Check connection type consistency: don't randomly mix Arrow and DataFlow
  // for the same relationship across frames
  const connectionTypesPerFrame = frames.map(f => {
    const types = new Set(f.entities.filter(e => CONNECTION_TYPES.has(e.type)).map(e => e.type));
    return types;
  });
  const allConnTypes = new Set<string>();
  for (const set of connectionTypesPerFrame) {
    for (const t of set) allConnTypes.add(t);
  }
  // More than 3 different connection types across frames = inconsistent
  if (allConnTypes.size > 3) {
    score -= 15;
    issues.push(`${allConnTypes.size} connection types used`);
  }

  // Check entity color override consistency: if entity has custom color in one frame,
  // same ID should have same color in other frames
  const entityColors = new Map<string, Set<string>>();
  for (const frame of frames) {
    for (const e of frame.entities) {
      if (e.color) {
        if (!entityColors.has(e.id)) entityColors.set(e.id, new Set());
        entityColors.get(e.id)!.add(e.color);
      }
    }
  }
  let colorInconsistencies = 0;
  for (const [id, colors] of entityColors) {
    if (colors.size > 1) colorInconsistencies++;
  }
  if (colorInconsistencies > 0) {
    score -= colorInconsistencies * 10;
    issues.push(`${colorInconsistencies} entities with inconsistent colors`);
  }

  return {
    score: Math.round(clamp(score, 0, 100)),
    details: issues.length > 0 ? issues.join(', ') : 'Consistent visual system across frames',
  };
}

// ── Tier Alignment ───────────────────────────────────────────────────────

/**
 * Tier Alignment: measures how well entities in the same conceptual tier
 * share the exact same Y coordinate.
 *
 * Based on Gestalt alignment principle: aligned elements are perceived as
 * belonging together. Even 2% misalignment breaks the perception.
 *
 * Groups entities by proximity on Y axis, then measures Y variance within each tier.
 */
export function scoreTierAlignment(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 100, details: 'No frames' };

  const frameScores: number[] = [];
  let totalTiers = 0;
  let perfectTiers = 0;

  for (const frame of frames) {
    const content = getContentEntities(frame.entities);
    if (content.length < 2) { frameScores.push(100); continue; }

    // Group into tiers: entities within 8 units of same Y
    const sorted = [...content].sort((a, b) => getPosition(a).y - getPosition(b).y);
    const tiers: number[][] = [];
    let currentTier: number[] = [getPosition(sorted[0]).y];

    for (let i = 1; i < sorted.length; i++) {
      const prevY = getPosition(sorted[i - 1]).y;
      const currY = getPosition(sorted[i]).y;
      if (currY - prevY <= 8) {
        currentTier.push(currY);
      } else {
        tiers.push(currentTier);
        currentTier = [currY];
      }
    }
    tiers.push(currentTier);

    // Score each tier: perfectly aligned = 100, variance > 0 = penalty
    let tierScoreSum = 0;
    let tiersWithMultiple = 0;
    for (const tier of tiers) {
      if (tier.length < 2) continue;
      tiersWithMultiple++;
      totalTiers++;

      const yStdDev = stdDev(tier);
      if (yStdDev < 0.5) {
        tierScoreSum += 100; // perfect alignment
        perfectTiers++;
      } else if (yStdDev < 2) {
        tierScoreSum += 80; // minor misalignment
      } else if (yStdDev < 5) {
        tierScoreSum += 50; // noticeable misalignment
      } else {
        tierScoreSum += 20; // severe — arrows will look crooked
      }
    }

    const score = tiersWithMultiple > 0 ? tierScoreSum / tiersWithMultiple : 100;
    frameScores.push(score);
  }

  const avg = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;

  return {
    score: Math.round(clamp(avg, 0, 100)),
    details: `${perfectTiers}/${totalTiers} tiers perfectly aligned (Y variance < 0.5)`,
  };
}

// ── Color Budget ─────────────────────────────────────────────────────────

/**
 * Color Budget: measures color restraint per frame.
 * Great diagrams use 2-3 semantic color categories per frame.
 * Too many colors = visual noise, no color carries meaning.
 *
 * Scoring:
 *   1-3 categories = 100 (ideal — focused, each color carries weight)
 *   4 categories = 80 (acceptable — still readable)
 *   5 categories = 60 (busy — consider reducing)
 *   6+ categories = 40 (visual noise — too many colors)
 */

/** Simple entity type → color category mapping (inline, no external dependency) */
const COLOR_CATEGORIES: Record<string, string> = {
  // Compute (green)
  Server: 'compute', Service: 'compute', Lambda: 'compute', Pipeline: 'compute',
  CPU: 'compute', Process: 'compute', Build: 'compute', CodeBlock: 'compute',
  APIEndpoint: 'compute', PullRequest: 'compute',
  // Data (blue)
  Database: 'data', Cache: 'data', Volume: 'data', HashTable: 'data',
  Schema: 'data', StorageBucket: 'data', Dashboard: 'data',
  // Structure (violet)
  Container: 'structure', Pod: 'structure', Network: 'structure',
  Module: 'structure', GitBranch: 'structure', BinaryTree: 'structure',
  // Human (gold)
  User: 'human', Concept: 'human', Decision: 'human', Metric: 'human',
  // State (red)
  Firewall: 'state', Alert: 'state', ErrorState: 'state', Secret: 'state',
  // Environment (teal)
  Cloud: 'environment', Monitor: 'environment', Timeline: 'environment',
  Stream: 'environment', WebSocket: 'environment',
  // Annotation (orange)
  Label: 'annotation', Callout: 'annotation', Notification: 'annotation',
};

function getEntityColorCategory(type: string): string {
  return COLOR_CATEGORIES[type] ?? 'generic';
}

export function scoreColorBudget(frames: IllustrationFrame[]): DimensionScore {
  if (frames.length === 0) return { score: 100, details: 'No frames' };

  const frameScores: number[] = [];
  let totalCategories = 0;

  for (const frame of frames) {
    const contentEntities = getContentEntities(frame.entities);
    if (contentEntities.length === 0) {
      frameScores.push(100);
      continue;
    }

    // Count unique color categories in this frame
    const categories = new Set(contentEntities.map(e => getEntityColorCategory(e.type)));
    const count = categories.size;
    totalCategories += count;

    // Score based on category count
    let score: number;
    if (count <= 3) score = 100;       // ideal
    else if (count === 4) score = 80;  // acceptable
    else if (count === 5) score = 60;  // busy
    else score = 40;                   // visual noise

    frameScores.push(score);
  }

  const avg = frameScores.reduce((s, v) => s + v, 0) / frameScores.length;
  const avgCategories = (totalCategories / frames.length).toFixed(1);

  return {
    score: Math.round(clamp(avg, 0, 100)),
    details: `Avg ${avgCategories} color categories per frame (ideal: 2-3)`,
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
    colorBudget: scoreColorBudget(frames),
    signalToNoise: scoreSignalToNoise(frames),
    visualHierarchy: scoreVisualHierarchy(frames),
    modalityAlignment: scoreModalityAlignment(frames),
    systematization: scoreSystematization(frames),
    tierAlignment: scoreTierAlignment(frames),
  };

  // Weighted average
  const weightedAvg =
    dimensions.entityDensity.score * WEIGHTS.entityDensity +
    dimensions.layoutQuality.score * WEIGHTS.layoutQuality +
    dimensions.visualBalance.score * WEIGHTS.visualBalance +
    dimensions.entityPersistence.score * WEIGHTS.entityPersistence +
    dimensions.narrationCoverage.score * WEIGHTS.narrationCoverage +
    dimensions.formatCompliance.score * WEIGHTS.formatCompliance +
    dimensions.narrationQuality.score * WEIGHTS.narrationQuality +
    dimensions.narrativeArc.score * WEIGHTS.narrativeArc +
    dimensions.connectionCompleteness.score * WEIGHTS.connectionCompleteness +
    dimensions.colorBudget.score * WEIGHTS.colorBudget +
    dimensions.signalToNoise.score * WEIGHTS.signalToNoise +
    dimensions.visualHierarchy.score * WEIGHTS.visualHierarchy +
    dimensions.modalityAlignment.score * WEIGHTS.modalityAlignment +
    dimensions.systematization.score * WEIGHTS.systematization +
    dimensions.tierAlignment.score * WEIGHTS.tierAlignment;

  // Multiplicative bottleneck (Goldratt's Theory of Constraints)
  // The weakest dimension constrains the overall score.
  // Formula: overall = avg × (bottleneck/100)^0.3
  const allScores = Object.values(dimensions).map(d => d.score);
  const bottleneckScore = Math.min(...allScores);
  const bottleneckDimension = Object.entries(dimensions)
    .reduce((min, [k, v]) => v.score < min.score ? { name: k, score: v.score } : min,
      { name: '', score: 101 });
  const bottleneckMultiplier = Math.pow(bottleneckScore / 100, 0.3);
  const overall = Math.round(weightedAvg * bottleneckMultiplier);

  const totalEntities = frames.reduce((s, f) => s + f.entities.length, 0);

  return {
    overall,
    dimensions,
    bottleneck: {
      dimension: bottleneckDimension.name,
      score: bottleneckDimension.score,
    },
    frameCount: frames.length,
    totalEntities,
    timestamp: new Date().toISOString(),
  };
}
