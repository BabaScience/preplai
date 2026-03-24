/**
 * @preplai/illustrations — Declarative Bounding Box Registry
 *
 * Pre-computed bounding boxes for every entity type.
 * Used by arrow.ts for edge-to-edge connection routing
 * WITHOUT needing DOM measurement (getBBox).
 *
 * Each entry returns { width, height } in canvas pixels
 * given the entity's size param and metadata.
 *
 * Follows the same dimension formulas each component uses
 * internally, so bounds always match the rendered shape.
 */

import { getSizeParam, getEntityDimensions } from './utils.js';
import type { VisualEntity } from '@preplai/shared';

export interface EntityBounds {
  width: number;
  height: number;
}

// ── Per-type bounds calculators ─────────────────────────────────────

type BoundsCalculator = (entity: VisualEntity) => EntityBounds;

/**
 * Rectangular entities that use getEntityDimensions() utility.
 */
function rectBounds(
  widthRatio: number,
  heightRatio: number,
): BoundsCalculator {
  return (entity) => {
    const s = getSizeParam(entity);
    return { width: s * widthRatio, height: s * heightRatio };
  };
}

/**
 * Circular entities (radius-based).
 */
function circleBounds(radiusRatio: number): BoundsCalculator {
  return (entity) => {
    const s = getSizeParam(entity);
    const d = s * radiusRatio * 2;
    return { width: d, height: d };
  };
}

/**
 * Hexagonal entities (circumradius-based).
 */
function hexBounds(radiusRatio: number): BoundsCalculator {
  return (entity) => {
    const s = getSizeParam(entity);
    const d = s * radiusRatio * 2;
    return { width: d, height: d };
  };
}

/**
 * Cylinder entities (Database, Cache).
 * Width = rx * 2, Height = body + ellipse caps.
 */
function cylinderBounds(): BoundsCalculator {
  return (entity) => {
    const s = getSizeParam(entity);
    const rx = s / 2;
    const bodyH = s * 0.55;
    const ry = s / 3;
    return { width: rx * 2, height: bodyH + ry * 2 };
  };
}

// ── The registry ────────────────────────────────────────────────────

const BOUNDS_REGISTRY: Record<string, BoundsCalculator> = {
  // ── Infrastructure (rectangular)
  Server: (entity) => {
    const d = getEntityDimensions(entity);
    return { width: d.width, height: d.height };
  },
  Container: rectBounds(1.1, 0.75),
  Lambda: rectBounds(0.8, 0.65),
  Monitor: rectBounds(0.9, 0.7),
  Pod: rectBounds(0.85, 0.7),
  Firewall: rectBounds(0.5, 0.75),
  Device: rectBounds(1.05, 0.7),   // screen + base combined
  Build: rectBounds(0.85, 0.7),
  Deployment: rectBounds(0.85, 0.7),
  Process: rectBounds(0.85, 0.7),

  // ── Infrastructure (cylinder)
  Database: cylinderBounds(),
  Cache: cylinderBounds(),

  // ── Infrastructure (circular)
  User: circleBounds(0.43),
  Network: circleBounds(0.42),

  // ── Infrastructure (hexagonal)
  Service: hexBounds(0.45),
  LoadBalancer: hexBounds(0.45),

  // ── Infrastructure (elliptical)
  Cloud: (entity) => {
    const s = getSizeParam(entity);
    return { width: s * 0.84, height: s * 0.84 };
  },

  // ── Content types (cards)
  Definition: rectBounds(0.85, 0.7),
  Quote: rectBounds(0.85, 0.7),
  Callout: rectBounds(0.85, 0.7),
  Analogy: rectBounds(0.85, 0.7),
  Annotation: rectBounds(0.85, 0.7),

  // ── Content types (special)
  Concept: (entity) => {
    // Concept uses design-space coordinates scaled by s/50
    const s = getSizeParam(entity);
    const scale = s / 50;
    const designW = (entity.metadata?.width as number) ?? 80;
    const designH = 60; // approximate; varies with text
    return { width: designW * scale, height: designH * scale };
  },

  // ── Data viz
  Metric: rectBounds(1.2, 0.75),
  Badge: (entity) => {
    const s = getSizeParam(entity);
    const label = entity.label ?? '';
    const w = Math.max(label.length * 8 + 28, s);
    return { width: w, height: 24 };
  },

  // ── Pipeline / multi-segment
  Pipeline: (entity) => {
    const s = getSizeParam(entity);
    const segW = s * 0.28;
    const gap = s * 0.06;
    return { width: segW * 3 + gap * 2, height: s * 0.4 };
  },

  // ── Queue (multi-cell)
  Queue: (entity) => {
    const s = getSizeParam(entity);
    const scale = s / 50;
    return { width: 130 * scale, height: 22 * scale };
  },

  // ── Text types
  H1: (entity) => {
    const s = getSizeParam(entity);
    const scale = s / 50;
    const label = entity.label ?? '';
    return { width: label.length * 19 * scale, height: 32 * scale + 12 };
  },
  H2: (entity) => {
    const s = getSizeParam(entity);
    const scale = s / 50;
    const label = entity.label ?? '';
    return { width: label.length * 13 * scale, height: 22 * scale + 8 };
  },
  H3: (entity) => {
    const s = getSizeParam(entity);
    const scale = s / 50;
    const label = entity.label ?? '';
    return { width: label.length * 10 * scale, height: 16 * scale };
  },
  Text: (entity) => {
    const meta = entity.metadata ?? {};
    const maxWidth = (meta.maxWidth as number) ?? 800;
    const label = entity.label ?? entity.textContent ?? '';
    const fontSize = (meta.fontSize as number) ?? 22;
    const lineHeight = fontSize * 1.5;
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.55));
    const lines = Math.ceil(label.length / Math.max(10, charsPerLine));
    return { width: maxWidth, height: lines * lineHeight };
  },
  Span: (entity) => {
    const meta = entity.metadata ?? {};
    const maxWidth = (meta.maxWidth as number) ?? 250;
    const label = entity.label ?? entity.textContent ?? '';
    const fontSize = (meta.fontSize as number) ?? 15;
    const lineHeight = fontSize * 1.4;
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.55));
    const lines = Math.min(2, Math.ceil(label.length / Math.max(10, charsPerLine)));
    return { width: maxWidth, height: lines * lineHeight };
  },
  Label: (entity) => {
    // Label aliases to Concept
    const s = getSizeParam(entity);
    const scale = s / 50;
    return { width: 80 * scale, height: 60 * scale };
  },

  // ── Complex data structures
  Table: (entity) => {
    const s = getSizeParam(entity);
    const scale = s / 50;
    const meta = entity.metadata ?? {};
    const cols = ((meta.headers as string[])?.length) ?? 4;
    const rows = ((meta.rows as unknown[])?.length ?? 4) + 1; // +1 for header
    return { width: cols * 44 * scale, height: rows * 24 * scale };
  },
  StepList: (entity) => {
    const s = getSizeParam(entity);
    const scale = s / 50;
    const meta = entity.metadata ?? {};
    const steps = (meta.steps as unknown[])?.length ?? 3;
    return { width: 180 * scale, height: steps * 28 * scale };
  },

  // ── Composable (shape-dependent)
  Composable: (entity) => {
    const s = getSizeParam(entity);
    const shape = (entity.metadata?.shape as string) ?? 'rect';
    switch (shape) {
      case 'circle': return { width: s, height: s };
      case 'hexagon': return { width: s, height: s };
      case 'diamond': return { width: s, height: s };
      case 'shield': return { width: s * 0.8, height: s * 1.1 };
      case 'cylinder': return { width: s * 0.9, height: s * 1.1 };
      case 'document': return { width: s * 1.2, height: s * 1.3 };
      case 'stadium': return { width: s * 1.6, height: s * 0.8 };
      case 'pill': return { width: s, height: s * 1.6 };
      case 'parallelogram': return { width: s * 1.5, height: s * 0.9 };
      case 'pentagon': return { width: s, height: s };
      case 'octagon': return { width: s, height: s };
      case 'triangle': return { width: s * 1.1, height: s * 1.1 };
      case 'trapezoid': return { width: s * 1.4, height: s * 0.9 };
      case 'cloud': return { width: s * 1.5, height: s };
      case 'rect':
      default: return { width: s * 1.4, height: s };
    }
  },
};

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get pre-computed bounding box for any entity type.
 * Returns { width, height } in canvas pixels.
 *
 * Falls back to generous estimate if type not in registry.
 */
export function getEntityBounds(entity: VisualEntity): EntityBounds {
  const fn = BOUNDS_REGISTRY[entity.type];
  if (fn) return fn(entity);

  // Generous generic fallback for unregistered types
  const s = getSizeParam(entity);
  return { width: s * 1.6, height: s * 1.2 };
}
