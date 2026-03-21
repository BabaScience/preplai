/**
 * @preplai/illustrations — StepList Component
 * Numbered steps + connecting lines
 *
 * Layout in design units; uniform scale transform so size changes scale the whole illustration.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/* ── Design-space constants (before scale) ─────────────────────── */
const NUM_R = 14;              // circle radius for step number
const LEFT_X = -80;            // circle center X
const TEXT_LEFT = LEFT_X + NUM_R + 16;  // text start X
const STEP_GAP = 12;           // min gap between rows
const STEP_FONT = 8;           // step description font size (design units)
const NUM_FONT = 7;            // number inside circle
const TITLE_FONT = 10;         // title above list
const LINE_H = STEP_FONT * 1.45; // line height for wrapped text
const MAX_CHARS = 26;          // max chars per line before wrap

/** Wrap text into lines that fit within a max character width. */
function wrapText(text: string, maxChars: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  // Cap at 3 lines
  if (lines.length > 3) {
    lines.length = 3;
    lines[2] = lines[2].slice(0, maxChars - 1) + '\u2026';
  }
  return lines;
}

export function renderStepList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('StepList');

  const meta = entity.metadata ?? {};
  const steps = (meta.steps as string[]) ??
    (entity.textContent ? entity.textContent.split('\n') : ['Step 1', 'Step 2', 'Step 3']);
  const visibleSteps = steps.slice(0, 5);
  const currentStep = typeof meta.currentStep === 'number' ? meta.currentStep : -1;
  const checkmarks = meta.checkmarks === true;

  const scale = s / 50;
  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  // Pre-compute wrapped lines for each step to determine row heights
  const stepData = visibleSteps.map((step) => {
    const lines = wrapText(step, MAX_CHARS);
    const textBlockH = lines.length * LINE_H;
    const rowH = Math.max(NUM_R * 2 + 4, textBlockH + 6);
    return { lines, rowH };
  });

  // Compute Y positions (centered vertically)
  const totalH = stepData.reduce((sum, d, i) =>
    sum + d.rowH + (i < stepData.length - 1 ? STEP_GAP : 0), 0);
  const stepYs: number[] = [];
  let cumY = -totalH / 2 + stepData[0].rowH / 2;
  for (let i = 0; i < stepData.length; i++) {
    stepYs.push(cumY);
    if (i < stepData.length - 1) {
      cumY += stepData[i].rowH / 2 + STEP_GAP + stepData[i + 1].rowH / 2;
    }
  }

  visibleSteps.forEach((_step, i) => {
    const y = stepYs[i];
    const { lines } = stepData[i];
    const isCompleted = checkmarks && currentStep >= 0 && i < currentStep;
    const isCurrent = currentStep >= 0 && i === currentStep;
    const isFuture = currentStep >= 0 && i > currentStep;

    // ── Connecting line to previous step ──
    if (i > 0) {
      const prevY = stepYs[i - 1];
      const conn = document.createElementNS(SVG_NS, 'line');
      conn.setAttribute('x1', String(LEFT_X));
      conn.setAttribute('y1', String(prevY + NUM_R + 2));
      conn.setAttribute('x2', String(LEFT_X));
      conn.setAttribute('y2', String(y - NUM_R - 2));
      conn.setAttribute('stroke', color);
      conn.setAttribute('stroke-width', String(STROKE.thin));
      conn.setAttribute('opacity', isCompleted || isCurrent ? '0.6' : '0.25');
      if (isFuture) {
        conn.setAttribute('stroke-dasharray', '4 4');
      }
      scaleGroup.appendChild(conn);
    }

    // ── Circle ──
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(LEFT_X));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(NUM_R));

    if (isCompleted) {
      circle.setAttribute('fill', color);
      circle.setAttribute('opacity', '0.85');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(STROKE.thin));
    } else if (isCurrent) {
      circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(getStrokeWidth('selected', 1)));
    } else {
      circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(STROKE.thin));
      if (isFuture) {
        circle.setAttribute('opacity', '0.5');
      }
    }
    scaleGroup.appendChild(circle);

    // ── Number or checkmark inside circle ──
    if (isCompleted) {
      const check = document.createElementNS(SVG_NS, 'path');
      check.setAttribute('d', `M ${LEFT_X - 5} ${y} L ${LEFT_X - 1.5} ${y + 4} L ${LEFT_X + 6} ${y - 4}`);
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', '#ffffff');
      check.setAttribute('stroke-width', String(STROKE.emphasized));
      check.setAttribute('stroke-linecap', 'round');
      check.setAttribute('stroke-linejoin', 'round');
      scaleGroup.appendChild(check);
    } else {
      const num = document.createElementNS(SVG_NS, 'text');
      num.setAttribute('x', String(LEFT_X));
      num.setAttribute('y', String(y + NUM_FONT * 0.35));
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('fill', color);
      num.setAttribute('font-size', String(NUM_FONT));
      num.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      num.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      if (isFuture) {
        num.setAttribute('opacity', '0.5');
      }
      num.textContent = String(i + 1);
      scaleGroup.appendChild(num);
    }

    // ── Step text ──
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(TEXT_LEFT));
    text.setAttribute('y', String(y));  // always set y baseline
    text.setAttribute('text-anchor', 'start');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(STEP_FONT));
    text.setAttribute('font-weight', String(isCurrent ? TYPOGRAPHY.fontWeightEmphasis : TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    if (isFuture) {
      text.setAttribute('opacity', '0.5');
    }

    if (lines.length === 1) {
      // Single line: vertically center on the circle
      text.setAttribute('dominant-baseline', 'central');
      text.textContent = lines[0];
    } else {
      // Multi-line: use tspans, center block vertically around y
      const firstLineY = y - ((lines.length - 1) * LINE_H) / 2;
      lines.forEach((line, li) => {
        const tspan = document.createElementNS(SVG_NS, 'tspan');
        tspan.setAttribute('x', String(TEXT_LEFT));
        tspan.setAttribute('y', String(firstLineY + li * LINE_H));
        tspan.textContent = line;
        text.appendChild(tspan);
      });
    }
    scaleGroup.appendChild(text);
  });

  // ── Title above ──
  if (entity.label) {
    const topY = stepYs[0];
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', String(TEXT_LEFT));
    title.setAttribute('y', String(topY - NUM_R - 16));
    title.setAttribute('text-anchor', 'start');
    title.setAttribute('fill', color);
    title.setAttribute('font-size', String(TITLE_FONT));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    scaleGroup.appendChild(title);
  }

  innerG.appendChild(scaleGroup);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
