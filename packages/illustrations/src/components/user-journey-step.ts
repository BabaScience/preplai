/**
 * @preplai/illustrations — UserJourneyStep Component
 * Horizontal journey track with sentiment-face markers at each step.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, COLORS } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface JourneyStep {
  step: string;
  sentiment: number; // 1-5
}

interface JourneyMetadata {
  steps?: JourneyStep[];
}

/** Get face color based on sentiment (1-5). */
function getSentimentColor(sentiment: number): string {
  if (sentiment <= 2) return COLORS.red;
  if (sentiment === 3) return COLORS.orange;
  return COLORS.green;
}

/** Draw a tiny sentiment face inside a circle at (cx, cy) with radius r. */
function drawSentimentFace(
  parent: SVGGElement,
  cx: number,
  cy: number,
  r: number,
  sentiment: number,
  faceColor: string,
): void {
  // Eyes
  const eyeR = r * 0.12;
  const eyeY = cy - r * 0.15;
  const eyeSpacing = r * 0.3;

  for (const sign of [-1, 1]) {
    const eye = document.createElementNS(SVG_NS, 'circle');
    eye.setAttribute('cx', String(cx + sign * eyeSpacing));
    eye.setAttribute('cy', String(eyeY));
    eye.setAttribute('r', String(eyeR));
    eye.setAttribute('fill', faceColor);
    eye.setAttribute('opacity', '0.9');
    parent.appendChild(eye);
  }

  // Mouth arc
  const mouthY = cy + r * 0.2;
  const mouthW = r * 0.35;
  let mouthD: string;

  if (sentiment <= 2) {
    // Sad face: arc curving up (frown)
    const arcH = r * 0.2;
    mouthD = `M ${cx - mouthW} ${mouthY + arcH} Q ${cx} ${mouthY - arcH} ${cx + mouthW} ${mouthY + arcH}`;
  } else if (sentiment === 3) {
    // Neutral face: straight line
    mouthD = `M ${cx - mouthW} ${mouthY} L ${cx + mouthW} ${mouthY}`;
  } else {
    // Happy face: arc curving down (smile)
    const arcH = r * 0.2;
    mouthD = `M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY + arcH} ${cx + mouthW} ${mouthY}`;
  }

  const mouth = document.createElementNS(SVG_NS, 'path');
  mouth.setAttribute('d', mouthD);
  mouth.setAttribute('fill', 'none');
  mouth.setAttribute('stroke', faceColor);
  mouth.setAttribute('stroke-width', String(STROKE.thin));
  mouth.setAttribute('stroke-linecap', 'round');
  parent.appendChild(mouth);
}

export function renderUserJourneyStep(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('UserJourneyStep');

  const meta = (entity.metadata ?? {}) as JourneyMetadata;
  const steps = (meta.steps ?? []).slice(0, 7);
  const stepCount = steps.length;
  if (stepCount === 0) {
    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  }

  const trackW = size * 2.8;
  const trackH = size * 0.08;
  const markerR = size * 0.16;
  const halfW = trackW / 2;

  // ── Horizontal track ──
  const track = document.createElementNS(SVG_NS, 'rect');
  track.setAttribute('x', String(-halfW));
  track.setAttribute('y', String(-trackH / 2));
  track.setAttribute('width', String(trackW));
  track.setAttribute('height', String(trackH));
  track.setAttribute('rx', String(trackH / 2));
  track.setAttribute('ry', String(trackH / 2));
  track.setAttribute('fill', `${color}${OPACITY.fillMedium}`);
  innerG.appendChild(track);

  // ── Step markers along the track ──
  for (let i = 0; i < stepCount; i++) {
    const t = stepCount === 1 ? 0.5 : i / (stepCount - 1);
    const mx = -halfW + t * trackW;
    const my = 0;
    const step = steps[i];
    const sentimentColor = getSentimentColor(step.sentiment);

    // Connecting line segment on the track (colored by sentiment)
    if (i < stepCount - 1) {
      const nextT = (i + 1) / (stepCount - 1);
      const nextX = -halfW + nextT * trackW;
      const seg = document.createElementNS(SVG_NS, 'line');
      seg.setAttribute('x1', String(mx));
      seg.setAttribute('y1', '0');
      seg.setAttribute('x2', String(nextX));
      seg.setAttribute('y2', '0');
      seg.setAttribute('stroke', color);
      seg.setAttribute('stroke-width', String(STROKE.thin));
      seg.setAttribute('opacity', '0.4');
      innerG.appendChild(seg);
    }

    // Marker circle
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(mx));
    circle.setAttribute('cy', String(my));
    circle.setAttribute('r', String(markerR));
    circle.setAttribute('fill', `${sentimentColor}${OPACITY.fillMedium}`);
    circle.setAttribute('stroke', sentimentColor);
    circle.setAttribute('stroke-width', String(STROKE.default));
    innerG.appendChild(circle);

    // Sentiment face inside marker
    drawSentimentFace(innerG, mx, my, markerR, step.sentiment, sentimentColor);

    // Step label below marker
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(mx));
    label.setAttribute('y', String(my + markerR + 14));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.setAttribute('opacity', '0.8');
    label.textContent = step.step.length > 12
      ? step.step.slice(0, 11) + '\u2026'
      : step.step;
    innerG.appendChild(label);
  }

  // ── Entity label below ──
  if (entity.label) {
    const labelY = markerR + 34;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
