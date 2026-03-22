/**
 * @preplai/illustrations — Universal Entity Overlays
 *
 * Applied AFTER component rendering, BEFORE entrance animation.
 * These overlays add status indicators, progress rings, emphasis scaling,
 * and badge annotations to ANY entity type universally.
 *
 * All overlays read from entity.metadata and are opt-in.
 */

import { SVG_NS, getSizeParam } from './utils.js';
import {
  STATUS_COLORS,
  EMPHASIS_SCALES,
  TYPOGRAPHY,
  STROKE,
  colorWithAlpha,
  type EntityStatus,
  type EntityEmphasis,
} from './design-tokens.js';
import { applyLottieOverlay } from './lottie-overlay.js';
import type { VisualEntity } from '@preplai/shared';

// ── Status overlay ──────────────────────────────────────────────────

/**
 * Apply a universal status indicator to an entity's innerG.
 * Renders a colored ring/dot overlay based on metadata.status.
 *
 * Status types:
 *   healthy  → green ring (subtle)
 *   warning  → amber pulsing dot (top-right)
 *   error    → red glow ring
 *   inactive → reduces opacity (handled via CSS class)
 *   loading  → animated rotating dashed ring
 */
export function applyStatusOverlay(innerG: SVGGElement, entity: VisualEntity): void {
  const status = entity.metadata?.status as EntityStatus | undefined;
  if (!status || !STATUS_COLORS[status]) return;

  const s = getSizeParam(entity);
  const color = STATUS_COLORS[status];

  switch (status) {
    case 'healthy': {
      // Subtle green ring around entity
      const ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('cx', '0');
      ring.setAttribute('cy', '0');
      ring.setAttribute('r', String(s * 0.85));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', colorWithAlpha(color, '60'));
      ring.setAttribute('stroke-width', '1.5');
      ring.setAttribute('class', 'status-healthy-ring');
      innerG.insertBefore(ring, innerG.firstChild);
      break;
    }

    case 'warning': {
      // Amber pulsing dot at top-right
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(s * 0.6));
      dot.setAttribute('cy', String(-s * 0.5));
      dot.setAttribute('r', '5');
      dot.setAttribute('fill', color);
      dot.setAttribute('class', 'status-warning-dot');
      innerG.appendChild(dot);
      break;
    }

    case 'error': {
      // Red glow ring
      const ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('cx', '0');
      ring.setAttribute('cy', '0');
      ring.setAttribute('r', String(s * 0.9));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', colorWithAlpha(color, '50'));
      ring.setAttribute('stroke-width', '2.5');
      ring.setAttribute('class', 'status-error-ring');
      innerG.insertBefore(ring, innerG.firstChild);
      break;
    }

    case 'inactive': {
      // Reduce opacity via inline style (applied to innerG)
      innerG.style.opacity = '0.5';
      innerG.style.filter = 'saturate(0.3)';
      break;
    }

    case 'loading': {
      // Animated rotating dashed ring
      const ring = document.createElementNS(SVG_NS, 'circle');
      const radius = s * 0.85;
      ring.setAttribute('cx', '0');
      ring.setAttribute('cy', '0');
      ring.setAttribute('r', String(radius));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', colorWithAlpha(color, '70'));
      ring.setAttribute('stroke-width', '2');
      ring.setAttribute('stroke-dasharray', `${radius * 0.4} ${radius * 0.3}`);
      ring.setAttribute('stroke-linecap', 'round');
      ring.setAttribute('class', 'status-loading-ring');
      innerG.insertBefore(ring, innerG.firstChild);
      break;
    }
  }
}

// ── Progress ring ───────────────────────────────────────────────────

/**
 * Render a circular progress arc around the entity.
 * metadata.progress: 0.0–1.0
 */
export function applyProgressRing(innerG: SVGGElement, entity: VisualEntity): void {
  const progress = entity.metadata?.progress as number | undefined;
  if (progress == null || progress < 0 || progress > 1) return;

  const s = getSizeParam(entity);
  const radius = s * 0.95;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  // Entity color or status color as ring color
  const statusColor = entity.metadata?.status
    ? STATUS_COLORS[entity.metadata.status as EntityStatus]
    : undefined;
  const color = statusColor ?? entity.color ?? '#4ECDC4';

  // Track (background circle)
  const track = document.createElementNS(SVG_NS, 'circle');
  track.setAttribute('cx', '0');
  track.setAttribute('cy', '0');
  track.setAttribute('r', String(radius));
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke', colorWithAlpha(color, '15'));
  track.setAttribute('stroke-width', '3');
  innerG.insertBefore(track, innerG.firstChild);

  // Progress arc
  const arc = document.createElementNS(SVG_NS, 'circle');
  arc.setAttribute('cx', '0');
  arc.setAttribute('cy', '0');
  arc.setAttribute('r', String(radius));
  arc.setAttribute('fill', 'none');
  arc.setAttribute('stroke', color);
  arc.setAttribute('stroke-width', '3');
  arc.setAttribute('stroke-linecap', 'round');
  arc.setAttribute('stroke-dasharray', String(circumference));
  arc.setAttribute('stroke-dashoffset', String(offset));
  // Rotate so arc starts from top (12 o'clock)
  arc.setAttribute('transform', 'rotate(-90)');
  arc.style.transformBox = 'fill-box';
  arc.style.transformOrigin = 'center center';
  arc.setAttribute('class', 'progress-ring-arc');
  innerG.insertBefore(arc, innerG.firstChild?.nextSibling ?? null);
}

// ── Emphasis scaling ────────────────────────────────────────────────

/**
 * Apply emphasis scaling to the entity's outerG.
 * metadata.emphasis: 'low' | 'normal' | 'high' | 'critical'
 *
 * Uses CSS classes so depth-of-field can layer on top.
 */
export function applyEmphasis(outerG: SVGGElement, innerG: SVGGElement, entity: VisualEntity): void {
  const emphasis = entity.metadata?.emphasis as EntityEmphasis | undefined;
  if (!emphasis || emphasis === 'normal' || !EMPHASIS_SCALES[emphasis]) return;

  const config = EMPHASIS_SCALES[emphasis];

  if (emphasis === 'low') {
    outerG.style.opacity = String(config.opacity);
  }

  if (emphasis === 'critical') {
    // Add a pulsing glow ring for critical emphasis
    const s = getSizeParam(entity);
    const color = entity.color ?? '#4ECDC4';
    const ring = document.createElementNS(SVG_NS, 'circle');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('r', String(s * 1.0));
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', colorWithAlpha(color, '40'));
    ring.setAttribute('stroke-width', '2');
    ring.setAttribute('class', 'emphasis-critical-ring');
    innerG.insertBefore(ring, innerG.firstChild);
  }

  // Apply scale via data attribute (CSS will pick it up)
  outerG.setAttribute('data-emphasis', emphasis);
}

// ── Badge annotation ────────────────────────────────────────────────

export interface BadgeConfig {
  text: string;
  color?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right';
}

/**
 * Render a small pill-shaped badge on the entity.
 * metadata.badge: { text: string, color?: string, position?: 'top-right' | 'top-left' | 'bottom-right' }
 */
export function applyBadge(innerG: SVGGElement, entity: VisualEntity): void {
  const badge = entity.metadata?.badge as BadgeConfig | undefined;
  if (!badge?.text) return;

  const s = getSizeParam(entity);
  const fontSize = TYPOGRAPHY.fontSizeBadge;
  const padH = 6;
  const padV = 3;
  const pillW = badge.text.length * (fontSize * 0.65) + padH * 2;
  const pillH = fontSize + padV * 2;

  // Position based on config
  const pos = badge.position ?? 'top-right';
  let bx: number, by: number;
  switch (pos) {
    case 'top-left':
      bx = -s * 0.6;
      by = -s * 0.55;
      break;
    case 'bottom-right':
      bx = s * 0.5;
      by = s * 0.45;
      break;
    case 'top-right':
    default:
      bx = s * 0.5;
      by = -s * 0.55;
      break;
  }

  const badgeColor = badge.color ?? entity.color ?? '#4ECDC4';

  // Badge background pill
  const pill = document.createElementNS(SVG_NS, 'rect');
  pill.setAttribute('x', String(bx - pillW / 2));
  pill.setAttribute('y', String(by - pillH / 2));
  pill.setAttribute('width', String(pillW));
  pill.setAttribute('height', String(pillH));
  pill.setAttribute('rx', String(pillH / 2));
  pill.setAttribute('fill', badgeColor);
  pill.setAttribute('stroke', colorWithAlpha(badgeColor, '80'));
  pill.setAttribute('stroke-width', String(STROKE.minimal));

  // Badge text
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', String(bx));
  text.setAttribute('y', String(by));
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('fill', '#ffffff');
  text.setAttribute('font-size', String(fontSize));
  text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  text.textContent = badge.text;

  innerG.appendChild(pill);
  innerG.appendChild(text);
}

// ── Master apply function ───────────────────────────────────────────

/**
 * Apply all universal overlays to an entity.
 * Call this after component rendering, before entrance animation.
 */
export function applyEntityOverlays(outerG: SVGGElement, innerG: SVGGElement, entity: VisualEntity): void {
  applyStatusOverlay(innerG, entity);
  applyProgressRing(innerG, entity);
  applyEmphasis(outerG, innerG, entity);
  applyBadge(innerG, entity);
  // Lottie animation overlay (opt-in via metadata.lottieAnimation)
  if (entity.metadata?.lottieAnimation) {
    applyLottieOverlay(innerG, entity);
  }
}
